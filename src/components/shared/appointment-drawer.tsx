import { useState } from "react";
import { type NavigateFunction } from "react-router-dom";
import {
  Fingerprint,
  Clock,
  Stethoscope,
  MapPin,
  Phone,
  Languages,
  Star,
  Syringe,
  Scale,
  Plus,
  Check,
  FileText,
  CircleDollarSign,
  Send,
  BellRing,
  CalendarPlus,
  PhoneCall,
  ChevronRight,
  AlertTriangle,
  Pill,
  Wallet,
  ExternalLink,
  Activity,
  HeartPulse,
  PiggyBank,
  ShieldCheck,
  QrCode,
  Banknote,
  CreditCard,
  Landmark,
  X,
  type LucideIcon,
} from "lucide-react";
import { cn, vndFull } from "@/lib/utils";
import { useLang } from "@/lib/i18n";
import { Sheet, SheetContent, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { PetAvatar, StatusPill, Meta, MidDot, meridiem } from "@/components/shared/arrival-ui";
import { type ArrivalAppt, type ArrivalStatus } from "@/lib/dashboard-data";
import { PAY_METHODS, payMethod, type PayMethodId } from "@/lib/billing-data";
import {
  getVisitDetail,
  estimateFromServices,
  startConsultation,
  visitTotals,
  type VisitDetail,
  type EstimateStatus,
  type ServiceStatus,
  type MembershipTier,
  type ReminderChannel,
} from "@/lib/visit-detail-data";

const PAY_KIND_ICON: Record<string, LucideIcon> = {
  qr: QrCode,
  wallet: Wallet,
  cash: Banknote,
  card: CreditCard,
  bank: Landmark,
};

type TabKey = "overview" | "estimate" | "consultation" | "services" | "payment" | "reminders";

// ─────────────────────────────────────────────────────────────────────────────
// Small presentational helpers
// ─────────────────────────────────────────────────────────────────────────────
function Section({ title, action, children }: { title: string; action?: React.ReactNode; children: React.ReactNode }) {
  return (
    <section className="rounded-2xl border border-neutral-200 bg-white p-4 shadow-soft">
      <div className="mb-2.5 flex items-center justify-between gap-2">
        <h3 className="text-[11px] font-bold uppercase tracking-wider text-neutral-400">{title}</h3>
        {action}
      </div>
      {children}
    </section>
  );
}

function KV({ label, value, valueClass }: { label: string; value: React.ReactNode; valueClass?: string }) {
  return (
    <div className="flex items-baseline justify-between gap-3 py-0.5 text-[13px]">
      <span className="shrink-0 text-neutral-500">{label}</span>
      <span className={cn("min-w-0 truncate text-right font-medium text-neutral-800", valueClass)}>{value}</span>
    </div>
  );
}

function PrimaryBtn({ onClick, children, className }: { onClick?: () => void; children: React.ReactNode; className?: string }) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "inline-flex h-9 items-center justify-center gap-1.5 rounded-lg px-3.5 text-[13px] font-bold text-white shadow-sm outline-none transition-all hover:brightness-110 focus-visible:ring-2 focus-visible:ring-[#034751]/40",
        className
      )}
      style={{ background: "#034751" }}
    >
      {children}
    </button>
  );
}

function GhostBtn({ onClick, children, className }: { onClick?: () => void; children: React.ReactNode; className?: string }) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "inline-flex h-9 items-center justify-center gap-1.5 rounded-lg border border-neutral-300 bg-white px-3.5 text-[13px] font-semibold text-neutral-700 outline-none transition-colors hover:border-[#034751] hover:text-[#034751] focus-visible:ring-2 focus-visible:ring-[#034751]/40",
        className
      )}
    >
      {children}
    </button>
  );
}

const TIER_BADGE: Record<MembershipTier, string> = {
  platinum: "bg-[#48405F] text-white",
  gold: "bg-[#FFF4D8] text-[#8A5300]",
  silver: "bg-[#F3F6F8] text-[#586575]",
  none: "bg-neutral-100 text-neutral-500",
};
const TRIAGE_BADGE: Record<PatientTriage, { cls: string; key: string }> = {
  stable: { cls: "bg-success-soft text-success-strong", key: "vd.triage.stable" },
  watch: { cls: "bg-warning-soft text-warning-foreground", key: "vd.triage.watch" },
  urgent: { cls: "bg-destructive/10 text-destructive", key: "vd.triage.urgent" },
};
type PatientTriage = "stable" | "watch" | "urgent";

const SERVICE_STATUS: Record<ServiceStatus, { cls: string; key: string }> = {
  planned: { cls: "bg-neutral-100 text-neutral-600", key: "vd.svc.planned" },
  "in-progress": { cls: "bg-[#034751]/10 text-[#034751]", key: "vd.svc.inProgress" },
  done: { cls: "bg-success-soft text-success-strong", key: "vd.svc.done" },
};
const EST_STATUS: Record<EstimateStatus, { cls: string; key: string }> = {
  draft: { cls: "bg-neutral-100 text-neutral-600", key: "vd.est.draft" },
  sent: { cls: "bg-info-soft text-info-strong", key: "vd.est.sent" },
  approved: { cls: "bg-success-soft text-success-strong", key: "vd.est.approved" },
  declined: { cls: "bg-destructive/10 text-destructive", key: "vd.est.declined" },
};
const CHANNEL_LABEL: Record<ReminderChannel, string> = { sms: "SMS", zalo: "Zalo", email: "Email", call: "Call" };

