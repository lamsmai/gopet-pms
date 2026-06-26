import { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  AlertTriangle,
  CalendarClock,
  Cat,
  ChevronRight,
  ClipboardList,
  Columns3,
  Dog,
  Download,
  Filter,
  HeartPulse,
  LayoutGrid,
  List,
  MoreHorizontal,
  PawPrint,
  Phone,
  Plus,
  Rabbit,
  Search,
  ShieldCheck,
  SlidersHorizontal,
  Sparkles,
  Stethoscope,
  UserRound,
  WalletCards,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn, vndFull } from "@/lib/utils";
import {
  clients,
  getPrimaryClient,
  membershipLabel,
  patients,
  sexLabel,
  type Client,
  type MembershipTier,
  type Patient,
  type Species,
} from "@/lib/patient-data";

type DirectoryTab = "pets" | "owners";
type SpeciesFilter = "all" | Extract<Species, "dog" | "cat" | "rabbit">;
type OwnerFilter = "all" | "vip" | "outstanding";

const speciesFilters: { id: SpeciesFilter; label: string; icon: typeof PawPrint }[] = [
  { id: "all", label: "All", icon: PawPrint },
  { id: "dog", label: "Dog", icon: Dog },
  { id: "cat", label: "Cat", icon: Cat },
  { id: "rabbit", label: "Rabbit", icon: Rabbit },
];

const ownerFilters: { id: OwnerFilter; label: string }[] = [
  { id: "all", label: "All" },
  { id: "vip", label: "VIP" },
  { id: "outstanding", label: "Has outstanding" },
];

const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");

function toneClasses(tone: Patient["photoTone"]) {
  return {
    teal: "from-[#034751] via-[#0F8C86] to-[#A8DBD6]",
    violet: "from-[#4B3D75] via-[#785AA6] to-[#D8CEF0]",
    amber: "from-[#7A4A12] via-[#D8872B] to-[#F5D7A6]",
    rose: "from-[#74304E] via-[#B64268] to-[#F3B7C8]",
  }[tone];
}

function speciesIcon(species: Species) {
  if (species === "cat") return Cat;
  if (species === "rabbit") return Rabbit;
  return Dog;
}

function tierBadge(tier: MembershipTier) {
  if (tier === "platinum") return "border-[#48405F] bg-[#48405F] text-white";
  if (tier === "gold") return "border-[#B7791F] bg-[#FFF4D8] text-[#8A5300]";
  if (tier === "silver") return "border-[#A7B0BC] bg-[#F3F6F8] text-[#586575]";
  return "border-neutral-200 bg-white text-neutral-500";
}

function PatientPortrait({ patient, size = "lg" }: { patient: Patient; size?: "md" | "lg" }) {
  const Icon = speciesIcon(patient.species);
  return (
    <div
      className={cn(
        "relative shrink-0 overflow-hidden rounded-lg bg-gradient-to-br shadow-inner",
        toneClasses(patient.photoTone),
        size === "lg" ? "h-[92px] w-[92px]" : "h-12 w-12"
      )}
    >
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(255,255,255,0.45),transparent_34%),linear-gradient(135deg,rgba(255,255,255,0.16),transparent_55%)]" />
      <Icon className={cn("absolute text-white/92", size === "lg" ? "bottom-4 left-4 h-12 w-12" : "bottom-2 left-2 h-7 w-7")} />
      <div className="absolute bottom-2 right-2 rounded-md bg-black/20 px-1.5 py-0.5 font-mono text-[10px] font-bold uppercase text-white/90">
        {patient.id.replace("PAT-", "")}
      </div>
    </div>
  );
}

