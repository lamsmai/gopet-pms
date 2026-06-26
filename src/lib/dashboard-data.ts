// ─────────────────────────────────────────────────────────────────────────────
// Dashboard — CS Role · mock data
// Source: Prototype_Handoff_Brief.docx + PRD_Dashboard_CS_v2.docx
// All values are mock; no backend. Hex values follow the brand palette in the brief.
// ─────────────────────────────────────────────────────────────────────────────

export const HEADER = {
  branch: "Nguyen Van Huong, D7",
  branchCity: "Hồ Chí Minh",
  room: "Consult Room 2",
};

// ── Summary stat tiles (left rail) ────────────────────────────────────────────
export const apptStats = {
  scheduled: 10,
  newBooking: 1,
  clientComm: 1,
  waitingToPay: 3,
};

// ── Today's Appointments (scheduled worklist preview) ─────────────────────────
export type TodayApptStatus = "not-arrived" | "arrived" | "in-consult" | "completed";
export type TodayAppt = {
  id: number;
  consultId?: string;
  name: string;
  species: "dog" | "cat";
  breed: string;
  client: string;
  mobile: string;
  vet: string;
  reason: string;
  notes?: string;
  time: string;
  status: TodayApptStatus;
};

export const todayAppointments: TodayAppt[] = [
  { id: 1, name: "Rogue", species: "dog", breed: "Labrador · Canine", client: "Erin Kenney", mobile: "+84 866 686 763", vet: "Dr. Efrain", reason: "Revisit", notes: "Pentosan injection. Huyen", time: "9:50 AM", status: "not-arrived" },
  { id: 2, name: "Puri", species: "cat", breed: "Domestic Shorthair · Feline", client: "Mai Lan Vũ", mobile: "+84 902 114 553", vet: "Dr. Linh", reason: "Vaccination", time: "10:10 AM", status: "not-arrived" },
  { id: 3, name: "Milo", species: "dog", consultId: "PK-2402", breed: "French Bulldog · Canine", client: "Truc Anh Nguyen", mobile: "+84 901 234 567", vet: "Dr. Linh", reason: "Vomiting 2 days", notes: "Bring stool sample", time: "10:30 AM", status: "arrived" },
  { id: 4, name: "Coco", species: "cat", breed: "British Shorthair · Feline", client: "Hoàng Nam Vũ", mobile: "+84 909 222 113", vet: "Dr. Sophia", reason: "Routine check", time: "11:00 AM", status: "not-arrived" },
  { id: 5, name: "Napoleon", species: "dog", consultId: "PK-2401", breed: "Beagle · Canine", client: "Jennifer Oxlade", mobile: "+84 365 277 101", vet: "Dr. Andreas", reason: "RNATT titre", notes: "Bring vaccine book", time: "11:30 AM", status: "in-consult" },
];

// ── Clinical alert flags (from Internal Vet App spec) ─────────────────────────
// An alert id may carry a detail after ":" — e.g. "allergy:Cefalexin".
export type AlertMeta = {
  /** short chip label */
  label: string;
  /** longer description shown in tooltip */
  desc: string;
  /** chip foreground / accent hex */
  color: string;
  /** chip background hex (soft tint) */
  bg: string;
  /** danger flags are never hidden behind the "+N" overflow */
  critical?: boolean;
};

export const ALERT_META: Record<string, AlertMeta> = {
  allergy:        { label: "Allergy",         desc: "Drug allergy — most critical, always shown first",        color: "#B91C1C", bg: "#FEE2E2", critical: true },
  aggressive:     { label: "Aggressive",      desc: "Aggressive / fearful patient — handle with care",         color: "#C2410C", bg: "#FFEDD5" },
  infectious:     { label: "Infectious",      desc: "Infectious disease — requires isolation room",            color: "#6B21A8", bg: "#F3E8FF" },
  senior:         { label: "Senior",          desc: "Senior patient — handle gently",                          color: "#525252", bg: "#F5F5F5" },
  anesthesia:     { label: "Anesthesia risk", desc: "Anesthesia risk — only shown when a procedure is planned", color: "#B45309", bg: "#FEF3C7" },
  brachycephalic: { label: "Brachycephalic",  desc: "Brachycephalic breed — monitor breathing",                color: "#0369A1", bg: "#E0F2FE" },
  consent:        { label: "Missing consent", desc: "Missing consent form — must be signed before proceeding", color: "#B45309", bg: "#FEF3C7" },
  cardiac:        { label: "Cardiac",         desc: "History of cardiac disease — monitor closely",            color: "#9F1239", bg: "#FFE4E6" },
  "post-surgery": { label: "Post-op",         desc: "In post-operative recovery — monitor surgical site",      color: "#034751", bg: "#E8F1CA" },
};

