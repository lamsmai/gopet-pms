import { useMemo, useState } from "react";
import {
  AlertTriangle,
  Banknote,
  CheckCircle2,
  CreditCard,
  Download,
  FileText,
  Landmark,
  Minus,
  Plus,
  QrCode,
  Receipt,
  ReceiptText,
  RefreshCw,
  Search,
  ShoppingCart,
  Trash2,
  Wallet,
  X,
  type LucideIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn, vnd, vndFull } from "@/lib/utils";
import { useLang } from "@/lib/i18n";
import {
  balanceOf,
  billingSummary,
  eInvoices,
  invoices as INV_SEED,
  PAY_METHODS,
  payMethod,
  PRODUCT_CLASSES,
  products,
  type EInvoiceStatus,
  type Invoice,
  type InvoiceStatus,
  type PayMethodId,
  type Product,
  type ProductClass,
} from "@/lib/billing-data";

export type BillingView = "invoices" | "payments" | "counter" | "einvoice";
type TFn = (k: string) => string;
const FOCUS = "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#034751]/40 focus-visible:ring-offset-1";

const PAY_KIND_ICON: Record<string, LucideIcon> = { qr: QrCode, wallet: Wallet, cash: Banknote, card: CreditCard, bank: Landmark };

const INV_STATUS: Record<InvoiceStatus, string> = {
  draft: "bg-neutral-100 text-neutral-600",
  issued: "bg-info-soft text-info-strong",
  partial: "bg-warning-soft text-warning-foreground",
  paid: "bg-success-soft text-success-strong",
  overdue: "bg-destructive/10 text-destructive",
  cancelled: "bg-neutral-100 text-neutral-400",
};

const cloneInv = (i: Invoice): Invoice => ({ ...i, items: i.items.map((x) => ({ ...x })) });

