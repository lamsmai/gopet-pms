export type Species = "dog" | "cat" | "rabbit" | "bird" | "reptile" | "other";
export type Sex = "male" | "female" | "male_neutered" | "female_spayed";
export type MembershipTier = "none" | "silver" | "gold" | "platinum";
export type RelationRole = "primary_owner" | "co_owner" | "payer" | "emergency";
export type VaccineStatus = "overdue" | "due-soon" | "up-to-date";
export type RiskLevel = "high" | "moderate" | "low";

export type Client = {
  id: string;
  name: string;
  phone: string;
  email: string;
  address: string;
  preferredLanguage: "en" | "vi";
  membershipTier: MembershipTier;
  depositBalance: number;
  outstandingBalance: number;
  lifetimeSpend: number;
  preferredVet: string;
  petCount: number;
  lastVisit: string;
  csStatus: string;
};

export type PatientContact = {
  clientId: string;
  role: RelationRole;
  note: string;
};

export type Patient = {
  id: string;
  name: string;
  species: Species;
  breed: string;
  sex: Sex;
  dob: string;
  ageLabel: string;
  microchipId: string;
  insuranceProvider?: string;
  insurancePolicyNumber?: string;
  color: string;
  photoTone: "teal" | "violet" | "amber" | "rose";
  currentWeightKg: number;
  idealWeightKg: [number, number];
  bcs: number;
  primaryVet: string;
  primaryBranch: string;
  lastVisit: string;
  nextBooking: string;
  triage: "stable" | "watch" | "urgent";
  allergies: string[];
  activeMedications: string[];
  chronicConditions: string[];
  behavioralWarning?: string;
  contacts: PatientContact[];
  careSummary: string;
  csHandoff: string[];
  weightHistory: { date: string; weight: number; idealLow: number; idealHigh: number }[];
  prescriptions: { name: string; dose: string; since: string; ownerInstruction: string }[];
  bookings: { date: string; type: string; clinician: string; status: string }[];
  alerts: { tone: "red" | "orange" | "blue" | "green"; label: string; detail: string }[];
  aiReport: {
    generatedAt: string;
    confidence: number;
    summary: string;
    riskFactors: { level: RiskLevel; title: string; evidence: string; nextStep: string }[];
    recommendations: { ownerFacing: string; clinicalAction: string; due: string }[];
  };
  clinicalHistory: ClinicalEvent[];
  vaccinations: Vaccination[];
  vitals: VitalsRow[];
};

export type ClinicalEvent = {
  id: string;
  date: string;
  time: string;
  vet: string;
  nurse: string;
  reason: string;
  summary: string;
  soap: {
    subjective: string;
    objective: string;
    assessment: string;
    plan: string;
  };
  labs: { name: string; value: string; flag?: "high" | "low" | "normal" }[];
  images: string[];
  billingVisibility: "current-owner" | "previous-owner-hidden";
};

export type Vaccination = {
  name: string;
  administered: string;
  batch: string;
  vet: string;
  due: string;
  status: VaccineStatus;
  certificateReady: boolean;
};

export type VitalsPoint = {
  label: string;
  value: number | string;
  vet: string;
  branch: string;
  comment?: string;
};

export type VitalsRow = {
  metric: string;
  unit?: string;
  range: string;
  current: string;
  target?: string;
  kind: "numeric" | "categorical";
  color: string;
  values: VitalsPoint[];
};

