import { verifyMessageSignature } from "@noir-wallet/sdk";
import {
  authSecretConfigured, clearChallengeCookie, createSessionCookie, getAllowedOrigin,
  makeSignInMessage, readChallenge,
} from "@/lib/walletAuth";
import { consumeWalletChallenge } from "@/lib/walletChallenges";

function json(request: Request, body: object, status: number) {
  const response = Response.json(body, { status });
  response.headers.set("Cache-Control", "no-store");
  response.headers.append("Set-Cookie", clearChallengeCookie(request));
  return response;
}

export async function POST(request: Request) {
  if (!authSecretConfigured()) return json(request, { error: "Wallet sign-in is not configured on this server." }, 503);
  const origin = getAllowedOrigin(request);
  const challenge = readChallenge(request);
  if (!origin || !challenge) return json(request, { error: "Sign-in challenge expired. Start again." }, 401);

  const consumed = await consumeWalletChallenge(challenge.nonce);
  if (!consumed) return json(request, { error: "Sign-in challenge was already used or expired. Start again." }, 401);

  let body: Record<string, unknown>;
  try {
    body = await request.json() as Record<string, unknown>;
  } catch {
    return json(request, { error: "Invalid signature response." }, 400);
  }
  const address = typeof body.address === "string" ? body.address : "";
  const pubkey = typeof body.pubkey === "string" ? body.pubkey : "";
  const signature = typeof body.signature === "string" ? body.signature : "";
  if (!address || !pubkey || !signature || address.length > 128 || pubkey.length > 200 || signature.length > 200) {
    return json(request, { error: "Wallet returned an incomplete signature." }, 400);
  }

  const message = makeSignInMessage(origin, challenge.nonce, challenge.issuedAt);
  const result = verifyMessageSignature({ message, signature, address, pubkey, network: "testnet" });
  if (!result.valid || !result.addressMatch || !result.pubkeyMatch) {
    return json(request, { error: "The wallet signature could not be verified." }, 401);
  }

  try {
    const { cookie, session } = createSessionCookie(request, result.recoveredAddress);
    const response = Response.json({ session: { address: session.address, issuedAt: session.issuedAt, expiresAt: session.expiresAt } });
    response.headers.set("Cache-Control", "no-store");
    response.headers.append("Set-Cookie", clearChallengeCookie(request));
    response.headers.append("Set-Cookie", cookie);
    return response;
  } catch {
    return json(request, { error: "Wallet session signing is not configured on this server." }, 503);
  }
}
