// ─────────────────────────────────────────────────────────────────────────────
// Billing — invoices, Vietnam-first payment rails, counter-sales (POS) catalog,
// and e-invoice (Mã CQT) records. Amounts are VND. Mock data; edits live in
// component state.
// ─────────────────────────────────────────────────────────────────────────────

export type InvoiceStatus = "draft" | "issued" | "partial" | "paid" | "overdue" | "cancelled";
export type LineCategory = "service" | "lab" | "drug" | "supply";

export type InvoiceLine = {
  name: string;
  category: LineCategory;
  qty: number;
  unitPrice: number;
};

export type Invoice = {
  id: string;
  owner: string;
  pet: string;
  date: string;
  amount: number;
  paid: number;
  status: InvoiceStatus;
  daysOverdue: number;
  items: InvoiceLine[];
};

export const invoices: Invoice[] = [
  {
    id: "INV-5521", owner: "Linh Tran", pet: "Mochi", date: "20 Jun 2026", amount: 1_840_000, paid: 1_840_000, status: "paid", daysOverdue: 0,
    items: [
      { name: "Ovariohysterectomy (spay)", category: "service", qty: 1, unitPrice: 1_400_000 },
      { name: "Isoflurane anaesthesia", category: "service", qty: 1, unitPrice: 280_000 },
      { name: "Meloxicam 1.5mg/ml", category: "drug", qty: 1, unitPrice: 160_000 },
    ],
  },
  {
    id: "INV-5530", owner: "Quang Pham", pet: "Bun", date: "22 Jun 2026", amount: 920_000, paid: 0, status: "issued", daysOverdue: 0,
    items: [
      { name: "Dental — incisor trim", category: "service", qty: 1, unitPrice: 650_000 },
      { name: "Gabapentin 100mg", category: "drug", qty: 1, unitPrice: 120_000 },
      { name: "E-collar (S)", category: "supply", qty: 1, unitPrice: 150_000 },
    ],
  },
  {
    id: "INV-5512", owner: "Emma Wilson", pet: "Nori", date: "18 Jun 2026", amount: 3_250_000, paid: 1_000_000, status: "partial", daysOverdue: 0,
    items: [
      { name: "CBC + biochemistry panel", category: "lab", qty: 1, unitPrice: 850_000 },
      { name: "Dental scaling + 2 extractions", category: "service", qty: 1, unitPrice: 2_100_000 },
      { name: "Amoxicillin 250mg", category: "drug", qty: 1, unitPrice: 300_000 },
    ],
  },
  {
    id: "INV-5498", owner: "ADI Rescue Partner", pet: "Atlas", date: "16 Jun 2026", amount: 14_500_000, paid: 1_500_000, status: "partial", daysOverdue: 3,
    items: [
      { name: "TPLO — left stifle", category: "service", qty: 1, unitPrice: 12_000_000 },
      { name: "Implant + bone plate", category: "supply", qty: 1, unitPrice: 1_800_000 },
      { name: "Hospitalisation (2 nights)", category: "service", qty: 2, unitPrice: 350_000 },
    ],
  },
  {
    id: "INV-5535", owner: "David Chen", pet: "Pepper", date: "22 Jun 2026", amount: 2_100_000, paid: 0, status: "issued", daysOverdue: 0,
    items: [
      { name: "Mass removal — flank", category: "service", qty: 1, unitPrice: 1_600_000 },
      { name: "Histopathology", category: "lab", qty: 1, unitPrice: 500_000 },
    ],
  },
  {
    id: "INV-5470", owner: "Minh Le", pet: "Rocky", date: "10 Jun 2026", amount: 6_800_000, paid: 0, status: "overdue", daysOverdue: 12,
    items: [
      { name: "Enucleation — right eye", category: "service", qty: 1, unitPrice: 5_500_000 },
      { name: "Cytology", category: "lab", qty: 1, unitPrice: 450_000 },
      { name: "Hospitalisation (1 night)", category: "service", qty: 1, unitPrice: 350_000 },
      { name: "Tramadol 50mg", category: "drug", qty: 1, unitPrice: 500_000 },
    ],
  },
  {
    id: "INV-5505", owner: "Lan Pham", pet: "Simba", date: "17 Jun 2026", amount: 1_260_000, paid: 0, status: "issued", daysOverdue: 0,
    items: [
      { name: "Isolation ward (2 days)", category: "service", qty: 2, unitPrice: 480_000 },
      { name: "Panleukopenia SNAP test", category: "lab", qty: 1, unitPrice: 300_000 },
    ],
  },
  {
    id: "INV-5540", owner: "Thao Bui", pet: "Luna", date: "23 Jun 2026", amount: 4_200_000, paid: 0, status: "draft", daysOverdue: 0,
    items: [
      { name: "Cystotomy — bladder stones", category: "service", qty: 1, unitPrice: 3_400_000 },
      { name: "Urinalysis + culture", category: "lab", qty: 1, unitPrice: 800_000 },
    ],
  },
];

