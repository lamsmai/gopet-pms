// ─────────────────────────────────────────────────────────────────────────────
// Communications module — omnichannel data + integration-ready channel layer.
//
// The clinic talks to clients across four channels: WhatsApp, Zalo, SMS, Email.
// The UI is channel-agnostic; each channel plugs in through a `ChannelConfig`
// that mirrors what a real provider integration needs (provider name, env key,
// webhook path, capability flags such as the WhatsApp/Zalo 24h session window).
// Swapping the mock store for live adapters means implementing `ChannelAdapter`
// per channel and pointing `CHANNELS[x].apiEnvKey` / `webhookPath` at real infra.
// ─────────────────────────────────────────────────────────────────────────────

export type ChannelId = "whatsapp" | "zalo" | "sms" | "email";
export type ConnectionStatus = "connected" | "warning" | "disconnected";

/** What a channel can do — drives composer behaviour (char limit, template-only, media). */
export type ChannelCapability = {
  inbound: boolean;
  outbound: boolean;
  media: boolean;
  templates: boolean;
  /** Hard character ceiling per message (SMS = 160). */
  charLimit?: number;
  /** Outbound automated/marketing sends are held for staff approval. */
  requiresApproval: boolean;
  /**
   * Session-window channels (WhatsApp, Zalo) only allow free-form replies within
   * N hours of the client's last inbound message; outside it you must send an
   * approved template. `undefined` = no window (SMS, Email).
   */
  sessionWindowHours?: number;
};

/** Everything a real integration would need to come online. */
export type ChannelConfig = {
  id: ChannelId;
  label: string;
  /** Real provider this channel would bind to. */
  provider: string;
  /** Env var that would hold the API credential (no secrets in the prototype). */
  apiEnvKey: string;
  /** Inbound webhook the provider would POST to. */
  webhookPath: string;
  status: ConnectionStatus;
  /** Brand accent used for chips, rails and bubble accents. */
  accent: string;
  /** Soft background tint paired with `accent`. */
  soft: string;
  /** Short helper line shown in the channel/integration rail. */
  note: string;
  capability: ChannelCapability;
};

/**
 * The contract a live channel integration implements. Mock data below stands in
 * for these calls today; wiring a provider means fulfilling this per channel.
 */
export interface ChannelAdapter {
  id: ChannelId;
  send(input: { to: string; body: string; templateId?: string }): Promise<{ messageId: string; status: MessageStatus }>;
  /** Provider webhook → normalised inbound message. */
  receive(payload: unknown): Message;
  /** Whether a free-form reply is allowed right now (session window check). */
  canReplyFreeform(thread: Thread): boolean;
}

export const CHANNELS: Record<ChannelId, ChannelConfig> = {
  whatsapp: {
    id: "whatsapp",
    label: "WhatsApp",
    provider: "WhatsApp Business Cloud API (Meta)",
    apiEnvKey: "VITE_WHATSAPP_TOKEN",
    webhookPath: "/api/webhooks/whatsapp",
    status: "connected",
    accent: "#25D366",
    soft: "#E7F9EE",
    note: "Business Cloud · 24h session window",
    capability: { inbound: true, outbound: true, media: true, templates: true, requiresApproval: true, sessionWindowHours: 24 },
  },
  zalo: {
    id: "zalo",
    label: "Zalo OA",
    provider: "Zalo Official Account API",
    apiEnvKey: "VITE_ZALO_OA_TOKEN",
    webhookPath: "/api/webhooks/zalo",
    status: "connected",
    accent: "#0068FF",
    soft: "#E6F0FF",
    note: "Official Account · ZNS template quota",
    capability: { inbound: true, outbound: true, media: true, templates: true, requiresApproval: true, sessionWindowHours: 48 },
  },
  sms: {
    id: "sms",
    label: "SMS",
    provider: "Twilio Programmable Messaging",
    apiEnvKey: "VITE_TWILIO_AUTH_TOKEN",
    webhookPath: "/api/webhooks/twilio",
    status: "warning",
    accent: "#7A5AF8",
    soft: "#EEEAFE",
    note: "Two-way SMS · 160 char/segment",
    capability: { inbound: true, outbound: true, media: false, templates: true, charLimit: 160, requiresApproval: true },
  },
  email: {
    id: "email",
    label: "Email",
    provider: "SendGrid Mail API",
    apiEnvKey: "VITE_SENDGRID_API_KEY",
    webhookPath: "/api/webhooks/sendgrid",
    status: "connected",
    accent: "#0E7490",
    soft: "#E0F2FE",
    note: "Transactional + marketing streams",
    capability: { inbound: true, outbound: true, media: true, templates: true, requiresApproval: false },
  },
};

