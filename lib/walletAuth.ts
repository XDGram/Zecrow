import "server-only";

import { createHmac, timingSafeEqual } from "node:crypto";

const SESSION_COOKIE = "zecrow_session";
const CHALLENGE_COOKIE = "zecrow_wallet_challenge";
const SESSION_SECONDS = 60 * 60 * 8;
const CHALLENGE_SECONDS = 60 * 5;

export type WalletSession = { address: string; issuedAt: number; expiresAt: number };

function secret() {
  const value = process.env.AUTH_SESSION_SECRET;
  if (!value || value.length < 32) throw new Error("AUTH_SESSION_SECRET must contain at least 32 characters.");
  return value;
}

function sign(value: string) {
  return createHmac("sha256", secret()).update(value).digest("base64url");
}

function cookieValue(request: Request, name: string) {
  const prefix = `${name}=`;
  const token = (request.headers.get("cookie") ?? "").split(";").map((part) => part.trim()).find((part) => part.startsWith(prefix));
  return token ? decodeURIComponent(token.slice(prefix.length)) : null;
}

function secureCookie(request: Request) {
  return process.env.NODE_ENV === "production" || new URL(request.url).protocol === "https:";
}

function setCookie(name: string, value: string, request: Request, maxAge: number, path = "/") {
  return `${name}=${encodeURIComponent(value)}; Path=${path}; HttpOnly; SameSite=Lax; Max-Age=${maxAge}${secureCookie(request) ? "; Secure" : ""}`;
}

function clearCookie(name: string, request: Request, path = "/") {
  return `${name}=; Path=${path}; HttpOnly; SameSite=Lax; Max-Age=0${secureCookie(request) ? "; Secure" : ""}`;
}

export function getAllowedOrigin(request: Request): string | null {
  const origin = request.headers.get("origin");
  if (!origin) return null;
  // Allow same-origin requests (the app calling its own API) on any host — this keeps the
  // hosted demo working on Vercel preview/production URLs with no APP_ORIGIN config. An
  // explicit APP_ORIGIN, if set, is also accepted. Cross-site requests are still rejected.
  const self = new URL(request.url).origin;
  const configured = process.env.APP_ORIGIN?.replace(/\/$/, "");
  try {
    const incoming = new URL(origin).origin;
    if (incoming === self) return incoming;
    if (configured && incoming === configured) return incoming;
    return null;
  } catch {
    return null;
  }
}

export function makeSignInMessage(origin: string, nonce: string, issuedAt: number) {
  const issued = new Date(issuedAt).toISOString();
  const expires = new Date(issuedAt + CHALLENGE_SECONDS * 1000).toISOString();
  const domain = new URL(origin).host;
  return `${domain} wants you to sign in with your Zcash testnet account:\n${origin}\n\nSign in to Zecrow. This signature proves control of a derived wallet identity and does not move funds.\n\nURI: ${origin}\nVersion: 1\nChain ID: zcash:testnet\nNonce: ${nonce}\nIssued At: ${issued}\nExpiration Time: ${expires}`;
}

export function createChallengeCookie(request: Request, nonce: string, issuedAt: number) {
  return setCookie(CHALLENGE_COOKIE, `${nonce}.${issuedAt}`, request, CHALLENGE_SECONDS, "/api/auth");
}

export function readChallenge(request: Request) {
  const value = cookieValue(request, CHALLENGE_COOKIE);
  if (!value) return null;
  const [nonce, issuedString, extra] = value.split(".");
  const issuedAt = Number(issuedString);
  if (extra || !/^[a-f0-9]{48}$/.test(nonce ?? "") || !Number.isSafeInteger(issuedAt)) return null;
  if (issuedAt > Date.now() || Date.now() - issuedAt > CHALLENGE_SECONDS * 1000) return null;
  return { nonce, issuedAt };
}

export function clearChallengeCookie(request: Request) {
  return clearCookie(CHALLENGE_COOKIE, request, "/api/auth");
}

export function createSessionCookie(request: Request, address: string) {
  const issuedAt = Date.now();
  const payload: WalletSession = { address, issuedAt, expiresAt: issuedAt + SESSION_SECONDS * 1000 };
  const encoded = Buffer.from(JSON.stringify(payload)).toString("base64url");
  return { cookie: setCookie(SESSION_COOKIE, `${encoded}.${sign(encoded)}`, request, SESSION_SECONDS), session: payload };
}

export function clearSessionCookie(request: Request) {
  return clearCookie(SESSION_COOKIE, request);
}

export function readWalletSession(request: Request): WalletSession | null {
  let token: string | null;
  try {
    token = cookieValue(request, SESSION_COOKIE);
    if (!token) return null;
    const [encoded, signature, extra] = token.split(".");
    if (!encoded || !signature || extra) return null;
    const expected = sign(encoded);
    const left = Buffer.from(signature);
    const right = Buffer.from(expected);
    if (left.length !== right.length || !timingSafeEqual(left, right)) return null;
    const payload = JSON.parse(Buffer.from(encoded, "base64url").toString("utf8")) as WalletSession;
    if (typeof payload.address !== "string" || !Number.isSafeInteger(payload.expiresAt) || payload.expiresAt <= Date.now()) return null;
    return payload;
  } catch {
    return null;
  }
}

export function authSecretConfigured() {
  return Boolean(process.env.AUTH_SESSION_SECRET && process.env.AUTH_SESSION_SECRET.length >= 32);
}
