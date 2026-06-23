import { useMemo, useState, type Dispatch, type SetStateAction } from "react";
import { useNavigate } from "react-router-dom";
import {
  Activity,
  Banknote,
  BedDouble,
  Building2,
  Check,
  ChevronRight,
  Clock,
  CreditCard,
  DoorOpen,
  Globe,
  Landmark,
  Mail,
  MapPin,
  Phone,
  Plus,
  QrCode,
  Receipt,
  Scissors,
  ShieldAlert,
  ShieldCheck,
  Star,
  Stethoscope,
  Syringe,
  Trash2,
  Users,
  Wallet,
  type LucideIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useLang } from "@/lib/i18n";
import {
  branches as SEED,
  branchMoney,
  COUNTRIES,
  paymentsForCountry,
  ROOM_TYPES,
  taxDefaultsForCountry,
  type Branch,
  type BranchStatus,
  type CountryCode,
  type PaymentMethod,
  type Room,
  type RoomType,
} from "@/lib/branch-data";

type SettingsTab = "general" | "hours" | "rooms" | "payments" | "team";
type TFn = (k: string) => string;

const FOCUS = "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#034751]/40 focus-visible:ring-offset-1";

const TONES: Record<Branch["tone"], string> = {
  teal: "from-[#034751] via-[#0F8C86] to-[#A8DBD6]",
  violet: "from-[#4B3D75] via-[#785AA6] to-[#D8CEF0]",
  amber: "from-[#7A4A12] via-[#D8872B] to-[#F5D7A6]",
  rose: "from-[#74304E] via-[#B64268] to-[#F3B7C8]",
  blue: "from-[#13386E] via-[#2F6FB0] to-[#BCD7F2]",
};

const ROOM_ICON: Record<RoomType, LucideIcon> = {
  exam: Stethoscope,
  surgery: Syringe,
  procedure: Activity,
  ward: BedDouble,
  isolation: ShieldAlert,
  grooming: Scissors,
  reception: DoorOpen,
};

const PAY_ICON: Record<PaymentMethod["kind"], LucideIcon> = {
  card: CreditCard,
  qr: QrCode,
  wallet: Wallet,
  bank: Landmark,
  cash: Banknote,
};

const STATUS_STYLE: Record<BranchStatus, string> = {
  active: "bg-success-soft text-success-strong",
  setup: "bg-warning-soft text-warning-foreground",
  inactive: "bg-neutral-100 text-neutral-600",
};

const clone = (b: Branch): Branch => JSON.parse(JSON.stringify(b));

