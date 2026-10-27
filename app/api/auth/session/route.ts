import { readWalletSession } from "@/lib/walletAuth";

export async function GET(request: Request) {
  const session = readWalletSession(request);
  if (!session) return Response.json({ session: null }, { headers: { "Cache-Control": "no-store" } });
  return Response.json({ session: { address: session.address, issuedAt: session.issuedAt, expiresAt: session.expiresAt } }, { headers: { "Cache-Control": "no-store" } });
}