export default function BillingPage({ initialView = "invoices" }: { initialView?: BillingView }) {
  const { t } = useLang();
  const [view, setView] = useState<BillingView>(initialView);
  const [list, setList] = useState<Invoice[]>(() => INV_SEED.map(cloneInv));
  const [payId, setPayId] = useState<string | null>(null);

  function collect(id: string) {
    setPayId(id);
    setView("payments");
  }

  const TABS: { id: BillingView; key: string; icon: LucideIcon }[] = [
    { id: "invoices", key: "bl.tab.invoices", icon: ReceiptText },
    { id: "payments", key: "bl.tab.payments", icon: CreditCard },
    { id: "counter", key: "bl.tab.counter", icon: ShoppingCart },
    { id: "einvoice", key: "bl.tab.einvoice", icon: FileText },
  ];

  return (
    <div className="flex h-full flex-col bg-[#F7F9F8]">
      <header className="shrink-0 border-b border-neutral-200 bg-white px-5 pt-4">
        <div className="mx-auto flex max-w-[1600px] flex-col gap-3">
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-md bg-[#034751]/10 px-2.5 py-1 text-[12px] font-bold text-[#034751]">
              <Receipt className="h-3.5 w-3.5" />
              {t("nav.billing")}
            </span>
            <span className="rounded-md bg-white px-2.5 py-1 text-[12px] font-semibold text-neutral-500 ring-1 ring-neutral-200">{t("bl.vnFirst")}</span>
          </div>
          <h1 className="font-display text-[26px] font-bold leading-tight tracking-tight text-neutral-950">{t("bl.title")}</h1>
          <nav className="-mb-px flex items-center gap-0.5 overflow-x-auto">
            {TABS.map((tb) => {
              const on = view === tb.id;
              return (
                <button
                  key={tb.id}
                  onClick={() => setView(tb.id)}
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
      </header>

      <div className="min-h-0 flex-1">
        {view === "invoices" && <InvoicesTab list={list} onCollect={collect} t={t} />}
        {view === "payments" && <PaymentsTab list={list} setList={setList} payId={payId} setPayId={setPayId} t={t} />}
        {view === "counter" && <CounterTab t={t} />}
        {view === "einvoice" && <EInvoiceTab t={t} />}
      </div>
    </div>
  );
}

function Kpi({ label, value, icon: Icon, tone }: { label: string; value: string; icon: LucideIcon; tone: "teal" | "rose" | "green" | "amber" }) {
  const tones: Record<string, string> = {
    teal: "bg-[#034751]/10 text-[#034751]",
    rose: "bg-destructive/10 text-destructive",
    green: "bg-success-soft text-success-strong",
    amber: "bg-amber-50 text-amber-700",
  };
  return (
    <div className="flex items-center gap-2.5 rounded-lg border border-neutral-200 bg-white px-3 py-2 shadow-soft">
      <span className={cn("flex h-8 w-8 shrink-0 items-center justify-center rounded-md", tones[tone])}>
        <Icon className="h-4 w-4" />
      </span>
      <div className="min-w-0">
        <div className="truncate text-lg font-bold leading-none tnum text-neutral-950">{value}</div>
        <div className="mt-0.5 truncate text-[11px] font-semibold text-neutral-500">{label}</div>
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════════════
// INVOICES
// ════════════════════════════════════════════════════════════════════════════
type InvFilter = "all" | "outstanding" | "overdue" | "paid" | "draft";

function InvoicesTab({ list, onCollect, t }: { list: Invoice[]; onCollect: (id: string) => void; t: TFn }) {
  const [q, setQ] = useState("");
  const [filter, setFilter] = useState<InvFilter>("all");
  const sum = useMemo(() => billingSummary(list), [list]);

  const rows = useMemo(() => {
    const query = q.trim().toLowerCase();
    return list.filter((i) => {
      if (filter === "outstanding" && (i.status === "paid" || balanceOf(i) <= 0)) return false;
      if (filter === "overdue" && i.status !== "overdue") return false;
      if (filter === "paid" && i.status !== "paid") return false;
      if (filter === "draft" && i.status !== "draft") return false;
      if (!query) return true;
      return [i.id, i.owner, i.pet].some((f) => f.toLowerCase().includes(query));
    });
  }, [list, q, filter]);

  const FILTERS: { id: InvFilter; key: string }[] = [
    { id: "all", key: "bl.f.all" },
    { id: "outstanding", key: "bl.f.outstanding" },
    { id: "overdue", key: "bl.f.overdue" },
    { id: "paid", key: "bl.f.paid" },
    { id: "draft", key: "bl.f.draft" },
  ];

  return (
    <div className="h-full overflow-y-auto">
      <div className="mx-auto max-w-[1400px] space-y-4 p-5">
        <div className="grid grid-cols-2 gap-2 lg:grid-cols-4">
          <Kpi label={t("bl.kpi.outstanding")} value={`${vnd(sum.outstanding)} ₫`} icon={ReceiptText} tone="teal" />
          <Kpi label={t("bl.kpi.overdue")} value={String(sum.overdue)} icon={AlertTriangle} tone="rose" />
          <Kpi label={t("bl.kpi.paidToday")} value={`${vnd(sum.paidToday)} ₫`} icon={CheckCircle2} tone="green" />
          <Kpi label={t("bl.kpi.drafts")} value={String(sum.drafts)} icon={FileText} tone="amber" />
        </div>

        <div className="flex flex-wrap items-center gap-2.5 rounded-lg border border-neutral-200 bg-white p-3 shadow-soft">
          <div className="relative min-w-[220px] flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder={t("bl.search")}
              aria-label={t("bl.search")}
              className={cn("h-9 w-full rounded-lg border border-neutral-200 bg-white pl-9 pr-3 text-sm text-neutral-800 placeholder:text-neutral-400 focus:border-[#034751] focus:outline-none focus:ring-2 focus:ring-[#034751]/20")}
            />
          </div>
          <div className="flex flex-wrap items-center gap-1.5">
            {FILTERS.map((f) => (
              <button
                key={f.id}
                onClick={() => setFilter(f.id)}
                className={cn("inline-flex h-8 items-center rounded-full border px-3 text-[12px] font-semibold transition-colors", FOCUS, filter === f.id ? "border-[#034751] bg-[#034751] text-white" : "border-neutral-200 bg-white text-neutral-600 hover:border-[#034751]/40 hover:text-[#034751]")}
              >
                {t(f.key)}
              </button>
            ))}
          </div>
          <Button variant="outline" size="sm" className="gap-1.5"><Download className="h-3.5 w-3.5" />{t("bl.export")}</Button>
          <Button size="sm" className="gap-1.5"><Plus className="h-3.5 w-3.5" />{t("bl.newInvoice")}</Button>
        </div>

        <div className="overflow-hidden rounded-lg border border-neutral-200 bg-white shadow-soft">
          <table className="w-full border-collapse text-left text-sm">
            <thead>
              <tr className="border-b border-neutral-200 bg-neutral-50 text-[11px] font-bold uppercase tracking-wide text-neutral-400">
                <th className="px-4 py-3">{t("bl.col.invoice")}</th>
                <th className="px-4 py-3">{t("bl.col.client")}</th>
                <th className="px-4 py-3">{t("bl.col.date")}</th>
                <th className="px-4 py-3 text-right">{t("bl.col.amount")}</th>
                <th className="px-4 py-3 text-right">{t("bl.col.balance")}</th>
                <th className="px-4 py-3">{t("bl.col.status")}</th>
                <th className="px-4 py-3 text-right">{t("bl.col.actions")}</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((i) => {
                const bal = balanceOf(i);
                return (
                  <tr key={i.id} className="border-b border-neutral-100 last:border-0 hover:bg-neutral-50">
                    <td className="px-4 py-3">
                      <div className="font-mono text-[12px] font-bold text-neutral-900">{i.id}</div>
                      <div className="text-[11px] text-neutral-400">{i.items.length} {t("bl.lineItems")}</div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="font-semibold text-neutral-900">{i.owner}</div>
                      <div className="text-[11px] text-[#034751]">{i.pet}</div>
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-[12px] text-neutral-500">
                      {i.date}
                      {i.daysOverdue > 0 && <div className="text-[11px] font-semibold text-destructive">{i.daysOverdue} {t("bl.daysOverdue")}</div>}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-right font-semibold tnum text-neutral-800">{vndFull(i.amount)}</td>
                    <td className={cn("whitespace-nowrap px-4 py-3 text-right font-semibold tnum", bal > 0 ? "text-destructive" : "text-success-strong")}>
                      {bal > 0 ? vndFull(bal) : t("bl.cleared")}
                    </td>
                    <td className="px-4 py-3"><span className={cn("rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide", INV_STATUS[i.status])}>{t(`bl.st.${i.status}`)}</span></td>
                    <td className="px-4 py-3 text-right">
                      {bal > 0 ? (
                        <Button size="xs" className="gap-1" onClick={() => onCollect(i.id)}>
                          <CreditCard className="h-3 w-3" />
                          {t("bl.collect")}
                        </Button>
                      ) : (
                        <span className="text-[12px] font-medium text-neutral-300">—</span>
                      )}
                    </td>
                  </tr>
                );
              })}
              {rows.length === 0 && (
                <tr><td colSpan={7} className="px-4 py-10 text-center text-sm text-neutral-400">{t("bl.empty")}</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════════════
// PAYMENTS
// ════════════════════════════════════════════════════════════════════════════
type Split = { id: string; method: PayMethodId; amount: number };
let splitSeq = 0;

function PaymentsTab({ list, setList, payId, setPayId, t }: { list: Invoice[]; setList: React.Dispatch<React.SetStateAction<Invoice[]>>; payId: string | null; setPayId: (id: string | null) => void; t: TFn }) {
  const payable = list.filter((i) => balanceOf(i) > 0 && i.status !== "cancelled");
  const active = list.find((i) => i.id === payId) ?? payable[0];
  const balance = active ? balanceOf(active) : 0;

  const [splits, setSplits] = useState<Split[]>(() => [{ id: `s${splitSeq++}`, method: "vietqr", amount: balance }]);
  const [done, setDone] = useState<{ total: number } | null>(null);

  // Re-seed the split when the active invoice changes.
  const [seededFor, setSeededFor] = useState<string | undefined>(active?.id);
  if (active && active.id !== seededFor) {
    setSeededFor(active.id);
    setSplits([{ id: `s${splitSeq++}`, method: "vietqr", amount: balanceOf(active) }]);
    setDone(null);
  }

  if (!active) {
    return (
      <div className="flex h-full flex-col items-center justify-center p-8 text-center">
        <span className="mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-success-soft text-success-strong"><CheckCircle2 className="h-6 w-6" /></span>
        <p className="text-sm font-medium text-neutral-500">{t("bl.pay.allClear")}</p>
      </div>
    );
  }

  // Keep the just-paid invoice in the picker options so the controlled <select> value stays valid on the success screen.
  const options = payable.some((i) => i.id === active.id) ? payable : [active, ...payable];
  const allocated = splits.reduce((s, x) => s + (Number.isFinite(x.amount) ? x.amount : 0), 0);
  const remaining = balance - allocated;
  const qrSplit = splits.find((s) => payMethod(s.method).showsQr);

  function setSplit(id: string, p: Partial<Split>) {
    setSplits((prev) => prev.map((s) => (s.id === id ? { ...s, ...p } : s)));
  }
  function addSplit() {
    setSplits((prev) => [...prev, { id: `s${splitSeq++}`, method: "cash", amount: Math.max(0, remaining) }]);
  }
  function record() {
    const pay = Math.min(allocated, balance);
    if (pay <= 0) return;
    setList((prev) =>
      prev.map((i) => {
        if (i.id !== active.id) return i;
        const paid = i.paid + pay;
        const status: InvoiceStatus = paid >= i.amount ? "paid" : "partial";
        return { ...i, paid, status, daysOverdue: status === "paid" ? 0 : i.daysOverdue };
      })
    );
    // Pin the active invoice so a full payment doesn't shift `active` to the next
    // payable one (which would re-seed splits and clear this success screen).
    setPayId(active.id);
    setDone({ total: pay });
  }

  return (
    <div className="h-full overflow-y-auto">
      <div className="mx-auto grid max-w-[1300px] gap-4 p-5 lg:grid-cols-[1fr_380px]">
        {/* Left — invoice + methods */}
        <div className="space-y-4">
          <section className="rounded-xl border border-neutral-200 bg-white p-4 shadow-soft">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="font-display text-[15px] font-bold text-neutral-900">{t("bl.pay.invoice")}</h3>
              <select
                value={active.id}
                onChange={(e) => setPayId(e.target.value)}
                aria-label={t("bl.pay.invoice")}
                className="h-8 rounded-lg border border-neutral-200 bg-white px-2 text-[12px] font-semibold text-neutral-700 focus:border-[#034751] focus:outline-none"
              >
                {options.map((i) => (
                  <option key={i.id} value={i.id}>{i.id} · {i.owner}</option>
                ))}
              </select>
            </div>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              <Ctx label={t("bl.pay.client")} value={active.owner} />
              <Ctx label={t("bl.pay.patient")} value={active.pet} />
              <Ctx label={t("bl.pay.total")} value={vndFull(active.amount)} />
              <Ctx label={t("bl.pay.balance")} value={vndFull(balance)} danger />
            </div>
          </section>

          {done ? (
            <section className="rounded-xl border border-success/30 bg-success-soft p-6 text-center shadow-soft">
              <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-white text-success-strong"><CheckCircle2 className="h-6 w-6" /></span>
              <h3 className="mt-2 font-display text-lg font-bold text-neutral-900">{t("bl.pay.recorded")}</h3>
              <p className="mt-1 text-sm text-neutral-600">{vndFull(done.total)} · {active.id}</p>
              <Button className="mt-4" onClick={() => { setDone(null); const next = list.find((i) => balanceOf(i) > 0); if (next) setPayId(next.id); }}>{t("bl.pay.next")}</Button>
            </section>
          ) : (
            <section className="rounded-xl border border-neutral-200 bg-white p-4 shadow-soft">
              <div className="mb-3 flex items-center justify-between">
                <h3 className="font-display text-[15px] font-bold text-neutral-900">{t("bl.pay.method")}</h3>
                <Button variant="outline" size="xs" className="gap-1" onClick={addSplit}><Plus className="h-3 w-3" />{t("bl.pay.addSplit")}</Button>
              </div>

              <div className="space-y-2">
                {splits.map((s, idx) => (
                  <div key={s.id} className="flex items-center gap-2">
                    <select
                      value={s.method}
                      onChange={(e) => setSplit(s.id, { method: e.target.value as PayMethodId })}
                      aria-label={`${t("bl.pay.method")} ${idx + 1}`}
                      className="h-9 flex-1 rounded-lg border border-neutral-200 bg-white px-2.5 text-sm font-medium text-neutral-700 focus:border-[#034751] focus:outline-none"
                    >
                      {PAY_METHODS.map((m) => (
                        <option key={m.id} value={m.id}>{m.name}</option>
                      ))}
                    </select>
                    <div className="relative w-40">
                      <input
                        type="number"
                        min={0}
                        value={s.amount}
                        onChange={(e) => setSplit(s.id, { amount: Math.max(0, Number(e.target.value) || 0) })}
                        aria-label={`${t("bl.pay.amount")} ${idx + 1}`}
                        className="h-9 w-full rounded-lg border border-neutral-200 bg-white pl-3 pr-7 text-right text-sm tnum text-neutral-800 focus:border-[#034751] focus:outline-none focus:ring-2 focus:ring-[#034751]/20"
                      />
                      <span className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-neutral-400">₫</span>
                    </div>
                    {splits.length > 1 && (
                      <button onClick={() => setSplits((prev) => prev.filter((x) => x.id !== s.id))} aria-label={t("bl.pay.removeSplit")} className={cn("flex h-9 w-9 items-center justify-center rounded-md text-neutral-400 hover:bg-destructive/10 hover:text-destructive", FOCUS)}>
                        <Trash2 className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                ))}
              </div>

              <div className="mt-3 grid grid-cols-7 gap-1.5">
                {PAY_METHODS.map((m) => {
                  const Icon = PAY_KIND_ICON[m.kind];
                  const on = splits[0]?.method === m.id;
                  return (
                    <button
                      key={m.id}
                      onClick={() => setSplit(splits[0].id, { method: m.id })}
                      title={m.name}
                      aria-label={m.name}
                      className={cn("flex flex-col items-center gap-1 rounded-lg border px-1 py-2 text-[9px] font-semibold transition-all", FOCUS, on ? "border-[#034751] ring-2 ring-[#034751]/15" : "border-neutral-200 hover:border-[#034751]/40")}
                    >
                      <Icon className="h-4 w-4" style={{ color: m.accent }} />
                      <span className="w-full truncate text-center text-neutral-600">{m.name}</span>
                    </button>
                  );
                })}
              </div>

              <div className="mt-3 space-y-1 border-t border-neutral-100 pt-3 text-[13px]">
                <Row label={t("bl.pay.allocated")} value={vndFull(allocated)} />
                <Row label={t("bl.pay.remaining")} value={vndFull(Math.max(0, remaining))} tone={remaining > 0 ? "amber" : "green"} />
              </div>
              <Button className="mt-3 w-full gap-1.5" disabled={allocated <= 0} onClick={record}>
                <CheckCircle2 className="h-4 w-4" />
                {t("bl.pay.record")}
              </Button>
            </section>
          )}
        </div>

        {/* Right — QR / details */}
        <aside className="lg:sticky lg:top-0 lg:h-fit">
          <section className="rounded-xl border border-neutral-200 bg-white p-4 shadow-soft">
            <h3 className="mb-3 font-display text-[15px] font-bold text-neutral-900">{t("bl.pay.preview")}</h3>
            {qrSplit ? (
              <div className="flex flex-col items-center">
                <div className="rounded-2xl border-2 p-3" style={{ borderColor: payMethod(qrSplit.method).accent }}>
                  <QrPlaceholder seed={`${active.id}-${qrSplit.method}-${qrSplit.amount}`} />
                </div>
                <div className="mt-3 inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-[12px] font-bold" style={{ backgroundColor: `${payMethod(qrSplit.method).accent}1A`, color: payMethod(qrSplit.method).accent }}>
                  <QrCode className="h-3.5 w-3.5" />
                  {payMethod(qrSplit.method).name}
                </div>
                <div className="mt-2 text-2xl font-bold tnum text-neutral-950">{vndFull(qrSplit.amount)}</div>
                <p className="mt-1 text-center text-[12px] text-neutral-500">{t("bl.pay.scanHint")}</p>
              </div>
            ) : (
              <div className="flex flex-col items-center py-6 text-center">
                <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-neutral-100 text-neutral-500">
                  {(() => {
                    const Icon = PAY_KIND_ICON[payMethod(splits[0].method).kind];
                    return <Icon className="h-7 w-7" />;
                  })()}
                </span>
                <div className="mt-2 text-[14px] font-bold text-neutral-800">{payMethod(splits[0].method).name}</div>
                <div className="mt-1 text-xl font-bold tnum text-neutral-950">{vndFull(splits[0].amount)}</div>
                <p className="mt-1 text-[12px] text-neutral-500">{t(`bl.pay.kind.${payMethod(splits[0].method).kind}`)}</p>
              </div>
            )}
            <div className="mt-3 space-y-1 border-t border-neutral-100 pt-3 text-[12px]">
              <Row label={t("bl.pay.invoiceNo")} value={active.id} mono />
              <Row label={t("bl.pay.splits")} value={String(splits.length)} />
            </div>
          </section>
        </aside>
      </div>
    </div>
  );
}

function Ctx({ label, value, danger }: { label: string; value: string; danger?: boolean }) {
  return (
    <div className="rounded-lg border border-neutral-100 bg-neutral-50 px-2.5 py-2">
      <div className="text-[10px] font-semibold uppercase tracking-wide text-neutral-400">{label}</div>
      <div className={cn("mt-0.5 truncate text-[13px] font-bold tnum", danger ? "text-destructive" : "text-neutral-800")}>{value}</div>
    </div>
  );
}

function Row({ label, value, tone, mono }: { label: string; value: string; tone?: "amber" | "green"; mono?: boolean }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-neutral-500">{label}</span>
      <span className={cn("font-bold tnum", mono && "font-mono", tone === "amber" ? "text-amber-700" : tone === "green" ? "text-success-strong" : "text-neutral-800")}>{value}</span>
    </div>
  );
}

function hashStr(s: string) {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

/** Deterministic QR-style graphic (decorative placeholder, not a real QR code). */
function QrPlaceholder({ seed }: { seed: string }) {
  const N = 21;
  const cells = useMemo(() => {
    const out: boolean[] = [];
    const inBox = (r: number, c: number, br: number, bc: number) => r >= br && r < br + 7 && c >= bc && c < bc + 7;
    const finder = (r: number, c: number, br: number, bc: number) => {
      const rr = r - br;
      const cc = c - bc;
      if (rr === 0 || rr === 6 || cc === 0 || cc === 6) return true;
      return rr >= 2 && rr <= 4 && cc >= 2 && cc <= 4;
    };
    let h = hashStr(seed);
    for (let r = 0; r < N; r++) {
      for (let c = 0; c < N; c++) {
        if (inBox(r, c, 0, 0)) out.push(finder(r, c, 0, 0));
        else if (inBox(r, c, 0, N - 7)) out.push(finder(r, c, 0, N - 7));
        else if (inBox(r, c, N - 7, 0)) out.push(finder(r, c, N - 7, 0));
        else {
          h = (Math.imul(h, 1103515245) + 12345) & 0x7fffffff;
          out.push(h % 100 < 47);
        }
      }
    }
    return out;
  }, [seed]);
  return (
    <svg viewBox={`0 0 ${N} ${N}`} className="h-40 w-40 text-neutral-900" shapeRendering="crispEdges" role="img" aria-label="Payment QR code">
      <rect x="0" y="0" width={N} height={N} fill="white" />
      {cells.map((on, i) => (on ? <rect key={i} x={i % N} y={Math.floor(i / N)} width="1" height="1" fill="currentColor" /> : null))}
    </svg>
  );
}

// ════════════════════════════════════════════════════════════════════════════
// COUNTER SALES (POS)
// ════════════════════════════════════════════════════════════════════════════
type CartLine = { product: Product; qty: number };

function CounterTab({ t }: { t: TFn }) {
  const [q, setQ] = useState("");
  const [cls, setCls] = useState<"all" | ProductClass>("all");
  const [cart, setCart] = useState<CartLine[]>([]);
  const [done, setDone] = useState<number | null>(null);

  const shown = useMemo(() => {
    const query = q.trim().toLowerCase();
    return products.filter((p) => {
      if (cls !== "all" && p.class !== cls) return false;
      if (!query) return true;
      return [p.name, p.sku].some((f) => f.toLowerCase().includes(query));
    });
  }, [q, cls]);

  function add(p: Product) {
    setDone(null);
    setCart((prev) => {
      const found = prev.find((l) => l.product.id === p.id);
      if (found) return prev.map((l) => (l.product.id === p.id ? { ...l, qty: l.qty + 1 } : l));
      return [...prev, { product: p, qty: 1 }];
    });
  }
  function setQty(id: string, delta: number) {
    setCart((prev) => prev.flatMap((l) => (l.product.id === id ? (l.qty + delta <= 0 ? [] : [{ ...l, qty: l.qty + delta }]) : [l])));
  }
  function removeLine(id: string) {
    setCart((prev) => prev.filter((l) => l.product.id !== id));
  }

  const subtotal = cart.reduce((s, l) => s + l.product.price * l.qty, 0);
  const vat = Math.round(subtotal * 0.08);
  const total = subtotal + vat;

  return (
    <div className="h-full overflow-hidden">
      <div className="mx-auto grid h-full max-w-[1500px] grid-cols-1 lg:grid-cols-[1fr_360px]">
        {/* Catalog */}
        <div className="flex min-h-0 flex-col p-5">
          <div className="mb-3 flex flex-wrap items-center gap-2">
            <div className="relative min-w-[220px] flex-1">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder={t("bl.pos.search")}
                aria-label={t("bl.pos.search")}
                className="h-9 w-full rounded-lg border border-neutral-200 bg-white pl-9 pr-3 text-sm text-neutral-800 placeholder:text-neutral-400 focus:border-[#034751] focus:outline-none focus:ring-2 focus:ring-[#034751]/20"
              />
            </div>
            {(["all", ...PRODUCT_CLASSES] as const).map((c) => (
              <button
                key={c}
                onClick={() => setCls(c)}
                className={cn("inline-flex h-8 items-center rounded-full border px-3 text-[12px] font-semibold transition-colors", FOCUS, cls === c ? "border-[#034751] bg-[#034751] text-white" : "border-neutral-200 bg-white text-neutral-600 hover:border-[#034751]/40 hover:text-[#034751]")}
              >
                {c === "all" ? t("bl.f.all") : t(`bl.pos.cls.${c}`)}
              </button>
            ))}
          </div>
          <div className="min-h-0 flex-1 overflow-y-auto">
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 xl:grid-cols-4">
              {shown.map((p) => (
                <button
                  key={p.id}
                  onClick={() => add(p)}
                  className={cn("flex flex-col rounded-lg border border-neutral-200 bg-white p-3 text-left shadow-soft transition-all hover:-translate-y-0.5 hover:border-[#034751]/40 hover:shadow-card", FOCUS)}
                >
                  <span className="inline-flex w-fit rounded-md bg-[#034751]/8 px-1.5 py-0.5 text-[9px] font-bold uppercase text-[#034751]">{t(`bl.pos.cls.${p.class}`)}</span>
                  <span className="mt-1.5 line-clamp-2 text-[13px] font-semibold leading-tight text-neutral-900">{p.name}</span>
                  <span className="mt-auto pt-2 font-bold tnum text-[#034751]">{vndFull(p.price)}</span>
                  <span className="text-[10px] text-neutral-400">{t("bl.pos.stock")}: {p.stock}</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Cart */}
        <aside className="flex min-h-0 flex-col border-l border-neutral-200 bg-white">
          <div className="flex shrink-0 items-center gap-2 border-b border-neutral-200 p-4">
            <ShoppingCart className="h-5 w-5 text-[#034751]" />
            <h3 className="font-display text-[15px] font-bold text-neutral-900">{t("bl.pos.cart")}</h3>
            <span className="ml-auto flex h-5 min-w-5 items-center justify-center rounded-full bg-[#034751] px-1.5 text-[11px] font-bold text-white">{cart.reduce((s, l) => s + l.qty, 0)}</span>
          </div>

          {done !== null ? (
            <div className="flex flex-1 flex-col items-center justify-center p-6 text-center">
              <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-success-soft text-success-strong"><CheckCircle2 className="h-7 w-7" /></span>
              <h4 className="mt-3 font-display text-lg font-bold text-neutral-900">{t("bl.pos.completed")}</h4>
              <p className="mt-1 text-sm text-neutral-600">{vndFull(done)}</p>
              <Button className="mt-4" onClick={() => setDone(null)}>{t("bl.pos.newSale")}</Button>
            </div>
          ) : (
            <>
              <div className="min-h-0 flex-1 overflow-y-auto p-3">
                {cart.length === 0 ? (
                  <p className="py-10 text-center text-sm text-neutral-400">{t("bl.pos.empty")}</p>
                ) : (
                  <div className="space-y-2">
                    {cart.map((l) => (
                      <div key={l.product.id} className="flex items-center gap-2 rounded-lg border border-neutral-100 p-2">
                        <div className="min-w-0 flex-1">
                          <div className="truncate text-[12px] font-semibold text-neutral-800">{l.product.name}</div>
                          <div className="tnum text-[11px] text-neutral-400">{vndFull(l.product.price)}</div>
                        </div>
                        <div className="flex items-center gap-1">
                          <button onClick={() => setQty(l.product.id, -1)} aria-label={t("bl.pos.dec")} className={cn("flex h-6 w-6 items-center justify-center rounded-md border border-neutral-200 text-neutral-500 hover:border-[#034751] hover:text-[#034751]", FOCUS)}><Minus className="h-3 w-3" /></button>
                          <span className="w-6 text-center text-[13px] font-bold tnum">{l.qty}</span>
                          <button onClick={() => setQty(l.product.id, 1)} aria-label={t("bl.pos.inc")} className={cn("flex h-6 w-6 items-center justify-center rounded-md border border-neutral-200 text-neutral-500 hover:border-[#034751] hover:text-[#034751]", FOCUS)}><Plus className="h-3 w-3" /></button>
                        </div>
                        <div className="w-20 text-right text-[12px] font-bold tnum text-neutral-900">{vndFull(l.product.price * l.qty)}</div>
                        <button onClick={() => removeLine(l.product.id)} aria-label={t("bl.pos.remove")} className={cn("flex h-7 w-7 items-center justify-center rounded-md text-neutral-400 hover:bg-destructive/10 hover:text-destructive", FOCUS)}><X className="h-3.5 w-3.5" /></button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <div className="shrink-0 space-y-1 border-t border-neutral-200 p-4 text-[13px]">
                <Row label={t("bl.pos.subtotal")} value={vndFull(subtotal)} />
                <Row label={t("bl.pos.vat")} value={vndFull(vat)} />
                <div className="flex items-center justify-between border-t border-neutral-100 pt-2">
                  <span className="font-display text-[15px] font-bold text-neutral-900">{t("bl.pos.total")}</span>
                  <span className="font-display text-[18px] font-bold tnum text-[#034751]">{vndFull(total)}</span>
                </div>
                <Button className="mt-2 w-full gap-1.5" disabled={cart.length === 0} onClick={() => { setDone(total); setCart([]); }}>
                  <CreditCard className="h-4 w-4" />
                  {t("bl.pos.checkout")}
                </Button>
              </div>
            </>
          )}
        </aside>
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════════════
// E-INVOICE (VN)
// ════════════════════════════════════════════════════════════════════════════
const EINV_STATUS: Record<EInvoiceStatus, string> = {
  signed: "bg-success-soft text-success-strong",
  pending: "bg-warning-soft text-warning-foreground",
  error: "bg-destructive/10 text-destructive",
  draft: "bg-neutral-100 text-neutral-600",
};

function EInvoiceTab({ t }: { t: TFn }) {
  const [q, setQ] = useState("");
  const [syncing, setSyncing] = useState(false);
  const rows = eInvoices.filter((e) => {
    const query = q.trim().toLowerCase();
    if (!query) return true;
    return [e.id, e.invoiceNumber, e.owner, e.maCQT].some((f) => f.toLowerCase().includes(query));
  });

  return (
    <div className="h-full overflow-y-auto">
      <div className="mx-auto max-w-[1400px] space-y-4 p-5">
        <div className="flex items-center gap-3 rounded-lg border border-info/30 bg-info-soft px-4 py-3">
          <FileText className="h-5 w-5 shrink-0 text-info-strong" />
          <p className="text-[13px] text-neutral-700">{t("bl.einv.banner")} <span className="font-bold text-info-strong">VNPT-Invoice</span></p>
          <span className="ml-auto inline-flex items-center gap-1.5 rounded-md bg-white px-2 py-1 text-[11px] font-semibold text-success-strong"><span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />{t("bl.einv.connected")}</span>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 rounded-lg border border-neutral-200 bg-white p-3 shadow-soft">
          <div className="relative min-w-[220px] flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder={t("bl.einv.search")} aria-label={t("bl.einv.search")} className="h-9 w-full rounded-lg border border-neutral-200 bg-white pl-9 pr-3 text-sm text-neutral-800 placeholder:text-neutral-400 focus:border-[#034751] focus:outline-none focus:ring-2 focus:ring-[#034751]/20" />
          </div>
          <Button variant="outline" size="sm" className="gap-1.5" onClick={() => { setSyncing(true); window.setTimeout(() => setSyncing(false), 1200); }} disabled={syncing}>
            <RefreshCw className={cn("h-3.5 w-3.5", syncing && "animate-spin")} />
            {syncing ? t("bl.einv.syncing") : t("bl.einv.resync")}
          </Button>
          <Button variant="outline" size="sm" className="gap-1.5"><Download className="h-3.5 w-3.5" />{t("bl.einv.exportXml")}</Button>
        </div>

        <div className="overflow-hidden rounded-lg border border-neutral-200 bg-white shadow-soft">
          <table className="w-full border-collapse text-left text-sm">
            <thead>
              <tr className="border-b border-neutral-200 bg-neutral-50 text-[11px] font-bold uppercase tracking-wide text-neutral-400">
                <th className="px-4 py-3">{t("bl.einv.col.id")}</th>
                <th className="px-4 py-3">{t("bl.einv.col.invoice")}</th>
                <th className="px-4 py-3">{t("bl.einv.col.date")}</th>
                <th className="px-4 py-3">{t("bl.einv.col.owner")}</th>
                <th className="px-4 py-3">{t("bl.einv.col.maCQT")}</th>
                <th className="px-4 py-3 text-right">{t("bl.einv.col.amount")}</th>
                <th className="px-4 py-3">{t("bl.einv.col.status")}</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((e) => (
                <tr key={e.id} className="border-b border-neutral-100 last:border-0 hover:bg-neutral-50">
                  <td className="px-4 py-3 font-mono text-[12px] font-bold text-neutral-900">{e.id}</td>
                  <td className="px-4 py-3 font-mono text-[12px] text-neutral-600">{e.invoiceNumber}</td>
                  <td className="whitespace-nowrap px-4 py-3 text-[12px] text-neutral-500">{e.date}</td>
                  <td className="px-4 py-3 font-semibold text-neutral-800">{e.owner}</td>
                  <td className="px-4 py-3 font-mono text-[11px] text-neutral-500">{e.maCQT}</td>
                  <td className="whitespace-nowrap px-4 py-3 text-right font-semibold tnum text-neutral-800">{vndFull(e.amount)}</td>
                  <td className="px-4 py-3">
                    <span className={cn("inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide", EINV_STATUS[e.status])} title={e.error}>
                      {e.status === "error" && <AlertTriangle className="h-3 w-3" />}
                      {t(`bl.einv.st.${e.status}`)}
                    </span>
                    {e.error && <div className="mt-0.5 text-[10px] text-destructive">{e.error}</div>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