// ─────────────────────────────────────────────────────────────────────────────
export default function BranchesPage() {
  const { t } = useLang();
  const [list, setList] = useState<Branch[]>(() => SEED.map(clone));
  const [activeId, setActiveId] = useState<string>(SEED[0].id);
  const [draft, setDraft] = useState<Branch>(() => clone(SEED[0]));
  const [tab, setTab] = useState<SettingsTab>("general");

  const original = list.find((b) => b.id === activeId) ?? list[0];
  const dirty = useMemo(() => JSON.stringify(draft) !== JSON.stringify(original), [draft, original]);
  // Derived from the live (edited) list so KPIs track saved changes.
  const summary = useMemo(
    () => ({
      total: list.length,
      countries: new Set(list.map((b) => b.country)).size,
      active: list.filter((b) => b.status === "active").length,
      staff: list.reduce((s, b) => s + b.stats.staff, 0),
    }),
    [list]
  );

  function select(id: string) {
    const next = list.find((b) => b.id === id);
    if (!next || id === activeId) return;
    if (dirty && !window.confirm(t("br.confirmDiscard"))) return;
    setActiveId(id);
    setDraft(clone(next));
    setTab("general");
  }
  function save() {
    setList((prev) => prev.map((b) => (b.id === draft.id ? clone(draft) : b)));
  }
  function discard() {
    setDraft(clone(original));
  }

  const patch: Dispatch<SetStateAction<Branch>> = setDraft;

  const TABS: { id: SettingsTab; key: string; icon: LucideIcon }[] = [
    { id: "general", key: "br.tab.general", icon: Building2 },
    { id: "hours", key: "br.tab.hours", icon: Clock },
    { id: "rooms", key: "br.tab.rooms", icon: DoorOpen },
    { id: "payments", key: "br.tab.payments", icon: CreditCard },
    { id: "team", key: "br.tab.team", icon: Users },
  ];

  return (
    <div className="flex h-full flex-col bg-[#F7F9F8]">
      {/* Header */}
      <header className="shrink-0 border-b border-neutral-200 bg-white px-5 pt-4">
        <div className="mx-auto flex max-w-[1600px] flex-col gap-3">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center gap-1.5 rounded-md bg-[#034751]/10 px-2.5 py-1 text-[12px] font-bold text-[#034751]">
                  <Building2 className="h-3.5 w-3.5" />
                  {t("nav.admin.branches")}
                </span>
                <span className="rounded-md bg-white px-2.5 py-1 text-[12px] font-semibold text-neutral-500 ring-1 ring-neutral-200">
                  {t("br.multicountry")}
                </span>
              </div>
              <h1 className="mt-2 font-display text-[26px] font-bold leading-tight tracking-tight text-neutral-950">{t("br.title")}</h1>
            </div>
            <Button className="gap-1.5">
              <Plus className="h-4 w-4" />
              {t("br.new")}
            </Button>
          </div>

          <div className="grid grid-cols-2 gap-2 pb-3 sm:grid-cols-4">
            <Kpi label={t("br.kpi.total")} value={summary.total} icon={Building2} tone="teal" />
            <Kpi label={t("br.kpi.countries")} value={summary.countries} icon={Globe} tone="blue" />
            <Kpi label={t("br.kpi.active")} value={summary.active} icon={ShieldCheck} tone="green" />
            <Kpi label={t("br.kpi.staff")} value={summary.staff} icon={Users} tone="amber" />
          </div>
        </div>
      </header>

      {/* Body */}
      <div className="min-h-0 flex-1">
        <div className="mx-auto grid h-full max-w-[1600px] grid-cols-1 md:grid-cols-[300px_1fr] lg:grid-cols-[330px_1fr]">
          {/* Branch list */}
          <aside className="flex min-h-0 flex-col overflow-y-auto border-r border-neutral-200 bg-white p-3">
            <div className="space-y-2">
              {list.map((b) => (
                <BranchListItem key={b.id} b={b} active={b.id === activeId} onClick={() => select(b.id)} t={t} />
              ))}
            </div>
          </aside>

          {/* Settings editor */}
          <section className="flex min-h-0 min-w-0 flex-col bg-[#F7F9F8]">
            <SettingsHeader b={draft} t={t} />

            {/* Sub-tabs */}
            <div className="shrink-0 border-b border-neutral-200 bg-white px-4">
              <nav className="-mb-px flex items-center gap-0.5 overflow-x-auto">
                {TABS.map((tb) => {
                  const on = tab === tb.id;
                  return (
                    <button
                      key={tb.id}
                      onClick={() => setTab(tb.id)}
                      className={cn(
                        "group relative flex items-center gap-2 whitespace-nowrap rounded-t-lg px-3.5 py-2.5 text-[13px] font-semibold transition-colors",
                        FOCUS,
                        on ? "text-[#034751]" : "text-neutral-500 hover:text-neutral-800"
                      )}
                    >
                      <tb.icon className="h-4 w-4" />
                      {t(tb.key)}
                      {on && <span className="absolute inset-x-2 -bottom-px h-0.5 rounded-full bg-[#034751]" />}
                    </button>
                  );
                })}
              </nav>
            </div>

            {/* Tab body */}
            <div className="min-h-0 flex-1 overflow-y-auto">
              <div className="mx-auto max-w-[860px] p-5">
                {tab === "general" && <GeneralTab b={draft} patch={patch} t={t} />}
                {tab === "hours" && <HoursTab b={draft} patch={patch} t={t} />}
                {tab === "rooms" && <RoomsTab b={draft} patch={patch} t={t} />}
                {tab === "payments" && <PaymentsTab b={draft} patch={patch} t={t} />}
                {tab === "team" && <TeamTab b={draft} t={t} />}
              </div>
            </div>

            {/* Save bar */}
            {dirty && (
              <div className="shrink-0 border-t border-neutral-200 bg-white px-5 py-3">
                <div className="mx-auto flex max-w-[860px] items-center justify-between gap-3">
                  <span className="inline-flex items-center gap-1.5 text-[13px] font-medium text-amber-700">
                    <span className="h-2 w-2 rounded-full bg-amber-500" />
                    {t("br.unsaved")}
                  </span>
                  <div className="flex items-center gap-2">
                    <Button variant="ghost" onClick={discard}>{t("br.discard")}</Button>
                    <Button className="gap-1.5" onClick={save}>
                      <Check className="h-4 w-4" />
                      {t("br.save")}
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}

// ── KPI ───────────────────────────────────────────────────────────────────────
function Kpi({ label, value, icon: Icon, tone }: { label: string; value: number; icon: LucideIcon; tone: "teal" | "blue" | "green" | "amber" }) {
  const tones: Record<string, string> = {
    teal: "bg-[#034751]/10 text-[#034751]",
    blue: "bg-info-soft text-info-strong",
    green: "bg-success-soft text-success-strong",
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

// ── Branch list item ──────────────────────────────────────────────────────────
function CountrySwatch({ code, className }: { code: CountryCode; className?: string }) {
  const c = COUNTRIES[code];
  return (
    <span
      title={c.name}
      style={{ backgroundColor: c.soft, color: c.accent }}
      className={cn("inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[10px] font-bold", className)}
    >
      <span className="h-2 w-2 rounded-full" style={{ backgroundColor: c.accent }} />
      {code}
    </span>
  );
}

function BranchListItem({ b, active, onClick, t }: { b: Branch; active: boolean; onClick: () => void; t: TFn }) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "flex w-full items-start gap-3 rounded-lg border p-2.5 text-left transition-all",
        FOCUS,
        active ? "border-[#034751] bg-[#034751]/[0.05] shadow-soft" : "border-neutral-200 bg-white hover:border-[#034751]/40 hover:shadow-soft"
      )}
    >
      <span className={cn("relative flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-gradient-to-br font-mono text-[10px] font-bold text-white", TONES[b.tone])}>
        <span className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(255,255,255,0.4),transparent_38%)]" />
        {b.code.split("-")[0]}
      </span>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1.5">
          <span className="truncate text-[13px] font-bold text-neutral-900">{b.name}</span>
          {b.flagship && <Star className="h-3 w-3 shrink-0 fill-amber-400 text-amber-400" />}
        </div>
        <div className="mt-0.5 flex items-center gap-1.5 text-[11px] text-neutral-500">
          <MapPin className="h-3 w-3 shrink-0" />
          <span className="truncate">{b.city}</span>
        </div>
        <div className="mt-1.5 flex flex-wrap items-center gap-1">
          <CountrySwatch code={b.country} />
          <span className={cn("rounded-md px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide", STATUS_STYLE[b.status])}>{t(`br.status.${b.status}`)}</span>
          {b.is24h && <span className="rounded-md bg-[#034751]/10 px-1.5 py-0.5 text-[9px] font-bold text-[#034751]">24/7</span>}
        </div>
        <div className="mt-1.5 flex items-center gap-2 text-[10px] font-medium text-neutral-400">
          <span className="inline-flex items-center gap-0.5"><Users className="h-3 w-3" />{b.stats.staff}</span>
          <span>·</span>
          <span className="tnum">{b.stats.patients.toLocaleString()} {t("br.patientsShort")}</span>
        </div>
      </div>
      <ChevronRight className={cn("h-4 w-4 shrink-0 self-center", active ? "text-[#034751]" : "text-neutral-300")} />
    </button>
  );
}

