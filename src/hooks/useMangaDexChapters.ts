// hooks/useMangaDexChapters.ts
// Fetches chapters and page images for a specific MangaDex manga.
// Endpoints used:
//   GET https://api.mangadex.org/manga/{mangaId}/feed  → chapter list
//   GET https://api.mangadex.org/at-home/server/{chapterId} → page image URLs

import { useState, useCallback } from "react";

const BASE = "https://api.mangadex.org";

export interface MdChapter {
  id: string;
  chapterNum: string;   // e.g. "1", "1.5", "null"
  title: string;
  volume: string | null;
  language: string;
  pages: number;
  publishedAt: string;
}

export interface MdPage {
  pageNum: number;
  imageUrl: string;
}

export function useMangaDexChapters() {
  const [chapters, setChapters]     = useState<MdChapter[]>([]);
  const [loading, setLoading]       = useState(false);
  const [error, setError]           = useState<string | null>(null);

  // Fetch chapter list for a manga
  const fetchChapters = useCallback(async (mangaDexMangaId: string, language = "en") => {
    setLoading(true); setError(null); setChapters([]);
    try {
      // MangaDex paginates at 500 max — fetch first 500
      const params = new URLSearchParams({
        "translatedLanguage[]": language,
        limit: "500",
        "order[chapter]": "asc",
        "contentRating[]": "safe",
      });
      const res = await fetch(`${BASE}/manga/${mangaDexMangaId}/feed?${params}`);
      if (!res.ok) throw new Error(`MangaDex feed error: ${res.status}`);
      const json = await res.json();

      const mapped: MdChapter[] = (json.data ?? []).map((ch: any) => ({
        id: ch.id,
        chapterNum: ch.attributes.chapter ?? "0",
        title: ch.attributes.title || `Chapter ${ch.attributes.chapter}`,
        volume: ch.attributes.volume,
        language: ch.attributes.translatedLanguage,
        pages: ch.attributes.pages ?? 0,
        publishedAt: ch.attributes.publishAt,
      }));

      // Deduplicate: keep only the first occurrence of each chapter number
      const seen = new Set<string>();
      const deduped = mapped.filter((ch) => {
        if (seen.has(ch.chapterNum)) return false;
        seen.add(ch.chapterNum);
        return true;
      });

      setChapters(deduped);
    } catch (err: any) {
      setError("Could not load chapters from MangaDex.");
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch page image URLs for a single chapter
  const fetchPages = useCallback(async (chapterId: string): Promise<MdPage[]> => {
    const res = await fetch(`${BASE}/at-home/server/${chapterId}`);
    if (!res.ok) throw new Error(`at-home error: ${res.status}`);
    const json = await res.json();

    const baseUrl    = json.baseUrl;
    const hash       = json.chapter.hash;
    const filenames: string[] = json.chapter.data; // original quality

    return filenames.map((filename, i) => ({
      pageNum: i + 1,
      imageUrl: `${baseUrl}/data/${hash}/${filename}`,
    }));
  }, []);

  const clearChapters = useCallback(() => {
    setChapters([]); setError(null);
  }, []);

  return { chapters, loading, error, fetchChapters, fetchPages, clearChapters };
}