import { NextResponse } from "next/server";
import { isAdminRequest } from "@/lib/admin-auth";
import { getSupabaseAdmin, getSupabaseAdminConfigError } from "@/lib/supabase-server";
import { logCollectionPatch } from "@/lib/log-activity-server";

type RouteContext = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, context: RouteContext) {
  if (!(await isAdminRequest())) {
    return NextResponse.json({ error: "Admin access required." }, { status: 401 });
  }

  const supabase = getSupabaseAdmin();
  if (!supabase) {
    return NextResponse.json({ error: getSupabaseAdminConfigError() }, { status: 503 });
  }

  const { id } = await context.params;
  const numericId = Number(id);
  if (!Number.isFinite(numericId)) {
    return NextResponse.json({ error: "Invalid id." }, { status: 400 });
  }

  const body = await request.json().catch(() => null);
  if (!body || typeof body !== "object") {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const { data: existing, error: fetchError } = await supabase
    .from("collection")
    .select("*")
    .eq("id", numericId)
    .single();

  if (fetchError || !existing) {
    return NextResponse.json({ error: "Collection item not found." }, { status: 404 });
  }

  const { error } = await supabase.from("collection").update(body).eq("id", numericId);
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  await logCollectionPatch(supabase, existing, body);

  return NextResponse.json({ ok: true });
}

export async function DELETE(_request: Request, context: RouteContext) {
  if (!(await isAdminRequest())) {
    return NextResponse.json({ error: "Admin access required." }, { status: 401 });
  }

  const supabase = getSupabaseAdmin();
  if (!supabase) {
    return NextResponse.json({ error: getSupabaseAdminConfigError() }, { status: 503 });
  }

  const { id } = await context.params;
  const numericId = Number(id);
  if (!Number.isFinite(numericId)) {
    return NextResponse.json({ error: "Invalid id." }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("collection")
    .delete()
    .eq("id", numericId)
    .select("id");

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  if (!data || data.length === 0) {
    return NextResponse.json({ error: "Collection item not found." }, { status: 404 });
  }

  return NextResponse.json({ ok: true });
}
