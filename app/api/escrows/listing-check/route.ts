import type { NextRequest } from "next/server";
import OpenAI from "openai";
import sharp from "sharp";
import { getAllowedOrigin, readWalletSession } from "@/lib/walletAuth";
import { cacheImageReview, getCachedImageReview } from "@/lib/listingReviewCache";
import {
  CODE_RELEASE_TERMS, LISTING_SCHEMA_VERSION, LISTING_SYSTEM_PROMPT, PLATFORM_DISPUTE_WINDOW_DAYS, buildListingContent, validZecAmount,
  validateListingVerdict, type ListingDraft, type ListingStage,
} from "@/lib/listingCheck";

const MODEL = process.env.AI_MODEL ?? "gemini-3.5-flash-lite";
const GEMINI_BASE_URL = "https://generativelanguage.googleapis.com/v1beta/openai/";
const MAX_IMAGE_CHARS = 300_000;
function extractJson(s: string): string {
  const start = s.indexOf("{"); const end = s.lastIndexOf("}");
  return start >= 0 && end > start ? s.slice(start, end + 1) : s;
}

async function makePhotoContactSheet(images: ListingDraft["images"]) {
  if (images.length <= 1) return images[0]?.dataUrl;

  const tileWidth = 600;
  const tileHeight = 410;
  const labelHeight = 36;
  const gap = 16;
  const padding = 16;
  const columns = 2;
  const rows = Math.ceil(images.length / columns);
  const sheetWidth = padding * 2 + columns * tileWidth + gap;
  const sheetHeight = padding * 2 + rows * (labelHeight + tileHeight) + (rows - 1) * gap;
  const layers: { input: Buffer; left: number; top: number }[] = [];

  for (let index = 0; index < images.length; index++) {
    const match = /^data:image\/(?:jpeg|png|webp);base64,([A-Za-z0-9+/]+=*)$/.exec(images[index].dataUrl);
    if (!match) throw new Error("Invalid product photo data.");
    const left = padding + (index % columns) * (tileWidth + gap);
    const top = padding + Math.floor(index / columns) * (labelHeight + tileHeight + gap);
    const resized = await sharp(Buffer.from(match[1], "base64"))
      .rotate()
      .resize(tileWidth, tileHeight, { fit: "contain", background: "#f4f4f5", withoutEnlargement: true })
      .jpeg({ quality: 76 })
      .toBuffer();
    const label = Buffer.from(`<svg width="${tileWidth}" height="${labelHeight}"><rect width="100%" height="100%" rx="10" fill="#fdf4e1"/><text x="14" y="24" font-family="Arial,sans-serif" font-size="14" font-weight="700" fill="#7a5406">PHOTO ${index + 1}</text></svg>`);
    layers.push({ input: label, left, top }, { input: resized, left, top: top + labelHeight });
  }

  const sheet = await sharp({
    create: { width: sheetWidth, height: sheetHeight, channels: 3, background: "#ffffff" },
  }).composite(layers).jpeg({ quality: 78 }).toBuffer();
  return `data:image/jpeg;base64,${sheet.toString("base64")}`;
}