export const clients: Client[] = [
  {
    id: "CLI-0025",
    name: "Linh Tran",
    phone: "+84 903 118 422",
    email: "linh.tran@email.com",
    address: "Thao Dien, Thu Duc, Ho Chi Minh City",
    preferredLanguage: "en",
    membershipTier: "platinum",
    depositBalance: 18500000,
    outstandingBalance: 0,
    lifetimeSpend: 214500000,
    preferredVet: "Dr. Mia Nguyen",
    petCount: 2,
    lastVisit: "15 Jun 2026",
    csStatus: "VIP callback within 2h",
  },
  {
    id: "CLI-0041",
    name: "Quang Pham",
    phone: "+84 912 774 019",
    email: "q.pham@workmail.vn",
    address: "An Phu, Thu Duc, Ho Chi Minh City",
    preferredLanguage: "vi",
    membershipTier: "gold",
    depositBalance: 4200000,
    outstandingBalance: 1280000,
    lifetimeSpend: 88700000,
    preferredVet: "Dr. Lucas Tran",
    petCount: 1,
    lastVisit: "12 Jun 2026",
    csStatus: "Payment reminder approved",
  },
  {
    id: "CLI-0108",
    name: "Emma Wilson",
    phone: "+84 909 220 108",
    email: "emma.wilson@gmail.com",
    address: "Nguyen Van Huong, D2, Ho Chi Minh City",
    preferredLanguage: "en",
    membershipTier: "silver",
    depositBalance: 2500000,
    outstandingBalance: 0,
    lifetimeSpend: 46200000,
    preferredVet: "Dr. Sarah Le",
    petCount: 3,
    lastVisit: "08 Jun 2026",
    csStatus: "Travel certificate requested",
  },
  {
    id: "CLI-0122",
    name: "ADI Rescue Partner",
    phone: "+84 908 555 661",
    email: "rescue@adi.org",
    address: "District 7, Ho Chi Minh City",
    preferredLanguage: "en",
    membershipTier: "none",
    depositBalance: 0,
    outstandingBalance: 3400000,
    lifetimeSpend: 15100000,
    preferredVet: "Dr. Mia Nguyen",
    petCount: 4,
    lastVisit: "03 Jun 2026",
    csStatus: "Shelter transfer pending",
  },
];

