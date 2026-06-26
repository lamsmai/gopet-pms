import { useEffect, useState, type Dispatch, type SetStateAction } from "react";
import {
  Sparkles,
  Check,
  AlertTriangle,
  ChevronDown,
  ClipboardSignature,
  Pill,
  FlaskConical,
  FileText,
  Stethoscope,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { TFunc } from "@/lib/i18n";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetFooter,
  SheetDescription,
} from "@/components/ui/sheet";
import {
  vndShort,
  type AiScribeResult,
  type AiProcSuggestion,
  type AiRxSuggestion,
  type AiLabSuggestion,
} from "@/lib/consultation-data";

export type AiPhase = "idle" | "recording" | "processing" | "review" | "applied";
type SoapKey = "s" | "o" | "a" | "p";
type SoapMode = "skip" | "append" | "replace";

export type AiApplyPayload = {
  soap: Partial<Record<SoapKey, { mode: "append" | "replace"; text: string }>>;
  procedures: AiProcSuggestion[];
  rx: AiRxSuggestion[];
  labs: AiLabSuggestion[];
  useSummaryAsDiagnosis: boolean;
};

type Existing = { procedureNames: string[]; rxInternals: string[]; labCodes: string[] };

const SOAP_META: { key: SoapKey; letter: string; label: string }[] = [
  { key: "s", letter: "S", label: "Subjective" },
  { key: "o", letter: "O", label: "Objective" },
  { key: "a", letter: "A", label: "Assessment" },
  { key: "p", letter: "P", label: "Plan" },
];

export function fmtDur(s: number): string {
  const m = Math.floor(s / 60);
  const sec = Math.floor(s % 60);
  return `${String(m).padStart(2, "0")}:${String(sec).padStart(2, "0")}`;
}

function confTone(c: number): { bg: string; fg: string } {
  if (c >= 0.85) return { bg: "#E7F7EE", fg: "#1B804C" };
  if (c >= 0.6) return { bg: "#FEF3C7", fg: "#92400E" };
  return { bg: "#FEE2E2", fg: "#B91C1C" };
}

function ConfidenceBadge({ c, t }: { c: number; t: TFunc }) {
  const tone = confTone(c);
  return (
    <span
      className="inline-flex items-center rounded-full px-1.5 py-0.5 text-[10px] font-semibold tnum"
      style={{ background: tone.bg, color: tone.fg }}
    >
      {Math.round(c * 100)}% {t("cs.ai.confidence")}
    </span>
  );
}

function toggleSet(setter: Dispatch<SetStateAction<Set<string>>>, id: string) {
  setter((prev) => {
    const next = new Set(prev);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    return next;
  });
}

function OrderRow({
  checked,
  disabled,
  onToggle,
  title,
  sub,
  meta,
  price,
  confidence,
  t,
}: {
  checked: boolean;
  disabled: boolean;
  onToggle: () => void;
  title: string;
  sub?: string;
  meta?: string;
  price?: number;
  confidence: number;
  t: TFunc;
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onToggle}
      className={cn(
        "flex w-full items-start gap-2.5 rounded-lg border p-2.5 text-left transition-colors",
        disabled
          ? "cursor-not-allowed border-neutral-200 bg-neutral-50 opacity-70"
          : checked
          ? "border-[#034751] bg-[#034751]/[0.04]"
          : "border-neutral-200 hover:bg-neutral-50"
      )}
    >
      <span
        className={cn(
          "mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded border-2",
          disabled
            ? "border-neutral-300 bg-neutral-200 text-neutral-500"
            : checked
            ? "border-[#034751] bg-[#034751] text-white"
            : "border-neutral-300"
        )}
      >
        {(checked || disabled) && <Check className="h-3 w-3" />}
      </span>
      <span className="min-w-0 flex-1">
        <span className="flex flex-wrap items-center gap-1.5">
          <span className="text-[13px] font-semibold text-neutral-800">{title}</span>
          {meta && (
            <span className="rounded bg-neutral-100 px-1.5 py-0.5 text-[10px] font-medium text-neutral-500">{meta}</span>
          )}
          {disabled && (
            <span className="rounded bg-neutral-200 px-1.5 py-0.5 text-[10px] font-semibold text-neutral-500">
              {t("cs.ai.alreadyAdded")}
            </span>
          )}
        </span>
        {sub && <span className="mt-0.5 block text-[11px] text-neutral-500">{sub}</span>}
        <span className="mt-1 flex items-center gap-2">
          <ConfidenceBadge c={confidence} t={t} />
          {price != null && <span className="text-[11px] font-medium tnum text-neutral-500">{vndShort(price)}</span>}
        </span>
      </span>
    </button>
  );
}

