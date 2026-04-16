import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import Navbar from "../components/layout/Navbar";
import api from "../lib/api";

interface Genre { id: number; name: string; slug: string; }

export default function GenresPage() {
  const [genres, setGenres] = useState<Genre[]>([]);

  useEffect(() => { api.get("/genres").then((r) => setGenres(r.data)); }, []);

  return (
    <div style={{ minHeight: "100vh" }}>
      <Navbar />
      <div className="page-container" style={{ paddingTop: 40, paddingBottom: 60 }}>
        <h1 style={{ fontSize: 36, marginBottom: 8 }}>All Genres</h1>
        <p style={{ color: "var(--text2)", marginBottom: 32 }}>Browse comics by genre</p>

        {genres.length === 0 ? (
          <div style={{ color: "var(--text3)", fontFamily: "'Space Mono', monospace" }}>No genres yet</div>
        ) : (
          <div style={{ display: "flex", flexWrap: "wrap", gap: 12 }}>
            {genres.map((g, i) => (
              <Link key={g.id} to={`/browse?genre=${g.slug}`}>
                <div style={{
                  padding: "14px 24px",
                  background: "var(--card)", border: "1px solid var(--border)",
                  borderRadius: "var(--radius-lg)",
                  fontFamily: "'Space Mono', monospace",
                  fontSize: 15, fontWeight: 700,
                  transition: "all 0.2s", cursor: "pointer",
                  animationDelay: `${i * 30}ms`,
                }}
                  onMouseEnter={(e) => { (e.currentTarget as HTMLDivElement).style.borderColor = "var(--accent)"; (e.currentTarget as HTMLDivElement).style.color = "var(--accent)"; }}
                  onMouseLeave={(e) => { (e.currentTarget as HTMLDivElement).style.borderColor = "var(--border)"; (e.currentTarget as HTMLDivElement).style.color = "var(--text)"; }}
                >
                  {g.name}
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}