export const CHANNEL_ORDER: ChannelId[] = ["whatsapp", "zalo", "sms", "email"];

// ── People ───────────────────────────────────────────────────────────────────
export type StaffTeam = "cs" | "clinical" | "billing";
export type Staff = { id: string; name: string; initials: string; team: StaffTeam; role: string };

export const STAFF: Record<string, Staff> = {
  mai: { id: "mai", name: "Mai Tran", initials: "MT", team: "cs", role: "Front desk · CS" },
  hanh: { id: "hanh", name: "Hanh Vo", initials: "HV", team: "cs", role: "Client care" },
  lucas: { id: "lucas", name: "Dr. Lucas Tran", initials: "LT", team: "clinical", role: "Lead vet" },
  sarah: { id: "sarah", name: "Dr. Sarah Le", initials: "SL", team: "clinical", role: "Vet" },
  thu: { id: "thu", name: "Thu Nguyen", initials: "TN", team: "billing", role: "Cashier" },
};

// ── Conversations (discrete, assignable, closeable cases) ─────────────────────
export type ThreadStatus = "open" | "pending" | "snoozed" | "closed";
export type ThreadPriority = "normal" | "urgent";
export type MessageDirection = "inbound" | "outbound";
export type MessageStatus =
  | "received"
  | "queued"
  | "sent"
  | "delivered"
  | "read"
  | "failed"
  | "awaiting_approval";

export type Attachment = { kind: "image" | "pdf" | "video"; name: string };

export type Message = {
  id: string;
  channel: ChannelId;
  direction: MessageDirection;
  status: MessageStatus;
  body: string;
  /** Display time label, e.g. "09:24" or "Yesterday 17:02". */
  at: string;
  /** Staff display name for outbound, client name for inbound. */
  author: string;
  attachments?: Attachment[];
  /** Template id, when the message was sent from a template. */
  templateId?: string;
  /** System event rendered as a centered chip (assignment, close, channel switch). */
  systemNote?: string;
};

export type Thread = {
  id: string;
  /** Discrete case subject — a thread is opened and closed, not an endless chat. */
  subject: string;
  clientId: string;
  clientName: string;
  petId?: string;
  petName?: string;
  /** Channel the most recent message arrived on (omnichannel cases can switch). */
  channel: ChannelId;
  channelsUsed: ChannelId[];
  status: ThreadStatus;
  priority: ThreadPriority;
  /** CS owns the inbox; clinical is tagged in when input is needed. */
  assignee: Staff | null;
  /** Tagged-in collaborators (e.g. a vet asked to weigh in). */
  watchers: Staff[];
  lastPreview: string;
  lastAt: string;
  unread: number;
  /** Links the conversation back to a consultation / patient record. */
  linkedConsultId?: string;
  tags: string[];
  lang: "en" | "vi";
  messages: Message[];
};

