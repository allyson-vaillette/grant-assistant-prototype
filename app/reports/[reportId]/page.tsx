"use client"

/*
 * Report Editor — second pass.
 * Fills in AI Assistant (Insert/Regenerate/Dismiss, section-scoped), real Suggestions,
 * structured Context, and adds Evidence as a fourth tab.
 * Extends the first-pass shell; does not rebuild it.
 */

import React, { useState, useEffect, useRef, Suspense } from "react"
import Link from "next/link"
import { useSearchParams } from "next/navigation"
import { Bold, Italic, Underline, List, ListOrdered, ChevronLeft } from "lucide-react"

// ── Types ──────────────────────────────────────────────────────────────────

type ReportType = "Interim" | "Final" | "Progress"
type AITab = "assistant" | "suggestions" | "context" | "evidence"
type EditorState = "loading" | "ready"
type EvidenceScope = "award" | "evergreen"
type EvidenceType = "statistic" | "outcome" | "research" | "photo" | "document" | "link" | "other"

interface ParsedReportSection {
  id: string
  heading: string
  funderRequirement: string
  completion: "active" | "empty"
}

interface AssistantMessage {
  id: string
  role: "ai" | "user"
  body: string
  sectionId: string
  suggestion?: boolean
}

interface EvidenceItem {
  id: string
  scope: EvidenceScope
  ownerOpportunityId?: string
  initiativeId?: string
  label: string
  type: EvidenceType
  contentOrValue?: string
  source?: string
  date: string
  fileOrUrl?: string
  attachedSectionIds: string[]
}

interface SectionSuggestions {
  sectionId: string
  evidence: string[]
  proposalPhrasing: { promise: string; prompt: string }[]
}

// ── Icon maps ──────────────────────────────────────────────────────────────

const EVIDENCE_TYPE_ICONS: Record<EvidenceType, string> = {
  statistic: "bar_chart",
  outcome: "trending_up",
  research: "science",
  photo: "photo_camera",
  document: "description",
  link: "link",
  other: "category",
}

const EVIDENCE_TYPE_LABELS: Record<EvidenceType, string> = {
  statistic: "Statistic",
  outcome: "Outcome",
  research: "Research",
  photo: "Photo",
  document: "Document",
  link: "Link",
  other: "Other",
}

const ALL_EVIDENCE_TYPES: EvidenceType[] = [
  "statistic", "outcome", "research", "photo", "document", "link", "other",
]

// ── Fixtures ──────────────────────────────────────────────────────────────

const INITIAL_EVIDENCE_ITEMS: EvidenceItem[] = [
  // Award-specific — Equitable Futures Opportunity
  {
    id: "ev-1",
    scope: "award",
    ownerOpportunityId: "equitable-futures",
    label: "85 youth enrolled in after-school programs Q1",
    type: "statistic",
    contentOrValue: "85 youth ages 12–18 enrolled across 3 sites as of March 31, 2025.",
    source: "Program enrollment records",
    date: "2025-03-31",
    attachedSectionIds: [],
  },
  {
    id: "ev-2",
    scope: "award",
    ownerOpportunityId: "equitable-futures",
    label: "Graduation rate improved to 94% among participants",
    type: "outcome",
    contentOrValue: "Graduation rate rose from 88% (proposal baseline) to 94% among active program participants.",
    source: "School district data, May 2025",
    date: "2025-05-15",
    attachedSectionIds: [],
  },
  {
    id: "ev-3",
    scope: "award",
    ownerOpportunityId: "equitable-futures",
    label: "91% of surveyed youth reported improved academic confidence",
    type: "statistic",
    contentOrValue: "91% of surveyed participants (n=67) reported increased confidence in academic ability.",
    source: "Internal participant survey, April 2025",
    date: "2025-04-20",
    attachedSectionIds: [],
  },
  {
    id: "ev-4",
    scope: "award",
    ownerOpportunityId: "equitable-futures",
    label: "Site visit photos — Spring cohort",
    type: "photo",
    date: "2025-04-10",
    fileOrUrl: "spring-cohort-photos.zip",
    attachedSectionIds: [],
  },
  {
    id: "ev-5",
    scope: "award",
    ownerOpportunityId: "equitable-futures",
    label: "Budget-to-actual spreadsheet Q1",
    type: "document",
    date: "2025-04-01",
    fileOrUrl: "budget-actual-q1.xlsx",
    attachedSectionIds: [],
  },
  {
    id: "ev-6",
    scope: "award",
    ownerOpportunityId: "equitable-futures",
    label: "Staff transition: Feb coordinator departure",
    type: "outcome",
    contentOrValue: "Loss of two program coordinators in February caused a 3-week delay in activating the second cohort site.",
    date: "2025-03-01",
    attachedSectionIds: [],
  },
  {
    id: "ev-7",
    scope: "award",
    ownerOpportunityId: "equitable-futures",
    label: "Partnership MOU — Lincoln High School",
    type: "document",
    date: "2025-01-15",
    fileOrUrl: "lincoln-high-mou.pdf",
    attachedSectionIds: [],
  },
  // Evergreen — Youth Development Initiative
  {
    id: "ev-eg-1",
    scope: "evergreen",
    initiativeId: "youth-dev",
    label: "After-school programs improve graduation rates by 15%",
    type: "research",
    contentOrValue: "Afterschool Alliance (2023) meta-analysis of 47 studies found sustained after-school programming associated with a 15% average improvement in graduation rates.",
    source: "Afterschool Alliance, 2023",
    date: "2023-12-01",
    fileOrUrl: "https://afterschoolalliance.org/research",
    attachedSectionIds: [],
  },
  {
    id: "ev-eg-2",
    scope: "evergreen",
    initiativeId: "youth-dev",
    label: "Youth Development Initiative overview",
    type: "document",
    date: "2024-09-01",
    fileOrUrl: "ydi-overview.pdf",
    attachedSectionIds: [],
  },
  {
    id: "ev-eg-3",
    scope: "evergreen",
    initiativeId: "youth-dev",
    label: "Org impact statement 2024",
    type: "document",
    date: "2024-01-01",
    fileOrUrl: "impact-statement-2024.pdf",
    attachedSectionIds: [],
  },
]

const SCRIPTED_AI_RESPONSES: Record<string, { body: string; suggestion: boolean }[]> = {
  "executive-summary": [
    { body: "I can help you open strong. Your Q1 data shows solid enrollment and a meaningful outcomes gain. Here's a draft opening paragraph:", suggestion: false },
    { body: "During this reporting period, we enrolled 85 youth across three program sites and saw graduation rates climb to 94% among active participants — a 6-point gain from our proposal baseline. Despite a staffing transition in February, the program remained on track to meet its annual targets.", suggestion: true },
  ],
  "progress-against-goals": [
    { body: "You proposed serving 100 youth by mid-year. At Q1 you've reached 85 — 85% of pace. Here's a per-goal framing:", suggestion: false },
    { body: "Goal 1 — Enrollment: We enrolled 85 participants as of March 31, representing 85% of our mid-year target. With site capacity confirmed at Lincoln High School, we expect to reach 100 by June 1.\n\nGoal 2 — Academic support: 67 students participated in tutoring sessions; 91% reported improved academic confidence in post-session surveys.", suggestion: true },
  ],
  "outcomes-and-impact": [
    { body: "Your survey data and research make a compelling case here. Here's a narrative weaving both:", suggestion: false },
    { body: "The most significant outcome this period was a measurable shift in student confidence. Ninety-one percent of surveyed participants reported feeling more capable academically — consistent with Afterschool Alliance research showing a 15% graduation-rate improvement for youth in sustained programming.", suggestion: true },
  ],
  "challenges-and-adjustments": [
    { body: "You captured the staffing challenge in your evidence. Here's how to frame it honestly — transparent about the delay while showing your response:", suggestion: false },
    { body: "The loss of two program coordinators in February created a 3-week delay in activating our second cohort site. We responded by temporarily consolidating programming at our primary site and contracting two part-time facilitators while recruiting permanent staff. The delay did not materially affect participant outcomes.", suggestion: true },
  ],
  "financial-summary": [
    { body: "Reference your budget-to-actual spreadsheet for exact figures. Here's a summary narrative:", suggestion: false },
    { body: "Total expenditures through March 31 were $47,200, representing 38% of the $124,000 annual award. Personnel costs are running 4% under budget due to the February coordinator transition. Program supplies and site costs are on plan. No line-item variance exceeds the 10% reporting threshold.", suggestion: true },
  ],
  "next-period-plan": [
    { body: "Based on your Q1 experience, here's a forward-looking section with clear Q2 milestones:", suggestion: false },
    { body: "In Q2 we will activate the Lincoln High School site and enroll the remaining 15 participants to reach our mid-year target of 100. We will complete the coordinator search by May 15. Key milestones: full enrollment by June 1; first academic progress review with school counselors by June 15.", suggestion: true },
  ],
}

