import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  CalendarRange,
  Activity,
  CheckCircle2,
  Timer,
  Search,
  Plus,
  PawPrint,
  Cat,
  ChevronRight,
  AlertCircle,
  MoreHorizontal,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useLang } from "@/lib/i18n";
import {
  consultations,
  consultKpis,
  statusCounts,
  STATUS_META,
  type ConsultStatus,
  type ConsultRow,
} from "@/lib/consultation-data";

// ── shared bits ───────────────────────────────────────────────────────────────
export function PatientAvatar({ species, size = 36 }: { species: "dog" | "cat"; size?: number }) {
  const dog = species === "dog";
  const Icon = dog ? PawPrint : Cat;
  return (
    <span
      className="flex shrink-0 items-center justify-center rounded-lg"
      style={{
        width: size,
        height: size,
        background: dog ? "rgba(3,71,81,0.10)" : "rgba(120,90,166,0.12)",
        color: dog ? "#034751" : "#785AA6",
      }}
    >
      <Icon style={{ width: size * 0.5, height: size * 0.5 }} />
    </span>
  );
}

export function StatusPill({ status, t }: { status: ConsultStatus; t: (k: string) => string }) {
  const m = STATUS_META[status];
  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide"
      style={{ background: m.bg, color: m.fg }}
    >
      {m.dot && <span className="h-1.5 w-1.5 animate-pulse rounded-full" style={{ background: m.fg }} />}
      {t(m.key)}
    </span>
  );
}

function Kpi({ icon: Icon, value, label, accent }: { icon: typeof Activity; value: string | number; label: string; accent?: boolean }) {
  return (
    <div className="flex items-center gap-3 rounded-xl border border-neutral-200 bg-white p-4">
      <span
        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg"
        style={{ background: accent ? "rgba(74,186,122,0.14)" : "rgba(3,71,81,0.10)", color: accent ? "#1B804C" : "#034751" }}
      >
        <Icon className="h-5 w-5" />
      </span>
      <div className="min-w-0">
        <div className="text-[24px] font-bold leading-none tnum text-neutral-900">{value}</div>
        <div className="mt-1 truncate text-[12px] text-neutral-500">{label}</div>
      </div>
    </div>
  );
}

const FILTERS: ("all" | ConsultStatus)[] = ["all", "in-progress", "arrived", "booked", "completed", "cancelled"];

