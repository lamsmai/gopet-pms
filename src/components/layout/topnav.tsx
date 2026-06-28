import { NavLink, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  CalendarDays,
  PawPrint,
  Stethoscope,
  Activity,
  LayoutGrid,
  FlaskConical,
  BedDouble,
  Sparkles,
  Hotel,
  Scissors,
  Car,
  ReceiptText,
  CreditCard,
  ShoppingCart,
  FileText,
  Package,
  Boxes,
  ArrowLeftRight,
  ClipboardList,
  BarChart3,
  Smile,
  Inbox,
  BellRing,
  CheckCheck,
  Send,
  Users,
  Building2,
  Database,
  Settings2,
  Cable,
  ChevronDown,
  Plus,
  Bell,
  CalendarPlus,
  User,
  KeyRound,
  LogOut,
  Check,
  Lock,
  PanelLeft,
  PanelTop,
  Globe,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useLang, type Lang } from "@/lib/i18n";
import { useLayoutMode, LAYOUT_OPTIONS, type LayoutMode } from "@/lib/layout-mode";
import { USER } from "@/lib/data";
import { HEADER } from "@/lib/dashboard-data";
import { GopetLogo } from "@/components/shared/gopet-logo";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { SearchTrigger } from "@/components/search/command-palette";

// ── nav model ─────────────────────────────────────────────────────────────────
type Leaf = { to: string; key: string; icon: LucideIcon; phase2?: boolean };
type MenuCol = { header?: { key: string; to?: string }; items: Leaf[] };
type Menu = {
  kind: "menu";
  id: string;
  labelKey: string;
  icon: LucideIcon;
  match: string[];
  cols: MenuCol[];
  align?: "right";
  width: string;
};
type Link = { kind: "link"; to: string; key: string; icon: LucideIcon };
type Tab = Link | Menu;

// Six top-level tabs: Dashboard · Clinical · Patients · Operations · Services · Administration
const TABS: Tab[] = [
  { kind: "link", to: "/dashboard", key: "nav.dashboard", icon: LayoutDashboard },
  {
    kind: "menu", id: "clinical", labelKey: "grp.clinical", icon: Stethoscope,
    match: ["/consultations", "/lab", "/ipd"], width: "w-[430px]",
    cols: [
      {
        header: { key: "nav.consultations", to: "/consultations/all" },
        items: [
          { to: "/consultations/all", key: "nav.consult.all", icon: Stethoscope },
          { to: "/consultations/in-progress", key: "nav.consult.inprogress", icon: Activity },
          { to: "/consultations/procedures", key: "nav.consult.procedures", icon: LayoutGrid },
        ],
      },
      { items: [{ to: "/lab", key: "nav.lab", icon: FlaskConical }, { to: "/ipd", key: "nav.ipd", icon: BedDouble }] },
    ],
  },
  { kind: "link", to: "/patients", key: "nav.patients", icon: PawPrint },
  {
    kind: "menu", id: "operations", labelKey: "grp.operations", icon: ClipboardList,
    match: ["/schedule", "/billing", "/inventory", "/communications", "/forms", "/reports", "/nps"],
    width: "w-[720px]",
    cols: [
      {
        header: { key: "grp.billing", to: "/billing/invoices" },
        items: [
          { to: "/billing/invoices", key: "nav.bill.invoices", icon: ReceiptText },
          { to: "/billing/payments", key: "nav.bill.payments", icon: CreditCard },
          { to: "/billing/counter-sales", key: "nav.bill.counter", icon: ShoppingCart },
          { to: "/billing/e-invoice", key: "nav.bill.einvoice", icon: FileText },
        ],
      },
      {
        header: { key: "nav.inventory" },
        items: [
          { to: "/inventory/products", key: "nav.inv.products", icon: Package },
          { to: "/inventory/stock", key: "nav.inv.stock", icon: Boxes },
          { to: "/inventory/movements", key: "nav.inv.movements", icon: ArrowLeftRight },
          { to: "/inventory/purchase-orders", key: "nav.inv.po", icon: ClipboardList },
        ],
      },
      {
        header: { key: "nav.comms", to: "/communications/inbox" },
        items: [
          { to: "/communications/inbox", key: "nav.comm.inbox", icon: Inbox },
          { to: "/communications/approval-queue", key: "nav.comm.approval", icon: CheckCheck },
          { to: "/communications/reminders", key: "nav.comm.reminders", icon: BellRing },
          { to: "/communications/bulk-send", key: "nav.comm.bulk", icon: Send },
          { to: "/communications/templates", key: "nav.comm.templates", icon: FileText },
        ],
      },
      {
        header: { key: "grp.opsmore" },
        items: [
          { to: "/schedule", key: "nav.schedule", icon: CalendarDays },
          { to: "/forms", key: "nav.forms", icon: FileText },
          { to: "/reports", key: "nav.reports", icon: BarChart3, phase2: true },
          { to: "/nps", key: "nav.nps", icon: Smile, phase2: true },
        ],
      },
    ],
  },
  {
    kind: "menu", id: "services", labelKey: "grp.services", icon: Sparkles,
    match: ["/boarding", "/grooming", "/pet-taxi"], width: "w-60", align: "right",
    cols: [
      {
        items: [
          { to: "/boarding", key: "nav.boarding", icon: Hotel, phase2: true },
          { to: "/grooming", key: "nav.grooming", icon: Scissors, phase2: true },
          { to: "/pet-taxi", key: "nav.pettaxi", icon: Car, phase2: true },
        ],
      },
    ],
  },
  {
    kind: "menu", id: "admin", labelKey: "grp.administration", icon: Settings2,
    match: ["/admin"], width: "w-64", align: "right",
    cols: [
      {
        items: [
          { to: "/admin/users", key: "nav.admin.users", icon: Users },
          { to: "/admin/branches", key: "nav.admin.branches", icon: Building2 },
          { to: "/admin/registry", key: "nav.admin.registry", icon: Database },
          { to: "/admin/settings", key: "nav.admin.settings", icon: Settings2 },
          { to: "/admin/integrations", key: "nav.admin.integrations", icon: Cable },
        ],
      },
    ],
  },
];

