// ─────────────────────────────────────────────────────────────────────────────
// Consultations — list + detail mock data
// Sources: PRD.md §4.4 + UI_STRUCTURE.md §4–5, reconciled with the 08/06 meeting
// summary (SOAP = continuous block, estimate = price RANGE, declined services on
// invoice, drug dual-name, vitals pre-entered by nurse, AI scribe → human approve).
// Patients reuse the dashboard set for continuity.
// ─────────────────────────────────────────────────────────────────────────────

import { deriveConsultMode, type ConsultMode } from "./consultation-mode";

export type ConsultStatus = "in-progress" | "arrived" | "booked" | "completed" | "cancelled";

export const STATUS_META: Record<ConsultStatus, { key: string; bg: string; fg: string; dot?: boolean }> = {
  "in-progress": { key: "cs.st.inprogress", bg: "#034751", fg: "#FFFFFF", dot: true },
  arrived:       { key: "cs.st.arrived",    bg: "#E7F7EE", fg: "#1B804C" },
  booked:        { key: "cs.st.booked",     bg: "#E0F2FE", fg: "#0369A1" },
  completed:     { key: "cs.st.completed",  bg: "#F5F5F5", fg: "#525252" },
  cancelled:     { key: "cs.st.cancelled",  bg: "#FEE2E2", fg: "#B91C1C" },
};

export type ConsultRow = {
  id: string;
  patient: string;
  species: "dog" | "cat";
  breed: string;
  age: string;
  sex: string;
  weight: string;
  owner: string;
  phone: string;
  reason: string;
  vet: string;
  dateLabel: string;   // "Today · 09:00"
  time: string;
  durationMin: number | null;
  status: ConsultStatus;
  allergy?: string;
  activeMeds: number;
};

export const consultations: ConsultRow[] = [
  { id: "PK-2401", patient: "Napoleon", species: "dog", breed: "Beagle", age: "3 y/o", sex: "Male (neutered)", weight: "12.4 kg",
    owner: "Jennifer Oxlade", phone: "+84 365 277 101", reason: "RNATT — rabies antibody titer test", vet: "Dr. Andreas",
    dateLabel: "Today · 09:00", time: "09:00", durationMin: 18, status: "in-progress", allergy: "Cefalexin", activeMeds: 2 },
  { id: "PK-2402", patient: "Milo", species: "dog", breed: "French Bulldog", age: "5 y/o", sex: "Male (neutered)", weight: "11.8 kg",
    owner: "Truc Anh Nguyen", phone: "+84 901 234 567", reason: "Vomiting for 2 days, not eating", vet: "Dr. Linh",
    dateLabel: "Today · 09:20", time: "09:20", durationMin: null, status: "arrived", allergy: "Amoxicillin", activeMeds: 1 },
  { id: "PK-2403", patient: "Bella", species: "dog", breed: "Golden Retriever", age: "8 y/o", sex: "Female", weight: "28.0 kg",
    owner: "Minh Khoa Tran", phone: "+84 912 345 678", reason: "Post-op surgery recheck", vet: "Dr. Andreas",
    dateLabel: "Today · 08:30", time: "08:30", durationMin: 35, status: "completed", activeMeds: 0 },
  { id: "PK-2404", patient: "Rex", species: "dog", breed: "German Shepherd", age: "4 y/o", sex: "Male", weight: "32.5 kg",
    owner: "Bao Long Le", phone: "+84 987 654 321", reason: "Post-op splenectomy — inpatient monitoring", vet: "Dr. Linh",
    dateLabel: "Today · 10:05", time: "10:05", durationMin: 12, status: "in-progress", activeMeds: 3 },
  { id: "PK-2405", patient: "Luna", species: "cat", breed: "Persian", age: "6 y/o", sex: "Female (spayed)", weight: "4.1 kg",
    owner: "Thu Hà Phạm", phone: "+84 938 110 220", reason: "Acute kidney failure — fluid therapy", vet: "Dr. Martyna",
    dateLabel: "Today · 10:30", time: "10:30", durationMin: 8, status: "in-progress", allergy: "—", activeMeds: 2 },
  { id: "PK-2406", patient: "Coco", species: "cat", breed: "British Shorthair", age: "2 y/o", sex: "Female", weight: "3.6 kg",
    owner: "Hoàng Nam Vũ", phone: "+84 909 222 113", reason: "Routine vaccination", vet: "Dr. Sophia",
    dateLabel: "Today · 11:00", time: "11:00", durationMin: null, status: "booked", activeMeds: 0 },
  { id: "PK-2399", patient: "Buddy", species: "dog", breed: "Poodle", age: "1 y/o", sex: "Male", weight: "5.2 kg",
    owner: "Khánh Linh Đỗ", phone: "+84 977 654 010", reason: "Dermatology exam — itching, hair loss", vet: "Dr. Martyna",
    dateLabel: "Yesterday · 16:20", time: "16:20", durationMin: 27, status: "completed", activeMeds: 1 },
  { id: "PK-2398", patient: "Mochi", species: "cat", breed: "Munchkin", age: "3 y/o", sex: "Male (neutered)", weight: "3.9 kg",
    owner: "Gia Bảo Trần", phone: "+84 905 778 221", reason: "General checkup", vet: "Dr. Noah",
    dateLabel: "Yesterday · 14:00", time: "14:00", durationMin: null, status: "cancelled", activeMeds: 0 },
];

