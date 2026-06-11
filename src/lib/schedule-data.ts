// ─────────────────────────────────────────────────────────────────────────────
// Schedule — mock data
// Reconciles PRD §4.3 / UI_STRUCTURE §3 with the 08/06 meeting:
//  - view by ROOM or DOCTOR (configurable)  - Day/Week/Month + Kanban
//  - statuses: requested→booked→confirmed→arrived→in-consult→complete/no-show/cancelled
//  - two-way confirmation (requested → confirm)  - slot lock / doctor day-off
// Appointments reuse the consultation patients so "Bắt đầu khám" → /consultations/:id.
// ─────────────────────────────────────────────────────────────────────────────

export const OPEN_H = 8;
export const CLOSE_H = 18;
export const HOUR_PX = 64;
export const NOW_MIN = 138; // 10:18 from 08:00 (matches the rest of the prototype)
export const TODAY_LABEL = "Thứ Ba, 09/06/2026";
export const TODAY_DOW = 1; // Tue (0=Mon)

export type ApptStatus =
  | "requested"
  | "booked"
  | "confirmed"
  | "arrived"
  | "in-consult"
  | "completed"
  | "no-show"
  | "cancelled";

export const STATUS_META: Record<ApptStatus, { key: string; bar: string; bg: string; fg: string; solid?: boolean; dashed?: boolean }> = {
  requested:    { key: "sch.s.requested",  bar: "#F59E0B", bg: "#FEF8EC", fg: "#B45309", dashed: true },
  booked:       { key: "sch.s.booked",     bar: "#0EA5E9", bg: "#F0F9FF", fg: "#0369A1" },
  confirmed:    { key: "sch.s.confirmed",  bar: "#034751", bg: "#ECF5F6", fg: "#034751" },
  arrived:      { key: "sch.s.arrived",    bar: "#4ABA7A", bg: "#EEF9F2", fg: "#1B804C" },
  "in-consult": { key: "sch.s.inconsult",  bar: "#034751", bg: "#034751", fg: "#FFFFFF", solid: true },
  completed:    { key: "sch.s.completed",  bar: "#A3A3A3", bg: "#F7F7F7", fg: "#525252" },
  "no-show":    { key: "sch.s.noshow",     bar: "#EF4444", bg: "#FEF2F2", fg: "#B91C1C" },
  cancelled:    { key: "sch.s.cancelled",  bar: "#D4D4D4", bg: "#FAFAFA", fg: "#A3A3A3" },
};

export type Room = { id: string; name: string; maint?: boolean };
export const ROOMS: Room[] = [
  { id: "r1", name: "Phòng khám 1" },
  { id: "r2", name: "Phòng khám 2" },
  { id: "r3", name: "Phòng thủ thuật" },
  { id: "r4", name: "Phòng cấp cứu" },
];

export type SchedDoctor = { id: string; name: string; specialty: string; off?: boolean };
export const SCHED_DOCTORS: SchedDoctor[] = [
  { id: "andreas", name: "Dr. Andreas", specialty: "Chẩn đoán & hình ảnh" },
  { id: "linh", name: "Dr. Linh", specialty: "Hồi sức & nội trú" },
  { id: "martyna", name: "Dr. Martyna", specialty: "Nội khoa" },
  { id: "sophia", name: "Dr. Sophia", specialty: "Dinh dưỡng & dự phòng" },
  { id: "noah", name: "Dr. Noah", specialty: "Nha khoa" },
  { id: "lara", name: "Dr. Lara", specialty: "Trị liệu & phục hồi", off: true },
];

export type Appt = {
  id: string;
  consultId: string; // → /consultations/:id
  pet: string;
  species: "dog" | "cat";
  breed: string;
  owner: string;
  phone: string;
  reason: string;
  vetId: string;
  roomId: string;
  start: number; // minutes from OPEN_H
  dur: number;
  status: ApptStatus;
  emergency?: boolean;
};

const t = (h: number, m = 0) => (h - OPEN_H) * 60 + m;

