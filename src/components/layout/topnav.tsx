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
  MessageSquare,
  Inbox,
  BellRing,
  CheckCheck,
  Send,
  ShieldCheck,
  Users,
  Building2,
  Database,
  Settings2,
  Cable,
  ChevronDown,
  Search,
  Plus,
  Bell,
  MapPin,
  DoorOpen,
  CalendarPlus,
  User,
  KeyRound,
  LogOut,
  Check,
  Lock,
  PanelLeft,
  PanelTop,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useLang } from "@/lib/i18n";
import { useLayoutMode, LAYOUT_OPTIONS, type LayoutMode } from "@/lib/layout-mode";
import { USER } from "@/lib/data";
import { HEADER } from "@/lib/dashboard-data";
import { Mark } from "@/components/shared/brand-mark";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ContextSelect } from "./topbar";

// ── nav model ─────────────────────────────────────────────────────────────────
type Leaf = { to: string; key: string; icon: LucideIcon; phase2?: boolean };
type MenuCol = { header?: { key: string; to?: string }; items: Leaf[] };
type Menu = { id: string; labelKey: string; icon: LucideIcon; match: string[]; cols: MenuCol[]; align?: "right"; width: string };

const DIRECT: Leaf[] = [
  { to: "/dashboard", key: "nav.dashboard", icon: LayoutDashboard },
  { to: "/schedule", key: "nav.schedule", icon: CalendarDays },
  { to: "/patients", key: "nav.patients", icon: PawPrint },
];