// ── KPI helpers ──────────────────────────────────────────────────────────────
export function consultKpis() {
  const inProgress = consultations.filter((c) => c.status === "in-progress").length;
  const completedToday = consultations.filter((c) => c.status === "completed" && c.dateLabel.startsWith("Today")).length;
  const totalWeek = consultations.length + 22; // demo total
  const durations = consultations.filter((c) => c.durationMin != null).map((c) => c.durationMin as number);
  const avg = Math.round(durations.reduce((a, b) => a + b, 0) / durations.length);
  return { totalWeek, inProgress, completedToday, avg };
}

export function statusCounts() {
  const counts: Record<string, number> = { all: consultations.length };
  for (const c of consultations) counts[c.status] = (counts[c.status] ?? 0) + 1;
  return counts;
}

// ─────────────────────────────────────────────────────────────────────────────
// Detail
// ─────────────────────────────────────────────────────────────────────────────
export type Vital = { key: string; label: string; value: string; unit: string; delta?: string; range: string; flag?: boolean };
export type EstimateLine = { name: string; group: string; low: number; high: number; note?: string };

// ── Body map (interactive) ────────────────────────────────────────────────────
export type RegionStatus = "unset" | "abnormal" | "normal" | "clear";
export type BodyRegion = { key: string; label: string; status: RegionStatus; note: string };

export const BODY_REGIONS: { key: string; label: string }[] = [
  { key: "head", label: "Head" },
  { key: "right_ear", label: "Right ear" },
  { key: "left_ear", label: "Left ear" },
  { key: "right_eye", label: "Right eye" },
  { key: "left_eye", label: "Left eye" },
  { key: "mouth_teeth", label: "Mouth / Teeth" },
  { key: "neck", label: "Neck" },
  { key: "thorax", label: "Thorax" },
  { key: "abdomen", label: "Abdomen" },
  { key: "left_forelimb", label: "Left forelimb" },
  { key: "right_forelimb", label: "Right forelimb" },
  { key: "left_hindlimb", label: "Left hindlimb" },
  { key: "right_hindlimb", label: "Right hindlimb" },
  { key: "tail", label: "Tail" },
  { key: "skin", label: "Skin & coat" },
];

export const REGION_STATUS_META: Record<RegionStatus, { label: string; color: string; bg: string }> = {
  unset: { label: "—", color: "#D4D4D4", bg: "transparent" },
  abnormal: { label: "Abnormal", color: "#EF4444", bg: "#FEF2F2" },
  normal: { label: "Normal", color: "#22C55E", bg: "#F0FDF4" },
  clear: { label: "Clear", color: "#A3A3A3", bg: "#F9FAFB" },
};

