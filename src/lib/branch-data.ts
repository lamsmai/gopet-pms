// ─────────────────────────────────────────────────────────────────────────────
// Branch settings — multi-country (Vietnam · Cambodia · Thailand) branch registry.
// Drives the Admin → Branches master-detail editor. Payment rails and tax config
// are region-aware (VN: VietQR/VNPay/MoMo/ZaloPay + VNPT e-invoice; KH: ABA; TH:
// PromptPay). All data is mock — edits live in component state only.
// ─────────────────────────────────────────────────────────────────────────────

export type CountryCode = "VN" | "KH" | "TH";
export type BranchStatus = "active" | "setup" | "inactive";
export type RoomType = "exam" | "surgery" | "procedure" | "ward" | "isolation" | "grooming" | "reception";
export type CardTone = "teal" | "violet" | "amber" | "rose" | "blue";

export type Country = {
  code: CountryCode;
  name: string;
  /** Flag-stripe accent used on cards / chips (no emoji icons in the UI). */
  accent: string;
  soft: string;
  currency: string;
  dialCode: string;
  timezone: string;
};

export const COUNTRIES: Record<CountryCode, Country> = {
  // VN accent darkened from flag-red #DA251D to clear AA contrast (>=4.5:1) on its soft tint.
  VN: { code: "VN", name: "Vietnam", accent: "#B81E17", soft: "#FDECEA", currency: "VND", dialCode: "+84", timezone: "GMT+7 · Asia/Ho_Chi_Minh" },
  KH: { code: "KH", name: "Cambodia", accent: "#032EA1", soft: "#E7ECFB", currency: "USD", dialCode: "+855", timezone: "GMT+7 · Asia/Phnom_Penh" },
  TH: { code: "TH", name: "Thailand", accent: "#2D2A4A", soft: "#EAE9F2", currency: "THB", dialCode: "+66", timezone: "GMT+7 · Asia/Bangkok" },
};

export type DayHours = {
  /** Mon … Sun key for i18n lookup (co-located in i18n DICT). */
  key: string;
  open: string;
  close: string;
  closed: boolean;
  is24h: boolean;
};

export type Room = {
  id: string;
  name: string;
  type: RoomType;
  capacity: number;
  active: boolean;
};

export type PaymentMethod = {
  id: string;
  name: string;
  /** "card" | "qr" | "wallet" | "bank" | "cash" — drives the icon. */
  kind: "card" | "qr" | "wallet" | "bank" | "cash";
  enabled: boolean;
  /** True for Vietnam-first / regional rails worth highlighting. */
  local?: boolean;
};

export type TaxConfig = {
  taxId: string;
  vatRate: number;
  eInvoiceEnabled: boolean;
  eInvoiceProvider: string;
};

export type Branch = {
  id: string;
  code: string;
  name: string;
  country: CountryCode;
  city: string;
  district: string;
  address: string;
  phone: string;
  email: string;
  status: BranchStatus;
  is24h: boolean;
  openedYear: number;
  flagship: boolean;
  tone: CardTone;
  manager: { name: string; phone: string; initials: string };
  stats: { staff: number; patients: number; monthlyRevenue: number; rooms: number };
  hours: DayHours[];
  rooms: Room[];
  payments: PaymentMethod[];
  tax: TaxConfig;
  lastUpdated: string;
};

const WEEK = ["day.mon", "day.tue", "day.wed", "day.thu", "day.fri", "day.sat", "day.sun"];

/** Standard clinic week: weekdays 08–20, Sat 08–18, Sun 09–17. */
function standardWeek(overrides?: Partial<Record<number, Partial<DayHours>>>): DayHours[] {
  const base: DayHours[] = WEEK.map((key, i) => ({
    key,
    open: "08:00",
    close: i === 5 ? "18:00" : i === 6 ? "17:00" : "20:00",
    closed: false,
    is24h: false,
  }));
  if (overrides) for (const [i, o] of Object.entries(overrides)) Object.assign(base[Number(i)], o);
  return base;
}

function allDay(): DayHours[] {
  return WEEK.map((key) => ({ key, open: "00:00", close: "24:00", closed: false, is24h: true }));
}

const VN_PAYMENTS = (): PaymentMethod[] => [
  { id: "vietqr", name: "VietQR", kind: "qr", enabled: true, local: true },
  { id: "vnpay", name: "VNPay", kind: "wallet", enabled: true, local: true },
  { id: "momo", name: "MoMo", kind: "wallet", enabled: true, local: true },
  { id: "zalopay", name: "ZaloPay", kind: "wallet", enabled: false, local: true },
  { id: "card", name: "Credit / debit card", kind: "card", enabled: true },
  { id: "bank", name: "Bank transfer", kind: "bank", enabled: true },
  { id: "cash", name: "Cash", kind: "cash", enabled: true },
];

const KH_PAYMENTS = (): PaymentMethod[] => [
  { id: "aba", name: "ABA PayWay (KHQR)", kind: "qr", enabled: true, local: true },
  { id: "card", name: "Credit / debit card", kind: "card", enabled: true },
  { id: "bank", name: "Bank transfer", kind: "bank", enabled: false },
  { id: "cash", name: "Cash (USD / KHR)", kind: "cash", enabled: true },
];

