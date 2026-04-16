import React, { useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import Navbar from "../../components/layout/Navbar";
import api from "../../lib/api";

export default function AddChapterManual() {
  const { comicId } = useParams();
  const navigate = useNavigate();

  const [title, setTitle]           = useState("");
  const [chapterNum, setChapterNum] = useState("");
  const [pages, setPages]           = useState<string[]>([""]);
  const [loading, setLoading]       = useState(false);
  const [error, setError]           = useState("");

  const addPage    = () => setPages((p) => [...p, ""]);
  const removePage = (i: number) => setPages((p) => p.filter((_, idx) => idx !== i));
  const updatePage = (i: number, val: string) =>
    setPages((p) => { const n = [...p]; n[i] = val; return n; });

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
      <div className="page-container" style={{ paddingTop: 40, paddingBottom: 60, maxWidth: 720 }}>

        {/* Breadcrumb */}
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 24, fontFamily: "'Space Mono', monospace", fontSize: 12, color: "var(--text3)" }}>
          <Link to={`/publish-chapter/${comicId}`} style={{ color: "var(--text3)" }}>Add Chapter</Link>
          <span>›</span>
          <span style={{ color: "var(--text2)" }}>Manual</span>
        </div>

        <div style={{ marginBottom: 28 }}>
          <div style={{ display: "inline-flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
            <div style={{
              width: 38, height: 38, borderRadius: 10,
              background: "rgba(230,57,70,0.1)", border: "1px solid rgba(230,57,70,0.3)",
              display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18,
            }}>✏️</div>
            <h1 style={{ fontSize: 28 }}>Add Chapter Manually</h1>
          </div>
          <p style={{ color: "var(--text2)", fontSize: 14 }}>Enter chapter details and paste image URLs for each page.</p>
        </div>

        <div style={{ background: "var(--bg2)", border: "1px solid var(--border)", borderRadius: "var(--radius-lg)", padding: 32 }}>
          <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 20 }}>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
              <div className="form-group">
                <label>Chapter Number *</label>
                <input className="input" type="number" step="0.1" placeholder="1, 1.5, 2..." value={chapterNum} onChange={(e) => setChapterNum(e.target.value)} required />
              </div>
              <div className="form-group">
                <label>Chapter Title *</label>
                <input className="input" placeholder="e.g. The Beginning" value={title} onChange={(e) => setTitle(e.target.value)} required />
              </div>
            </div>

            <div className="form-group">
              <label>Pages (Image URLs) — {pages.filter(p => p.trim()).length} added</label>
              <div style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 4 }}>
                {pages.map((url, i) => (
                  <div key={i} style={{ display: "flex", gap: 8, alignItems: "center" }}>
                    <span style={{ fontSize: 12, color: "var(--text3)", fontFamily: "'Space Mono', monospace", minWidth: 28, flexShrink: 0 }}>{i + 1}.</span>
                    <input className="input" placeholder="https://image-host.com/page.jpg" value={url} onChange={(e) => updatePage(i, e.target.value)} />
                    {pages.length > 1 && (
                      <button type="button" className="btn btn-ghost" onClick={() => removePage(i)} style={{ color: "var(--accent)", flexShrink: 0 }}>✕</button>
                    )}
                  </div>
                ))}
              </div>
              <button type="button" className="btn btn-outline" onClick={addPage} style={{ marginTop: 10, fontSize: 13 }}>
                + Add Page
              </button>
            </div>

            {error && (
              <div style={{ padding: "10px 14px", background: "rgba(230,57,70,0.1)", border: "1px solid rgba(230,57,70,0.3)", borderRadius: "var(--radius)", color: "var(--accent)", fontSize: 14 }}>
                {error}
              </div>
            )}

            <div style={{ display: "flex", gap: 12, justifyContent: "flex-end", flexWrap: "wrap" }}>
              <Link to={`/publish-chapter/${comicId}`}>
                <button type="button" className="btn btn-outline">← Back</button>
              </Link>
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