import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  AlertTriangle,
  ChevronRight,
  User,
  Phone,
  MapPin,
  Stethoscope,
  Activity,
  Clock,
  FileText,
  History,
  MessageCircle,
  Plus,
  Palette,
  Check,
  ChevronDown,
  PawPrint,
  BedDouble,
  CircleDollarSign,
  Inbox,
  CheckCircle2,
  WifiOff,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useLang } from "@/lib/i18n";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetFooter,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import {
  apptStats,
  todayAppointments,
  liveQueue,
  inpatients,
  tasks as TASKS,
  notepadColors,
  parseAlert,
  sortAlerts,
  STATUS_META,
  PRIORITY_META,
  type QueuePatient,
  type Inpatient,
  type Task,
  type QueueStatus,
  type TodayAppt,
  type TodayApptStatus,
} from "@/lib/dashboard-data";

// fixed "now" for the prototype (matches the 10:18 schedule context)
const NOW = new Date(2026, 5, 9, 10, 18);
const NOW_TIME = "10:18";

// ─────────────────────────────────────────────────────────────────────────────
// Small shared pieces
// ─────────────────────────────────────────────────────────────────────────────
function Meta({ icon: Icon, children }: { icon: typeof User; children: React.ReactNode }) {
  return (
    <span className="flex min-w-0 items-center gap-1.5 text-[13px] text-neutral-500">
      <Icon className="h-3.5 w-3.5 shrink-0 text-neutral-400" />
      <span className="truncate">{children}</span>
    </span>
  );
}

function TypeBadge({ variant }: { variant: "outpatient" | "inpatient" }) {
  const out = variant === "outpatient";
  return (
    <span
      className="inline-flex items-center rounded-md px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider"
      style={out ? { background: "#034751", color: "#fff" } : { background: "#785AA6", color: "#fff" }}
    >
      {out ? "Outpatient" : "Inpatient"}
    </span>
  );
}

