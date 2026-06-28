// ─────────────────────────────────────────────────────────────────────────────
// Dashboard — Front Desk (CS) · mock data
// 3-tab redesign: Today's Arrival · Booking Requests · Reminders
// All values are mock; no backend. Hex values follow the brand palette.
// ─────────────────────────────────────────────────────────────────────────────

// Branch context — consumed by the top nav / topbar (do not remove).
export const HEADER = {
  branch: "Nguyen Van Huong, D7",
  branchCity: "Hồ Chí Minh",
  room: "Consult Room 2",
};

// Fixed prototype "now" — the day is framed around 10:18 so the live divider,
// the relative-time cues, and the "late" radar all read consistently.
export const NOW = new Date(2026, 5, 9, 10, 18);
export const NOW_MIN = NOW.getHours() * 60 + NOW.getMinutes(); // 618
export const NOW_TIME = "10:18";

/** Parse a 24h "HH:MM" string into minutes-since-midnight. */
export function toMinutes(hhmm: string): number {
  const [h, m] = hhmm.split(":").map(Number);
  return h * 60 + m;
}

// ── Species (drives the tinted avatar) ────────────────────────────────────────
export type Species = "dog" | "cat" | "rabbit" | "bird" | "other";

// ── Appointment status (7 states, CS-editable via dropdown) ───────────────────
export type ArrivalStatus =
  | "Not Arrived"
  | "Arrived"
  | "In Progress"
  | "Waiting To Pay"
  | "Completed"
  | "No Show"
  | "Canceled";

/** Order shown in the status dropdown (lifecycle order). */
export const ARRIVAL_STATUS_ORDER: ArrivalStatus[] = [
  "Not Arrived",
  "Arrived",
  "In Progress",
  "Waiting To Pay",
  "Completed",
  "No Show",
  "Canceled",
];

export type ArrivalStatusMeta = {
  /** i18n key for the label */
  key: string;
  /** pill background (may be "transparent" → render a hollow/bordered pill) */
  bg: string;
  /** pill text / accent */
  fg: string;
  /** status dot */
  dot: string;
  /** transparent-bg statuses render a bordered dot + bordered pill */
  hollow?: boolean;
  /** the active "live" state pulses its dot */
  pulse?: boolean;
  /** finished/cancelled rows recede (opacity) */
  recede?: boolean;
  /** cancelled rows strike the patient name */
  strike?: boolean;
};

export const ARRIVAL_STATUS_META: Record<ArrivalStatus, ArrivalStatusMeta> = {
  "Not Arrived":    { key: "ar.st.notArrived",  bg: "transparent", fg: "#737373", dot: "#9CA3AF", hollow: true },
  "Arrived":        { key: "ar.st.arrived",     bg: "#4ABA7A1A",   fg: "#1B804C", dot: "#4ABA7A" },
  "In Progress":    { key: "ar.st.inProgress",  bg: "#0347510F",   fg: "#034751", dot: "#034751", pulse: true },
  "Waiting To Pay": { key: "ar.st.waitingPay",  bg: "#FFF1E6",     fg: "#C2410C", dot: "#D97706" },
  "Completed":      { key: "ar.st.completed",   bg: "#F5F5F5",     fg: "#525252", dot: "#A3A3A3", recede: true },
  "No Show":        { key: "ar.st.noShow",      bg: "#FEE2E2",     fg: "#B91C1C", dot: "#B91C1C" },
  "Canceled":       { key: "ar.st.canceled",    bg: "transparent", fg: "#6B7280", dot: "#9CA3AF", hollow: true, recede: true, strike: true },
};

// ── Today's Arrival — the day's scheduled worklist ────────────────────────────
export type ArrivalAppt = {
  id: number;
  consultId?: string;
  time: string;        // 24h "HH:MM"
  name: string;
  species: Species;
  breed: string;       // breed · age, as authored
  owner: string;
  vet: string;
  room: string;
  reason: string;
  status: ArrivalStatus;
  amountDue?: number;  // shown when Waiting To Pay
};

