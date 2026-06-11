import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  Plus,
  Clock,
  MapPin,
  Stethoscope,
  Phone,
  PlayCircle,
  Lock,
  LockOpen,
  Check,
  X,
  Siren,
  PawPrint,
  Cat,
  CalendarClock,
  CircleAlert,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useLang } from "@/lib/i18n";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  ROOMS,
  SCHED_DOCTORS,
  APPOINTMENTS,
  WAITING,
  WIZ_CLIENTS,
  REASONS,
  DURATIONS,
  WEEK_SCATTER,
  MONTH_COUNTS,
  STATUS_META,
  OPEN_H,
  CLOSE_H,
  HOUR_PX,
  NOW_MIN,
  TODAY_LABEL,
  TODAY_DOW,
  type Appt,
  type ApptStatus,
} from "@/lib/schedule-data";

type View = "day" | "week" | "month" | "kanban";
type Resource = "room" | "doctor";

const GRID_H = (CLOSE_H - OPEN_H) * HOUR_PX;
const HOURS = Array.from({ length: CLOSE_H - OPEN_H + 1 }, (_, i) => OPEN_H + i);
const WEEKDAYS = ["T2", "T3", "T4", "T5", "T6", "T7", "CN"];
const WEEK_DATES = [8, 9, 10, 11, 12, 13, 14]; // Mon–Sun of this week (Jun 2026)

function hhmm(min: number) {
  const tot = OPEN_H * 60 + min;
  return `${String(Math.floor(tot / 60)).padStart(2, "0")}:${String(tot % 60).padStart(2, "0")}`;
}

function PetGlyph({ species, className }: { species: "dog" | "cat"; className?: string }) {
  const Icon = species === "dog" ? PawPrint : Cat;
  return <Icon className={className} />;
}

// ─────────────────────────────────────────────────────────────────────────────
export default function SchedulePage() {
  const { t } = useLang();
  const navigate = useNavigate();

  const [view, setView] = useState<View>("day");
  const [resource, setResource] = useState<Resource>("room");
  const [filters, setFilters] = useState<{ vet: string; room: string; reason: string }>({ vet: "all", room: "all", reason: "all" });
  const [locked, setLocked] = useState(false);
  const [appts, setAppts] = useState<Appt[]>(APPOINTMENTS);
  const [sel, setSel] = useState<{ appt: Appt; x: number; y: number } | null>(null);
  const [wizard, setWizard] = useState(false);

  const pending = appts.filter((a) => a.status === "requested");

  function openPopover(appt: Appt, e: React.MouseEvent) {
    const r = (e.currentTarget as HTMLElement).getBoundingClientRect();
    setSel({ appt, x: r.right + 8, y: r.top });
  }
  function confirmAppt(id: string, ok: boolean) {
    setAppts((list) => list.map((a) => (a.id === id ? { ...a, status: ok ? "confirmed" : "cancelled" } : a)));
  }

  return (
    <div className="flex h-full flex-col bg-white">
      {/* Toolbar */}
      <div className="shrink-0 border-b border-neutral-200 px-5 pt-4">
        <div className="mb-3 flex flex-wrap items-center gap-3">
          {/* date nav */}
          <div className="flex items-center gap-1">
            <button className="flex h-9 w-9 items-center justify-center rounded-lg border border-neutral-200 text-neutral-500 hover:bg-neutral-50"><ChevronLeft className="h-4 w-4" /></button>
            <button className="h-9 rounded-lg border border-neutral-200 px-3 text-sm font-semibold text-neutral-700 hover:bg-neutral-50">{t("sch.today")}</button>
            <button className="flex h-9 w-9 items-center justify-center rounded-lg border border-neutral-200 text-neutral-500 hover:bg-neutral-50"><ChevronRight className="h-4 w-4" /></button>
            <span className="ml-2 text-[15px] font-bold text-neutral-900">
              {view === "month" ? "Tháng 6, 2026" : view === "week" ? "08–14/06/2026" : TODAY_LABEL}
            </span>
          </div>

          {/* view segmented */}
          <div className="mx-auto flex items-center rounded-lg border border-neutral-200 p-0.5">
            {([["day", "sch.dayView"], ["week", "sch.weekView"], ["month", "sch.monthView"], ["kanban", "sch.kanban"]] as const).map(([v, k]) => (
              <button
                key={v}
                onClick={() => setView(v)}
                className={cn("rounded-md px-3 py-1.5 text-[13px] font-semibold transition-colors", view === v ? "bg-[#034751] text-white" : "text-neutral-600 hover:bg-neutral-100")}
              >
                {t(k)}
              </button>
            ))}
          </div>

          {/* right actions */}
          <div className="flex items-center gap-2">
            <PendingMenu pending={pending} onResolve={confirmAppt} t={t} />
            <button onClick={() => setWizard(true)} className="inline-flex items-center gap-1.5 rounded-lg bg-[#034751] px-3.5 py-2 text-sm font-semibold text-white hover:bg-[#023a42]">
              <Plus className="h-4 w-4" />
              {t("sch.new")}
            </button>
          </div>
        </div>

        {/* second row — only Day/Week */}
        {(view === "day" || view === "week") && (
          <div className="flex flex-wrap items-center gap-2 pb-3">
            {/* resource toggle */}
            <div className="flex items-center rounded-lg border border-neutral-200 p-0.5">
              {([["room", "sch.byRoom"], ["doctor", "sch.byDoctor"]] as const).map(([r, k]) => (
                <button key={r} onClick={() => setResource(r)} className={cn("rounded-md px-2.5 py-1 text-[12px] font-semibold transition-colors", resource === r ? "bg-[#034751]/10 text-[#034751]" : "text-neutral-500 hover:text-neutral-700")}>
                  {t(k)}
                </button>
              ))}
            </div>
            <FilterSelect label={t("sch.allVets")} value={filters.vet} options={[["all", t("sch.allVets")], ...SCHED_DOCTORS.map((d) => [d.id, d.name] as [string, string])]} onChange={(v) => setFilters((f) => ({ ...f, vet: v }))} />
            <FilterSelect label={t("sch.allRooms")} value={filters.room} options={[["all", t("sch.allRooms")], ...ROOMS.map((r) => [r.id, r.name] as [string, string])]} onChange={(v) => setFilters((f) => ({ ...f, room: v }))} />
            <FilterSelect label={t("sch.allReasons")} value={filters.reason} options={[["all", t("sch.allReasons")], ...REASONS.map((r) => [r, r] as [string, string])]} onChange={(v) => setFilters((f) => ({ ...f, reason: v }))} />
            <button
              onClick={() => setLocked((l) => !l)}
              className={cn("ml-auto inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-[12px] font-semibold transition-colors", locked ? "border-amber-300 bg-amber-50 text-amber-700" : "border-neutral-200 text-neutral-600 hover:bg-neutral-50")}
            >
              {locked ? <LockOpen className="h-3.5 w-3.5" /> : <Lock className="h-3.5 w-3.5" />}
              {locked ? t("sch.unlockDay") : t("sch.lockDay")}
            </button>
          </div>
        )}
      </div>

      {/* Body */}
      <div className="min-h-0 flex-1 overflow-hidden">
        {view === "day" && <DayView appts={appts} resource={resource} filters={filters} locked={locked} onBlock={openPopover} onStart={(id) => navigate(`/consultations/${id}`)} t={t} />}
        {view === "week" && <WeekView appts={appts} filters={filters} onBlock={openPopover} t={t} />}
        {view === "month" && <MonthView onPickDay={() => setView("day")} t={t} />}
        {view === "kanban" && <KanbanView appts={appts} onBlock={openPopover} t={t} />}
      </div>

      {/* Appointment popover (2 actions only — per meeting) */}
      {sel && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setSel(null)} />
          <ApptPopover sel={sel} onClose={() => setSel(null)} onStart={(id) => { setSel(null); navigate(`/consultations/${id}`); }} t={t} />
        </>
      )}

      {/* New appointment wizard */}
      {wizard && <Wizard onClose={() => setWizard(false)} t={t} />}
    </div>
  );
}

