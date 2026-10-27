import type { NextRequest } from "next/server";
import Groq from "groq-sdk";
import { SCHEMA_VERSION, SYSTEM_PROMPT, buildUserContent, validateReport, type CaseInput } from "@/lib/aiReview";
import { runImageProvenance } from "@/lib/imageProvenance";

const MODEL = process.env.AI_MODEL ?? "openai/gpt-oss-120b";

function extractJson(s: string): string {
  const start = s.indexOf("{");
  const end = s.lastIndexOf("}");
  return start >= 0 && end > start ? s.slice(start, end + 1) : s;
}

export async function POST(req: NextRequest, ctx: RouteContext<"/api/escrows/[id]/ai-review">) {
  const { id } = await ctx.params;

  // --- Authorization (stub) ---
  // Production: verify the caller is an authorised participant or the assigned arbiter
  // for this case before loading any case data. AI output is advisory only and can
  // never move funds — the financial release/refund path is separate and server-authoritative.

  let body: Record<string, unknown>;
  try {
    body = (await req.json()) as Record<string, unknown>;
  } catch {
    return Response.json({ status: "error", reason: "Invalid JSON body." }, { status: 400 });
  }

  const evidenceIn = Array.isArray(body.evidence) ? (body.evidence as unknown[]) : [];
  const caseInput: CaseInput = {
    orderId: id,
    type: body.type === "digital" ? "digital" : "physical",
    amountZec: Number(body.amountZec) || 0,
    terms: Array.isArray(body.terms) ? (body.terms as unknown[]).slice(0, 20).map(String) : [],
    buyerClaim: typeof body.buyerClaim === "string" ? body.buyerClaim.slice(0, 1200) : undefined,
    merchantClaim: typeof body.merchantClaim === "string" ? body.merchantClaim.slice(0, 1200) : undefined,
    evidence: evidenceIn.slice(0, 20).map((e, i) => {
      const o = (e ?? {}) as Record<string, unknown>;
      return {
        evidence_id: String(o.evidence_id ?? `ev${i + 1}`),
        party: String(o.party ?? ""),
        description: String(o.description ?? "").slice(0, 1200),
      };
    }),
  };

  // Dispute-time image-provenance check (consented + provider-gated).
  const provenance = await runImageProvenance({ consent: Boolean(body.consentImageProvenance), images: [] });

  const apiKey = process.env.GROQ_API_KEY || process.env.AI_PROVIDER_API_KEY;
  if (!apiKey) {
    // Honest unavailable state — never fabricate a review.
    return Response.json({
      status: "unavailable",
      reason: "AI provider is not configured. Set GROQ_API_KEY to enable live review.",
      schema_version: SCHEMA_VERSION,
      provenance,
    });
  }

  try {
    const client = new Groq({ apiKey, timeout: 30_000, maxRetries: 1 });
    const resp = await client.chat.completions.create({
      model: MODEL,
      max_tokens: 2000,
      temperature: 0.2,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: buildUserContent(caseInput) },
      ],
    });

    const text = (resp.choices[0]?.message?.content ?? "").trim();

    let parsed: unknown;
    try {
      parsed = JSON.parse(extractJson(text));
    } catch {
      return Response.json({ status: "error", reason: "Model output was not valid JSON." }, { status: 502 });
    }

    const v = validateReport(parsed, caseInput.evidence.map((e) => e.evidence_id));
    if (!v.ok) {
      return Response.json({ status: "error", reason: `Model output failed validation: ${v.error}` }, { status: 502 });
    }

    return Response.json({
      status: "completed",
      schema_version: SCHEMA_VERSION,
      model: MODEL,
      generated_at: new Date().toISOString(),
      report: v.report,
      provenance,
    });
  } catch {
    // Honest failure — manual review stays available.
    return Response.json({ status: "error", reason: "The AI provider call failed or timed out." }, { status: 502 });
  }
}
