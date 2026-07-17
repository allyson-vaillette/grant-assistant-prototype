/**
 * Respond flow fixture data.
 *
 * Ported from the GA2 Respond prototype (src/data.js). Per the port brief, the
 * demo opportunity is re-keyed from Bissell Pet Foundation → Petco Love (our
 * existing opp-1 funder) while the section bodies and the 9-requirement
 * structure are kept verbatim. Org (Whisker Haven Cat Rescue) and user
 * (Taylor S.) already match the repo mock data, so only the funder identity,
 * RFP filename, and the "same funder" source label changed.
 *
 * This is prototype fixture data for the writing surface — it is intentionally
 * self-contained and not wired to lib/mock-data.ts, which models the broader
 * PipelineOpportunity / Artifact object graph.
 */

export const OPP = {
  funder: "Petco Love",
  opp: "Lost & Found Grant 2026",
  due: "Jul 5",
  amount: "Up to $30,000",
  initiative: "Community Cat TNR",
  org: "Whisker Haven Cat Rescue",
  rfp: "Petco-Love-Lost-and-Found-RFP-2026.pdf",
} as const

export const SUG = {
  old: "Community partners help coordinate each visit.",
  next:
    "Each stop is scheduled in partnership with neighborhood associations and school family resource centers, which manage sign-ups in three languages.",
  why:
    "The RFP scores outreach specificity, and this names your actual sign-up channels from the Impact Report.",
} as const

export interface RespondSection {
  id: string
  num: number
  title: string
  req: string
  body?: string
  /** Rich section (Program Description) split into parts for the inline comment + suggestion. */
  p1?: string
  p1mark?: string
  p1b?: string
  p2a?: string
  p2b?: string
  p3?: string
  sources?: string[]
}

export const SECTIONS: RespondSection[] = [
  {
    id: "orgbg",
    num: 1,
    title: "Organization Background",
    req: "organization background, 500 words max",
    body: `Whisker Haven Cat Rescue has served Orange County since 2014, growing from a five-person foster circle into a licensed rescue with 3 staff, 140 active volunteers, and a permanent adoption center in Anaheim. Our mission is to end feline homelessness through rescue, rehabilitation, and community-based prevention.\n\nIn the past three years we have placed 2,900 cats in adoptive homes and built the county's largest trap-neuter-return network, working alongside two municipal shelters and a coalition of neighborhood caretakers.`,
  },
  {
    id: "need",
    num: 2,
    title: "Statement of Need",
    req: "statement of need with local data",
    body: `Orange County shelters took in 11,400 cats in 2025, and intake is concentrated in five zip codes where the nearest low-cost clinic is more than a 40-minute bus ride away. For families in these neighborhoods, the two barriers named most often in our intake surveys are transportation and cost.\n\nUnaltered community cats account for an estimated 68% of kitten intake at county facilities. Without accessible sterilization, colony growth outpaces adoption capacity every spring.`,
  },
  {
    id: "program",
    num: 3,
    title: "Program Description",
    req: "describe services, population served, and delivery model",
    p1: `The Spay Waggin is Whisker Haven Cat Rescue's mobile spay and neuter clinic, delivering no-cost sterilization and preventive care directly to under-resourced neighborhoods across Orange County. `,
    p1mark: "Operating four days per week,",
    p1b: ` the 26-foot clinic-on-wheels is staffed by one licensed veterinarian, two registered veterinary technicians, and a rotating team of trained volunteers.`,
    p2a: `In 2025, the program completed 1,840 surgeries and administered over 3,100 vaccinations. `,
    p2b: ` This model removes the two largest barriers our clients report: transportation and cost.`,
    p3: `Beyond surgery days, the program anchors a broader community cat strategy. Trap-neuter-return coordinators use Spay Waggin capacity to stabilize 14 managed colonies, while our foster network absorbs kittens young enough for adoption placement. Every animal leaves with a recovery plan, and caretakers receive follow-up calls at 48 hours and two weeks.`,
    sources: ["2025 Impact Report", "Initiative · Community Cat TNR", "Org profile"],
  },
  {
    id: "outcomes",
    num: 4,
    title: "Goals & Outcomes",
    req: "at least 3 measurable outcomes",
    body: `Over the 12-month grant period, the Spay Waggin program will: (1) complete 2,000 spay/neuter surgeries, a 9% increase over 2025; (2) hold at least 40 clinic days in the five highest-intake zip codes; and (3) reduce kitten-season intake from managed colonies by 15% against the county's 2025 baseline.\n\nEach outcome maps to a monthly dashboard our program director reviews with the board, so course corrections happen mid-year rather than at report time.`,
  },
  {
    id: "eval",
    num: 5,
    title: "Evaluation Plan",
    req: "evaluation plan and reporting cadence",
    body: `Surgery counts, vaccination totals, and clinic-day locations are logged in Clinic HQ at point of service. Colony stability is measured through quarterly caretaker censuses, cross-checked against shelter intake data shared by our municipal partners.\n\nWe will provide Petco Love a mid-year progress summary in month six and a full outcomes report within 45 days of the grant period closing.`,
  },
  {
    id: "budget",
    num: 6,
    title: "Budget Narrative",
    req: "budget narrative tied to line items",
    body: `The requested $30,000 covers direct surgical costs for approximately 460 procedures ($21,800 in medical supplies and anesthesia at $47.39 per surgery), 320 hours of contract veterinary time ($6,400), and fuel plus maintenance for 40 clinic days ($1,800). All line items correspond to the attached itemized budget, and no portion of this request funds administrative overhead.`,
  },
  {
    id: "sustain",
    num: 7,
    title: "Sustainability",
    req: "plan for sustaining the program beyond the grant",
    body: `Spay Waggin operations are sustained by a three-part model: fee-for-service contracts with two municipal shelters (38% of program cost), an annual community giving campaign that has grown 20% year over year, and a Saturday-clinic pilot now under evaluation for expansion. Petco Love support in this cycle underwrites the capacity increase while contract revenue scales to absorb it by 2027.`,
  },
]

