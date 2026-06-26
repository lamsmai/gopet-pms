import { useEffect, useMemo, useRef, useState, type Dispatch, type SetStateAction } from "react";
import { useNavigate } from "react-router-dom";
import {
  AlertTriangle,
  ArrowRight,
  BellRing,
  CalendarClock,
  CalendarPlus,
  Check,
  CheckCheck,
  ChevronRight,
  Clock,
  FileText,
  Filter,
  Image as ImageIcon,
  Inbox,
  Link2,
  ListChecks,
  Mail,
  MessageCircle,
  MessageSquare,
  MessageSquareText,
  Paperclip,
  PauseCircle,
  PlayCircle,
  Plus,
  ReceiptText,
  Search,
  Send,
  Settings2,
  ShieldCheck,
  Sparkles,
  Stethoscope,
  Tag,
  UserPlus,
  Users,
  Wand2,
  X,
  type LucideIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn, vndFull } from "@/lib/utils";
import { useLang } from "@/lib/i18n";
import { getPatientById } from "@/lib/patient-data";
import { clients } from "@/lib/patient-data";
import { DOCTORS } from "@/lib/data";
import { catalogItems } from "@/lib/catalog-data";
import {
  APPROVALS,
  CAMPAIGNS,
  CHANNEL_ORDER,
  CHANNELS,
  REMINDER_QUEUE,
  REMINDER_RULES,
  STAFF,
  TEMPLATES,
  TEMPLATE_VARIABLES,
  THREADS,
  commsSummary,
  templateById,
  type ApprovalItem,
  type ChannelId,
  type MessageTemplate,
  type ReminderRule,
  type Staff,
  type Thread,
  type ThreadStatus,
} from "@/lib/communications-data";

export type CommsView = "inbox" | "approvals" | "reminders" | "bulk" | "templates";

const CHANNEL_ICON: Record<ChannelId, LucideIcon> = {
  whatsapp: MessageCircle,
  zalo: MessageSquare,
  sms: MessageSquareText,
  email: Mail,
};

const STAFF_LIST = Object.values(STAFF);

// Shared keyboard focus ring for raw (non-Button) interactive elements.
const FOCUS = "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#034751]/40 focus-visible:ring-offset-1";

const SAMPLE_VARS: Record<string, string> = {
  "{first_name}": "Linh",
  "{pet_name}": "Mochi",
  "{date}": "24 Jun",
  "{time}": "10:00",
  "{vet_name}": "Dr. Lucas Tran",
  "{clinic}": "GoPet D7",
  "{amount}": "1.500.000đ",
  "{balance}": "0đ",
};

function fillTemplate(body: string) {
  return TEMPLATE_VARIABLES.reduce((acc, v) => acc.split(v).join(SAMPLE_VARS[v] ?? v), body);
}

// ── Channel chip ──────────────────────────────────────────────────────────────
function ChannelChip({ id, size = "md" }: { id: ChannelId; size?: "sm" | "md" }) {
  const c = CHANNELS[id];
  const Icon = CHANNEL_ICON[id];
  return (
    <span
      style={{ backgroundColor: c.soft, color: c.accent }}
      className={cn(
        "inline-flex items-center gap-1 rounded-md font-semibold",
        size === "sm" ? "px-1.5 py-0.5 text-[10px]" : "px-2 py-1 text-[11px]"
      )}
    >
      <Icon className={size === "sm" ? "h-3 w-3" : "h-3.5 w-3.5"} />
      {c.label}
    </span>
  );
}

function ChannelDot({ id }: { id: ChannelId }) {
  const c = CHANNELS[id];
  const Icon = CHANNEL_ICON[id];
  return (
    <span
      style={{ backgroundColor: c.accent }}
      className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-white shadow-soft"
    >
      <Icon className="h-4 w-4" />
    </span>
  );
}

function StaffAvatar({ staff, className }: { staff: Staff; className?: string }) {
  const tone = staff.team === "clinical" ? "bg-[#0E5F5A]" : staff.team === "billing" ? "bg-[#8A5300]" : "bg-[#034751]";
  return (
    <span className={cn("flex h-7 w-7 items-center justify-center rounded-full text-[10px] font-bold text-white", tone, className)}>
      {staff.initials}
    </span>
  );
}

// ── Page ────────────────────────────────────────────────────────────────────
export default function CommunicationsPage({
  initialView = "inbox",
  initialChannel = "all",
}: {
  initialView?: CommsView;
  initialChannel?: "all" | ChannelId;
}) {
  const { t, lang } = useLang();
  const [view, setView] = useState<CommsView>(initialView);
  const [threads, setThreads] = useState<Thread[]>(THREADS_SEED);
  // Derive the inbox-driven counts from live state so the KPIs and tab badges
  // stay in sync as cases are read, replied to, or closed.
  const summary = useMemo(() => {
    const base = commsSummary();
    return {
      ...base,
      openCases: threads.filter((th) => th.status !== "closed").length,
      unread: threads.reduce((sum, th) => sum + th.unread, 0),
    };
  }, [threads]);

  const VIEW_TABS: { id: CommsView; key: string; icon: LucideIcon; badge?: number }[] = [
    { id: "inbox", key: "co.view.inbox", icon: Inbox, badge: summary.unread },
    { id: "approvals", key: "co.view.approvals", icon: CheckCheck, badge: summary.awaitingApproval },
    { id: "reminders", key: "co.view.reminders", icon: BellRing },
    { id: "bulk", key: "co.view.bulk", icon: Send },
    { id: "templates", key: "co.view.templates", icon: FileText },
  ];

  return (
    <div className="flex h-full flex-col bg-[#F7F9F8]">
      {/* Header */}
      <header className="shrink-0 border-b border-neutral-200 bg-white px-5 pt-4">
        <div className="mx-auto flex max-w-[1600px] flex-col gap-3">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center gap-1.5 rounded-md bg-[#034751]/10 px-2.5 py-1 text-[12px] font-bold text-[#034751]">
                  <MessageSquare className="h-3.5 w-3.5" />
                  {t("nav.comms")}
                </span>
                <span className="rounded-md bg-white px-2.5 py-1 text-[12px] font-semibold text-neutral-500 ring-1 ring-neutral-200">
                  {t("co.omnichannel")}
                </span>
              </div>
              <h1 className="mt-2 font-display text-[26px] font-bold leading-tight tracking-tight text-neutral-950">
                {t("co.title")}
              </h1>
            </div>
            <div className="flex items-center gap-1.5">
              {CHANNEL_ORDER.map((id) => (
                <ChannelStatusPill key={id} id={id} t={t} />
              ))}
            </div>
          </div>

          {/* KPI strip */}
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-5">
            <Kpi label={t("co.kpi.openCases")} value={summary.openCases} icon={Inbox} tone="teal" />
            <Kpi label={t("co.kpi.unread")} value={summary.unread} icon={MessageCircle} tone="amber" />
            <Kpi label={t("co.kpi.approval")} value={summary.awaitingApproval} icon={CheckCheck} tone="violet" />
            <Kpi label={t("co.kpi.reminders")} value={summary.dueReminders} icon={BellRing} tone="blue" />
            <Kpi label={t("co.kpi.channels")} value={`${summary.connectedChannels}/${summary.totalChannels}`} icon={ShieldCheck} tone="green" />
          </div>

          {/* View tabs */}
          <nav className="flex items-center gap-0.5 overflow-x-auto">
            {VIEW_TABS.map((tab) => {
              const active = view === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setView(tab.id)}
                  className={cn(
                    "group relative flex items-center gap-2 whitespace-nowrap rounded-t-lg px-3.5 py-2.5 text-[13px] font-semibold transition-colors",
                    FOCUS,
                    active ? "text-[#034751]" : "text-neutral-500 hover:text-neutral-800"
                  )}
                >
                  <tab.icon className="h-4 w-4" />
                  {t(tab.key)}
                  {tab.badge ? (
                    <span className={cn("flex h-4 min-w-4 items-center justify-center rounded-full px-1 text-[10px] font-bold", active ? "bg-[#034751] text-white" : "bg-neutral-200 text-neutral-600")}>
                      {tab.badge}
                    </span>
                  ) : null}
                  {active && <span className="absolute inset-x-2 -bottom-px h-0.5 rounded-full bg-[#034751]" />}
                </button>
              );
            })}
          </nav>
        </div>
      </header>

      {/* View body */}
      <div className="min-h-0 flex-1">
        {view === "inbox" && <InboxView threads={threads} setThreads={setThreads} initialChannel={initialChannel} lang={lang} t={t} />}
        {view === "approvals" && <ApprovalsView t={t} />}
        {view === "reminders" && <RemindersView t={t} />}
        {view === "bulk" && <BulkView t={t} />}
        {view === "templates" && <TemplatesView t={t} />}
      </div>
    </div>
  );
}

type TFn = (k: string) => string;

function ChannelStatusPill({ id, t }: { id: ChannelId; t: TFn }) {
  const c = CHANNELS[id];
  const Icon = CHANNEL_ICON[id];
  const dot = c.status === "connected" ? "bg-emerald-500" : c.status === "warning" ? "bg-amber-500" : "bg-neutral-300";
  return (
    <span
      title={`${c.label} · ${c.provider} · ${t(`co.conn.${c.status}`)}`}
      className="hidden items-center gap-1.5 rounded-lg border border-neutral-200 bg-white px-2 py-1 text-[11px] font-semibold text-neutral-600 sm:inline-flex"
    >
      <Icon className="h-3.5 w-3.5" style={{ color: c.accent }} />
      <span className="hidden lg:inline">{c.label}</span>
      <span className={cn("h-1.5 w-1.5 rounded-full", dot)} />
    </span>
  );
}