export const todayArrivals: ArrivalAppt[] = [
  { id: 1, time: "08:30", name: "Bella", species: "dog", breed: "Golden Retriever · 8y", owner: "Minh Khoa Tran", vet: "Dr. Andreas", room: "Consult Room 1", reason: "Post-surgery incision check", status: "Completed", consultId: "PK-2403" },
  { id: 2, time: "09:00", name: "Napoleon", species: "dog", breed: "Beagle · 3y", owner: "Jennifer Oxlade", vet: "Dr. Andreas", room: "Consult Room 1", reason: "RNATT titre test — bring vaccine book", status: "In Progress", consultId: "PK-2401" },
  { id: 3, time: "09:20", name: "Milo", species: "dog", breed: "French Bulldog · 5y", owner: "Truc Anh Nguyen", vet: "Dr. Linh", room: "Consult Room 2", reason: "Vomiting for 2 days", status: "Arrived", consultId: "PK-2402" },
  { id: 4, time: "09:30", name: "Rogue", species: "dog", breed: "Labrador · 4y", owner: "Erin Kenney", vet: "Dr. Efrain", room: "Consult Room 3", reason: "Pentosan injection — revisit", status: "Waiting To Pay", amountDue: 680_000 },
  { id: 5, time: "09:50", name: "Coco", species: "cat", breed: "British Shorthair · 2y", owner: "Hoàng Nam Vũ", vet: "Dr. Sophia", room: "Consult Room 2", reason: "Routine wellness check", status: "No Show" },
  { id: 6, time: "10:10", name: "Biscuit", species: "cat", breed: "Domestic Shorthair · 2y", owner: "Annie Tran", vet: "Dr. Efrain", room: "Vaccine bay", reason: "Annual vaccination (FVRCP)", status: "Arrived" },
  { id: 7, time: "10:15", name: "Lucky", species: "rabbit", breed: "Holland Lop · 1y", owner: "Khánh Chi Nguyễn", vet: "Dr. Linh", room: "Consult Room 1", reason: "Reduced appetite — dental check", status: "Not Arrived" },
  { id: 8, time: "10:30", name: "Luna", species: "cat", breed: "Persian · 6y", owner: "Thu Hà Phạm", vet: "Dr. Martyna", room: "Consult Room 2", reason: "Recheck — kidney panel review", status: "Not Arrived" },
  { id: 9, time: "11:00", name: "Simba", species: "dog", breed: "Pomeranian · 2y", owner: "Bao Long Le", vet: "Dr. Andreas", room: "Consult Room 3", reason: "Grooming + nail trim consult", status: "Not Arrived" },
  { id: 10, time: "11:30", name: "Kiwi", species: "bird", breed: "Cockatiel · 3y", owner: "Oh Se Hoon", vet: "Dr. Sophia", room: "Exotics room", reason: "Wing feather trim", status: "Canceled" },
];

// ── Booking Requests — new requests from the client app / website ─────────────
export type BookingChannel = "app" | "web" | "phone";

export type BookingRequest = {
  id: number;
  requestedTime: string;     // 24h "HH:MM"
  requestedDate: string;     // i18n key suffix: "today" | "tomorrow" | a literal label
  dateIsLiteral?: boolean;   // when requestedDate is a literal (e.g. "28 Jun")
  minsAgo: number;           // freshness — flips to "overdue" after ~30 min
  name: string;
  species: Species;
  breed: string;
  owner: string;
  isNewClient?: boolean;
  requestedVet?: string;     // undefined → "No preference"
  reason: string;
  channel: BookingChannel;
};

export const bookingRequests: BookingRequest[] = [
  { id: 101, requestedTime: "14:00", requestedDate: "today", minsAgo: 6, name: "Pho Mai", species: "cat", breed: "Munchkin · 1y", owner: "Vy Trần", isNewClient: true, reason: "First visit — general health check", channel: "app" },
  { id: 102, requestedTime: "09:30", requestedDate: "tomorrow", minsAgo: 22, name: "Bông", species: "dog", breed: "Poodle · 2y", owner: "Đức Minh", requestedVet: "Dr. Linh", reason: "Itchy skin — possible allergy", channel: "web" },
  { id: 103, requestedTime: "16:30", requestedDate: "today", minsAgo: 48, name: "Tom", species: "cat", breed: "Domestic Shorthair · 4y", owner: "Lan Nguyễn", requestedVet: "Dr. Sophia", reason: "Vaccination booster", channel: "app" },
  { id: 104, requestedTime: "11:00", requestedDate: "28 Jun", dateIsLiteral: true, minsAgo: 75, name: "Max", species: "dog", breed: "Husky · 3y", owner: "Patrick Lee", isNewClient: true, reason: "Limping on left hind leg", channel: "phone" },
];

// ── Reminders — calm triage feed that auto-surfaces who needs a nudge today ───
// Built as a proposal: the "unpaid" bucket is fully populated as proof; the other
// buckets show their auto-generated counts so the concept is legible.
export type ReminderChannel = "sms" | "call" | "zalo" | "email";

export type ReminderItem = {
  id: number;
  owner: string;
  patient?: string;
  /** when an owner has several due items, collapse to one row → one call */
  itemsCount?: number;
  why: string;
  amount: number;
  channel: ReminderChannel;
};

export const unpaidReminders: ReminderItem[] = [
  { id: 201, owner: "Jennifer Oxlade", patient: "Napoleon", why: "Invoice unpaid from today's visit", amount: 680_000, channel: "zalo" },
  { id: 202, owner: "Lan Nguyễn", itemsCount: 3, why: "3 outstanding invoices", amount: 2_150_000, channel: "sms" },
  { id: 203, owner: "Bao Long Le", patient: "Rex", why: "Deposit balance for inpatient stay", amount: 1_500_000, channel: "call" },
];

export type ReminderBucket = {
  id: string;
  /** i18n key for the bucket title */
  key: string;
  count: number;
  /** route to open the relevant workspace */
  to: string;
};

// Auto-generated buckets the Reminders feed will surface (only "unpaid" is built).
export const reminderBuckets: ReminderBucket[] = [
  { id: "unconfirmed", key: "rm.bucket.unconfirmed", count: 4, to: "/dashboard" },
  { id: "vaccine", key: "rm.bucket.vaccine", count: 9, to: "/communications/reminders" },
  { id: "callback", key: "rm.bucket.callback", count: 4, to: "/communications/inbox" },
  { id: "noshow", key: "rm.bucket.noshow", count: 1, to: "/dashboard" },
];