export interface RespondReq {
  id: string
  name: string
  map: string
  kind: "section" | "attach"
  sec?: string
  att?: "budgetX" | "c3" | "board"
}

export const REQS: RespondReq[] = [
  { id: "r1", name: "Organization background, 500 words max", map: "§1 Organization Background", kind: "section", sec: "orgbg" },
  { id: "r2", name: "Statement of need with local data", map: "§2 Statement of Need", kind: "section", sec: "need" },
  { id: "r3", name: "Program description and delivery model", map: "§3 Program Description", kind: "section", sec: "program" },
  { id: "r4", name: "At least 3 measurable outcomes", map: "§4 Goals & Outcomes", kind: "section", sec: "outcomes" },
  { id: "r5", name: "Evaluation plan and reporting cadence", map: "§5 Evaluation Plan", kind: "section", sec: "eval" },
  { id: "r6", name: "Budget narrative tied to line items", map: "§6 Budget Narrative", kind: "section", sec: "budget" },
  { id: "r7", name: "Itemized budget spreadsheet", map: "Attachment", kind: "attach", att: "budgetX" },
  { id: "r8", name: "Proof of 501(c)(3) status", map: "Attachment", kind: "attach", att: "c3" },
  { id: "r9", name: "Board of directors list", map: "Attachment", kind: "attach", att: "board" },
]

export interface RespondAttachment {
  key: "budgetX" | "c3" | "board"
  label: string
}

export const ATTACHMENTS: RespondAttachment[] = [
  { key: "budgetX", label: "Itemized budget (.xlsx)" },
  { key: "c3", label: "501(c)(3) letter" },
  { key: "board", label: "Board of directors list" },
]

export interface RespondSource {
  id: string
  name: string
  badge: string
  hi: boolean
  meta?: string
}

export const SOURCES: RespondSource[] = [
  { id: "petco", name: "2024 Petco Love proposal", badge: "Same funder", hi: true, meta: "Awarded $25,000" },
  { id: "impact", name: "2025 Impact Report.pdf", badge: "Org", hi: false },
  { id: "tnrbudget", name: "Community Cat TNR budget.xlsx", badge: "TNR", hi: false },
]

/**
 * GAP-5 · Context tab as ONE flat list (no role taxonomy, no priority copy).
 * Each source carries an AI "plan" sentence (how it will be used) and an
 * optional user note rendered as a quote. `affected` is the fixture blast
 * radius surfaced when a source is edited.
 */
export interface RespondContextSource {
  id: string
  name: string
  kind: "file" | "link" | "note"
  meta: string
  plan: string
  note?: string
  /** Section labels this source drafted into — the blast radius on edit. */
  affected?: string[]
  /** New plan sentence shown after the source is edited. */
  editedPlan?: string
}

