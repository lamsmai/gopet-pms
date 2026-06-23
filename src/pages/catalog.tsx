import { useMemo, useState } from "react";
import {
  Activity,
  BadgePercent,
  Bell,
  Boxes,
  CheckCircle2,
  CircleSlash,
  Database,
  FileText,
  FlaskConical,
  Layers,
  Pill,
  Plus,
  Scissors,
  Search,
  ShieldAlert,
  Stethoscope,
  Syringe,
  Tag,
  Utensils,
  X,
  type LucideIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn, vndFull } from "@/lib/utils";
import { useLang, type Lang } from "@/lib/i18n";
import {
  catalogItems as SEED,
  catalogSummary,
  CATALOG_TYPES,
  marginPct,
  PRICE_LISTS,
  priceList,
  resolveSell,
  REVENUE_CATEGORIES,
  revenueCategory,
  taxClass,
  typeMeta,
  type CatalogItem,
  type CatalogType,
  type Localized,
} from "@/lib/catalog-data";

const FOCUS = "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#034751]/40 focus-visible:ring-offset-1";
type TFn = (k: string) => string;

const TYPE_ICON: Record<CatalogType, LucideIcon> = {
  service: Stethoscope,
  product: Pill,
  procedure: Scissors,
  diagnosis: ShieldAlert,
  vaccine: Syringe,
  diet: Utensils,
  lab: FlaskConical,
};

const clone = (i: CatalogItem): CatalogItem => ({ ...i, typeConfig: { ...i.typeConfig } });
const loc = (v: Localized, lang: Lang) => v[lang];

