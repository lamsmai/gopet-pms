import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, type NavigateFunction } from "react-router-dom";
import * as TabsPrimitive from "@radix-ui/react-tabs";
import {
  CalendarCheck,
  Inbox,
  BellRing,
  Sparkles,
  MoreHorizontal,
  ChevronRight,
  User,
  Stethoscope,
  MapPin,
  Check,
  X,
  CalendarClock,
  CalendarPlus,
  PhoneCall,
  ClipboardList,
  CircleDollarSign,
  FileText,
  MessageCircle,
  RotateCcw,
  Smartphone,
  Globe,
  Send,
  Rows2,
  Rows3,
} from "lucide-react";
import { cn, vndFull } from "@/lib/utils";
import { useLang, type TFunc } from "@/lib/i18n";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import {
  HEADER,
  NOW,
  NOW_MIN,
  NOW_TIME,
  toMinutes,
  todayArrivals,
  bookingRequests,
  unpaidReminders,
  reminderBuckets,
  ARRIVAL_STATUS_META,
  type ArrivalAppt,
  type ArrivalStatus,
  type BookingRequest,
  type BookingChannel,
  type ReminderItem,
  type ReminderChannel,
} from "@/lib/dashboard-data";
import { PetAvatar, StatusPill, Meta, MidDot, meridiem, relTime } from "@/components/shared/arrival-ui";
import { AppointmentDrawer } from "@/components/shared/appointment-drawer";

// PetAvatar, Meta, MidDot, StatusPill, meridiem, relTime now live in
// @/components/shared/arrival-ui (shared with the appointment drawer).

