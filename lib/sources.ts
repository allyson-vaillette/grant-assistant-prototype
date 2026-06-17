// ── Source Library types ───────────────────────────────────────────────────

export type SourceType = "file" | "link"

export type SourceScope =
  | { kind: "organization" }
  | { kind: "program"; programId: string }

export interface Source {
  id: string
  type: SourceType
  title: string
  category: string
  scope: SourceScope
  addedAt: string
  usedInCount: number
  fileFormat?: string
  fileSizeLabel?: string
  url?: string
  domain?: string
}

export interface LibraryProgram {
  id: string
  name: string
}

export interface SuggestedGap {
  category: string
  label: string
}

export interface ScopeConfig {
  name: string
  descriptor: string
  recommendedCount: number
  categories: string[]
  gaps: SuggestedGap[]
}

// ── Programs ───────────────────────────────────────────────────────────────

export const LIBRARY_PROGRAMS: LibraryProgram[] = [
  { id: "lp-tnr",      name: "Community Cat TNR"  },
  { id: "lp-foster",   name: "Foster Network"      },
  { id: "lp-medicine", name: "Shelter Medicine"    },
  { id: "lp-adoption", name: "Adoption Program"    },
]

// ── Scope configs ──────────────────────────────────────────────────────────

export const ORG_SCOPE_CONFIG: ScopeConfig = {
  name: "Organization",
  descriptor: "Shared across every proposal",
  recommendedCount: 12,
  categories: ["Organization", "Financials", "Impact", "Compliance"],
  gaps: [
    { category: "Organization", label: "Add your organizational chart" },
    { category: "Financials",   label: "Add your audited financial statements" },
    { category: "Impact",       label: "Add a testimonial or case study" },
  ],
}

export const PROGRAM_SCOPE_CONFIGS: Record<string, ScopeConfig> = {
  "lp-tnr": {
    name: "Community Cat TNR",
    descriptor: "Program resources, used when drafting for this program",
    recommendedCount: 11,
    categories: ["Program overview", "Budget", "Outcomes & evidence", "Media", "Past proposals"],
    gaps: [
      { category: "Program overview",    label: "Add a one-page program summary"     },
      { category: "Budget",              label: "Add prior-year budget actuals"       },
      { category: "Outcomes & evidence", label: "Add an evaluation or impact report"  },
      { category: "Media",               label: "Add a short program video"           },
      { category: "Past proposals",      label: "Add another past proposal"           },
    ],
  },
  "lp-foster": {
    name: "Foster Network",
    descriptor: "Program resources, used when drafting for this program",
    recommendedCount: 8,
    categories: ["Program overview", "Budget", "Outcomes & evidence", "Media", "Past proposals"],
    gaps: [
      { category: "Program overview",    label: "Add a logic model"               },
      { category: "Budget",              label: "Add prior-year budget actuals"    },
      { category: "Outcomes & evidence", label: "Add a program evaluation"         },
      { category: "Past proposals",      label: "Add a past proposal"              },
    ],
  },
  "lp-medicine": {
    name: "Shelter Medicine",
    descriptor: "Program resources, used when drafting for this program",
    recommendedCount: 9,
    categories: ["Program overview", "Budget", "Outcomes & evidence", "Media", "Past proposals"],
    gaps: [
      { category: "Program overview",    label: "Add a logic model"               },
      { category: "Budget",              label: "Add prior-year budget actuals"    },
      { category: "Outcomes & evidence", label: "Add an evaluation or impact report" },
      { category: "Media",               label: "Add program photos or a video"    },
      { category: "Past proposals",      label: "Add a past proposal"              },
      { category: "Past proposals",      label: "Add another past proposal"        },
    ],
  },
  "lp-adoption": {
    name: "Adoption Program",
    descriptor: "Program resources, used when drafting for this program",
    recommendedCount: 10,
    categories: ["Program overview", "Budget", "Outcomes & evidence", "Media", "Past proposals"],
    gaps: [
      { category: "Program overview",    label: "Add a logic model"               },
      { category: "Outcomes & evidence", label: "Add an evaluation or impact report" },
      { category: "Past proposals",      label: "Add another past proposal"        },
    ],
  },
}