const REGION_CYCLE: RegionStatus[] = ["unset", "abnormal", "normal", "clear"];
export function nextStatus(s: RegionStatus): RegionStatus {
  return REGION_CYCLE[(REGION_CYCLE.indexOf(s) + 1) % REGION_CYCLE.length];
}

export type BodySeed = Record<string, { status: Exclude<RegionStatus, "unset">; note?: string }>;

export function buildRegions(seed?: BodySeed): BodyRegion[] {
  return BODY_REGIONS.map((r) => ({
    ...r,
    status: seed?.[r.key]?.status ?? "unset",
    note: seed?.[r.key]?.note ?? "",
  }));
}

// ── Discharge notes ─────────────────────────────────────────────────────────
export type DietActivity = "normal" | "restricted" | "special";
export type WarnFlag = "vomiting" | "lethargy" | "bleeding" | "breathing" | "swelling" | "seizure" | "pain";

export const WARN_OPTIONS: { key: WarnFlag; label: string }[] = [
  { key: "vomiting", label: "Persistent vomiting" },
  { key: "lethargy", label: "Loss of appetite / unusual lethargy" },
  { key: "bleeding", label: "Bleeding or unusual discharge" },
  { key: "breathing", label: "Difficulty breathing" },
  { key: "swelling", label: "Redness / swelling at incision or treated area" },
  { key: "seizure", label: "Seizures" },
  { key: "pain", label: "Marked pain, unwilling to stand / move" },
];
export const DIET_OPTIONS: { key: DietActivity; label: string }[] = [
  { key: "normal", label: "Normal" },
  { key: "restricted", label: "Restricted" },
  { key: "special", label: "Special diet" },
];
export const ACTIVITY_OPTIONS: { key: DietActivity; label: string }[] = [
  { key: "normal", label: "Normal" },
  { key: "restricted", label: "Restricted activity" },
  { key: "special", label: "Complete rest" },
];

export type DischargeNotes = {
  diagnosis: string;
  procedures: string[];
  warnings: WarnFlag[];
  warningNote: string;
  diet: DietActivity;
  dietNote: string;
  activity: DietActivity;
  activityNote: string;
  clinicalNotes: string;
  careNotes: string;
  followUpDate: string | null;
  followUpNote: string;
  status: "draft" | "sent";
  sentAt: string | null;
  sentVia: ("zalo" | "email")[];
};

export const CLINIC_CONTACT = {
  branch: "ADI Clinic — Nguyễn Văn Hương Branch",
  hotline: "24/7 emergency hotline: 1800 1234",
};

/** Auto-pull "treatments performed" from invoice service lines (exclude drugs/supplies & declined). */
export function proceduresFromInvoice(invoice: InvoiceLine[]): string[] {
  return invoice.filter((l) => !l.declined && l.group !== "Medication").map((l) => l.name);
}

export type InvoiceLine = { name: string; group: string; qty: number; price: number; locked?: boolean; declined?: boolean; declineReason?: string };
export type LabReq = { name: string; code: string; status: "ordered" | "in-progress" | "completed"; result?: string; abnormal?: boolean };
export type Rx = { internal: string; display: string; dose: string; route: string; freq: string; duration: string; qtyRx: number; qtyDispensed: number };

export type ConsultDetail = ConsultRow & {
  pain: number;
  bcs: number;
  vitalsBy: string;
  vitalsAt: string;
  vitals: Vital[];
  soap: { s: string; o: string; a: string; p: string };
  bodySeed: BodySeed;
  estimate: EstimateLine[];
  invoice: InvoiceLine[];
  labs: LabReq[];
  rx: Rx[];
  mode: ConsultMode;
};

