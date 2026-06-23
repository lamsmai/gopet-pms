// ─────────────────────────────────────────────────────────────────────────────
// Catalog / Master Registry — the most-upstream context. One polymorphic
// CatalogItem (type discriminant + typeConfig union) for Services, Products,
// Procedures, Diagnoses, Vaccines, Diet and Lab. Price is an (item × price-list)
// pair, never an item field; tax + revenue category live on the item and are
// applied per line at invoice time. Catalog items are global to ADI — only their
// prices are branch / country scoped. Mock data; edits live in component state.
//   Ref: docs/architecture/04-catalog-master-registry.md
// ─────────────────────────────────────────────────────────────────────────────

export type Localized = { en: string; vi: string };

export type CatalogType = "service" | "product" | "procedure" | "diagnosis" | "vaccine" | "diet" | "lab";

export type TaxClassKey = "vat-0" | "vat-5" | "vat-8" | "vat-10" | "exempt";

export type RevenueCategoryKey =
  | "exam"
  | "surgery"
  | "anesthesia"
  | "dentistry"
  | "hospitalization"
  | "pharmacy"
  | "parasiticides"
  | "vaccines"
  | "lab"
  | "imaging"
  | "boarding"
  | "grooming"
  | "taxi"
  | "retail"
  | "diet"
  | "wellness-plans";

// ── Reminder rule — the engine's upstream half ────────────────────────────────
// A template ("rabies → due in P1Y/P3Y"); applying it spawns a ReminderInstance
// on the patient. `supersedes` encodes the classic case: a 3-year rabies rule
// auto-cancels pending 1-year rabies reminders.
export type ReminderRule = {
  intervalIso: string; // ISO-8601 duration — P1Y, P3Y, P6M…
  channelPref: "zalo" | "sms" | "email";
  conditions?: string; // species/age filter, free-text summary
  supersedes?: string[]; // CatalogItem codes whose pending reminders this cancels
};

// ── typeConfig — discriminated union (the extension seam) ─────────────────────
// Adding a new kind of catalog item is a new union member, not a new table.
// The `type` field always equals the parent CatalogItem.type.
export type TypeConfig =
  | { type: "service"; durationMin: number; resource: string; signOffRequired?: boolean }
  | { type: "product"; inventorySku: string; dispensingFee?: number }
  | { type: "procedure"; boardPhase: string; consentForm?: string; anesthesia: boolean }
  | { type: "diagnosis"; notifiable: boolean }
  | { type: "vaccine"; isRabies: boolean; route: string; manufacturer: string; reminder: ReminderRule }
  | { type: "diet"; feedingPlan: string }
  | { type: "lab"; tat: string; external: boolean; panel?: string[] };

export type CatalogItem = {
  id: string;
  code: string; // master-registry key — unique, stable, referenced across modules
  type: CatalogType;
  name: Localized;
  revenueCategoryKey: RevenueCategoryKey;
  taxClassKey: TaxClassKey;
  defaultUnit: string; // exam | tablet | ml | night | dose | test | chew | trip…
  active: boolean;
  basePrice: number; // sell price on the default (country) price list, VND
  buyPrice?: number; // for COGS / margin where applicable
  venomCode?: string; // controlled-vocab code (diagnosis / procedure)
  typeConfig: TypeConfig;
};

// ── Price lists — price is an (item × price-list) pair ────────────────────────
export type PriceList = {
  id: string;
  name: Localized;
  scope: "country" | "branch";
  scopeLabel: string;
  isDefault: boolean;
};

export const PRICE_LISTS: PriceList[] = [
  { id: "PL-VN", name: { en: "Vietnam — default", vi: "Việt Nam — mặc định" }, scope: "country", scopeLabel: "Vietnam", isDefault: true },
  { id: "PL-D7", name: { en: "Nguyen Van Huong, D7", vi: "Nguyễn Văn Hưởng, Q7" }, scope: "branch", scopeLabel: "Nguyen Van Huong, D7", isDefault: false },
  { id: "PL-D5", name: { en: "Vo Van Kiet, D5", vi: "Võ Văn Kiệt, Q5" }, scope: "branch", scopeLabel: "Vo Van Kiet, D5", isDefault: false },
];

