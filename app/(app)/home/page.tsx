"use client"

import React, { useState } from "react"
import { useRouter } from "next/navigation"
import { Search, Plus } from "lucide-react"

// ── Types ──────────────────────────────────────────────────────────────────

type EngagementStatus = "Active" | "Lapsed"
type OpportunityStatus = "Active" | "Submitted" | "Tracking"
type ViewMode = "list" | "kanban" | "calendar"

interface MetaItem {
  label: string
  highlighted?: boolean
}

interface Opportunity {
  id: string
  name: string
  status: OpportunityStatus
  amount: string
  meta: MetaItem[]
}

interface Note {
  id: string
  text: string
  date: string
}

interface Engagement {
  id: string
  name: string
  status: EngagementStatus
  website: string
  relationshipStatus: string
  opportunities: Opportunity[]
  notes: Note[]
}

// ── Data ───────────────────────────────────────────────────────────────────

const ENGAGEMENTS: Engagement[] = [
  {
    id: "ford",
    name: "Ford Foundation",
    status: "Active",
    website: "fordfoundation.org",
    relationshipStatus: "Active relationship",
    opportunities: [
      {
        id: "equitable-futures",
        name: "Equitable Futures Grant 2026",
        status: "Active",
        amount: "$75,000",
        meta: [
          { label: "Due Jun 15, 2026" },
          { label: "1 draft" },
          { label: "3 tasks open", highlighted: true },
        ],
      },
      {
        id: "community-voice",
        name: "Community Voice Initiative",
        status: "Submitted",
        amount: "$120,000",
        meta: [
          { label: "Submitted Mar 2, 2026" },
          { label: "Final proposal" },
        ],
      },
      {
        id: "civic-engagement",
        name: "Civic Engagement Seed Fund",
        status: "Tracking",
        amount: "$50,000",
        meta: [
          { label: "Deadline Sep 1, 2026" },
          { label: "No proposals yet" },
        ],
      },
    ],
    notes: [
      {
        id: "ford-note-1",
        text: "Called program officer Dana Reeves on Apr 12. She mentioned they're prioritizing urban orgs this cycle.",
        date: "Apr 12, 2026",
      },
      {
        id: "ford-note-2",
        text: "LOI feedback was positive. Strong narrative around community voice resonated.",
        date: "Mar 18, 2026",
      },
    ],
  },
  {
    id: "kresge",
    name: "Kresge Foundation",
    status: "Active",
    website: "kresge.org",
    relationshipStatus: "Active relationship",
    opportunities: [
      {
        id: "kresge-community",
        name: "Community Development Grant",
        status: "Active",
        amount: "$60,000",
        meta: [
          { label: "Due Aug 1, 2026" },
          { label: "1 draft" },
        ],
      },
      {
        id: "kresge-health",
        name: "Health Equity Initiative",
        status: "Tracking",
        amount: "$90,000",
        meta: [
          { label: "Deadline Oct 15, 2026" },
          { label: "No proposals yet" },
        ],
      },
    ],
    notes: [
      {
        id: "kresge-note-1",
        text: "Met with program team at conference. Strong interest in our foster care data.",
        date: "Mar 5, 2026",
      },
    ],
  },
  {
    id: "casey",
    name: "Annie E. Casey Foundation",
    status: "Lapsed",
    website: "aecf.org",
    relationshipStatus: "Lapsed relationship",
    opportunities: [
      {
        id: "casey-youth",
        name: "Youth Services Grant",
        status: "Submitted",
        amount: "$45,000",
        meta: [
          { label: "Submitted Jan 15, 2026" },
          { label: "Awaiting decision" },
        ],
      },
    ],
    notes: [
      {
        id: "casey-note-1",
        text: "Previous cycle application scored well on community impact section.",
        date: "Feb 2, 2026",
      },
    ],
  },
  {
    id: "rwj",
    name: "Robert Wood Johnson",
    status: "Active",
    website: "rwjf.org",
    relationshipStatus: "Active relationship",
    opportunities: [
      {
        id: "rwj-health",
        name: "Health Equity 2026",
        status: "Active",
        amount: "$120,000",
        meta: [
          { label: "Due Jul 1, 2026" },
          { label: "2 drafts" },
          { label: "1 task open", highlighted: true },
        ],
      },
      {
        id: "rwj-community",
        name: "Community Resilience Grant",
        status: "Submitted",
        amount: "$80,000",
        meta: [
          { label: "Submitted Feb 20, 2026" },
          { label: "Final proposal" },
        ],
      },
      {
        id: "rwj-youth",
        name: "Youth Wellness Initiative",
        status: "Tracking",
        amount: "$55,000",
        meta: [
          { label: "Deadline Nov 1, 2026" },
          { label: "No proposals yet" },
        ],
      },
      {
        id: "rwj-rural",
        name: "Rural Access Program",
        status: "Tracking",
        amount: "$40,000",
        meta: [
          { label: "Deadline Dec 15, 2026" },
          { label: "No proposals yet" },
        ],
      },
    ],
    notes: [
      {
        id: "rwj-note-1",
        text: "Program officer confirmed eligibility for Health Equity track.",
        date: "Apr 3, 2026",
      },
      {
        id: "rwj-note-2",
        text: "Requested budget narrative template from grants portal.",
        date: "Mar 22, 2026",
      },
    ],
  },
  {
    id: "kellogg",
    name: "W.K. Kellogg Foundation",
    status: "Active",
    website: "wkkf.org",
    relationshipStatus: "Active relationship",
    opportunities: [
      {
        id: "kellogg-food",
        name: "Food Security Grant",
        status: "Active",
        amount: "$70,000",
        meta: [{ label: "Due Sep 30, 2026" }, { label: "1 draft" }],
      },
      {
        id: "kellogg-early",
        name: "Early Childhood Program",
        status: "Submitted",
        amount: "$95,000",
        meta: [{ label: "Submitted Apr 1, 2026" }, { label: "Final proposal" }],
      },
    ],
    notes: [
      {
        id: "kellogg-note-1",
        text: "Strong alignment with WKKF's 2026 priority areas in education.",
        date: "Apr 8, 2026",
      },
    ],
  },
  {
    id: "macarthur",
    name: "MacArthur Foundation",
    status: "Active",
    website: "macfound.org",
    relationshipStatus: "Active relationship",
    opportunities: [
      {
        id: "macarthur-100",
        name: "100&Change Proposal Support",
        status: "Active",
        amount: "$100,000",
        meta: [
          { label: "Due Aug 15, 2026" },
          { label: "1 draft" },
          { label: "2 tasks open", highlighted: true },
        ],
      },
    ],
    notes: [
      {
        id: "macarthur-note-1",
        text: "Attended 100&Change webinar. Strong fit with our systems-change framing.",
        date: "Mar 28, 2026",
      },
    ],
  },
]