function Section({
  title,
  icon: Icon,
  hint,
  children,
}: {
  title: string;
  icon: typeof Sparkles;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <div className="mb-1.5 flex flex-wrap items-center gap-x-2 gap-y-0.5">
        <Icon className="h-4 w-4 text-[#034751]" />
        <span className="text-[12px] font-bold uppercase tracking-wide text-neutral-600">{title}</span>
        {hint && <span className="text-[10px] text-neutral-400">· {hint}</span>}
      </div>
      <div className="space-y-2">{children}</div>
    </div>
  );
}

export default function AiScribeReview({
  open,
  onClose,
  result,
  phase,
  existing,
  appliedIds,
  onApply,
  t,
}: {
  open: boolean;
  onClose: () => void;
  result: AiScribeResult | null;
  phase: AiPhase;
  existing: Existing;
  appliedIds: Set<string>;
  onApply: (p: AiApplyPayload) => void;
  t: TFunc;
}) {
  const [soapMode, setSoapMode] = useState<Record<SoapKey, SoapMode>>({ s: "skip", o: "skip", a: "skip", p: "skip" });
  const [procIds, setProcIds] = useState<Set<string>>(new Set());
  const [rxIds, setRxIds] = useState<Set<string>>(new Set());
  const [labIds, setLabIds] = useState<Set<string>>(new Set());
  const [useSummary, setUseSummary] = useState(false);
  const [transcriptOpen, setTranscriptOpen] = useState(false);
  const [confirming, setConfirming] = useState(false);

  const isProcAdded = (p: AiProcSuggestion) => existing.procedureNames.includes(p.name) || appliedIds.has(p.id);
  const isRxAdded = (r: AiRxSuggestion) => existing.rxInternals.includes(r.internal) || appliedIds.has(r.id);
  const isLabAdded = (l: AiLabSuggestion) => existing.labCodes.includes(l.code) || appliedIds.has(l.id);

  // Reset staging whenever a new result loads or the drawer (re)opens.
  // New (not-already-on-chart) orders default to selected; SOAP defaults to Skip
  // (Append/Replace are an explicit choice so SOAP is never silently changed).
  useEffect(() => {
    if (!result || !open) return;
    setSoapMode({ s: "skip", o: "skip", a: "skip", p: "skip" });
    setProcIds(new Set(result.procedures.filter((p) => !isProcAdded(p)).map((p) => p.id)));
    setRxIds(new Set(result.rx.filter((r) => !isRxAdded(r)).map((r) => r.id)));
    setLabIds(new Set(result.labs.filter((l) => !isLabAdded(l)).map((l) => l.id)));
    setUseSummary(false);
    setConfirming(false);
    setTranscriptOpen(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [result?.id, open]);

  if (!result) return null;

  const soapCount = SOAP_META.filter(({ key }) => soapMode[key] !== "skip").length;
  const stagedProc = result.procedures.filter((p) => procIds.has(p.id) && !isProcAdded(p));
  const stagedRx = result.rx.filter((r) => rxIds.has(r.id) && !isRxAdded(r));
  const stagedLab = result.labs.filter((l) => labIds.has(l.id) && !isLabAdded(l));
  const totalStaged = soapCount + stagedProc.length + stagedRx.length + stagedLab.length + (useSummary ? 1 : 0);
  const isStaged = totalStaged > 0;

  const requestClose = () => {
    if (isStaged && !confirming) setConfirming(true);
    else onClose();
  };

  const handleApply = () => {
    if (!isStaged) return;
    const soap: AiApplyPayload["soap"] = {};
    SOAP_META.forEach(({ key }) => {
      const m = soapMode[key];
      if (m !== "skip") soap[key] = { mode: m, text: result.soap[key].text };
    });
    onApply({
      soap,
      procedures: stagedProc,
      rx: stagedRx,
      labs: stagedLab,
      useSummaryAsDiagnosis: useSummary,
    });
  };

  return (
    <Sheet open={open} onOpenChange={(o) => { if (!o) requestClose(); }}>
      <SheetContent className="w-full gap-0 p-0 sm:w-[560px] sm:max-w-[560px]">
        <SheetHeader className="gap-2">
          <div className="flex items-center gap-2 pr-6">
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#034751] text-white">
              <Sparkles className="h-4 w-4" />
            </span>
            <SheetTitle className="text-[16px]">{t("cs.ai.reviewTitle")}</SheetTitle>
            {phase === "applied" && (
              <span className="inline-flex items-center rounded-full bg-[#E7F7EE] px-2 py-0.5 text-[10px] font-bold text-[#1B804C]">
                <Check className="mr-0.5 h-3 w-3" />
                {t("cs.ai.applied")}
              </span>
            )}
          </div>
          <SheetDescription className="sr-only">
            {t("cs.ai.reviewTitle")} — {result.patientName}
          </SheetDescription>
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[12px] text-neutral-500">
            <span className="font-medium text-neutral-700">{result.patientName}</span>
            <span className="font-mono text-[11px]">{fmtDur(result.durationSec)}</span>
            <ConfidenceBadge c={result.overallConfidence} t={t} />
          </div>
          <div className="flex items-center gap-1.5 rounded-md bg-amber-50 px-2.5 py-1.5 text-[11px] font-medium text-amber-800">
            <AlertTriangle className="h-3.5 w-3.5 shrink-0 text-amber-500" />
            {t("cs.ai.notAutoApplied")}
          </div>
        </SheetHeader>

        <div className="flex-1 space-y-4 overflow-y-auto p-4">
          {/* Summary */}
          <Section title={t("cs.ai.summaryTitle")} icon={FileText}>
            <div className="rounded-lg border border-neutral-200 bg-[#E8F1CA]/30 p-3">
              <p className="text-[13px] leading-relaxed text-neutral-700">{result.summary.narrative}</p>
              {result.summary.keyFacts.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {result.summary.keyFacts.map((f) => (
                    <span key={f} className="rounded-full bg-white px-2 py-0.5 text-[11px] font-medium text-neutral-600 ring-1 ring-inset ring-neutral-200">
                      {f}
                    </span>
                  ))}
                </div>
              )}
              <button
                type="button"
                onClick={() => setUseSummary((v) => !v)}
                className={cn(
                  "mt-2.5 inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-[11px] font-semibold transition-colors",
                  useSummary ? "bg-[#034751] text-white" : "border border-neutral-200 bg-white text-[#034751] hover:bg-[#034751]/10"
                )}
              >
                {useSummary ? <Check className="h-3.5 w-3.5" /> : <Stethoscope className="h-3.5 w-3.5" />}
                {useSummary ? t("cs.ai.usedAsDiagnosis") : t("cs.ai.useAsDiagnosis")}
              </button>
            </div>
          </Section>

          {/* Transcript (collapsible) */}
          <div>
            <button
              type="button"
              onClick={() => setTranscriptOpen((v) => !v)}
              className="flex w-full items-center justify-between rounded-lg border border-neutral-200 px-3 py-2 text-left hover:bg-neutral-50"
            >
              <span className="flex items-center gap-2">
                <FileText className="h-4 w-4 text-[#034751]" />
                <span className="text-[12px] font-bold uppercase tracking-wide text-neutral-600">{t("cs.ai.transcriptTitle")}</span>
                <span className="text-[11px] text-neutral-400">
                  {t("cs.ai.transcriptMeta", { n: result.transcript.length, dur: fmtDur(result.durationSec) })}
                </span>
              </span>
              <ChevronDown className={cn("h-4 w-4 text-neutral-400 transition-transform", transcriptOpen && "rotate-180")} />
            </button>
            {transcriptOpen && (
              <div className="mt-2 max-h-[280px] space-y-2.5 overflow-y-auto rounded-lg border border-neutral-100 bg-neutral-50/60 p-3">
                {result.transcript.map((turn) => (
                  <div key={turn.id} className="flex gap-2">
                    <span
                      className={cn(
                        "mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[9px] font-bold",
                        turn.speaker === "vet" ? "bg-[#034751] text-white" : "bg-neutral-300 text-neutral-700"
                      )}
                    >
                      {turn.speaker === "vet" ? "V" : "O"}
                    </span>
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="text-[11px] font-semibold text-neutral-500">
                          {t(turn.speaker === "vet" ? "cs.ai.spk.vet" : "cs.ai.spk.owner")}
                        </span>
                        <span className="font-mono text-[10px] text-neutral-400">{turn.t}</span>
                      </div>
                      <p className={cn("text-[12px] leading-relaxed text-neutral-700", turn.lowConfidence && "underline decoration-dotted decoration-amber-400 underline-offset-2")}>
                        {turn.text}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* SOAP suggestions */}
          <Section title={t("cs.ai.soapTitle")} icon={Sparkles}>
            {SOAP_META.map(({ key, letter, label }) => {
              const draft = result.soap[key];
              const mode = soapMode[key];
              return (
                <div
                  key={key}
                  className={cn(
                    "rounded-lg border p-3",
                    mode === "replace" ? "border-amber-300 bg-amber-50/40" : mode === "append" ? "border-[#034751]/40 bg-[#034751]/[0.03]" : "border-neutral-200"
                  )}
                >
                  <div className="mb-1.5 flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="flex h-5 w-5 items-center justify-center rounded bg-[#034751] text-[11px] font-bold text-white">{letter}</span>
                      <span className="text-[10px] font-bold uppercase tracking-wide text-neutral-400">{label}</span>
                      <ConfidenceBadge c={draft.confidence} t={t} />
                    </div>
                    <div className="inline-flex rounded-md bg-neutral-100 p-0.5 text-[11px] font-semibold">
                      {(["skip", "append", "replace"] as const).map((m) => (
                        <button
                          key={m}
                          type="button"
                          onClick={() => setSoapMode((s) => ({ ...s, [key]: m }))}
                          className={cn(
                            "rounded px-2 py-1 transition-colors",
                            soapMode[key] === m
                              ? m === "replace"
                                ? "bg-amber-500 text-white"
                                : m === "append"
                                ? "bg-[#034751] text-white"
                                : "bg-white text-neutral-700 shadow-sm"
                              : "text-neutral-500 hover:text-neutral-700"
                          )}
                        >
                          {t(`cs.ai.mode.${m}`)}
                        </button>
                      ))}
                    </div>
                  </div>
                  <p
                    className={cn(
                      "rounded-md px-2 py-1.5 text-[13px] leading-relaxed",
                      mode === "skip" ? "bg-neutral-50 text-neutral-400" : "bg-[#E8F1CA]/40 text-neutral-700"
                    )}
                  >
                    {draft.text}
                  </p>
                  {key === "a" && mode !== "skip" && (
                    <div className="mt-1.5 text-[11px] font-medium text-[#034751]">ⓘ {t("cs.ai.affectsDischarge")}</div>
                  )}
                </div>
              );
            })}
          </Section>

          {/* Suggested procedures */}
          {result.procedures.length > 0 && (
            <Section title={t("cs.ai.procTitle")} icon={ClipboardSignature} hint={t("cs.ai.procHint")}>
              {result.procedures.map((p) => (
                <OrderRow
                  key={p.id}
                  checked={procIds.has(p.id)}
                  disabled={isProcAdded(p)}
                  onToggle={() => toggleSet(setProcIds, p.id)}
                  title={p.name}
                  meta={p.group}
                  price={p.price}
                  confidence={p.confidence}
                  t={t}
                />
              ))}
            </Section>
          )}

          {/* Suggested medications */}
          {result.rx.length > 0 && (
            <Section title={t("cs.ai.rxTitle")} icon={Pill}>
              {result.rx.map((r) => (
                <OrderRow
                  key={r.id}
                  checked={rxIds.has(r.id)}
                  disabled={isRxAdded(r)}
                  onToggle={() => toggleSet(setRxIds, r.id)}
                  title={r.display}
                  sub={`${r.internal} · ${r.dose} · ${r.freq} · ${r.duration}`}
                  confidence={r.confidence}
                  t={t}
                />
              ))}
            </Section>
          )}

          {/* Suggested labs / imaging */}
          {result.labs.length > 0 && (
            <Section title={t("cs.ai.labTitle")} icon={FlaskConical}>
              {result.labs.map((l) => (
                <OrderRow
                  key={l.id}
                  checked={labIds.has(l.id)}
                  disabled={isLabAdded(l)}
                  onToggle={() => toggleSet(setLabIds, l.id)}
                  title={l.name}
                  meta={l.code}
                  confidence={l.confidence}
                  t={t}
                />
              ))}
            </Section>
          )}

          {/* Cautions — placed last, just above the commit footer */}
          {result.cautions.length > 0 && (
            <div className="rounded-lg border border-amber-200 bg-amber-50/60 p-3">
              <div className="mb-1.5 flex items-center gap-1.5">
                <AlertTriangle className="h-4 w-4 text-amber-500" />
                <span className="text-[12px] font-bold uppercase tracking-wide text-amber-800">{t("cs.ai.cautionsTitle")}</span>
              </div>
              <ul className="space-y-1">
                {result.cautions.map((c) => (
                  <li key={c} className="flex gap-1.5 text-[12px] text-amber-900">
                    <span className="text-amber-400">•</span>
                    {c}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        <SheetFooter className="flex-col gap-2 sm:flex-col sm:gap-2">
          {confirming ? (
            <div className="w-full">
              <p className="mb-2 text-[12px] text-neutral-600">{t("cs.ai.discardConfirm")}</p>
              <div className="flex gap-2">
                <button
                  onClick={() => setConfirming(false)}
                  className="flex-1 rounded-lg border border-neutral-200 px-3 py-2 text-[13px] font-medium text-neutral-600 hover:bg-neutral-50"
                >
                  {t("cs.ai.keepReviewing")}
                </button>
                <button
                  onClick={() => { setConfirming(false); onClose(); }}
                  className="flex-1 rounded-lg bg-red-600 px-3 py-2 text-[13px] font-semibold text-white hover:bg-red-700"
                >
                  {t("cs.ai.discard")}
                </button>
              </div>
            </div>
          ) : (
            <>
              <div className="text-[11px] text-neutral-500">
                {isStaged
                  ? t("cs.ai.staged", { soap: soapCount, proc: stagedProc.length, rx: stagedRx.length, lab: stagedLab.length })
                  : t("cs.ai.nothingStaged")}
              </div>
              <div className="flex gap-2">
                <button
                  onClick={requestClose}
                  className="rounded-lg border border-neutral-200 px-4 py-2 text-[13px] font-medium text-neutral-600 hover:bg-neutral-50"
                >
                  {t("cs.ai.discard")}
                </button>
                <button
                  onClick={handleApply}
                  disabled={!isStaged}
                  className={cn(
                    "flex-1 rounded-lg px-4 py-2 text-[13px] font-semibold text-white transition-colors",
                    isStaged ? "bg-[#034751] hover:bg-[#023a42]" : "cursor-not-allowed bg-neutral-300"
                  )}
                >
                  {t("cs.ai.apply")}
                  {isStaged ? ` · ${totalStaged}` : ""}
                </button>
              </div>
            </>
          )}
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
