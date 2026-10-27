import { createEscrowOrder, listEscrowOrders, type EscrowType } from "@/lib/escrowStore";
import { CODE_RELEASE_TERMS, PLATFORM_DISPUTE_WINDOW_DAYS, validZecAmount } from "@/lib/listingCheck";
import { getAllowedOrigin, readWalletSession } from "@/lib/walletAuth";

const IMAGE_LIMIT = 1_900_000;
const linkExpiries = [24, 72, 168];

export async function GET(request: Request) {
  const session = readWalletSession(request);
  if (!session) return Response.json({ error: "Sign in with your Zcash testnet wallet." }, { status: 401 });
  try {
    const orders = await listEscrowOrders(session.address);
    return Response.json({ orders: orders.map((order) => ({
      number: order.number,
      item: order.item,
      type: order.type,
      amountZec: order.amountZec,
      createdAt: order.createdAt,
      status: order.status,
    })) }, { headers: { "Cache-Control": "no-store" } });
  } catch {
    return Response.json({ error: "Order storage is unavailable." }, { status: 503 });
  }
}

export async function POST(request: Request) {
  if (!getAllowedOrigin(request)) return Response.json({ error: "Request origin is not allowed." }, { status: 403 });
  const session = readWalletSession(request);
  if (!session) return Response.json({ error: "Sign in with your Zcash testnet wallet before creating an order." }, { status: 401 });
  const contentLength = Number(request.headers.get("content-length") ?? 0);
  if (contentLength > 7_000_000) return Response.json({ error: "The listing is too large. Reduce the photos and try again." }, { status: 413 });

  let body: Record<string, unknown>;
  try {
    body = await request.json() as Record<string, unknown>;
  } catch {
    return Response.json({ error: "Invalid order data." }, { status: 400 });
  }

  const type = body.type;
  const item = typeof body.item === "string" ? body.item.trim() : "";
  const amountZec = typeof body.amountZec === "string" ? body.amountZec.trim() : "";
  const description = typeof body.description === "string" ? body.description.trim() : "";
  const images = Array.isArray(body.images) ? body.images : [];
  const deliveryMethod = type === "digital" && typeof body.deliveryMethod === "string" ? body.deliveryMethod : "";
  const shipping = "";
  // Every order uses the platform's one-time code as the release trigger.
  const confirmation = "code";
  const proof = "";
  const releaseTerms = CODE_RELEASE_TERMS;
  const disputeWindowDays = PLATFORM_DISPUTE_WINDOW_DAYS;
  const linkExpiryHours = Number(body.linkExpiryHours);

  if (type !== "physical" && type !== "digital") return Response.json({ error: "Choose physical or digital goods." }, { status: 400 });
  if (item.length < 3 || item.length > 200) return Response.json({ error: "Item name must be between 3 and 200 characters." }, { status: 400 });
  if (!validZecAmount(amountZec)) return Response.json({ error: "Enter a valid ZEC amount." }, { status: 400 });
  if (description.length < 40 || description.length > 2000) return Response.json({ error: "Description must be between 40 and 2,000 characters." }, { status: 400 });
  if (images.length > 3) return Response.json({ error: "Attach no more than three photos." }, { status: 400 });

  const safeImages: { name: string; dataUrl: string }[] = [];
  for (const raw of images) {
    if (!raw || typeof raw !== "object") return Response.json({ error: "Invalid photo data." }, { status: 400 });
    const image = raw as Record<string, unknown>;
    if (typeof image.dataUrl !== "string" || image.dataUrl.length > IMAGE_LIMIT || !/^data:image\/(jpeg|png|webp);base64,[A-Za-z0-9+/]+=*$/.test(image.dataUrl)) {
      return Response.json({ error: "A photo is unsupported or too large. Re-upload a JPG, PNG, or WebP image." }, { status: 400 });
    }
    safeImages.push({ name: typeof image.name === "string" ? image.name.slice(0, 120) : `Photo ${safeImages.length + 1}`, dataUrl: image.dataUrl });
  }

  if (type === "physical" && !safeImages.length) {
    return Response.json({ error: "Physical orders need at least one product photo." }, { status: 400 });
  }
  if (type === "digital" && !["link", "file", "key"].includes(deliveryMethod)) {
    return Response.json({ error: "Choose a valid digital delivery method." }, { status: 400 });
  }
  if (!linkExpiries.includes(linkExpiryHours)) {
    return Response.json({ error: "Choose a valid payment link expiry." }, { status: 400 });
  }

  try {
    const order = await createEscrowOrder({
      type: type as EscrowType,
      item,
      amountZec,
      description,
      images: safeImages,
      deliveryMethod,
      shipping,
      confirmation,
      proof,
      releaseTerms,
      disputeWindowDays,
      linkExpiryHours,
    }, session.address);
    return Response.json({ order: { number: order.number, code: order.code, createdAt: order.createdAt, expiresAt: order.expiresAt } }, { status: 201 });
  } catch (error) {
    const reason = error instanceof Error ? error.message : "Order storage is unavailable.";
    const status = reason.includes("not configured") ? 503 : 500;
    return Response.json({ error: status === 503 ? reason : "The order could not be saved. Please try again." }, { status });
  }
}