export function parseAlert(raw: string): { id: string; detail?: string; meta: AlertMeta } {
  const [id, detail] = raw.split(":");
  const meta = ALERT_META[id] ?? { label: id, desc: id, color: "#525252", bg: "#F5F5F5" };
  return { id, detail, meta };
}

/** Allergy flags always float to the front; others keep their order. */
export function sortAlerts(alerts: string[]): string[] {
  return [...alerts].sort((a, b) => {
    const ac = a.startsWith("allergy") ? 0 : 1;
    const bc = b.startsWith("allergy") ? 0 : 1;
    return ac - bc;
  });
}

// ── Live Queue — outpatient ───────────────────────────────────────────────────
export type QueueStatus = "In Progress" | "Arrived" | "Completed";
export type EstimateStatus = "approved" | "pending" | "deposit_paid";

export type QueuePatient = {
  id: number;
  consultId?: string;
  name: string;
  breed: string;
  age: string;
  owner: string;
  phone: string;
  reason: string;
  vet: string;
  checkinTime: string;
  waitMins: number;
  room: string;
  status: QueueStatus;
  estimateStatus: EstimateStatus;
  type: "outpatient";
  alerts: string[];
};

export const liveQueue: QueuePatient[] = [
  {
    id: 1, consultId: "PK-2401", name: "Napoleon", breed: "Beagle · Canine", age: "3y MN",
    owner: "Jennifer Oxlade", phone: "+84 365 277 101",
    reason: "RNATT (Bring Vaccine Book)",
    vet: "Dr. Andreas", checkinTime: "09:00", waitMins: 18,
    room: "Consult Room 1", status: "In Progress",
    estimateStatus: "approved", type: "outpatient",
    alerts: ["allergy:Cefalexin"],
  },
  {
    id: 2, consultId: "PK-2402", name: "Milo", breed: "French Bulldog · Canine", age: "5y MN",
    owner: "Truc Anh Nguyen", phone: "+84 901 234 567",
    reason: "Vomiting 2 days",
    vet: "Dr. Linh", checkinTime: "09:20", waitMins: 5,
    room: "Consult Room 2", status: "Arrived",
    estimateStatus: "pending", type: "outpatient",
    alerts: ["allergy:Amoxicillin", "aggressive", "brachycephalic"],
  },
  {
    id: 3, consultId: "PK-2403", name: "Bella", breed: "Golden Retriever · Canine", age: "8y F",
    owner: "Minh Khoa Tran", phone: "+84 912 345 678",
    reason: "Post-surgery check",
    vet: "Dr. Andreas", checkinTime: "08:30", waitMins: 48,
    room: "Waiting room", status: "Completed",
    estimateStatus: "approved", type: "outpatient",
    alerts: ["senior", "cardiac"],
  },
  {
    id: 4, consultId: "PK-2404", name: "Biscuit", breed: "Domestic Shorthair · Feline", age: "2y FS",
    owner: "Annie Tran", phone: "+84 866 686 763",
    reason: "Vaccination",
    vet: "Dr. Efrain", checkinTime: "10:15", waitMins: 10,
    room: "Waiting room", status: "Completed",
    estimateStatus: "pending", type: "outpatient",
    alerts: [],
  },
  {
    id: 5, consultId: "PK-2405", name: "Biscuit", breed: "Domestic Shorthair · Feline", age: "2y FS",
    owner: "Oh Se Hoon", phone: "+84 866 686 763",
    reason: "Vaccination",
    vet: "Dr. Efrain", checkinTime: "10:30", waitMins: 20,
    room: "Waiting room", status: "Completed",
    estimateStatus: "pending", type: "outpatient",
    alerts: [],
  },
];

// ── Inpatient section ─────────────────────────────────────────────────────────
export type Inpatient = {
  id: number;
  name: string;
  breed: string;
  age: string;
  owner: string;
  phone: string;
  diagnosis: string;
  admitDate: string;
  daysAgo: number;
  ward: string;
  vet: string;
  statusNote: string;
  estimateStatus: EstimateStatus;
  depositAmount?: number;
  alerts: string[];
  inpatientStatus?: "monitoring" | "procedure" | "discharge";
};

