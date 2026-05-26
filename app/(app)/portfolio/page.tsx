"use client"

import React, { useState, useRef, useEffect, useCallback, Suspense } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Search, Plus, X, ExternalLink, Pencil } from "lucide-react"
import { NewEngagementModal, type NewEngagementData } from "@/components/proposals/NewEngagementModal"

// ── Types ──────────────────────────────────────────────────────────────────

type EngagementStatus = "Active" | "Lapsed" | "Closed"
type OpportunityStage = "Active" | "Submitted" | "Tracking" | "Awarded"

interface Opportunity {
  id: string
  name: string
  stage: OpportunityStage
  amount: string
  deadline?: string
  sub: string
}

interface Note {
  id: string
  text: string
  date: string
  author: string
}

interface Engagement {
  id: string
  name: string
  status: EngagementStatus
  sinceDateLabel: string
  totalAwarded: string
  opportunities: Opportunity[]
  notes: Note[]
  stats: {
    inPursuit: string
    awaiting: string
    awardedLifetime: string
    openTasks: number
    openTasksAlert?: string
  }
}

interface FunderProfile {
  type: string
  website: string
  focusAreas: string[]
  geography: string
  fundingRange: string
  description: string
}

interface NewOppData {
  name: string
  deadline?: string
  amount?: string
  stage: OpportunityStage
}

// ── Funder profiles ────────────────────────────────────────────────────────

const FUNDERS: Record<string, FunderProfile> = {
  ford: {
    type: "Private foundation",
    website: "https://www.fordfoundation.org",
    focusAreas: ["Social Justice", "Economic Equity", "Housing", "Arts & Culture"],
    geography: "National (U.S.) + International",
    fundingRange: "$25,000 – $500,000",
    description: "The Ford Foundation supports visionary leaders and organizations on the frontlines of social change worldwide, working toward greater economic and social equity.",
  },
  kresge: {
    type: "Private foundation",
    website: "https://kresge.org",
    focusAreas: ["Housing", "Climate", "Education", "Health", "Arts"],
    geography: "National (U.S.)",
    fundingRange: "$50,000 – $300,000",
    description: "The Kresge Foundation works to expand equity and opportunity in cities across America, with a focus on low-income residents in underserved urban communities.",
  },
  casey: {
    type: "Private foundation",
    website: "https://www.aecf.org",
    focusAreas: ["Child Welfare", "Youth Development", "Community Development", "Data & Research"],
    geography: "National (U.S.)",
    fundingRange: "$25,000 – $150,000",
    description: "The Annie E. Casey Foundation fosters public policies, human-service reforms, and community supports that meet the needs of vulnerable children and families.",
  },
  rwj: {
    type: "Private foundation",
    website: "https://www.rwjf.org",
    focusAreas: ["Health Equity", "Public Health", "Community Health", "Mental Health"],
    geography: "National (U.S.)",
    fundingRange: "$50,000 – $250,000",
    description: "The Robert Wood Johnson Foundation works to build a Culture of Health, enabling everyone in America to live longer, healthier lives regardless of who they are or where they live.",
  },
  kellogg: {
    type: "Private foundation",
    website: "https://www.wkkf.org",
    focusAreas: ["Food Systems", "Early Childhood", "Education", "Civic Engagement"],
    geography: "National (U.S.) + International",
    fundingRange: "$30,000 – $200,000",
    description: "The W.K. Kellogg Foundation supports children, families, and communities as they strengthen and create conditions that propel vulnerable children to achieve success.",
  },
  macarthur: {
    type: "Private foundation",
    website: "https://www.macfound.org",
    focusAreas: ["Criminal Justice", "Climate", "Nuclear Risk", "Journalism", "Arts"],
    geography: "National (U.S.) + International",
    fundingRange: "$100,000 – $15,000,000",
    description: "The MacArthur Foundation supports creative people, effective institutions, and influential networks building a more just, verdant, and peaceful world.",
  },
}

// ── Initial data ───────────────────────────────────────────────────────────

