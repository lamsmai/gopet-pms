// ─────────────────────────────────────────────────────────────────────────────
// Appointment Drawer — composed "visit detail" mock
// One representative VisitDetail is returned for every appointment (prototype).
// The drawer header still shows the clicked appointment's own facts; this record
// supplies the deeper clinical / financial / lifecycle data behind each tab.
// ─────────────────────────────────────────────────────────────────────────────
import { NOW_TIME, type ArrivalAppt } from "./dashboard-data";

export type MembershipTier = "none" | "silver" | "gold" | "platinum";

export type PatientQuick = {
  sex: string;
  microchipId: string;
  triage: "stable" | "watch" | "urgent";
  allergies: string[];
  behavioralWarning?: string;
  chronicConditions: string[];
  activeMedications: string[];
  ownerPhone: string;
  preferredLanguage: "en" | "vi";
  membershipTier: MembershipTier;
  outstandingBalance: number;
  depositBalance: number;
  currentWeightKg: number;
  idealWeightKg: [number, number];
  bcs: number;
  lastVisit: string;
  nextBooking: string;
  vaccineSummary: { upToDate: number; dueSoon: number; overdue: number };
  careSummary: string;
  csHandoff: string[];
  patientHref: string;
};

export type EstimateLine = { name: string; qty: number; low: number; high: number };
export type EstimateStatus = "draft" | "sent" | "approved" | "declined";
export type Estimate = { status: EstimateStatus; items: EstimateLine[] };

export type ConsultationInfo = {
  consultId: string;
  started: string;
  vet: string;
  reason: string;
  vitals: { weight: string; temp: string };
  soap?: { s: string; o: string; a: string; p: string };
  diagnosis?: string;
};

export type ServiceStatus = "planned" | "in-progress" | "done";
export type ServiceItem = { id: number; name: string; category: string; status: ServiceStatus; price: number };

export type InvoiceLine = { name: string; qty: number; price: number };
export type Invoice = { items: InvoiceLine[]; discount: number; vatRate: number; paid: number; method?: string };

// A booking/walk-in deposit (fixed minimum). Collected up front, then applied
// against the final invoice at check-out.
export type DepositStatus = "due" | "paid";
export type Deposit = { amount: number; status: DepositStatus; method?: string; applied: boolean };

export type ReminderChannel = "sms" | "zalo" | "email" | "call";
export type ReminderSuggestion = { id: number; type: string; dueDate: string; channel: ReminderChannel };

export type VisitDetail = {
  patient: PatientQuick;
  estimate: Estimate | null; // null until created in-day
  consultation: ConsultationInfo | null; // null until started in-day
  services: ServiceItem[];
  invoice: Invoice;
  deposit: Deposit;
  reminders: ReminderSuggestion[];
};

// The single representative patient behind every drawer (loosely based on a
// senior Golden Retriever so the deep-link to the full record resolves).
const REPRESENTATIVE: () => VisitDetail = () => ({
  patient: {
    sex: "Female spayed",
    microchipId: "900 113 000 482 911",
    triage: "watch",
    allergies: ["Carprofen (NSAID)"],
    behavioralWarning: "Fearful on the scale — use treats + owner presence",
    chronicConditions: ["Osteoarthritis risk", "Weight management"],
    activeMedications: ["Gabapentin 300mg BID", "Omega-3 daily"],
    ownerPhone: "+84 903 118 422",
    preferredLanguage: "vi",
    membershipTier: "gold",
    outstandingBalance: 0,
    depositBalance: 500_000,
    currentWeightKg: 34.8,
    idealWeightKg: [28, 31],
    bcs: 7,
    lastVisit: "15 Jun 2026",
    nextBooking: "22 Jun 2026 · 09:30",
    vaccineSummary: { upToDate: 2, dueSoon: 1, overdue: 1 },
    careSummary: "Senior large-breed, upward weight trend, NSAID allergy — prioritise pain-safe plans.",
    csHandoff: [
      "Owner prefers Zalo summaries after each visit.",
      "Offer senior wellness package before the next vaccine is due.",
    ],
    patientHref: "/patients/PAT-0102",
  },
  estimate: null,
  consultation: null,
  services: [
    { id: 1, name: "Consultation – General", category: "Clinical", status: "done", price: 300_000 },
    { id: 2, name: "Pain assessment + gait video", category: "Clinical", status: "in-progress", price: 150_000 },
    { id: 3, name: "Senior wellness blood screen", category: "Diagnostics", status: "planned", price: 680_000 },
  ],
  invoice: {
    items: [
      { name: "Consultation – General", qty: 1, price: 300_000 },
      { name: "Pain assessment + gait video", qty: 1, price: 150_000 },
      { name: "Senior wellness blood screen", qty: 1, price: 680_000 },
    ],
    discount: 0,
    vatRate: 0.08,
    paid: 0,
  },
  deposit: { amount: 500_000, status: "due", applied: false },
  reminders: [
    { id: 1, type: "DHPP vaccination due", dueDate: "18 Jul 2026", channel: "zalo" },
    { id: 2, type: "Senior mobility recheck", dueDate: "06 Jul 2026", channel: "sms" },
    { id: 3, type: "Weight nurse check-in", dueDate: "30 Jun 2026", channel: "call" },
  ],
});

/** Fresh representative detail for the opened appointment (resets on each open). */
export function getVisitDetail(_appt: ArrivalAppt): VisitDetail {
  return REPRESENTATIVE();
}

/** Build an estimate from the current service list (used by "Create estimate"). */
export function estimateFromServices(services: ServiceItem[]): Estimate {
  return {
    status: "draft",
    items: services.map((s) => ({ name: s.name, qty: 1, low: s.price, high: Math.round(s.price * 1.25) })),
  };
}

/** Start a consultation stub for the appointment (used by "Start consultation"). */
export function startConsultation(appt: ArrivalAppt): ConsultationInfo {
  return {
    consultId: appt.consultId ?? "PK-2401",
    started: NOW_TIME,
    vet: appt.vet,
    reason: appt.reason,
    vitals: { weight: "34.8 kg", temp: "38.6 °C" },
  };
}

export function invoiceTotals(inv: Invoice) {
  const subtotal = inv.items.reduce((s, i) => s + i.qty * i.price, 0);
  const taxable = Math.max(0, subtotal - inv.discount);
  const vat = Math.round(taxable * inv.vatRate);
  const total = taxable + vat;
  const balance = Math.max(0, total - inv.paid);
  return { subtotal, vat, total, balance };
}

/** Invoice totals including any applied deposit deduction. */
export function visitTotals(d: VisitDetail) {
  const { subtotal, vat, total } = invoiceTotals(d.invoice);
  const depositApplied = d.deposit.applied && d.deposit.status === "paid" ? d.deposit.amount : 0;
  const balance = Math.max(0, total - depositApplied - d.invoice.paid);
  return { subtotal, vat, total, depositApplied, balance };
}
