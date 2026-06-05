import { createClient, SupabaseClient } from "@supabase/supabase-js";

function normalizeSupabaseUrl(url: string): string {
  return url.replace(/\/rest\/v1\/?$/, "").replace(/\/$/, "");
}

function getServiceRoleKey(): string | null {
  const key =
    process.env.SUPABASE_SERVICE_ROLE_KEY?.trim() ||
    process.env.SUPABASE_SERVICE_KEY?.trim() ||
    null;

  if (!key) return null;

  try {
    const payload = JSON.parse(Buffer.from(key.split(".")[1], "base64url").toString());
    if (payload.role !== "service_role") {
      console.error(
        "SUPABASE_SERVICE_ROLE_KEY is set but its JWT role is not service_role. " +
          "Paste the service_role secret from Supabase Dashboard > Project Settings > API, not the anon key."
      );
      return null;
    }
  } catch {
    console.error("SUPABASE_SERVICE_ROLE_KEY is not a valid Supabase JWT.");
    return null;
  }

  return key;
}

/** Admin server client — service role only, bypasses RLS. Never falls back to anon. */
export function getSupabaseAdmin(): SupabaseClient | null {
  const supabaseUrl = normalizeSupabaseUrl(process.env.NEXT_PUBLIC_SUPABASE_URL?.trim() ?? "");
  const serviceRoleKey = getServiceRoleKey();

  if (!supabaseUrl || !serviceRoleKey) return null;

  return createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

export function getSupabaseAdminConfigError(): string {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL?.trim()) {
    return "NEXT_PUBLIC_SUPABASE_URL is not configured.";
  }

  const rawKey =
    process.env.SUPABASE_SERVICE_ROLE_KEY?.trim() ||
    process.env.SUPABASE_SERVICE_KEY?.trim();

  if (!rawKey) {
    return (
      "SUPABASE_SERVICE_ROLE_KEY is missing from .env.local. " +
      "Copy the service_role secret from Supabase Dashboard > Project Settings > API, then restart npm run dev."
    );
  }

  try {
    const payload = JSON.parse(Buffer.from(rawKey.split(".")[1], "base64url").toString());
    if (payload.role !== "service_role") {
      return (
        "SUPABASE_SERVICE_ROLE_KEY contains the anon key, not the service_role key. " +
        "Use the service_role secret from Supabase Dashboard > Project Settings > API."
      );
    }
  } catch {
    return "SUPABASE_SERVICE_ROLE_KEY is not a valid Supabase JWT.";
  }

  return "Supabase admin client could not be created.";
}

/** @deprecated Use getSupabaseAdmin() for writes. */
export function getSupabaseServer(): SupabaseClient | null {
  return getSupabaseAdmin();
}
