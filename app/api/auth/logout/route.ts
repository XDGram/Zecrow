import { clearSessionCookie, getAllowedOrigin } from "@/lib/walletAuth";

export async function POST(request: Request) {
  if (!getAllowedOrigin(request)) return Response.json({ error: "Request origin is not allowed." }, { status: 403 });
  const response = Response.json({ ok: true });
  response.headers.set("Cache-Control", "no-store");
  response.headers.append("Set-Cookie", clearSessionCookie(request));
  return response;
}