const TH_PAYMENTS = (): PaymentMethod[] => [
  { id: "promptpay", name: "PromptPay QR", kind: "qr", enabled: true, local: true },
  { id: "card", name: "Credit / debit card", kind: "card", enabled: true },
  { id: "cash", name: "Cash (THB)", kind: "cash", enabled: true },
];

export const branches: Branch[] = [
  {
    id: "BR-01",
    code: "SGN-NVH",
    name: "ADI Nguyen Van Huong",
    country: "VN",
    city: "Ho Chi Minh City",
    district: "Thao Dien, District 2",
    address: "47 Nguyen Van Huong, Thao Dien Ward, District 2, HCMC",
    phone: "+84 28 3744 7799",
    email: "nvh@animaldoctors.vn",
    status: "active",
    is24h: true,
    openedYear: 2014,
    flagship: true,
    tone: "teal",
    manager: { name: "Dr. Lucas Tran", phone: "+84 903 118 070", initials: "LT" },
    stats: { staff: 38, patients: 6120, monthlyRevenue: 2_480_000_000, rooms: 11 },
    hours: allDay(),
    rooms: [
      { id: "r1", name: "Reception", type: "reception", capacity: 4, active: true },
      { id: "r2", name: "Exam 1", type: "exam", capacity: 1, active: true },
      { id: "r3", name: "Exam 2", type: "exam", capacity: 1, active: true },
      { id: "r4", name: "Exam 3", type: "exam", capacity: 1, active: true },
      { id: "r5", name: "Surgery Suite A", type: "surgery", capacity: 1, active: true },
      { id: "r6", name: "Surgery Suite B", type: "surgery", capacity: 1, active: true },
      { id: "r7", name: "Dental / Procedure", type: "procedure", capacity: 1, active: true },
      { id: "r8", name: "ICU Ward", type: "ward", capacity: 12, active: true },
      { id: "r9", name: "Isolation", type: "isolation", capacity: 4, active: true },
      { id: "r10", name: "Grooming", type: "grooming", capacity: 2, active: false },
    ],
    payments: VN_PAYMENTS(),
    tax: { taxId: "0312345678", vatRate: 8, eInvoiceEnabled: true, eInvoiceProvider: "VNPT-Invoice (Mã CQT)" },
    lastUpdated: "18 Jun 2026",
  },
  {
    id: "BR-02",
    code: "SGN-VVK",
    name: "ADI Vo Van Kiet",
    country: "VN",
    city: "Ho Chi Minh City",
    district: "District 5",
    address: "608 Vo Van Kiet, Ward 1, District 5, HCMC",
    phone: "+84 28 3920 1188",
    email: "vvk@animaldoctors.vn",
    status: "active",
    is24h: false,
    openedYear: 2019,
    flagship: false,
    tone: "violet",
    manager: { name: "Dr. Sarah Le", phone: "+84 903 118 071", initials: "SL" },
    stats: { staff: 22, patients: 3480, monthlyRevenue: 1_120_000_000, rooms: 6 },
    hours: standardWeek(),
    rooms: [
      { id: "r1", name: "Reception", type: "reception", capacity: 3, active: true },
      { id: "r2", name: "Exam 1", type: "exam", capacity: 1, active: true },
      { id: "r3", name: "Exam 2", type: "exam", capacity: 1, active: true },
      { id: "r4", name: "Surgery Suite", type: "surgery", capacity: 1, active: true },
      { id: "r5", name: "Procedure", type: "procedure", capacity: 1, active: true },
      { id: "r6", name: "Ward", type: "ward", capacity: 8, active: true },
    ],
    payments: VN_PAYMENTS(),
    tax: { taxId: "0312345679", vatRate: 8, eInvoiceEnabled: true, eInvoiceProvider: "VNPT-Invoice (Mã CQT)" },
    lastUpdated: "11 Jun 2026",
  },
  {
    id: "BR-03",
    code: "HAN-TYH",
    name: "ADI Tay Ho",
    country: "VN",
    city: "Hanoi",
    district: "Tay Ho",
    address: "12 Quang An, Tay Ho District, Hanoi",
    phone: "+84 24 3718 6622",
    email: "tayho@animaldoctors.vn",
    status: "active",
    is24h: false,
    openedYear: 2021,
    flagship: false,
    tone: "amber",
    manager: { name: "Dr. Mia Nguyen", phone: "+84 903 118 072", initials: "MN" },
    stats: { staff: 17, patients: 2240, monthlyRevenue: 845_000_000, rooms: 5 },
    hours: standardWeek({ 6: { closed: true } }),
    rooms: [
      { id: "r1", name: "Reception", type: "reception", capacity: 2, active: true },
      { id: "r2", name: "Exam 1", type: "exam", capacity: 1, active: true },
      { id: "r3", name: "Exam 2", type: "exam", capacity: 1, active: true },
      { id: "r4", name: "Surgery Suite", type: "surgery", capacity: 1, active: true },
      { id: "r5", name: "Ward", type: "ward", capacity: 6, active: true },
    ],
    payments: VN_PAYMENTS(),
    tax: { taxId: "0108345661", vatRate: 8, eInvoiceEnabled: true, eInvoiceProvider: "VNPT-Invoice (Mã CQT)" },
    lastUpdated: "09 Jun 2026",
  },
  {
    id: "BR-04",
    code: "PNH-BKK",
    name: "ADI Phnom Penh",
    country: "KH",
    city: "Phnom Penh",
    district: "Chamkarmon",
    address: "St 360, Boeng Keng Kang, Phnom Penh",
    phone: "+855 23 900 112",
    email: "pp@animaldoctors.asia",
    status: "active",
    is24h: false,
    openedYear: 2022,
    flagship: false,
    tone: "blue",
    manager: { name: "Dr. Sophea Chan", phone: "+855 12 880 440", initials: "SC" },
    stats: { staff: 14, patients: 1510, monthlyRevenue: 38_500, rooms: 4 },
    hours: standardWeek({ 6: { closed: true } }),
    rooms: [
      { id: "r1", name: "Reception", type: "reception", capacity: 2, active: true },
      { id: "r2", name: "Exam 1", type: "exam", capacity: 1, active: true },
      { id: "r3", name: "Surgery Suite", type: "surgery", capacity: 1, active: true },
      { id: "r4", name: "Ward", type: "ward", capacity: 5, active: true },
    ],
    payments: KH_PAYMENTS(),
    tax: { taxId: "K001-90122", vatRate: 10, eInvoiceEnabled: false, eInvoiceProvider: "—" },
    lastUpdated: "02 Jun 2026",
  },
  {
    id: "BR-05",
    code: "BKK-SUK",
    name: "ADI Bangkok (Sukhumvit)",
    country: "TH",
    city: "Bangkok",
    district: "Watthana",
    address: "Sukhumvit Soi 49, Khlong Tan Nuea, Bangkok",
    phone: "+66 2 119 7788",
    email: "bkk@animaldoctors.asia",
    status: "setup",
    is24h: false,
    openedYear: 2026,
    flagship: false,
    tone: "rose",
    manager: { name: "Dr. Anan Wong", phone: "+66 81 700 220", initials: "AW" },
    stats: { staff: 6, patients: 0, monthlyRevenue: 0, rooms: 3 },
    hours: standardWeek({ 5: { closed: true }, 6: { closed: true } }),
    rooms: [
      { id: "r1", name: "Reception", type: "reception", capacity: 2, active: true },
      { id: "r2", name: "Exam 1", type: "exam", capacity: 1, active: true },
      { id: "r3", name: "Surgery Suite", type: "surgery", capacity: 1, active: false },
    ],
    payments: TH_PAYMENTS(),
    tax: { taxId: "TH-PENDING", vatRate: 7, eInvoiceEnabled: false, eInvoiceProvider: "—" },
    lastUpdated: "20 Jun 2026",
  },
];

