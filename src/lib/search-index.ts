import {
  LayoutDashboard,
  CalendarDays,
  PawPrint,
  Stethoscope,
  Activity,
  LayoutGrid,
  FlaskConical,
  BedDouble,
  ReceiptText,
  CreditCard,
  ShoppingCart,
  FileText,
  Package,
  Boxes,
  ArrowLeftRight,
  ClipboardList,
  Inbox,
  CheckCheck,
  BellRing,
  Send,
  Users,
  Building2,
  Database,
  Settings2,
  Cable,
  User,
  Tag,
  Cat,
  Dog,
  Rabbit,
  Bird,
  type LucideIcon,
} from "lucide-react";
import { DICT, type Lang } from "./i18n";
import { patients, clients, type Species, type Patient } from "./patient-data";
import { consultations } from "./consultation-data";
import { invoices } from "./billing-data";
import { catalogItems, CATALOG_TYPES } from "./catalog-data";
import { branches } from "./branch-data";

// ─────────────────────────────────────────────────────────────────────────────
// Unified search index — every searchable entity in the app folds into one list.
// Pure data; the palette UI consumes runSearch() + the highlight helpers.
// ─────────────────────────────────────────────────────────────────────────────

export type SearchType = "feature" | "patient" | "client" | "consult" | "invoice" | "catalog" | "branch";

export const GROUP_ORDER: SearchType[] = ["feature", "patient", "client", "consult", "invoice", "catalog", "branch"];

export const GROUP_LABEL_KEY: Record<SearchType, string> = {
  feature: "search.grp.feature",
  patient: "search.grp.patient",
  client: "search.grp.client",
  consult: "search.grp.consult",
  invoice: "search.grp.invoice",
  catalog: "search.grp.catalog",
  branch: "search.grp.branch",
};

export type SearchEntry = {
  id: string;
  type: SearchType;
  to: string;
  icon: LucideIcon;
  title: string;
  subtitle: string;
  keywords: string; // pre-folded, lowercase — all langs + ids concatenated
  exact: string; // folded id / code for exact-match boost
  tone?: Patient["photoTone"]; // patient → gradient portrait tile (no real images exist)
  initials?: string; // client → initials avatar
};

// ── Vietnamese-aware folding ─────────────────────────────────────────────────
// Strips combining diacritics and maps đ→d so "benh nhan" matches "Bệnh nhân".
export function fold(s: string): string {
  return s
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .replace(/đ/g, "d")
    .replace(/Đ/g, "d")
    .toLowerCase();
}

// Folds while keeping a per-character map back to the ORIGINAL string indices,
// so highlights land on the accented source text, not the folded version.
export function foldWithMap(s: string): { folded: string; map: number[] } {
  let folded = "";
  const map: number[] = [];
  for (let i = 0; i < s.length; i++) {
    const f = fold(s[i]);
    for (let j = 0; j < f.length; j++) {
      folded += f[j];
      map.push(i);
    }
  }
  return { folded, map };
}

const SPECIES_LABEL: Record<Species, { en: string; vi: string }> = {
  dog: { en: "Dog", vi: "Chó" },
  cat: { en: "Cat", vi: "Mèo" },
  rabbit: { en: "Rabbit", vi: "Thỏ" },
  bird: { en: "Bird", vi: "Chim" },
  reptile: { en: "Reptile", vi: "Bò sát" },
  other: { en: "Other", vi: "Khác" },
};

// Searchable app destinations — mirrors the nav, minus the "coming soon" (phase 2) leaves.
const FEATURES: { to: string; key: string; icon: LucideIcon }[] = [
  { to: "/dashboard", key: "nav.dashboard", icon: LayoutDashboard },
  { to: "/schedule", key: "nav.schedule", icon: CalendarDays },
  { to: "/patients", key: "nav.patients", icon: PawPrint },
  { to: "/consultations/all", key: "nav.consult.all", icon: Stethoscope },
  { to: "/consultations/in-progress", key: "nav.consult.inprogress", icon: Activity },
  { to: "/consultations/procedures", key: "nav.consult.procedures", icon: LayoutGrid },
  { to: "/lab", key: "nav.lab", icon: FlaskConical },
  { to: "/ipd", key: "nav.ipd", icon: BedDouble },
  { to: "/billing/invoices", key: "nav.bill.invoices", icon: ReceiptText },
  { to: "/billing/payments", key: "nav.bill.payments", icon: CreditCard },
  { to: "/billing/counter-sales", key: "nav.bill.counter", icon: ShoppingCart },
  { to: "/billing/e-invoice", key: "nav.bill.einvoice", icon: FileText },
  { to: "/inventory/products", key: "nav.inv.products", icon: Package },
  { to: "/inventory/stock", key: "nav.inv.stock", icon: Boxes },
  { to: "/inventory/movements", key: "nav.inv.movements", icon: ArrowLeftRight },
  { to: "/inventory/purchase-orders", key: "nav.inv.po", icon: ClipboardList },
  { to: "/communications/inbox", key: "nav.comm.inbox", icon: Inbox },
  { to: "/communications/approval-queue", key: "nav.comm.approval", icon: CheckCheck },
  { to: "/communications/reminders", key: "nav.comm.reminders", icon: BellRing },
  { to: "/communications/bulk-send", key: "nav.comm.bulk", icon: Send },
  { to: "/communications/templates", key: "nav.comm.templates", icon: FileText },
  { to: "/forms", key: "nav.forms", icon: FileText },
  { to: "/admin/users", key: "nav.admin.users", icon: Users },
  { to: "/admin/branches", key: "nav.admin.branches", icon: Building2 },
  { to: "/admin/registry", key: "nav.admin.registry", icon: Database },
  { to: "/admin/settings", key: "nav.admin.settings", icon: Settings2 },
  { to: "/admin/integrations", key: "nav.admin.integrations", icon: Cable },
];

