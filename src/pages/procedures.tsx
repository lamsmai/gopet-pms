import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Activity,
  AlertTriangle,
  Cat,
  CheckCircle2,
  Clock,
  Dog,
  Filter,
  GripVertical,
  HeartPulse,
  Link2,
  PawPrint,
  Plus,
  Rabbit,
  ShieldAlert,
  Siren,
  Stethoscope,
  Syringe,
  User,
  X,
  type LucideIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useLang } from "@/lib/i18n";
import {
  PHASES,
  procedures as SEED,
  procSummary,
  type AnesthesiaRisk,
  type Phase,
  type Procedure,
  type ProcPriority,
  type Species,
} from "@/lib/procedure-data";

const FOCUS = "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#034751]/40 focus-visible:ring-offset-1";
type TFn = (k: string) => string;
type FilterId = "all" | "highrisk" | "emergency" | "consent";

const SPECIES_ICON: Record<Species, LucideIcon> = { dog: Dog, cat: Cat, rabbit: Rabbit, other: PawPrint };

function riskStyle(r: AnesthesiaRisk) {
  return {
    low: "bg-success-soft text-success-strong",
    moderate: "bg-warning-soft text-warning-foreground",
    high: "bg-destructive/10 text-destructive",
  }[r];
}

const clone = (p: Procedure): Procedure => ({ ...p });

