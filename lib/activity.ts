export type ActivityAction =
  | "watched_episode"
  | "read_chapter"
  | "completed_series"
  | "added_entry"
  | "updated_rating";

export interface ActivityEntry {
  id: number;
  created_at: string;
  action: ActivityAction;
  item_id: number | null;
  title: string;
  detail: string;
  media_type: string | null;
}

export function getActivityLabel(action: ActivityAction): string {
  switch (action) {
    case "watched_episode":
      return "Watched Episode";
    case "read_chapter":
      return "Read Chapter";
    case "completed_series":
      return "Completed Series";
    case "added_entry":
      return "Added to Library";
    case "updated_rating":
      return "Updated Rating";
    default:
      return "Activity";
  }
}

export function getActivityIcon(action: ActivityAction): string {
  switch (action) {
    case "watched_episode":
      return "play_arrow";
    case "read_chapter":
      return "menu_book";
    case "completed_series":
      return "task_alt";
    case "added_entry":
      return "add";
    case "updated_rating":
      return "star";
    default:
      return "history";
  }
}

export function formatRelativeTime(iso: string): string {
  const date = new Date(iso);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMinutes = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMinutes < 1) return "Just now";
  if (diffMinutes < 60) return `${diffMinutes} minute${diffMinutes === 1 ? "" : "s"} ago`;
  if (diffHours < 24) return `${diffHours} hour${diffHours === 1 ? "" : "s"} ago`;
  if (diffDays === 1) return "Yesterday";
  if (diffDays < 7) return `${diffDays} days ago`;
  return date.toLocaleDateString();
}

function toDateKey(date: Date): string {
  return date.toISOString().slice(0, 10);
}

export function getActiveDateKeys(activities: ActivityEntry[]): Set<string> {
  return new Set(activities.map((entry) => toDateKey(new Date(entry.created_at))));
}

export function computeStreak(activities: ActivityEntry[]): number {
  const activeDays = getActiveDateKeys(activities);
  if (activeDays.size === 0) return 0;

  let streak = 0;
  const cursor = new Date();
  cursor.setHours(0, 0, 0, 0);

  while (activeDays.has(toDateKey(cursor))) {
    streak += 1;
    cursor.setDate(cursor.getDate() - 1);
  }

  return streak;
}

export function computeHeatmapLevels(activities: ActivityEntry[], days = 30): number[] {
  const counts = new Map<string, number>();

  for (const entry of activities) {
    const key = toDateKey(new Date(entry.created_at));
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }

  const levels: number[] = [];
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  for (let offset = days - 1; offset >= 0; offset -= 1) {
    const day = new Date(today);
    day.setDate(today.getDate() - offset);
    const count = counts.get(toDateKey(day)) ?? 0;

    if (count === 0) levels.push(0);
    else if (count === 1) levels.push(1);
    else if (count === 2) levels.push(2);
    else if (count <= 4) levels.push(3);
    else levels.push(4);
  }

  return levels;
}

export function getHeatmapCellClass(level: number): string {
  switch (level) {
    case 1:
      return "bg-primary/20";
    case 2:
      return "bg-primary/40";
    case 3:
      return "bg-primary/80";
    case 4:
      return "bg-primary shadow-[0_0_8px_rgba(0,229,255,0.4)]";
    default:
      return "bg-surface-container-highest/50";
  }
}

export function getCurrentWeekActivity(activities: ActivityEntry[]): boolean[] {
  const activeDays = getActiveDateKeys(activities);
  const today = new Date();
  const dayOfWeek = today.getDay();
  const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
  const monday = new Date(today);
  monday.setDate(today.getDate() + mondayOffset);
  monday.setHours(0, 0, 0, 0);

  return Array.from({ length: 7 }, (_, index) => {
    const day = new Date(monday);
    day.setDate(monday.getDate() + index);
    return activeDays.has(toDateKey(day));
  });
}