// Branch overrides only — anything not listed falls back to the item's basePrice
// (most-specific currently-effective list wins: branch → country → default).
// Keyed priceListId → itemId → sellPrice.
export const BRANCH_OVERRIDES: Record<string, Record<string, number>> = {
  "PL-D7": {
    "CI-EXAM-GEN": 320_000, // flagship premium
    "CI-PROC-SPAY": 1_650_000,
    "CI-PROC-TPLO": 13_500_000,
    "CI-DIET-RCURI": 560_000,
  },
  "PL-D5": {
    "CI-EXAM-GEN": 240_000, // value branch
    "CI-PROC-SPAY": 1_280_000,
    "CI-VAC-RAB3": 320_000,
  },
};

// ── Tax classes — authoritative VAT rate lives here, applied per line ─────────
export type TaxClass = { key: TaxClassKey; vatRate: number; label: Localized };

export const TAX_CLASSES: TaxClass[] = [
  { key: "vat-0", vatRate: 0, label: { en: "VAT 0%", vi: "GTGT 0%" } },
  { key: "vat-5", vatRate: 5, label: { en: "VAT 5% — meds & vaccines", vi: "GTGT 5% — thuốc & vắc-xin" } },
  { key: "vat-8", vatRate: 8, label: { en: "VAT 8% — retail", vi: "GTGT 8% — bán lẻ" } },
  { key: "vat-10", vatRate: 10, label: { en: "VAT 10% — services", vi: "GTGT 10% — dịch vụ" } },
  { key: "exempt", vatRate: 0, label: { en: "Exempt", vi: "Miễn thuế" } },
];

// ── Revenue categories — the GL spine (AAHA/VMG-aligned) ──────────────────────
export type RevenueCategory = { key: RevenueCategoryKey; label: Localized; glCode: string };

export const REVENUE_CATEGORIES: RevenueCategory[] = [
  { key: "exam", label: { en: "Consultations & Exams", vi: "Khám & tư vấn" }, glCode: "4100" },
  { key: "surgery", label: { en: "Surgery", vi: "Phẫu thuật" }, glCode: "4200" },
  { key: "anesthesia", label: { en: "Anaesthesia & Sedation", vi: "Gây mê & an thần" }, glCode: "4210" },
  { key: "dentistry", label: { en: "Dentistry", vi: "Nha khoa" }, glCode: "4300" },
  { key: "hospitalization", label: { en: "Hospitalisation", vi: "Nội trú & điều trị" }, glCode: "4400" },
  { key: "pharmacy", label: { en: "Pharmacy", vi: "Dược phẩm" }, glCode: "4500" },
  { key: "parasiticides", label: { en: "Parasite Control", vi: "Phòng ký sinh trùng" }, glCode: "4510" },
  { key: "vaccines", label: { en: "Vaccinations", vi: "Tiêm phòng" }, glCode: "4520" },
  { key: "lab", label: { en: "Laboratory", vi: "Xét nghiệm" }, glCode: "4600" },
  { key: "imaging", label: { en: "Diagnostic Imaging", vi: "Chẩn đoán hình ảnh" }, glCode: "4610" },
  { key: "boarding", label: { en: "Boarding", vi: "Lưu trú" }, glCode: "4700" },
  { key: "grooming", label: { en: "Grooming", vi: "Grooming" }, glCode: "4710" },
  { key: "taxi", label: { en: "Pet Taxi", vi: "Pet Taxi" }, glCode: "4720" },
  { key: "retail", label: { en: "Retail & Merchandise", vi: "Bán lẻ" }, glCode: "4800" },
  { key: "diet", label: { en: "Food & Diet", vi: "Thức ăn & dinh dưỡng" }, glCode: "4810" },
  { key: "wellness-plans", label: { en: "Wellness / Pre-Paid Plans", vi: "Gói chăm sóc" }, glCode: "4900" },
];

