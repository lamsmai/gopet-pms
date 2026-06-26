import { useState } from "react";
import { FileText, Check, Send, Save, X, Phone, Stethoscope, Pill, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  type ConsultDetail,
  type DischargeNotes,
  type WarnFlag,
  type DietActivity,
  WARN_OPTIONS,
  DIET_OPTIONS,
  ACTIVITY_OPTIONS,
  CLINIC_CONTACT,
} from "@/lib/consultation-data";

export function isDischargeReady(d: DischargeNotes): boolean {
  return (
    d.diagnosis.trim().length > 0 &&
    (d.warnings.length > 0 || d.clinicalNotes.trim().length > 0 || d.careNotes.trim().length > 0 || d.procedures.length > 0)
  );
}

export function DischargeNotesSection({
  detail,
  discharge,
  setDischarge,
  fromSoap,
  markEdited,
  onEditRx,
  full = true,
  t,
}: {
  detail: ConsultDetail;
  discharge: DischargeNotes;
  setDischarge: React.Dispatch<React.SetStateAction<DischargeNotes>>;
  fromSoap: boolean;
  markEdited: () => void;
  onEditRx: () => void;
  full?: boolean;
  t: (k: string) => string;
}) {
  const [preview, setPreview] = useState(false);
  // In Basic mode only the essential sections show; drop the numbering so the
  // visible list reads cleanly without gaps (1·2·3·7 → no numbers).
  const num = (n: number, label: string) => (full ? `${n} · ${label}` : label);
  const ready = isDischargeReady(discharge);
  const sent = discharge.status === "sent";
  const stage: "draft" | "ready" | "sent" = sent ? "sent" : ready ? "ready" : "draft";

  function patch(p: Partial<DischargeNotes>) {
    setDischarge((d) => ({ ...d, ...p }));
  }
  function toggleWarn(w: WarnFlag) {
    setDischarge((d) => ({ ...d, warnings: d.warnings.includes(w) ? d.warnings.filter((x) => x !== w) : [...d.warnings, w] }));
  }
  function send() {
    if (!ready) return;
    setDischarge((d) => ({ ...d, status: "sent", sentAt: "10:24", sentVia: ["zalo", "email"] }));
  }

  const STAGE_BADGE = {
    draft: { label: t("dn.draft"), bg: "#F5F5F5", fg: "#737373" },
    ready: { label: t("dn.ready"), bg: "#F0FDF4", fg: "#16803C" },
    sent: { label: t("dn.sent"), bg: "#ECF5F6", fg: "#034751" },
  }[stage];

  return (
    <section className="rounded-xl border border-neutral-200 bg-white">
      {/* header */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-neutral-100 px-4 py-2.5">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <h2 className="font-display text-[15px] font-bold text-neutral-900">{t("dn.title")}</h2>
            <span className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide" style={{ background: STAGE_BADGE.bg, color: STAGE_BADGE.fg }}>
              <span className="h-1.5 w-1.5 rounded-full" style={{ background: STAGE_BADGE.fg }} />
              {STAGE_BADGE.label}
            </span>
          </div>
          <div className="mt-0.5 text-[12px] text-neutral-400">{detail.patient} · {detail.owner} · 09/06/2026</div>
        </div>
        <button onClick={() => setPreview(true)} className="inline-flex items-center gap-1.5 rounded-lg border border-neutral-200 bg-white px-2.5 py-1.5 text-[12px] font-medium text-neutral-600 hover:bg-neutral-50">
          <FileText className="h-3.5 w-3.5" />
          {t("dn.preview")}
        </button>
      </div>

      <div className="space-y-4 p-4">
        {/* 1 — Diagnosis */}
        <Field title={num(1, t("dn.s.diagnosis"))} hint={fromSoap ? t("dn.fromSoap") : undefined}>
          <textarea
            value={discharge.diagnosis}
            onChange={(e) => { markEdited(); patch({ diagnosis: e.target.value }); }}
            rows={2}
            className="w-full resize-none rounded-lg border border-neutral-200 px-3 py-2 text-[13px] text-neutral-700 outline-none focus:border-[#034751] focus:ring-2 focus:ring-[#034751]/20"
          />
        </Field>

        {/* 2 — Treatments performed */}
        <Field title={num(2, t("dn.s.procedures"))}>
          {discharge.procedures.length === 0 ? (
            <p className="text-[12px] italic text-neutral-400">{t("dn.noProcedures")}</p>
          ) : (
            <div className="flex flex-wrap gap-1.5">
              {discharge.procedures.map((p) => (
                <span key={p} className="inline-flex items-center gap-1 rounded-full bg-[#034751]/8 px-2.5 py-1 text-[12px] font-medium text-[#034751]">
                  <Stethoscope className="h-3 w-3" />
                  {p}
                  <button onClick={() => patch({ procedures: discharge.procedures.filter((x) => x !== p) })} className="ml-0.5 text-[#034751]/50 hover:text-[#034751]"><X className="h-3 w-3" /></button>
                </span>
              ))}
            </div>
          )}
        </Field>

        {/* 3 — Take-home meds (read-only from Rx) */}
        <Field title={num(3, t("dn.s.meds"))} action={<button onClick={onEditRx} className="text-[11px] font-semibold text-[#034751] hover:underline">{t("dn.editRx")} →</button>}>
          {detail.rx.length === 0 ? (
            <p className="text-[12px] italic text-neutral-400">{t("cs.rx.empty")}</p>
          ) : (
            <div className="space-y-1.5">
              {detail.rx.map((m) => (
                <div key={m.internal} className="rounded-lg border border-neutral-200 bg-neutral-50/50 px-3 py-2">
                  <div className="flex items-center gap-1.5 text-[13px] font-semibold text-neutral-800"><Pill className="h-3.5 w-3.5 text-neutral-400" />{m.display}</div>
                  <div className="mt-0.5 text-[12px] text-neutral-500">{m.dose} · {m.freq} · {m.duration} · {m.route}</div>
                </div>
              ))}
            </div>
          )}
        </Field>

        {full && (
        <>
        {/* 4 — Warning signs */}
        <Field title={`4 · ${t("dn.s.warnings")}`}>
          <div className="grid grid-cols-1 gap-1 sm:grid-cols-2">
            {WARN_OPTIONS.map((w) => {
              const on = discharge.warnings.includes(w.key);
              return (
                <button key={w.key} onClick={() => toggleWarn(w.key)} className="flex items-center gap-2 rounded-lg px-2 py-1.5 text-left text-[12px] transition-colors hover:bg-neutral-50">
                  <span className={cn("flex h-4 w-4 shrink-0 items-center justify-center rounded border-2 transition-colors", on ? "border-[#EF4444] bg-[#EF4444] text-white" : "border-neutral-300")}>
                    {on && <Check className="h-3 w-3" />}
                  </span>
                  <span className={cn(on ? "font-medium text-neutral-800" : "text-neutral-600")}>{w.label}</span>
                </button>
              );
            })}
          </div>
          <input
            value={discharge.warningNote}
            onChange={(e) => patch({ warningNote: e.target.value })}
            placeholder={t("dn.warnNotePh")}
            className="mt-2 w-full rounded-lg border border-neutral-200 px-3 py-2 text-[13px] text-neutral-700 outline-none focus:border-[#034751] focus:ring-2 focus:ring-[#034751]/20"
          />
        </Field>

        {/* 5 — Diet & activity */}
        <Field title={`5 · ${t("dn.s.diet")}`}>
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-[11px] font-medium text-neutral-500">{t("dn.diet")}</label>
              <Select value={discharge.diet} onChange={(v) => patch({ diet: v })} options={DIET_OPTIONS} />
              <input value={discharge.dietNote} onChange={(e) => patch({ dietNote: e.target.value })} placeholder={t("dn.dietPh")} className="mt-1.5 w-full rounded-lg border border-neutral-200 px-2.5 py-1.5 text-[12px] outline-none focus:border-[#034751]" />
            </div>
            <div>
              <label className="mb-1 block text-[11px] font-medium text-neutral-500">{t("dn.activity")}</label>
              <Select value={discharge.activity} onChange={(v) => patch({ activity: v })} options={ACTIVITY_OPTIONS} />
              <input value={discharge.activityNote} onChange={(e) => patch({ activityNote: e.target.value })} placeholder={t("dn.activityPh")} className="mt-1.5 w-full rounded-lg border border-neutral-200 px-2.5 py-1.5 text-[12px] outline-none focus:border-[#034751]" />
            </div>
          </div>
        </Field>

        {/* 6 — Home care */}
        <Field title={`6 · ${t("dn.s.care")}`}>
          <textarea
            value={discharge.careNotes}
            onChange={(e) => patch({ careNotes: e.target.value })}
            rows={2}
            placeholder={t("dn.carePh")}
            className="w-full resize-none rounded-lg border border-neutral-200 px-3 py-2 text-[13px] text-neutral-700 outline-none focus:border-[#034751] focus:ring-2 focus:ring-[#034751]/20"
          />
        </Field>
        </>
        )}

        {/* 7 — Follow-up */}
        <Field title={num(7, t("dn.s.followup"))}>
          <div className="flex flex-wrap gap-2">
            <input type="date" value={discharge.followUpDate ?? ""} onChange={(e) => patch({ followUpDate: e.target.value || null })} className="rounded-lg border border-neutral-200 px-2.5 py-1.5 text-[13px] text-neutral-700 outline-none focus:border-[#034751]" />
            <input value={discharge.followUpNote} onChange={(e) => patch({ followUpNote: e.target.value })} placeholder={t("dn.followPh")} className="min-w-[180px] flex-1 rounded-lg border border-neutral-200 px-3 py-1.5 text-[13px] text-neutral-700 outline-none focus:border-[#034751]" />
          </div>
        </Field>

        {/* 8 — Emergency contact (auto) */}
        <div className="rounded-lg bg-neutral-50 px-3 py-2.5">
          <div className="mb-0.5 text-[11px] font-bold uppercase tracking-wide text-neutral-400">{t("dn.s.contact")}</div>
          <div className="flex items-center gap-1.5 text-[12px] text-neutral-600"><Phone className="h-3.5 w-3.5 text-neutral-400" />{CLINIC_CONTACT.branch}</div>
          <div className="text-[12px] font-medium text-[#034751]">{CLINIC_CONTACT.hotline}</div>
        </div>
      </div>

      {/* sticky action footer (col 2) */}
      <div className="sticky bottom-0 z-10 flex items-center justify-between gap-3 rounded-b-xl border-t border-neutral-200 bg-white/95 px-4 py-3 backdrop-blur">
        {sent ? (
          <span className="inline-flex items-center gap-1.5 text-[12px] font-medium text-[#034751]"><Check className="h-4 w-4" />{t("dn.sentVia")} · {discharge.sentAt}</span>
        ) : (
          <span className="text-[11px] text-neutral-400">{ready ? t("dn.readyHint") : t("dn.draftHint")}</span>
        )}
        <div className="flex items-center gap-2">
          <button className="inline-flex items-center gap-1.5 rounded-lg border border-neutral-200 px-3 py-2 text-[13px] font-medium text-neutral-600 hover:bg-neutral-50"><Save className="h-4 w-4" />{t("dn.saveDraft")}</button>
          <button onClick={send} disabled={!ready || sent} className={cn("inline-flex items-center gap-1.5 rounded-lg px-3.5 py-2 text-[13px] font-semibold text-white transition-colors", ready && !sent ? "bg-[#034751] hover:bg-[#023a42]" : "cursor-not-allowed bg-neutral-300")}>
            <Send className="h-4 w-4" />{t("dn.send")}
          </button>
        </div>
      </div>

      {preview && <PdfPreview detail={detail} discharge={discharge} onClose={() => setPreview(false)} t={t} />}
    </section>
  );
}

function Field({ title, hint, action, children }: { title: string; hint?: string; action?: React.ReactNode; children: React.ReactNode }) {
  return (
    <div>
      <div className="mb-1.5 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="text-[12px] font-bold uppercase tracking-wide text-neutral-500">{title}</span>
          {hint && <span className="inline-flex items-center gap-1 rounded bg-[#E8F1CA] px-1.5 py-0.5 text-[10px] font-semibold text-[#3f4d12]"><Sparkles className="h-2.5 w-2.5" />{hint}</span>}
        </div>
        {action}
      </div>
      {children}
    </div>
  );
}

function Select({ value, onChange, options }: { value: DietActivity; onChange: (v: DietActivity) => void; options: { key: DietActivity; label: string }[] }) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value as DietActivity)}
      className="w-full rounded-lg border border-neutral-200 bg-white px-2.5 py-1.5 text-[13px] text-neutral-700 outline-none focus:border-[#034751]"
    >
      {options.map((o) => <option key={o.key} value={o.key}>{o.label}</option>)}
    </select>
  );
}

