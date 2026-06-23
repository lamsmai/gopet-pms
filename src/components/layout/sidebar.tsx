import { useEffect, useState } from "react";
import { NavLink, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  CalendarDays,
  PawPrint,
  Stethoscope,
  FlaskConical,
  BedDouble,
  Hotel,
  Scissors,
  Car,
  ReceiptText,
  Package,
  BarChart3,
  Smile,
  MessageSquare,
  FileText,
  ShieldCheck,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  LogOut,
  Lock,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Mark } from "@/components/shared/brand-mark";
import { useLang } from "@/lib/i18n";

// ── Nav model ─────────────────────────────────────────────────────────────────
type Child = { to: string; key: string; phase2?: boolean };
type Leaf = { to: string; icon: LucideIcon; key: string; badge?: number; phase2?: boolean };
type Group = { id: string; icon: LucideIcon; key: string; badge?: number; children: Child[] };
type Item = Leaf | Group;
const isGroup = (i: Item): i is Group => "children" in i;

const SECTIONS: { label: string; items: Item[] }[] = [
  {
    label: "sec.operations",
    items: [
      { to: "/dashboard", icon: LayoutDashboard, key: "nav.dashboard" },
      { to: "/schedule", icon: CalendarDays, key: "nav.schedule" },
      { to: "/patients", icon: PawPrint, key: "nav.patients" },
      {
        id: "consult", icon: Stethoscope, key: "nav.consultations",
        children: [
          { to: "/consultations/all", key: "nav.consult.all" },
          { to: "/consultations/in-progress", key: "nav.consult.inprogress" },
          { to: "/consultations/procedures", key: "nav.consult.procedures" },
        ],
      },
    ],
  },
  {
    label: "sec.clinical",
    items: [
      { to: "/lab", icon: FlaskConical, key: "nav.lab" },
      { to: "/ipd", icon: BedDouble, key: "nav.ipd" },
    ],
  },
  {
    label: "sec.services",
    items: [
      { to: "/boarding", icon: Hotel, key: "nav.boarding", phase2: true },
      { to: "/grooming", icon: Scissors, key: "nav.grooming", phase2: true },
      { to: "/pet-taxi", icon: Car, key: "nav.pettaxi", phase2: true },
    ],
  },
  {
    label: "sec.commerce",
    items: [
      {
        id: "billing", icon: ReceiptText, key: "nav.billing",
        children: [
          { to: "/billing/invoices", key: "nav.bill.invoices" },
          { to: "/billing/payments", key: "nav.bill.payments" },
          { to: "/billing/counter-sales", key: "nav.bill.counter" },
          { to: "/billing/e-invoice", key: "nav.bill.einvoice" },
        ],
      },
      {
        id: "inventory", icon: Package, key: "nav.inventory",
        children: [
          { to: "/inventory/products", key: "nav.inv.products" },
          { to: "/inventory/stock", key: "nav.inv.stock" },
          { to: "/inventory/movements", key: "nav.inv.movements" },
          { to: "/inventory/purchase-orders", key: "nav.inv.po" },
        ],
      },
    ],
  },
  {
    label: "sec.insights",
    items: [
      { to: "/reports", icon: BarChart3, key: "nav.reports", phase2: true },
      { to: "/nps", icon: Smile, key: "nav.nps", phase2: true },
    ],
  },
  {
    label: "sec.engagement",
    items: [
      {
        id: "comms", icon: MessageSquare, key: "nav.comms", badge: 5,
        children: [
          { to: "/communications/inbox", key: "nav.comm.inbox" },
          { to: "/communications/approval-queue", key: "nav.comm.approval" },
          { to: "/communications/reminders", key: "nav.comm.reminders" },
          { to: "/communications/bulk-send", key: "nav.comm.bulk" },
          { to: "/communications/templates", key: "nav.comm.templates" },
        ],
      },
      { to: "/forms", icon: FileText, key: "nav.forms" },
    ],
  },
  {
    label: "sec.admin",
    items: [
      {
        id: "admin", icon: ShieldCheck, key: "nav.admin",
        children: [
          { to: "/admin/users", key: "nav.admin.users" },
          { to: "/admin/branches", key: "nav.admin.branches" },
          { to: "/admin/registry", key: "nav.admin.registry" },
          { to: "/admin/settings", key: "nav.admin.settings" },
          { to: "/admin/integrations", key: "nav.admin.integrations" },
        ],
      },
    ],
  },
];

const STORAGE_KEY = "gopet.sidebar.collapsed";

// active nav = Midnight Green #034751 · hover = 10% teal tint
const ACTIVE = "bg-[#034751] text-white shadow-sm";
const REST = "text-neutral-600 hover:bg-[#034751]/10 hover:text-[#034751]";

