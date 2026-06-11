import { useEffect, useMemo, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  ChevronLeft,
  Phone,
  AlertCircle,
  Pill,
  Save,
  X,
  Sparkles,
  Mic,
  Square,
  FileText,
  ClipboardSignature,
  CalendarPlus,
  Paperclip,
  Ban,
  Video,
  FilePlus2,
  FlaskConical,
  ReceiptText,
  Check,
  Lock,
  Plus,
  Printer,
  ChevronDown,
  Undo2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useLang } from "@/lib/i18n";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetFooter,
  SheetDescription,
} from "@/components/ui/sheet";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu";
import {
  getConsultDetail,
  vndShort,
  buildRegions,
  nextStatus,
  proceduresFromInvoice,
  type ConsultDetail,
  type EstimateLine,
  type InvoiceLine,
  type BodyRegion,
  type DischargeNotes,
} from "@/lib/consultation-data";
import { BodyMapCard } from "@/components/consultation/body-map";
import { DischargeNotesSection, isDischargeReady } from "@/components/consultation/discharge-notes";
import { PatientAvatar, StatusPill } from "./consultations-list";

type SideTab = "estimate" | "invoice";

function groupBy<T extends { group: string }>(items: T[]): [string, T[]][] {
  const map = new Map<string, T[]>();
  for (const i of items) {
    if (!map.has(i.group)) map.set(i.group, []);
    map.get(i.group)!.push(i);
  }
  return [...map.entries()];
}