export default function ConsultationsList({ initialStatus = "all" }: { initialStatus?: "all" | ConsultStatus }) {
  const { t } = useLang();
  const navigate = useNavigate();
  const [active, setActive] = useState<"all" | ConsultStatus>(initialStatus);
  const [query, setQuery] = useState("");

  const kpi = consultKpis();
  const counts = statusCounts();

  const rows = useMemo(() => {
    const q = query.trim().toLowerCase();
    return consultations.filter((c) => {
      if (active !== "all" && c.status !== active) return false;
      if (!q) return true;
      return [c.patient, c.owner, c.vet, c.reason, c.id].some((f) => f.toLowerCase().includes(q));
    });
  }, [active, query]);

  return (
    <div className="h-full overflow-y-auto bg-white">
      <div className="mx-auto max-w-[1440px] p-6">
        {/* Header */}
        <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
          <div>
            <h1 className="font-display text-[26px] font-bold leading-tight tracking-tight text-neutral-900">
              {t("nav.consultations")}
            </h1>
            <p className="mt-0.5 text-sm text-neutral-500">{t("cs.subtitle")}</p>
          </div>
          <button className="inline-flex items-center gap-1.5 rounded-lg bg-[#034751] px-3.5 py-2 text-sm font-semibold text-white transition-colors hover:bg-[#023a42]">
            <Plus className="h-4 w-4" />
            {t("cs.new")}
          </button>
        </div>

        {/* KPI row */}
        <div className="mb-4 grid grid-cols-2 gap-3 xl:grid-cols-4">
          <Kpi icon={CalendarRange} value={kpi.totalWeek} label={t("cs.kpi.week")} />
          <Kpi icon={Activity} value={kpi.inProgress} label={t("cs.kpi.inprogress")} />
          <Kpi icon={CheckCircle2} value={kpi.completedToday} label={t("cs.kpi.completed")} accent />
          <Kpi icon={Timer} value={`${kpi.avg} ${t("dash.min")}`} label={t("cs.kpi.avg")} />
        </div>

        {/* Filter row */}
        <div className="mb-3 flex flex-wrap items-center gap-2">
          <div className="flex flex-wrap items-center gap-1.5">
            {FILTERS.map((f) => {
              const isActive = active === f;
              const count = f === "all" ? counts.all : counts[f] ?? 0;
              const label = f === "all" ? t("cs.f.all") : t(STATUS_META[f].key);
              return (
                <button
                  key={f}
                  onClick={() => setActive(f)}
                  className={cn(
                    "inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-[13px] font-medium transition-colors",
                    isActive
                      ? "border-[#034751] bg-[#034751] text-white"
                      : "border-neutral-200 bg-white text-neutral-600 hover:border-neutral-300 hover:bg-neutral-50"
                  )}
                >
                  {label}
                  <span
                    className={cn(
                      "rounded-full px-1.5 text-[11px] font-bold tnum",
                      isActive ? "bg-white/20 text-white" : "bg-neutral-100 text-neutral-500"
                    )}
                  >
                    {count}
                  </span>
                </button>
              );
            })}
          </div>
          <div className="ml-auto flex items-center gap-2">
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={t("cs.search")}
                className="h-9 w-[260px] rounded-lg border border-neutral-200 bg-white pl-9 pr-3 text-sm text-neutral-800 placeholder:text-neutral-400 focus:border-[#034751] focus:outline-none focus:ring-2 focus:ring-[#034751]/20"
              />
            </div>
            <span className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-neutral-200 bg-white px-3 text-[13px] font-medium text-neutral-600">
              <CalendarRange className="h-4 w-4 text-neutral-400" />
              {t("cs.date")}
            </span>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-hidden rounded-xl border border-neutral-200">
          <table className="w-full border-collapse text-left">
            <thead>
              <tr className="border-b border-neutral-200 bg-neutral-50 text-[11px] font-bold uppercase tracking-wide text-neutral-400">
                <th className="px-4 py-2.5 font-bold">{t("cs.col.id")}</th>
                <th className="px-4 py-2.5 font-bold">{t("cs.col.patient")}</th>
                <th className="px-4 py-2.5 font-bold">{t("cs.col.owner")}</th>
                <th className="px-4 py-2.5 font-bold">{t("cs.col.reason")}</th>
                <th className="px-4 py-2.5 font-bold">{t("cs.col.vet")}</th>
                <th className="px-4 py-2.5 font-bold">{t("cs.col.datetime")}</th>
                <th className="px-4 py-2.5 text-center font-bold">{t("cs.col.duration")}</th>
                <th className="px-4 py-2.5 font-bold">{t("cs.col.status")}</th>
                <th className="px-4 py-2.5" />
              </tr>
            </thead>
            <tbody>
              {rows.map((c) => (
                <Row key={c.id} c={c} t={t} onOpen={() => navigate(`/consultations/${c.id}`)} />
              ))}
              {rows.length === 0 && (
                <tr>
                  <td colSpan={9} className="px-4 py-14 text-center text-sm text-neutral-400">
                    {t("cs.empty")}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function Row({ c, t, onOpen }: { c: ConsultRow; t: (k: string) => string; onOpen: () => void }) {
  const live = c.status === "in-progress";
  return (
    <tr
      onClick={onOpen}
      className="group cursor-pointer border-b border-neutral-100 text-sm transition-colors last:border-0 hover:bg-[#034751]/[0.04]"
    >
      <td className="whitespace-nowrap px-4 py-3 font-mono text-[12px] font-medium text-neutral-500">{c.id}</td>
      <td className="px-4 py-3">
        <div className="flex items-center gap-2.5">
          <PatientAvatar species={c.species} />
          <div className="min-w-0">
            <div className="flex items-center gap-1.5 font-semibold text-neutral-900">
              {c.patient}
              {c.allergy && c.allergy !== "—" && (
                <span title={`Allergy: ${c.allergy}`} className="inline-flex items-center gap-0.5 rounded-full bg-red-50 px-1.5 py-0.5 text-[10px] font-bold text-red-600">
                  <AlertCircle className="h-3 w-3" />
                </span>
              )}
            </div>
            <div className="text-[12px] text-neutral-500">{c.breed} · {c.age}</div>
          </div>
        </div>
      </td>
      <td className="px-4 py-3 text-neutral-700">{c.owner}</td>
      <td className="max-w-[220px] px-4 py-3">
        <span className="block truncate text-neutral-700">{c.reason}</span>
      </td>
      <td className="whitespace-nowrap px-4 py-3 text-neutral-700">{c.vet}</td>
      <td className="whitespace-nowrap px-4 py-3 text-[13px] text-neutral-500">{c.dateLabel}</td>
      <td className="px-4 py-3 text-center text-[13px] tnum text-neutral-500">
        {c.durationMin != null ? `${c.durationMin}′` : "—"}
      </td>
      <td className="px-4 py-3"><StatusPill status={c.status} t={t} /></td>
      <td className="px-4 py-3 text-right">
        {live ? (
          <span className="inline-flex items-center gap-1 rounded-lg border border-[#034751] bg-white px-2.5 py-1.5 text-[12px] font-semibold text-[#034751] transition-colors group-hover:bg-[#034751] group-hover:text-white">
            {t("cs.open")}
            <ChevronRight className="h-3.5 w-3.5" />
          </span>
        ) : (
          <span className="inline-flex h-7 w-7 items-center justify-center rounded-md text-neutral-400 transition-colors hover:bg-neutral-100 hover:text-neutral-600">
            <MoreHorizontal className="h-4 w-4" />
          </span>
        )}
      </td>
    </tr>
  );
}