const INITIAL_ENGAGEMENTS: Engagement[] = [
  {
    id: "ford",
    name: "Ford Foundation",
    status: "Active",
    sinceDateLabel: "Since March 2023",
    totalAwarded: "$195,000 awarded",
    opportunities: [
      {
        id: "equitable-futures",
        name: "Equitable Futures Grant 2026",
        stage: "Active",
        amount: "$75,000",
        deadline: "Due Jun 15, 2026",
        sub: "1 draft · 3 tasks open",
      },
      {
        id: "community-voice",
        name: "Community Voice Initiative",
        stage: "Submitted",
        amount: "$120,000",
        sub: "Submitted Mar 2, 2026",
      },
      {
        id: "civic-engagement",
        name: "Civic Engagement Seed Fund",
        stage: "Tracking",
        amount: "$50,000",
        deadline: "Deadline Sep 1, 2026",
        sub: "No proposals yet",
      },
    ],
    notes: [
      {
        id: "ford-note-1",
        text: "Called program officer Dana Reeves on Apr 12. She mentioned they're prioritizing urban orgs this cycle.",
        date: "Apr 12, 2026",
        author: "Taylor S.",
      },
      {
        id: "ford-note-2",
        text: "LOI feedback was positive. Strong narrative around community voice resonated.",
        date: "Mar 18, 2026",
        author: "Taylor S.",
      },
    ],
    stats: {
      inPursuit: "$125,000",
      awaiting: "$120,000",
      awardedLifetime: "$195,000",
      openTasks: 3,
      openTasksAlert: "1 due today",
    },
  },
  {
    id: "kresge",
    name: "Kresge Foundation",
    status: "Active",
    sinceDateLabel: "Since Jan 2024",
    totalAwarded: "$0 awarded",
    opportunities: [
      {
        id: "kresge-housing",
        name: "Housing Equity Initiative",
        stage: "Active",
        amount: "$90,000",
        deadline: "Due Jun 9, 2026",
        sub: "1 draft · 1 task open",
      },
      {
        id: "kresge-community",
        name: "Community Development Grant",
        stage: "Tracking",
        amount: "$60,000",
        deadline: "Deadline Aug 1, 2026",
        sub: "No proposals yet",
      },
    ],
    notes: [
      {
        id: "kresge-note-1",
        text: "Met with program team at conference. Strong interest in our foster care data.",
        date: "Mar 5, 2026",
        author: "Taylor S.",
      },
    ],
    stats: { inPursuit: "$90,000", awaiting: "$0", awardedLifetime: "$0", openTasks: 1 },
  },
  {
    id: "casey",
    name: "Annie E. Casey Foundation",
    status: "Lapsed",
    sinceDateLabel: "Since Sep 2022",
    totalAwarded: "$45,000 awarded",
    opportunities: [
      {
        id: "casey-youth",
        name: "Youth Services Grant",
        stage: "Submitted",
        amount: "$45,000",
        sub: "Submitted Jan 15, 2026 · Awaiting decision",
      },
    ],
    notes: [
      {
        id: "casey-note-1",
        text: "Previous cycle application scored well on community impact section.",
        date: "Feb 2, 2026",
        author: "Taylor S.",
      },
    ],
    stats: { inPursuit: "$0", awaiting: "$45,000", awardedLifetime: "$45,000", openTasks: 0 },
  },
  {
    id: "rwj",
    name: "Robert Wood Johnson",
    status: "Active",
    sinceDateLabel: "Since Jun 2023",
    totalAwarded: "$80,000 awarded",
    opportunities: [
      {
        id: "rwj-health",
        name: "Health Equity 2026",
        stage: "Active",
        amount: "$120,000",
        deadline: "Due Jul 1, 2026",
        sub: "2 drafts · 1 task open",
      },
      {
        id: "rwj-community",
        name: "Community Resilience Grant",
        stage: "Submitted",
        amount: "$80,000",
        sub: "Submitted Feb 20, 2026",
      },
      {
        id: "rwj-youth",
        name: "Youth Wellness Initiative",
        stage: "Tracking",
        amount: "$55,000",
        deadline: "Deadline Nov 1, 2026",
        sub: "No proposals yet",
      },
      {
        id: "rwj-rural",
        name: "Rural Access Program",
        stage: "Tracking",
        amount: "$40,000",
        deadline: "Deadline Dec 15, 2026",
        sub: "No proposals yet",
      },
    ],
    notes: [
      {
        id: "rwj-note-1",
        text: "Program officer confirmed eligibility for Health Equity track.",
        date: "Apr 3, 2026",
        author: "Taylor S.",
      },
    ],
    stats: { inPursuit: "$120,000", awaiting: "$80,000", awardedLifetime: "$80,000", openTasks: 1 },
  },
  {
    id: "kellogg",
    name: "W.K. Kellogg Foundation",
    status: "Active",
    sinceDateLabel: "Since Feb 2024",
    totalAwarded: "$95,000 awarded",
    opportunities: [
      {
        id: "kellogg-food",
        name: "Food Security Grant",
        stage: "Active",
        amount: "$70,000",
        deadline: "Due Sep 30, 2026",
        sub: "1 draft",
      },
      {
        id: "kellogg-early",
        name: "Community Resilience",
        stage: "Submitted",
        amount: "$95,000",
        sub: "Submitted Apr 1, 2026",
      },
    ],
    notes: [
      {
        id: "kellogg-note-1",
        text: "Strong alignment with WKKF's 2026 priority areas in education.",
        date: "Apr 8, 2026",
        author: "Taylor S.",
      },
    ],
    stats: { inPursuit: "$70,000", awaiting: "$95,000", awardedLifetime: "$95,000", openTasks: 0 },
  },
  {
    id: "macarthur",
    name: "MacArthur Foundation",
    status: "Active",
    sinceDateLabel: "Since Nov 2024",
    totalAwarded: "$0 awarded",
    opportunities: [
      {
        id: "macarthur-100",
        name: "100&Change Proposal Support",
        stage: "Active",
        amount: "$100,000",
        deadline: "Due Aug 15, 2026",
        sub: "1 draft · 2 tasks open",
      },
    ],
    notes: [
      {
        id: "macarthur-note-1",
        text: "Attended 100&Change webinar. Strong fit with our systems-change framing.",
        date: "Mar 28, 2026",
        author: "Taylor S.",
      },
    ],
    stats: { inPursuit: "$100,000", awaiting: "$0", awardedLifetime: "$0", openTasks: 2 },
  },
]

// ── Stage config ───────────────────────────────────────────────────────────

const STAGE_DOT: Record<OpportunityStage, string> = {
  Active:    "#6B819E",
  Submitted: "#AD9DAE",
  Tracking:  "#A6B3C5",
  Awarded:   "#4A7A5E",
}

const STAGE_BADGE: Record<OpportunityStage, { bg: string; color: string }> = {
  Active:    { bg: "#EBF0F5", color: "#4A6080" },
  Submitted: { bg: "#F2EDF3", color: "#7A5F7E" },
  Tracking:  { bg: "#F5F5F6", color: "#8A8A99" },
  Awarded:   { bg: "#EBF5EF", color: "#2E6B47" },
}

const ENG_BADGE: Record<EngagementStatus, { bg: string; color: string }> = {
  Active: { bg: "#EBF0F5", color: "#4A6080" },
  Lapsed: { bg: "#FEF3DC", color: "#C47A10" },
  Closed: { bg: "#F5F5F6", color: "#8A8A99" },
}

// ── Note bubble icon ───────────────────────────────────────────────────────

function NoteBubble() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden>
      <path
        d="M2.5 2A1.5 1.5 0 0 0 1 3.5v5A1.5 1.5 0 0 0 2.5 10H5v2.5L8 10h3.5A1.5 1.5 0 0 0 13 8.5v-5A1.5 1.5 0 0 0 11.5 2h-9Z"
        fill="var(--slate-secondary)"
      />
    </svg>
  )
}

// ── NoteEditor — shared by Add Note and Edit Note ─────────────────────────

