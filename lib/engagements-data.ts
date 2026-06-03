export type EngagementStatus = "Active" | "Lapsed" | "Closed"
export type OpportunityStage = "Active" | "Submitted" | "Tracking" | "Awarded" | "Reporting" | "Complete" | "Declined" | "Abandoned"

export interface Opportunity {
  id: string
  name: string
  stage: OpportunityStage
  amount: string
  deadline?: string
  sub: string
  noteCount?: number
  oppFileCount?: number
}

export interface Note {
  id: string
  text: string
  date: string
  author: string
}

export interface EngagementAttachment {
  id: string
  filename: string
  label?: string
  fileType: "pdf" | "docx" | "image" | "sheet" | "other"
  uploadDate: string
  uploader: string
}

export interface Engagement {
  id: string
  name: string
  status: EngagementStatus
  sinceDateLabel: string
  totalAwarded: string
  lapsedOrClosedSince?: string
  fileCount?: number
  overdueItem?: boolean
  opportunities: Opportunity[]
  notes: Note[]
  attachments: EngagementAttachment[]
  awardHistory: { year: number; amount: number }[]
  stats: {
    inPursuit: string
    awaiting: string
    awardedLifetime: string
    openTasks: number
    openTasksAlert?: string
    awardedLastYear?: string
    lastAwardedLabel?: string
  }
}

export const STAGE_DOT: Record<OpportunityStage, string> = {
  Active:    "#6B819E",
  Submitted: "#AD9DAE",
  Tracking:  "#A6B3C5",
  Awarded:   "#4A7A5E",
  Reporting: "#D19A66",
  Complete:  "#4A7A5E",
  Declined:  "#C4C4C4",
  Abandoned: "#C4C4C4",
}

export const STAGE_BADGE: Record<OpportunityStage, { bg: string; color: string }> = {
  Active:    { bg: "#EBF0F5", color: "#4A6080" },
  Submitted: { bg: "#F2EDF3", color: "#7A5F7E" },
  Tracking:  { bg: "#F5F5F6", color: "#8A8A99" },
  Awarded:   { bg: "#EBF5EF", color: "#2E6B47" },
  Reporting: { bg: "#F5EAD8", color: "#8A5A2A" },
  Complete:  { bg: "#EBF5EF", color: "#2E6B47" },
  Declined:  { bg: "#F5F5F6", color: "#8A8A99" },
  Abandoned: { bg: "#F5F5F6", color: "#8A8A99" },
}

