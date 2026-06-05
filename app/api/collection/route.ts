import { NextResponse } from "next/server";
import { isAdminRequest } from "@/lib/admin-auth";
import { getSupabaseAdmin, getSupabaseAdminConfigError } from "@/lib/supabase-server";
import { logCollectionAdded } from "@/lib/log-activity-server";

export async function POST(request: Request) {
  if (!(await isAdminRequest())) {
    return NextResponse.json({ error: "Admin access required." }, { status: 401 });
  }

  const supabase = getSupabaseAdmin();
  if (!supabase) {
    return NextResponse.json({ error: getSupabaseAdminConfigError() }, { status: 503 });
  }

  const body = await request.json().catch(() => null);
  if (!body || typeof body.title !== "string" || !body.title.trim()) {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const record = {
    title: body.title.trim(),
    type: body.type,
    status: body.status,
    genre: typeof body.genre === "string" ? body.genre : "Unknown",
    rating: Number(body.rating) || 0,
    progress_current: Number(body.progress_current) || 0,
    progress_total: Number(body.progress_total) || 1,
    cover_image: typeof body.cover_image === "string" ? body.cover_image : "",
  };

  const { data, error } = await supabase
    .from("collection")
    .insert([record])
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  try {
    await logCollectionAdded(supabase, data);
  } catch {
    // Activity logging is optional; collection insert already succeeded.
  }

  return NextResponse.json(data);
}
