import { useEffect, useState, useCallback } from "react";
import { useSearchParams } from "react-router-dom";
import Navbar from "../components/layout/Navbar";
import ComicCard from "../components/ui/ComicCard";
import api from "../lib/api";

interface Comic {
  id: number; title: string; slug: string; coverImage?: string;
  status: string; viewCount: number;
  genres?: { genre: { name: string } }[];
}
interface Genre { id: number; name: string; slug: string; }

const SORTS = [
  { value: "newest", label: "Newest" },
  { value: "oldest", label: "Oldest" },
  { value: "popular", label: "Most Popular" },
];

export default function BrowsePage() {
  const [params, setParams] = useSearchParams();
  const [comics, setComics] = useState<Comic[]>([]);
  const [genres, setGenres] = useState<Genre[]>([]);
  const [total, setTotal] = useState(0);
  const [pages, setPages] = useState(1);
  const [loading, setLoading] = useState(false);

  const search = params.get("search") || "";
  const genre = params.get("genre") || "";
  const sort = params.get("sort") || "newest";
  const page = Number(params.get("page") || 1);

  const fetchComics = useCallback(async () => {
    setLoading(true);
    try {
      const q = new URLSearchParams({ sort, page: String(page) });
      if (search) q.set("search", search);
      if (genre) q.set("genre", genre);
      const r = await api.get(`/comics?${q}`);
      setComics(r.data.comics);
      setTotal(r.data.total);
      setPages(r.data.pages);
    } finally {
      setLoading(false);
    }
  }, [search, genre, sort, page]);

  useEffect(() => { fetchComics(); }, [fetchComics]);
  useEffect(() => { api.get("/genres").then((r) => setGenres(r.data)); }, []);

  const set = (key: string, val: string) => {
    const next = new URLSearchParams(params);
    next.set(key, val);
    next.set("page", "1");
    setParams(next);
  };

  const clear = (key: string) => {
    const next = new URLSearchParams(params);
    next.delete(key);
    next.set("page", "1");
    setParams(next);
  };

  return (
    <div style={{ minHeight: "100vh" }}>
      <Navbar />
      <div className="page-container" style={{ paddingTop: 32, paddingBottom: 60 }}>
        <h1 style={{ fontSize: 36, marginBottom: 24 }}>Browse</h1>

        {}
        <div style={{
          display: "flex", flexWrap: "wrap", gap: 12, marginBottom: 28,
          padding: 20, background: "var(--bg2)", border: "1px solid var(--border)",
          borderRadius: "var(--radius-lg)",
        }}>
          {}
          <div style={{ flex: 1, minWidth: 220 }}>
            <input
              className="input"
              placeholder="Search title, description..."
              value={search}
              onChange={(e) => set("search", e.target.value)}
            />
          </div>

          {}
          <select
            className="input"
            value={sort}
            onChange={(e) => set("sort", e.target.value)}
            style={{ width: "auto", minWidth: 160 }}
          >
            {SORTS.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
          </select>
        </div>

        {}
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 24 }}>
          <span
            className={`badge badge-genre ${!genre ? "active" : ""}`}
            onClick={() => clear("genre")}
          >
            All
          </span>
          {genres.map((g) => (
            <span
              key={g.id}
              className={`badge badge-genre ${genre === g.slug ? "active" : ""}`}
              onClick={() => genre === g.slug ? clear("genre") : set("genre", g.slug)}
            >
              {g.name}
            </span>
          ))}
        </div>

        {}
        <div style={{ color: "var(--text3)", fontSize: 13, fontFamily: "'Space Mono', monospace", marginBottom: 20 }}>
          {loading ? "Loading..." : `${total.toLocaleString()} result${total !== 1 ? "s" : ""}`}
        </div>

        {}
        {loading ? (
          <div className="loading-spinner"><div className="spinner" /></div>
        ) : comics.length > 0 ? (
          <div className="grid-comics">
            {comics.map((c, i) => <ComicCard key={c.id} comic={c} index={i} />)}
          </div>
        ) : (
          <div style={{ textAlign: "center", padding: "80px 0", color: "var(--text3)" }}>
            <div style={{ fontSize: 48, marginBottom: 12 }}>🔍</div>
            <div style={{ fontFamily: "'Space Mono', monospace" }}>No comics found</div>
          </div>
        )}

        {}
        {pages > 1 && (
          <div style={{ display: "flex", justifyContent: "center", gap: 8, marginTop: 40 }}>
            {Array.from({ length: pages }, (_, i) => i + 1).map((p) => (
              <button
                key={p}
                onClick={() => { const n = new URLSearchParams(params); n.set("page", String(p)); setParams(n); }}
                className="btn"
                style={{
                  background: p === page ? "var(--accent)" : "var(--bg3)",
                  color: p === page ? "#fff" : "var(--text2)",
                  border: "1px solid var(--border)",
                  minWidth: 40,
                }}
              >
                {p}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}