export default function CatalogPage() {
  const { t, lang } = useLang();
  const [list, setList] = useState<CatalogItem[]>(() => SEED.map(clone));
  const [typeFilter, setTypeFilter] = useState<CatalogType | "all">("all");
  const [revFilter, setRevFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "inactive">("all");
  const [plId, setPlId] = useState<string>(PRICE_LISTS[0].id);
  const [query, setQuery] = useState("");
  const [detailId, setDetailId] = useState<string | null>(null);

  const summary = useMemo(() => catalogSummary(list), [list]);
  const detail = list.find((i) => i.id === detailId) ?? null;

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return list.filter((i) => {
      if (typeFilter !== "all" && i.type !== typeFilter) return false;
      if (revFilter !== "all" && i.revenueCategoryKey !== revFilter) return false;
      if (statusFilter === "active" && !i.active) return false;
      if (statusFilter === "inactive" && i.active) return false;
      if (q && !(`${i.name.en} ${i.name.vi} ${i.code}`.toLowerCase().includes(q))) return false;
      return true;
    });
  }, [list, typeFilter, revFilter, statusFilter, query]);

  function toggleActive(id: string) {
    setList((prev) => prev.map((i) => (i.id === id ? { ...i, active: !i.active } : i)));
  }
  function setPrice(id: string, price: number) {
    setList((prev) => prev.map((i) => (i.id === id ? { ...i, basePrice: price } : i)));
  }

  const TYPE_PILLS: { id: CatalogType | "all"; label: string; n: number }[] = [
    { id: "all", label: t("mr.type.all"), n: list.length },
    ...CATALOG_TYPES.map((tm) => ({ id: tm.id, label: t(tm.labelKey), n: list.filter((i) => i.type === tm.id).length })),
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
                  <Database className="h-3.5 w-3.5" />
                  {t("nav.admin.registry")}
                </span>
                <span className="rounded-md bg-white px-2.5 py-1 text-[12px] font-semibold text-neutral-500 ring-1 ring-neutral-200">{t("mr.sub")}</span>
              </div>
              <h1 className="mt-2 font-display text-[26px] font-bold leading-tight tracking-tight text-neutral-950">{t("mr.title")}</h1>
            </div>
            <Button className="gap-1.5"><Plus className="h-4 w-4" />{t("mr.new")}</Button>
          </div>

          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-5">
            <Kpi label={t("mr.kpi.total")} value={summary.total} icon={Layers} tone="teal" />
            <Kpi label={t("mr.kpi.active")} value={summary.active} icon={CheckCircle2} tone="green" />
            <Kpi label={t("mr.kpi.inactive")} value={summary.inactive} icon={CircleSlash} tone="rose" />
            <Kpi label={t("mr.kpi.pricelists")} value={PRICE_LISTS.length} icon={Tag} tone="blue" />
            <Kpi label={t("mr.kpi.reminders")} value={summary.reminders} icon={Bell} tone="amber" />
          </div>

          {/* Type pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
            {TYPE_PILLS.map((p) => {
              const on = typeFilter === p.id;
              const Icon = p.id === "all" ? Layers : TYPE_ICON[p.id];
              return (
                <button
                  key={p.id}
                  onClick={() => setTypeFilter(p.id)}
                  className={cn(
                    "inline-flex h-8 shrink-0 items-center gap-1.5 rounded-full border px-3 text-[12px] font-semibold transition-colors",
                    FOCUS,
                    on ? "border-[#034751] bg-[#034751] text-white" : "border-neutral-200 bg-white text-neutral-600 hover:border-[#034751]/40 hover:text-[#034751]"
                  )}
                >
                  <Icon className="h-3.5 w-3.5" />
                  {p.label}
                  <span className={cn("tnum", on ? "text-white/80" : "text-neutral-400")}>{p.n}</span>
                </button>
              );
            })}
          </div>

          {/* Toolbar */}
          <div className="flex flex-wrap items-center gap-2 pb-3">
            <div className="relative min-w-[220px] flex-1">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={t("mr.search")}
                className={cn("h-9 w-full rounded-lg border border-neutral-200 bg-white pl-9 pr-3 text-sm text-neutral-800 placeholder:text-neutral-400 focus:border-[#034751] focus:outline-none focus:ring-2 focus:ring-[#034751]/20", FOCUS)}
              />
            </div>
            <FilterSelect value={revFilter} onChange={setRevFilter} aria={t("mr.f.category")}>
              <option value="all">{t("mr.f.allCategories")}</option>
              {REVENUE_CATEGORIES.map((c) => (
                <option key={c.key} value={c.key}>{loc(c.label, lang)}</option>
              ))}
            </FilterSelect>
            <FilterSelect value={statusFilter} onChange={(v) => setStatusFilter(v as typeof statusFilter)} aria={t("mr.f.status")}>
              <option value="all">{t("mr.f.allStatus")}</option>
              <option value="active">{t("mr.st.active")}</option>
              <option value="inactive">{t("mr.st.inactive")}</option>
            </FilterSelect>
            <label className="flex items-center gap-1.5 rounded-lg border border-neutral-200 bg-white px-2.5 text-[12px] font-semibold text-neutral-500">
              <Tag className="h-3.5 w-3.5 text-[#034751]" />
              <span className="hidden sm:inline">{t("mr.priceList")}</span>
              <select
                value={plId}
                onChange={(e) => setPlId(e.target.value)}
                aria-label={t("mr.priceList")}
                className="h-9 cursor-pointer bg-transparent pr-1 text-[13px] font-semibold text-neutral-800 focus:outline-none"
              >
                {PRICE_LISTS.map((pl) => (
                  <option key={pl.id} value={pl.id}>{loc(pl.name, lang)}</option>
                ))}
              </select>
            </label>
          </div>
        </div>
      </header>

      {/* Table */}
      <div className="min-h-0 flex-1 overflow-auto">
        <div className="mx-auto max-w-[1700px] p-4">
          <div className="overflow-hidden rounded-xl border border-neutral-200 bg-white shadow-soft">
            <table className="w-full border-collapse text-left">
              <thead>
                <tr className="border-b border-neutral-200 bg-neutral-50/80 text-[11px] font-bold uppercase tracking-wide text-neutral-400">
                  <th className="px-4 py-2.5 font-bold">{t("mr.col.code")}</th>
                  <th className="px-4 py-2.5 font-bold">{t("mr.col.item")}</th>
                  <th className="px-4 py-2.5 font-bold">{t("mr.col.type")}</th>
                  <th className="hidden px-4 py-2.5 font-bold lg:table-cell">{t("mr.col.category")}</th>
                  <th className="hidden px-4 py-2.5 font-bold md:table-cell">{t("mr.col.tax")}</th>
                  <th className="px-4 py-2.5 text-right font-bold">{t("mr.col.price")}</th>
                  <th className="px-4 py-2.5 text-center font-bold">{t("mr.col.status")}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100">
                {visible.map((i) => {
                  const tm = typeMeta(i.type);
                  const Icon = TYPE_ICON[i.type];
                  const sell = resolveSell(i, plId);
                  const overridden = sell !== i.basePrice;
                  const tax = taxClass(i.taxClassKey);
                  return (
                    <tr
                      key={i.id}
                      onClick={() => setDetailId(i.id)}
                      className={cn("group cursor-pointer transition-colors hover:bg-[#034751]/[0.03]", !i.active && "opacity-55")}
                    >
                      <td className="px-4 py-2.5">
                        <span className="font-mono text-[11px] font-semibold text-neutral-500">{i.code}</span>
                      </td>
                      <td className="px-4 py-2.5">
                        <div className="flex items-center gap-2.5">
                          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg" style={{ backgroundColor: tm.soft, color: tm.accent }}>
                            <Icon className="h-4 w-4" />
                          </span>
                          <div className="min-w-0">
                            <div className="truncate text-[13px] font-semibold text-neutral-900">{i.name.en}</div>
                            <div className="truncate text-[11px] text-neutral-400">{i.name.vi}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-2.5">
                        <span className="inline-flex items-center rounded-md px-2 py-0.5 text-[11px] font-bold" style={{ backgroundColor: tm.soft, color: tm.accent }}>
                          {t(tm.labelKey)}
                        </span>
                      </td>
                      <td className="hidden px-4 py-2.5 lg:table-cell">
                        <span className="text-[12px] text-neutral-600">{loc(revenueCategory(i.revenueCategoryKey).label, lang)}</span>
                      </td>
                      <td className="hidden px-4 py-2.5 md:table-cell">
                        <span className={cn("inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[10px] font-bold", i.taxClassKey === "exempt" ? "bg-neutral-100 text-neutral-500" : "bg-info-soft text-info-strong")}>
                          <BadgePercent className="h-3 w-3" />
                          {i.taxClassKey === "exempt" ? t("mr.exempt") : `${tax.vatRate}%`}
                        </span>
                      </td>
                      <td className="px-4 py-2.5 text-right">
                        {i.type === "diagnosis" ? (
                          <span className="text-[11px] text-neutral-300">—</span>
                        ) : (
                          <span className={cn("tnum text-[13px] font-semibold", overridden ? "text-[#034751]" : "text-neutral-800")}>
                            {vndFull(sell)}
                            {overridden && <span className="ml-1 align-top text-[9px] font-bold text-[#034751]">●</span>}
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-2.5 text-center">
                        <span className={cn("inline-flex h-2 w-2 rounded-full", i.active ? "bg-[#4ABA7A]" : "bg-neutral-300")} title={i.active ? t("mr.st.active") : t("mr.st.inactive")} />
                      </td>
                    </tr>
                  );
                })}
                {visible.length === 0 && (
                  <tr>
                    <td colSpan={7} className="px-4 py-16 text-center text-[13px] text-neutral-400">{t("mr.empty")}</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          <div className="mt-2 px-1 text-[11px] text-neutral-400">
            {t("mr.showing")} <span className="tnum font-semibold text-neutral-500">{visible.length}</span> / {list.length} · {t("mr.priceList")}: <span className="font-semibold text-neutral-500">{loc(priceList(plId).name, lang)}</span>
          </div>
        </div>
      </div>

      {detail && (
        <DetailDrawer
          item={detail}
          plId={plId}
          onClose={() => setDetailId(null)}
          onToggleActive={() => toggleActive(detail.id)}
          onSetPrice={(p) => setPrice(detail.id, p)}
          t={t}
          lang={lang}
        />
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

function FilterSelect({ value, onChange, aria, children }: { value: string; onChange: (v: string) => void; aria: string; children: React.ReactNode }) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      aria-label={aria}
      className={cn("h-9 cursor-pointer rounded-lg border border-neutral-200 bg-white px-3 text-[13px] font-semibold text-neutral-700 focus:border-[#034751] focus:outline-none focus:ring-2 focus:ring-[#034751]/20", FOCUS)}
    >
      {children}
    </select>
  );
}

// ── Detail drawer ─────────────────────────────────────────────────────────────
function DetailDrawer({
  item,
  plId,
  onClose,
  onToggleActive,
  onSetPrice,
  t,
  lang,
}: {
  item: CatalogItem;
  plId: string;
  onClose: () => void;
  onToggleActive: () => void;
  onSetPrice: (price: number) => void;
  t: TFn;
  lang: Lang;
}) {
  const tm = typeMeta(item.type);
  const Icon = TYPE_ICON[item.type];
  const tax = taxClass(item.taxClassKey);
  const rev = revenueCategory(item.revenueCategoryKey);

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <button aria-label={t("cs.cancel")} onClick={onClose} className="absolute inset-0 bg-foreground/40 backdrop-blur-sm" />
      <aside className="relative flex h-full w-full max-w-[460px] flex-col bg-white shadow-lift animate-in slide-in-from-right duration-300">
        {/* Header */}
        <div className="flex items-start justify-between gap-3 border-b border-neutral-200 p-4">
          <div className="flex items-center gap-3">
            <span className="flex h-11 w-11 items-center justify-center rounded-xl" style={{ backgroundColor: tm.soft, color: tm.accent }}>
              <Icon className="h-5 w-5" />
            </span>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-display text-[18px] font-bold tracking-tight text-neutral-950">{item.name.en}</h2>
              </div>
              <div className="text-[12px] text-neutral-500">{item.name.vi} · <span className="font-mono text-[11px]">{item.code}</span></div>
            </div>
          </div>
          <button onClick={onClose} aria-label={t("cs.cancel")} className={cn("flex h-8 w-8 items-center justify-center rounded-md text-neutral-400 hover:bg-neutral-100", FOCUS)}>
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="min-h-0 flex-1 space-y-4 overflow-y-auto p-4">
          {/* Classification */}
          <Section title={t("mr.d.classification")}>
            <dl className="grid grid-cols-2 gap-2">
              <Field label={t("mr.col.type")} value={t(tm.labelKey)} />
              <Field label={t("mr.d.unit")} value={item.defaultUnit} />
              <Field label={t("mr.col.category")} value={`${loc(rev.label, lang)} · GL ${rev.glCode}`} wide />
              <Field label={t("mr.col.tax")} value={item.taxClassKey === "exempt" ? t("mr.exempt") : `${loc(tax.label, lang)}`} wide />
            </dl>
            {item.venomCode && (
              <div className="mt-2 inline-flex items-center gap-1.5 rounded-md bg-[#034751]/8 px-2 py-1 text-[11px] font-bold text-[#034751]">
                <FileText className="h-3 w-3" />
                {item.venomCode}
              </div>
            )}
          </Section>

          {/* typeConfig */}
          <Section title={t("mr.d.config")}>
            <TypeConfigBody item={item} t={t} lang={lang} />
          </Section>

          {/* Pricing across price lists */}
          {item.type !== "diagnosis" && (
            <Section title={t("mr.d.pricing")}>
              <div className="overflow-hidden rounded-lg border border-neutral-200">
                <table className="w-full text-left text-[12px]">
                  <thead>
                    <tr className="border-b border-neutral-100 bg-neutral-50 text-[10px] font-bold uppercase tracking-wide text-neutral-400">
                      <th className="px-2.5 py-1.5">{t("mr.priceList")}</th>
                      <th className="px-2.5 py-1.5 text-right">{t("mr.d.sell")}</th>
                      <th className="px-2.5 py-1.5 text-right">{t("mr.d.margin")}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-100">
                    {PRICE_LISTS.map((pl) => {
                      const sell = resolveSell(item, pl.id);
                      const m = marginPct(sell, item.buyPrice);
                      const isCurrent = pl.id === plId;
                      return (
                        <tr key={pl.id} className={cn(isCurrent && "bg-[#034751]/[0.04]")}>
                          <td className="px-2.5 py-1.5">
                            <span className="font-medium text-neutral-700">{loc(pl.name, lang)}</span>
                            {pl.isDefault && <span className="ml-1 text-[9px] font-bold uppercase text-neutral-400">{t("mr.d.default")}</span>}
                          </td>
                          <td className="px-2.5 py-1.5 text-right tnum font-semibold text-neutral-800">{vndFull(sell)}</td>
                          <td className="px-2.5 py-1.5 text-right tnum text-neutral-500">{m === null ? "—" : `${m}%`}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              {item.buyPrice != null && (
                <div className="mt-1.5 text-[11px] text-neutral-400">{t("mr.d.buy")}: <span className="tnum font-semibold text-neutral-500">{vndFull(item.buyPrice)}</span></div>
              )}

              {/* Edit default sell price */}
              <div className="mt-3 rounded-lg border border-neutral-200 bg-neutral-50 p-2.5">
                <label className="mb-1 block text-[10px] font-bold uppercase tracking-wide text-neutral-400">{t("mr.d.editBase")}</label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min={0}
                    step={1000}
                    value={item.basePrice}
                    onChange={(e) => onSetPrice(Math.max(0, Number(e.target.value) || 0))}
                    className={cn("h-9 w-full rounded-lg border border-neutral-200 bg-white px-3 text-[13px] tnum font-semibold text-neutral-800 focus:border-[#034751] focus:outline-none focus:ring-2 focus:ring-[#034751]/20", FOCUS)}
                  />
                  <span className="shrink-0 text-[12px] font-semibold text-neutral-400">VND</span>
                </div>
                <p className="mt-1.5 text-[10px] leading-snug text-neutral-400">{t("mr.d.editHint")}</p>
              </div>
            </Section>
          )}

          {/* Reminder rule (vaccines) */}
          {item.typeConfig.type === "vaccine" && (
            <Section title={t("mr.d.reminder")}>
              <div className="rounded-lg border border-[#4ABA7A]/30 bg-success-soft/60 p-3">
                <div className="flex items-center gap-2 text-[12px] font-bold text-success-strong">
                  <Bell className="h-3.5 w-3.5" />
                  {t("mr.d.dueIn")} {isoLabel(item.typeConfig.reminder.intervalIso)}
                </div>
                <div className="mt-1.5 grid grid-cols-2 gap-1.5 text-[11px] text-neutral-600">
                  <div><span className="text-neutral-400">{t("mr.d.channel")}: </span><span className="font-semibold uppercase">{item.typeConfig.reminder.channelPref}</span></div>
                  {item.typeConfig.reminder.conditions && <div className="col-span-2"><span className="text-neutral-400">{t("mr.d.conditions")}: </span>{item.typeConfig.reminder.conditions}</div>}
                </div>
                {item.typeConfig.reminder.supersedes && item.typeConfig.reminder.supersedes.length > 0 && (
                  <div className="mt-2 flex items-start gap-1.5 rounded-md bg-white/70 px-2 py-1.5 text-[10px] text-neutral-600">
                    <Activity className="mt-0.5 h-3 w-3 shrink-0 text-success-strong" />
                    <span>{t("mr.d.supersedes")} <span className="font-mono font-semibold">{item.typeConfig.reminder.supersedes.join(", ")}</span></span>
                  </div>
                )}
              </div>
            </Section>
          )}
        </div>

        {/* Footer */}
        <div className="flex shrink-0 items-center gap-2 border-t border-neutral-200 p-4">
          <Button
            variant={item.active ? "outline" : "default"}
            className="flex-1 gap-1.5"
            onClick={onToggleActive}
          >
            {item.active ? <CircleSlash className="h-4 w-4" /> : <CheckCircle2 className="h-4 w-4" />}
            {item.active ? t("mr.deactivate") : t("mr.activate")}
          </Button>
          <Button variant="outline" className="flex-1 gap-1.5"><Boxes className="h-4 w-4" />{t("mr.duplicate")}</Button>
        </div>
      </aside>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="mb-1.5 text-[11px] font-bold uppercase tracking-wide text-neutral-400">{title}</div>
      {children}
    </div>
  );
}

function Field({ label, value, wide }: { label: string; value: string; wide?: boolean }) {
  return (
    <div className={cn("rounded-lg border border-neutral-100 bg-neutral-50 px-2.5 py-2", wide && "col-span-2")}>
      <dt className="text-[10px] font-semibold uppercase tracking-wide text-neutral-400">{label}</dt>
      <dd className="mt-0.5 truncate text-[13px] font-semibold text-neutral-800">{value}</dd>
    </div>
  );
}

function TypeConfigBody({ item, t, lang }: { item: CatalogItem; t: TFn; lang: Lang }) {
  const c = item.typeConfig;
  const rows: { label: string; value: string }[] = [];
  switch (c.type) {
    case "service":
      if (c.durationMin) rows.push({ label: t("mr.cfg.duration"), value: `${c.durationMin} ${t("mr.cfg.min")}` });
      rows.push({ label: t("mr.cfg.resource"), value: c.resource });
      if (c.signOffRequired) rows.push({ label: t("mr.cfg.signoff"), value: t("mr.yes") });
      break;
    case "product":
      rows.push({ label: t("mr.cfg.sku"), value: c.inventorySku });
      if (c.dispensingFee) rows.push({ label: t("mr.cfg.dispFee"), value: vndFull(c.dispensingFee) });
      break;
    case "procedure":
      rows.push({ label: t("mr.cfg.board"), value: c.boardPhase });
      if (c.consentForm) rows.push({ label: t("mr.cfg.consent"), value: c.consentForm });
      rows.push({ label: t("mr.cfg.anesthesia"), value: c.anesthesia ? t("mr.yes") : t("mr.no") });
      break;
    case "diagnosis":
      rows.push({ label: t("mr.cfg.notifiable"), value: c.notifiable ? t("mr.cfg.notifiableYes") : t("mr.no") });
      break;
    case "vaccine":
      rows.push({ label: t("mr.cfg.route"), value: c.route });
      rows.push({ label: t("mr.cfg.manufacturer"), value: c.manufacturer });
      rows.push({ label: t("mr.cfg.rabies"), value: c.isRabies ? t("mr.yes") : t("mr.no") });
      break;
    case "diet":
      rows.push({ label: t("mr.cfg.feedingPlan"), value: c.feedingPlan });
      break;
    case "lab":
      rows.push({ label: t("mr.cfg.tat"), value: c.tat });
      rows.push({ label: t("mr.cfg.external"), value: c.external ? t("mr.cfg.externalLab") : t("mr.cfg.internalLab") });
      if (c.panel?.length) rows.push({ label: t("mr.cfg.panel"), value: c.panel.join(", ") });
      break;
  }
  return (
    <dl className="grid grid-cols-2 gap-2">
      {rows.map((r) => (
        <Field key={r.label} label={r.label} value={r.value} wide={r.value.length > 22} />
      ))}
    </dl>
  );
}

/** P1Y → "1 year", P6M → "6 months", P3Y → "3 years" (display only). */
function isoLabel(iso: string): string {
  const m = iso.match(/^P(\d+)([YM])$/);
  if (!m) return iso;
  const n = Number(m[1]);
  const unit = m[2] === "Y" ? (n === 1 ? "year" : "years") : (n === 1 ? "month" : "months");
  return `${n} ${unit}`;
}
