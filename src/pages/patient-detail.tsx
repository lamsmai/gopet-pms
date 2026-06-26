import { useMemo, useState } from "react";
import { Link, useParams, useNavigate } from "react-router-dom";
import {
  Activity,
  AlertTriangle,
  ArrowLeft,
  BadgeCheck,
  BellRing,
  CalendarClock,
  CalendarPlus,
  Camera,
  Cat,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  ClipboardCheck,
  ClipboardList,
  CreditCard,
  Dog,
  Download,
  FileText,
  History,
  KeyRound,
  LineChart,
  MessageSquare,
  PhoneCall,
  Pill,
  Printer,
  Rabbit,
  ReceiptText,
  RotateCcw,
  Scale,
  Share2,
  ShieldAlert,
  ShieldCheck,
  Stethoscope,
  Syringe,
  UserRound,
  X,
  type LucideIcon,
} from "lucide-react";
import {
  Line,
  LineChart as ReLineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn, initials, vndFull } from "@/lib/utils";
import {
  clients,
  getPatientById,
  getPrimaryClient,
  membershipLabel,
  roleLabel,
  sexLabel,
  type Patient,
  type Species,
  type VitalsPoint,
  type VitalsRow,
} from "@/lib/patient-data";

const TABS = [
  { id: "overview", label: "Overview", icon: Activity },
  { id: "history", label: "Clinical History", icon: History },
  { id: "vaccine", label: "Vaccine", icon: Syringe },
  { id: "prescription", label: "Prescription", icon: Pill },
  { id: "vitals", label: "Weight & Vitals", icon: LineChart },
  { id: "documents", label: "Documents", icon: FileText },
  { id: "insurance", label: "Insurance", icon: ShieldCheck },
  { id: "reminders", label: "Alert & Reminder", icon: BellRing },
] as const;

type TabId = (typeof TABS)[number]["id"];

function speciesIcon(species: Species) {
  if (species === "cat") return Cat;
  if (species === "rabbit") return Rabbit;
  return Dog;
}

function toneClasses(tone: Patient["photoTone"]) {
  return {
    teal: "from-[#034751] via-[#0F8C86] to-[#A8DBD6]",
    violet: "from-[#4B3D75] via-[#785AA6] to-[#D8CEF0]",
    amber: "from-[#7A4A12] via-[#D8872B] to-[#F5D7A6]",
    rose: "from-[#74304E] via-[#B64268] to-[#F3B7C8]",
  }[tone];
}

function tierBadge(tier: string) {
  if (tier === "platinum") return "border-[#48405F] bg-[#48405F] text-white";
  if (tier === "gold") return "border-[#B7791F] bg-[#FFF4D8] text-[#8A5300]";
  if (tier === "silver") return "border-[#A7B0BC] bg-[#F3F6F8] text-[#586575]";
  return "border-neutral-200 bg-white text-neutral-500";
}

// ── Left column ───────────────────────────────────────────────────────────────
function PatientPortrait({ patient }: { patient: Patient }) {
  const Icon = speciesIcon(patient.species);
  return (
    <div className={cn("relative h-[124px] w-[124px] shrink-0 overflow-hidden rounded-xl bg-gradient-to-br shadow-inner", toneClasses(patient.photoTone))}>
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(255,255,255,0.5),transparent_34%),linear-gradient(135deg,rgba(255,255,255,0.16),transparent_60%)]" />
      <Icon className="absolute bottom-4 left-4 h-14 w-14 text-white/95" />
      <button title="Upload patient avatar" className="absolute right-2.5 top-2.5 flex h-7 w-7 items-center justify-center rounded-md bg-white/90 text-[#034751] shadow-soft hover:bg-white">
        <Camera className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}

function InfoRow({ icon: Icon, label, value, mono }: { icon: LucideIcon; label: string; value: string; mono?: boolean }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <dt className="flex shrink-0 items-center gap-1.5 text-neutral-500">
        <Icon className="h-3.5 w-3.5 text-[#034751]" />
        {label}
      </dt>
      <dd className={cn("min-w-0 truncate text-right font-semibold text-neutral-800", mono && "font-mono text-[12px]")}>{value}</dd>
    </div>
  );
}

