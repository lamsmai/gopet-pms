// ── Branch / user ────────────────────────────────────────────────────────────
export const BRANCH = { name: "Nguyen Van Huong, D7", city: "Ho Chi Minh City" };
export const USER = { name: "Olivia Rhye", role: "Front desk", initials: "OR" };

// ── Service categories ───────────────────────────────────────────────────────
export type Category =
  | "clinical"
  | "surgical"
  | "diagnostics"
  | "critical"
  | "holistic"
  | "other";

export const CATEGORY_META: Record<
  Category,
  { en: string; vi: string; varName: string }
> = {
  clinical:    { en: "Clinical",                   vi: "Khám lâm sàng",      varName: "cat-clinical" },
  surgical:    { en: "Surgical",                   vi: "Phẫu thuật",         varName: "cat-surgical" },
  diagnostics: { en: "Diagnostics",                vi: "Chẩn đoán",          varName: "cat-diagnostics" },
  critical:    { en: "Critical care",              vi: "Hồi sức",            varName: "cat-critical" },
  holistic:    { en: "Holistic & rehabilitation",  vi: "Trị liệu & phục hồi",varName: "cat-holistic" },
  other:       { en: "Other",                      vi: "Khác",               varName: "cat-other" },
};

// legend order
export const LEGEND: Category[] = ["clinical", "surgical", "diagnostics", "critical", "holistic", "other"];

// ── Doctors (resource columns) ───────────────────────────────────────────────
export type Doctor = {
  id: string;
  name: string;
  specialty: string;
  utilization: number; // %
};

export const DOCTORS: Doctor[] = [
  { id: "martyna",  name: "Dr. Martyna", specialty: "Clinical specialties",      utilization: 105 },
  { id: "lara",     name: "Dr. Lara",    specialty: "Holistic & rehabilitation", utilization: 68 },
  { id: "linh",     name: "Dr. Linh",    specialty: "Critical care",             utilization: 22 },
  { id: "mai",      name: "Dr. Mai",     specialty: "Surgical specialties",      utilization: 35 },
  { id: "andreas",  name: "Dr. Andreas", specialty: "Diagnostics & imaging",     utilization: 85 },
  { id: "sophia",   name: "Dr. Sophia",  specialty: "Nutrition",                 utilization: 48 },
  { id: "noah",     name: "Dr. Noah",    specialty: "Dentistry",                 utilization: 60 },
];

// ── Calendar grid config ─────────────────────────────────────────────────────
export const DAY_OPEN = 8;   // 08:00
export const DAY_CLOSE = 18;  // 18:00
export const HOUR_PX = 96;    // px per hour (30-min cell = 48px)
export const NOW_MIN = 138;   // 10:18 AM — minutes from DAY_OPEN

// ── Events ───────────────────────────────────────────────────────────────────
export type CalEvent = {
  id: string;
  doc: string;          // doctor id
  start: number;        // minutes from DAY_OPEN
  dur: number;          // minutes
  pet: string;
  avatar: string;       // emoji
  specialty: string;    // subtitle
  category: Category;
  emergency?: boolean;
};

export const CAL_EVENTS: CalEvent[] = [
  // Dr. Martyna — clinical (busy, 105%)
  { id: "e1",  doc: "martyna", start: 30,  dur: 60, pet: "Max",      avatar: "🐶", specialty: "Wellness exam",    category: "clinical" },
  { id: "e2",  doc: "martyna", start: 120, dur: 30, pet: "Whiskers", avatar: "🐱", specialty: "Gastroenterology", category: "clinical" },
  { id: "e3",  doc: "martyna", start: 180, dur: 60, pet: "Ginger",   avatar: "🐱", specialty: "Dermatology",      category: "clinical" },
  { id: "e4",  doc: "martyna", start: 300, dur: 30, pet: "Buddy",    avatar: "🐶", specialty: "Vaccination",      category: "clinical" },
  { id: "e5",  doc: "martyna", start: 360, dur: 60, pet: "Nala",     avatar: "🐱", specialty: "Cardiology",       category: "clinical" },

  // Dr. Lara — holistic (68%)
  { id: "e6",  doc: "lara", start: 60,  dur: 60, pet: "Bella",   avatar: "🐶", specialty: "Physiotherapy",  category: "holistic" },
  { id: "e7",  doc: "lara", start: 150, dur: 30, pet: "Mochi",   avatar: "🐱", specialty: "Acupuncture",    category: "holistic" },
  { id: "e8",  doc: "lara", start: 240, dur: 60, pet: "Toby",    avatar: "🐶", specialty: "Rehabilitation", category: "holistic" },
  { id: "e9",  doc: "lara", start: 420, dur: 30, pet: "Daisy",   avatar: "🐰", specialty: "Hydrotherapy",   category: "holistic" },

  // Dr. Linh — critical (22%, quiet) + an emergency intake
  { id: "e10", doc: "linh", start: 90,  dur: 30, pet: "Nibbles", avatar: "🐱", specialty: "Emergency intake",   category: "critical", emergency: true },
  { id: "e11", doc: "linh", start: 210, dur: 60, pet: "Oscar",   avatar: "🐶", specialty: "Critical monitoring", category: "critical" },

  // Dr. Mai — surgical (35%)
  { id: "e12", doc: "mai", start: 60,  dur: 120, pet: "Simba",  avatar: "🐱", specialty: "Spay / Neuter",  category: "surgical" },
  { id: "e13", doc: "mai", start: 240, dur: 90,  pet: "Rocky",  avatar: "🐶", specialty: "Mass removal",   category: "surgical" },
  { id: "e14", doc: "mai", start: 420, dur: 60,  pet: "Leo",    avatar: "🐶", specialty: "Orthopedics",    category: "surgical" },

  // Dr. Andreas — diagnostics (85%)
  { id: "e15", doc: "andreas", start: 30,  dur: 30, pet: "Coco",    avatar: "🐱", specialty: "X-ray imaging", category: "diagnostics" },
  { id: "e16", doc: "andreas", start: 120, dur: 60, pet: "Pumpkin", avatar: "🐶", specialty: "Ultrasound",   category: "diagnostics" },
  { id: "e17", doc: "andreas", start: 240, dur: 30, pet: "Ruby",    avatar: "🐱", specialty: "Blood panel",   category: "diagnostics" },
  { id: "e18", doc: "andreas", start: 330, dur: 60, pet: "Paws",    avatar: "🐱", specialty: "CT scan",       category: "diagnostics" },

  // Dr. Sophia — nutrition / other (48%)
  { id: "e19", doc: "sophia", start: 90,  dur: 30, pet: "Lucky",  avatar: "🐶", specialty: "Nutrition plan", category: "other" },
  { id: "e20", doc: "sophia", start: 240, dur: 60, pet: "Milo",   avatar: "🐶", specialty: "Grooming",       category: "other" },

  // Dr. Noah — dentistry / other (60%)
  { id: "e21", doc: "noah", start: 60,  dur: 60, pet: "Rascal", avatar: "🐶", specialty: "Dental cleaning", category: "other" },
  { id: "e22", doc: "noah", start: 180, dur: 30, pet: "Cleo",   avatar: "🐱", specialty: "Tooth extraction", category: "other" },
  { id: "e23", doc: "noah", start: 300, dur: 60, pet: "Bruno",  avatar: "🐶", specialty: "Dental X-ray",     category: "other" },
];

// ── Day tabs for column headers ──────────────────────────────────────────────
export const SCHEDULE_DATE = "Saturday, June 6";
