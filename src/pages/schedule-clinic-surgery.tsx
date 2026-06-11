import { useNavigate, useLocation } from "react-router-dom";
import {
  Stethoscope,
  Hotel,
  Scissors,
  Plus,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  Siren,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { useLang } from "@/lib/i18n";
import {
  DOCTORS,
  CAL_EVENTS,
  CATEGORY_META,
  LEGEND,
  DAY_OPEN,
  DAY_CLOSE,
  HOUR_PX,
  NOW_MIN,
  SCHEDULE_DATE,
  type CalEvent,
  type Doctor,
} from "@/lib/data";

const TABS = [
  { to: "/schedule/clinic-surgery", icon: Stethoscope, key: "nav.clinic" },
  { to: "/schedule/cat-hotel", icon: Hotel, key: "nav.hotel" },
  { to: "/schedule/grooming", icon: Scissors, key: "nav.grooming" },
];

const HOURS = Array.from({ length: DAY_CLOSE - DAY_OPEN + 1 }, (_, i) => DAY_OPEN + i);
const BODY_H = (DAY_CLOSE - DAY_OPEN) * HOUR_PX;

function fmtHour(h: number) {
  const period = h < 12 ? "AM" : "PM";
  const display = h % 12 === 0 ? 12 : h % 12;
  return `${display}:00 ${period}`;
}
function fmtTime(minFromOpen: number) {
  const total = DAY_OPEN * 60 + minFromOpen;
  const h = Math.floor(total / 60);
  const m = total % 60;
  const period = h < 12 ? "AM" : "PM";
  const display = h % 12 === 0 ? 12 : h % 12;
  return `${display}:${String(m).padStart(2, "0")} ${period}`;
}

// Utilization badge color
function utilClass(u: number) {
  if (u >= 100) return "bg-destructive/10 text-destructive";
  if (u >= 80) return "bg-orange-soft text-orange";
  if (u >= 60) return "bg-warning-soft text-warning-foreground";
  return "bg-info-soft text-info";
}

export default function ClinicSurgeryPage() {
  const { t, lang } = useLang();
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const vi = lang === "vi";

  return (
    <div className="flex h-full flex-col p-6">
      {/* ── Tabs row ── */}
      <div className="mb-4 flex items-center justify-between gap-3">
        <div className="flex items-center rounded-xl border border-border bg-card p-1 shadow-soft">
          {TABS.map((tab) => {
            const active = pathname === tab.to;
            return (
              <button
                key={tab.to}
                onClick={() => navigate(tab.to)}
                className={cn(
                  "flex items-center gap-1.5 rounded-lg px-3.5 py-1.5 text-sm font-semibold transition-colors",
                  active
                    ? "bg-primary text-primary-foreground shadow-soft"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                <tab.icon className="h-4 w-4" />
                {t(tab.key)}
              </button>
            );
          })}
        </div>

        <Button className="gap-1.5">
          <Plus className="h-4 w-4" />
          {t("sch.new")}
        </Button>
      </div>

      {/* ── Calendar card ── */}
      <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-xl border border-border bg-card shadow-card">
        {/* Calendar header */}
        <div className="flex flex-wrap items-start justify-between gap-4 border-b border-border px-6 py-4">
          <div className="min-w-0">
            <h2 className="font-display text-xl font-bold text-foreground">{t("nav.clinic")}</h2>
            {/* Legend */}
            <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-[13px]">
              {LEGEND.map((cat) => (
                <span key={cat} className="flex items-center gap-1.5 text-muted-foreground">
                  <span
                    className="h-2.5 w-2.5 rounded-full"
                    style={{ background: `hsl(var(--${CATEGORY_META[cat].varName}))` }}
                  />
                  {vi ? CATEGORY_META[cat].vi : CATEGORY_META[cat].en}
                </span>
              ))}
              <span className="h-4 w-px bg-border" />
              <span className="flex items-center gap-1.5 font-medium text-destructive">
                <Siren className="h-3.5 w-3.5" />
                {t("sch.emergency")}
              </span>
            </div>
          </div>

          {/* View controls */}
          <div className="flex items-center gap-2">
            <div className="flex items-center rounded-lg border border-border bg-card shadow-soft">
              <button className="flex h-9 w-9 items-center justify-center rounded-l-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground">
                <ChevronLeft className="h-4 w-4" />
              </button>
              <span className="border-x border-border px-4 text-sm font-semibold text-foreground">
                {t("sch.today")}
              </span>
              <button className="flex h-9 w-9 items-center justify-center rounded-r-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground">
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="flex h-9 items-center gap-1.5 rounded-lg border border-border bg-card px-3 text-sm font-semibold text-foreground shadow-soft transition-colors hover:bg-muted">
                  {t("sch.dayView")}
                  <ChevronDown className="h-4 w-4 opacity-60" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-36">
                <DropdownMenuItem className="font-semibold">{t("sch.dayView")}</DropdownMenuItem>
                <DropdownMenuItem>{t("sch.weekView")}</DropdownMenuItem>
                <DropdownMenuItem>{t("sch.monthView")}</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* Scroll area: doctor columns + time grid */}
        <div className="min-h-0 flex-1 overflow-auto">
          <div className="min-w-[1320px]">
            {/* Doctor column headers */}
            <div className="sticky top-0 z-20 flex border-b border-border bg-card">
              {/* corner spacer */}
              <div className="sticky left-0 z-10 w-[72px] shrink-0 bg-card">
                <div className="flex h-full items-end px-2 pb-2">
                  <span className="text-[11px] font-medium text-muted-foreground">{SCHEDULE_DATE}</span>
                </div>
              </div>
              {DOCTORS.map((doc) => (
                <DoctorHeader key={doc.id} doc={doc} />
              ))}
            </div>

            {/* Grid body */}
            <div className="relative flex" style={{ height: BODY_H }}>
              {/* Time gutter */}
              <div className="sticky left-0 z-10 w-[72px] shrink-0 border-r border-border bg-card">
                {HOURS.map((h, i) => (
                  <div key={h} className="relative" style={{ height: i < HOURS.length - 1 ? HOUR_PX : 0 }}>
                    <span className="absolute -top-2 right-2 font-mono text-[11px] text-muted-foreground tnum">
                      {fmtHour(h)}
                    </span>
                  </div>
                ))}
              </div>

              {/* Doctor columns */}
              {DOCTORS.map((doc) => (
                <div key={doc.id} className="relative min-w-[180px] flex-1 border-r border-border last:border-r-0">
                  {/* hour gridlines */}
                  {HOURS.slice(0, -1).map((h) => (
                    <div key={h} className="border-b border-border/60" style={{ height: HOUR_PX }}>
                      {/* half-hour line */}
                      <div className="h-1/2 border-b border-dashed border-border/40" />
                    </div>
                  ))}
                  {/* now line */}
                  <div
                    className="pointer-events-none absolute inset-x-0 z-20"
                    style={{ top: (NOW_MIN / 60) * HOUR_PX }}
                  >
                    <div className="relative h-0.5 bg-primary">
                      <span className="absolute -left-[3px] -top-[3px] h-2 w-2 rounded-full bg-primary" />
                    </div>
                  </div>
                  {/* events */}
                  {CAL_EVENTS.filter((e) => e.doc === doc.id).map((e) => (
                    <EventCard key={e.id} e={e} />
                  ))}
                </div>
              ))}

              {/* now time pill on gutter */}
              <div
                className="pointer-events-none absolute left-0 z-30 -translate-y-1/2"
                style={{ top: (NOW_MIN / 60) * HOUR_PX }}
              >
                <span className="ml-1 rounded bg-primary px-1.5 py-0.5 font-mono text-[10px] font-bold text-primary-foreground tnum">
                  {fmtTime(NOW_MIN)}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Doctor column header ──────────────────────────────────────────────────────
function DoctorHeader({ doc }: { doc: Doctor }) {
  return (
    <div className="min-w-[180px] flex-1 border-r border-border px-3 py-2.5 last:border-r-0">
      <div className="flex items-center justify-between gap-2">
        <span className="truncate font-semibold text-foreground">{doc.name}</span>
        <span className={cn("shrink-0 rounded-full px-2 py-0.5 text-[11px] font-bold tnum", utilClass(doc.utilization))}>
          {doc.utilization}%
        </span>
      </div>
      <div className="mt-0.5 truncate text-xs text-muted-foreground">{doc.specialty}</div>
    </div>
  );
}

// ── Event card ────────────────────────────────────────────────────────────────
function EventCard({ e }: { e: CalEvent }) {
  const { lang } = useLang();
  const meta = CATEGORY_META[e.category];
  const top = (e.start / 60) * HOUR_PX;
  const height = (e.dur / 60) * HOUR_PX - 4;
  const compact = height < 56;
  const isEmr = e.emergency;

  return (
    <div
      className={cn(
        "group absolute left-1.5 right-1.5 cursor-pointer overflow-hidden rounded-lg border-l-[3px] px-2 py-1.5 shadow-soft transition-all hover:z-30 hover:shadow-lift",
        isEmr && "ring-1 ring-destructive/40"
      )}
      style={{
        top,
        height,
        borderLeftColor: isEmr ? "hsl(var(--cat-emergency))" : `hsl(var(--${meta.varName}))`,
        backgroundColor: isEmr ? "hsl(var(--cat-emergency) / 0.10)" : `hsl(var(--${meta.varName}) / 0.10)`,
      }}
      title={`${e.pet} · ${e.specialty}`}
    >
      <div className="flex items-center gap-1.5">
        <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-card text-sm shadow-soft ring-1 ring-border">
          {e.avatar}
        </span>
        <span className="truncate text-[13px] font-bold text-foreground">{e.pet}</span>
        <span className="ml-auto flex shrink-0 items-center gap-1">
          {isEmr && <Siren className="h-3 w-3 text-destructive" />}
          <span className="font-mono text-[10px] text-muted-foreground tnum">{fmtTime(e.start)}</span>
        </span>
      </div>
      {!compact && (
        <div
          className="mt-1 truncate pl-7 text-[11px] font-medium"
          style={{ color: isEmr ? "hsl(var(--cat-emergency))" : `hsl(var(--${meta.varName}))` }}
        >
          {e.specialty}
        </div>
      )}
      {compact && (
        <div
          className="-mt-0.5 truncate pl-7 text-[11px] font-medium"
          style={{ color: isEmr ? "hsl(var(--cat-emergency))" : `hsl(var(--${meta.varName}))` }}
        >
          {e.specialty}
        </div>
      )}
    </div>
  );
}