export const CONTEXT_SOURCES: RespondContextSource[] = [
  {
    id: "rfp",
    name: "Petco-Love-Lost-and-Found-RFP-2026.pdf",
    kind: "file",
    meta: "File · 9 requirements extracted",
    plan: "Answer every requirement and match the funder's scoring cues. This is the ask.",
  },
  {
    id: "petco24",
    name: "2024 Petco Love proposal",
    kind: "file",
    meta: "File · same funder · awarded $25,000",
    plan: "Write in this voice and structure. Skipping its program details.",
    note: "just match the tone, the details are outdated",
    affected: ["§2 Statement of Need"],
    editedPlan: "Re-read for voice and structure. Skipping its program details.",
  },
  {
    id: "impact",
    name: "2025 Impact Report.pdf",
    kind: "file",
    meta: "File",
    plan: "Pull stats and outcomes. Won't copy its wording.",
    affected: ["§1 Organization Background", "§3 Program Description"],
    editedPlan: "Re-pull the latest stats and outcomes. Won't copy its wording.",
  },
  {
    id: "spaywaggin",
    name: "spaywaggin.org/impact",
    kind: "link",
    meta: "Link · fetched Jul 14 · 6 pages read",
    plan: "Cite growth figures since 2024. Re-fetched only when you ask.",
    affected: ["§4 Goals & Outcomes"],
    editedPlan: "Cite the refreshed growth figures. Re-fetched only when you ask.",
  },
]

/**
 * GAP-6 · Version history. History holds only applied changes — no pending
 * suggestion, no gradient. AI-applied versions are marked with the quill
 * (solid), never the gradient sparkle. Minor autosaves cluster under a
 * checkpoint (children). Restore is non-destructive and adds a new version.
 */
export interface RespondVersionAuthor {
  ini: string
  color: string
  name: string
}
export interface RespondVersion {
  id: string
  date: string
  time: string
  authors: RespondVersionAuthor[]
  tag?: string
  name?: string
  /** Quill note shown on AI-applied versions (solid, never gradient). */
  aiNote?: string
  /** Edit count for the ‹ › stepper in the preview banner. */
  edits?: number
  preview: { base: string; added?: string }
  /** Minor autosaves clustered under this checkpoint. */
  children?: RespondVersion[]
}

const VH_TAYLOR: RespondVersionAuthor = { ini: "TS", color: "#7b5e7c", name: "Taylor S." }
const VH_ERIN: RespondVersionAuthor = { ini: "ES", color: "#4a6080", name: "Erin S." }

export const VERSIONS: RespondVersion[] = [
  {
    id: "v-cur",
    date: "Today",
    time: "2:14 PM",
    authors: [VH_TAYLOR],
    tag: "Current version",
    edits: 1,
    preview: {
      base: "In 2025, the program completed 1,840 surgeries and administered over 3,100 vaccinations.",
      added:
        "Each stop is scheduled in partnership with neighborhood associations and school family resource centers, which manage sign-ups in three languages.",
    },
  },
  {
    id: "v-432",
    date: "Yesterday",
    time: "4:32 PM",
    authors: [VH_ERIN, VH_TAYLOR],
    aiNote: "1 AI edit applied",
    edits: 2,
    preview: {
      base: "In 2025, the program completed 1,840 surgeries and administered over 3,100 vaccinations.",
      added:
        "Each stop is scheduled in partnership with neighborhood associations and school family resource centers, which manage sign-ups in three languages.",
    },
  },
  {
    id: "v-board",
    date: "Yesterday",
    time: "11:05 AM",
    authors: [VH_TAYLOR],
    name: "Board review draft",
    preview: {
      base: "In 2025, the program completed 1,840 surgeries and administered over 3,100 vaccinations.",
    },
  },
  {
    id: "v-cluster",
    date: "Jul 14",
    time: "9:41 AM",
    authors: [VH_ERIN],
    preview: { base: "The Spay Waggin is Whisker Haven Cat Rescue's mobile spay and neuter clinic." },
    children: [
      { id: "v-940", date: "Jul 14", time: "9:40 AM", authors: [VH_ERIN], preview: { base: "Autosave." } },
      { id: "v-935", date: "Jul 14", time: "9:35 AM", authors: [VH_ERIN], preview: { base: "Autosave." } },
    ],
  },
  {
    id: "v-init",
    date: "Jul 14",
    time: "9:12 AM",
    authors: [VH_TAYLOR],
    tag: "Initial AI draft",
    aiNote: "Drafted from RFP + sources",
    edits: 3,
    preview: {
      base:
        "The Spay Waggin is Whisker Haven Cat Rescue's mobile spay and neuter clinic, delivering no-cost sterilization and preventive care.",
      added:
        "Operating four days per week, the 26-foot clinic-on-wheels is staffed by one licensed veterinarian, two registered veterinary technicians, and a rotating team of trained volunteers.",
    },
  },
]