// ── Badge configs ──────────────────────────────────────────────────────────

const ENG_BADGE: Record<EngagementStatus, { bg: string; color: string }> = {
  Active: { bg: "#EBF2E2", color: "#3D6120" },
  Lapsed: { bg: "#FEF3DC", color: "#C47A10" },
}

const OPP_BADGE: Record<OpportunityStatus, { bg: string; color: string }> = {
  Active:    { bg: "#EBF2E2", color: "#3D6120" },
  Submitted: { bg: "#E8F0FB", color: "#2D62B8" },
  Tracking:  { bg: "#EEECEA", color: "#8A8070" },
}

// ── Small icon components ──────────────────────────────────────────────────

function FunderIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden>
      <rect x="1.5" y="4" width="9" height="6.5" rx="1" fill="#C47A10" opacity="0.3" />
      <rect x="3.5" y="1.5" width="5" height="3" rx="0.75" fill="#C47A10" />
      <rect x="4.75" y="6" width="2.5" height="4" rx="0.5" fill="#C47A10" />
    </svg>
  )
}

function NoteBubbleIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden>
      <path
        d="M2.5 2A1.5 1.5 0 0 0 1 3.5v5A1.5 1.5 0 0 0 2.5 10H5v2.5L8 10h3.5A1.5 1.5 0 0 0 13 8.5v-5A1.5 1.5 0 0 0 11.5 2h-9Z"
        fill="#5A8A35"
      />
    </svg>
  )
}