const SECTION_SUGGESTIONS: Record<string, SectionSuggestions> = {
  "executive-summary": {
    sectionId: "executive-summary",
    evidence: ["ev-1", "ev-2", "ev-eg-1"],
    proposalPhrasing: [
      { promise: "You proposed: \"Enroll 100 youth in evidence-based after-school programming across three sites.\"", prompt: "Report on enrollment progress: How many youth are enrolled, at how many sites?" },
      { promise: "You proposed: \"Demonstrate measurable improvement in academic outcomes by year end.\"", prompt: "Report early indicators: What academic signals have emerged this period?" },
    ],
  },
  "progress-against-goals": {
    sectionId: "progress-against-goals",
    evidence: ["ev-1", "ev-3", "ev-7"],
    proposalPhrasing: [
      { promise: "You proposed: \"Reach 100 enrolled youth by June 30.\"", prompt: "Report progress: 85 enrolled at Q1, 85% of mid-year pace." },
      { promise: "You proposed: \"Establish partnerships with two district high schools.\"", prompt: "Report partnership status: MOU signed with Lincoln High School." },
    ],
  },
  "outcomes-and-impact": {
    sectionId: "outcomes-and-impact",
    evidence: ["ev-2", "ev-3", "ev-4", "ev-eg-1"],
    proposalPhrasing: [
      { promise: "You proposed: \"94% graduation rate among participants by program completion.\"", prompt: "Report this milestone: Reached at Q1, 6 points ahead of schedule." },
      { promise: "You proposed: \"Measurable improvement in self-reported academic confidence.\"", prompt: "Report on the survey result: 91% of participants reported improved confidence." },
    ],
  },
  "challenges-and-adjustments": {
    sectionId: "challenges-and-adjustments",
    evidence: ["ev-6"],
    proposalPhrasing: [
      { promise: "You proposed: \"Maintain full staffing across all three sites.\"", prompt: "Report the deviation: February coordinator transition caused a 3-week delay at Site 2." },
    ],
  },
  "financial-summary": {
    sectionId: "financial-summary",
    evidence: ["ev-5"],
    proposalPhrasing: [
      { promise: "You proposed a $124,000 budget with 60% toward personnel.", prompt: "Report actuals: 38% expended at Q1. Personnel running 4% under due to transition." },
    ],
  },
  "next-period-plan": {
    sectionId: "next-period-plan",
    evidence: ["ev-7", "ev-eg-2"],
    proposalPhrasing: [
      { promise: "You proposed: \"Full enrollment of 100 youth by June 30.\"", prompt: "Plan for Q2: Activate Lincoln site and enroll remaining 15 participants." },
    ],
  },
}

const TEMPLATE_SECTIONS: ParsedReportSection[] = [
  { id: "executive-summary", heading: "Executive Summary", funderRequirement: "Provide a 2–3 paragraph overview of progress made during this reporting period, key highlights, and any significant developments relevant to the goals outlined in your original proposal.", completion: "active" },
  { id: "progress-against-goals", heading: "Progress Against Goals", funderRequirement: "For each goal outlined in your proposal, describe what you have accomplished in this reporting period. Include quantitative data and metrics where available. Goals with no activity should be noted with an explanation.", completion: "empty" },
  { id: "outcomes-and-impact", heading: "Outcomes and Impact", funderRequirement: "Describe the outcomes achieved and the evidence of impact on the communities and individuals served during this period. Include illustrative stories or case studies where available.", completion: "empty" },
  { id: "challenges-and-adjustments", heading: "Challenges and Adjustments", funderRequirement: "Describe any significant challenges encountered and how your organization responded. If any project activities were modified from the original plan, explain why and how these changes align with your original goals.", completion: "empty" },
  { id: "financial-summary", heading: "Financial Summary", funderRequirement: "Provide a summary of expenditures to date against the approved budget. Note any variances greater than 10% and explain the reasons. Attach a budget-to-actual spreadsheet if available.", completion: "empty" },
  { id: "next-period-plan", heading: "Next Period Plan", funderRequirement: "Describe planned activities for the next reporting period, key milestones you expect to achieve, anticipated challenges, and any guidance needed from the foundation.", completion: "empty" },
]

const LOADING_SECTIONS_PLACEHOLDER = 6

// ── Helpers ───────────────────────────────────────────────────────────────

function MIcon({
  name, size = 20, color, style,
}: { name: string; size?: number; color?: string; style?: React.CSSProperties }) {
  return (
    <span
      className="material-symbols-outlined"
      style={{ fontSize: size, lineHeight: 1, color: color ?? "inherit", userSelect: "none", ...style }}
    >
      {name}
    </span>
  )
}

function NavItem({ section, isActive, onClick }: { section: ParsedReportSection; isActive: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{ display: "flex", alignItems: "center", gap: 10, width: "100%", padding: "8px 12px", borderRadius: 8, backgroundColor: isActive ? "rgba(255,255,255,0.12)" : "transparent", border: "none", cursor: "pointer", textAlign: "left", transition: "background-color 150ms" }}
      onMouseEnter={(e) => { if (!isActive) (e.currentTarget as HTMLButtonElement).style.backgroundColor = "rgba(255,255,255,0.07)" }}
      onMouseLeave={(e) => { if (!isActive) (e.currentTarget as HTMLButtonElement).style.backgroundColor = "transparent" }}
    >
      {section.completion === "active" ? (
        <svg width="10" height="10" viewBox="0 0 10 10" fill="none" style={{ flexShrink: 0 }}>
          <circle cx="5" cy="5" r="5" fill="var(--slate-primary)" />
        </svg>
      ) : (
        <svg width="10" height="10" viewBox="0 0 10 10" fill="none" style={{ flexShrink: 0 }}>
          <circle cx="5" cy="5" r="4" stroke="rgba(255,255,255,0.3)" strokeWidth="1.2" fill="none" />
        </svg>
      )}
      <span style={{ fontSize: 13, fontWeight: isActive ? 600 : 400, color: isActive ? "#FFFFFF" : section.completion === "empty" ? "rgba(255,255,255,0.4)" : "rgba(255,255,255,0.85)", lineHeight: "16px" }}>
        {section.heading}
      </span>
    </button>
  )
}

function NavItemSkeleton({ index }: { index: number }) {
  const widths = [120, 148, 108, 156, 100, 130]
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 12px" }}>
      <div style={{ width: 10, height: 10, borderRadius: "50%", border: "1px solid rgba(255,255,255,0.2)", flexShrink: 0 }} />
      <div style={{ height: 10, borderRadius: 4, backgroundColor: "rgba(255,255,255,0.1)", width: widths[index % widths.length] }} />
    </div>
  )
}

function formatPeriod(start: string, end: string): string {
  if (!start || !end) return ""
  try {
    const s = new Date(start + "T12:00:00")
    const e = new Date(end + "T12:00:00")
    const fmt = new Intl.DateTimeFormat("en-US", { month: "short", year: "numeric" })
    return `${fmt.format(s)} - ${fmt.format(e)}`
  } catch { return `${start} to ${end}` }
}

