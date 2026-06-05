import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { ADMIN_SESSION_COOKIE, isAdminSessionTokenValid } from "@/lib/admin-auth";

export const dynamic = "force-dynamic";

export async function GET() {
  const cookieStore = await cookies();
  const sessionToken = cookieStore.get(ADMIN_SESSION_COOKIE)?.value;
  const isValid = isAdminSessionTokenValid(sessionToken);

  return NextResponse.json(
    { loggedIn: isValid },
    { headers: { "Cache-Control": "no-store, max-age=0" } }
  );
}
