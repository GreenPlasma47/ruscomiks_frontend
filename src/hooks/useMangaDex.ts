// hooks/useMangaDex.ts
// Fetches manga metadata from the public MangaDex API v5.
// No API key required for search/browse.
// Docs: https://api.mangadex.org/docs/




import api from "../api"; 
import { useState, useCallback, useRef } from "react";

// const MANGADEX_BASE = "https://api.mangadex.org";
// const COVER_BASE    = "https://uploads.mangadex.org/covers";

export interface MangaDexResult {
  id: string;
  title: string;
  description: string;
  coverUrl: string | null;
  status: string;
  year: number | null;
  tags: string[];
  authors: string[];
  contentRating: string;
  originalLanguage: string;
}

function extractTitle(attributes: any): string {
  const t = attributes.title;
  return t.en || t["ja-ro"] || t.ja || Object.values(t)[0] || "Untitled";
}

function extractDescription(attributes: any): string {
  const d = attributes.description;
  if (!d) return "";
  return d.en || d["ja-ro"] || Object.values(d)[0] || "";
}

function extractCoverUrl(mangaId: string, relationships: any[]): string | null {
  const coverRel = relationships?.find((r: any) => r.type === "cover_art");
  if (!coverRel?.attributes?.fileName) return null;
  return `${COVER_BASE}/${mangaId}/${coverRel.attributes.fileName}.512.jpg`;
}

function extractAuthors(relationships: any[]): string[] {
  return relationships
    ?.filter((r: any) => r.type === "author" && r.attributes?.name)
    .map((r: any) => r.attributes.name) ?? [];
}

function mapManga(manga: any): MangaDexResult {
  const { id, attributes, relationships } = manga;
  return {
    id,
    title: extractTitle(attributes),
    description: extractDescription(attributes),
    coverUrl: extractCoverUrl(id, relationships),
    status: attributes.status ?? "unknown",
    year: attributes.year ?? null,
    tags: attributes.tags?.map((t: any) =>
      t.attributes?.name?.en || Object.values(t.attributes?.name ?? {})[0] || ""
    ).filter(Boolean) ?? [],
    authors: extractAuthors(relationships),
    contentRating: attributes.contentRating ?? "safe",
    originalLanguage: attributes.originalLanguage ?? "",
  };
}

export function useMangaDex() {
  const [results, setResults] = useState<MangaDexResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError]   = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  const search = useCallback(async (query: string) => {
    if (!query.trim()) { setResults([]); return; }

    // Cancel previous in-flight request
    abortRef.current?.abort();
    abortRef.current = new AbortController();

    setLoading(true);
    setError(null);

    try {
      const params = {
        title: query,
        limit: "12",
        "contentRating[]": "safe",
        "includes[]": "cover_art",
        "includes[1]": "author",
        "order[relevance]": "desc",
      };

      // Use your axios instance ('api') which already handles the base URL and tokens
      const res = await api.get(`/mangadex/search`, { 
        params,
        signal: abortRef.current.signal 
      });

      if (!res.ok) throw new Error(`MangaDex error: ${res.status}`);
      const json = await res.data; // Axios puts response in .data
      setResults((json.data ?? []).map(mapManga));
      // const params = new URLSearchParams({
      //   title: query,
      //   limit: "12",
      //   "contentRating[]": "safe",
      //   "includes[]": "cover_art",
      //   "includes[1]": "author",
      //   "order[relevance]": "desc",
      // });

      // const res = await fetch(`${MANGADEX_BASE}/manga?${params}`, {
      //   signal: abortRef.current.signal,
      //   headers: { "Content-Type": "application/json" },
      // });

      // if (!res.ok) throw new Error(`MangaDex error: ${res.status}`);
      // const json = await res.json();
      // setResults((json.data ?? []).map(mapManga));
    } catch (err: any) {
      if (err.name === "AbortError") return; // ignore cancelled requests
      setError("Could not reach MangaDex. Check your connection.");
      setResults([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const clear = useCallback(() => {
    abortRef.current?.abort();
    setResults([]);
    setError(null);
  }, []);

  return { results, loading, error, search, clear };
}