// ─────────────────────────────────────────────────────────────────────────────
// Procedure Board — surgical / work-up / recovery / isolation kanban.
// Cards move between phases via drag-and-drop; phase order encodes the surgical
// journey (Work-up → Surgery → Recovery), with Isolation as a parallel track.
// ─────────────────────────────────────────────────────────────────────────────

export type Phase = "workup" | "surgery" | "recovery" | "isolation";
export type Species = "dog" | "cat" | "rabbit" | "other";
export type AnesthesiaRisk = "low" | "moderate" | "high";
export type ProcPriority = "routine" | "urgent" | "emergency";
export type ProcCategory = "soft-tissue" | "orthopedic" | "dental" | "diagnostic" | "isolation";

export type PhaseMeta = {
  id: Phase;
  key: string;
  accent: string;
  soft: string;
};

export const PHASES: PhaseMeta[] = [
  { id: "workup", key: "pb.phase.workup", accent: "#B7791F", soft: "#FEF3C7" },
  { id: "surgery", key: "pb.phase.surgery", accent: "#2563EB", soft: "#DBEAFE" },
  { id: "recovery", key: "pb.phase.recovery", accent: "#0E9F6E", soft: "#DEF7EC" },
  { id: "isolation", key: "pb.phase.isolation", accent: "#9333EA", soft: "#F3E8FF" },
];

export type Procedure = {
  id: string;
  pet: string;
  petId?: string;
  species: Species;
  breed: string;
  owner: string;
  procedure: string;
  category: ProcCategory;
  vet: string;
  vetInitials: string;
  nurse: string;
  phase: Phase;
  anesthesiaRisk: AnesthesiaRisk;
  priority: ProcPriority;
  scheduledAt: string;
  estDuration: string;
  consentSigned: boolean;
  room: string;
  note: string;
};