export const THREADS: Thread[] = [
  {
    id: "CONV-4821",
    subject: "Post-op recovery — wound photo check",
    clientId: "CLI-0025",
    clientName: "Linh Tran",
    petId: "PAT-0102",
    petName: "Mochi",
    channel: "whatsapp",
    channelsUsed: ["whatsapp"],
    status: "open",
    priority: "urgent",
    assignee: STAFF.mai,
    watchers: [STAFF.lucas],
    lastPreview: "She’s licking the incision a little, is that normal?",
    lastAt: "09:24",
    unread: 2,
    linkedConsultId: "CON-2041",
    tags: ["post-op", "surgery"],
    lang: "en",
    messages: [
      { id: "m1", channel: "whatsapp", direction: "outbound", status: "read", at: "Yesterday 16:40", author: "Mai Tran", templateId: "TPL-discharge", body: "Hi Linh, Mochi’s spay went well. Please send a photo of the incision tomorrow morning so Dr. Lucas can check healing. 🐾" },
      { id: "m2", channel: "whatsapp", direction: "inbound", status: "received", at: "09:21", author: "Linh Tran", body: "Good morning! Here is today’s photo.", attachments: [{ kind: "image", name: "mochi-incision-day1.jpg" }] },
      { id: "m3", channel: "whatsapp", direction: "inbound", status: "received", at: "09:24", author: "Linh Tran", body: "She’s licking the incision a little, is that normal?" },
      { id: "sys1", channel: "whatsapp", direction: "outbound", status: "sent", at: "09:25", author: "system", body: "", systemNote: "Mai tagged Dr. Lucas Tran for clinical input" },
    ],
  },
  {
    id: "CONV-4820",
    subject: "Vaccine reminder reply — booking Bun",
    clientId: "CLI-0041",
    clientName: "Quang Pham",
    petId: "PAT-0188",
    petName: "Bun",
    channel: "zalo",
    channelsUsed: ["zalo"],
    status: "open",
    priority: "normal",
    assignee: STAFF.hanh,
    watchers: [],
    lastPreview: "Dạ chiều thứ 7 này mình qua được không ạ?",
    lastAt: "08:55",
    unread: 1,
    tags: ["vaccine", "booking"],
    lang: "vi",
    messages: [
      { id: "m1", channel: "zalo", direction: "outbound", status: "delivered", at: "Hôm qua 18:00", author: "Hanh Vo", templateId: "TPL-vaccine", body: "Chào anh Quang, bé Bun đã đến lịch tiêm nhắc DHPP. Anh sắp xếp đưa bé qua phòng khám giúp mình nhé!" },
      { id: "m2", channel: "zalo", direction: "inbound", status: "received", at: "08:55", author: "Quang Pham", body: "Dạ chiều thứ 7 này mình qua được không ạ?" },
    ],
  },
  {
    id: "CONV-4818",
    subject: "Lab results follow-up — Nori",
    clientId: "CLI-0108",
    clientName: "Emma Wilson",
    petId: "PAT-0144",
    petName: "Nori",
    channel: "email",
    channelsUsed: ["email", "whatsapp"],
    status: "pending",
    priority: "normal",
    assignee: STAFF.mai,
    watchers: [STAFF.sarah],
    lastPreview: "Thank you, looking forward to the explanation from the vet.",
    lastAt: "Yesterday 17:02",
    unread: 0,
    linkedConsultId: "CON-2038",
    tags: ["lab", "follow-up"],
    lang: "en",
    messages: [
      { id: "m1", channel: "email", direction: "inbound", status: "received", at: "Yesterday 15:30", author: "Emma Wilson", body: "Hi, I got the SMS that Nori’s blood test is ready. Could the vet explain the results?" },
      { id: "m2", channel: "email", direction: "outbound", status: "read", at: "Yesterday 17:02", author: "Mai Tran", body: "Hi Emma, Dr. Sarah will review Nori’s panel and send a plain-language summary today. I’ve attached the lab report PDF.", attachments: [{ kind: "pdf", name: "Nori-CBC-panel.pdf" }] },
    ],
  },
  {
    id: "CONV-4815",
    subject: "Deposit confirmation — Atlas boarding",
    clientId: "CLI-0122",
    clientName: "ADI Rescue Partner",
    petId: "PAT-0221",
    petName: "Atlas",
    channel: "sms",
    channelsUsed: ["sms"],
    status: "open",
    priority: "normal",
    assignee: null,
    watchers: [],
    lastPreview: "Deposit of 1.500.000đ received. Atlas is confirmed for 24 Jun.",
    lastAt: "Yesterday 11:10",
    unread: 0,
    tags: ["billing", "boarding"],
    lang: "en",
    messages: [
      { id: "m1", channel: "sms", direction: "outbound", status: "delivered", at: "Yesterday 11:10", author: "Thu Nguyen", templateId: "TPL-deposit", body: "GoPet: Deposit of 1.500.000d received. Atlas is confirmed for 24 Jun. Reply STOP to opt out." },
    ],
  },
  {
    id: "CONV-4809",
    subject: "Discharge note delivered — Mochi",
    clientId: "CLI-0025",
    clientName: "Linh Tran",
    petId: "PAT-0102",
    petName: "Mochi",
    channel: "email",
    channelsUsed: ["email", "whatsapp"],
    status: "closed",
    priority: "normal",
    assignee: STAFF.mai,
    watchers: [],
    lastPreview: "Closed by Mai — discharge note + invoice sent.",
    lastAt: "2 days ago",
    unread: 0,
    linkedConsultId: "CON-2041",
    tags: ["discharge", "invoice"],
    lang: "en",
    messages: [
      { id: "m1", channel: "email", direction: "outbound", status: "read", at: "2 days ago", author: "Mai Tran", templateId: "TPL-discharge", body: "Discharge instructions for Mochi attached. Please follow the home-care steps and book a recheck in 7 days.", attachments: [{ kind: "pdf", name: "Mochi-discharge.pdf" }, { kind: "pdf", name: "INV-5521.pdf" }] },
      { id: "sys1", channel: "email", direction: "outbound", status: "sent", at: "2 days ago", author: "system", body: "", systemNote: "Case closed by Mai Tran" },
    ],
  },
];