// ── View Toggle ────────────────────────────────────────────────────────────

function ViewToggle({ view, onChange }: { view: ViewMode; onChange: (v: ViewMode) => void }) {
  const options: { id: ViewMode; label: string }[] = [
    { id: "list",     label: "List"     },
    { id: "kanban",   label: "Kanban"   },
    { id: "calendar", label: "Calendar" },
  ]
  return (
    <div
      style={{
        display: "inline-flex",
        borderRadius: 8,
        border: "1px solid #3C321417",
        overflow: "hidden",
        backgroundColor: "#FFFFFF",
        flexShrink: 0,
      }}
    >
      {options.map((opt) => {
        const isActive = view === opt.id
        return (
          <button
            key={opt.id}
            type="button"
            onClick={() => onChange(opt.id)}
            style={{
              padding: "5px 12px",
              fontSize: 12,
              fontWeight: isActive ? 600 : 400,
              color: isActive ? "#3D6120" : "#A09888",
              backgroundColor: isActive ? "#EBF2E2" : "transparent",
              border: "none",
              borderRight: opt.id !== "calendar" ? "1px solid #3C321417" : "none",
              cursor: "pointer",
              transition: "background-color 150ms, color 150ms",
            }}
          >
            {opt.label}
          </button>
        )
      })}
    </div>
  )
}

// ── Coming soon placeholder ────────────────────────────────────────────────

function ComingSoon({ label }: { label: string }) {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        flex: 1,
        gap: 8,
        padding: 40,
      }}
    >
      <span style={{ fontSize: 14, fontWeight: 500, color: "#A09888" }}>{label} view</span>
      <span style={{ fontSize: 13, color: "#C8BFB4" }}>Coming soon</span>
    </div>
  )
}

// ── Main page ──────────────────────────────────────────────────────────────

