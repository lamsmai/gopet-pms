import { ChevronDown, Check, User, Dog, Cat, Rabbit, Bird, PawPrint } from "lucide-react";
import { cn } from "@/lib/utils";
import { type TFunc } from "@/lib/i18n";
import {
  NOW_MIN,
  toMinutes,
  ARRIVAL_STATUS_META,
  ARRIVAL_STATUS_ORDER,
  type ArrivalStatus,
  type Species,
} from "@/lib/dashboard-data";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu";

// A lucide icon component type (all share the same signature).
export type IconType = typeof User;

// ─────────────────────────────────────────────────────────────────────────────
// Time helpers — measured against the fixed prototype NOW (10:18).
// ─────────────────────────────────────────────────────────────────────────────
export function meridiem(hhmm: string): string {
  return Number(hhmm.split(":")[0]) < 12 ? "AM" : "PM";
}

export function fmtDuration(totalMin: number, lang: string): string {
  const h = Math.floor(totalMin / 60);
  const m = totalMin % 60;
  if (lang === "vi") {
    if (h > 0) return m > 0 ? `${h} giờ ${m} phút` : `${h} giờ`;
    return `${m} phút`;
  }
  if (h > 0) return m > 0 ? `${h}h ${m}m` : `${h}h`;
  return `${m}m`;
}

/** Relative cue for a not-yet-arrived slot vs NOW. `late` flips the line amber. */
export function relTime(hhmm: string, lang: string): { text: string; late: boolean } {
  const diff = toMinutes(hhmm) - NOW_MIN;
  if (Math.abs(diff) <= 1) return { text: lang === "vi" ? "bây giờ" : "now", late: false };
  if (diff > 0) {
    const d = fmtDuration(diff, lang);
    return { text: lang === "vi" ? `còn ${d}` : `in ${d}`, late: false };
  }
  const d = fmtDuration(-diff, lang);
  return { text: lang === "vi" ? `trễ ${d}` : `${d} late`, late: true };
}

// ─────────────────────────────────────────────────────────────────────────────
// Species-tinted avatar — instant patient recognition without photos.
// ─────────────────────────────────────────────────────────────────────────────
export const SPECIES_ICON: Record<Species, IconType> = {
  dog: Dog,
  cat: Cat,
  rabbit: Rabbit,
  bird: Bird,
  other: PawPrint,
};
export const SPECIES_TINT: Record<Species, { bg: string; fg: string }> = {
  dog: { bg: "#0347511A", fg: "#034751" },
  cat: { bg: "#785AA61F", fg: "#785AA6" },
  rabbit: { bg: "#4ABA7A26", fg: "#1B804C" },
  bird: { bg: "#E0F2FE", fg: "#0369A1" },
  other: { bg: "#F5F5F5", fg: "#737373" },
};

export function PetAvatar({ species, size = 44 }: { species: Species; size?: number }) {
  const Icon = SPECIES_ICON[species] ?? PawPrint;
  const tint = SPECIES_TINT[species] ?? SPECIES_TINT.other;
  return (
    <span
      className="flex shrink-0 items-center justify-center rounded-full"
      style={{ width: size, height: size, background: tint.bg, color: tint.fg }}
    >
      <Icon style={{ width: Math.round(size * 0.46), height: Math.round(size * 0.46) }} />
    </span>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Inline meta (icon + text), middot separator
// ─────────────────────────────────────────────────────────────────────────────
export function Meta({
  icon: Icon,
  accent,
  title,
  children,
}: {
  icon: IconType;
  accent?: boolean;
  title?: string;
  children: React.ReactNode;
}) {
  return (
    <span title={title} className="flex min-w-0 items-center gap-1.5">
      <Icon className="h-3.5 w-3.5 shrink-0 text-neutral-400" />
      <span className={cn("truncate", accent ? "font-medium text-[#034751]" : "text-neutral-500")}>{children}</span>
    </span>
  );
}

export function MidDot() {
  return <span className="text-neutral-300">·</span>;
}

// ─────────────────────────────────────────────────────────────────────────────
// Status dot + the status pill (resting badge IS the editable dropdown trigger)
// ─────────────────────────────────────────────────────────────────────────────
export function StatusDot({ meta, className }: { meta: (typeof ARRIVAL_STATUS_META)[ArrivalStatus]; className?: string }) {
  return (
    <span
      className={cn("h-1.5 w-1.5 shrink-0 rounded-full", meta.pulse && "animate-pulse", className)}
      style={meta.hollow ? { border: `1.5px solid ${meta.dot}` } : { background: meta.dot }}
    />
  );
}

export function StatusPill({
  status,
  onChange,
  t,
}: {
  status: ArrivalStatus;
  onChange: (s: ArrivalStatus) => void;
  t: TFunc;
}) {
  const meta = ARRIVAL_STATUS_META[status];
  const transparent = meta.bg === "transparent";
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          className={cn(
            "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[12px] font-semibold outline-none transition-colors focus-visible:ring-2 focus-visible:ring-[#034751]/40",
            transparent && "border border-neutral-200 hover:border-neutral-300"
          )}
          style={transparent ? { color: meta.fg } : { background: meta.bg, color: meta.fg }}
        >
          <StatusDot meta={meta} />
          {t(meta.key)}
          <ChevronDown className="h-3 w-3 opacity-60" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-52">
        <DropdownMenuLabel>{t("ar.changeStatus")}</DropdownMenuLabel>
        {ARRIVAL_STATUS_ORDER.map((s) => {
          const sm = ARRIVAL_STATUS_META[s];
          const active = s === status;
          return (
            <DropdownMenuItem key={s} onSelect={() => onChange(s)} aria-current={active ? "true" : undefined} className={cn(active && "bg-muted")}>
              <StatusDot meta={sm} />
              <span className="flex-1">{t(sm.key)}</span>
              {active && <Check className="h-3.5 w-3.5" style={{ color: "#034751" }} />}
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