export function Sidebar() {
  const { t } = useLang();
  const location = useLocation();

  const [collapsed, setCollapsed] = useState<boolean>(() => {
    try { return localStorage.getItem(STORAGE_KEY) === "1"; } catch { return false; }
  });
  useEffect(() => {
    try { localStorage.setItem(STORAGE_KEY, collapsed ? "1" : "0"); } catch { /* ignore */ }
  }, [collapsed]);

  const [open, setOpen] = useState<Record<string, boolean>>({ consult: true });

  return (
    <aside
      className={cn(
        "relative z-40 hidden h-full shrink-0 flex-col border-r border-neutral-200 bg-neutral-100 lg:flex",
        "transition-[width] duration-200 ease-in-out",
        collapsed ? "w-[64px]" : "w-[248px]"
      )}
    >
      {/* Brand */}
      <div className={cn("flex h-14 items-center border-b border-neutral-200", collapsed ? "justify-center px-0" : "px-4")}>
        <Mark className="h-8 w-8 shrink-0" />
        {!collapsed && (
          <div className="ml-2.5 leading-tight">
            <div className="font-display text-[17px] font-bold tracking-tight text-neutral-900">
              GoPet <span className="text-brand">PMS</span>
            </div>
            <div className="text-[10px] font-medium uppercase tracking-wider text-neutral-400">Animal Doctor Intl.</div>
          </div>
        )}
      </div>

      {/* Navigation */}
      <nav
        className={cn(
          "flex-1 px-2.5 py-3",
          collapsed ? "overflow-visible" : "overflow-y-auto"
        )}
      >
        {SECTIONS.map((section) => (
          <div key={section.label} className="mb-3">
            {collapsed ? (
              <div className="mx-auto mb-1.5 h-px w-6 bg-neutral-200" />
            ) : (
              <div className="px-2.5 pb-1 pt-1 text-[10px] font-bold uppercase tracking-widest text-neutral-400">
                {t(section.label)}
              </div>
            )}
            <div className="space-y-0.5">
              {section.items.map((item) =>
                isGroup(item) ? (
                  <GroupRow
                    key={item.id}
                    item={item}
                    collapsed={collapsed}
                    expanded={open[item.id] ?? false}
                    onToggle={() => setOpen((s) => ({ ...s, [item.id]: !(s[item.id] ?? false) }))}
                    location={location.pathname}
                    t={t}
                  />
                ) : (
                  <LeafRow key={item.to} item={item} collapsed={collapsed} t={t} />
                )
              )}
            </div>
          </div>
        ))}
      </nav>

      {/* Footer — sign out + collapse toggle */}
      <div className="border-t border-neutral-200 p-2.5">
        <Tooltipped collapsed={collapsed} label={t("nav.signout")}>
          <button
            className={cn(
              "group/btn flex w-full items-center gap-3 rounded-lg px-2.5 py-2 text-sm font-medium text-neutral-600 transition-colors hover:bg-destructive/10 hover:text-destructive",
              collapsed && "justify-center px-0"
            )}
          >
            <LogOut className="h-[18px] w-[18px] shrink-0" />
            {!collapsed && <span>{t("nav.signout")}</span>}
          </button>
        </Tooltipped>

        <button
          onClick={() => setCollapsed((c) => !c)}
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          className={cn(
            "mt-1 flex w-full items-center gap-3 rounded-lg px-2.5 py-2 text-sm font-medium text-neutral-500 transition-colors hover:bg-neutral-200 hover:text-neutral-700",
            collapsed && "justify-center px-0"
          )}
        >
          {collapsed ? (
            <ChevronRight className="h-[18px] w-[18px] shrink-0" />
          ) : (
            <>
              <ChevronLeft className="h-[18px] w-[18px] shrink-0" />
              <span>Thu gọn</span>
            </>
          )}
        </button>
      </div>
    </aside>
  );
}

// ── Tooltip wrapper (collapsed only) ──────────────────────────────────────────
function Tooltipped({
  collapsed,
  label,
  children,
}: {
  collapsed: boolean;
  label: string;
  children: React.ReactNode;
}) {
  if (!collapsed) return <>{children}</>;
  return (
    <div className="group/tip relative">
      {children}
      <span className="pointer-events-none absolute left-full top-1/2 z-50 ml-2 -translate-y-1/2 whitespace-nowrap rounded-md bg-neutral-900 px-2 py-1 text-xs font-medium text-white opacity-0 shadow-lg transition-opacity duration-150 group-hover/tip:opacity-100">
        {label}
      </span>
    </div>
  );
}