function NoteEditor({
  initialText = "",
  placeholder = "Add a note...",
  saveLabel,
  onSave,
  onCancel,
}: {
  initialText?: string
  placeholder?: string
  saveLabel: string
  onSave: (text: string) => void
  onCancel: () => void
}) {
  const [text, setText] = useState(initialText)
  const ref = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    ref.current?.focus()
  }, [])

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onCancel()
    }
    document.addEventListener("keydown", onKey)
    return () => document.removeEventListener("keydown", onKey)
  }, [onCancel])

  return (
    <div>
      <textarea
        ref={ref}
        value={text}
        onChange={(e) => setText(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault()
            if (text.trim()) onSave(text.trim())
          }
        }}
        placeholder={placeholder}
        rows={3}
        style={{
          width: "100%",
          padding: "9px 12px",
          borderRadius: 8,
          border: "1px solid var(--border-default)",
          backgroundColor: "var(--surface-white)",
          fontSize: 13,
          color: "var(--ink)",
          outline: "none",
          resize: "none" as const,
          lineHeight: "19px",
          boxSizing: "border-box" as const,
          fontFamily: "inherit",
        }}
      />
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 8 }}>
        <button
          type="button"
          onClick={() => { if (text.trim()) onSave(text.trim()) }}
          style={{
            padding: "5px 14px",
            borderRadius: 7,
            border: "none",
            backgroundColor: "var(--slate-primary)",
            fontSize: 12,
            fontWeight: 500,
            color: "#FFFFFF",
            cursor: "pointer",
            transition: "background-color 150ms",
          }}
          onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.backgroundColor = "#3A4F6A" }}
          onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.backgroundColor = "var(--slate-primary)" }}
        >
          {saveLabel}
        </button>
        <button
          type="button"
          onClick={onCancel}
          style={{
            background: "none",
            border: "none",
            fontSize: 12,
            color: "var(--ink-secondary)",
            cursor: "pointer",
            padding: "5px 0",
          }}
        >
          Cancel
        </button>
      </div>
    </div>
  )
}

// ── Funder side panel ──────────────────────────────────────────────────────

function FunderPanel({
  open,
  onClose,
  engagement,
  funder,
  onSelectEngagement,
}: {
  open: boolean
  onClose: () => void
  engagement: Engagement
  funder: FunderProfile | undefined
  onSelectEngagement: (id: string) => void
}) {
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape" && open) onClose()
    }
    document.addEventListener("keydown", onKey)
    return () => document.removeEventListener("keydown", onKey)
  }, [open, onClose])

  const activeOppCount = engagement.opportunities.filter(
    (o) => o.stage === "Active" || o.stage === "Submitted"
  ).length
  const mostRecentNote = engagement.notes[0]
  const engBadge = ENG_BADGE[engagement.status]

  return (
    <>
      {/* Backdrop */}
      <div
        style={{
          position: "fixed",
          inset: 0,
          backgroundColor: "rgba(42,42,42,0.35)",
          zIndex: 150,
          opacity: open ? 1 : 0,
          pointerEvents: open ? "auto" : "none",
          transition: "opacity 250ms ease-out",
        }}
        onClick={onClose}
      />
      {/* Panel */}
      <div
        style={{
          position: "fixed",
          top: 0,
          right: 0,
          bottom: 0,
          width: 420,
          backgroundColor: "#FFFFFF",
          zIndex: 151,
          transform: `translateX(${open ? "0" : "100%"})`,
          transition: "transform 250ms ease-out",
          display: "flex",
          flexDirection: "column",
          boxShadow: "-8px 0 32px rgba(28,24,64,0.12)",
          overflow: "hidden",
        }}
      >
        {/* Panel header */}
        <div
          style={{
            flexShrink: 0,
            padding: "20px 20px 16px",
            borderBottom: "1px solid var(--border-default)",
          }}
        >
          <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 10 }}>
            <h2
              style={{
                margin: 0,
                fontSize: 22,
                fontWeight: 500,
                letterSpacing: "-0.02em",
                color: "var(--ink)",
                fontFamily: "var(--font-lora)",
                lineHeight: "28px",
                flex: 1,
                paddingRight: 12,
              }}
            >
              {engagement.name}
            </h2>
            <button
              type="button"
              onClick={onClose}
              style={{
                width: 28,
                height: 28,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                borderRadius: 6,
                border: "1px solid var(--border-default)",
                backgroundColor: "transparent",
                cursor: "pointer",
                flexShrink: 0,
              }}
            >
              <X size={14} color="var(--ink-secondary)" />
            </button>
          </div>
          {funder && (
            <span
              style={{
                display: "inline-block",
                borderRadius: 20,
                padding: "3px 10px",
                fontSize: 11,
                fontWeight: 500,
                backgroundColor: "var(--canvas)",
                border: "1px solid var(--border-default)",
                color: "var(--ink-secondary)",
              }}
            >
              {funder.type}
            </span>
          )}
          {funder && (
            <div style={{ marginTop: 8 }}>
              <a
                href={funder.website}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 5,
                  fontSize: 12,
                  color: "var(--slate-primary)",
                  textDecoration: "none",
                }}
              >
                {funder.website}
                <ExternalLink size={11} style={{ flexShrink: 0 }} />
              </a>
            </div>
          )}
        </div>

        {/* Scrollable body */}
        <div style={{ flex: 1, overflowY: "auto", padding: "20px" }}>
          {funder && (
            <>
              <FunderDetailRow label="Focus areas">
                <div style={{ display: "flex", flexWrap: "wrap", gap: 5 }}>
                  {funder.focusAreas.map((area) => (
                    <span
                      key={area}
                      style={{
                        borderRadius: 20,
                        padding: "2px 9px",
                        fontSize: 11,
                        fontWeight: 500,
                        backgroundColor: "var(--canvas)",
                        border: "1px solid var(--border-default)",
                        color: "var(--ink-secondary)",
                      }}
                    >
                      {area}
                    </span>
                  ))}
                </div>
              </FunderDetailRow>
              <FunderDetailRow label="Geography">
                <span style={{ fontSize: 13, color: "var(--ink)" }}>{funder.geography}</span>
              </FunderDetailRow>
              <FunderDetailRow label="Funding range">
                <span style={{ fontSize: 13, fontWeight: 500, color: "var(--ink)" }}>{funder.fundingRange}</span>
              </FunderDetailRow>
              <FunderDetailRow label="About">
                <p style={{ margin: 0, fontSize: 13, color: "var(--ink-secondary)", lineHeight: "19px" }}>
                  {funder.description}
                </p>
              </FunderDetailRow>
              <div style={{ height: 1, backgroundColor: "var(--border-default)", margin: "4px 0 20px" }} />
            </>
          )}

          {/* History section */}
          <p style={{ ...sectionLabel, marginBottom: 14 }}>Your history with this funder</p>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 14 }}>
            <div style={{ borderRadius: 10, padding: "12px 14px", backgroundColor: "var(--canvas)", border: "1px solid var(--border-default)" }}>
              <p style={{ margin: "0 0 3px", fontSize: 10, fontWeight: 500, letterSpacing: "0.07em", textTransform: "uppercase", color: "var(--ink-tertiary)" }}>
                Total awarded
              </p>
              <p style={{ margin: 0, fontSize: 18, fontWeight: 700, color: "var(--ink)", letterSpacing: "-0.02em" }}>
                {engagement.stats.awardedLifetime}
              </p>
            </div>
            <div style={{ borderRadius: 10, padding: "12px 14px", backgroundColor: "var(--canvas)", border: "1px solid var(--border-default)" }}>
              <p style={{ margin: "0 0 3px", fontSize: 10, fontWeight: 500, letterSpacing: "0.07em", textTransform: "uppercase", color: "var(--ink-tertiary)" }}>
                Active opportunities
              </p>
              <p style={{ margin: 0, fontSize: 18, fontWeight: 700, color: "var(--ink)", letterSpacing: "-0.02em" }}>
                {activeOppCount}
              </p>
            </div>
          </div>

          {mostRecentNote && (
            <div
              style={{
                marginBottom: 16,
                padding: "12px 14px",
                borderRadius: 10,
                backgroundColor: "var(--canvas)",
                border: "1px solid var(--border-default)",
              }}
            >
              <p style={{ margin: "0 0 3px", fontSize: 10, fontWeight: 500, letterSpacing: "0.07em", textTransform: "uppercase", color: "var(--ink-tertiary)" }}>
                Most recent contact
              </p>
              <p style={{ margin: "0 0 5px", fontSize: 11, color: "var(--ink-tertiary)" }}>{mostRecentNote.date}</p>
              <p style={{ margin: 0, fontSize: 13, color: "var(--ink)", lineHeight: "18px" }}>
                {mostRecentNote.text.length > 100
                  ? `${mostRecentNote.text.slice(0, 100)}…`
                  : mostRecentNote.text}
              </p>
            </div>
          )}

          <p style={{ ...sectionLabel, marginBottom: 10 }}>Engagements</p>
          <div style={{ borderRadius: 10, border: "1px solid var(--border-default)", overflow: "hidden" }}>
            <button
              type="button"
              onClick={() => {
                onSelectEngagement(engagement.id)
                onClose()
              }}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                width: "100%",
                padding: "12px 16px",
                border: "none",
                backgroundColor: "transparent",
                cursor: "pointer",
                textAlign: "left",
                transition: "background-color 150ms",
                gap: 10,
              }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.backgroundColor = "var(--canvas)" }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.backgroundColor = "transparent" }}
            >
              <div style={{ flex: 1, minWidth: 0 }}>
                <span style={{ fontSize: 13, fontWeight: 500, color: "var(--ink)", display: "block", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {engagement.name}
                </span>
                <span style={{ fontSize: 11, color: "var(--ink-tertiary)" }}>
                  {engagement.stats.awardedLifetime} · {engagement.opportunities.length} {engagement.opportunities.length === 1 ? "opportunity" : "opportunities"}
                </span>
              </div>
              <span
                style={{
                  flexShrink: 0,
                  borderRadius: 20,
                  padding: "2px 9px",
                  fontSize: 11,
                  fontWeight: 500,
                  backgroundColor: engBadge.bg,
                  color: engBadge.color,
                }}
              >
                {engagement.status}
              </span>
            </button>
          </div>
        </div>
      </div>
    </>
  )
}

function FunderDetailRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 14 }}>
      <p style={{ margin: "0 0 5px", fontSize: 10, fontWeight: 600, letterSpacing: "0.07em", textTransform: "uppercase", color: "var(--ink-tertiary)" }}>
        {label}
      </p>
      {children}
    </div>
  )
}

// ── New Opportunity Modal ──────────────────────────────────────────────────

function NewOpportunityModal({
  open,
  onClose,
  onCreate,
}: {
  open: boolean
  onClose: () => void
  onCreate: (data: NewOppData) => void
}) {
  const [name, setName] = useState("")
  const [deadline, setDeadline] = useState("")
  const [amountStr, setAmountStr] = useState("")
  const [stage, setStage] = useState<OpportunityStage>("Tracking")

  const resetAndClose = useCallback(() => {
    setName("")
    setDeadline("")
    setAmountStr("")
    setStage("Tracking")
    onClose()
  }, [onClose])

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape" && open) resetAndClose()
    }
    document.addEventListener("keydown", onKey)
    return () => document.removeEventListener("keydown", onKey)
  }, [open, resetAndClose])

  function handleAmountChange(e: React.ChangeEvent<HTMLInputElement>) {
    setAmountStr(e.target.value.replace(/[^0-9]/g, ""))
  }

  function handleAmountBlur() {
    const n = parseInt(amountStr, 10)
    if (!isNaN(n) && n > 0) setAmountStr(`$${n.toLocaleString()}`)
  }

  function handleAmountFocus() {
    setAmountStr(amountStr.replace(/[^0-9]/g, ""))
  }

  function handleCreate() {
    if (!name.trim()) return
    const rawAmount = amountStr.replace(/[^0-9]/g, "")
    onCreate({ name: name.trim(), deadline: deadline || undefined, amount: rawAmount || undefined, stage })
    setName("")
    setDeadline("")
    setAmountStr("")
    setStage("Tracking")
  }

  if (!open) return null

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        backgroundColor: "rgba(42,42,42,0.35)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 200,
      }}
      onClick={(e) => { if (e.target === e.currentTarget) resetAndClose() }}
    >
      <div
        style={{
          width: 480,
          backgroundColor: "#FFFFFF",
          borderRadius: 14,
          boxShadow: "0 16px 48px rgba(42,42,42,0.18)",
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
        }}
      >
        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "20px 24px 0", flexShrink: 0 }}>
          <h2 style={{ margin: 0, fontSize: 17, fontWeight: 600, color: "var(--ink)", fontFamily: "var(--font-lora)" }}>
            New opportunity
          </h2>
          <button
            type="button"
            onClick={resetAndClose}
            style={{ width: 28, height: 28, display: "flex", alignItems: "center", justifyContent: "center", borderRadius: 6, border: "1px solid var(--border-default)", backgroundColor: "transparent", cursor: "pointer" }}
          >
            <X size={14} color="var(--ink-secondary)" />
          </button>
        </div>

        {/* Body */}
        <div style={{ padding: "20px 24px 0", flex: 1 }}>
          <div style={{ marginBottom: 18 }}>
            <label style={modalLabelStyle}>Opportunity name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") handleCreate() }}
              placeholder="e.g. Community Resilience Fund 2026"
              style={modalInputStyle}
              autoFocus
            />
          </div>

          <div style={{ marginBottom: 18 }}>
            <label style={modalLabelStyle}>
              Deadline
              <span style={{ fontWeight: 400, color: "var(--ink-tertiary)", marginLeft: 4 }}>(optional)</span>
            </label>
            <input type="date" value={deadline} onChange={(e) => setDeadline(e.target.value)} style={modalInputStyle} />
          </div>

          <div style={{ marginBottom: 18 }}>
            <label style={modalLabelStyle}>
              Amount
              <span style={{ fontWeight: 400, color: "var(--ink-tertiary)", marginLeft: 4 }}>(optional)</span>
            </label>
            <input
              type="text"
              value={amountStr}
              onChange={handleAmountChange}
              onBlur={handleAmountBlur}
              onFocus={handleAmountFocus}
              placeholder="e.g. 75000"
              style={modalInputStyle}
            />
          </div>

          <div style={{ marginBottom: 24 }}>
            <label style={modalLabelStyle}>Stage</label>
            <div style={{ display: "flex", borderRadius: 9, border: "1px solid var(--border-default)", overflow: "hidden" }}>
              {(["Tracking", "Active", "Submitted", "Awarded"] as OpportunityStage[]).map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setStage(s)}
                  style={{
                    flex: 1,
                    padding: "8px 0",
                    border: "none",
                    backgroundColor: stage === s ? "var(--slate-primary)" : "var(--canvas)",
                    color: stage === s ? "#FFFFFF" : "var(--ink-secondary)",
                    fontSize: 12,
                    fontWeight: stage === s ? 600 : 400,
                    cursor: "pointer",
                    transition: "background-color 150ms, color 150ms",
                  }}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "16px 24px 20px", borderTop: "1px solid var(--border-default)", flexShrink: 0 }}>
          <GhostButton onClick={resetAndClose}>Cancel</GhostButton>
          <SlateButton onClick={handleCreate}>Create opportunity</SlateButton>
        </div>
      </div>
    </div>
  )
}