// ── Settings header ─────────────────────────────────────────────────────────
function SettingsHeader({ b, t }: { b: Branch; t: TFn }) {
  const country = COUNTRIES[b.country];
  return (
    <div className="shrink-0 border-b border-neutral-200 bg-white px-5 pt-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className={cn("flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br font-mono text-[11px] font-bold text-white shadow-soft", TONES[b.tone])}>
            {b.code.split("-")[0]}
          </span>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="font-display text-[19px] font-bold leading-tight tracking-tight text-neutral-950">{b.name}</h2>
              {b.flagship && (
                <span className="inline-flex items-center gap-1 rounded-md bg-amber-50 px-1.5 py-0.5 text-[10px] font-bold text-amber-700">
                  <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                  {t("br.flagship")}
                </span>
              )}
            </div>
            <div className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-[12px] text-neutral-500">
              <span className="font-mono text-[11px]">{b.code}</span>
              <span className="text-neutral-300">·</span>
              <span className="inline-flex items-center gap-1"><Globe className="h-3 w-3" />{country.name}</span>
              <span className="text-neutral-300">·</span>
              <span className="inline-flex items-center gap-1"><Clock className="h-3 w-3" />{country.timezone}</span>
            </div>
          </div>
        </div>
        <span className={cn("rounded-full px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide", STATUS_STYLE[b.status])}>{t(`br.status.${b.status}`)}</span>
      </div>
    </div>
  );
}

