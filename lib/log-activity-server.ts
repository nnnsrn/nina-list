import type { SupabaseClient } from "@supabase/supabase-js";
import type { ActivityAction } from "./activity";

type CollectionRow = {
  id: number;
  title: string;
  type: string;
  status: string;
  rating: number;
  progress_current: number;
  progress_total: number;
};

export async function insertActivity(
  supabase: SupabaseClient,
  entry: {
    action: ActivityAction;
    item_id: number | null;
    title: string;
    detail: string;
    media_type: string | null;
  }
) {
  const { error } = await supabase.from("activity_log").insert([entry]);
  if (error) {
    console.warn("Failed to log activity:", error.message);
  }
}

export async function logCollectionAdded(
  supabase: SupabaseClient,
  item: Pick<CollectionRow, "id" | "title" | "type">
) {
  await insertActivity(supabase, {
    action: "added_entry",
    item_id: item.id,
    title: item.title,
    detail: `Added to ${item.type} list`,
    media_type: item.type,
  });
}

export async function logCollectionPatch(
  supabase: SupabaseClient,
  existing: CollectionRow,
  updates: Partial<CollectionRow>
) {
  if (
    updates.status === "Completed" &&
    existing.status !== "Completed"
  ) {
    await insertActivity(supabase, {
      action: "completed_series",
      item_id: existing.id,
      title: existing.title,
      detail: `Score: ${updates.rating ?? existing.rating}/10`,
      media_type: existing.type,
    });
    return;
  }

  if (
    typeof updates.progress_current === "number" &&
    updates.progress_current > existing.progress_current
  ) {
    const isAnime = existing.type === "Anime";
    await insertActivity(supabase, {
      action: isAnime ? "watched_episode" : "read_chapter",
      item_id: existing.id,
      title: existing.title,
      detail: isAnime
        ? `Episode ${updates.progress_current}`
        : `Chapter ${updates.progress_current}`,
      media_type: existing.type,
    });
    return;
  }

  if (
    typeof updates.rating === "number" &&
    updates.rating !== Number(existing.rating)
  ) {
    await insertActivity(supabase, {
      action: "updated_rating",
      item_id: existing.id,
      title: existing.title,
      detail: `Score: ${updates.rating}/10`,
      media_type: existing.type,
    });
  }
}
