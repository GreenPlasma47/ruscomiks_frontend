import React, { useEffect, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import Navbar from "../components/layout/Navbar";
import api from "../lib/api";
import { useAuthStore } from "../lib/store";

interface Chapter {
  id: number;
  title: string;
  chapterNum: number;
  createdAt: string;
  pages?: { id: number; pageNum: number; imageUrl: string }[];
}

interface Comic {
  id: number; title: string; slug: string; description: string;
  coverImage?: string; status: string; viewCount: number; shareCount: number;
  publisher: { id: number; name: string };
  genres: { genre: { id: number; name: string; slug: string } }[];
  chapters: Chapter[];
  _count: { favorites: number; comments: number; ratings: number };
}

interface Comment {
  id: number; content: string; createdAt: string;
  user: { id: number; name: string; role: string };
}

interface Rating { average: string; count: number; }

interface EditChapterState {
  id: number;
  title: string;
  chapterNum: string;
  pages: string[];
}

export default function ComicDetail() {
  const { slug } = useParams();
  const { user } = useAuthStore();
  const navigate = useNavigate();

  const [comic, setComic] = useState<Comic | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [rating, setRating] = useState<Rating>({ average: "0", count: 0 });
  const [myRating, setMyRating] = useState(0);
  const [isFav, setIsFav] = useState(false);
  const [commentText, setCommentText] = useState("");
  const [loading, setLoading] = useState(true);

  // Edit chapter modal state
  const [editChapter, setEditChapter] = useState<EditChapterState | null>(null);
  const [editLoading, setEditLoading] = useState(false);
  const [editError, setEditError] = useState("");

  const canManage =
    user &&
    comic &&
    (user.role === "admin" ||
      (user.role === "publisher" && comic.publisher.id === user.id));

  useEffect(() => {
    if (!slug) return;
    api.get(`/comics/${slug}`).then((r) => {
      setComic(r.data);
      api.get(`/ratings/comic/${r.data.id}`).then((rr) => setRating(rr.data));
      api.get(`/comments/comic/${r.data.id}`).then((rc) => setComments(rc.data));
      if (user) {
        api.get("/favorites").then((rf) => {
          setIsFav(rf.data.some((f: any) => f.comicId === r.data.id));
        }).catch(() => {});
      }
    }).finally(() => setLoading(false));
  }, [slug, user]);

  const handleFav = async () => {
    if (!comic || !user) return;
    try {
      if (isFav) { await api.delete(`/favorites/${comic.id}`); setIsFav(false); }
      else { await api.post(`/favorites/${comic.id}`); setIsFav(true); }
    } catch {}
  };

  const handleShare = async () => {
    if (!comic) return;
    try {
      await navigator.clipboard.writeText(window.location.href);
      if (user) await api.post(`/shares/comic/${comic.id}`);
      alert("Link copied to clipboard!");
    } catch {}
  };

  const handleRating = async (score: number) => {
    if (!comic || !user) return;
    setMyRating(score);
    await api.post(`/ratings/comic/${comic.id}`, { score });
    const r = await api.get(`/ratings/comic/${comic.id}`);
    setRating(r.data);
  };

  const handleComment = async () => {
    if (!comic || !commentText.trim()) return;
    const r = await api.post(`/comments/comic/${comic.id}`, { content: commentText });
    setComments([r.data, ...comments]);
    setCommentText("");
  };

  const handleDeleteComment = async (id: number) => {
    await api.delete(`/comments/${id}`);
    setComments(comments.filter((c) => c.id !== id));
  };

  const handleDeleteComic = async () => {
    if (!comic || !confirm(`Delete "${comic.title}"? This cannot be undone.`)) return;
    await api.delete(`/comics/${comic.id}`);
    navigate("/dashboard");
  };

  // ── Chapter edit helpers ──────────────────────────────────────────────────

  // const openEditChapter = (ch: Chapter) => {
  //   setEditError("");
  //   setEditChapter({
  //     id: ch.id,
  //     title: ch.title,
  //     chapterNum: String(ch.chapterNum),
  //     pages: (ch.pages?.length ?? 0) > 0 
  //     ? ch.pages.map((p) => p.imageUrl) 
  //     : [""],
  //   });
  // };

  const openEditChapter = (ch: Chapter) => {
    setEditError("");
    // 'ch' is passed directly from the .map() in your JSX, 
    // which already contains the data from the initial comic fetch.
    setEditChapter({
      id: ch.id,
      title: ch.title,
      chapterNum: String(ch.chapterNum),
      // Use the pages already present in the chapter object
      pages: (ch.pages && ch.pages.length > 0) 
        ? ch.pages.map((p) => p.imageUrl) 
        : [""],
    });
  };

  const closeEditChapter = () => setEditChapter(null);

  const addEditPage = () =>
    setEditChapter((prev) => prev ? { ...prev, pages: [...prev.pages, ""] } : prev);

  const removeEditPage = (i: number) =>
    setEditChapter((prev) =>
      prev ? { ...prev, pages: prev.pages.filter((_, idx) => idx !== i) } : prev
    );

  const updateEditPage = (i: number, val: string) =>
    setEditChapter((prev) => {
      if (!prev) return prev;
      const pages = [...prev.pages];
      pages[i] = val;
      return { ...prev, pages };
    });

  const handleSaveChapter = async () => {
    if (!editChapter || !comic) return;
    setEditError(""); setEditLoading(true);
    try {
      const r = await api.put(`/comics/chapters/${editChapter.id}`, {
        title: editChapter.title,
        chapterNum: Number(editChapter.chapterNum),
        pages: editChapter.pages.filter((p) => p.trim()),
      });

      // Update the chapter list in local state
      setComic((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          chapters: prev.chapters.map((ch) =>
            ch.id === editChapter.id
              ? { ...ch, title: r.data.title, chapterNum: r.data.chapterNum, pages: r.data.pages }
              : ch
          ),
        };
      });

      closeEditChapter();
    } catch (err: any) {
      setEditError(err.response?.data?.message || "Failed to save chapter");
    } finally {
      setEditLoading(false);
    }
  };

  const handleDeleteChapter = async (chapterId: number, chapterTitle: string) => {
    if (!confirm(`Delete chapter "${chapterTitle}"? This cannot be undone.`)) return;
    try {
      await api.delete(`/comics/chapters/${chapterId}`);
      setComic((prev) => {
        if (!prev) return prev;
        return { ...prev, chapters: prev.chapters.filter((ch) => ch.id !== chapterId) };
      });
    } catch (err: any) {
      alert(err.response?.data?.message || "Failed to delete chapter");
    }
  };

  // ─────────────────────────────────────────────────────────────────────────

  if (loading) return <div><Navbar /><div className="loading-spinner"><div className="spinner" /></div></div>;
  if (!comic) return <div><Navbar /><div style={{ padding: 40, textAlign: "center" }}>Comic not found</div></div>;

  return (
    <div style={{ minHeight: "100vh" }}>
      <Navbar />

      {/* Hero banner */}
      <div style={{ position: "relative", height: 320, overflow: "hidden" }}>
        {comic.coverImage && (
          <div style={{
            position: "absolute", inset: 0,
            backgroundImage: `url(${comic.coverImage})`,
            backgroundSize: "cover", backgroundPosition: "center top",
            filter: "blur(16px) brightness(0.3)", transform: "scale(1.1)",
          }} />
        )}
        <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to top, var(--bg) 0%, transparent 60%)" }} />
      </div>

      <div className="page-container" style={{ marginTop: -200, position: "relative", paddingBottom: 60 }}>
        <div style={{ display: "flex", gap: 32, flexWrap: "wrap" }}>
          {/* Cover */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} style={{ flexShrink: 0, width: 200 }}>
            {comic.coverImage ? (
              <img src={comic.coverImage} alt={comic.title}
                style={{ width: "100%", aspectRatio: "2/3", objectFit: "cover", borderRadius: "var(--radius-lg)", boxShadow: "0 16px 48px rgba(0,0,0,0.6)" }} />
            ) : (
              <div style={{
                width: "100%", aspectRatio: "2/3",
                background: "linear-gradient(135deg, var(--bg3), var(--bg4))",
                borderRadius: "var(--radius-lg)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 48,
              }}>📖</div>
            )}
          </motion.div>

          {/* Info */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
            style={{ flex: 1, minWidth: 280, paddingTop: 120 }}>

            <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 12 }}>
              <span className={`badge badge-${comic.status}`}>{comic.status}</span>
              {comic.genres.map((g) => (
                <Link key={g.genre.id} to={`/browse?genre=${g.genre.slug}`}>
                  <span className="badge badge-genre">{g.genre.name}</span>
                </Link>
              ))}
            </div>

            <h1 style={{ fontSize: "clamp(24px, 4vw, 48px)", lineHeight: 1.1, marginBottom: 8 }}>{comic.title}</h1>
            <p style={{ color: "var(--text2)", fontSize: 14, marginBottom: 16 }}>
              by <strong style={{ color: "var(--text)" }}>{(comic.author || comic.publisher.name)}</strong>
            </p>
            <p style={{ color: "var(--text2)", lineHeight: 1.8, marginBottom: 24, maxWidth: 600 }}>{comic.description}</p>

            {/* Stats */}
            <div style={{ display: "flex", gap: 24, flexWrap: "wrap", marginBottom: 20 }}>
              {[
                { label: "Views", value: comic.viewCount.toLocaleString(), icon: "👁" },
                { label: "Favorites", value: comic._count.favorites.toLocaleString(), icon: "❤️" },
                { label: "Shares", value: comic.shareCount.toLocaleString(), icon: "🔗" },
                { label: "Chapters", value: comic.chapters.length.toString(), icon: "📚" },
              ].map((s) => (
                <div key={s.label} style={{ textAlign: "center" }}>
                  <div style={{ fontSize: 20, marginBottom: 2 }}>{s.icon}</div>
                  <div style={{ fontWeight: 700, fontSize: 16 }}>{s.value}</div>
                  <div style={{ fontSize: 11, color: "var(--text3)", fontFamily: "'Space Mono', monospace" }}>{s.label}</div>
                </div>
              ))}
              <div style={{ textAlign: "center" }}>
                <div style={{ fontSize: 20, marginBottom: 2 }}>⭐</div>
                <div style={{ fontWeight: 700, fontSize: 16 }}>{rating.average}</div>
                <div style={{ fontSize: 11, color: "var(--text3)", fontFamily: "'Space Mono', monospace" }}>{rating.count} ratings</div>
              </div>
            </div>

            {/* Reader actions */}
            <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginBottom: 16 }}>
              {user && (
                <button className="btn" onClick={handleFav} style={{
                  background: isFav ? "rgba(230,57,70,0.2)" : "var(--bg3)",
                  color: isFav ? "var(--accent)" : "var(--text2)",
                  border: `1px solid ${isFav ? "var(--accent)" : "var(--border)"}`,
                }}>
                  {isFav ? "❤️ Saved" : "🤍 Add to Favorites"}
                </button>
              )}
              <button className="btn btn-outline" onClick={handleShare}>🔗 Share</button>
            </div>

            {/* Publisher / Admin manage bar */}
            {canManage && (
              <div style={{
                display: "flex", gap: 10, flexWrap: "wrap",
                padding: "14px 18px",
                background: "rgba(255,214,10,0.06)",
                border: "1px solid rgba(255,214,10,0.2)",
                borderRadius: "var(--radius-lg)",
                marginBottom: 16,
              }}>
                <span style={{ fontSize: 12, color: "var(--accent3)", fontFamily: "'Space Mono', monospace", fontWeight: 700, alignSelf: "center", marginRight: 4 }}>
                  ✏️ MANAGE:
                </span>
                <Link to={`/edit-comic/${comic.id}`}>
                  <button className="btn btn-outline" style={{ fontSize: 13, borderColor: "var(--accent3)", color: "var(--accent3)" }}>
                    Edit Comic
                  </button>
                </Link>
                <Link to={`/publish-chapter/${comic.id}`}>
                  <button className="btn" style={{ fontSize: 13, background: "var(--accent3)", color: "#000", fontWeight: 700 }}>
                    + Add Chapter
                  </button>
                </Link>
                {(user?.role === "admin" || user?.role === "publisher") && (
                  <button className="btn" onClick={handleDeleteComic} style={{ fontSize: 13, background: "rgba(230,57,70,0.15)", color: "var(--accent)", border: "1px solid rgba(230,57,70,0.3)" }}>
                    🗑 Delete Comic
                  </button>
                )}
              </div>
            )}

            {/* Star rating */}
            {user && (
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span style={{ fontSize: 13, color: "var(--text2)", fontFamily: "'Space Mono', monospace" }}>Rate:</span>
                {[1, 2, 3, 4, 5].map((s) => (
                  <button key={s} onClick={() => handleRating(s)}
                    style={{ background: "none", border: "none", cursor: "pointer", fontSize: 24, color: s <= myRating ? "var(--accent3)" : "var(--text3)", padding: "0 2px" }}>
                    ★
                  </button>
                ))}
              </div>
            )}
          </motion.div>
        </div>

        {/* ── Chapters ───────────────────────────────────────────────────────── */}
        <section style={{ marginTop: 48 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
            <h2 style={{ fontSize: 28 }}>Chapters ({comic.chapters.length})</h2>
            {canManage && (
              <Link to={`/publish-chapter/${comic.id}`}>
                <button className="btn" style={{ background: "var(--accent3)", color: "#000", fontWeight: 700, fontSize: 13 }}>
                  + Add Chapter
                </button>
              </Link>
            )}
          </div>

          {comic.chapters.length === 0 ? (
            <div style={{
              padding: "40px 24px", textAlign: "center",
              background: "var(--bg2)", border: "1px solid var(--border)",
              borderRadius: "var(--radius-lg)", color: "var(--text3)",
            }}>
              <div style={{ fontSize: 32, marginBottom: 12 }}>📭</div>
              <div style={{ fontFamily: "'Space Mono', monospace", marginBottom: 16 }}>No chapters published yet</div>
              {canManage && (
                <Link to={`/publish-chapter/${comic.id}`}>
                  <button className="btn btn-primary">Publish First Chapter</button>
                </Link>
              )}
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {comic.chapters.map((ch) => (
                <div key={ch.id} style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  {/* Chapter row — clicking the main area navigates to reader */}
                  <Link to={`/comic/${comic.slug}/chapter/${ch.id}`} style={{ flex: 1 }}>
                    <div style={{
                      display: "flex", justifyContent: "space-between", alignItems: "center",
                      padding: "14px 20px", background: "var(--card)",
                      border: "1px solid var(--border)", borderRadius: "var(--radius)",
                      transition: "border-color 0.2s, background 0.2s",
                    }}
                      onMouseEnter={(e) => { (e.currentTarget as HTMLDivElement).style.borderColor = "var(--accent)"; (e.currentTarget as HTMLDivElement).style.background = "var(--bg3)"; }}
                      onMouseLeave={(e) => { (e.currentTarget as HTMLDivElement).style.borderColor = "var(--border)"; (e.currentTarget as HTMLDivElement).style.background = "var(--card)"; }}
                    >
                      <div style={{ display: "flex", gap: 16, alignItems: "center" }}>
                        <span style={{ fontSize: 12, fontFamily: "'Space Mono', monospace", color: "var(--text3)", minWidth: 60 }}>
                          Ch. {ch.chapterNum}
                        </span>
                        <span style={{ fontWeight: 600 }}>{ch.title}</span>
                      </div>
                      <span style={{ fontSize: 12, color: "var(--text3)" }}>
                        {new Date(ch.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                  </Link>

                  {/* Edit / Delete buttons — only for managers */}
                  {canManage && (
                    <div style={{ display: "flex", gap: 6, flexShrink: 0 }}>
                      <button
                        className="btn btn-outline"
                        onClick={() => openEditChapter(ch)}
                        style={{ fontSize: 12, padding: "6px 12px", borderColor: "var(--accent3)", color: "var(--accent3)" }}
                      >
                        ✏️ Edit
                      </button>
                      <button
                        className="btn"
                        onClick={() => handleDeleteChapter(ch.id, ch.title)}
                        style={{ fontSize: 12, padding: "6px 12px", background: "rgba(230,57,70,0.1)", color: "var(--accent)", border: "1px solid rgba(230,57,70,0.3)" }}
                      >
                        🗑
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </section>

        {/* ── Comments ───────────────────────────────────────────────────────── */}
        <section style={{ marginTop: 48 }}>
          <h2 style={{ fontSize: 28, marginBottom: 20 }}>Comments ({comments.length})</h2>

          {user ? (
            <div style={{ display: "flex", gap: 12, marginBottom: 24 }}>
              <textarea className="input" placeholder="Add a comment..." value={commentText}
                onChange={(e) => setCommentText(e.target.value)} style={{ flex: 1, minHeight: 80 }} />
              <button className="btn btn-primary" onClick={handleComment} style={{ alignSelf: "flex-end" }}>Post</button>
            </div>
          ) : (
            <div style={{ padding: "16px 20px", background: "var(--bg2)", border: "1px solid var(--border)", borderRadius: "var(--radius)", marginBottom: 24, color: "var(--text2)", fontSize: 14 }}>
              <Link to="/login" style={{ color: "var(--accent)" }}>Sign in</Link> to leave a comment.
            </div>
          )}

          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            {comments.map((c) => (
              <div key={c.id} style={{ padding: "16px 20px", background: "var(--card)", border: "1px solid var(--border)", borderRadius: "var(--radius)" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
                  <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                    <div style={{
                      width: 32, height: 32, borderRadius: "50%",
                      background: "linear-gradient(135deg, var(--accent), var(--purple))",
                      display: "flex", alignItems: "center", justifyContent: "center",
                      fontWeight: 700, fontSize: 13, color: "#fff", flexShrink: 0,
                    }}>
                      {c.user.name[0].toUpperCase()}
                    </div>
                    <div>
                      <span style={{ fontWeight: 700, fontSize: 14 }}>{c.user.name}</span>
                      <span className="badge" style={{
                        marginLeft: 8, fontSize: 10,
                        background: c.user.role === "admin" ? "rgba(230,57,70,0.2)" : "rgba(76,201,240,0.15)",
                        color: c.user.role === "admin" ? "var(--accent)" : "var(--info)",
                      }}>{c.user.role}</span>
                    </div>
                  </div>
                  <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                    <span style={{ fontSize: 12, color: "var(--text3)" }}>{new Date(c.createdAt).toLocaleDateString()}</span>
                    {user && (user.id === c.user.id || user.role === "admin") && (
                      <button onClick={() => handleDeleteComment(c.id)} className="btn btn-ghost"
                        style={{ fontSize: 12, color: "var(--accent)", padding: "2px 8px" }}>
                        Delete
                      </button>
                    )}
                  </div>
                </div>
                <p style={{ color: "var(--text2)", lineHeight: 1.7, fontSize: 14 }}>{c.content}</p>
              </div>
            ))}
            {comments.length === 0 && (
              <div style={{ color: "var(--text3)", fontFamily: "'Space Mono', monospace", padding: "20px 0" }}>
                No comments yet. Be the first!
              </div>
            )}
          </div>
        </section>
      </div>

      {/* ── Edit Chapter Modal ─────────────────────────────────────────────── */}
      <AnimatePresence>
        {editChapter && (
          <motion.div
            className="modal-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={(e) => { if (e.target === e.currentTarget) closeEditChapter(); }}
          >
            <motion.div
              className="modal"
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ duration: 0.2 }}
              style={{ maxWidth: 640 }}
            >
              <h2 style={{ marginBottom: 24 }}>Edit Chapter</h2>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 16 }}>
                <div className="form-group">
                  <label>Chapter Number *</label>
                  <input
                    className="input"
                    type="number"
                    step="0.1"
                    placeholder="1, 1.5, 2..."
                    value={editChapter.chapterNum}
                    onChange={(e) => setEditChapter((p) => p ? { ...p, chapterNum: e.target.value } : p)}
                  />
                </div>
                <div className="form-group">
                  <label>Chapter Title *</label>
                  <input
                    className="input"
                    placeholder="Chapter title"
                    value={editChapter.title}
                    onChange={(e) => setEditChapter((p) => p ? { ...p, title: e.target.value } : p)}
                  />
                </div>
              </div>

              <div className="form-group" style={{ marginBottom: 20 }}>
                <label>Pages (Image URLs)</label>
                <div style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 6 }}>
                  {editChapter.pages.map((url, i) => (
                    <div key={i} style={{ display: "flex", gap: 8, alignItems: "center" }}>
                      <span style={{ fontSize: 12, color: "var(--text3)", fontFamily: "'Space Mono', monospace", minWidth: 28 }}>
                        {i + 1}.
                      </span>
                      <input
                        className="input"
                        placeholder="https://image-host.com/page.jpg"
                        value={url}
                        onChange={(e) => updateEditPage(i, e.target.value)}
                        style={{ flex: 1 }}
                      />
                      {editChapter.pages.length > 1 && (
                        <button
                          type="button"
                          className="btn btn-ghost"
                          onClick={() => removeEditPage(i)}
                          style={{ color: "var(--accent)", flexShrink: 0, padding: "6px 10px" }}
                        >
                          ✕
                        </button>
                      )}
                    </div>
                  ))}
                </div>
                <button
                  type="button"
                  className="btn btn-outline"
                  onClick={addEditPage}
                  style={{ marginTop: 10, fontSize: 13 }}
                >
                  + Add Page
                </button>
              </div>

              {editError && (
                <div style={{
                  padding: "10px 14px", marginBottom: 16,
                  background: "rgba(230,57,70,0.1)", border: "1px solid rgba(230,57,70,0.3)",
                  borderRadius: "var(--radius)", color: "var(--accent)", fontSize: 14,
                }}>
                  {editError}
                </div>
              )}

              <div style={{ display: "flex", gap: 12, justifyContent: "flex-end" }}>
                <button className="btn btn-outline" onClick={closeEditChapter}>Cancel</button>
                <button
                  className="btn btn-primary"
                  onClick={handleSaveChapter}
                  disabled={editLoading}
                  style={{ padding: "10px 28px" }}
                >
                  {editLoading ? "Saving..." : "Save Changes"}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// import React, { useEffect, useState } from "react";
// import { useParams, Link, useNavigate } from "react-router-dom";
// import { motion } from "framer-motion";
// import Navbar from "../components/layout/Navbar";
// import api from "../lib/api";
// import { useAuthStore } from "../lib/store";

// interface Comic {
//   id: number; title: string; slug: string; description: string;
//   coverImage?: string; status: string; viewCount: number; shareCount: number;
//   publisher: { id: number; name: string };
//   genres: { genre: { id: number; name: string; slug: string } }[];
//   chapters: { id: number; title: string; chapterNum: number; createdAt: string }[];
//   _count: { favorites: number; comments: number; ratings: number };
// }
// interface Comment {
//   id: number; content: string; createdAt: string;
//   user: { id: number; name: string; role: string };
// }
// interface Rating { average: string; count: number; }

// export default function ComicDetail() {
//   const { slug } = useParams();
//   const { user } = useAuthStore();
//   const navigate = useNavigate();
//   const [comic, setComic] = useState<Comic | null>(null);
//   const [comments, setComments] = useState<Comment[]>([]);
//   const [rating, setRating] = useState<Rating>({ average: "0", count: 0 });
//   const [myRating, setMyRating] = useState(0);
//   const [isFav, setIsFav] = useState(false);
//   const [commentText, setCommentText] = useState("");
//   const [loading, setLoading] = useState(true);

//   // Is the current user the owner or admin?
//   const canManage =
//     user &&
//     comic &&
//     (user.role === "admin" || (user.role === "publisher" && comic.publisher.id === user.id));

//   useEffect(() => {
//     if (!slug) return;
//     api.get(`/comics/${slug}`).then((r) => {
//       setComic(r.data);
//       api.get(`/ratings/comic/${r.data.id}`).then((rr) => setRating(rr.data));
//       api.get(`/comments/comic/${r.data.id}`).then((rc) => setComments(rc.data));
//       if (user) {
//         api.get("/favorites").then((rf) => {
//           setIsFav(rf.data.some((f: any) => f.comicId === r.data.id));
//         }).catch(() => {});
//       }
//     }).finally(() => setLoading(false));
//   }, [slug, user]);

//   const handleFav = async () => {
//     if (!comic || !user) return;
//     try {
//       if (isFav) { await api.delete(`/favorites/${comic.id}`); setIsFav(false); }
//       else { await api.post(`/favorites/${comic.id}`); setIsFav(true); }
//     } catch {}
//   };

//   const handleShare = async () => {
//     if (!comic) return;
//     try {
//       await navigator.clipboard.writeText(window.location.href);
//       if (user) await api.post(`/shares/comic/${comic.id}`);
//       alert("Link copied to clipboard!");
//     } catch {}
//   };

//   const handleRating = async (score: number) => {
//     if (!comic || !user) return;
//     setMyRating(score);
//     await api.post(`/ratings/comic/${comic.id}`, { score });
//     const r = await api.get(`/ratings/comic/${comic.id}`);
//     setRating(r.data);
//   };

//   const handleComment = async () => {
//     if (!comic || !commentText.trim()) return;
//     const r = await api.post(`/comments/comic/${comic.id}`, { content: commentText });
//     setComments([r.data, ...comments]);
//     setCommentText("");
//   };

//   const handleDeleteComment = async (id: number) => {
//     if (!comic) return;
//     await api.delete(`/comments/${id}`);
//     setComments(comments.filter((c) => c.id !== id));
//   };

//   const handleDeleteComic = async () => {
//     if (!comic || !confirm(`Delete "${comic.title}"? This cannot be undone.`)) return;
//     await api.delete(`/comics/${comic.id}`);
//     navigate("/dashboard");
//   };

//   if (loading) return <div><Navbar /><div className="loading-spinner"><div className="spinner" /></div></div>;
//   if (!comic) return <div><Navbar /><div style={{ padding: 40, textAlign: "center" }}>Comic not found</div></div>;

//   return (
//     <div style={{ minHeight: "100vh" }}>
//       <Navbar />

//       {/* Hero banner */}
//       <div style={{ position: "relative", height: 320, overflow: "hidden" }}>
//         {comic.coverImage && (
//           <div style={{
//             position: "absolute", inset: 0,
//             backgroundImage: `url(${comic.coverImage})`,
//             backgroundSize: "cover", backgroundPosition: "center top",
//             filter: "blur(16px) brightness(0.3)", transform: "scale(1.1)",
//           }} />
//         )}
//         <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to top, var(--bg) 0%, transparent 60%)" }} />
//       </div>

//       <div className="page-container" style={{ marginTop: -200, position: "relative", paddingBottom: 60 }}>
//         <div style={{ display: "flex", gap: 32, flexWrap: "wrap" }}>
//           {/* Cover */}
//           <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} style={{ flexShrink: 0, width: 200 }}>
//             {comic.coverImage ? (
//               <img src={comic.coverImage} alt={comic.title}
//                 style={{ width: "100%", aspectRatio: "2/3", objectFit: "cover", borderRadius: "var(--radius-lg)", boxShadow: "0 16px 48px rgba(0,0,0,0.6)" }} />
//             ) : (
//               <div style={{
//                 width: "100%", aspectRatio: "2/3",
//                 background: "linear-gradient(135deg, var(--bg3), var(--bg4))",
//                 borderRadius: "var(--radius-lg)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 48,
//               }}>📖</div>
//             )}
//           </motion.div>

//           {/* Info */}
//           <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
//             style={{ flex: 1, minWidth: 280, paddingTop: 120 }}>

//             <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 12 }}>
//               <span className={`badge badge-${comic.status}`}>{comic.status}</span>
//               {comic.genres.map((g) => (
//                 <Link key={g.genre.id} to={`/browse?genre=${g.genre.slug}`}>
//                   <span className="badge badge-genre">{g.genre.name}</span>
//                 </Link>
//               ))}
//             </div>

//             <h1 style={{ fontSize: "clamp(24px, 4vw, 48px)", lineHeight: 1.1, marginBottom: 8 }}>{comic.title}</h1>
//             <p style={{ color: "var(--text2)", fontSize: 14, marginBottom: 16 }}>
//               by <strong style={{ color: "var(--text)" }}>{comic.publisher.name}</strong>
//             </p>

//             <p style={{ color: "var(--text2)", lineHeight: 1.8, marginBottom: 24, maxWidth: 600 }}>{comic.description}</p>

//             {/* Stats */}
//             <div style={{ display: "flex", gap: 24, flexWrap: "wrap", marginBottom: 20 }}>
//               {[
//                 { label: "Views", value: comic.viewCount.toLocaleString(), icon: "👁" },
//                 { label: "Favorites", value: comic._count.favorites.toLocaleString(), icon: "❤️" },
//                 { label: "Shares", value: comic.shareCount.toLocaleString(), icon: "🔗" },
//                 { label: "Chapters", value: comic.chapters.length.toString(), icon: "📚" },
//               ].map((s) => (
//                 <div key={s.label} style={{ textAlign: "center" }}>
//                   <div style={{ fontSize: 20, marginBottom: 2 }}>{s.icon}</div>
//                   <div style={{ fontWeight: 700, fontSize: 16 }}>{s.value}</div>
//                   <div style={{ fontSize: 11, color: "var(--text3)", fontFamily: "'Space Mono', monospace" }}>{s.label}</div>
//                 </div>
//               ))}
//               <div style={{ textAlign: "center" }}>
//                 <div style={{ fontSize: 20, marginBottom: 2 }}>⭐</div>
//                 <div style={{ fontWeight: 700, fontSize: 16 }}>{rating.average}</div>
//                 <div style={{ fontSize: 11, color: "var(--text3)", fontFamily: "'Space Mono', monospace" }}>{rating.count} ratings</div>
//               </div>
//             </div>

//             {/* Reader actions */}
//             <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginBottom: 16 }}>
//               {user && (
//                 <button className="btn" onClick={handleFav} style={{
//                   background: isFav ? "rgba(230,57,70,0.2)" : "var(--bg3)",
//                   color: isFav ? "var(--accent)" : "var(--text2)",
//                   border: `1px solid ${isFav ? "var(--accent)" : "var(--border)"}`,
//                 }}>
//                   {isFav ? "❤️ Saved" : "🤍 Add to Favorites"}
//                 </button>
//               )}
//               <button className="btn btn-outline" onClick={handleShare}>🔗 Share</button>
//             </div>

//             {/* Publisher / Admin actions */}
//             {canManage && (
//               <div style={{
//                 display: "flex", gap: 10, flexWrap: "wrap",
//                 padding: "14px 18px",
//                 background: "rgba(255,214,10,0.06)",
//                 border: "1px solid rgba(255,214,10,0.2)",
//                 borderRadius: "var(--radius-lg)",
//                 marginBottom: 16,
//               }}>
//                 <span style={{ fontSize: 12, color: "var(--accent3)", fontFamily: "'Space Mono', monospace", fontWeight: 700, alignSelf: "center", marginRight: 4 }}>
//                   ✏️ MANAGE:
//                 </span>
//                 <Link to={`/edit-comic/${comic.id}`}>
//                   <button className="btn btn-outline" style={{ fontSize: 13, borderColor: "var(--accent3)", color: "var(--accent3)" }}>
//                     Edit Comic
//                   </button>
//                 </Link>
//                 <Link to={`/publish-chapter/${comic.id}`}>
//                   <button className="btn" style={{ fontSize: 13, background: "var(--accent3)", color: "#000", fontWeight: 700 }}>
//                     + Add Chapter
//                   </button>
//                 </Link>
//                 {user?.role === "admin" && (
//                   <button className="btn" onClick={handleDeleteComic} style={{ fontSize: 13, background: "rgba(230,57,70,0.15)", color: "var(--accent)", border: "1px solid rgba(230,57,70,0.3)" }}>
//                     🗑 Delete Comic
//                   </button>
//                 )}
//               </div>
//             )}

//             {/* Star rating */}
//             {user && (
//               <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
//                 <span style={{ fontSize: 13, color: "var(--text2)", fontFamily: "'Space Mono', monospace" }}>Rate:</span>
//                 {[1, 2, 3, 4, 5].map((s) => (
//                   <button key={s} onClick={() => handleRating(s)}
//                     style={{ background: "none", border: "none", cursor: "pointer", fontSize: 24, color: s <= myRating ? "var(--accent3)" : "var(--text3)", padding: "0 2px" }}>
//                     ★
//                   </button>
//                 ))}
//               </div>
//             )}
//           </motion.div>
//         </div>

//         {/* Chapters section */}
//         <section style={{ marginTop: 48 }}>
//           <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
//             <h2 style={{ fontSize: 28 }}>Chapters ({comic.chapters.length})</h2>
//             {canManage && (
//               <Link to={`/publish-chapter/${comic.id}`}>
//                 <button className="btn" style={{ background: "var(--accent3)", color: "#000", fontWeight: 700, fontSize: 13 }}>
//                   + Add Chapter
//                 </button>
//               </Link>
//             )}
//           </div>

//           {comic.chapters.length === 0 ? (
//             <div style={{
//               padding: "40px 24px", textAlign: "center",
//               background: "var(--bg2)", border: "1px solid var(--border)",
//               borderRadius: "var(--radius-lg)", color: "var(--text3)",
//             }}>
//               <div style={{ fontSize: 32, marginBottom: 12 }}>📭</div>
//               <div style={{ fontFamily: "'Space Mono', monospace", marginBottom: 16 }}>No chapters published yet</div>
//               {canManage && (
//                 <Link to={`/publish-chapter/${comic.id}`}>
//                   <button className="btn btn-primary">Publish First Chapter</button>
//                 </Link>
//               )}
//             </div>
//           ) : (
//             <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
//               {comic.chapters.map((ch) => (
//                 <div key={ch.id} style={{ display: "flex", alignItems: "center", gap: 8 }}>
//                   <Link to={`/comic/${comic.slug}/chapter/${ch.id}`} style={{ flex: 1 }}>
//                     <div style={{
//                       display: "flex", justifyContent: "space-between", alignItems: "center",
//                       padding: "14px 20px", background: "var(--card)",
//                       border: "1px solid var(--border)", borderRadius: "var(--radius)",
//                       transition: "border-color 0.2s, background 0.2s",
//                     }}
//                       onMouseEnter={(e) => { (e.currentTarget as HTMLDivElement).style.borderColor = "var(--accent)"; (e.currentTarget as HTMLDivElement).style.background = "var(--bg3)"; }}
//                       onMouseLeave={(e) => { (e.currentTarget as HTMLDivElement).style.borderColor = "var(--border)"; (e.currentTarget as HTMLDivElement).style.background = "var(--card)"; }}
//                     >
//                       <div style={{ display: "flex", gap: 16, alignItems: "center" }}>
//                         <span style={{ fontSize: 12, fontFamily: "'Space Mono', monospace", color: "var(--text3)", minWidth: 60 }}>
//                           Ch. {ch.chapterNum}
//                         </span>
//                         <span style={{ fontWeight: 600 }}>{ch.title}</span>
//                       </div>
//                       <span style={{ fontSize: 12, color: "var(--text3)" }}>
//                         {new Date(ch.createdAt).toLocaleDateString()}
//                       </span>
//                     </div>
//                   </Link>
//                 </div>
//               ))}
//             </div>
//           )}
//         </section>

//         {/* Comments */}
//         <section style={{ marginTop: 48 }}>
//           <h2 style={{ fontSize: 28, marginBottom: 20 }}>Comments ({comments.length})</h2>

//           {user ? (
//             <div style={{ display: "flex", gap: 12, marginBottom: 24 }}>
//               <textarea className="input" placeholder="Add a comment..." value={commentText}
//                 onChange={(e) => setCommentText(e.target.value)} style={{ flex: 1, minHeight: 80 }} />
//               <button className="btn btn-primary" onClick={handleComment} style={{ alignSelf: "flex-end" }}>Post</button>
//             </div>
//           ) : (
//             <div style={{ padding: "16px 20px", background: "var(--bg2)", border: "1px solid var(--border)", borderRadius: "var(--radius)", marginBottom: 24, color: "var(--text2)", fontSize: 14 }}>
//               <Link to="/login" style={{ color: "var(--accent)" }}>Sign in</Link> to leave a comment.
//             </div>
//           )}

//           <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
//             {comments.map((c) => (
//               <div key={c.id} style={{ padding: "16px 20px", background: "var(--card)", border: "1px solid var(--border)", borderRadius: "var(--radius)" }}>
//                 <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
//                   <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
//                     <div style={{
//                       width: 32, height: 32, borderRadius: "50%",
//                       background: "linear-gradient(135deg, var(--accent), var(--purple))",
//                       display: "flex", alignItems: "center", justifyContent: "center",
//                       fontWeight: 700, fontSize: 13, color: "#fff", flexShrink: 0,
//                     }}>
//                       {c.user.name[0].toUpperCase()}
//                     </div>
//                     <div>
//                       <span style={{ fontWeight: 700, fontSize: 14 }}>{c.user.name}</span>
//                       <span className="badge" style={{
//                         marginLeft: 8, fontSize: 10,
//                         background: c.user.role === "admin" ? "rgba(230,57,70,0.2)" : "rgba(76,201,240,0.15)",
//                         color: c.user.role === "admin" ? "var(--accent)" : "var(--info)",
//                       }}>{c.user.role}</span>
//                     </div>
//                   </div>
//                   <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
//                     <span style={{ fontSize: 12, color: "var(--text3)" }}>{new Date(c.createdAt).toLocaleDateString()}</span>
//                     {user && (user.id === c.user.id || user.role === "admin") && (
//                       <button onClick={() => handleDeleteComment(c.id)} className="btn btn-ghost"
//                         style={{ fontSize: 12, color: "var(--accent)", padding: "2px 8px" }}>
//                         Delete
//                       </button>
//                     )}
//                   </div>
//                 </div>
//                 <p style={{ color: "var(--text2)", lineHeight: 1.7, fontSize: 14 }}>{c.content}</p>
//               </div>
//             ))}
//             {comments.length === 0 && (
//               <div style={{ color: "var(--text3)", fontFamily: "'Space Mono', monospace", padding: "20px 0" }}>
//                 No comments yet. Be the first!
//               </div>
//             )}
//           </div>
//         </section>
//       </div>
//     </div>
//   );
// }