const SOAP_BY_ID: Record<string, ConsultDetail["soap"]> = {
  "PK-2401": {
    s: "Owner brought Napoleon in for a rabies antibody titer test (RNATT) required for export paperwork. Eating, drinking and toileting normally; no vomiting, no diarrhea. Vaccination booklet brought along.",
    o: "Alert, pink mucous membranes, CRT < 2s. Weight 12.4 kg (stable). Temperature 38.6°C. Heart and lungs clear on auscultation, no murmur. Peripheral lymph nodes not enlarged. Skin and coat clean.",
    a: "Healthy and eligible for blood draw for RNATT. Rabies vaccination still valid.",
    p: "Draw 2 ml of blood and send sample for RNATT (external laboratory). Results expected in 7–10 days. Counseled owner on the waiting period before becoming eligible for export.",
  },
  "PK-2402": {
    s: "Vomiting for 2 days, ~3–4 times/day, yellow foamy fluid, no blood. Not eating since last night, still drinking water. Soft stool. No clear foreign-body exposure. No medication given at home.",
    o: "Slightly tired, pale pink mucous membranes. Temperature 39.1°C (slightly high). Mild pain response on palpation of the epigastric region. ~5% dehydration (slightly reduced skin elasticity). Heart and lungs normal.",
    a: "Suspected acute gastroenteritis, foreign body not yet ruled out. Abdominal ultrasound + basic blood work needed for assessment.",
    p: "Lactated Ringer's fluids to rehydrate. Maropitant antiemetic. Withhold food for 12h then feed an easily digestible diet. Order abdominal ultrasound + CBC. Recheck in 48h if no improvement.",
  },
};

const DEFAULT_SOAP: ConsultDetail["soap"] = {
  s: "Record the reason for visit and history provided by the owner. (Subjective section)",
  o: "Clinical exam findings and vital signs. (Objective section)",
  a: "Preliminary assessment / diagnosis. (Assessment section)",
  p: "Treatment, testing and follow-up plan. (Plan section)",
};

// Per-encounter default mode overrides where the reason text alone doesn't
// capture the complexity (e.g. gastroenteritis worked up with imaging + bloods).
const MODE_BY_ID: Record<string, ConsultMode> = {
  "PK-2401": "advanced", // RNATT antibody draw — lab-centric workflow
  "PK-2402": "advanced", // gastroenteritis worked up with imaging + bloods
};

