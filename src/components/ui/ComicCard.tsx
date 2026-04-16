import { Link } from "react-router-dom";
import { motion } from "framer-motion";

interface Comic {
  id: number;
  title: string;
  slug: string;
  coverImage?: string;
  status: string;
  viewCount: number;
  genres?: { genre: { name: string } }[];
  _count?: { favorites?: number; comments?: number; ratings?: number };
  publisher?: { name: string };
}

interface Props {
  comic: Comic;
  index?: number;
}

const STATUS_COLORS: Record<string, string> = {
  ongoing: "var(--success)",
  completed: "var(--info)",
  hiatus: "var(--accent2)",
};

export default function ComicCard({ comic, index = 0 }: Props) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.04, duration: 0.3 }}
    >
      <Link to={`/comic/${comic.slug}`}>
        <div className="card" style={{ cursor: "pointer" }}>
          {}
          <div style={{ position: "relative", aspectRatio: "2/3", overflow: "hidden" }}>
            {comic.coverImage ? (
              <img
                src={comic.coverImage}
                alt={comic.title}
                style={{ width: "100%", height: "100%", objectFit: "cover", transition: "transform 0.3s" }}
                onMouseEnter={(e) => ((e.target as HTMLImageElement).style.transform = "scale(1.06)")}
                onMouseLeave={(e) => ((e.target as HTMLImageElement).style.transform = "scale(1)")}
              />
            ) : (
              <div style={{
                width: "100%", height: "100%",
                background: "linear-gradient(135deg, var(--bg3) 0%, var(--bg4) 100%)",
                display: "flex", alignItems: "center", justifyContent: "center",
              }}>
                <span style={{ fontSize: 48, opacity: 0.3 }}>📖</span>
              </div>
            )}

            {}
            <div style={{
              position: "absolute", top: 8, left: 8,
              padding: "2px 8px", borderRadius: 4,
              fontSize: 10, fontWeight: 700,
              fontFamily: "'Space Mono', monospace",
              textTransform: "uppercase",
              background: "rgba(0,0,0,0.8)",
              color: STATUS_COLORS[comic.status] || "var(--text2)",
              backdropFilter: "blur(4px)",
            }}>
              {comic.status}
            </div>

            {}
            <div style={{
              position: "absolute", bottom: 8, right: 8,
              padding: "2px 8px", borderRadius: 4,
              fontSize: 10, fontFamily: "'Space Mono', monospace",
              background: "rgba(0,0,0,0.7)",
              color: "var(--text2)",
              display: "flex", alignItems: "center", gap: 4,
            }}>
              👁 {comic.viewCount.toLocaleString()}
            </div>
          </div>

          {}
          <div style={{ padding: "10px 12px" }}>
            <div style={{
              fontWeight: 700, fontSize: 13,
              color: "var(--text)",
              overflow: "hidden", textOverflow: "ellipsis",
              display: "-webkit-box", WebkitLineClamp: 2,
              WebkitBoxOrient: "vertical",
              lineHeight: 1.4, marginBottom: 6,
            }}>
              {comic.title}
            </div>

            {comic.genres && comic.genres.length > 0 && (
              <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
                {comic.genres.slice(0, 2).map((g) => (
                  <span key={g.genre.name} className="badge badge-genre" style={{ fontSize: 10 }}>
                    {g.genre.name}
                  </span>
                ))}
                {comic.genres.length > 2 && (
                  <span className="badge badge-genre" style={{ fontSize: 10 }}>+{comic.genres.length - 2}</span>
                )}
              </div>
            )}
          </div>
        </div>
      </Link>
    </motion.div>
  );
}