function ActionRow({ icon: Icon, label, primary, onClick }: { icon: LucideIcon; label: string; primary?: boolean; onClick?: () => void }) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "group flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-[13.5px] font-semibold transition-colors",
        primary
          ? "bg-[#034751] text-white hover:bg-[#023a42]"
          : "border border-neutral-200 bg-white text-neutral-700 hover:border-[#034751]/40 hover:bg-[#034751]/[0.04] hover:text-[#034751]"
      )}
    >
      <Icon className={cn("h-[18px] w-[18px] shrink-0", primary ? "text-white" : "text-[#034751]")} />
      <span className="flex-1 truncate">{label}</span>
      <ChevronRight className={cn("h-4 w-4 shrink-0", primary ? "text-white/70" : "text-neutral-300 group-hover:text-[#034751]")} />
    </button>
  );
}

function PatientSidebar({ patient, onAction }: { patient: Patient; onAction: (path?: string) => void }) {
  const owner = getPrimaryClient(patient);
  const Icon = speciesIcon(patient.species);

  const actions: { icon: LucideIcon; label: string; primary?: boolean; path?: string }[] = [
    { icon: CreditCard, label: "Collect Payment", primary: true, path: "/billing/payments" },
    { icon: Stethoscope, label: "Create Consultation", path: "/consultations/all" },
    { icon: ReceiptText, label: "Create Estimate", path: "/billing/invoices" },
    { icon: ClipboardList, label: "Patient Forms", path: "/forms" },
    { icon: PhoneCall, label: "Create Callback" },
    { icon: RotateCcw, label: "Give Refund" },
    { icon: CalendarPlus, label: "Make Appointment", path: "/schedule" },
    { icon: MessageSquare, label: "Send SMS", path: "/communications/sms" },
    { icon: KeyRound, label: "3rd Party Access" },
    { icon: Share2, label: "Share Record" },
  ];

  return (
    <aside className="space-y-5">
      {/* Patient identity */}
      <section className="rounded-lg border border-neutral-200 bg-white p-5 shadow-soft">
        <div className="flex flex-col items-center text-center">
          <PatientPortrait patient={patient} />
          <h1 className="mt-4 font-display text-[26px] font-bold leading-tight tracking-tight text-neutral-950">{patient.name}</h1>
          <div className="mt-1 flex items-center gap-1.5 text-[13px] text-neutral-500">
            <Icon className="h-4 w-4 text-[#034751]" />
            {patient.breed} · {patient.ageLabel}
          </div>
          <div className="mt-2.5 flex flex-wrap justify-center gap-1.5">
            <Badge variant={patient.triage === "urgent" ? "destructive" : patient.triage === "watch" ? "warning" : "success"} className="rounded-md">
              {patient.triage === "urgent" ? "Urgent watch" : patient.triage === "watch" ? "Clinical watch" : "Stable"}
            </Badge>
            <Badge className={cn("rounded-md border", tierBadge(owner.membershipTier))}>{membershipLabel(owner.membershipTier)}</Badge>
          </div>
        </div>

        <dl className="mt-5 space-y-2.5 border-t border-neutral-100 pt-4 text-[13px]">
          <InfoRow icon={BadgeCheck} label="Sex" value={sexLabel(patient.sex)} />
          <InfoRow icon={ShieldCheck} label="Microchip" value={patient.microchipId} mono />
          <InfoRow icon={UserRound} label="Owner" value={owner.name} />
          <InfoRow icon={Stethoscope} label="Primary vet" value={patient.primaryVet} />
          <InfoRow icon={Scale} label="Weight" value={`${patient.currentWeightKg} kg`} />
          <InfoRow icon={CalendarClock} label="Last visit" value={patient.lastVisit} />
        </dl>
      </section>

      {/* Quick actions */}
      <section className="rounded-lg border border-neutral-200 bg-white p-3 shadow-soft">
        <div className="px-1.5 pb-2 pt-1 text-[11px] font-bold uppercase tracking-wide text-neutral-400">Quick actions</div>
        <div className="space-y-1.5">
          {actions.map((a) => (
            <ActionRow key={a.label} icon={a.icon} label={a.label} primary={a.primary} onClick={() => onAction(a.path)} />
          ))}
        </div>
      </section>
    </aside>
  );
}

