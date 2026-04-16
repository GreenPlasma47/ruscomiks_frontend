import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import Navbar from "../components/layout/Navbar";
import api from "../lib/api";
import { useAuthStore } from "../lib/store";

interface Genre { id: number; name: string; slug: string; }

export default function PublishPage() {
  const { id } = useParams(); // if editing
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const [genres, setGenres] = useState<Genre[]>([]);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [coverImage, setCoverImage] = useState("");
  const [status, setStatus] = useState("ongoing");
  const [selectedGenres, setSelectedGenres] = useState<number[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const isEdit = !!id;


  useEffect(() => {
    if (!user || (user.role !== "publisher" && user.role !== "admin")) {
      navigate("/"); return;
    }
    api.get("/genres").then((r) => setGenres(r.data));
    
    if (isEdit) {
      // Change the URL to match the new backend route
      api.get(`/comics/id/${id}`).then((r) => {
        const c = r.data;
        setTitle(c.title); 
        setDescription(c.description);
        setCoverImage(c.coverImage || ""); 
        setStatus(c.status);
        setSelectedGenres(c.genres.map((g: any) => g.genre.id));
      }).catch(err => {
        console.error("Error fetching comic for edit:", err);
        setError("Could not load comic data.");
      });
    }
  }, [user, id, isEdit, navigate]);

  // useEffect(() => {
  //   if (!user || (user.role !== "publisher" && user.role !== "admin")) {
  //     navigate("/"); return;
  //   }
  //   api.get("/genres").then((r) => setGenres(r.data));
  //   if (isEdit) {
  //     api.get(`/comics/${id}`).then((r) => {
  //       const c = r.data;
  //       setTitle(c.title); setDescription(c.description);
  //       setCoverImage(c.coverImage || ""); setStatus(c.status);
  //       setSelectedGenres(c.genres.map((g: any) => g.genre.id));
  //     });
  //   }
  // }, [user, id, isEdit, navigate]);

  const toggleGenre = (gid: number) => {
    setSelectedGenres((prev) => prev.includes(gid) ? prev.filter((x) => x !== gid) : [...prev, gid]);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(""); setLoading(true);
    try {
      const payload = { title, description, coverImage, status, genreIds: selectedGenres };
      if (isEdit) {
        await api.put(`/comics/${id}`, payload);
      } else {
        const r = await api.post("/comics", payload);
        navigate(`/comic/${r.data.slug}`);
        return;
      }
      navigate(-1);
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to save comic");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: "100vh" }}>
      <Navbar />
      <div className="page-container" style={{ paddingTop: 40, paddingBottom: 60, maxWidth: 800 }}>
        <h1 style={{ fontSize: 36, marginBottom: 32 }}>{isEdit ? "Edit Comic" : "Publish New Comic"}</h1>

        <div style={{ background: "var(--bg2)", border: "1px solid var(--border)", borderRadius: "var(--radius-lg)", padding: 32 }}>
          <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 20 }}>
            <div className="form-group">
              <label>Title *</label>
              <input className="input" placeholder="Comic title" value={title} onChange={(e) => setTitle(e.target.value)} required />
            </div>

            <div className="form-group">
              <label>Description *</label>
              <textarea className="input" placeholder="Synopsis, story description..." value={description} onChange={(e) => setDescription(e.target.value)} required style={{ minHeight: 120 }} />
            </div>

            <div className="form-group">
              <label>Cover Image URL</label>
              <input className="input" placeholder="https://..." value={coverImage} onChange={(e) => setCoverImage(e.target.value)} />
              {coverImage && (
                <img src={coverImage} alt="Cover preview" style={{ width: 120, aspectRatio: "2/3", objectFit: "cover", borderRadius: "var(--radius)", marginTop: 8 }} onError={(e) => (e.currentTarget.style.display = "none")} />
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
              <label>Genres</label>
              {genres.length === 0 ? (
                <div style={{ color: "var(--text3)", fontSize: 13, fontFamily: "'Space Mono', monospace" }}>No genres yet (admin can add them)</div>
              ) : (
                <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 4 }}>
                  {genres.map((g) => (
                    <span
                      key={g.id}
                      className={`badge badge-genre ${selectedGenres.includes(g.id) ? "active" : ""}`}
                      onClick={() => toggleGenre(g.id)}
                      style={{ cursor: "pointer", userSelect: "none" }}
                    >
                      {selectedGenres.includes(g.id) ? "✓ " : ""}{g.name}
                    </span>
                  ))}
                </div>
              )}
            </div>

            {error && (
              <div style={{
                padding: "10px 14px", background: "rgba(230,57,70,0.1)",
                border: "1px solid rgba(230,57,70,0.3)", borderRadius: "var(--radius)",
                color: "var(--accent)", fontSize: 14,
              }}>{error}</div>
            )}

            <div style={{ display: "flex", gap: 12, justifyContent: "flex-end" }}>
              <button type="button" className="btn btn-outline" onClick={() => navigate(-1)}>Cancel</button>
              <button type="submit" className="btn btn-primary" disabled={loading} style={{ padding: "10px 28px" }}>
                {loading ? "Saving..." : isEdit ? "Save Changes" : "Publish Comic"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}