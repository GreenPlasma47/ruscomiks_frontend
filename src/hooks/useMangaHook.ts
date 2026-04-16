// hooks/useMangaHook.ts
// Fetches manga data from the public MangaHook API.
// Docs: https://mangahook-api.vercel.app
//
// Endpoints used:
//   GET /api/search/:query?page=1      → search manga
//   GET /api/manga/:id                 → manga detail + chapter list
//   GET /api/manga/:id/:chapterId      → chapter images

import { useState, useCallback, useRef } from "react";

// const BASE = "https://mangahook-api.vercel.app";
const BASE = "http://localhost:3002";

// ── Types ────────────────────────────────────────────────────────────────────

export interface MhMangaResult {
  id: string;
  title: string;
  image: string;
  chapter?: string;
  description?: string;
}

export interface MhMangaDetail {
  id: string;
  title: string;
  image: string;
  author: string;
  status: string;
  genres: string[];
  view: string;
  chapterList: MhChapter[];
}

export interface MhChapter {
  id: string;          // e.g. "chapter-139"
  path: string;        // e.g. "/chapter/manga-oa952283/chapter-139"
  name: string;        // e.g. "Vol.34 Chapter 139: Moving Toward..."
  view: string;
  createdAt: string;
}

export interface MhPage {
  pageNum: number;
  imageUrl: string;
  title: string;
}

// ── Search hook ──────────────────────────────────────────────────────────────

export function useMangaHook() {
  const [results, setResults]   = useState<MhMangaResult[]>([]);
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState<string | null>(null);
  const [totalPages, setTotalPages] = useState(0);
  const abortRef = useRef<AbortController | null>(null);

  const search = useCallback(async (query: string, page = 1) => {
    if (!query.trim()) { setResults([]); return; }

    abortRef.current?.abort();
    abortRef.current = new AbortController();

    setLoading(true); setError(null);
    try {
      const encoded = encodeURIComponent(query);
      const res = await fetch(`${BASE}/api/search/${encoded}?page=${page}`, {
        signal: abortRef.current.signal,
      });
      if (!res.ok) throw new Error(`MangaHook search error: ${res.status}`);
      const json = await res.json();
      setResults(json.mangaList ?? []);
      setTotalPages(json.metaData?.totalPages ?? 1);
    } catch (err: any) {
      if (err.name === "AbortError") return;
      setError("Could not reach MangaHook API. It may be temporarily unavailable.");
      setResults([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const clear = useCallback(() => {
    abortRef.current?.abort();
    setResults([]); setError(null);
  }, []);

  return { results, loading, error, totalPages, search, clear };
}

// ── Detail + chapters hook ────────────────────────────────────────────────────

export function useMangaHookDetail() {
  const [detail, setDetail]     = useState<MhMangaDetail | null>(null);
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState<string | null>(null);

  const fetchDetail = useCallback(async (mangaId: string) => {
    setLoading(true); setError(null); setDetail(null);
    try {
      const res = await fetch(`${BASE}/api/manga/${mangaId}`);
      if (!res.ok) throw new Error(`MangaHook detail error: ${res.status}`);
      const json = await res.json();

      setDetail({
        id: mangaId,
        title: json.name ?? "Unknown",
        image: json.imageUrl ?? "",
        author: json.author ?? "",
        status: json.status ?? "Ongoing",
        genres: json.genres ?? [],
        view: json.view ?? "0",
        chapterList: (json.chapterList ?? []).reverse(), // oldest first
      });
    } catch {
      setError("Could not load manga details from MangaHook.");
    } finally {
      setLoading(false);
    }
  }, []);

  return { detail, loading, error, fetchDetail };
}

// ── Chapter pages fetch (standalone) ─────────────────────────────────────────

export async function fetchMangaHookPages(mangaId: string, chapterId: string): Promise<MhPage[]> {
  const res = await fetch(`${BASE}/api/manga/${mangaId}/${chapterId}`);
  if (!res.ok) throw new Error(`MangaHook chapter error: ${res.status}`);
  const json = await res.json();
  return (json.images ?? []).map((img: any, i: number) => ({
    pageNum: i + 1,
    imageUrl: img.image,
    title: img.title,
  }));
}