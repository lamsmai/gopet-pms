import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

// Two named navigation layouts the user can switch between:
//  - "rail"    → left collapsible sidebar (default)
//  - "skyline" → top navigation bar with mega-menus
export type LayoutMode = "rail" | "skyline";

const KEY = "gopet.layout";

const Ctx = createContext<{ mode: LayoutMode; setMode: (m: LayoutMode) => void }>({
  mode: "skyline",
  setMode: () => {},
});

export function LayoutProvider({ children }: { children: ReactNode }) {
  const [mode, setMode] = useState<LayoutMode>(() => {
    try {
      const v = localStorage.getItem(KEY);
      return v === "skyline" || v === "rail" ? v : "skyline";
    } catch {
      return "skyline";
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(KEY, mode);
    } catch {
      /* ignore */
    }
  }, [mode]);

  return <Ctx.Provider value={{ mode, setMode }}>{children}</Ctx.Provider>;
}

export const useLayoutMode = () => useContext(Ctx);

export const LAYOUT_OPTIONS: { mode: LayoutMode; key: string }[] = [
  { mode: "rail", key: "layout.rail" },
  { mode: "skyline", key: "layout.skyline" },
];