export default function ProceduresPage() {
  const { t } = useLang();
  const navigate = useNavigate();
  const [list, setList] = useState<Procedure[]>(() => SEED.map(clone));
  const [filter, setFilter] = useState<FilterId>("all");
  const [dragId, setDragId] = useState<string | null>(null);
  const [overLane, setOverLane] = useState<Phase | null>(null);
  const [detail, setDetail] = useState<Procedure | null>(null);

  const summary = useMemo(() => procSummary(list), [list]);

  const visible = useMemo(() => {
    return list.filter((p) => {
      if (filter === "highrisk") return p.anesthesiaRisk === "high";
      if (filter === "emergency") return p.priority === "emergency";
      if (filter === "consent") return !p.consentSigned;
      return true;
    });
  }, [list, filter]);

  function move(id: string, phase: Phase) {
    setList((prev) => prev.map((p) => (p.id === id ? { ...p, phase } : p)));
    setDetail((d) => (d && d.id === id ? { ...d, phase } : d));
  }
  function toggleConsent(id: string) {
    setList((prev) => prev.map((p) => (p.id === id ? { ...p, consentSigned: !p.consentSigned } : p)));
    setDetail((d) => (d && d.id === id ? { ...d, consentSigned: !d.consentSigned } : d));
  }

  const FILTERS: { id: FilterId; key: string; n?: number }[] = [
    { id: "all", key: "pb.f.all", n: list.length },
    { id: "emergency", key: "pb.f.emergency", n: list.filter((p) => p.priority === "emergency").length },
    { id: "highrisk", key: "pb.f.highrisk", n: summary.highRisk },
    { id: "consent", key: "pb.f.consent", n: summary.awaitingConsent },
  ];

  return (
    <div className="flex h-full flex-col bg-[#F7F9F8]">
      {/* Header */}
      <header className="shrink-0 border-b border-neutral-200 bg-white px-5 pt-4">
        <div className="mx-auto flex max-w-[1700px] flex-col gap-3">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center gap-1.5 rounded-md bg-[#034751]/10 px-2.5 py-1 text-[12px] font-bold text-[#034751]">
                  <Syringe className="h-3.5 w-3.5" />
                  {t("nav.consult.procedures")}
                </span>
                <span className="rounded-md bg-white px-2.5 py-1 text-[12px] font-semibold text-neutral-500 ring-1 ring-neutral-200">{t("pb.dragHint")}</span>
              </div>
              <h1 className="mt-2 font-display text-[26px] font-bold leading-tight tracking-tight text-neutral-950">{t("pb.title")}</h1>
            </div>
            <Button className="gap-1.5"><Plus className="h-4 w-4" />{t("pb.new")}</Button>
          </div>

          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-5">
            <Kpi label={t("pb.kpi.today")} value={summary.total} icon={Activity} tone="teal" />
            <Kpi label={t("pb.kpi.surgery")} value={summary.inSurgery} icon={Syringe} tone="blue" />
            <Kpi label={t("pb.kpi.recovery")} value={summary.recovery} icon={HeartPulse} tone="green" />
            <Kpi label={t("pb.kpi.highrisk")} value={summary.highRisk} icon={ShieldAlert} tone="rose" />
            <Kpi label={t("pb.kpi.consent")} value={summary.awaitingConsent} icon={AlertTriangle} tone="amber" />
          </div>

          <div className="flex items-center gap-1.5 overflow-x-auto pb-3">
            {FILTERS.map((f) => (
              <button
                key={f.id}
                onClick={() => setFilter(f.id)}
                className={cn(
                  "inline-flex h-8 shrink-0 items-center gap-1.5 rounded-full border px-3 text-[12px] font-semibold transition-colors",
                  FOCUS,
                  filter === f.id ? "border-[#034751] bg-[#034751] text-white" : "border-neutral-200 bg-white text-neutral-600 hover:border-[#034751]/40 hover:text-[#034751]"
                )}
              >
                <Filter className="h-3 w-3" />
                {t(f.key)}
                <span className={cn("tnum", filter === f.id ? "text-white/80" : "text-neutral-400")}>{f.n}</span>
              </button>
            ))}
          </div>
        </div>
      </header>

      {/* Board */}
      <div className="min-h-0 flex-1 overflow-x-auto">
        <div className="grid h-full min-w-[920px] grid-cols-4 gap-3 p-4">
          {PHASES.map((lane) => {
            const cards = visible.filter((p) => p.phase === lane.id);
            return (
              <div
                key={lane.id}
                onDragOver={(e) => {
                  e.preventDefault();
                  e.dataTransfer.dropEffect = "move";
                  setOverLane((l) => (l === lane.id ? l : lane.id));
                }}
                onDragLeave={(e) => {
                  if (!e.currentTarget.contains(e.relatedTarget as Node)) setOverLane((l) => (l === lane.id ? null : l));
                }}
                onDrop={(e) => {
                  e.preventDefault();
                  // Prefer the dataTransfer payload (survives across native drag ticks); fall back to state.
                  const id = dragId ?? e.dataTransfer.getData("text/plain");
                  if (id) move(id, lane.id);
                  setDragId(null);
                  setOverLane(null);
                }}
                className={cn(
                  "flex min-h-0 flex-col rounded-xl border bg-white transition-colors",
                  overLane === lane.id ? "border-[#034751] ring-2 ring-[#034751]/20" : "border-neutral-200"
                )}
              >
                <div className="flex shrink-0 items-center justify-between rounded-t-xl border-b border-neutral-100 px-3 py-2.5" style={{ backgroundColor: lane.soft }}>
                  <span className="flex items-center gap-2 text-[12px] font-bold uppercase tracking-wide" style={{ color: lane.accent }}>
                    <span className="h-2 w-2 rounded-full" style={{ backgroundColor: lane.accent }} />
                    {t(lane.key)}
                  </span>
                  <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-white/80 px-1.5 text-[11px] font-bold" style={{ color: lane.accent }}>{cards.length}</span>
                </div>
                <div className="min-h-0 flex-1 space-y-2 overflow-y-auto p-2.5">
                  {cards.map((p) => (
                    <ProcCard
                      key={p.id}
                      p={p}
                      dragging={dragId === p.id}
                      onDragStart={() => setDragId(p.id)}
                      onDragEnd={() => {
                        setDragId(null);
                        setOverLane(null);
                      }}
                      onClick={() => setDetail(p)}
                      t={t}
                    />
                  ))}
                  {cards.length === 0 && (
                    <div className="flex h-24 items-center justify-center rounded-lg border border-dashed border-neutral-200 text-[12px] text-neutral-300">
                      {dragId ? t("pb.dropHere") : "—"}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {detail && (
        <DetailDrawer p={detail} onClose={() => setDetail(null)} onMove={move} onToggleConsent={toggleConsent} onOpenRecord={(id) => navigate(`/patients/${id}`)} t={t} />
      )}
    </div>
  );
}

function Kpi({ label, value, icon: Icon, tone }: { label: string; value: number; icon: LucideIcon; tone: "teal" | "blue" | "green" | "rose" | "amber" }) {
  const tones: Record<string, string> = {
    teal: "bg-[#034751]/10 text-[#034751]",
    blue: "bg-info-soft text-info-strong",
    green: "bg-success-soft text-success-strong",
    rose: "bg-destructive/10 text-destructive",
    amber: "bg-amber-50 text-amber-700",
  };
  return (
    <div className="flex items-center gap-2.5 rounded-lg border border-neutral-200 bg-white px-3 py-2 shadow-soft">
      <span className={cn("flex h-8 w-8 shrink-0 items-center justify-center rounded-md", tones[tone])}>
        <Icon className="h-4 w-4" />
      </span>
      <div className="min-w-0">
        <div className="text-xl font-bold leading-none tnum text-neutral-950">{value}</div>
        <div className="mt-0.5 truncate text-[11px] font-semibold text-neutral-500">{label}</div>
      </div>
    </div>
  );
}

function PriorityFlag({ priority, t }: { priority: ProcPriority; t: TFn }) {
  if (priority === "emergency")
    return (
      <span className="inline-flex items-center gap-1 rounded-md bg-destructive px-1.5 py-0.5 text-[9px] font-bold uppercase text-white">
        <Siren className="h-2.5 w-2.5" />
        {t("pb.pri.emergency")}
      </span>
    );
  if (priority === "urgent")
    return <span className="rounded-md bg-warning-soft px-1.5 py-0.5 text-[9px] font-bold uppercase text-warning-foreground">{t("pb.pri.urgent")}</span>;
  return null;
}

function ProcCard({
  p,
  dragging,
  onDragStart,
  onDragEnd,
  onClick,
  t,
}: {
  p: Procedure;
  dragging: boolean;
  onDragStart: () => void;
  onDragEnd: () => void;
  onClick: () => void;
  t: TFn;
}) {
  const Icon = SPECIES_ICON[p.species];
  return (
    <div
      draggable
      onDragStart={(e) => {
        e.dataTransfer.effectAllowed = "move";
        e.dataTransfer.setData("text/plain", p.id);
        onDragStart();
      }}
      onDragEnd={onDragEnd}
      onClick={onClick}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onClick();
        }
      }}
      role="button"
      tabIndex={0}
      aria-label={`${p.pet} — ${p.procedure}`}
      className={cn(
        "group cursor-grab rounded-lg border border-neutral-200 bg-white p-2.5 shadow-soft transition-all hover:border-[#034751]/40 hover:shadow-card active:cursor-grabbing",
        FOCUS,
        dragging && "opacity-40 ring-2 ring-[#034751]/30",
        p.priority === "emergency" && "border-l-[3px] border-l-destructive"
      )}
    >
      <div className="flex items-start gap-2">
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#034751]/8 text-[#034751]">
          <Icon className="h-4 w-4" />
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5">
            <span className="truncate text-[13px] font-bold text-neutral-900">{p.pet}</span>
            <GripVertical className="ml-auto h-3.5 w-3.5 shrink-0 text-neutral-300 group-hover:text-neutral-400" />
          </div>
          <div className="truncate text-[11px] text-neutral-500">{p.breed} · {p.owner}</div>
        </div>
      </div>
      <div className="mt-1.5 truncate text-[12px] font-medium text-neutral-700">{p.procedure}</div>
      <div className="mt-1.5 flex flex-wrap items-center gap-1">
        <PriorityFlag priority={p.priority} t={t} />
        <span className={cn("rounded-md px-1.5 py-0.5 text-[9px] font-bold uppercase", riskStyle(p.anesthesiaRisk))}>{t("pb.asa")} {t(`pb.risk.${p.anesthesiaRisk}`)}</span>
        {!p.consentSigned && (
          <span className="inline-flex items-center gap-0.5 rounded-md bg-amber-50 px-1.5 py-0.5 text-[9px] font-bold uppercase text-amber-700">
            <AlertTriangle className="h-2.5 w-2.5" />
            {t("pb.noConsent")}
          </span>
        )}
      </div>
      <div className="mt-2 flex items-center justify-between border-t border-neutral-100 pt-1.5 text-[10px] text-neutral-400">
        <span className="inline-flex items-center gap-1 font-semibold text-neutral-500">
          <span className="flex h-4 w-4 items-center justify-center rounded-full bg-[#034751] text-[7px] font-bold text-white">{p.vetInitials}</span>
          {p.room}
        </span>
        <span className="inline-flex items-center gap-1 tnum">
          <Clock className="h-3 w-3" />
          {p.scheduledAt}
        </span>
      </div>
    </div>
  );
}

// ── Detail drawer ─────────────────────────────────────────────────────────────
function DetailDrawer({
  p,
  onClose,
  onMove,
  onToggleConsent,
  onOpenRecord,
  t,
}: {
  p: Procedure;
  onClose: () => void;
  onMove: (id: string, phase: Phase) => void;
  onToggleConsent: (id: string) => void;
  onOpenRecord: (petId: string) => void;
  t: TFn;
}) {
  const Icon = SPECIES_ICON[p.species];
  const rows: { label: string; value: string; icon: LucideIcon }[] = [
    { label: t("pb.d.owner"), value: p.owner, icon: User },
    { label: t("pb.d.vet"), value: p.vet, icon: Stethoscope },
    { label: t("pb.d.nurse"), value: p.nurse, icon: HeartPulse },
    { label: t("pb.d.room"), value: p.room, icon: ShieldAlert },
    { label: t("pb.d.scheduled"), value: p.scheduledAt, icon: Clock },
    { label: t("pb.d.duration"), value: p.estDuration, icon: Activity },
  ];
  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <button aria-label={t("cs.cancel")} onClick={onClose} className="absolute inset-0 bg-foreground/40 backdrop-blur-sm" />
      <aside className="relative flex h-full w-full max-w-[420px] flex-col bg-white shadow-lift animate-in slide-in-from-right duration-300">
        <div className="flex items-start justify-between gap-3 border-b border-neutral-200 p-4">
          <div className="flex items-center gap-3">
            <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#034751]/8 text-[#034751]">
              <Icon className="h-5 w-5" />
            </span>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-display text-[18px] font-bold tracking-tight text-neutral-950">{p.pet}</h2>
                <PriorityFlag priority={p.priority} t={t} />
              </div>
              <div className="text-[12px] text-neutral-500">{p.breed} · <span className="font-mono text-[11px]">{p.id}</span></div>
            </div>
          </div>
          <button onClick={onClose} aria-label={t("cs.cancel")} className={cn("flex h-8 w-8 items-center justify-center rounded-md text-neutral-400 hover:bg-neutral-100", FOCUS)}>
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="min-h-0 flex-1 space-y-4 overflow-y-auto p-4">
          <div className="rounded-xl border border-neutral-200 p-3">
            <div className="text-[15px] font-bold text-neutral-900">{p.procedure}</div>
            <div className="mt-2 flex flex-wrap items-center gap-1.5">
              <span className={cn("rounded-md px-2 py-0.5 text-[10px] font-bold uppercase", riskStyle(p.anesthesiaRisk))}>{t("pb.asa")} {t(`pb.risk.${p.anesthesiaRisk}`)} {t("pb.anesthesia")}</span>
              <span className={cn("inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[10px] font-bold uppercase", p.consentSigned ? "bg-success-soft text-success-strong" : "bg-amber-50 text-amber-700")}>
                {p.consentSigned ? <CheckCircle2 className="h-3 w-3" /> : <AlertTriangle className="h-3 w-3" />}
                {p.consentSigned ? t("pb.consentOk") : t("pb.noConsent")}
              </span>
            </div>
          </div>

          <dl className="grid grid-cols-2 gap-2">
            {rows.map((r) => (
              <div key={r.label} className="rounded-lg border border-neutral-100 bg-neutral-50 px-2.5 py-2">
                <dt className="flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wide text-neutral-400">
                  <r.icon className="h-3 w-3" />
                  {r.label}
                </dt>
                <dd className="mt-0.5 truncate text-[13px] font-semibold text-neutral-800">{r.value}</dd>
              </div>
            ))}
          </dl>

          <div>
            <div className="mb-1 text-[11px] font-bold uppercase tracking-wide text-neutral-400">{t("pb.d.note")}</div>
            <p className="rounded-lg border border-neutral-100 bg-neutral-50 px-3 py-2 text-[13px] leading-relaxed text-neutral-700">{p.note}</p>
          </div>

          <div>
            <div className="mb-1.5 text-[11px] font-bold uppercase tracking-wide text-neutral-400">{t("pb.d.movePhase")}</div>
            <div className="grid grid-cols-2 gap-1.5">
              {PHASES.map((ph) => (
                <button
                  key={ph.id}
                  onClick={() => onMove(p.id, ph.id)}
                  className={cn(
                    "rounded-lg border px-2.5 py-2 text-[12px] font-semibold transition-colors",
                    FOCUS,
                    p.phase === ph.id ? "border-transparent text-white" : "border-neutral-200 text-neutral-600 hover:border-neutral-300"
                  )}
                  style={p.phase === ph.id ? { backgroundColor: ph.accent } : undefined}
                >
                  {t(ph.key)}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-2 border-t border-neutral-200 p-4">
          <Button variant="outline" className="flex-1 gap-1.5" onClick={() => onToggleConsent(p.id)}>
            {p.consentSigned ? <AlertTriangle className="h-4 w-4" /> : <CheckCircle2 className="h-4 w-4" />}
            {p.consentSigned ? t("pb.revokeConsent") : t("pb.signConsent")}
          </Button>
          {p.petId && (
            <Button className="flex-1 gap-1.5" onClick={() => onOpenRecord(p.petId!)}>
              <Link2 className="h-4 w-4" />
              {t("pb.openRecord")}
            </Button>
          )}
        </div>
      </aside>
    </div>
  );
}