export default function ConsultationDetail() {
  const { t } = useLang();
  const { id = "" } = useParams();
  const navigate = useNavigate();
  const detail = getConsultDetail(id);
  const [tab, setTab] = useState<SideTab>("estimate");
  const [labOpen, setLabOpen] = useState(true);
  const [rxOpen, setRxOpen] = useState(true);
  const [rxList, setRxList] = useState<any[]>(() => detail?.rx ?? []);
  const [estimateList, setEstimateList] = useState<any[]>(() => detail?.estimate ?? []);
  const [invoiceList, setInvoiceList] = useState<InvoiceLine[]>(() => detail?.invoice ?? []);
  const [declineOpen, setDeclineOpen] = useState(false);
  const [soap, setSoap] = useState(detail?.soap ?? { s: "", o: "", a: "", p: "" });
  const [ai, setAi] = useState<"idle" | "recording" | "suggested">("idle");
  const [closeOpen, setCloseOpen] = useState(false);

  const detailWithStatefulItems = useMemo(() => {
    if (!detail) return null;
    return { ...detail, rx: rxList, invoice: invoiceList };
  }, [detail, rxList, invoiceList]);

  // Body map — interactive (cycle status, per-region note)
  const [bodyRegions, setBodyRegions] = useState<BodyRegion[]>(() => buildRegions(detail?.bodySeed));
  const cycleRegion = (key: string) =>
    setBodyRegions((prev) => prev.map((r) => (r.key === key ? { ...r, status: nextStatus(r.status) } : r)));

  // Discharge notes
  const [dischargeEditedByUser, setDischargeEditedByUser] = useState(false);
  const [discharge, setDischarge] = useState<DischargeNotes>(() => ({
    diagnosis: detail?.soap.a ?? "",
    procedures: detail ? proceduresFromInvoice(detail.invoice) : [],
    warnings: [],
    warningNote: "",
    diet: "normal",
    dietNote: "",
    activity: "normal",
    activityNote: "",
    clinicalNotes: "",
    careNotes: "",
    followUpDate: null,
    followUpNote: "",
    status: "draft",
    sentAt: null,
    sentVia: [],
  }));

  // Auto-pull SOAP-A → diagnosis until the user edits it directly
  useEffect(() => {
    if (!dischargeEditedByUser) setDischarge((d) => ({ ...d, diagnosis: soap.a }));
  }, [soap.a, dischargeEditedByUser]);

  // Auto-sync procedures when invoice updates (filtering out declined)
  useEffect(() => {
    setDischarge((d) => ({ ...d, procedures: proceduresFromInvoice(invoiceList) }));
  }, [invoiceList]);

  const words = useMemo(
    () => Object.values(soap).join(" ").trim().split(/\s+/).filter(Boolean).length,
    [soap]
  );

  if (!detail) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-3 bg-white text-center">
        <p className="text-sm text-neutral-500">Không tìm thấy phiếu khám “{id}”.</p>
        <button onClick={() => navigate("/consultations/all")} className="rounded-lg bg-[#034751] px-3.5 py-2 text-sm font-semibold text-white">
          {t("cs.back")}
        </button>
      </div>
    );
  }

  function approveAi() {
    setSoap((s) => ({ ...s, p: s.p + (s.p ? "\n" : "") + "• [AI] Cân nhắc xét nghiệm máu cơ bản và siêu âm bụng để loại trừ dị vật." }));
    setAi("idle");
  }

  return (
    <div className="flex h-full flex-col bg-white">
      {/* Context bar */}
      <div className="sticky top-0 z-20 flex flex-wrap items-center gap-x-4 gap-y-2 border-b border-neutral-200 bg-white px-5 py-2.5">
        <button onClick={() => navigate("/consultations/all")} className="flex items-center gap-1 text-[13px] font-medium text-neutral-400 transition-colors hover:text-[#034751]">
          <ChevronLeft className="h-4 w-4" />
          {t("cs.back")}
        </button>
        <span className="h-5 w-px bg-neutral-200" />

        <PatientAvatar species={detail.species} size={38} />
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span className="font-display text-[17px] font-bold leading-none text-neutral-900">{detail.patient}</span>
            <span className="font-mono text-[11px] text-neutral-400">{detail.id}</span>
          </div>
          <div className="mt-0.5 text-[12px] text-neutral-500">
            {detail.breed} · {detail.age} · {detail.sex} · {detail.weight}
          </div>
        </div>

        <span className="hidden items-center gap-1.5 text-[13px] text-neutral-600 md:flex">
          <button onClick={() => navigate("/patients")} className="font-medium text-[#034751] hover:underline">{detail.owner}</button>
          <span className="text-neutral-300">·</span>
          <Phone className="h-3.5 w-3.5 text-neutral-400" />
          {detail.phone}
        </span>

        <div className="flex items-center gap-1.5">
          {detail.allergy && detail.allergy !== "—" && (
            <span className="inline-flex items-center gap-1 rounded-full bg-red-50 px-2 py-0.5 text-[11px] font-semibold text-red-600 ring-1 ring-inset ring-red-200">
              <AlertCircle className="h-3 w-3" />
              {t("cs.allergy")}: {detail.allergy}
            </span>
          )}
          {detail.activeMeds > 0 && (
            <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2 py-0.5 text-[11px] font-semibold text-amber-700 ring-1 ring-inset ring-amber-200">
              <Pill className="h-3 w-3" />
              {detail.activeMeds} {t("cs.activeMeds")}
            </span>
          )}
        </div>

        <div className="ml-auto flex items-center gap-2.5">
          <span className="flex items-center gap-2">
            <StatusPill status={detail.status} t={t} />
            {detail.status === "in-progress" && (
              <span className="hidden text-[12px] text-neutral-400 lg:inline">{t("cs.started")} 18 {t("dash.min")} {t("cs.ago")}</span>
            )}
          </span>
          <button className="inline-flex items-center gap-1.5 rounded-lg border border-neutral-200 bg-white px-3 py-1.5 text-[13px] font-medium text-neutral-600 transition-colors hover:bg-neutral-50">
            <Save className="h-4 w-4" />
            <span className="hidden sm:inline">{t("cs.savedraft")}</span>
          </button>
          <button onClick={() => setCloseOpen(true)} className="inline-flex items-center gap-1.5 rounded-lg bg-[#034751] px-3 py-1.5 text-[13px] font-semibold text-white transition-colors hover:bg-[#023a42]">
            <X className="h-4 w-4" />
            {t("cs.closeConsult")}
          </button>
        </div>
      </div>

      {/* Action toolbar */}
      <div className="flex items-center gap-1.5 overflow-x-auto border-b border-neutral-100 bg-neutral-50/60 px-5 py-2">
        <ActionChip icon={FileText} label={t("cs.a.estimate")} onClick={() => setTab("estimate")} />
        <ActionChip icon={ClipboardSignature} label={t("cs.a.consent")} />
        <ActionChip icon={CalendarPlus} label={t("cs.a.followup")} />
        <ActionChip icon={Pill} label={t("cs.a.prescribe")} onClick={() => { setRxOpen(true); setTimeout(() => document.getElementById("rx-block")?.scrollIntoView({ behavior: "smooth" }), 50); }} />
        <ActionChip icon={FlaskConical} label={t("cs.tab.lab")} onClick={() => { setLabOpen(true); setTimeout(() => document.getElementById("lab-block")?.scrollIntoView({ behavior: "smooth" }), 50); }} />
        <ActionChip icon={Paperclip} label={t("cs.a.attach")} />
        <ActionChip icon={Ban} label={t("cs.a.decline")} danger onClick={() => { setTab("invoice"); setDeclineOpen(true); }} />
        <ActionChip icon={Video} label={t("cs.a.telehealth")} />
      </div>

      {/* Workspace */}
      <div className="flex-1 overflow-y-auto">
        <div className="mx-auto grid max-w-[1600px] grid-cols-1 gap-5 p-5 lg:grid-cols-[340px_1fr] xl:grid-cols-[340px_1fr_360px]">
          {/* COL 1 — Body Map + Vitals (sticky) */}
          <div className="space-y-5 lg:sticky lg:top-4 lg:row-span-2 lg:max-h-[calc(100vh-120px)] lg:self-start lg:overflow-y-auto xl:row-span-1">
            <BodyMapCard regions={bodyRegions} onCycle={cycleRegion} t={t} />
            <VitalsCard detail={detail} t={t} />
          </div>

          {/* COL 2 — SOAP + Discharge Notes (inline, free scroll) */}
          <div className="min-w-0 space-y-5">
            {/* SOAP — continuous block */}
            <section className="rounded-xl border border-neutral-200 bg-white">
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-neutral-100 px-4 py-2.5">
                  <h2 className="font-display text-[15px] font-bold text-neutral-900">{t("cs.soap")}</h2>
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => setAi(ai === "recording" ? "suggested" : "recording")}
                      className={cn(
                        "inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-[12px] font-semibold transition-colors",
                        ai === "recording" ? "bg-red-50 text-red-600" : "border border-neutral-200 bg-white text-[#034751] hover:bg-[#034751]/10"
                      )}
                    >
                      {ai === "recording" ? <Square className="h-3.5 w-3.5 fill-current" /> : <Mic className="h-3.5 w-3.5" />}
                      {ai === "recording" ? "Dừng ghi" : t("cs.aiScribe")}
                    </button>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <button className="inline-flex items-center gap-1 rounded-lg border border-neutral-200 bg-white px-2.5 py-1.5 text-[12px] font-medium text-neutral-600 hover:bg-neutral-50">
                          <FilePlus2 className="h-3.5 w-3.5" />
                          <span className="hidden sm:inline">{t("cs.template")}</span>
                          <ChevronDown className="h-3 w-3 opacity-60" />
                        </button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-48">
                        <DropdownMenuLabel>{t("cs.template")}</DropdownMenuLabel>
                        {["Tiêm phòng", "Khám tổng quát", "Tiếp nhận", "Da liễu", "Răng miệng", "Phẫu thuật"].map((x) => (
                          <DropdownMenuItem key={x}>{x}</DropdownMenuItem>
                        ))}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>

                {ai !== "idle" && (
                  <div
                    className={cn(
                      "mx-4 mt-3 flex items-center gap-2 rounded-lg px-3 py-2 text-[12px]",
                      ai === "recording" ? "bg-red-50 text-red-600" : "bg-[#E8F1CA] text-[#3f4d12]"
                    )}
                  >
                    {ai === "recording" ? (
                      <>
                        <span className="h-2 w-2 animate-pulse rounded-full bg-red-500" />
                        {t("cs.aiRecording")}
                      </>
                    ) : (
                      <>
                        <Sparkles className="h-3.5 w-3.5" />
                        <span className="flex-1">{t("cs.aiSuggested")}</span>
                        <button onClick={approveAi} className="rounded-md bg-[#034751] px-2 py-1 text-[11px] font-semibold text-white">{t("cs.aiApprove")}</button>
                      </>
                    )}
                  </div>
                )}

                {/* continuous S → O → A → P */}
                <div className="space-y-1 p-4">
                  {([
                    ["s", "S", "Subjective · Chủ quan"],
                    ["o", "O", "Objective · Khách quan"],
                    ["a", "A", "Assessment · Đánh giá"],
                    ["p", "P", "Plan · Kế hoạch"],
                  ] as const).map(([key, letter, label]) => (
                    <div key={key} className="border-b border-dashed border-neutral-100 pb-2 last:border-0">
                      <div className="mb-1 flex items-center gap-2">
                        <span className="flex h-5 w-5 items-center justify-center rounded bg-[#034751] text-[11px] font-bold text-white">{letter}</span>
                        <span className="text-[11px] font-bold uppercase tracking-wide text-neutral-400">{label}</span>
                      </div>
                      <textarea
                        value={soap[key]}
                        onChange={(e) => setSoap((s) => ({ ...s, [key]: e.target.value }))}
                        rows={Math.max(2, Math.ceil((soap[key].length || 1) / 60))}
                        className="w-full resize-none rounded-md border-0 bg-transparent px-1 py-0.5 text-[13px] leading-relaxed text-neutral-700 outline-none focus:bg-neutral-50"
                      />
                    </div>
                  ))}
                </div>
                <div className="flex items-center justify-between border-t border-neutral-100 px-4 py-2 text-[11px] text-neutral-400">
                  <span className="inline-flex items-center gap-1"><Check className="h-3.5 w-3.5 text-[#1B804C]" /> {t("cs.autosaved")}</span>
                  <span className="tnum">{words} {t("cs.words")}</span>
                </div>
              </section>

            {/* NEW: Collapsible Diagnostics (Lab/Imaging) */}
            <section id="lab-block" className="rounded-xl border border-neutral-200 bg-white overflow-hidden scroll-mt-20">
              <button
                onClick={() => setLabOpen(!labOpen)}
                className="flex w-full items-center justify-between border-b border-neutral-100 px-4 py-3 text-left font-display text-[15px] font-bold text-neutral-900 hover:bg-neutral-50/50"
              >
                <div className="flex items-center gap-2">
                  <FlaskConical className="h-4 w-4 text-[#034751]" />
                  <span>{t("cs.tab.lab")}</span>
                  <span className="ml-1.5 rounded-full bg-neutral-100 px-2 py-0.5 text-[11px] font-semibold text-neutral-500">
                    {detail.labs.length}
                  </span>
                </div>
                <ChevronDown className={cn("h-4 w-4 text-neutral-400 transition-transform duration-200", labOpen && "rotate-180")} />
              </button>
              {labOpen && (
                <div className="border-t border-neutral-100 bg-neutral-50/10 p-4">
                  <LabPanel detail={detail} t={t} noScroll={true} />
                </div>
              )}
            </section>

            {/* NEW: Collapsible Treatment & Rx (Kê toa) */}
            <section id="rx-block" className="rounded-xl border border-neutral-200 bg-white overflow-hidden scroll-mt-20">
              <button
                onClick={() => setRxOpen(!rxOpen)}
                className="flex w-full items-center justify-between border-b border-neutral-100 px-4 py-3 text-left font-display text-[15px] font-bold text-neutral-900 hover:bg-neutral-50/50"
              >
                <div className="flex items-center gap-2">
                  <Pill className="h-4 w-4 text-[#034751]" />
                  <span>{t("cs.tab.rx")}</span>
                  <span className="ml-1.5 rounded-full bg-neutral-100 px-2 py-0.5 text-[11px] font-semibold text-neutral-500">
                    {rxList.length}
                  </span>
                </div>
                <ChevronDown className={cn("h-4 w-4 text-neutral-400 transition-transform duration-200", rxOpen && "rotate-180")} />
              </button>
              {rxOpen && (
                <div className="border-t border-neutral-100 bg-neutral-50/10 p-4">
                  <RxPanel detail={detailWithStatefulItems!} t={t} noScroll={true} rxList={rxList} setRxList={setRxList} />
                </div>
              )}
            </section>
 
            {/* Discharge Notes — inline section */}
            <DischargeNotesSection
              detail={detailWithStatefulItems!}
              discharge={discharge}
              setDischarge={setDischarge}
              fromSoap={!dischargeEditedByUser}
              markEdited={() => setDischargeEditedByUser(true)}
              onEditRx={() => {
                setRxOpen(true);
                setTimeout(() => {
                  document.getElementById("rx-block")?.scrollIntoView({ behavior: "smooth" });
                }, 50);
              }}
              t={t}
            />
          </div>
 
          {/* COL 3 — side panel (sticky) */}
          <div className="lg:sticky lg:top-4 lg:max-h-[calc(100vh-120px)] lg:self-start lg:overflow-hidden">
            <section className="overflow-hidden rounded-xl border border-neutral-200 bg-white">
              <div className="flex border-b border-neutral-200">
                {([
                  ["estimate", t("cs.tab.estimate"), FileText],
                  ["invoice", t("cs.tab.invoice"), ReceiptText],
                ] as const).map(([key, label, Icon]) => (
                  <button
                    key={key}
                    onClick={() => setTab(key as SideTab)}
                    className={cn(
                      "flex flex-1 flex-col items-center gap-1 border-b-2 py-2.5 text-[11px] font-semibold transition-colors",
                      tab === key
                        ? "border-[#034751] bg-[#034751]/[0.06] text-[#034751]"
                        : "border-transparent text-neutral-500 hover:bg-neutral-50"
                    )}
                  >
                    <Icon className="h-4 w-4" />
                    {label}
                  </button>
                ))}
              </div>
              <div>
                {tab === "estimate" && <EstimatePanel detail={detailWithStatefulItems!} t={t} estimateList={estimateList} setEstimateList={setEstimateList} />}
                {tab === "invoice" && <InvoicePanel detail={detailWithStatefulItems!} t={t} invoiceList={invoiceList} setInvoiceList={setInvoiceList} />}
              </div>
            </section>
          </div>
        </div>
      </div>
 
      {/* Close consultation drawer */}
      <CloseDrawer open={closeOpen} onClose={() => setCloseOpen(false)} detail={detailWithStatefulItems!} words={words} dischargeReady={isDischargeReady(discharge)} t={t} />
      {/* Decline services modal */}
      <DeclineServicesModal open={declineOpen} onClose={() => setDeclineOpen(false)} invoiceList={invoiceList} setInvoiceList={setInvoiceList} t={t} />
    </div>
  );
}