export const procedures: Procedure[] = [
  {
    id: "PRC-2041", pet: "Mochi", petId: "PAT-0102", species: "dog", breed: "Shiba Inu", owner: "Linh Tran",
    procedure: "Ovariohysterectomy (spay)", category: "soft-tissue", vet: "Dr. Lucas Tran", vetInitials: "LT", nurse: "Mai Tran",
    phase: "recovery", anesthesiaRisk: "low", priority: "routine", scheduledAt: "08:30", estDuration: "45 min",
    consentSigned: true, room: "Surgery A", note: "Routine spay. Monitor incision; pain pump at 14:00.",
  },
  {
    id: "PRC-2052", pet: "Bun", petId: "PAT-0188", species: "rabbit", breed: "Holland Lop", owner: "Quang Pham",
    procedure: "Incisor trim + molar burr", category: "dental", vet: "Dr. Mia Nguyen", vetInitials: "MN", nurse: "Hanh Vo",
    phase: "workup", anesthesiaRisk: "high", priority: "urgent", scheduledAt: "10:15", estDuration: "30 min",
    consentSigned: false, room: "Dental", note: "Rabbit GA — high risk. Pre-O2, prokinetics ready. Awaiting consent.",
  },
  {
    id: "PRC-2048", pet: "Atlas", petId: "PAT-0221", species: "dog", breed: "Belgian Malinois", owner: "ADI Rescue Partner",
    procedure: "TPLO — left stifle", category: "orthopedic", vet: "Dr. Lucas Tran", vetInitials: "LT", nurse: "Mai Tran",
    phase: "surgery", anesthesiaRisk: "moderate", priority: "routine", scheduledAt: "09:00", estDuration: "120 min",
    consentSigned: true, room: "Surgery B", note: "Cranial cruciate repair. C-arm booked. Cefazolin q90min.",
  },
  {
    id: "PRC-2055", pet: "Nori", petId: "PAT-0144", species: "cat", breed: "British Shorthair", owner: "Emma Wilson",
    procedure: "Dental scaling + 2 extractions", category: "dental", vet: "Dr. Sarah Le", vetInitials: "SL", nurse: "Hanh Vo",
    phase: "workup", anesthesiaRisk: "moderate", priority: "routine", scheduledAt: "11:00", estDuration: "60 min",
    consentSigned: true, room: "Dental", note: "Pre-anesthetic bloods normal. Dental radiographs first.",
  },
  {
    id: "PRC-2060", pet: "Pepper", species: "dog", breed: "Cocker Spaniel", owner: "David Chen",
    procedure: "Mass removal — flank", category: "soft-tissue", vet: "Dr. Sarah Le", vetInitials: "SL", nurse: "Mai Tran",
    phase: "surgery", anesthesiaRisk: "low", priority: "routine", scheduledAt: "09:45", estDuration: "40 min",
    consentSigned: true, room: "Surgery A", note: "2cm subcutaneous mass. Submit for histopath.",
  },
  {
    id: "PRC-2061", pet: "Luna", species: "cat", breed: "Domestic Shorthair", owner: "Thao Bui",
    procedure: "Cystotomy — bladder stones", category: "soft-tissue", vet: "Dr. Lucas Tran", vetInitials: "LT", nurse: "Hanh Vo",
    phase: "workup", anesthesiaRisk: "moderate", priority: "urgent", scheduledAt: "12:30", estDuration: "75 min",
    consentSigned: true, room: "Surgery B", note: "Obstructed overnight; catheter placed. IV fluids running.",
  },
  {
    id: "PRC-2038", pet: "Rocky", species: "dog", breed: "French Bulldog", owner: "Minh Le",
    procedure: "Enucleation — right eye", category: "soft-tissue", vet: "Dr. Mia Nguyen", vetInitials: "MN", nurse: "Mai Tran",
    phase: "recovery", anesthesiaRisk: "high", priority: "routine", scheduledAt: "08:00", estDuration: "50 min",
    consentSigned: true, room: "Surgery A", note: "Brachycephalic — extubate late, keep sternal. SpO2 monitor on.",
  },
  {
    id: "PRC-2064", pet: "Coco", species: "dog", breed: "Poodle", owner: "Hà Nguyen",
    procedure: "Foreign body removal (enterotomy)", category: "soft-tissue", vet: "Dr. Lucas Tran", vetInitials: "LT", nurse: "Hanh Vo",
    phase: "surgery", anesthesiaRisk: "high", priority: "emergency", scheduledAt: "Now", estDuration: "90 min",
    consentSigned: true, room: "Surgery B", note: "EMERGENCY — linear FB, ate a sock. Septic risk. Lavage ready.",
  },
  {
    id: "PRC-2031", pet: "Simba", species: "cat", breed: "Maine Coon", owner: "Lan Pham",
    procedure: "Parvo/panleuk isolation", category: "isolation", vet: "Dr. Sarah Le", vetInitials: "SL", nurse: "Mai Tran",
    phase: "isolation", anesthesiaRisk: "low", priority: "urgent", scheduledAt: "—", estDuration: "—",
    consentSigned: true, room: "Isolation 1", note: "Panleukopenia suspect. Barrier nursing. Day 2 — eating small amounts.",
  },
  {
    id: "PRC-2029", pet: "Bella", species: "dog", breed: "Beagle", owner: "Tuan Vo",
    procedure: "Post-op wound dehiscence watch", category: "isolation", vet: "Dr. Mia Nguyen", vetInitials: "MN", nurse: "Hanh Vo",
    phase: "isolation", anesthesiaRisk: "low", priority: "routine", scheduledAt: "—", estDuration: "—",
    consentSigned: true, room: "Isolation 2", note: "MRSP-positive wound. Contact precautions. Culture pending.",
  },
  {
    id: "PRC-2066", pet: "Gấu", species: "dog", breed: "Phú Quốc Ridgeback", owner: "Đức Trần",
    procedure: "Castration", category: "soft-tissue", vet: "Dr. Sarah Le", vetInitials: "SL", nurse: "Mai Tran",
    phase: "recovery", anesthesiaRisk: "low", priority: "routine", scheduledAt: "08:45", estDuration: "25 min",
    consentSigned: true, room: "Surgery A", note: "Uneventful. Discharge once fully ambulatory.",
  },
  {
    id: "PRC-2068", pet: "Miu", species: "cat", breed: "Tabby", owner: "Ngọc Hồ",
    procedure: "Exploratory ultrasound (sedation)", category: "diagnostic", vet: "Dr. Lucas Tran", vetInitials: "LT", nurse: "Hanh Vo",
    phase: "workup", anesthesiaRisk: "low", priority: "routine", scheduledAt: "13:00", estDuration: "30 min",
    consentSigned: false, room: "Imaging", note: "Light sedation for abdominal AUS. Fast confirmed.",
  },
];

export const PROC_ORDER: Phase[] = ["workup", "surgery", "recovery", "isolation"];

export function phaseMeta(id: Phase) {
  return PHASES.find((p) => p.id === id) ?? PHASES[0];
}

/** Next phase in the surgical journey (Work-up → Surgery → Recovery); Isolation has no auto-advance. */
export function nextPhase(p: Phase): Phase | null {
  if (p === "workup") return "surgery";
  if (p === "surgery") return "recovery";
  return null;
}

export function procSummary(list: Procedure[]) {
  return {
    total: list.length,
    inSurgery: list.filter((p) => p.phase === "surgery").length,
    recovery: list.filter((p) => p.phase === "recovery").length,
    highRisk: list.filter((p) => p.anesthesiaRisk === "high").length,
    awaitingConsent: list.filter((p) => !p.consentSigned).length,
  };
}
