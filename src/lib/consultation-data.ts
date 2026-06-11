// ─────────────────────────────────────────────────────────────────────────────
// Consultations — list + detail mock data
// Sources: PRD.md §4.4 + UI_STRUCTURE.md §4–5, reconciled with the 08/06 meeting
// summary (SOAP = continuous block, estimate = price RANGE, declined services on
// invoice, drug dual-name, vitals pre-entered by nurse, AI scribe → human approve).
// Patients reuse the dashboard set for continuity.
// ─────────────────────────────────────────────────────────────────────────────

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
  dateLabel: string;   // "Hôm nay · 09:00"
  time: string;
  durationMin: number | null;
  status: ConsultStatus;
  allergy?: string;
  activeMeds: number;
};

export const consultations: ConsultRow[] = [
  { id: "PK-2401", patient: "Napoleon", species: "dog", breed: "Beagle", age: "3 tuổi", sex: "Đực (thiến)", weight: "12.4 kg",
    owner: "Jennifer Oxlade", phone: "+84 365 277 101", reason: "RNATT — xét nghiệm kháng thể dại", vet: "Dr. Andreas",
    dateLabel: "Hôm nay · 09:00", time: "09:00", durationMin: 18, status: "in-progress", allergy: "Cefalexin", activeMeds: 2 },
  { id: "PK-2402", patient: "Milo", species: "dog", breed: "French Bulldog", age: "5 tuổi", sex: "Đực (thiến)", weight: "11.8 kg",
    owner: "Truc Anh Nguyen", phone: "+84 901 234 567", reason: "Nôn mửa 2 ngày, bỏ ăn", vet: "Dr. Linh",
    dateLabel: "Hôm nay · 09:20", time: "09:20", durationMin: null, status: "arrived", allergy: "Amoxicillin", activeMeds: 1 },
  { id: "PK-2403", patient: "Bella", species: "dog", breed: "Golden Retriever", age: "8 tuổi", sex: "Cái", weight: "28.0 kg",
    owner: "Minh Khoa Tran", phone: "+84 912 345 678", reason: "Tái khám sau phẫu thuật", vet: "Dr. Andreas",
    dateLabel: "Hôm nay · 08:30", time: "08:30", durationMin: 35, status: "completed", activeMeds: 0 },
  { id: "PK-2404", patient: "Rex", species: "dog", breed: "German Shepherd", age: "4 tuổi", sex: "Đực", weight: "32.5 kg",
    owner: "Bao Long Le", phone: "+84 987 654 321", reason: "Hậu phẫu cắt lách — theo dõi nội trú", vet: "Dr. Linh",
    dateLabel: "Hôm nay · 10:05", time: "10:05", durationMin: 12, status: "in-progress", activeMeds: 3 },
  { id: "PK-2405", patient: "Luna", species: "cat", breed: "Persian", age: "6 tuổi", sex: "Cái (triệt sản)", weight: "4.1 kg",
    owner: "Thu Hà Phạm", phone: "+84 938 110 220", reason: "Suy thận cấp — truyền dịch", vet: "Dr. Martyna",
    dateLabel: "Hôm nay · 10:30", time: "10:30", durationMin: 8, status: "in-progress", allergy: "—", activeMeds: 2 },
  { id: "PK-2406", patient: "Coco", species: "cat", breed: "Mèo Anh lông ngắn", age: "2 tuổi", sex: "Cái", weight: "3.6 kg",
    owner: "Hoàng Nam Vũ", phone: "+84 909 222 113", reason: "Tiêm phòng định kỳ", vet: "Dr. Sophia",
    dateLabel: "Hôm nay · 11:00", time: "11:00", durationMin: null, status: "booked", activeMeds: 0 },
  { id: "PK-2399", patient: "Buddy", species: "dog", breed: "Poodle", age: "1 tuổi", sex: "Đực", weight: "5.2 kg",
    owner: "Khánh Linh Đỗ", phone: "+84 977 654 010", reason: "Khám da liễu — ngứa, rụng lông", vet: "Dr. Martyna",
    dateLabel: "Hôm qua · 16:20", time: "16:20", durationMin: 27, status: "completed", activeMeds: 1 },
  { id: "PK-2398", patient: "Mochi", species: "cat", breed: "Munchkin", age: "3 tuổi", sex: "Đực (thiến)", weight: "3.9 kg",
    owner: "Gia Bảo Trần", phone: "+84 905 778 221", reason: "Khám tổng quát", vet: "Dr. Noah",
    dateLabel: "Hôm qua · 14:00", time: "14:00", durationMin: null, status: "cancelled", activeMeds: 0 },
];

