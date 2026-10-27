import type { NextRequest } from "next/server";
import Groq from "groq-sdk";
import {
  LISTING_SCHEMA_VERSION,
  LISTING_SYSTEM_PROMPT,
  buildListingContent,
  validateListingVerdict,
  type ListingDraft,
} from "@/lib/listingCheck";

const MODEL = process.env.AI_MODEL ?? "openai/gpt-oss-120b";

function extractJson(s: string): string {
  const start = s.indexOf("{");
  const end = s.lastIndexOf("}");
  return start >= 0 && end > start ? s.slice(start, end + 1) : s;
}

export async function POST(req: NextRequest) {
  let body: Record<string, unknown>;
  try {
    body = (await req.json()) as Record<string, unknown>;
  } catch {
    return Response.json({ status: "error", reason: "Invalid JSON body." }, { status: 400 });
  }

  const draft: ListingDraft = {
    type: body.type === "digital" ? "digital" : "physical",
    item: String(body.item ?? "").slice(0, 200),
    amount: String(body.amount ?? "").slice(0, 40),
    description: String(body.description ?? "").slice(0, 2000),
    imageCount: Number(body.imageCount) || 0,
    shipping: typeof body.shipping === "string" ? body.shipping.slice(0, 600) : undefined,
    proof: typeof body.proof === "string" ? body.proof.slice(0, 200) : undefined,
    release: typeof body.release === "string" ? body.release.slice(0, 600) : undefined,
    disputeWindowDays: typeof body.disputeWindowDays === "string" ? body.disputeWindowDays.slice(0, 8) : undefined,
  };

  const apiKey = process.env.GROQ_API_KEY || process.env.AI_PROVIDER_API_KEY;
  if (!apiKey) {
    return Response.json({
      status: "unavailable",
      reason: "AI provider is not configured. Set GROQ_API_KEY to enable the live listing check.",
      schema_version: LISTING_SCHEMA_VERSION,
    });
  }

  try {
    const client = new Groq({ apiKey, timeout: 20_000, maxRetries: 1 });
    const resp = await client.chat.completions.create({
      model: MODEL,
      max_tokens: 900,
      temperature: 0.2,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: LISTING_SYSTEM_PROMPT },
        { role: "user", content: buildListingContent(draft) },
      ],
    });

    const text = (resp.choices[0]?.message?.content ?? "").trim();
    let parsed: unknown;
    try {
      parsed = JSON.parse(extractJson(text));
    } catch {
      return Response.json({ status: "error", reason: "Model output was not valid JSON." }, { status: 502 });
    }

    const v = validateListingVerdict(parsed);
    if (!v.ok) return Response.json({ status: "error", reason: `Validation failed: ${v.error}` }, { status: 502 });

    return Response.json({
      status: "completed",
      schema_version: LISTING_SCHEMA_VERSION,
      model: MODEL,
      verdict: v.verdict,
    });
  } catch {
    return Response.json({ status: "error", reason: "The AI provider call failed or timed out." }, { status: 502 });
  }
}