// ── Filter select ─────────────────────────────────────────────────────────────
function FilterSelect({ label, value, options, onChange }: { label: string; value: string; options: [string, string][]; onChange: (v: string) => void }) {
  const current = options.find((o) => o[0] === value)?.[1] ?? label;
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button className={cn("inline-flex h-8 items-center gap-1.5 rounded-lg border px-2.5 text-[12px] font-medium transition-colors", value !== "all" ? "border-[#034751] bg-[#034751]/5 text-[#034751]" : "border-neutral-200 text-neutral-600 hover:bg-neutral-50")}>
          {current}
          <ChevronDown className="h-3.5 w-3.5 opacity-60" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="max-h-72 w-52 overflow-y-auto">
        {options.map(([v, lbl]) => (
          <DropdownMenuItem key={v} onClick={() => onChange(v)} className={cn(v === value && "bg-muted font-semibold")}>{lbl}</DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

// ── Pending (two-way confirmation) ────────────────────────────────────────────
function PendingMenu({ pending, onResolve, t }: { pending: Appt[]; onResolve: (id: string, ok: boolean) => void; t: (k: string) => string }) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button className="relative inline-flex items-center gap-1.5 rounded-lg border border-neutral-200 bg-white px-3 py-2 text-sm font-medium text-neutral-700 hover:bg-neutral-50">
          <CalendarClock className="h-4 w-4 text-amber-500" />
          <span className="hidden sm:inline">{t("sch.pending")}</span>
          {pending.length > 0 && <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-amber-500 px-1 text-[10px] font-bold text-white">{pending.length}</span>}
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80">
        <DropdownMenuLabel>{t("sch.pending")}</DropdownMenuLabel>
        {pending.length === 0 ? (
          <div className="px-2.5 py-6 text-center text-[13px] text-neutral-400">{t("sch.noPending")}</div>
        ) : (
          pending.map((a) => (
            <div key={a.id} className="rounded-lg px-2.5 py-2 hover:bg-neutral-50">
              <div className="flex items-center gap-2">
                <PetGlyph species={a.species} className="h-3.5 w-3.5 text-neutral-400" />
                <span className="text-[13px] font-semibold text-neutral-800">{a.pet}</span>
                <span className="text-[12px] text-neutral-400">{hhmm(a.start)}</span>
              </div>
              <div className="mb-1.5 mt-0.5 truncate text-[12px] text-neutral-500">{a.reason} · {a.owner}</div>
              <div className="flex gap-1.5">
                <button onClick={() => onResolve(a.id, true)} className="inline-flex flex-1 items-center justify-center gap-1 rounded-md bg-[#034751] py-1 text-[12px] font-semibold text-white hover:bg-[#023a42]"><Check className="h-3 w-3" />{t("sch.confirm")}</button>
                <button onClick={() => onResolve(a.id, false)} className="inline-flex items-center justify-center gap-1 rounded-md border border-neutral-200 px-2 py-1 text-[12px] font-medium text-neutral-500 hover:bg-neutral-50">{t("sch.reject")}</button>
              </div>
            </div>
          ))
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

// ── Appointment block ─────────────────────────────────────────────────────────
function ApptBlock({ a, onClick }: { a: Appt; onClick: (a: Appt, e: React.MouseEvent) => void }) {
  const m = STATUS_META[a.status];
  const top = (a.start / 60) * HOUR_PX;
  const height = (a.dur / 60) * HOUR_PX - 3;
  const tight = height < 46;
  return (
    <button
      onClick={(e) => { e.stopPropagation(); onClick(a, e); }}
      className={cn("group absolute left-1 right-1 overflow-hidden rounded-lg border-l-[3px] px-2 py-1 text-left transition-all hover:z-20 hover:shadow-card", a.emergency && "ring-1 ring-red-300")}
      style={{ top, height, background: m.bg, borderLeftColor: m.bar, color: m.solid ? "#fff" : undefined }}
    >
      <div className="flex items-center gap-1">
        {a.emergency && <Siren className={cn("h-3 w-3 shrink-0", m.solid ? "text-white" : "text-red-500")} />}
        <span className={cn("truncate text-[12px] font-bold", m.solid ? "text-white" : "text-neutral-900")}>{a.pet}</span>
        <span className={cn("ml-auto shrink-0 font-mono text-[10px]", m.solid ? "text-white/80" : "text-neutral-400")}>{hhmm(a.start)}</span>
      </div>
      {!tight && <div className={cn("truncate text-[11px]", m.solid ? "text-white/85" : "")} style={!m.solid ? { color: m.fg } : undefined}>{a.reason}</div>}
    </button>
  );
}

// ── Day view ──────────────────────────────────────────────────────────────────
function DayView({ appts, resource, filters, locked, onBlock, onStart, t }: { appts: Appt[]; resource: Resource; filters: { vet: string; room: string; reason: string }; locked: boolean; onBlock: (a: Appt, e: React.MouseEvent) => void; onStart: (id: string) => void; t: (k: string) => string }) {
  const [showWaiting, setShowWaiting] = useState(true);

  let cols = resource === "room"
    ? ROOMS.map((r) => ({ id: r.id, name: r.name, sub: "", off: !!r.maint }))
    : SCHED_DOCTORS.map((d) => ({ id: d.id, name: d.name, sub: d.specialty, off: !!d.off }));
  if (resource === "room" && filters.room !== "all") cols = cols.filter((c) => c.id === filters.room);
  if (resource === "doctor" && filters.vet !== "all") cols = cols.filter((c) => c.id === filters.vet);

  const reasonMatch = (a: Appt) => filters.reason === "all" || a.reason.toLowerCase().includes(filters.reason.toLowerCase());
  const apptsFor = (colId: string) => appts.filter((a) => (resource === "room" ? a.roomId : a.vetId) === colId && reasonMatch(a));

  return (
    <div className="flex h-full">
      <div className="relative min-w-0 flex-1 overflow-auto">
        <div className="min-w-[760px]">
          {/* column headers */}
          <div className="sticky top-0 z-20 flex border-b border-neutral-200 bg-white">
            <div className="sticky left-0 z-10 w-[64px] shrink-0 bg-white" />
            {cols.map((c) => (
              <div key={c.id} className="min-w-[160px] flex-1 border-l border-neutral-100 px-3 py-2">
                <div className="flex items-center gap-1.5">
                  <span className="truncate text-[13px] font-bold text-neutral-800">{c.name}</span>
                  {c.off && <span className="shrink-0 rounded bg-neutral-100 px-1.5 py-0.5 text-[10px] font-bold text-neutral-400">{t("sch.dayOff")}</span>}
                </div>
                {c.sub && <div className="truncate text-[11px] text-neutral-400">{c.sub}</div>}
              </div>
            ))}
          </div>

          {/* grid */}
          <div className="relative flex" style={{ height: GRID_H }}>
            {/* gutter */}
            <div className="sticky left-0 z-10 w-[64px] shrink-0 border-r border-neutral-100 bg-white">
              {HOURS.map((h, i) => (
                <div key={h} className="relative" style={{ height: i < HOURS.length - 1 ? HOUR_PX : 0 }}>
                  <span className="absolute -top-2 right-2 font-mono text-[11px] text-neutral-400 tnum">{String(h).padStart(2, "0")}:00</span>
                </div>
              ))}
            </div>

            {cols.map((c) => (
              <div key={c.id} className={cn("relative min-w-[160px] flex-1 border-l border-neutral-100", c.off && "bg-neutral-50/70")}>
                {HOURS.slice(0, -1).map((h) => (
                  <div key={h} style={{ height: HOUR_PX }} className="border-b border-neutral-100">
                    <div className="h-1/2 border-b border-dashed border-neutral-100" />
                  </div>
                ))}
                {c.off ? (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="rotate-[-4deg] rounded-lg bg-white/80 px-2 py-1 text-[12px] font-semibold text-neutral-400 shadow-soft">{t("sch.dayOff")}</span>
                  </div>
                ) : (
                  apptsFor(c.id).map((a) => <ApptBlock key={a.id + c.id} a={a} onClick={onBlock} />)
                )}
              </div>
            ))}

            {/* now line */}
            <div className="pointer-events-none absolute inset-x-0 z-20" style={{ top: (NOW_MIN / 60) * HOUR_PX }}>
              <div className="relative ml-[64px] h-0.5 bg-[#EF4444]">
                <span className="absolute -left-[64px] -top-2 rounded bg-[#EF4444] px-1 py-0.5 font-mono text-[10px] font-bold text-white">{hhmm(NOW_MIN)}</span>
              </div>
            </div>

            {/* locked overlay */}
            {locked && (
              <div className="absolute inset-0 z-30 ml-[64px] flex items-start justify-center bg-neutral-100/40 backdrop-blur-[1px]">
                <div className="mt-8 inline-flex items-center gap-2 rounded-lg border border-amber-300 bg-amber-50 px-3 py-2 text-[13px] font-semibold text-amber-700 shadow-soft">
                  <Lock className="h-4 w-4" />{t("sch.locked")}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Waiting room */}
      {showWaiting ? (
        <aside className="flex w-72 shrink-0 flex-col border-l border-neutral-200">
          <div className="flex items-center justify-between border-b border-neutral-100 px-4 py-3">
            <div className="flex items-center gap-2">
              <h3 className="font-display text-[14px] font-bold text-neutral-900">{t("sch.waiting")}</h3>
              <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-[#4ABA7A]/20 px-1.5 text-[11px] font-bold text-[#1B804C]">{WAITING.length}</span>
            </div>
            <button onClick={() => setShowWaiting(false)} className="text-neutral-400 hover:text-neutral-600"><ChevronRight className="h-4 w-4" /></button>
          </div>
          <div className="flex-1 space-y-2 overflow-y-auto p-3">
            {WAITING.length === 0 ? (
              <p className="py-8 text-center text-[13px] text-neutral-400">{t("sch.emptyWaiting")}</p>
            ) : (
              WAITING.map((w) => {
                const appt = appts.find((a) => a.id === w.apptId);
                const hot = w.waitMins >= 10;
                return (
                  <div key={w.apptId} className="rounded-xl border border-neutral-200 p-3">
                    <div className="flex items-center gap-2">
                      <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#4ABA7A]/12 text-[#1B804C]"><PetGlyph species={w.species} className="h-4 w-4" /></span>
                      <div className="min-w-0">
                        <div className="truncate text-[13px] font-bold text-neutral-900">{w.pet}</div>
                        <div className="truncate text-[11px] text-neutral-500">{w.owner}</div>
                      </div>
                    </div>
                    <div className="mt-2 flex items-center justify-between">
                      <span className={cn("inline-flex items-center gap-1 text-[11px] font-medium", hot ? "text-[#EF4444]" : "text-neutral-500")}>
                        <Clock className="h-3 w-3" />{w.checkin} · {t("sch.waitedShort")} {w.waitMins}′
                      </span>
                      {hot && <span className="rounded-full bg-red-50 px-1.5 py-0.5 text-[10px] font-bold text-red-600">≥10′</span>}
                    </div>
                    <button onClick={() => appt && onStart(appt.consultId)} className="mt-2 flex w-full items-center justify-center gap-1.5 rounded-lg bg-[#034751] py-1.5 text-[12px] font-semibold text-white hover:bg-[#023a42]">
                      <PlayCircle className="h-3.5 w-3.5" />{t("sch.startConsult")}
                    </button>
                  </div>
                );
              })
            )}
          </div>
        </aside>
      ) : (
        <button onClick={() => setShowWaiting(true)} className="flex w-9 shrink-0 items-center justify-center border-l border-neutral-200 text-neutral-400 hover:bg-neutral-50">
          <ChevronLeft className="h-4 w-4" />
        </button>
      )}
    </div>
  );
}

// ── Week view ─────────────────────────────────────────────────────────────────
function WeekView({ appts, filters, onBlock, t }: { appts: Appt[]; filters: { reason: string }; onBlock: (a: Appt, e: React.MouseEvent) => void; t: (k: string) => string }) {
  const reasonMatch = (a: Appt) => filters.reason === "all" || a.reason.toLowerCase().includes(filters.reason.toLowerCase());
  const todayAppts = appts.filter(reasonMatch);
  return (
    <div className="h-full overflow-auto">
      <div className="min-w-[840px]">
        <div className="sticky top-0 z-20 flex border-b border-neutral-200 bg-white">
          <div className="w-[56px] shrink-0" />
          {WEEKDAYS.map((d, i) => (
            <div key={d} className={cn("flex-1 border-l border-neutral-100 px-2 py-2 text-center", i === TODAY_DOW && "bg-[#034751]/[0.04]")}>
              <div className="text-[11px] font-medium text-neutral-400">{d}</div>
              <div className={cn("text-[15px] font-bold", i === TODAY_DOW ? "text-[#034751]" : "text-neutral-700")}>{WEEK_DATES[i]}</div>
            </div>
          ))}
        </div>
        <div className="relative flex" style={{ height: GRID_H }}>
          <div className="w-[56px] shrink-0 border-r border-neutral-100">
            {HOURS.map((h, i) => (
              <div key={h} className="relative" style={{ height: i < HOURS.length - 1 ? HOUR_PX : 0 }}>
                <span className="absolute -top-2 right-1.5 font-mono text-[10px] text-neutral-400 tnum">{String(h).padStart(2, "0")}:00</span>
              </div>
            ))}
          </div>
          {WEEKDAYS.map((_, dayIdx) => (
            <div key={dayIdx} className={cn("relative flex-1 border-l border-neutral-100", dayIdx === TODAY_DOW && "bg-[#034751]/[0.02]")}>
              {HOURS.slice(0, -1).map((h) => <div key={h} style={{ height: HOUR_PX }} className="border-b border-neutral-100" />)}
              {dayIdx === TODAY_DOW
                ? todayAppts.map((a) => <ApptBlock key={a.id} a={a} onClick={onBlock} />)
                : WEEK_SCATTER.filter((s) => s.day === dayIdx).map((s, i) => {
                    const m = STATUS_META[s.status];
                    return (
                      <div key={i} className="absolute left-1 right-1 overflow-hidden rounded-md border-l-[3px] px-1.5 py-0.5" style={{ top: (s.start / 60) * HOUR_PX, height: (s.dur / 60) * HOUR_PX - 3, background: m.bg, borderLeftColor: m.bar }} title={s.pet}>
                        <div className="truncate text-[11px] font-semibold" style={{ color: m.solid ? "#fff" : m.fg }}>{s.pet}</div>
                      </div>
                    );
                  })}
              {dayIdx === TODAY_DOW && (
                <div className="pointer-events-none absolute inset-x-0 z-10" style={{ top: (NOW_MIN / 60) * HOUR_PX }}>
                  <div className="h-0.5 bg-[#EF4444]" />
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── Month view ────────────────────────────────────────────────────────────────
function MonthView({ onPickDay, t }: { onPickDay: () => void; t: (k: string) => string }) {
  // June 2026: 30 days. Jun 1 2026 = Monday → lead 0.
  const lead = (new Date(2026, 5, 1).getDay() + 6) % 7;
  const cells: (number | null)[] = [...Array(lead).fill(null), ...Array.from({ length: 30 }, (_, i) => i + 1)];
  while (cells.length % 7 !== 0) cells.push(null);
  const today = 9;
  return (
    <div className="h-full overflow-auto p-5">
      <div className="grid grid-cols-7 gap-px overflow-hidden rounded-xl border border-neutral-200 bg-neutral-200">
        {WEEKDAYS.map((d) => (
          <div key={d} className="bg-neutral-50 py-2 text-center text-[11px] font-bold uppercase tracking-wide text-neutral-400">{d}</div>
        ))}
        {cells.map((day, i) => {
          const count = day ? MONTH_COUNTS[day] ?? 0 : 0;
          const isToday = day === today;
          return (
            <div key={i} className={cn("min-h-[92px] bg-white p-2", !day && "bg-neutral-50/40", day && "cursor-pointer hover:bg-[#034751]/[0.03]")} onClick={() => day && onPickDay()}>
              {day && (
                <>
                  <div className="flex items-center justify-between">
                    <span className={cn("flex h-6 w-6 items-center justify-center rounded-full text-[12px] font-bold", isToday ? "bg-[#034751] text-white" : "text-neutral-600")}>{day}</span>
                    {count > 0 && <span className="text-[11px] font-semibold text-neutral-400">{count}</span>}
                  </div>
                  {isToday ? (
                    <div className="mt-1 space-y-0.5">
                      <Chip text="Napoleon · 09:00" status="in-consult" />
                      <Chip text="Milo · 09:20" status="arrived" />
                      <span className="block px-1 text-[10px] font-medium text-neutral-400">+{Math.max(0, count - 2)} nữa</span>
                    </div>
                  ) : count > 0 ? (
                    <div className="mt-1.5 flex flex-wrap gap-1">
                      {Array.from({ length: Math.min(count, 5) }).map((_, k) => <span key={k} className="h-1.5 w-1.5 rounded-full bg-[#034751]/30" />)}
                    </div>
                  ) : null}
                </>
              )}
            </div>
          );
        })}
      </div>
      <p className="mt-3 text-[12px] text-neutral-400">{t("sch.monthView")} · bấm vào một ngày để xem chi tiết</p>
    </div>
  );
}

function Chip({ text, status }: { text: string; status: ApptStatus }) {
  const m = STATUS_META[status];
  return <div className="truncate rounded px-1 py-0.5 text-[10px] font-medium" style={{ background: m.bg, color: m.solid ? "#fff" : m.fg }}>{text}</div>;
}

// ── Kanban view ───────────────────────────────────────────────────────────────
const LANES: { id: string; key: string }[] = [
  { id: "arrived", key: "sch.kb.arrived" },
  { id: "opd", key: "sch.kb.opd" },
  { id: "ipd", key: "sch.kb.ipd" },
  { id: "billing", key: "sch.kb.billing" },
];

function laneOf(a: Appt): string | null {
  if (a.status === "completed") return "billing";
  if (a.status === "arrived") return "arrived";
  if (a.status === "in-consult") return a.emergency || /truyền dịch|hậu phẫu|nội trú/i.test(a.reason) ? "ipd" : "opd";
  if (a.status === "confirmed" && /hậu phẫu|triệt sản|thủ thuật|băng/i.test(a.reason)) return "ipd";
  return null;
}

function KanbanView({ appts, onBlock, t }: { appts: Appt[]; onBlock: (a: Appt, e: React.MouseEvent) => void; t: (k: string) => string }) {
  const [filter, setFilter] = useState<"all" | "mine" | "critical">("all");
  const filtered = appts.filter((a) => (filter === "critical" ? a.emergency : filter === "mine" ? a.vetId === "linh" : true));
  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center gap-1.5 px-5 py-3">
        {([["all", "sch.kb.all"], ["mine", "sch.kb.mine"], ["critical", "sch.kb.critical"]] as const).map(([f, k]) => (
          <button key={f} onClick={() => setFilter(f)} className={cn("rounded-full border px-3 py-1 text-[12px] font-medium transition-colors", filter === f ? "border-[#034751] bg-[#034751] text-white" : "border-neutral-200 text-neutral-600 hover:bg-neutral-50")}>{t(k)}</button>
        ))}
      </div>
      <div className="grid min-h-0 flex-1 grid-cols-4 gap-3 overflow-hidden px-5 pb-5">
        {LANES.map((lane) => {
          const cards = filtered.filter((a) => laneOf(a) === lane.id);
          return (
            <div key={lane.id} className="flex min-h-0 flex-col rounded-xl border border-neutral-200 bg-neutral-50/50">
              <div className="flex items-center justify-between border-b border-neutral-200 px-3 py-2.5">
                <span className="text-[12px] font-bold uppercase tracking-wide text-neutral-500">{t(lane.key)}</span>
                <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-white px-1.5 text-[11px] font-bold text-neutral-500">{cards.length}</span>
              </div>
              <div className="flex-1 space-y-2 overflow-y-auto p-2.5">
                {cards.map((a) => {
                  const m = STATUS_META[a.status];
                  return (
                    <button key={a.id} onClick={(e) => onBlock(a, e)} className="block w-full rounded-lg border border-neutral-200 bg-white p-2.5 text-left transition-shadow hover:shadow-card">
                      <div className="flex items-center gap-1.5">
                        {a.emergency && <Siren className="h-3 w-3 text-red-500" />}
                        <span className="text-[13px] font-bold text-neutral-900">{a.pet}</span>
                        <span className="ml-auto rounded-full px-1.5 py-0.5 text-[10px] font-bold" style={{ background: m.bg, color: m.solid ? "#fff" : m.fg }}>{t(m.key)}</span>
                      </div>
                      <div className="mt-0.5 truncate text-[11px] text-neutral-500">{a.breed} · {a.owner}</div>
                      <div className="mt-1 truncate text-[12px] text-neutral-600">{a.reason}</div>
                    </button>
                  );
                })}
                {cards.length === 0 && <p className="py-6 text-center text-[12px] text-neutral-300">—</p>}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── Appointment popover (2 actions only) ──────────────────────────────────────
function ApptPopover({ sel, onClose, onStart, t }: { sel: { appt: Appt; x: number; y: number }; onClose: () => void; onStart: (id: string) => void; t: (k: string) => string }) {
  const a = sel.appt;
  const m = STATUS_META[a.status];
  const left = Math.min(sel.x, window.innerWidth - 312);
  const top = Math.min(Math.max(sel.y, 64), window.innerHeight - 240);
  const room = ROOMS.find((r) => r.id === a.roomId)?.name ?? "—";
  const vet = SCHED_DOCTORS.find((d) => d.id === a.vetId)?.name ?? "—";
  return (
    <div className="fixed z-50 w-[296px] rounded-xl border border-neutral-200 bg-white p-4 shadow-lift" style={{ left, top }}>
      <button onClick={onClose} className="absolute right-3 top-3 text-neutral-400 hover:text-neutral-600"><X className="h-4 w-4" /></button>
      <div className="flex items-center gap-2.5">
        <span className="flex h-10 w-10 items-center justify-center rounded-lg" style={{ background: a.species === "dog" ? "rgba(3,71,81,0.1)" : "rgba(120,90,166,0.12)", color: a.species === "dog" ? "#034751" : "#785AA6" }}>
          <PetGlyph species={a.species} className="h-5 w-5" />
        </span>
        <div className="min-w-0">
          <div className="flex items-center gap-1.5">
            <span className="font-display text-[16px] font-bold text-neutral-900">{a.pet}</span>
            {a.emergency && <Siren className="h-3.5 w-3.5 text-red-500" />}
          </div>
          <div className="text-[12px] text-neutral-500">{a.breed}</div>
        </div>
      </div>

      <span className="mt-2.5 inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-bold" style={{ background: m.bg, color: m.solid ? "#fff" : m.fg }}>{t(m.key)}</span>

      <div className="mt-2.5 space-y-1.5 text-[13px]">
        <Row icon={CircleAlert} text={a.reason} />
        <Row icon={Clock} text={`${hhmm(a.start)} – ${hhmm(a.start + a.dur)} (${a.dur}′)`} />
        <Row icon={MapPin} text={room} />
        <Row icon={Stethoscope} text={vet} />
        <Row icon={Phone} text={`${a.owner} · ${a.phone}`} />
      </div>

      {/* exactly two actions — per 08/06 meeting */}
      <div className="mt-3 flex gap-2">
        <button onClick={() => onStart(a.consultId)} className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-[#034751] py-2 text-[13px] font-semibold text-white hover:bg-[#023a42]">
          <PlayCircle className="h-4 w-4" />{t("sch.startConsult")}
        </button>
        <button className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-neutral-200 px-3 py-2 text-[13px] font-medium text-neutral-600 hover:bg-neutral-50">
          <Phone className="h-4 w-4" /><span className="hidden sm:inline">{t("sch.contact")}</span>
        </button>
      </div>
    </div>
  );
}

function Row({ icon: Icon, text }: { icon: typeof Clock; text: string }) {
  return (
    <div className="flex items-start gap-2 text-neutral-600">
      <Icon className="mt-0.5 h-3.5 w-3.5 shrink-0 text-neutral-400" />
      <span className="min-w-0">{text}</span>
    </div>
  );
}

// ── New appointment wizard ────────────────────────────────────────────────────
function Wizard({ onClose, t }: { onClose: () => void; t: (k: string) => string }) {
  const [step, setStep] = useState(1);
  const [client, setClient] = useState<(typeof WIZ_CLIENTS)[number] | null>(null);
  const [pet, setPet] = useState<string | null>(null);
  const [slot, setSlot] = useState<string | null>(null);
  const [dur, setDur] = useState(30);
  const [reason, setReason] = useState<string | null>(null);
  const [room, setRoom] = useState(ROOMS[0].id);
  const [reminder, setReminder] = useState(true);
  const [done, setDone] = useState(false);

  const STEPS = [t("sch.wz.client"), t("sch.wz.patient"), t("sch.wz.slot"), t("sch.wz.confirmStep")];
  const slots = HOURS.slice(0, -1).flatMap((h) => [`${String(h).padStart(2, "0")}:00`, `${String(h).padStart(2, "0")}:30`]);
  const canNext = step === 1 ? !!client : step === 2 ? !!pet : step === 3 ? !!slot && !!reason : true;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-neutral-900/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative flex max-h-[88vh] w-[560px] flex-col overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-lift">
        {/* header + progress */}
        <div className="border-b border-neutral-100 px-5 py-4">
          <div className="flex items-center justify-between">
            <h2 className="font-display text-[17px] font-bold text-neutral-900">{t("sch.wz.title")}</h2>
            <button onClick={onClose} className="text-neutral-400 hover:text-neutral-600"><X className="h-5 w-5" /></button>
          </div>
          {!done && (
            <div className="mt-3 flex items-center gap-1.5">
              {STEPS.map((s, i) => (
                <div key={s} className="flex flex-1 items-center gap-1.5">
                  <span className={cn("flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[11px] font-bold", i + 1 < step ? "bg-[#034751] text-white" : i + 1 === step ? "bg-[#034751] text-white" : "bg-neutral-100 text-neutral-400")}>
                    {i + 1 < step ? <Check className="h-3.5 w-3.5" /> : i + 1}
                  </span>
                  <span className={cn("truncate text-[12px] font-medium", i + 1 === step ? "text-neutral-900" : "text-neutral-400")}>{s}</span>
                  {i < STEPS.length - 1 && <span className="h-px flex-1 bg-neutral-200" />}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* body */}
        <div className="flex-1 overflow-y-auto p-5">
          {done ? (
            <div className="flex flex-col items-center gap-3 py-10 text-center">
              <span className="flex h-14 w-14 items-center justify-center rounded-full bg-[#4ABA7A]/15 text-[#1B804C]"><Check className="h-7 w-7" /></span>
              <div className="text-[16px] font-bold text-neutral-900">{t("sch.wz.booked")}</div>
              <div className="text-[13px] text-neutral-500">{pet} · {slot} · {reason}</div>
            </div>
          ) : step === 1 ? (
            <div>
              <input placeholder={t("sch.wz.searchClient")} className="mb-3 h-10 w-full rounded-lg border border-neutral-200 px-3 text-sm focus:border-[#034751] focus:outline-none focus:ring-2 focus:ring-[#034751]/20" />
              <div className="space-y-1.5">
                {WIZ_CLIENTS.map((c) => (
                  <button key={c.id} onClick={() => { setClient(c); setPet(null); }} className={cn("flex w-full items-center justify-between rounded-lg border px-3 py-2.5 text-left transition-colors", client?.id === c.id ? "border-[#034751] bg-[#034751]/5" : "border-neutral-200 hover:bg-neutral-50")}>
                    <div>
                      <div className="text-[13px] font-semibold text-neutral-800">{c.name}</div>
                      <div className="text-[12px] text-neutral-400">{c.phone} · {c.pets.length} thú cưng</div>
                    </div>
                    {c.hasAppt && <span className="rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-bold text-amber-700">đã có lịch</span>}
                  </button>
                ))}
              </div>
              <button className="mt-3 flex w-full items-center justify-center gap-1.5 rounded-lg border border-dashed border-neutral-300 py-2 text-[13px] font-medium text-neutral-500 hover:border-[#034751] hover:text-[#034751]"><Plus className="h-4 w-4" />{t("sch.wz.newClient")}</button>
            </div>
          ) : step === 2 ? (
            <div className="grid grid-cols-2 gap-2.5">
              {client?.pets.map((p) => (
                <button key={p.name} onClick={() => setPet(p.name)} className={cn("flex items-center gap-2.5 rounded-lg border p-3 text-left transition-colors", pet === p.name ? "border-[#034751] bg-[#034751]/5" : "border-neutral-200 hover:bg-neutral-50")}>
                  <span className="flex h-9 w-9 items-center justify-center rounded-lg" style={{ background: p.species === "dog" ? "rgba(3,71,81,0.1)" : "rgba(120,90,166,0.12)", color: p.species === "dog" ? "#034751" : "#785AA6" }}><PetGlyph species={p.species} className="h-4 w-4" /></span>
                  <div className="min-w-0"><div className="truncate text-[13px] font-semibold text-neutral-800">{p.name}</div><div className="truncate text-[11px] text-neutral-400">{p.breed}</div></div>
                </button>
              ))}
              <button className="flex items-center justify-center gap-1.5 rounded-lg border border-dashed border-neutral-300 p-3 text-[13px] font-medium text-neutral-500 hover:border-[#034751] hover:text-[#034751]"><Plus className="h-4 w-4" />{t("sch.wz.newPet")}</button>
            </div>
          ) : step === 3 ? (
            <div className="space-y-4">
              {client?.hasAppt && (
                <div className="flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-[12px] text-amber-800">
                  <CircleAlert className="mt-0.5 h-4 w-4 shrink-0" />{t("sch.wz.conflict")}
                </div>
              )}
              <Field label={t("sch.wz.date")}><div className="inline-flex items-center gap-2 rounded-lg border border-neutral-200 px-3 py-2 text-[13px] font-medium text-neutral-700"><CalendarClock className="h-4 w-4 text-neutral-400" />{TODAY_LABEL}</div></Field>
              <Field label={t("sch.wz.time")}>
                <div className="grid grid-cols-5 gap-1.5">
                  {slots.map((s) => <button key={s} onClick={() => setSlot(s)} className={cn("rounded-md border py-1.5 text-[12px] font-medium transition-colors", slot === s ? "border-[#034751] bg-[#034751] text-white" : "border-neutral-200 text-neutral-600 hover:bg-neutral-50")}>{s}</button>)}
                </div>
              </Field>
              <Field label={t("sch.wz.duration")}>
                <div className="flex gap-1.5">
                  {DURATIONS.map((d) => <button key={d} onClick={() => setDur(d)} className={cn("rounded-md border px-3 py-1.5 text-[12px] font-semibold transition-colors", dur === d ? "border-[#034751] bg-[#034751] text-white" : "border-neutral-200 text-neutral-600 hover:bg-neutral-50")}>{d}′</button>)}
                </div>
              </Field>
              <Field label={t("sch.wz.reason")}>
                <div className="flex flex-wrap gap-1.5">
                  {REASONS.map((r) => <button key={r} onClick={() => setReason(r)} className={cn("rounded-full border px-2.5 py-1 text-[12px] font-medium transition-colors", reason === r ? "border-[#034751] bg-[#034751] text-white" : "border-neutral-200 text-neutral-600 hover:bg-neutral-50")}>{r}</button>)}
                </div>
              </Field>
              <Field label={t("sch.wz.room")}>
                <div className="flex flex-wrap gap-1.5">
                  {ROOMS.map((r) => <button key={r.id} onClick={() => setRoom(r.id)} className={cn("rounded-md border px-2.5 py-1.5 text-[12px] font-medium transition-colors", room === r.id ? "border-[#034751] bg-[#034751] text-white" : "border-neutral-200 text-neutral-600 hover:bg-neutral-50")}>{r.name}</button>)}
                </div>
              </Field>
              <Field label={t("sch.wz.notes")}><textarea rows={2} className="w-full resize-none rounded-lg border border-neutral-200 px-3 py-2 text-[13px] focus:border-[#034751] focus:outline-none focus:ring-2 focus:ring-[#034751]/20" /></Field>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="rounded-xl border border-neutral-200 p-4">
                <SummaryRow label={t("sch.wz.client")} value={client?.name ?? "—"} />
                <SummaryRow label={t("sch.wz.patient")} value={pet ?? "—"} />
                <SummaryRow label={t("sch.wz.date")} value={TODAY_LABEL} />
                <SummaryRow label={t("sch.wz.time")} value={`${slot} · ${dur}′`} />
                <SummaryRow label={t("sch.wz.reason")} value={reason ?? "—"} />
                <SummaryRow label={t("sch.wz.room")} value={ROOMS.find((r) => r.id === room)?.name ?? "—"} />
              </div>
              <button onClick={() => setReminder((v) => !v)} className="flex w-full items-center justify-between rounded-lg border border-neutral-200 px-3 py-2.5 text-left hover:bg-neutral-50">
                <span className="text-[13px] font-medium text-neutral-700">{t("sch.wz.reminder")}</span>
                <span className={cn("relative h-5 w-9 shrink-0 rounded-full transition-colors", reminder ? "bg-[#034751]" : "bg-neutral-300")}><span className={cn("absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition-all", reminder ? "left-[18px]" : "left-0.5")} /></span>
              </button>
            </div>
          )}
        </div>

        {/* footer */}
        {!done && (
          <div className="flex items-center justify-between border-t border-neutral-100 px-5 py-3">
            <button onClick={() => (step === 1 ? onClose() : setStep((s) => s - 1))} className="rounded-lg border border-neutral-200 px-4 py-2 text-sm font-medium text-neutral-600 hover:bg-neutral-50">
              {step === 1 ? t("cs.cancel") : t("sch.wz.back")}
            </button>
            <button
              disabled={!canNext}
              onClick={() => (step === 4 ? setDone(true) : setStep((s) => s + 1))}
              className={cn("rounded-lg px-5 py-2 text-sm font-semibold text-white transition-colors", canNext ? "bg-[#034751] hover:bg-[#023a42]" : "cursor-not-allowed bg-neutral-300")}
            >
              {step === 4 ? t("sch.wz.book") : t("sch.wz.next")}
            </button>
          </div>
        )}
        {done && (
          <div className="border-t border-neutral-100 px-5 py-3 text-right">
            <button onClick={onClose} className="rounded-lg bg-[#034751] px-5 py-2 text-sm font-semibold text-white hover:bg-[#023a42]">Đóng</button>
          </div>
        )}
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="mb-1.5 text-[12px] font-bold uppercase tracking-wide text-neutral-400">{label}</div>
      {children}
    </div>
  );
}
function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between border-b border-neutral-100 py-1.5 last:border-0">
      <span className="text-[12px] text-neutral-400">{label}</span>
      <span className="text-[13px] font-semibold text-neutral-800">{value}</span>
    </div>
  );
}