// ── Stage filter config ────────────────────────────────────────────────────

const STAGE_FILTER_OPTIONS: { label: string; value: OpportunityStage | null }[] = [
  { label: "All",           value: null        },
  { label: "Under review",  value: "Tracking"  },
  { label: "In progress",   value: "Active"    },
  { label: "Submitted",     value: "Submitted" },
  { label: "Awarded",       value: "Awarded"   },
]

// ── Page (wrapped in Suspense for useSearchParams) ─────────────────────────

export default function PortfolioPageWrapper() {
  return (
    <Suspense>
      <PortfolioPage />
    </Suspense>
  )
}

function PortfolioPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [engagements, setEngagements] = useState<Engagement[]>(INITIAL_ENGAGEMENTS)
  const [selectedId, setSelectedId] = useState("ford")
  const [search, setSearch] = useState("")
  const [stageFilter, setStageFilter] = useState<OpportunityStage | null>(
    (searchParams.get("stage") as OpportunityStage | null) ?? null
  )
  const [showAddNote, setShowAddNote] = useState(false)
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null)
  const [hoveredNoteId, setHoveredNoteId] = useState<string | null>(null)
  const [showFunderPanel, setShowFunderPanel] = useState(false)
  const [showNewOpportunityModal, setShowNewOpportunityModal] = useState(false)
  const [showNewEngagementModal, setShowNewEngagementModal] = useState(false)

  const selected = engagements.find((e) => e.id === selectedId) ?? engagements[0]

  const filteredByStage = stageFilter
    ? engagements.filter((e) => e.opportunities.some((o) => o.stage === stageFilter))
    : engagements

  const filtered = filteredByStage.filter((e) =>
    e.name.toLowerCase().includes(search.toLowerCase())
  )

  const displayedOpps = stageFilter
    ? selected.opportunities.filter((o) => o.stage === stageFilter)
    : selected.opportunities

  const oppCount = selected.opportunities.length
  const funder = FUNDERS[selectedId]

  // When stage filter activates, auto-select first matching engagement
  useEffect(() => {
    if (stageFilter) {
      const currentHasMatch = engagements.find((e) => e.id === selectedId)?.opportunities.some((o) => o.stage === stageFilter)
      if (!currentHasMatch) {
        const firstMatch = engagements.find((e) => e.opportunities.some((o) => o.stage === stageFilter))
        if (firstMatch) setSelectedId(firstMatch.id)
      }
    }
  }, [stageFilter]) // eslint-disable-line react-hooks/exhaustive-deps

  // Reset note UI when switching engagements
  useEffect(() => {
    setShowAddNote(false)
    setEditingNoteId(null)
    setShowFunderPanel(false)
  }, [selectedId])

  function handleAddNote(text: string) {
    const now = new Date()
    const dateStr = now.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
    const newNote: Note = { id: `note-${Date.now()}`, text, date: dateStr, author: "Taylor S." }
    setEngagements((prev) =>
      prev.map((e) => e.id === selectedId ? { ...e, notes: [newNote, ...e.notes] } : e)
    )
    setShowAddNote(false)
  }

  function handleEditNote(noteId: string, text: string) {
    const now = new Date()
    const dateStr = now.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
    setEngagements((prev) =>
      prev.map((e) =>
        e.id === selectedId
          ? { ...e, notes: e.notes.map((n) => n.id === noteId ? { ...n, text, date: dateStr } : n) }
          : e
      )
    )
    setEditingNoteId(null)
  }

  function handleAddOpportunity(data: NewOppData) {
    const rawAmount = (data.amount ?? "").replace(/[^0-9]/g, "")
    const amountDisplay = rawAmount ? `$${parseInt(rawAmount, 10).toLocaleString()}` : "—"
    let deadlineDisplay: string | undefined
    if (data.deadline) {
      const [year, month, day] = data.deadline.split("-").map(Number)
      const d = new Date(year, month - 1, day)
      deadlineDisplay = `Due ${d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}`
    }
    const newOpp: Opportunity = {
      id: `opp-${Date.now()}`,
      name: data.name,
      stage: data.stage,
      amount: amountDisplay,
      deadline: deadlineDisplay,
      sub: "No proposals yet",
    }
    setEngagements((prev) =>
      prev.map((e) => e.id === selectedId ? { ...e, opportunities: [newOpp, ...e.opportunities] } : e)
    )
    setShowNewOpportunityModal(false)
  }

  function handleCreateEngagement(data: NewEngagementData) {
    const now = new Date()
    const sinceDateLabel = `Since ${now.toLocaleDateString("en-US", { month: "long", year: "numeric" })}`
    const id = `eng-${Date.now()}`
    const displayName = data.engagementName.trim() || data.funderName.trim()
    const newEng: Engagement = {
      id,
      name: displayName,
      status: data.status as EngagementStatus,
      sinceDateLabel,
      totalAwarded: "$0 awarded",
      opportunities: [],
      notes: [],
      stats: { inPursuit: "$0", awaiting: "$0", awardedLifetime: "$0", openTasks: 0 },
    }
    setEngagements((prev) => [newEng, ...prev])
    setSelectedId(id)
  }

  const handleCancelAddNote = useCallback(() => setShowAddNote(false), [])
  const handleCancelEditNote = useCallback(() => setEditingNoteId(null), [])
  const handleCloseFunderPanel = useCallback(() => setShowFunderPanel(false), [])

  return (
    <div className="flex flex-1" style={{ overflow: "hidden", minHeight: 0 }}>

      {/* Funder panel — always in DOM for smooth slide animation */}
      <FunderPanel
        open={showFunderPanel}
        onClose={handleCloseFunderPanel}
        engagement={selected}
        funder={funder}
        onSelectEngagement={(id) => setSelectedId(id)}
      />

      {/* New opportunity modal */}
      <NewOpportunityModal
        open={showNewOpportunityModal}
        onClose={() => setShowNewOpportunityModal(false)}
        onCreate={handleAddOpportunity}
      />

      {/* New engagement modal */}
      <NewEngagementModal
        open={showNewEngagementModal}
        onClose={() => setShowNewEngagementModal(false)}
        onCreate={handleCreateEngagement}
      />

      {/* ── Left pane ── */}
      <aside
        style={{
          width: 340,
          flexShrink: 0,
          backgroundColor: "var(--canvas)",
          borderRight: "1px solid var(--border-default)",
          display: "flex",
          flexDirection: "column",
          height: "100%",
          overflow: "hidden",
        }}
      >
        {/* List header */}
        <div style={{ padding: "16px 16px 10px", flexShrink: 0 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
            <h2
              style={{
                margin: 0,
                fontSize: 18,
                fontWeight: 500,
                color: "var(--ink)",
                fontFamily: "var(--font-lora)",
                letterSpacing: "-0.01em",
              }}
            >
              Engagements
            </h2>
            <button
              type="button"
              onClick={() => setShowNewEngagementModal(true)}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 5,
                padding: "6px 12px",
                borderRadius: 8,
                backgroundColor: "var(--slate-primary)",
                border: "none",
                fontSize: 12,
                fontWeight: 500,
                color: "#FFFFFF",
                cursor: "pointer",
                transition: "background-color 150ms",
              }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.backgroundColor = "#3A4F6A" }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.backgroundColor = "var(--slate-primary)" }}
            >
              <Plus size={12} />
              New
            </button>
          </div>

          {/* Search */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              borderRadius: 9,
              padding: "8px 10px",
              backgroundColor: "var(--surface-white)",
              border: "1px solid var(--border-default)",
              marginBottom: 8,
            }}
          >
            <Search size={13} color="var(--ink-tertiary)" style={{ flexShrink: 0 }} />
            <input
              type="search"
              placeholder="Search engagements..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{ flex: 1, background: "transparent", border: "none", outline: "none", fontSize: 13, color: "var(--ink)" }}
            />
          </div>

          {/* Stage filter pills */}
          <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
            {STAGE_FILTER_OPTIONS.map(({ label, value }) => {
              const active = stageFilter === value
              return (
                <button
                  key={label}
                  type="button"
                  onClick={() => setStageFilter(value)}
                  style={{
                    padding: "3px 10px",
                    borderRadius: 20,
                    border: active ? "1px solid var(--slate-primary)" : "1px solid var(--border-default)",
                    backgroundColor: active ? "var(--slate-tint)" : "transparent",
                    fontSize: 11,
                    fontWeight: active ? 600 : 400,
                    color: active ? "var(--slate-primary)" : "var(--ink-secondary)",
                    cursor: "pointer",
                    transition: "background-color 150ms, border-color 150ms",
                  }}
                >
                  {label}
                </button>
              )
            })}
          </div>
        </div>

        {/* Engagement list */}
        <div className="flex-1 overflow-y-auto" style={{ padding: "0 8px 16px 8px" }}>
          {filtered.map((eng) => {
            const isSelected = eng.id === selectedId
            const badge = ENG_BADGE[eng.status]
            return (
              <button
                key={eng.id}
                type="button"
                onClick={() => setSelectedId(eng.id)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  width: "100%",
                  padding: "10px 12px",
                  marginBottom: 2,
                  borderRadius: isSelected ? "0 12px 12px 0" : 8,
                  backgroundColor: isSelected ? "var(--slate-tint)" : "transparent",
                  borderLeft: isSelected ? "2px solid var(--slate-primary)" : "2px solid transparent",
                  border: isSelected ? undefined : "1px solid transparent",
                  cursor: "pointer",
                  textAlign: "left",
                  transition: "background-color 150ms",
                }}
                onMouseEnter={(e) => {
                  if (!isSelected) (e.currentTarget as HTMLButtonElement).style.backgroundColor = "rgba(74,96,128,0.06)"
                }}
                onMouseLeave={(e) => {
                  if (!isSelected) (e.currentTarget as HTMLButtonElement).style.backgroundColor = "transparent"
                }}
              >
                <div>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <div
                      style={{
                        width: 8,
                        height: 8,
                        borderRadius: "50%",
                        backgroundColor: eng.status === "Active" ? "#6B819E" : "#A6B3C5",
                        flexShrink: 0,
                      }}
                    />
                    <span style={{ fontSize: 13, fontWeight: 500, color: "var(--ink)", lineHeight: "16px" }}>
                      {eng.name}
                    </span>
                  </div>
                  <p style={{ margin: "2px 0 0 16px", fontSize: 11, color: "var(--ink-tertiary)", lineHeight: "14px" }}>
                    {eng.opportunities.length} {eng.opportunities.length === 1 ? "opportunity" : "opportunities"}
                  </p>
                </div>
                <span
                  style={{
                    flexShrink: 0,
                    borderRadius: 20,
                    padding: "2px 8px",
                    fontSize: 10,
                    fontWeight: 500,
                    backgroundColor: badge.bg,
                    color: badge.color,
                    letterSpacing: "0.03em",
                    lineHeight: "12px",
                  }}
                >
                  {eng.status}
                </span>
              </button>
            )
          })}
        </div>
      </aside>

      {/* ── Right pane ── */}
      <div
        className="flex-1 overflow-y-auto"
        style={{ backgroundColor: "var(--surface-white)", minHeight: 0 }}
      >
        {/* White header zone */}
        <div
          style={{
            padding: "20px 28px 16px",
            borderBottom: "1px solid var(--border-default)",
            backgroundColor: "var(--surface-white)",
          }}
        >
          <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 10 }}>
            <h1
              style={{
                margin: 0,
                fontSize: 22,
                fontWeight: 500,
                letterSpacing: "-0.02em",
                color: "var(--ink)",
                fontFamily: "var(--font-lora)",
                lineHeight: "28px",
              }}
            >
              {selected.name}
            </h1>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <GhostButton onClick={() => setShowFunderPanel(true)}>View funder</GhostButton>
              <SlateButton onClick={() => setShowNewOpportunityModal(true)}>
                <Plus size={13} style={{ flexShrink: 0 }} />
                New opportunity
              </SlateButton>
            </div>
          </div>

          {/* Chips */}
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            {[
              { label: selected.status },
              { label: `${oppCount} ${oppCount === 1 ? "opportunity" : "opportunities"}` },
              { label: selected.sinceDateLabel },
              { label: selected.totalAwarded },
            ].map(({ label }) => (
              <span
                key={label}
                style={{
                  borderRadius: 20,
                  padding: "4px 12px",
                  fontSize: 12,
                  fontWeight: 400,
                  backgroundColor: "var(--canvas)",
                  border: "1px solid var(--border-default)",
                  color: "var(--ink-secondary)",
                }}
              >
                {label}
              </span>
            ))}
          </div>
        </div>

        {/* Funding summary */}
        <div style={{ backgroundColor: "var(--canvas)", padding: "16px 28px", borderBottom: "1px solid var(--border-default)" }}>
          <p style={sectionLabel}>Funding summary</p>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 10 }}>
            <MiniStat label="In pursuit" value={selected.stats.inPursuit} />
            <MiniStat label="Awaiting decision" value={selected.stats.awaiting} />
            <MiniStat label="Awarded (lifetime)" value={selected.stats.awardedLifetime} />
            <MiniStat
              label="Open tasks"
              value={String(selected.stats.openTasks)}
              sub={selected.stats.openTasksAlert}
            />
          </div>
        </div>

        {/* Opportunities */}
        <div style={{ padding: "20px 28px" }}>
          <p style={sectionLabel}>Opportunities</p>
          <div
            style={{
              borderRadius: "var(--radius-card)",
              border: "1px solid var(--border-default)",
              overflow: "hidden",
              backgroundColor: "var(--surface-white)",
              marginBottom: 28,
            }}
          >
            {displayedOpps.length === 0 ? (
              <div
                style={{
                  padding: "28px 20px",
                  textAlign: "center",
                  color: "var(--ink-tertiary)",
                  fontSize: 13,
                  lineHeight: "19px",
                }}
              >
                {stageFilter
                  ? `No ${stageFilter.toLowerCase()} opportunities for this engagement.`
                  : "No opportunities yet. Click ‘New opportunity’ to add one."}
              </div>
            ) : displayedOpps.map((opp, i) => {
              const dotColor = STAGE_DOT[opp.stage]
              const badge = STAGE_BADGE[opp.stage]
              return (
                <div
                  key={opp.id}
                  onClick={() => {
                    const qp = new URLSearchParams({
                      name: opp.name,
                      stage: opp.stage,
                      amount: opp.amount,
                      engagementId: selectedId,
                      engagementName: selected.name,
                    })
                    router.push(`/opportunity/${opp.id}?${qp.toString()}`)
                  }}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    padding: "14px 18px",
                    borderBottom: i < displayedOpps.length - 1 ? "1px solid var(--border-default)" : "none",
                    cursor: "pointer",
                    transition: "background-color 150ms",
                    gap: 12,
                  }}
                  onMouseEnter={(e) => { (e.currentTarget as HTMLDivElement).style.backgroundColor = "var(--canvas)" }}
                  onMouseLeave={(e) => { (e.currentTarget as HTMLDivElement).style.backgroundColor = "transparent" }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: 10, flex: 1, minWidth: 0 }}>
                    <div style={{ width: 8, height: 8, borderRadius: "50%", backgroundColor: dotColor, flexShrink: 0 }} />
                    <div style={{ minWidth: 0 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <span style={{ fontSize: 14, fontWeight: 500, color: "var(--ink)" }}>{opp.name}</span>
                        <span
                          style={{
                            flexShrink: 0,
                            borderRadius: 20,
                            padding: "2px 9px",
                            fontSize: 11,
                            fontWeight: 500,
                            backgroundColor: badge.bg,
                            color: badge.color,
                          }}
                        >
                          {opp.stage}
                        </span>
                      </div>
                      <p style={{ margin: "3px 0 0", fontSize: 12, color: "var(--ink-tertiary)" }}>
                        {opp.deadline ? `${opp.deadline} · ` : ""}{opp.sub}
                      </p>
                    </div>
                  </div>
                  <span style={{ flexShrink: 0, fontSize: 14, fontWeight: 500, color: "var(--ink)", lineHeight: "18px" }}>
                    {opp.amount}
                  </span>
                </div>
              )
            })}
          </div>

          {/* Notes */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
            <p style={{ ...sectionLabel, margin: 0 }}>Notes</p>
            <button
              type="button"
              onClick={() => {
                if (showAddNote) {
                  setShowAddNote(false)
                } else {
                  setEditingNoteId(null)
                  setShowAddNote(true)
                }
              }}
              style={{
                background: "none",
                border: "none",
                padding: "0 2px",
                fontSize: 12,
                fontWeight: 500,
                color: "var(--plum-soft)",
                cursor: "pointer",
                lineHeight: "16px",
              }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.textDecoration = "underline" }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.textDecoration = "none" }}
            >
              Add note
            </button>
          </div>

          {/* Inline add note form */}
          <div
            style={{
              overflow: "hidden",
              maxHeight: showAddNote ? "200px" : "0px",
              transition: "max-height 200ms ease-out",
              marginBottom: showAddNote ? 12 : 0,
            }}
          >
            {showAddNote && (
              <div
                style={{
                  padding: "14px 16px",
                  borderRadius: 10,
                  backgroundColor: "var(--surface-white)",
                  border: "1px solid var(--border-default)",
                }}
              >
                <NoteEditor
                  placeholder="Add a note..."
                  saveLabel="Save note"
                  onSave={handleAddNote}
                  onCancel={handleCancelAddNote}
                />
              </div>
            )}
          </div>

          {/* Note list */}
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {selected.notes.length === 0 && !showAddNote && (
              <p style={{ margin: 0, fontSize: 13, color: "var(--ink-tertiary)" }}>
                No notes yet.
              </p>
            )}
            {selected.notes.map((note) => (
              <div
                key={note.id}
                style={{ position: "relative" }}
                onMouseEnter={() => setHoveredNoteId(note.id)}
                onMouseLeave={() => setHoveredNoteId(null)}
              >
                {editingNoteId === note.id ? (
                  <div
                    style={{
                      padding: "14px 16px",
                      borderRadius: 10,
                      backgroundColor: "var(--surface-white)",
                      border: "1px solid var(--border-default)",
                    }}
                  >
                    <NoteEditor
                      initialText={note.text}
                      saveLabel="Save"
                      onSave={(text) => handleEditNote(note.id, text)}
                      onCancel={handleCancelEditNote}
                    />
                  </div>
                ) : (
                  <div
                    onClick={() => {
                      setShowAddNote(false)
                      setEditingNoteId(note.id)
                    }}
                    style={{
                      display: "flex",
                      alignItems: "flex-start",
                      gap: 12,
                      padding: "14px 16px",
                      borderRadius: 10,
                      backgroundColor: "var(--canvas)",
                      border: "1px solid var(--border-default)",
                      cursor: "text",
                    }}
                  >
                    <div
                      style={{
                        width: 28,
                        height: 28,
                        flexShrink: 0,
                        borderRadius: 7,
                        backgroundColor: "var(--slate-tint)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      <NoteBubble />
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ margin: "0 0 4px", fontSize: 13, color: "var(--ink)", lineHeight: "19px" }}>
                        {note.text}
                      </p>
                      <span style={{ fontSize: 11, color: "var(--ink-tertiary)" }}>
                        {note.date} · {note.author}
                      </span>
                    </div>
                    {hoveredNoteId === note.id && (
                      <div style={{ flexShrink: 0, opacity: 0.5, marginTop: 2 }}>
                        <Pencil size={12} color="var(--ink-tertiary)" />
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

// ── Shared button components ───────────────────────────────────────────────

function GhostButton({ children, onClick }: { children: React.ReactNode; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        padding: "7px 14px",
        borderRadius: 8,
        border: "1px solid var(--border-default)",
        backgroundColor: "transparent",
        fontSize: 13,
        fontWeight: 400,
        color: "var(--ink)",
        cursor: "pointer",
        transition: "background-color 150ms",
      }}
      onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.backgroundColor = "var(--canvas)" }}
      onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.backgroundColor = "transparent" }}
    >
      {children}
    </button>
  )
}

function SlateButton({ children, onClick }: { children: React.ReactNode; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        display: "flex",
        alignItems: "center",
        gap: 6,
        padding: "7px 14px",
        borderRadius: 8,
        border: "none",
        backgroundColor: "var(--slate-primary)",
        fontSize: 13,
        fontWeight: 500,
        color: "#FFFFFF",
        cursor: "pointer",
        transition: "background-color 150ms",
      }}
      onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.backgroundColor = "#3A4F6A" }}
      onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.backgroundColor = "var(--slate-primary)" }}
    >
      {children}
    </button>
  )
}

