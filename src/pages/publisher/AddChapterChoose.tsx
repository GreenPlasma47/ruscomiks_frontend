import React, { useEffect, useState } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import { motion } from "framer-motion";
import Navbar from "../../components/layout/Navbar";
import api from "../../lib/api";
import { useAuthStore } from "../../lib/store";

interface Comic { id: number; title: string; slug: string; coverImage?: string; }

export default function AddChapterChoose() {
  const { comicId } = useParams();
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const [comic, setComic] = useState<Comic | null>(null);

  useEffect(() => {
    if (!user || (user.role !== "publisher" && user.role !== "admin")) { navigate("/"); return; }
    api.get(`/comics/id/${comicId}`).then((r) => setComic(r.data)).catch(() => navigate("/dashboard"));
  }, [user, comicId, navigate]);

  if (!comic) return <div><Navbar /><div className="loading-spinner"><div className="spinner" /></div></div>;

  const options = [
    {
      path: `/publish-chapter/${comicId}/manual`,
      icon: "✏️",
      title: "Add Chapter Manually",
      description: "Enter the chapter title, number, and paste your own image URLs page by page. Best for original works or self-hosted images.",
      accent: "var(--accent)",
      accentBg: "rgba(230,57,70,0.08)",
      accentBorder: "rgba(230,57,70,0.25)",
      tag: "Manual",
    },
    {
      path: `/publish-chapter/${comicId}/mangadex`,
      icon: "📚",
      title: "Import from MangaDex",
      description: "Browse chapters from MangaDex using a manga UUID or URL. Select a chapter and all page images are imported automatically.",
      accent: "#f97316",
      accentBg: "rgba(249,115,22,0.08)",
      accentBorder: "rgba(249,115,22,0.25)",
      tag: "MangaDex",
    },
    {
      path: `/publish-chapter/${comicId}/mangahook`,
      icon: "🪝",
      title: "Import from MangaHook",
      description: "Browse chapters from the MangaHook library using a manga ID. Select a chapter and all pages are imported automatically.",
      accent: "#6366f1",
      accentBg: "rgba(99,102,241,0.08)",
      accentBorder: "rgba(99,102,241,0.25)",
      tag: "MangaHook",
    },
  ];

  return (
    <div style={{ minHeight: "100vh" }}>
      <Navbar />
      <div className="page-container" style={{ paddingTop: 40, paddingBottom: 80, maxWidth: 1000 }}>

        {/* Breadcrumb */}
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 24, fontFamily: "'Space Mono', monospace", fontSize: 12, color: "var(--text3)" }}>
          <Link to="/dashboard" style={{ color: "var(--text3)" }}>My Comics</Link>
          <span>›</span>
          <Link to={`/comic/${comic.slug}`} style={{ color: "var(--text3)" }}>{comic.title}</Link>
          <span>›</span>
          <span style={{ color: "var(--text2)" }}>Add Chapter</span>
        </div>

        {/* Header */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} style={{ marginBottom: 40 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 8 }}>
            {comic.coverImage && (
              <img src={comic.coverImage} alt={comic.title} style={{ width: 48, height: 64, objectFit: "cover", borderRadius: "var(--radius)", border: "1px solid var(--border)", flexShrink: 0 }} />
            )}
            <div>
              <h1 style={{ fontSize: "clamp(22px, 4vw, 32px)" }}>Add Chapter</h1>
              <p style={{ color: "var(--text2)", fontSize: 14, marginTop: 4 }}>
                Adding to: <strong style={{ color: "var(--text)" }}>{comic.title}</strong>
              </p>
            </div>
          </div>
        </motion.div>

        {/* Option cards */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: 20 }}>
          {options.map((opt, i) => (
            <motion.div key={opt.path} initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}>
              <Link to={opt.path} style={{ display: "block", height: "100%" }}>
                <div
                  style={{ background: "var(--bg2)", border: "1px solid var(--border)", borderRadius: "var(--radius-lg)", padding: 26, height: "100%", cursor: "pointer", transition: "all 0.2s" }}
                  onMouseEnter={(e) => { const el = e.currentTarget as HTMLDivElement; el.style.borderColor = opt.accent; el.style.transform = "translateY(-4px)"; el.style.boxShadow = `0 12px 32px ${opt.accentBg}`; }}
                  onMouseLeave={(e) => { const el = e.currentTarget as HTMLDivElement; el.style.borderColor = "var(--border)"; el.style.transform = "translateY(0)"; el.style.boxShadow = "none"; }}
                >
                  <span style={{ display: "inline-block", padding: "3px 12px", borderRadius: 999, fontSize: 11, fontWeight: 700, fontFamily: "'Space Mono', monospace", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 14, background: opt.accentBg, border: `1px solid ${opt.accentBorder}`, color: opt.accent }}>
                    {opt.tag}
                  </span>
                  <div style={{ width: 48, height: 48, borderRadius: 12, background: opt.accentBg, border: `1px solid ${opt.accentBorder}`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22, marginBottom: 14 }}>
                    {opt.icon}
                  </div>
                  <h2 style={{ fontSize: 19, marginBottom: 8, color: "var(--text)" }}>{opt.title}</h2>
                  <p style={{ color: "var(--text2)", lineHeight: 1.8, fontSize: 13, marginBottom: 20 }}>{opt.description}</p>
                  <div style={{ display: "inline-flex", alignItems: "center", gap: 6, fontFamily: "'Space Mono', monospace", fontSize: 12, fontWeight: 700, color: opt.accent }}>
                    Select →
                  </div>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>

        <div style={{ textAlign: "center", marginTop: 28 }}>
          <Link to={`/comic/${comic.slug}`}>
            <span style={{ fontSize: 13, color: "var(--text3)", fontFamily: "'Space Mono', monospace" }}>← Back to Comic</span>
          </Link>
        </div>
      </div>
    </div>
  );
}