export function getConsultDetail(id: string): ConsultDetail | null {
  const row = consultations.find((c) => c.id === id);
  if (!row) return null;

  const tempFlag = row.id === "PK-2402";
  return {
    ...row,
    mode: MODE_BY_ID[id] ?? deriveConsultMode(row.reason),
    pain: row.status === "in-progress" ? 2 : 0,
    bcs: 5,
    vitalsBy: "Nurse Mai",
    vitalsAt: "09:12",
    vitals: [
      { key: "weight", label: "Weight", value: row.weight.replace(" kg", ""), unit: "kg", delta: "+0.2", range: "11–13" },
      { key: "temp", label: "Temperature", value: tempFlag ? "39.1" : "38.6", unit: "°C", delta: tempFlag ? "+0.6" : "0.0", range: "37.5–39.0", flag: tempFlag },
      { key: "hr", label: "Heart rate", value: "96", unit: "bpm", delta: "-4", range: "70–120" },
      { key: "rr", label: "Respiratory rate", value: "24", unit: "/min", delta: "+2", range: "18–34" },
      { key: "bp", label: "Blood pressure", value: "132", unit: "mmHg", range: "110–160" },
    ],
    soap: SOAP_BY_ID[id] ?? DEFAULT_SOAP,
    bodySeed:
      id === "PK-2402"
        ? {
            abdomen: { status: "abnormal", note: "Mild pain response on palpation of the epigastric region" },
            thorax: { status: "normal" },
            mouth_teeth: { status: "normal" },
            skin: { status: "clear" },
          }
        : {
            thorax: { status: "normal" },
            skin: { status: "clear" },
          },
    estimate:
      id === "PK-2402"
        ? [
            { name: "Clinical exam", group: "Exam & diagnosis", low: 200_000, high: 200_000 },
            { name: "Abdominal ultrasound", group: "Exam & diagnosis", low: 350_000, high: 500_000, note: "depends on number of regions scanned" },
            { name: "CBC blood test", group: "Lab test", low: 280_000, high: 280_000 },
            { name: "Fluid therapy + antiemetic", group: "Procedure & medication", low: 250_000, high: 450_000, note: "depends on infusion duration" },
          ]
        : [
            { name: "Clinical exam", group: "Exam & diagnosis", low: 200_000, high: 200_000 },
            { name: "RNATT test (external sample submission)", group: "Lab test", low: 850_000, high: 1_200_000, note: "partner lab fee" },
          ],
    invoice:
      id === "PK-2402"
        ? [
            { name: "Clinical exam", group: "Exam & diagnosis", qty: 1, price: 200_000, locked: true },
            { name: "CBC blood test", group: "Lab test", qty: 1, price: 280_000 },
            { name: "Abdominal ultrasound", group: "Lab test", qty: 1, price: 0, declined: true },
            { name: "Maropitant (antiemetic)", group: "Medication", qty: 1, price: 180_000 },
            { name: "Lactated Ringer's fluids 500ml", group: "Procedure", qty: 1, price: 220_000 },
          ]
        : [
            { name: "Clinical exam", group: "Exam & diagnosis", qty: 1, price: 200_000, locked: true },
            { name: "Sample collection & RNATT submission", group: "Lab test", qty: 1, price: 1_050_000 },
          ],
    labs:
      id === "PK-2402"
        ? [
            { name: "Complete blood count (CBC)", code: "CBC", status: "in-progress" },
            { name: "Abdominal ultrasound", code: "USG-ABD", status: "ordered" },
          ]
        : id === "PK-2401"
        ? [{ name: "Rabies antibody (RNATT)", code: "RNATT", status: "ordered" }]
        : [],
    rx:
      id === "PK-2402"
        ? [
            { internal: "Maropitant 16mg", display: "Antiemetic", dose: "1 tablet", route: "Oral", freq: "Once daily", duration: "3 days", qtyRx: 3, qtyDispensed: 3 },
            { internal: "Sucralfate 1g", display: "Gastric mucosa protectant", dose: "1/2 tablet", route: "Oral", freq: "Twice daily", duration: "5 days", qtyRx: 10, qtyDispensed: 5 },
          ]
        : id === "PK-2401"
        ? [
            { internal: "NexGard Spectra S", display: "Parasite prevention", dose: "1 tablet", route: "Oral", freq: "Once monthly", duration: "1 month", qtyRx: 1, qtyDispensed: 1 },
            { internal: "Drontal Plus Dog", display: "Dewormer", dose: "1.25 tablets", route: "Oral", freq: "Once", duration: "1 day", qtyRx: 2, qtyDispensed: 2 }
          ]
        : [],
  };
}

// VND short formatter
export function vndShort(n: number): string {
  return n.toLocaleString("vi-VN") + "đ";
}

// ─────────────────────────────────────────────────────────────────────────────
// AI scribe — post-transcribe result (mock). The vet records the consult, the
// "AI" returns a transcript + summary + structured SOAP/order suggestions which
// the vet reviews and selectively applies. Nothing is auto-applied.
// ─────────────────────────────────────────────────────────────────────────────
export type TranscriptTurn = { id: string; speaker: "vet" | "owner"; t: string; text: string; lowConfidence?: boolean };
export type AiDraftField = { text: string; confidence: number; sourceTurnIds: string[] };
export type AiSoapDraft = { s: AiDraftField; o: AiDraftField; a: AiDraftField; p: AiDraftField };
export type AiProcSuggestion = { id: string; name: string; group: string; price: number; confidence: number; sourceTurnIds: string[] };
export type AiRxSuggestion = Rx & { id: string; confidence: number; sourceTurnIds: string[] };
export type AiLabSuggestion = { id: string; name: string; code: string; confidence: number; sourceTurnIds: string[] };
export type AiScribeResult = {
  id: string;
  patientName: string;
  durationSec: number;
  overallConfidence: number;
  transcript: TranscriptTurn[];
  summary: { narrative: string; diagnosisText: string; keyFacts: string[] };
  soap: AiSoapDraft;
  procedures: AiProcSuggestion[];
  rx: AiRxSuggestion[];
  labs: AiLabSuggestion[];
  cautions: string[];
};

