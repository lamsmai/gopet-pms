import { Outlet } from "react-router-dom";
import { Sidebar } from "./sidebar";
import { Topbar } from "./topbar";
import { TopNav } from "./topnav";
import { useLayoutMode } from "@/lib/layout-mode";
import { CommandPalette } from "@/components/search/command-palette";

export function AppShell() {
  const { mode } = useLayoutMode();

  // "Skyline" — navigation lives in a top header; content fills the width below.
  if (mode === "skyline") {
    return (
      <>
        <div className="flex h-full w-full flex-col overflow-hidden">
          <TopNav />
          <main className="flex-1 overflow-hidden bg-white">
            <Outlet />
          </main>
        </div>
        <CommandPalette />
      </>
    );
  }

  // "Rail" — collapsible left sidebar + slim top header.
  return (
    <>
      <div className="flex h-full w-full overflow-hidden">
        <Sidebar />
        <div className="flex min-w-0 flex-1 flex-col">
          <Topbar />
          {/* Content canvas — pure white so module content pops out of the neutral-100 frame */}
          <main className="flex-1 overflow-hidden bg-white">
            <Outlet />
          </main>
        </div>
      </div>
      <CommandPalette />
    </>
  );
}
