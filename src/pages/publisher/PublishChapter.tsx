import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Navbar from "../../components/layout/Navbar";
import api from "../../lib/api";

export default function PublishChapter() {
  const { comicId } = useParams();
  const navigate = useNavigate();
  const [title, setTitle] = useState("");
  const [chapterNum, setChapterNum] = useState("");
  const [pages, setPages] = useState<string[]>([""]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const addPage = () => setPages([...pages, ""]);
  const removePage = (i: number) => setPages(pages.filter((_, idx) => idx !== i));
  const updatePage = (i: number, val: string) => {
    const updated = [...pages]; updated[i] = val; setPages(updated);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(""); setLoading(true);
    try {
      await api.post(`/comics/${comicId}/chapters`, {
        title, chapterNum: Number(chapterNum),
        pages: pages.filter((p) => p.trim()),
      });
      navigate(-1);
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to publish chapter");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: "100vh" }}>
      <Navbar />
      <div className="page-container" style={{ paddingTop: 40, paddingBottom: 60, maxWidth: 700 }}>
        <h1 style={{ fontSize: 36, marginBottom: 32 }}>Add Chapter</h1>
        <div style={{ background: "var(--bg2)", border: "1px solid var(--border)", borderRadius: "var(--radius-lg)", padding: 32 }}>
          <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 20 }}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
              <div className="form-group">
                <label>Chapter Number *</label>
                <input className="input" type="number" step="0.1" placeholder="1, 1.5, 2..." value={chapterNum} onChange={(e) => setChapterNum(e.target.value)} required />
              </div>
              <div className="form-group">
                <label>Chapter Title *</label>
                <input className="input" placeholder="Title of this chapter" value={title} onChange={(e) => setTitle(e.target.value)} required />
              </div>
            </div>

            <div className="form-group">
              <label>Pages (Image URLs)</label>
              {pages.map((url, i) => (
                <div key={i} style={{ display: "flex", gap: 8, marginBottom: 8 }}>
                  <span style={{ fontSize: 12, color: "var(--text3)", fontFamily: "'Space Mono', monospace", minWidth: 28, paddingTop: 11 }}>{i + 1}.</span>
                  <input className="input" placeholder="https://image-host.com/page.jpg" value={url} onChange={(e) => updatePage(i, e.target.value)} />
                  {pages.length > 1 && (
                    <button type="button" className="btn btn-ghost" onClick={() => removePage(i)} style={{ color: "var(--accent)", flexShrink: 0 }}>✕</button>
                  )}
                </div>
              ))}
              <button type="button" className="btn btn-outline" onClick={addPage} style={{ marginTop: 4, fontSize: 13 }}>
                + Add Page
              </button>
            </div>

            {error && (
              <div style={{ padding: "10px 14px", background: "rgba(230,57,70,0.1)", border: "1px solid rgba(230,57,70,0.3)", borderRadius: "var(--radius)", color: "var(--accent)", fontSize: 14 }}>{error}</div>
            )}

            <div style={{ display: "flex", gap: 12, justifyContent: "flex-end" }}>
              <button type="button" className="btn btn-outline" onClick={() => navigate(-1)}>Cancel</button>
              <button type="submit" className="btn btn-primary" disabled={loading} style={{ padding: "10px 28px" }}>
                {loading ? "Publishing..." : "Publish Chapter"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}