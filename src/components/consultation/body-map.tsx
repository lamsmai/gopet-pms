import { useState } from "react";
import { cn } from "@/lib/utils";
import { type BodyRegion, REGION_STATUS_META } from "@/lib/consultation-data";

// Dot positions on the top-down silhouette (viewBox 0 0 200 300). "skin" is general → list only.
const REGION_POS: Record<string, [number, number]> = {
  head: [100, 58],
  left_ear: [74, 44],
  right_ear: [126, 44],
  left_eye: [85, 70],
  right_eye: [115, 70],
  mouth_teeth: [100, 90],
  neck: [100, 120],
  thorax: [100, 158],
  abdomen: [100, 202],
  left_forelimb: [58, 168],
  right_forelimb: [142, 168],
  left_hindlimb: [70, 250],
  right_hindlimb: [130, 250],
  tail: [180, 232],
};

export function BodyMapCard({
  regions,
  onCycle,
  t,
}: {
  regions: BodyRegion[];
  onCycle: (key: string) => void;
  t: (k: string) => string;
}) {
  const [active, setActive] = useState<string | null>(null);
  const byKey = Object.fromEntries(regions.map((r) => [r.key, r]));

  const abnormal = regions.filter((r) => r.status === "abnormal").length;
  const normal = regions.filter((r) => r.status === "normal").length;
  const clear = regions.filter((r) => r.status === "clear").length;

  const tap = (key: string) => {
    setActive(key);
    onCycle(key);
  };

  return (
    <section className="rounded-xl border border-neutral-200 bg-white">
      {/* header */}
      <div className="flex items-start justify-between gap-2 border-b border-neutral-100 px-4 py-2.5">
        <div className="min-w-0">
          <h2 className="font-display text-[14px] font-bold uppercase tracking-wide text-[#034751]">{t("cs.bodymapTitle")}</h2>
          <p className="mt-0.5 text-[11px] text-neutral-400">{t("cs.bodymapSub")}</p>
        </div>
        <div className="flex shrink-0 items-center gap-2 pt-0.5 text-[11px] font-semibold">
          {abnormal > 0 && <span style={{ color: REGION_STATUS_META.abnormal.color }}>{abnormal} bất thường</span>}
          {normal > 0 && <span style={{ color: "#16803C" }}>{normal} bình thường</span>}
          {clear > 0 && <span style={{ color: "#737373" }}>{clear} sạch</span>}
          {abnormal + normal + clear === 0 && <span className="text-neutral-300">chưa khám</span>}
        </div>
      </div>

      <div className="space-y-3 p-3">
        {/* ── SVG body map ── */}
        <div className="flex items-center justify-center rounded-xl bg-neutral-50 p-2">
          <svg viewBox="0 0 200 300" className="h-[210px] w-auto">
            {/* silhouette (top-down) */}
            <g fill="#DCD3C3">
              <circle cx="74" cy="46" r="15" />
              <circle cx="126" cy="46" r="15" />
              <circle cx="100" cy="72" r="40" />
              <rect x="86" y="104" width="28" height="26" rx="12" />
              <ellipse cx="100" cy="190" rx="74" ry="84" />
              <ellipse cx="60" cy="250" rx="15" ry="36" />
              <ellipse cx="140" cy="250" rx="15" ry="36" />
            </g>
            <path d="M168 206 q42 6 28 64 q-4 14 -16 18 q10 -30 -16 -66 Z" fill="#CFC5B2" />

            {/* clickable region dots */}
            {Object.entries(REGION_POS).map(([key, [cx, cy]]) => {
              const r = byKey[key];
              if (!r) return null;
              const meta = REGION_STATUS_META[r.status];
              const isActive = active === key;
              return (
                <g key={key} onClick={() => tap(key)} style={{ cursor: "pointer" }}>
                  {isActive && <circle cx={cx} cy={cy} r="12" fill={meta.color} opacity="0.18" />}
                  <circle cx={cx} cy={cy} r="8" fill={meta.color} stroke={isActive ? "#034751" : "#ffffff"} strokeWidth={isActive ? 2.5 : 2}>
                    <title>{r.label}</title>
                  </circle>
                </g>
              );
            })}
          </svg>
        </div>

        {/* ── region list ── */}
        <div className="space-y-1">
          {regions.map((r) => {
            const meta = REGION_STATUS_META[r.status];
            const set = r.status !== "unset";
            const isActive = active === r.key;
            return (
              <button
                key={r.key}
                onClick={() => tap(r.key)}
                title={t("cs.bodymapCycle")}
                className={cn(
                  "flex w-full items-center gap-2 rounded-lg border px-2.5 py-1.5 text-left transition",
                  isActive ? "border-[#034751] ring-1 ring-[#034751]" : "border-transparent",
                )}
                style={{ background: set ? meta.bg : "transparent" }}
              >
                <span className="h-2.5 w-2.5 shrink-0 rounded-full ring-2 ring-white" style={{ background: meta.color }} />
                <span className="flex-1 truncate text-[13px] text-neutral-700">{r.label}</span>
                {set && (
                  <span className="shrink-0 text-[10px] font-bold uppercase tracking-wide" style={{ color: meta.color === "#22C55E" ? "#16803C" : meta.color }}>
                    {meta.label}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>
    </section>
  );
}