// ─────────────────────────────────────────────────────────────────────────────
// Drawer
// ─────────────────────────────────────────────────────────────────────────────
export function AppointmentDrawer({
  appt,
  onClose,
  onStatus,
  notify,
  navigate,
}: {
  appt: ArrivalAppt | null;
  onClose: () => void;
  onStatus: (a: ArrivalAppt, s: ArrivalStatus) => void;
  notify: (msg: string, undo?: () => void) => void;
  navigate: NavigateFunction;
}) {
  return (
    <Sheet open={appt !== null} onOpenChange={(o) => !o && onClose()}>
      <SheetContent side="right" className="flex w-full flex-col gap-0 p-0 sm:max-w-[680px]">
        {appt && (
          <DrawerInner key={appt.id} appt={appt} onClose={onClose} onStatus={onStatus} notify={notify} navigate={navigate} />
        )}
      </SheetContent>
    </Sheet>
  );
}

// Remounted per appointment (key=appt.id) so `detail` is lazily initialised and
// never null — the required SheetTitle is present on the first commit.
function DrawerInner({
  appt,
  onClose,
  onStatus,
  notify,
  navigate,
}: {
  appt: ArrivalAppt;
  onClose: () => void;
  onStatus: (a: ArrivalAppt, s: ArrivalStatus) => void;
  notify: (msg: string, undo?: () => void) => void;
  navigate: NavigateFunction;
}) {
  const { t } = useLang();
  const [detail, setDetail] = useState<VisitDetail>(() => getVisitDetail(appt));
  const [tab, setTab] = useState<TabKey>("overview");

  const visibleTabs: TabKey[] = [
    "overview",
    ...(detail.estimate ? (["estimate"] as TabKey[]) : []),
    ...(detail.consultation ? (["consultation"] as TabKey[]) : []),
    "services",
    "payment",
    "reminders",
  ];

  return (
    <>
      <Header appt={appt} detail={detail} onStatus={onStatus} t={t} />

      {/* tab bar */}
      <div className="flex shrink-0 gap-1 overflow-x-auto border-b border-neutral-200 px-3">
        {visibleTabs.map((k) => (
          <TabButton key={k} active={tab === k} onClick={() => setTab(k)} label={t(`vd.tab.${k}`)} badge={tabBadge(k, detail, t)} />
        ))}
      </div>

      {/* body */}
      <div className="flex-1 overflow-y-auto bg-neutral-50/40 p-4">
        <TabBody
          tab={tab}
          appt={appt}
          detail={detail}
          setDetail={setDetail}
          setTab={setTab}
          onStatus={onStatus}
          notify={notify}
          navigate={navigate}
          onClose={onClose}
          t={t}
        />
      </div>

      {/* footer */}
      <Footer appt={appt} detail={detail} setTab={setTab} onStatus={onStatus} navigate={navigate} notify={notify} t={t} />
    </>
  );
}

