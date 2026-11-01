import { NextResponse } from "next/server";
import { SESSION_COOKIE, isCorrectPassword, sessionToken } from "@/lib/session";

export async function POST(request: Request) {
  if (!process.env.APP_PASSWORD) {
    return NextResponse.json({ detail: "APP_PASSWORD is not set on the server." }, { status: 503 });
  }
  const body = await request.json().catch(() => null);
  const attempt = typeof body?.password === "string" ? body.password : "";

  if (!(await isCorrectPassword(attempt))) {
    await new Promise((resolve) => setTimeout(resolve, 500));
    return NextResponse.json({ detail: "Incorrect password." }, { status: 401 });
  }

  const response = NextResponse.json({ ok: true });
  response.cookies.set(SESSION_COOKIE, await sessionToken(process.env.APP_PASSWORD), {
    httpOnly: true,
    sameSite: "lax",
    secure: request.url.startsWith("https://"),
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });
  return response;
}