const tabCls = (active: boolean) =>
  cn(
    "flex h-9 items-center gap-1.5 whitespace-nowrap rounded-lg px-2.5 text-[13px] font-medium transition-colors",
    active ? "bg-[#034751]/10 font-semibold text-[#034751]" : "text-neutral-600 hover:bg-neutral-200/60 hover:text-neutral-900"
  );

const gridCls = (n: number) =>
  n <= 1 ? "" : n === 2 ? "grid grid-cols-2 gap-2" : n === 3 ? "grid grid-cols-3 gap-2" : "grid grid-cols-4 gap-2";

// Compact 36×36 icon button shared by notification / quick-create / account.
const iconBtnCls =
  "relative flex h-9 w-9 items-center justify-center rounded-lg border border-neutral-200 bg-white text-neutral-500 transition-colors hover:bg-neutral-50 hover:text-neutral-700";

export function TopNav() {
  const { t, lang, setLang } = useLang();
  const { mode, setMode } = useLayoutMode();
  const { pathname } = useLocation();

  return (
    <header className="relative z-40 flex h-14 shrink-0 items-center gap-3 border-b border-neutral-200 bg-neutral-100 px-4">
      {/* Logo */}
      <NavLink to="/dashboard" className="shrink-0" aria-label="GoPet — Dashboard">
        <GopetLogo className="h-9" />
      </NavLink>

      {/* Primary tabs */}
      <nav className="flex items-center gap-0.5">
        {TABS.map((tab) =>
          tab.kind === "link" ? (
            <NavLink key={tab.to} to={tab.to} className={({ isActive }) => tabCls(isActive)}>
              <tab.icon className="h-4 w-4" />
              <span className="hidden xl:inline">{t(tab.key)}</span>
            </NavLink>
          ) : (
            <MenuTab key={tab.id} menu={tab} active={tab.match.some((m) => pathname.startsWith(m))} t={t} />
          )
        )}
      </nav>

      {/* Right cluster */}
      <div className="ml-auto flex items-center gap-2">
        {/* Search — 160×36 */}
        <SearchTrigger compact className="hidden w-40 md:flex" />

        {/* Notifications */}
        <button className={iconBtnCls} aria-label={t("top.notifications")}>
          <Bell className="h-[18px] w-[18px]" />
          <span className="absolute -right-1.5 -top-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-destructive px-1 text-[10px] font-bold text-white">3</span>
        </button>

        {/* Quick create */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className={iconBtnCls} aria-label={t("top.create")}>
              <Plus className="h-[18px] w-[18px]" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-52">
            <DropdownMenuLabel>{t("top.create")}</DropdownMenuLabel>
            <DropdownMenuItem><CalendarPlus className="text-[#034751]" />{t("qc.appointment")}</DropdownMenuItem>
            <DropdownMenuItem><PawPrint className="text-[#034751]" />{t("qc.patient")}</DropdownMenuItem>
            <DropdownMenuItem><ReceiptText className="text-[#034751]" />{t("qc.invoice")}</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Account */}
        <AccountMenu mode={mode} setMode={setMode} lang={lang} setLang={setLang} t={t} />
      </div>
    </header>
  );
}

