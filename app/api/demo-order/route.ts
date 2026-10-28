import { createDemoOrder } from "@/lib/escrowStore";
import { getAllowedOrigin } from "@/lib/walletAuth";

// Creates a pre-populated demo order and returns its public code so a reviewer can open the buyer
// page without signing in. No wallet required; funding/release use the simulated demo paths.

export async function POST(request: Request) {
  if (!getAllowedOrigin(request)) return Response.json({ error: "Request origin is not allowed." }, { status: 403 });
  try {
    const order = await createDemoOrder();
    return Response.json({ code: order.code, href: `/e/${order.code}` }, { status: 201, headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    const reason = error instanceof Error ? error.message : "Could not create a demo order.";
    const status = reason.includes("not configured") ? 503 : 500;
    return Response.json({ error: status === 503 ? reason : "Could not create a demo order. Please try again." }, { status });
  }
}