// ── Approval queue (automated outgoing messages held for review) ──────────────
export type ApprovalStatus = "pending" | "approved" | "skipped";
export type ApprovalItem = {
  id: string;
  channel: ChannelId;
  clientId: string;
  recipient: string;
  petName?: string;
  /** What fired this draft (e.g. "Vaccine due in 7 days"). */
  trigger: string;
  templateId: string;
  scheduledAt: string;
  preview: string;
  status: ApprovalStatus;
};

export const APPROVALS: ApprovalItem[] = [
  { id: "AP-91", channel: "zalo", clientId: "CLI-0041", recipient: "Quang Pham", petName: "Bun", trigger: "Vaccine due in 7 days", templateId: "TPL-vaccine", scheduledAt: "Today 14:00", status: "pending", preview: "Chào anh Quang, bé Bun sắp đến lịch tiêm nhắc. Đặt lịch giúp mình nhé!" },
  { id: "AP-90", channel: "whatsapp", clientId: "CLI-0108", recipient: "Emma Wilson", petName: "Nori", trigger: "Recheck reminder (lab)", templateId: "TPL-recheck", scheduledAt: "Today 15:30", status: "pending", preview: "Hi Emma, it’s time to recheck Nori’s bloodwork. Shall we book this week?" },
  { id: "AP-89", channel: "sms", clientId: "CLI-0025", recipient: "Linh Tran", petName: "Mochi", trigger: "Post-op recheck (Day 7)", templateId: "TPL-recheck", scheduledAt: "Tomorrow 09:00", status: "pending", preview: "GoPet: Mochi’s 7-day post-op recheck is due. Reply YES to confirm 24 Jun 10:00." },
  { id: "AP-88", channel: "email", clientId: "CLI-0122", recipient: "ADI Rescue Partner", petName: "Atlas", trigger: "Boarding check-in tomorrow", templateId: "TPL-booking", scheduledAt: "Today 18:00", status: "pending", preview: "Reminder: Atlas checks in tomorrow at 09:00. Please bring current food and medication." },
  { id: "AP-87", channel: "whatsapp", clientId: "CLI-0041", recipient: "Quang Pham", petName: "Bun", trigger: "Estimate awaiting approval", templateId: "TPL-estimate", scheduledAt: "Today 12:00", status: "pending", preview: "Chào anh Quang, báo giá điều trị cho bé Bun đã sẵn sàng. Anh xem và duyệt giúp mình nhé." },
];

