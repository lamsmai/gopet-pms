import { useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import {
  Activity,
  AlertTriangle,
  ArrowLeft,
  BadgeCheck,
  BellRing,
  CalendarClock,
  Camera,
  Cat,
  CheckCircle2,
  ChevronDown,
  ClipboardCheck,
  Download,
  Dog,
  FileText,
  HeartPulse,
  History,
  Info,
  LineChart,
  Mail,
  Pill,
  Printer,
  Rabbit,
  Scale,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  Stethoscope,
  Syringe,
  UserRound,
  WalletCards,
} from "lucide-react";
import {
  Area,
  AreaChart,
  CartesianGrid,
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
  type RiskLevel,
  type Species,
  type VitalsPoint,
  type VitalsRow,
} from "@/lib/patient-data";

const tabs = [
  { id: "overview", label: "Overview", icon: Activity },
  { id: "ai", label: "AI Health", icon: Sparkles },
  { id: "history", label: "Clinical History", icon: History },
  { id: "vaccinations", label: "Vaccinations", icon: Syringe },
  { id: "vitals", label: "Vitals & Weight", icon: LineChart },
] as const;

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

function PatientPortrait({ patient }: { patient: Patient }) {
  const Icon = speciesIcon(patient.species);
  return (
    <div className={cn("relative h-[132px] w-[132px] shrink-0 overflow-hidden rounded-lg bg-gradient-to-br shadow-inner", toneClasses(patient.photoTone))}>
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(255,255,255,0.5),transparent_34%),linear-gradient(135deg,rgba(255,255,255,0.16),transparent_60%)]" />
      <Icon className="absolute bottom-5 left-5 h-16 w-16 text-white/95" />
      <button
        title="Upload patient avatar"
        className="absolute right-3 top-3 flex h-8 w-8 items-center justify-center rounded-md bg-white/90 text-[#034751] shadow-soft"
      >
        <Camera className="h-4 w-4" />
      </button>
      <div className="absolute bottom-3 right-3 rounded-md bg-black/20 px-2 py-1 font-mono text-[11px] font-bold uppercase text-white/90">
        {patient.id}
      </div>
    </div>
  );
}

function AlertBanner({ alert }: { alert: Patient["alerts"][number] }) {
  const tone = {
    red: "border-red-200 bg-red-50 text-red-700",
    orange: "border-orange-200 bg-orange-50 text-orange-800",
    blue: "border-sky-200 bg-sky-50 text-sky-800",
    green: "border-emerald-200 bg-emerald-50 text-emerald-800",
  }[alert.tone];
  return (
    <div className={cn("flex min-w-0 items-start gap-2 rounded-lg border px-3 py-2", tone)}>
      <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
      <div className="min-w-0">
        <div className="text-[12px] font-bold uppercase tracking-wide">{alert.label}</div>
        <div className="mt-0.5 text-[12px] leading-snug opacity-90">{alert.detail}</div>
      </div>
    </div>
  );
}

function StatCard({ label, value, sub, icon: Icon, tone = "teal" }: { label: string; value: string; sub?: string; icon: typeof Scale; tone?: "teal" | "amber" | "violet" | "red" }) {
  return (
    <div className="rounded-lg border border-neutral-200 bg-white p-4 shadow-soft">
      <div
        className={cn(
          "mb-3 flex h-9 w-9 items-center justify-center rounded-md",
          tone === "teal" && "bg-[#034751]/10 text-[#034751]",
          tone === "amber" && "bg-amber-50 text-amber-700",
          tone === "violet" && "bg-violet-50 text-violet-700",
          tone === "red" && "bg-red-50 text-red-600"
        )}
      >
        <Icon className="h-4.5 w-4.5" />
      </div>
      <div className="text-[12px] font-semibold text-neutral-500">{label}</div>
      <div className="mt-1 text-[24px] font-bold leading-none tnum text-neutral-950">{value}</div>
      {sub && <div className="mt-1.5 text-[12px] leading-snug text-neutral-500">{sub}</div>}
    </div>
  );
}

function OwnerAvatar({ name, primary = false }: { name: string; primary?: boolean }) {
  return (
    <div
      className={cn(
        "relative flex shrink-0 items-center justify-center rounded-lg font-bold shadow-soft ring-1 ring-white/70",
        primary ? "h-12 w-12 bg-[#034751] text-sm text-white" : "h-9 w-9 bg-white text-[12px] text-[#034751] ring-neutral-200"
      )}
    >
      {initials(name)}
      {primary && (
        <span className="absolute -bottom-1 -right-1 flex h-5 w-5 items-center justify-center rounded-md bg-emerald-500 text-white ring-2 ring-white">
          <CheckCircle2 className="h-3 w-3" />
        </span>
      )}
    </div>
  );
}