// Rich hand-crafted fixture for Milo (PK-2402) — gastroenteritis worked up with
// bloods + imaging. Suggestion NAMES/CODES intentionally mirror the existing
// PK-2402 chart entries where they overlap, so the dedupe ("already on chart")
// works and the demo never double-adds.
const MILO_AI_RESULT: AiScribeResult = {
  id: "PK-2402",
  patientName: "Milo",
  durationSec: 161,
  overallConfidence: 0.86,
  transcript: [
    { id: "t1", speaker: "owner", t: "00:04", text: "He's been vomiting for 2 days now, 3–4 times a day, yellow foamy fluid." },
    { id: "t2", speaker: "vet", t: "00:11", text: "Is there any blood in it? Is he still able to eat or drink anything?" },
    { id: "t3", speaker: "owner", t: "00:18", text: "No blood, he hasn't eaten since last night but still drinks water." },
    { id: "t4", speaker: "vet", t: "00:31", text: "On palpation there's mild pain in the epigastric region, about 5 percent dehydration.", lowConfidence: true },
    { id: "t5", speaker: "vet", t: "00:48", text: "We should run a CBC and an abdominal ultrasound, and give him fluids and an antiemetic." },
    { id: "t6", speaker: "owner", t: "00:59", text: "Yes doctor, please go ahead with all of it." },
  ],
  summary: {
    narrative:
      "Milo has been vomiting for 2 days (yellow foamy fluid, no blood), not eating since last night but still drinking water. Exam: slightly tired, fever 39.1°C, mild epigastric pain, ~5% dehydration. Plan: fluids, antiemetic, withhold food for 12h then bland diet; order CBC and abdominal ultrasound to rule out a foreign body.",
    diagnosisText: "Suspected acute gastroenteritis, foreign body not yet ruled out.",
    keyFacts: ["Vomiting 2 days, yellow foamy fluid", "Not eating since last night", "Fever 39.1°C", "~5% dehydration", "Mild epigastric pain"],
  },
  soap: {
    s: {
      text: "Vomiting for 2 days, 3–4 times/day, yellow foamy fluid, no blood. Not eating since last night, still drinking water. No medication given at home.",
      confidence: 0.9,
      sourceTurnIds: ["t1", "t3"],
    },
    o: {
      text: "Pale pink mucous membranes, slightly tired. Temperature 39.1°C. Mild epigastric pain on palpation. ~5% dehydration. Heart and lungs normal.",
      confidence: 0.82,
      sourceTurnIds: ["t4"],
    },
    a: {
      text: "Suspected acute gastroenteritis, foreign body not yet ruled out. CBC + abdominal ultrasound needed for assessment.",
      confidence: 0.78,
      sourceTurnIds: ["t4", "t5"],
    },
    p: {
      text: "Lactated Ringer's fluids to rehydrate. Maropitant antiemetic. Withhold food for 12h then feed a bland, easily digestible diet. Order CBC + abdominal ultrasound. Recheck in 48h if no improvement.",
      confidence: 0.8,
      sourceTurnIds: ["t5"],
    },
  },
  procedures: [
    { id: "ai-proc-1", name: "Lactated Ringer's fluids 500ml", group: "Procedure", price: 220_000, confidence: 0.84, sourceTurnIds: ["t5"] },
    { id: "ai-proc-2", name: "Same-day inpatient monitoring", group: "Service", price: 300_000, confidence: 0.72, sourceTurnIds: ["t5"] },
  ],
  rx: [
    { id: "ai-rx-1", internal: "Maropitant 16mg", display: "Antiemetic", dose: "1 tablet", route: "Oral", freq: "Once daily", duration: "3 days", qtyRx: 3, qtyDispensed: 3, confidence: 0.88, sourceTurnIds: ["t5"] },
    { id: "ai-rx-2", internal: "Sucralfate 1g", display: "Gastric mucosa protectant", dose: "1/2 tablet", route: "Oral", freq: "Twice daily", duration: "5 days", qtyRx: 10, qtyDispensed: 5, confidence: 0.79, sourceTurnIds: [] },
    { id: "ai-rx-3", internal: "Probiotic", display: "Digestive support", dose: "1 sachet", route: "Oral", freq: "Twice daily", duration: "7 days", qtyRx: 14, qtyDispensed: 14, confidence: 0.7, sourceTurnIds: [] },
  ],
  labs: [
    { id: "ai-lab-1", name: "Complete blood count (CBC)", code: "CBC", confidence: 0.85, sourceTurnIds: ["t5"] },
    { id: "ai-lab-2", name: "Abdominal ultrasound", code: "USG-ABD", confidence: 0.8, sourceTurnIds: ["t5"] },
    { id: "ai-lab-3", name: "Blood chemistry (liver, kidney)", code: "BIOCHEM", confidence: 0.68, sourceTurnIds: [] },
  ],
  cautions: [
    "Foreign body not yet ruled out — needs confirmation on ultrasound.",
    "Confirm body weight before calculating the Maropitant dose.",
    "Temperature 39.1°C — recheck after fluid therapy.",
  ],
};