// ── Leaf row ──────────────────────────────────────────────────────────────────
function LeafRow({ item, collapsed, t }: { item: Leaf; collapsed: boolean; t: (k: string) => string }) {
  const Icon = item.icon;

  if (item.phase2) {
    return (
      <Tooltipped collapsed={collapsed} label={`${t(item.key)} · ${t("nav.comingSoon")}`}>
        <div
          title={!collapsed ? t("nav.comingSoon") : undefined}
          className={cn(
            "flex cursor-not-allowed items-center gap-3 rounded-lg px-2.5 py-2 text-sm font-medium text-neutral-400 opacity-60",
            collapsed && "justify-center px-0"
          )}
        >
          <Icon className="h-[18px] w-[18px] shrink-0" />
          {!collapsed && (
            <>
              <span className="truncate">{t(item.key)}</span>
              <Lock className="ml-auto h-3.5 w-3.5 shrink-0 text-neutral-300" />
            </>
          )}
        </div>
      </Tooltipped>
    );
  }

  return (
    <Tooltipped collapsed={collapsed} label={t(item.key)}>
      <NavLink
        to={item.to}
        className={({ isActive }) =>
          cn(
            "group flex items-center gap-3 rounded-lg px-2.5 py-2 text-sm font-medium transition-colors",
            collapsed && "justify-center px-0",
            isActive ? ACTIVE : REST
          )
        }
      >
        {({ isActive }) => (
          <>
            <Icon className={cn("h-[18px] w-[18px] shrink-0", !isActive && "text-neutral-500 group-hover:text-current")} />
            {!collapsed && <span className="truncate">{t(item.key)}</span>}
            {!collapsed && item.badge != null && (
              <span className={cn("ml-auto flex h-5 min-w-5 items-center justify-center rounded-full px-1 text-[10px] font-bold", isActive ? "bg-white/20 text-white" : "bg-destructive text-white")}>
                {item.badge}
              </span>
            )}
          </>
        )}
      </NavLink>
    </Tooltipped>
  );
}

// ── Group row (parent + children) ─────────────────────────────────────────────
function GroupRow({
  item,
  collapsed,
  expanded,
  onToggle,
  location,
  t,
}: {
  item: Group;
  collapsed: boolean;
  expanded: boolean;
  onToggle: () => void;
  location: string;
  t: (k: string) => string;
}) {
  const Icon = item.icon;
  const childActive = item.children.some((c) => location.startsWith(c.to));

  // Collapsed → icon button with a hover flyout listing children
  if (collapsed) {
    return (
      <div className="group/fly relative">
        <button
          className={cn(
            "flex w-full items-center justify-center rounded-lg px-0 py-2 transition-colors",
            childActive ? "bg-[#034751]/10 text-[#034751]" : "text-neutral-500 hover:bg-[#034751]/10 hover:text-[#034751]"
          )}
        >
          <Icon className="h-[18px] w-[18px] shrink-0" />
        </button>
        {/* flyout */}
        <div className="invisible absolute left-full top-0 z-50 ml-2 w-56 rounded-xl border border-neutral-200 bg-white p-1.5 opacity-0 shadow-lift transition-opacity duration-150 group-hover/fly:visible group-hover/fly:opacity-100">
          <div className="px-2.5 py-1.5 text-[11px] font-bold uppercase tracking-wide text-neutral-400">{t(item.key)}</div>
          {item.children.map((c) => (
            <ChildLink key={c.to} child={c} t={t} />
          ))}
        </div>
      </div>
    );
  }

  // Expanded → toggle + slide-down children
  return (
    <div>
      <button
        onClick={onToggle}
        className={cn(
          "flex w-full items-center gap-3 rounded-lg px-2.5 py-2 text-sm font-medium transition-colors",
          childActive && !expanded ? "text-[#034751]" : "text-neutral-600 hover:bg-[#034751]/10 hover:text-[#034751]"
        )}
      >
        <Icon className={cn("h-[18px] w-[18px] shrink-0", childActive ? "text-[#034751]" : "text-neutral-500")} />
        <span className="truncate">{t(item.key)}</span>
        {item.badge != null && (
          <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-destructive px-1 text-[10px] font-bold text-white">
            {item.badge}
          </span>
        )}
        <ChevronDown className={cn("ml-auto h-4 w-4 shrink-0 text-neutral-400 transition-transform duration-200", expanded && "rotate-180")} />
      </button>

      <div
        className={cn(
          "grid transition-[grid-template-rows] duration-200 ease-out",
          expanded ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
        )}
      >
        <div className="overflow-hidden">
          <div className="mt-0.5 space-y-0.5 border-l border-neutral-200 pl-3 ml-3.5">
            {item.children.map((c) => (
              <ChildLink key={c.to} child={c} t={t} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function ChildLink({ child, t }: { child: Child; t: (k: string) => string }) {
  if (child.phase2) {
    return (
      <div
        title={t("nav.comingSoon")}
        className="flex cursor-not-allowed items-center gap-2 rounded-lg px-2.5 py-1.5 text-[13px] font-medium text-neutral-400 opacity-60"
      >
        <span className="truncate">{t(child.key)}</span>
        <Lock className="ml-auto h-3 w-3 shrink-0" />
      </div>
    );
  }
  return (
    <NavLink
      to={child.to}
      className={({ isActive }) =>
        cn(
          "block truncate rounded-lg px-2.5 py-1.5 text-[13px] font-medium transition-colors",
          isActive ? "bg-[#034751] text-white" : "text-neutral-500 hover:bg-[#034751]/10 hover:text-[#034751]"
        )
      }
    >
      {t(child.key)}
    </NavLink>
  );
}