// ── Payment rails (Vietnam-first) ─────────────────────────────────────────────
export type PayMethodId = "vietqr" | "vnpay" | "momo" | "zalopay" | "cash" | "card" | "bank";
export type PayKind = "qr" | "wallet" | "cash" | "card" | "bank";

export type PayMethod = {
  id: PayMethodId;
  name: string;
  kind: PayKind;
  accent: string;
  /** Renders a scannable QR in the preview pane. */
  showsQr: boolean;
};

export const PAY_METHODS: PayMethod[] = [
  { id: "vietqr", name: "VietQR", kind: "qr", accent: "#E11D48", showsQr: true },
  { id: "vnpay", name: "VNPay QR", kind: "wallet", accent: "#0A5CB8", showsQr: true },
  { id: "momo", name: "MoMo", kind: "wallet", accent: "#A50064", showsQr: true },
  { id: "zalopay", name: "ZaloPay", kind: "wallet", accent: "#0068FF", showsQr: true },
  { id: "cash", name: "Cash", kind: "cash", accent: "#0E9F6E", showsQr: false },
  { id: "card", name: "Card", kind: "card", accent: "#475569", showsQr: false },
  { id: "bank", name: "Bank transfer", kind: "bank", accent: "#7A5AF8", showsQr: false },
];

export function payMethod(id: PayMethodId) {
  return PAY_METHODS.find((m) => m.id === id) ?? PAY_METHODS[0];
}

// ── Counter-sales catalog (POS) ───────────────────────────────────────────────
export type ProductClass = "Medication" | "Food" | "Supply" | "Service";
export type Product = {
  id: string;
  name: string;
  sku: string;
  class: ProductClass;
  price: number;
  stock: number;
  taxRate: number;
};