function OwnerPanel({ patient }: { patient: Patient }) {
  const primary = getPrimaryClient(patient);
  return (
    <section className="rounded-lg border border-neutral-200 bg-white p-4 shadow-soft">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="font-display text-lg font-bold text-neutral-950">Owner & CS Context</h2>
          <p className="mt-0.5 text-sm text-neutral-500">Relationship roles and operational notes for fast support.</p>
        </div>
        <Badge className={cn("rounded-md border", tierBadge(primary.membershipTier))}>{membershipLabel(primary.membershipTier)}</Badge>
      </div>
      <div className="mt-4 rounded-lg border border-[#034751]/15 bg-[#034751]/[0.04] p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex min-w-0 items-start gap-3">
            <OwnerAvatar name={primary.name} primary />
            <div className="min-w-0">
              <div className="text-[12px] font-bold uppercase tracking-wide text-[#034751]">Primary owner</div>
              <div className="mt-1 truncate text-lg font-bold text-neutral-950">{primary.name}</div>
              <div className="mt-1 truncate text-sm text-neutral-600">{primary.phone} · {primary.email}</div>
            </div>
          </div>
          <div className="text-right">
            <div className="text-[11px] font-semibold text-neutral-500">Deposit</div>
            <div className="font-bold tnum text-[#034751]">{vndFull(primary.depositBalance)}</div>
          </div>
        </div>
      </div>
      <div className="mt-4 grid gap-2">
        {patient.contacts.map((contact) => {
          const client = clients.find((item) => item.id === contact.clientId);
          return (
            <div key={`${contact.clientId}-${contact.role}`} className="flex items-center justify-between gap-3 rounded-md border border-neutral-100 bg-neutral-50 px-3 py-2">
              <div className="flex min-w-0 items-center gap-3">
                <OwnerAvatar name={client?.name ?? "Unknown"} />
                <div className="min-w-0">
                  <div className="truncate text-sm font-semibold text-neutral-900">{client?.name}</div>
                  <div className="truncate text-[12px] text-neutral-500">{contact.note}</div>
                </div>
              </div>
              <span className="shrink-0 rounded-full bg-white px-2 py-1 text-[11px] font-bold text-neutral-600 ring-1 ring-neutral-200">
                {roleLabel(contact.role)}
              </span>
            </div>
          );
        })}
      </div>
      <div className="mt-4 border-t border-neutral-100 pt-4">
        <div className="flex items-center gap-2 text-sm font-bold text-neutral-900">
          <BellRing className="h-4 w-4 text-[#034751]" />
          CS handoff
        </div>
        <ul className="mt-2 space-y-2">
          {patient.csHandoff.map((note) => (
            <li key={note} className="flex gap-2 text-sm leading-snug text-neutral-600">
              <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
              {note}
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

function OverviewTab({ patient }: { patient: Patient }) {
  return (
    <div className="grid gap-5 xl:grid-cols-[1fr_390px]">
      <div className="space-y-5">
        <section className="rounded-lg border border-neutral-200 bg-white p-5 shadow-soft">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h2 className="font-display text-xl font-bold text-neutral-950">Weight, BCS & Clinical Readiness</h2>
              <p className="mt-1 text-sm text-neutral-500">Weight trend plotted against ideal band for quick nutrition and mobility decisions.</p>
            </div>
            <Badge variant={patient.bcs >= 7 ? "warning" : "success"} className="rounded-md">
              BCS {patient.bcs}/9
            </Badge>
          </div>
          <div className="mt-5 h-[285px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={patient.weightHistory} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="weightFill" x1="0" x2="0" y1="0" y2="1">
                    <stop offset="5%" stopColor="#0F8C86" stopOpacity={0.28} />
                    <stop offset="95%" stopColor="#0F8C86" stopOpacity={0.02} />
                  </linearGradient>
                </defs>
                <CartesianGrid stroke="#E5ECEA" strokeDasharray="3 3" />
                <XAxis dataKey="date" tickLine={false} axisLine={false} fontSize={12} />
                <YAxis tickLine={false} axisLine={false} fontSize={12} width={34} domain={["dataMin - 1", "dataMax + 1"]} />
                <Tooltip contentStyle={{ borderRadius: 8, borderColor: "#DCE5E2" }} />
                <Area type="monotone" dataKey="idealHigh" stroke="#94A3B8" strokeDasharray="4 4" fill="transparent" name="Ideal high" />
                <Area type="monotone" dataKey="idealLow" stroke="#94A3B8" strokeDasharray="4 4" fill="transparent" name="Ideal low" />
                <Area type="monotone" dataKey="weight" stroke="#0F8C86" strokeWidth={3} fill="url(#weightFill)" name="Weight" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-4 grid gap-3 md:grid-cols-3">
            <StatCard label="Current weight" value={`${patient.currentWeightKg} kg`} sub={`Ideal ${patient.idealWeightKg[0]}-${patient.idealWeightKg[1]} kg`} icon={Scale} />
            <StatCard label="Body condition" value={`${patient.bcs}/9`} sub={patient.bcs >= 7 ? "Above target, weight plan active" : "Within target band"} icon={HeartPulse} tone={patient.bcs >= 7 ? "amber" : "teal"} />
            <StatCard label="Next booking" value={patient.nextBooking.split(",")[0]} sub={patient.nextBooking.includes(",") ? patient.nextBooking.split(",")[1].trim() : patient.nextBooking} icon={CalendarClock} tone="violet" />
          </div>
        </section>

        <section className="grid gap-4 lg:grid-cols-2">
          <Panel title="Upcoming bookings" icon={CalendarClock}>
            <div className="space-y-3">
              {patient.bookings.length ? patient.bookings.map((booking) => (
                <div key={`${booking.date}-${booking.type}`} className="rounded-md border border-neutral-100 bg-neutral-50 p-3">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="font-semibold text-neutral-900">{booking.type}</div>
                      <div className="mt-1 text-[12px] text-neutral-500">{booking.date} · {booking.clinician}</div>
                    </div>
                    <Badge variant={booking.status.includes("Urgent") ? "destructive" : "default"} className="rounded-md">{booking.status}</Badge>
                  </div>
                </div>
              )) : <EmptyText text="No upcoming bookings." />}
            </div>
          </Panel>

          <Panel title="Active long-term prescriptions" icon={Pill}>
            <div className="space-y-3">
              {patient.prescriptions.length ? patient.prescriptions.map((rx) => (
                <div key={rx.name} className="rounded-md border border-neutral-100 bg-neutral-50 p-3">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="font-semibold text-neutral-900">{rx.name}</div>
                      <div className="mt-1 text-[12px] text-neutral-500">{rx.dose} · Since {rx.since}</div>
                    </div>
                    <Badge variant="info" className="rounded-md">Active</Badge>
                  </div>
                  <div className="mt-2 text-[12px] leading-snug text-neutral-600">{rx.ownerInstruction}</div>
                </div>
              )) : <EmptyText text="No active long-term prescriptions." />}
            </div>
          </Panel>
        </section>
      </div>

      <div className="space-y-5">
        <OwnerPanel patient={patient} />
        <Panel title="Clinical alert notes" icon={ShieldAlert}>
          <p className="text-sm leading-6 text-neutral-600">{patient.careSummary}</p>
          <div className="mt-4 flex flex-wrap gap-2">
            {patient.chronicConditions.map((condition) => (
              <Badge key={condition} variant="warning" className="rounded-md">{condition}</Badge>
            ))}
            {patient.activeMedications.map((medication) => (
              <Badge key={medication} variant="info" className="rounded-md">{medication}</Badge>
            ))}
          </div>
        </Panel>
      </div>
    </div>
  );
}

function Panel({ title, icon: Icon, children }: { title: string; icon: typeof Pill; children: React.ReactNode }) {
  return (
    <section className="rounded-lg border border-neutral-200 bg-white p-4 shadow-soft">
      <div className="mb-3 flex items-center gap-2">
        <span className="flex h-8 w-8 items-center justify-center rounded-md bg-[#034751]/10 text-[#034751]">
          <Icon className="h-4 w-4" />
        </span>
        <h3 className="font-display text-base font-bold text-neutral-950">{title}</h3>
      </div>
      {children}
    </section>
  );
}

function EmptyText({ text }: { text: string }) {
  return <div className="rounded-md border border-dashed border-neutral-200 px-3 py-8 text-center text-sm text-neutral-400">{text}</div>;
}

function riskStyle(level: RiskLevel) {
  return {
    high: "border-red-200 bg-red-50 text-red-700",
    moderate: "border-amber-200 bg-amber-50 text-amber-800",
    low: "border-emerald-200 bg-emerald-50 text-emerald-800",
  }[level];
}

function AiHealthTab({ patient }: { patient: Patient }) {
  const report = patient.aiReport;
  return (
    <div className="grid gap-5 xl:grid-cols-[420px_1fr]">
      <section className="rounded-lg border border-[#034751]/20 bg-[#034751] p-5 text-white shadow-lift">
        <div className="flex items-center justify-between gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-white/12">
            <Sparkles className="h-5 w-5" />
          </div>
          <Badge className="rounded-md border-white/20 bg-white/12 text-white">Confidence {report.confidence}%</Badge>
        </div>
        <h2 className="mt-5 font-display text-2xl font-bold">AI Health Analyzer</h2>
        <p className="mt-3 text-sm leading-6 text-white/82">{report.summary}</p>
        <div className="mt-5 rounded-lg border border-white/15 bg-white/10 p-3">
          <div className="text-[11px] font-bold uppercase tracking-wide text-white/65">Generated</div>
          <div className="mt-1 text-sm font-semibold">{report.generatedAt}</div>
        </div>
        <div className="mt-5 grid grid-cols-2 gap-2">
          <Button variant="secondary" className="bg-white text-[#034751] hover:bg-white/90">
            <FileText className="h-4 w-4" />
            Export PDF
          </Button>
          <Button variant="outline" className="border-white/25 bg-transparent text-white hover:bg-white/10 hover:text-white">
            <Mail className="h-4 w-4" />
            Share
          </Button>
        </div>
      </section>

      <div className="space-y-5">
        <section className="rounded-lg border border-neutral-200 bg-white p-5 shadow-soft">
          <h3 className="font-display text-lg font-bold text-neutral-950">Risk factors</h3>
          <div className="mt-4 grid gap-3 lg:grid-cols-3">
            {report.riskFactors.map((risk) => (
              <div key={risk.title} className={cn("rounded-lg border p-4", riskStyle(risk.level))}>
                <div className="text-[11px] font-bold uppercase tracking-wide">{risk.level}</div>
                <div className="mt-2 font-bold text-neutral-950">{risk.title}</div>
                <div className="mt-2 text-[13px] leading-5 text-neutral-700">{risk.evidence}</div>
                <div className="mt-3 rounded-md bg-white/65 p-2 text-[12px] font-semibold leading-snug text-neutral-800">{risk.nextStep}</div>
              </div>
            ))}
          </div>
        </section>

        <section className="rounded-lg border border-neutral-200 bg-white p-5 shadow-soft">
          <div className="flex items-center justify-between gap-3">
            <h3 className="font-display text-lg font-bold text-neutral-950">Recommendations</h3>
            <Badge variant="info" className="rounded-md">Vet reviewed before client share</Badge>
          </div>
          <div className="mt-4 overflow-hidden rounded-lg border border-neutral-200">
            <table className="w-full text-left text-sm">
              <thead className="bg-neutral-50 text-[11px] font-bold uppercase tracking-wide text-neutral-400">
                <tr>
                  <th className="px-4 py-3">Owner-facing</th>
                  <th className="px-4 py-3">Clinical action</th>
                  <th className="px-4 py-3">Due</th>
                </tr>
              </thead>
              <tbody>
                {report.recommendations.map((rec) => (
                  <tr key={`${rec.ownerFacing}-${rec.due}`} className="border-t border-neutral-100">
                    <td className="px-4 py-3 font-semibold text-neutral-900">{rec.ownerFacing}</td>
                    <td className="px-4 py-3 text-neutral-600">{rec.clinicalAction}</td>
                    <td className="whitespace-nowrap px-4 py-3 font-semibold text-[#034751]">{rec.due}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </div>
  );
}

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
      <div className="mt-5 overflow-hidden rounded-lg border border-neutral-200">
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
        <defs>
          <linearGradient id={`fill-${row.metric.replace(/\W/g, "")}`} x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor={row.color} stopOpacity={0.22} />
            <stop offset="100%" stopColor={row.color} stopOpacity={0.02} />
          </linearGradient>
        </defs>
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

export default function PatientDetailPage() {
  const { id } = useParams();
  const patient = getPatientById(id);
  const owner = getPrimaryClient(patient);
  const [tab, setTab] = useState<(typeof tabs)[number]["id"]>("overview");
  const compactAlerts = useMemo(() => patient.alerts.slice(0, 4), [patient.alerts]);

  return (
    <div className="h-full overflow-y-auto bg-[#F7F9F8]">
      <div className="mx-auto max-w-[1540px] p-6">
        <Link to="/patients" className="mb-4 inline-flex items-center gap-1.5 text-sm font-semibold text-neutral-500 hover:text-[#034751]">
          <ArrowLeft className="h-4 w-4" />
          Back to Patients
        </Link>

        <section className="overflow-hidden rounded-lg border border-neutral-200 bg-white shadow-soft">
          <div className="grid gap-5 p-5 xl:grid-cols-[1fr_420px]">
            <div className="flex flex-col gap-5 md:flex-row">
              <PatientPortrait patient={patient} />
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h1 className="font-display text-[38px] font-bold leading-tight tracking-tight text-neutral-950">{patient.name}</h1>
                  <Badge variant={patient.triage === "urgent" ? "destructive" : patient.triage === "watch" ? "warning" : "success"} className="rounded-md">
                    {patient.triage === "urgent" ? "Urgent watch" : patient.triage === "watch" ? "Clinical watch" : "Stable"}
                  </Badge>
                  <Badge className={cn("rounded-md border", tierBadge(owner.membershipTier))}>{membershipLabel(owner.membershipTier)}</Badge>
                </div>
                <div className="mt-2 flex flex-wrap gap-x-5 gap-y-2 text-sm text-neutral-600">
                  <Meta icon={BadgeCheck}>{patient.breed} · {patient.ageLabel} · {sexLabel(patient.sex)}</Meta>
                  <Meta icon={ShieldCheck}>Microchip {patient.microchipId}</Meta>
                  <Meta icon={UserRound}>Owner {owner.name}</Meta>
                  <Meta icon={Stethoscope}>{patient.primaryVet}</Meta>
                </div>
                <p className="mt-4 max-w-4xl text-sm leading-6 text-neutral-600">{patient.careSummary}</p>
                <div className="mt-4 grid gap-2 md:grid-cols-2">
                  {compactAlerts.map((alert) => (
                    <AlertBanner key={`${alert.label}-${alert.detail}`} alert={alert} />
                  ))}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <StatCard label="Current weight" value={`${patient.currentWeightKg} kg`} sub={`Ideal ${patient.idealWeightKg[0]}-${patient.idealWeightKg[1]} kg`} icon={Scale} />
              <StatCard label="Insurance" value={patient.insuranceProvider ? "Active" : "None"} sub={patient.insurancePolicyNumber ?? "No policy attached"} icon={ShieldCheck} tone={patient.insuranceProvider ? "teal" : "amber"} />
              <StatCard label="Outstanding owner balance" value={owner.outstandingBalance ? vndFull(owner.outstandingBalance) : "Clear"} sub={owner.csStatus} icon={WalletCards} tone={owner.outstandingBalance ? "red" : "teal"} />
              <StatCard label="Next action" value={patient.nextBooking.split(",")[0]} sub={patient.nextBooking.includes(",") ? patient.nextBooking.split(",")[1].trim() : patient.nextBooking} icon={CalendarClock} tone="violet" />
            </div>
          </div>

          <div className="border-t border-neutral-100 px-5 py-3">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex flex-wrap gap-2">
                <Button variant="outline" size="sm">
                  <Pill className="h-4 w-4" />
                  Add medication
                </Button>
                <Button variant="outline" size="sm">
                  <FileText className="h-4 w-4" />
                  Transfer ownership
                </Button>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button variant="outline" size="sm">
                  <Printer className="h-4 w-4" />
                  Print summary
                </Button>
                <Button size="sm">
                  <Sparkles className="h-4 w-4" />
                  Generate AI report
                </Button>
              </div>
            </div>
          </div>
        </section>

        <Tabs value={tab} onValueChange={(value) => setTab(value as typeof tab)} className="mt-5">
          <TabsList className="h-auto flex-wrap justify-start rounded-lg border border-neutral-200 bg-white p-1 shadow-soft">
            {tabs.map(({ id: tabId, label, icon: Icon }) => (
              <TabsTrigger key={tabId} value={tabId} className="h-9 rounded-md px-3 data-[state=active]:bg-[#034751] data-[state=active]:text-white">
                <Icon className="h-4 w-4" />
                {label}
              </TabsTrigger>
            ))}
          </TabsList>

          <TabsContent value="overview">
            <OverviewTab patient={patient} />
          </TabsContent>
          <TabsContent value="ai">
            <AiHealthTab patient={patient} />
          </TabsContent>
          <TabsContent value="history">
            <HistoryTab patient={patient} />
          </TabsContent>
          <TabsContent value="vaccinations">
            <VaccinationsTab patient={patient} />
          </TabsContent>
          <TabsContent value="vitals">
            <VitalsTab patient={patient} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

function Meta({ icon: Icon, children }: { icon: typeof Info; children: React.ReactNode }) {
  return (
    <span className="inline-flex min-w-0 items-center gap-1.5">
      <Icon className="h-4 w-4 shrink-0 text-[#034751]" />
      <span className="truncate">{children}</span>
    </span>
  );
}
