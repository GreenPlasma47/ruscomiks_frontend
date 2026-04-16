import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import api from "../../lib/api";

interface CarouselItem {
  id: number;
  title: string;
  description?: string;
  imageUrl: string;
  linkUrl?: string;
}

export default function HeroCarousel() {
  const [items, setItems] = useState<CarouselItem[]>([]);
  const [current, setCurrent] = useState(0);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    api.get("/carousel").then((r) => setItems(r.data)).catch(() => {});
  }, []);

  const next = useCallback(() => setCurrent((c) => (c + 1) % Math.max(items.length, 1)), [items.length]);
  const prev = () => setCurrent((c) => (c - 1 + items.length) % items.length);

  useEffect(() => {
    if (paused || items.length <= 1) return;
    const t = setInterval(next, 5000);
    return () => clearInterval(t);
  }, [paused, next, items.length]);

  if (items.length === 0) {
    return (
      <div style={{
        height: 420, background: "var(--bg2)",
        display: "flex", alignItems: "center", justifyContent: "center",
        borderBottom: "1px solid var(--border)",
      }}>
        <div style={{ textAlign: "center", color: "var(--text3)" }}>
          <div style={{ fontSize: 48, marginBottom: 12 }}>🎠</div>
          <div style={{ fontFamily: "'Space Mono', monospace", fontSize: 13 }}>No carousel items yet</div>
        </div>
      </div>
    );
  }

  const item = items[current];

  return (
    <div
      style={{ position: "relative", height: 480, overflow: "hidden" }}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      <AnimatePresence mode="wait">
        <motion.div
          key={item.id}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.6 }}
          style={{ position: "absolute", inset: 0 }}
        >
          {}
          <div style={{
            position: "absolute", inset: 0,
            backgroundImage: `url(${item.imageUrl})`,
            backgroundSize: "cover", backgroundPosition: "center",
            filter: "brightness(0.55)",
          }} />

          {}
          <div style={{
            position: "absolute", inset: 0,
            background: "linear-gradient(to right, rgba(10,10,15,0.95) 0%, rgba(10,10,15,0.5) 60%, transparent 100%)",
          }} />

          {}
          <div style={{
            position: "absolute", inset: 0,
            backgroundImage: "radial-gradient(circle, rgba(230,57,70,0.04) 1px, transparent 1px)",
            backgroundSize: "20px 20px",
          }} />

          {}
          <div className="page-container" style={{ position: "relative", height: "100%", display: "flex", alignItems: "center" }}>
            <motion.div
              initial={{ x: -40, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: 0.2, duration: 0.5 }}
              style={{ maxWidth: 560 }}
            >
              <div style={{
                display: "inline-block", padding: "4px 12px", borderRadius: 4,
                background: "var(--accent)", color: "#fff",
                fontSize: 11, fontWeight: 700, fontFamily: "'Space Mono', monospace",
                textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 16,
              }}>
                ✦ Featured
              </div>
              <h2 style={{ fontSize: 52, lineHeight: 1.1, marginBottom: 14, color: "#fff" }}>
                {item.title}
              </h2>
              {item.description && (
                <p style={{ color: "rgba(240,240,245,0.75)", fontSize: 16, lineHeight: 1.7, marginBottom: 24 }}>
                  {item.description}
                </p>
              )}
              {item.linkUrl && (
                <a href={item.linkUrl}>
                  <button className="btn btn-primary" style={{ fontSize: 14, padding: "10px 24px" }}>
                    Read Now →
                  </button>
                </a>
              )}
            </motion.div>
          </div>
        </motion.div>
      </AnimatePresence>

      {}
      {items.length > 1 && (
        <>
          <button
            onClick={prev}
            style={{
              position: "absolute", left: 20, top: "50%", transform: "translateY(-50%)",
              width: 44, height: 44, borderRadius: "50%",
              background: "rgba(0,0,0,0.6)", border: "1px solid var(--border)",
              color: "#fff", fontSize: 18, cursor: "pointer",
              display: "flex", alignItems: "center", justifyContent: "center",
              transition: "background 0.2s",
            }}
          >‹</button>
          <button
            onClick={next}
            style={{
              position: "absolute", right: 20, top: "50%", transform: "translateY(-50%)",
              width: 44, height: 44, borderRadius: "50%",
              background: "rgba(0,0,0,0.6)", border: "1px solid var(--border)",
              color: "#fff", fontSize: 18, cursor: "pointer",
              display: "flex", alignItems: "center", justifyContent: "center",
            }}
          >›</button>
        </>
      )}

      {}
      <div style={{
        position: "absolute", bottom: 20, left: "50%", transform: "translateX(-50%)",
        display: "flex", gap: 8,
      }}>
        {items.map((_, i) => (
          <button
            key={i}
            onClick={() => setCurrent(i)}
            style={{
              width: i === current ? 24 : 8, height: 8,
              borderRadius: 4,
              background: i === current ? "var(--accent)" : "rgba(255,255,255,0.3)",
              border: "none", cursor: "pointer",
              transition: "all 0.3s",
            }}
          />
        ))}
      </div>
    </div>
  );
}