function EmptyState({ icon: Icon, text, accent }: { icon: typeof Inbox; text: string; accent: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 px-4 py-20 text-center">
      <span className="flex h-14 w-14 items-center justify-center rounded-full" style={{ background: `${accent}1A`, color: accent }}>
        <Icon className="h-7 w-7" />
      </span>
      <p className="text-[14px] text-neutral-500">{text}</p>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Quick actions — one icon button → grouped CTA menu.
// ─────────────────────────────────────────────────────────────────────────────
type QAKind =
  | "consult"
  | "form"
  | "collect"
  | "estimate"
  | "appointment"
  | "callback"
  | "comm"
  | "refund";

const QA_GROUPS: {
  label?: string;
  items: { key: string; icon: typeof User; kind: QAKind; danger?: boolean; money?: boolean }[];
}[] = [
  {
    label: "qa.grp.clinical",
    items: [
      { key: "qa.consult", icon: Stethoscope, kind: "consult" },
      { key: "qa.patientForm", icon: ClipboardList, kind: "form" },
    ],
  },
  {
    label: "qa.grp.money",
    items: [
      { key: "qa.collect", icon: CircleDollarSign, kind: "collect", money: true },
      { key: "qa.estimate", icon: FileText, kind: "estimate" },
    ],
  },
  {
    label: "qa.grp.schedule",
    items: [
      { key: "qa.appointment", icon: CalendarPlus, kind: "appointment" },
      { key: "qa.callback", icon: PhoneCall, kind: "callback" },
      { key: "qa.comm", icon: MessageCircle, kind: "comm" },
    ],
  },
  {
    items: [{ key: "qa.refund", icon: RotateCcw, kind: "refund", danger: true }],
  },
];

function QuickActions({ appt, onAction, t }: { appt: ArrivalAppt; onAction: (k: QAKind) => void; t: TFunc }) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          aria-label={t("ar.quickActions")}
          title={t("ar.quickActions")}
          className="flex h-8 w-8 items-center justify-center rounded-lg text-neutral-400 outline-none transition-colors hover:bg-[#034751]/10 hover:text-[#034751] focus-visible:ring-2 focus-visible:ring-[#034751]/40"
        >
          <MoreHorizontal className="h-4 w-4" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-60">
        {QA_GROUPS.map((g, gi) => (
          <div key={gi}>
            {gi > 0 && <DropdownMenuSeparator />}
            {g.label && <DropdownMenuLabel>{t(g.label)}</DropdownMenuLabel>}
            {g.items.map((it) => {
              const Icon = it.icon;
              const iconColor = it.danger ? "#B91C1C" : it.money ? "#C2410C" : "#737373";
              const showMoneyDot = it.money && appt.status === "Waiting To Pay";
              return (
                <DropdownMenuItem
                  key={it.key}
                  onSelect={() => onAction(it.kind)}
                  className={cn(it.danger && "text-[#B91C1C] focus:bg-[#B91C1C]/5")}
                >
                  <span
                    className={cn(
                      "flex h-7 w-7 items-center justify-center rounded-md",
                      it.danger ? "bg-[#B91C1C]/10" : it.money ? "bg-[#FFF1E6]" : "bg-neutral-100"
                    )}
                  >
                    <Icon className="h-3.5 w-3.5" style={{ color: iconColor }} />
                  </span>
                  <span className="flex-1">{t(it.key)}</span>
                  {showMoneyDot && (
                    <>
                      <span className="h-1.5 w-1.5 rounded-full bg-[#D97706]" />
                      <span className="sr-only">{t("ar.paymentDue")}</span>
                    </>
                  )}
                </DropdownMenuItem>
              );
            })}
          </div>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Tab 1 · Today's Arrival
// ─────────────────────────────────────────────────────────────────────────────
type ContextKind = "checkin" | "view" | "collect";

function ArrivalCard({
  appt,
  dense,
  index,
  onOpen,
  onStatus,
  onAction,
  onContext,
  t,
  lang,
}: {
  appt: ArrivalAppt;
  dense: boolean;
  index: number;
  onOpen: (a: ArrivalAppt) => void;
  onStatus: (a: ArrivalAppt, s: ArrivalStatus) => void;
  onAction: (a: ArrivalAppt, k: QAKind) => void;
  onContext: (a: ArrivalAppt, k: ContextKind) => void;
  t: TFunc;
  lang: string;
}) {
  const meta = ARRIVAL_STATUS_META[appt.status];
  const isNotArrived = appt.status === "Not Arrived";
  const secondary = isNotArrived ? relTime(appt.time, lang) : { text: meridiem(appt.time), late: false };

  let ctx: { key: string; kind: ContextKind } | null = null;
  if (appt.status === "Not Arrived") ctx = { key: "ar.ctx.checkin", kind: "checkin" };
  else if (appt.status === "In Progress") ctx = { key: "ar.ctx.view", kind: "view" };
  else if (appt.status === "Waiting To Pay") ctx = { key: "ar.ctx.collect", kind: "collect" };

  return (
    <div
      role="listitem"
      onClick={() => onOpen(appt)}
      className={cn(
        "group grid animate-fade-up grid-cols-[76px_1fr] items-start gap-x-5 rounded-2xl border border-neutral-200 bg-white shadow-soft transition-all hover:border-[#034751]/25 hover:shadow-card sm:grid-cols-[96px_1fr_auto]",
        "cursor-pointer",
        dense ? "p-3.5" : "p-5",
        meta.recede && "opacity-60 hover:opacity-100"
      )}
      style={{ animationDelay: `${Math.min(index * 45, 450)}ms` }}
    >
      {/* time rail — the serif vertical ruler */}
      <div className="flex flex-col items-end border-r border-neutral-100 pr-4 pt-0.5 sm:pr-5">
        <div
          className={cn(
            "font-display font-bold leading-none tracking-tight tnum text-neutral-900",
            dense ? "text-[24px]" : "text-[30px]"
          )}
        >
          {appt.time}
        </div>
        <div
          className={cn(
            "mt-1 text-[11px] font-medium uppercase tracking-wide",
            secondary.late ? "font-semibold text-[#C2410C]" : "text-neutral-500"
          )}
        >
          {secondary.text}
        </div>
      </div>

      {/* identity */}
      <div className="min-w-0">
        <div className="flex items-center gap-2.5">
          <PetAvatar species={appt.species} size={dense ? 36 : 44} />
          <h3
            className={cn(
              "truncate font-display font-bold text-neutral-900",
              dense ? "text-[16px]" : "text-[18px]",
              meta.strike && "text-neutral-400 line-through"
            )}
          >
            {appt.name}
          </h3>
          <span className="hidden truncate text-[13px] text-neutral-500 sm:inline">{appt.breed}</span>
        </div>
        <div className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1 text-[13px]">
          <Meta icon={User} accent title={t("ar.f.owner")}>
            {appt.owner}
          </Meta>
          <MidDot />
          <Meta icon={Stethoscope} title={t("ar.f.vet")}>
            {appt.vet}
          </Meta>
          <MidDot />
          <Meta icon={MapPin} title={t("ar.f.room")}>
            {appt.room}
          </Meta>
        </div>
        <p className="mt-2 truncate text-[13px] leading-snug text-neutral-600" title={appt.reason}>
          {appt.reason}
        </p>
      </div>

      {/* controls — clicks here must not open the drawer */}
      <div
        onClick={(e) => e.stopPropagation()}
        className="col-span-2 mt-3 flex items-center justify-between gap-2 sm:col-span-1 sm:mt-0 sm:flex-col sm:items-end sm:justify-start sm:gap-2.5"
      >
        <div className="flex flex-col items-start gap-1 sm:items-end">
          <StatusPill status={appt.status} onChange={(s) => onStatus(appt, s)} t={t} />
          {appt.status === "Waiting To Pay" && appt.amountDue != null && (
            <span className="text-[11px] font-semibold tnum text-[#C2410C]">{vndFull(appt.amountDue)}</span>
          )}
        </div>
        <div className="flex items-center gap-1.5">
          {ctx && (
            <button
              onClick={() => onContext(appt, ctx!.kind)}
              className="rounded-full border border-neutral-200 px-2.5 py-1 text-[12px] font-semibold text-neutral-600 outline-none transition-all hover:border-[#034751] hover:text-[#034751] focus-visible:opacity-100 focus-visible:ring-2 focus-visible:ring-[#034751]/40 sm:opacity-0 sm:group-hover:opacity-100 sm:group-focus-within:opacity-100 [@media(pointer:coarse)]:!opacity-100"
            >
              {t(ctx.key)}
            </button>
          )}
          <QuickActions appt={appt} onAction={(k) => onAction(appt, k)} t={t} />
        </div>
      </div>
    </div>
  );
}

function NowDivider({ t }: { t: TFunc }) {
  return (
    <div className="flex items-center gap-3 px-1 py-1.5" aria-hidden>
      <span className="h-2 w-2 rounded-full bg-[#034751]" />
      <span className="text-[11px] font-bold uppercase tracking-wider tnum text-[#034751]">
        {t("ar.now")} {NOW_TIME}
      </span>
      <span className="h-px flex-1 rounded-full bg-gradient-to-r from-[#034751]/30 to-transparent" />
    </div>
  );
}

function TodaysArrivalTab({
  arrivals,
  dense,
  onOpen,
  onStatus,
  onAction,
  onContext,
  t,
  lang,
}: {
  arrivals: ArrivalAppt[];
  dense: boolean;
  onOpen: (a: ArrivalAppt) => void;
  onStatus: (a: ArrivalAppt, s: ArrivalStatus) => void;
  onAction: (a: ArrivalAppt, k: QAKind) => void;
  onContext: (a: ArrivalAppt, k: ContextKind) => void;
  t: TFunc;
  lang: string;
}) {
  const sorted = useMemo(() => [...arrivals].sort((a, b) => toMinutes(a.time) - toMinutes(b.time)), [arrivals]);

  if (sorted.length === 0) return <EmptyState icon={CalendarCheck} text={t("ar.empty.arrival")} accent="#034751" />;

  const rows: React.ReactNode[] = [];
  let dividerShown = false;
  sorted.forEach((a, i) => {
    if (!dividerShown && toMinutes(a.time) > NOW_MIN) {
      rows.push(<NowDivider key="now-divider" t={t} />);
      dividerShown = true;
    }
    rows.push(
      <ArrivalCard
        key={a.id}
        appt={a}
        dense={dense}
        index={i}
        onOpen={onOpen}
        onStatus={onStatus}
        onAction={onAction}
        onContext={onContext}
        t={t}
        lang={lang}
      />
    );
  });

  return (
    <div role="list" className="space-y-4">
      {rows}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Tab 2 · Booking Requests
// ─────────────────────────────────────────────────────────────────────────────
const CHANNEL_META: Record<BookingChannel, { key: string; icon: typeof User; cls: string }> = {
  app: { key: "bk.channel.app", icon: Smartphone, cls: "bg-[#034751]/10 text-[#034751]" },
  web: { key: "bk.channel.web", icon: Globe, cls: "bg-info-soft text-info-strong" },
  phone: { key: "bk.channel.phone", icon: PhoneCall, cls: "bg-neutral-100 text-neutral-600" },
};

function BookingCard({
  req,
  removing,
  onConfirm,
  onReschedule,
  onDecline,
  t,
}: {
  req: BookingRequest;
  removing: boolean;
  onConfirm: (r: BookingRequest) => void;
  onReschedule: (r: BookingRequest) => void;
  onDecline: (r: BookingRequest) => void;
  t: TFunc;
}) {
  const ch = CHANNEL_META[req.channel];
  const ChIcon = ch.icon;
  const overdue = req.minsAgo > 30;
  const dateLabel = req.dateIsLiteral ? req.requestedDate : t(`bk.date.${req.requestedDate}`);

  return (
    <div className={cn("overflow-hidden transition-all duration-300", removing ? "max-h-0 -translate-x-3 scale-[0.98] opacity-0" : "max-h-[420px] opacity-100")}>
      <div className="group grid animate-fade-up grid-cols-[76px_1fr] items-start gap-x-5 rounded-2xl border border-neutral-200 bg-white p-5 shadow-soft transition-all hover:border-[#034751]/25 hover:shadow-card sm:grid-cols-[96px_1fr_auto]">
        {/* requested-time rail */}
        <div className="flex flex-col items-end border-r border-neutral-100 pr-4 pt-0.5 sm:pr-5">
          <div className="font-display text-[30px] font-bold leading-none tracking-tight tnum text-neutral-900">{req.requestedTime}</div>
          <div className="mt-1 text-[11px] font-medium uppercase tracking-wide text-neutral-500">{dateLabel}</div>
        </div>

        {/* identity + provenance */}
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span className={cn("inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium", ch.cls)}>
              <ChIcon className="h-3 w-3" />
              {t(ch.key)}
            </span>
            <span className={cn("text-[12px] tnum", overdue ? "font-semibold text-[#C2410C]" : "text-neutral-400")}>
              {t("bk.ago", { n: req.minsAgo })}
            </span>
          </div>
          <div className="mt-2 flex items-center gap-2.5">
            <PetAvatar species={req.species} size={36} />
            <h3 className="truncate font-display text-[17px] font-bold text-neutral-900">{req.name}</h3>
            <span className="hidden truncate text-[13px] text-neutral-400 sm:inline">{req.breed}</span>
            {req.isNewClient && (
              <span className="rounded-full bg-[#785AA6]/10 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-[#785AA6]">
                {t("bk.newClient")}
              </span>
            )}
          </div>
          <div className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1 text-[13px]">
            <Meta icon={User} accent>
              {req.owner}
            </Meta>
            <MidDot />
            <Meta icon={Stethoscope}>{req.requestedVet ?? t("bk.noPref")}</Meta>
          </div>
          <p className="mt-2 truncate text-[13px] leading-snug text-neutral-600" title={req.reason}>
            {req.reason}
          </p>
        </div>

        {/* decision actions */}
        <div className="col-span-2 mt-3 flex items-center gap-2 sm:col-span-1 sm:mt-0 sm:flex-col sm:items-stretch sm:gap-2">
          <button
            onClick={() => onConfirm(req)}
            className="inline-flex h-8 items-center justify-center gap-1.5 rounded-lg px-3 text-[12px] font-bold text-white shadow-sm transition-all hover:brightness-110"
            style={{ background: "#034751" }}
          >
            <Check className="h-3.5 w-3.5" />
            {t("bk.confirm")}
          </button>
          <button
            onClick={() => onReschedule(req)}
            className="inline-flex h-8 items-center justify-center gap-1.5 rounded-lg border border-neutral-300 bg-white px-3 text-[12px] font-semibold text-neutral-600 transition-colors hover:border-[#034751] hover:text-[#034751]"
          >
            <CalendarClock className="h-3.5 w-3.5" />
            {t("bk.reschedule")}
          </button>
          <button
            onClick={() => onDecline(req)}
            className="inline-flex h-8 items-center justify-center gap-1 rounded-lg px-2 text-[12px] font-medium text-neutral-400 transition-colors hover:text-[#B91C1C]"
          >
            <X className="h-3.5 w-3.5" />
            {t("bk.decline")}
          </button>
        </div>
      </div>
      <div className="h-4" />
    </div>
  );
}

function BookingRequestsTab({
  requests,
  setRequests,
  notify,
  navigate,
  t,
}: {
  requests: BookingRequest[];
  setRequests: React.Dispatch<React.SetStateAction<BookingRequest[]>>;
  notify: (msg: string, undo?: () => void) => void;
  navigate: NavigateFunction;
  t: TFunc;
}) {
  const [removing, setRemoving] = useState<number[]>([]);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);
  useEffect(() => () => timers.current.forEach(clearTimeout), []);

  const remove = (id: number) => {
    setRemoving((r) => [...r, id]);
    timers.current.push(
      setTimeout(() => {
        setRequests((list) => list.filter((x) => x.id !== id));
        setRemoving((r) => r.filter((x) => x !== id));
      }, 320)
    );
  };

  if (requests.length === 0) return <EmptyState icon={Inbox} text={t("ar.empty.booking")} accent="#4ABA7A" />;

  return (
    <div>
      {requests.map((req) => (
        <BookingCard
          key={req.id}
          req={req}
          removing={removing.includes(req.id)}
          onConfirm={(r) => {
            notify(t("bk.toast.confirmed", { name: r.name }));
            remove(r.id);
          }}
          onReschedule={(r) => {
            notify(t("bk.toast.reschedule", { name: r.name }));
            navigate("/schedule");
          }}
          onDecline={() => {
            notify(t("bk.toast.declined"));
            remove(req.id);
          }}
          t={t}
        />
      ))}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Tab 3 · Reminders (concept preview — only the unpaid bucket is interactive)
// ─────────────────────────────────────────────────────────────────────────────
const SEND_KEY: Record<ReminderChannel, string> = {
  sms: "rm.send.sms",
  zalo: "rm.send.zalo",
  email: "rm.send.email",
  call: "rm.send.call",
};
const SNOOZE_OPTS: { key: string; whenKey: string }[] = [
  { key: "rm.snooze.1d", whenKey: "rm.snooze.1d" },
  { key: "rm.snooze.3d", whenKey: "rm.snooze.3d" },
  { key: "rm.snooze.week", whenKey: "rm.snooze.week" },
];

function ReminderRow({
  it,
  removing,
  onSend,
  onSnooze,
  t,
}: {
  it: ReminderItem;
  removing: boolean;
  onSend: () => void;
  onSnooze: (whenKey: string) => void;
  t: TFunc;
}) {
  return (
    <div className={cn("overflow-hidden transition-all duration-300", removing ? "max-h-0 -translate-x-3 opacity-0" : "max-h-40 opacity-100")}>
      <div className="flex flex-wrap items-center gap-4 rounded-2xl border border-neutral-200 bg-white p-4 shadow-soft">
        <span className="flex h-10 w-10 items-center justify-center rounded-full bg-[#FFF1E6] text-[#C2410C]">
          <CircleDollarSign className="h-5 w-5" />
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className="truncate font-semibold text-neutral-900">{it.owner}</span>
            {it.itemsCount != null && (
              <span className="rounded-full bg-neutral-100 px-1.5 py-0.5 text-[10px] font-bold text-neutral-500">
                {t("rm.items", { n: it.itemsCount })}
              </span>
            )}
          </div>
          <div className="mt-0.5 truncate text-[13px] text-neutral-500">
            {it.patient ? `${it.patient} · ` : ""}
            {it.why}
          </div>
        </div>
        <div className="font-bold tnum text-[#C2410C]">{vndFull(it.amount)}</div>
        <div className="flex shrink-0 items-center gap-1.5">
          <button
            onClick={onSend}
            className="inline-flex h-8 items-center justify-center gap-1.5 rounded-lg px-3 text-[12px] font-bold text-white shadow-sm transition-all hover:brightness-110"
            style={{ background: "#034751" }}
          >
            <Send className="h-3.5 w-3.5" />
            {t(SEND_KEY[it.channel])}
          </button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                aria-label={t("rm.snooze")}
                title={t("rm.snooze")}
                className="flex h-8 w-8 items-center justify-center rounded-lg border border-neutral-200 text-neutral-500 outline-none transition-colors hover:border-[#034751] hover:text-[#034751] focus-visible:ring-2 focus-visible:ring-[#034751]/40"
              >
                <CalendarClock className="h-4 w-4" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-44">
              <DropdownMenuLabel>{t("rm.snooze")}</DropdownMenuLabel>
              {SNOOZE_OPTS.map((o) => (
                <DropdownMenuItem key={o.key} onSelect={() => onSnooze(o.whenKey)}>
                  {t(o.key)}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
      <div className="h-3" />
    </div>
  );
}

function RemindersTab({
  notify,
  navigate,
  t,
}: {
  notify: (msg: string, undo?: () => void) => void;
  navigate: NavigateFunction;
  t: TFunc;
}) {
  const [items, setItems] = useState<ReminderItem[]>(unpaidReminders);
  const [removing, setRemoving] = useState<number[]>([]);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);
  useEffect(() => () => timers.current.forEach(clearTimeout), []);

  const remove = (id: number) => {
    setRemoving((r) => [...r, id]);
    timers.current.push(
      setTimeout(() => {
        setItems((l) => l.filter((x) => x.id !== id));
        setRemoving((r) => r.filter((x) => x !== id));
      }, 320)
    );
  };

  const bucketTotal = reminderBuckets.reduce((s, b) => s + b.count, 0);
  const total = items.length + bucketTotal;

  return (
    <div className="space-y-8">
      <div>
        <div className="flex items-center gap-2">
          <h2 className="font-display text-[20px] font-bold text-neutral-900">{t("rm.title")}</h2>
          <span className="rounded-full bg-[#785AA6]/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-[#785AA6]">
            {t("rm.proposal")}
          </span>
        </div>
        <p className="mt-1 text-[13px] text-neutral-500">{t("rm.subtitle")}</p>
        {total > 0 && (
          <p className="mt-2 text-[13px] font-medium text-[#034751]">
            {t("rm.frame", { n: total, m: Math.max(1, Math.ceil(total / 2)) })}
          </p>
        )}
      </div>

      {items.length > 0 ? (
        <section>
          <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <h3 className="font-display text-[15px] font-bold text-neutral-900">{t("rm.section.unpaid")}</h3>
              <span className="inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-[#FFF1E6] px-1.5 text-[11px] font-bold tnum text-[#C2410C]">
                {items.length}
              </span>
            </div>
            <button
              onClick={() => {
                notify(t("rm.toast.batch", { n: items.length }));
                setItems([]);
              }}
              className="inline-flex items-center gap-1.5 rounded-lg border border-[#034751]/30 bg-[#034751]/5 px-3 py-1.5 text-[12px] font-bold text-[#034751] transition-colors hover:bg-[#034751]/10"
            >
              <Send className="h-3.5 w-3.5" />
              {t("rm.batch")}
            </button>
          </div>
          <div>
            {items.map((it) => (
              <ReminderRow
                key={it.id}
                it={it}
                removing={removing.includes(it.id)}
                onSend={() => {
                  notify(t("rm.toast.sent", { owner: it.owner }));
                  remove(it.id);
                }}
                onSnooze={(whenKey) => {
                  notify(t("rm.toast.snoozed", { when: t(whenKey) }));
                  remove(it.id);
                }}
                t={t}
              />
            ))}
          </div>
        </section>
      ) : (
        <EmptyState icon={CircleDollarSign} text={t("rm.empty.unpaid")} accent="#4ABA7A" />
      )}

      <section>
        <h3 className="mb-3 font-display text-[15px] font-bold text-neutral-900">{t("rm.section.other")}</h3>
        <div className="grid gap-3 sm:grid-cols-2">
          {reminderBuckets.map((b) => (
            <button
              key={b.id}
              onClick={() => navigate(b.to)}
              className="group flex items-center gap-3 rounded-2xl border border-neutral-200 bg-white p-4 text-left shadow-soft transition-all hover:border-[#034751]/25 hover:shadow-card"
            >
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#785AA6]/10 text-[#785AA6]">
                <BellRing className="h-5 w-5" />
              </span>
              <div className="min-w-0 flex-1">
                <div className="truncate text-[14px] font-semibold text-neutral-900">{t(b.key)}</div>
                <div className="mt-0.5 text-[12px] text-neutral-500">
                  <span className="font-bold tnum text-neutral-700">{b.count}</span> · {t("rm.autoTag")}
                </div>
              </div>
              <ChevronRight className="h-4 w-4 shrink-0 text-neutral-300 transition-transform group-hover:translate-x-0.5 group-hover:text-[#034751]" />
            </button>
          ))}
        </div>
      </section>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Tab bar (big segmented pills) + density toggle
// ─────────────────────────────────────────────────────────────────────────────
function BigTab({
  value,
  active,
  icon: Icon,
  label,
  count,
  alert,
  soon,
}: {
  value: string;
  active: boolean;
  icon: typeof User;
  label: string;
  count?: number;
  alert?: boolean;
  soon?: boolean;
}) {
  return (
    <TabsPrimitive.Trigger
      value={value}
      className={cn(
        "relative inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-[15px] font-semibold outline-none transition-colors duration-200 focus-visible:ring-2 focus-visible:ring-[#034751]/40 sm:px-6 sm:py-3",
        active ? "text-white" : soon ? "text-neutral-400 hover:text-neutral-600" : "text-neutral-500 hover:text-neutral-800"
      )}
      style={active ? { background: "#034751", boxShadow: "0 6px 16px -6px rgba(3,71,81,0.45)" } : undefined}
    >
      <Icon className="h-[18px] w-[18px]" />
      <span>{label}</span>
      {count != null && count > 0 && (
        <span
          className={cn(
            "inline-flex h-[22px] min-w-[22px] items-center justify-center rounded-full px-1.5 text-[12px] font-bold tnum",
            active ? "bg-white/20 text-white" : alert ? "bg-[#C2410C] text-white" : "bg-neutral-200 text-neutral-600"
          )}
        >
          {count}
        </span>
      )}
      {soon && <Sparkles className="h-3.5 w-3.5 opacity-70" />}
    </TabsPrimitive.Trigger>
  );
}

function DensityToggle({ dense, setDense, t }: { dense: boolean; setDense: (d: boolean) => void; t: TFunc }) {
  return (
    <div className="inline-flex items-center gap-1 rounded-full bg-neutral-100 p-1">
      <button
        onClick={() => setDense(false)}
        aria-label={t("ar.density.comfortable")}
        title={t("ar.density.comfortable")}
        className={cn(
          "flex h-7 w-7 items-center justify-center rounded-full transition-colors",
          !dense ? "bg-white text-[#034751] shadow-soft" : "text-neutral-400 hover:text-neutral-600"
        )}
      >
        <Rows3 className="h-4 w-4" />
      </button>
      <button
        onClick={() => setDense(true)}
        aria-label={t("ar.density.compact")}
        title={t("ar.density.compact")}
        className={cn(
          "flex h-7 w-7 items-center justify-center rounded-full transition-colors",
          dense ? "bg-white text-[#034751] shadow-soft" : "text-neutral-400 hover:text-neutral-600"
        )}
      >
        <Rows2 className="h-4 w-4" />
      </button>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Page
// ─────────────────────────────────────────────────────────────────────────────
type TabKey = "arrival" | "booking" | "reminders";

export default function DashboardCS() {
  const { t, lang } = useLang();
  const navigate = useNavigate();
  const [tab, setTab] = useState<TabKey>("arrival");
  const [dense, setDense] = useState(false);
  const [arrivals, setArrivals] = useState<ArrivalAppt[]>(todayArrivals);
  const [bookings, setBookings] = useState<BookingRequest[]>(bookingRequests);
  const [selectedApptId, setSelectedApptId] = useState<number | null>(null);
  const [toast, setToast] = useState<{ msg: string; undo?: () => void } | null>(null);
  const toastTimer = useRef<ReturnType<typeof setTimeout>>();

  const notify = (msg: string, undo?: () => void) => {
    setToast({ msg, undo });
    clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(null), undo ? 5000 : 2800);
  };

  useEffect(() => () => clearTimeout(toastTimer.current), []);

  const onStatus = (appt: ArrivalAppt, s: ArrivalStatus) => {
    if (s === appt.status) return;
    const prev = appt.status;
    setArrivals((list) => list.map((x) => (x.id === appt.id ? { ...x, status: s } : x)));
    notify(t("ar.toast.status", { name: appt.name, status: t(ARRIVAL_STATUS_META[s].key) }), () => {
      setArrivals((list) => list.map((x) => (x.id === appt.id ? { ...x, status: prev } : x)));
      setToast(null);
    });
  };

  const onContext = (appt: ArrivalAppt, kind: ContextKind) => {
    if (kind === "checkin") onStatus(appt, "Arrived");
    else if (kind === "view") {
      if (appt.consultId) navigate(`/consultations/${appt.consultId}`);
      else notify(t("ar.toast.consult", { name: appt.name }));
    } else if (kind === "collect") navigate("/billing/payments");
  };

  const onAction = (appt: ArrivalAppt, kind: QAKind) => {
    switch (kind) {
      case "consult":
        if (appt.consultId) navigate(`/consultations/${appt.consultId}`);
        else notify(t("ar.toast.consult", { name: appt.name }));
        break;
      case "form":
        notify(t("ar.toast.form", { name: appt.name }));
        break;
      case "collect":
        navigate("/billing/payments");
        break;
      case "estimate":
        notify(t("ar.toast.estimate", { name: appt.name }));
        break;
      case "appointment":
        navigate("/schedule");
        break;
      case "callback":
        notify(t("ar.toast.callback", { name: appt.name }));
        break;
      case "comm":
        navigate("/communications/inbox");
        break;
      case "refund":
        notify(t("ar.toast.refund", { name: appt.name }));
        break;
    }
  };

  const activeArrivals = useMemo(
    () => arrivals.filter((a) => !["Completed", "No Show", "Canceled"].includes(a.status)).length,
    [arrivals]
  );

  const selectedAppt = selectedApptId == null ? null : arrivals.find((a) => a.id === selectedApptId) ?? null;

  const dateStr = NOW.toLocaleDateString(lang === "vi" ? "vi-VN" : "en-US", {
    weekday: "long",
    day: "2-digit",
    month: "short",
    year: "numeric",
  });

  return (
    <div className="h-full overflow-y-auto bg-white">
      <div className="mx-auto max-w-[1040px] px-6 pb-24 pt-10 sm:px-8">
        {/* header */}
        <header className="border-b border-neutral-200/70 pb-6">
          <div className="text-[11px] font-semibold uppercase tracking-[0.14em] text-neutral-400">{dateStr}</div>
          <div className="mt-1 flex flex-wrap items-end justify-between gap-x-6 gap-y-2">
            <h1 className="font-display text-[32px] font-bold leading-[1.1] tracking-tight text-neutral-900">{t("ar.title")}</h1>
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
              <div className="text-[13px] text-neutral-500">
                <span className="font-bold tnum text-[#034751]">{activeArrivals}</span> {t("ar.header.arriving")}
                <span className="mx-1.5 text-neutral-300">·</span>
                <span className="font-bold tnum text-[#C2410C]">{bookings.length}</span> {t("ar.header.toConfirm")}
              </div>
              <span className="hidden items-center gap-1.5 text-[13px] text-neutral-500 sm:flex">
                <MapPin className="h-3.5 w-3.5 text-neutral-400" />
                {HEADER.branch}
              </span>
            </div>
          </div>
        </header>

        <TabsPrimitive.Root value={tab} onValueChange={(v) => setTab(v as TabKey)} className="mt-8">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <TabsPrimitive.List className="inline-flex flex-wrap items-center gap-1 rounded-full bg-neutral-100 p-1.5">
              <BigTab value="arrival" active={tab === "arrival"} icon={CalendarCheck} label={t("ar.tab.arrival")} count={activeArrivals} />
              <BigTab value="booking" active={tab === "booking"} icon={Inbox} label={t("ar.tab.booking")} count={bookings.length} alert />
              <BigTab value="reminders" active={tab === "reminders"} icon={BellRing} label={t("ar.tab.reminders")} soon />
            </TabsPrimitive.List>
            {tab !== "reminders" && <DensityToggle dense={dense} setDense={setDense} t={t} />}
          </div>

          <div className="mt-8">
            <TabsPrimitive.Content value="arrival" className="outline-none">
              <TodaysArrivalTab
                arrivals={arrivals}
                dense={dense}
                onOpen={(a) => setSelectedApptId(a.id)}
                onStatus={onStatus}
                onAction={onAction}
                onContext={onContext}
                t={t}
                lang={lang}
              />
            </TabsPrimitive.Content>
            <TabsPrimitive.Content value="booking" className="outline-none">
              <BookingRequestsTab requests={bookings} setRequests={setBookings} notify={notify} navigate={navigate} t={t} />
            </TabsPrimitive.Content>
            <TabsPrimitive.Content value="reminders" className="outline-none">
              <RemindersTab notify={notify} navigate={navigate} t={t} />
            </TabsPrimitive.Content>
          </div>
        </TabsPrimitive.Root>
      </div>

      {/* toast */}
      {toast && (
        <div className="pointer-events-none fixed inset-x-0 bottom-6 z-50 flex justify-center px-4">
          <div className="pointer-events-auto flex animate-fade-up items-center gap-3 rounded-full bg-neutral-900 px-4 py-2.5 text-[13px] font-medium text-white shadow-lift">
            <span>{toast.msg}</span>
            {toast.undo && (
              <button onClick={toast.undo} className="font-bold text-[#7FD4A6] hover:underline">
                {t("ar.undo")}
              </button>
            )}
          </div>
        </div>
      )}

      <AppointmentDrawer
        appt={selectedAppt}
        onClose={() => setSelectedApptId(null)}
        onStatus={onStatus}
        notify={notify}
        navigate={navigate}
      />
    </div>
  );
}
