import React from "react";
import { Routes, Route } from "react-router-dom";
import { AnimatePresence } from "framer-motion";

// Public pages
import HomePage from "./pages/Home";
import BrowsePage from "./pages/Browse";
import ComicDetail from "./pages/ComicDetail";
import ChapterReader from "./pages/ChapterReader";
import LoginPage from "./pages/Login";
import FavoritesPage from "./pages/Favorites";
import RequestPublishPage from "./pages/RequestPublish";
import GenresPage from "./pages/Genres";

// Dashboards
import AdminDashboard from "./pages/admin/AdminDashboard";
import PublisherDashboard from "./pages/publisher/PublisherDashboard";

// ── Publish comic flow ───────────────────────────────────────────────────────
import PublishChoose from "./pages/publisher/PublishChoose";
import PublishManual from "./pages/publisher/PublishManual";
import PublishFromMangaDex from "./pages/publisher/PublishFromMangaDex";
import PublishFromMangaHook from "./pages/publisher/PublishFromMangaHook";
import EditComic from "./pages/publisher/EditComic";

// ── Add chapter flow ─────────────────────────────────────────────────────────
import AddChapterChoose from "./pages/publisher/AddChapterChoose";
import AddChapterManual from "./pages/publisher/AddChapterManual";
import AddChapterFromMangaDex from "./pages/publisher/AddChapterFromMangaDex";
import AddChapterFromMangaHook from "./pages/publisher/AddChapterFromMangaHook";

export default function App() {
  return (
    <AnimatePresence mode="wait">
      <Routes>
        {/* ── Public ─────────────────────────────────────────────────── */}
        <Route path="/"                                       element={<HomePage />} />
        <Route path="/browse"                                 element={<BrowsePage />} />
        <Route path="/genres"                                 element={<GenresPage />} />
        <Route path="/comic/:slug"                            element={<ComicDetail />} />
        <Route path="/comic/:slug/chapter/:chapterId"         element={<ChapterReader />} />
        <Route path="/login"                                  element={<LoginPage />} />
        <Route path="/register"                               element={<LoginPage />} />
        <Route path="/favorites"                              element={<FavoritesPage />} />
        <Route path="/request-publish"                        element={<RequestPublishPage />} />

        {/* ── Publish comic ───────────────────────────────────────────── */}
        <Route path="/publish"                                element={<PublishChoose />} />
        <Route path="/publish/manual"                         element={<PublishManual />} />
        <Route path="/publish/mangadex"                       element={<PublishFromMangaDex />} />
        <Route path="/publish/mangahook"                      element={<PublishFromMangaHook />} />
        <Route path="/edit-comic/:id"                         element={<EditComic />} />

        {/* ── Add chapter ─────────────────────────────────────────────── */}
        <Route path="/publish-chapter/:comicId"               element={<AddChapterChoose />} />
        <Route path="/publish-chapter/:comicId/manual"        element={<AddChapterManual />} />
        <Route path="/publish-chapter/:comicId/mangadex"      element={<AddChapterFromMangaDex />} />
        <Route path="/publish-chapter/:comicId/mangahook"     element={<AddChapterFromMangaHook />} />

        {/* ── Dashboards ──────────────────────────────────────────────── */}
        <Route path="/dashboard"                              element={<PublisherDashboard />} />
        <Route path="/admin"                                  element={<AdminDashboard />} />
      </Routes>
    </AnimatePresence>
  );
}

// import React from "react";
// import { Routes, Route } from "react-router-dom";
// import { AnimatePresence } from "framer-motion";
// import HomePage from "./pages/Home";
// import BrowsePage from "./pages/Browse";
// import ComicDetail from "./pages/ComicDetail";
// import ChapterReader from "./pages/ChapterReader";
// import LoginPage from "./pages/Login";
// import FavoritesPage from "./pages/Favorites";
// import RequestPublishPage from "./pages/RequestPublish";
// import GenresPage from "./pages/Genres";
// import AdminDashboard from "./pages/admin/AdminDashboard";
// import PublisherDashboard from "./pages/publisher/PublisherDashboard";
// import PublishChapter from "./pages/publisher/PublishChapter";

// // Publish flow — three separate pages
// import PublishChoose from "./pages/publisher/PublishChoose";
// import PublishManual from "./pages/publisher/PublishManual";
// import PublishFromMangaDex from "./pages/publisher/PublishFromMangaDex";
// import EditComic from "./pages/publisher/EditComic";

// export default function App() {
//   return (
//     <AnimatePresence mode="wait">
//       <Routes>
//         <Route path="/"                                   element={<HomePage />} />
//         <Route path="/browse"                             element={<BrowsePage />} />
//         <Route path="/genres"                             element={<GenresPage />} />
//         <Route path="/comic/:slug"                        element={<ComicDetail />} />
//         <Route path="/comic/:slug/chapter/:chapterId"     element={<ChapterReader />} />
//         <Route path="/login"                              element={<LoginPage />} />
//         <Route path="/register"                           element={<LoginPage />} />
//         <Route path="/favorites"                          element={<FavoritesPage />} />
//         <Route path="/request-publish"                    element={<RequestPublishPage />} />

//         {/* Publish flow */}
//         <Route path="/publish"                            element={<PublishChoose />} />
//         <Route path="/publish/manual"                     element={<PublishManual />} />
//         <Route path="/publish/mangadex"                   element={<PublishFromMangaDex />} />
//         <Route path="/edit-comic/:id"                     element={<EditComic />} />

//         <Route path="/publish-chapter/:comicId"           element={<PublishChapter />} />
//         <Route path="/admin"                              element={<AdminDashboard />} />
//         <Route path="/dashboard"                          element={<PublisherDashboard />} />
//       </Routes>
//     </AnimatePresence>
//   );
// }

// import { Routes, Route } from "react-router-dom";
// import { AnimatePresence } from "framer-motion";
// import HomePage from "./pages/Home";
// import BrowsePage from "./pages/Browse";
// import ComicDetail from "./pages/ComicDetail";
// import ChapterReader from "./pages/ChapterReader";
// import LoginPage from "./pages/Login";
// import FavoritesPage from "./pages/Favorites";
// import RequestPublishPage from "./pages/RequestPublish";
// import PublishPage from "./pages/Publish";
// import GenresPage from "./pages/Genres";
// import AdminDashboard from "./pages/admin/AdminDashboard";
// import PublisherDashboard from "./pages/publisher/PublisherDashboard";
// import PublishChapter from "./pages/publisher/PublishChapter";

// export default function App() {
//   return (
//     <AnimatePresence mode="wait">
//       <Routes>
//         <Route path="/" element={<HomePage />} />
//         <Route path="/browse" element={<BrowsePage />} />
//         <Route path="/genres" element={<GenresPage />} />
//         <Route path="/comic/:slug" element={<ComicDetail />} />
//         <Route path="/comic/:slug/chapter/:chapterId" element={<ChapterReader />} />
//         <Route path="/login" element={<LoginPage />} />
//         <Route path="/register" element={<LoginPage />} />
//         <Route path="/favorites" element={<FavoritesPage />} />
//         <Route path="/request-publish" element={<RequestPublishPage />} />
//         <Route path="/publish" element={<PublishPage />} />
//         <Route path="/edit-comic/:id" element={<PublishPage />} />
//         <Route path="/publish-chapter/:comicId" element={<PublishChapter />} />
//         <Route path="/admin" element={<AdminDashboard />} />
//         <Route path="/dashboard" element={<PublisherDashboard />} />
//       </Routes>
//     </AnimatePresence>
//   );
// }