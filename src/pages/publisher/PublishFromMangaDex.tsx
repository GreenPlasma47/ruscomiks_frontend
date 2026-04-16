import React, { useEffect, useState, useRef } from "react";
import { useNavigate, Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import Navbar from "../../components/layout/Navbar";
import api from "../../lib/api";
import { useAuthStore } from "../../lib/store";
import { useMangaDex, MangaDexResult } from "../../hooks/useMangaDex";

interface Genre { id: number; name: string; slug: string; }

type Step = "search" | "confirm" | "form" | "done";

export default function PublishFromMangaDex() {
  const { user } = useAuthStore();
  const navigate = useNavigate();

  const { results, loading: mdLoading, error: mdError, search, clear } = useMangaDex();

  const [step, setStep]                       = useState<Step>("search");
  const [mdQuery, setMdQuery]                 = useState("");
  const [selected, setSelected]               = useState<MangaDexResult | null>(null);
  const [genres, setGenres]                   = useState<Genre[]>([]);

  // Form fields — pre-filled from MangaDex but editable
  const [title, setTitle]                     = useState("");
  const [description, setDescription]         = useState("");
  const [coverImage, setCoverImage]           = useState("");
  const [author, setAuthor]                   = useState("");
  const [status, setStatus]                   = useState("ongoing");
  const [selectedGenres, setSelectedGenres]   = useState<number[]>([]);
  const [publishedComicSlug, setPublishedComicSlug] = useState("");
  const [publishedComicId, setPublishedComicId] = useState(0);

  const [submitting, setSubmitting]           = useState(false);
  const [error, setError]                     = useState("");

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!user || (user.role !== "publisher" && user.role !== "admin")) {
      navigate("/"); return;
    }
    api.get("/genres").then((r) => setGenres(r.data));
  }, [user, navigate]);

  // ── Debounced search ───────────────────────────────────────────────────
  const handleQueryChange = (val: string) => {
    setMdQuery(val);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (!val.trim()) { clear(); return; }
    debounceRef.current = setTimeout(() => search(val), 500);
  };

  // ── Step 1 → 2: user picks a manga ────────────────────────────────────
  const handleSelect = (manga: MangaDexResult) => {
    setSelected(manga);
    setStep("confirm");
  };

  // ── Step 2 → 3: confirm → fill form ───────────────────────────────────
  const handleConfirm = () => {
    if (!selected) return;

    const statusMap: Record<string, string> = {
      ongoing: "ongoing", completed: "completed",
      hiatus: "hiatus", cancelled: "hiatus",
    };

    setTitle(selected.title);
    setDescription(selected.description.slice(0, 1000));
    setAuthor(selected.authors.join(", "));
    setCoverImage(selected.coverUrl ?? "");
    setStatus(statusMap[selected.status] ?? "ongoing");

    // Auto-match genres by name
    const mdTags = selected.tags.map((t) => t.toLowerCase());
    const matched = genres.filter((g) => mdTags.includes(g.name.toLowerCase())).map((g) => g.id);
    setSelectedGenres(matched);

    setStep("form");
  };

  // ── Step 3 → done: publish ─────────────────────────────────────────────
  const handlePublish = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(""); setSubmitting(true);
    try {
      const r = await api.post("/comics", {
        title, description, author, coverImage, status, genreIds: selectedGenres,
      });
      setPublishedComicSlug(r.data.slug);
      setPublishedComicId(r.data.id);
      setStep("done");
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to publish");
    } finally {
      setSubmitting(false);
    }
  };

  const toggleGenre = (gid: number) =>
    setSelectedGenres((prev) =>
      prev.includes(gid) ? prev.filter((x) => x !== gid) : [...prev, gid]
    );

  // ─────────────────────────────────────────────────────────────────────
  return (
    <div style={{ minHeight: "100vh" }}>
      <Navbar />
      <div className="page-container" style={{ paddingTop: 40, paddingBottom: 80, maxWidth: 900 }}>

        {/* Breadcrumb */}
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 24, fontFamily: "'Space Mono', monospace", fontSize: 12, color: "var(--text3)" }}>
          <Link to="/publish" style={{ color: "var(--text3)" }}>Publish</Link>
          <span>›</span>
          <span style={{ color: "var(--text2)" }}>From MangaDex</span>
        </div>

        {/* Page title */}
        <div style={{ marginBottom: 32 }}>
          <div style={{ display: "inline-flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
            <div style={{
              width: 40, height: 40, borderRadius: 10,
              background: "rgba(249,115,22,0.1)", border: "1px solid rgba(249,115,22,0.3)",
              display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20,
            }}>📚</div>
            <h1 style={{ fontSize: 32 }}>Import from MangaDex</h1>
          </div>
          <p style={{ color: "var(--text2)", fontSize: 14 }}>
            Search the MangaDex library, select a title, review its metadata, then publish it to Ruscomiks.
          </p>
        </div>

        {/* ── Step indicator ─────────────────────────────────────────── */}
        <div style={{ display: "flex", gap: 0, marginBottom: 40, borderRadius: "var(--radius-lg)", overflow: "hidden", border: "1px solid var(--border)" }}>
          {[
            { key: "search",  label: "1. Search",   icon: "🔍" },
            { key: "confirm", label: "2. Confirm",  icon: "📖" },
            { key: "form",    label: "3. Details",  icon: "✏️" },
            { key: "done",    label: "4. Done",     icon: "✅" },
          ].map((s, i) => {
            const steps: Step[] = ["search", "confirm", "form", "done"];
            const active  = step === s.key;
            const passed  = steps.indexOf(step) > i;
            return (
              <div key={s.key} style={{
                flex: 1, padding: "12px 8px", textAlign: "center",
                background: active ? "var(--accent)" : passed ? "rgba(230,57,70,0.15)" : "var(--bg2)",
                color: active ? "#fff" : passed ? "var(--accent)" : "var(--text3)",
                fontSize: 12, fontFamily: "'Space Mono', monospace", fontWeight: 700,
                borderRight: i < 3 ? "1px solid var(--border)" : "none",
                transition: "all 0.3s",
              }}>
                <div style={{ fontSize: 16, marginBottom: 2 }}>{s.icon}</div>
                {s.label}
              </div>
            );
          })}
        </div>

        {/* ══ STEP 1: Search ══════════════════════════════════════════════ */}
        {step === "search" && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <div style={{ background: "var(--bg2)", border: "1px solid var(--border)", borderRadius: "var(--radius-lg)", padding: 28, marginBottom: 24 }}>
              <div style={{ position: "relative" }}>
                <input
                  className="input"
                  placeholder="Search MangaDex — One Piece, Berserk, Vinland Saga, Naruto..."
                  value={mdQuery}
                  onChange={(e) => handleQueryChange(e.target.value)}
                  autoFocus
                  style={{ paddingRight: 48 }}
                />
                {mdLoading && (
                  <div style={{ position: "absolute", right: 14, top: "50%", transform: "translateY(-50%)" }}>
                    <div className="spinner" style={{ width: 18, height: 18, borderWidth: 2 }} />
                  </div>
                )}
              </div>

              {mdError && (
                <div style={{ marginTop: 12, padding: "10px 14px", background: "rgba(230,57,70,0.1)", border: "1px solid rgba(230,57,70,0.3)", borderRadius: "var(--radius)", color: "var(--accent)", fontSize: 13 }}>
                  {mdError}
                </div>
              )}
            </div>

            {/* Results */}
            {!mdQuery.trim() && (
              <div style={{ textAlign: "center", padding: "48px 0", color: "var(--text3)" }}>
                <div style={{ fontSize: 40, marginBottom: 12 }}>🔍</div>
                <div style={{ fontFamily: "'Space Mono', monospace", fontSize: 14 }}>
                  Start typing to search 100,000+ titles
                </div>
              </div>
            )}

            {mdQuery.trim() && !mdLoading && results.length === 0 && !mdError && (
              <div style={{ textAlign: "center", padding: "48px 0", color: "var(--text3)" }}>
                <div style={{ fontSize: 36, marginBottom: 12 }}>📭</div>
                <div style={{ fontFamily: "'Space Mono', monospace", fontSize: 14 }}>
                  No results for "{mdQuery}"
                </div>
              </div>
            )}

            {results.length > 0 && (
              <div style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fill, minmax(140px, 1fr))",
                gap: 16,
              }}>
                {results.map((manga) => (
                  <motion.button
                    key={manga.id}
                    type="button"
                    onClick={() => handleSelect(manga)}
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    style={{
                      background: "var(--card)", border: "1px solid var(--border)",
                      borderRadius: "var(--radius-lg)", padding: 0,
                      cursor: "pointer", textAlign: "left", overflow: "hidden",
                      transition: "border-color 0.2s, transform 0.15s, box-shadow 0.2s",
                    }}
                    onMouseEnter={(e) => {
                      const el = e.currentTarget as HTMLButtonElement;
                      el.style.borderColor = "#f97316";
                      el.style.transform = "translateY(-3px)";
                      el.style.boxShadow = "0 8px 24px rgba(249,115,22,0.2)";
                    }}
                    onMouseLeave={(e) => {
                      const el = e.currentTarget as HTMLButtonElement;
                      el.style.borderColor = "var(--border)";
                      el.style.transform = "translateY(0)";
                      el.style.boxShadow = "none";
                    }}
                  >
                    {/* Cover */}
                    <div style={{ aspectRatio: "2/3", overflow: "hidden", background: "var(--bg4)" }}>
                      {manga.coverUrl ? (
                        <img src={manga.coverUrl} alt={manga.title}
                          style={{ width: "100%", height: "100%", objectFit: "cover" }} loading="lazy" />
                      ) : (
                        <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 32, color: "var(--text3)" }}>📖</div>
                      )}
                    </div>
                    {/* Info */}
                    <div style={{ padding: "10px 12px" }}>
                      <div style={{
                        fontSize: 12, fontWeight: 700, color: "var(--text)", lineHeight: 1.4,
                        overflow: "hidden", textOverflow: "ellipsis",
                        display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical",
                        marginBottom: 4,
                      }}>
                        {manga.title}
                      </div>
                      {manga.authors[0] && (
                        <div style={{ fontSize: 10, color: "var(--text3)", fontFamily: "'Space Mono', monospace", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", marginBottom: 6 }}>
                          {manga.authors[0]}
                        </div>
                      )}
                      <div style={{ display: "flex", gap: 4, alignItems: "center", flexWrap: "wrap" }}>
                        <span className={`badge badge-${manga.status === "completed" ? "completed" : manga.status === "hiatus" || manga.status === "cancelled" ? "hiatus" : "ongoing"}`}
                          style={{ fontSize: 9 }}>
                          {manga.status}
                        </span>
                        {manga.year && <span style={{ fontSize: 9, color: "var(--text3)", fontFamily: "'Space Mono', monospace" }}>{manga.year}</span>}
                      </div>
                    </div>
                  </motion.button>
                ))}
              </div>
            )}
          </motion.div>
        )}

        {/* ══ STEP 2: Confirm ═════════════════════════════════════════════ */}
        {step === "confirm" && selected && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <div style={{
              display: "flex", gap: 28, flexWrap: "wrap",
              background: "var(--bg2)", border: "1px solid var(--border)",
              borderRadius: "var(--radius-lg)", padding: 28, marginBottom: 24,
            }}>
              {/* Cover */}
              <div style={{ flexShrink: 0, width: 160 }}>
                {selected.coverUrl ? (
                  <img src={selected.coverUrl} alt={selected.title}
                    style={{ width: "100%", aspectRatio: "2/3", objectFit: "cover", borderRadius: "var(--radius-lg)", boxShadow: "0 8px 32px rgba(0,0,0,0.5)" }} />
                ) : (
                  <div style={{
                    width: "100%", aspectRatio: "2/3",
                    background: "var(--bg4)", borderRadius: "var(--radius-lg)",
                    display: "flex", alignItems: "center", justifyContent: "center", fontSize: 40,
                  }}>📖</div>
                )}
              </div>

              {/* Details */}
              <div style={{ flex: 1, minWidth: 220 }}>
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 12 }}>
                  <span className={`badge badge-${selected.status === "completed" ? "completed" : "ongoing"}`}>{selected.status}</span>
                  {selected.year && <span style={{ fontSize: 12, color: "var(--text3)", fontFamily: "'Space Mono', monospace", alignSelf: "center" }}>{selected.year}</span>}
                </div>

                <h2 style={{ fontSize: "clamp(20px, 4vw, 32px)", marginBottom: 8 }}>{selected.title}</h2>

                {selected.authors.length > 0 && (
                  <p style={{ color: "var(--text2)", fontSize: 13, marginBottom: 12 }}>
                    by <strong style={{ color: "var(--text)" }}>{selected.authors.join(", ")}</strong>
                  </p>
                )}

                {selected.description && (
                  <p style={{ color: "var(--text2)", lineHeight: 1.8, fontSize: 14, marginBottom: 16, maxWidth: 560 }}>
                    {selected.description.slice(0, 400)}{selected.description.length > 400 ? "..." : ""}
                  </p>
                )}

                {/* Tags */}
                {selected.tags.length > 0 && (
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 16 }}>
                    {selected.tags.slice(0, 8).map((tag) => (
                      <span key={tag} className="badge badge-genre" style={{ fontSize: 10 }}>{tag}</span>
                    ))}
                    {selected.tags.length > 8 && (
                      <span className="badge badge-genre" style={{ fontSize: 10 }}>+{selected.tags.length - 8} more</span>
                    )}
                  </div>
                )}

                {/* Auto-match notice */}
                {(() => {
                  const mdTags = selected.tags.map((t) => t.toLowerCase());
                  const matched = genres.filter((g) => mdTags.includes(g.name.toLowerCase()));
                  return matched.length > 0 ? (
                    <div style={{
                      padding: "8px 14px", background: "rgba(6,214,160,0.08)",
                      border: "1px solid rgba(6,214,160,0.2)", borderRadius: "var(--radius)",
                      fontSize: 12, color: "var(--success)", fontFamily: "'Space Mono', monospace",
                    }}>
                      ✓ {matched.length} genre{matched.length !== 1 ? "s" : ""} will be auto-matched: {matched.map((g) => g.name).join(", ")}
                    </div>
                  ) : null;
                })()}
              </div>
            </div>

            {/* Actions */}
            <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
              <button type="button" className="btn btn-outline" onClick={() => { setSelected(null); setStep("search"); }}>
                ← Back to Search
              </button>
              <button type="button" className="btn btn-primary" onClick={handleConfirm} style={{ padding: "10px 32px" }}>
                Use This Manga → Edit Details
              </button>
            </div>
          </motion.div>
        )}

        {/* ══ STEP 3: Edit form ═══════════════════════════════════════════ */}
        {step === "form" && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            {/* Source reference */}
            {selected && (
              <div style={{
                display: "flex", gap: 12, alignItems: "center",
                padding: "12px 18px", marginBottom: 24,
                background: "rgba(249,115,22,0.06)", border: "1px solid rgba(249,115,22,0.2)",
                borderRadius: "var(--radius-lg)",
              }}>
                {selected.coverUrl && (
                  <img src={selected.coverUrl} alt=""
                    style={{ width: 36, height: 48, objectFit: "cover", borderRadius: 6, flexShrink: 0 }} />
                )}
                <div>
                  <div style={{ fontSize: 12, color: "rgba(249,115,22,0.9)", fontFamily: "'Space Mono', monospace", fontWeight: 700 }}>
                    📚 IMPORTED FROM MANGADEX
                  </div>
                  <div style={{ fontSize: 14, fontWeight: 700 }}>{selected.title}</div>
                  <div style={{ fontSize: 12, color: "var(--text2)" }}>You can edit any field before publishing</div>
                </div>
                <button type="button" className="btn btn-ghost" onClick={() => setStep("confirm")}
                  style={{ marginLeft: "auto", fontSize: 12, flexShrink: 0 }}>
                  ← Change
                </button>
              </div>
            )}

            <div style={{ background: "var(--bg2)", border: "1px solid var(--border)", borderRadius: "var(--radius-lg)", padding: 32 }}>
              <form onSubmit={handlePublish} style={{ display: "flex", flexDirection: "column", gap: 20 }}>

                <div className="form-group">
                  <label>Title *</label>
                  <input className="input" value={title} onChange={(e) => setTitle(e.target.value)} required />
                </div>

                <div className="form-group">
                  <label>Description *</label>
                  <textarea className="input" value={description} onChange={(e) => setDescription(e.target.value)} required style={{ minHeight: 140 }} />
                </div>

                <div className="form-group">
                  <label>Author</label>
                  <input className="input" value={author} onChange={(e) => setAuthor(e.target.value)} />
                </div>

                <div className="form-group">
                  <label>Cover Image URL</label>
                  <input className="input" value={coverImage} onChange={(e) => setCoverImage(e.target.value)} placeholder="https://..." />
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
                    <div style={{ color: "var(--text3)", fontSize: 13, fontFamily: "'Space Mono', monospace" }}>No genres yet</div>
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
                  <button type="button" className="btn btn-outline" onClick={() => setStep("confirm")}>← Back</button>
                  <button type="submit" className="btn btn-primary" disabled={submitting} style={{ padding: "10px 32px", background: "#f97316" }}>
                    {submitting ? "Publishing..." : "Publish to Ruscomiks →"}
                  </button>
                </div>
              </form>
            </div>
          </motion.div>
        )}

        {/* ══ STEP 4: Done ════════════════════════════════════════════════ */}
        {step === "done" && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            style={{ textAlign: "center", padding: "60px 24px" }}
          >
            <div style={{ fontSize: 64, marginBottom: 20 }}>🎉</div>
            <h2 style={{ fontSize: 36, marginBottom: 12 }}>Published!</h2>
            <p style={{ color: "var(--text2)", fontSize: 16, marginBottom: 32, maxWidth: 480, margin: "0 auto 32px" }}>
              <strong style={{ color: "var(--text)" }}>{title}</strong> is now live on Ruscomiks.
              Add chapters so readers can start reading!
            </p>
            <div style={{ display: "flex", gap: 14, justifyContent: "center", flexWrap: "wrap" }}>
              <Link to={`/comic/${publishedComicSlug}`}>
                <button className="btn btn-outline" style={{ fontSize: 14 }}>View Comic</button>
              </Link>
              <Link to={`/publish-chapter/${publishedComicId}`}>
                <button className="btn btn-primary" style={{ fontSize: 14, padding: "12px 28px" }}>
                  + Add First Chapter →
                </button>
              </Link>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}