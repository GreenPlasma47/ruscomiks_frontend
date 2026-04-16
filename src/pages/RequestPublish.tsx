import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/layout/Navbar";
import api from "../lib/api";
import { useAuthStore } from "../lib/store";

export default function RequestPublishPage() {
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const [message, setMessage] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  if (!user) { navigate("/login"); return null; }
  if (user.role !== "reader") {
    return (
      <div style={{ minHeight: "100vh" }}>
        <Navbar />
        <div style={{ textAlign: "center", padding: "80px 24px" }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>✅</div>
          <h2 style={{ fontSize: 28, marginBottom: 8 }}>You're already a {user.role}!</h2>
          <p style={{ color: "var(--text2)" }}>You already have publishing privileges.</p>
        </div>
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(""); setLoading(true);
    try {
      await api.post("/publish-requests", { message });
      setSubmitted(true);
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to submit request");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: "100vh" }}>
      <Navbar />
      <div className="page-container" style={{ paddingTop: 60, paddingBottom: 60, maxWidth: 640 }}>
        <div style={{ textAlign: "center", marginBottom: 40 }}>
          <div style={{ fontSize: 56, marginBottom: 16 }}>✏️</div>
          <h1 style={{ fontSize: 36, marginBottom: 12 }}>Become a Publisher</h1>
          <p style={{ color: "var(--text2)", lineHeight: 1.8 }}>
            Want to share your manga or comics with the world? Send a request to the admin and you'll be upgraded to Publisher status once approved.
          </p>
        </div>

        {submitted ? (
          <div style={{
            padding: 32, background: "rgba(6,214,160,0.1)", border: "1px solid rgba(6,214,160,0.3)",
            borderRadius: "var(--radius-lg)", textAlign: "center",
          }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>🎉</div>
            <h2 style={{ fontSize: 24, color: "var(--success)", marginBottom: 8 }}>Request Submitted!</h2>
            <p style={{ color: "var(--text2)" }}>The admin will review your request soon. You'll be promoted once approved.</p>
          </div>
        ) : (
          <div style={{
            background: "var(--bg2)", border: "1px solid var(--border)",
            borderRadius: "var(--radius-lg)", padding: 32,
          }}>
            <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 20 }}>
              <div className="form-group">
                <label>Your Message (Optional)</label>
                <textarea
                  className="input"
                  placeholder="Tell the admin why you want to publish comics..."
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  style={{ minHeight: 140 }}
                />
              </div>

              {error && (
                <div style={{
                  padding: "10px 14px", background: "rgba(230,57,70,0.1)",
                  border: "1px solid rgba(230,57,70,0.3)", borderRadius: "var(--radius)",
                  color: "var(--accent)", fontSize: 14,
                }}>
                  {error}
                </div>
              )}

              <button type="submit" className="btn btn-primary" disabled={loading} style={{ justifyContent: "center", padding: 14, fontSize: 15 }}>
                {loading ? "Submitting..." : "Submit Request"}
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}