export const patients: Patient[] = [
  {
    id: "PAT-0102",
    name: "Mochi",
    species: "dog",
    breed: "Golden Retriever",
    sex: "female_spayed",
    dob: "2018-03-11",
    ageLabel: "8y 3m",
    microchipId: "900113000482911",
    insuranceProvider: "Liberty PetCare",
    insurancePolicyNumber: "LPC-88-20491",
    color: "Golden",
    photoTone: "teal",
    currentWeightKg: 34.8,
    idealWeightKg: [28, 31],
    bcs: 7,
    primaryVet: "Dr. Mia Nguyen",
    primaryBranch: "Nguyen Van Huong, D7",
    lastVisit: "15 Jun 2026",
    nextBooking: "22 Jun 2026, 09:30",
    triage: "watch",
    allergies: ["Carprofen"],
    activeMedications: ["Gabapentin 300mg BID", "Omega-3 daily"],
    chronicConditions: ["Osteoarthritis risk", "Weight management"],
    behavioralWarning: "Fearful around floor scale; use treats and owner presence.",
    contacts: [
      { clientId: "CLI-0025", role: "primary_owner", note: "Clinical decision maker" },
      { clientId: "CLI-0041", role: "payer", note: "Approved for invoices under 5tr" },
      { clientId: "CLI-0108", role: "emergency", note: "Neighbor, English only" },
    ],
    careSummary:
      "Senior large-breed patient with upward weight trend, intermittent stiffness after exercise, and NSAID allergy. Prioritize pain-safe treatment plans and owner education.",
    csHandoff: [
      "Owner prefers Zalo summaries after every visit.",
      "Confirm insurance claim documents before discharge.",
      "Offer senior wellness package before next vaccine due date.",
    ],
    weightHistory: [
      { date: "Jan", weight: 31.9, idealLow: 28, idealHigh: 31 },
      { date: "Feb", weight: 32.4, idealLow: 28, idealHigh: 31 },
      { date: "Mar", weight: 33.1, idealLow: 28, idealHigh: 31 },
      { date: "Apr", weight: 33.5, idealLow: 28, idealHigh: 31 },
      { date: "May", weight: 34.2, idealLow: 28, idealHigh: 31 },
      { date: "Jun", weight: 34.8, idealLow: 28, idealHigh: 31 },
    ],
    prescriptions: [
      { name: "Gabapentin", dose: "300mg BID", since: "12 May 2026", ownerInstruction: "Give with food; monitor sedation." },
      { name: "Omega-3", dose: "1 capsule SID", since: "02 Apr 2026", ownerInstruction: "Continue during diet transition." },
    ],
    bookings: [
      { date: "22 Jun 2026, 09:30", type: "Senior mobility review", clinician: "Dr. Mia Nguyen", status: "Confirmed" },
      { date: "30 Jun 2026, 16:00", type: "Weight nurse check", clinician: "Nurse Vy", status: "Needs owner confirmation" },
    ],
    alerts: [
      { tone: "red", label: "Allergy", detail: "Carprofen. Avoid NSAID protocol without vet override." },
      { tone: "orange", label: "Behavior", detail: "Fearful on scale, use low-stress handling." },
      { tone: "blue", label: "Insurance", detail: "Active Liberty policy, claim documents required." },
      { tone: "green", label: "Continuity", detail: "Clinical history intact after payer role change." },
    ],
    aiReport: {
      generatedAt: "16 Jun 2026, 08:45",
      confidence: 91,
      summary:
        "Mochi is trending above ideal weight with breed and age factors increasing orthopedic risk. No acute instability, but preventive intervention is recommended within the next 30 days.",
      riskFactors: [
        {
          level: "high",
          title: "Osteoarthritis progression",
          evidence: "Senior Golden Retriever, BCS 7/9, owner reports stiffness after stairs.",
          nextStep: "Schedule orthopedic exam and pain-safe mobility plan.",
        },
        {
          level: "moderate",
          title: "Obesity-related metabolic strain",
          evidence: "Weight increased 2.9 kg over 6 months and remains above ideal band.",
          nextStep: "Switch to measured weight-management diet and monthly nurse weigh-ins.",
        },
        {
          level: "low",
          title: "Travel vaccine gap",
          evidence: "Rabies is current; DHPP due soon in 45 days.",
          nextStep: "Bundle DHPP reminder with next senior wellness consult.",
        },
      ],
      recommendations: [
        { ownerFacing: "Senior wellness blood screen", clinicalAction: "CBC/Chem17/UA before NSAID alternatives", due: "Within 2 weeks" },
        { ownerFacing: "Mobility comfort plan", clinicalAction: "Joint exam, gait video, pain scoring", due: "Next visit" },
        { ownerFacing: "Weight target program", clinicalAction: "Target 31 kg, 12-week plan, BCS recheck", due: "Start today" },
      ],
    },
    clinicalHistory: [
      {
        id: "ENC-20260615-01",
        date: "15 Jun 2026",
        time: "10:20",
        vet: "Dr. Mia Nguyen",
        nurse: "Nurse Vy",
        reason: "Stiffness after exercise",
        summary: "Mild bilateral hip discomfort, no neurologic deficit. Weight control and pain-safe plan discussed.",
        soap: {
          subjective: "Owner reports slower rising after evening walks, normal appetite, no vomiting.",
          objective: "BCS 7/9, weight 34.8 kg, mild reduced hip extension, temp and HR WNL.",
          assessment: "Likely early osteoarthritis with weight contribution. NSAID allergy limits first-line options.",
          plan: "Continue gabapentin, start controlled exercise plan, recommend senior blood screen and radiographs if pain score persists.",
        },
        labs: [
          { name: "ALT", value: "62 U/L", flag: "normal" },
          { name: "Creatinine", value: "1.1 mg/dL", flag: "normal" },
          { name: "CRP", value: "12 mg/L", flag: "high" },
        ],
        images: ["Hip ROM video", "Gait side profile"],
        billingVisibility: "current-owner",
      },
      {
        id: "ENC-20260512-02",
        date: "12 May 2026",
        time: "14:05",
        vet: "Dr. Lucas Tran",
        nurse: "Nurse An",
        reason: "Annual wellness",
        summary: "Vaccines reviewed, weight trending up. Owner accepted diet counseling.",
        soap: {
          subjective: "No acute complaints. Owner notes increased treats from family members.",
          objective: "Normal cardiopulmonary exam. Dental grade 1 tartar.",
          assessment: "Overweight senior patient; preventive labs recommended.",
          plan: "Diet plan, dental home care, DHPP reminder in 2 months.",
        },
        labs: [
          { name: "WBC", value: "9.2 x10^9/L", flag: "normal" },
          { name: "Glucose", value: "96 mg/dL", flag: "normal" },
        ],
        images: ["Dental photo"],
        billingVisibility: "current-owner",
      },
      {
        id: "ENC-20241202-06",
        date: "02 Dec 2024",
        time: "09:10",
        vet: "Dr. Sarah Le",
        nurse: "Nurse Vy",
        reason: "Ownership update",
        summary: "Payer contact updated. Clinical record retained; prior financial records remain separated.",
        soap: {
          subjective: "Administrative transfer of payer role; primary owner unchanged.",
          objective: "No clinical procedure performed.",
          assessment: "Continuity maintained.",
          plan: "CS to verify new payer permissions before invoicing.",
        },
        labs: [],
        images: [],
        billingVisibility: "previous-owner-hidden",
      },
    ],
    vaccinations: [
      { name: "Rabies", administered: "12 May 2026", batch: "RB-26-991", vet: "Dr. Lucas Tran", due: "12 May 2027", status: "up-to-date", certificateReady: true },
      { name: "DHPP", administered: "18 Jul 2025", batch: "DHP-25-118", vet: "Dr. Sarah Le", due: "18 Jul 2026", status: "due-soon", certificateReady: true },
      { name: "Leptospirosis", administered: "02 Jun 2025", batch: "LEP-25-402", vet: "Dr. Mia Nguyen", due: "02 Jun 2026", status: "overdue", certificateReady: false },
      { name: "Bordetella", administered: "12 May 2026", batch: "BOR-26-021", vet: "Dr. Lucas Tran", due: "12 Nov 2026", status: "up-to-date", certificateReady: true },
    ],
    vitals: [
      {
        metric: "Weight",
        unit: "kg",
        range: "Target 28-31",
        current: "34.8 kg",
        target: "31 kg",
        kind: "numeric",
        color: "#0F8C86",
        values: [
          { label: "9A", value: 33.1, vet: "Nurse An", branch: "D7", comment: "Wellness check" },
          { label: "11A", value: 33.5, vet: "Nurse Vy", branch: "D7" },
          { label: "2P", value: 34.2, vet: "Dr. Lucas", branch: "D7", comment: "Diet plan started" },
          { label: "4P", value: 34.8, vet: "Nurse Vy", branch: "D7", comment: "Scale anxiety noted" },
        ],
      },
      {
        metric: "Temp",
        unit: "C",
        range: "38.0-39.2",
        current: "38.6 C",
        kind: "numeric",
        color: "#E67A2E",
        values: [
          { label: "9A", value: 38.3, vet: "Nurse An", branch: "D7" },
          { label: "11A", value: 38.4, vet: "Nurse Vy", branch: "D7" },
          { label: "2P", value: 38.6, vet: "Dr. Lucas", branch: "D7" },
          { label: "4P", value: 38.6, vet: "Nurse Vy", branch: "D7" },
        ],
      },
      {
        metric: "Pulse / HR",
        unit: "bpm",
        range: "70-120",
        current: "112 bpm",
        kind: "numeric",
        color: "#6E5AA8",
        values: [
          { label: "9A", value: 100, vet: "Nurse An", branch: "D7" },
          { label: "11A", value: 90, vet: "Nurse Vy", branch: "D7" },
          { label: "2P", value: 110, vet: "Dr. Lucas", branch: "D7" },
          { label: "4P", value: 112, vet: "Nurse Vy", branch: "D7", comment: "Mild anxiety" },
        ],
      },
      {
        metric: "Pulse Quality",
        range: "Normal",
        current: "N",
        kind: "categorical",
        color: "#2F766D",
        values: [
          { label: "9A", value: "N", vet: "Nurse An", branch: "D7" },
          { label: "11A", value: "N", vet: "Nurse Vy", branch: "D7" },
          { label: "2P", value: "N", vet: "Dr. Lucas", branch: "D7" },
          { label: "4P", value: "W", vet: "Nurse Vy", branch: "D7", comment: "Recheck after rest was normal" },
        ],
      },
      {
        metric: "Resp. Rate",
        unit: "brpm",
        range: "10-30",
        current: "24 brpm",
        kind: "numeric",
        color: "#1677A2",
        values: [
          { label: "9A", value: 24, vet: "Nurse An", branch: "D7" },
          { label: "11A", value: 20, vet: "Nurse Vy", branch: "D7" },
          { label: "2P", value: 24, vet: "Dr. Lucas", branch: "D7" },
          { label: "4P", value: 24, vet: "Nurse Vy", branch: "D7" },
        ],
      },
      {
        metric: "Resp. Effort",
        range: "Normal",
        current: "N",
        kind: "categorical",
        color: "#B35D21",
        values: [
          { label: "9A", value: "N", vet: "Nurse An", branch: "D7" },
          { label: "11A", value: "N", vet: "Nurse Vy", branch: "D7" },
          { label: "2P", value: "N", vet: "Dr. Lucas", branch: "D7" },
          { label: "4P", value: "N", vet: "Nurse Vy", branch: "D7" },
        ],
      },
      {
        metric: "Mucous Mem.",
        range: "Pink/moist",
        current: "Pk/M",
        kind: "categorical",
        color: "#B64268",
        values: [
          { label: "9A", value: "Pk/M", vet: "Nurse An", branch: "D7" },
          { label: "11A", value: "Pk/M", vet: "Nurse Vy", branch: "D7" },
          { label: "2P", value: "Pk/M", vet: "Dr. Lucas", branch: "D7" },
          { label: "4P", value: "Pk/M", vet: "Nurse Vy", branch: "D7" },
        ],
      },
      {
        metric: "CRT",
        range: "<2 sec",
        current: "<2s",
        kind: "categorical",
        color: "#4B6475",
        values: [
          { label: "9A", value: "<2s", vet: "Nurse An", branch: "D7" },
          { label: "11A", value: "<2s", vet: "Nurse Vy", branch: "D7" },
          { label: "2P", value: "<2s", vet: "Dr. Lucas", branch: "D7" },
          { label: "4P", value: "2-3s", vet: "Nurse Vy", branch: "D7", comment: "Normalized after patient settled" },
        ],
      },
    ],
  },
  {
    id: "PAT-0144",
    name: "Nori",
    species: "cat",
    breed: "British Shorthair",
    sex: "male_neutered",
    dob: "2021-09-21",
    ageLabel: "4y 8m",
    microchipId: "900113000482177",
    color: "Blue",
    photoTone: "violet",
    currentWeightKg: 6.1,
    idealWeightKg: [4.8, 5.5],
    bcs: 6,
    primaryVet: "Dr. Sarah Le",
    primaryBranch: "Nguyen Van Huong, D7",
    lastVisit: "08 Jun 2026",
    nextBooking: "18 Jun 2026, 15:00",
    triage: "stable",
    allergies: [],
    activeMedications: ["Urinary S/O diet"],
    chronicConditions: ["FLUTD history"],
    contacts: [{ clientId: "CLI-0108", role: "primary_owner", note: "Travel documents contact" }],
    careSummary: "FLUTD history, stable on urinary diet. Owner preparing boarding and travel paperwork.",
    csHandoff: ["Send vaccine certificate in English.", "Boarding requires FVRCP proof and negative parasite screen."],
    weightHistory: [
      { date: "Jan", weight: 5.8, idealLow: 4.8, idealHigh: 5.5 },
      { date: "Feb", weight: 5.9, idealLow: 4.8, idealHigh: 5.5 },
      { date: "Mar", weight: 6.0, idealLow: 4.8, idealHigh: 5.5 },
      { date: "Apr", weight: 6.2, idealLow: 4.8, idealHigh: 5.5 },
      { date: "May", weight: 6.1, idealLow: 4.8, idealHigh: 5.5 },
      { date: "Jun", weight: 6.1, idealLow: 4.8, idealHigh: 5.5 },
    ],
    prescriptions: [{ name: "Urinary S/O", dose: "Measured meals", since: "04 Mar 2026", ownerInstruction: "No mixed treats without vet approval." }],
    bookings: [{ date: "18 Jun 2026, 15:00", type: "Travel certificate review", clinician: "Dr. Sarah Le", status: "Confirmed" }],
    alerts: [
      { tone: "blue", label: "Travel", detail: "Certificate requested; vaccine proof ready." },
      { tone: "green", label: "Diet", detail: "Stable on urinary protocol." },
    ],
    aiReport: {
      generatedAt: "16 Jun 2026, 09:12",
      confidence: 86,
      summary: "Stable FLUTD patient with mild overweight trend. Travel workflow is the main operational risk.",
      riskFactors: [
        { level: "moderate", title: "FLUTD relapse", evidence: "Male neutered cat with prior urinary obstruction.", nextStep: "Confirm urine symptoms at every CS touchpoint." },
        { level: "low", title: "Boarding stress", evidence: "Travel and boarding planned this month.", nextStep: "Discuss stress reduction and litter monitoring." },
      ],
      recommendations: [
        { ownerFacing: "Travel readiness review", clinicalAction: "Verify rabies/FVRCP and certificate fields", due: "18 Jun" },
        { ownerFacing: "Urinary monitoring", clinicalAction: "Owner checklist for urine frequency and appetite", due: "Today" },
      ],
    },
    clinicalHistory: [],
    vaccinations: [
      { name: "Rabies", administered: "08 Jun 2026", batch: "RB-26-804", vet: "Dr. Sarah Le", due: "08 Jun 2027", status: "up-to-date", certificateReady: true },
      { name: "FVRCP", administered: "08 Jun 2026", batch: "FVR-26-310", vet: "Dr. Sarah Le", due: "08 Jun 2027", status: "up-to-date", certificateReady: true },
    ],
    vitals: [],
  },
  {
    id: "PAT-0188",
    name: "Bun",
    species: "rabbit",
    breed: "Netherland Dwarf",
    sex: "female_spayed",
    dob: "2023-01-06",
    ageLabel: "3y 5m",
    microchipId: "900113000482902",
    color: "White sable",
    photoTone: "amber",
    currentWeightKg: 1.25,
    idealWeightKg: [1.15, 1.35],
    bcs: 5,
    primaryVet: "Dr. Lucas Tran",
    primaryBranch: "Nguyen Van Huong, D7",
    lastVisit: "12 Jun 2026",
    nextBooking: "17 Jun 2026, 10:00",
    triage: "urgent",
    allergies: [],
    activeMedications: ["Meloxicam microdose", "Critical Care feed"],
    chronicConditions: ["Dental malocclusion"],
    behavioralWarning: "Stress-prone; minimize handling time.",
    contacts: [{ clientId: "CLI-0041", role: "primary_owner", note: "Vietnamese preferred" }],
    careSummary: "Rabbit with dental disease and appetite drop. Needs quick clinical escalation if fecal output declines.",
    csHandoff: ["Call owner at 18:00 to confirm appetite and fecal output.", "Do not delay urgent slot if no eating for 6h."],
    weightHistory: [
      { date: "Jan", weight: 1.32, idealLow: 1.15, idealHigh: 1.35 },
      { date: "Feb", weight: 1.3, idealLow: 1.15, idealHigh: 1.35 },
      { date: "Mar", weight: 1.28, idealLow: 1.15, idealHigh: 1.35 },
      { date: "Apr", weight: 1.27, idealLow: 1.15, idealHigh: 1.35 },
      { date: "May", weight: 1.26, idealLow: 1.15, idealHigh: 1.35 },
      { date: "Jun", weight: 1.25, idealLow: 1.15, idealHigh: 1.35 },
    ],
    prescriptions: [{ name: "Critical Care", dose: "10ml q6h", since: "12 Jun 2026", ownerInstruction: "Call clinic if refusing syringe feed." }],
    bookings: [{ date: "17 Jun 2026, 10:00", type: "Dental recheck", clinician: "Dr. Lucas Tran", status: "Urgent hold" }],
    alerts: [
      { tone: "orange", label: "Handling", detail: "Stress-prone exotic patient." },
      { tone: "red", label: "GI risk", detail: "Appetite drop can become emergency quickly." },
    ],
    aiReport: {
      generatedAt: "16 Jun 2026, 09:30",
      confidence: 89,
      summary: "Dental disease with appetite decrease makes GI stasis the top risk. Same-day escalation rules should be visible to CS.",
      riskFactors: [
        { level: "high", title: "GI stasis", evidence: "Dental malocclusion plus reduced appetite.", nextStep: "Confirm eating and fecal output twice daily." },
        { level: "moderate", title: "Pain control gap", evidence: "Microdose analgesia started, response pending.", nextStep: "Recheck pain score at dental appointment." },
      ],
      recommendations: [{ ownerFacing: "Same-day call protocol", clinicalAction: "CS check appetite/feces and escalate if abnormal", due: "Today 18:00" }],
    },
    clinicalHistory: [],
    vaccinations: [],
    vitals: [],
  },
  {
    id: "PAT-0221",
    name: "Atlas",
    species: "dog",
    breed: "Mixed Breed",
    sex: "male_neutered",
    dob: "2024-11-01",
    ageLabel: "1y 7m",
    microchipId: "Unassigned",
    color: "Black tan",
    photoTone: "rose",
    currentWeightKg: 15.9,
    idealWeightKg: [15, 17],
    bcs: 5,
    primaryVet: "Dr. Mia Nguyen",
    primaryBranch: "Nguyen Van Huong, D7",
    lastVisit: "03 Jun 2026",
    nextBooking: "Pending owner transfer",
    triage: "stable",
    allergies: [],
    activeMedications: [],
    chronicConditions: [],
    contacts: [{ clientId: "CLI-0122", role: "primary_owner", note: "Shelter owner until adoption complete" }],
    careSummary: "Rescue patient ready for adoption; needs microchip allocation and ownership transfer workflow.",
    csHandoff: ["Prepare transfer packet for adopter.", "Allocate microchip from registry before discharge."],
    weightHistory: [
      { date: "Apr", weight: 14.9, idealLow: 15, idealHigh: 17 },
      { date: "May", weight: 15.4, idealLow: 15, idealHigh: 17 },
      { date: "Jun", weight: 15.9, idealLow: 15, idealHigh: 17 },
    ],
    prescriptions: [],
    bookings: [],
    alerts: [
      { tone: "blue", label: "Transfer", detail: "Ownership workflow pending; hide shelter finance after transfer." },
      { tone: "orange", label: "Microchip", detail: "Needs chip allocation from registry pool." },
    ],
    aiReport: {
      generatedAt: "16 Jun 2026, 10:05",
      confidence: 78,
      summary: "Young rescue patient clinically stable. Administrative completion is the main blocker for adoption handoff.",
      riskFactors: [{ level: "low", title: "Incomplete identity record", evidence: "Microchip unassigned.", nextStep: "Allocate chip from registry." }],
      recommendations: [{ ownerFacing: "Adoption health summary", clinicalAction: "Export clinical history without prior financial records", due: "Before transfer" }],
    },
    clinicalHistory: [],
    vaccinations: [
      { name: "Rabies", administered: "03 Jun 2026", batch: "RB-26-702", vet: "Dr. Mia Nguyen", due: "03 Jun 2027", status: "up-to-date", certificateReady: true },
      { name: "DHPP", administered: "03 Jun 2026", batch: "DHP-26-112", vet: "Dr. Mia Nguyen", due: "03 Jun 2027", status: "up-to-date", certificateReady: true },
    ],
    vitals: [],
  },
];

export function getPrimaryClient(patient: Patient) {
  const primary = patient.contacts.find((c) => c.role === "primary_owner") ?? patient.contacts[0];
  return clients.find((client) => client.id === primary?.clientId) ?? clients[0];
}

export function getPatientById(id?: string) {
  return patients.find((patient) => patient.id === id) ?? patients[0];
}

export function membershipLabel(tier: MembershipTier) {
  if (tier === "none") return "Standard";
  return tier[0].toUpperCase() + tier.slice(1);
}

export function sexLabel(sex: Sex) {
  return {
    male: "Male",
    female: "Female",
    male_neutered: "Male neutered",
    female_spayed: "Female spayed",
  }[sex];
}

export function roleLabel(role: RelationRole) {
  return {
    primary_owner: "Primary owner",
    co_owner: "Co-owner",
    payer: "Payer",
    emergency: "Emergency",
  }[role];
}