export function getScopeConfig(scope: SourceScope): ScopeConfig {
  if (scope.kind === "organization") return ORG_SCOPE_CONFIG
  return PROGRAM_SCOPE_CONFIGS[scope.programId] ?? {
    name: "Unknown",
    descriptor: "",
    recommendedCount: 0,
    categories: ["Program overview", "Budget", "Outcomes & evidence", "Media", "Past proposals"],
    gaps: [],
  }
}

// ── Mock sources (27 total) ────────────────────────────────────────────────

export const INITIAL_SOURCES: Source[] = [
  // Organization scope (9)
  { id: "src-1",  type: "file", title: "Mission statement",               category: "Organization", scope: { kind: "organization" }, addedAt: "Jun 12, 2026", usedInCount: 0, fileFormat: "PDF",  fileSizeLabel: "240 KB"  },
  { id: "src-2",  type: "file", title: "Organization history & background",category: "Organization", scope: { kind: "organization" }, addedAt: "Jun 1, 2026",  usedInCount: 2, fileFormat: "DOCX", fileSizeLabel: "1.1 MB"  },
  { id: "src-3",  type: "file", title: "Board & leadership",               category: "Organization", scope: { kind: "organization" }, addedAt: "May 28, 2026", usedInCount: 0, fileFormat: "PDF",  fileSizeLabel: "380 KB"  },
  { id: "src-4",  type: "file", title: "Operating budget 2026",            category: "Financials",   scope: { kind: "organization" }, addedAt: "Jan 15, 2026", usedInCount: 0, fileFormat: "XLSX", fileSizeLabel: "88 KB"   },
  { id: "src-5",  type: "file", title: "Form 990 (2023)",                  category: "Financials",   scope: { kind: "organization" }, addedAt: "Apr 3, 2026",  usedInCount: 1, fileFormat: "PDF",  fileSizeLabel: "2.4 MB"  },
  { id: "src-6",  type: "link", title: "Annual report 2025",               category: "Impact",       scope: { kind: "organization" }, addedAt: "Mar 10, 2026", usedInCount: 0, url: "https://whiskerhaven.org/annual-report-2025", domain: "whiskerhaven.org" },
  { id: "src-7",  type: "file", title: "Outcomes summary 2025",            category: "Impact",       scope: { kind: "organization" }, addedAt: "Mar 14, 2026", usedInCount: 3, fileFormat: "PDF",  fileSizeLabel: "620 KB"  },
  { id: "src-8",  type: "file", title: "501(c)(3) determination letter",   category: "Compliance",   scope: { kind: "organization" }, addedAt: "Jan 5, 2026",  usedInCount: 0, fileFormat: "PDF",  fileSizeLabel: "180 KB"  },
  { id: "src-9",  type: "file", title: "W-9",                              category: "Compliance",   scope: { kind: "organization" }, addedAt: "Jan 5, 2026",  usedInCount: 0, fileFormat: "PDF",  fileSizeLabel: "60 KB"   },
  // Community Cat TNR (6)
  { id: "src-10", type: "file", title: "Program description",              category: "Program overview",    scope: { kind: "program", programId: "lp-tnr" }, addedAt: "May 2, 2026",  usedInCount: 0, fileFormat: "PDF",  fileSizeLabel: "320 KB" },
  { id: "src-11", type: "file", title: "Logic model",                      category: "Program overview",    scope: { kind: "program", programId: "lp-tnr" }, addedAt: "Apr 18, 2026", usedInCount: 2, fileFormat: "PDF",  fileSizeLabel: "210 KB" },
  { id: "src-12", type: "file", title: "TNR program budget 2026",          category: "Budget",              scope: { kind: "program", programId: "lp-tnr" }, addedAt: "Jan 20, 2026", usedInCount: 0, fileFormat: "XLSX", fileSizeLabel: "64 KB"  },
  { id: "src-13", type: "file", title: "TNR outcomes 2025",                category: "Outcomes & evidence", scope: { kind: "program", programId: "lp-tnr" }, addedAt: "Feb 22, 2026", usedInCount: 3, fileFormat: "XLSX", fileSizeLabel: "120 KB" },
  { id: "src-14", type: "link", title: "Program photo album",              category: "Media",               scope: { kind: "program", programId: "lp-tnr" }, addedAt: "Mar 5, 2026",  usedInCount: 0, url: "https://drive.google.com/drive/folders/program-photos", domain: "drive.google.com" },
  { id: "src-15", type: "file", title: "Petco Love TNR proposal 2025",     category: "Past proposals",      scope: { kind: "program", programId: "lp-tnr" }, addedAt: "Dec 10, 2025", usedInCount: 1, fileFormat: "PDF",  fileSizeLabel: "1.8 MB" },
  // Foster Network (4)
  { id: "src-16", type: "file", title: "Foster program overview",          category: "Program overview",    scope: { kind: "program", programId: "lp-foster" }, addedAt: "Apr 8, 2026",  usedInCount: 1, fileFormat: "PDF",  fileSizeLabel: "280 KB" },
  { id: "src-17", type: "file", title: "Foster network budget 2026",       category: "Budget",              scope: { kind: "program", programId: "lp-foster" }, addedAt: "Jan 22, 2026", usedInCount: 0, fileFormat: "XLSX", fileSizeLabel: "72 KB"  },
  { id: "src-18", type: "file", title: "Foster outcomes 2025",             category: "Outcomes & evidence", scope: { kind: "program", programId: "lp-foster" }, addedAt: "Mar 1, 2026",  usedInCount: 2, fileFormat: "PDF",  fileSizeLabel: "440 KB" },
  { id: "src-19", type: "link", title: "Foster volunteer portal",          category: "Media",               scope: { kind: "program", programId: "lp-foster" }, addedAt: "Feb 14, 2026", usedInCount: 0, url: "https://whiskerhaven.org/foster", domain: "whiskerhaven.org" },
  // Shelter Medicine (3)
  { id: "src-20", type: "file", title: "Shelter medicine program description", category: "Program overview",    scope: { kind: "program", programId: "lp-medicine" }, addedAt: "Apr 12, 2026", usedInCount: 0, fileFormat: "PDF",  fileSizeLabel: "190 KB" },
  { id: "src-21", type: "file", title: "Clinic budget 2026",               category: "Budget",              scope: { kind: "program", programId: "lp-medicine" }, addedAt: "Jan 18, 2026", usedInCount: 1, fileFormat: "XLSX", fileSizeLabel: "56 KB"  },
  { id: "src-22", type: "file", title: "Spay/neuter outcomes 2025",        category: "Outcomes & evidence", scope: { kind: "program", programId: "lp-medicine" }, addedAt: "Feb 28, 2026", usedInCount: 0, fileFormat: "PDF",  fileSizeLabel: "310 KB" },
  // Adoption Program (5)
  { id: "src-23", type: "file", title: "Adoption program description",     category: "Program overview",    scope: { kind: "program", programId: "lp-adoption" }, addedAt: "Apr 5, 2026",  usedInCount: 2, fileFormat: "PDF",  fileSizeLabel: "250 KB" },
  { id: "src-24", type: "file", title: "Adoption budget 2026",             category: "Budget",              scope: { kind: "program", programId: "lp-adoption" }, addedAt: "Jan 25, 2026", usedInCount: 0, fileFormat: "XLSX", fileSizeLabel: "68 KB"  },
  { id: "src-25", type: "file", title: "Adoption outcomes 2025",           category: "Outcomes & evidence", scope: { kind: "program", programId: "lp-adoption" }, addedAt: "Mar 6, 2026",  usedInCount: 1, fileFormat: "PDF",  fileSizeLabel: "380 KB" },
  { id: "src-26", type: "link", title: "Adoption success stories",         category: "Media",               scope: { kind: "program", programId: "lp-adoption" }, addedAt: "Feb 20, 2026", usedInCount: 0, url: "https://whiskerhaven.org/adopt/stories", domain: "whiskerhaven.org" },
  { id: "src-27", type: "file", title: "PetSmart Charities adoption proposal 2024", category: "Past proposals", scope: { kind: "program", programId: "lp-adoption" }, addedAt: "Nov 30, 2024", usedInCount: 1, fileFormat: "PDF", fileSizeLabel: "1.4 MB" },
]
