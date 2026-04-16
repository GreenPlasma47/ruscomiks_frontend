import { create } from "zustand";

interface User {
  id: number;
  name: string;
  email: string;
  role: "reader" | "publisher" | "admin";
  avatar?: string;
}

interface AuthState {
  user: User | null;
  token: string | null;
  setAuth: (user: User, token: string) => void;
  logout: () => void;
  isAdmin: () => boolean;
  isPublisher: () => boolean;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: (() => {
    try { return JSON.parse(localStorage.getItem("user") || "null"); } catch { return null; }
  })(),
  token: localStorage.getItem("token"),
  setAuth: (user, token) => {
    localStorage.setItem("user", JSON.stringify(user));
    localStorage.setItem("token", token);
    set({ user, token });
  },
  logout: () => {
    localStorage.removeItem("user");
    localStorage.removeItem("token");
    set({ user: null, token: null });
  },
  isAdmin: () => get().user?.role === "admin",
  isPublisher: () => ["publisher", "admin"].includes(get().user?.role ?? ""),
}));