// ── KPI helpers ──────────────────────────────────────────────────────────────
export function consultKpis() {
  const inProgress = consultations.filter((c) => c.status === "in-progress").length;
  const completedToday = consultations.filter((c) => c.status === "completed" && c.dateLabel.startsWith("Hôm nay")).length;
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
  { key: "head", label: "Đầu" },
  { key: "right_ear", label: "Tai phải" },
  { key: "left_ear", label: "Tai trái" },
  { key: "right_eye", label: "Mắt phải" },
  { key: "left_eye", label: "Mắt trái" },
  { key: "mouth_teeth", label: "Miệng / Răng" },
  { key: "neck", label: "Cổ" },
  { key: "thorax", label: "Lồng ngực" },
  { key: "abdomen", label: "Bụng" },
  { key: "left_forelimb", label: "Chi trước trái" },
  { key: "right_forelimb", label: "Chi trước phải" },
  { key: "left_hindlimb", label: "Chi sau trái" },
  { key: "right_hindlimb", label: "Chi sau phải" },
  { key: "tail", label: "Đuôi" },
  { key: "skin", label: "Da & lông" },
];

export const REGION_STATUS_META: Record<RegionStatus, { label: string; color: string; bg: string }> = {
  unset: { label: "—", color: "#D4D4D4", bg: "transparent" },
  abnormal: { label: "Bất thường", color: "#EF4444", bg: "#FEF2F2" },
  normal: { label: "Bình thường", color: "#22C55E", bg: "#F0FDF4" },
  clear: { label: "Sạch", color: "#A3A3A3", bg: "#F9FAFB" },
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
  { key: "vomiting", label: "Nôn mửa liên tục" },
  { key: "lethargy", label: "Bỏ ăn / li bì bất thường" },
  { key: "bleeding", label: "Chảy máu hoặc dịch lạ" },
  { key: "breathing", label: "Khó thở" },
  { key: "swelling", label: "Sưng đỏ vết mổ / vùng điều trị" },
  { key: "seizure", label: "Co giật" },
  { key: "pain", label: "Đau rõ rệt, không chịu đứng / di chuyển" },
];
export const DIET_OPTIONS: { key: DietActivity; label: string }[] = [
  { key: "normal", label: "Bình thường" },
  { key: "restricted", label: "Hạn chế" },
  { key: "special", label: "Chế độ đặc biệt" },
];
export const ACTIVITY_OPTIONS: { key: DietActivity; label: string }[] = [
  { key: "normal", label: "Bình thường" },
  { key: "restricted", label: "Hạn chế vận động" },
  { key: "special", label: "Nghỉ ngơi hoàn toàn" },
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
  branch: "Phòng khám ADI — CN Nguyễn Văn Hương",
  hotline: "Hotline cấp cứu 24/7: 1800 1234",
};

/** Auto-pull "treatments performed" from invoice service lines (exclude drugs/supplies & declined). */
export function proceduresFromInvoice(invoice: InvoiceLine[]): string[] {
  return invoice.filter((l) => !l.declined && l.group !== "Thuốc").map((l) => l.name);
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
};

const SOAP_BY_ID: Record<string, ConsultDetail["soap"]> = {
  "PK-2401": {
    s: "Chủ nuôi đưa Napoleon đến để làm xét nghiệm kháng thể dại (RNATT) phục vụ thủ tục xuất cảnh. Bé ăn uống, đi vệ sinh bình thường, không nôn, không tiêu chảy. Mang theo sổ tiêm.",
    o: "Tỉnh táo, niêm mạc hồng, CRT < 2s. Cân nặng 12.4 kg (ổn định). Nhiệt độ 38.6°C. Nghe tim phổi rõ, không âm thổi. Hạch ngoại vi không sưng. Da lông sạch.",
    a: "Khoẻ mạnh, đủ điều kiện lấy máu làm RNATT. Lịch tiêm phòng dại còn hiệu lực.",
    p: "Lấy 2 ml máu gửi mẫu RNATT (phòng xét nghiệm ngoài). Hẹn trả kết quả sau 7–10 ngày. Tư vấn chủ nuôi về thời gian chờ trước khi đủ điều kiện xuất cảnh.",
  },
  "PK-2402": {
    s: "Nôn 2 ngày, ~3–4 lần/ngày, dịch vàng có bọt, không lẫn máu. Bỏ ăn từ tối qua, vẫn uống nước. Phân mềm. Không tiếp xúc dị vật rõ ràng. Chưa dùng thuốc tại nhà.",
    o: "Hơi mệt, niêm mạc hồng nhạt. Nhiệt độ 39.1°C (hơi cao). Sờ bụng vùng thượng vị có phản ứng đau nhẹ. Mất nước ~5% (da đàn hồi giảm nhẹ). Tim phổi bình thường.",
    a: "Theo dõi viêm dạ dày–ruột cấp, chưa loại trừ dị vật. Cần siêu âm bụng + xét nghiệm máu cơ bản để đánh giá.",
    p: "Truyền dịch Lactate Ringer bù nước. Chống nôn Maropitant. Nhịn ăn 12h rồi cho ăn thức ăn dễ tiêu. Chỉ định siêu âm bụng + CBC. Hẹn tái khám 48h nếu chưa cải thiện.",
  },
};