// ── Type metadata — display accent / soft, ordered for the filter pills ───────
export type TypeMeta = { id: CatalogType; labelKey: string; accent: string; soft: string };

export const CATALOG_TYPES: TypeMeta[] = [
  { id: "service", labelKey: "mr.type.service", accent: "#034751", soft: "#E2F0EE" },
  { id: "product", labelKey: "mr.type.product", accent: "#2563EB", soft: "#DBEAFE" },
  { id: "procedure", labelKey: "mr.type.procedure", accent: "#9333EA", soft: "#F3E8FF" },
  { id: "diagnosis", labelKey: "mr.type.diagnosis", accent: "#E11D48", soft: "#FFE4E6" },
  { id: "vaccine", labelKey: "mr.type.vaccine", accent: "#0E9F6E", soft: "#DEF7EC" },
  { id: "diet", labelKey: "mr.type.diet", accent: "#B7791F", soft: "#FEF3C7" },
  { id: "lab", labelKey: "mr.type.lab", accent: "#0891B2", soft: "#CFFAFE" },
];

// ── Seed registry ─────────────────────────────────────────────────────────────
export const catalogItems: CatalogItem[] = [
  // Services
  {
    id: "CI-EXAM-GEN", code: "SVC-EXAM-GEN", type: "service", name: { en: "General consultation", vi: "Khám tổng quát" },
    revenueCategoryKey: "exam", taxClassKey: "vat-10", defaultUnit: "exam", active: true, basePrice: 280_000,
    typeConfig: { type: "service", durationMin: 20, resource: "Exam room" },
  },
  {
    id: "CI-EXAM-EMERG", code: "SVC-EXAM-ER", type: "service", name: { en: "Emergency triage & exam", vi: "Khám cấp cứu" },
    revenueCategoryKey: "exam", taxClassKey: "vat-10", defaultUnit: "exam", active: true, basePrice: 550_000,
    typeConfig: { type: "service", durationMin: 30, resource: "ER bay" },
  },
  {
    id: "CI-HOSP-NIGHT", code: "SVC-HOSP-NIGHT", type: "service", name: { en: "Hospitalisation (per night)", vi: "Lưu viện (mỗi đêm)" },
    revenueCategoryKey: "hospitalization", taxClassKey: "vat-10", defaultUnit: "night", active: true, basePrice: 350_000,
    typeConfig: { type: "service", durationMin: 0, resource: "Ward cage" },
  },
  {
    id: "CI-IMG-XRAY", code: "SVC-IMG-XRAY", type: "service", name: { en: "Radiograph (per view)", vi: "Chụp X-quang (mỗi phim)" },
    revenueCategoryKey: "imaging", taxClassKey: "vat-10", defaultUnit: "view", active: true, basePrice: 300_000,
    typeConfig: { type: "service", durationMin: 15, resource: "Imaging room" },
  },
  {
    id: "CI-IMG-US", code: "SVC-IMG-US", type: "service", name: { en: "Abdominal ultrasound", vi: "Siêu âm ổ bụng" },
    revenueCategoryKey: "imaging", taxClassKey: "vat-10", defaultUnit: "scan", active: true, basePrice: 650_000,
    typeConfig: { type: "service", durationMin: 30, resource: "Imaging room", signOffRequired: true },
  },
  {
    id: "CI-GRM-FULL", code: "SVC-GRM-FULL", type: "service", name: { en: "Full grooming (medium dog)", vi: "Grooming trọn gói (chó vừa)" },
    revenueCategoryKey: "grooming", taxClassKey: "vat-10", defaultUnit: "session", active: true, basePrice: 420_000,
    typeConfig: { type: "service", durationMin: 90, resource: "Grooming bay" },
  },
  {
    id: "CI-BRD-NIGHT", code: "SVC-BRD-NIGHT", type: "service", name: { en: "Boarding (per night, cat)", vi: "Lưu trú (mỗi đêm, mèo)" },
    revenueCategoryKey: "boarding", taxClassKey: "vat-10", defaultUnit: "night", active: true, basePrice: 250_000,
    typeConfig: { type: "service", durationMin: 0, resource: "Cattery suite" },
  },
  {
    id: "CI-TAXI-TRIP", code: "SVC-TAXI", type: "service", name: { en: "Pet taxi (one-way, in-city)", vi: "Pet taxi (một chiều, nội thành)" },
    revenueCategoryKey: "taxi", taxClassKey: "vat-10", defaultUnit: "trip", active: false, basePrice: 180_000,
    typeConfig: { type: "service", durationMin: 0, resource: "Taxi vehicle" },
  },
  {
    id: "CI-WELL-KITTEN", code: "SVC-PLAN-KITTEN", type: "service", name: { en: "Kitten wellness plan (12-mo)", vi: "Gói chăm sóc mèo con (12 tháng)" },
    revenueCategoryKey: "wellness-plans", taxClassKey: "vat-10", defaultUnit: "plan", active: true, basePrice: 3_200_000,
    typeConfig: { type: "service", durationMin: 0, resource: "—" },
  },

  // Procedures
  {
    id: "CI-PROC-SPAY", code: "PROC-SPAY", type: "procedure", name: { en: "Ovariohysterectomy (spay)", vi: "Triệt sản cái (cắt buồng trứng)" },
    revenueCategoryKey: "surgery", taxClassKey: "vat-10", defaultUnit: "procedure", active: true, basePrice: 1_400_000,
    venomCode: "VeNom-2890",
    typeConfig: { type: "procedure", boardPhase: "surgery", consentForm: "CF-SURGERY-GA", anesthesia: true },
  },
  {
    id: "CI-PROC-NEUTER", code: "PROC-NEUTER", type: "procedure", name: { en: "Castration (neuter)", vi: "Triệt sản đực" },
    revenueCategoryKey: "surgery", taxClassKey: "vat-10", defaultUnit: "procedure", active: true, basePrice: 950_000,
    venomCode: "VeNom-2884",
    typeConfig: { type: "procedure", boardPhase: "surgery", consentForm: "CF-SURGERY-GA", anesthesia: true },
  },
  {
    id: "CI-PROC-TPLO", code: "PROC-TPLO", type: "procedure", name: { en: "TPLO — cranial cruciate repair", vi: "TPLO — chỉnh dây chằng chéo trước" },
    revenueCategoryKey: "surgery", taxClassKey: "vat-10", defaultUnit: "procedure", active: true, basePrice: 12_000_000,
    venomCode: "VeNom-3145",
    typeConfig: { type: "procedure", boardPhase: "surgery", consentForm: "CF-ORTHO", anesthesia: true },
  },
  {
    id: "CI-PROC-DENTAL", code: "PROC-DENTAL", type: "procedure", name: { en: "Dental scaling + extractions", vi: "Cạo vôi răng + nhổ răng" },
    revenueCategoryKey: "dentistry", taxClassKey: "vat-10", defaultUnit: "procedure", active: true, basePrice: 2_100_000,
    venomCode: "VeNom-3010",
    typeConfig: { type: "procedure", boardPhase: "workup", consentForm: "CF-DENTAL-GA", anesthesia: true },
  },

  // Anaesthesia (priced as a product line, VAT 5%)
  {
    id: "CI-ANES-ISO", code: "PRD-ANES-ISO", type: "product", name: { en: "Isoflurane anaesthesia", vi: "Gây mê Isoflurane" },
    revenueCategoryKey: "anesthesia", taxClassKey: "vat-5", defaultUnit: "case", active: true, basePrice: 280_000, buyPrice: 120_000,
    typeConfig: { type: "product", inventorySku: "ANES-ISO-250" },
  },

  // Pharmacy products
  {
    id: "CI-MED-AMOX", code: "PRD-MED-AMOX", type: "product", name: { en: "Amoxicillin 250mg (per tablet)", vi: "Amoxicillin 250mg (mỗi viên)" },
    revenueCategoryKey: "pharmacy", taxClassKey: "vat-5", defaultUnit: "tablet", active: true, basePrice: 8_500, buyPrice: 4_200,
    typeConfig: { type: "product", inventorySku: "MED-AMOX-250", dispensingFee: 20_000 },
  },
  {
    id: "CI-MED-MELO", code: "PRD-MED-MELO", type: "product", name: { en: "Meloxicam 1.5mg/ml oral susp.", vi: "Meloxicam 1.5mg/ml dạng uống" },
    revenueCategoryKey: "pharmacy", taxClassKey: "vat-5", defaultUnit: "ml", active: true, basePrice: 16_000, buyPrice: 7_800,
    typeConfig: { type: "product", inventorySku: "MED-MELO-15", dispensingFee: 20_000 },
  },
  {
    id: "CI-MED-APOQ", code: "PRD-MED-APOQ", type: "product", name: { en: "Apoquel 16mg (per tablet)", vi: "Apoquel 16mg (mỗi viên)" },
    revenueCategoryKey: "pharmacy", taxClassKey: "vat-5", defaultUnit: "tablet", active: true, basePrice: 47_000, buyPrice: 31_000,
    typeConfig: { type: "product", inventorySku: "MED-APOQ-16" },
  },

  // Parasiticides
  {
    id: "CI-PAR-BRAV", code: "PRD-PAR-BRAV", type: "product", name: { en: "Bravecto chew 10–20kg", vi: "Bravecto viên nhai 10–20kg" },
    revenueCategoryKey: "parasiticides", taxClassKey: "vat-5", defaultUnit: "chew", active: true, basePrice: 680_000, buyPrice: 470_000,
    typeConfig: { type: "product", inventorySku: "PAR-BRAV-M" },
  },
  {
    id: "CI-PAR-FRONT", code: "PRD-PAR-FRONT", type: "product", name: { en: "Frontline Plus (dog)", vi: "Frontline Plus (chó)" },
    revenueCategoryKey: "parasiticides", taxClassKey: "vat-5", defaultUnit: "pipette", active: true, basePrice: 320_000, buyPrice: 210_000,
    typeConfig: { type: "product", inventorySku: "PAR-FRONT-D" },
  },

  // Retail
  {
    id: "CI-RET-ECOL", code: "PRD-RET-ECOL", type: "product", name: { en: "E-collar (medium)", vi: "Vòng chống liếm (vừa)" },
    revenueCategoryKey: "retail", taxClassKey: "vat-8", defaultUnit: "unit", active: true, basePrice: 150_000, buyPrice: 70_000,
    typeConfig: { type: "product", inventorySku: "SUP-ECOL-M" },
  },
  {
    id: "CI-RET-SHAMP", code: "PRD-RET-SHAMP", type: "product", name: { en: "Medicated shampoo 250ml", vi: "Dầu tắm trị liệu 250ml" },
    revenueCategoryKey: "retail", taxClassKey: "vat-8", defaultUnit: "bottle", active: true, basePrice: 220_000, buyPrice: 130_000,
    typeConfig: { type: "product", inventorySku: "SUP-SHAMP" },
  },

  // Vaccines (reminder rules attached)
  {
    id: "CI-VAC-RAB3", code: "VAC-RAB-3Y", type: "vaccine", name: { en: "Rabies vaccine (3-year)", vi: "Vắc-xin dại (3 năm)" },
    revenueCategoryKey: "vaccines", taxClassKey: "vat-5", defaultUnit: "dose", active: true, basePrice: 350_000, buyPrice: 190_000,
    typeConfig: {
      type: "vaccine", isRabies: true, route: "SC", manufacturer: "Boehringer (Imrab 3)",
      reminder: { intervalIso: "P3Y", channelPref: "zalo", conditions: "Dogs & cats ≥ 12 weeks", supersedes: ["VAC-RAB-1Y"] },
    },
  },
  {
    id: "CI-VAC-RAB1", code: "VAC-RAB-1Y", type: "vaccine", name: { en: "Rabies vaccine (1-year)", vi: "Vắc-xin dại (1 năm)" },
    revenueCategoryKey: "vaccines", taxClassKey: "vat-5", defaultUnit: "dose", active: true, basePrice: 220_000, buyPrice: 110_000,
    typeConfig: {
      type: "vaccine", isRabies: true, route: "SC", manufacturer: "Navetco",
      reminder: { intervalIso: "P1Y", channelPref: "zalo", conditions: "Dogs & cats ≥ 12 weeks" },
    },
  },
  {
    id: "CI-VAC-DHPP", code: "VAC-DHPP", type: "vaccine", name: { en: "DHPPi core vaccine (dog)", vi: "Vắc-xin 5 bệnh DHPPi (chó)" },
    revenueCategoryKey: "vaccines", taxClassKey: "vat-5", defaultUnit: "dose", active: true, basePrice: 280_000, buyPrice: 150_000,
    typeConfig: {
      type: "vaccine", isRabies: false, route: "SC", manufacturer: "Zoetis (Vanguard)",
      reminder: { intervalIso: "P1Y", channelPref: "sms", conditions: "Dogs — annual booster" },
    },
  },
  {
    id: "CI-VAC-FVRCP", code: "VAC-FVRCP", type: "vaccine", name: { en: "FVRCP core vaccine (cat)", vi: "Vắc-xin 3 bệnh FVRCP (mèo)" },
    revenueCategoryKey: "vaccines", taxClassKey: "vat-5", defaultUnit: "dose", active: true, basePrice: 290_000, buyPrice: 160_000,
    typeConfig: {
      type: "vaccine", isRabies: false, route: "SC", manufacturer: "Boehringer (Purevax)",
      reminder: { intervalIso: "P1Y", channelPref: "zalo", conditions: "Cats — annual booster" },
    },
  },

  // Diet
  {
    id: "CI-DIET-RCURI", code: "DIET-RC-URI", type: "diet", name: { en: "Royal Canin Urinary S/O 2kg", vi: "Royal Canin Urinary S/O 2kg" },
    revenueCategoryKey: "diet", taxClassKey: "vat-8", defaultUnit: "bag", active: true, basePrice: 520_000, buyPrice: 340_000,
    typeConfig: { type: "diet", feedingPlan: "Struvite dissolution — feed exclusively 5–12 weeks" },
  },
  {
    id: "CI-DIET-HILLID", code: "DIET-HILL-ID", type: "diet", name: { en: "Hill's i/d Digestive Care 1.5kg", vi: "Hill's i/d hỗ trợ tiêu hoá 1.5kg" },
    revenueCategoryKey: "diet", taxClassKey: "vat-8", defaultUnit: "bag", active: true, basePrice: 480_000, buyPrice: 310_000,
    typeConfig: { type: "diet", feedingPlan: "GI recovery — transition over 5–7 days" },
  },

  // Lab
  {
    id: "CI-LAB-CBC", code: "LAB-CBC-BIO", type: "lab", name: { en: "CBC + biochemistry panel", vi: "Tổng phân tích máu + sinh hoá" },
    revenueCategoryKey: "lab", taxClassKey: "vat-10", defaultUnit: "panel", active: true, basePrice: 850_000,
    typeConfig: { type: "lab", tat: "Same day", external: false, panel: ["Haematology", "Liver", "Kidney", "Electrolytes"] },
  },
  {
    id: "CI-LAB-HISTO", code: "LAB-HISTO", type: "lab", name: { en: "Histopathology (external)", vi: "Giải phẫu bệnh (gửi ngoài)" },
    revenueCategoryKey: "lab", taxClassKey: "vat-10", defaultUnit: "sample", active: true, basePrice: 500_000, buyPrice: 320_000,
    typeConfig: { type: "lab", tat: "5–7 days", external: true },
  },
  {
    id: "CI-LAB-SNAP4", code: "LAB-SNAP-4DX", type: "lab", name: { en: "SNAP 4Dx (vector-borne)", vi: "SNAP 4Dx (bệnh truyền qua véc-tơ)" },
    revenueCategoryKey: "lab", taxClassKey: "vat-10", defaultUnit: "test", active: true, basePrice: 420_000, buyPrice: 240_000,
    typeConfig: { type: "lab", tat: "15 min", external: false },
  },

  // Diagnoses (coded, non-priced registry vocab — basePrice 0)
  {
    id: "CI-DX-CKD", code: "DX-CKD", type: "diagnosis", name: { en: "Chronic kidney disease", vi: "Bệnh thận mạn" },
    revenueCategoryKey: "exam", taxClassKey: "exempt", defaultUnit: "—", active: true, basePrice: 0,
    venomCode: "VeNom-1402",
    typeConfig: { type: "diagnosis", notifiable: false },
  },
  {
    id: "CI-DX-PARVO", code: "DX-PARVO", type: "diagnosis", name: { en: "Canine parvovirus enteritis", vi: "Viêm ruột do Parvovirus" },
    revenueCategoryKey: "exam", taxClassKey: "exempt", defaultUnit: "—", active: true, basePrice: 0,
    venomCode: "VeNom-1190",
    typeConfig: { type: "diagnosis", notifiable: true },
  },
  {
    id: "CI-DX-RABIES", code: "DX-RABIES", type: "diagnosis", name: { en: "Rabies (suspected)", vi: "Bệnh dại (nghi ngờ)" },
    revenueCategoryKey: "exam", taxClassKey: "exempt", defaultUnit: "—", active: true, basePrice: 0,
    venomCode: "VeNom-1205",
    typeConfig: { type: "diagnosis", notifiable: true },
  },
];