// ── Reusable controls ─────────────────────────────────────────────────────────
function Field({ label, children, hint, full }: { label: string; children: React.ReactNode; hint?: string; full?: boolean }) {
  return (
    <label className={cn("flex flex-col gap-1.5", full && "sm:col-span-2")}>
      <span className="text-[12px] font-semibold text-neutral-700">{label}</span>
      {children}
      {hint && <span className="text-[11px] text-neutral-400">{hint}</span>}
    </label>
  );
}

const inputCls =
  "h-9 w-full rounded-lg border border-neutral-200 bg-white px-3 text-sm text-neutral-800 placeholder:text-neutral-400 focus:border-[#034751] focus:outline-none focus:ring-2 focus:ring-[#034751]/20";

function TextInput({ value, onChange, placeholder, type = "text" }: { value: string | number; onChange: (v: string) => void; placeholder?: string; type?: string }) {
  return <input type={type} value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} className={inputCls} />;
}

function Toggle({ on, onChange, label }: { on: boolean; onChange: (v: boolean) => void; label: string }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={on}
      aria-label={label}
      onClick={() => onChange(!on)}
      className={cn("relative h-6 w-11 shrink-0 rounded-full transition-colors", FOCUS, on ? "bg-[#034751]" : "bg-neutral-300")}
    >
      <span className={cn("absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-all", on ? "left-[22px]" : "left-0.5")} />
    </button>
  );
}

function Card({ title, icon: Icon, children, action }: { title: string; icon: LucideIcon; children: React.ReactNode; action?: React.ReactNode }) {
  return (
    <section className="rounded-xl border border-neutral-200 bg-white p-4 shadow-soft">
      <div className="mb-3 flex items-center justify-between gap-2">
        <h3 className="flex items-center gap-2 font-display text-[15px] font-bold text-neutral-900">
          <Icon className="h-4 w-4 text-[#034751]" />
          {title}
        </h3>
        {action}
      </div>
      {children}
    </section>
  );
}