function Kpi({ label, value, icon: Icon, tone }: { label: string; value: number | string; icon: LucideIcon; tone: "teal" | "amber" | "violet" | "blue" | "green" }) {
  const tones: Record<string, string> = {
    teal: "bg-[#034751]/10 text-[#034751]",
    amber: "bg-amber-50 text-amber-700",
    violet: "bg-[#EEEAFE] text-[#5b3fd6]",
    blue: "bg-info-soft text-info-strong",
    green: "bg-success-soft text-success-strong",
  };
  return (
    <div className="flex items-center gap-2.5 rounded-lg border border-neutral-200 bg-white px-3 py-2 shadow-soft">
      <span className={cn("flex h-8 w-8 shrink-0 items-center justify-center rounded-md", tones[tone])}>
        <Icon className="h-4 w-4" />
      </span>
      <div className="min-w-0">
        <div className="text-xl font-bold leading-none tnum text-neutral-950">{value}</div>
        <div className="mt-0.5 truncate text-[11px] font-semibold text-neutral-500">{label}</div>
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════════════
// INBOX — omnichannel, case-based threads
// ════════════════════════════════════════════════════════════════════════════
function InboxView({
  threads,
  setThreads,
  initialChannel,
  lang,
  t,
}: {
  threads: Thread[];
  setThreads: Dispatch<SetStateAction<Thread[]>>;
  initialChannel: "all" | ChannelId;
  lang: "en" | "vi";
  t: TFn;
}) {
  const [channel, setChannel] = useState<"all" | ChannelId>(initialChannel);
  const [query, setQuery] = useState("");
  const [activeId, setActiveId] = useState<string>(() => threads.find((th) => th.status !== "closed")?.id ?? "");

  const counts = useMemo(() => {
    const c: Record<"all" | ChannelId, number> = { all: 0, whatsapp: 0, zalo: 0, sms: 0, email: 0 };
    for (const th of threads) {
      if (th.status === "closed") continue;
      c.all += 1;
      c[th.channel] += 1;
    }
    return c;
  }, [threads]);

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return threads.filter((th) => {
      if (channel !== "all" && th.channel !== channel) return false;
      if (!q) return true;
      return [th.subject, th.clientName, th.petName ?? "", th.lastPreview].some((f) => f.toLowerCase().includes(q));
    });
  }, [threads, channel, query]);

  // Derive the open conversation from the *visible* set so changing the channel
  // filter or search never leaves a hidden thread showing in the reading pane.
  const active = visible.find((th) => th.id === activeId) ?? visible[0];

  function mutate(id: string, fn: (th: Thread) => Thread) {
    setThreads((prev) => prev.map((th) => (th.id === id ? fn(th) : th)));
  }

  return (
    <div className="grid h-full grid-cols-1 md:grid-cols-[300px_1fr] xl:grid-cols-[340px_1fr_312px]">
      {/* Thread list */}
      <aside className="flex min-h-0 flex-col border-r border-neutral-200 bg-white">
        <div className="shrink-0 space-y-2.5 border-b border-neutral-100 p-3">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={t("co.searchConv")}
              className="h-9 w-full rounded-lg border border-neutral-200 bg-white pl-9 pr-3 text-sm text-neutral-800 placeholder:text-neutral-400 focus:border-[#034751] focus:outline-none focus:ring-2 focus:ring-[#034751]/20"
            />
          </div>
          <div className="flex flex-wrap items-center gap-1">
            <ChannelFilterBtn id="all" active={channel === "all"} count={counts.all} onClick={() => setChannel("all")} t={t} />
            {CHANNEL_ORDER.map((id) => (
              <ChannelFilterBtn key={id} id={id} active={channel === id} count={counts[id]} onClick={() => setChannel(id)} t={t} />
            ))}
          </div>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto">
          {visible.length === 0 ? (
            <EmptyState icon={Inbox} title={t("co.empty.threads")} />
          ) : (
            visible.map((th) => (
              <ThreadRow
                key={th.id}
                th={th}
                active={th.id === active?.id}
                onClick={() => {
                  setActiveId(th.id);
                  if (th.unread) mutate(th.id, (c) => ({ ...c, unread: 0 }));
                }}
                t={t}
              />
            ))
          )}
        </div>
      </aside>

      {/* Conversation */}
      <section className="flex min-h-0 min-w-0 flex-col bg-[#F7F9F8]">
        {active ? <Conversation key={active.id} th={active} mutate={mutate} t={t} /> : <EmptyState icon={MessageSquare} title={t("co.empty.pickThread")} />}
      </section>

      {/* Context rail */}
      <aside className="hidden min-h-0 flex-col overflow-y-auto border-l border-neutral-200 bg-white xl:flex">
        {active ? <ContextRail th={active} mutate={mutate} lang={lang} t={t} /> : null}
      </aside>
    </div>
  );
}

function ChannelFilterBtn({ id, active, count, onClick, t }: { id: "all" | ChannelId; active: boolean; count: number; onClick: () => void; t: TFn }) {
  const isAll = id === "all";
  const c = isAll ? null : CHANNELS[id];
  const Icon = isAll ? Filter : CHANNEL_ICON[id];
  return (
    <button
      onClick={onClick}
      className={cn(
        "inline-flex h-7 items-center gap-1.5 rounded-full border px-2.5 text-[11px] font-semibold transition-colors",
        FOCUS,
        active ? "border-[#034751] bg-[#034751] text-white" : "border-neutral-200 bg-white text-neutral-600 hover:border-[#034751]/40 hover:text-[#034751]"
      )}
    >
      <Icon className="h-3 w-3" style={!active && c ? { color: c.accent } : undefined} />
      {isAll ? t("co.allChannels") : c!.label}
      <span className={cn("tnum", active ? "text-white/80" : "text-neutral-400")}>{count}</span>
    </button>
  );
}

function ThreadRow({ th, active, onClick, t }: { th: Thread; active: boolean; onClick: () => void; t: TFn }) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "flex w-full items-start gap-3 border-b border-neutral-100 px-3 py-3 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#034751]/40",
        active ? "bg-[#034751]/[0.06]" : "hover:bg-neutral-50",
        th.status === "closed" && "opacity-60"
      )}
    >
      <div className="relative">
        <ChannelDot id={th.channel} />
        {th.unread > 0 && (
          <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-destructive px-1 text-[9px] font-bold text-white">
            {th.unread}
          </span>
        )}
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center justify-between gap-2">
          <span className={cn("truncate text-[13px] font-bold text-neutral-900", th.unread > 0 && "text-neutral-950")}>{th.clientName}</span>
          <span className="shrink-0 text-[10px] font-medium text-neutral-400">{th.lastAt}</span>
        </div>
        <div className="mt-0.5 flex items-center gap-1.5">
          {th.petName && <span className="truncate text-[11px] font-semibold text-[#034751]">{th.petName}</span>}
          {th.priority === "urgent" && <AlertTriangle className="h-3 w-3 shrink-0 text-destructive" />}
        </div>
        <div className="mt-1 truncate text-[12px] leading-snug text-neutral-500">{th.lastPreview}</div>
        <div className="mt-1.5 flex items-center gap-1.5">
          <StatusPill status={th.status} t={t} />
          {th.assignee ? (
            <span className="inline-flex items-center gap-1 text-[10px] font-medium text-neutral-500">
              <StaffAvatar staff={th.assignee} className="h-4 w-4 text-[8px]" />
              {th.assignee.name.split(" ")[0]}
            </span>
          ) : (
            <span className="text-[10px] font-semibold text-amber-600">{t("co.unassigned")}</span>
          )}
        </div>
      </div>
    </button>
  );
}

function StatusPill({ status, t }: { status: ThreadStatus; t: TFn }) {
  const map: Record<ThreadStatus, string> = {
    open: "bg-success-soft text-success-strong",
    pending: "bg-warning-soft text-warning-foreground",
    snoozed: "bg-neutral-100 text-neutral-500",
    closed: "bg-neutral-100 text-neutral-400",
  };
  return <span className={cn("rounded-full px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide", map[status])}>{t(`co.status.${status}`)}</span>;
}

