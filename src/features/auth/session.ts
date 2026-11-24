import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import { UserPreference } from "@/generated/prisma/enums";
import type { UserRole } from "@/features/auth/validations";
import { preferenceToRoleAndBadge, roleToPreference } from "@/features/auth/roles";

export { preferenceToRoleAndBadge, roleToPreference };

export const SESSION_COOKIE_NAME = "temurah_session";
const SESSION_DURATION_SECONDS = 60 * 60 * 24 * 7; // 7 hari

const SECRET_KEY = new TextEncoder().encode(
  process.env.AUTH_SECRET || "fallback_temurah_secret_key_minimum_32_chars_long_2026!"
);

export type SessionPayload = {
  sub: string; // userId (UUID)
  email: string;
  name: string;
  role: UserRole;
  badge: string;
  avatarUrl: string | null;
  preference: UserPreference;
  isAdmin?: boolean;
};

/**
 * Buat JWT session token terenkripsi/tertanda tangan dengan jangka waktu 7 hari.
 */
export async function signSessionToken(payload: SessionPayload): Promise<string> {
  return await new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(SECRET_KEY);
}

/**
 * Verifikasi JWT session token.
 */
export async function verifySessionToken(token: string): Promise<SessionPayload | null> {
  try {
    const { payload } = await jwtVerify(token, SECRET_KEY, {
      algorithms: ["HS256"],
    });
    return payload as unknown as SessionPayload;
  } catch {
    return null;
  }
}

/**
 * Set secure HttpOnly session cookie di response Next.js.
 */
export async function setSessionCookie(payload: SessionPayload): Promise<void> {
  const token = await signSessionToken(payload);
  try {
    const cookieStore = await cookies();

    cookieStore.set(SESSION_COOKIE_NAME, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: SESSION_DURATION_SECONDS,
    });
  } catch (error) {
    if (process.env.NODE_ENV === "test") {
      return;
    }
    throw error;
  }
}

/**
 * Baca dan verifikasi session dari cookie request.
 */
export async function getSession(): Promise<SessionPayload | null> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;

    if (!token) {
      return null;
    }

    return await verifySessionToken(token);
  } catch (error) {
    if (process.env.NODE_ENV === "test") {
      return null;
    }
    throw error;
  }
}

/**
 * Hapus session cookie (Logout).
 */
export async function deleteSessionCookie(): Promise<void> {
  try {
    const cookieStore = await cookies();
    cookieStore.delete(SESSION_COOKIE_NAME);
  } catch (error) {
    if (process.env.NODE_ENV === "test") {
      return;
    }
    throw error;
  }
}