// ── Alerts ────────────────────────────────────────────────────────────────────
type DetailAlert = {
  id: string;
  scope: "Patient" | "Client";
  tone: "red" | "orange" | "blue" | "green";
  title: string;
  detail: string;
  cta?: { label: string; onClick: () => void };
};

function AlertItem({ alert, onDismiss }: { alert: DetailAlert; onDismiss: () => void }) {
  const box = {
    red: "border-red-200 bg-red-50",
    orange: "border-orange-200 bg-orange-50",
    blue: "border-sky-200 bg-sky-50",
    green: "border-emerald-200 bg-emerald-50",
  }[alert.tone];
  const fg = {
    red: "text-red-700",
    orange: "text-orange-800",
    blue: "text-sky-800",
    green: "text-emerald-800",
  }[alert.tone];

  return (
    <div className={cn("relative rounded-lg border p-3.5", box)}>
      <button onClick={onDismiss} aria-label="Dismiss alert" className={cn("absolute right-2.5 top-2.5 flex h-6 w-6 items-center justify-center rounded-md hover:bg-black/5", fg)}>
        <X className="h-3.5 w-3.5" />
      </button>
      <div className="flex items-center gap-1.5 pr-7">
        <AlertTriangle className={cn("h-3.5 w-3.5 shrink-0", fg)} />
        <span className={cn("text-[10px] font-bold uppercase tracking-wider", fg)}>{alert.scope} alert</span>
      </div>
      <div className={cn("mt-1.5 text-[14px] font-bold", fg)}>{alert.title}</div>
      <div className="mt-1 text-[13px] leading-snug text-neutral-600">{alert.detail}</div>
      {alert.cta && (
        <button onClick={alert.cta.onClick} className={cn("mt-2.5 inline-flex items-center gap-1.5 rounded-md bg-white px-2.5 py-1.5 text-[12px] font-semibold shadow-soft ring-1 ring-black/5 transition-shadow hover:ring-black/15", fg)}>
          {alert.cta.label}
          <ChevronRight className="h-3.5 w-3.5" />
        </button>
      )}
    </div>
  );
}

// ── Shared bits ───────────────────────────────────────────────────────────────
function Panel({ title, icon: Icon, action, children }: { title: string; icon: LucideIcon; action?: React.ReactNode; children: React.ReactNode }) {
  return (
    <section className="rounded-lg border border-neutral-200 bg-white p-4 shadow-soft">
      <div className="mb-3 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="flex h-8 w-8 items-center justify-center rounded-md bg-[#034751]/10 text-[#034751]">
            <Icon className="h-4 w-4" />
          </span>
          <h3 className="font-display text-base font-bold text-neutral-950">{title}</h3>
        </div>
        {action}
      </div>
      {children}
    </section>
  );
}

function EmptyText({ text }: { text: string }) {
  return <div className="rounded-md border border-dashed border-neutral-200 px-3 py-8 text-center text-sm text-neutral-400">{text}</div>;
}

function MiniInfo({ icon: Icon, label, value, sub, mono }: { icon: LucideIcon; label: string; value: string; sub?: string; mono?: boolean }) {
  return (
    <div className="rounded-lg border border-neutral-200 bg-white p-3 shadow-soft">
      <div className="flex items-center gap-1.5 text-[11px] font-semibold text-neutral-400">
        <Icon className="h-3.5 w-3.5 text-[#034751]" />
        {label}
      </div>
      <div className={cn("mt-1.5 truncate text-[15px] font-bold text-neutral-900", mono && "font-mono text-[13px]")}>{value}</div>
      {sub && <div className="mt-0.5 truncate text-[11px] text-neutral-500">{sub}</div>}
    </div>
  );
}

function OwnerAvatar({ name, primary = false }: { name: string; primary?: boolean }) {
  return (
    <div
      className={cn(
        "relative flex shrink-0 items-center justify-center rounded-lg font-bold shadow-soft ring-1 ring-white/70",
        primary ? "h-11 w-11 bg-[#034751] text-[13px] text-white" : "h-9 w-9 bg-white text-[12px] text-[#034751] ring-neutral-200"
      )}
    >
      {initials(name)}
      {primary && (
        <span className="absolute -bottom-1 -right-1 flex h-4.5 w-4.5 items-center justify-center rounded-md bg-emerald-500 text-white ring-2 ring-white">
          <CheckCircle2 className="h-3 w-3" />
        </span>
      )}
    </div>
  );
}

function ComingSoon({ icon: Icon, label }: { icon: LucideIcon; label: string }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-neutral-200 bg-white px-6 py-16 text-center shadow-soft">
      <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#034751]/10 text-[#034751]">
        <Icon className="h-6 w-6" />
      </div>
      <div className="mt-3 font-display text-lg font-bold text-neutral-900">{label}</div>
      <div className="mt-1 text-sm text-neutral-500">This section is coming soon.</div>
    </div>
  );
}

