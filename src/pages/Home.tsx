import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import Navbar from "../components/layout/Navbar";
import HeroCarousel from "../components/ui/HeroCarousel";
import ComicCard from "../components/ui/ComicCard";
import api from "../lib/api";

interface Comic {
  id: number; title: string; slug: string; coverImage?: string;
  status: string; viewCount: number;
  genres?: { genre: { name: string } }[];
}

interface Genre { id: number; name: string; slug: string; }

export default function HomePage() {
  const [popular, setPopular] = useState<Comic[]>([]);
  const [newest, setNewest] = useState<Comic[]>([]);
  const [genres, setGenres] = useState<Genre[]>([]);
  const [search, setSearch] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    api.get("/comics?sort=popular&limit=12").then((r) => setPopular(r.data.comics));
    api.get("/comics?sort=newest&limit=12").then((r) => setNewest(r.data.comics));
    api.get("/genres").then((r) => setGenres(r.data));
  }, []);

  const handleSearch = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (search.trim()) navigate(`/browse?search=${encodeURIComponent(search)}`);
};

  return (
    <div style={{ minHeight: "100vh", background: "var(--bg)" }}>
      <Navbar />

      {}
      <div style={{
        background: "var(--bg)",
        borderBottom: "1px solid var(--border)",
        padding: "18px 0",
        textAlign: "center",
      }}>
        <h1 className="site-title" style={{ fontSize: "clamp(40px, 8vw, 80px)" }}>
          RUSCOMIKS
        </h1>
        <p style={{ color: "var(--text3)", fontSize: 13, fontFamily: "'Space Mono', monospace", marginTop: 4 }}>
          Your universe of manga &amp; comics
        </p>
      </div>

      {}
      <HeroCarousel />

      {}
      <div style={{
        background: "var(--bg2)", borderBottom: "1px solid var(--border)",
        padding: "20px 0",
      }}>
        <div className="page-container">
          <form onSubmit={handleSearch} style={{ display: "flex", gap: 12, maxWidth: 640, margin: "0 auto" }}>
            <input
              className="input"
              placeholder="Search manga, comics, titles..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{ flex: 1, fontSize: 15 }}
            />
            <button type="submit" className="btn btn-primary" style={{ flexShrink: 0 }}>
              Search
            </button>
          </form>

          {}
          {genres.length > 0 && (
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8, justifyContent: "center", marginTop: 14 }}>
              {genres.slice(0, 16).map((g) => (
                <Link key={g.id} to={`/browse?genre=${g.slug}`}>
                  <span className="badge badge-genre">{g.name}</span>
                </Link>
              ))}
              <Link to="/genres">
                <span className="badge" style={{ background: "var(--bg4)", color: "var(--text2)", border: "1px solid var(--border)" }}>
                  All Genres →
                </span>
              </Link>
            </div>
          )}
        </div>
      </div>

      {}
      <Section title="🔥 Most Popular" link="/browse?sort=popular" comics={popular} />

      {}
      <Section title="✨ Latest Releases" link="/browse?sort=newest" comics={newest} />

      {}
      <footer style={{
        borderTop: "1px solid var(--border)", padding: "32px 0",
        textAlign: "center", color: "var(--text3)",
        fontFamily: "'Space Mono', monospace", fontSize: 12, marginTop: 40,
      }}>
        <span className="site-title" style={{ fontSize: 24 }}>RUSCOMIKS</span>
        <p style={{ marginTop: 8 }}>© {new Date().getFullYear()} — All rights reserved</p>
      </footer>
    </div>
  );
}

function Section({ title, link, comics }: { title: string; link: string; comics: Comic[] }) {
  return (
    <section style={{ padding: "40px 0" }}>
      <div className="page-container">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
          <h2 style={{ fontSize: 28, color: "var(--text)" }}>{title}</h2>
          <Link to={link}>
            <span style={{ fontSize: 13, fontFamily: "'Space Mono', monospace", color: "var(--accent)" }}>
              View All →
            </span>
          </Link>
        </div>
        {comics.length > 0 ? (
          <div className="grid-comics">
            {comics.map((c, i) => <ComicCard key={c.id} comic={c} index={i} />)}
          </div>
        ) : (
          <div className="loading-spinner"><div className="spinner" /></div>
        )}
      </div>
    </section>
  );
}