// ── General tab ─────────────────────────────────────────────────────────────
function GeneralTab({ b, patch, t }: { b: Branch; patch: Dispatch<SetStateAction<Branch>>; t: TFn }) {
  const set = (p: Partial<Branch>) => patch((d) => ({ ...d, ...p }));
  const STATUSES: BranchStatus[] = ["active", "setup", "inactive"];
  return (
    <div className="space-y-4">
      <Card title={t("br.sec.profile")} icon={Building2}>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label={t("br.f.name")} full>
            <TextInput value={b.name} onChange={(v) => set({ name: v })} />
          </Field>
          <Field label={t("br.f.code")} hint={t("br.f.codeHint")}>
            <TextInput value={b.code} onChange={(v) => set({ code: v.toUpperCase() })} />
          </Field>
          <Field label={t("br.f.opened")}>
            <TextInput type="number" value={b.openedYear} onChange={(v) => set({ openedYear: Number.isNaN(Number(v)) ? b.openedYear : Number(v) })} />
          </Field>
        </div>

        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <div className="flex flex-col gap-1.5">
            <span className="text-[12px] font-semibold text-neutral-700">{t("br.f.status")}</span>
            <div className="inline-flex rounded-lg border border-neutral-200 bg-neutral-50 p-0.5">
              {STATUSES.map((s) => (
                <button
                  key={s}
                  onClick={() => set({ status: s })}
                  className={cn(
                    "rounded-md px-3 py-1.5 text-[12px] font-semibold capitalize transition-colors",
                    FOCUS,
                    b.status === s ? "bg-white text-[#034751] shadow-soft" : "text-neutral-500 hover:text-neutral-800"
                  )}
                >
                  {t(`br.status.${s}`)}
                </button>
              ))}
            </div>
          </div>
          <div className="flex items-center justify-between rounded-lg border border-neutral-200 bg-neutral-50 px-3 py-2">
            <div>
              <div className="text-[12px] font-semibold text-neutral-700">{t("br.f.is24h")}</div>
              <div className="text-[11px] text-neutral-400">{t("br.f.is24hHint")}</div>
            </div>
            <Toggle
              on={b.is24h}
              onChange={(v) =>
                set({
                  is24h: v,
                  hours: b.hours.map((h) => ({
                    ...h,
                    is24h: v,
                    closed: v ? false : h.closed,
                    open: v ? "00:00" : h.open === "00:00" ? "08:00" : h.open,
                    close: v ? "24:00" : h.close === "24:00" ? "20:00" : h.close,
                  })),
                })
              }
              label={t("br.f.is24h")}
            />
          </div>
          <div className="flex items-center justify-between rounded-lg border border-neutral-200 bg-neutral-50 px-3 py-2 sm:col-span-2">
            <div>
              <div className="flex items-center gap-1.5 text-[12px] font-semibold text-neutral-700">
                <Star className="h-3.5 w-3.5 text-amber-500" />
                {t("br.f.flagship")}
              </div>
              <div className="text-[11px] text-neutral-400">{t("br.f.flagshipHint")}</div>
            </div>
            <Toggle on={b.flagship} onChange={(v) => set({ flagship: v })} label={t("br.f.flagship")} />
          </div>
        </div>
      </Card>

      <Card title={t("br.sec.location")} icon={MapPin}>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label={t("br.f.country")} hint={t("br.f.countryHint")}>
            <select
              value={b.country}
              onChange={(e) => {
                const c = e.target.value as CountryCode;
                set({ country: c, payments: paymentsForCountry(c), tax: { ...b.tax, ...taxDefaultsForCountry(c) } });
              }}
              className={inputCls}
            >
              {(Object.keys(COUNTRIES) as CountryCode[]).map((c) => (
                <option key={c} value={c}>{COUNTRIES[c].name}</option>
              ))}
            </select>
          </Field>
          <Field label={t("br.f.city")}>
            <TextInput value={b.city} onChange={(v) => set({ city: v })} />
          </Field>
          <Field label={t("br.f.district")}>
            <TextInput value={b.district} onChange={(v) => set({ district: v })} />
          </Field>
          <Field label={t("br.f.timezone")}>
            <input value={COUNTRIES[b.country].timezone} readOnly className={cn(inputCls, "bg-neutral-50 text-neutral-500")} />
          </Field>
          <Field label={t("br.f.address")} full>
            <textarea value={b.address} onChange={(e) => set({ address: e.target.value })} rows={2} className={cn(inputCls, "h-auto py-2 leading-relaxed")} />
          </Field>
        </div>
      </Card>

      <Card title={t("br.sec.contact")} icon={Phone}>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label={t("br.f.phone")}>
            <div className="relative">
              <Phone className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
              <input value={b.phone} onChange={(e) => set({ phone: e.target.value })} className={cn(inputCls, "pl-9")} />
            </div>
          </Field>
          <Field label={t("br.f.email")}>
            <div className="relative">
              <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
              <input type="email" value={b.email} onChange={(e) => set({ email: e.target.value })} className={cn(inputCls, "pl-9")} />
            </div>
          </Field>
          <Field label={t("br.f.manager")}>
            <TextInput value={b.manager.name} onChange={(v) => set({ manager: { ...b.manager, name: v } })} />
          </Field>
          <Field label={t("br.f.managerPhone")}>
            <TextInput value={b.manager.phone} onChange={(v) => set({ manager: { ...b.manager, phone: v } })} />
          </Field>
        </div>
      </Card>
    </div>
  );
}