export async function POST(req: NextRequest) {
  if (!getAllowedOrigin(req)) return Response.json({ status: "error", reason: "Request origin is not allowed." }, { status: 403 });
  if (!readWalletSession(req)) return Response.json({ status: "error", reason: "Sign in with your Zcash testnet wallet to run a listing review." }, { status: 401 });
  const length = Number(req.headers.get("content-length") ?? 0);
  if (length > 7_000_000) return Response.json({ status: "error", reason: "The photos are too large. Try smaller images." }, { status: 413 });
  let body: Record<string, unknown>;
  try { body = await req.json() as Record<string, unknown>; }
  catch { return Response.json({ status: "error", reason: "Invalid JSON body." }, { status: 400 }); }

  if (body.type !== "physical" && body.type !== "digital") return Response.json({ status: "error", reason: "Choose a valid listing type." }, { status: 400 });
  if (body.stage !== "item" && body.stage !== "terms") return Response.json({ status: "error", reason: "Choose a valid review stage." }, { status: 400 });

  const rawImages = Array.isArray(body.images) ? body.images : [];
  if (rawImages.length > 3) return Response.json({ status: "error", reason: "Attach no more than three photos." }, { status: 400 });
  const images: ListingDraft["images"] = [];
  for (const raw of rawImages) {
    if (!raw || typeof raw !== "object") return Response.json({ status: "error", reason: "Invalid photo data." }, { status: 400 });
    const image = raw as Record<string, unknown>;
    if (typeof image.dataUrl !== "string" || image.dataUrl.length > MAX_IMAGE_CHARS || !/^data:image\/(jpeg|png|webp);base64,[A-Za-z0-9+/]+=*$/.test(image.dataUrl)) {
      return Response.json({ status: "error", reason: "A photo is unsupported or too large. Re-upload a JPG, PNG, or WebP image." }, { status: 400 });
    }
    images.push({ name: typeof image.name === "string" ? image.name.slice(0, 120) : `Photo ${images.length + 1}`, dataUrl: image.dataUrl });
  }
  const draft: ListingDraft = {
    stage: body.stage as ListingStage,
    type: body.type,
    item: String(body.item ?? "").slice(0, 200),
    amount: String(body.amount ?? "").slice(0, 40),
    description: String(body.description ?? "").slice(0, 2000),
    images,
    deliveryMethod: typeof body.deliveryMethod === "string" ? body.deliveryMethod.slice(0, 40) : undefined,
    confirmation: "code",
    expiryHours: typeof body.expiryHours === "string" ? body.expiryHours.slice(0, 8) : undefined,
  };
  if (draft.item.trim().length < 3 || !validZecAmount(draft.amount) || draft.description.trim().length < 40 || (draft.type === "physical" && !images.length)) {
    return Response.json({ status: "error", reason: "Complete the required item, amount, description, and photo fields before this review." }, { status: 400 });
  }
  if (draft.type === "digital" && !["link", "file", "key"].includes(draft.deliveryMethod ?? "")) {
    return Response.json({ status: "error", reason: "Select a valid digital delivery method." }, { status: 400 });
  }
  if (draft.stage === "terms" && !["24", "72", "168"].includes(draft.expiryHours ?? "")) {
    return Response.json({ status: "error", reason: "Select a valid payment link expiry." }, { status: 400 });
  }
  const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY || process.env.AI_PROVIDER_API_KEY;
  if (!apiKey) return Response.json({ status: "unavailable", reason: "AI provider is not configured. Set GEMINI_API_KEY to enable the live listing check.", schema_version: LISTING_SCHEMA_VERSION });

  try {
    const priorImageReview = draft.stage === "terms" ? getCachedImageReview(draft) : null;
    const client = new OpenAI({ apiKey, baseURL: GEMINI_BASE_URL, timeout: 20_000, maxRetries: 0 });
    const contactSheet = priorImageReview ? undefined : await makePhotoContactSheet(images);
    const imageParts = contactSheet ? [{ type: "image_url" as const, image_url: { url: contactSheet } }] : [];
    const imagePayloadBytes = images.reduce((total, image) => total + Buffer.byteLength(image.dataUrl, "utf8"), 0);
    const priorReviewText = priorImageReview ? `\n\nprior_image_review (same item, amount, description, and exact image bytes were already inspected):\n${JSON.stringify(priorImageReview)}` : "";
    const content = [{ type: "text" as const, text: `${buildListingContent(draft)}${priorReviewText}` }, ...imageParts];
    console.info("[listing-check] sending review", { stage: draft.stage, originalImageCount: images.length, modelImageCount: imageParts.length, imagePayloadBytes });
    const resp = await client.chat.completions.create({
      model: MODEL, max_tokens: 850, temperature: 0.1, response_format: { type: "json_object" },
      messages: [
        { role: "system", content: LISTING_SYSTEM_PROMPT },
        { role: "user", content },
      ],
    }, { signal: req.signal });
    const text = (resp.choices[0]?.message?.content ?? "").trim();
    let parsed: unknown;
    try { parsed = JSON.parse(extractJson(text)); }
    catch { return Response.json({ status: "error", reason: "Model output was not valid JSON." }, { status: 502 }); }
    const validated = validateListingVerdict(parsed, images.length, draft.stage);
    if (!validated.ok) return Response.json({ status: "error", reason: `Review validation failed: ${validated.error}. Please try again.` }, { status: 502 });
    if (draft.stage === "item") cacheImageReview(draft, validated.verdict.image_checks);
    const verdict = priorImageReview ? { ...validated.verdict, image_checks: priorImageReview } : validated.verdict;
    return Response.json({ status: "completed", schema_version: LISTING_SCHEMA_VERSION, model: MODEL, verdict });
  } catch (error) {
    const providerStatus = error instanceof OpenAI.APIError ? error.status : undefined;
    const providerMessage = error instanceof Error ? error.message.toLowerCase() : "";
    const tokenWindowLimit = providerStatus === 413 && /input tokens per minute|itpm/.test(providerMessage);
    console.error("[listing-check] provider request failed", { status: providerStatus ?? null, reason: tokenWindowLimit ? "input-token-window" : error instanceof Error ? error.name : "unknown" });
    const message = providerStatus
      ? tokenWindowLimit
        ? "The AI service has temporarily reached its input limit. Wait a moment and retry the review."
        : providerStatus === 413
          ? "The AI service rejected the image payload. Remove and re-add the photos, then retry."
          : `The AI provider rejected the review (${providerStatus}). Try again; if it keeps happening, check the model configuration.`
      : providerStatus === 413
        ? "The photos exceeded the AI provider's request limit. Remove and re-add them so the app can compress them for review."
        : error instanceof Error && error.name.toLowerCase().includes("timeout")
        ? "The AI review timed out. Your draft is saved; try again in a moment."
        : "The AI provider could not complete this review. Check the provider key and try again.";
    return Response.json({ status: "error", reason: message }, { status: 502 });
  }
}
