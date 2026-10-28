import { randomBytes } from "node:crypto";
import { authSecretConfigured, createChallengeCookie, getAllowedOrigin, makeSignInMessage } from "@/lib/walletAuth";
import { storeWalletChallenge } from "@/lib/walletChallenges";

export async function POST(request: Request) {
  if (!authSecretConfigured()) return Response.json({ error: "Wallet sign-in is not configured on this server." }, { status: 503 });
  const origin = getAllowedOrigin(request);
  if (!origin) return Response.json({ error: "Request origin is not allowed." }, { status: 403 });

  const nonce = randomBytes(24).toString("hex");
  const issuedAt = Date.now();
  const stored = await storeWalletChallenge(nonce, issuedAt + 5 * 60 * 1000);
  if (!stored) return Response.json({ error: "Wallet sign-in storage is unavailable." }, { status: 503 });

  const response = Response.json({ message: makeSignInMessage(origin, nonce, issuedAt) });
  response.headers.set("Cache-Control", "no-store");
  response.headers.append("Set-Cookie", createChallengeCookie(request, nonce, issuedAt));
  return response;
}