// ── Reminder rules (automated engagement engine) ──────────────────────────────
export type ReminderRule = {
  id: string;
  name: string;
  trigger: string;
  /** Try channels in order; fall back if the first is unavailable. */
  channelPriority: ChannelId[];
  offset: string;
  audienceCount: number;
  active: boolean;
  lastRun: string;
  templateId: string;
};

export const REMINDER_RULES: ReminderRule[] = [
  { id: "R-vacc", name: "Vaccine due", trigger: "Vaccination due date", channelPriority: ["zalo", "whatsapp", "sms"], offset: "7 days before", audienceCount: 34, active: true, lastRun: "Today 06:00", templateId: "TPL-vaccine" },
  { id: "R-recheck", name: "Post-op recheck", trigger: "Surgery + 7 days", channelPriority: ["whatsapp", "sms"], offset: "1 day before", audienceCount: 6, active: true, lastRun: "Today 06:00", templateId: "TPL-recheck" },
  { id: "R-appt", name: "Appointment reminder", trigger: "Appointment − 24h", channelPriority: ["whatsapp", "zalo", "sms"], offset: "24h before", audienceCount: 18, active: true, lastRun: "Today 06:00", templateId: "TPL-booking" },
  { id: "R-wellness", name: "Annual wellness", trigger: "Last visit + 12 months", channelPriority: ["email", "zalo"], offset: "On due date", audienceCount: 52, active: false, lastRun: "—", templateId: "TPL-wellness" },
  { id: "R-photo", name: "Wound photo follow-up", trigger: "Post-op daily (gamified)", channelPriority: ["whatsapp"], offset: "Daily 09:00", audienceCount: 3, active: true, lastRun: "Today 09:00", templateId: "TPL-photo" },
];

/** Concrete reminders queued for the next 24h (the "planned view"). */
export type ReminderInstance = {
  id: string;
  petName: string;
  clientName: string;
  channel: ChannelId;
  type: string;
  scheduledAt: string;
  status: "scheduled" | "sent";
};

export const REMINDER_QUEUE: ReminderInstance[] = [
  { id: "RI-1", petName: "Bun", clientName: "Quang Pham", channel: "zalo", type: "Vaccine due", scheduledAt: "Today 14:00", status: "scheduled" },
  { id: "RI-2", petName: "Mochi", clientName: "Linh Tran", channel: "whatsapp", type: "Wound photo", scheduledAt: "Tomorrow 09:00", status: "scheduled" },
  { id: "RI-3", petName: "Nori", clientName: "Emma Wilson", channel: "whatsapp", type: "Lab recheck", scheduledAt: "Today 15:30", status: "scheduled" },
  { id: "RI-4", petName: "Atlas", clientName: "ADI Rescue Partner", channel: "email", type: "Boarding check-in", scheduledAt: "Today 18:00", status: "scheduled" },
  { id: "RI-5", petName: "Mochi", clientName: "Linh Tran", channel: "whatsapp", type: "Post-op recheck", scheduledAt: "Tomorrow 09:00", status: "scheduled" },
];