const MENUS: Menu[] = [
  {
    id: "clinical", labelKey: "grp.clinical", icon: Stethoscope, match: ["/consultations", "/lab", "/ipd"], width: "w-[430px]",
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
  {
    id: "services", labelKey: "grp.services", icon: Sparkles, match: ["/boarding", "/grooming", "/pet-taxi"], width: "w-60",
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
    id: "commerce", labelKey: "grp.commerce", icon: ReceiptText, match: ["/billing", "/inventory"], width: "w-[470px]",
    cols: [
      {
        header: { key: "nav.billing" },
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
    ],
  },
  {
    id: "insights", labelKey: "grp.insights", icon: BarChart3, match: ["/reports", "/nps"], width: "w-60", align: "right",
    cols: [{ items: [{ to: "/reports", key: "nav.reports", icon: BarChart3, phase2: true }, { to: "/nps", key: "nav.nps", icon: Smile, phase2: true }] }],
  },
  {
    id: "engagement", labelKey: "grp.engagement", icon: MessageSquare, match: ["/communications", "/forms"], width: "w-[470px]", align: "right",
    cols: [
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
      { header: { key: "nav.forms" }, items: [{ to: "/forms", key: "nav.forms", icon: FileText }] },
    ],
  },
  {
    id: "admin", labelKey: "grp.admin", icon: ShieldCheck, match: ["/admin"], width: "w-64", align: "right",
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

const directCls = (active: boolean) =>
  cn(
    "flex items-center gap-1.5 whitespace-nowrap rounded-lg px-2.5 py-1.5 text-[13px] font-medium transition-colors",
    active ? "bg-[#034751]/10 font-semibold text-[#034751]" : "text-neutral-600 hover:bg-neutral-200/60 hover:text-neutral-900"
  );

export function TopNav() {
  const { t, lang, setLang } = useLang();
  const { mode, setMode } = useLayoutMode();
  const { pathname } = useLocation();

  return (
    <header className="relative z-40 flex shrink-0 flex-col border-b border-neutral-200 bg-neutral-100">
      {/* Row 1 — utility */}
      <div className="flex h-14 items-center gap-3 px-4">
        <div className="flex items-center gap-2.5">
          <Mark className="h-8 w-8 shrink-0" />
          <span className="font-display text-[17px] font-bold tracking-tight text-neutral-900">
            GoPet <span className="text-brand">PMS</span>
          </span>
        </div>

        <div className="ml-auto flex items-center gap-2.5">
          <ContextSelect icon={MapPin} label={t("top.branch")} value={HEADER.branch} options={["Nguyen Van Huong, D7", "Vo Van Kiet, D5", "Pham Van Dong, Thu Duc"]} />
          <ContextSelect icon={DoorOpen} label={t("top.room")} value={HEADER.room} options={["Phòng khám 1", "Phòng khám 2", "Phòng thủ thuật", "Phòng cấp cứu"]} />

          <div className="relative hidden lg:block">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
            <input
              placeholder={t("top.search")}
              className="h-9 w-[240px] rounded-lg border border-neutral-200 bg-white pl-9 pr-10 text-sm text-neutral-800 placeholder:text-neutral-400 focus:border-[#034751] focus:outline-none focus:ring-2 focus:ring-[#034751]/20"
            />
            <kbd className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 rounded border border-neutral-200 bg-neutral-50 px-1.5 py-0.5 font-mono text-[10px] text-neutral-400">⌘K</kbd>
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button className="gap-1.5">
                <Plus className="h-4 w-4" />
                <span className="hidden sm:inline">{t("top.create")}</span>
                <ChevronDown className="h-3.5 w-3.5 opacity-70" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-52">
              <DropdownMenuItem><CalendarPlus className="text-[#034751]" />{t("qc.appointment")}</DropdownMenuItem>
              <DropdownMenuItem><PawPrint className="text-[#034751]" />{t("qc.patient")}</DropdownMenuItem>
              <DropdownMenuItem><ReceiptText className="text-[#034751]" />{t("qc.invoice")}</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <button className="relative flex h-9 w-9 items-center justify-center rounded-lg border border-neutral-200 bg-white text-neutral-500 transition-colors hover:bg-neutral-50 hover:text-neutral-700">
            <Bell className="h-[18px] w-[18px]" />
            <span className="absolute -right-1.5 -top-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-destructive px-1 text-[10px] font-bold text-white">3</span>
          </button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="flex h-9 items-center gap-1 rounded-lg border border-neutral-200 bg-white px-2.5 text-sm font-semibold text-neutral-700 transition-colors hover:bg-neutral-50">
                {lang.toUpperCase()}
                <ChevronDown className="h-3.5 w-3.5 opacity-60" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-28">
              {(["en", "vi"] as const).map((l) => (
                <DropdownMenuItem key={l} onClick={() => setLang(l)} className={cn(lang === l && "bg-muted font-semibold")}>
                  {l === "en" ? "English" : "Tiếng Việt"}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          <UserMenu mode={mode} setMode={setMode} t={t} />
        </div>
      </div>

      {/* Row 2 — primary nav */}
      <nav className="flex h-11 items-center gap-0.5 border-t border-neutral-200/70 px-3">
        {DIRECT.map((d) => (
          <NavLink key={d.to} to={d.to} className={({ isActive }) => directCls(isActive)}>
            <d.icon className="h-4 w-4" />
            {t(d.key)}
          </NavLink>
        ))}
        <span className="mx-1 h-5 w-px bg-neutral-200" />
        {MENUS.map((menu) => {
          const active = menu.match.some((m) => pathname.startsWith(m));
          return (
            <div key={menu.id} className="group/m relative">
              <button className={directCls(active)}>
                <menu.icon className="h-4 w-4" />
                {t(menu.labelKey)}
                <ChevronDown className="h-3.5 w-3.5 opacity-50 transition-transform duration-200 group-hover/m:rotate-180" />
              </button>
              <div
                className={cn(
                  "invisible absolute top-full z-50 pt-2 opacity-0 transition-opacity duration-150 group-hover/m:visible group-hover/m:opacity-100 group-focus-within/m:visible group-focus-within/m:opacity-100",
                  menu.align === "right" ? "right-0" : "left-0"
                )}
              >
                <div className={cn("rounded-xl border border-neutral-200 bg-white p-2 shadow-lift", menu.width, menu.cols.length > 1 ? "grid grid-cols-2 gap-2" : "")}>
                  {menu.cols.map((col, i) => (
                    <MenuColumn key={i} col={col} t={t} />
                  ))}
                </div>
              </div>
            </div>
          );
        })}
      </nav>
    </header>
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

function UserMenu({ mode, setMode, t }: { mode: LayoutMode; setMode: (m: LayoutMode) => void; t: (k: string) => string }) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button className="flex h-9 items-center gap-2 rounded-lg border border-neutral-200 bg-white pl-1 pr-2 transition-colors hover:bg-neutral-50">
          <Avatar className="h-7 w-7">
            <AvatarFallback className="bg-[#034751] text-[11px] font-semibold text-white">{USER.initials}</AvatarFallback>
          </Avatar>
          <span className="hidden text-[13px] font-semibold text-neutral-800 lg:inline">{USER.name}</span>
          <ChevronDown className="h-3.5 w-3.5 text-neutral-400" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel>
          <div className="text-sm font-semibold text-neutral-800">{USER.name}</div>
          <div className="text-xs font-normal normal-case text-neutral-400">{t("top.role")}</div>
        </DropdownMenuLabel>
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