function PatientCard({ patient }: { patient: Patient }) {
  const client = getPrimaryClient(patient);
  const alertCount = patient.allergies.length + patient.chronicConditions.length + (patient.behavioralWarning ? 1 : 0);
  const urgent = patient.triage === "urgent";
  const watch = patient.triage === "watch";

  return (
    <Link
      to={`/patients/${patient.id}`}
      className="group grid min-h-[256px] grid-rows-[auto_1fr_auto] rounded-lg border border-neutral-200 bg-white p-4 shadow-soft transition-all hover:-translate-y-0.5 hover:border-[#034751]/40 hover:shadow-lift"
    >
      <div className="flex items-start gap-4">
        <PatientPortrait patient={patient} />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="truncate font-display text-[22px] font-bold leading-tight tracking-tight text-neutral-950 group-hover:text-[#034751]">
              {patient.name}
            </h3>
            <span className={cn("rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide", tierBadge(client.membershipTier))}>
              {membershipLabel(client.membershipTier)}
            </span>
          </div>
          <div className="mt-1 text-sm text-neutral-500">
            {patient.breed} · {patient.ageLabel} · {sexLabel(patient.sex)}
          </div>
          <div className="mt-2 flex flex-wrap items-center gap-1.5">
            <Badge variant={urgent ? "destructive" : watch ? "warning" : "success"} className="rounded-md">
              {urgent ? "Urgent watch" : watch ? "Clinical watch" : "Stable"}
            </Badge>
            {alertCount > 0 && (
              <Badge variant="destructive" className="rounded-md">
                <AlertTriangle className="h-3 w-3" />
                {alertCount} alerts
              </Badge>
            )}
          </div>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-3 text-[13px]">
        <InfoTile label="Owner" value={client.name} icon={UserRound} accent />
        <InfoTile label="Last visit" value={patient.lastVisit} icon={CalendarClock} />
        <InfoTile label="Current weight" value={`${patient.currentWeightKg} kg`} icon={HeartPulse} />
        <InfoTile label="Microchip" value={patient.microchipId} icon={ShieldCheck} mono />
      </div>

      <div className="mt-4 flex items-center justify-between border-t border-neutral-100 pt-3">
        <div className="min-w-0">
          <div className="truncate text-[12px] font-semibold text-neutral-900">{patient.primaryVet}</div>
          <div className="truncate text-[11px] text-neutral-500">{patient.nextBooking}</div>
        </div>
        <span className="inline-flex items-center gap-1 rounded-md bg-[#034751] px-2.5 py-1.5 text-[12px] font-semibold text-white">
          Open
          <ChevronRight className="h-3.5 w-3.5" />
        </span>
      </div>
    </Link>
  );
}

function InfoTile({
  label,
  value,
  icon: Icon,
  accent,
  mono,
}: {
  label: string;
  value: string;
  icon: typeof UserRound;
  accent?: boolean;
  mono?: boolean;
}) {
  return (
    <div className="min-w-0 rounded-md border border-neutral-100 bg-neutral-50 px-3 py-2">
      <div className="flex items-center gap-1.5 text-[11px] font-medium text-neutral-400">
        <Icon className={cn("h-3.5 w-3.5", accent && "text-[#034751]")} />
        {label}
      </div>
      <div className={cn("mt-1 truncate font-semibold text-neutral-800", mono && "font-mono text-[12px]")}>{value}</div>
    </div>
  );
}

function OwnerRow({ client }: { client: Client }) {
  const navigate = useNavigate();
  const ownerPatients = patients.filter((patient) => patient.contacts.some((contact) => contact.clientId === client.id));
  const primaryPatient = ownerPatients[0];
  return (
    <tr className="border-b border-neutral-100 text-sm last:border-0 hover:bg-[#034751]/[0.035]">
      <td className="px-4 py-3">
        <input type="checkbox" className="h-4 w-4 rounded border-neutral-300 text-[#034751] focus:ring-[#034751]" />
      </td>
      <td className="px-4 py-3">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#034751] text-sm font-bold text-white">
            {client.name.split(" ").map((part) => part[0]).slice(0, 2).join("")}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => primaryPatient && navigate(`/patients/${primaryPatient.id}`)}
                className="font-semibold text-neutral-900 hover:text-[#034751] hover:underline"
              >
                {client.name}
              </button>
              <span className={cn("rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide", tierBadge(client.membershipTier))}>
                {membershipLabel(client.membershipTier)}
              </span>
            </div>
            <div className="mt-0.5 text-[12px] text-neutral-500">{client.csStatus}</div>
          </div>
        </div>
      </td>
      <td className="whitespace-nowrap px-4 py-3 text-neutral-700">{client.phone}</td>
      <td className="px-4 py-3 text-neutral-600">{client.email}</td>
      <td className="px-4 py-3 text-center font-semibold tnum text-neutral-800">{client.petCount}</td>
      <td className={cn("whitespace-nowrap px-4 py-3 font-semibold tnum", client.outstandingBalance > 0 ? "text-red-600" : "text-emerald-700")}>
        {client.outstandingBalance > 0 ? vndFull(client.outstandingBalance) : "Clear"}
      </td>
      <td className="whitespace-nowrap px-4 py-3 text-neutral-500">{client.lastVisit}</td>
      <td className="px-4 py-3 text-right">
        <div className="inline-flex items-center gap-1">
          <button title="Call client" className="flex h-8 w-8 items-center justify-center rounded-md border border-neutral-200 bg-white text-neutral-500 hover:border-[#034751] hover:text-[#034751]">
            <Phone className="h-4 w-4" />
          </button>
          <button title="More actions" className="flex h-8 w-8 items-center justify-center rounded-md border border-neutral-200 bg-white text-neutral-500 hover:border-[#034751] hover:text-[#034751]">
            <MoreHorizontal className="h-4 w-4" />
          </button>
        </div>
      </td>
    </tr>
  );
}