// ── Bulk campaigns ────────────────────────────────────────────────────────────
export type CampaignStatus = "draft" | "scheduled" | "sending" | "sent";
export type BulkCampaign = {
  id: string;
  name: string;
  channel: ChannelId;
  audienceLabel: string;
  matched: number;
  status: CampaignStatus;
  scheduledAt: string;
  sent: number;
  delivered: number;
  /** Send-rate throttle to respect provider limits. */
  throttlePerHour: number;
};

export const CAMPAIGNS: BulkCampaign[] = [
  { id: "CMP-12", name: "Rainy-season parasite check", channel: "zalo", audienceLabel: "Dogs · last visit > 6 mo", matched: 212, status: "scheduled", scheduledAt: "24 Jun 09:00", sent: 0, delivered: 0, throttlePerHour: 50 },
  { id: "CMP-11", name: "Senior cat wellness month", channel: "email", audienceLabel: "Cats · age ≥ 8y", matched: 88, status: "sending", scheduledAt: "Now", sent: 61, delivered: 58, throttlePerHour: 200 },
  { id: "CMP-10", name: "Rabies vaccination drive", channel: "whatsapp", audienceLabel: "Vaccine overdue · all species", matched: 134, status: "sent", scheduledAt: "20 Jun 08:00", sent: 134, delivered: 129, throttlePerHour: 20 },
  { id: "CMP-09", name: "Grand opening — D2 branch", channel: "sms", audienceLabel: "All active clients · D2 area", matched: 540, status: "draft", scheduledAt: "—", sent: 0, delivered: 0, throttlePerHour: 50 },
];

// ── Templates (variable-driven, multi-channel, bilingual) ─────────────────────
export type TemplateCategory = "clinical" | "billing" | "booking" | "follow-up" | "marketing";
export type MessageTemplate = {
  id: string;
  name: string;
  category: TemplateCategory;
  channels: ChannelId[];
  variables: string[];
  usage: number;
  updatedAt: string;
  body: { en: string; vi: string };
};

export const TEMPLATE_VARIABLES = ["{first_name}", "{pet_name}", "{date}", "{time}", "{vet_name}", "{clinic}", "{amount}", "{balance}"];