// ── Header ────────────────────────────────────────────────────────────────────
function Header({
  appt,
  detail,
  onStatus,
  t,
}: {
  appt: ArrivalAppt;
  detail: VisitDetail;
  onStatus: (a: ArrivalAppt, s: ArrivalStatus) => void;
  t: (k: string, v?: Record<string, string | number>) => string;
}) {
  const tr = TRIAGE_BADGE[detail.patient.triage];
  return (
    <div className="shrink-0 border-b border-neutral-200 p-5 pr-12">
      <div className="flex items-start gap-3">
        <PetAvatar species={appt.species} size={48} />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <SheetTitle className="truncate text-[20px]">{appt.name}</SheetTitle>
            <span className={cn("rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide", tr.cls)}>{t(tr.key)}</span>
          </div>
          <SheetDescription className="mt-0.5 text-[13px] text-neutral-500">
            {appt.breed} · {detail.patient.sex}
          </SheetDescription>
          <div className="mt-1 flex items-center gap-1.5 text-[12px] text-neutral-400">
            <Fingerprint className="h-3.5 w-3.5" />
            <span className="tnum">{detail.patient.microchipId}</span>
          </div>
        </div>
        <StatusPill status={appt.status} onChange={(s) => onStatus(appt, s)} t={t} />
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-x-2 gap-y-1 text-[13px]">
        <Meta icon={Clock}>
          {appt.time} {meridiem(appt.time)}
        </Meta>
        <MidDot />
        <Meta icon={Stethoscope}>{appt.vet}</Meta>
        <MidDot />
        <Meta icon={MapPin}>{appt.room}</Meta>
      </div>
      <p className="mt-1.5 text-[13px] leading-snug text-neutral-600">{appt.reason}</p>

      {detail.patient.allergies.length > 0 && (
        <div className="mt-2.5 flex flex-wrap items-center gap-1.5">
          {detail.patient.allergies.map((a) => (
            <span key={a} className="inline-flex items-center gap-1 rounded-full bg-destructive/10 px-2 py-0.5 text-[11px] font-semibold text-destructive">
              <AlertTriangle className="h-3 w-3" />
              {t("vd.allergy")}: {a}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

function TabButton({ active, onClick, label, badge }: { active: boolean; onClick: () => void; label: string; badge?: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "relative flex shrink-0 items-center gap-1.5 whitespace-nowrap px-3 py-3 text-[13px] font-semibold outline-none transition-colors",
        active ? "text-[#034751]" : "text-neutral-500 hover:text-neutral-800"
      )}
    >
      {label}
      {badge}
      {active && <span className="absolute inset-x-2 -bottom-px h-[2px] rounded-full bg-[#034751]" />}
    </button>
  );
}

function tabBadge(k: TabKey, d: VisitDetail, t: (k: string, v?: Record<string, string | number>) => string): React.ReactNode {
  const chip = (text: string, cls: string) => (
    <span className={cn("inline-flex h-[18px] min-w-[18px] items-center justify-center rounded-full px-1.5 text-[10px] font-bold tnum", cls)}>{text}</span>
  );
  if (k === "estimate" && d.estimate) return chip(t(EST_STATUS[d.estimate.status].key), EST_STATUS[d.estimate.status].cls);
  if (k === "consultation" && d.consultation)
    return <span className="h-1.5 w-1.5 rounded-full bg-[#034751]" />;
  if (k === "services") {
    const done = d.services.filter((s) => s.status === "done").length;
    return chip(`${done}/${d.services.length}`, "bg-neutral-200 text-neutral-600");
  }
  if (k === "payment") {
    const { balance } = visitTotals(d);
    return balance > 0 ? chip("!", "bg-[#C2410C] text-white") : chip("✓", "bg-success-soft text-success-strong");
  }
  if (k === "reminders" && d.reminders.length > 0) return chip(String(d.reminders.length), "bg-neutral-200 text-neutral-600");
  return null;
}

// ── Tab body ──────────────────────────────────────────────────────────────────
function TabBody({
  tab,
  appt,
  detail,
  setDetail,
  setTab,
  onStatus,
  notify,
  navigate,
  onClose,
  t,
}: {
  tab: TabKey;
  appt: ArrivalAppt;
  detail: VisitDetail;
  setDetail: React.Dispatch<React.SetStateAction<VisitDetail>>;
  setTab: (k: TabKey) => void;
  onStatus: (a: ArrivalAppt, s: ArrivalStatus) => void;
  notify: (msg: string, undo?: () => void) => void;
  navigate: NavigateFunction;
  onClose: () => void;
  t: (k: string, v?: Record<string, string | number>) => string;
}) {
  const patch = (p: Partial<VisitDetail>) => setDetail((d) => ({ ...d, ...p }));

  const createEstimate = () => {
    patch({ estimate: estimateFromServices(detail.services) });
    setTab("estimate");
    notify(t("vd.toast.estimateCreated"));
  };
  const startConsult = () => {
    patch({ consultation: startConsultation(appt) });
    setTab("consultation");
    notify(t("vd.toast.consultStarted"));
  };

  if (tab === "overview")
    return <OverviewTab appt={appt} detail={detail} createEstimate={createEstimate} startConsult={startConsult} navigate={navigate} t={t} />;
  if (tab === "estimate" && detail.estimate)
    return <EstimateTab detail={detail} patch={patch} setTab={setTab} notify={notify} t={t} />;
  if (tab === "consultation" && detail.consultation)
    return <ConsultationTab detail={detail} navigate={navigate} notify={notify} t={t} />;
  if (tab === "services") return <ServicesTab detail={detail} patch={patch} navigate={navigate} notify={notify} t={t} />;
  if (tab === "payment")
    return <PaymentTab appt={appt} detail={detail} patch={patch} onStatus={onStatus} onClose={onClose} navigate={navigate} notify={notify} t={t} />;
  return <RemindersTab detail={detail} patch={patch} navigate={navigate} notify={notify} t={t} />;
}

// ── Overview ──────────────────────────────────────────────────────────────────
function OverviewTab({
  appt,
  detail,
  createEstimate,
  startConsult,
  navigate,
  t,
}: {
  appt: ArrivalAppt;
  detail: VisitDetail;
  createEstimate: () => void;
  startConsult: () => void;
  navigate: NavigateFunction;
  t: (k: string, v?: Record<string, string | number>) => string;
}) {
  const p = detail.patient;
  const vac = p.vaccineSummary;
  return (
    <div className="space-y-3">
      {/* quick-create row for the two conditional tabs */}
      {(!detail.estimate || !detail.consultation) && (
        <div className="flex flex-wrap gap-2">
          {!detail.consultation && (
            <PrimaryBtn onClick={startConsult} className="flex-1">
              <Stethoscope className="h-4 w-4" />
              {t("vd.action.startConsult")}
            </PrimaryBtn>
          )}
          {!detail.estimate && (
            <GhostBtn onClick={createEstimate} className="flex-1">
              <FileText className="h-4 w-4" />
              {t("vd.action.createEstimate")}
            </GhostBtn>
          )}
        </div>
      )}

      <Section title={t("vd.sec.alerts")}>
        {p.allergies.length === 0 && !p.behavioralWarning && p.chronicConditions.length === 0 ? (
          <p className="text-[13px] text-neutral-500">{t("vd.noAlerts")}</p>
        ) : (
          <div className="space-y-2">
            {p.allergies.map((a) => (
              <AlertLine key={a} icon={AlertTriangle} tone="red" label={t("vd.allergy")} text={a} />
            ))}
            {p.behavioralWarning && <AlertLine icon={Activity} tone="amber" label={t("vd.behavior")} text={p.behavioralWarning} />}
            {p.chronicConditions.length > 0 && <AlertLine icon={HeartPulse} tone="neutral" label={t("vd.chronic")} text={p.chronicConditions.join(" · ")} />}
            {p.activeMedications.length > 0 && <AlertLine icon={Pill} tone="neutral" label={t("vd.meds")} text={p.activeMedications.join(" · ")} />}
          </div>
        )}
      </Section>

      <Section
        title={t("vd.sec.owner")}
        action={
          <a href={`tel:${p.ownerPhone}`} className="inline-flex items-center gap-1 text-[12px] font-semibold text-[#034751] hover:underline">
            <Phone className="h-3.5 w-3.5" /> {t("vd.call")}
          </a>
        }
      >
        <KV label={t("vd.owner")} value={appt.owner} />
        <KV label={t("vd.phone")} value={<span className="tnum">{p.ownerPhone}</span>} />
        <KV
          label={t("vd.membership")}
          value={
            <span className={cn("rounded-full px-2 py-0.5 text-[10px] font-bold uppercase", TIER_BADGE[p.membershipTier])}>
              <Star className="mr-0.5 inline h-2.5 w-2.5" />
              {t(`vd.tier.${p.membershipTier}`)}
            </span>
          }
        />
        <KV label={t("vd.language")} value={<span className="inline-flex items-center gap-1"><Languages className="h-3.5 w-3.5 text-neutral-400" />{p.preferredLanguage.toUpperCase()}</span>} />
        <KV label={t("vd.outstanding")} value={p.outstandingBalance > 0 ? vndFull(p.outstandingBalance) : t("vd.clear")} valueClass={p.outstandingBalance > 0 ? "text-[#C2410C]" : "text-success-strong"} />
        <KV label={t("vd.deposit")} value={vndFull(p.depositBalance)} />
      </Section>

      <Section title={t("vd.sec.snapshot")}>
        <KV label={t("vd.weight")} value={`${p.currentWeightKg} kg · ${t("vd.ideal")} ${p.idealWeightKg[0]}–${p.idealWeightKg[1]}`} />
        <KV label={t("vd.bcs")} value={`${p.bcs}/9`} />
        <KV label={t("vd.lastVisit")} value={p.lastVisit} />
        <KV label={t("vd.nextBooking")} value={p.nextBooking} />
        <div className="mt-2 flex items-center gap-2 border-t border-neutral-100 pt-2">
          <Syringe className="h-3.5 w-3.5 text-neutral-400" />
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[12px]">
            <span className="text-success-strong">{vac.upToDate} {t("vd.vac.upToDate")}</span>
            <span className="text-warning-foreground">{vac.dueSoon} {t("vd.vac.dueSoon")}</span>
            <span className="text-destructive">{vac.overdue} {t("vd.vac.overdue")}</span>
          </div>
        </div>
      </Section>

      <Section title={t("vd.sec.cs")}>
        <p className="text-[13px] leading-relaxed text-neutral-600">{p.careSummary}</p>
        <ul className="mt-2 space-y-1.5">
          {p.csHandoff.map((h) => (
            <li key={h} className="flex gap-2 text-[13px] text-neutral-600">
              <ChevronRight className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[#034751]" />
              {h}
            </li>
          ))}
        </ul>
        <button onClick={() => navigate(p.patientHref)} className="mt-3 inline-flex items-center gap-1 text-[13px] font-semibold text-[#034751] hover:underline">
          {t("vd.openRecord")} <ExternalLink className="h-3.5 w-3.5" />
        </button>
      </Section>
    </div>
  );
}

function AlertLine({ icon: Icon, tone, label, text }: { icon: typeof AlertTriangle; tone: "red" | "amber" | "neutral"; label: string; text: string }) {
  const cls = tone === "red" ? "text-destructive" : tone === "amber" ? "text-warning-foreground" : "text-neutral-500";
  return (
    <div className="flex gap-2 text-[13px]">
      <Icon className={cn("mt-0.5 h-4 w-4 shrink-0", cls)} />
      <p className="text-neutral-700">
        <span className={cn("font-semibold", cls)}>{label}:</span> {text}
      </p>
    </div>
  );
}

// ── Estimate ──────────────────────────────────────────────────────────────────
function EstimateTab({
  detail,
  patch,
  setTab,
  notify,
  t,
}: {
  detail: VisitDetail;
  patch: (p: Partial<VisitDetail>) => void;
  setTab: (k: TabKey) => void;
  notify: (msg: string, undo?: () => void) => void;
  t: (k: string, v?: Record<string, string | number>) => string;
}) {
  const est = detail.estimate!;
  const low = est.items.reduce((s, i) => s + i.qty * i.low, 0);
  const high = est.items.reduce((s, i) => s + i.qty * i.high, 0);
  const setStatus = (status: EstimateStatus) => patch({ estimate: { ...est, status } });

  return (
    <div className="space-y-3">
      <Section
        title={t("vd.sec.estimate")}
        action={<span className={cn("rounded-full px-2 py-0.5 text-[11px] font-bold", EST_STATUS[est.status].cls)}>{t(EST_STATUS[est.status].key)}</span>}
      >
        <div className="divide-y divide-neutral-100">
          {est.items.map((i, idx) => (
            <div key={idx} className="flex items-center justify-between gap-3 py-2 text-[13px]">
              <span className="min-w-0 truncate text-neutral-700">
                {i.name} {i.qty > 1 && <span className="text-neutral-400">×{i.qty}</span>}
              </span>
              <span className="shrink-0 tnum font-medium text-neutral-800">
                {vndFull(i.low)} – {vndFull(i.high)}
              </span>
            </div>
          ))}
        </div>
        <div className="mt-2 flex items-center justify-between border-t border-neutral-200 pt-2 text-[13px]">
          <span className="font-bold text-neutral-900">{t("vd.est.total")}</span>
          <span className="tnum font-bold text-[#034751]">
            {vndFull(low)} – {vndFull(high)}
          </span>
        </div>
        <button
          onClick={() => patch({ estimate: { ...est, items: [...est.items, { name: t("vd.est.sampleItem"), qty: 1, low: 120_000, high: 180_000 }] } })}
          className="mt-3 inline-flex items-center gap-1 text-[13px] font-semibold text-[#034751] hover:underline"
        >
          <Plus className="h-3.5 w-3.5" /> {t("vd.est.addItem")}
        </button>
      </Section>

      <div className="flex flex-wrap gap-2">
        {est.status === "draft" && (
          <PrimaryBtn onClick={() => { setStatus("sent"); notify(t("vd.toast.estimateSent")); }}>
            <Send className="h-4 w-4" /> {t("vd.est.send")}
          </PrimaryBtn>
        )}
        {est.status === "sent" && (
          <PrimaryBtn onClick={() => { setStatus("approved"); notify(t("vd.toast.estimateApproved")); }}>
            <Check className="h-4 w-4" /> {t("vd.est.markApproved")}
          </PrimaryBtn>
        )}
        <GhostBtn
          onClick={() => {
            patch({
              invoice: {
                ...detail.invoice,
                items: [...detail.invoice.items, ...est.items.map((i) => ({ name: i.name, qty: i.qty, price: i.low }))],
              },
            });
            setTab("payment");
            notify(t("vd.toast.convertedToInvoice"));
          }}
        >
          <Wallet className="h-4 w-4" /> {t("vd.est.convert")}
        </GhostBtn>
      </div>
    </div>
  );
}

// ── Consultation ──────────────────────────────────────────────────────────────
function ConsultationTab({
  detail,
  navigate,
  notify,
  t,
}: {
  detail: VisitDetail;
  navigate: NavigateFunction;
  notify: (msg: string, undo?: () => void) => void;
  t: (k: string, v?: Record<string, string | number>) => string;
}) {
  const c = detail.consultation!;
  return (
    <div className="space-y-3">
      <Section
        title={t("vd.sec.consultation")}
        action={<span className="rounded-full bg-[#034751]/10 px-2 py-0.5 text-[11px] font-bold text-[#034751]">{t("vd.cons.live")}</span>}
      >
        <KV label={t("vd.cons.id")} value={<span className="tnum">{c.consultId}</span>} />
        <KV label={t("vd.cons.started")} value={c.started} />
        <KV label={t("vd.vet")} value={c.vet} />
        <KV label={t("vd.cons.reason")} value={c.reason} />
        <div className="mt-2 grid grid-cols-2 gap-2 border-t border-neutral-100 pt-2">
          <div className="rounded-lg bg-neutral-50 px-3 py-2">
            <div className="text-[11px] text-neutral-400">{t("vd.weight")}</div>
            <div className="text-[14px] font-semibold tnum text-neutral-800">{c.vitals.weight}</div>
          </div>
          <div className="rounded-lg bg-neutral-50 px-3 py-2">
            <div className="text-[11px] text-neutral-400">{t("vd.temp")}</div>
            <div className="text-[14px] font-semibold tnum text-neutral-800">{c.vitals.temp}</div>
          </div>
        </div>
      </Section>

      <Section title={t("vd.cons.soap")}>
        <p className="text-[13px] italic text-neutral-500">{t("vd.cons.documenting")}</p>
      </Section>

      <div className="flex flex-wrap gap-2">
        <PrimaryBtn onClick={() => navigate(`/consultations/${c.consultId}`)}>
          <ExternalLink className="h-4 w-4" /> {t("vd.cons.open")}
        </PrimaryBtn>
        <GhostBtn onClick={() => notify(t("vd.toast.dischargePreview"))}>
          <FileText className="h-4 w-4" /> {t("vd.cons.discharge")}
        </GhostBtn>
      </div>
    </div>
  );
}

// ── Services ──────────────────────────────────────────────────────────────────
function ServicesTab({
  detail,
  patch,
  navigate,
  notify,
  t,
}: {
  detail: VisitDetail;
  patch: (p: Partial<VisitDetail>) => void;
  navigate: NavigateFunction;
  notify: (msg: string, undo?: () => void) => void;
  t: (k: string, v?: Record<string, string | number>) => string;
}) {
  const markDone = (id: number) => patch({ services: detail.services.map((s) => (s.id === id ? { ...s, status: "done" } : s)) });
  const addService = () => {
    const id = Math.max(0, ...detail.services.map((s) => s.id)) + 1;
    patch({ services: [...detail.services, { id, name: t("vd.svc.sampleItem"), category: "Grooming", status: "planned", price: 80_000 }] });
    notify(t("vd.toast.serviceAdded"));
  };
  return (
    <div className="space-y-3">
      <Section
        title={t("vd.sec.services")}
        action={
          <button onClick={addService} className="inline-flex items-center gap-1 text-[12px] font-semibold text-[#034751] hover:underline">
            <Plus className="h-3.5 w-3.5" /> {t("vd.svc.add")}
          </button>
        }
      >
        <div className="space-y-2">
          {detail.services.map((s) => {
            const meta = SERVICE_STATUS[s.status];
            return (
              <div key={s.id} className="flex items-center gap-3 rounded-xl border border-neutral-200 bg-white p-3">
                <div className="min-w-0 flex-1">
                  <div className="truncate text-[13px] font-semibold text-neutral-800">{s.name}</div>
                  <div className="text-[11px] text-neutral-400">{s.category}</div>
                </div>
                <span className="shrink-0 tnum text-[13px] font-medium text-neutral-700">{vndFull(s.price)}</span>
                <span className={cn("shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase", meta.cls)}>{t(meta.key)}</span>
                {s.status !== "done" && (
                  <button onClick={() => markDone(s.id)} title={t("vd.svc.markDone")} className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md border border-neutral-200 text-neutral-400 transition-colors hover:border-success-strong hover:text-success-strong">
                    <Check className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>
            );
          })}
        </div>
        <button onClick={() => navigate("/consultations/procedures")} className="mt-3 inline-flex items-center gap-1 text-[13px] font-semibold text-[#034751] hover:underline">
          {t("vd.svc.board")} <ExternalLink className="h-3.5 w-3.5" />
        </button>
      </Section>
    </div>
  );
}

// ── Payment & Check-out ───────────────────────────────────────────────────────
function PaymentTab({
  appt,
  detail,
  patch,
  onStatus,
  onClose,
  navigate,
  notify,
  t,
}: {
  appt: ArrivalAppt;
  detail: VisitDetail;
  patch: (p: Partial<VisitDetail>) => void;
  onStatus: (a: ArrivalAppt, s: ArrivalStatus) => void;
  onClose: () => void;
  navigate: NavigateFunction;
  notify: (msg: string, undo?: () => void) => void;
  t: (k: string, v?: Record<string, string | number>) => string;
}) {
  const inv = detail.invoice;
  const dep = detail.deposit;
  const { subtotal, vat, total, depositApplied, balance } = visitTotals(detail);
  const [collecting, setCollecting] = useState<null | "deposit" | "final">(null);
  const [method, setMethod] = useState<PayMethodId>("vietqr");

  const confirmCollect = () => {
    if (collecting === "deposit") {
      patch({ deposit: { ...dep, status: "paid", method } });
      notify(t("vd.toast.depositCollected", { amount: vndFull(dep.amount) }));
    } else {
      patch({ invoice: { ...inv, paid: inv.paid + balance, method } });
      notify(t("vd.toast.paidVia", { method: payMethod(method).name }));
    }
    setCollecting(null);
  };

  return (
    <div className="space-y-3">
      {/* DEPOSIT — created at booking / walk-in, applied to the final invoice */}
      <section
        className={cn(
          "rounded-2xl border p-4 shadow-soft",
          dep.status === "paid" ? "border-success-strong/30 bg-success-soft/40" : "border-[#D97706]/30 bg-[#FFF1E6]"
        )}
      >
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2.5">
            <span
              className={cn(
                "flex h-9 w-9 items-center justify-center rounded-xl",
                dep.status === "paid" ? "bg-success-strong/15 text-success-strong" : "bg-[#D97706]/15 text-[#C2410C]"
              )}
            >
              {dep.status === "paid" ? <ShieldCheck className="h-5 w-5" /> : <PiggyBank className="h-5 w-5" />}
            </span>
            <div className="min-w-0">
              <div className="text-[13px] font-bold text-neutral-900">{t("vd.pay.deposit")}</div>
              <div className="text-[11px] text-neutral-500">
                {dep.status === "paid"
                  ? `${t("vd.pay.depositPaid")}${dep.method ? ` · ${payMethod(dep.method as PayMethodId).name}` : ""}`
                  : t("vd.pay.depositRequired")}
              </div>
            </div>
          </div>
          <span className="shrink-0 tnum text-[16px] font-bold text-neutral-900">{vndFull(dep.amount)}</span>
        </div>

        {dep.status === "due" ? (
          <button
            onClick={() => { setMethod("vietqr"); setCollecting("deposit"); }}
            className="mt-3 inline-flex h-9 w-full items-center justify-center gap-1.5 rounded-lg px-3.5 text-[13px] font-bold text-white shadow-sm transition-all hover:brightness-110"
            style={{ background: "#C2410C" }}
          >
            <PiggyBank className="h-4 w-4" /> {t("vd.pay.collectDeposit")}
          </button>
        ) : dep.applied ? (
          <div className="mt-3 inline-flex items-center gap-1.5 rounded-lg bg-success-strong/10 px-3 py-1.5 text-[12px] font-semibold text-success-strong">
            <Check className="h-3.5 w-3.5" /> {t("vd.pay.depositApplied")}
          </div>
        ) : (
          <button
            onClick={() => { patch({ deposit: { ...dep, applied: true } }); notify(t("vd.toast.depositApplied")); }}
            className="mt-3 inline-flex h-9 w-full items-center justify-center gap-1.5 rounded-lg border border-[#034751] bg-white px-3.5 text-[13px] font-bold text-[#034751] transition-colors hover:bg-[#034751]/5"
          >
            <Wallet className="h-4 w-4" /> {t("vd.pay.applyToInvoice")}
          </button>
        )}
      </section>

      {/* METHOD PICKER — shared by deposit + final payment (mirrors Billing) */}
      {collecting && (
        <MethodPicker
          title={collecting === "deposit" ? t("vd.pay.collectDeposit") : t("vd.pay.collect")}
          amount={collecting === "deposit" ? dep.amount : balance}
          method={method}
          setMethod={setMethod}
          onConfirm={confirmCollect}
          onCancel={() => setCollecting(null)}
          t={t}
        />
      )}

      {/* INVOICE — deposit shown as a deduction line */}
      <Section title={t("vd.sec.invoice")}>
        <div className="divide-y divide-neutral-100">
          {inv.items.map((i, idx) => (
            <div key={idx} className="flex items-center justify-between gap-3 py-2 text-[13px]">
              <span className="min-w-0 truncate text-neutral-700">
                {i.name} {i.qty > 1 && <span className="text-neutral-400">×{i.qty}</span>}
              </span>
              <span className="shrink-0 tnum font-medium text-neutral-800">{vndFull(i.qty * i.price)}</span>
            </div>
          ))}
          {inv.items.length === 0 && <p className="py-3 text-[13px] text-neutral-400">{t("vd.pay.empty")}</p>}
        </div>
        <div className="mt-2 space-y-1 border-t border-neutral-200 pt-2">
          <KV label={t("vd.pay.subtotal")} value={vndFull(subtotal)} />
          {inv.discount > 0 && <KV label={t("vd.pay.discount")} value={`- ${vndFull(inv.discount)}`} />}
          <KV label={t("vd.pay.vat")} value={vndFull(vat)} />
          <div className="flex items-center justify-between pt-1 text-[15px]">
            <span className="font-bold text-neutral-900">{t("vd.pay.total")}</span>
            <span className="tnum font-bold text-neutral-900">{vndFull(total)}</span>
          </div>
          {depositApplied > 0 && (
            <KV label={t("vd.pay.depositLine")} value={`- ${vndFull(depositApplied)}`} valueClass="text-success-strong" />
          )}
          {inv.paid > 0 && <KV label={t("vd.pay.paid")} value={`- ${vndFull(inv.paid)}`} valueClass="text-success-strong" />}
          <div className="flex items-center justify-between border-t border-neutral-100 pt-1.5 text-[15px]">
            <span className="font-bold text-neutral-900">{t("vd.pay.balance")}</span>
            <span className={cn("tnum font-bold", balance > 0 ? "text-[#C2410C]" : "text-success-strong")}>{vndFull(balance)}</span>
          </div>
        </div>
      </Section>

      {!collecting && (
        <div className="flex flex-wrap gap-2">
          {balance > 0 ? (
            <PrimaryBtn onClick={() => { setMethod("vietqr"); setCollecting("final"); }}>
              <CircleDollarSign className="h-4 w-4" /> {t("vd.pay.collect")}
            </PrimaryBtn>
          ) : (
            <PrimaryBtn
              onClick={() => {
                onStatus(appt, "Completed");
                notify(t("vd.toast.checkedOut", { name: appt.name }));
                onClose();
              }}
            >
              <Check className="h-4 w-4" /> {t("vd.pay.checkout")}
            </PrimaryBtn>
          )}
          <GhostBtn onClick={() => navigate("/billing/invoices")}>
            <ExternalLink className="h-4 w-4" /> {t("vd.pay.openBilling")}
          </GhostBtn>
        </div>
      )}
    </div>
  );
}

function MethodPicker({
  title,
  amount,
  method,
  setMethod,
  onConfirm,
  onCancel,
  t,
}: {
  title: string;
  amount: number;
  method: PayMethodId;
  setMethod: (m: PayMethodId) => void;
  onConfirm: () => void;
  onCancel: () => void;
  t: (k: string, v?: Record<string, string | number>) => string;
}) {
  const m = payMethod(method);
  return (
    <section className="rounded-2xl border-2 bg-white p-4 shadow-card" style={{ borderColor: m.accent }}>
      <div className="flex items-center justify-between gap-2">
        <h3 className="text-[13px] font-bold text-neutral-900">{title}</h3>
        <button
          onClick={onCancel}
          aria-label={t("vd.pay.cancel")}
          className="flex h-7 w-7 items-center justify-center rounded-lg text-neutral-400 transition-colors hover:bg-neutral-100 hover:text-neutral-700"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
      <div className="mt-1 text-[11px] font-semibold uppercase tracking-wider text-neutral-400">{t("vd.pay.method")}</div>
      <div className="mt-2 grid grid-cols-2 gap-2">
        {PAY_METHODS.map((pm) => {
          const Icon = PAY_KIND_ICON[pm.kind] ?? Banknote;
          const on = pm.id === method;
          return (
            <button
              key={pm.id}
              onClick={() => setMethod(pm.id)}
              className={cn(
                "flex items-center gap-2 rounded-xl border p-2.5 text-[13px] font-semibold text-neutral-800 transition-all",
                on ? "border-2" : "border-neutral-200 hover:border-neutral-300"
              )}
              style={on ? { borderColor: pm.accent, background: `${pm.accent}0F` } : undefined}
            >
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg" style={{ background: `${pm.accent}1A`, color: pm.accent }}>
                <Icon className="h-4 w-4" />
              </span>
              {pm.name}
            </button>
          );
        })}
      </div>
      {m.showsQr && (
        <div className="mt-3 flex items-center gap-2 rounded-lg bg-neutral-50 px-3 py-2 text-[12px] text-neutral-600">
          <QrCode className="h-4 w-4" style={{ color: m.accent }} />
          {t("vd.pay.scanQr", { name: m.name })}
        </div>
      )}
      <PrimaryBtn onClick={onConfirm} className="mt-3 w-full">
        <Check className="h-4 w-4" /> {t("vd.pay.confirm", { amount: vndFull(amount) })}
      </PrimaryBtn>
    </section>
  );
}

// ── Reminders / Follow-up ─────────────────────────────────────────────────────
function RemindersTab({
  detail,
  patch,
  navigate,
  notify,
  t,
}: {
  detail: VisitDetail;
  patch: (p: Partial<VisitDetail>) => void;
  navigate: NavigateFunction;
  notify: (msg: string, undo?: () => void) => void;
  t: (k: string, v?: Record<string, string | number>) => string;
}) {
  const schedule = (id: number) => {
    const r = detail.reminders.find((x) => x.id === id);
    patch({ reminders: detail.reminders.filter((x) => x.id !== id) });
    if (r) notify(t("vd.toast.reminderScheduled", { type: r.type }));
  };
  return (
    <div className="space-y-3">
      <Section
        title={t("vd.sec.reminders")}
        action={
          detail.reminders.length > 0 ? (
            <button onClick={() => { notify(t("vd.toast.allScheduled", { n: detail.reminders.length })); patch({ reminders: [] }); }} className="inline-flex items-center gap-1 text-[12px] font-semibold text-[#034751] hover:underline">
              <Send className="h-3.5 w-3.5" /> {t("vd.rem.scheduleAll")}
            </button>
          ) : undefined
        }
      >
        {detail.reminders.length === 0 ? (
          <p className="text-[13px] text-neutral-500">{t("vd.rem.empty")}</p>
        ) : (
          <div className="space-y-2">
            {detail.reminders.map((r) => (
              <div key={r.id} className="flex items-center gap-3 rounded-xl border border-neutral-200 bg-white p-3">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#785AA6]/10 text-[#785AA6]">
                  <BellRing className="h-4 w-4" />
                </span>
                <div className="min-w-0 flex-1">
                  <div className="truncate text-[13px] font-semibold text-neutral-800">{r.type}</div>
                  <div className="text-[11px] text-neutral-400">
                    {t("vd.rem.due")} {r.dueDate} · {CHANNEL_LABEL[r.channel]}
                  </div>
                </div>
                <button onClick={() => schedule(r.id)} className="shrink-0 rounded-lg border border-neutral-300 px-2.5 py-1 text-[12px] font-semibold text-neutral-600 transition-colors hover:border-[#034751] hover:text-[#034751]">
                  {t("vd.rem.schedule")}
                </button>
              </div>
            ))}
          </div>
        )}
      </Section>

      <div className="flex flex-wrap gap-2">
        <GhostBtn onClick={() => notify(t("vd.toast.callbackCreated"))}>
          <PhoneCall className="h-4 w-4" /> {t("vd.rem.callback")}
        </GhostBtn>
        <GhostBtn onClick={() => navigate("/schedule")}>
          <CalendarPlus className="h-4 w-4" /> {t("vd.rem.followup")}
        </GhostBtn>
      </div>
    </div>
  );
}

// ── Footer (status-aware primary + open record) ───────────────────────────────
function Footer({
  appt,
  detail,
  setTab,
  onStatus,
  navigate,
  notify,
  t,
}: {
  appt: ArrivalAppt;
  detail: VisitDetail;
  setTab: (k: TabKey) => void;
  onStatus: (a: ArrivalAppt, s: ArrivalStatus) => void;
  navigate: NavigateFunction;
  notify: (msg: string, undo?: () => void) => void;
  t: (k: string, v?: Record<string, string | number>) => string;
}) {
  let label = "";
  let action: () => void = () => {};
  switch (appt.status) {
    case "Not Arrived":
      label = t("vd.action.checkIn");
      action = () => { onStatus(appt, "Arrived"); notify(t("vd.toast.checkedIn", { name: appt.name })); };
      break;
    case "Arrived":
      label = t("vd.action.startConsult");
      action = () => {
        if (appt.consultId) navigate(`/consultations/${appt.consultId}`);
        else notify(t("ar.toast.consult", { name: appt.name }));
      };
      break;
    case "In Progress":
      label = t("vd.action.viewConsult");
      action = () => {
        if (appt.consultId) navigate(`/consultations/${appt.consultId}`);
        else setTab("consultation");
      };
      break;
    case "Waiting To Pay":
      label = t("vd.action.collect");
      action = () => setTab("payment");
      break;
    case "No Show":
    case "Canceled":
      label = t("vd.action.rebook");
      action = () => navigate("/schedule");
      break;
    default:
      label = t("vd.action.viewInvoice");
      action = () => setTab("payment");
  }

  return (
    <div className="flex shrink-0 items-center justify-between gap-3 border-t border-neutral-200 bg-white p-4">
      <button onClick={() => navigate(detail.patient.patientHref)} className="inline-flex items-center gap-1.5 text-[13px] font-semibold text-neutral-600 hover:text-[#034751]">
        <FileText className="h-4 w-4" /> {t("vd.openRecord")}
      </button>
      <PrimaryBtn onClick={action}>{label}</PrimaryBtn>
    </div>
  );
}