function ClientCard({ client }: { client: Client }) {
  const navigate = useNavigate();
  const owned = patients.filter((patient) => patient.contacts.some((contact) => contact.clientId === client.id));
  const primary = owned[0];
  const initials = client.name.split(" ").map((part) => part[0]).slice(0, 2).join("").toUpperCase();
  const hasOutstanding = client.outstandingBalance > 0;

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => primary && navigate(`/patients/${primary.id}`)}
      onKeyDown={(event) => {
        if ((event.key === "Enter" || event.key === " ") && primary) {
          event.preventDefault();
          navigate(`/patients/${primary.id}`);
        }
      }}
      className="group grid min-h-[256px] cursor-pointer grid-rows-[auto_1fr_auto] rounded-lg border border-neutral-200 bg-white p-4 shadow-soft transition-all hover:-translate-y-0.5 hover:border-[#034751]/40 hover:shadow-lift focus:outline-none focus-visible:border-[#034751] focus-visible:ring-2 focus-visible:ring-[#034751]/20"
    >
      <div className="flex items-start gap-4">
        <div className="relative flex h-[64px] w-[64px] shrink-0 items-center justify-center overflow-hidden rounded-lg bg-gradient-to-br from-[#034751] via-[#0F8C86] to-[#7FC9C0] text-2xl font-bold text-white shadow-inner">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(255,255,255,0.4),transparent_40%)]" />
          <span className="relative">{initials}</span>
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="truncate font-display text-[22px] font-bold leading-tight tracking-tight text-neutral-950 group-hover:text-[#034751]">
              {client.name}
            </h3>
            <span className={cn("rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide", tierBadge(client.membershipTier))}>
              {membershipLabel(client.membershipTier)}
            </span>
          </div>
          <div className="mt-1 flex items-center gap-2 text-sm text-neutral-500">
            <Phone className="h-3.5 w-3.5 shrink-0" />
            <span className="truncate">{client.phone}</span>
            <span className="rounded bg-neutral-100 px-1.5 py-0.5 text-[10px] font-bold uppercase text-neutral-500">{client.preferredLanguage}</span>
          </div>
          <div className="mt-2">
            <Badge variant={hasOutstanding ? "destructive" : "success"} className="rounded-md">
              {hasOutstanding ? "Has outstanding" : "Account clear"}
            </Badge>
          </div>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-3 text-[13px]">
        <InfoTile label="Pets" value={String(client.petCount)} icon={PawPrint} accent />
        <InfoTile label="Last visit" value={client.lastVisit} icon={CalendarClock} />
        <InfoTile label="Outstanding" value={hasOutstanding ? vndFull(client.outstandingBalance) : "Clear"} icon={WalletCards} />
        <InfoTile label="Lifetime spend" value={vndFull(client.lifetimeSpend)} icon={Sparkles} />
      </div>

      <div className="mt-4 flex items-center justify-between border-t border-neutral-100 pt-3">
        <div className="min-w-0">
          <div className="truncate text-[12px] font-semibold text-neutral-900">{client.preferredVet}</div>
          <div className="truncate text-[11px] text-neutral-500">{client.csStatus}</div>
        </div>
        <span className="inline-flex items-center gap-1 rounded-md bg-[#034751] px-2.5 py-1.5 text-[12px] font-semibold text-white">
          Open
          <ChevronRight className="h-3.5 w-3.5" />
        </span>
      </div>
    </div>
  );
}