// ── Overview ──────────────────────────────────────────────────────────────────
function OverviewTab({ patient }: { patient: Patient }) {
  const extraMeds = patient.activeMedications.filter((m) => !patient.prescriptions.some((rx) => m.startsWith(rx.name)));
  const medCount = patient.prescriptions.length + extraMeds.length;

  return (
    <div className="space-y-5">
      {/* Contacts */}
      <Panel title="Contacts" icon={UserRound}>
        <div className="grid gap-2 sm:grid-cols-2">
          {patient.contacts.map((contact) => {
            const client = clients.find((c) => c.id === contact.clientId);
            return (
              <div key={`${contact.clientId}-${contact.role}`} className="flex items-start justify-between gap-3 rounded-lg border border-neutral-100 bg-neutral-50 px-3 py-2.5">
                <div className="flex min-w-0 items-start gap-3">
                  <OwnerAvatar name={client?.name ?? "?"} primary={contact.role === "primary_owner"} />
                  <div className="min-w-0">
                    <div className="truncate text-[13.5px] font-bold text-neutral-900">{client?.name ?? "Unknown"}</div>
                    {client?.phone && <div className="truncate text-[12px] text-neutral-500">{client.phone}</div>}
                    <div className="mt-0.5 truncate text-[12px] text-neutral-500">{contact.note}</div>
                  </div>
                </div>
                <span className="shrink-0 rounded-full bg-white px-2 py-1 text-[10px] font-bold text-neutral-600 ring-1 ring-neutral-200">{roleLabel(contact.role)}</span>
              </div>
            );
          })}
        </div>
      </Panel>

      {/* 4 mini info */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <MiniInfo icon={ShieldCheck} label="Microchip ID" value={patient.microchipId} mono />
        <MiniInfo icon={BadgeCheck} label="Insurance" value={patient.insuranceProvider ?? "None"} sub={patient.insurancePolicyNumber ?? "No policy"} />
        <MiniInfo icon={CalendarClock} label="Last visit" value={patient.lastVisit} />
        <MiniInfo icon={Pill} label="Active meds" value={String(patient.activeMedications.length)} sub={patient.activeMedications.length ? "On treatment" : "None"} />
      </div>

      {/* Active medications */}
      <Panel
        title="Active medications"
        icon={Pill}
        action={medCount > 0 ? <span className="rounded-full bg-[#034751]/10 px-2 py-0.5 text-[11px] font-bold tnum text-[#034751]">{medCount} active</span> : undefined}
      >
        {medCount ? (
          <ul className="divide-y divide-neutral-100">
            {patient.prescriptions.map((rx) => (
              <li key={rx.name} className="flex items-start gap-3 py-3 first:pt-0 last:pb-0">
                <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#034751]/10 text-[#034751]">
                  <Pill className="h-4 w-4" />
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                    <span className="inline-flex items-center gap-1.5 text-[14px] font-bold text-neutral-900">
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                      {rx.name}
                    </span>
                    <span className="rounded-md bg-[#034751]/[0.07] px-1.5 py-0.5 font-mono text-[11px] font-semibold text-[#034751]">{rx.dose}</span>
                  </div>
                  <p className="mt-1 truncate text-[12px] leading-snug text-neutral-500">{rx.ownerInstruction}</p>
                </div>
                <span className="shrink-0 whitespace-nowrap pt-0.5 text-[11px] font-medium text-neutral-400">Since {rx.since}</span>
              </li>
            ))}
            {extraMeds.map((med) => (
              <li key={med} className="flex items-center gap-3 py-3 first:pt-0 last:pb-0">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-neutral-100 text-neutral-500">
                  <Pill className="h-4 w-4" />
                </span>
                <span className="inline-flex min-w-0 flex-1 items-center gap-1.5 text-[13.5px] font-semibold text-neutral-800">
                  <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-500" />
                  <span className="truncate">{med}</span>
                </span>
              </li>
            ))}
          </ul>
        ) : (
          <EmptyText text="No active medications." />
        )}
      </Panel>

      {/* Alerts & notes */}
      <Panel title="Alerts & notes" icon={ShieldAlert}>
        <p className="text-sm leading-6 text-neutral-600">{patient.careSummary}</p>
        {(patient.chronicConditions.length > 0 || patient.allergies.length > 0) && (
          <div className="mt-3 flex flex-wrap gap-2">
            {patient.allergies.map((a) => (
              <Badge key={a} variant="destructive" className="rounded-md">Allergy: {a}</Badge>
            ))}
            {patient.chronicConditions.map((c) => (
              <Badge key={c} variant="warning" className="rounded-md">{c}</Badge>
            ))}
          </div>
        )}
        {patient.csHandoff.length > 0 && (
          <ul className="mt-3 space-y-1.5 border-t border-neutral-100 pt-3">
            {patient.csHandoff.map((note) => (
              <li key={note} className="flex gap-2 text-[13px] leading-snug text-neutral-600">
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
                {note}
              </li>
            ))}
          </ul>
        )}
      </Panel>

      {/* Upcoming appointments */}
      <Panel title="Upcoming appointments" icon={CalendarClock}>
        {patient.bookings.length ? (
          <div className="space-y-2">
            {patient.bookings.map((booking) => (
              <div key={`${booking.date}-${booking.type}`} className="flex items-start justify-between gap-3 rounded-lg border border-neutral-100 bg-neutral-50 p-3">
                <div className="min-w-0">
                  <div className="font-semibold text-neutral-900">{booking.type}</div>
                  <div className="mt-1 text-[12px] text-neutral-500">{booking.date} · {booking.clinician}</div>
                </div>
                <Badge variant={/urgent|needs/i.test(booking.status) ? "warning" : "success"} className="shrink-0 rounded-md">{booking.status}</Badge>
              </div>
            ))}
          </div>
        ) : (
          <EmptyText text="No upcoming appointments." />
        )}
      </Panel>
    </div>
  );
}

// ── Clinical history (reused) ─────────────────────────────────────────────────
function HistoryTab({ patient }: { patient: Patient }) {
  return (
    <section className="rounded-lg border border-neutral-200 bg-white p-5 shadow-soft">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="font-display text-xl font-bold text-neutral-950">Clinical timeline</h2>
          <p className="mt-1 text-sm text-neutral-500">Newest first, with SOAP, labs, images and financial visibility rules.</p>
        </div>
        <Button variant="outline" className="gap-2">
          <ClipboardCheck className="h-4 w-4" />
          New SOAP
        </Button>
      </div>

      <div className="mt-5 space-y-4">
        {patient.clinicalHistory.length ? patient.clinicalHistory.map((event) => (
          <details key={event.id} open className="group rounded-lg border border-neutral-200 bg-white">
            <summary className="flex cursor-pointer list-none flex-wrap items-start justify-between gap-4 p-4">
              <div className="flex gap-4">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-[#034751]/10 text-[#034751]">
                  <Stethoscope className="h-5 w-5" />
                </div>
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="font-display text-lg font-bold text-neutral-950">{event.reason}</h3>
                    {event.billingVisibility === "previous-owner-hidden" && (
                      <Badge variant="warning" className="rounded-md">Previous finance hidden</Badge>
                    )}
                  </div>
                  <div className="mt-1 text-sm text-neutral-500">
                    {event.date} · {event.time} · {event.vet} · {event.nurse}
                  </div>
                  <p className="mt-2 max-w-3xl text-sm leading-6 text-neutral-600">{event.summary}</p>
                </div>
              </div>
              <ChevronDown className="mt-2 h-5 w-5 text-neutral-400 transition-transform group-open:rotate-180" />
            </summary>
            <div className="border-t border-neutral-100 p-4">
              <div className="grid gap-3 lg:grid-cols-4">
                {Object.entries(event.soap).map(([key, value]) => (
                  <div key={key} className="rounded-md border border-neutral-100 bg-neutral-50 p-3">
                    <div className="text-[11px] font-bold uppercase tracking-wide text-neutral-400">{key}</div>
                    <div className="mt-2 text-[13px] leading-5 text-neutral-700">{value}</div>
                  </div>
                ))}
              </div>
              <div className="mt-4 grid gap-3 lg:grid-cols-2">
                <div className="rounded-md border border-neutral-100 p-3">
                  <div className="text-[12px] font-bold uppercase tracking-wide text-neutral-500">Labs</div>
                  {event.labs.length ? (
                    <div className="mt-2 flex flex-wrap gap-2">
                      {event.labs.map((lab) => (
                        <Badge key={lab.name} variant={lab.flag === "high" ? "destructive" : lab.flag === "low" ? "warning" : "success"} className="rounded-md">
                          {lab.name}: {lab.value}
                        </Badge>
                      ))}
                    </div>
                  ) : (
                    <div className="mt-2 text-sm text-neutral-400">No labs attached.</div>
                  )}
                </div>
                <div className="rounded-md border border-neutral-100 p-3">
                  <div className="text-[12px] font-bold uppercase tracking-wide text-neutral-500">Diagnostic images</div>
                  {event.images.length ? (
                    <div className="mt-2 flex flex-wrap gap-2">
                      {event.images.map((image) => (
                        <Badge key={image} variant="info" className="rounded-md">{image}</Badge>
                      ))}
                    </div>
                  ) : (
                    <div className="mt-2 text-sm text-neutral-400">No images attached.</div>
                  )}
                </div>
              </div>
            </div>
          </details>
        )) : <EmptyText text="No clinical encounters yet." />}
      </div>
    </section>
  );
}

// ── Vaccinations (reused) ─────────────────────────────────────────────────────
function VaccinationsTab({ patient }: { patient: Patient }) {
  const overdue = patient.vaccinations.filter((vaccine) => vaccine.status === "overdue");
  return (
    <section className="rounded-lg border border-neutral-200 bg-white p-5 shadow-soft">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="font-display text-xl font-bold text-neutral-950">Vaccinations & Certificates</h2>
          <p className="mt-1 text-sm text-neutral-500">Travel and boarding readiness at a glance.</p>
        </div>
        <Button className="gap-2">
          <Download className="h-4 w-4" />
          Download certificate
        </Button>
      </div>
      {overdue.length > 0 && (
        <div className="mt-5 flex gap-3 rounded-lg border border-red-200 bg-red-50 p-4 text-red-700">
          <AlertTriangle className="h-5 w-5 shrink-0" />
          <div>
            <div className="font-bold">Core vaccine overdue</div>
            <div className="mt-1 text-sm">{overdue.map((vaccine) => vaccine.name).join(", ")} needs review before boarding, travel or discharge clearance.</div>
          </div>
        </div>
      )}
      <div className="mt-5 overflow-x-auto rounded-lg border border-neutral-200">
        <table className="w-full text-left text-sm">
          <thead className="bg-neutral-50 text-[11px] font-bold uppercase tracking-wide text-neutral-400">
            <tr>
              <th className="px-4 py-3">Vaccine</th>
              <th className="px-4 py-3">Administered</th>
              <th className="px-4 py-3">Batch</th>
              <th className="px-4 py-3">Vet</th>
              <th className="px-4 py-3">Revisit due</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3 text-right">Certificate</th>
            </tr>
          </thead>
          <tbody>
            {patient.vaccinations.length ? patient.vaccinations.map((vaccine) => (
              <tr key={`${vaccine.name}-${vaccine.batch}`} className="border-t border-neutral-100">
                <td className="px-4 py-3 font-semibold text-neutral-900">{vaccine.name}</td>
                <td className="whitespace-nowrap px-4 py-3 text-neutral-600">{vaccine.administered}</td>
                <td className="whitespace-nowrap px-4 py-3 font-mono text-[12px] text-neutral-500">{vaccine.batch}</td>
                <td className="whitespace-nowrap px-4 py-3 text-neutral-600">{vaccine.vet}</td>
                <td className="whitespace-nowrap px-4 py-3 text-neutral-600">{vaccine.due}</td>
                <td className="px-4 py-3">
                  <Badge
                    variant={vaccine.status === "overdue" ? "destructive" : vaccine.status === "due-soon" ? "warning" : "success"}
                    className="rounded-md"
                  >
                    {vaccine.status === "overdue" ? "Overdue" : vaccine.status === "due-soon" ? "Due soon" : "Up to date"}
                  </Badge>
                </td>
                <td className="px-4 py-3 text-right">
                  <Button variant="outline" size="xs" disabled={!vaccine.certificateReady}>
                    <Printer className="h-3.5 w-3.5" />
                    PDF
                  </Button>
                </td>
              </tr>
            )) : (
              <tr>
                <td colSpan={7} className="px-4 py-10 text-center text-sm text-neutral-400">No vaccination records yet.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}

// ── Vitals (reused) ───────────────────────────────────────────────────────────
function VitalsTooltip({ active, payload }: { active?: boolean; payload?: { payload: VitalsPoint }[] }) {
  if (!active || !payload?.[0]) return null;
  const point = payload[0].payload;
  return (
    <div className="rounded-lg border border-neutral-200 bg-white p-3 text-xs shadow-lift">
      <div className="font-bold text-neutral-900">{point.label}: {point.value}</div>
      <div className="mt-1 text-neutral-600">{point.vet} · {point.branch}</div>
      {point.comment && <div className="mt-1 max-w-[220px] text-neutral-500">{point.comment}</div>}
    </div>
  );
}

function NumericSparkline({ row }: { row: VitalsRow }) {
  const data = row.values.map((point) => ({ ...point, numeric: Number(point.value) }));
  return (
    <ResponsiveContainer width="100%" height={72}>
      <ReLineChart data={data} margin={{ left: 8, right: 8, top: 12, bottom: 10 }}>
        <XAxis dataKey="label" hide />
        <YAxis hide domain={["dataMin - 1", "dataMax + 1"]} />
        <Tooltip content={<VitalsTooltip />} />
        <Line type="monotone" dataKey="numeric" stroke={row.color} strokeWidth={2.5} dot={{ r: 3, strokeWidth: 2, fill: "#fff" }} activeDot={{ r: 5 }} />
      </ReLineChart>
    </ResponsiveContainer>
  );
}

function CategoricalTimeline({ row }: { row: VitalsRow }) {
  return (
    <div className="grid h-[72px] grid-cols-4 items-center gap-2 px-2">
      {row.values.map((point) => (
        <div key={`${row.metric}-${point.label}`} title={`${point.vet} · ${point.branch}${point.comment ? ` · ${point.comment}` : ""}`} className="flex flex-col items-center gap-1">
          <span className="rounded-md bg-neutral-800 px-2 py-1 font-mono text-[11px] font-bold text-white">{point.value}</span>
          <span className="text-[10px] font-semibold text-neutral-400">{point.label}</span>
        </div>
      ))}
    </div>
  );
}

function VitalsTab({ patient }: { patient: Patient }) {
  const rows = patient.vitals;
  const timeline = rows[0]?.values.map((point) => point.label) ?? [];
  return (
    <section className="rounded-lg border border-neutral-200 bg-white p-5 shadow-soft">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="font-display text-xl font-bold text-neutral-950">Vitals Trend Grid</h2>
          <p className="mt-1 max-w-3xl text-sm text-neutral-500">Synchronized clinical measurements across a shared visit timeline. Hover numeric points or categorical badges for nurse, branch and comments.</p>
        </div>
        <Badge variant="info" className="rounded-md">Shared X-axis: {timeline.join(" · ") || "No vitals"}</Badge>
      </div>
      {rows.length ? (
        <div className="mt-5 overflow-hidden rounded-lg border border-neutral-200">
          <div className="grid grid-cols-[230px_1fr] border-b border-neutral-200 bg-neutral-50 text-[11px] font-bold uppercase tracking-wide text-neutral-400">
            <div className="px-4 py-3">Reference metrics</div>
            <div className="px-4 py-3">Sparkline trend grid</div>
          </div>
          {rows.map((row) => (
            <div key={row.metric} className="grid grid-cols-[230px_1fr] border-b border-neutral-100 last:border-0">
              <div className="border-r border-neutral-100 p-4">
                <div className="font-bold text-neutral-950">{row.metric}</div>
                <div className="mt-1 text-[12px] text-neutral-500">{row.range}</div>
                <div className="mt-3 flex flex-wrap gap-1.5">
                  <Badge variant="secondary" className="rounded-md">{row.current}</Badge>
                  {row.target && <Badge variant="success" className="rounded-md">Target {row.target}</Badge>}
                </div>
              </div>
              <div className="relative min-w-0 bg-[linear-gradient(90deg,rgba(3,71,81,0.035)_1px,transparent_1px)] bg-[length:25%_100%]">
                {row.kind === "numeric" ? <NumericSparkline row={row} /> : <CategoricalTimeline row={row} />}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <EmptyText text="No vitals trend data yet." />
      )}
    </section>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────
export default function PatientDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const patient = getPatientById(id);
  const owner = getPrimaryClient(patient);
  const [tab, setTab] = useState<TabId>("overview");
  const [dismissed, setDismissed] = useState<Set<string>>(() => new Set());

  const alertList = useMemo<DetailAlert[]>(() => {
    const list: DetailAlert[] = patient.alerts.map((a, i) => ({
      id: `p-${i}`,
      scope: "Patient",
      tone: a.tone,
      title: a.label,
      detail: a.detail,
    }));
    if (owner.outstandingBalance > 0) {
      list.push({
        id: "c-outstanding",
        scope: "Client",
        tone: "red",
        title: "Outstanding balance",
        detail: `${owner.name} has an unpaid balance of ${vndFull(owner.outstandingBalance)}. Collect before the next discharge.`,
        cta: { label: "Collect payment", onClick: () => navigate("/billing/payments") },
      });
    }
    if (owner.csStatus) {
      list.push({ id: "c-cs", scope: "Client", tone: "blue", title: "CS note", detail: owner.csStatus });
    }
    return list;
  }, [patient, owner, navigate]);

  const visibleAlerts = alertList.filter((a) => !dismissed.has(a.id));

  const handleAction = (path?: string) => {
    if (path) navigate(path);
  };

  return (
    <div className="h-full overflow-y-auto bg-[#F7F9F8]">
      <div className="mx-auto max-w-[1540px] p-6">
        <Link to="/patients" className="mb-4 inline-flex items-center gap-1.5 text-sm font-semibold text-neutral-500 hover:text-[#034751]">
          <ArrowLeft className="h-4 w-4" />
          Back to Patients
        </Link>

        <div className="grid items-start gap-5 lg:grid-cols-[minmax(0,3fr)_minmax(0,7fr)]">
          {/* Column 1 — 30% */}
          <PatientSidebar patient={patient} onAction={handleAction} />

          {/* Column 2 — 70% */}
          <div className="min-w-0 space-y-5">
            {visibleAlerts.length > 0 && (
              <div className="space-y-2.5">
                {visibleAlerts.map((alert) => (
                  <AlertItem key={alert.id} alert={alert} onDismiss={() => setDismissed((prev) => new Set(prev).add(alert.id))} />
                ))}
              </div>
            )}

            <Tabs value={tab} onValueChange={(value) => setTab(value as TabId)}>
              <TabsList className="h-auto flex-wrap justify-start rounded-lg border border-neutral-200 bg-white p-1 shadow-soft">
                {TABS.map(({ id: tabId, label, icon: Icon }) => (
                  <TabsTrigger key={tabId} value={tabId} className="h-9 rounded-md px-3 data-[state=active]:bg-[#034751] data-[state=active]:text-white">
                    <Icon className="h-4 w-4" />
                    {label}
                  </TabsTrigger>
                ))}
              </TabsList>

              <TabsContent value="overview" className="mt-5">
                <OverviewTab patient={patient} />
              </TabsContent>
              <TabsContent value="history" className="mt-5">
                <HistoryTab patient={patient} />
              </TabsContent>
              <TabsContent value="vaccine" className="mt-5">
                <VaccinationsTab patient={patient} />
              </TabsContent>
              <TabsContent value="prescription" className="mt-5">
                <ComingSoon icon={Pill} label="Prescription" />
              </TabsContent>
              <TabsContent value="vitals" className="mt-5">
                <VitalsTab patient={patient} />
              </TabsContent>
              <TabsContent value="documents" className="mt-5">
                <ComingSoon icon={FileText} label="Documents" />
              </TabsContent>
              <TabsContent value="insurance" className="mt-5">
                <ComingSoon icon={ShieldCheck} label="Insurance" />
              </TabsContent>
              <TabsContent value="reminders" className="mt-5">
                <ComingSoon icon={BellRing} label="Alert & Reminder" />
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>
    </div>
  );
}
