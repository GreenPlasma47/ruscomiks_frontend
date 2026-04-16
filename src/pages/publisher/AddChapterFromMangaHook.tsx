import React, { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { motion } from "framer-motion";
import Navbar from "../../components/layout/Navbar";
import api from "../../lib/api";
import { useAuthStore } from "../../lib/store";
import { useMangaHookDetail, fetchMangaHookPages, MhChapter, MhPage } from "../../hooks/useMangaHook";

interface Comic { id: number; title: string; slug: string; coverImage?: string; }
type Step = "link" | "chapters" | "preview" | "done";

export default function AddChapterFromMangaHook() {
  const { comicId } = useParams();
  const { user } = useAuthStore();
  const navigate = useNavigate();

  const { detail, loading: detailLoading, error: detailError, fetchDetail } = useMangaHookDetail();

  const [comic, setComic]                   = useState<Comic | null>(null);
  const [step, setStep]                     = useState<Step>("link");

  // Step 1
  const [mangaId, setMangaId]               = useState("");
  const [chapterSearch, setChapterSearch]   = useState("");

  // Step 2
  const [selectedChapter, setSelectedChapter] = useState<MhChapter | null>(null);

  // Step 3
  const [pages, setPages]                   = useState<MhPage[]>([]);
  const [pagesLoading, setPagesLoading]     = useState(false);
  const [pagesError, setPagesError]         = useState("");
  const [overrideTitle, setOverrideTitle]   = useState("");
  const [overrideNum, setOverrideNum]       = useState("");

  // Step 4
  const [publishing, setPublishing]         = useState(false);
  const [publishError, setPublishError]     = useState("");
  const [done, setDone]                     = useState(false);

  useEffect(() => {
    if (!user || (user.role !== "publisher" && user.role !== "admin")) { navigate("/"); return; }
    api.get(`/comics/id/${comicId}`).then((r) => setComic(r.data)).catch(() => navigate("/dashboard"));
  }, [user, comicId, navigate]);

  // Extract chapter number from chapter name e.g. "chapter-139" → "139"
  const extractNum = (chapterId: string): string => {
    const match = chapterId.match(/chapter-(\d+\.?\d*)/i);
    return match ? match[1] : "";
  };

  const handleFetchDetail = () => {
    if (!mangaId.trim()) return;
    fetchDetail(mangaId.trim());
    setStep("chapters");
  };

  const handleSelectChapter = async (ch: MhChapter) => {
    setSelectedChapter(ch);
    const num = extractNum(ch.id);
    setOverrideNum(num);
    // Parse readable title from chapter name
    const nameMatch = ch.name.match(/Chapter\s+[\d.]+[^:]*:\s*(.*)/i);
    setOverrideTitle(nameMatch ? nameMatch[1].trim() : ch.name);
    setPagesError(""); setPagesLoading(true); setPages([]);
    setStep("preview");

    try {
      const p = await fetchMangaHookPages(mangaId.trim(), ch.id);
      setPages(p);
    } catch {
      setPagesError("Could not load page images from MangaHook. The chapter may be unavailable.");
    } finally {
      setPagesLoading(false);
    }
  };

  const handlePublish = async () => {
    if (!overrideTitle.trim() || !overrideNum.trim() || pages.length === 0) return;
    setPublishError(""); setPublishing(true);
    try {
      await api.post(`/comics/${comicId}/chapters`, {
        title: overrideTitle,
        chapterNum: Number(overrideNum),
        pages: pages.map(p => p.imageUrl),
      });
      setDone(true); setStep("done");
    } catch (err: any) {
      setPublishError(err.response?.data?.message || "Failed to publish chapter");
    } finally {
      setPublishing(false);
    }
  };

  const filteredChapters = (detail?.chapterList ?? []).filter((ch) => {
    const q = chapterSearch.toLowerCase();
    return ch.id.toLowerCase().includes(q) || ch.name.toLowerCase().includes(q);
  });

  const STEPS = [
    { key: "link",     label: "1. Link",    icon: "🔗" },
    { key: "chapters", label: "2. Chapter", icon: "📋" },
    { key: "preview",  label: "3. Preview", icon: "🖼️" },
    { key: "done",     label: "4. Done",    icon: "✅" },
  ];
  const stepIndex = STEPS.findIndex(s => s.key === step);

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
          <span style={{ color: "var(--text2)" }}>From MangaHook</span>
        </div>

        <div style={{ marginBottom: 28 }}>
          <div style={{ display: "inline-flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
            <div style={{ width: 38, height: 38, borderRadius: 10, background: "rgba(99,102,241,0.1)", border: "1px solid rgba(99,102,241,0.3)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18 }}>🪝</div>
            <h1 style={{ fontSize: 28 }}>Import Chapter from MangaHook</h1>
          </div>
          <p style={{ color: "var(--text2)", fontSize: 14 }}>
            Adding to: <strong style={{ color: "var(--text)" }}>{comic.title}</strong>
          </p>
        </div>

        {/* Step indicator */}
        <div style={{ display: "flex", marginBottom: 32, borderRadius: "var(--radius-lg)", overflow: "hidden", border: "1px solid var(--border)" }}>
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

        {/* ══ STEP 1: Link ═══════════════════════════════════════════════ */}
        {step === "link" && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <div style={{ background: "var(--bg2)", border: "1px solid var(--border)", borderRadius: "var(--radius-lg)", padding: 28 }}>
              <div className="form-group" style={{ marginBottom: 20 }}>
                <label>MangaHook Manga ID</label>
                <input className="input" placeholder="e.g. manga-oa952283" value={mangaId} onChange={(e) => setMangaId(e.target.value)} autoFocus />
                <div style={{ fontSize: 12, color: "var(--text3)", marginTop: 6, fontFamily: "'Space Mono', monospace" }}>
                  Search the manga on MangaHook and copy the ID from the URL, e.g.{" "}
                  <code>manga-oa952283</code>
                </div>
              </div>

              <div style={{ padding: "12px 16px", background: "rgba(99,102,241,0.06)", border: "1px solid rgba(99,102,241,0.2)", borderRadius: "var(--radius)", fontSize: 13, color: "var(--text2)", marginBottom: 20 }}>
                💡 To find a manga ID: search on the{" "}
                <a href="https://lmangahook.vercel.app" target="_blank" rel="noreferrer" style={{ color: "#6366f1" }}>MangaHook website</a>,
                click a manga, and copy the ID from the URL path.
              </div>

              <div style={{ display: "flex", gap: 12, justifyContent: "flex-end", flexWrap: "wrap" }}>
                <Link to={`/publish-chapter/${comicId}`}>
                  <button type="button" className="btn btn-outline">← Back</button>
                </Link>
                <button type="button" className="btn" onClick={handleFetchDetail} disabled={!mangaId.trim()} style={{ background: "#6366f1", color: "#fff", padding: "10px 28px" }}>
                  Load Chapters →
                </button>
              </div>
            </div>
          </motion.div>
        )}

        {/* ══ STEP 2: Pick Chapter ════════════════════════════════════════ */}
        {step === "chapters" && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            {detailLoading && <div className="loading-spinner"><div className="spinner" /></div>}
            {detailError && (
              <div style={{ padding: "12px 16px", background: "rgba(230,57,70,0.1)", border: "1px solid rgba(230,57,70,0.3)", borderRadius: "var(--radius)", color: "var(--accent)", marginBottom: 16 }}>{detailError}</div>
            )}

            {detail && !detailLoading && (
              <>
                {/* Manga info banner */}
                <div style={{ display: "flex", gap: 16, alignItems: "center", padding: "14px 18px", marginBottom: 16, background: "var(--bg2)", border: "1px solid var(--border)", borderRadius: "var(--radius-lg)" }}>
                  {detail.image && <img src={detail.image} alt="" style={{ width: 40, height: 54, objectFit: "cover", borderRadius: 6, flexShrink: 0 }} />}
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 700 }}>{detail.title}</div>
                    <div style={{ fontSize: 12, color: "var(--text3)", fontFamily: "'Space Mono', monospace" }}>{detail.chapterList.length} chapters · {detail.status}</div>
                  </div>
                  <button type="button" className="btn btn-outline" onClick={() => { setStep("link"); }} style={{ fontSize: 12 }}>Change</button>
                </div>

                <div style={{ marginBottom: 14 }}>
                  <input className="input" placeholder="Search chapters by number or title..." value={chapterSearch} onChange={(e) => setChapterSearch(e.target.value)} />
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: 6, maxHeight: 500, overflowY: "auto" }}>
                  {filteredChapters.map((ch) => (
                    <motion.button key={ch.id} type="button" onClick={() => handleSelectChapter(ch)}
                      initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                      style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 18px", background: "var(--card)", border: "1px solid var(--border)", borderRadius: "var(--radius)", cursor: "pointer", textAlign: "left", transition: "all 0.2s" }}
                      onMouseEnter={(e) => { const el = e.currentTarget as HTMLButtonElement; el.style.borderColor = "#6366f1"; el.style.background = "var(--bg3)"; }}
                      onMouseLeave={(e) => { const el = e.currentTarget as HTMLButtonElement; el.style.borderColor = "var(--border)"; el.style.background = "var(--card)"; }}
                    >
                      <div style={{ flex: 1, minWidth: 0, marginRight: 12 }}>
                        <div style={{ fontWeight: 600, fontSize: 13, color: "var(--text)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{ch.name}</div>
                        <div style={{ fontSize: 11, color: "var(--text3)", fontFamily: "'Space Mono', monospace", marginTop: 2 }}>{ch.id} · {ch.view} views</div>
                      </div>
                      <div style={{ display: "flex", gap: 12, flexShrink: 0, alignItems: "center" }}>
                        <span style={{ fontSize: 11, color: "var(--text3)" }}>{ch.createdAt}</span>
                        <span style={{ fontSize: 11, color: "#6366f1", fontFamily: "'Space Mono', monospace" }}>Import →</span>
                      </div>
                    </motion.button>
                  ))}

                  {filteredChapters.length === 0 && (
                    <div style={{ textAlign: "center", padding: "32px 0", color: "var(--text3)" }}>No chapters found</div>
                  )}
                </div>
              </>
            )}
          </motion.div>
        )}

        {/* ══ STEP 3: Preview ═════════════════════════════════════════════ */}
        {step === "preview" && selectedChapter && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            {/* Editable metadata */}
            <div style={{ background: "var(--bg2)", border: "1px solid var(--border)", borderRadius: "var(--radius-lg)", padding: 24, marginBottom: 20 }}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label>Chapter Number *</label>
                  <input className="input" type="number" step="0.1" value={overrideNum} onChange={(e) => setOverrideNum(e.target.value)} />
                </div>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label>Chapter Title *</label>
                  <input className="input" value={overrideTitle} onChange={(e) => setOverrideTitle(e.target.value)} />
                </div>
              </div>
            </div>

            {/* Page loading */}
            {pagesLoading && (
              <div style={{ textAlign: "center", padding: "32px 0" }}>
                <div className="spinner" style={{ margin: "0 auto 12px" }} />
                <div style={{ color: "var(--text2)", fontFamily: "'Space Mono', monospace", fontSize: 13 }}>Loading pages from MangaHook...</div>
              </div>
            )}

            {pagesError && (
              <div style={{ padding: "12px 16px", background: "rgba(230,57,70,0.1)", border: "1px solid rgba(230,57,70,0.3)", borderRadius: "var(--radius)", color: "var(--accent)", fontSize: 14, marginBottom: 20 }}>{pagesError}</div>
            )}

            {!pagesLoading && pages.length > 0 && (
              <div style={{ marginBottom: 24 }}>
                <div style={{ fontSize: 13, fontFamily: "'Space Mono', monospace", color: "var(--text2)", marginBottom: 12 }}>📄 {pages.length} pages ready to import</div>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(80px, 1fr))", gap: 8, maxHeight: 360, overflowY: "auto", padding: 4 }}>
                  {pages.map((page) => (
                    <div key={page.pageNum} style={{ position: "relative" }}>
                      <img src={page.imageUrl} alt={`Page ${page.pageNum}`}
                        style={{ width: "100%", aspectRatio: "2/3", objectFit: "cover", borderRadius: "var(--radius)", border: "1px solid var(--border)" }}
                        loading="lazy"
                      />
                      <div style={{ position: "absolute", bottom: 4, right: 4, background: "rgba(0,0,0,0.7)", color: "#fff", fontSize: 9, fontFamily: "'Space Mono', monospace", padding: "1px 5px", borderRadius: 4 }}>
                        {page.pageNum}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {publishError && (
              <div style={{ padding: "10px 14px", marginBottom: 16, background: "rgba(230,57,70,0.1)", border: "1px solid rgba(230,57,70,0.3)", borderRadius: "var(--radius)", color: "var(--accent)", fontSize: 14 }}>{publishError}</div>
            )}

            <div style={{ display: "flex", gap: 12, justifyContent: "flex-end", flexWrap: "wrap" }}>
              <button type="button" className="btn btn-outline" onClick={() => { setStep("chapters"); setPages([]); setSelectedChapter(null); }}>← Pick Different</button>
              <button type="button" className="btn" onClick={handlePublish}
                disabled={publishing || pagesLoading || pages.length === 0 || !overrideTitle.trim() || !overrideNum.trim()}
                style={{ background: "#6366f1", color: "#fff", padding: "10px 32px" }}>
                {publishing ? "Publishing..." : `Publish ${pages.length} Pages →`}
              </button>
            </div>
          </motion.div>
        )}

        {/* ══ STEP 4: Done ════════════════════════════════════════════════ */}
        {step === "done" && (
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} style={{ textAlign: "center", padding: "60px 24px" }}>
            <div style={{ fontSize: 60, marginBottom: 16 }}>🎉</div>
            <h2 style={{ fontSize: 32, marginBottom: 10 }}>Chapter Published!</h2>
            <p style={{ color: "var(--text2)", fontSize: 16, marginBottom: 32 }}>
              <strong style={{ color: "var(--text)" }}>Ch. {overrideNum}: {overrideTitle}</strong> is now live with {pages.length} pages.
            </p>
            <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
              <Link to={`/comic/${comic?.slug}`}>
                <button className="btn btn-outline" style={{ fontSize: 14 }}>View Comic</button>
              </Link>
              <button className="btn" style={{ background: "#6366f1", color: "#fff", fontSize: 14, padding: "10px 24px" }}
                onClick={() => { setStep("chapters"); setDone(false); setPages([]); setSelectedChapter(null); setOverrideTitle(""); setOverrideNum(""); setPublishError(""); }}>
                + Add Another Chapter
              </button>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}