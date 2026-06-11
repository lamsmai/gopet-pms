import { Search, Plus, ChevronDown, Bell, MapPin, DoorOpen, CalendarPlus, PawPrint, ReceiptText, User, KeyRound, LogOut, Check, PanelLeft, PanelTop } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import { useLang } from "@/lib/i18n";
import { useLayoutMode, LAYOUT_OPTIONS } from "@/lib/layout-mode";
import { USER } from "@/lib/data";
import { HEADER } from "@/lib/dashboard-data";

export function ContextSelect({
  icon: Icon,
  label,
  value,
  options,
}: {
  icon: typeof MapPin;
  label: string;
  value: string;
  options: string[];
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button className="flex h-9 items-center gap-2 rounded-lg border border-neutral-200 bg-white px-2.5 text-left transition-colors hover:bg-neutral-50">
          <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-[#034751]/10 text-[#034751]">
            <Icon className="h-3.5 w-3.5" />
          </span>
          <span className="hidden min-w-0 leading-tight sm:block">
            <span className="block text-[10px] text-neutral-400">{label}</span>
            <span className="block max-w-[160px] truncate text-[13px] font-semibold text-neutral-800">{value}</span>
          </span>
          <ChevronDown className="h-3.5 w-3.5 shrink-0 text-neutral-400" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-56">
        <DropdownMenuLabel>{label}</DropdownMenuLabel>
        {options.map((o) => (
          <DropdownMenuItem key={o} className={cn(o === value && "bg-muted font-semibold")}>
            {o}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export function Topbar() {
  const { t, lang, setLang } = useLang();
  const { mode, setMode } = useLayoutMode();

  return (
    <header className="sticky top-0 z-30 flex h-14 shrink-0 items-center gap-3 border-b border-neutral-200 bg-neutral-100 px-4">
      {/* Context selectors */}
      <ContextSelect
        icon={MapPin}
        label={t("top.branch")}
        value={HEADER.branch}
        options={["Nguyen Van Huong, D7", "Vo Van Kiet, D5", "Pham Van Dong, Thu Duc"]}
      />
      <ContextSelect
        icon={DoorOpen}
        label={t("top.room")}
        value={HEADER.room}
        options={["Phòng khám 1", "Phòng khám 2", "Phòng thủ thuật", "Phòng cấp cứu"]}
      />

      {/* Right controls */}
      <div className="ml-auto flex items-center gap-2.5">
        {/* Global search */}
        <div className="relative hidden md:block">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
          <input
            placeholder={t("top.search")}
            className="h-9 w-[300px] rounded-lg border border-neutral-200 bg-white pl-9 pr-12 text-sm text-neutral-800 placeholder:text-neutral-400 focus:border-[#034751] focus:outline-none focus:ring-2 focus:ring-[#034751]/20"
          />
          <kbd className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 rounded border border-neutral-200 bg-neutral-50 px-1.5 py-0.5 font-mono text-[10px] text-neutral-400">
            ⌘K
          </kbd>
        </div>

        {/* Quick create */}
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

        {/* Notifications */}
        <button className="relative flex h-9 w-9 items-center justify-center rounded-lg border border-neutral-200 bg-white text-neutral-500 transition-colors hover:bg-neutral-50 hover:text-neutral-700">
          <Bell className="h-[18px] w-[18px]" />
          <span className="absolute -right-1.5 -top-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-destructive px-1 text-[10px] font-bold text-white">
            3
          </span>
        </button>

        {/* Language */}
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

        {/* User menu */}
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
          <DropdownMenuContent align="end" className="w-52">
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
      </div>
    </header>
  );
}
