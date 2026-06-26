import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

type SearchCtx = { open: boolean; setOpen: (v: boolean) => void; toggle: () => void };

const Ctx = createContext<SearchCtx>({ open: false, setOpen: () => {}, toggle: () => {} });

export function SearchProvider({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);

  // Global ⌘K / Ctrl+K opens (or toggles) the master search from anywhere.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen((o) => !o);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  return <Ctx.Provider value={{ open, setOpen, toggle: () => setOpen((o) => !o) }}>{children}</Ctx.Provider>;
}

export const useSearch = () => useContext(Ctx);
