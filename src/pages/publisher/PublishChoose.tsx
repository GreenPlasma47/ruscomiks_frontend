import React from "react";
import { useNavigate, Link } from "react-router-dom";
import { motion } from "framer-motion";
import Navbar from "../../components/layout/Navbar";
import { useAuthStore } from "../../lib/store";

export default function PublishChoose() {
  const { user } = useAuthStore();
  const navigate = useNavigate();

  if (!user || (user.role !== "publisher" && user.role !== "admin")) {
    navigate("/"); return null;
  }

  const options = [
    {
      path: "/publish/manual",
      icon: "✏️",
      title: "Publish Manually",
      description: "Write your own original manga or comic. Fill in the title, description, cover image, and genres yourself — ideal for original works.",
      accent: "var(--accent)",
      accentBg: "rgba(230,57,70,0.08)",
      accentBorder: "rgba(230,57,70,0.25)",
      tag: "Original Work",
    },
    {
      path: "/publish/mangadex",
      icon: "📚",
      title: "Import from MangaDex",
      description: "Search MangaDex's library of 100,000+ titles and import a manga's metadata — title, description, cover, and genres are auto-filled.",
      accent: "#f97316",
      accentBg: "rgba(249,115,22,0.08)",
      accentBorder: "rgba(249,115,22,0.25)",
      tag: "MangaDex",
    },
    {
      path: "/publish/mangahook",
      icon: "🪝",
      title: "Import from MangaHook",
      description: "Search the MangaHook scraped library for manga titles and import their metadata — cover and genres are auto-filled from the source.",
      accent: "#6366f1",
      accentBg: "rgba(99,102,241,0.08)",
      accentBorder: "rgba(99,102,241,0.25)",
      tag: "MangaHook",
    },
  ];

  return (
    <div style={{ minHeight: "100vh" }}>
      <Navbar />
      <div className="page-container" style={{ paddingTop: 60, paddingBottom: 80, maxWidth: 1000 }}>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} style={{ textAlign: "center", marginBottom: 48 }}>
          <h1 style={{ fontSize: "clamp(28px, 5vw, 48px)", marginBottom: 12 }}>Publish a Comic</h1>
          <p style={{ color: "var(--text2)", fontSize: 16, maxWidth: 520, margin: "0 auto" }}>
            Choose how you want to publish — write original content or import from a manga library.
          </p>
        </motion.div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: 20 }}>
          {options.map((opt, i) => (
            <motion.div key={opt.path} initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}>
              <Link to={opt.path} style={{ display: "block", height: "100%" }}>
                <div
                  style={{ background: "var(--bg2)", border: "1px solid var(--border)", borderRadius: "var(--radius-lg)", padding: 28, height: "100%", cursor: "pointer", transition: "all 0.2s" }}
                  onMouseEnter={(e) => { const el = e.currentTarget as HTMLDivElement; el.style.borderColor = opt.accent; el.style.transform = "translateY(-4px)"; el.style.boxShadow = `0 12px 40px ${opt.accentBg}`; }}
                  onMouseLeave={(e) => { const el = e.currentTarget as HTMLDivElement; el.style.borderColor = "var(--border)"; el.style.transform = "translateY(0)"; el.style.boxShadow = "none"; }}
                >
                  <span style={{ display: "inline-block", padding: "3px 12px", borderRadius: 999, fontSize: 11, fontWeight: 700, fontFamily: "'Space Mono', monospace", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 16, background: opt.accentBg, border: `1px solid ${opt.accentBorder}`, color: opt.accent }}>
                    {opt.tag}
                  </span>
                  <div style={{ width: 56, height: 56, borderRadius: 14, background: opt.accentBg, border: `1px solid ${opt.accentBorder}`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 26, marginBottom: 18 }}>
                    {opt.icon}
                  </div>
                  <h2 style={{ fontSize: 22, marginBottom: 10, color: "var(--text)" }}>{opt.title}</h2>
                  <p style={{ color: "var(--text2)", lineHeight: 1.8, fontSize: 14, marginBottom: 24 }}>{opt.description}</p>
                  <div style={{ display: "inline-flex", alignItems: "center", gap: 6, fontFamily: "'Space Mono', monospace", fontSize: 13, fontWeight: 700, color: opt.accent }}>
                    Get Started →
                  </div>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>

        <div style={{ textAlign: "center", marginTop: 36 }}>
          <Link to="/dashboard">
            <span style={{ fontSize: 13, color: "var(--text3)", fontFamily: "'Space Mono', monospace" }}>← Back to My Comics</span>
          </Link>
        </div>
      </div>
    </div>
  );
}