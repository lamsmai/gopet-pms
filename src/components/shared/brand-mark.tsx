import { cn } from "@/lib/utils";

/** GoPet symbol — rounded teal tile with a paw-drop mark. */
export function Mark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 36 36" className={className} role="img" aria-label="GoPet">
      <defs>
        <linearGradient id="gopetMark" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="hsl(186 74% 40%)" />
          <stop offset="1" stopColor="hsl(174 62% 36%)" />
        </linearGradient>
      </defs>
      <rect width="36" height="36" rx="10" fill="url(#gopetMark)" />
      {/* paw toes */}
      <ellipse cx="13" cy="12.5" rx="2.1" ry="2.6" fill="#fff" />
      <ellipse cx="19" cy="11.2" rx="2.1" ry="2.6" fill="#fff" />
      <ellipse cx="24.5" cy="13.6" rx="2" ry="2.4" fill="#fff" />
      {/* paw pad shaped as a soft drop */}
      <path
        d="M18.4 16.2c3.4 0 6.2 2.5 6.2 5.7 0 2.7-2.1 4.9-5 5.4-1.1.2-1.7 1-2.6 1-1 0-1.6-.9-2.9-1.2-2.6-.6-4.3-2.7-4.3-5.2 0-3.2 2.9-5.7 6.3-5.7Z"
        fill="#fff"
      />
    </svg>
  );
}

export function Logo({
  className,
  showWordmark = true,
}: {
  className?: string;
  showWordmark?: boolean;
}) {
  return (
    <div className={cn("flex items-center gap-3", className)}>
      <Mark className="h-9 w-9 shrink-0" />
      {showWordmark && (
        <div className="leading-tight">
          <div className="font-display text-[19px] font-bold tracking-tight text-foreground">
            GoPet <span className="text-brand">PMS</span>
          </div>
          <div className="text-[11px] font-normal text-muted-foreground">
            by Animal Doctor Internaltional
          </div>
        </div>
      )}
    </div>
  );
}