const DEFAULT_SOAP: ConsultDetail["soap"] = {
  s: "Ghi nhận lý do khám và bệnh sử do chủ nuôi cung cấp. (Phần Subjective — chủ quan)",
  o: "Kết quả thăm khám lâm sàng và chỉ số sinh hiệu. (Phần Objective — khách quan)",
  a: "Đánh giá / chẩn đoán sơ bộ. (Phần Assessment)",
  p: "Kế hoạch điều trị, xét nghiệm, theo dõi. (Phần Plan)",
};

export function getConsultDetail(id: string): ConsultDetail | null {
  const row = consultations.find((c) => c.id === id);
  if (!row) return null;

  const tempFlag = row.id === "PK-2402";
  return {
    ...row,
    pain: row.status === "in-progress" ? 2 : 0,
    bcs: 5,
    vitalsBy: "Y tá Mai",
    vitalsAt: "09:12",
    vitals: [
      { key: "weight", label: "Cân nặng", value: row.weight.replace(" kg", ""), unit: "kg", delta: "+0.2", range: "11–13" },
      { key: "temp", label: "Nhiệt độ", value: tempFlag ? "39.1" : "38.6", unit: "°C", delta: tempFlag ? "+0.6" : "0.0", range: "37.5–39.0", flag: tempFlag },
      { key: "hr", label: "Nhịp tim", value: "96", unit: "bpm", delta: "-4", range: "70–120" },
      { key: "rr", label: "Nhịp thở", value: "24", unit: "/phút", delta: "+2", range: "18–34" },
      { key: "bp", label: "Huyết áp", value: "132", unit: "mmHg", range: "110–160" },
    ],
    soap: SOAP_BY_ID[id] ?? DEFAULT_SOAP,
    bodySeed:
      id === "PK-2402"
        ? {
            abdomen: { status: "abnormal", note: "Phản ứng đau nhẹ khi sờ vùng thượng vị" },
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
            { name: "Khám lâm sàng", group: "Khám & chẩn đoán", low: 200_000, high: 200_000 },
            { name: "Siêu âm bụng", group: "Khám & chẩn đoán", low: 350_000, high: 500_000, note: "tuỳ số vùng khảo sát" },
            { name: "Xét nghiệm máu CBC", group: "Xét nghiệm", low: 280_000, high: 280_000 },
            { name: "Truyền dịch + chống nôn", group: "Thủ thuật & thuốc", low: 250_000, high: 450_000, note: "tuỳ thời gian truyền" },
          ]
        : [
            { name: "Khám lâm sàng", group: "Khám & chẩn đoán", low: 200_000, high: 200_000 },
            { name: "Xét nghiệm RNATT (gửi mẫu ngoài)", group: "Xét nghiệm", low: 850_000, high: 1_200_000, note: "phí phòng XN đối tác" },
          ],
    invoice:
      id === "PK-2402"
        ? [
            { name: "Khám lâm sàng", group: "Khám & chẩn đoán", qty: 1, price: 200_000, locked: true },
            { name: "Xét nghiệm máu CBC", group: "Xét nghiệm", qty: 1, price: 280_000 },
            { name: "Siêu âm bụng", group: "Xét nghiệm", qty: 1, price: 0, declined: true },
            { name: "Maropitant (chống nôn)", group: "Thuốc", qty: 1, price: 180_000 },
            { name: "Truyền dịch Lactate Ringer 500ml", group: "Thủ thuật", qty: 1, price: 220_000 },
          ]
        : [
            { name: "Khám lâm sàng", group: "Khám & chẩn đoán", qty: 1, price: 200_000, locked: true },
            { name: "Lấy mẫu & gửi RNATT", group: "Xét nghiệm", qty: 1, price: 1_050_000 },
          ],
    labs:
      id === "PK-2402"
        ? [
            { name: "Công thức máu (CBC)", code: "CBC", status: "in-progress" },
            { name: "Siêu âm bụng", code: "USG-ABD", status: "ordered" },
          ]
        : [{ name: "Kháng thể dại (RNATT)", code: "RNATT", status: "ordered" }],
    rx:
      id === "PK-2402"
        ? [
            { internal: "Maropitant 16mg", display: "Thuốc chống nôn", dose: "1 viên", route: "Uống", freq: "1 lần/ngày", duration: "3 ngày", qtyRx: 3, qtyDispensed: 3 },
            { internal: "Sucralfate 1g", display: "Thuốc bảo vệ niêm mạc dạ dày", dose: "1/2 viên", route: "Uống", freq: "2 lần/ngày", duration: "5 ngày", qtyRx: 10, qtyDispensed: 5 },
          ]
        : id === "PK-2401"
        ? [
            { internal: "NexGard Spectra S", display: "Thuốc phòng ký sinh trùng", dose: "1 viên", route: "Uống", freq: "1 lần/tháng", duration: "1 tháng", qtyRx: 1, qtyDispensed: 1 },
            { internal: "Drontal Plus Dog", display: "Thuốc tẩy giun sán", dose: "1.25 viên", route: "Uống", freq: "1 lần", duration: "1 ngày", qtyRx: 2, qtyDispensed: 2 }
          ]
        : [],
  };
}

// VND short formatter
export function vndShort(n: number): string {
  return n.toLocaleString("vi-VN") + "đ";
}