// ── Lookups ───────────────────────────────────────────────────────────────────
export function typeMeta(id: CatalogType): TypeMeta {
  return CATALOG_TYPES.find((t) => t.id === id) ?? CATALOG_TYPES[0];
}
export function taxClass(key: TaxClassKey): TaxClass {
  return TAX_CLASSES.find((c) => c.key === key) ?? TAX_CLASSES[0];
}
export function revenueCategory(key: RevenueCategoryKey): RevenueCategory {
  return REVENUE_CATEGORIES.find((c) => c.key === key) ?? REVENUE_CATEGORIES[0];
}
export function priceList(id: string): PriceList {
  return PRICE_LISTS.find((p) => p.id === id) ?? PRICE_LISTS[0];
}

/** Resolve the sell price for an item in a given price list (branch override → base). */
export function resolveSell(item: CatalogItem, priceListId: string): number {
  return BRANCH_OVERRIDES[priceListId]?.[item.id] ?? item.basePrice;
}

/** Gross margin % from a resolved sell price and the item's buy price (null if no COGS). */
export function marginPct(sell: number, buy?: number): number | null {
  if (!buy || sell <= 0) return null;
  return Math.round(((sell - buy) / sell) * 100);
}

export function catalogSummary(items: CatalogItem[]) {
  return {
    total: items.length,
    active: items.filter((i) => i.active).length,
    inactive: items.filter((i) => !i.active).length,
    reminders: items.filter((i) => i.typeConfig.type === "vaccine").length,
    coded: items.filter((i) => !!i.venomCode).length,
  };
}