export const INITIAL_ENGAGEMENTS: Engagement[] = [
  {
    id: "ford",
    name: "Ford Foundation",
    status: "Active",
    sinceDateLabel: "Since March 2023",
    totalAwarded: "$195,000 awarded",
    fileCount: 5,
    overdueItem: false,
    opportunities: [
      { id: "equitable-futures", name: "Equitable Futures Grant 2026", stage: "Active", amount: "$75,000", deadline: "Due Jun 15, 2026", sub: "1 draft · 3 tasks open", noteCount: 2, oppFileCount: 3 },
      { id: "community-voice", name: "Community Voice Initiative", stage: "Submitted", amount: "$120,000", sub: "Submitted Mar 2, 2026", noteCount: 1, oppFileCount: 1 },
      { id: "civic-engagement", name: "Civic Engagement Seed Fund", stage: "Tracking", amount: "$50,000", deadline: "Deadline Sep 1, 2026", sub: "No proposals yet" },
      { id: "ford-justice-2024", name: "Justice Initiative 2024", stage: "Complete", amount: "$75,000", sub: "Awarded Dec 2024 · Final report submitted", noteCount: 3, oppFileCount: 5 },
      { id: "ford-justice-2023", name: "Equitable Cities Fund 2023", stage: "Complete", amount: "$120,000", sub: "Awarded Nov 2023 · Final report submitted", noteCount: 2, oppFileCount: 4 },
      { id: "ford-arts-2022", name: "Community Arts Partnership", stage: "Declined", amount: "$50,000", sub: "Declined Feb 2022" },
    ],
    notes: [
      { id: "ford-note-1", text: "Called program officer Dana Reeves on Apr 12. She mentioned they're prioritizing urban orgs this cycle.", date: "Apr 12, 2026", author: "Taylor S." },
      { id: "ford-note-2", text: "LOI feedback was positive. Strong narrative around community voice resonated.", date: "Mar 18, 2026", author: "Taylor S." },
    ],
    attachments: [
      { id: "ford-att-1", filename: "Ford Foundation MOU 2023.pdf", fileType: "pdf", uploadDate: "Mar 15, 2023", uploader: "Taylor S." },
      { id: "ford-att-2", filename: "Dana Reeves Contact Notes.docx", fileType: "docx", uploadDate: "Apr 12, 2026", uploader: "Taylor S." },
    ],
    awardHistory: [{ year: 2022, amount: 0 }, { year: 2023, amount: 120000 }, { year: 2024, amount: 75000 }, { year: 2025, amount: 0 }, { year: 2026, amount: 0 }],
    stats: { inPursuit: "$125,000", awaiting: "$120,000", awardedLifetime: "$195,000", openTasks: 3, openTasksAlert: "1 due today", awardedLastYear: "$75,000" },
  },
  {
    id: "kresge",
    name: "Kresge Foundation",
    status: "Active",
    sinceDateLabel: "Since Jan 2024",
    totalAwarded: "$0 awarded",
    fileCount: 2,
    overdueItem: false,
    opportunities: [
      { id: "kresge-housing", name: "Housing Equity Initiative", stage: "Active", amount: "$90,000", deadline: "Due Jun 9, 2026", sub: "1 draft · 1 task open", noteCount: 1 },
      { id: "kresge-community", name: "Community Development Grant", stage: "Tracking", amount: "$60,000", deadline: "Deadline Aug 1, 2026", sub: "No proposals yet" },
    ],
    notes: [{ id: "kresge-note-1", text: "Met with program team at conference. Strong interest in our foster care data.", date: "Mar 5, 2026", author: "Taylor S." }],
    attachments: [],
    awardHistory: [{ year: 2022, amount: 0 }, { year: 2023, amount: 0 }, { year: 2024, amount: 0 }, { year: 2025, amount: 0 }, { year: 2026, amount: 0 }],
    stats: { inPursuit: "$90,000", awaiting: "$0", awardedLifetime: "$0", openTasks: 1 },
  },
  {
    id: "casey",
    name: "Annie E. Casey Foundation",
    status: "Lapsed",
    sinceDateLabel: "Since Sep 2022",
    totalAwarded: "$45,000 awarded",
    lapsedOrClosedSince: "Feb 2025",
    fileCount: 3,
    overdueItem: true,
    opportunities: [
      { id: "casey-youth", name: "Youth Services Grant 2026", stage: "Submitted", amount: "$45,000", sub: "Submitted Jan 15, 2026 · Awaiting decision", noteCount: 1 },
      { id: "casey-family-2022", name: "Family Stability Fund 2022", stage: "Complete", amount: "$45,000", sub: "Awarded Sep 2022 · Final report submitted", noteCount: 2, oppFileCount: 3 },
      { id: "casey-workforce", name: "Workforce Initiative", stage: "Declined", amount: "$60,000", sub: "Declined Mar 2024" },
    ],
    notes: [{ id: "casey-note-1", text: "Previous cycle application scored well on community impact section.", date: "Feb 2, 2026", author: "Taylor S." }],
    attachments: [{ id: "casey-att-1", filename: "Casey Foundation Grant Agreement 2022.pdf", fileType: "pdf", uploadDate: "Sep 12, 2022", uploader: "Taylor S." }],
    awardHistory: [{ year: 2022, amount: 45000 }, { year: 2023, amount: 0 }, { year: 2024, amount: 0 }, { year: 2025, amount: 0 }, { year: 2026, amount: 0 }],
    stats: { inPursuit: "$0", awaiting: "$45,000", awardedLifetime: "$45,000", openTasks: 0, lastAwardedLabel: "Sep 2022" },
  },
  {
    id: "rwj",
    name: "Robert Wood Johnson",
    status: "Active",
    sinceDateLabel: "Since Jun 2023",
    totalAwarded: "$80,000 awarded",
    fileCount: 4,
    overdueItem: false,
    opportunities: [
      { id: "rwj-health", name: "Health Equity 2026", stage: "Active", amount: "$120,000", deadline: "Due Jul 1, 2026", sub: "2 drafts · 1 task open", noteCount: 2, oppFileCount: 1 },
      { id: "rwj-community", name: "Community Resilience Grant", stage: "Submitted", amount: "$80,000", sub: "Submitted Feb 20, 2026", noteCount: 1 },
      { id: "rwj-youth", name: "Youth Wellness Initiative", stage: "Tracking", amount: "$55,000", deadline: "Deadline Nov 1, 2026", sub: "No proposals yet" },
      { id: "rwj-rural", name: "Rural Access Program", stage: "Tracking", amount: "$40,000", deadline: "Deadline Dec 15, 2026", sub: "No proposals yet" },
      { id: "rwj-health-2023", name: "Health Systems Grant 2023", stage: "Complete", amount: "$80,000", sub: "Awarded Jun 2023 · Final report submitted", noteCount: 1, oppFileCount: 4 },
      { id: "rwj-mental-health", name: "Mental Health Access Pilot", stage: "Declined", amount: "$50,000", sub: "Declined Nov 2024" },
    ],
    notes: [{ id: "rwj-note-1", text: "Program officer confirmed eligibility for Health Equity track.", date: "Apr 3, 2026", author: "Taylor S." }],
    attachments: [{ id: "rwj-att-1", filename: "RWJF Program Officer Notes Q1 2026.pdf", fileType: "pdf", uploadDate: "Apr 3, 2026", uploader: "Taylor S." }],
    awardHistory: [{ year: 2022, amount: 0 }, { year: 2023, amount: 80000 }, { year: 2024, amount: 0 }, { year: 2025, amount: 0 }, { year: 2026, amount: 0 }],
    stats: { inPursuit: "$120,000", awaiting: "$80,000", awardedLifetime: "$80,000", openTasks: 1, awardedLastYear: "$80,000" },
  },
  {
    id: "kellogg",
    name: "W.K. Kellogg Foundation",
    status: "Active",
    sinceDateLabel: "Since Feb 2024",
    totalAwarded: "$95,000 awarded",
    fileCount: 2,
    overdueItem: true,
    opportunities: [
      { id: "kellogg-food", name: "Food Security Grant", stage: "Active", amount: "$70,000", deadline: "Due Sep 30, 2026", sub: "1 draft", noteCount: 1 },
      { id: "kellogg-early", name: "Community Resilience", stage: "Submitted", amount: "$95,000", sub: "Submitted Apr 1, 2026", noteCount: 1, oppFileCount: 2 },
      { id: "kellogg-early-child", name: "Early Childhood Initiative 2025", stage: "Awarded", amount: "$95,000", sub: "Awarded Jan 2025 · Reporting period active", noteCount: 2, oppFileCount: 3 },
    ],
    notes: [{ id: "kellogg-note-1", text: "Strong alignment with WKKF's 2026 priority areas in education.", date: "Apr 8, 2026", author: "Taylor S." }],
    attachments: [],
    awardHistory: [{ year: 2022, amount: 0 }, { year: 2023, amount: 0 }, { year: 2024, amount: 0 }, { year: 2025, amount: 95000 }, { year: 2026, amount: 0 }],
    stats: { inPursuit: "$70,000", awaiting: "$95,000", awardedLifetime: "$95,000", openTasks: 0, awardedLastYear: "$95,000" },
  },
  {
    id: "macarthur",
    name: "MacArthur Foundation",
    status: "Active",
    sinceDateLabel: "Since Nov 2024",
    totalAwarded: "$0 awarded",
    fileCount: 0,
    overdueItem: false,
    opportunities: [
      { id: "macarthur-100", name: "100&Change Proposal Support", stage: "Active", amount: "$100,000", deadline: "Due Aug 15, 2026", sub: "1 draft · 2 tasks open", noteCount: 1 },
    ],
    notes: [{ id: "macarthur-note-1", text: "Attended 100&Change webinar. Strong fit with our systems-change framing.", date: "Mar 28, 2026", author: "Taylor S." }],
    attachments: [],
    awardHistory: [{ year: 2022, amount: 0 }, { year: 2023, amount: 0 }, { year: 2024, amount: 0 }, { year: 2025, amount: 0 }, { year: 2026, amount: 0 }],
    stats: { inPursuit: "$100,000", awaiting: "$0", awardedLifetime: "$0", openTasks: 2 },
  },
]