// ── Action chip ───────────────────────────────────────────────────────────────
function ActionChip({ icon: Icon, label, onClick, danger }: { icon: typeof FileText; label: string; onClick?: () => void; danger?: boolean }) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "inline-flex shrink-0 items-center gap-1.5 rounded-lg border bg-white px-2.5 py-1.5 text-[12px] font-medium transition-colors",
        danger
          ? "border-neutral-200 text-neutral-600 hover:border-red-300 hover:bg-red-50 hover:text-red-600"
          : "border-neutral-200 text-neutral-600 hover:border-[#034751] hover:bg-[#034751]/10 hover:text-[#034751]"
      )}
    >
      <Icon className="h-3.5 w-3.5" />
      {label}
    </button>
  );
}

// ── Vitals ────────────────────────────────────────────────────────────────────
function VitalsCard({ detail, t }: { detail: ConsultDetail; t: (k: string) => string }) {
  return (
    <section className="rounded-xl border border-neutral-200 bg-white p-4">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <h2 className="font-display text-[15px] font-bold text-neutral-900">{t("cs.vitals")}</h2>
        <span className="text-[11px] text-neutral-400">{t("cs.enteredBy")} {detail.vitalsBy} · {detail.vitalsAt}</span>
      </div>
      <div className="grid grid-cols-2 gap-2">
        {detail.vitals.map((v) => (
          <div key={v.key} className={cn("rounded-lg border p-2.5", v.flag ? "border-red-200 bg-red-50" : "border-neutral-200 bg-neutral-50/50")}>
            <div className="text-[11px] text-neutral-400">{v.label}</div>
            <div className="mt-0.5 flex items-baseline gap-1">
              <span className={cn("text-[18px] font-bold tnum", v.flag ? "text-red-600" : "text-neutral-900")}>{v.value}</span>
              <span className="text-[11px] text-neutral-400">{v.unit}</span>
            </div>
            <div className="mt-0.5 text-[10px] text-neutral-400">BT: {v.range}</div>
          </div>
        ))}
      </div>
      <div className="mt-3 space-y-3">
        {/* Pain score 0–10 */}
        <div>
          <div className="mb-1 flex items-center justify-between text-[11px] text-neutral-500">
            <span>{t("cs.pain")}</span>
            <span className="font-semibold text-neutral-700">{detail.pain}/10</span>
          </div>
          <div className="flex gap-0.5">
            {Array.from({ length: 11 }).map((_, i) => (
              <span
                key={i}
                className="h-2.5 flex-1 rounded-sm"
                style={{ background: i <= detail.pain ? `hsl(${120 - i * 12} 70% ${i <= detail.pain ? 45 : 90}%)` : "#EDEDED" }}
              />
            ))}
          </div>
        </div>
        {/* BCS 1–9 */}
        <div>
          <div className="mb-1 flex items-center justify-between text-[11px] text-neutral-500">
            <span>{t("cs.bcs")}</span>
            <span className="font-semibold text-neutral-700">{detail.bcs}/9 · lý tưởng 5</span>
          </div>
          <div className="flex gap-0.5">
            {Array.from({ length: 9 }).map((_, i) => {
              const n = i + 1;
              const on = n === detail.bcs;
              const ideal = n === 5;
              return (
                <span
                  key={n}
                  className={cn("flex h-5 flex-1 items-center justify-center rounded-sm text-[9px] font-bold", on ? "text-white" : ideal ? "text-[#1B804C]" : "text-neutral-400")}
                  style={{ background: on ? "#034751" : ideal ? "#D7F4DF" : "#F1F1F1" }}
                >
                  {n}
                </span>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}

// (Body map is now an interactive component — see components/consultation/body-map.tsx)

// ── Side panels ───────────────────────────────────────────────────────────────
function PanelShell({ children, footer, noScroll }: { children: React.ReactNode; footer?: React.ReactNode; noScroll?: boolean }) {
  if (noScroll) {
    return (
      <div>
        <div className="p-1">{children}</div>
        {footer && <div className="mt-4 border-t border-neutral-100 pt-4">{footer}</div>}
      </div>
    );
  }
  return (
    <div className="flex max-h-[calc(100vh-220px)] flex-col">
      <div className="flex-1 overflow-y-auto p-4">{children}</div>
      {footer && <div className="border-t border-neutral-100 p-4">{footer}</div>}
    </div>
  );
}

const PRESET_ESTIMATES = [
  { name: "Khám lâm sàng", group: "Khám & chẩn đoán", low: 200000, high: 200000, note: "Phí khám cơ bản" },
  { name: "Siêu âm bụng tổng quát", group: "Khám & chẩn đoán", low: 350000, high: 500000, note: "Tùy số vùng khảo sát" },
  { name: "Chụp X-quang (0-10 tấm)", group: "Khám & chẩn đoán", low: 300000, high: 1500000, note: "Tính theo số lượng phim chụp thực tế" },
  { name: "Xét nghiệm máu CBC", group: "Xét nghiệm", low: 280000, high: 280000, note: "Công thức máu toàn bộ" },
  { name: "Phẫu thuật triệt sản", group: "Phẫu thuật", low: 1200000, high: 1800000, note: "Gồm gây mê và hậu phẫu" },
  { name: "Gây mê & hồi sức", group: "Thủ thuật & thuốc", low: 500000, high: 800000, note: "Dành cho phẫu thuật ngoại khoa" },
];

function EstimatePanel({
  detail,
  t,
  estimateList = detail.estimate,
  setEstimateList,
}: {
  detail: ConsultDetail;
  t: (k: string) => string;
  estimateList?: EstimateLine[];
  setEstimateList?: React.Dispatch<React.SetStateAction<EstimateLine[]>>;
}) {
  const [isAdding, setIsAdding] = useState(false);
  const [isSent, setIsSent] = useState(false);

  // Form states
  const [selectedPresetIndex, setSelectedPresetIndex] = useState("-1");
  const [customName, setCustomName] = useState("");
  const [customGroup, setCustomGroup] = useState("Khám & chẩn đoán");
  const [customLow, setCustomLow] = useState(0);
  const [customHigh, setCustomHigh] = useState(0);
  const [customNote, setCustomNote] = useState("");

  // Auto-fill form
  useEffect(() => {
    const idx = parseInt(selectedPresetIndex);
    if (idx >= 0 && idx < PRESET_ESTIMATES.length) {
      const p = PRESET_ESTIMATES[idx];
      setCustomName(p.name);
      setCustomGroup(p.group);
      setCustomLow(p.low);
      setCustomHigh(p.high);
      setCustomNote(p.note);
    } else {
      setCustomName("");
      setCustomGroup("Khám & chẩn đoán");
      setCustomLow(0);
      setCustomHigh(0);
      setCustomNote("");
    }
  }, [selectedPresetIndex]);

  const handleAdd = () => {
    if (!customName || customLow < 0 || customHigh < customLow) return;
    const newLine = {
      name: customName,
      group: customGroup,
      low: Number(customLow),
      high: Number(customHigh),
      note: customNote,
    };
    if (setEstimateList) {
      setEstimateList((prev) => [...prev, newLine]);
    }
    setIsAdding(false);
    setSelectedPresetIndex("-1");
  };

  const handleDelete = (name: string) => {
    if (setEstimateList) {
      setEstimateList((prev) => prev.filter((e) => e.name !== name));
    }
  };

  const handleSend = () => {
    setIsSent(true);
    setTimeout(() => setIsSent(false), 3000);
  };

  const low = estimateList.reduce((a, e) => a + e.low, 0);
  const high = estimateList.reduce((a, e) => a + e.high, 0);

  return (
    <PanelShell
      noScroll={false}
      footer={
        !isAdding && (
          <>
            <div className="mb-3 flex items-center justify-between border-t border-neutral-100 pt-3">
              <span className="text-[12px] font-medium text-neutral-500">{t("cs.estimate.total")}</span>
              <span className="text-[15px] font-bold tnum text-[#034751]">{vndShort(low)} – {vndShort(high)}</span>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setIsAdding(true)}
                className="flex-1 rounded-lg bg-[#034751] py-2 text-[13px] font-semibold text-white hover:bg-[#023a42]"
              >
                + Thêm mục
              </button>
              <button
                onClick={handleSend}
                className={cn(
                  "rounded-lg px-3 py-2 text-[13px] font-semibold transition-all border",
                  isSent
                    ? "bg-green-50 border-green-200 text-green-600"
                    : "border-neutral-200 text-neutral-600 hover:bg-neutral-50"
                )}
              >
                {isSent ? "Đã gửi Zalo!" : t("cs.estimate.send")}
              </button>
            </div>
          </>
        )
      }
    >
      <p className="mb-3 flex items-start gap-1.5 rounded-lg bg-[#E8F1CA]/60 px-2.5 py-2 text-[11px] text-[#3f4d12]">
        <FileText className="mt-0.5 h-3.5 w-3.5 shrink-0" />
        {t("cs.estimate.range")}
      </p>

      {/* Add Estimate Item Form */}
      {isAdding && (
        <div className="mb-4 rounded-xl border border-[#034751]/20 bg-[#034751]/[0.02] p-4 space-y-3 shadow-[0_2px_8px_rgba(3,71,81,0.04)]">
          <div className="flex items-center justify-between border-b border-neutral-100 pb-2">
            <h4 className="text-[13px] font-bold text-[#034751] uppercase tracking-wide">Thêm mục báo giá</h4>
            <button onClick={() => setIsAdding(false)} className="text-neutral-400 hover:text-neutral-600">
              <X className="h-4 w-4" />
            </button>
          </div>

          <div>
            <label className="mb-1 block text-[11px] font-semibold text-neutral-500">Chọn mẫu dịch vụ</label>
            <select
              value={selectedPresetIndex}
              onChange={(e) => setSelectedPresetIndex(e.target.value)}
              className="w-full rounded-lg border border-neutral-200 bg-white px-2.5 py-1.5 text-[13px] text-neutral-700 outline-none focus:border-[#034751]"
            >
              <option value="-1">-- Tự nhập thủ công --</option>
              {PRESET_ESTIMATES.map((p, i) => (
                <option key={p.name} value={i}>
                  {p.name} ({vndShort(p.low)} - {vndShort(p.high)})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-1 block text-[11px] font-semibold text-neutral-500">Tên hạng mục</label>
            <input
              type="text"
              placeholder="VD: Siêu âm bụng tổng quát"
              value={customName}
              onChange={(e) => setCustomName(e.target.value)}
              className="w-full rounded-lg border border-neutral-200 px-2.5 py-1.5 text-[12px] text-neutral-700 outline-none focus:border-[#034751] bg-white"
            />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="mb-1 block text-[11px] font-semibold text-neutral-500">Nhóm dịch vụ</label>
              <select
                value={customGroup}
                onChange={(e) => setCustomGroup(e.target.value)}
                className="w-full rounded-lg border border-neutral-200 bg-white px-2 py-1.5 text-[12px] text-neutral-700 outline-none focus:border-[#034751]"
              >
                <option value="Khám & chẩn đoán">Khám & chẩn đoán</option>
                <option value="Xét nghiệm">Xét nghiệm</option>
                <option value="Thủ thuật & thuốc">Thủ thuật & thuốc</option>
                <option value="Phẫu thuật">Phẫu thuật</option>
              </select>
            </div>
            <div>
              <label className="mb-1 block text-[11px] font-semibold text-neutral-500">Ghi chú thêm</label>
              <input
                type="text"
                placeholder="VD: Tùy số vùng"
                value={customNote}
                onChange={(e) => setCustomNote(e.target.value)}
                className="w-full rounded-lg border border-neutral-200 px-2.5 py-1.5 text-[12px] text-neutral-700 outline-none focus:border-[#034751] bg-white"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="mb-1 block text-[11px] font-semibold text-neutral-500">Giá tối thiểu (Low)</label>
              <input
                type="number"
                min="0"
                value={customLow}
                onChange={(e) => setCustomLow(Math.max(0, parseInt(e.target.value) || 0))}
                className="w-full rounded-lg border border-neutral-200 px-2.5 py-1.5 text-[12px] text-neutral-700 outline-none focus:border-[#034751] bg-white"
              />
            </div>
            <div>
              <label className="mb-1 block text-[11px] font-semibold text-neutral-500">Giá tối đa (High)</label>
              <input
                type="number"
                min="0"
                value={customHigh}
                onChange={(e) => setCustomHigh(Math.max(0, parseInt(e.target.value) || 0))}
                className="w-full rounded-lg border border-neutral-200 px-2.5 py-1.5 text-[12px] text-neutral-700 outline-none focus:border-[#034751] bg-white"
              />
            </div>
          </div>

          <div className="flex gap-2 pt-2 border-t border-neutral-100">
            <button
              onClick={() => setIsAdding(false)}
              className="flex-1 rounded-lg border border-neutral-200 py-1.5 text-[12px] font-semibold text-neutral-600 hover:bg-neutral-50 bg-white"
            >
              Hủy
            </button>
            <button
              onClick={handleAdd}
              disabled={!customName || customLow < 0 || customHigh < customLow}
              className="flex-1 rounded-lg bg-[#034751] py-1.5 text-[12px] font-semibold text-white hover:bg-[#023a42] disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Lưu hạng mục
            </button>
          </div>
        </div>
      )}

      {estimateList.length === 0 ? (
        <div className="flex flex-col items-center gap-2 py-10 text-center">
          <FileText className="h-7 w-7 text-neutral-300" />
          <p className="text-[13px] text-neutral-400">Chưa có hạng mục báo giá nào</p>
        </div>
      ) : (
        groupBy<EstimateLine>(estimateList).map(([group, lines]) => (
          <div key={group} className="mb-4">
            <div className="mb-2 text-[11px] font-bold uppercase tracking-wide text-neutral-400">{group}</div>
            <div className="space-y-2">
              {lines.map((l) => (
                <div key={l.name} className="relative rounded-lg border border-neutral-200 px-3 py-2 bg-white hover:border-[#034751]/30 transition-colors group">
                  {/* Delete button */}
                  <button
                    onClick={() => handleDelete(l.name)}
                    className="absolute top-2.5 right-2.5 p-1 rounded-md text-neutral-400 hover:text-red-600 hover:bg-red-50 opacity-0 group-hover:opacity-100 transition-opacity"
                    title="Xóa hạng mục"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>

                  <div className="flex items-center justify-between gap-2 pr-6">
                    <span className="text-[13px] font-medium text-neutral-800 leading-snug">{l.name}</span>
                    <span className="shrink-0 text-[13px] font-semibold tnum text-neutral-900">
                      {l.low === l.high ? vndShort(l.low) : `${vndShort(l.low)} – ${vndShort(l.high)}`}
                    </span>
                  </div>
                  {l.note && <div className="mt-0.5 text-[11px] text-neutral-400">{l.note}</div>}
                </div>
              ))}
            </div>
          </div>
        ))
      )}
    </PanelShell>
  );
}

const PRESET_INVOICE_ITEMS = [
  { name: "Khám lâm sàng ngoại khoa", group: "Dịch vụ", price: 150000 },
  { name: "Siêu âm bụng tổng quát", group: "Xét nghiệm", price: 250000 },
  { name: "Xét nghiệm máu sinh hóa 6 chỉ số", group: "Xét nghiệm", price: 480000 },
  { name: "Chụp X-quang kỹ thuật số", group: "Xét nghiệm", price: 300000 },
  { name: "Truyền dịch tĩnh mạch Ringer Lactate", group: "Dịch vụ", price: 180000 },
  { name: "Gửi nội trú theo dõi (24h)", group: "Dịch vụ", price: 350000 },
];

function InvoicePanel({
  detail,
  t,
  invoiceList,
  setInvoiceList,
}: {
  detail: ConsultDetail;
  t: (k: string) => string;
  invoiceList: InvoiceLine[];
  setInvoiceList: React.Dispatch<React.SetStateAction<InvoiceLine[]>>;
}) {
  const [isAdding, setIsAdding] = useState(false);
  const [selectedPreset, setSelectedPreset] = useState("-1");
  const [customName, setCustomName] = useState("");
  const [customGroup, setCustomGroup] = useState("Dịch vụ");
  const [customPrice, setCustomPrice] = useState(0);
  const [customQty, setCustomQty] = useState(1);

  // Individual item decline states
  const [activeDeclineItem, setActiveDeclineItem] = useState<string | null>(null);
  const [customDeclineReason, setCustomDeclineReason] = useState("");

  useEffect(() => {
    const idx = parseInt(selectedPreset);
    if (idx >= 0 && idx < PRESET_INVOICE_ITEMS.length) {
      const p = PRESET_INVOICE_ITEMS[idx];
      setCustomName(p.name);
      setCustomGroup(p.group);
      setCustomPrice(p.price);
    } else {
      setCustomName("");
      setCustomGroup("Dịch vụ");
      setCustomPrice(0);
    }
  }, [selectedPreset]);

  const handleAdd = () => {
    if (!customName || customPrice < 0 || customQty < 1) return;
    const newItem: InvoiceLine = {
      name: customName,
      group: customGroup,
      qty: customQty,
      price: customPrice,
      locked: false,
      declined: false,
    };
    setInvoiceList((prev) => [...prev, newItem]);
    setIsAdding(false);
    setSelectedPreset("-1");
    setCustomName("");
    setCustomGroup("Dịch vụ");
    setCustomPrice(0);
    setCustomQty(1);
  };

  const handleDecline = (name: string, reason: string) => {
    setInvoiceList((prev) =>
      prev.map((l) => (l.name === name ? { ...l, declined: true, declineReason: reason } : l))
    );
    setActiveDeclineItem(null);
    setCustomDeclineReason("");
  };

  const handleRestore = (name: string) => {
    setInvoiceList((prev) =>
      prev.map((l) => (l.name === name ? { ...l, declined: false, declineReason: undefined } : l))
    );
  };

  const active = invoiceList.filter((l) => !l.declined);
  const subtotal = active.reduce((a, l) => a + l.qty * l.price, 0);
  const discount = Math.round(subtotal * 0.05);
  const vat = Math.round((subtotal - discount) * 0.08);
  const total = subtotal - discount + vat;

  return (
    <PanelShell
      footer={
        !isAdding && (
          <>
            <div className="space-y-1 text-[12px]">
              <Line label={t("cs.inv.subtotal")} value={vndShort(subtotal)} />
              <Line label={t("cs.inv.discount")} value={`− ${vndShort(discount)}`} muted />
              <Line label={t("cs.inv.vat")} value={vndShort(vat)} muted />
              <div className="mt-1 flex items-center justify-between border-t border-neutral-100 pt-1.5">
                <span className="text-[13px] font-semibold text-neutral-700">{t("cs.inv.total")}</span>
                <span className="text-[16px] font-bold tnum text-[#034751]">{vndShort(total)}</span>
              </div>
            </div>
            <p className="mt-2 flex items-center gap-1.5 text-[11px] text-neutral-400">
              <Pill className="h-3 w-3" />
              {t("cs.inv.dispenseFirst")}
            </p>
            <button className="mt-2 w-full rounded-lg bg-[#034751] py-2 text-[13px] font-semibold text-white hover:bg-[#023a42]">
              {t("cs.inv.issue")}
            </button>
          </>
        )
      }
    >
      {/* Add Item Form */}
      {isAdding && (
        <div className="mb-4 rounded-xl border border-[#034751]/20 bg-[#034751]/[0.02] p-4 space-y-3 shadow-[0_2px_8px_rgba(3,71,81,0.04)]">
          <div className="flex items-center justify-between border-b border-neutral-100 pb-2">
            <h4 className="text-[13px] font-bold text-[#034751] uppercase tracking-wide">Thêm dịch vụ / vật tư mới</h4>
            <button onClick={() => setIsAdding(false)} className="text-neutral-400 hover:text-neutral-600">
              <X className="h-4 w-4" />
            </button>
          </div>

          <div>
            <label className="mb-1 block text-[11px] font-semibold text-neutral-500">Chọn dịch vụ mẫu</label>
            <select
              value={selectedPreset}
              onChange={(e) => setSelectedPreset(e.target.value)}
              className="w-full rounded-lg border border-neutral-200 bg-white px-2.5 py-1.5 text-[13px] text-neutral-700 outline-none focus:border-[#034751] focus:ring-2 focus:ring-[#034751]/20"
            >
              <option value="-1">-- Tự nhập thủ công --</option>
              {PRESET_INVOICE_ITEMS.map((p, i) => (
                <option key={p.name} value={i}>
                  {p.name} ({vndShort(p.price)})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-1 block text-[11px] font-semibold text-neutral-500">Tên hạng mục</label>
            <input
              type="text"
              placeholder="VD: Chụp X-quang"
              value={customName}
              onChange={(e) => setCustomName(e.target.value)}
              className="w-full rounded-lg border border-neutral-200 px-2.5 py-1.5 text-[12px] text-neutral-700 outline-none focus:border-[#034751] bg-white"
            />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="mb-1 block text-[11px] font-semibold text-neutral-500">Nhóm danh mục</label>
              <select
                value={customGroup}
                onChange={(e) => setCustomGroup(e.target.value)}
                className="w-full rounded-lg border border-neutral-200 bg-white px-2 py-1.5 text-[12px] text-neutral-700 outline-none focus:border-[#034751]"
              >
                <option value="Dịch vụ">Dịch vụ</option>
                <option value="Xét nghiệm">Xét nghiệm</option>
                <option value="Thuốc">Thuốc</option>
                <option value="Vật tư">Vật tư</option>
              </select>
            </div>
            <div>
              <label className="mb-1 block text-[11px] font-semibold text-neutral-500">Số lượng</label>
              <input
                type="number"
                min="1"
                value={customQty}
                onChange={(e) => setCustomQty(Math.max(1, parseInt(e.target.value) || 1))}
                className="w-full rounded-lg border border-neutral-200 px-2.5 py-1.5 text-[12px] text-neutral-700 outline-none focus:border-[#034751] bg-white"
              />
            </div>
          </div>

          <div>
            <label className="mb-1 block text-[11px] font-semibold text-neutral-500">Đơn giá (VNĐ)</label>
            <input
              type="number"
              min="0"
              value={customPrice}
              onChange={(e) => setCustomPrice(Math.max(0, parseInt(e.target.value) || 0))}
              className="w-full rounded-lg border border-neutral-200 px-2.5 py-1.5 text-[12px] text-neutral-700 outline-none focus:border-[#034751] bg-white"
            />
          </div>

          <div className="flex gap-2 pt-2 border-t border-neutral-100">
            <button
              onClick={() => setIsAdding(false)}
              className="flex-1 rounded-lg border border-neutral-200 py-1.5 text-[12px] font-semibold text-neutral-600 hover:bg-neutral-50 bg-white"
            >
              Hủy
            </button>
            <button
              onClick={handleAdd}
              disabled={!customName || customPrice < 0}
              className="flex-1 rounded-lg bg-[#034751] py-1.5 text-[12px] font-semibold text-white hover:bg-[#023a42] disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Thêm vào hóa đơn
            </button>
          </div>
        </div>
      )}

      {invoiceList.length === 0 ? (
        <div className="flex flex-col items-center gap-2 py-10 text-center">
          <ReceiptText className="h-7 w-7 text-neutral-300" />
          <p className="text-[13px] text-neutral-400">Hóa đơn chưa có mục nào</p>
        </div>
      ) : (
        groupBy<InvoiceLine>(invoiceList).map(([group, lines]) => (
          <div key={group} className="mb-3">
            <div className="mb-1.5 text-[11px] font-bold uppercase tracking-wide text-neutral-400">{group}</div>
            <div className="space-y-1.5">
              {lines.map((l) => (
                <div
                  key={l.name}
                  className={cn(
                    "flex flex-col gap-1.5 rounded-lg border p-2.5 transition-colors",
                    l.declined ? "border-red-100 bg-red-50/40" : "border-neutral-200 hover:border-neutral-300"
                  )}
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5">
                        <span className={cn("truncate text-[13px] font-medium leading-none", l.declined ? "text-neutral-400 line-through" : "text-neutral-800")}>
                          {l.name}
                        </span>
                        {l.locked && <Lock className="h-3 w-3 shrink-0 text-neutral-300" />}
                      </div>
                      {l.declined ? (
                        <div className="mt-1 flex flex-wrap items-center gap-1.5">
                          <span className="inline-flex items-center gap-1 rounded bg-red-100 px-1 py-0.5 text-[9px] font-bold text-red-600">
                            <Ban className="h-2 w-2" /> {t("cs.inv.declined")}
                          </span>
                          {l.declineReason && (
                            <span className="text-[10px] text-red-600 font-medium italic">
                              ({l.declineReason})
                            </span>
                          )}
                        </div>
                      ) : (
                        <span className="mt-0.5 block text-[11px] text-neutral-400">{l.qty} × {vndShort(l.price)}</span>
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      <span className={cn("shrink-0 text-[13px] font-semibold tnum", l.declined ? "text-neutral-300" : "text-neutral-900")}>
                        {l.declined ? "—" : vndShort(l.qty * l.price)}
                      </span>
                      {!l.locked && (
                        <div className="ml-1 shrink-0">
                          {l.declined ? (
                            <button
                              onClick={() => handleRestore(l.name)}
                              className="inline-flex items-center gap-0.5 rounded border border-emerald-200 bg-emerald-50 px-1.5 py-0.5 text-[10px] font-semibold text-emerald-700 hover:bg-emerald-100 transition-colors"
                              title="Khôi phục dịch vụ"
                            >
                              <Undo2 className="h-2.5 w-2.5" />
                              Khôi phục
                            </button>
                          ) : (
                            <button
                              onClick={() => {
                                setActiveDeclineItem(activeDeclineItem === l.name ? null : l.name);
                                setCustomDeclineReason("");
                              }}
                              className={cn(
                                "rounded border px-1.5 py-0.5 text-[10px] font-semibold transition-colors",
                                activeDeclineItem === l.name
                                  ? "border-red-300 bg-red-100 text-red-700"
                                  : "border-red-100 bg-red-50 text-red-600 hover:bg-red-100"
                              )}
                            >
                              Từ chối
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Inline decline reason selector */}
                  {activeDeclineItem === l.name && (
                    <div className="border-t border-red-100/50 pt-2 space-y-1.5 bg-red-50/10 p-1.5 rounded">
                      <div className="text-[10px] font-bold text-red-700 uppercase">Lý do từ chối:</div>
                      <div className="flex flex-wrap gap-1">
                        {["Chi phí cao", "Hẹn hôm sau", "Chưa cần thiết"].map((r) => (
                          <button
                            key={r}
                            onClick={() => handleDecline(l.name, r)}
                            className="rounded bg-white border border-red-100 hover:bg-red-50 px-1.5 py-0.5 text-[10px] text-red-700 font-medium transition-colors"
                          >
                            {r}
                          </button>
                        ))}
                      </div>
                      <div className="flex gap-1">
                        <input
                          type="text"
                          placeholder="Nhập lý do khác..."
                          value={customDeclineReason}
                          onChange={(e) => setCustomDeclineReason(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter" && customDeclineReason.trim()) {
                              handleDecline(l.name, customDeclineReason.trim());
                            }
                          }}
                          className="flex-1 rounded border border-neutral-200 px-2 py-0.5 text-[10px] outline-none focus:border-red-400 bg-white"
                        />
                        <button
                          onClick={() => {
                            if (customDeclineReason.trim()) {
                              handleDecline(l.name, customDeclineReason.trim());
                            }
                          }}
                          className="rounded bg-red-600 hover:bg-red-700 px-2 py-0.5 text-[10px] font-bold text-white transition-colors"
                        >
                          Lưu
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        ))
      )}

      {!isAdding && (
        <button
          onClick={() => setIsAdding(true)}
          className="flex w-full items-center justify-center gap-1.5 rounded-lg border border-dashed border-neutral-300 py-2 text-[12px] font-medium text-neutral-500 hover:border-[#034751] hover:text-[#034751]"
        >
          <Plus className="h-3.5 w-3.5" />
          Thêm hạng mục
        </button>
      )}
    </PanelShell>
  );
}

function Line({ label, value, muted }: { label: string; value: string; muted?: boolean }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-neutral-500">{label}</span>
      <span className={cn("tnum", muted ? "text-neutral-500" : "font-medium text-neutral-800")}>{value}</span>
    </div>
  );
}

const LAB_STATUS: Record<string, { label: string; bg: string; fg: string }> = {
  ordered: { label: "Đã yêu cầu", bg: "#E0F2FE", fg: "#0369A1" },
  "in-progress": { label: "Đang chạy", bg: "rgba(3,71,81,0.1)", fg: "#034751" },
  completed: { label: "Hoàn tất", bg: "#E7F7EE", fg: "#1B804C" },
};

function LabPanel({ detail, t, noScroll }: { detail: ConsultDetail; t: (k: string) => string; noScroll?: boolean }) {
  return (
    <PanelShell noScroll={noScroll} footer={<button className="flex w-full items-center justify-center gap-1.5 rounded-lg bg-[#034751] py-2 text-[13px] font-semibold text-white hover:bg-[#023a42]"><Plus className="h-4 w-4" />{t("cs.lab.request")}</button>}>
      <div className="space-y-2">
        {detail.labs.map((l) => {
          const s = LAB_STATUS[l.status];
          return (
            <div key={l.code} className="rounded-lg border border-neutral-200 px-3 py-2.5">
              <div className="flex items-center justify-between gap-2">
                <div className="min-w-0">
                  <div className="truncate text-[13px] font-medium text-neutral-800">{l.name}</div>
                  <div className="font-mono text-[11px] text-neutral-400">{l.code}</div>
                </div>
                <span className="shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold" style={{ background: s.bg, color: s.fg }}>{s.label}</span>
              </div>
              {l.result && (
                <div className={cn("mt-1.5 text-[12px]", l.abnormal ? "font-semibold text-red-600" : "text-neutral-600")}>
                  {l.result} {l.abnormal && <span className="ml-1 rounded bg-red-50 px-1 text-[10px]">{t("cs.lab.abnormal")}</span>}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </PanelShell>
  );
}

const PRESET_MEDICINES = [
  { internal: "Amoxicillin 500mg", display: "Thuốc kháng sinh (viên)", dose: "1 viên", route: "Uống", freq: "2 lần/ngày", duration: "7 ngày", qtyRx: 14, qtyDispensed: 14 },
  { internal: "Prednisolone 5mg", display: "Thuốc kháng viêm (viên)", dose: "1/2 viên", route: "Uống", freq: "1 lần/ngày", duration: "5 ngày", qtyRx: 5, qtyDispensed: 5 },
  { internal: "Meloxicam 1.5mg/ml", display: "Thuốc giảm đau (siro)", dose: "0.5 ml", route: "Uống", freq: "1 lần/ngày", duration: "3 ngày", qtyRx: 1, qtyDispensed: 1 },
  { internal: "Bravecto 112.5mg", display: "Thuốc phòng ve rận (viên)", dose: "1 viên", route: "Uống", freq: "1 lần duy nhất", duration: "1 ngày", qtyRx: 1, qtyDispensed: 1 },
  { internal: "Enrofloxacin 150mg", display: "Thuốc kháng sinh phổ rộng", dose: "1 viên", route: "Uống", freq: "1 lần/ngày", duration: "5 ngày", qtyRx: 5, qtyDispensed: 5 },
];

function RxPanel({
  detail,
  t,
  noScroll,
  rxList = detail.rx,
  setRxList,
}: {
  detail: ConsultDetail;
  t: (k: string) => string;
  noScroll?: boolean;
  rxList?: any[];
  setRxList?: React.Dispatch<React.SetStateAction<any[]>>;
}) {
  const [isAdding, setIsAdding] = useState(false);
  
  // Form states
  const [selectedPresetIndex, setSelectedPresetIndex] = useState("-1");
  const [customDisplay, setCustomDisplay] = useState("");
  const [customInternal, setCustomInternal] = useState("");
  const [customDose, setCustomDose] = useState("");
  const [customRoute, setCustomRoute] = useState("Uống");
  const [customFreq, setCustomFreq] = useState("");
  const [customDuration, setCustomDuration] = useState("");
  const [customQtyRx, setCustomQtyRx] = useState(1);
  const [customQtyDispensed, setCustomQtyDispensed] = useState(1);

  // Auto-fill form when preset changes
  useEffect(() => {
    const idx = parseInt(selectedPresetIndex);
    if (idx >= 0 && idx < PRESET_MEDICINES.length) {
      const p = PRESET_MEDICINES[idx];
      setCustomDisplay(p.display);
      setCustomInternal(p.internal);
      setCustomDose(p.dose);
      setCustomRoute(p.route);
      setCustomFreq(p.freq);
      setCustomDuration(p.duration);
      setCustomQtyRx(p.qtyRx);
      setCustomQtyDispensed(p.qtyDispensed);
    } else {
      setCustomDisplay("");
      setCustomInternal("");
      setCustomDose("");
      setCustomRoute("Uống");
      setCustomFreq("");
      setCustomDuration("");
      setCustomQtyRx(1);
      setCustomQtyDispensed(1);
    }
  }, [selectedPresetIndex]);

  const handleAdd = () => {
    if (!customDisplay || !customInternal) return;
    const newRx = {
      internal: customInternal,
      display: customDisplay,
      dose: customDose,
      route: customRoute,
      freq: customFreq,
      duration: customDuration,
      qtyRx: Number(customQtyRx),
      qtyDispensed: Number(customQtyDispensed),
    };
    if (setRxList) {
      setRxList((prev) => [...prev, newRx]);
    }
    setIsAdding(false);
    setSelectedPresetIndex("-1");
  };

  const handleDelete = (internal: string) => {
    if (setRxList) {
      setRxList((prev) => prev.filter((m) => m.internal !== internal));
    }
  };

  return (
    <PanelShell
      noScroll={noScroll}
      footer={
        !isAdding && (
          <div className="flex gap-2">
            <button
              onClick={() => setIsAdding(true)}
              className="flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-[#034751] py-2 text-[13px] font-semibold text-white hover:bg-[#023a42]"
            >
              <Plus className="h-4 w-4" />
              {t("cs.rx.add")}
            </button>
            <button className="inline-flex items-center gap-1.5 rounded-lg border border-neutral-200 px-3 py-2 text-[13px] font-medium text-neutral-600 hover:bg-neutral-50">
              <Printer className="h-4 w-4" />
              {t("cs.rx.print")}
            </button>
          </div>
        )
      }
    >
      {/* Add Medication Form */}
      {isAdding && (
        <div className="mb-4 rounded-xl border border-[#034751]/20 bg-[#034751]/[0.02] p-4 space-y-3 shadow-[0_2px_8px_rgba(3,71,81,0.04)]">
          <div className="flex items-center justify-between border-b border-neutral-100 pb-2">
            <h4 className="text-[13px] font-bold text-[#034751] uppercase tracking-wide">Kê đơn thuốc mới</h4>
            <button onClick={() => setIsAdding(false)} className="text-neutral-400 hover:text-neutral-600">
              <X className="h-4 w-4" />
            </button>
          </div>

          <div>
            <label className="mb-1 block text-[11px] font-semibold text-neutral-500">Chọn mẫu thuốc sẵn có</label>
            <select
              value={selectedPresetIndex}
              onChange={(e) => setSelectedPresetIndex(e.target.value)}
              className="w-full rounded-lg border border-neutral-200 bg-white px-2.5 py-1.5 text-[13px] text-neutral-700 outline-none focus:border-[#034751] focus:ring-2 focus:ring-[#034751]/20"
            >
              <option value="-1">-- Tự nhập thủ công --</option>
              {PRESET_MEDICINES.map((p, i) => (
                <option key={p.internal} value={i}>
                  {p.internal} ({p.display})
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="mb-1 block text-[11px] font-semibold text-neutral-500">Tên hiển thị (Khách xem)</label>
              <input
                type="text"
                placeholder="VD: Thuốc kháng sinh"
                value={customDisplay}
                onChange={(e) => setCustomDisplay(e.target.value)}
                className="w-full rounded-lg border border-neutral-200 px-2.5 py-1.5 text-[12px] text-neutral-700 outline-none focus:border-[#034751] bg-white"
              />
            </div>
            <div>
              <label className="mb-1 block text-[11px] font-semibold text-neutral-500">Tên nội bộ (Kho)</label>
              <input
                type="text"
                placeholder="VD: Amoxicillin 500mg"
                value={customInternal}
                onChange={(e) => setCustomInternal(e.target.value)}
                className="w-full rounded-lg border border-neutral-200 px-2.5 py-1.5 text-[12px] text-neutral-700 outline-none focus:border-[#034751] bg-white"
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2">
            <div>
              <label className="mb-1 block text-[11px] font-semibold text-neutral-500">Liều dùng</label>
              <input
                type="text"
                placeholder="1 viên"
                value={customDose}
                onChange={(e) => setCustomDose(e.target.value)}
                className="w-full rounded-lg border border-neutral-200 px-2.5 py-1.5 text-[12px] text-neutral-700 outline-none focus:border-[#034751] bg-white"
              />
            </div>
            <div>
              <label className="mb-1 block text-[11px] font-semibold text-neutral-500">Đường dùng</label>
              <select
                value={customRoute}
                onChange={(e) => setCustomRoute(e.target.value)}
                className="w-full rounded-lg border border-neutral-200 bg-white px-2 py-1.5 text-[12px] text-neutral-700 outline-none focus:border-[#034751]"
              >
                <option value="Uống">Uống</option>
                <option value="Tiêm dưới da">Tiêm dưới da</option>
                <option value="Tiêm tĩnh mạch">Tiêm tĩnh mạch</option>
                <option value="Thoa ngoài da">Thoa ngoài da</option>
                <option value="Nhỏ tai">Nhỏ tai</option>
                <option value="Nhỏ mắt">Nhỏ mắt</option>
              </select>
            </div>
            <div>
              <label className="mb-1 block text-[11px] font-semibold text-neutral-500">Tần suất</label>
              <input
                type="text"
                placeholder="2 lần/ngày"
                value={customFreq}
                onChange={(e) => setCustomFreq(e.target.value)}
                className="w-full rounded-lg border border-neutral-200 px-2.5 py-1.5 text-[12px] text-neutral-700 outline-none focus:border-[#034751] bg-white"
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2">
            <div>
              <label className="mb-1 block text-[11px] font-semibold text-neutral-500">Thời gian dùng</label>
              <input
                type="text"
                placeholder="7 ngày"
                value={customDuration}
                onChange={(e) => setCustomDuration(e.target.value)}
                className="w-full rounded-lg border border-neutral-200 px-2.5 py-1.5 text-[12px] text-neutral-700 outline-none focus:border-[#034751] bg-white"
              />
            </div>
            <div>
              <label className="mb-1 block text-[11px] font-semibold text-neutral-500">Số lượng kê</label>
              <input
                type="number"
                min="1"
                value={customQtyRx}
                onChange={(e) => setCustomQtyRx(Math.max(1, parseInt(e.target.value) || 1))}
                className="w-full rounded-lg border border-neutral-200 px-2.5 py-1.5 text-[12px] text-neutral-700 outline-none focus:border-[#034751] bg-white"
              />
            </div>
            <div>
              <label className="mb-1 block text-[11px] font-semibold text-neutral-500">Số lượng cấp</label>
              <input
                type="number"
                min="0"
                value={customQtyDispensed}
                onChange={(e) => setCustomQtyDispensed(Math.max(0, parseInt(e.target.value) || 0))}
                className="w-full rounded-lg border border-neutral-200 px-2.5 py-1.5 text-[12px] text-neutral-700 outline-none focus:border-[#034751] bg-white"
              />
            </div>
          </div>

          <div className="flex gap-2 pt-2 border-t border-neutral-100">
            <button
              onClick={() => setIsAdding(false)}
              className="flex-1 rounded-lg border border-neutral-200 py-1.5 text-[12px] font-semibold text-neutral-600 hover:bg-neutral-50 bg-white"
            >
              Hủy
            </button>
            <button
              onClick={handleAdd}
              disabled={!customDisplay || !customInternal}
              className="flex-1 rounded-lg bg-[#034751] py-1.5 text-[12px] font-semibold text-white hover:bg-[#023a42] disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Thêm thuốc
            </button>
          </div>
        </div>
      )}

      {rxList.length === 0 ? (
        <div className="flex flex-col items-center gap-2 py-10 text-center">
          <Pill className="h-7 w-7 text-neutral-300" />
          <p className="text-[13px] text-neutral-400">{t("cs.rx.empty")}</p>
        </div>
      ) : (
        <div className="space-y-2.5">
          {rxList.map((m) => {
            const owed = m.qtyRx - m.qtyDispensed;
            return (
              <div key={m.internal} className="relative rounded-lg border border-neutral-200 px-3 py-2.5 bg-white hover:border-[#034751]/30 transition-colors group">
                {/* Delete button */}
                <button
                  onClick={() => handleDelete(m.internal)}
                  className="absolute top-2.5 right-2.5 p-1 rounded-md text-neutral-400 hover:text-red-600 hover:bg-red-50 opacity-0 group-hover:opacity-100 transition-opacity"
                  title="Xóa thuốc này"
                >
                  <X className="h-3.5 w-3.5" />
                </button>

                <div className="text-[13px] font-semibold text-neutral-900 pr-6">{m.display}</div>
                <div className="text-[11px] text-neutral-400">{t("cs.rx.internal")}: {m.internal}</div>
                <div className="mt-1.5 flex flex-wrap gap-x-3 gap-y-0.5 text-[12px] text-neutral-600">
                  <span>{m.dose}</span><span>·</span><span>{m.route}</span><span>·</span><span>{m.freq}</span><span>·</span><span>{m.duration}</span>
                </div>
                <div className="mt-2.5 flex flex-wrap items-center gap-2 text-[11px]">
                  <span className="rounded bg-neutral-100 px-2 py-0.5 font-medium text-neutral-600">Kê đơn: {m.qtyRx} viên</span>
                  <span className="rounded bg-[#E7F7EE] px-2 py-0.5 font-medium text-[#1B804C]">{t("cs.rx.dispensed")}: {m.qtyDispensed} viên</span>
                  {owed > 0 && <span className="rounded bg-amber-50 px-2 py-0.5 font-semibold text-amber-700">{t("cs.rx.owed")}: {owed} viên</span>}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </PanelShell>
  );
}

// ── Close consultation drawer ─────────────────────────────────────────────────
function CloseDrawer({ open, onClose, detail, words, dischargeReady, t }: { open: boolean; onClose: () => void; detail: ConsultDetail; words: number; dischargeReady: boolean; t: (k: string) => string }) {
  const [toggles, setToggles] = useState({ invoice: true, discharge: true, followup: false });
  const invItems = detail.invoice.filter((l) => !l.declined).length;
  const total = detail.invoice.filter((l) => !l.declined).reduce((a, l) => a + l.qty * l.price, 0);
  const flags = detail.labs.filter((l) => l.abnormal).length;

  return (
    <Sheet open={open} onOpenChange={(o) => !o && onClose()}>
      <SheetContent className="w-[400px] sm:max-w-[400px]">
        <SheetHeader>
          <SheetTitle>{t("cs.close.title")} · {detail.patient}</SheetTitle>
          <SheetDescription className="sr-only">Tóm tắt quá trình khám và các mục hóa đơn trước khi đóng ca khám.</SheetDescription>
        </SheetHeader>
        <div className="flex-1 space-y-4 overflow-y-auto p-5">
          <div>
            <div className="mb-2 text-[11px] font-bold uppercase tracking-wide text-neutral-400">{t("cs.close.summary")}</div>
            <div className="grid grid-cols-2 gap-2">
              <SummaryTile label="SOAP" value={`${words} từ`} />
              <SummaryTile label={t("cs.tab.invoice")} value={`${invItems} mục · ${vndShort(total)}`} />
              <SummaryTile label={t("cs.tab.rx")} value={`${detail.rx.length} thuốc`} />
              <SummaryTile label="Lab" value={flags > 0 ? `${flags} bất thường` : `${detail.labs.length} XN`} flag={flags > 0} />
            </div>
          </div>
          <div className="space-y-2">
            <ToggleRow label={t("cs.close.genInvoice")} on={toggles.invoice} onClick={() => setToggles((s) => ({ ...s, invoice: !s.invoice }))} />
            {dischargeReady ? (
              <ToggleRow label={t("cs.close.dischargeReady")} on={toggles.discharge} onClick={() => setToggles((s) => ({ ...s, discharge: !s.discharge }))} />
            ) : (
              <div className="flex items-center justify-between gap-3 rounded-lg border border-dashed border-neutral-200 px-3 py-2.5 opacity-70">
                <span className="text-[13px] font-medium text-neutral-400">{t("cs.close.dischargeEmpty")}</span>
                <Lock className="h-4 w-4 shrink-0 text-neutral-300" />
              </div>
            )}
            <ToggleRow label={t("cs.close.followup")} on={toggles.followup} onClick={() => setToggles((s) => ({ ...s, followup: !s.followup }))} />
          </div>
        </div>
        <SheetFooter>
          <button onClick={onClose} className="rounded-lg border border-neutral-200 px-4 py-2 text-sm font-medium text-neutral-600 hover:bg-neutral-50">{t("cs.cancel")}</button>
          <button onClick={onClose} className="flex-1 rounded-lg bg-[#034751] px-4 py-2 text-sm font-semibold text-white hover:bg-[#023a42]">{t("cs.close.confirm")}</button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}

function SummaryTile({ label, value, flag }: { label: string; value: string; flag?: boolean }) {
  return (
    <div className={cn("rounded-lg border p-2.5", flag ? "border-red-200 bg-red-50" : "border-neutral-200 bg-neutral-50/50")}>
      <div className="text-[11px] text-neutral-400">{label}</div>
      <div className={cn("mt-0.5 text-[13px] font-semibold", flag ? "text-red-600" : "text-neutral-800")}>{value}</div>
    </div>
  );
}

function ToggleRow({ label, on, onClick }: { label: string; on: boolean; onClick: () => void }) {
  return (
    <button onClick={onClick} className="flex w-full items-center justify-between gap-3 rounded-lg border border-neutral-200 px-3 py-2.5 text-left transition-colors hover:bg-neutral-50">
      <span className="text-[13px] font-medium text-neutral-700">{label}</span>
      <span className={cn("relative h-5 w-9 shrink-0 rounded-full transition-colors", on ? "bg-[#034751]" : "bg-neutral-300")}>
        <span className={cn("absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition-all", on ? "left-[18px]" : "left-0.5")} />
      </span>
    </button>
  );
}

function DeclineServicesModal({
  open,
  onClose,
  invoiceList,
  setInvoiceList,
  t,
}: {
  open: boolean;
  onClose: () => void;
  invoiceList: InvoiceLine[];
  setInvoiceList: React.Dispatch<React.SetStateAction<InvoiceLine[]>>;
  t: (k: string) => string;
}) {
  const activeServices = invoiceList.filter((l) => !l.declined && !l.locked);
  const [selectedNames, setSelectedNames] = useState<string[]>([]);
  const [selectedReason, setSelectedReason] = useState("Chi phí cao");
  const [customReason, setCustomReason] = useState("");

  // Reset selection states on open
  useEffect(() => {
    if (open) {
      setSelectedNames([]);
      setSelectedReason("Chi phí cao");
      setCustomReason("");
    }
  }, [open]);

  const handleDeclineBulk = () => {
    if (selectedNames.length === 0) return;
    const finalReason = selectedReason === "Khác" ? customReason : selectedReason;

    setInvoiceList((prev) =>
      prev.map((l) =>
        selectedNames.includes(l.name)
          ? { ...l, declined: true, declineReason: finalReason || "Khách từ chối" }
          : l
      )
    );
    onClose();
    setSelectedNames([]);
    setCustomReason("");
  };

  const toggleSelect = (name: string) => {
    setSelectedNames((prev) =>
      prev.includes(name) ? prev.filter((n) => n !== name) : [...prev, name]
    );
  };

  return (
    <Sheet open={open} onOpenChange={(o) => !o && onClose()}>
      <SheetContent className="w-[420px] sm:max-w-[420px] flex flex-col h-full">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2 text-red-600">
            <Ban className="h-5 w-5" />
            Ghi nhận từ chối dịch vụ
          </SheetTitle>
          <SheetDescription className="sr-only">Lựa chọn các dịch vụ đề xuất mà chủ nuôi từ chối thực hiện.</SheetDescription>
        </SheetHeader>

        <div className="flex-1 space-y-4 overflow-y-auto p-5">
          <p className="text-[13px] text-neutral-500">
            Chọn các dịch vụ hoặc thuốc mà khách hàng từ chối thực hiện trong đợt khám này để lưu lại bệnh sử và cập nhật hóa đơn.
          </p>

          {activeServices.length === 0 ? (
            <div className="rounded-lg border border-dashed border-neutral-200 p-8 text-center text-neutral-400 text-[13px]">
              Không có dịch vụ nào khả dụng để từ chối (tất cả đã bị từ chối hoặc đã khóa thanh toán).
            </div>
          ) : (
            <div className="space-y-3">
              <div className="text-[12px] font-bold uppercase tracking-wide text-neutral-400">Danh sách dịch vụ đề xuất</div>
              <div className="space-y-2 max-h-[220px] overflow-y-auto pr-1 border border-neutral-100 rounded-lg p-2 bg-neutral-50/50">
                {activeServices.map((l) => {
                  const isChecked = selectedNames.includes(l.name);
                  return (
                    <button
                      key={l.name}
                      onClick={() => toggleSelect(l.name)}
                      className={cn(
                        "flex w-full items-center justify-between gap-3 rounded-lg border px-3 py-2 text-left transition-all",
                        isChecked
                          ? "border-red-200 bg-red-50/40 text-red-900 shadow-sm"
                          : "border-neutral-200 bg-white text-neutral-700 hover:border-neutral-300"
                      )}
                    >
                      <div className="min-w-0 flex-1">
                        <div className="truncate text-[13px] font-medium leading-none mb-1">{l.name}</div>
                        <div className="text-[11px] text-neutral-400">{l.group} · {vndShort(l.price)}</div>
                      </div>
                      <span
                        className={cn(
                          "flex h-4 w-4 shrink-0 items-center justify-center rounded border transition-colors",
                          isChecked ? "border-red-600 bg-red-600 text-white" : "border-neutral-300 bg-white"
                        )}
                      >
                        {isChecked && <Check className="h-3 w-3" />}
                      </span>
                    </button>
                  );
                })}
              </div>

              {selectedNames.length > 0 && (
                <div className="space-y-3 pt-2">
                  <div className="text-[12px] font-bold uppercase tracking-wide text-neutral-400">Lý do từ chối</div>
                  <div className="grid grid-cols-2 gap-1.5">
                    {["Chi phí cao", "Hẹn hôm sau", "Khách tự chuẩn bị", "Chưa cần thiết", "Khác"].map((r) => (
                      <button
                        key={r}
                        type="button"
                        onClick={() => setSelectedReason(r)}
                        className={cn(
                          "rounded-lg border px-2 py-1.5 text-center text-[12px] font-medium transition-all",
                          selectedReason === r
                            ? "border-red-500 bg-red-50 text-red-700 font-semibold shadow-sm"
                            : "border-neutral-200 bg-white text-neutral-600 hover:bg-neutral-50"
                        )}
                      >
                        {r}
                      </button>
                    ))}
                  </div>

                  {selectedReason === "Khác" && (
                    <textarea
                      value={customReason}
                      onChange={(e) => setCustomReason(e.target.value)}
                      placeholder="Nhập lý do chi tiết từ khách hàng..."
                      rows={2}
                      className="w-full rounded-lg border border-neutral-200 px-3 py-2 text-[13px] text-neutral-700 outline-none focus:border-red-400 focus:ring-2 focus:ring-red-200/20"
                    />
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        <SheetFooter className="border-t border-neutral-100 p-4 bg-neutral-50/50">
          <button
            onClick={onClose}
            className="rounded-lg border border-neutral-200 px-4 py-2 text-sm font-medium text-neutral-600 hover:bg-neutral-50 bg-white"
          >
            Đóng
          </button>
          <button
            onClick={handleDeclineBulk}
            disabled={selectedNames.length === 0 || (selectedReason === "Khác" && !customReason.trim())}
            className={cn(
              "flex-1 rounded-lg px-4 py-2 text-sm font-semibold text-white transition-colors",
              selectedNames.length > 0 && (selectedReason !== "Khác" || customReason.trim())
                ? "bg-red-600 hover:bg-red-700"
                : "bg-neutral-200 cursor-not-allowed text-neutral-400"
            )}
          >
            Từ chối {selectedNames.length > 0 ? `${selectedNames.length} mục` : ""}
          </button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
