import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import * as Dialog from "@radix-ui/react-dialog";
import { Search, CornerDownLeft, Clock, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import { useLang } from "@/lib/i18n";
import { useSearch } from "@/lib/search-context";
import {
  buildIndex,
  runSearch,
  fold,
  foldWithMap,
  GROUP_LABEL_KEY,
  type SearchEntry,
} from "@/lib/search-index";

const RECENTS_KEY = "gopet.search.recents";
const MAX_RECENTS = 5;

type Section = { key: string; labelKey: string; entries: SearchEntry[] };

// Wraps every diacritic-insensitive match of `query` inside `text` with <mark>.
function Highlight({ text, query }: { text: string; query: string }) {
  const fq = fold(query.trim());
  if (!fq) return <>{text}</>;

  const { folded, map } = foldWithMap(text);
  const nodes: ReactNode[] = [];
  let cursor = 0;
  let from = 0;
  let k = 0;
  for (;;) {
    const pos = folded.indexOf(fq, from);
    if (pos === -1) break;
    const start = map[pos];
    const end = map[pos + fq.length - 1] + 1;
    if (start > cursor) nodes.push(text.slice(cursor, start));
    nodes.push(
      <mark key={k++} className="rounded-[3px] bg-[#034751]/15 px-0.5 font-semibold text-[#034751]">
        {text.slice(start, end)}
      </mark>
    );
    cursor = end;
    from = pos + fq.length;
  }
  if (cursor < text.length) nodes.push(text.slice(cursor));
  return <>{nodes}</>;
}

export function CommandPalette() {
  const { open, setOpen } = useSearch();
  const { lang, t } = useLang();
  const navigate = useNavigate();
  const listRef = useRef<HTMLDivElement>(null);

  const [query, setQuery] = useState("");
  const [active, setActive] = useState(0);
  const [recentIds, setRecentIds] = useState<string[]>(() => {
    try {
      return JSON.parse(localStorage.getItem(RECENTS_KEY) || "[]");
    } catch {
      return [];
    }
  });

  // Rebuild only when language flips (the dictionary itself is static).
  const index = useMemo(() => buildIndex(lang, t), [lang]); // eslint-disable-line react-hooks/exhaustive-deps

  const isEmpty = query.trim() === "";
  const groups = useMemo(() => runSearch(index, query), [index, query]);
  const recents = useMemo(
    () => recentIds.map((id) => index.find((e) => e.id === id)).filter(Boolean) as SearchEntry[],
    [recentIds, index]
  );
  const quick = useMemo(() => index.filter((e) => e.type === "feature").slice(0, 6), [index]);

  const sections: Section[] = isEmpty
    ? [
        ...(recents.length ? [{ key: "recent", labelKey: "search.recent", entries: recents }] : []),
        { key: "quick", labelKey: "search.quick", entries: quick },
      ]
    : groups.map((g) => ({ key: g.type, labelKey: GROUP_LABEL_KEY[g.type], entries: g.entries }));

  const flat = useMemo(() => sections.flatMap((s) => s.entries), [sections]);

  // Fresh palette on every open.
  useEffect(() => {
    if (open) {
      setQuery("");
      setActive(0);
    }
  }, [open]);

  // Keep the active row in range and reset to top as results change.
  useEffect(() => setActive(0), [query]);
  useEffect(() => {
    if (active >= flat.length) setActive(flat.length ? flat.length - 1 : 0);
  }, [flat.length, active]);
  useEffect(() => {
    listRef.current?.querySelector<HTMLElement>(`[data-idx="${active}"]`)?.scrollIntoView({ block: "nearest" });
  }, [active]);

  const select = (entry?: SearchEntry) => {
    if (!entry) return;
    setRecentIds((prev) => {
      const next = [entry.id, ...prev.filter((id) => id !== entry.id)].slice(0, MAX_RECENTS);
      try {
        localStorage.setItem(RECENTS_KEY, JSON.stringify(next));
      } catch {
        /* ignore */
      }
      return next;
    });
    setOpen(false);
    navigate(entry.to);
  };

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActive((a) => Math.min(a + 1, flat.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActive((a) => Math.max(a - 1, 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      select(flat[active]);
    }
  };

  const noResults = !isEmpty && flat.length === 0;
  let idx = -1; // running flat index assigned during render

  return (
    <Dialog.Root open={open} onOpenChange={setOpen}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-foreground/40 backdrop-blur-sm data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
        <Dialog.Content
          onKeyDown={onKeyDown}
          className="fixed left-1/2 top-[12vh] z-50 w-[92vw] max-w-[600px] -translate-x-1/2 overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-lift data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95"
        >
          <Dialog.Title className="sr-only">{t("search.placeholder")}</Dialog.Title>
          <Dialog.Description className="sr-only">{t("search.placeholder")}</Dialog.Description>

          {/* Search row */}
          <div className="flex items-center gap-2.5 border-b border-neutral-200 px-4">
            <Search className="h-5 w-5 shrink-0 text-neutral-400" />
            <input
              autoFocus
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={t("search.placeholder")}
              className="h-14 w-full bg-transparent text-[15px] text-neutral-900 placeholder:text-neutral-400 focus:outline-none"
            />
            <kbd className="hidden shrink-0 rounded border border-neutral-200 bg-neutral-50 px-1.5 py-0.5 font-mono text-[10px] text-neutral-400 sm:block">
              esc
            </kbd>
          </div>

          {/* Results */}
          <div ref={listRef} className="max-h-[56vh] overflow-y-auto py-1.5">
            {noResults ? (
              <div className="px-4 py-10 text-center">
                <div className="text-sm font-semibold text-neutral-700">{t("search.empty.title")}</div>
                <div className="mt-1 text-[13px] text-neutral-400">{t("search.empty.hint")}</div>
              </div>
            ) : (
              sections.map((section) => (
                <div key={section.key} className="px-2 pb-1">
                  <div className="flex items-center gap-1.5 px-3 pb-1 pt-2 text-[11px] font-bold uppercase tracking-wide text-neutral-400">
                    {section.key === "recent" && <Clock className="h-3 w-3" />}
                    {section.key === "quick" && <Sparkles className="h-3 w-3" />}
                    {t(section.labelKey)}
                  </div>
                  {section.entries.map((entry) => {
                    idx++;
                    const i = idx;
                    const selected = i === active;
                    return (
                      <button
                        key={entry.id}
                        type="button"
                        data-idx={i}
                        onMouseEnter={() => setActive(i)}
                        onClick={() => select(entry)}
                        className={cn(
                          "flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left transition-colors",
                          selected ? "bg-[#034751]/10" : "hover:bg-neutral-100"
                        )}
                      >
                        <RowAvatar entry={entry} selected={selected} />
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-[13.5px] font-medium text-neutral-900">
                            <Highlight text={entry.title} query={query} />
                          </span>
                          {entry.subtitle && (
                            <span className="block truncate text-[12px] text-neutral-500">
                              <Highlight text={entry.subtitle} query={query} />
                            </span>
                          )}
                        </span>
                        {selected && <CornerDownLeft className="h-3.5 w-3.5 shrink-0 text-[#034751]" />}
                      </button>
                    );
                  })}
                </div>
              ))
            )}
          </div>

          {/* Footer hints */}
          <div className="flex items-center gap-4 border-t border-neutral-200 bg-neutral-50 px-4 py-2 text-[11px] text-neutral-500">
            <span className="flex items-center gap-1">
              <Key>↑</Key>
              <Key>↓</Key>
              {t("search.hint.nav")}
            </span>
            <span className="flex items-center gap-1">
              <Key>↵</Key>
              {t("search.hint.open")}
            </span>
            <span className="flex items-center gap-1">
              <Key>esc</Key>
              {t("search.hint.close")}
            </span>
            {!isEmpty && (
              <span className="ml-auto text-neutral-400">
                {flat.length} {t("search.count")}
              </span>
            )}
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

// Patient gradient tiles — same palette as the Patients page portraits.
const TONE: Record<NonNullable<SearchEntry["tone"]>, string> = {
  teal: "from-[#034751] via-[#0F8C86] to-[#A8DBD6]",
  violet: "from-[#4B3D75] via-[#785AA6] to-[#D8CEF0]",
  amber: "from-[#7A4A12] via-[#D8872B] to-[#F5D7A6]",
  rose: "from-[#74304E] via-[#B64268] to-[#F3B7C8]",
};

// Patients → gradient portrait + species icon · clients → initials · else generic icon.
// No real avatar images exist in the data, so these tokens stay zero-network.
function RowAvatar({ entry, selected }: { entry: SearchEntry; selected: boolean }) {
  const Icon = entry.icon;
  if (entry.tone) {
    return (
      <span className={cn("relative flex h-8 w-8 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-gradient-to-br", TONE[entry.tone])}>
        <span className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(255,255,255,0.4),transparent_40%)]" />
        <Icon className="relative h-4 w-4 text-white/95" />
      </span>
    );
  }
  if (entry.initials) {
    return (
      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#034751] text-[11px] font-semibold text-white">
        {entry.initials}
      </span>
    );
  }
  return (
    <span
      className={cn(
        "flex h-8 w-8 shrink-0 items-center justify-center rounded-lg",
        selected ? "bg-[#034751] text-white" : "bg-neutral-100 text-neutral-500"
      )}
    >
      <Icon className="h-4 w-4" />
    </span>
  );
}

function Key({ children }: { children: ReactNode }) {
  return (
    <kbd className="rounded border border-neutral-200 bg-white px-1.5 py-0.5 font-mono text-[10px] text-neutral-500">
      {children}
    </kbd>
  );
}

// Shared header trigger — replaces the static search inputs in both layouts.
export function SearchTrigger({
  className,
  compact = false,
}: {
  className?: string;
  /** Slim header variant: short placeholder, no ⌘K hint, tighter padding. */
  compact?: boolean;
}) {
  const { t } = useLang();
  const { setOpen } = useSearch();
  return (
    <button
      type="button"
      onClick={() => setOpen(true)}
      className={cn(
        "relative h-9 items-center rounded-lg border border-neutral-200 bg-white text-left text-sm text-neutral-400 transition-colors hover:border-neutral-300 hover:bg-neutral-50",
        compact ? "pl-9 pr-3" : "pl-9 pr-10",
        className
      )}
    >
      <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
      <span className="truncate">{t(compact ? "top.search.short" : "top.search")}</span>
      {!compact && (
        <kbd className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 rounded border border-neutral-200 bg-neutral-50 px-1.5 py-0.5 font-mono text-[10px] text-neutral-400">
          ⌘K
        </kbd>
      )}
    </button>
  );
}