function MenuTab({ menu, active, t }: { menu: Menu; active: boolean; t: (k: string) => string }) {
  return (
    <div className="group/m relative">
      <button className={tabCls(active)}>
        <menu.icon className="h-4 w-4" />
        <span className="hidden xl:inline">{t(menu.labelKey)}</span>
        <ChevronDown className="h-3.5 w-3.5 opacity-50 transition-transform duration-200 group-hover/m:rotate-180" />
      </button>
      <div
        className={cn(
          "invisible absolute top-full z-50 pt-2 opacity-0 transition-opacity duration-150 group-hover/m:visible group-hover/m:opacity-100 group-focus-within/m:visible group-focus-within/m:opacity-100",
          menu.align === "right" ? "right-0" : "left-0"
        )}
      >
        <div className={cn("rounded-xl border border-neutral-200 bg-white p-2 shadow-lift", menu.width, gridCls(menu.cols.length))}>
          {menu.cols.map((col, i) => (
            <MenuColumn key={i} col={col} t={t} />
          ))}
        </div>
      </div>
    </div>
  );
}

function MenuColumn({ col, t }: { col: MenuCol; t: (k: string) => string }) {
  return (
    <div>
      {col.header &&
        (col.header.to ? (
          <NavLink to={col.header.to} className="mb-0.5 block rounded px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide text-[#034751] hover:underline">
            {t(col.header.key)}
          </NavLink>
        ) : (
          <div className="mb-0.5 px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide text-neutral-400">{t(col.header.key)}</div>
        ))}
      <div className="space-y-0.5">
        {col.items.map((leaf) =>
          leaf.phase2 ? (
            <div key={leaf.to} title={t("nav.comingSoon")} className="flex cursor-not-allowed items-center gap-2.5 rounded-lg px-2.5 py-2 text-[13px] font-medium text-neutral-400 opacity-60">
              <leaf.icon className="h-4 w-4 shrink-0" />
              <span className="truncate">{t(leaf.key)}</span>
              <Lock className="ml-auto h-3 w-3 shrink-0" />
            </div>
          ) : (
            <NavLink
              key={leaf.to}
              to={leaf.to}
              className={({ isActive }) =>
                cn(
                  "group/leaf flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-[13px] font-medium transition-colors",
                  isActive ? "bg-[#034751] text-white" : "text-neutral-600 hover:bg-[#034751]/10 hover:text-[#034751]"
                )
              }
            >
              {({ isActive }) => (
                <>
                  <leaf.icon className={cn("h-4 w-4 shrink-0", !isActive && "text-neutral-400 group-hover/leaf:text-current")} />
                  <span className="truncate">{t(leaf.key)}</span>
                </>
              )}
            </NavLink>
          )
        )}
      </div>
    </div>
  );
}

function AccountMenu({
  mode, setMode, lang, setLang, t,
}: {
  mode: LayoutMode;
  setMode: (m: LayoutMode) => void;
  lang: Lang;
  setLang: (l: Lang) => void;
  t: (k: string) => string;
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button className="flex h-9 w-9 items-center justify-center rounded-lg border border-neutral-200 bg-white transition-colors hover:bg-neutral-50" aria-label={USER.name}>
          <Avatar className="h-7 w-7">
            <AvatarFallback className="bg-[#034751] text-[11px] font-semibold text-white">{USER.initials}</AvatarFallback>
          </Avatar>
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-60">
        <DropdownMenuLabel>
          <div className="text-sm font-semibold text-neutral-800">{USER.name}</div>
          <div className="text-xs font-normal normal-case text-neutral-400">{t("top.role")}</div>
          <div className="mt-1 text-[11px] font-normal normal-case text-neutral-400">{HEADER.branch} · {HEADER.room}</div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />

        <DropdownMenuLabel className="flex items-center gap-1.5"><Globe className="h-3.5 w-3.5" />{t("top.language")}</DropdownMenuLabel>
        {(["en", "vi"] as const).map((l) => (
          <DropdownMenuItem key={l} onClick={() => setLang(l)}>
            {l === "en" ? "English" : "Tiếng Việt"}
            {lang === l && <Check className="ml-auto !text-[#034751]" />}
          </DropdownMenuItem>
        ))}
        <DropdownMenuSeparator />

        <DropdownMenuLabel>{t("layout.label")}</DropdownMenuLabel>
        {LAYOUT_OPTIONS.map((o) => (
          <DropdownMenuItem key={o.mode} onClick={() => setMode(o.mode)}>
            {o.mode === "rail" ? <PanelLeft /> : <PanelTop />}
            {t(o.key)}
            {mode === o.mode && <Check className="ml-auto !text-[#034751]" />}
          </DropdownMenuItem>
        ))}
        <DropdownMenuSeparator />

        <DropdownMenuItem><User />{t("top.profile")}</DropdownMenuItem>
        <DropdownMenuItem><KeyRound />{t("top.changepw")}</DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem className="text-destructive focus:bg-destructive/10 focus:text-destructive">
          <LogOut className="!text-destructive" />{t("nav.signout")}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