export const products: Product[] = [
  { id: "P-AMOX", name: "Amoxicillin 250mg (10)", sku: "MED-AMOX-250", class: "Medication", price: 85_000, stock: 240, taxRate: 8 },
  { id: "P-MELO", name: "Meloxicam oral susp.", sku: "MED-MELO-15", class: "Medication", price: 160_000, stock: 60, taxRate: 8 },
  { id: "P-GABA", name: "Gabapentin 100mg (14)", sku: "MED-GABA-100", class: "Medication", price: 120_000, stock: 95, taxRate: 8 },
  { id: "P-FRONT", name: "Frontline Plus (dog)", sku: "MED-FRONT-D", class: "Medication", price: 320_000, stock: 48, taxRate: 8 },
  { id: "P-BRAV", name: "Bravecto chew 10–20kg", sku: "MED-BRAV-M", class: "Medication", price: 680_000, stock: 22, taxRate: 8 },
  { id: "P-APOQ", name: "Apoquel 16mg (20)", sku: "MED-APOQ-16", class: "Medication", price: 940_000, stock: 14, taxRate: 8 },
  { id: "P-RCURI", name: "Royal Canin Urinary 2kg", sku: "FOD-RC-URI", class: "Food", price: 520_000, stock: 30, taxRate: 8 },
  { id: "P-HILLID", name: "Hill's i/d 1.5kg", sku: "FOD-HILL-ID", class: "Food", price: 480_000, stock: 18, taxRate: 8 },
  { id: "P-RCKIT", name: "Royal Canin Kitten 2kg", sku: "FOD-RC-KIT", class: "Food", price: 410_000, stock: 26, taxRate: 8 },
  { id: "P-ECOL", name: "E-collar (medium)", sku: "SUP-ECOL-M", class: "Supply", price: 150_000, stock: 70, taxRate: 8 },
  { id: "P-BAND", name: "Cohesive bandage (roll)", sku: "SUP-BAND", class: "Supply", price: 45_000, stock: 320, taxRate: 8 },
  { id: "P-SHAMP", name: "Medicated shampoo 250ml", sku: "SUP-SHAMP", class: "Supply", price: 220_000, stock: 40, taxRate: 8 },
  { id: "P-NAIL", name: "Nail trim", sku: "SVC-NAIL", class: "Service", price: 80_000, stock: 999, taxRate: 8 },
  { id: "P-MICRO", name: "Microchip + registration", sku: "SVC-CHIP", class: "Service", price: 350_000, stock: 999, taxRate: 8 },
];

export const PRODUCT_CLASSES: ProductClass[] = ["Medication", "Food", "Supply", "Service"];

// ── E-Invoice (Mã CQT / VNPT-Invoice) ─────────────────────────────────────────
export type EInvoiceStatus = "signed" | "pending" | "error" | "draft";
export type EInvoice = {
  id: string;
  invoiceNumber: string;
  date: string;
  owner: string;
  maCQT: string;
  amount: number;
  status: EInvoiceStatus;
  error?: string;
};

export const eInvoices: EInvoice[] = [
  { id: "HD-0001892", invoiceNumber: "INV-5521", date: "20 Jun 2026", owner: "Linh Tran", maCQT: "M1-26-0XK9-00001892", amount: 1_840_000, status: "signed" },
  { id: "HD-0001893", invoiceNumber: "INV-5512", date: "18 Jun 2026", owner: "Emma Wilson", maCQT: "M1-26-0XK9-00001893", amount: 3_250_000, status: "signed" },
  { id: "HD-0001894", invoiceNumber: "INV-5498", date: "16 Jun 2026", owner: "ADI Rescue Partner", maCQT: "M1-26-0XK9-00001894", amount: 14_500_000, status: "pending" },
  { id: "HD-0001895", invoiceNumber: "INV-5470", date: "10 Jun 2026", owner: "Minh Le", maCQT: "—", amount: 6_800_000, status: "error", error: "Tax ID mismatch — buyer tax code invalid" },
  { id: "HD-0001896", invoiceNumber: "INV-5505", date: "17 Jun 2026", owner: "Lan Pham", maCQT: "M1-26-0XK9-00001896", amount: 1_260_000, status: "signed" },
  { id: "HD-DRAFT-07", invoiceNumber: "INV-5540", date: "23 Jun 2026", owner: "Thao Bui", maCQT: "—", amount: 4_200_000, status: "draft" },
];

// ── Derived ───────────────────────────────────────────────────────────────────
export function balanceOf(inv: Invoice) {
  return Math.max(0, inv.amount - inv.paid);
}

export function billingSummary(list: Invoice[]) {
  const outstanding = list.reduce((s, i) => s + balanceOf(i), 0);
  const overdue = list.filter((i) => i.status === "overdue").length;
  const paidToday = list.filter((i) => i.status === "paid").reduce((s, i) => s + i.paid, 0);
  const drafts = list.filter((i) => i.status === "draft").length;
  return { outstanding, overdue, paidToday, drafts };
}
