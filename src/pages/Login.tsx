import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import api from "../lib/api";
import { useAuthStore } from "../lib/store";

export default function LoginPage() {
  const navigate = useNavigate();
  const { setAuth } = useAuthStore();
  const [isRegister, setIsRegister] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(""); setLoading(true);
    try {
      const endpoint = isRegister ? "/auth/register" : "/auth/login";
      const payload = isRegister ? { name, email, password } : { email, password };
      const r = await api.post(endpoint, payload);
      setAuth(r.data.user, r.data.token);
      navigate("/");
    } catch (err: any) {
      setError(err.response?.data?.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center",
      background: "var(--bg)", position: "relative", overflow: "hidden",
    }}>
      {}
      <div style={{
        position: "absolute", inset: 0,
        backgroundImage: "radial-gradient(circle at 20% 50%, rgba(230,57,70,0.08) 0%, transparent 50%), radial-gradient(circle at 80% 50%, rgba(123,45,139,0.08) 0%, transparent 50%)",
      }} />
      <div style={{
        position: "absolute", inset: 0,
        backgroundImage: "radial-gradient(circle, rgba(230,57,70,0.04) 1px, transparent 1px)",
        backgroundSize: "32px 32px",
      }} />

      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        style={{ width: "100%", maxWidth: 440, padding: "0 24px", position: "relative", zIndex: 1 }}
      >
        {}
        <div style={{ textAlign: "center", marginBottom: 32 }}>
          <Link to="/">
            <span className="site-title" style={{ fontSize: 48 }}>RUSCOMIKS</span>
          </Link>
          <p style={{ color: "var(--text3)", fontSize: 13, fontFamily: "'Space Mono', monospace", marginTop: 4 }}>
            {isRegister ? "Create your account" : "Welcome back, reader"}
          </p>
        </div>

        <div style={{
          background: "var(--bg2)", border: "1px solid var(--border)",
          borderRadius: "var(--radius-lg)", padding: 32,
        }}>
          {}
          <div style={{
            display: "flex", background: "var(--bg3)", borderRadius: "var(--radius)",
            padding: 4, marginBottom: 28,
          }}>
            {["Sign In", "Register"].map((label, i) => (
              <button
                key={label}
                onClick={() => { setIsRegister(i === 1); setError(""); }}
                style={{
                  flex: 1, padding: "8px", border: "none", borderRadius: 6,
                  fontFamily: "'Space Mono', monospace", fontSize: 13, fontWeight: 700,
                  cursor: "pointer", transition: "all 0.2s",
                  background: isRegister === (i === 1) ? "var(--accent)" : "transparent",
                  color: isRegister === (i === 1) ? "#fff" : "var(--text2)",
                }}
              >
                {label}
              </button>
            ))}
          </div>

          <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <AnimatePresence mode="wait">
              {isRegister && (
                <motion.div
                  key="name"
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.2 }}
                  className="form-group"
                >
                  <label>Display Name</label>
                  <input className="input" placeholder="Your name" value={name} onChange={(e) => setName(e.target.value)} required />
                </motion.div>
              )}
            </AnimatePresence>

            <div className="form-group">
              <label>Email</label>
              <input className="input" type="email" placeholder="you@example.com" value={email} onChange={(e) => setEmail(e.target.value)} required />
            </div>

            <div className="form-group">
              <label>Password</label>
              <div style={{ position: "relative" }}>
                <input
                  className="input"
                  type={showPw ? "text" : "password"}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  style={{ paddingRight: 44 }}
                />
                <button
                  type="button"
                  onClick={() => setShowPw((p) => !p)}
                  style={{
                    position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)",
                    background: "none", border: "none", cursor: "pointer",
                    color: "var(--text3)", fontSize: 16,
                  }}
                >
                  {showPw ? "🙈" : "👁"}
                </button>
              </div>
            </div>

            {error && (
              <div style={{
                padding: "10px 14px", background: "rgba(230,57,70,0.1)",
                border: "1px solid rgba(230,57,70,0.3)", borderRadius: "var(--radius)",
                color: "var(--accent)", fontSize: 13,
              }}>
                {error}
              </div>
            )}

            <button
              type="submit"
              className="btn btn-primary"
              disabled={loading}
              style={{ justifyContent: "center", fontSize: 15, padding: "12px" }}
            >
              {loading ? "Please wait..." : isRegister ? "Create Account" : "Sign In"}
            </button>
          </form>
        </div>
      </motion.div>
    </div>
  );
}