export const inpatients: Inpatient[] = [
  {
    id: 10, name: "Rex", breed: "German Shepherd · Canine", age: "4y M",
    owner: "Bao Long Le", phone: "+84 987 654 321",
    diagnosis: "Post-op splenectomy",
    admitDate: "07/06", daysAgo: 2, ward: "Inpatient ward · Cage 3",
    vet: "Dr. Linh",
    statusNote: "Stable, monitor for another 24h",
    estimateStatus: "deposit_paid", depositAmount: 2_000_000,
    alerts: ["post-surgery"],
    inpatientStatus: "monitoring",
  },
  {
    id: 11, name: "Luna", breed: "Persian · Feline", age: "6y FS",
    owner: "Thu Hà Phạm", phone: "+84 938 110 220",
    diagnosis: "Acute kidney failure — IV fluids",
    admitDate: "08/06", daysAgo: 1, ward: "Inpatient ward · Cage 1",
    vet: "Dr. Martyna",
    statusNote: "Poor appetite, monitor electrolytes",
    estimateStatus: "pending",
    alerts: ["senior", "infectious"],
    inpatientStatus: "monitoring",
  },
  {
    id: 12, name: "Mimi", breed: "British Shorthair · Feline", age: "1y F",
    owner: "Khánh Chi Nguyễn", phone: "+84 905 555 666",
    diagnosis: "Spay/neuter (Surgical Spay)",
    admitDate: "09/06", daysAgo: 0, ward: "Inpatient ward · Cage 2",
    vet: "Dr. Linh",
    statusNote: "Fasting since 8 AM, surgery scheduled for 10 AM",
    estimateStatus: "approved",
    alerts: ["consent"],
    inpatientStatus: "procedure",
  },
  {
    id: 13, name: "Lucky", breed: "Corgi · Canine", age: "2y M",
    owner: "Nguyễn Văn Hương", phone: "+84 912 345 678",
    diagnosis: "Treatment for severe ear infection",
    admitDate: "05/06", daysAgo: 4, ward: "Inpatient ward · Cage 4",
    vet: "Dr. Andreas",
    statusNote: "Ears clean and swelling resolved, awaiting owner pickup",
    estimateStatus: "approved",
    alerts: [],
    inpatientStatus: "discharge",
  },
];

// ── Tasks ─────────────────────────────────────────────────────────────────────
export type Priority = "high" | "medium" | "low";
export type Task = {
  id: number;
  text: string;
  priority: Priority;
  due: string; // ISO-ish "YYYY-MM-DD HH:mm"
  patient: string | null;
  type: "callback" | "internal";
};

export const tasks: Task[] = [
  { id: 1, text: "Call Napoleon's owner back about the lab results",   priority: "high",   due: "2026-06-09 11:00", patient: "Napoleon / Jennifer Oxlade", type: "callback" },
  { id: 2, text: "Remind owner about Milo's routine vaccination",      priority: "medium", due: "2026-06-10 09:00", patient: "Milo / Truc Anh Nguyen",     type: "internal" },
  { id: 3, text: "Confirm next week's follow-up appointment",          priority: "low",    due: "2026-06-12 14:00", patient: null,                          type: "internal" },
  { id: 4, text: "Draft post-op estimate for Rex's owner",            priority: "high",   due: "2026-06-08 16:00", patient: "Rex / Bao Long Le",          type: "internal" },
];

export const PRIORITY_META: Record<Priority, { dot: string; key: string }> = {
  high:   { dot: "#EF4444", key: "pr.high" },
  medium: { dot: "#F59E0B", key: "pr.medium" },
  low:    { dot: "#9CA3AF", key: "pr.low" },
};

// ── Notepad — 7 brand colors ──────────────────────────────────────────────────
export type NoteColor = { name: string; hex: string; dark: boolean };
export const notepadColors: NoteColor[] = [
  { name: "Space Cadet",    hex: "#191932", dark: true },
  { name: "Midnight Green", hex: "#034751", dark: true },
  { name: "Sea Green",      hex: "#4ABA7A", dark: false },
  { name: "Pear",           hex: "#C6D92C", dark: false },
  { name: "Nyanza",         hex: "#E8F1CA", dark: false },
  { name: "Thistle",        hex: "#C3B4D8", dark: false },
  { name: "Royal Purple",   hex: "#785AA6", dark: true },
];

// ── Status badge palette (PRD 3.2) ────────────────────────────────────────────
export const STATUS_META: Record<QueueStatus, { bg: string; fg: string; key: string }> = {
  Arrived:       { bg: "#4ABA7A", fg: "#FFFFFF", key: "st.arrived" },
  "In Progress": { bg: "#034751", fg: "#FFFFFF", key: "st.inprogress" },
  Completed:     { bg: "#E5E5E5", fg: "#525252", key: "st.completed" },
};