export const TEMPLATES: MessageTemplate[] = [
  {
    id: "TPL-vaccine", name: "Vaccine due reminder", category: "follow-up", channels: ["zalo", "whatsapp", "sms"],
    variables: ["{first_name}", "{pet_name}", "{date}"], usage: 412, updatedAt: "12 Jun 2026",
    body: { en: "Hi {first_name}, {pet_name} is due for a vaccination on {date}. Reply to book a slot at {clinic}.", vi: "Chào {first_name}, bé {pet_name} đến lịch tiêm nhắc vào {date}. Nhắn tin để đặt lịch tại {clinic} nhé." },
  },
  {
    id: "TPL-recheck", name: "Recheck reminder", category: "follow-up", channels: ["whatsapp", "sms", "zalo"],
    variables: ["{first_name}", "{pet_name}", "{date}", "{time}"], usage: 188, updatedAt: "10 Jun 2026",
    body: { en: "Hi {first_name}, it’s time for {pet_name}’s recheck. We suggest {date} at {time}. Reply YES to confirm.", vi: "Chào {first_name}, đã đến lịch tái khám của bé {pet_name}. Mình đề xuất {date} lúc {time}. Trả lời CÓ để xác nhận." },
  },
  {
    id: "TPL-discharge", name: "Discharge instructions", category: "clinical", channels: ["email", "whatsapp"],
    variables: ["{first_name}", "{pet_name}", "{vet_name}"], usage: 96, updatedAt: "08 Jun 2026",
    body: { en: "Hi {first_name}, discharge instructions for {pet_name} are attached. {vet_name} recommends a recheck in 7 days.", vi: "Chào {first_name}, hướng dẫn chăm sóc sau xuất viện cho bé {pet_name} đính kèm. {vet_name} khuyến nghị tái khám sau 7 ngày." },
  },
  {
    id: "TPL-estimate", name: "Estimate approval", category: "billing", channels: ["whatsapp", "zalo", "email"],
    variables: ["{first_name}", "{pet_name}", "{amount}"], usage: 74, updatedAt: "05 Jun 2026",
    body: { en: "Hi {first_name}, the treatment estimate for {pet_name} is {amount}. Please review and approve to proceed.", vi: "Chào {first_name}, báo giá điều trị cho bé {pet_name} là {amount}. Anh/chị xem và duyệt để mình tiến hành nhé." },
  },
  {
    id: "TPL-deposit", name: "Deposit confirmation", category: "billing", channels: ["sms", "zalo"],
    variables: ["{first_name}", "{pet_name}", "{amount}", "{date}"], usage: 53, updatedAt: "02 Jun 2026",
    body: { en: "GoPet: Deposit of {amount} received. {pet_name} is confirmed for {date}.", vi: "GoPet: Đã nhận đặt cọc {amount}. Bé {pet_name} đã được xác nhận cho ngày {date}." },
  },
  {
    id: "TPL-booking", name: "Appointment reminder", category: "booking", channels: ["whatsapp", "zalo", "sms"],
    variables: ["{first_name}", "{pet_name}", "{date}", "{time}"], usage: 305, updatedAt: "11 Jun 2026",
    body: { en: "Hi {first_name}, reminder: {pet_name}’s appointment is on {date} at {time}. See you at {clinic}!", vi: "Chào {first_name}, nhắc lịch: bé {pet_name} có hẹn vào {date} lúc {time}. Hẹn gặp tại {clinic}!" },
  },
  {
    id: "TPL-wellness", name: "Annual wellness check", category: "marketing", channels: ["email", "zalo"],
    variables: ["{first_name}", "{pet_name}"], usage: 41, updatedAt: "28 May 2026",
    body: { en: "Hi {first_name}, {pet_name} is due for an annual wellness check. Book this month for a complimentary weight & dental review.", vi: "Chào {first_name}, bé {pet_name} đến kỳ khám sức khỏe định kỳ. Đặt lịch trong tháng này để được kiểm tra cân nặng & răng miễn phí." },
  },
  {
    id: "TPL-photo", name: "Wound photo request", category: "clinical", channels: ["whatsapp"],
    variables: ["{first_name}", "{pet_name}"], usage: 27, updatedAt: "14 Jun 2026",
    body: { en: "Hi {first_name}, please send today’s photo of {pet_name}’s incision so our vet can check healing. 🐾", vi: "Chào {first_name}, gửi giúp mình ảnh vết mổ của bé {pet_name} hôm nay để bác sĩ kiểm tra nhé. 🐾" },
  },
];

// ── Derived helpers ───────────────────────────────────────────────────────────
export function templateById(id?: string) {
  return TEMPLATES.find((t) => t.id === id);
}

/** Per-channel open-thread counts for the inbox filter rail. */
export function inboxCounts() {
  const counts: Record<"all" | ChannelId, number> = { all: 0, whatsapp: 0, zalo: 0, sms: 0, email: 0 };
  for (const t of THREADS) {
    if (t.status === "closed") continue;
    counts.all += 1;
    counts[t.channel] += 1;
  }
  return counts;
}

export function commsSummary() {
  const openCases = THREADS.filter((t) => t.status !== "closed").length;
  const unread = THREADS.reduce((sum, t) => sum + t.unread, 0);
  const awaitingApproval = APPROVALS.filter((a) => a.status === "pending").length;
  const dueReminders = REMINDER_QUEUE.filter((r) => r.status === "scheduled").length;
  const connectedChannels = CHANNEL_ORDER.filter((id) => CHANNELS[id].status === "connected").length;
  return { openCases, unread, awaitingApproval, dueReminders, connectedChannels, totalChannels: CHANNEL_ORDER.length };
}
