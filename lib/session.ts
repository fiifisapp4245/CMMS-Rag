// Runs in middleware (Edge) and route handlers, so it uses Web Crypto only.
export const SESSION_COOKIE = "cmms_session";

async function sign(password: string): Promise<string> {
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(password),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const signature = await crypto.subtle.sign("HMAC", key, encoder.encode("cmms-session-v1"));
  return Array.from(new Uint8Array(signature), (b) => b.toString(16).padStart(2, "0")).join("");
}

function constantTimeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let difference = 0;
  for (let i = 0; i < a.length; i++) difference |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return difference === 0;
}

export async function sessionToken(password: string): Promise<string> {
  return sign(password);
}

export async function isValidSession(token: string | undefined): Promise<boolean> {
  const password = process.env.APP_PASSWORD;
  if (!password || !token) return false;
  return constantTimeEqual(token, await sign(password));
}

export async function isCorrectPassword(attempt: string): Promise<boolean> {
  const password = process.env.APP_PASSWORD;
  if (!password) return false;
  return constantTimeEqual(await sign(attempt), await sign(password));
}