export const ROOM_TYPES: RoomType[] = ["exam", "surgery", "procedure", "ward", "isolation", "grooming", "reception"];

/** Region-correct payment rails for a country (used when a branch's country changes). */
export function paymentsForCountry(code: CountryCode): PaymentMethod[] {
  if (code === "VN") return VN_PAYMENTS();
  if (code === "KH") return KH_PAYMENTS();
  return TH_PAYMENTS();
}

/** Region tax defaults (VAT + e-invoice); taxId is preserved by the caller. */
export function taxDefaultsForCountry(code: CountryCode): Pick<TaxConfig, "vatRate" | "eInvoiceEnabled" | "eInvoiceProvider"> {
  if (code === "VN") return { vatRate: 8, eInvoiceEnabled: true, eInvoiceProvider: "VNPT-Invoice (Mã CQT)" };
  if (code === "KH") return { vatRate: 10, eInvoiceEnabled: false, eInvoiceProvider: "—" };
  return { vatRate: 7, eInvoiceEnabled: false, eInvoiceProvider: "—" };
}

/** Format money in the branch's own currency (VND/USD/THB). */
export function branchMoney(amount: number, country: CountryCode): string {
  const cur = COUNTRIES[country].currency;
  if (cur === "VND") {
    if (amount >= 1_000_000_000) return `${(amount / 1_000_000_000).toFixed(amount % 1_000_000_000 === 0 ? 0 : 1)} tỷ ₫`;
    if (amount >= 1_000_000) return `${(amount / 1_000_000).toFixed(0)}tr ₫`;
    return `${amount.toLocaleString("vi-VN")} ₫`;
  }
  const symbol = cur === "USD" ? "$" : "฿";
  return `${symbol}${amount.toLocaleString("en-US")}`;
}

export function branchSummary() {
  const total = branches.length;
  const countries = new Set(branches.map((b) => b.country)).size;
  const staff = branches.reduce((s, b) => s + b.stats.staff, 0);
  const active = branches.filter((b) => b.status === "active").length;
  return { total, countries, staff, active };
}
