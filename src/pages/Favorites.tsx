import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/layout/Navbar";
import ComicCard from "../components/ui/ComicCard";
import api from "../lib/api";
import { useAuthStore } from "../lib/store";

interface FavItem {
  comicId: number;
  comic: {
    id: number; title: string; slug: string; coverImage?: string;
    status: string; viewCount: number;
    genres?: { genre: { name: string } }[];
  };
}

export default function FavoritesPage() {
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const [favs, setFavs] = useState<FavItem[]>([]);
  const [sort, setSort] = useState<"date" | "alpha">("date");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) { navigate("/login"); return; }
    api.get(`/favorites?sort=${sort}`).then((r) => setFavs(r.data)).finally(() => setLoading(false));
  }, [user, sort, navigate]);

  return (
    <div style={{ minHeight: "100vh" }}>
      <Navbar />
      <div className="page-container" style={{ paddingTop: 32, paddingBottom: 60 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 28 }}>
          <h1 style={{ fontSize: 36 }}>❤️ My Favorites</h1>
          <div style={{ display: "flex", gap: 8 }}>
            {(["date", "alpha"] as const).map((s) => (
              <button
                key={s}
                className="btn"
                onClick={() => setSort(s)}
                style={{
                  background: sort === s ? "var(--accent)" : "var(--bg3)",
                  color: sort === s ? "#fff" : "var(--text2)",
                  border: "1px solid var(--border)",
                  fontSize: 12,
                }}
              >
                {s === "date" ? "📅 By Date" : "🔤 A–Z"}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="loading-spinner"><div className="spinner" /></div>
        ) : favs.length === 0 ? (
          <div style={{ textAlign: "center", padding: "80px 0", color: "var(--text3)" }}>
            <div style={{ fontSize: 48, marginBottom: 12 }}>🤍</div>
            <div style={{ fontFamily: "'Space Mono', monospace" }}>No favorites yet</div>
          </div>
        ) : (
          <div className="grid-comics">
            {favs.map((f, i) => (
              <ComicCard key={f.comicId} comic={f.comic} index={i} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}