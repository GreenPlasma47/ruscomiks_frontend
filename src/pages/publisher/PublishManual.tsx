import React, { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import Navbar from "../../components/layout/Navbar";
import api from "../../lib/api";
import { useAuthStore } from "../../lib/store";

interface Genre { id: number; name: string; slug: string; }

export default function PublishManual() {
  const { user } = useAuthStore();
  const navigate = useNavigate();

  const [genres, setGenres]                   = useState<Genre[]>([]);
  const [title, setTitle]                     = useState("");
  const [author, setAuthor]                   = useState("");
  const [description, setDescription]         = useState("");
  const [coverImage, setCoverImage]           = useState("");
  const [status, setStatus]                   = useState("ongoing");
  const [selectedGenres, setSelectedGenres]   = useState<number[]>([]);
  const [loading, setLoading]                 = useState(false);
  const [error, setError]                     = useState("");

  useEffect(() => {
    if (!user || (user.role !== "publisher" && user.role !== "admin")) {
      navigate("/"); return;
    }
    api.get("/genres").then((r) => setGenres(r.data));
  }, [user, navigate]);

  const toggleGenre = (gid: number) =>
    setSelectedGenres((prev) =>
      prev.includes(gid) ? prev.filter((x) => x !== gid) : [...prev, gid]
    );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(""); setLoading(true);
    try {
      const r = await api.post("/comics", {
        title, author, description, coverImage, status, genreIds: selectedGenres,
      });
      navigate(`/comic/${r.data.slug}`);
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to publish comic");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: "100vh" }}>
      <Navbar />
      <div className="page-container" style={{ paddingTop: 40, paddingBottom: 60, maxWidth: 800 }}>

        {/* Breadcrumb */}
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 28, fontFamily: "'Space Mono', monospace", fontSize: 12, color: "var(--text3)" }}>
          <Link to="/publish" style={{ color: "var(--text3)" }}>Publish</Link>
          <span>›</span>
          <span style={{ color: "var(--text2)" }}>Manual</span>
        </div>

        <div style={{ marginBottom: 32 }}>
          <div style={{ display: "inline-flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
            <div style={{
              width: 40, height: 40, borderRadius: 10,
              background: "rgba(230,57,70,0.1)", border: "1px solid rgba(230,57,70,0.3)",
              display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20,
            }}>✏️</div>
            <h1 style={{ fontSize: 32 }}>Publish Manually</h1>
          </div>
          <p style={{ color: "var(--text2)", fontSize: 14 }}>
            Create an original comic or manga with your own content.
          </p>
        </div>

        <div style={{ background: "var(--bg2)", border: "1px solid var(--border)", borderRadius: "var(--radius-lg)", padding: 32 }}>
          <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 20 }}>

            <div className="form-group">
              <label>Title *</label>
              <input className="input" placeholder="Your comic title" value={title} onChange={(e) => setTitle(e.target.value)} required />
            </div>

            <div className="form-group">
              <label>Author *</label>
              <input className="input" placeholder="Your name or pseudonym" value={author} onChange={(e) => setAuthor(e.target.value)} required />
            </div>

            <div className="form-group">
              <label>Description *</label>
              <textarea className="input" placeholder="Synopsis, story overview..." value={description} onChange={(e) => setDescription(e.target.value)} required style={{ minHeight: 120 }} />
            </div>

            <div className="form-group">
              <label>Cover Image URL</label>
              <input className="input" placeholder="https://..." value={coverImage} onChange={(e) => setCoverImage(e.target.value)} />
              {coverImage && (
                <img src={coverImage} alt="Cover preview"
                  style={{ width: 90, aspectRatio: "2/3", objectFit: "cover", borderRadius: "var(--radius)", marginTop: 10, border: "1px solid var(--border)" }}
                  onError={(e) => ((e.currentTarget as HTMLImageElement).style.display = "none")}
                />
              )}
            </div>

            <div className="form-group">
              <label>Status</label>
              <select className="input" value={status} onChange={(e) => setStatus(e.target.value)}>
                <option value="ongoing">Ongoing</option>
                <option value="completed">Completed</option>
                <option value="hiatus">Hiatus</option>
              </select>
            </div>

            <div className="form-group">
              <label>Genres {selectedGenres.length > 0 && <span style={{ color: "var(--accent)", fontWeight: 400 }}>({selectedGenres.length} selected)</span>}</label>
              {genres.length === 0 ? (
                <div style={{ color: "var(--text3)", fontSize: 13, fontFamily: "'Space Mono', monospace" }}>No genres yet — admin can add them</div>
              ) : (
                <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 4 }}>
                  {genres.map((g) => (
                    <span key={g.id} className={`badge badge-genre ${selectedGenres.includes(g.id) ? "active" : ""}`}
                      onClick={() => toggleGenre(g.id)} style={{ cursor: "pointer", userSelect: "none" }}>
                      {selectedGenres.includes(g.id) ? "✓ " : ""}{g.name}
                    </span>
                  ))}
                </div>
              )}
            </div>

            {error && (
              <div style={{ padding: "10px 14px", background: "rgba(230,57,70,0.1)", border: "1px solid rgba(230,57,70,0.3)", borderRadius: "var(--radius)", color: "var(--accent)", fontSize: 14 }}>
                {error}
              </div>
            )}

            <div style={{ display: "flex", gap: 12, justifyContent: "flex-end", flexWrap: "wrap" }}>
              <Link to="/publish"><button type="button" className="btn btn-outline">← Back</button></Link>
              <button type="submit" className="btn btn-primary" disabled={loading} style={{ padding: "10px 32px" }}>
                {loading ? "Publishing..." : "Publish Comic"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}