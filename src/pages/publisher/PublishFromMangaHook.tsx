import React, { useEffect, useState, useRef } from "react";
import { useNavigate, Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import Navbar from "../../components/layout/Navbar";
import api from "../../lib/api";
import { useAuthStore } from "../../lib/store";
import { useMangaHook, useMangaHookDetail, MhMangaResult } from "../../hooks/useMangaHook";

interface Genre { id: number; name: string; slug: string; }
type Step = "search" | "confirm" | "form" | "done";

const STATUS_MAP: Record<string, string> = {
  ongoing: "ongoing", completed: "completed",
  Ongoing: "ongoing", Completed: "completed",
  hiatus: "hiatus", Hiatus: "hiatus",
};

export default function PublishFromMangaHook() {
  const { user } = useAuthStore();
  const navigate = useNavigate();

  const { results, loading: searchLoading, error: searchError, search, clear } = useMangaHook();
  const { detail, loading: detailLoading, error: detailError, fetchDetail } = useMangaHookDetail();

  const [step, setStep]                         = useState<Step>("search");
  const [query, setQuery]                       = useState("");
  const [selected, setSelected]                 = useState<MhMangaResult | null>(null);
  const [genres, setGenres]                     = useState<Genre[]>([]);

  // Form state
  const [title, setTitle]                       = useState("");
  const [author, setAuthor]                     = useState("");
  const [description, setDescription]           = useState("");
  const [coverImage, setCoverImage]             = useState("");
  const [status, setStatus]                     = useState("ongoing");
  const [selectedGenres, setSelectedGenres]     = useState<number[]>([]);

  const [submitting, setSubmitting]             = useState(false);
  const [submitError, setSubmitError]           = useState("");
  const [publishedSlug, setPublishedSlug]       = useState("");
  const [publishedId, setPublishedId]           = useState(0);

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!user || (user.role !== "publisher" && user.role !== "admin")) {
      navigate("/"); return;
    }
    api.get("/genres").then((r) => setGenres(r.data));
  }, [user, navigate]);

  const handleQueryChange = (val: string) => {
    setQuery(val);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (!val.trim()) { clear(); return; }
    debounceRef.current = setTimeout(() => search(val), 500);
  };

  const handleSelect = async (manga: MhMangaResult) => {
    setSelected(manga);
    await fetchDetail(manga.id);
    setStep("confirm");
  };

  const handleConfirm = () => {
    if (!detail) return;
    setTitle(detail.title);
    setAuthor(detail.author);
    setDescription(""); // MangaHook detail doesn't expose description
    setCoverImage(detail.image);
    setStatus(STATUS_MAP[detail.status] ?? "ongoing");

    // Auto-match genres
    const detailGenres = detail.genres.map((g) => g.toLowerCase());
    const matched = genres.filter((g) => detailGenres.includes(g.name.toLowerCase())).map((g) => g.id);
    setSelectedGenres(matched);

    setStep("form");
  };

  const toggleGenre = (gid: number) =>
    setSelectedGenres((prev) => prev.includes(gid) ? prev.filter(x => x !== gid) : [...prev, gid]);

  const handlePublish = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError(""); setSubmitting(true);
    try {
      const r = await api.post("/comics", { title, author, description, coverImage, status, genreIds: selectedGenres });
      setPublishedSlug(r.data.slug);
      setPublishedId(r.data.id);
      setStep("done");
    } catch (err: any) {
      setSubmitError(err.response?.data?.message || "Failed to publish");
    } finally {
      setSubmitting(false);
    }
  };

  const STEPS = [
    { key: "search",  label: "1. Search",  icon: "🔍" },
    { key: "confirm", label: "2. Confirm", icon: "📖" },
    { key: "form",    label: "3. Details", icon: "✏️" },
    { key: "done",    label: "4. Done",    icon: "✅" },
  ];
  const stepIndex = STEPS.findIndex(s => s.key === step);

  return (
    <div style={{ minHeight: "100vh" }}>
      <Navbar />
      <div className="page-container" style={{ paddingTop: 40, paddingBottom: 80, maxWidth: 900 }}>

        {/* Breadcrumb */}
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 24, fontFamily: "'Space Mono', monospace", fontSize: 12, color: "var(--text3)" }}>
          <Link to="/publish" style={{ color: "var(--text3)" }}>Publish</Link>
          <span>›</span>
          <span style={{ color: "var(--text2)" }}>From MangaHook</span>
        </div>

        {/* Header */}
        <div style={{ marginBottom: 28 }}>
          <div style={{ display: "inline-flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
            <div style={{ width: 40, height: 40, borderRadius: 10, background: "rgba(99,102,241,0.1)", border: "1px solid rgba(99,102,241,0.3)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20 }}>🪝</div>
            <h1 style={{ fontSize: 32 }}>Import from MangaHook</h1>
          </div>
          <p style={{ color: "var(--text2)", fontSize: 14 }}>Search MangaHook's scraped library, select a title, and publish it to Ruscomiks.</p>
        </div>

        {/* Step indicator */}
        <div style={{ display: "flex", gap: 0, marginBottom: 36, borderRadius: "var(--radius-lg)", overflow: "hidden", border: "1px solid var(--border)" }}>
          {STEPS.map((s, i) => (
            <div key={s.key} style={{
              flex: 1, padding: "10px 6px", textAlign: "center",
              background: step === s.key ? "#6366f1" : stepIndex > i ? "rgba(99,102,241,0.15)" : "var(--bg2)",
              color: step === s.key ? "#fff" : stepIndex > i ? "#6366f1" : "var(--text3)",
              fontSize: 11, fontFamily: "'Space Mono', monospace", fontWeight: 700,
              borderRight: i < 3 ? "1px solid var(--border)" : "none", transition: "all 0.3s",
            }}>
              <div style={{ fontSize: 16, marginBottom: 2 }}>{s.icon}</div>
              {s.label}
            </div>
          ))}
        </div>

        {/* ══ STEP 1: Search ══════════════════════════════════════════════ */}
        {step === "search" && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <div style={{ background: "var(--bg2)", border: "1px solid var(--border)", borderRadius: "var(--radius-lg)", padding: 24, marginBottom: 20 }}>
              <div style={{ position: "relative" }}>
                <input className="input" placeholder="Search MangaHook — Attack on Titan, Naruto, One Piece..." value={query} onChange={(e) => handleQueryChange(e.target.value)} autoFocus style={{ paddingRight: 48 }} />
                {searchLoading && (
                  <div style={{ position: "absolute", right: 14, top: "50%", transform: "translateY(-50%)" }}>
                    <div className="spinner" style={{ width: 18, height: 18, borderWidth: 2 }} />
                  </div>
                )}
              </div>
              {searchError && (
                <div style={{ marginTop: 12, padding: "10px 14px", background: "rgba(230,57,70,0.1)", border: "1px solid rgba(230,57,70,0.3)", borderRadius: "var(--radius)", color: "var(--accent)", fontSize: 13 }}>
                  {searchError}
                </div>
              )}
            </div>

            {!query.trim() && (
              <div style={{ textAlign: "center", padding: "48px 0", color: "var(--text3)" }}>
                <div style={{ fontSize: 40, marginBottom: 12 }}>🪝</div>
                <div style={{ fontFamily: "'Space Mono', monospace", fontSize: 14 }}>Start typing to search the MangaHook library</div>
              </div>
            )}

            {query.trim() && !searchLoading && results.length === 0 && !searchError && (
              <div style={{ textAlign: "center", padding: "40px 0", color: "var(--text3)" }}>
                <div style={{ fontSize: 36, marginBottom: 10 }}>📭</div>
                <div style={{ fontFamily: "'Space Mono', monospace" }}>No results for "{query}"</div>
              </div>
            )}

            {results.length > 0 && (
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(140px, 1fr))", gap: 16 }}>
                {results.map((manga) => (
                  <motion.button key={manga.id} type="button" onClick={() => handleSelect(manga)}
                    initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
                    style={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: "var(--radius-lg)", padding: 0, cursor: "pointer", textAlign: "left", overflow: "hidden", transition: "all 0.2s" }}
                    onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.borderColor = "#6366f1"; (e.currentTarget as HTMLButtonElement).style.transform = "translateY(-3px)"; (e.currentTarget as HTMLButtonElement).style.boxShadow = "0 8px 24px rgba(99,102,241,0.2)"; }}
                    onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.borderColor = "var(--border)"; (e.currentTarget as HTMLButtonElement).style.transform = "translateY(0)"; (e.currentTarget as HTMLButtonElement).style.boxShadow = "none"; }}
                  >
                    <div style={{ aspectRatio: "2/3", overflow: "hidden", background: "var(--bg4)" }}>
                      {manga.image ? (
                        <img src={manga.image} alt={manga.title} style={{ width: "100%", height: "100%", objectFit: "cover" }} loading="lazy" />
                      ) : (
                        <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 32, color: "var(--text3)" }}>🪝</div>
                      )}
                    </div>
                    <div style={{ padding: "10px 12px" }}>
                      <div style={{ fontSize: 12, fontWeight: 700, color: "var(--text)", lineHeight: 1.4, overflow: "hidden", textOverflow: "ellipsis", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", marginBottom: 4 }}>
                        {manga.title}
                      </div>
                      {manga.chapter && (
                        <div style={{ fontSize: 10, color: "var(--text3)", fontFamily: "'Space Mono', monospace", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                          Latest: {manga.chapter}
                        </div>
                      )}
                    </div>
                  </motion.button>
                ))}
              </div>
            )}
          </motion.div>
        )}

        {/* ══ STEP 2: Confirm ═════════════════════════════════════════════ */}
        {step === "confirm" && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            {detailLoading && <div className="loading-spinner"><div className="spinner" /></div>}
            {detailError && (
              <div style={{ padding: "12px 16px", background: "rgba(230,57,70,0.1)", border: "1px solid rgba(230,57,70,0.3)", borderRadius: "var(--radius)", color: "var(--accent)", marginBottom: 20 }}>{detailError}</div>
            )}

            {detail && !detailLoading && (
              <>
                <div style={{ display: "flex", gap: 28, flexWrap: "wrap", background: "var(--bg2)", border: "1px solid var(--border)", borderRadius: "var(--radius-lg)", padding: 28, marginBottom: 20 }}>
                  {/* Cover */}
                  <div style={{ flexShrink: 0, width: 160 }}>
                    {detail.image ? (
                      <img src={detail.image} alt={detail.title} style={{ width: "100%", aspectRatio: "2/3", objectFit: "cover", borderRadius: "var(--radius-lg)", boxShadow: "0 8px 32px rgba(0,0,0,0.5)" }} />
                    ) : (
                      <div style={{ width: "100%", aspectRatio: "2/3", background: "var(--bg4)", borderRadius: "var(--radius-lg)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 40 }}>🪝</div>
                    )}
                  </div>

                  {/* Info */}
                  <div style={{ flex: 1, minWidth: 220 }}>
                    <h2 style={{ fontSize: "clamp(18px, 3vw, 28px)", marginBottom: 8 }}>{detail.title}</h2>
                    {detail.author && (
                      <p style={{ color: "var(--text2)", fontSize: 13, marginBottom: 10 }}>
                        by <strong style={{ color: "var(--text)" }}>{detail.author}</strong>
                      </p>
                    )}
                    <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 12 }}>
                      <span className={`badge badge-${STATUS_MAP[detail.status] ?? "ongoing"}`}>{detail.status}</span>
                      <span style={{ fontSize: 12, color: "var(--text3)", fontFamily: "'Space Mono', monospace", alignSelf: "center" }}>
                        👁 {detail.view} views
                      </span>
                      <span style={{ fontSize: 12, color: "var(--text3)", fontFamily: "'Space Mono', monospace", alignSelf: "center" }}>
                        📚 {detail.chapterList.length} chapters
                      </span>
                    </div>

                    {detail.genres.length > 0 && (
                      <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 14 }}>
                        {detail.genres.slice(0, 10).map(g => (
                          <span key={g} className="badge badge-genre" style={{ fontSize: 10 }}>{g}</span>
                        ))}
                      </div>
                    )}

                    {/* Auto-match notice */}
                    {(() => {
                      const dg = detail.genres.map(g => g.toLowerCase());
                      const matched = genres.filter(g => dg.includes(g.name.toLowerCase()));
                      return matched.length > 0 ? (
                        <div style={{ padding: "8px 14px", background: "rgba(6,214,160,0.08)", border: "1px solid rgba(6,214,160,0.2)", borderRadius: "var(--radius)", fontSize: 12, color: "var(--success)", fontFamily: "'Space Mono', monospace" }}>
                          ✓ {matched.length} genre{matched.length !== 1 ? "s" : ""} will be auto-matched: {matched.map(g => g.name).join(", ")}
                        </div>
                      ) : null;
                    })()}
                  </div>
                </div>

                <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
                  <button type="button" className="btn btn-outline" onClick={() => { setSelected(null); setStep("search"); }}>← Back</button>
                  <button type="button" className="btn" onClick={handleConfirm} style={{ background: "#6366f1", color: "#fff", padding: "10px 28px" }}>
                    Use This Manga → Edit Details
                  </button>
                </div>
              </>
            )}
          </motion.div>
        )}

        {/* ══ STEP 3: Form ════════════════════════════════════════════════ */}
        {step === "form" && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            {detail && (
              <div style={{ display: "flex", gap: 12, alignItems: "center", padding: "12px 18px", marginBottom: 20, background: "rgba(99,102,241,0.06)", border: "1px solid rgba(99,102,241,0.2)", borderRadius: "var(--radius-lg)" }}>
                {detail.image && <img src={detail.image} alt="" style={{ width: 36, height: 48, objectFit: "cover", borderRadius: 6, flexShrink: 0 }} />}
                <div>
                  <div style={{ fontSize: 11, color: "#6366f1", fontFamily: "'Space Mono', monospace", fontWeight: 700 }}>🪝 IMPORTED FROM MANGAHOOK</div>
                  <div style={{ fontSize: 14, fontWeight: 700 }}>{detail.title}</div>
                  <div style={{ fontSize: 12, color: "var(--text2)" }}>You can edit any field before publishing</div>
                </div>
                <button type="button" className="btn btn-ghost" onClick={() => setStep("confirm")} style={{ marginLeft: "auto", fontSize: 12, flexShrink: 0 }}>← Change</button>
              </div>
            )}

            <div style={{ background: "var(--bg2)", border: "1px solid var(--border)", borderRadius: "var(--radius-lg)", padding: 32 }}>
              <form onSubmit={handlePublish} style={{ display: "flex", flexDirection: "column", gap: 20 }}>

                <div className="form-group">
                  <label>Title *</label>
                  <input className="input" value={title} onChange={(e) => setTitle(e.target.value)} required />
                </div>

                <div className="form-group">
                  <label>Author *</label>
                  <input className="input" value={author} onChange={(e) => setAuthor(e.target.value)} required />
                </div>

                <div className="form-group">
                  <label>Description *</label>
                  <textarea className="input" value={description} onChange={(e) => setDescription(e.target.value)} required placeholder="Add a synopsis or description..." style={{ minHeight: 120 }} />
                  <div style={{ fontSize: 12, color: "var(--text3)", fontFamily: "'Space Mono', monospace", marginTop: 4 }}>
                    ℹ️ MangaHook doesn't provide descriptions — add your own
                  </div>
                </div>

                <div className="form-group">
                  <label>Cover Image URL</label>
                  <input className="input" value={coverImage} onChange={(e) => setCoverImage(e.target.value)} placeholder="https://..." />
                  {coverImage && (
                    <img src={coverImage} alt="Cover" style={{ width: 90, aspectRatio: "2/3", objectFit: "cover", borderRadius: "var(--radius)", marginTop: 10, border: "1px solid var(--border)" }} onError={(e) => ((e.currentTarget as HTMLImageElement).style.display = "none")} />
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
                    <div style={{ color: "var(--text3)", fontSize: 13 }}>No genres yet</div>
                  ) : (
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 4 }}>
                      {genres.map((g) => (
                        <span key={g.id} className={`badge badge-genre ${selectedGenres.includes(g.id) ? "active" : ""}`} onClick={() => toggleGenre(g.id)} style={{ cursor: "pointer", userSelect: "none" }}>
                          {selectedGenres.includes(g.id) ? "✓ " : ""}{g.name}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                {submitError && (
                  <div style={{ padding: "10px 14px", background: "rgba(230,57,70,0.1)", border: "1px solid rgba(230,57,70,0.3)", borderRadius: "var(--radius)", color: "var(--accent)", fontSize: 14 }}>{submitError}</div>
                )}

                <div style={{ display: "flex", gap: 12, justifyContent: "flex-end", flexWrap: "wrap" }}>
                  <button type="button" className="btn btn-outline" onClick={() => setStep("confirm")}>← Back</button>
                  <button type="submit" className="btn" disabled={submitting} style={{ background: "#6366f1", color: "#fff", padding: "10px 32px" }}>
                    {submitting ? "Publishing..." : "Publish to Ruscomiks →"}
                  </button>
                </div>
              </form>
            </div>
          </motion.div>
        )}

        {/* ══ STEP 4: Done ════════════════════════════════════════════════ */}
        {step === "done" && (
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} style={{ textAlign: "center", padding: "60px 24px" }}>
            <div style={{ fontSize: 64, marginBottom: 20 }}>🎉</div>
            <h2 style={{ fontSize: 36, marginBottom: 12 }}>Published!</h2>
            <p style={{ color: "var(--text2)", fontSize: 16, marginBottom: 32 }}>
              <strong style={{ color: "var(--text)" }}>{title}</strong> is now live on Ruscomiks.
            </p>
            <div style={{ display: "flex", gap: 14, justifyContent: "center", flexWrap: "wrap" }}>
              <Link to={`/comic/${publishedSlug}`}>
                <button className="btn btn-outline" style={{ fontSize: 14 }}>View Comic</button>
              </Link>
              <Link to={`/publish-chapter/${publishedId}`}>
                <button className="btn" style={{ background: "#6366f1", color: "#fff", fontSize: 14, padding: "12px 28px" }}>
                  + Add Chapters →
                </button>
              </Link>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}