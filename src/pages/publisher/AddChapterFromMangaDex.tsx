import React, { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import Navbar from "../../components/layout/Navbar";
import api from "../../lib/api";
import { useAuthStore } from "../../lib/store";
import { useMangaDexChapters, MdChapter } from "../../hooks/useMangaDexChapters";

interface Comic {
  id: number; title: string; slug: string; coverImage?: string;
  // We store the MangaDex manga ID in a custom field — see note below
  mangaDexId?: string;
}

type Step = "link" | "chapters" | "preview" | "done";

const LANG_OPTIONS = [
  { code: "en", label: "English" },
  { code: "ja", label: "Japanese" },
  { code: "ko", label: "Korean" },
  { code: "zh", label: "Chinese (Simplified)" },
  { code: "zh-hk", label: "Chinese (Traditional)" },
  { code: "es", label: "Spanish" },
  { code: "es-la", label: "Spanish (Latin America)" },
  { code: "fr", label: "French" },
  { code: "de", label: "German" },
  { code: "it", label: "Italian" },
  { code: "pt-br", label: "Portuguese (BR)" },
  { code: "ru", label: "Russian" },
  { code: "ar", label: "Arabic" },
  { code: "id", label: "Indonesian" },
  { code: "vi", label: "Vietnamese" },
];

export default function AddChapterFromMangaDex() {
  const { comicId } = useParams();
  const { user } = useAuthStore();
  const navigate = useNavigate();

  const { chapters, loading: chapLoading, error: chapError, fetchChapters, clearChapters } = useMangaDexChapters();

  const [comic, setComic]               = useState<Comic | null>(null);
  const [step, setStep]                 = useState<Step>("link");

  // Step 1 — link
  const [mdMangaId, setMdMangaId]       = useState("");
  const [mdUrl, setMdUrl]               = useState("");
  const [language, setLanguage]         = useState("en");

  // Step 2 — chapter selection
  const [selectedChapter, setSelectedChapter] = useState<MdChapter | null>(null);
  const [chapterSearch, setChapterSearch] = useState("");

  // Step 3 — preview
  const [pages, setPages]               = useState<{ pageNum: number; imageUrl: string }[]>([]);
  const [pagesLoading, setPagesLoading] = useState(false);
  const [pagesError, setPagesError]     = useState("");

  // Override title/num
  const [overrideTitle, setOverrideTitle]   = useState("");
  const [overrideNum, setOverrideNum]       = useState("");

  // Step 4 — done
  const [publishing, setPublishing]     = useState(false);
  const [publishError, setPublishError] = useState("");
  const [done, setDone]                 = useState(false);

  useEffect(() => {
    if (!user || (user.role !== "publisher" && user.role !== "admin")) {
      navigate("/"); return;
    }
    api.get(`/comics/id/${comicId}`).then((r) => {
      setComic(r.data);
    }).catch(() => navigate("/dashboard"));
  }, [user, comicId, navigate]);

  // ── Step 1: extract MangaDex ID from URL or raw input ─────────────────
  const extractMangaDexId = (input: string): string | null => {
    // Direct UUID
    const uuidRe = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (uuidRe.test(input.trim())) return input.trim();
    // MangaDex URL: mangadex.org/title/{uuid}/...
    const urlMatch = input.match(/mangadex\.org\/title\/([0-9a-f-]{36})/i);
    if (urlMatch) return urlMatch[1];
    return null;
  };

  const handleFetchChapters = () => {
    const id = extractMangaDexId(mdUrl || mdMangaId);
    if (!id) { return; }
    setMdMangaId(id);
    fetchChapters(id, language);
    setStep("chapters");
  };

  // ── Step 2: select chapter → fetch pages ──────────────────────────────
  const handleSelectChapter = async (ch: MdChapter) => {
    setSelectedChapter(ch);
    setOverrideTitle(ch.title || `Chapter ${ch.chapterNum}`);
    setOverrideNum(ch.chapterNum === "null" ? "" : ch.chapterNum);
    setPagesError("");
    setPagesLoading(true);
    setStep("preview");

    try {
      const res = await fetch(`https://api.mangadex.org/at-home/server/${ch.id}`);
      if (!res.ok) throw new Error(`at-home error: ${res.status}`);
      const json = await res.json();
      const baseUrl = json.baseUrl;
      const hash    = json.chapter.hash;
      const files: string[] = json.chapter.data;

      setPages(files.map((filename, i) => ({
        pageNum: i + 1,
        imageUrl: `${baseUrl}/data/${hash}/${filename}`,
      })));
    } catch {
      setPagesError("Could not load page images from MangaDex. The chapter may be unavailable.");
    } finally {
      setPagesLoading(false);
    }
  };

  // ── Step 3: publish to Ruscomiks ──────────────────────────────────────
  const handlePublish = async () => {
    if (!overrideTitle.trim() || !overrideNum.trim() || pages.length === 0) return;
    setPublishError(""); setPublishing(true);
    try {
      await api.post(`/comics/${comicId}/chapters`, {
        title: overrideTitle,
        chapterNum: Number(overrideNum),
        pages: pages.map((p) => p.imageUrl),
      });
      setDone(true);
      setStep("done");
    } catch (err: any) {
      setPublishError(err.response?.data?.message || "Failed to publish chapter");
    } finally {
      setPublishing(false);
    }
  };

  const filteredChapters = chapters.filter((ch) => {
    const q = chapterSearch.toLowerCase();
    return ch.chapterNum.includes(q) || ch.title.toLowerCase().includes(q);
  });

  if (!comic) return <div><Navbar /><div className="loading-spinner"><div className="spinner" /></div></div>;

  return (
    <div style={{ minHeight: "100vh" }}>
      <Navbar />
      <div className="page-container" style={{ paddingTop: 40, paddingBottom: 80, maxWidth: 860 }}>

        {/* Breadcrumb */}
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 24, fontFamily: "'Space Mono', monospace", fontSize: 12, color: "var(--text3)" }}>
          <Link to="/dashboard" style={{ color: "var(--text3)" }}>My Comics</Link>
          <span>›</span>
          <Link to={`/comic/${comic.slug}`} style={{ color: "var(--text3)" }}>{comic.title}</Link>
          <span>›</span>
          <Link to={`/publish-chapter/${comicId}`} style={{ color: "var(--text3)" }}>Add Chapter</Link>
          <span>›</span>
          <span style={{ color: "var(--text2)" }}>From MangaDex</span>
        </div>

        <div style={{ marginBottom: 28 }}>
          <div style={{ display: "inline-flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
            <div style={{
              width: 38, height: 38, borderRadius: 10,
              background: "rgba(249,115,22,0.1)", border: "1px solid rgba(249,115,22,0.3)",
              display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18,
            }}>📚</div>
            <h1 style={{ fontSize: 28 }}>Import Chapter from MangaDex</h1>
          </div>
          <p style={{ color: "var(--text2)", fontSize: 14 }}>
            Linking chapters to: <strong style={{ color: "var(--text)" }}>{comic.title}</strong>
          </p>
        </div>

        {/* Step indicator */}
        <div style={{ display: "flex", gap: 0, marginBottom: 36, borderRadius: "var(--radius-lg)", overflow: "hidden", border: "1px solid var(--border)" }}>
          {[
            { key: "link",     label: "1. Link Manga",  icon: "🔗" },
            { key: "chapters", label: "2. Pick Chapter", icon: "📋" },
            { key: "preview",  label: "3. Preview",      icon: "🖼️" },
            { key: "done",     label: "4. Done",         icon: "✅" },
          ].map((s, i) => {
            const steps: Step[] = ["link", "chapters", "preview", "done"];
            const active = step === s.key;
            const passed = steps.indexOf(step) > i;
            return (
              <div key={s.key} style={{
                flex: 1, padding: "10px 6px", textAlign: "center",
                background: active ? "#f97316" : passed ? "rgba(249,115,22,0.15)" : "var(--bg2)",
                color: active ? "#fff" : passed ? "#f97316" : "var(--text3)",
                fontSize: 11, fontFamily: "'Space Mono', monospace", fontWeight: 700,
                borderRight: i < 3 ? "1px solid var(--border)" : "none",
                transition: "all 0.3s",
              }}>
                <div style={{ fontSize: 16, marginBottom: 2 }}>{s.icon}</div>
                {s.label}
              </div>
            );
          })}
        </div>

        {/* ══ STEP 1: Link ═══════════════════════════════════════════════ */}
        {step === "link" && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <div style={{ background: "var(--bg2)", border: "1px solid var(--border)", borderRadius: "var(--radius-lg)", padding: 28 }}>
              <div className="form-group" style={{ marginBottom: 20 }}>
                <label>MangaDex URL or Manga ID</label>
                <input
                  className="input"
                  placeholder="https://mangadex.org/title/xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx or paste UUID directly"
                  value={mdUrl}
                  onChange={(e) => setMdUrl(e.target.value)}
                  autoFocus
                />
                <div style={{ fontSize: 12, color: "var(--text3)", marginTop: 6, fontFamily: "'Space Mono', monospace" }}>
                  Find the manga on mangadex.org and paste the URL or the UUID from the address bar
                </div>
              </div>

              <div className="form-group" style={{ marginBottom: 24 }}>
                <label>Chapter Language</label>
                <select className="input" value={language} onChange={(e) => setLanguage(e.target.value)}>
                  {LANG_OPTIONS.map((l) => (
                    <option key={l.code} value={l.code}>{l.label}</option>
                  ))}
                </select>
              </div>

              {/* Validation hint */}
              {mdUrl.trim() && !extractMangaDexId(mdUrl) && (
                <div style={{ padding: "10px 14px", marginBottom: 16, background: "rgba(255,214,10,0.08)", border: "1px solid rgba(255,214,10,0.25)", borderRadius: "var(--radius)", color: "var(--accent3)", fontSize: 13 }}>
                  ⚠️ Couldn't detect a valid MangaDex UUID. Make sure you paste the full URL like{" "}
                  <code style={{ fontFamily: "'Space Mono', monospace" }}>https://mangadex.org/title/xxxxxxxx-...</code>
                </div>
              )}

              <div style={{ display: "flex", gap: 12, justifyContent: "flex-end", flexWrap: "wrap" }}>
                <Link to={`/publish-chapter/${comicId}`}>
                  <button type="button" className="btn btn-outline">← Back</button>
                </Link>
                <button
                  type="button"
                  className="btn"
                  onClick={handleFetchChapters}
                  disabled={!extractMangaDexId(mdUrl || mdMangaId)}
                  style={{ background: "#f97316", color: "#fff", padding: "10px 28px" }}
                >
                  Load Chapters →
                </button>
              </div>
            </div>
          </motion.div>
        )}

        {/* ══ STEP 2: Pick chapter ════════════════════════════════════════ */}
        {step === "chapters" && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <div style={{ marginBottom: 16, display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap" }}>
              <input
                className="input"
                placeholder="Search by chapter number or title..."
                value={chapterSearch}
                onChange={(e) => setChapterSearch(e.target.value)}
                style={{ flex: 1, minWidth: 200 }}
              />
              <button type="button" className="btn btn-outline" onClick={() => { clearChapters(); setStep("link"); setMdUrl(""); }}>
                ← Change Manga
              </button>
            </div>

            {chapLoading && (
              <div className="loading-spinner"><div className="spinner" /></div>
            )}

            {chapError && (
              <div style={{ padding: "12px 16px", background: "rgba(230,57,70,0.1)", border: "1px solid rgba(230,57,70,0.3)", borderRadius: "var(--radius)", color: "var(--accent)", fontSize: 14 }}>
                {chapError}
              </div>
            )}

            {!chapLoading && chapters.length === 0 && !chapError && (
              <div style={{ textAlign: "center", padding: "48px 0", color: "var(--text3)" }}>
                <div style={{ fontSize: 36, marginBottom: 12 }}>📭</div>
                <div style={{ fontFamily: "'Space Mono', monospace", fontSize: 14 }}>
                  No {LANG_OPTIONS.find(l => l.code === language)?.label} chapters found
                </div>
                <button type="button" className="btn btn-outline" onClick={() => { clearChapters(); setStep("link"); }} style={{ marginTop: 16 }}>
                  Try a Different Language
                </button>
              </div>
            )}

            {filteredChapters.length > 0 && (
              <div style={{ display: "flex", flexDirection: "column", gap: 6, maxHeight: 520, overflowY: "auto" }}>
                {filteredChapters.map((ch) => (
                  <motion.button
                    key={ch.id}
                    type="button"
                    onClick={() => handleSelectChapter(ch)}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    style={{
                      display: "flex", justifyContent: "space-between", alignItems: "center",
                      padding: "14px 20px",
                      background: "var(--card)", border: "1px solid var(--border)",
                      borderRadius: "var(--radius)", cursor: "pointer",
                      transition: "border-color 0.2s, background 0.2s",
                      textAlign: "left",
                    }}
                    onMouseEnter={(e) => {
                      const el = e.currentTarget as HTMLButtonElement;
                      el.style.borderColor = "#f97316";
                      el.style.background = "var(--bg3)";
                    }}
                    onMouseLeave={(e) => {
                      const el = e.currentTarget as HTMLButtonElement;
                      el.style.borderColor = "var(--border)";
                      el.style.background = "var(--card)";
                    }}
                  >
                    <div style={{ display: "flex", gap: 16, alignItems: "center" }}>
                      <span style={{ fontSize: 12, fontFamily: "'Space Mono', monospace", color: "var(--text3)", minWidth: 56, flexShrink: 0 }}>
                        Ch. {ch.chapterNum === "null" ? "?" : ch.chapterNum}
                      </span>
                      <div>
                        <div style={{ fontWeight: 600, fontSize: 14, color: "var(--text)" }}>{ch.title}</div>
                        {ch.volume && (
                          <div style={{ fontSize: 11, color: "var(--text3)", fontFamily: "'Space Mono', monospace" }}>Vol. {ch.volume}</div>
                        )}
                      </div>
                    </div>
                    <div style={{ display: "flex", gap: 12, alignItems: "center", flexShrink: 0 }}>
                      <span style={{ fontSize: 12, color: "var(--text3)" }}>{ch.pages > 0 ? `${ch.pages} pages` : ""}</span>
                      <span style={{ fontSize: 12, color: "var(--text3)" }}>{new Date(ch.publishedAt).toLocaleDateString()}</span>
                      <span style={{ fontSize: 11, color: "#f97316", fontFamily: "'Space Mono', monospace" }}>Import →</span>
                    </div>
                  </motion.button>
                ))}
              </div>
            )}
          </motion.div>
        )}

        {/* ══ STEP 3: Preview ═════════════════════════════════════════════ */}
        {step === "preview" && selectedChapter && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>

            {/* Editable metadata */}
            <div style={{ background: "var(--bg2)", border: "1px solid var(--border)", borderRadius: "var(--radius-lg)", padding: 24, marginBottom: 20 }}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 16 }}>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label>Chapter Number *</label>
                  <input className="input" type="number" step="0.1" value={overrideNum} onChange={(e) => setOverrideNum(e.target.value)} placeholder="e.g. 1" />
                </div>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label>Chapter Title *</label>
                  <input className="input" value={overrideTitle} onChange={(e) => setOverrideTitle(e.target.value)} />
                </div>
              </div>
              <div style={{ fontSize: 12, color: "var(--text3)", fontFamily: "'Space Mono', monospace" }}>
                You can edit the title and number before publishing
              </div>
            </div>

            {/* Pages loading */}
            {pagesLoading && (
              <div style={{ textAlign: "center", padding: "32px 0" }}>
                <div className="spinner" style={{ margin: "0 auto 12px" }} />
                <div style={{ color: "var(--text2)", fontFamily: "'Space Mono', monospace", fontSize: 13 }}>
                  Loading page images from MangaDex...
                </div>
              </div>
            )}

            {pagesError && (
              <div style={{ padding: "12px 16px", background: "rgba(230,57,70,0.1)", border: "1px solid rgba(230,57,70,0.3)", borderRadius: "var(--radius)", color: "var(--accent)", fontSize: 14, marginBottom: 20 }}>
                {pagesError}
              </div>
            )}

            {/* Page thumbnails grid */}
            {!pagesLoading && pages.length > 0 && (
              <div style={{ marginBottom: 24 }}>
                <div style={{ fontSize: 13, fontFamily: "'Space Mono', monospace", color: "var(--text2)", marginBottom: 12 }}>
                  📄 {pages.length} pages ready to import
                </div>
                <div style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fill, minmax(80px, 1fr))",
                  gap: 8,
                  maxHeight: 360,
                  overflowY: "auto",
                  padding: 4,
                }}>
                  {pages.map((page) => (
                    <div key={page.pageNum} style={{ position: "relative" }}>
                      <img
                        src={page.imageUrl}
                        alt={`Page ${page.pageNum}`}
                        style={{
                          width: "100%", aspectRatio: "2/3",
                          objectFit: "cover", borderRadius: "var(--radius)",
                          border: "1px solid var(--border)",
                        }}
                        loading="lazy"
                      />
                      <div style={{
                        position: "absolute", bottom: 4, right: 4,
                        background: "rgba(0,0,0,0.7)", color: "#fff",
                        fontSize: 9, fontFamily: "'Space Mono', monospace",
                        padding: "1px 5px", borderRadius: 4,
                      }}>
                        {page.pageNum}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {publishError && (
              <div style={{ padding: "10px 14px", marginBottom: 16, background: "rgba(230,57,70,0.1)", border: "1px solid rgba(230,57,70,0.3)", borderRadius: "var(--radius)", color: "var(--accent)", fontSize: 14 }}>
                {publishError}
              </div>
            )}

            <div style={{ display: "flex", gap: 12, justifyContent: "flex-end", flexWrap: "wrap" }}>
              <button type="button" className="btn btn-outline" onClick={() => { setStep("chapters"); setPages([]); setSelectedChapter(null); }}>
                ← Pick Different Chapter
              </button>
              <button
                type="button"
                className="btn"
                onClick={handlePublish}
                disabled={publishing || pagesLoading || pages.length === 0 || !overrideTitle.trim() || !overrideNum.trim()}
                style={{ background: "#f97316", color: "#fff", padding: "10px 32px" }}
              >
                {publishing ? "Publishing..." : `Publish ${pages.length} Pages →`}
              </button>
            </div>
          </motion.div>
        )}

        {/* ══ STEP 4: Done ════════════════════════════════════════════════ */}
        {step === "done" && (
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
            style={{ textAlign: "center", padding: "60px 24px" }}>
            <div style={{ fontSize: 60, marginBottom: 16 }}>🎉</div>
            <h2 style={{ fontSize: 32, marginBottom: 10 }}>Chapter Published!</h2>
            <p style={{ color: "var(--text2)", fontSize: 16, marginBottom: 32 }}>
              <strong style={{ color: "var(--text)" }}>Ch. {overrideNum}: {overrideTitle}</strong> is now live with {pages.length} pages.
            </p>
            <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
              <Link to={`/comic/${comic?.slug}`}>
                <button className="btn btn-outline" style={{ fontSize: 14 }}>View Comic</button>
              </Link>
              <button
                className="btn"
                style={{ background: "#f97316", color: "#fff", fontSize: 14, padding: "10px 24px" }}
                onClick={() => { setStep("chapters"); setDone(false); setPages([]); setSelectedChapter(null); setOverrideTitle(""); setOverrideNum(""); setPublishError(""); }}
              >
                + Add Another Chapter
              </button>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}