/**
 * Mock AI scribe output for a consult. PK-2402 gets the rich hand-crafted Milo
 * fixture; any other valid consult gets a lighter result derived from its own
 * chart so the feature is demonstrable everywhere (null only for unknown ids).
 */
export function getAiScribeResult(id: string): AiScribeResult | null {
  if (id === "PK-2402") return MILO_AI_RESULT;
  const d = getConsultDetail(id);
  if (!d) return null;
  const procGroups = ["Procedure", "Surgery", "Service"];
  return {
    id,
    patientName: d.patient,
    durationSec: 132,
    overallConfidence: 0.8,
    transcript: [
      { id: "g1", speaker: "owner", t: "00:05", text: d.reason },
      { id: "g2", speaker: "vet", t: "00:22", text: d.soap.o },
      { id: "g3", speaker: "vet", t: "00:46", text: d.soap.p },
    ],
    summary: {
      narrative: `${d.reason}. ${d.soap.a}`,
      diagnosisText: d.soap.a,
      keyFacts: [d.reason, `Veterinarian: ${d.vet}`],
    },
    soap: {
      s: { text: d.soap.s, confidence: 0.85, sourceTurnIds: ["g1"] },
      o: { text: d.soap.o, confidence: 0.8, sourceTurnIds: ["g2"] },
      a: { text: d.soap.a, confidence: 0.76, sourceTurnIds: ["g2", "g3"] },
      p: { text: d.soap.p, confidence: 0.8, sourceTurnIds: ["g3"] },
    },
    procedures: d.invoice
      .filter((l) => procGroups.includes(l.group) && !l.declined)
      .map((l, i) => ({ id: `ai-proc-${i}`, name: l.name, group: l.group, price: l.price, confidence: 0.8, sourceTurnIds: ["g3"] })),
    rx: d.rx.map((r, i) => ({ ...r, id: `ai-rx-${i}`, confidence: 0.8, sourceTurnIds: ["g3"] })),
    labs: d.labs.map((l, i) => ({ id: `ai-lab-${i}`, name: l.name, code: l.code, confidence: 0.78, sourceTurnIds: ["g3"] })),
    cautions: ["Recheck medication doses against body weight.", "Confirm allergy history before prescribing."],
  };
}
