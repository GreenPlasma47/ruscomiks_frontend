import React, { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuthStore } from "../../lib/store";
import { motion, AnimatePresence } from "framer-motion";

export default function Navbar() {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);      // user dropdown
  const [drawerOpen, setDrawerOpen] = useState(false);  // mobile drawer

  const handleLogout = () => {
    logout();
    navigate("/login");
    setDrawerOpen(false);
  };

  const navLinks = [
    { label: "Browse",           path: "/browse" },
    { label: "Genres",           path: "/genres" },
    ...(user ? [{ label: "Favorites", path: "/favorites" }] : []),
    ...(user?.role === "reader"
      ? [{ label: "Become Publisher", path: "/request-publish" }]
      : []),
    ...(user?.role === "publisher" || user?.role === "admin"
      ? [{ label: "Publish",   path: "/publish"    }]
      : []),
    ...(user?.role === "publisher" || user?.role === "admin"
      ? [{ label: "My Comics", path: "/dashboard"  }]
      : []),
    ...(user?.role === "admin"
      ? [{ label: "Admin",     path: "/admin"      }]
      : []),
  ];

  const isActive = (path: string) => location.pathname.startsWith(path);

  return (
    <nav className="navbar">
      <div className="page-container">
        <div className="navbar-inner">

          {/* Logo */}
          <Link to="/" onClick={() => setDrawerOpen(false)} style={{ flexShrink: 0 }}>
            <span className="site-title" style={{ fontSize: "clamp(24px, 5vw, 32px)" }}>
              RUSCOMIKS
            </span>
          </Link>

          {/* Desktop links */}
          <div className="navbar-links">
            {navLinks.map((l) => (
              <Link key={l.path} to={l.path}>
                <span style={{
                  padding: "6px 14px",
                  borderRadius: "var(--radius)",
                  fontSize: 13,
                  fontFamily: "'Space Mono', monospace",
                  fontWeight: 700,
                  color: isActive(l.path) ? "var(--accent)" : "var(--text2)",
                  background: isActive(l.path) ? "rgba(230,57,70,0.1)" : "transparent",
                  transition: "all 0.2s",
                  display: "block",
                  whiteSpace: "nowrap",
                }}>
                  {l.label}
                </span>
              </Link>
            ))}
          </div>

          {/* Right side: user actions + hamburger */}
          <div className="navbar-user-actions" style={{ display: "flex", alignItems: "center", gap: 10, marginLeft: "auto" }}>

            {/* Desktop user actions */}
            {user ? (
              <div style={{ position: "relative" }} className="hide-mobile">
                <button
                  onClick={() => setMenuOpen((p) => !p)}
                  style={{
                    display: "flex", alignItems: "center", gap: 10,
                    background: "var(--bg3)", border: "1px solid var(--border)",
                    borderRadius: "999px", padding: "6px 16px 6px 6px",
                    cursor: "pointer", color: "var(--text)",
                  }}
                >
                  <div style={{
                    width: 30, height: 30, borderRadius: "50%",
                    background: "linear-gradient(135deg, var(--accent), var(--purple))",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontWeight: 700, fontSize: 14, color: "#fff",
                  }}>
                    {user.name[0].toUpperCase()}
                  </div>
                  <span style={{ fontSize: 13, fontFamily: "'Space Mono', monospace" }}>
                    {user.name}
                  </span>
                  <span style={{ fontSize: 10, color: "var(--text3)" }}>▼</span>
                </button>

                <AnimatePresence>
                  {menuOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: -8, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: -8, scale: 0.95 }}
                      transition={{ duration: 0.15 }}
                      onMouseLeave={() => setMenuOpen(false)}
                      style={{
                        position: "absolute", top: "calc(100% + 8px)", right: 0,
                        background: "var(--bg2)", border: "1px solid var(--border)",
                        borderRadius: "var(--radius-lg)", minWidth: 180,
                        overflow: "hidden", boxShadow: "0 8px 32px rgba(0,0,0,0.5)",
                        zIndex: 200,
                      }}
                    >
                      <div style={{ padding: "12px 16px", borderBottom: "1px solid var(--border)" }}>
                        <div style={{ fontSize: 12, color: "var(--text2)", fontFamily: "'Space Mono', monospace" }}>
                          Logged in as
                        </div>
                        <div style={{ fontSize: 13, fontWeight: 700 }}>{user.name}</div>
                        <span className="badge" style={{
                          marginTop: 4,
                          background: user.role === "admin" ? "rgba(230,57,70,0.2)" : user.role === "publisher" ? "rgba(255,214,10,0.2)" : "rgba(76,201,240,0.2)",
                          color: user.role === "admin" ? "var(--accent)" : user.role === "publisher" ? "var(--accent3)" : "var(--info)",
                        }}>
                          {user.role}
                        </span>
                      </div>
                      <div style={{ padding: 8 }}>
                        <button onClick={handleLogout} className="btn btn-ghost"
                          style={{ width: "100%", justifyContent: "flex-start" }}>
                          Sign Out
                        </button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ) : (
              <div style={{ display: "flex", gap: 8 }} className="hide-mobile">
                <Link to="/login">
                  <button className="btn btn-outline">Sign In</button>
                </Link>
                <Link to="/register">
                  <button className="btn btn-primary">Join Free</button>
                </Link>
              </div>
            )}

            {/* Hamburger — mobile only */}
            <button
              className="navbar-hamburger"
              onClick={() => setDrawerOpen((p) => !p)}
              aria-label="Toggle menu"
            >
              <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
                {drawerOpen ? (
                  /* X icon */
                  <>
                    <line x1="4" y1="4" x2="18" y2="18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                    <line x1="18" y1="4" x2="4" y2="18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                  </>
                ) : (
                  /* Hamburger icon */
                  <>
                    <line x1="3" y1="6"  x2="19" y2="6"  stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                    <line x1="3" y1="11" x2="19" y2="11" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                    <line x1="3" y1="16" x2="19" y2="16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                  </>
                )}
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Mobile drawer */}
      <AnimatePresence>
        {drawerOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            style={{ overflow: "hidden" }}
          >
            <div className="navbar-drawer open">
              {/* User info on mobile */}
              {user && (
                <>
                  <div style={{
                    display: "flex", alignItems: "center", gap: 12,
                    padding: "12px 16px",
                    background: "var(--bg3)", borderRadius: "var(--radius)",
                    marginBottom: 4,
                  }}>
                    <div style={{
                      width: 36, height: 36, borderRadius: "50%",
                      background: "linear-gradient(135deg, var(--accent), var(--purple))",
                      display: "flex", alignItems: "center", justifyContent: "center",
                      fontWeight: 700, fontSize: 16, color: "#fff", flexShrink: 0,
                    }}>
                      {user.name[0].toUpperCase()}
                    </div>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: 14 }}>{user.name}</div>
                      <span className="badge" style={{
                        marginTop: 2,
                        background: user.role === "admin" ? "rgba(230,57,70,0.2)" : user.role === "publisher" ? "rgba(255,214,10,0.2)" : "rgba(76,201,240,0.2)",
                        color: user.role === "admin" ? "var(--accent)" : user.role === "publisher" ? "var(--accent3)" : "var(--info)",
                      }}>
                        {user.role}
                      </span>
                    </div>
                  </div>
                  <div className="navbar-drawer-divider" />
                </>
              )}

              {/* Nav links */}
              {navLinks.map((l) => (
                <Link
                  key={l.path}
                  to={l.path}
                  className={isActive(l.path) ? "active" : ""}
                  onClick={() => setDrawerOpen(false)}
                >
                  {l.label}
                </Link>
              ))}

              <div className="navbar-drawer-divider" />

              {/* Auth buttons */}
              {user ? (
                <button onClick={handleLogout} style={{ color: "var(--accent)" }}>
                  Sign Out
                </button>
              ) : (
                <>
                  <Link to="/login" onClick={() => setDrawerOpen(false)}>
                    Sign In
                  </Link>
                  <Link to="/register" onClick={() => setDrawerOpen(false)}
                    style={{
                      background: "var(--accent)", color: "#fff",
                      borderRadius: "var(--radius)", textAlign: "center",
                      padding: "12px 16px", fontWeight: 700,
                      fontFamily: "'Space Mono', monospace",
                    }}>
                    Join Free
                  </Link>
                </>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
}


// import React, { useState } from "react";
// import { Link, useNavigate, useLocation } from "react-router-dom";
// import { useAuthStore } from "../../lib/store";
// import { motion, AnimatePresence } from "framer-motion";

// export default function Navbar() {
//   const { user, logout } = useAuthStore();
//   const navigate = useNavigate();
//   const location = useLocation();
//   const [menuOpen, setMenuOpen] = useState(false);

//   const handleLogout = () => {
//     logout();
//     navigate("/login");
//   };

//   const navLinks = [
//     { label: "Browse", path: "/browse" },
//     { label: "Genres", path: "/genres" },
//     ...(user ? [{ label: "Favorites", path: "/favorites" }] : []),
//     ...(user?.role === "reader"
//       ? [{ label: "Become Publisher", path: "/request-publish" }]
//       : []),
//     ...(user?.role === "publisher" || user?.role === "admin"
//       ? [{ label: "Publish", path: "/publish" }]
//       : []),
//     ...(user?.role === "admin" ? [{ label: "Admin", path: "/admin" }] : []),
//   ];

//   return (
//     <nav
//       style={{
//         position: "sticky",
//         top: 0,
//         zIndex: 100,
//         background: "rgba(10,10,15,0.92)",
//         backdropFilter: "blur(12px)",
//         borderBottom: "1px solid var(--border)",
//       }}
//     >
//       <div
//         className="page-container"
//         style={{ display: "flex", alignItems: "center", height: 64, gap: 24 }}
//       >
//         {}
//         <Link to="/" style={{ flexShrink: 0 }}>
//           <span className="site-title" style={{ fontSize: 32 }}>
//             RUSCOMIKS
//           </span>
//         </Link>

//         {}
//         <div
//           style={{ display: "flex", gap: 4, flex: 1, alignItems: "center" }}
//         >
//           {navLinks.map((l) => (
//             <Link key={l.path} to={l.path}>
//               <span
//                 style={{
//                   padding: "6px 14px",
//                   borderRadius: "var(--radius)",
//                   fontSize: 13,
//                   fontFamily: "'Space Mono', monospace",
//                   fontWeight: 700,
//                   color: location.pathname.startsWith(l.path)
//                     ? "var(--accent)"
//                     : "var(--text2)",
//                   background: location.pathname.startsWith(l.path)
//                     ? "rgba(230,57,70,0.1)"
//                     : "transparent",
//                   transition: "all 0.2s",
//                   display: "block",
//                 }}
//               >
//                 {l.label}
//               </span>
//             </Link>
//           ))}
//         </div>

//         {}
//         <div
//           style={{
//             display: "flex",
//             gap: 10,
//             alignItems: "center",
//             flexShrink: 0,
//           }}
//         >
//           {user ? (
//             <div style={{ position: "relative" }}>
//               <button
//                 onClick={() => setMenuOpen((p) => !p)}
//                 style={{
//                   display: "flex",
//                   alignItems: "center",
//                   gap: 10,
//                   background: "var(--bg3)",
//                   border: "1px solid var(--border)",
//                   borderRadius: "999px",
//                   padding: "6px 16px 6px 6px",
//                   cursor: "pointer",
//                   color: "var(--text)",
//                 }}
//               >
//                 <div
//                   style={{
//                     width: 30,
//                     height: 30,
//                     borderRadius: "50%",
//                     background:
//                       "linear-gradient(135deg, var(--accent), var(--purple))",
//                     display: "flex",
//                     alignItems: "center",
//                     justifyContent: "center",
//                     fontWeight: 700,
//                     fontSize: 14,
//                     color: "#fff",
//                   }}
//                 >
//                   {user.name[0].toUpperCase()}
//                 </div>
//                 <span
//                   style={{
//                     fontSize: 13,
//                     fontFamily: "'Space Mono', monospace",
//                   }}
//                 >
//                   {user.name}
//                 </span>
//                 <span style={{ fontSize: 10, color: "var(--text3)" }}>▼</span>
//               </button>

//               <AnimatePresence>
//                 {menuOpen && (
//                   <motion.div
//                     initial={{ opacity: 0, y: -8, scale: 0.95 }}
//                     animate={{ opacity: 1, y: 0, scale: 1 }}
//                     exit={{ opacity: 0, y: -8, scale: 0.95 }}
//                     transition={{ duration: 0.15 }}
//                     style={{
//                       position: "absolute",
//                       top: "calc(100% + 8px)",
//                       right: 0,
//                       background: "var(--bg2)",
//                       border: "1px solid var(--border)",
//                       borderRadius: "var(--radius-lg)",
//                       minWidth: 180,
//                       overflow: "hidden",
//                       boxShadow: "0 8px 32px rgba(0,0,0,0.5)",
//                     }}
//                     onMouseLeave={() => setMenuOpen(false)}
//                   >
//                     <div
//                       style={{
//                         padding: "12px 16px",
//                         borderBottom: "1px solid var(--border)",
//                       }}
//                     >
//                       <div
//                         style={{
//                           fontSize: 12,
//                           color: "var(--text2)",
//                           fontFamily: "'Space Mono', monospace",
//                         }}
//                       >
//                         Logged in as
//                       </div>
//                       <div style={{ fontSize: 13, fontWeight: 700 }}>
//                         {user.name}
//                       </div>
//                       <span
//                         className="badge"
//                         style={{
//                           marginTop: 4,
//                           background:
//                             user.role === "admin"
//                               ? "rgba(230,57,70,0.2)"
//                               : user.role === "publisher"
//                                 ? "rgba(255,214,10,0.2)"
//                                 : "rgba(76,201,240,0.2)",
//                           color:
//                             user.role === "admin"
//                               ? "var(--accent)"
//                               : user.role === "publisher"
//                                 ? "var(--accent3)"
//                                 : "var(--info)",
//                         }}
//                       >
//                         {user.role}
//                       </span>
//                     </div>
//                     <div style={{ padding: 8 }}>
//                       <button
//                         onClick={handleLogout}
//                         className="btn btn-ghost"
//                         style={{
//                           width: "100%",
//                           justifyContent: "flex-start",
//                         }}
//                       >
//                         Sign Out
//                       </button>
//                     </div>
//                   </motion.div>
//                 )}
//               </AnimatePresence>
//             </div>
//           ) : (
//             <>
//               <Link to="/login">
//                 <button className="btn btn-outline">Sign In</button>
//               </Link>
//               <Link to="/register">
//                 <button className="btn btn-primary">Join Free</button>
//               </Link>
//             </>
//           )}
//         </div>
//       </div>
//     </nav>
//   );
// }