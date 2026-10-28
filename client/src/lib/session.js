import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";

const SESSION_COOKIE = "crm_session";
const SESSION_DAYS = 7;

export function getSecret() {
  const secret = process.env.AUTH_SECRET;
  if (!secret) {
    throw new Error("AUTH_SECRET not set");
  }
  return new TextEncoder().encode(secret);
}

export async function createSession(userId) {
  const token = await new SignJWT({ userId })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${SESSION_DAYS}d`)
    .sign(getSecret());

  const cookie = await cookies();
  cookie.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_DAYS * 24 * 60 * 60,
  });
}

export async function destroySession() {
  const cookie = await cookies();
  cookie.delete(SESSION_COOKIE);
}

export async function getSessionUserId() {
  const cookie = await cookies();
  const token = cookie.get(SESSION_COOKIE)?.value; //To avoid undefined
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, getSecret());
    console.log(payload.userId, "payload random user");
    return payload.userId;
  } catch (error) {
    console.error(error);
    return null;
  }
}