function speciesIcon(s: Species): LucideIcon {
  if (s === "cat") return Cat;
  if (s === "rabbit") return Rabbit;
  if (s === "bird") return Bird;
  if (s === "dog") return Dog;
  return PawPrint;
}

function initialsOf(name: string): string {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase();
}

// A client has no dedicated page yet → open their first pet's record.
function clientRoute(clientId: string): string {
  const pet = patients.find((p) => p.contacts.some((c) => c.clientId === clientId));
  return pet ? `/patients/${pet.id}` : "/patients";
}

function vnd(n: number): string {
  return n.toLocaleString("vi-VN") + "₫";
}

export function buildIndex(lang: Lang, t: (k: string) => string): SearchEntry[] {
  const other: Lang = lang === "en" ? "vi" : "en";
  const out: SearchEntry[] = [];

  // Features / pages — title in current lang, subtitle shows the other lang label.
  for (const f of FEATURES) {
    const d = DICT[f.key];
    out.push({
      id: `feature:${f.to}`,
      type: "feature",
      to: f.to,
      icon: f.icon,
      title: d?.[lang] ?? f.key,
      subtitle: d?.[other] ?? "",
      keywords: fold([d?.en, d?.vi, f.to].filter(Boolean).join(" ")),
      exact: "",
    });
  }

  for (const p of patients) {
    const sp = SPECIES_LABEL[p.species][lang];
    out.push({
      id: `patient:${p.id}`,
      type: "patient",
      to: `/patients/${p.id}`,
      icon: speciesIcon(p.species),
      title: p.name,
      subtitle: `${sp} · ${p.breed} · ${p.id}`,
      keywords: fold([p.name, p.breed, p.id, p.microchipId, p.color, p.primaryVet].join(" ")),
      exact: fold(p.id),
      tone: p.photoTone,
    });
  }

  for (const c of clients) {
    out.push({
      id: `client:${c.id}`,
      type: "client",
      to: clientRoute(c.id),
      icon: User,
      title: c.name,
      subtitle: `${c.phone} · ${c.id}`,
      keywords: fold([c.name, c.phone, c.email, c.id].join(" ")),
      exact: fold(c.id),
      initials: initialsOf(c.name),
    });
  }

  for (const c of consultations) {
    out.push({
      id: `consult:${c.id}`,
      type: "consult",
      to: `/consultations/${c.id}`,
      icon: Stethoscope,
      title: `${c.id} · ${c.patient}`,
      subtitle: `${c.owner} · ${c.vet} · ${c.reason}`,
      keywords: fold([c.id, c.patient, c.owner, c.vet, c.reason, c.breed].join(" ")),
      exact: fold(c.id),
    });
  }

  for (const inv of invoices) {
    out.push({
      id: `invoice:${inv.id}`,
      type: "invoice",
      to: "/billing/invoices",
      icon: ReceiptText,
      title: `${inv.id} · ${inv.pet}`,
      subtitle: `${inv.owner} · ${vnd(inv.amount)}`,
      keywords: fold([inv.id, inv.pet, inv.owner].join(" ")),
      exact: fold(inv.id),
    });
  }

  const typeLabel = (id: string) => {
    const m = CATALOG_TYPES.find((x) => x.id === id);
    return m ? t(m.labelKey) : id;
  };
  for (const it of catalogItems) {
    out.push({
      id: `catalog:${it.id}`,
      type: "catalog",
      to: "/admin/registry",
      icon: Tag,
      title: it.name[lang],
      subtitle: `${it.code} · ${typeLabel(it.type)}`,
      keywords: fold([it.name.en, it.name.vi, it.code].join(" ")),
      exact: fold(it.code),
    });
  }

  for (const b of branches) {
    out.push({
      id: `branch:${b.id}`,
      type: "branch",
      to: "/admin/branches",
      icon: Building2,
      title: b.name,
      subtitle: `${b.code} · ${b.city}`,
      keywords: fold([b.name, b.code, b.city, b.district].join(" ")),
      exact: fold(b.code),
    });
  }

  return out;
}

// ── Query ────────────────────────────────────────────────────────────────────
export type Grouped = { type: SearchType; entries: SearchEntry[] };

const PER_GROUP = 6;

function score(e: SearchEntry, fq: string): number {
  if (e.exact && e.exact === fq) return 100;
  const titleF = fold(e.title);
  if (titleF.startsWith(fq)) return 80;
  if (titleF.includes(fq)) return 60;
  if (e.keywords.includes(fq)) return 40;
  return -1;
}

export function runSearch(index: SearchEntry[], query: string): Grouped[] {
  const fq = fold(query.trim());
  if (!fq) return [];

  const scored = index
    .map((e) => ({ e, s: score(e, fq) }))
    .filter((x) => x.s >= 0)
    .sort((a, b) => b.s - a.s || a.e.title.localeCompare(b.e.title));

  const groups: Grouped[] = [];
  for (const type of GROUP_ORDER) {
    const entries = scored.filter((x) => x.e.type === type).slice(0, PER_GROUP).map((x) => x.e);
    if (entries.length) groups.push({ type, entries });
  }
  return groups;
}
