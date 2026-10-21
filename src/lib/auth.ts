import { createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";

export const COOKIE = "rg_hab_token";

type Client = { name: string; code: string };
export type Session = { name: string; exp: number };

export function clients(): Client[] {
  return (process.env.ACCESS_CODES ?? "")
    .split(",")
    .map((entry) => entry.trim())
    .filter(Boolean)
    .map((entry) => {
      const i = entry.lastIndexOf(":");
      return i > 0 ? { name: entry.slice(0, i).trim(), code: entry.slice(i + 1).trim() } : { name: "Invité", code: entry };
    })
    .filter((c) => c.code);
}

export function authRequired() {
  return clients().length > 0;
}

export function tokenHours() {
  const h = Number(process.env.TOKEN_HOURS);
  return h > 0 ? h : 24;
}

function secret() {
  return process.env.AUTH_SECRET || "dev-secret";
}

function sign(payload: string) {
  return createHmac("sha256", secret()).update(payload).digest("base64url");
}

function same(a: string, b: string) {
  const x = Buffer.from(a);
  const y = Buffer.from(b);
  return x.length === y.length && timingSafeEqual(x, y);
}

export function findClient(code: string) {
  return clients().find((c) => same(c.code, code));
}

export function createToken(name: string): { token: string; session: Session } {
  const session = { name, exp: Date.now() + tokenHours() * 3600_000 };
  const payload = Buffer.from(JSON.stringify(session)).toString("base64url");
  return { token: `${payload}.${sign(payload)}`, session };
}

export function readToken(token: string | undefined): Session | null {
  if (!token) return null;
  const [payload, sig] = token.split(".");
  if (!payload || !sig || !same(sig, sign(payload))) return null;
  try {
    const session = JSON.parse(Buffer.from(payload, "base64url").toString()) as Session;
    if (!session.name || !clients().some((c) => c.name === session.name)) return null;
    return session.exp > Date.now() ? session : null;
  } catch {
    return null;
  }
}

export async function currentSession() {
  return readToken((await cookies()).get(COOKIE)?.value);
}