function formatDate(iso: string): string {
  if (!iso) return ""
  try {
    return new Date(iso + "T12:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
  } catch { return iso }
}

// ── Main component ─────────────────────────────────────────────────────────

function ReportEditorContent() {
  const searchParams = useSearchParams()

  const reportName = searchParams.get("reportName") ?? "Progress Report"
  const reportType = (searchParams.get("reportType") as ReportType) ?? "Progress"
  const opportunityName = searchParams.get("opportunityName") ?? "Equitable Futures Youth Development"
  const opportunityId = searchParams.get("opportunityId") ?? "equitable-futures"
  const periodStart = searchParams.get("periodStart") ?? ""
  const periodEnd = searchParams.get("periodEnd") ?? ""
  const dueDate = searchParams.get("dueDate") ?? ""
  const templateName = searchParams.get("templateName") ?? "Funder report template"
  const templateKind = searchParams.get("templateKind") ?? ""

  // Core state
  const [editorState, setEditorState] = useState<EditorState>("loading")
  const [fileProcessing, setFileProcessing] = useState(templateKind === "file")
  const [activeId, setActiveId] = useState<string>(TEMPLATE_SECTIONS[0].id)
  const [aiTab, setAiTab] = useState<AITab>("assistant")

  // AI Assistant
  const [chatInput, setChatInput] = useState("")
  const [messages, setMessages] = useState<AssistantMessage[]>([])
  const [typing, setTyping] = useState(false)
  const [messageActions, setMessageActions] = useState<Record<string, "inserted" | "dismissed">>({})

  // Evidence
  const [evidenceItems, setEvidenceItems] = useState<EvidenceItem[]>(INITIAL_EVIDENCE_ITEMS)
  const [evidenceTypeFilter, setEvidenceTypeFilter] = useState<EvidenceType | "all">("all")
  const [evidenceAttachFilter, setEvidenceAttachFilter] = useState<"all" | "attached" | "unattached">("all")
  const [showAddEvidence, setShowAddEvidence] = useState(false)
  const [newEvidence, setNewEvidence] = useState({
    label: "",
    type: "statistic" as EvidenceType,
    date: new Date().toISOString().split("T")[0],
    fileOrUrl: "",
  })

  // Context
  const [removedContextIds, setRemovedContextIds] = useState<string[]>([])

  // Refs
  const sectionRefs = useRef<Record<string, HTMLDivElement | null>>({})
  const chatBottomRef = useRef<HTMLDivElement>(null)

  const period = formatPeriod(periodStart, periodEnd)
  const formattedDue = formatDate(dueDate)
  const sectionCount = TEMPLATE_SECTIONS.length
  const activeSection = TEMPLATE_SECTIONS.find((s) => s.id === activeId) ?? TEMPLATE_SECTIONS[0]
  const isLoading = editorState === "loading"
  const bodyH = "calc(100vh - 44px - 40px)"

  useEffect(() => {
    const t1 = setTimeout(() => {
      setEditorState("ready")
      setMessages([{
        id: "init",
        role: "ai",
        body: `I've loaded your ${templateName ? `"${templateName}"` : "funder report template"} and found ${sectionCount} sections. This is your ${reportType} report for ${opportunityName}${period ? `, covering ${period}` : ""}. Start writing in any section, or ask me to help draft one.`,
        sectionId: TEMPLATE_SECTIONS[0].id,
      }])
    }, 1500)
    let t2: ReturnType<typeof setTimeout> | undefined
    if (fileProcessing) {
      t2 = setTimeout(() => setFileProcessing(false), 3000)
    }
    return () => { clearTimeout(t1); if (t2) clearTimeout(t2) }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages, typing])

  function insertIntoSection(sectionId: string, text: string) {
    const el = sectionRefs.current[sectionId]
    if (!el) return
    el.focus()
    const sel = window.getSelection()
    if (!sel || !el.contains(sel.anchorNode)) {
      const range = document.createRange()
      range.selectNodeContents(el)
      range.collapse(false)
      sel?.removeAllRanges()
      sel?.addRange(range)
    }
    const prefix = el.textContent?.trim() ? "\n\n" : ""
    // execCommand is deprecated but the most pragmatic insert for contentEditable prototypes
    document.execCommand("insertText", false, prefix + text)
  }

  function handleSendChat() {
    if (!chatInput.trim()) return
    const text = chatInput.trim()
    setChatInput("")
    setMessages((prev) => [...prev, { id: `user-${Date.now()}`, role: "user", body: text, sectionId: activeId }])
    setTyping(true)
    setTimeout(() => {
      setTyping(false)
      const scripted = SCRIPTED_AI_RESPONSES[activeId]
      const responses: { body: string; suggestion: boolean }[] = scripted ?? [
        { body: `I can help you write the ${activeSection.heading} section. What specific aspect would you like to develop?`, suggestion: false },
      ]
      const ts = Date.now()
      setMessages((prev) => [
        ...prev,
        ...responses.map((r, i) => ({
          id: `ai-${ts}-${i}`,
          role: "ai" as const,
          body: r.body,
          sectionId: activeId,
          suggestion: r.suggestion,
        })),
      ])
    }, 1500)
  }

  function handleRegenerate(msgId: string) {
    const section = TEMPLATE_SECTIONS.find((s) => s.id === activeId)
    const fallbackBody = `Here's another way to approach the ${section?.heading ?? "section"}:`
    const ts = Date.now()
    setMessages((prev) => [
      ...prev,
      {
        id: `ai-regen-${ts}`,
        role: "ai" as const,
        body: fallbackBody,
        sectionId: activeId,
      },
      {
        id: `ai-regen-${ts}-1`,
        role: "ai" as const,
        body: SCRIPTED_AI_RESPONSES[activeId]?.[1]?.body ?? `Try writing the ${section?.heading ?? "section"} in a more direct voice, leading with your strongest outcome.`,
        sectionId: activeId,
        suggestion: true,
      },
    ])
    setMessageActions((prev) => ({ ...prev, [msgId]: "dismissed" }))
  }

  function attachEvidence(evidenceId: string) {
    setEvidenceItems((prev) =>
      prev.map((item) =>
        item.id === evidenceId && !item.attachedSectionIds.includes(activeId)
          ? { ...item, attachedSectionIds: [...item.attachedSectionIds, activeId] }
          : item
      )
    )
  }

  function detachEvidence(evidenceId: string) {
    setEvidenceItems((prev) =>
      prev.map((item) =>
        item.id === evidenceId
          ? { ...item, attachedSectionIds: item.attachedSectionIds.filter((id) => id !== activeId) }
          : item
      )
    )
  }

  function handleAddEvidence() {
    if (!newEvidence.label.trim()) return
    const item: EvidenceItem = {
      id: `ev-new-${Date.now()}`,
      scope: "award",
      ownerOpportunityId: opportunityId,
      label: newEvidence.label.trim(),
      type: newEvidence.type,
      date: newEvidence.date,
      fileOrUrl: newEvidence.fileOrUrl.trim() || undefined,
      attachedSectionIds: [],
    }
    setEvidenceItems((prev) => [item, ...prev])
    setNewEvidence({ label: "", type: "statistic", date: new Date().toISOString().split("T")[0], fileOrUrl: "" })
    setShowAddEvidence(false)
  }

  // Derived — filtered evidence
  function applyFilters(items: EvidenceItem[]): EvidenceItem[] {
    return items.filter((item) => {
      const typeOk = evidenceTypeFilter === "all" || item.type === evidenceTypeFilter
      const attachOk =
        evidenceAttachFilter === "all" ||
        (evidenceAttachFilter === "attached" && item.attachedSectionIds.includes(activeId)) ||
        (evidenceAttachFilter === "unattached" && !item.attachedSectionIds.includes(activeId))
      return typeOk && attachOk
    })
  }

  const awardEvidence = evidenceItems.filter((i) => i.scope === "award")
  const evergreenEvidence = evidenceItems.filter((i) => i.scope === "evergreen")
  const filteredAward = applyFilters(awardEvidence)
  const filteredEvergreen = applyFilters(evergreenEvidence)

  // Derived — context items (ordered, reactive)
  const attachedCount = awardEvidence.filter((i) => i.attachedSectionIds.includes(activeId)).length
  const contextGroups: { groupLabel: string; items: { id: string; icon: string; label: string; meta: string }[] }[] = [
    {
      groupLabel: "Uploaded documents",
      items: [
        { id: "ctx-template", icon: "description", label: templateName || "Funder report template", meta: `${sectionCount} sections parsed` },
        { id: "ctx-prior", icon: "history", label: "Prior year Interim Report", meta: "Uploaded" },
      ],
    },
    {
      groupLabel: "Funder requirements",
      items: [
        { id: "ctx-section-req", icon: "rule", label: `Section requirements: ${activeSection.heading}`, meta: "Active section" },
      ],
    },
    {
      groupLabel: "Proposal",
      items: [
        { id: "ctx-proposal", icon: "article", label: "Submitted Proposal", meta: opportunityName },
      ],
    },
    {
      groupLabel: "Evidence",
      items: [
        { id: "ctx-evidence-award", icon: "attachment", label: "Award evidence items", meta: attachedCount > 0 ? `${attachedCount} attached to this section` : "None attached to this section" },
        { id: "ctx-evidence-eg", icon: "recycling", label: "Initiative evidence items", meta: "Youth Development Initiative" },
      ],
    },
    {
      groupLabel: "Financial",
      items: [
        { id: "ctx-budget", icon: "account_balance_wallet", label: "Budget and Expenses", meta: opportunityName },
      ],
    },
    {
      groupLabel: "Initiative",
      items: [
        { id: "ctx-initiative", icon: "rocket_launch", label: "Youth Development Initiative profile", meta: "Matched initiative" },
      ],
    },
    {
      groupLabel: "Organization",
      items: [
        { id: "ctx-org", icon: "corporate_fare", label: "Org profile and writing style", meta: "FreeWill" },
      ],
    },
  ]

  // Derived — suggestions for active section
  const sectionSuggestions = SECTION_SUGGESTIONS[activeId]
  const suggestedEvidence: EvidenceItem[] = sectionSuggestions
    ? sectionSuggestions.evidence
        .map((id) => evidenceItems.find((item) => item.id === id))
        .filter((item): item is EvidenceItem => Boolean(item))
    : []

  // Split suggested evidence by scope for ordering (award first)
  const suggestedAward = suggestedEvidence.filter((i) => i.scope === "award")
  const suggestedEvergreen = suggestedEvidence.filter((i) => i.scope === "evergreen")

  // ── Render ─────────────────────────────────────────────────────────────

  return (
    <div
      className="flex flex-col"
      style={{ height: "100vh", overflow: "hidden", backgroundColor: "var(--surface)" }}
    >
      {/* Top bar */}
      <div style={{ flexShrink: 0, height: 44, display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 20px", backgroundColor: "var(--surface)", borderBottom: "var(--border-subtle)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <Link
            href={`/opportunity/${opportunityId}`}
            style={{ width: 26, height: 26, display: "flex", alignItems: "center", justifyContent: "center", borderRadius: 6, border: "var(--border-subtle)", backgroundColor: "var(--surface)", textDecoration: "none", flexShrink: 0 }}
          >
            <ChevronLeft size={13} color="var(--ink-secondary)" />
          </Link>
          <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13, color: "var(--ink-tertiary)" }}>
            <Link href={`/opportunity/${opportunityId}`} style={{ color: "var(--ink-tertiary)", textDecoration: "none" }}>{opportunityName}</Link>
            <span>›</span>
            <span style={{ color: "var(--ink)", fontWeight: 500 }}>{reportName}</span>
          </div>
          <span style={{ borderRadius: 20, padding: "2px 8px", backgroundColor: "var(--canvas)", border: "var(--border-subtle)", fontSize: 11, fontWeight: 500, color: "var(--ink-secondary)" }}>
            {reportType}
          </span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <circle cx="7" cy="7" r="6" stroke="var(--evergreen)" strokeWidth="1" fill="none" />
            <path d="M4.5 7.2l1.7 1.7 3.3-3.3" stroke="var(--evergreen)" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          <span style={{ fontSize: 12, color: "var(--ink-tertiary)", marginRight: 12 }}>Autosaved</span>
          <button type="button" style={outlineBtn} onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.backgroundColor = "var(--canvas)" }} onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.backgroundColor = "transparent" }}>
            <MIcon name="ios_share" size={13} color="var(--ink-secondary)" />
            Share
          </button>
          <button type="button" style={outlineBtn} onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.backgroundColor = "var(--canvas)" }} onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.backgroundColor = "transparent" }}>
            Submit
          </button>
          <button
            type="button"
            style={{ padding: "7px 16px", borderRadius: 8, backgroundColor: "var(--slate-primary)", border: "none", fontSize: 13, fontWeight: 500, color: "#FFFFFF", cursor: "pointer", transition: "background-color 150ms" }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.backgroundColor = "#3A4F6A" }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.backgroundColor = "var(--slate-primary)" }}
          >
            Save draft
          </button>
        </div>
      </div>

      {/* Toolbar */}
      <div style={{ flexShrink: 0, display: "flex", alignItems: "center", gap: 2, padding: "0 20px", height: 40, backgroundColor: "var(--surface)", borderBottom: "var(--border-subtle)" }}>
        {[Bold, Italic, Underline].map((Icon, i) => (
          <button key={i} type="button" style={toolbarBtn} onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.backgroundColor = "var(--canvas)" }} onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.backgroundColor = "transparent" }}>
            <Icon size={13} color="var(--ink-secondary)" />
          </button>
        ))}
        <div style={{ width: 1, height: 16, backgroundColor: "rgba(42, 42, 42, 0.08)", margin: "0 4px" }} />
        {["H1", "H2"].map((t) => (
          <button key={t} type="button" style={{ ...toolbarBtn, fontSize: 12, fontWeight: 600, color: "var(--ink-secondary)" }} onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.backgroundColor = "var(--canvas)" }} onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.backgroundColor = "transparent" }}>
            {t}
          </button>
        ))}
        <div style={{ width: 1, height: 16, backgroundColor: "rgba(42, 42, 42, 0.08)", margin: "0 4px" }} />
        {[List, ListOrdered].map((Icon, i) => (
          <button key={i} type="button" style={toolbarBtn} onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.backgroundColor = "var(--canvas)" }} onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.backgroundColor = "transparent" }}>
            <Icon size={13} color="var(--ink-secondary)" />
          </button>
        ))}
      </div>

      {/* Three-column body */}
      <div style={{ display: "flex", height: bodyH, overflow: "hidden" }}>

        {/* Left: section nav */}
        <aside style={{ width: 220, flexShrink: 0, background: "var(--gradient-ai-sidebar)", borderRight: "1px solid rgba(255,255,255,0.08)", overflowY: "auto", display: "flex", flexDirection: "column", height: "100%" }}>
          <div style={{ flexShrink: 0, padding: "14px 12px 8px 14px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <span style={{ fontSize: 10, fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase", color: "rgba(255,255,255,0.35)" }}>
              Sections
            </span>
          </div>
          <div style={{ flex: 1, padding: "0 8px", display: "flex", flexDirection: "column", gap: 2 }}>
            {isLoading
              ? Array.from({ length: LOADING_SECTIONS_PLACEHOLDER }).map((_, i) => <NavItemSkeleton key={i} index={i} />)
              : TEMPLATE_SECTIONS.map((s) => (
                  <NavItem
                    key={s.id}
                    section={s}
                    isActive={s.id === activeId}
                    onClick={() => {
                      setActiveId(s.id)
                      document.getElementById(`report-section-${s.id}`)?.scrollIntoView({ behavior: "smooth", block: "start" })
                    }}
                  />
                ))}
          </div>
          <div style={{ flexShrink: 0, padding: "12px 14px 16px", borderTop: "1px solid rgba(255,255,255,0.08)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
              <span style={{ fontSize: 11, color: "rgba(255,255,255,0.45)" }}>Progress</span>
              <span style={{ fontSize: 11, fontWeight: 600, color: "rgba(255,255,255,0.7)" }}>{isLoading ? "—" : "0%"}</span>
            </div>
            <div style={{ height: 4, borderRadius: 2, backgroundColor: "rgba(255,255,255,0.1)" }}>
              {!isLoading && <div style={{ height: "100%", borderRadius: 2, backgroundColor: "var(--slate-secondary)", width: "0%", transition: "width 400ms ease" }} />}
            </div>
          </div>
        </aside>

        {/* Center: writing surface */}
        <div style={{ flex: 1, overflowY: "auto", backgroundColor: "var(--canvas)", height: "100%" }}>
          {isLoading ? (
            <div style={{ maxWidth: 720, margin: "0 auto", padding: "40px 40px 120px 40px", backgroundColor: "var(--surface)", minHeight: "100%", boxShadow: "0 0 0 1px rgba(42,42,42,0.04)" }}>
              <div style={{ marginBottom: 32 }}>
                <div style={{ height: 28, borderRadius: 6, backgroundColor: "var(--canvas)", width: "60%", marginBottom: 10 }} />
                <div style={{ height: 14, borderRadius: 4, backgroundColor: "var(--canvas)", width: "30%" }} />
              </div>
              <div style={{ height: 1, backgroundColor: "rgba(42, 42, 42, 0.08)", marginBottom: 36 }} />
              <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "14px 16px", borderRadius: 10, backgroundColor: "var(--canvas)", boxShadow: "var(--shadow-card)" }}>
                <div style={{ width: 16, height: 16, borderRadius: "50%", border: "2px solid var(--slate-soft)", borderTopColor: "var(--slate-primary)", animation: "spin 0.8s linear infinite", flexShrink: 0 }} />
                <span style={{ fontSize: 13, color: "var(--ink-tertiary)" }}>Analyzing template and preparing sections...</span>
              </div>
            </div>
          ) : (
            <div style={{ maxWidth: 720, margin: "0 auto", padding: "40px 40px 120px 40px", backgroundColor: "var(--surface)", minHeight: "100%", boxShadow: "0 0 0 1px rgba(42,42,42,0.04)" }}>
              {/* Doc header */}
              <div style={{ marginBottom: 32 }}>
                <h1 style={{ margin: "0 0 6px", fontSize: 26, fontWeight: 500, color: "var(--ink)", fontFamily: "var(--font-lora)", letterSpacing: "-0.02em" }}>
                  {reportName}
                </h1>
                <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" as const }}>
                  <span style={{ fontSize: 13, fontWeight: 500, color: "var(--slate-secondary)" }}>{opportunityName}</span>
                  {period && <><span style={{ fontSize: 13, color: "var(--ink-tertiary)" }}>·</span><span style={{ fontSize: 13, color: "var(--ink-tertiary)" }}>{period}</span></>}
                  {formattedDue && <><span style={{ fontSize: 13, color: "var(--ink-tertiary)" }}>·</span><span style={{ fontSize: 13, color: "var(--ink-tertiary)" }}>Due {formattedDue}</span></>}
                </div>
              </div>
              <div style={{ height: 1, backgroundColor: "rgba(42, 42, 42, 0.08)", marginBottom: 36 }} />

              {/* Sections */}
              {TEMPLATE_SECTIONS.map((section) => {
                const isActive = section.id === activeId
                return (
                  <div
                    key={section.id}
                    id={`report-section-${section.id}`}
                    onClick={() => setActiveId(section.id)}
                    style={{ marginBottom: 44, cursor: "text" }}
                  >
                    <h2 style={{ margin: "0 0 12px", fontSize: 18, fontWeight: 500, color: "var(--ink)", fontFamily: "var(--font-lora)", borderBottom: isActive ? "2px solid var(--slate-primary)" : "2px solid transparent", paddingBottom: 4, display: "inline-block", transition: "border-color 150ms", letterSpacing: "-0.01em" }}>
                      {section.heading}
                    </h2>
                    <div style={{ padding: "10px 14px", marginBottom: 14, borderRadius: 8, backgroundColor: "#F5F0F6", borderLeft: "3px solid #AD9DAE" }}>
                      <p style={{ margin: 0, fontSize: 13, color: "var(--ink-secondary)", lineHeight: "19px", fontStyle: "italic" }}>
                        {section.funderRequirement}
                      </p>
                    </div>
                    <div
                      contentEditable
                      suppressContentEditableWarning
                      ref={(el: HTMLDivElement | null) => { sectionRefs.current[section.id] = el }}
                      data-placeholder={`Write your ${section.heading.toLowerCase()} here, or ask the AI assistant for help...`}
                      style={{ minHeight: 80, fontSize: 15, color: "var(--ink)", lineHeight: "26px", outline: "none", caretColor: "var(--slate-primary)", whiteSpace: "pre-wrap" }}
                      onFocus={() => setActiveId(section.id)}
                    />
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Right: AI panel */}
        <div style={{ width: 360, flexShrink: 0, borderLeft: "var(--border-subtle)", backgroundColor: "var(--canvas)", display: "flex", flexDirection: "column", height: "100%", overflow: "hidden" }}>

          {/* Section scope header */}
          {!isLoading && (
            <div style={{ flexShrink: 0, padding: "7px 14px 6px", backgroundColor: "var(--slate-tint)", borderBottom: "var(--border-subtle)", display: "flex", alignItems: "center", gap: 6 }}>
              <MIcon name="auto_fix_high" size={13} color="var(--slate-secondary)" />
              <span style={{ fontSize: 11, color: "var(--ink-secondary)" }}>
                Helping with: <strong style={{ fontWeight: 600, color: "var(--ink)" }}>{activeSection.heading}</strong>
              </span>
            </div>
          )}

          {/* Tabs */}
          <div style={{ flexShrink: 0, display: "flex", borderBottom: "var(--border-subtle)", padding: "0 14px", backgroundColor: "var(--canvas)" }}>
            {(["assistant", "suggestions", "context", "evidence"] as AITab[]).map((tab) => {
              const labels: Record<AITab, string> = { assistant: "AI Assistant", suggestions: "Suggestions", context: "Context", evidence: "Evidence" }
              const isA = aiTab === tab
              return (
                <button
                  key={tab}
                  type="button"
                  onClick={() => setAiTab(tab)}
                  style={{ position: "relative", padding: "10px 3px", marginRight: 8, background: "none", border: "none", cursor: "pointer", fontSize: 12.5, fontWeight: isA ? 600 : 400, color: isA ? "var(--slate-primary)" : "var(--ink-secondary)", transition: "color 150ms", borderRadius: 4, whiteSpace: "nowrap" }}
                >
                  {labels[tab]}
                  {isA && <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: 2, borderRadius: 1, backgroundColor: "var(--slate-primary)" }} />}
                </button>
              )
            })}
          </div>

          {/* Panel body */}
          <div style={{ flex: 1, overflowY: "auto", padding: "14px 14px" }}>

            {/* ── AI Assistant ── */}
            {aiTab === "assistant" && (
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {isLoading ? (
                  <>
                    <div style={{ display: "flex", gap: 8, alignItems: "flex-start" }}>
                      <div style={{ width: 22, height: 22, borderRadius: "50%", background: "var(--gradient-avatar)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, marginTop: 1 }}>
                        <span style={{ fontSize: 8, fontWeight: 700, color: "#FFF" }}>GA</span>
                      </div>
                      <div style={{ flex: 1, padding: "10px 12px", borderRadius: 10, backgroundColor: "var(--surface)", boxShadow: "var(--shadow-card)", fontSize: 13, color: "var(--ink)", lineHeight: "19px" }}>
                        Setting up your report...
                      </div>
                    </div>
                    {fileProcessing && templateName && (
                      <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 12px", borderRadius: 8, backgroundColor: "var(--canvas)", border: "var(--border-subtle)", fontSize: 12, color: "var(--ink-secondary)" }}>
                        <div style={{ width: 12, height: 12, borderRadius: "50%", border: "1.5px solid var(--slate-soft)", borderTopColor: "var(--slate-primary)", animation: "spin 0.8s linear infinite", flexShrink: 0 }} />
                        Still processing {templateName}...
                      </div>
                    )}
                  </>
                ) : (
                  <>
                    {messages.map((msg) => {
                      const action = messageActions[msg.id]
                      const isSuggestion = msg.suggestion && action == null
                      const isInserted = action === "inserted"
                      const isDismissed = action === "dismissed"
                      if (isDismissed && !msg.suggestion) return null
                      return (
                        <div key={msg.id} style={{ display: "flex", gap: 8, alignItems: "flex-start" }}>
                          {msg.role === "ai" && (
                            <div style={{ width: 22, height: 22, borderRadius: "50%", background: "var(--gradient-avatar)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, marginTop: 1 }}>
                              <span style={{ fontSize: 8, fontWeight: 700, color: "#FFF" }}>GA</span>
                            </div>
                          )}
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div
                              style={{
                                padding: "10px 12px",
                                borderRadius: 10,
                                backgroundColor: msg.role === "ai" ? "var(--surface)" : "var(--slate-tint)",
                                boxShadow: "var(--shadow-card)",
                                fontSize: 13,
                                color: "var(--ink)",
                                lineHeight: "19px",
                                whiteSpace: "pre-wrap",
                                opacity: isDismissed ? 0.4 : 1,
                              }}
                            >
                              {msg.body}
                            </div>
                            {isSuggestion && (
                              <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 6 }}>
                                <button
                                  type="button"
                                  onClick={() => {
                                    insertIntoSection(activeId, msg.body)
                                    setMessageActions((prev) => ({ ...prev, [msg.id]: "inserted" }))
                                  }}
                                  style={{ padding: "5px 12px", borderRadius: 6, backgroundColor: "var(--slate-primary)", border: "none", fontSize: 12, fontWeight: 500, color: "#FFF", cursor: "pointer" }}
                                >
                                  Insert
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleRegenerate(msg.id)}
                                  style={{ display: "flex", alignItems: "center", gap: 4, padding: "5px 10px", borderRadius: 6, backgroundColor: "transparent", border: "var(--border-subtle)", fontSize: 12, color: "var(--ink-secondary)", cursor: "pointer" }}
                                >
                                  <MIcon name="refresh" size={13} />
                                  Regenerate
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setMessageActions((prev) => ({ ...prev, [msg.id]: "dismissed" }))}
                                  style={{ display: "flex", alignItems: "center", justifyContent: "center", width: 26, height: 26, borderRadius: 6, backgroundColor: "transparent", border: "none", cursor: "pointer" }}
                                >
                                  <MIcon name="close" size={14} color="var(--ink-tertiary)" />
                                </button>
                              </div>
                            )}
                            {isInserted && (
                              <div style={{ display: "flex", alignItems: "center", gap: 4, marginTop: 6 }}>
                                <MIcon name="check_circle" size={13} color="var(--evergreen)" />
                                <span style={{ fontSize: 11, color: "var(--evergreen)" }}>Inserted</span>
                              </div>
                            )}
                          </div>
                        </div>
                      )
                    })}
                    {typing && (
                      <div style={{ display: "flex", gap: 8, alignItems: "flex-start" }}>
                        <div style={{ width: 22, height: 22, borderRadius: "50%", background: "var(--gradient-avatar)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                          <span style={{ fontSize: 8, fontWeight: 700, color: "#FFF" }}>GA</span>
                        </div>
                        <div style={{ padding: "10px 14px", borderRadius: 10, backgroundColor: "var(--surface)", boxShadow: "var(--shadow-card)" }}>
                          <span style={{ fontSize: 18, color: "var(--ink-tertiary)", letterSpacing: 2 }}>···</span>
                        </div>
                      </div>
                    )}
                    <div ref={chatBottomRef} />
                  </>
                )}
              </div>
            )}

            {/* ── Suggestions ── */}
            {aiTab === "suggestions" && (
              <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                {isLoading ? (
                  <p style={{ fontSize: 13, color: "var(--ink-tertiary)", margin: 0 }}>Preparing suggestions...</p>
                ) : (
                  <>
                    {/* Evidence suggestions */}
                    {suggestedEvidence.length > 0 && (
                      <div>
                        <p style={{ margin: "0 0 8px", fontSize: 10, fontWeight: 600, letterSpacing: "0.07em", textTransform: "uppercase", color: "var(--ink-tertiary)" }}>
                          Relevant evidence
                        </p>
                        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                          {suggestedAward.map((item) => (
                            <SuggestionEvidenceCard
                              key={item.id}
                              item={item}
                              onInsert={() => insertIntoSection(activeId, item.contentOrValue ?? item.label)}
                            />
                          ))}
                          {suggestedEvergreen.length > 0 && (
                            <>
                              <p style={{ margin: "4px 0 4px", fontSize: 11, color: "var(--ink-tertiary)", fontStyle: "italic" }}>From initiative</p>
                              {suggestedEvergreen.map((item) => (
                                <SuggestionEvidenceCard
                                  key={item.id}
                                  item={item}
                                  onInsert={() => insertIntoSection(activeId, item.contentOrValue ?? item.label)}
                                />
                              ))}
                            </>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Proposal phrasing */}
                    {sectionSuggestions && sectionSuggestions.proposalPhrasing.length > 0 && (
                      <div>
                        <p style={{ margin: "0 0 8px", fontSize: 10, fontWeight: 600, letterSpacing: "0.07em", textTransform: "uppercase", color: "var(--ink-tertiary)" }}>
                          From your proposal
                        </p>
                        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                          {sectionSuggestions.proposalPhrasing.map((item, i) => (
                            <div key={i} style={{ padding: "10px 12px", borderRadius: 8, backgroundColor: "var(--surface)", boxShadow: "var(--shadow-card)" }}>
                              <p style={{ margin: "0 0 6px", fontSize: 12, color: "var(--ink-secondary)", lineHeight: "17px", fontStyle: "italic" }}>
                                {item.promise}
                              </p>
                              <p style={{ margin: 0, fontSize: 12, color: "var(--ink)", lineHeight: "17px", fontWeight: 500 }}>
                                {item.prompt}
                              </p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {!sectionSuggestions && (
                      <div style={{ padding: "14px", borderRadius: 10, backgroundColor: "var(--canvas)", border: "var(--border-subtle)" }}>
                        <p style={{ margin: 0, fontSize: 13, color: "var(--ink-tertiary)", lineHeight: "19px" }}>
                          Suggestions for <strong style={{ color: "var(--ink)" }}>{activeSection.heading}</strong> will appear here once you start writing.
                        </p>
                      </div>
                    )}
                  </>
                )}
              </div>
            )}

            {/* ── Context ── */}
            {aiTab === "context" && (
              <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                {contextGroups.map((group) => {
                  const visibleItems = group.items.filter((i) => !removedContextIds.includes(i.id))
                  if (visibleItems.length === 0) return null
                  return (
                    <div key={group.groupLabel}>
                      <p style={{ margin: "0 0 6px", fontSize: 10, fontWeight: 600, letterSpacing: "0.07em", textTransform: "uppercase", color: "var(--ink-tertiary)" }}>
                        {group.groupLabel}
                      </p>
                      <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                        {visibleItems.map((item) => (
                          <div
                            key={item.id}
                            style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 10px", borderRadius: 8, backgroundColor: "var(--surface)", boxShadow: "var(--shadow-card)" }}
                          >
                            <MIcon name={item.icon} size={15} color="var(--slate-secondary)" style={{ flexShrink: 0 }} />
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <p style={{ margin: 0, fontSize: 12, fontWeight: 500, color: "var(--ink)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                                {item.label}
                              </p>
                              <p style={{ margin: 0, fontSize: 11, color: "var(--ink-tertiary)" }}>{item.meta}</p>
                            </div>
                            <button
                              type="button"
                              onClick={() => setRemovedContextIds((prev) => [...prev, item.id])}
                              style={{ flexShrink: 0, width: 22, height: 22, display: "flex", alignItems: "center", justifyContent: "center", borderRadius: 4, border: "none", backgroundColor: "transparent", cursor: "pointer", opacity: 0.5 }}
                              title="Remove from context"
                            >
                              <MIcon name="close" size={13} color="var(--ink-secondary)" />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )
                })}
                {removedContextIds.length > 0 && (
                  <button
                    type="button"
                    onClick={() => setRemovedContextIds([])}
                    style={{ alignSelf: "flex-start", fontSize: 12, color: "var(--slate-secondary)", background: "none", border: "none", cursor: "pointer", textDecoration: "underline", padding: 0 }}
                  >
                    Restore all removed
                  </button>
                )}
              </div>
            )}

            {/* ── Evidence ── */}
            {aiTab === "evidence" && (
              <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>

                {/* Filters */}
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {/* Type filter */}
                  <div style={{ display: "flex", flexWrap: "wrap" as const, gap: 4 }}>
                    {(["all", ...ALL_EVIDENCE_TYPES] as const).map((t) => (
                      <button
                        key={t}
                        type="button"
                        onClick={() => setEvidenceTypeFilter(t === "all" ? "all" : t as EvidenceType)}
                        style={{
                          padding: "3px 8px",
                          borderRadius: 20,
                          fontSize: 11,
                          fontWeight: evidenceTypeFilter === t ? 600 : 400,
                          color: evidenceTypeFilter === t ? "var(--slate-primary)" : "var(--ink-secondary)",
                          backgroundColor: evidenceTypeFilter === t ? "var(--slate-tint)" : "transparent",
                          border: evidenceTypeFilter === t ? "1px solid var(--slate-light)" : "1px solid var(--border-default)",
                          cursor: "pointer",
                        }}
                      >
                        {t === "all" ? "All types" : EVIDENCE_TYPE_LABELS[t as EvidenceType]}
                      </button>
                    ))}
                  </div>
                  {/* Attach filter */}
                  <div style={{ display: "flex", gap: 4 }}>
                    {(["all", "attached", "unattached"] as const).map((f) => {
                      const labels = { all: "All", attached: "Attached", unattached: "Unattached" }
                      const isActive = evidenceAttachFilter === f
                      return (
                        <button
                          key={f}
                          type="button"
                          onClick={() => setEvidenceAttachFilter(f)}
                          style={{ padding: "3px 8px", borderRadius: 20, fontSize: 11, fontWeight: isActive ? 600 : 400, color: isActive ? "var(--slate-primary)" : "var(--ink-secondary)", backgroundColor: isActive ? "var(--slate-tint)" : "transparent", border: isActive ? "1px solid var(--slate-light)" : "1px solid var(--border-default)", cursor: "pointer" }}
                        >
                          {labels[f]}
                        </button>
                      )
                    })}
                  </div>
                </div>

                {/* Primary: award-specific */}
                <div>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
                    <p style={{ margin: 0, fontSize: 10, fontWeight: 600, letterSpacing: "0.07em", textTransform: "uppercase", color: "var(--ink-tertiary)" }}>
                      This Opportunity — {opportunityName}
                    </p>
                    <button
                      type="button"
                      onClick={() => setShowAddEvidence((v) => !v)}
                      style={{ display: "flex", alignItems: "center", gap: 3, padding: "3px 8px", borderRadius: 6, backgroundColor: "var(--slate-primary)", border: "none", fontSize: 11, fontWeight: 500, color: "#FFF", cursor: "pointer" }}
                    >
                      <MIcon name="add" size={13} color="#FFF" />
                      Add evidence
                    </button>
                  </div>

                  {/* Inline add form */}
                  {showAddEvidence && (
                    <div style={{ padding: "12px", borderRadius: 8, backgroundColor: "var(--surface)", border: "1px solid var(--slate-light)", marginBottom: 8 }}>
                      <p style={{ margin: "0 0 10px", fontSize: 12, fontWeight: 600, color: "var(--ink)" }}>New evidence item</p>
                      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                        <input
                          type="text"
                          placeholder="Label (required)"
                          value={newEvidence.label}
                          onChange={(e) => setNewEvidence((prev) => ({ ...prev, label: e.target.value }))}
                          style={{ padding: "7px 10px", borderRadius: 6, border: "1px solid var(--border-default)", fontSize: 12, color: "var(--ink)", backgroundColor: "var(--canvas)", outline: "none" }}
                        />
                        <div style={{ display: "flex", gap: 6 }}>
                          <select
                            value={newEvidence.type}
                            onChange={(e) => setNewEvidence((prev) => ({ ...prev, type: e.target.value as EvidenceType }))}
                            style={{ flex: 1, padding: "7px 10px", borderRadius: 6, border: "1px solid var(--border-default)", fontSize: 12, color: "var(--ink)", backgroundColor: "var(--canvas)", outline: "none" }}
                          >
                            {ALL_EVIDENCE_TYPES.map((t) => (
                              <option key={t} value={t}>{EVIDENCE_TYPE_LABELS[t]}</option>
                            ))}
                          </select>
                          <input
                            type="date"
                            value={newEvidence.date}
                            onChange={(e) => setNewEvidence((prev) => ({ ...prev, date: e.target.value }))}
                            style={{ flex: 1, padding: "7px 8px", borderRadius: 6, border: "1px solid var(--border-default)", fontSize: 12, color: "var(--ink)", backgroundColor: "var(--canvas)", outline: "none" }}
                          />
                        </div>
                        <input
                          type="text"
                          placeholder="File name or URL (optional)"
                          value={newEvidence.fileOrUrl}
                          onChange={(e) => setNewEvidence((prev) => ({ ...prev, fileOrUrl: e.target.value }))}
                          style={{ padding: "7px 10px", borderRadius: 6, border: "1px solid var(--border-default)", fontSize: 12, color: "var(--ink)", backgroundColor: "var(--canvas)", outline: "none" }}
                        />
                        <div style={{ display: "flex", gap: 6 }}>
                          <button
                            type="button"
                            onClick={handleAddEvidence}
                            disabled={!newEvidence.label.trim()}
                            style={{ flex: 1, padding: "7px", borderRadius: 6, backgroundColor: newEvidence.label.trim() ? "var(--slate-primary)" : "var(--slate-soft)", border: "none", fontSize: 12, fontWeight: 500, color: "#FFF", cursor: newEvidence.label.trim() ? "pointer" : "default" }}
                          >
                            Save
                          </button>
                          <button
                            type="button"
                            onClick={() => setShowAddEvidence(false)}
                            style={{ flex: 1, padding: "7px", borderRadius: 6, backgroundColor: "transparent", border: "var(--border-subtle)", fontSize: 12, color: "var(--ink-secondary)", cursor: "pointer" }}
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Award list */}
                  {filteredAward.length === 0 ? (
                    <div style={{ padding: "20px 14px", borderRadius: 10, backgroundColor: "var(--canvas)", border: "1px dashed var(--border-default)", textAlign: "center" }}>
                      {awardEvidence.length === 0 ? (
                        <>
                          <MIcon name="add_circle" size={24} color="var(--slate-soft)" style={{ display: "block", margin: "0 auto 8px" }} />
                          <p style={{ margin: "0 0 4px", fontSize: 13, fontWeight: 500, color: "var(--ink)" }}>No evidence captured yet</p>
                          <p style={{ margin: 0, fontSize: 12, color: "var(--ink-tertiary)", lineHeight: "17px" }}>
                            Add statistics, outcomes, photos, or documents as evidence for this report. You can proceed without evidence.
                          </p>
                        </>
                      ) : (
                        <p style={{ margin: 0, fontSize: 12, color: "var(--ink-tertiary)" }}>No items match the current filters.</p>
                      )}
                    </div>
                  ) : (
                    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                      {filteredAward.map((item) => (
                        <EvidenceCard
                          key={item.id}
                          item={item}
                          activeId={activeId}
                          onAttach={() => attachEvidence(item.id)}
                          onDetach={() => detachEvidence(item.id)}
                        />
                      ))}
                    </div>
                  )}
                </div>

                {/* Divider */}
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <div style={{ flex: 1, height: 1, backgroundColor: "rgba(42, 42, 42, 0.08)" }} />
                  <span style={{ fontSize: 10, fontWeight: 600, letterSpacing: "0.07em", textTransform: "uppercase", color: "var(--ink-tertiary)", whiteSpace: "nowrap" }}>
                    Initiative — reusable
                  </span>
                  <div style={{ flex: 1, height: 1, backgroundColor: "rgba(42, 42, 42, 0.08)" }} />
                </div>

                {/* Secondary: evergreen */}
                <div>
                  <p style={{ margin: "0 0 6px", fontSize: 10, fontWeight: 600, letterSpacing: "0.07em", textTransform: "uppercase", color: "var(--ink-tertiary)" }}>
                    Youth Development Initiative
                  </p>
                  <p style={{ margin: "0 0 8px", fontSize: 11, color: "var(--ink-tertiary)", lineHeight: "15px" }}>
                    Evergreen proof points reusable across proposals and reports.
                  </p>
                  {filteredEvergreen.length === 0 ? (
                    <p style={{ fontSize: 12, color: "var(--ink-tertiary)", margin: 0 }}>No items match the current filters.</p>
                  ) : (
                    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                      {filteredEvergreen.map((item) => (
                        <EvidenceCard
                          key={item.id}
                          item={item}
                          activeId={activeId}
                          onAttach={() => attachEvidence(item.id)}
                          onDetach={() => detachEvidence(item.id)}
                          muted
                        />
                      ))}
                    </div>
                  )}
                </div>

              </div>
            )}

          </div>

          {/* Chat input — assistant tab only */}
          {aiTab === "assistant" && !isLoading && (
            <div style={{ flexShrink: 0, borderTop: "var(--border-subtle)", padding: "10px 14px", backgroundColor: "var(--canvas)" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 12px", borderRadius: 9, backgroundColor: "var(--surface)", border: "var(--border-subtle)" }}>
                <input
                  type="text"
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter") handleSendChat() }}
                  placeholder={`Ask anything about ${activeSection.heading}...`}
                  style={{ flex: 1, background: "none", border: "none", outline: "none", fontSize: 12, color: "var(--ink)" }}
                />
                <button
                  type="button"
                  onClick={handleSendChat}
                  style={{ width: 26, height: 26, borderRadius: 6, backgroundColor: "var(--slate-primary)", border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}
                >
                  <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                    <path d="M2 5h6M6 2.5L8.5 5 6 7.5" stroke="#fff" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        [contenteditable]:empty:before {
          content: attr(data-placeholder);
          color: var(--ink-tertiary);
          font-style: italic;
          pointer-events: none;
        }
      `}</style>
    </div>
  )
}

// ── Sub-components ─────────────────────────────────────────────────────────

function SuggestionEvidenceCard({ item, onInsert }: { item: EvidenceItem; onInsert: () => void }) {
  return (
    <div style={{ display: "flex", alignItems: "flex-start", gap: 8, padding: "9px 10px", borderRadius: 8, backgroundColor: "var(--surface)", boxShadow: "var(--shadow-card)" }}>
      <MIcon name={EVIDENCE_TYPE_ICONS[item.type]} size={15} color="var(--slate-secondary)" style={{ flexShrink: 0, marginTop: 1 }} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ margin: "0 0 2px", fontSize: 12, fontWeight: 500, color: "var(--ink)", lineHeight: "16px" }}>{item.label}</p>
        <p style={{ margin: 0, fontSize: 11, color: "var(--ink-tertiary)" }}>{EVIDENCE_TYPE_LABELS[item.type]} · {item.date}</p>
      </div>
      <button
        type="button"
        onClick={onInsert}
        style={{ flexShrink: 0, padding: "3px 8px", borderRadius: 5, backgroundColor: "var(--slate-tint)", border: "1px solid var(--slate-light)", fontSize: 11, fontWeight: 500, color: "var(--slate-primary)", cursor: "pointer" }}
      >
        Insert
      </button>
    </div>
  )
}

function EvidenceCard({
  item, activeId, onAttach, onDetach, muted = false,
}: {
  item: EvidenceItem
  activeId: string
  onAttach: () => void
  onDetach: () => void
  muted?: boolean
}) {
  const isAttached = item.attachedSectionIds.includes(activeId)
  return (
    <div
      style={{
        padding: "9px 10px",
        borderRadius: 8,
        backgroundColor: muted ? "var(--canvas)" : "var(--surface)",
        border: isAttached ? "1px solid var(--slate-light)" : "1px solid var(--border-default)",
      }}
    >
      <div style={{ display: "flex", alignItems: "flex-start", gap: 8 }}>
        <div style={{ width: 26, height: 26, borderRadius: 6, backgroundColor: isAttached ? "var(--slate-tint)" : "var(--canvas)", border: "var(--border-subtle)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
          <MIcon name={EVIDENCE_TYPE_ICONS[item.type]} size={14} color={isAttached ? "var(--slate-primary)" : "var(--ink-secondary)"} />
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{ margin: "0 0 2px", fontSize: 12, fontWeight: 500, color: "var(--ink)", lineHeight: "16px" }}>{item.label}</p>
          <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" as const }}>
            <span style={{ fontSize: 11, color: "var(--ink-tertiary)" }}>{EVIDENCE_TYPE_LABELS[item.type]}</span>
            <span style={{ fontSize: 11, color: "var(--ink-tertiary)" }}>·</span>
            <span style={{ fontSize: 11, color: "var(--ink-tertiary)" }}>{item.date}</span>
            {item.fileOrUrl && (
              <>
                <span style={{ fontSize: 11, color: "var(--ink-tertiary)" }}>·</span>
                <span style={{ fontSize: 11, color: "var(--slate-secondary)" }}>{item.fileOrUrl.startsWith("http") ? "Link" : item.fileOrUrl}</span>
              </>
            )}
          </div>
        </div>
      </div>
      {item.contentOrValue && (
        <p style={{ margin: "6px 0 0 34px", fontSize: 11, color: "var(--ink-secondary)", lineHeight: "16px" }}>
          {item.contentOrValue.length > 100 ? item.contentOrValue.slice(0, 100) + "…" : item.contentOrValue}
        </p>
      )}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: 8 }}>
        {isAttached ? (
          <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
            <MIcon name="attach_file" size={12} color="var(--slate-primary)" />
            <span style={{ fontSize: 11, color: "var(--slate-primary)", fontWeight: 500 }}>Attached to this section</span>
          </div>
        ) : (
          <div />
        )}
        <button
          type="button"
          onClick={isAttached ? onDetach : onAttach}
          style={{ padding: "3px 8px", borderRadius: 5, backgroundColor: isAttached ? "transparent" : "var(--slate-tint)", border: isAttached ? "var(--border-subtle)" : "1px solid var(--slate-light)", fontSize: 11, fontWeight: 500, color: isAttached ? "var(--ink-secondary)" : "var(--slate-primary)", cursor: "pointer" }}
        >
          {isAttached ? "Remove" : "Attach"}
        </button>
      </div>
    </div>
  )
}

// ── Page wrapper ───────────────────────────────────────────────────────────

export default function ReportEditorPage() {
  return (
    <Suspense fallback={null}>
      <ReportEditorContent />
    </Suspense>
  )
}

// ── Style constants ────────────────────────────────────────────────────────

const outlineBtn: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: 5,
  padding: "6px 14px",
  borderRadius: 8,
  backgroundColor: "transparent",
  border: "var(--border-subtle)",
  fontSize: 13,
  color: "var(--ink)",
  cursor: "pointer",
  transition: "background-color 150ms",
}

const toolbarBtn: React.CSSProperties = {
  width: 28,
  height: 28,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  borderRadius: 5,
  border: "none",
  backgroundColor: "transparent",
  cursor: "pointer",
  transition: "background-color 150ms",
}