export default function HomePage() {
  const router = useRouter()
  const [selectedId, setSelectedId] = useState<string>("ford")
  const [viewMode, setViewMode] = useState<ViewMode>("list")
  const selected = ENGAGEMENTS.find((e) => e.id === selectedId) ?? ENGAGEMENTS[0]
  const oppCount = selected.opportunities.length

  return (
    <div className="flex flex-1" style={{ overflow: "hidden", minHeight: 0 }}>

      {/* ── LEFT PANE ── */}
      <aside
        style={{
          width: 268,
          flexShrink: 0,
          backgroundColor: "#F3F0EA",
          borderRight: "1px solid #3C321417",
          display: "flex",
          flexDirection: "column",
          position: "sticky",
          top: 44,
          height: "calc(100vh - 44px)",
          overflowY: "auto",
        }}
      >
        {/* Today stat chips */}
        <div
          style={{
            padding: "12px 12px 8px 12px",
            flexShrink: 0,
            borderBottom: "1px solid #3C321417",
          }}
        >
          <span style={{ ...styles.sectionLabel, display: "block", marginBottom: 8 }}>Today</span>
          <div style={{ display: "flex", gap: 6 }}>
            <div
              style={{
                flex: 1,
                borderRadius: 8,
                padding: "8px 10px",
                backgroundColor: "#FFFFFF",
                border: "1px solid #3C321417",
                display: "flex",
                flexDirection: "column",
                gap: 2,
              }}
            >
              <span style={{ fontSize: 18, fontWeight: 700, color: "#C4511A", lineHeight: "22px" }}>3</span>
              <span style={{ fontSize: 11, color: "#A09888", lineHeight: "14px" }}>tasks due today</span>
            </div>
            <div
              style={{
                flex: 1,
                borderRadius: 8,
                padding: "8px 10px",
                backgroundColor: "#FFFFFF",
                border: "1px solid #3C321417",
                display: "flex",
                flexDirection: "column",
                gap: 2,
              }}
            >
              <span style={{ fontSize: 18, fontWeight: 700, color: "#3D6120", lineHeight: "22px" }}>2</span>
              <span style={{ fontSize: 11, color: "#A09888", lineHeight: "14px" }}>deadlines in 7 days</span>
            </div>
          </div>
        </div>

        {/* Header row */}
        <div
          className="flex items-center justify-between"
          style={{ padding: "12px 16px 8px 16px", flexShrink: 0 }}
        >
          <span style={styles.sectionLabel}>Engagements</span>
          <button
            type="button"
            style={styles.terracottaBtn}
            onClick={() => {}}
            onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.backgroundColor = "#A8421A" }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.backgroundColor = "#C4511A" }}
          >
            <Plus size={13} style={{ flexShrink: 0 }} />
            New engagement
          </button>
        </div>

        {/* Search */}
        <div style={{ padding: "0 12px 10px 12px", flexShrink: 0 }}>
          <div
            className="flex items-center"
            style={{
              borderRadius: 9,
              padding: "7px 10px",
              gap: 8,
              backgroundColor: "#FFFFFF",
              border: "1px solid #3C321417",
            }}
          >
            <Search size={14} color="#A09888" style={{ flexShrink: 0 }} />
            <input
              type="search"
              placeholder="Search engagements..."
              className="flex-1 bg-transparent outline-none border-none"
              style={{ fontSize: 12, color: "#2A2618" }}
            />
          </div>
        </div>

        {/* Engagement list */}
        <div className="flex-1 overflow-y-auto" style={{ display: "flex", flexDirection: "column" }}>
          {ENGAGEMENTS.map((eng) => {
            const isSelected = eng.id === selectedId
            const badge = ENG_BADGE[eng.status]
            const count = eng.opportunities.length
            return (
              <button
                key={eng.id}
                type="button"
                onClick={() => setSelectedId(eng.id)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  width: "calc(100% - 16px)",
                  margin: "2px 8px",
                  padding: "10px 12px",
                  borderRadius: 9,
                  backgroundColor: isSelected ? "#FFFFFF" : "transparent",
                  border: isSelected ? "1px solid #3C321417" : "1px solid transparent",
                  boxShadow: isSelected ? "0px 1px 4px #1C18400F" : "none",
                  cursor: "pointer",
                  textAlign: "left",
                  transition: "background-color 150ms, box-shadow 150ms",
                }}
                onMouseEnter={(e) => {
                  if (!isSelected) (e.currentTarget as HTMLButtonElement).style.backgroundColor = "#EBE7DF"
                }}
                onMouseLeave={(e) => {
                  if (!isSelected) (e.currentTarget as HTMLButtonElement).style.backgroundColor = "transparent"
                }}
              >
                <div>
                  <div style={{ fontSize: 13, fontWeight: 500, color: "#2A2618", lineHeight: "16px" }}>
                    {eng.name}
                  </div>
                  <div style={{ fontSize: 11, marginTop: 2, color: "#A09888", lineHeight: "14px" }}>
                    {count} {count === 1 ? "opportunity" : "opportunities"}
                  </div>
                </div>
                <div
                  style={{
                    flexShrink: 0,
                    borderRadius: 20,
                    padding: "3px 8px",
                    backgroundColor: badge.bg,
                    fontSize: 10,
                    fontWeight: 500,
                    color: badge.color,
                    letterSpacing: "0.03em",
                    lineHeight: "12px",
                  }}
                >
                  {eng.status}
                </div>
              </button>
            )
          })}
        </div>
      </aside>

      {/* ── RIGHT PANE ── */}
      <div
        className="flex-1 flex flex-col"
        style={{ backgroundColor: "#FFFFFF", overflow: "hidden", minHeight: 0 }}
      >
        {/* Right header */}
        <div
          className="flex items-center justify-between"
          style={{
            padding: "14px 24px",
            flexShrink: 0,
            backgroundColor: "#FFFFFF",
            borderBottom: "1px solid #3C321417",
          }}
        >
          {/* Title + meta */}
          <div>
            <h2
              style={{
                fontSize: 19,
                fontWeight: 500,
                letterSpacing: "-0.02em",
                lineHeight: "24px",
                margin: 0,
                background: "linear-gradient(90deg, #3D6120, #7A9A30)",
                WebkitBackgroundClip: "text",
                backgroundClip: "text",
                WebkitTextFillColor: "transparent",
                color: "transparent",
              }}
            >
              {selected.name}
            </h2>
            <div className="flex items-center" style={{ gap: 6, marginTop: 5 }}>
              <FunderIcon />
              <span style={{ fontSize: 12, color: "#C47A10", lineHeight: "16px" }}>
                {selected.website}
              </span>
              <span style={{ fontSize: 12, color: "#6B6355" }}>·</span>
              <span style={{ fontSize: 12, color: "#5A8A35", lineHeight: "16px" }}>
                {oppCount} {oppCount === 1 ? "opportunity" : "opportunities"} · {selected.relationshipStatus}
              </span>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex items-center" style={{ gap: 8 }}>
            <button
              type="button"
              style={styles.outlineBtn}
              onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#F3F0EA")}
              onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "#FFFFFF")}
            >
              <Plus size={13} style={{ flexShrink: 0 }} />
              Add note
            </button>
            <button type="button" style={styles.outlineBtn}
              onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#F3F0EA")}
              onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "#FFFFFF")}
            >
              View funder
            </button>
            <button
              type="button"
              onClick={() => router.push("/opportunity")}
              style={{ ...styles.terracottaBtn, padding: "7px 16px", fontSize: 13 }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.backgroundColor = "#A8421A" }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.backgroundColor = "#C4511A" }}
            >
              <Plus size={13} style={{ flexShrink: 0 }} />
              New opportunity
            </button>
          </div>
        </div>

        {/* View toggle + content */}
        <div
          style={{
            padding: "14px 24px 10px 24px",
            flexShrink: 0,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <span style={styles.sectionLabel}>Opportunities</span>
          <ViewToggle view={viewMode} onChange={setViewMode} />
        </div>

        {/* Scrollable content */}
        {viewMode === "list" ? (
          <div
            className="flex-1 overflow-y-auto"
            style={{ display: "flex", flexDirection: "column", padding: "0 24px 20px 24px", gap: 16 }}
          >
            {selected.opportunities.map((opp) => {
              const badge = OPP_BADGE[opp.status]
              return (
                <div
                  key={opp.id}
                  className="flex items-start justify-between"
                  onClick={() => router.push("/opportunity")}
                  style={{
                    borderRadius: 12,
                    padding: "14px 16px",
                    backgroundColor: "#FFFFFF",
                    border: "1px solid #3C321417",
                    boxShadow: "0px 1px 3px #1C18400A",
                    gap: 16,
                    cursor: "pointer",
                    transition: "box-shadow 150ms, border-color 150ms",
                  }}
                  onMouseEnter={(e) => {
                    const el = e.currentTarget as HTMLDivElement
                    el.style.boxShadow = "0px 2px 8px #1C184014"
                    el.style.borderColor = "rgba(90,138,53,0.25)"
                  }}
                  onMouseLeave={(e) => {
                    const el = e.currentTarget as HTMLDivElement
                    el.style.boxShadow = "0px 1px 3px #1C18400A"
                    el.style.borderColor = "#3C321417"
                  }}
                >
                  {/* Left: name + status + meta */}
                  <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                    <div className="flex items-center" style={{ gap: 10 }}>
                      <span
                        style={{
                          fontSize: 14,
                          fontWeight: 500,
                          letterSpacing: "-0.01em",
                          color: "#2A2618",
                          lineHeight: "18px",
                        }}
                      >
                        {opp.name}
                      </span>
                      <span
                        style={{
                          flexShrink: 0,
                          borderRadius: 20,
                          padding: "3px 9px",
                          backgroundColor: badge.bg,
                          fontSize: 10,
                          fontWeight: 500,
                          color: badge.color,
                          letterSpacing: "0.03em",
                          lineHeight: "12px",
                        }}
                      >
                        {opp.status}
                      </span>
                    </div>
                    {/* Meta items with dot separators */}
                    <div className="flex items-center" style={{ gap: 6 }}>
                      {opp.meta.map((item, i) => (
                        <React.Fragment key={item.label}>
                          {i > 0 && (
                            <span style={{ fontSize: 12, color: "#6B6355", lineHeight: "16px" }}>·</span>
                          )}
                          <span
                            style={{
                              fontSize: 12,
                              color: item.highlighted ? "#C47A10" : "#6B6355",
                              lineHeight: "16px",
                            }}
                          >
                            {item.label}
                          </span>
                        </React.Fragment>
                      ))}
                    </div>
                  </div>

                  {/* Right: amount */}
                  <span
                    style={{
                      flexShrink: 0,
                      fontSize: 13,
                      fontWeight: 500,
                      color: "#3D6120",
                      lineHeight: "16px",
                      marginTop: 2,
                    }}
                  >
                    {opp.amount}
                  </span>
                </div>
              )
            })}

            {/* ── Notes ── */}
            <span style={{ ...styles.sectionLabel, marginTop: 4 }}>Notes</span>

            {selected.notes.map((note) => (
              <div key={note.id} className="flex items-start" style={{ gap: 12 }}>
                {/* Icon tile */}
                <div
                  style={{
                    width: 28,
                    height: 28,
                    flexShrink: 0,
                    marginTop: 1,
                    borderRadius: 7,
                    backgroundColor: "#EBF2E2",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <NoteBubbleIcon />
                </div>
                {/* Text + date */}
                <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
                  <span style={{ fontSize: 13, fontWeight: 400, color: "#2A2618", lineHeight: "19px" }}>
                    {note.text}
                  </span>
                  <span style={{ fontSize: 11, fontWeight: 400, color: "#A09888", lineHeight: "14px" }}>
                    {note.date}
                  </span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <ComingSoon label={viewMode === "kanban" ? "Kanban" : "Calendar"} />
        )}
      </div>
    </div>
  )
}

// ── Shared style objects ──────────────────────────────────────────────────

const styles = {
  sectionLabel: {
    fontSize: 11,
    fontWeight: 500,
    letterSpacing: "0.07em",
    textTransform: "uppercase" as const,
    color: "#A09888",
    lineHeight: "14px",
  },
  outlineBtn: {
    display: "flex",
    alignItems: "center",
    gap: 6,
    borderRadius: 8,
    padding: "7px 14px",
    backgroundColor: "#FFFFFF",
    border: "1px solid #3C32141F",
    fontSize: 13,
    fontWeight: 400,
    color: "#2A2618",
    cursor: "pointer",
    lineHeight: "16px",
    transition: "background-color 150ms",
  },
  terracottaBtn: {
    display: "flex",
    alignItems: "center",
    gap: 6,
    borderRadius: 8,
    padding: "4px 10px",
    backgroundColor: "#C4511A",
    border: "none",
    fontSize: 12,
    fontWeight: 500,
    color: "#FFFFFF",
    cursor: "pointer",
    lineHeight: "16px",
    transition: "background-color 150ms",
  },
} as const