export interface RespondSnippet {
  id: string
  title: string
  scope: string
  uses: string
  body: string
}

export const SNIPPETS: RespondSnippet[] = [
  { id: "s1", title: "Mission statement — short", scope: "Organization", uses: "Used 14 times", body: "Whisker Haven Cat Rescue exists to end feline homelessness in Orange County through rescue, rehabilitation, and community-based prevention." },
  { id: "s2", title: "TNR impact stats 2025", scope: "Community Cat TNR", uses: "Used 6 times", body: "In 2025 our TNR program stabilized 14 colonies and sterilized 1,840 community cats, reducing intake at county shelters by 22%." },
  { id: "s3", title: "Board & governance boilerplate", scope: "Organization", uses: "Used 9 times", body: "Our nine-member board meets monthly and includes veterinary, finance, and community health expertise." },
]

export interface RespondLibFile {
  id: string
  name: string
  meta: string
  scope?: string
  locked?: boolean
}

export const LIB: {
  folders: { id: string; name: string; count: string }[]
  root: RespondLibFile[]
  budg: RespondLibFile[]
} = {
  folders: [
    { id: "gov", name: "Board & governance", count: "4 documents" },
    { id: "budg", name: "Budgets", count: "3 documents" },
    { id: "impact", name: "Impact reports", count: "5 documents" },
  ],
  root: [
    { id: "map", name: "Spay-Waggin-service-map-2026.pdf", meta: "Updated May 12 · in Budgets", scope: "Community Cat TNR" },
    { id: "impact25", name: "2025 Impact Report.pdf", meta: "Selected in the previous step", locked: true },
    { id: "vol", name: "Volunteer-program-overview.docx", meta: "Updated Apr 30", scope: "Organization" },
    { id: "photos", name: "Clinic-day-photos-and-captions.pdf", meta: "Updated Apr 2", scope: "Organization" },
    { id: "fin", name: "2024-audited-financials.pdf", meta: "Updated Feb 14 · in Budgets", scope: "Organization" },
  ],
  budg: [
    { id: "fin", name: "2024-audited-financials.pdf", meta: "Updated Feb 14 · used in 2 proposals" },
    { id: "fy26", name: "FY26-operating-budget.xlsx", meta: "Updated Jan 8" },
    { id: "cps", name: "Spay-Waggin-cost-per-surgery.xlsx", meta: "Updated Nov 2025" },
  ],
}

export interface RespondComment {
  id: string
  who: string
  ini: string
  color: string
  when: string
  sec: string
  body: string
}

export const COMMENTS: RespondComment[] = [
  { id: "c1", who: "Erin S.", ini: "ES", color: "#4a6080", when: "Yesterday", sec: "§3 Program Description", body: "Should we say five days? We added Saturdays in the spring." },
  { id: "c2", who: "Avery G.", ini: "AG", color: "#3c5e4c", when: "Yesterday", sec: "§2 Statement of Need", body: "This intake stat is from 2024. Do we have the 2025 county number?" },
  { id: "c3", who: "Taylor S.", ini: "TS", color: "#7b5e7c", when: "3d ago", sec: "§6 Budget Narrative", body: "Waiting on the fuel line item from bookkeeping before this is final." },
]

/** Picker display-name maps (short + full), keyed by lib file id. */
export const PICKER_NAMES: Record<string, string> = {
  map: "Spay-Waggin-service-map",
  vol: "Volunteer-program-over…",
  fin: "2024-audited-financials",
  photos: "Clinic-day-photos",
  fy26: "FY26-operating-budget",
  cps: "Cost-per-surgery",
}

export const PICKER_FULL_NAMES: Record<string, string> = {
  map: "Spay-Waggin-service-map-2026.pdf",
  vol: "Volunteer-program-overview.docx",
  fin: "2024-audited-financials.pdf",
  photos: "Clinic-day-photos-and-captions.pdf",
  fy26: "FY26-operating-budget.xlsx",
  cps: "Spay-Waggin-cost-per-surgery.xlsx",
}