// ── PDF preview modal (read-only) ─────────────────────────────────────────────
function PdfPreview({ detail, discharge, onClose, t }: { detail: ConsultDetail; discharge: DischargeNotes; onClose: () => void; t: (k: string) => string }) {
  const dietLabel = DIET_OPTIONS.find((o) => o.key === discharge.diet)?.label;
  const actLabel = ACTIVITY_OPTIONS.find((o) => o.key === discharge.activity)?.label;
  const warnLabels = WARN_OPTIONS.filter((w) => discharge.warnings.includes(w.key)).map((w) => w.label);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-neutral-900/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative flex max-h-[88vh] w-[600px] flex-col overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-lift">
        <div className="flex items-center justify-between border-b border-neutral-100 px-5 py-3">
          <span className="text-[13px] font-semibold text-neutral-500">{t("dn.previewTitle")}</span>
          <button onClick={onClose} className="text-neutral-400 hover:text-neutral-600"><X className="h-5 w-5" /></button>
        </div>
        <div className="flex-1 overflow-y-auto p-8">
          {/* letterhead */}
          <div className="mb-4 flex items-center justify-between border-b-2 border-[#034751] pb-3">
            <div>
              <div className="font-display text-[18px] font-bold text-[#034751]">GoPet PMS — ADI</div>
              <div className="text-[12px] text-neutral-500">{CLINIC_CONTACT.branch}</div>
            </div>
            <div className="text-right text-[12px] text-neutral-500">Discharge note<br />09/06/2026</div>
          </div>
          <div className="mb-4 grid grid-cols-2 gap-2 rounded-lg bg-neutral-50 p-3 text-[12px]">
            <div><span className="text-neutral-400">Patient:</span> <b className="text-neutral-800">{detail.patient}</b> · {detail.breed}</div>
            <div><span className="text-neutral-400">Owner:</span> <b className="text-neutral-800">{detail.owner}</b></div>
            <div><span className="text-neutral-400">Vet:</span> {detail.vet}</div>
            <div><span className="text-neutral-400">Visit ID:</span> {detail.id}</div>
          </div>

          <PdfBlock label="Diagnosis">{discharge.diagnosis || "—"}</PdfBlock>
          <PdfBlock label="Treatments performed">{discharge.procedures.length ? discharge.procedures.join(", ") : "—"}</PdfBlock>
          <PdfBlock label="Take-home medication">
            {detail.rx.length ? (
              <ul className="ml-4 list-disc">
                {detail.rx.map((m) => <li key={m.internal}>{m.display} — {m.dose} · {m.freq} · {m.duration}</li>)}
              </ul>
            ) : "—"}
          </PdfBlock>
          <PdfBlock label="Warning signs">
            {warnLabels.length ? <ul className="ml-4 list-disc">{warnLabels.map((w) => <li key={w}>{w}</li>)}</ul> : "—"}
            {discharge.warningNote && <div className="mt-1 italic text-neutral-500">{discharge.warningNote}</div>}
          </PdfBlock>
          <PdfBlock label="Diet & activity">Diet: {dietLabel}{discharge.dietNote && ` — ${discharge.dietNote}`}. Activity: {actLabel}{discharge.activityNote && ` — ${discharge.activityNote}`}.</PdfBlock>
          <PdfBlock label="Home-care instructions">{discharge.careNotes || "—"}</PdfBlock>
          <PdfBlock label="Follow-up">{discharge.followUpDate ? `${discharge.followUpDate}${discharge.followUpNote ? ` — ${discharge.followUpNote}` : ""}` : "—"}</PdfBlock>
          {detail.invoice.some((l) => l.declined) && (
            <PdfBlock label="Services declined by client">
              <ul className="ml-4 list-disc text-red-600/90 text-[12px]">
                {detail.invoice
                  .filter((l) => l.declined)
                  .map((l) => (
                    <li key={l.name}>
                      <span className="font-medium">{l.name}</span>
                      {l.declineReason ? ` — Reason: ${l.declineReason}` : ""}
                    </li>
                  ))}
              </ul>
            </PdfBlock>
          )}

          <div className="mt-5 rounded-lg bg-neutral-50 p-3 text-[12px] text-neutral-600">
            <b>{CLINIC_CONTACT.hotline}</b>
            <div className="mt-1 text-[11px] italic text-neutral-400">Issued by ADI · For reference only; does not replace professional veterinary advice.</div>
          </div>
        </div>
      </div>
    </div>
  );
}

function PdfBlock({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="mb-3">
      <div className="text-[11px] font-bold uppercase tracking-wide text-[#034751]">{label}</div>
      <div className="mt-0.5 text-[13px] leading-relaxed text-neutral-700">{children}</div>
    </div>
  );
}
