import { NextResponse } from "next/server";
import { COOKIE, authRequired, createToken, currentSession, findClient, tokenHours } from "@/lib/auth";

export async function GET() {
  if (!authRequired()) return NextResponse.json({ required: false, session: null });
  return NextResponse.json({ required: true, session: await currentSession() });
}

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  const code = typeof body?.code === "string" ? body.code.trim() : "";
  const client = code ? findClient(code) : undefined;
  if (!client) {
    await new Promise((r) => setTimeout(r, 1000));
    return NextResponse.json({ error: "Code incorrect." }, { status: 401 });
  }
  const { token, session } = createToken(client.name);
  const res = NextResponse.json({ session });
  res.cookies.set(COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: tokenHours() * 3600,
  });
  return res;
}

export async function DELETE() {
  const res = NextResponse.json({ ok: true });
  res.cookies.delete(COOKIE);
  return res;
}
