import { createHmac, timingSafeEqual } from "crypto";
import { cookies } from "next/headers";

export const ADMIN_SESSION_COOKIE = "ninalist_admin_session";
const SESSION_TTL_SECONDS = 60 * 60 * 24 * 7;
const MIN_PRODUCTION_SECRET_LENGTH = 32;

function getEnvValue(name: string) {
  return process.env[name]?.trim() ?? "";
}

function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

function isConfigured() {
  const sessionSecret = getEnvValue("ADMIN_SESSION_SECRET");

  if (process.env.NODE_ENV === "production" && sessionSecret.length < MIN_PRODUCTION_SECRET_LENGTH) {
    return false;
  }

  return Boolean(getEnvValue("ADMIN_EMAIL") && getEnvValue("ADMIN_PASSWORD") && sessionSecret);
}

function createSessionSignature(timestamp: string) {
  const secret = getEnvValue("ADMIN_SESSION_SECRET");
  const email = normalizeEmail(getEnvValue("ADMIN_EMAIL"));
  return createHmac("sha256", secret).update(`${email}:${timestamp}`).digest("hex");
}

export function validateAdminCredentials(email: string, password: string) {
  if (!isConfigured()) return false;

  return normalizeEmail(email) === normalizeEmail(getEnvValue("ADMIN_EMAIL")) && password === getEnvValue("ADMIN_PASSWORD");
}

export function createAdminSessionToken() {
  const timestamp = Math.floor(Date.now() / 1000).toString();
  return `${timestamp}.${createSessionSignature(timestamp)}`;
}

export function isAdminSessionTokenValid(token?: string | null) {
  if (!token || !isConfigured()) return false;

  const [timestamp, signature] = token.split(".");
  if (!timestamp || !signature || !/^\d+$/.test(timestamp) || !/^[a-f0-9]{64}$/i.test(signature)) return false;

  const issuedAt = Number(timestamp);
  if (!Number.isFinite(issuedAt)) return false;

  const ageInSeconds = Math.floor(Date.now() / 1000) - issuedAt;
  if (ageInSeconds < 0 || ageInSeconds > SESSION_TTL_SECONDS) return false;

  const expected = createSessionSignature(timestamp);
  const expectedBuffer = Buffer.from(expected, "hex");
  const providedBuffer = Buffer.from(signature, "hex");

  if (expectedBuffer.length !== providedBuffer.length) return false;

  return timingSafeEqual(expectedBuffer, providedBuffer);
}

export async function isAdminRequest(): Promise<boolean> {
  const cookieStore = await cookies();
  const sessionToken = cookieStore.get(ADMIN_SESSION_COOKIE)?.value;
  return isAdminSessionTokenValid(sessionToken);
}
