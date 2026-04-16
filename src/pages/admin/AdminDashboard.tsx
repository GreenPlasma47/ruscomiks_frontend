import { useEffect, useState, useCallback } from "react";
import { useNavigate, Link } from "react-router-dom";
import { motion } from "framer-motion";
import Navbar from "../../components/layout/Navbar";
import api from "../../lib/api";
import { useAuthStore } from "../../lib/store";

type Tab = "overview" | "users" | "genres" | "carousel" | "comics" | "requests";

interface User { id: number; name: string; email: string; role: string; createdAt: string; }
interface Genre { id: number; name: string; slug: string; }
interface CarouselItem { id: number; title: string; description?: string; imageUrl: string; linkUrl?: string; sortOrder: number; isActive: boolean; }
interface Comic { id: number; title: string; slug: string; status: string; viewCount: number; publisher: { name: string }; }
interface Request { id: number; message?: string; status: string; createdAt: string; user: { id: number; name: string; email: string; role: string; }; }

export default function AdminDashboard() {
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const [tab, setTab] = useState<Tab>("overview");

  const [users, setUsers] = useState<User[]>([]);
  const [genres, setGenres] = useState<Genre[]>([]);
  const [carousel, setCarousel] = useState<CarouselItem[]>([]);
  const [comics, setComics] = useState<Comic[]>([]);
  const [requests, setRequests] = useState<Request[]>([]);

  const [newGenre, setNewGenre] = useState("");
  const [editGenre, setEditGenre] = useState<Genre | null>(null);

  const [carouselForm, setCarouselForm] = useState({ title: "", description: "", imageUrl: "", linkUrl: "", sortOrder: 0, isActive: true });
  const [editCarousel, setEditCarousel] = useState<CarouselItem | null>(null);

  const fetchAll = useCallback(() => {
    api.get("/users").then((r) => setUsers(r.data)).catch(() => {});
    api.get("/genres").then((r) => setGenres(r.data)).catch(() => {});
    api.get("/carousel/all").then((r) => setCarousel(r.data)).catch(() => {});
    api.get("/comics?limit=100").then((r) => setComics(r.data.comics)).catch(() => {});
    api.get("/publish-requests").then((r) => setRequests(r.data)).catch(() => {});
  }, []);

  useEffect(() => {
    if (!user || user.role !== "admin") { navigate("/"); return; }
    fetchAll();
  }, [user, navigate, fetchAll]);

  if (!user || user.role !== "admin") return null;

  const TABS: { key: Tab; label: string; icon: string }[] = [
    { key: "overview", label: "Overview", icon: "📊" },
    { key: "users", label: "Users", icon: "👥" },
    { key: "requests", label: "Requests", icon: "📬" },
    { key: "comics", label: "Comics", icon: "📚" },
    { key: "genres", label: "Genres", icon: "🏷️" },
    { key: "carousel", label: "Carousel", icon: "🎠" },
  ];

  const handleAddGenre = async () => {
    if (!newGenre.trim()) return;
    await api.post("/genres", { name: newGenre });
    setNewGenre("");
    api.get("/genres").then((r) => setGenres(r.data));
  };
  const handleUpdateGenre = async () => {
    if (!editGenre) return;
    await api.put(`/genres/${editGenre.id}`, { name: editGenre.name });
    setEditGenre(null);
    api.get("/genres").then((r) => setGenres(r.data));
  };
  const handleDeleteGenre = async (id: number) => {
    if (!confirm("Delete genre?")) return;
    await api.delete(`/genres/${id}`);
    setGenres(genres.filter((g) => g.id !== id));
  };

  const handleSaveCarousel = async () => {
    if (editCarousel) {
      await api.put(`/carousel/${editCarousel.id}`, carouselForm);
      setEditCarousel(null);
    } else {
      await api.post("/carousel", carouselForm);
    }
    setCarouselForm({ title: "", description: "", imageUrl: "", linkUrl: "", sortOrder: 0, isActive: true });
    api.get("/carousel/all").then((r) => setCarousel(r.data));
  };
  const handleDeleteCarousel = async (id: number) => {
    if (!confirm("Delete carousel item?")) return;
    await api.delete(`/carousel/${id}`);
    setCarousel(carousel.filter((c) => c.id !== id));
  };
  const startEditCarousel = (item: CarouselItem) => {
    setEditCarousel(item);
    setCarouselForm({ title: item.title, description: item.description || "", imageUrl: item.imageUrl, linkUrl: item.linkUrl || "", sortOrder: item.sortOrder, isActive: item.isActive });
    setTab("carousel");
  };

  const handlePromote = async (id: number) => {
    await api.patch(`/users/${id}/promote`);
    fetchAll();
  };
  const handleDemote = async (id: number) => {
    await api.patch(`/users/${id}/demote`);
    fetchAll();
  };

  const handleApprove = async (id: number) => {
    await api.patch(`/publish-requests/${id}/approve`);
    fetchAll();
  };
  const handleReject = async (id: number) => {
    await api.patch(`/publish-requests/${id}/reject`);
    fetchAll();
  };

  const handleDeleteComic = async (id: number, title: string) => {
    if (!confirm(`Delete "${title}"? This cannot be undone.`)) return;
    await api.delete(`/comics/${id}`);
    setComics(comics.filter((c) => c.id !== id));
  };

  const pendingRequests = requests.filter((r) => r.status === "pending").length;

  return (
    <div style={{ minHeight: "100vh" }}>
      <Navbar />
      <div className="page-container" style={{ paddingTop: 32, paddingBottom: 60 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 32 }}>
          <h1 style={{ fontSize: 36 }}>Admin Dashboard</h1>
          <span className="badge" style={{ background: "rgba(230,57,70,0.2)", color: "var(--accent)", fontSize: 12 }}>ADMIN</span>
        </div>

        {}
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 32, borderBottom: "1px solid var(--border)", paddingBottom: 16 }}>
          {TABS.map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className="btn"
              style={{
                background: tab === t.key ? "var(--accent)" : "var(--bg3)",
                color: tab === t.key ? "#fff" : "var(--text2)",
                border: `1px solid ${tab === t.key ? "var(--accent)" : "var(--border)"}`,
                position: "relative",
              }}
            >
              {t.icon} {t.label}
              {t.key === "requests" && pendingRequests > 0 && (
                <span style={{
                  position: "absolute", top: -6, right: -6,
                  background: "var(--accent3)", color: "#000",
                  borderRadius: "50%", width: 18, height: 18,
                  fontSize: 11, fontWeight: 700,
                  display: "flex", alignItems: "center", justifyContent: "center",
                }}>{pendingRequests}</span>
              )}
            </button>
          ))}
        </div>

        {}
        {tab === "overview" && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: 16, marginBottom: 32 }}>
              {[
                { label: "Total Users", value: users.length, icon: "👥", color: "var(--info)" },
                { label: "Publishers", value: users.filter((u) => u.role === "publisher").length, icon: "✏️", color: "var(--accent3)" },
                { label: "Comics", value: comics.length, icon: "📚", color: "var(--success)" },
                { label: "Pending Requests", value: pendingRequests, icon: "📬", color: "var(--accent)" },
                { label: "Genres", value: genres.length, icon: "🏷️", color: "var(--purple)" },
                { label: "Carousel Items", value: carousel.length, icon: "🎠", color: "var(--accent2)" },
              ].map((s) => (
                <div key={s.label} style={{
                  background: "var(--card)", border: "1px solid var(--border)",
                  borderRadius: "var(--radius-lg)", padding: 20,
                }}>
                  <div style={{ fontSize: 28, marginBottom: 8 }}>{s.icon}</div>
                  <div style={{ fontSize: 32, fontWeight: 700, fontFamily: "'Bebas Neue', sans-serif", color: s.color }}>
                    {s.value}
                  </div>
                  <div style={{ fontSize: 13, color: "var(--text2)", fontFamily: "'Space Mono', monospace" }}>{s.label}</div>
                </div>
              ))}
            </div>
            <Link to="/publish">
              <button className="btn btn-primary" style={{ fontSize: 14, padding: "12px 24px" }}>
                + Publish New Comic
              </button>
            </Link>
          </motion.div>
        )}

        {}
        {tab === "users" && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <h2 style={{ fontSize: 24, marginBottom: 20 }}>All Users ({users.length})</h2>
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr style={{ borderBottom: "1px solid var(--border)" }}>
                    {["Name", "Email", "Role", "Joined", "Actions"].map((h) => (
                      <th key={h} style={{ padding: "10px 16px", textAlign: "left", fontSize: 11, fontFamily: "'Space Mono', monospace", color: "var(--text3)", textTransform: "uppercase", letterSpacing: "0.08em" }}>
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {users.map((u) => (
                    <tr key={u.id} style={{ borderBottom: "1px solid var(--border)" }}>
                      <td style={{ padding: "12px 16px" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                          <div style={{
                            width: 32, height: 32, borderRadius: "50%",
                            background: "linear-gradient(135deg, var(--accent), var(--purple))",
                            display: "flex", alignItems: "center", justifyContent: "center",
                            fontWeight: 700, fontSize: 13, color: "#fff",
                          }}>{u.name[0].toUpperCase()}</div>
                          <span style={{ fontWeight: 600 }}>{u.name}</span>
                        </div>
                      </td>
                      <td style={{ padding: "12px 16px", color: "var(--text2)", fontSize: 13 }}>{u.email}</td>
                      <td style={{ padding: "12px 16px" }}>
                        <span className="badge" style={{
                          background: u.role === "admin" ? "rgba(230,57,70,0.2)" : u.role === "publisher" ? "rgba(255,214,10,0.2)" : "rgba(76,201,240,0.15)",
                          color: u.role === "admin" ? "var(--accent)" : u.role === "publisher" ? "var(--accent3)" : "var(--info)",
                        }}>{u.role}</span>
                      </td>
                      <td style={{ padding: "12px 16px", color: "var(--text3)", fontSize: 12 }}>
                        {new Date(u.createdAt).toLocaleDateString()}
                      </td>
                      <td style={{ padding: "12px 16px" }}>
                        {u.role !== "admin" && (
                          <div style={{ display: "flex", gap: 8 }}>
                            {u.role === "reader" && (
                              <button className="btn btn-outline" style={{ fontSize: 12, padding: "4px 12px", color: "var(--accent3)", borderColor: "var(--accent3)" }} onClick={() => handlePromote(u.id)}>
                                Promote
                              </button>
                            )}
                            {u.role === "publisher" && (
                              <button className="btn btn-outline" style={{ fontSize: 12, padding: "4px 12px", color: "var(--accent)", borderColor: "var(--accent)" }} onClick={() => handleDemote(u.id)}>
                                Demote
                              </button>
                            )}
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </motion.div>
        )}

        {}
        {tab === "requests" && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <h2 style={{ fontSize: 24, marginBottom: 20 }}>Publisher Requests</h2>
            {requests.length === 0 ? (
              <div style={{ color: "var(--text3)", fontFamily: "'Space Mono', monospace", padding: "40px 0" }}>No requests yet</div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                {requests.map((req) => (
                  <div key={req.id} style={{
                    background: "var(--card)", border: "1px solid var(--border)",
                    borderRadius: "var(--radius-lg)", padding: 20,
                    borderLeft: `3px solid ${req.status === "pending" ? "var(--accent3)" : req.status === "approved" ? "var(--success)" : "var(--accent)"}`,
                  }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 12 }}>
                      <div>
                        <div style={{ fontWeight: 700, fontSize: 16 }}>{req.user.name}</div>
                        <div style={{ color: "var(--text2)", fontSize: 13 }}>{req.user.email}</div>
                        {req.message && <p style={{ color: "var(--text2)", marginTop: 8, fontSize: 14, lineHeight: 1.6 }}>{req.message}</p>}
                        <div style={{ fontSize: 12, color: "var(--text3)", marginTop: 8 }}>
                          {new Date(req.createdAt).toLocaleDateString()} — <span style={{ color: req.status === "pending" ? "var(--accent3)" : req.status === "approved" ? "var(--success)" : "var(--accent)", fontWeight: 700 }}>{req.status}</span>
                        </div>
                      </div>
                      {req.status === "pending" && (
                        <div style={{ display: "flex", gap: 8 }}>
                          <button className="btn" onClick={() => handleApprove(req.id)} style={{ background: "rgba(6,214,160,0.2)", color: "var(--success)", border: "1px solid rgba(6,214,160,0.3)" }}>
                            ✓ Approve
                          </button>
                          <button className="btn" onClick={() => handleReject(req.id)} style={{ background: "rgba(230,57,70,0.1)", color: "var(--accent)", border: "1px solid rgba(230,57,70,0.3)" }}>
                            ✕ Reject
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </motion.div>
        )}

        {}
        {tab === "comics" && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
              <h2 style={{ fontSize: 24 }}>All Comics ({comics.length})</h2>
              <Link to="/publish">
                <button className="btn btn-primary">+ New Comic</button>
              </Link>
            </div>
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr style={{ borderBottom: "1px solid var(--border)" }}>
                    {["Title", "Publisher", "Status", "Views", "Actions"].map((h) => (
                      <th key={h} style={{ padding: "10px 16px", textAlign: "left", fontSize: 11, fontFamily: "'Space Mono', monospace", color: "var(--text3)", textTransform: "uppercase" }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {comics.map((c) => (
                    <tr key={c.id} style={{ borderBottom: "1px solid var(--border)" }}>
                      <td style={{ padding: "12px 16px", fontWeight: 600 }}>{c.title}</td>
                      <td style={{ padding: "12px 16px", color: "var(--text2)", fontSize: 13 }}>{c.publisher?.name}</td>
                      <td style={{ padding: "12px 16px" }}>
                        <span className={`badge badge-${c.status}`}>{c.status}</span>
                      </td>
                      <td style={{ padding: "12px 16px", color: "var(--text2)", fontSize: 13 }}>{c.viewCount.toLocaleString()}</td>
                      <td style={{ padding: "12px 16px" }}>
                        <div style={{ display: "flex", gap: 8 }}>
                          <Link to={`/edit-comic/${c.id}`}>
                            <button className="btn btn-outline" style={{ fontSize: 12, padding: "4px 12px" }}>Edit</button>
                          </Link>
                          <button className="btn" onClick={() => handleDeleteComic(c.id, c.title)} style={{ fontSize: 12, padding: "4px 12px", background: "rgba(230,57,70,0.1)", color: "var(--accent)", border: "1px solid rgba(230,57,70,0.3)" }}>
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </motion.div>
        )}

        {}
        {tab === "genres" && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <h2 style={{ fontSize: 24, marginBottom: 20 }}>Manage Genres</h2>

            {}
            <div style={{ display: "flex", gap: 12, marginBottom: 28, maxWidth: 480 }}>
              <input
                className="input"
                placeholder="New genre name..."
                value={newGenre}
                onChange={(e) => setNewGenre(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleAddGenre()}
              />
              <button className="btn btn-primary" onClick={handleAddGenre}>Add</button>
            </div>

            <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
              {genres.map((g) => (
                <div key={g.id} style={{
                  display: "flex", alignItems: "center", gap: 8,
                  background: "var(--bg3)", border: "1px solid var(--border)",
                  borderRadius: "var(--radius)", padding: "6px 12px",
                }}>
                  {editGenre?.id === g.id ? (
                    <>
                      <input
                        className="input"
                        value={editGenre.name}
                        onChange={(e) => setEditGenre({ ...editGenre, name: e.target.value })}
                        style={{ width: 120, padding: "4px 8px", fontSize: 13 }}
                      />
                      <button className="btn btn-primary" onClick={handleUpdateGenre} style={{ padding: "4px 10px", fontSize: 12 }}>Save</button>
                      <button className="btn btn-ghost" onClick={() => setEditGenre(null)} style={{ padding: "4px 8px", fontSize: 12 }}>✕</button>
                    </>
                  ) : (
                    <>
                      <span style={{ fontFamily: "'Space Mono', monospace", fontSize: 13 }}>{g.name}</span>
                      <button className="btn btn-ghost" onClick={() => setEditGenre(g)} style={{ padding: "2px 6px", fontSize: 12 }}>✏️</button>
                      <button className="btn btn-ghost" onClick={() => handleDeleteGenre(g.id)} style={{ padding: "2px 6px", fontSize: 12, color: "var(--accent)" }}>✕</button>
                    </>
                  )}
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {}
        {tab === "carousel" && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <h2 style={{ fontSize: 24, marginBottom: 20 }}>{editCarousel ? "Edit Carousel Item" : "Add Carousel Item"}</h2>

            {}
            <div style={{ background: "var(--bg2)", border: "1px solid var(--border)", borderRadius: "var(--radius-lg)", padding: 24, marginBottom: 32, maxWidth: 640 }}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                <div className="form-group" style={{ gridColumn: "1 / -1" }}>
                  <label>Title *</label>
                  <input className="input" value={carouselForm.title} onChange={(e) => setCarouselForm({ ...carouselForm, title: e.target.value })} placeholder="Banner title" />
                </div>
                <div className="form-group" style={{ gridColumn: "1 / -1" }}>
                  <label>Description</label>
                  <textarea className="input" value={carouselForm.description} onChange={(e) => setCarouselForm({ ...carouselForm, description: e.target.value })} placeholder="Short description..." style={{ minHeight: 80 }} />
                </div>
                <div className="form-group" style={{ gridColumn: "1 / -1" }}>
                  <label>Image URL *</label>
                  <input className="input" value={carouselForm.imageUrl} onChange={(e) => setCarouselForm({ ...carouselForm, imageUrl: e.target.value })} placeholder="https://..." />
                </div>
                <div className="form-group">
                  <label>Link URL</label>
                  <input className="input" value={carouselForm.linkUrl} onChange={(e) => setCarouselForm({ ...carouselForm, linkUrl: e.target.value })} placeholder="/comic/my-manga" />
                </div>
                <div className="form-group">
                  <label>Sort Order</label>
                  <input className="input" type="number" value={carouselForm.sortOrder} onChange={(e) => setCarouselForm({ ...carouselForm, sortOrder: Number(e.target.value) })} />
                </div>
                <div className="form-group" style={{ gridColumn: "1 / -1", flexDirection: "row", alignItems: "center", gap: 12 }}>
                  <input type="checkbox" checked={carouselForm.isActive} onChange={(e) => setCarouselForm({ ...carouselForm, isActive: e.target.checked })} id="isActive" />
                  <label htmlFor="isActive" style={{ textTransform: "none", letterSpacing: 0, cursor: "pointer" }}>Active (visible on homepage)</label>
                </div>
              </div>
              <div style={{ display: "flex", gap: 10, marginTop: 16 }}>
                {editCarousel && <button className="btn btn-ghost" onClick={() => { setEditCarousel(null); setCarouselForm({ title: "", description: "", imageUrl: "", linkUrl: "", sortOrder: 0, isActive: true }); }}>Cancel</button>}
                <button className="btn btn-primary" onClick={handleSaveCarousel}>{editCarousel ? "Save Changes" : "Add Item"}</button>
              </div>
            </div>

            {}
            <h3 style={{ fontSize: 20, marginBottom: 16 }}>Current Carousel ({carousel.length})</h3>
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {carousel.map((item) => (
                <div key={item.id} style={{
                  display: "flex", gap: 16, alignItems: "center",
                  background: "var(--card)", border: "1px solid var(--border)",
                  borderRadius: "var(--radius-lg)", padding: 16,
                  opacity: item.isActive ? 1 : 0.5,
                }}>
                  <img src={item.imageUrl} alt={item.title} style={{ width: 80, height: 50, objectFit: "cover", borderRadius: "var(--radius)" }} onError={(e) => ((e.currentTarget as HTMLImageElement).style.display = "none")} />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 700 }}>{item.title}</div>
                    <div style={{ fontSize: 12, color: "var(--text3)", fontFamily: "'Space Mono', monospace" }}>Order: {item.sortOrder} • {item.isActive ? "Active" : "Hidden"}</div>
                  </div>
                  <div style={{ display: "flex", gap: 8 }}>
                    <button className="btn btn-outline" onClick={() => startEditCarousel(item)} style={{ fontSize: 12, padding: "4px 12px" }}>Edit</button>
                    <button className="btn" onClick={() => handleDeleteCarousel(item.id)} style={{ fontSize: 12, padding: "4px 12px", background: "rgba(230,57,70,0.1)", color: "var(--accent)", border: "1px solid rgba(230,57,70,0.3)" }}>Delete</button>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}