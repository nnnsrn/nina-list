import { NextResponse } from "next/server";

type JikanEntry = {
  mal_id: number;
  title: string;
  url: string;
  images?: { jpg?: { image_url?: string } };
  synopsis?: string;
  score?: number | null;
  episodes?: number | null;
  chapters?: number | null;
  type?: string;
  status?: string;
};

function mapAnime(entry: JikanEntry) {
  return {
    id: entry.mal_id,
    title: entry.title,
    url: entry.url,
    image: entry.images?.jpg?.image_url ?? "",
    synopsis: entry.synopsis ?? "",
    score: entry.score ?? null,
    episodes: entry.episodes ?? null,
    mediaType: "Anime" as const,
    badge: entry.status === "Currently Airing" ? "Currently Airing" : "Anime",
    badgeDetail:
      typeof entry.episodes === "number" && entry.episodes > 0
        ? `Ep ${entry.episodes}`
        : entry.type ?? "TV",
  };
}

function mapManga(entry: JikanEntry) {
  return {
    id: entry.mal_id,
    title: entry.title,
    url: entry.url,
    image: entry.images?.jpg?.image_url ?? "",
    synopsis: entry.synopsis ?? "",
    score: entry.score ?? null,
    chapters: entry.chapters ?? null,
    mediaType: "Manga" as const,
    badge: "Manga",
    badgeDetail:
      typeof entry.chapters === "number" && entry.chapters > 0
        ? `${entry.chapters} Ch`
        : entry.type ?? "Manga",
  };
}

export async function GET() {
  try {
    const [animeResponse, mangaResponse] = await Promise.all([
      fetch("https://api.jikan.moe/v4/top/anime?filter=airing&limit=3", {
        headers: { Accept: "application/json" },
        next: { revalidate: 3600 },
      }),
      fetch("https://api.jikan.moe/v4/top/manga?filter=bypopularity&limit=2", {
        headers: { Accept: "application/json" },
        next: { revalidate: 3600 },
      }),
    ]);

    const animePayload = animeResponse.ok ? await animeResponse.json() : { data: [] };
    const mangaPayload = mangaResponse.ok ? await mangaResponse.json() : { data: [] };

    const anime = Array.isArray(animePayload?.data)
      ? animePayload.data.map((entry: JikanEntry) => mapAnime(entry))
      : [];
    const manga = Array.isArray(mangaPayload?.data)
      ? mangaPayload.data.map((entry: JikanEntry) => mapManga(entry))
      : [];

    const results = [...anime, ...manga];

    return NextResponse.json({ results });
  } catch {
    return NextResponse.json({ results: [] });
  }
}