function StatusBadge({ status, t }: { status: QueueStatus; t: (k: string) => string }) {
  const m = STATUS_META[status];
  return (
    <span
      className="inline-flex shrink-0 items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide"
      style={{ background: m.bg, color: m.fg }}
    >
      {status === "In Progress" && <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-white" />}
      {t(m.key)}
    </span>
  );
}

function AlertChips({ alerts }: { alerts: string[] }) {
  const sorted = sortAlerts(alerts);
  const shown = sorted.slice(0, 3);
  const rest = sorted.slice(3);
  return (
    <>
      {shown.map((raw) => {
        const { detail, meta } = parseAlert(raw);
        const label = meta.label === "Allergy" && detail ? `Allergy: ${detail}` : meta.label;
        return (
          <span
            key={raw}
            title={meta.desc}
            className={cn(
              "inline-flex cursor-help items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold",
              meta.critical && "ring-1 ring-inset ring-red-300"
            )}
            style={{ background: meta.bg, color: meta.color }}
          >
            <AlertTriangle className="h-3 w-3" />
            {label}
          </span>
        );
      })}
      {rest.length > 0 && (
        <span
          title={rest.map((r) => parseAlert(r).meta.label).join(", ")}
          className="inline-flex cursor-help items-center rounded-full bg-neutral-100 px-2 py-0.5 text-[11px] font-semibold text-neutral-500"
        >
          +{rest.length}
        </span>
      )}
    </>
  );
}

function ActionIcon({ icon: Icon, label, onClick }: { icon: typeof FileText; label: string; onClick?: () => void }) {
  return (
    <button
      title={label}
      aria-label={label}
      onClick={onClick}
      className="flex h-7 w-7 items-center justify-center rounded-md border border-neutral-200 bg-white text-neutral-500 transition-colors hover:border-[#034751] hover:bg-[#034751]/10 hover:text-[#034751]"
    >
      <Icon className="h-3.5 w-3.5" />
    </button>
  );
}

function SectionCard({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <section className={cn("rounded-xl border border-neutral-200 bg-white shadow-[0_1px_3px_rgba(0,0,0,0.06)]", className)}>
      {children}
    </section>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// 1 · Summary stat tiles (left rail)
// ─────────────────────────────────────────────────────────────────────────────
function StatTile({ value, label, active, dot }: { value: number; label: string; active?: boolean; dot?: boolean }) {
  return (
    <button
      className={cn(
        "relative w-full rounded-xl border p-3.5 text-left transition-all hover:shadow-card",
        active ? "border-[#034751]/40 bg-[#034751]/[0.06]" : "border-neutral-200 bg-white hover:border-[#034751]/40"
      )}
    >
      {dot && <span className="absolute right-3 top-3 h-2 w-2 rounded-full bg-red-500" />}
      <div className="pr-4 text-[12px] font-medium leading-snug text-neutral-600">{label}</div>
      <div className={cn("mt-1.5 text-[26px] font-bold leading-none tnum", active ? "text-[#034751]" : "text-neutral-900")}>{value}</div>
    </button>
  );
}

function StatColumn() {
  const { t } = useLang();
  return (
    <div className="space-y-3">
      <StatTile value={apptStats.scheduled} label={t("dash.stat.scheduled")} active />
      <StatTile value={apptStats.newBooking} label={t("dash.stat.newBooking")} dot />
      <StatTile value={apptStats.clientComm} label={t("dash.stat.clientComm")} dot />
      <StatTile value={apptStats.waitingToPay} label={t("dash.stat.waitingPay")} />
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// 1b · Today's Appointments (scheduled preview)
// ─────────────────────────────────────────────────────────────────────────────
const APPT_STATUS_META: Record<TodayApptStatus, { key: string; bg: string; fg: string }> = {
  "not-arrived": { key: "dash.appt.notArrived", bg: "#9CA3AF", fg: "#FFFFFF" },
  arrived: { key: "dash.appt.arrivedS", bg: "#4ABA7A", fg: "#FFFFFF" },
  "in-consult": { key: "dash.appt.inConsultS", bg: "#034751", fg: "#FFFFFF" },
  completed: { key: "dash.appt.completedS", bg: "#E5E5E5", fg: "#525252" },
};

function ApptField({ label, value, valueClass }: { label: string; value: string; valueClass?: string }) {
  return (
    <div className="flex gap-1.5">
      <dt className="shrink-0 font-bold text-neutral-800">{label}:</dt>
      <dd className={cn("min-w-0", valueClass ?? "text-neutral-600")}>{value}</dd>
    </div>
  );
}

function ApptRow({ a, onOpen }: { a: TodayAppt; onOpen: () => void }) {
  const { t } = useLang();
  const m = APPT_STATUS_META[a.status];
  return (
    <div className="rounded-xl border border-neutral-200 bg-white p-4 transition-shadow hover:shadow-card">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <button onClick={onOpen} className="font-display text-[18px] font-bold leading-none text-[#034751] hover:underline">{a.name}</button>
          <dl className="mt-2 space-y-1 text-[13px] leading-snug">
            <ApptField label={t("dash.appt.breed")} value={a.breed} />
            <ApptField label={t("dash.appt.client")} value={a.client} valueClass="font-medium text-[#034751]" />
            <ApptField label={t("dash.appt.mobile")} value={a.mobile} />
            <ApptField label={t("dash.appt.vet")} value={a.vet} />
            <ApptField label={t("dash.appt.reason")} value={a.reason} />
            {a.notes && <ApptField label={t("dash.appt.notes")} value={a.notes} />}
          </dl>
        </div>
        <div className="shrink-0 text-right">
          <span className="inline-block rounded-md px-2.5 py-1 text-[11px] font-bold" style={{ background: m.bg, color: m.fg }}>{t(m.key)}</span>
          <div className="mt-2 text-[22px] font-bold tnum text-neutral-400">{a.time}</div>
        </div>
      </div>
    </div>
  );
}

function TodaysApptsCard({ onOpen }: { onOpen: (a: TodayAppt) => void }) {
  const { t } = useLang();
  return (
    <SectionCard className="flex flex-col">
      <div className="flex items-center justify-between border-b border-neutral-100 px-4 py-3">
        <h2 className="font-display text-[15px] font-bold text-neutral-900">{t("dash.todaysAppts")}</h2>
        <button className="inline-flex items-center gap-0.5 text-[13px] font-semibold text-[#034751] hover:underline">
          {t("dash.viewAll")} <ChevronRight className="h-4 w-4" />
        </button>
      </div>
      <div className="max-h-[460px] space-y-3 overflow-y-auto p-4">
        {todayAppointments.map((a) => (
          <ApptRow key={a.id} a={a} onOpen={() => onOpen(a)} />
        ))}
      </div>
    </SectionCard>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// 2 · Live Queue (outpatient)
// ─────────────────────────────────────────────────────────────────────────────
const STATUS_ORDER: Record<QueueStatus, number> = { "In Progress": 0, Arrived: 1, Completed: 2 };

function PatientCard({ p, onOpen }: { p: QueuePatient; onOpen: (p: QueuePatient) => void }) {
  const { t } = useLang();
  const waitHot = p.waitMins > 30;
  const completed = p.status === "Completed";
  const pendingEstimate = p.estimateStatus === "pending";

  return (
    <div className={cn("group rounded-xl border border-neutral-200 bg-white p-4 transition-shadow hover:shadow-card", completed && "opacity-70")}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <button onClick={() => onOpen(p)} className="font-display text-[17px] font-bold leading-none text-neutral-900 transition-colors hover:text-[#034751]">
              {p.name}
            </button>
            <TypeBadge variant="outpatient" />
          </div>
          <div className="mt-1 text-[13px] text-neutral-500">{p.breed} · {p.age}</div>
        </div>
        <StatusBadge status={p.status} t={t} />
      </div>

      <div className="mt-2.5 grid grid-cols-2 gap-x-4 gap-y-1.5">
        <Meta icon={User}>{p.owner}</Meta>
        <Meta icon={Phone}>{p.phone}</Meta>
        <Meta icon={Stethoscope}>{p.vet}</Meta>
        <Meta icon={MapPin}>{p.room}</Meta>
      </div>

      <div className="mt-2 flex items-start gap-1.5 text-[13px]">
        <Activity className="mt-0.5 h-3.5 w-3.5 shrink-0 text-neutral-400" />
        <span className="text-neutral-500">{t("dash.reason")}:&nbsp;<span className="font-medium text-neutral-800">{p.reason}</span></span>
      </div>

      {(p.alerts.length > 0 || pendingEstimate) && (
        <div className="mt-3 flex flex-wrap items-center gap-1.5">
          <AlertChips alerts={p.alerts} />
          {pendingEstimate && (
            <span className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold" style={{ background: "#FFF1E6", color: "#C2410C" }}>
              <CircleDollarSign className="h-3 w-3" />
              {t("dash.estimate.pending")}
            </span>
          )}
        </div>
      )}

      <div className="mt-3 flex items-center justify-between border-t border-neutral-100 pt-2.5">
        <span className="flex items-center gap-1.5 text-[13px] font-medium" style={{ color: waitHot ? "#034751" : "#737373" }}>
          <Clock className="h-3.5 w-3.5" />
          {p.checkinTime} · {t("dash.waited")} {p.waitMins} {t("dash.min")}
        </span>
        <div className="flex items-center gap-1 opacity-50 transition-opacity duration-200 group-hover:opacity-100">
          <ActionIcon icon={FileText} label={t("dash.viewRecord")} onClick={() => onOpen(p)} />
          <ActionIcon icon={MessageCircle} label={t("dash.contact")} />
          <ActionIcon icon={History} label={t("dash.historyAct")} />
        </div>
      </div>
    </div>
  );
}

// merged queue: outpatient + in-patients in 3 kanban lanes
type Stage = "arrived" | "inprogress" | "completed";
const LANE_META: { id: Stage; key: string; color: string }[] = [
  { id: "arrived", key: "dash.queueArrived", color: "#4ABA7A" },
  { id: "inprogress", key: "dash.queueInProgress", color: "#034751" },
  { id: "completed", key: "dash.queueCompleted", color: "#9CA3AF" },
];

function OutCard({ p, onOpen }: { p: QueuePatient; onOpen: (p: QueuePatient) => void }) {
  const { t } = useLang();
  const navigate = useNavigate();
  const waitHot = p.waitMins > 30;
  const pending = p.estimateStatus === "pending";
  const dim = p.status === "Completed" && p.estimateStatus !== "pending";

  let ctaLabel = "";
  let ctaStyle = "";
  let ctaAction = (e: React.MouseEvent) => {};

  if (p.status === "Arrived") {
    ctaLabel = t("dash.cta.start_consult");
    ctaStyle = "bg-[#034751] hover:bg-[#034751]/95 text-white";
    ctaAction = (e) => {
      e.stopPropagation();
      if (p.consultId) navigate(`/consultations/${p.consultId}`);
      else alert(`Start consultation for ${p.name}`);
    };
  } else if (p.status === "In Progress") {
    ctaLabel = t("dash.cta.view_consult");
    ctaStyle = "border border-[#034751] text-[#034751] hover:bg-[#034751]/10 bg-white";
    ctaAction = (e) => {
      e.stopPropagation();
      if (p.consultId) navigate(`/consultations/${p.consultId}`);
      else alert(`View consultation for ${p.name}`);
    };
  } else if (p.status === "Completed") {
    if (p.estimateStatus === "pending") {
      ctaLabel = t("dash.cta.collect_payment");
      ctaStyle = "bg-[#D97706] hover:bg-[#B45309] text-white";
      ctaAction = (e) => {
        e.stopPropagation();
        navigate("/billing/payments");
      };
    } else {
      ctaLabel = t("dash.cta.print_rx");
      ctaStyle = "border border-neutral-300 text-neutral-600 hover:bg-neutral-50 bg-white";
      ctaAction = (e) => {
        e.stopPropagation();
        alert(`Print prescription for ${p.name}`);
      };
    }
  }

  return (
    <div
      onClick={() => onOpen(p)}
      className={cn(
        "group block w-full cursor-pointer rounded-xl border border-neutral-200 bg-white p-3 text-left transition-all hover:border-[#034751]/30 hover:shadow-card",
        dim && "opacity-75"
      )}
    >
      <div className="flex items-center justify-between gap-2">
        <span className="truncate font-display text-[15px] font-bold text-neutral-900 group-hover:text-[#034751] transition-colors">{p.name}</span>
        <TypeBadge variant="outpatient" />
      </div>
      <div className="mt-0.5 truncate text-[12px] text-neutral-500">{p.breed} · {p.age}</div>
      <div className="mt-1.5 space-y-1">
        <Meta icon={Stethoscope}>{p.vet}</Meta>
        <Meta icon={MapPin}>{p.room}</Meta>
      </div>
      {(p.alerts.length > 0 || pending) && (
        <div className="mt-2 flex flex-wrap items-center gap-1">
          <AlertChips alerts={p.alerts} />
          {pending && (
            <span className="inline-flex items-center gap-1 rounded-full px-1.5 py-0.5 text-[10px] font-semibold" style={{ background: "#FFF1E6", color: "#C2410C" }}>
              <CircleDollarSign className="h-2.5 w-2.5" />{t("dash.estimate.pending")}
            </span>
          )}
        </div>
      )}
      
      <div className="mt-3.5 flex flex-col gap-2 border-t border-neutral-100 pt-2.5">
        <div className="flex items-center gap-1.5 text-[11px] font-medium" style={{ color: waitHot ? "#B91C1C" : "#737373" }}>
          <Clock className="h-3.5 w-3.5" />
          <span>{p.checkinTime} · {t("dash.waited")} {p.waitMins} {t("dash.min")}</span>
        </div>
        
        {ctaLabel && (
          <button
            onClick={ctaAction}
            className={cn(
              "w-full rounded-lg py-1.5 text-[12px] font-bold transition-all shadow-sm flex items-center justify-center gap-1.5",
              ctaStyle
            )}
          >
            {ctaLabel}
          </button>
        )}
      </div>
    </div>
  );
}

function InCard({ p, onOpen }: { p: Inpatient; onOpen: (p: Inpatient) => void }) {
  const { t } = useLang();
  const navigate = useNavigate();
  const s = p.inpatientStatus || "monitoring";

  let ctaLabel = "";
  let ctaStyle = "";
  let ctaAction = (e: React.MouseEvent) => {};

  if (s === "monitoring") {
    ctaLabel = t("dash.cta.record_vitals");
    ctaStyle = "border border-[#785AA6] text-[#785AA6] hover:bg-[#785AA6]/10 bg-white";
    ctaAction = (e) => {
      e.stopPropagation();
      alert(`Record vitals for ${p.name}`);
    };
  } else if (s === "procedure") {
    ctaLabel = t("dash.cta.sign_consent");
    ctaStyle = "bg-[#785AA6] hover:bg-[#6B21A8] text-white";
    ctaAction = (e) => {
      e.stopPropagation();
      alert(`Collect surgery consent signature for ${p.name}`);
    };
  } else if (s === "discharge") {
    ctaLabel = t("dash.cta.discharge");
    ctaStyle = "bg-[#10B981] hover:bg-[#059669] text-white";
    ctaAction = (e) => {
      e.stopPropagation();
      alert(`Process discharge for ${p.name}`);
    };
  }

  return (
    <div
      onClick={() => onOpen(p)}
      className="group block w-full cursor-pointer rounded-xl border border-neutral-200 border-l-[3px] bg-white p-3 text-left transition-all hover:border-[#785AA6]/30 hover:shadow-card"
      style={{ borderLeftColor: "#785AA6" }}
    >
      <div className="flex items-center justify-between gap-2">
        <span className="truncate font-display text-[15px] font-bold text-neutral-900 group-hover:text-[#785AA6] transition-colors">{p.name}</span>
        <TypeBadge variant="inpatient" />
      </div>
      <div className="mt-0.5 truncate text-[12px] text-neutral-500">{p.breed} · {p.age}</div>
      <div className="mt-1.5 space-y-1">
        <Meta icon={Stethoscope}>{p.vet}</Meta>
        <Meta icon={BedDouble}>{p.ward}</Meta>
      </div>
      {p.alerts.length > 0 && <div className="mt-2 flex flex-wrap items-center gap-1"><AlertChips alerts={p.alerts} /></div>}
      
      <div className="mt-3.5 flex flex-col gap-2 border-t border-neutral-100 pt-2.5">
        <div className="flex items-center gap-1.5 text-[11px] font-medium" style={{ color: "#6B21A8" }}>
          <Clock className="h-3.5 w-3.5" />
          <span>{t("dash.admitted")} {p.admitDate} · {p.daysAgo} {t("dash.day")}</span>
        </div>
        
        {ctaLabel && (
          <button
            onClick={ctaAction}
            className={cn(
              "w-full rounded-lg py-1.5 text-[12px] font-bold transition-all shadow-sm flex items-center justify-center gap-1.5",
              ctaStyle
            )}
          >
            {ctaLabel}
          </button>
        )}
      </div>
    </div>
  );
}

function MergedQueue({ onOpenOut, onOpenIn }: { onOpenOut: (p: QueuePatient) => void; onOpenIn: (p: Inpatient) => void }) {
  const { t } = useLang();

  // Outpatient lanes mapping
  const outpatientLanes = useMemo(() => {
    const o = { arrived: [] as QueuePatient[], inprogress: [] as QueuePatient[], completed: [] as QueuePatient[], waiting_pay: [] as QueuePatient[] };
    for (const p of liveQueue) {
      if (p.status === "Arrived") {
        o.arrived.push(p);
      } else if (p.status === "In Progress") {
        o.inprogress.push(p);
      } else if (p.status === "Completed") {
        if (p.estimateStatus === "pending") {
          o.waiting_pay.push(p);
        } else {
          o.completed.push(p);
        }
      }
    }
    return o;
  }, []);

  // Inpatient lanes mapping
  const inpatientLanes = useMemo(() => {
    const o = { monitoring: [] as Inpatient[], procedure: [] as Inpatient[], discharge: [] as Inpatient[] };
    for (const p of inpatients) {
      const s = p.inpatientStatus || "monitoring";
      o[s].push(p);
    }
    return o;
  }, []);

  return (
    <div className="space-y-6">
      {/* 1. OUTPATIENT KANBAN BOARD */}
      <SectionCard>
        {/* Header */}
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-neutral-100 px-4 py-3 bg-neutral-50/50 rounded-t-xl">
          <div className="flex items-center gap-2">
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#034751]/10 text-[#034751]">
              <PawPrint className="h-4 w-4" />
            </span>
            <h2 className="font-display text-[15px] font-bold text-neutral-900">{t("dash.outpatientQueue")}</h2>
            <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-[#034751]/10 px-1.5 text-[11px] font-bold text-[#034751]">
              {liveQueue.length}
            </span>
          </div>
          <span className="text-[11px] italic text-neutral-400">{t("dash.updatedAt")} {NOW_TIME}</span>
        </div>

        {/* Board content */}
        <div className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
            {([
              { id: "arrived", key: "dash.lane.arrived", color: "#F59E0B" },
              { id: "inprogress", key: "dash.lane.inprogress", color: "#034751" },
              { id: "completed", key: "dash.lane.completed", color: "#10B981" },
              { id: "waiting_pay", key: "dash.lane.waiting_pay", color: "#8B5CF6" },
            ] as const).map((lane) => {
              const items = outpatientLanes[lane.id];
              return (
                <div key={lane.id} className="flex min-h-0 flex-col rounded-xl border border-neutral-200 bg-neutral-50/50">
                  <div className="flex items-center justify-between border-b border-neutral-200 px-3 py-2 bg-white rounded-t-xl">
                    <span className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wide" style={{ color: lane.color }}>
                      <span className="h-1.5 w-1.5 rounded-full" style={{ background: lane.color }} />
                      {t(lane.key)}
                    </span>
                    <span className="flex h-4 min-w-4 items-center justify-center rounded-full bg-neutral-100 px-1 text-[10px] font-bold text-neutral-500">{items.length}</span>
                  </div>
                  <div className="flex-1 space-y-2.5 overflow-y-auto p-2.5" style={{ maxHeight: 600, minHeight: 180 }}>
                    {items.length === 0 ? (
                      <p className="py-10 text-center text-[11px] text-neutral-300 italic">— Empty —</p>
                    ) : (
                      items.map((p) => <OutCard key={p.id} p={p} onOpen={onOpenOut} />)
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </SectionCard>

      {/* 2. INPATIENT KANBAN BOARD */}
      <SectionCard>
        {/* Header */}
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-neutral-100 px-4 py-3 bg-neutral-50/50 rounded-t-xl">
          <div className="flex items-center gap-2">
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#785AA6]/10 text-[#785AA6]">
              <BedDouble className="h-4 w-4" />
            </span>
            <h2 className="font-display text-[15px] font-bold text-neutral-900">{t("dash.inpatientQueue")}</h2>
            <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-[#785AA6]/10 px-1.5 text-[11px] font-bold text-[#785AA6]">
              {inpatients.length}
            </span>
          </div>
          <span className="text-[11px] italic text-neutral-400">{t("dash.updatedAt")} {NOW_TIME}</span>
        </div>

        {/* Board content */}
        <div className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {([
              { id: "monitoring", key: "dash.lane.monitoring", color: "#785AA6" },
              { id: "procedure", key: "dash.lane.procedure", color: "#F59E0B" },
              { id: "discharge", key: "dash.lane.discharge", color: "#10B981" },
            ] as const).map((lane) => {
              const items = inpatientLanes[lane.id];
              return (
                <div key={lane.id} className="flex min-h-0 flex-col rounded-xl border border-neutral-200 bg-neutral-50/50">
                  <div className="flex items-center justify-between border-b border-neutral-200 px-3 py-2 bg-white rounded-t-xl">
                    <span className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wide" style={{ color: lane.color }}>
                      <span className="h-1.5 w-1.5 rounded-full" style={{ background: lane.color }} />
                      {t(lane.key)}
                    </span>
                    <span className="flex h-4 min-w-4 items-center justify-center rounded-full bg-neutral-100 px-1 text-[10px] font-bold text-neutral-500">{items.length}</span>
                  </div>
                  <div className="flex-1 space-y-2.5 overflow-y-auto p-2.5" style={{ maxHeight: 600, minHeight: 180 }}>
                    {items.length === 0 ? (
                      <p className="py-10 text-center text-[11px] text-neutral-300 italic">— Empty —</p>
                    ) : (
                      items.map((p) => <InCard key={p.id} p={p} onOpen={onOpenIn} />)
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </SectionCard>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// 3 · Inpatient section (collapsible)
// ─────────────────────────────────────────────────────────────────────────────
function InpatientCard({ p, onOpen }: { p: Inpatient; onOpen: (p: Inpatient) => void }) {
  const { t } = useLang();
  return (
    <div className="group rounded-xl border-l-[3px] border border-neutral-200 bg-white p-4 transition-shadow hover:shadow-card" style={{ borderLeftColor: "#785AA6" }}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <button onClick={() => onOpen(p)} className="font-display text-[17px] font-bold leading-none text-neutral-900 transition-colors hover:text-[#785AA6]">
              {p.name}
            </button>
            <TypeBadge variant="inpatient" />
          </div>
          <div className="mt-1 text-[13px] text-neutral-500">{p.breed} · {p.age}</div>
        </div>
        <span className="shrink-0 rounded-md px-2 py-1 text-[11px] font-semibold" style={{ background: "#F3E8FF", color: "#6B21A8" }}>
          {t("dash.admitted")} {p.admitDate} · {p.daysAgo} {t("dash.day")}
        </span>
      </div>

      <div className="mt-2.5 grid grid-cols-2 gap-x-4 gap-y-1.5">
        <Meta icon={User}>{p.owner}</Meta>
        <Meta icon={Stethoscope}>{p.vet}</Meta>
        <Meta icon={Activity}>{p.diagnosis}</Meta>
        <Meta icon={BedDouble}>{p.ward}</Meta>
      </div>

      <div className="mt-2 rounded-lg bg-neutral-50 px-3 py-2 text-[13px] text-neutral-600">
        <span className="text-neutral-400">{t("dash.statusNote")}:</span> {p.statusNote}
      </div>

      <div className="mt-3 flex items-center justify-between border-t border-neutral-100 pt-2.5">
        <span className="text-[13px] font-medium" style={{ color: p.estimateStatus === "pending" ? "#C2410C" : "#1B804C" }}>
          {p.estimateStatus === "deposit_paid"
            ? `${t("dash.deposit")}: ${(p.depositAmount ?? 0).toLocaleString("vi-VN")}đ`
            : p.estimateStatus === "pending"
            ? t("dash.estimate.pending")
            : t("dash.estimate.approved")}
        </span>
        <div className="flex items-center gap-1 opacity-50 transition-opacity duration-200 group-hover:opacity-100">
          <ActionIcon icon={FileText} label={t("dash.viewRecord")} onClick={() => onOpen(p)} />
          <ActionIcon icon={MessageCircle} label={t("dash.contact")} />
        </div>
      </div>
    </div>
  );
}

function InpatientSection({ onOpen }: { onOpen: (p: Inpatient) => void }) {
  const { t } = useLang();
  const [open, setOpen] = useState(true);
  if (inpatients.length === 0) return null;
  const visible = inpatients.slice(0, 3);

  return (
    <SectionCard>
      <button onClick={() => setOpen((o) => !o)} className="flex w-full items-center justify-between gap-2 px-4 py-3 text-left">
        <div className="flex items-center gap-2">
          <span className="flex h-7 w-7 items-center justify-center rounded-lg" style={{ background: "#F3E8FF", color: "#785AA6" }}>
            <BedDouble className="h-4 w-4" />
          </span>
          <h2 className="font-display text-[15px] font-bold text-neutral-900">{t("dash.inpatientNow")}</h2>
          <span className="flex h-5 min-w-5 items-center justify-center rounded-full px-1.5 text-[11px] font-bold" style={{ background: "#785AA6", color: "#fff" }}>
            {inpatients.length}
          </span>
        </div>
        <ChevronDown className={cn("h-4 w-4 text-neutral-400 transition-transform duration-200", !open && "-rotate-90")} />
      </button>

      <div className={cn("grid transition-[grid-template-rows] duration-200 ease-out", open ? "grid-rows-[1fr]" : "grid-rows-[0fr]")}>
        <div className="overflow-hidden">
          <div className="space-y-3 px-4 pb-4">
            {visible.map((p) => (
              <InpatientCard key={p.id} p={p} onOpen={onOpen} />
            ))}
            {inpatients.length > visible.length && (
              <button className="w-full rounded-lg border border-dashed border-neutral-200 py-2 text-[13px] font-medium text-[#785AA6] transition-colors hover:bg-[#785AA6]/5">
                {t("dash.viewAllInpatient")} ({inpatients.length})
              </button>
            )}
          </div>
        </div>
      </div>
    </SectionCard>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// 4 · Tasks panel
// ─────────────────────────────────────────────────────────────────────────────
function parseDue(due: string): Date {
  const [d, time] = due.split(" ");
  const [y, m, day] = d.split("-").map(Number);
  const [hh, mm] = time.split(":").map(Number);
  return new Date(y, m - 1, day, hh, mm);
}

function TaskRow({ task, onComplete }: { task: Task; onComplete: (id: number) => void }) {
  const { t } = useLang();
  const [checked, setChecked] = useState(false);
  const due = parseDue(task.due);
  const overdue = due < NOW;
  const overdueDays = Math.floor((NOW.getTime() - due.getTime()) / 86_400_000);
  const pr = PRIORITY_META[task.priority];

  function handleCheck() {
    setChecked(true);
    setTimeout(() => onComplete(task.id), 320);
  }

  return (
    <div
      className={cn(
        "overflow-hidden transition-all duration-300",
        checked ? "max-h-0 -translate-x-3 scale-95 opacity-0" : "max-h-40 opacity-100"
      )}
    >
      <div
        className={cn("flex gap-3 rounded-xl border p-3", overdue ? "border-red-200" : "border-neutral-200")}
        style={overdue ? { background: "#FEE2E2" } : undefined}
      >
        <button
          onClick={handleCheck}
          aria-label="Complete task"
          className={cn(
            "mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-md border-2 transition-colors",
            checked ? "border-[#034751] bg-[#034751] text-white" : "border-neutral-300 hover:border-[#034751]"
          )}
        >
          {checked && <Check className="h-3.5 w-3.5" />}
        </button>

        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <p className="text-[13px] font-medium leading-snug text-neutral-800">{task.text}</p>
            <span className="mt-0.5 flex shrink-0 items-center gap-1 text-[11px] font-semibold" style={{ color: pr.dot }}>
              <span className="h-2 w-2 rounded-full" style={{ background: pr.dot }} />
              {t(pr.key)}
            </span>
          </div>
          <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-neutral-500">
            {overdue ? (
              <span className="flex items-center gap-1 font-bold text-red-600">
                <AlertTriangle className="h-3 w-3" />
                {t("dash.overdueBy")} {overdueDays >= 1 ? `${overdueDays} ${t("dash.day")}` : ""}
              </span>
            ) : (
              <span className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                {task.due.slice(5).replace("-", "/").replace(" ", " · ")}
              </span>
            )}
            {task.patient && (
              <button className="flex items-center gap-1 text-[#034751] hover:underline">
                <PawPrint className="h-3 w-3" />
                {task.patient}
              </button>
            )}
          </div>
        </div>
      </div>
      <div className="h-3" />
    </div>
  );
}

function TasksPanel() {
  const { t } = useLang();
  const [list, setList] = useState<Task[]>(() =>
    [...TASKS].sort((a, b) => {
      const ao = parseDue(a.due) < NOW ? 0 : 1;
      const bo = parseDue(b.due) < NOW ? 0 : 1;
      if (ao !== bo) return ao - bo;
      const rank = { high: 0, medium: 1, low: 2 } as const;
      if (rank[a.priority] !== rank[b.priority]) return rank[a.priority] - rank[b.priority];
      return parseDue(a.due).getTime() - parseDue(b.due).getTime();
    })
  );

  return (
    <SectionCard>
      <div className="flex items-center justify-between gap-2 border-b border-neutral-100 px-4 py-3">
        <div className="flex items-center gap-2">
          <h2 className="font-display text-[15px] font-bold text-neutral-900">{t("dash.tasks")}</h2>
          <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-[#034751]/10 px-1.5 text-[11px] font-bold text-[#034751]">
            {list.length}
          </span>
        </div>
        <button className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#034751] text-white transition-transform hover:scale-105" aria-label="New task">
          <Plus className="h-4 w-4" />
        </button>
      </div>

      {list.length === 0 ? (
        <EmptyState icon={CheckCircle2} text={t("dash.emptyTasks")} accent="#4ABA7A" />
      ) : (
        <div className="max-h-[300px] overflow-y-auto px-4 pt-3">
          {list.map((task) => (
            <TaskRow key={task.id} task={task} onComplete={(id) => setList((l) => l.filter((x) => x.id !== id))} />
          ))}
        </div>
      )}
    </SectionCard>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// 5 · Notepad
// ─────────────────────────────────────────────────────────────────────────────
function Notepad() {
  const { t } = useLang();
  const [text, setText] = useState<string>(() => {
    try { return localStorage.getItem("gopet.note.text") ?? ""; } catch { return ""; }
  });
  const [colorIdx, setColorIdx] = useState<number>(() => {
    try { return Number(localStorage.getItem("gopet.note.color") ?? "4"); } catch { return 4; }
  });
  const [pickerOpen, setPickerOpen] = useState(false);
  const [savedAt, setSavedAt] = useState<string | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout>>();

  const color = notepadColors[colorIdx];

  // auto-save 2s after typing stops
  useEffect(() => {
    clearTimeout(timer.current);
    timer.current = setTimeout(() => {
      try {
        localStorage.setItem("gopet.note.text", text);
        localStorage.setItem("gopet.note.color", String(colorIdx));
      } catch { /* ignore */ }
      setSavedAt(NOW_TIME);
    }, 2000);
    return () => clearTimeout(timer.current);
  }, [text, colorIdx]);

  return (
    <SectionCard className="flex flex-col">
      <div className="flex items-center justify-between gap-2 border-b border-neutral-100 px-4 py-3">
        <h2 className="font-display text-[15px] font-bold text-neutral-900">{t("dash.notepad")}</h2>
        <div className="relative">
          <button
            onClick={() => setPickerOpen((o) => !o)}
            aria-label="Change note color"
            className="flex h-7 w-7 items-center justify-center rounded-lg border border-neutral-200 text-neutral-500 transition-colors hover:bg-neutral-50 hover:text-[#034751]"
          >
            <Palette className="h-4 w-4" />
          </button>
          {pickerOpen && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setPickerOpen(false)} />
              <div className="absolute right-0 top-9 z-20 flex flex-wrap gap-2 rounded-xl border border-neutral-200 bg-white p-2.5 shadow-lift" style={{ width: 132 }}>
                {notepadColors.map((c, i) => (
                  <button
                    key={c.hex}
                    title={c.name}
                    onClick={() => { setColorIdx(i); setPickerOpen(false); }}
                    className="flex h-7 w-7 items-center justify-center rounded-md transition-transform hover:scale-110"
                    style={{ background: c.hex, boxShadow: i === colorIdx ? "0 0 0 2px #034751" : "inset 0 0 0 1px rgba(0,0,0,0.08)" }}
                  >
                    {i === colorIdx && <Check className="h-3.5 w-3.5" style={{ color: c.dark ? "#fff" : "#191932" }} />}
                  </button>
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      <div className="p-2.5" style={{ background: color.hex, transition: "background-color 0.2s ease" }}>
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Your notes — only you can see them"
          className="h-[200px] w-full resize-none border-0 bg-transparent p-2 text-sm leading-relaxed outline-none placeholder:opacity-50"
          style={{ color: color.dark ? "#FFFFFF" : "#191932" }}
        />
      </div>
      <div
        className="px-4 py-2 text-[11px] italic"
        style={{ color: color.dark ? "rgba(255,255,255,0.6)" : "#9CA3AF", background: color.hex, transition: "background-color 0.2s ease" }}
      >
        {savedAt ? `${t("dash.savedAt")} ${savedAt}` : "—"}
      </div>
    </SectionCard>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Empty state
// ─────────────────────────────────────────────────────────────────────────────
function EmptyState({ icon: Icon, text, accent = "#9CA3AF" }: { icon: typeof Inbox; text: string; accent?: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 px-4 py-12 text-center">
      <span className="flex h-12 w-12 items-center justify-center rounded-full" style={{ background: `${accent}1A`, color: accent }}>
        <Icon className="h-6 w-6" />
      </span>
      <p className="text-[13px] text-neutral-500">{text}</p>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Patient detail drawer (P1)
// ─────────────────────────────────────────────────────────────────────────────
type AnyPatient = (QueuePatient & { kind: "out" }) | (Inpatient & { kind: "in" });

function PatientDrawer({ patient, onClose }: { patient: AnyPatient | null; onClose: () => void }) {
  const { t } = useLang();
  const open = patient !== null;

  return (
    <Sheet open={open} onOpenChange={(o) => !o && onClose()}>
      <SheetContent className="w-[380px] sm:max-w-[380px]">
        {patient && (
          <>
            <SheetHeader>
              <div className="flex items-center gap-3">
                <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#034751]/10 text-[#034751]">
                  <PawPrint className="h-6 w-6" />
                </span>
                <div className="min-w-0">
                  <SheetTitle>{patient.name}</SheetTitle>
                  <p className="text-[13px] text-neutral-500">{patient.breed} · {patient.age}</p>
                </div>
                <span className="ml-auto"><TypeBadge variant={patient.kind === "in" ? "inpatient" : "outpatient"} /></span>
              </div>
            </SheetHeader>

            <div className="flex-1 space-y-4 overflow-y-auto p-5">
              <DrawerField icon={User} label="Owner" value={patient.owner} />
              <DrawerField icon={Phone} label="Phone" value={patient.phone} />
              <DrawerField icon={Stethoscope} label={t("dash.vet")} value={patient.vet} />
              {patient.kind === "out" ? (
                <DrawerField icon={Activity} label={t("dash.reason")} value={patient.reason} />
              ) : (
                <DrawerField icon={Activity} label={t("dash.diagnosis")} value={patient.diagnosis} />
              )}

              {patient.alerts.length > 0 && (
                <div>
                  <div className="mb-1.5 text-[11px] font-bold uppercase tracking-wide text-neutral-400">Clinical alerts</div>
                  <div className="flex flex-wrap gap-1.5"><AlertChips alerts={patient.alerts} /></div>
                </div>
              )}

              <div>
                <div className="mb-1.5 text-[11px] font-bold uppercase tracking-wide text-neutral-400">{t("dash.recentVisits")}</div>
                <ul className="space-y-1.5 text-[13px] text-neutral-600">
                  <li className="flex items-center gap-2"><span className="h-1.5 w-1.5 rounded-full bg-neutral-300" />02/06/2026 · Routine vaccination</li>
                  <li className="flex items-center gap-2"><span className="h-1.5 w-1.5 rounded-full bg-neutral-300" />18/05/2026 · General checkup</li>
                  <li className="flex items-center gap-2"><span className="h-1.5 w-1.5 rounded-full bg-neutral-300" />10/04/2026 · Blood test</li>
                </ul>
              </div>
            </div>

            <SheetFooter>
              <Button className="w-full gap-2"><FileText className="h-4 w-4" />{t("dash.openProfile")}</Button>
            </SheetFooter>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}

function DrawerField({ icon: Icon, label, value }: { icon: typeof User; label: string; value: string }) {
  return (
    <div className="flex items-start gap-3">
      <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-neutral-100 text-neutral-500">
        <Icon className="h-3.5 w-3.5" />
      </span>
      <div className="min-w-0">
        <div className="text-[11px] font-medium uppercase tracking-wide text-neutral-400">{label}</div>
        <div className="text-[14px] font-medium text-neutral-800">{value}</div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Page
// ─────────────────────────────────────────────────────────────────────────────
export default function DashboardCS() {
  const { t } = useLang();
  const navigate = useNavigate();
  const [drawer, setDrawer] = useState<AnyPatient | null>(null);
  const [offline, setOffline] = useState(false);

  const dateStr = NOW.toLocaleDateString("vi-VN", { weekday: "long", day: "2-digit", month: "2-digit", year: "numeric" });

  return (
    <div className="h-full overflow-y-auto bg-white">
      {offline && (
        <div className="flex items-center justify-center gap-2 bg-warning-soft px-4 py-2 text-[13px] font-medium text-warning-foreground">
          <WifiOff className="h-4 w-4" />
          {t("dash.offline")}
          <button onClick={() => setOffline(false)} className="ml-2 rounded p-0.5 hover:bg-black/5"><X className="h-3.5 w-3.5" /></button>
        </div>
      )}

      <div className="mx-auto max-w-[1600px] p-6">
        {/* Page header */}
        <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
          <div>
            <h1 className="font-display text-[26px] font-bold leading-tight tracking-tight text-neutral-900">{t("nav.dashboard")}</h1>
            <p className="mt-0.5 text-sm text-neutral-500">{t("dash.subtitle")}</p>
          </div>
          <div className="text-right">
            <div className="text-[13px] font-semibold capitalize text-neutral-700">{dateStr}</div>
            <div className="text-[11px] text-neutral-400">{t("dash.updatedAt")} {NOW_TIME}</div>
          </div>
        </div>

        {/* Workspace — main area (stats + appointments → live queue → in-patients) + right rail */}
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-[1fr_360px]">
          <div className="space-y-5">
            {/* top row: stat rail + today's appointments */}
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-[180px_1fr]">
              <StatColumn />
              <TodaysApptsCard onOpen={(a) => a.consultId && navigate(`/consultations/${a.consultId}`)} />
            </div>
            <MergedQueue onOpenOut={(p) => setDrawer({ ...p, kind: "out" })} onOpenIn={(p) => setDrawer({ ...p, kind: "in" })} />
          </div>
          <div className="space-y-5">
            <TasksPanel />
            <Notepad />
          </div>
        </div>
      </div>

      <PatientDrawer patient={drawer} onClose={() => setDrawer(null)} />
    </div>
  );
}
