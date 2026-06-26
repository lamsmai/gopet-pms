// ─────────────────────────────────────────────────────────────────────────────
// Consultation mode — "basic" vs "advanced" workspace.
//
// Unlike layout-mode.tsx (a per-USER navigation preference stored in localStorage),
// the consultation mode is a property of the ENCOUNTER: a quick vaccination is
// basic, a spay / surgery is advanced — same vet, same day. So it lives on the
// consult record, not in localStorage.
//
// Advanced is a strict SUPERSET of basic: switching modes only shows/hides UI,
// it never mutates or drops data. Each preset is just a set of visible modules,
// which keeps the door open for a future 3rd mode (e.g. "surgery", "inpatient").
// ─────────────────────────────────────────────────────────────────────────────

export type ConsultMode = "basic" | "advanced";

// Feature modules that can be toggled per mode. Anything NOT listed in
// ADVANCED_ONLY is always visible (the shared "basic" core).
export type ModuleKey =
  | "bodymap" // interactive body map card
  | "vitalsFull" // full vitals (all readings + pain + BCS) vs lite (weight + temp)
  | "aiScribe" // AI scribe recorder + suggestion banner
  | "labTab" // Lab tab inside clinical services
  | "procReport" // surgical/anesthesia report editor inside procedures
  | "dischargeFull" // full 8-section discharge note vs compact
  | "history" // side-panel patient history tab
  | "consent" // "Get consent" action chip
  | "telehealth" // "Telehealth" action chip
  | "decline"; // "Decline service" action chip

const ADVANCED_ONLY: ReadonlySet<ModuleKey> = new Set<ModuleKey>([
  "bodymap",
  "vitalsFull",
  "aiScribe",
  "labTab",
  "procReport",
  "dischargeFull",
  "history",
  "consent",
  "telehealth",
  "decline",
]);

/** Is a given module visible in the given mode? Advanced shows everything. */
export function isModuleVisible(mode: ConsultMode, key: ModuleKey): boolean {
  return mode === "advanced" || !ADVANCED_ONLY.has(key);
}

// Reason keywords that signal a complex/serious encounter → default to advanced.
const ADVANCED_HINTS = [
  "surgery",
  "spay",
  "neuter",
  "sterili",
  "post-op",
  "postop",
  "inpatient",
  "hospitaliz",
  "emergency",
  "kidney failure",
  "fluid",
  "tumor",
  "mass",
  "fracture",
  "cancer",
  "biopsy",
  "splenectomy",
];

/** Pick a sensible default mode from the visit reason. Vet can always override. */
export function deriveConsultMode(reason: string): ConsultMode {
  const r = (reason || "").toLowerCase();
  return ADVANCED_HINTS.some((h) => r.includes(h)) ? "advanced" : "basic";
}