function MiniStat({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div
      style={{
        borderRadius: 10,
        padding: "12px 14px",
        backgroundColor: "var(--surface-white)",
        border: "1px solid var(--border-default)",
      }}
    >
      <p style={{ margin: "0 0 4px", fontSize: 10, fontWeight: 500, letterSpacing: "0.07em", textTransform: "uppercase", color: "var(--ink-tertiary)" }}>
        {label}
      </p>
      <p style={{ margin: 0, fontSize: 20, fontWeight: 700, color: "var(--ink)", letterSpacing: "-0.02em" }}>{value}</p>
      {sub && <p style={{ margin: "3px 0 0", fontSize: 11, color: "var(--terracotta)" }}>{sub}</p>}
    </div>
  )
}

// ── Style constants ────────────────────────────────────────────────────────

const sectionLabel: React.CSSProperties = {
  fontSize: 10,
  fontWeight: 600,
  letterSpacing: "0.08em",
  textTransform: "uppercase",
  color: "var(--ink-tertiary)",
  margin: "0 0 12px 0",
}

const modalLabelStyle: React.CSSProperties = {
  display: "block",
  fontSize: 13,
  fontWeight: 500,
  color: "var(--ink)",
  marginBottom: 6,
}

const modalInputStyle: React.CSSProperties = {
  width: "100%",
  padding: "9px 12px",
  borderRadius: 9,
  border: "1px solid var(--border-default)",
  backgroundColor: "var(--surface-white)",
  fontSize: 13,
  color: "var(--ink)",
  outline: "none",
  boxSizing: "border-box" as const,
  fontFamily: "inherit",
}