export const APPOINTMENTS: Appt[] = [
  { id: "a1", consultId: "PK-2401", pet: "Napoleon", species: "dog", breed: "Beagle", owner: "Jennifer Oxlade", phone: "+84 365 277 101", reason: "RNATT — kháng thể dại", vetId: "andreas", roomId: "r1", start: t(9, 0), dur: 45, status: "in-consult" },
  { id: "a2", consultId: "PK-2402", pet: "Milo", species: "dog", breed: "French Bulldog", owner: "Truc Anh Nguyen", phone: "+84 901 234 567", reason: "Nôn mửa 2 ngày", vetId: "linh", roomId: "r2", start: t(9, 20), dur: 30, status: "arrived" },
  { id: "a3", consultId: "PK-2403", pet: "Bella", species: "dog", breed: "Golden Retriever", owner: "Minh Khoa Tran", phone: "+84 912 345 678", reason: "Tái khám hậu phẫu", vetId: "andreas", roomId: "r3", start: t(8, 30), dur: 30, status: "completed" },
  { id: "a4", consultId: "PK-2404", pet: "Rex", species: "dog", breed: "German Shepherd", owner: "Bao Long Le", phone: "+84 987 654 321", reason: "Thay băng hậu phẫu", vetId: "linh", roomId: "r3", start: t(13, 0), dur: 60, status: "confirmed" },
  { id: "a5", consultId: "PK-2405", pet: "Luna", species: "cat", breed: "Persian", owner: "Thu Hà Phạm", phone: "+84 938 110 220", reason: "Suy thận cấp — truyền dịch", vetId: "martyna", roomId: "r4", start: t(10, 0), dur: 60, status: "in-consult", emergency: true },
  { id: "a6", consultId: "PK-2406", pet: "Coco", species: "cat", breed: "Mèo Anh lông ngắn", owner: "Hoàng Nam Vũ", phone: "+84 909 222 113", reason: "Tiêm phòng định kỳ", vetId: "sophia", roomId: "r1", start: t(10, 30), dur: 30, status: "booked" },
  { id: "a7", consultId: "PK-2398", pet: "Mochi", species: "cat", breed: "Munchkin", owner: "Gia Bảo Trần", phone: "+84 905 778 221", reason: "Khám tổng quát", vetId: "noah", roomId: "r2", start: t(11, 0), dur: 30, status: "requested" },
  { id: "a8", consultId: "PK-2399", pet: "Buddy", species: "dog", breed: "Poodle", owner: "Khánh Linh Đỗ", phone: "+84 977 654 010", reason: "Da liễu — ngứa, rụng lông", vetId: "martyna", roomId: "r1", start: t(14, 0), dur: 45, status: "confirmed" },
  { id: "a9", consultId: "PK-2402", pet: "Simba", species: "cat", breed: "Mèo ta", owner: "Quỳnh Như Lê", phone: "+84 933 221 144", reason: "Triệt sản", vetId: "linh", roomId: "r3", start: t(15, 30), dur: 90, status: "requested" },
  { id: "a10", consultId: "PK-2401", pet: "Rocky", species: "dog", breed: "Bulldog", owner: "Đức Anh Hồ", phone: "+84 966 100 200", reason: "Khám tai", vetId: "noah", roomId: "r2", start: t(15, 0), dur: 30, status: "booked" },
  { id: "a11", consultId: "PK-2403", pet: "Daisy", species: "dog", breed: "Corgi", owner: "Mai Phương Võ", phone: "+84 944 556 677", reason: "Tái khám tiêu hoá", vetId: "andreas", roomId: "r1", start: t(16, 30), dur: 30, status: "no-show" },
  { id: "a12", consultId: "PK-2405", pet: "Oscar", species: "cat", breed: "Ragdoll", owner: "Tuấn Kiệt Phan", phone: "+84 922 808 909", reason: "Theo dõi sau cấp cứu", vetId: "martyna", roomId: "r4", start: t(13, 30), dur: 45, status: "confirmed" },
];

// Waiting room — patients who have arrived (sorted by wait desc in UI)
export type Waiting = { apptId: string; pet: string; species: "dog" | "cat"; owner: string; checkin: string; waitMins: number };
export const WAITING: Waiting[] = [
  { apptId: "a2", pet: "Milo", species: "dog", owner: "Truc Anh Nguyen", checkin: "09:20", waitMins: 58 },
  { apptId: "a6", pet: "Coco", species: "cat", owner: "Hoàng Nam Vũ", checkin: "10:05", waitMins: 13 },
  { apptId: "a8", pet: "Buddy", species: "dog", owner: "Khánh Linh Đỗ", checkin: "10:12", waitMins: 6 },
];

// Clients + their pets — for the New Appointment wizard
export type WizClient = { id: string; name: string; phone: string; hasAppt?: boolean; pets: { name: string; species: "dog" | "cat"; breed: string }[] };
export const WIZ_CLIENTS: WizClient[] = [
  { id: "c1", name: "Truc Anh Nguyen", phone: "+84 901 234 567", hasAppt: true, pets: [{ name: "Milo", species: "dog", breed: "French Bulldog" }] },
  { id: "c2", name: "Jennifer Oxlade", phone: "+84 365 277 101", pets: [{ name: "Napoleon", species: "dog", breed: "Beagle" }, { name: "Whiskers", species: "cat", breed: "Mèo ta" }] },
  { id: "c3", name: "Minh Khoa Tran", phone: "+84 912 345 678", pets: [{ name: "Bella", species: "dog", breed: "Golden Retriever" }] },
  { id: "c4", name: "Hoàng Nam Vũ", phone: "+84 909 222 113", pets: [{ name: "Coco", species: "cat", breed: "Mèo Anh lông ngắn" }] },
];

export const REASONS = ["Khám tổng quát", "Tiêm phòng", "Tái khám", "Da liễu", "Tiêu hoá", "Nha khoa", "Thủ thuật", "Cấp cứu"];
export const DURATIONS = [15, 30, 45, 60, 90];

// Week scatter (besides today) — light fill for the week grid: [dayIdx, start, dur, status, reason]
export const WEEK_SCATTER: { day: number; start: number; dur: number; status: ApptStatus; pet: string }[] = [
  { day: 0, start: t(9, 0), dur: 45, status: "completed", pet: "Ginger" },
  { day: 0, start: t(14, 0), dur: 30, status: "completed", pet: "Max" },
  { day: 2, start: t(8, 30), dur: 60, status: "booked", pet: "Toby" },
  { day: 2, start: t(11, 0), dur: 30, status: "confirmed", pet: "Nala" },
  { day: 3, start: t(10, 0), dur: 45, status: "booked", pet: "Pumpkin" },
  { day: 3, start: t(15, 0), dur: 30, status: "requested", pet: "Leo" },
  { day: 4, start: t(9, 30), dur: 60, status: "confirmed", pet: "Cleo" },
  { day: 5, start: t(10, 0), dur: 30, status: "booked", pet: "Bruno" },
];

// Month scatter — appointment count per day-of-month (demo)
export const MONTH_COUNTS: Record<number, number> = {
  2: 8, 3: 11, 4: 9, 5: 14, 6: 7, 9: 12, 10: 6, 11: 9, 12: 13, 13: 5,
  16: 10, 17: 8, 18: 12, 19: 7, 20: 9, 23: 11, 24: 6, 25: 8, 26: 10, 27: 4,
};

export function vndN(n: number) {
  return n.toLocaleString("vi-VN") + "đ";
}
