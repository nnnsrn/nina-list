import { NextResponse } from "next/server";

type JikanEntry = {
  mal_id: number;
  title: string;
  url: string;
  images?: {
    jpg?: {
      image_url?: string;
    };
  };
  genres?: Array<{
    name?: string;
  }>;
  synopsis?: string;
  score?: number | null;
  episodes?: number | null;
  chapters?: number | null;
  type?: string;
};

const normalizeType = (type: string | null) => (type === "Anime" ? "anime" : "manga");

export async function GET(request: Request) {
  const url = new URL(request.url);
  const query = url.searchParams.get("q")?.trim() ?? "";
  const type = normalizeType(url.searchParams.get("type"));

  if (query.length < 2) {
    return NextResponse.json({ results: [] });
  }

  const response = await fetch(
    `https://api.jikan.moe/v4/${type}?q=${encodeURIComponent(query)}&limit=5&sfw=true`,
    {
      headers: {
        Accept: "application/json",
      },
      cache: "no-store",
    }
  );

  if (!response.ok) {
    return NextResponse.json({ results: [] }, { status: response.status });
  }

  const payload = await response.json();
  const seen = new Set<number>();

  const results = Array.isArray(payload?.data)
    ? payload.data
        .filter((entry: JikanEntry) => {
          if (!entry.mal_id || seen.has(entry.mal_id)) return false;
          seen.add(entry.mal_id);
          return true;
        })
        .map((entry: JikanEntry) => ({
          id: entry.mal_id,
          title: entry.title,
          url: entry.url,
          image: entry.images?.jpg?.image_url ?? "",
          genres: (entry.genres ?? []).map((genre) => genre.name).filter(Boolean),
          synopsis: entry.synopsis ?? "",
          score: entry.score ?? null,
          episodes: entry.episodes ?? null,
          chapters: entry.chapters ?? null,
          jikanType: entry.type ?? type,
        }))
    : [];

  return NextResponse.json({ results });
}