function Conversation({ th, mutate, t }: { th: Thread; mutate: (id: string, fn: (th: Thread) => Thread) => void; t: TFn }) {
  const [draft, setDraft] = useState("");
  const [showAiSuggestions, setShowAiSuggestions] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [refiningTone, setRefiningTone] = useState(false);
  const [showToneDropdown, setShowToneDropdown] = useState(false);
  const [quickAction, setQuickAction] = useState<QuickActionId | null>(null);
  const [suggestDismissed, setSuggestDismissed] = useState(false);
  const [qcToast, setQcToast] = useState<string | null>(null);

  const navigate = useNavigate();
  const cap = CHANNELS[th.channel].capability;
  const scrollRef = useRef<HTMLDivElement>(null);
  const withinWindow = th.messages.some((m) => m.direction === "inbound");

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight });
  }, [th.messages.length, th.id]);

  function send() {
    const body = draft.trim();
    if (!body) return;
    mutate(th.id, (cur) => ({
      ...cur,
      unread: 0,
      lastPreview: body,
      lastAt: t("co.now"),
      messages: [
        ...cur.messages,
        { id: `m${cur.messages.length + 1}-${cur.id}`, channel: cur.channel, direction: "outbound", status: cap.requiresApproval && !withinWindow ? "awaiting_approval" : "sent", at: t("co.now"), author: "Mai Tran", body },
      ],
    }));
    setDraft("");
  }

  function simulateTyping(text: string) {
    setIsTyping(true);
    setDraft("");
    let currentText = "";
    let index = 0;
    
    const interval = setInterval(() => {
      if (index < text.length) {
        currentText += text.substring(index, index + 2);
        index += 2;
        setDraft(currentText);
      } else {
        clearInterval(interval);
        setIsTyping(false);
      }
    }, 12);
  }

  function handleRefineTone(tone: string) {
    if (!draft.trim()) return;
    setRefiningTone(true);
    setTimeout(() => {
      const refined = refineToneText(draft, tone, th.lang);
      simulateTyping(refined);
      setRefiningTone(false);
    }, 800);
  }

  const overLimit = cap.charLimit ? draft.length > cap.charLimit : false;
  const intents = useMemo(() => detectIntents(th), [th.id, th.messages.length]);

  function handleQuickCreate(_action: QuickActionId, summary: string, draftReply?: string) {
    mutate(th.id, (c) => ({
      ...c,
      lastPreview: summary,
      lastAt: t("co.now"),
      messages: [
        ...c.messages,
        { id: `sys-qc-${c.messages.length}`, channel: c.channel, direction: "outbound", status: "sent", at: t("co.now"), author: "system", body: "", systemNote: summary },
      ],
    }));
    setQuickAction(null);
    setQcToast(summary);
    window.setTimeout(() => setQcToast(null), 3500);
    if (draftReply) simulateTyping(draftReply);
  }

  return (
    <div className="relative flex h-full min-h-0 flex-col">
      {qcToast && (
        <div className="pointer-events-none absolute left-1/2 top-3 z-50 -translate-x-1/2">
          <div className="flex items-center gap-2 rounded-full bg-[#034751] px-3.5 py-1.5 text-[12px] font-semibold text-white shadow-lift animate-in fade-in-0 slide-in-from-top-2">
            <Check className="h-3.5 w-3.5" />
            {qcToast}
          </div>
        </div>
      )}
      {/* Case header */}
      <div className="shrink-0 border-b border-neutral-200 bg-white px-4 py-3">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h2 className="truncate font-display text-[17px] font-bold tracking-tight text-neutral-950">{th.subject}</h2>
              {th.priority === "urgent" && <Badge variant="destructive" className="rounded-md"><AlertTriangle className="h-3 w-3" />{t("co.urgent")}</Badge>}
            </div>
            <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-[12px] text-neutral-500">
              <span className="font-semibold text-neutral-700">{th.clientName}</span>
              {th.petName && (
                <>
                  <span className="text-neutral-300">·</span>
                  <span className="font-semibold text-[#034751]">{th.petName}</span>
                </>
              )}
              <span className="text-neutral-300">·</span>
              <span className="font-mono text-[11px]">{th.id}</span>
              {th.channelsUsed.length > 1 && (
                <span className="inline-flex items-center gap-1">
                  <span className="text-neutral-300">·</span>
                  {th.channelsUsed.map((id) => {
                    const Icon = CHANNEL_ICON[id];
                    return <Icon key={id} className="h-3.5 w-3.5" style={{ color: CHANNELS[id].accent }} />;
                  })}
                </span>
              )}
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-1.5">
            {th.linkedConsultId && (
              <Button variant="outline" size="sm" className="gap-1.5" onClick={() => navigate(`/consultations/${th.linkedConsultId}`)}>
                <Stethoscope className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">{t("co.linkedConsult")}</span>
              </Button>
            )}
            {th.petId && (
              <Button size="sm" className="gap-1.5" onClick={() => navigate(`/patients/${th.petId}`)}>
                <Link2 className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">{t("co.openRecord")}</span>
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Messages */}
      <div ref={scrollRef} className="min-h-0 flex-1 space-y-3 overflow-y-auto px-4 py-4">
        {th.messages.map((m) =>
          m.systemNote ? (
            <div key={m.id} className="flex justify-center">
              <span className="rounded-full bg-neutral-200/70 px-3 py-1 text-[11px] font-medium text-neutral-500">{m.systemNote} · {m.at}</span>
            </div>
          ) : (
            <MessageBubble key={m.id} m={m} threadId={th.id} threadLang={th.lang} t={t} />
          )
        )}
      </div>

      {/* AI Smart Reply Suggestions Panel */}
      {showAiSuggestions && (
        <div className="shrink-0 border-t border-[#034751]/10 bg-[#034751]/5 px-4 py-3">
          <div className="flex items-center justify-between mb-2">
            <span className="flex items-center gap-1.5 text-xs font-bold text-[#034751]">
              <Sparkles className="h-4 w-4" />
              {t("co.ai.suggestions")}
            </span>
            <button onClick={() => setShowAiSuggestions(false)} className="text-neutral-400 hover:text-neutral-600">
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
          <div className="grid gap-2 sm:grid-cols-3">
            {(MOCK_SMART_REPLIES[th.id] || GENERIC_SMART_REPLIES).map((rep, idx) => {
              const replyText = rep.text[th.lang === "vi" ? "vi" : "en"];
              const labelText = rep.label[th.lang === "vi" ? "vi" : "en"];
              return (
                <button
                  key={idx}
                  onClick={() => {
                    setShowAiSuggestions(false);
                    simulateTyping(replyText);
                  }}
                  className="rounded-lg border border-neutral-200 bg-white p-3 text-left hover:border-[#034751] hover:shadow-soft transition-all"
                  disabled={isTyping}
                >
                  <div className="text-[12px] font-bold text-[#034751] mb-1">{labelText}</div>
                  <div className="line-clamp-2 text-[11px] text-neutral-600 leading-snug">{replyText}</div>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Conversation → action: contextual suggestions + quick-create */}
      {th.status !== "closed" && (
        <QuickCreatePanel
          intents={suggestDismissed ? [] : intents}
          onDismissSuggest={() => setSuggestDismissed(true)}
          onPick={(a) => setQuickAction(a)}
          t={t}
        />
      )}

      {/* Composer */}
      <div className="shrink-0 border-t border-neutral-200 bg-white p-3">
        {th.status === "closed" ? (
          <div className="flex items-center justify-between rounded-lg border border-neutral-200 bg-neutral-50 px-3 py-2.5">
            <span className="text-[12px] font-medium text-neutral-500">{t("co.caseClosed")}</span>
            <Button size="sm" variant="outline" onClick={() => mutate(th.id, (c) => ({ ...c, status: "open" }))}>{t("co.reopen")}</Button>
          </div>
        ) : (
          <>
            <div className="mb-2 flex items-center gap-1.5">
              <ChannelChip id={th.channel} size="sm" />
              {cap.sessionWindowHours ? (
                <span className={cn("inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[10px] font-semibold", withinWindow ? "bg-success-soft text-success-strong" : "bg-warning-soft text-warning-foreground")}>
                  <Clock className="h-3 w-3" />
                  {withinWindow ? t("co.window.in") : t("co.window.out")}
                </span>
              ) : null}
              {cap.requiresApproval && !withinWindow && (
                <span className="inline-flex items-center gap-1 rounded-md bg-[#EEEAFE] px-1.5 py-0.5 text-[10px] font-semibold text-[#5b3fd6]">
                  <CheckCheck className="h-3 w-3" />
                  {t("co.needsApproval")}
                </span>
              )}
            </div>
            <div className="rounded-lg border border-neutral-200 bg-white focus-within:border-[#034751] focus-within:ring-2 focus-within:ring-[#034751]/15">
              <textarea
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) send();
                }}
                disabled={isTyping || refiningTone}
                rows={2}
                placeholder={isTyping ? t("co.ai.tone.refining") : refiningTone ? t("co.ai.tone.refining") : t("co.replyPlaceholder")}
                className="w-full resize-none rounded-t-lg bg-transparent px-3 py-2.5 text-sm text-neutral-800 placeholder:text-neutral-400 focus:outline-none disabled:opacity-75"
              />
              <div className="flex items-center justify-between gap-2 border-t border-neutral-100 px-2 py-1.5">
                <div className="flex items-center gap-0.5">
                  <ComposerIcon icon={Wand2} label={t("co.insertTemplate")} onClick={() => setDraft((d) => (d ? d : fillTemplate(TEMPLATES[0].body.en)))} />
                  
                  {/* AI Smart Reply Button */}
                  <ComposerIcon
                    icon={Sparkles}
                    label={t("co.ai.smartReply")}
                    onClick={() => setShowAiSuggestions(!showAiSuggestions)}
                  />

                  {/* AI Tone Refiner Dropdown */}
                  <div className="relative">
                    <button
                      onClick={() => {
                        if (!draft.trim()) {
                          alert(th.lang === "vi" ? "Please write a message draft first!" : "Please write a draft first!");
                          return;
                        }
                        setShowToneDropdown(!showToneDropdown);
                      }}
                      title={t("co.ai.tone")}
                      className={cn(
                        "flex h-8 w-8 items-center justify-center rounded-md text-neutral-400 transition-colors hover:bg-neutral-100 hover:text-[#034751]",
                        FOCUS,
                        showToneDropdown && "bg-neutral-100 text-[#034751]"
                      )}
                    >
                      <Settings2 className="h-4 w-4" />
                    </button>
                    {showToneDropdown && (
                      <div className="absolute bottom-10 left-0 z-50 w-48 rounded-lg border border-neutral-200 bg-white p-1.5 shadow-card">
                        <div className="px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-neutral-400 border-b border-neutral-100 mb-1">
                          {t("co.ai.tone")}
                        </div>
                        {["professional", "empathetic", "concise"].map((tone) => (
                          <button
                            key={tone}
                            onClick={() => {
                              setShowToneDropdown(false);
                              handleRefineTone(tone);
                            }}
                            className="w-full rounded-md px-2 py-1.5 text-left text-[12px] font-medium text-neutral-700 hover:bg-neutral-50 hover:text-[#034751]"
                          >
                            {tone === "professional" ? t("co.ai.tone.professional") : tone === "empathetic" ? t("co.ai.tone.empathetic") : t("co.ai.tone.concise")}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  {cap.media && <ComposerIcon icon={Paperclip} label={t("co.attach")} />}
                  {cap.media && <ComposerIcon icon={ImageIcon} label={t("co.attachImage")} />}
                </div>
                <div className="flex items-center gap-2">
                  {(isTyping || refiningTone) && (
                    <span className="flex items-center gap-1 text-[11px] font-semibold text-[#034751] animate-pulse">
                      <Sparkles className="h-3.5 w-3.5 text-[#034751]" />
                      {refiningTone ? t("co.ai.tone.refining") : "AI Typing..."}
                    </span>
                  )}
                  {cap.charLimit && (
                    <span className={cn("tnum text-[11px] font-medium", overLimit ? "text-destructive" : "text-neutral-400")}>
                      {draft.length}/{cap.charLimit}
                    </span>
                  )}
                  <Button size="sm" className="gap-1.5" onClick={send} disabled={!draft.trim() || overLimit || isTyping || refiningTone}>
                    <Send className="h-3.5 w-3.5" />
                    {cap.requiresApproval && !withinWindow ? t("co.queue") : t("co.send")}
                  </Button>
                </div>
              </div>
            </div>
          </>
        )}
      </div>

      {quickAction && (
        <QuickCreateModal
          action={quickAction}
          th={th}
          lang={th.lang}
          t={t}
          onClose={() => setQuickAction(null)}
          onCreate={handleQuickCreate}
        />
      )}
    </div>
  );
}

function ComposerIcon({ icon: Icon, label, onClick }: { icon: LucideIcon; label: string; onClick?: () => void }) {
  return (
    <button onClick={onClick} title={label} aria-label={label} className={cn("flex h-8 w-8 items-center justify-center rounded-md text-neutral-400 transition-colors hover:bg-neutral-100 hover:text-[#034751]", FOCUS)}>
      <Icon className="h-4 w-4" />
    </button>
  );
}

// ════════════════════════════════════════════════════════════════════════════
// CONVERSATION → ACTION  ·  turn a chat into appointments, estimates, tasks…
// ════════════════════════════════════════════════════════════════════════════
type QuickActionId = "appointment" | "estimate" | "invoice" | "followup" | "task";

const QUICK_ACTIONS: { id: QuickActionId; icon: LucideIcon; key: string; accent: string; soft: string }[] = [
  { id: "appointment", icon: CalendarPlus, key: "co.qc.appointment", accent: "#034751", soft: "#E2F0EE" },
  { id: "estimate", icon: ReceiptText, key: "co.qc.estimate", accent: "#8A5300", soft: "#FEF3C7" },
  { id: "invoice", icon: FileText, key: "co.qc.invoice", accent: "#2563EB", soft: "#DBEAFE" },
  { id: "followup", icon: Stethoscope, key: "co.qc.followup", accent: "#5b3fd6", soft: "#EEEAFE" },
  { id: "task", icon: ListChecks, key: "co.qc.task", accent: "#0E7490", soft: "#CFFAFE" },
];

// Intent rules — matched against the latest inbound message (en + vi, regardless
// of thread language since clients mix). First match per action wins.
type Intent = { action: QuickActionId; key: string };
const INTENT_RULES: { action: QuickActionId; key: string; re: RegExp }[] = [
  {
    action: "appointment",
    key: "co.qc.intent.appointment",
    re: /(đặt lịch|lịch hẹn|qua khám|đưa bé|đưa .* qua|qua được|hẹn|tiêm|thứ\s?[2-7]|chủ nhật|chiều|sáng mai|ngày mai|\bbook\b|appointment|schedule|bring .* (in|over)|come in|\bvisit\b|saturday|sunday|monday|tomorrow|this (week|afternoon|morning))/i,
  },
  {
    action: "appointment",
    key: "co.qc.intent.recheck",
    re: /(liếm|vết mổ|sưng|nôn|ói|tiêu chảy|bỏ ăn|chảy máu|đau|\blicking\b|incision|wound|swelling|vomit|diarrhea|not eating|lethargic|bleeding)/i,
  },
  {
    action: "estimate",
    key: "co.qc.intent.estimate",
    re: /(báo giá|chi phí|\bgiá\b|bao nhiêu( tiền)?|tốn|\bphí\b|\bcost\b|price|how much|quote|estimate|\bfee\b|charge)/i,
  },
  {
    action: "followup",
    key: "co.qc.intent.followup",
    re: /(kết quả|giải thích|tái khám|theo dõi|xét nghiệm|results?|explain|recheck|follow.?up)/i,
  },
  {
    action: "invoice",
    key: "co.qc.intent.invoice",
    re: /(thanh toán|hóa đơn|hoá đơn|chuyển khoản|đặt cọc|\bcọc\b|\bpay\b|payment|invoice|\bbill\b|deposit|transfer)/i,
  },
];

function detectIntents(th: Thread): Intent[] {
  const inbound = [...th.messages].reverse().find((m) => m.direction === "inbound" && !m.systemNote);
  const text = `${inbound?.body ?? ""} ${th.subject}`;
  const found: Intent[] = [];
  const seen = new Set<QuickActionId>();
  for (const r of INTENT_RULES) {
    if (seen.has(r.action)) continue;
    if (r.re.test(text)) {
      found.push({ action: r.action, key: r.key });
      seen.add(r.action);
    }
    if (found.length >= 2) break;
  }
  return found;
}

// Curated billable items for the estimate / invoice quick builder.
const SUGGESTED_ITEMS = catalogItems.filter((it) => it.type === "service" || it.type === "vaccine").slice(0, 6);

const COMMON_TIMES = ["09:00", "09:30", "10:00", "10:30", "14:00", "15:00", "15:30", "16:30"];

// The contextual suggestion banner + the always-on quick-create chip row.
function QuickCreatePanel({
  intents,
  onDismissSuggest,
  onPick,
  t,
}: {
  intents: Intent[];
  onDismissSuggest: () => void;
  onPick: (a: QuickActionId) => void;
  t: TFn;
}) {
  return (
    <div className="shrink-0 border-t border-neutral-200 bg-white">
      {intents.length > 0 && (
        <div className="flex items-center gap-2 bg-[#034751]/[0.06] px-3 py-2">
          <Sparkles className="h-4 w-4 shrink-0 text-[#034751]" />
          <div className="min-w-0 flex-1">
            <span className="text-[10px] font-bold uppercase tracking-wide text-[#034751]">{t("co.qc.suggested")}</span>
            <span className="ml-2 text-[12px] text-neutral-600">{t(intents[0].key)}</span>
          </div>
          <div className="flex shrink-0 items-center gap-1.5">
            {intents.map((it) => {
              const meta = QUICK_ACTIONS.find((a) => a.id === it.action)!;
              const Icon = meta.icon;
              return (
                <button
                  key={`${it.action}-${it.key}`}
                  onClick={() => onPick(it.action)}
                  className={cn("inline-flex items-center gap-1.5 rounded-lg bg-[#034751] px-2.5 py-1.5 text-[12px] font-semibold text-white transition-colors hover:bg-[#023a42]", FOCUS)}
                >
                  <Icon className="h-3.5 w-3.5" />
                  {t(meta.key)}
                </button>
              );
            })}
            <button onClick={onDismissSuggest} title={t("co.qc.dismiss")} aria-label={t("co.qc.dismiss")} className={cn("flex h-7 w-7 items-center justify-center rounded-md text-neutral-400 hover:bg-neutral-100", FOCUS)}>
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      )}
      <div className="flex items-center gap-1.5 overflow-x-auto px-3 py-2">
        <span className="shrink-0 text-[10px] font-bold uppercase tracking-wide text-neutral-400">{t("co.qc.title")}</span>
        {QUICK_ACTIONS.map((a) => {
          const Icon = a.icon;
          return (
            <button
              key={a.id}
              onClick={() => onPick(a.id)}
              className={cn("inline-flex shrink-0 items-center gap-1.5 rounded-full border border-neutral-200 bg-white px-2.5 py-1 text-[12px] font-semibold text-neutral-600 transition-colors hover:border-[#034751]/40 hover:text-[#034751]", FOCUS)}
            >
              <Icon className="h-3.5 w-3.5" style={{ color: a.accent }} />
              {t(a.key)}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function QcField({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1 block text-[11px] font-semibold text-neutral-500">{label}</span>
      {children}
    </label>
  );
}

const QC_INPUT = "h-9 w-full rounded-lg border border-neutral-200 bg-white px-3 text-sm text-neutral-800 focus:border-[#034751] focus:outline-none focus:ring-2 focus:ring-[#034751]/15";

function QuickCreateModal({
  action,
  th,
  lang,
  t,
  onClose,
  onCreate,
}: {
  action: QuickActionId;
  th: Thread;
  lang: "en" | "vi";
  t: TFn;
  onClose: () => void;
  onCreate: (action: QuickActionId, summary: string, draftReply?: string) => void;
}) {
  const meta = QUICK_ACTIONS.find((a) => a.id === action)!;
  const Icon = meta.icon;
  const isVi = lang === "vi";

  const [date, setDate] = useState(isVi ? "Sat, 24/06" : "Sat, 24 Jun");
  const [time, setTime] = useState("10:00");
  const [vet, setVet] = useState(DOCTORS[0].name);
  const [reason, setReason] = useState(th.subject);
  const [taskTitle, setTaskTitle] = useState(th.subject);
  const [assignee, setAssignee] = useState(th.assignee?.name ?? STAFF_LIST[0].name);
  const [selected, setSelected] = useState<Record<string, boolean>>(() => {
    const init: Record<string, boolean> = {};
    SUGGESTED_ITEMS.slice(0, 2).forEach((it) => (init[it.id] = true));
    return init;
  });

  const total = SUGGESTED_ITEMS.filter((it) => selected[it.id]).reduce((s, it) => s + it.basePrice, 0);
  const isMoney = action === "estimate" || action === "invoice";
  const isSchedule = action === "appointment" || action === "followup";

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const firstName = isVi ? th.clientName.split(" ").slice(-1)[0] : th.clientName.split(" ")[0];
  const pet = th.petName ?? (isVi ? "your pet" : "your pet");

  function confirm() {
    let summary = "";
    let draft: string | undefined;
    if (action === "appointment") {
      summary = `📅 ${t("co.qc.note.appointment")} · ${date} ${time} · ${vet}`;
      draft = isVi
        ? `Hi ${firstName}, we've booked ${pet} for ${date} at ${time} with ${vet}. See you at GoPet! 🐾`
        : `Hi ${firstName}, we've booked ${pet} for ${date} at ${time} with ${vet}. See you at GoPet!`;
    } else if (action === "followup") {
      summary = `🩺 ${t("co.qc.note.followup")} · ${date} · ${vet}`;
      draft = isVi
        ? `We've scheduled a follow-up for ${pet} on ${date}; ${vet} will monitor their condition.`
        : `We've scheduled a follow-up for ${pet} on ${date} with ${vet}.`;
    } else if (action === "estimate") {
      summary = `🧾 ${t("co.qc.note.estimate")} · ${vndFull(total)}`;
      draft = isVi
        ? `Here is the estimated quote for ${pet}: ${vndFull(total)}. Please review it and reply so we can help you book an appointment.`
        : `Here is the estimate for ${pet}: ${vndFull(total)}. Let us know if you'd like to proceed and we'll book a slot.`;
    } else if (action === "invoice") {
      summary = `💳 ${t("co.qc.note.invoice")} · ${vndFull(total)}`;
    } else {
      summary = `✅ ${t("co.qc.note.task")} · ${taskTitle} · ${assignee}`;
    }
    onCreate(action, summary, draft);
  }

  const confirmKey =
    action === "appointment" ? "co.qc.book" : action === "estimate" ? "co.qc.send" : action === "invoice" ? "co.qc.issue" : action === "task" ? "co.qc.addTask" : "co.qc.create";

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <button aria-label={t("co.qc.cancel")} onClick={onClose} className="absolute inset-0 bg-foreground/40 backdrop-blur-sm" />
      <div role="dialog" aria-modal="true" className="relative z-10 w-full max-w-[460px] overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-lift animate-in fade-in-0 zoom-in-95">
        {/* Header */}
        <div className="flex items-start gap-3 border-b border-neutral-200 p-4">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl" style={{ backgroundColor: meta.soft, color: meta.accent }}>
            <Icon className="h-5 w-5" />
          </span>
          <div className="min-w-0 flex-1">
            <h2 className="font-display text-[18px] font-bold tracking-tight text-neutral-950">{t(meta.key)}</h2>
            <div className="mt-0.5 truncate text-[12px] text-neutral-500">
              {th.clientName}
              {th.petName && <span className="font-semibold text-[#034751]"> · {th.petName}</span>}
            </div>
          </div>
          <button onClick={onClose} aria-label={t("co.qc.cancel")} className="shrink-0 text-neutral-400 hover:text-neutral-700">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Body */}
        <div className="max-h-[60vh] space-y-3 overflow-y-auto p-4">
          {isSchedule && (
            <>
              <div className="grid grid-cols-2 gap-3">
                <QcField label={t("co.qc.f.date")}>
                  <input value={date} onChange={(e) => setDate(e.target.value)} className={QC_INPUT} />
                </QcField>
                <QcField label={t("co.qc.f.time")}>
                  <select value={time} onChange={(e) => setTime(e.target.value)} className={QC_INPUT}>
                    {COMMON_TIMES.map((tm) => (
                      <option key={tm} value={tm}>{tm}</option>
                    ))}
                  </select>
                </QcField>
              </div>
              <QcField label={t("co.qc.f.vet")}>
                <select value={vet} onChange={(e) => setVet(e.target.value)} className={QC_INPUT}>
                  {DOCTORS.map((d) => (
                    <option key={d.id} value={d.name}>{d.name} — {d.specialty}</option>
                  ))}
                </select>
              </QcField>
              <QcField label={t("co.qc.f.reason")}>
                <input value={reason} onChange={(e) => setReason(e.target.value)} className={QC_INPUT} />
              </QcField>
            </>
          )}

          {isMoney && (
            <>
              <div className="text-[11px] font-semibold text-neutral-500">{t("co.qc.f.items")}</div>
              <div className="space-y-1.5">
                {SUGGESTED_ITEMS.map((it) => {
                  const on = !!selected[it.id];
                  return (
                    <button
                      key={it.id}
                      onClick={() => setSelected((s) => ({ ...s, [it.id]: !s[it.id] }))}
                      className={cn(
                        "flex w-full items-center justify-between gap-3 rounded-lg border px-3 py-2 text-left transition-colors",
                        on ? "border-[#034751] bg-[#034751]/[0.05]" : "border-neutral-200 hover:border-[#034751]/40"
                      )}
                    >
                      <span className="flex min-w-0 items-center gap-2">
                        <span className={cn("flex h-4 w-4 shrink-0 items-center justify-center rounded border", on ? "border-[#034751] bg-[#034751] text-white" : "border-neutral-300")}>
                          {on && <Check className="h-3 w-3" />}
                        </span>
                        <span className="truncate text-[13px] font-medium text-neutral-800">{it.name[lang]}</span>
                      </span>
                      <span className="shrink-0 tnum text-[12px] font-semibold text-neutral-600">{vndFull(it.basePrice)}</span>
                    </button>
                  );
                })}
              </div>
              <div className="flex items-center justify-between border-t border-neutral-100 pt-2.5">
                <span className="text-[12px] font-semibold text-neutral-500">{t("co.qc.f.total")}</span>
                <span className="tnum text-[16px] font-bold text-[#034751]">{vndFull(total)}</span>
              </div>
            </>
          )}

          {action === "task" && (
            <>
              <QcField label={t("co.qc.f.title")}>
                <input value={taskTitle} onChange={(e) => setTaskTitle(e.target.value)} className={QC_INPUT} />
              </QcField>
              <QcField label={t("co.qc.f.assignee")}>
                <select value={assignee} onChange={(e) => setAssignee(e.target.value)} className={QC_INPUT}>
                  {STAFF_LIST.map((s) => (
                    <option key={s.id} value={s.name}>{s.name} — {s.role}</option>
                  ))}
                </select>
              </QcField>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-2 border-t border-neutral-200 bg-neutral-50 p-3">
          <Button variant="ghost" size="sm" onClick={onClose}>{t("co.qc.cancel")}</Button>
          <Button size="sm" className="gap-1.5" onClick={confirm} disabled={isMoney && total === 0}>
            <Icon className="h-3.5 w-3.5" />
            {t(confirmKey)}
          </Button>
        </div>
      </div>
    </div>
  );
}


// ── AI MOCK DATA & HELPERS ───────────────────────────────────────────────────

const MOCK_TRANSLATIONS: Record<string, string> = {
  "m1-CONV-4821": "Hi Linh, Mochi’s spay procedure went well. Please send a photo of the incision tomorrow morning so Dr. Lucas can check on the healing. 🐾",
  "m2-CONV-4821": "Good morning! Here is today’s photo.",
  "m3-CONV-4821": "She’s licking the incision a little — is that normal?",
  "m1-CONV-4820": "Hi Quang, Bun is due for his DHPP booster vaccination. Please arrange to bring him in to the clinic!",
  "m2-CONV-4820": "Can I bring him in this Saturday afternoon?",
  "m1-CONV-4818": "Hi, I got the SMS letting me know Nori’s blood test results are ready. Could the vet help explain the values to me?",
  "m2-CONV-4818": "Hi Emma, Dr. Sarah will review Nori’s panel and send you an easy-to-read summary today. I’ve attached the lab report PDF.",
  "m1-CONV-4815": "GoPet: Deposit of 1.500.000đ received. Atlas is confirmed for 24 Jun. Reply STOP to opt out.",
  "m1-CONV-4809": "Discharge instructions for Mochi are attached. Please follow the home-care steps and book a recheck in 7 days.",
};

function getMockTranslation(msgId: string, threadId: string, text: string, lang: string): string {
  const key = `${msgId}-${threadId}`;
  if (MOCK_TRANSLATIONS[key]) return MOCK_TRANSLATIONS[key];
  if (MOCK_TRANSLATIONS[msgId]) return MOCK_TRANSLATIONS[msgId];
  
  if (lang === "en") {
    return `[AI Translate]: ${text} (Translated automatically to Vietnamese)`;
  } else {
    return `[AI Translate]: ${text} (Translated automatically to English)`;
  }
}

const MOCK_SMART_REPLIES: Record<string, { label: { en: string; vi: string }; text: { en: string; vi: string } }[]> = {
  "CONV-4821": [
    {
      label: { en: "❤️ Incision licking advice", vi: "❤️ Incision & cone advice" },
      text: {
        en: "Hi Linh, Mochi licking the incision slightly is common but can introduce bacteria and slow down healing. Please ensure she wears her E-collar (cone) at all times. I have notified Dr. Lucas Tran to review the photo. Is she otherwise eating and active?",
        vi: "Hi Linh, it’s fairly common for Mochi to lick the incision, but it can cause infection and slow down healing. Please keep her E-collar (anti-lick cone) on 24/7. I’ve asked Dr. Lucas to review the incision photo for you. Is she still eating and moving around normally?"
      }
    },
    {
      label: { en: "📅 Propose clinic visit", vi: "📅 Book an incision check" },
      text: {
        en: "Hi Linh, to be safe, we would like Dr. Lucas to check Mochi's spay incision in person. Could you bring her by GoPet D7 this afternoon or tomorrow morning for a quick 10-minute checkup? We can book a quick slot for you.",
        vi: "Hi Linh, to be on the safe side, we’d like you to bring Mochi by GoPet D7 so Dr. Lucas can check the incision in person. Could you come by for about 10 minutes this afternoon or tomorrow morning? I can hold a slot for you."
      }
    },
    {
      label: { en: "💊 Pain meds checkup", vi: "💊 Check on pain relief" },
      text: {
        en: "Hi Linh, Dr. Lucas wants to make sure Mochi is comfortable. Is she currently taking her prescribed pain relief medication? Sometimes licking indicates mild discomfort or itching as the skin heals. Let us know if she seems restless.",
        vi: "Hi Linh, Dr. Lucas wants to check that Mochi is comfortable. Is she taking all her prescribed pain relief medication? Sometimes licking the incision is just mild itching as the skin heals. Please let me know if she seems restless."
      }
    }
  ],
  "CONV-4820": [
    {
      label: { en: "📅 Propose Saturday slots", vi: "📅 Suggest Saturday slots" },
      text: {
        en: "Hi Quang, this Saturday afternoon GoPet has open slots at 14:00, 15:30 and 16:30 that would suit Bun’s vaccination. Which time would you like, so I can lock in the slot for him?",
        vi: "Hi Quang, this Saturday afternoon GoPet has open slots at 14:00, 15:30 and 16:30 that would suit Bun’s vaccination. Which time would you like, so I can lock in the slot for him?"
      }
    },
    {
      label: { en: "📌 Prep instructions", vi: "📌 Pre-vaccination prep" },
      text: {
        en: "Hi Quang, Saturday afternoon works for Bun’s vaccination. A few reminders: please don’t bathe Bun before the appointment, make sure he’s feeling healthy and well, and bring his old vaccination booklet. I’ll hold the Saturday afternoon slot for you!",
        vi: "Hi Quang, Saturday afternoon works for Bun’s vaccination. A few reminders: please don’t bathe Bun before the appointment, make sure he’s feeling healthy and well, and bring his old vaccination booklet. I’ll hold the Saturday afternoon slot for you!"
      }
    },
    {
      label: { en: "💡 Explain vaccine importance", vi: "💡 Explain DHPP (5-in-1) vaccine" },
      text: {
        en: "Hi Quang, the DHPP (5-in-1) booster is very important for keeping up Bun’s antibodies and protecting him against dangerous diseases like distemper and parvo. Please come in for his shot this Saturday at 15:00 — we’ll have the vaccine ready for him.",
        vi: "Hi Quang, the DHPP (5-in-1) booster is very important for keeping up Bun’s antibodies and protecting him against dangerous diseases like distemper and parvo. Please come in for his shot this Saturday at 15:00 — we’ll have the vaccine ready for him."
      }
    }
  ],
  "CONV-4818": [
    {
      label: { en: "🧪 CBC results summary", vi: "🧪 CBC results summary" },
      text: {
        en: "Hi Emma, Dr. Sarah reviewed Nori's blood results. Her CBC panel is stable, showing no signs of anemia or infection. Her kidney values look great, but liver enzymes are slightly elevated. Dr. Sarah recommends a dietary check. Would you like to schedule a call?",
        vi: "Hi Emma, Dr. Sarah has reviewed Nori’s blood results. Her CBC panel is stable, with no signs of anemia or infection. Her kidney values look great, but her liver enzymes are slightly elevated. Dr. Sarah recommends reviewing her diet. Would you like to schedule a call to discuss?"
      }
    },
    {
      label: { en: "📞 Offer vet callback", vi: "📞 Offer a vet callback" },
      text: {
        en: "Hi Emma, Dr. Sarah would be happy to explain Nori's lab panel in detail over a phone call. She is free today at 16:30 or tomorrow morning at 09:30. Would either of these times work for you to receive a call?",
        vi: "Hi Emma, Dr. Sarah would be happy to explain Nori’s lab panel in detail over the phone. She’s free today at 16:30 or tomorrow morning at 09:30. Which time would be convenient for you to take a call?"
      }
    },
    {
      label: { en: "💊 Diet change instructions", vi: "💊 Diet change & follow-up" },
      text: {
        en: "Hi Emma, regarding Nori's bloodwork, Dr. Sarah recommends transitioning her to a hepatic or low-fat diet for 3 weeks and then doing a quick recheck of her liver values. I can send you food options or schedule the follow-up visit. Let me know!",
        vi: "Hi Emma, regarding Nori’s test results, Dr. Sarah recommends switching her to a liver-support or low-fat diet for 3 weeks, then re-testing her liver enzymes. I can send you a list of recommended foods or book her follow-up visit. Just let me know!"
      }
    }
  ]
};

const GENERIC_SMART_REPLIES = [
  {
    label: { en: "👋 Friendly Greeting", vi: "👋 Friendly greeting" },
    text: { en: "Hi, thank you for reaching out to GoPet. How can we help you and your pet today?", vi: "Hi, thank you for reaching out to GoPet. How can we help you and your pet today?" }
  },
  {
    label: { en: "📅 Ask for scheduling", vi: "📅 Ask for scheduling" },
    text: { en: "Hi! We'd love to schedule a visit for your pet. What day and time work best for you?", vi: "Hi! We’d love to schedule a visit for your pet. What day and time work best for you?" }
  },
  {
    label: { en: "📍 Send locations & hours", vi: "📍 Send locations & hours" },
    text: { en: "GoPet clinics are open daily from 8:00 AM to 8:00 PM. Our D7 branch is at 141 Nguyen Thi Thap. Let us know if you need directions!", vi: "GoPet clinics are open daily from 8:00 AM to 8:00 PM. Our D7 branch is at 141 Nguyen Thi Thap. Let us know if you need directions!" }
  }
];

function refineToneText(text: string, tone: string, lang: string): string {
  const isVi = lang === "vi" || text.match(/[àáạảãâầấậẩẫăằắặẳẵèéẹẻẽêềếệểễìíịỉĩòóọỏõôồốộổỗơờớợởỡùúụủũưừứựửữỳýỵỷỹđ]/i);
  
  if (tone === "professional") {
    return isVi
      ? `Dear Client, GoPet Veterinary Clinic would like to confirm the following: ${text}. We would be glad to assist you further. Best regards!`
      : `Dear Client, GoPet Veterinary Clinic would like to confirm: ${text}. Please let us know if you require any further assistance. Best regards.`;
  } else if (tone === "empathetic") {
    return isVi
      ? `Hello, we completely understand how you're feeling right now. Regarding ${text}, please rest assured — the GoPet veterinary team is right here with you and your pet. Wishing them a speedy recovery! ❤️`
      : `Hello, we completely understand your concern. Regarding ${text}, please rest assured that the GoPet clinical team is here for you and your pet every step of the way. Wishing them a speedy recovery! ❤️`;
  } else {
    return isVi
      ? `GoPet confirmation: ${text}. Please reply soon if you need to make any changes. Thank you.`
      : `GoPet Update: ${text}. Please reply if you need to make changes. Thanks.`;
  }
}

function mockGenerateCampaignCopy(prompt: string, channel: ChannelId): string {
  const hasDiscount = prompt.toLowerCase().includes("discount") || prompt.toLowerCase().includes("%") || prompt.toLowerCase().includes("giảm");
  
  if (channel === "email") {
    return `Subject: Special Care for {pet_name} - Senior Wellness Campaign\n\nDear {first_name},\n\nAt GoPet, we believe that aging pets deserve extra care. As pets enter their senior years, regular screening is crucial to detect early health changes. ${hasDiscount ? "For a limited time, we are offering 10% off our Comprehensive Blood Panel for {pet_name}." : "We invite you to schedule a comprehensive senior panel for {pet_name}."}\n\nBook your senior checkup today at GoPet D7!\n\nBest regards,\nGoPet Team`;
  } else if (channel === "zalo" || channel === "whatsapp") {
    return `Hi {first_name}, GoPet is running a senior pet care program. ${hasDiscount ? "Get 10% off a complete blood panel for {pet_name} this month." : "Book a routine blood test for {pet_name} to catch any issues early."} Contact GoPet to book a vaccination or wellness checkup now! 🐾`;
  } else {
    return `GoPet: Book a wellness check for {pet_name} today! ${hasDiscount ? "Get 10% off blood panels this month." : "Screen early to keep your pet healthy."} Booking: 028 7300 1234. Reply STOP to opt out.`;
  }
}

function MessageBubble({ m, threadId, threadLang, t }: { m: Thread["messages"][number]; threadId: string; threadLang: string; t: TFn }) {
  const [showTranslated, setShowTranslated] = useState(false);
  const out = m.direction === "outbound";
  const c = CHANNELS[m.channel];
  return (
    <div className={cn("flex", out ? "justify-end" : "justify-start")}>
      <div className={cn("max-w-[78%]")}>
        <div
          className={cn(
            "rounded-2xl px-3.5 py-2.5 text-[13px] leading-relaxed shadow-soft",
            out ? "rounded-br-sm bg-[#034751] text-white" : "rounded-bl-sm border border-neutral-200 bg-white text-neutral-800"
          )}
          style={!out ? { borderLeft: `3px solid ${c.accent}` } : undefined}
        >
          {showTranslated ? (
            <div className="space-y-1 text-neutral-800">
              <div className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-[#034751]">
                <Sparkles className="h-3 w-3" />
                {t("co.ai.smartReply")}
              </div>
              <div className="whitespace-pre-wrap italic">{getMockTranslation(m.id, threadId, m.body, threadLang)}</div>
            </div>
          ) : (
            <div className="whitespace-pre-wrap">{m.body}</div>
          )}
          {m.attachments?.map((a) => (
            <div key={a.name} className={cn("mt-2 flex items-center gap-2 rounded-lg px-2 py-1.5 text-[11px] font-medium", out ? "bg-white/15" : "bg-neutral-50")}>
              {a.kind === "image" ? <ImageIcon className="h-3.5 w-3.5" /> : <FileText className="h-3.5 w-3.5" />}
              <span className="truncate">{a.name}</span>
            </div>
          ))}
        </div>
        <div className={cn("mt-1 flex items-center gap-1.5 px-1 text-[10px] text-neutral-400", out ? "justify-end" : "justify-start")}>
          <span className="font-medium">{m.author}</span>
          <span>·</span>
          <span>{m.at}</span>
          {!m.systemNote && (
            <>
              <span>·</span>
              <button
                onClick={() => setShowTranslated(!showTranslated)}
                className="inline-flex items-center gap-0.5 text-[10px] font-bold text-[#034751] hover:underline"
              >
                <Sparkles className="h-2.5 w-2.5" />
                {showTranslated ? t("co.ai.showOriginal") : t("co.ai.translate")}
              </button>
            </>
          )}
          {out && (
            <span className="inline-flex items-center gap-0.5">
              ·
              {m.status === "awaiting_approval" ? (
                <span className="font-semibold text-[#5b3fd6]">{t("co.msg.awaiting")}</span>
              ) : m.status === "read" ? (
                <span title={t("co.msg.read")}>
                  <CheckCheck className="h-3 w-3 text-info-strong" />
                  <span className="sr-only">{t("co.msg.read")}</span>
                </span>
              ) : m.status === "delivered" ? (
                <span title={t("co.msg.delivered")}>
                  <CheckCheck className="h-3 w-3" />
                  <span className="sr-only">{t("co.msg.delivered")}</span>
                </span>
              ) : (
                <span title={t("co.msg.sent")}>
                  <Check className="h-3 w-3" />
                  <span className="sr-only">{t("co.msg.sent")}</span>
                </span>
              )}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

function ContextRail({ th, mutate, lang, t }: { th: Thread; mutate: (id: string, fn: (th: Thread) => Thread) => void; lang: "en" | "vi"; t: TFn }) {
  const client = clients.find((c) => c.id === th.clientId);
  const patient = th.petId ? getPatientById(th.petId) : undefined;
  const [assignOpen, setAssignOpen] = useState(false);

  return (
    <div className="flex flex-col gap-3 p-3.5">
      {/* Client / pet */}
      <div className="rounded-lg border border-neutral-200 bg-white p-3 shadow-soft">
        <div className="text-[11px] font-bold uppercase tracking-wide text-neutral-400">{t("co.ctx.client")}</div>
        <div className="mt-1.5 flex items-center gap-2.5">
          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#034751] text-[12px] font-bold text-white">
            {th.clientName.split(" ").map((p) => p[0]).slice(0, 2).join("")}
          </span>
          <div className="min-w-0">
            <div className="truncate text-[13px] font-bold text-neutral-900">{th.clientName}</div>
            <div className="truncate text-[11px] text-neutral-500">{client?.phone ?? ""}</div>
          </div>
        </div>
        {client && (
          <dl className="mt-3 space-y-1.5 text-[12px]">
            <RailRow label={t("co.ctx.lang")} value={client.preferredLanguage === "vi" ? "Vietnamese" : "English"} />
            <RailRow label={t("co.ctx.membership")} value={t(`co.ctx.tier.${client.membershipTier === "none" ? "standard" : client.membershipTier}`)} />
            <RailRow label={t("co.ctx.outstanding")} value={client.outstandingBalance > 0 ? vndFull(client.outstandingBalance) : t("co.ctx.clear")} danger={client.outstandingBalance > 0} />
          </dl>
        )}
        {patient && (
          <div className="mt-3 flex items-center justify-between rounded-md bg-[#034751]/5 px-2.5 py-2">
            <div className="min-w-0">
              <div className="truncate text-[12px] font-bold text-[#034751]">{patient.name}</div>
              <div className="truncate text-[10px] text-neutral-500">{patient.breed} · {patient.ageLabel}</div>
            </div>
            <ChevronRight className="h-4 w-4 shrink-0 text-[#034751]" />
          </div>
        )}
      </div>

      {/* Case actions */}
      <div className="rounded-lg border border-neutral-200 bg-white p-3 shadow-soft">
        <div className="text-[11px] font-bold uppercase tracking-wide text-neutral-400">{t("co.ctx.caseActions")}</div>

        <div className="mt-2">
          <div className="text-[11px] font-medium text-neutral-500">{t("co.ctx.assignedTo")}</div>
          <button onClick={() => setAssignOpen((v) => !v)} className="mt-1 flex w-full items-center justify-between rounded-md border border-neutral-200 px-2.5 py-1.5 text-left hover:border-[#034751]/40">
            {th.assignee ? (
              <span className="flex items-center gap-2">
                <StaffAvatar staff={th.assignee} className="h-5 w-5 text-[9px]" />
                <span className="text-[12px] font-semibold text-neutral-800">{th.assignee.name}</span>
              </span>
            ) : (
              <span className="text-[12px] font-semibold text-amber-600">{t("co.unassigned")}</span>
            )}
            <UserPlus className="h-3.5 w-3.5 text-neutral-400" />
          </button>
          {assignOpen && (
            <div className="mt-1 space-y-0.5 rounded-md border border-neutral-200 bg-white p-1">
              {STAFF_LIST.map((s) => (
                <button
                  key={s.id}
                  onClick={() => {
                    mutate(th.id, (c) => ({ ...c, assignee: s, messages: [...c.messages, { id: `sys-as-${c.messages.length}`, channel: c.channel, direction: "outbound", status: "sent", at: t("co.now"), author: "system", body: "", systemNote: `${t("co.ctx.assignedTo")} ${s.name}` }] }));
                    setAssignOpen(false);
                  }}
                  className="flex w-full items-center gap-2 rounded px-2 py-1.5 text-left text-[12px] hover:bg-neutral-50"
                >
                  <StaffAvatar staff={s} className="h-5 w-5 text-[9px]" />
                  <span className="font-medium text-neutral-700">{s.name}</span>
                  <span className="ml-auto text-[10px] text-neutral-400">{s.role}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Watchers / tag clinical */}
        <div className="mt-3">
          <div className="text-[11px] font-medium text-neutral-500">{t("co.ctx.watchers")}</div>
          <div className="mt-1 flex flex-wrap items-center gap-1">
            {th.watchers.map((w) => (
              <span key={w.id} className="inline-flex items-center gap-1 rounded-full bg-neutral-100 py-0.5 pl-0.5 pr-2 text-[11px] font-medium text-neutral-700">
                <StaffAvatar staff={w} className="h-4 w-4 text-[8px]" />
                {w.name.split(" ")[0]}
              </span>
            ))}
            <button
              onClick={() => mutate(th.id, (c) => (c.watchers.some((w) => w.id === STAFF.lucas.id) ? c : { ...c, watchers: [...c.watchers, STAFF.lucas], messages: [...c.messages, { id: `sys-tag-${c.messages.length}`, channel: c.channel, direction: "outbound", status: "sent", at: t("co.now"), author: "system", body: "", systemNote: `${t("co.tagVet")} · ${STAFF.lucas.name}` }] }))}
              className="inline-flex items-center gap-1 rounded-full border border-dashed border-neutral-300 px-2 py-0.5 text-[11px] font-medium text-neutral-500 hover:border-[#034751] hover:text-[#034751]"
            >
              <Plus className="h-3 w-3" />
              {t("co.tagVet")}
            </button>
          </div>
        </div>

        {/* Tags */}
        <div className="mt-3 flex flex-wrap items-center gap-1">
          {th.tags.map((tag) => (
            <span key={tag} className="inline-flex items-center gap-1 rounded-md bg-neutral-100 px-1.5 py-0.5 text-[10px] font-semibold text-neutral-500">
              <Tag className="h-2.5 w-2.5" />
              {tag}
            </span>
          ))}
        </div>

        {/* Close / reopen */}
        <div className="mt-3 border-t border-neutral-100 pt-3">
          {th.status === "closed" ? (
            <Button variant="outline" size="sm" className="w-full" onClick={() => mutate(th.id, (c) => ({ ...c, status: "open" }))}>{t("co.reopen")}</Button>
          ) : (
            <Button
              variant="outline"
              size="sm"
              className="w-full gap-1.5 text-neutral-600"
              onClick={() => mutate(th.id, (c) => ({ ...c, status: "closed", lastPreview: t("co.closedBy"), messages: [...c.messages, { id: `sys-close-${c.messages.length}`, channel: c.channel, direction: "outbound", status: "sent", at: t("co.now"), author: "system", body: "", systemNote: t("co.closedBy") }] }))}
            >
              <Check className="h-3.5 w-3.5" />
              {t("co.closeCase")}
            </Button>
          )}
        </div>
      </div>

      {/* Integration note */}
      <div className="rounded-lg border border-neutral-200 bg-white p-3 shadow-soft">
        <div className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wide text-neutral-400">
          <Settings2 className="h-3.5 w-3.5" />
          {t("co.ctx.integration")}
        </div>
        <div className="mt-2 flex items-center gap-2">
          <ChannelDot id={th.channel} />
          <div className="min-w-0">
            <div className="truncate text-[12px] font-semibold text-neutral-800">{CHANNELS[th.channel].provider}</div>
            <div className="truncate text-[10px] text-neutral-500">{CHANNELS[th.channel].note}</div>
          </div>
        </div>
      </div>
      <p className="px-1 text-[10px] leading-relaxed text-neutral-400">{lang === "vi" ? "All communication is saved back to the patient record." : "All communication is saved back to the patient record."}</p>
    </div>
  );
}

function RailRow({ label, value, danger }: { label: string; value: string; danger?: boolean }) {
  return (
    <div className="flex items-center justify-between gap-2">
      <dt className="text-neutral-500">{label}</dt>
      <dd className={cn("font-semibold", danger ? "text-red-600" : "text-neutral-800")}>{value}</dd>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════════════
// APPROVAL QUEUE
// ════════════════════════════════════════════════════════════════════════════
function ApprovalsView({ t }: { t: TFn }) {
  const [items, setItems] = useState<ApprovalItem[]>(() => APPROVALS.map((a) => ({ ...a })));
  const pending = items.filter((i) => i.status === "pending");

  function set(id: string, status: ApprovalItem["status"]) {
    setItems((prev) => prev.map((i) => (i.id === id ? { ...i, status } : i)));
  }

  return (
    <div className="h-full overflow-y-auto">
      <div className="mx-auto max-w-[1100px] space-y-3 p-5">
        <div className="flex items-center gap-3 rounded-lg border border-info/30 bg-info-soft px-4 py-3">
          <ShieldCheck className="h-5 w-5 shrink-0 text-info-strong" />
          <p className="text-[13px] text-neutral-700">
            <span className="font-bold text-info-strong">{pending.length}</span> {t("co.ap.banner")}
          </p>
        </div>

        {pending.length === 0 ? (
          <EmptyState icon={CheckCheck} title={t("co.ap.empty")} />
        ) : (
          pending.map((item) => (
            <div key={item.id} className="rounded-lg border border-neutral-200 bg-white p-4 shadow-soft transition-shadow hover:shadow-card">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <ChannelChip id={item.channel} size="sm" />
                    <span className="inline-flex items-center gap-1 rounded-md bg-amber-50 px-1.5 py-0.5 text-[10px] font-bold text-amber-700">
                      <Sparkles className="h-3 w-3" />
                      {item.trigger}
                    </span>
                  </div>
                  <div className="mt-2 flex items-center gap-2 text-[13px]">
                    <span className="font-bold text-neutral-900">{item.recipient}</span>
                    {item.petName && <span className="font-semibold text-[#034751]">· {item.petName}</span>}
                  </div>
                  <p className="mt-1.5 rounded-lg border border-neutral-100 bg-neutral-50 px-3 py-2 text-[13px] leading-relaxed text-neutral-700">{item.preview}</p>
                  <div className="mt-2 flex items-center gap-3 text-[11px] text-neutral-500">
                    <span className="inline-flex items-center gap-1"><CalendarClock className="h-3.5 w-3.5" />{item.scheduledAt}</span>
                    <span className="inline-flex items-center gap-1"><FileText className="h-3.5 w-3.5" />{templateById(item.templateId)?.name}</span>
                  </div>
                </div>
                <div className="flex shrink-0 items-center gap-1.5">
                  <Button size="sm" variant="ghost" className="text-neutral-500" onClick={() => set(item.id, "skipped")}>{t("co.ap.skip")}</Button>
                  <Button size="sm" variant="outline" className="gap-1.5"><Wand2 className="h-3.5 w-3.5" />{t("co.ap.edit")}</Button>
                  <Button size="sm" className="gap-1.5" onClick={() => set(item.id, "approved")}><Check className="h-3.5 w-3.5" />{t("co.ap.approve")}</Button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════════════
// REMINDERS
// ════════════════════════════════════════════════════════════════════════════
function RemindersView({ t }: { t: TFn }) {
  const [rules, setRules] = useState<ReminderRule[]>(() => REMINDER_RULES.map((r) => ({ ...r })));

  function toggle(id: string) {
    setRules((prev) => prev.map((r) => (r.id === id ? { ...r, active: !r.active } : r)));
  }

  return (
    <div className="h-full overflow-y-auto">
      <div className="mx-auto grid max-w-[1400px] gap-4 p-5 lg:grid-cols-[1fr_360px]">
        {/* Rules */}
        <section>
          <div className="mb-2 flex items-center justify-between">
            <h3 className="font-display text-[15px] font-bold text-neutral-900">{t("co.rm.rules")}</h3>
            <Button size="sm" variant="outline" className="gap-1.5"><Plus className="h-3.5 w-3.5" />{t("co.rm.newRule")}</Button>
          </div>
          <div className="space-y-2">
            {rules.map((r) => (
              <div key={r.id} className={cn("rounded-lg border bg-white p-3.5 shadow-soft", r.active ? "border-neutral-200" : "border-neutral-200 opacity-70")}>
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#034751]/10 text-[#034751]"><BellRing className="h-4 w-4" /></span>
                      <div>
                        <div className="text-[13px] font-bold text-neutral-900">{r.name}</div>
                        <div className="text-[11px] text-neutral-500">{r.trigger} · {r.offset}</div>
                      </div>
                    </div>
                    <div className="mt-2.5 flex flex-wrap items-center gap-3 text-[11px] text-neutral-500">
                      <span className="inline-flex items-center gap-1.5">
                        <span className="font-medium text-neutral-600">{t("co.rm.via")}</span>
                        {r.channelPriority.map((id, i) => {
                          const Icon = CHANNEL_ICON[id];
                          return (
                            <span key={id} className="inline-flex items-center gap-1">
                              {i > 0 && <ArrowRight className="h-2.5 w-2.5 text-neutral-300" />}
                              <Icon className="h-3.5 w-3.5" style={{ color: CHANNELS[id].accent }} />
                            </span>
                          );
                        })}
                      </span>
                      <span className="inline-flex items-center gap-1"><Users className="h-3.5 w-3.5" />{r.audienceCount} {t("co.rm.audience")}</span>
                      <span className="inline-flex items-center gap-1"><Clock className="h-3.5 w-3.5" />{t("co.rm.lastRun")} {r.lastRun}</span>
                    </div>
                  </div>
                  <button
                    onClick={() => toggle(r.id)}
                    aria-label={r.active ? t("co.rm.pause") : t("co.rm.activate")}
                    role="switch"
                    aria-checked={r.active}
                    className={cn("relative h-6 w-11 shrink-0 rounded-full transition-colors", FOCUS, r.active ? "bg-[#034751]" : "bg-neutral-300")}
                  >
                    <span className={cn("absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-all", r.active ? "left-[22px]" : "left-0.5")} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Planned queue */}
        <section>
          <h3 className="mb-2 font-display text-[15px] font-bold text-neutral-900">{t("co.rm.planned")}</h3>
          <div className="overflow-hidden rounded-lg border border-neutral-200 bg-white shadow-soft">
            {REMINDER_QUEUE.map((r) => (
              <div key={r.id} className="flex items-center gap-2.5 border-b border-neutral-100 px-3 py-2.5 last:border-0">
                <ChannelDot id={r.channel} />
                <div className="min-w-0 flex-1">
                  <div className="truncate text-[12px] font-bold text-neutral-900">{r.petName} <span className="font-medium text-neutral-400">· {r.clientName}</span></div>
                  <div className="truncate text-[11px] text-neutral-500">{r.type}</div>
                </div>
                <div className="shrink-0 text-right">
                  <div className="text-[11px] font-semibold text-neutral-700">{r.scheduledAt}</div>
                  <div className="text-[10px] font-medium text-amber-600">{t("co.rm.scheduled")}</div>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════════════
// BULK SEND
// ════════════════════════════════════════════════════════════════════════════
function BulkView({ t }: { t: TFn }) {
  const [wizard, setWizard] = useState(false);
  return (
    <div className="h-full overflow-y-auto">
      <div className="mx-auto max-w-[1200px] space-y-4 p-5">
        {wizard ? (
          <BulkWizard t={t} onClose={() => setWizard(false)} />
        ) : (
          <>
            <div className="flex items-center justify-between">
              <h3 className="font-display text-[15px] font-bold text-neutral-900">{t("co.bk.campaigns")}</h3>
              <Button size="sm" className="gap-1.5" onClick={() => setWizard(true)}><Plus className="h-3.5 w-3.5" />{t("co.bk.new")}</Button>
            </div>
            <div className="overflow-hidden rounded-lg border border-neutral-200 bg-white shadow-soft">
              <table className="w-full border-collapse text-left text-sm">
                <thead>
                  <tr className="border-b border-neutral-200 bg-neutral-50 text-[11px] font-bold uppercase tracking-wide text-neutral-400">
                    <th className="px-4 py-3">{t("co.bk.col.campaign")}</th>
                    <th className="px-4 py-3">{t("co.bk.col.channel")}</th>
                    <th className="px-4 py-3">{t("co.bk.col.audience")}</th>
                    <th className="px-4 py-3 text-right">{t("co.bk.col.matched")}</th>
                    <th className="px-4 py-3">{t("co.bk.col.progress")}</th>
                    <th className="px-4 py-3">{t("co.bk.col.status")}</th>
                  </tr>
                </thead>
                <tbody>
                  {CAMPAIGNS.map((cmp) => {
                    const pct = cmp.matched ? Math.round((cmp.sent / cmp.matched) * 100) : 0;
                    return (
                      <tr key={cmp.id} className="border-b border-neutral-100 last:border-0 hover:bg-neutral-50">
                        <td className="px-4 py-3">
                          <div className="font-semibold text-neutral-900">{cmp.name}</div>
                          <div className="text-[11px] text-neutral-400">{cmp.scheduledAt} · {cmp.throttlePerHour}/{t("co.bk.perHour")}</div>
                        </td>
                        <td className="px-4 py-3"><ChannelChip id={cmp.channel} size="sm" /></td>
                        <td className="px-4 py-3 text-[12px] text-neutral-600">{cmp.audienceLabel}</td>
                        <td className="px-4 py-3 text-right font-semibold tnum text-neutral-800">{cmp.matched}</td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <div className="h-1.5 w-20 overflow-hidden rounded-full bg-neutral-200">
                              <div className="h-full rounded-full bg-[#034751]" style={{ width: `${pct}%` }} />
                            </div>
                            <span className="tnum text-[11px] text-neutral-500">{cmp.sent}/{cmp.matched}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3"><CampaignStatus status={cmp.status} t={t} /></td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function CampaignStatus({ status, t }: { status: string; t: TFn }) {
  const map: Record<string, string> = {
    draft: "bg-neutral-100 text-neutral-500",
    scheduled: "bg-info-soft text-info-strong",
    sending: "bg-warning-soft text-warning-foreground",
    sent: "bg-success-soft text-success-strong",
  };
  return <span className={cn("rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide", map[status])}>{t(`co.bk.st.${status}`)}</span>;
}

function BulkWizard({ t, onClose }: { t: TFn; onClose: () => void }) {
  const [step, setStep] = useState(0);
  const [channel, setChannel] = useState<ChannelId>("zalo");
  const [done, setDone] = useState(false);
  const [aiPrompt, setAiPrompt] = useState("");
  const [isGeneratingCampaign, setIsGeneratingCampaign] = useState(false);
  const [customCampaignText, setCustomCampaignText] = useState("");

  const steps = [t("co.bk.step.channel"), t("co.bk.step.audience"), t("co.bk.step.template"), t("co.bk.step.schedule")];
  const matched = 212;

  function handleGenerateCampaign() {
    if (!aiPrompt.trim()) return;
    setIsGeneratingCampaign(true);
    setTimeout(() => {
      const generated = mockGenerateCampaignCopy(aiPrompt, channel);
      setCustomCampaignText(generated);
      setIsGeneratingCampaign(false);
    }, 1000);
  }

  if (done) {
    return (
      <div className="rounded-lg border border-neutral-200 bg-white p-8 text-center shadow-soft">
        <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-success-soft text-success-strong"><CheckCheck className="h-7 w-7" /></span>
        <h3 className="mt-3 font-display text-lg font-bold text-neutral-900">{t("co.bk.queued.title")}</h3>
        <p className="mx-auto mt-1 max-w-md text-sm text-neutral-500">{matched} {t("co.bk.queued.sub")}</p>
        <Button className="mt-4" onClick={onClose}>{t("co.bk.backToList")}</Button>
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-neutral-200 bg-white shadow-soft">
      {/* Stepper */}
      <div className="flex items-center justify-between border-b border-neutral-100 p-4">
        <div className="flex items-center gap-2">
          {steps.map((s, i) => (
            <div key={s} className="flex items-center gap-2">
              <span className={cn("flex h-6 w-6 items-center justify-center rounded-full text-[11px] font-bold", i <= step ? "bg-[#034751] text-white" : "bg-neutral-200 text-neutral-500")}>{i + 1}</span>
              <span className={cn("text-[12px] font-semibold", i === step ? "text-neutral-900" : "text-neutral-400")}>{s}</span>
              {i < steps.length - 1 && <span className="mx-1 h-px w-6 bg-neutral-200" />}
            </div>
          ))}
        </div>
        <button onClick={onClose} aria-label={t("cs.cancel")} className="flex h-7 w-7 items-center justify-center rounded-md text-neutral-400 hover:bg-neutral-100"><X className="h-4 w-4" /></button>
      </div>

      <div className="p-5">
        {step === 0 && (
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            {CHANNEL_ORDER.map((id) => {
              const Icon = CHANNEL_ICON[id];
              const sel = channel === id;
              return (
                <button key={id} onClick={() => setChannel(id)} className={cn("flex flex-col items-start gap-2 rounded-lg border p-3 text-left transition-all", sel ? "border-[#034751] ring-2 ring-[#034751]/15" : "border-neutral-200 hover:border-[#034751]/40")}>
                  <span className="flex h-9 w-9 items-center justify-center rounded-lg text-white" style={{ backgroundColor: CHANNELS[id].accent }}><Icon className="h-5 w-5" /></span>
                  <div>
                    <div className="text-[13px] font-bold text-neutral-900">{CHANNELS[id].label}</div>
                    <div className="text-[10px] text-neutral-500">{CHANNELS[id].note}</div>
                  </div>
                </button>
              );
            })}
          </div>
        )}
        {step === 1 && (
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
              {["co.bk.f.species", "co.bk.f.age", "co.bk.f.lastVisit", "co.bk.f.vaccine", "co.bk.f.branch", "co.bk.f.condition"].map((k) => (
                <div key={k} className="rounded-lg border border-neutral-200 px-3 py-2 text-[12px] font-medium text-neutral-600">{t(k)}</div>
              ))}
            </div>
            <div className="flex items-center gap-2 rounded-lg bg-[#034751]/5 px-4 py-3 text-[13px]">
              <Users className="h-4 w-4 text-[#034751]" />
              <span className="font-bold text-[#034751]">{matched}</span>
              <span className="text-neutral-600">{t("co.bk.matched")}</span>
            </div>
          </div>
        )}
        {step === 2 && (
          <div className="space-y-3">
            {/* AI Copywriter input banner */}
            <div className="rounded-lg border border-[#034751]/20 bg-[#034751]/5 p-3.5 space-y-2">
              <div className="flex items-center gap-1.5 text-xs font-bold text-[#034751]">
                <Sparkles className="h-4 w-4 text-[#034751]" />
                {t("co.ai.copywriter")}
              </div>
              <p className="text-[11px] text-neutral-500">{t("co.ai.copywriter.prompt")}</p>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={aiPrompt}
                  onChange={(e) => setAiPrompt(e.target.value)}
                  placeholder="e.g. Senior pet checkup reminder with 10% off"
                  className="flex-1 rounded-md border border-neutral-200 bg-white px-3 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-[#034751]"
                  disabled={isGeneratingCampaign}
                />
                <Button
                  size="sm"
                  disabled={isGeneratingCampaign || !aiPrompt.trim()}
                  onClick={handleGenerateCampaign}
                  className="gap-1 bg-[#034751] hover:bg-[#0b5c56] text-white text-xs h-8"
                >
                  {isGeneratingCampaign ? t("co.ai.copywriter.writing") : t("co.ai.copywriter.btn")}
                </Button>
              </div>
            </div>

            <div className="rounded-lg border border-neutral-200 bg-neutral-50 p-3">
              <div className="mb-1 text-[11px] font-bold uppercase tracking-wide text-neutral-400">{t("co.bk.preview")}</div>
              <p className="text-[13px] leading-relaxed text-neutral-700 whitespace-pre-wrap">
                {customCampaignText 
                  ? fillTemplate(customCampaignText) 
                  : fillTemplate(TEMPLATES.find((tpl) => tpl.channels.includes(channel))?.body.en ?? TEMPLATES[0].body.en)
                }
              </p>
            </div>
            <div className="flex flex-wrap gap-1">
              {TEMPLATE_VARIABLES.map((v) => (
                <span key={v} className="rounded-md bg-[#034751]/10 px-1.5 py-0.5 font-mono text-[10px] font-semibold text-[#034751]">{v}</span>
              ))}
            </div>
          </div>
        )}
        {step === 3 && (
          <div className="space-y-3">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-[12px] font-semibold text-neutral-600">{t("co.bk.throttle")}:</span>
              {["20", "50", "all"].map((opt) => (
                <span key={opt} className={cn("rounded-full border px-3 py-1 text-[12px] font-semibold", opt === "50" ? "border-[#034751] bg-[#034751] text-white" : "border-neutral-200 text-neutral-600")}>
                  {opt === "all" ? t("co.bk.throttleAll") : `${opt}/${t("co.bk.perHour")}`}
                </span>
              ))}
            </div>
            {(channel === "zalo" || channel === "whatsapp") && (
              <div className="flex items-start gap-2 rounded-lg border border-amber-200 bg-warning-soft px-3 py-2.5 text-[12px] text-warning-foreground">
                <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
                <span>{t("co.bk.throttleWarn")}</span>
              </div>
            )}
          </div>
        )}
      </div>

      <div className="flex items-center justify-between border-t border-neutral-100 p-4">
        <Button variant="ghost" disabled={step === 0} onClick={() => setStep((s) => Math.max(0, s - 1))}>{t("sch.wz.back")}</Button>
        {step < steps.length - 1 ? (
          <Button className="gap-1.5" onClick={() => setStep((s) => s + 1)}>{t("sch.wz.next")}<ArrowRight className="h-3.5 w-3.5" /></Button>
        ) : (
          <Button className="gap-1.5" onClick={() => setDone(true)}><CheckCheck className="h-3.5 w-3.5" />{t("co.bk.toQueue")}</Button>
        )}
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════════════
// TEMPLATES
// ════════════════════════════════════════════════════════════════════════════
function TemplatesView({ t }: { t: TFn }) {
  const [active, setActive] = useState<MessageTemplate>(TEMPLATES[0]);
  const [previewLang, setPreviewLang] = useState<"en" | "vi">("en");

  return (
    <div className="h-full overflow-y-auto">
      <div className="mx-auto grid max-w-[1300px] gap-4 p-5 lg:grid-cols-[1fr_400px]">
        {/* List */}
        <section>
          <div className="mb-2 flex items-center justify-between">
            <h3 className="font-display text-[15px] font-bold text-neutral-900">{t("co.tp.library")}</h3>
            <Button size="sm" variant="outline" className="gap-1.5"><Plus className="h-3.5 w-3.5" />{t("co.tp.new")}</Button>
          </div>
          <div className="grid gap-2 sm:grid-cols-2">
            {TEMPLATES.map((tpl) => (
              <button
                key={tpl.id}
                onClick={() => setActive(tpl)}
                className={cn(
                  "rounded-lg border bg-white p-3 text-left shadow-soft transition-all hover:shadow-card",
                  FOCUS,
                  active.id === tpl.id ? "border-[#034751] ring-2 ring-[#034751]/15" : "border-neutral-200"
                )}
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="truncate text-[13px] font-bold text-neutral-900">{tpl.name}</span>
                  <span className="shrink-0 rounded-md bg-neutral-100 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide text-neutral-500">{t(`co.tp.cat.${tpl.category}`)}</span>
                </div>
                <p className="mt-1.5 line-clamp-2 text-[12px] leading-snug text-neutral-500">{tpl.body.en}</p>
                <div className="mt-2 flex items-center justify-between">
                  <div className="flex items-center gap-0.5">
                    {tpl.channels.map((id) => {
                      const Icon = CHANNEL_ICON[id];
                      return <Icon key={id} className="h-3.5 w-3.5" style={{ color: CHANNELS[id].accent }} />;
                    })}
                  </div>
                  <span className="text-[10px] text-neutral-400">{tpl.usage}× · {tpl.updatedAt}</span>
                </div>
              </button>
            ))}
          </div>
        </section>

        {/* Preview */}
        <section className="lg:sticky lg:top-0 lg:h-fit">
          <div className="mb-2 flex items-center justify-between">
            <h3 className="font-display text-[15px] font-bold text-neutral-900">{t("co.tp.preview")}</h3>
            <div className="inline-flex rounded-lg bg-neutral-100 p-0.5">
              {(["en", "vi"] as const).map((l) => (
                <button key={l} onClick={() => setPreviewLang(l)} aria-pressed={previewLang === l} className={cn("rounded-md px-2.5 py-1 text-[11px] font-bold uppercase", FOCUS, previewLang === l ? "bg-white text-[#034751] shadow-soft" : "text-neutral-600")}>{l}</button>
              ))}
            </div>
          </div>
          <div className="rounded-lg border border-neutral-200 bg-white p-4 shadow-soft">
            <div className="flex items-center justify-between">
              <span className="text-[14px] font-bold text-neutral-900">{active.name}</span>
              <div className="flex items-center gap-0.5">
                {active.channels.map((id) => <ChannelChip key={id} id={id} size="sm" />)}
              </div>
            </div>

            {/* Rendered bubble */}
            <div className="mt-3 rounded-xl rounded-bl-sm border border-neutral-200 bg-[#F7F9F8] p-3" style={{ borderLeft: `3px solid ${CHANNELS[active.channels[0]].accent}` }}>
              <p className="whitespace-pre-wrap text-[13px] leading-relaxed text-neutral-800">{fillTemplate(active.body[previewLang])}</p>
            </div>

            {/* Raw + variables */}
            <div className="mt-3">
              <div className="text-[11px] font-bold uppercase tracking-wide text-neutral-400">{t("co.tp.variables")}</div>
              <div className="mt-1.5 flex flex-wrap gap-1">
                {active.variables.map((v) => (
                  <span key={v} className="rounded-md bg-[#034751]/10 px-1.5 py-0.5 font-mono text-[10px] font-semibold text-[#034751]">{v}</span>
                ))}
              </div>
            </div>

            <div className="mt-4 flex items-center gap-2">
              <Button size="sm" className="flex-1 gap-1.5"><Send className="h-3.5 w-3.5" />{t("co.tp.use")}</Button>
              <Button size="sm" variant="outline" className="gap-1.5"><Wand2 className="h-3.5 w-3.5" />{t("co.tp.edit")}</Button>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}

// ── shared ────────────────────────────────────────────────────────────────────
function EmptyState({ icon: Icon, title }: { icon: LucideIcon; title: string }) {
  return (
    <div className="flex h-full flex-col items-center justify-center p-8 text-center">
      <span className="mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-neutral-100 text-neutral-400"><Icon className="h-6 w-6" /></span>
      <p className="max-w-xs text-sm font-medium text-neutral-500">{title}</p>
    </div>
  );
}

// Seed local copies so demo interactions don't mutate the module singletons.
function THREADS_SEED(): Thread[] {
  return THREADS.map((th) => ({ ...th, messages: th.messages.map((m) => ({ ...m })), watchers: [...th.watchers], tags: [...th.tags], channelsUsed: [...th.channelsUsed] }));
}
