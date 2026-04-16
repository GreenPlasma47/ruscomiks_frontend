import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import Navbar from "../../components/layout/Navbar";
import api from "../../lib/api";
import { useAuthStore } from "../../lib/store";

interface Comic {
  id: number; title: string; slug: string;
  status: string; viewCount: number;
  genres: { genre: { name: string } }[];
  _count: { chapters: number; favorites: number; comments: number };
}

export default function PublisherDashboard() {
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const [comics, setComics] = useState<Comic[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user || (user.role !== "publisher" && user.role !== "admin")) { navigate("/"); return; }
    api.get("/comics?limit=100").then((r) => {
      const own = user.role === "admin" ? r.data.comics : r.data.comics.filter((c: any) => c.publisher?.id === user.id);
      setComics(own);
    }).finally(() => setLoading(false));
  }, [user, navigate]);

  return (
    <div style={{ minHeight: "100vh" }}>
      <Navbar />
      <div className="page-container" style={{ paddingTop: 32, paddingBottom: 60 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 32 }}>
          <div>
            <h1 style={{ fontSize: 36 }}>My Comics</h1>
            <p style={{ color: "var(--text2)", marginTop: 4 }}>Manage your published works</p>
          </div>
          <Link to="/publish">
            <button className="btn btn-primary" style={{ fontSize: 15, padding: "12px 24px" }}>+ New Comic</button>
          </Link>
        </div>

        {loading ? (
          <div className="loading-spinner"><div className="spinner" /></div>
        ) : comics.length === 0 ? (
          <div style={{ textAlign: "center", padding: "80px 0" }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>📖</div>
            <h2 style={{ fontSize: 24, marginBottom: 8 }}>No comics yet</h2>
            <p style={{ color: "var(--text2)", marginBottom: 24 }}>Start publishing your first manga or comic</p>
            <Link to="/publish">
              <button className="btn btn-primary">Publish Now</button>
            </Link>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            {comics.map((c) => (
              <div key={c.id} style={{
                display: "flex", gap: 20, alignItems: "center",
                background: "var(--card)", border: "1px solid var(--border)",
                borderRadius: "var(--radius-lg)", padding: 20, flexWrap: "wrap",
              }}>
                <div style={{ flex: 1, minWidth: 200 }}>
                  <Link to={`/comic/${c.slug}`}>
                    <div style={{ fontWeight: 700, fontSize: 18, marginBottom: 6, color: "var(--text)" }}>{c.title}</div>
                  </Link>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 8 }}>
                    <span className={`badge badge-${c.status}`}>{c.status}</span>
                    {c.genres.slice(0, 3).map((g) => <span key={g.genre.name} className="badge badge-genre">{g.genre.name}</span>)}
                  </div>
                  <div style={{ display: "flex", gap: 20, color: "var(--text3)", fontSize: 13, fontFamily: "'Space Mono', monospace" }}>
                    <span>👁 {c.viewCount.toLocaleString()}</span>
                    <span>❤️ {c._count?.favorites || 0}</span>
                    <span>💬 {c._count?.comments || 0}</span>
                  </div>
                </div>
                <div style={{ display: "flex", gap: 10 }}>
                  <Link to={`/comic/${c.slug}`}>
                    <button className="btn btn-outline" style={{ fontSize: 13 }}>View</button>
                  </Link>
                  <Link to={`/edit-comic/${c.id}`}>
                    <button className="btn btn-outline" style={{ fontSize: 13 }}>Edit</button>
                  </Link>
                  <Link to={`/publish-chapter/${c.id}`}>
                    <button className="btn btn-primary" style={{ fontSize: 13 }}>+ Chapter</button>
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}