import React, { useEffect, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import api from "../lib/api";

interface Page {
  id: number;
  pageNum: number;
  imageUrl: string;
}

interface ChapterMeta {
  id: number;
  title: string;
  chapterNum: number;
}

interface Chapter extends ChapterMeta {
  pages: Page[];
  comic?: { title: string; slug: string };
}

export default function ChapterReader() {
  const { slug, chapterId } = useParams();
  const navigate = useNavigate();

  const [chapter, setChapter] = useState<Chapter | null>(null);
  const [allChapters, setAllChapters] = useState<ChapterMeta[]>([]);
  const [loading, setLoading] = useState(true);
  const [showChapterList, setShowChapterList] = useState(false);

  useEffect(() => {
    if (!slug || !chapterId) return;
    setLoading(true);
    setChapter(null);

    api.get(`/comics/${slug}`).then(async (comicRes) => {
      const comic = comicRes.data;

      // All chapters (already included with pages from the updated service)
      const chapters: ChapterMeta[] = comic.chapters.map((c: any) => ({
        id: c.id,
        title: c.title,
        chapterNum: c.chapterNum,
      }));
      setAllChapters(chapters);

      // Find the current chapter with its pages
      const current = comic.chapters.find((c: any) => c.id === Number(chapterId));
      if (current) {
        setChapter({
          ...current,
          comic: { title: comic.title, slug: comic.slug },
        });
      }
    }).finally(() => setLoading(false));
  }, [slug, chapterId]);

  // Derive prev / next from sorted chapter list
  const sortedChapters = [...allChapters].sort((a, b) => a.chapterNum - b.chapterNum);
  const currentIndex = sortedChapters.findIndex((c) => c.id === Number(chapterId));
  const prevChapter = currentIndex > 0 ? sortedChapters[currentIndex - 1] : null;
  const nextChapter = currentIndex < sortedChapters.length - 1 ? sortedChapters[currentIndex + 1] : null;

  const goTo = (ch: ChapterMeta) => {
    navigate(`/comic/${slug}/chapter/${ch.id}`);
    window.scrollTo({ top: 0 });
  };

  if (loading) return (
    <div style={{ minHeight: "100vh", background: "var(--bg)", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div className="spinner" />
    </div>
  );

  if (!chapter) return (
    <div style={{ minHeight: "100vh", background: "var(--bg)", padding: 40, textAlign: "center" }}>
      Chapter not found
    </div>
  );

  const NavBar = () => (
    <div style={{
      display: "flex", alignItems: "center", justifyContent: "space-between",
      flexWrap: "wrap", gap: 12,
    }}>
      {/* Back to comic */}
      <Link to={`/comic/${chapter.comic?.slug}`} style={{
        color: "var(--text2)", fontSize: 13,
        display: "flex", alignItems: "center", gap: 6,
        fontFamily: "'Space Mono', monospace",
      }}>
        ← {chapter.comic?.title}
      </Link>

      {/* Chapter title */}
      <div style={{ textAlign: "center", flex: 1 }}>
        <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 20, color: "var(--text)" }}>
          Chapter {chapter.chapterNum}: {chapter.title}
        </div>
        <div style={{ fontSize: 12, color: "var(--text3)", fontFamily: "'Space Mono', monospace" }}>
          {chapter.pages.length} pages
        </div>
      </div>

      {/* Chapter selector */}
      <div style={{ position: "relative" }}>
        <button
          onClick={() => setShowChapterList((p) => !p)}
          className="btn btn-outline"
          style={{ fontSize: 12, padding: "6px 14px" }}
        >
          Ch. List ▾
        </button>

        {showChapterList && (
          <>
            {/* Backdrop */}
            <div
              style={{ position: "fixed", inset: 0, zIndex: 99 }}
              onClick={() => setShowChapterList(false)}
            />
            <div style={{
              position: "absolute", top: "calc(100% + 8px)", right: 0,
              background: "var(--bg2)", border: "1px solid var(--border)",
              borderRadius: "var(--radius-lg)", minWidth: 220,
              maxHeight: 320, overflowY: "auto",
              boxShadow: "0 8px 32px rgba(0,0,0,0.6)",
              zIndex: 100,
            }}>
              {sortedChapters.map((ch) => (
                <button
                  key={ch.id}
                  onClick={() => { goTo(ch); setShowChapterList(false); }}
                  style={{
                    width: "100%", padding: "10px 16px",
                    background: ch.id === Number(chapterId) ? "rgba(230,57,70,0.15)" : "transparent",
                    border: "none", borderBottom: "1px solid var(--border)",
                    color: ch.id === Number(chapterId) ? "var(--accent)" : "var(--text)",
                    cursor: "pointer", textAlign: "left",
                    fontFamily: "'Space Mono', monospace", fontSize: 12,
                    display: "flex", gap: 12, alignItems: "center",
                    transition: "background 0.15s",
                  }}
                  onMouseEnter={(e) => {
                    if (ch.id !== Number(chapterId))
                      (e.currentTarget as HTMLButtonElement).style.background = "var(--bg3)";
                  }}
                  onMouseLeave={(e) => {
                    if (ch.id !== Number(chapterId))
                      (e.currentTarget as HTMLButtonElement).style.background = "transparent";
                  }}
                >
                  <span style={{ color: "var(--text3)", minWidth: 40 }}>Ch. {ch.chapterNum}</span>
                  <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{ch.title}</span>
                </button>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );

  const PrevNextBar = ({ position }: { position: "top" | "bottom" }) => (
    <div style={{
      display: "flex", justifyContent: "space-between", alignItems: "center",
      padding: position === "top" ? "12px 24px" : "20px 24px",
      borderTop: position === "bottom" ? "1px solid var(--border)" : undefined,
      borderBottom: position === "top" ? "1px solid var(--border)" : undefined,
      background: "rgba(0,0,0,0.6)",
      gap: 12,
    }}>
      {/* Previous */}
      <button
        onClick={() => prevChapter && goTo(prevChapter)}
        disabled={!prevChapter}
        className="btn"
        style={{
          fontSize: 13, padding: "8px 20px",
          background: prevChapter ? "var(--bg3)" : "transparent",
          color: prevChapter ? "var(--text)" : "var(--text3)",
          border: `1px solid ${prevChapter ? "var(--border)" : "transparent"}`,
          cursor: prevChapter ? "pointer" : "default",
          display: "flex", alignItems: "center", gap: 8,
        }}
      >
        ← {prevChapter ? `Ch. ${prevChapter.chapterNum}: ${prevChapter.title}` : "No previous chapter"}
      </button>

      {/* Chapter info */}
      <span style={{ fontSize: 12, color: "var(--text3)", fontFamily: "'Space Mono', monospace", textAlign: "center" }}>
        {currentIndex + 1} / {sortedChapters.length}
      </span>

      {/* Next */}
      <button
        onClick={() => nextChapter && goTo(nextChapter)}
        disabled={!nextChapter}
        className="btn"
        style={{
          fontSize: 13, padding: "8px 20px",
          background: nextChapter ? "var(--accent)" : "transparent",
          color: nextChapter ? "#fff" : "var(--text3)",
          border: `1px solid ${nextChapter ? "var(--accent)" : "transparent"}`,
          cursor: nextChapter ? "pointer" : "default",
          display: "flex", alignItems: "center", gap: 8,
        }}
      >
        {nextChapter ? `Ch. ${nextChapter.chapterNum}: ${nextChapter.title}` : "No next chapter"} →
      </button>
    </div>
  );

  return (
    <div style={{ minHeight: "100vh", background: "#000" }}>

      {/* Sticky top header */}
      <div style={{
        position: "sticky", top: 0, zIndex: 50,
        background: "rgba(0,0,0,0.95)", backdropFilter: "blur(8px)",
        borderBottom: "1px solid var(--border)",
        padding: "12px 24px",
      }}>
        <NavBar />
      </div>

      {/* Prev / Next — top */}
      <PrevNextBar position="top" />

      {/* Pages */}
      <div style={{ maxWidth: 900, margin: "0 auto" }}>
        {chapter.pages.length === 0 ? (
          <div style={{ textAlign: "center", padding: "80px 0", color: "var(--text3)" }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>📭</div>
            <div style={{ fontFamily: "'Space Mono', monospace" }}>No pages uploaded yet</div>
          </div>
        ) : (
          chapter.pages.map((page) => (
            <img
              key={page.id}
              src={page.imageUrl}
              alt={`Page ${page.pageNum}`}
              style={{ width: "100%", display: "block" }}
            />
          ))
        )}
      </div>

      {/* Prev / Next — bottom */}
      <PrevNextBar position="bottom" />

      {/* Bottom end-of-chapter message */}
      <div style={{
        textAlign: "center", padding: "32px 24px",
        background: "var(--bg)",
        borderTop: "1px solid var(--border)",
      }}>
        {nextChapter ? (
          <div>
            <div style={{ color: "var(--text2)", marginBottom: 16, fontFamily: "'Space Mono', monospace", fontSize: 13 }}>
              Up next
            </div>
            <button
              onClick={() => goTo(nextChapter)}
              className="btn btn-primary"
              style={{ fontSize: 15, padding: "12px 32px" }}
            >
              Continue to Ch. {nextChapter.chapterNum}: {nextChapter.title} →
            </button>
          </div>
        ) : (
          <div>
            <div style={{ fontSize: 32, marginBottom: 12 }}>🎉</div>
            <div style={{ color: "var(--text2)", fontFamily: "'Space Mono', monospace", fontSize: 13, marginBottom: 16 }}>
              You've reached the latest chapter!
            </div>
            <Link to={`/comic/${chapter.comic?.slug}`}>
              <button className="btn btn-outline" style={{ fontSize: 14 }}>
                ← Back to {chapter.comic?.title}
              </button>
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}

// import { useEffect, useState } from "react";
// import { useParams, Link } from "react-router-dom";
// import api from "../lib/api";

// interface Chapter {
//   id: number; title: string; chapterNum: number;
//   pages: { id: number; pageNum: number; imageUrl: string }[];
//   comic?: { title: string; slug: string };
// }

// export default function ChapterReader() {
//   const { slug, chapterId } = useParams();
//   const [chapter, setChapter] = useState<Chapter | null>(null);
//   const [loading, setLoading] = useState(true);

//   useEffect(() => {
//     if (!chapterId) return;
//     api.get(`/comics/${slug}`).then(async (r) => {
//       const chapters = r.data.chapters;
//       const allChapters = await api.get(`/comics/${r.data.id}/chapters`);
//       const ch = allChapters.data.find((c: any) => c.id === Number(chapterId));
//       if (ch) setChapter({ ...ch, comic: { title: r.data.title, slug: r.data.slug } });
//     }).finally(() => setLoading(false));
//   }, [slug, chapterId]);

//   if (loading) return (
//     <div style={{ minHeight: "100vh", background: "var(--bg)", display: "flex", alignItems: "center", justifyContent: "center" }}>
//       <div className="spinner" />
//     </div>
//   );

//   if (!chapter) return (
//     <div style={{ minHeight: "100vh", background: "var(--bg)", padding: 40, textAlign: "center" }}>
//       Chapter not found
//     </div>
//   );

//   return (
//     <div style={{ minHeight: "100vh", background: "#000" }}>
//       {}
//       <div style={{
//         position: "sticky", top: 0, zIndex: 50,
//         background: "rgba(0,0,0,0.95)", backdropFilter: "blur(8px)",
//         borderBottom: "1px solid var(--border)",
//         padding: "12px 24px",
//         display: "flex", alignItems: "center", justifyContent: "space-between",
//       }}>
//         <div>
//           {chapter.comic && (
//             <Link to={`/comic/${chapter.comic.slug}`} style={{ color: "var(--text2)", fontSize: 13 }}>
//               ← {chapter.comic.title}
//             </Link>
//           )}
//           <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 20, marginTop: 2 }}>
//             Chapter {chapter.chapterNum}: {chapter.title}
//           </div>
//         </div>
//         <div style={{ fontSize: 13, color: "var(--text3)", fontFamily: "'Space Mono', monospace" }}>
//           {chapter.pages.length} pages
//         </div>
//       </div>

//       {}
//       <div style={{ maxWidth: 900, margin: "0 auto", padding: "0 0 40px" }}>
//         {chapter.pages.length === 0 ? (
//           <div style={{ textAlign: "center", padding: "80px 0", color: "var(--text3)" }}>
//             No pages uploaded yet
//           </div>
//         ) : (
//           chapter.pages.map((page) => (
//             <img
//               key={page.id}
//               src={page.imageUrl}
//               alt={`Page ${page.pageNum}`}
//               style={{ width: "100%", display: "block" }}
//             />
//           ))
//         )}
//       </div>
//     </div>
//   );
// }