// ── Hours tab ───────────────────────────────────────────────────────────────
function HoursTab({ b, patch, t }: { b: Branch; patch: Dispatch<SetStateAction<Branch>>; t: TFn }) {
  // Keep the branch-level 24/7 flag in sync with the per-day grid so they can't contradict.
  function setDay(i: number, p: Partial<Branch["hours"][number]>) {
    patch((d) => {
      const hours = d.hours.map((h, idx) => (idx === i ? { ...h, ...p } : h));
      return { ...d, hours, is24h: hours.every((h) => h.is24h) };
    });
  }
  function applyWeekdays() {
    patch((d) => {
      const mon = d.hours[0];
      const hours = d.hours.map((h, idx) => (idx < 5 ? { ...h, open: mon.open, close: mon.close, closed: mon.closed, is24h: mon.is24h } : h));
      return { ...d, hours, is24h: hours.every((h) => h.is24h) };
    });
  }
  return (
    <Card
      title={t("br.sec.hours")}
      icon={Clock}
      action={
        <Button variant="outline" size="sm" className="gap-1.5" onClick={applyWeekdays}>
          {t("br.hours.applyWeekdays")}
        </Button>
      }
    >
      <div className="divide-y divide-neutral-100">
        {b.hours.map((h, i) => (
          <div key={h.key} className="flex flex-wrap items-center gap-3 py-2.5">
            <span className="w-24 shrink-0 text-[13px] font-semibold text-neutral-800">{t(h.key)}</span>
            {h.closed ? (
              <span className="flex-1 text-[13px] font-medium text-neutral-400">{t("br.hours.closed")}</span>
            ) : h.is24h ? (
              <span className="flex-1 text-[13px] font-semibold text-[#034751]">{t("br.hours.open24")}</span>
            ) : (
              <div className="flex flex-1 items-center gap-2">
                <input type="time" aria-label={`${t(h.key)} · ${t("br.hours.open")}`} value={h.open} onChange={(e) => setDay(i, { open: e.target.value })} className={cn(inputCls, "h-8 w-28 tnum")} />
                <span className="text-neutral-400">–</span>
                <input type="time" aria-label={`${t(h.key)} · ${t("br.hours.close")}`} value={h.close} onChange={(e) => setDay(i, { close: e.target.value })} className={cn(inputCls, "h-8 w-28 tnum")} />
              </div>
            )}
            <div className="flex items-center gap-3">
              <span className="flex items-center gap-1.5 text-[11px] font-medium text-neutral-500">
                <span className="hidden sm:inline">{t("br.hours.is24")}</span>
                <Toggle
                  on={h.is24h}
                  onChange={(v) =>
                    setDay(i, {
                      is24h: v,
                      closed: v ? false : h.closed,
                      open: v ? "00:00" : h.open === "00:00" ? "08:00" : h.open,
                      close: v ? "24:00" : h.close === "24:00" ? "20:00" : h.close,
                    })
                  }
                  label={`${t(h.key)} ${t("br.hours.is24")}`}
                />
              </span>
              <span className="flex items-center gap-1.5 text-[11px] font-medium text-neutral-500">
                <span className="hidden sm:inline">{t("br.hours.closedLabel")}</span>
                <Toggle on={h.closed} onChange={(v) => setDay(i, { closed: v, is24h: v ? false : h.is24h })} label={`${t(h.key)} ${t("br.hours.closedLabel")}`} />
              </span>
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}

// ── Rooms tab ─────────────────────────────────────────────────────────────────
function RoomsTab({ b, patch, t }: { b: Branch; patch: Dispatch<SetStateAction<Branch>>; t: TFn }) {
  function setRoom(id: string, p: Partial<Room>) {
    patch((d) => ({ ...d, rooms: d.rooms.map((r) => (r.id === id ? { ...r, ...p } : r)) }));
  }
  function remove(id: string) {
    patch((d) => ({ ...d, rooms: d.rooms.filter((r) => r.id !== id) }));
  }
  function add() {
    patch((d) => ({ ...d, rooms: [...d.rooms, { id: `r${Date.now()}`, name: "", type: "exam", capacity: 1, active: true }] }));
  }
  const activeCount = b.rooms.filter((r) => r.active).length;

  return (
    <Card
      title={t("br.sec.rooms")}
      icon={DoorOpen}
      action={
        <Button variant="outline" size="sm" className="gap-1.5" onClick={add}>
          <Plus className="h-3.5 w-3.5" />
          {t("br.rooms.add")}
        </Button>
      }
    >
      <div className="mb-3 flex items-center gap-2 text-[12px] text-neutral-500">
        <span className="font-semibold text-neutral-800">{activeCount}</span>
        <span>/ {b.rooms.length} {t("br.rooms.activeOf")}</span>
      </div>
      <div className="space-y-2">
        {b.rooms.length === 0 && <p className="py-6 text-center text-sm text-neutral-400">{t("br.rooms.empty")}</p>}
        {b.rooms.map((r) => {
          const Icon = ROOM_ICON[r.type];
          return (
            <div key={r.id} className={cn("flex flex-wrap items-center gap-2 rounded-lg border border-neutral-200 p-2", !r.active && "opacity-60")}>
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#034751]/10 text-[#034751]">
                <Icon className="h-4 w-4" />
              </span>
              <input aria-label={t("br.rooms.name")} value={r.name} onChange={(e) => setRoom(r.id, { name: e.target.value })} placeholder={t("br.rooms.name")} className={cn(inputCls, "h-8 min-w-[120px] flex-1")} />
              <select aria-label={`${r.name || t("br.rooms.name")} · ${t("br.rooms.type")}`} value={r.type} onChange={(e) => setRoom(r.id, { type: e.target.value as RoomType })} className={cn(inputCls, "h-8 w-auto")}>
                {ROOM_TYPES.map((rt) => (
                  <option key={rt} value={rt}>{t(`br.room.${rt}`)}</option>
                ))}
              </select>
              <div className="flex items-center gap-1">
                <span className="text-[11px] text-neutral-400">{t("br.rooms.cap")}</span>
                <input
                  type="number"
                  min={1}
                  aria-label={`${r.name || t("br.rooms.name")} · ${t("br.rooms.cap")}`}
                  value={r.capacity}
                  onChange={(e) => setRoom(r.id, { capacity: Math.max(1, Number(e.target.value) || 1) })}
                  className={cn(inputCls, "h-8 w-16 tnum")}
                />
              </div>
              <Toggle on={r.active} onChange={(v) => setRoom(r.id, { active: v })} label={`${r.name || t("br.rooms.name")} ${t("br.rooms.activeOf")}`} />
              <button
                onClick={() => remove(r.id)}
                aria-label={`${t("br.rooms.remove")} ${r.name}`}
                className={cn("flex h-8 w-8 items-center justify-center rounded-md text-neutral-400 transition-colors hover:bg-destructive/10 hover:text-destructive", FOCUS)}
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          );
        })}
      </div>
    </Card>
  );
}

// ── Payments & tax tab ────────────────────────────────────────────────────────
function PaymentsTab({ b, patch, t }: { b: Branch; patch: Dispatch<SetStateAction<Branch>>; t: TFn }) {
  function setPay(id: string, enabled: boolean) {
    patch((d) => ({ ...d, payments: d.payments.map((p) => (p.id === id ? { ...p, enabled } : p)) }));
  }
  const setTax = (p: Partial<Branch["tax"]>) => patch((d) => ({ ...d, tax: { ...d.tax, ...p } }));
  const country = COUNTRIES[b.country];

  return (
    <div className="space-y-4">
      <Card title={t("br.sec.payments")} icon={CreditCard}>
        <p className="mb-3 flex items-center gap-1.5 text-[12px] text-neutral-500">
          <Globe className="h-3.5 w-3.5" />
          {t("br.pay.region")} <span className="font-semibold text-neutral-700">{country.name}</span> · {country.currency}
        </p>
        <div className="space-y-2">
          {b.payments.map((p) => {
            const Icon = PAY_ICON[p.kind];
            return (
              <div key={p.id} className="flex items-center gap-3 rounded-lg border border-neutral-200 px-3 py-2">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-neutral-100 text-neutral-600">
                  <Icon className="h-4 w-4" />
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5">
                    <span className="truncate text-[13px] font-semibold text-neutral-800">{p.name}</span>
                    {p.local && <span className="rounded bg-[#034751]/10 px-1.5 py-0.5 text-[9px] font-bold uppercase text-[#034751]">{t("br.pay.local")}</span>}
                  </div>
                </div>
                <span className={cn("text-[11px] font-semibold", p.enabled ? "text-success-strong" : "text-neutral-400")}>
                  {p.enabled ? t("br.pay.on") : t("br.pay.off")}
                </span>
                <Toggle on={p.enabled} onChange={(v) => setPay(p.id, v)} label={p.name} />
              </div>
            );
          })}
        </div>
      </Card>

      <Card title={t("br.sec.tax")} icon={Receipt}>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label={t("br.f.taxId")}>
            <TextInput value={b.tax.taxId} onChange={(v) => setTax({ taxId: v })} />
          </Field>
          <Field label={t("br.f.vat")} hint={t("br.f.vatHint")}>
            <div className="relative">
              <input
                type="number"
                value={b.tax.vatRate}
                onChange={(e) => setTax({ vatRate: Math.max(0, Number(e.target.value) || 0) })}
                className={cn(inputCls, "pr-8 tnum")}
              />
              <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-sm text-neutral-400">%</span>
            </div>
          </Field>
          <Field label={t("br.f.einvoiceProvider")} full>
            <TextInput value={b.tax.eInvoiceProvider} onChange={(v) => setTax({ eInvoiceProvider: v })} />
          </Field>
        </div>
        <div className="mt-3 flex items-center justify-between rounded-lg border border-neutral-200 bg-neutral-50 px-3 py-2.5">
          <div>
            <div className="text-[12px] font-semibold text-neutral-700">{t("br.f.einvoice")}</div>
            <div className="text-[11px] text-neutral-400">{t("br.f.einvoiceHint")}</div>
          </div>
          <Toggle on={b.tax.eInvoiceEnabled} onChange={(v) => setTax({ eInvoiceEnabled: v })} label={t("br.f.einvoice")} />
        </div>
      </Card>
    </div>
  );
}

// ── Team tab ──────────────────────────────────────────────────────────────────
function TeamTab({ b, t }: { b: Branch; t: TFn }) {
  const navigate = useNavigate();
  const tiles: { label: string; value: string; icon: LucideIcon }[] = [
    { label: t("br.team.staff"), value: String(b.stats.staff), icon: Users },
    { label: t("br.team.patients"), value: b.stats.patients.toLocaleString(), icon: Stethoscope },
    { label: t("br.team.rooms"), value: String(b.rooms.length), icon: DoorOpen },
    { label: t("br.team.revenue"), value: branchMoney(b.stats.monthlyRevenue, b.country), icon: Receipt },
  ];
  return (
    <div className="space-y-4">
      <Card title={t("br.sec.overview")} icon={Activity}>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {tiles.map((tile) => (
            <div key={tile.label} className="rounded-lg border border-neutral-100 bg-neutral-50 p-3">
              <tile.icon className="h-4 w-4 text-[#034751]" />
              <div className="mt-2 text-lg font-bold leading-none tnum text-neutral-950">{tile.value}</div>
              <div className="mt-1 text-[11px] font-semibold text-neutral-500">{tile.label}</div>
            </div>
          ))}
        </div>
      </Card>

      <Card title={t("br.sec.manager")} icon={Users}>
        <div className="flex items-center gap-3">
          <span className="flex h-11 w-11 items-center justify-center rounded-full bg-[#034751] text-sm font-bold text-white">{b.manager.initials}</span>
          <div className="min-w-0">
            <div className="text-[14px] font-bold text-neutral-900">{b.manager.name}</div>
            <div className="text-[12px] text-neutral-500">{b.manager.phone}</div>
          </div>
          <span className="ml-auto rounded-md bg-[#034751]/10 px-2 py-1 text-[11px] font-semibold text-[#034751]">{t("br.team.branchManager")}</span>
        </div>
        <div className="mt-3 flex items-center justify-between rounded-lg border border-dashed border-neutral-200 px-3 py-2.5">
          <span className="text-[12px] text-neutral-500">{t("br.team.manageHint")}</span>
          <Button variant="outline" size="sm" className="gap-1.5" onClick={() => navigate("/admin/users")}>
            <Users className="h-3.5 w-3.5" />
            {t("br.team.openUsers")}
          </Button>
        </div>
      </Card>
    </div>
  );
}