export default function PatientsPage() {
  const [tab, setTab] = useState<DirectoryTab>("pets");
  const [species, setSpecies] = useState<SpeciesFilter>("all");
  const [ownerFilter, setOwnerFilter] = useState<OwnerFilter>("all");
  const [ownerView, setOwnerView] = useState<"grid" | "list">("grid");
  const [query, setQuery] = useState("");

  const filteredPatients = useMemo(() => {
    const q = query.trim().toLowerCase();
    return patients.filter((patient) => {
      const client = getPrimaryClient(patient);
      if (species !== "all" && patient.species !== species) return false;
      if (!q) return true;
      return [patient.name, patient.id, patient.breed, patient.microchipId, client.name, client.phone].some((field) =>
        field.toLowerCase().includes(q)
      );
    });
  }, [query, species]);

  const filteredClients = useMemo(() => {
    const q = query.trim().toLowerCase();
    return clients.filter((client) => {
      if (ownerFilter === "vip" && client.membershipTier === "none") return false;
      if (ownerFilter === "outstanding" && client.outstandingBalance <= 0) return false;
      if (!q) return true;
      return [client.name, client.phone, client.email, client.csStatus].some((field) => field.toLowerCase().includes(q));
    });
  }, [ownerFilter, query]);

  const urgentCount = patients.filter((patient) => patient.triage === "urgent").length;
  const watchCount = patients.filter((patient) => patient.triage === "watch").length;
  const outstandingCount = clients.filter((client) => client.outstandingBalance > 0).length;

  return (
    <div className="h-full overflow-y-auto bg-[#F7F9F8]">
      <div className="mx-auto flex max-w-[1500px] flex-col gap-5 p-6">
        <section className="relative overflow-hidden rounded-lg border border-[#0E5F5A]/15 bg-white">
          <div className="absolute inset-y-0 right-0 hidden w-[42%] bg-[linear-gradient(135deg,rgba(3,71,81,0.08),rgba(216,135,43,0.12)),radial-gradient(circle_at_70%_30%,rgba(74,186,122,0.28),transparent_36%)] lg:block" />
          <div className="relative grid gap-5 p-5 lg:grid-cols-[1fr_420px]">
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center gap-1.5 rounded-md bg-[#034751]/10 px-2.5 py-1 text-[12px] font-bold text-[#034751]">
                  <PawPrint className="h-3.5 w-3.5" />
                  Patients & Clients
                </span>
                <span className="rounded-md bg-white px-2.5 py-1 text-[12px] font-semibold text-neutral-500 ring-1 ring-neutral-200">
                  Many-to-many ownership ready
                </span>
              </div>
              <h1 className="mt-3 font-display text-[34px] font-bold leading-tight tracking-tight text-neutral-950">
                Clinical registry for fast patient review
              </h1>
              <p className="mt-2 max-w-3xl text-sm leading-6 text-neutral-600">
                Designed for Vet, Nurse and CS teams to scan patient risk, owner context, medical continuity and next actions without opening multiple modules.
              </p>
            </div>
            <div className="grid grid-cols-3 gap-2 self-end">
              <KpiTile label="Urgent watch" value={urgentCount} tone="red" icon={AlertTriangle} />
              <KpiTile label="Clinical watch" value={watchCount} tone="amber" icon={HeartPulse} />
              <KpiTile label="Outstanding" value={outstandingCount} tone="teal" icon={WalletCards} />
            </div>
          </div>
        </section>

        <section className="rounded-lg border border-neutral-200 bg-white p-3 shadow-soft">
          <div className="flex flex-wrap items-center gap-3">
            <div className="inline-flex rounded-lg bg-neutral-100 p-1">
              {(["pets", "owners"] as const).map((item) => (
                <button
                  key={item}
                  onClick={() => setTab(item)}
                  className={cn(
                    "inline-flex h-9 items-center gap-2 rounded-md px-3 text-sm font-semibold transition-colors",
                    tab === item ? "bg-white text-[#034751] shadow-soft" : "text-neutral-500 hover:text-neutral-900"
                  )}
                >
                  {item === "pets" ? <PawPrint className="h-4 w-4" /> : <UserRound className="h-4 w-4" />}
                  {item === "pets" ? "Pets Directory" : "Owners Directory"}
                </button>
              ))}
            </div>

            <div className="relative min-w-[260px] flex-1">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder={tab === "pets" ? "Search pet, owner, microchip..." : "Search owner, phone, email..."}
                className="h-10 w-full rounded-lg border border-neutral-200 bg-white pl-9 pr-3 text-sm text-neutral-800 placeholder:text-neutral-400 focus:border-[#034751] focus:outline-none focus:ring-2 focus:ring-[#034751]/20"
              />
            </div>

            {tab === "owners" && (
              <div className="inline-flex rounded-lg border border-neutral-200 bg-white p-0.5">
                {(["grid", "list"] as const).map((view) => (
                  <button
                    key={view}
                    onClick={() => setOwnerView(view)}
                    title={view === "grid" ? "Grid view" : "List view"}
                    aria-label={view === "grid" ? "Grid view" : "List view"}
                    aria-pressed={ownerView === view}
                    className={cn(
                      "flex h-8 w-8 items-center justify-center rounded-md transition-colors",
                      ownerView === view ? "bg-[#034751] text-white" : "text-neutral-500 hover:text-[#034751]"
                    )}
                  >
                    {view === "grid" ? <LayoutGrid className="h-4 w-4" /> : <List className="h-4 w-4" />}
                  </button>
                ))}
              </div>
            )}

            <Button variant="outline" className="gap-2">
              <Columns3 className="h-4 w-4" />
              Columns
            </Button>
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              {tab === "pets" ? "New patient" : "New client"}
            </Button>
          </div>

          <div className="mt-3 flex flex-wrap items-center justify-between gap-3 border-t border-neutral-100 pt-3">
            {tab === "pets" ? (
              <div className="flex flex-wrap items-center gap-2">
                {speciesFilters.map(({ id, label, icon: Icon }) => (
                  <button
                    key={id}
                    onClick={() => setSpecies(id)}
                    className={cn(
                      "inline-flex h-8 items-center gap-1.5 rounded-full border px-3 text-[13px] font-semibold transition-colors",
                      species === id
                        ? "border-[#034751] bg-[#034751] text-white"
                        : "border-neutral-200 bg-white text-neutral-600 hover:border-[#034751]/40 hover:text-[#034751]"
                    )}
                  >
                    <Icon className="h-3.5 w-3.5" />
                    {label}
                  </button>
                ))}
              </div>
            ) : (
              <div className="flex flex-wrap items-center gap-2">
                {ownerFilters.map((filter) => (
                  <button
                    key={filter.id}
                    onClick={() => setOwnerFilter(filter.id)}
                    className={cn(
                      "inline-flex h-8 items-center gap-1.5 rounded-full border px-3 text-[13px] font-semibold transition-colors",
                      ownerFilter === filter.id
                        ? "border-[#034751] bg-[#034751] text-white"
                        : "border-neutral-200 bg-white text-neutral-600 hover:border-[#034751]/40 hover:text-[#034751]"
                    )}
                  >
                    <Filter className="h-3.5 w-3.5" />
                    {filter.label}
                  </button>
                ))}
                <div className="ml-1 hidden items-center gap-0.5 rounded-full border border-neutral-200 bg-neutral-50 px-2 py-1 xl:flex">
                  {alphabet.map((letter) => (
                    <button key={letter} className="h-5 w-5 rounded text-[10px] font-bold text-neutral-400 hover:bg-white hover:text-[#034751]">
                      {letter}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div className="flex flex-wrap items-center gap-2">
              <Button variant="outline" size="sm" className="gap-1.5">
                <SlidersHorizontal className="h-3.5 w-3.5" />
                Saved view: Vet review
              </Button>
              <Button variant="outline" size="sm" className="gap-1.5">
                <Download className="h-3.5 w-3.5" />
                Export
              </Button>
            </div>
          </div>
        </section>

        {tab === "pets" ? (
          <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {filteredPatients.map((patient) => (
              <PatientCard key={patient.id} patient={patient} />
            ))}
          </section>
        ) : ownerView === "grid" ? (
          <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {filteredClients.map((client) => (
              <ClientCard key={client.id} client={client} />
            ))}
          </section>
        ) : (
          <section className="overflow-hidden rounded-lg border border-neutral-200 bg-white shadow-soft">
            <table className="w-full border-collapse text-left">
              <thead>
                <tr className="border-b border-neutral-200 bg-neutral-50 text-[11px] font-bold uppercase tracking-wide text-neutral-400">
                  <th className="w-10 px-4 py-3" />
                  <th className="px-4 py-3">Client</th>
                  <th className="px-4 py-3">Phone</th>
                  <th className="px-4 py-3">Email</th>
                  <th className="px-4 py-3 text-center">Pets</th>
                  <th className="px-4 py-3">Outstanding</th>
                  <th className="px-4 py-3">Last visit</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredClients.map((client) => (
                  <OwnerRow key={client.id} client={client} />
                ))}
              </tbody>
            </table>
          </section>
        )}
      </div>
    </div>
  );
}

function KpiTile({ label, value, tone, icon: Icon }: { label: string; value: number; tone: "red" | "amber" | "teal"; icon: typeof Sparkles }) {
  return (
    <div className="rounded-lg border border-white/70 bg-white/82 p-3 shadow-soft backdrop-blur">
      <div
        className={cn(
          "mb-2 flex h-8 w-8 items-center justify-center rounded-md",
          tone === "red" && "bg-red-50 text-red-600",
          tone === "amber" && "bg-amber-50 text-amber-700",
          tone === "teal" && "bg-[#034751]/10 text-[#034751]"
        )}
      >
        <Icon className="h-4 w-4" />
      </div>
      <div className="text-2xl font-bold leading-none tnum text-neutral-950">{value}</div>
      <div className="mt-1 text-[11px] font-semibold text-neutral-500">{label}</div>
    </div>
  );
}

