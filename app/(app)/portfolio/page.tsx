"use client"

import React, { useState } from "react"
import { useRouter } from "next/navigation"
import { Search, Plus } from "lucide-react"

// ── Types ──────────────────────────────────────────────────────────────────

type EngagementStatus = "Active" | "Lapsed"
type OpportunityStage = "Active" | "Submitted" | "Tracking"

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

// ── Data ──────────────────────────────────────────────────────────────────

const ENGAGEMENTS: Engagement[] = [
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
      },
      {
        id: "ford-note-2",
        text: "LOI feedback was positive. Strong narrative around community voice resonated.",
        date: "Mar 18, 2026",
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
}

const STAGE_BADGE: Record<OpportunityStage, { bg: string; color: string }> = {
  Active:    { bg: "#EBF0F5", color: "#4A6080" },
  Submitted: { bg: "#F2EDF3", color: "#7A5F7E" },
  Tracking:  { bg: "#F5F5F6", color: "#8A8A99" },
}

const ENG_BADGE: Record<EngagementStatus, { bg: string; color: string }> = {
  Active: { bg: "#EBF0F5", color: "#4A6080" },
  Lapsed: { bg: "#FEF3DC", color: "#C47A10" },
}

// ── Note icon ──────────────────────────────────────────────────────────────

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

// ── Page ───────────────────────────────────────────────────────────────────

export default function PortfolioPage() {
  const router = useRouter()
  const [selectedId, setSelectedId] = useState("ford")
  const [search, setSearch] = useState("")

  const selected = ENGAGEMENTS.find((e) => e.id === selectedId) ?? ENGAGEMENTS[0]
  const filtered = ENGAGEMENTS.filter((e) =>
    e.name.toLowerCase().includes(search.toLowerCase())
  )
  const oppCount = selected.opportunities.length

  return (
    <div className="flex flex-1" style={{ overflow: "hidden", minHeight: 0 }}>

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
          {/* Funder name */}
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
              <GhostButton onClick={() => {}}>View funder</GhostButton>
              <GhostButton onClick={() => {}}>Add note</GhostButton>
              <SlateButton onClick={() => router.push("/opportunity")}>
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
            {selected.opportunities.map((opp, i) => {
              const dotColor = STAGE_DOT[opp.stage]
              const badge = STAGE_BADGE[opp.stage]
              return (
                <div
                  key={opp.id}
                  onClick={() => router.push("/opportunity")}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    padding: "14px 18px",
                    borderBottom: i < selected.opportunities.length - 1 ? "1px solid var(--border-default)" : "none",
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
          <p style={sectionLabel}>Notes</p>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {selected.notes.map((note) => (
              <div
                key={note.id}
                style={{
                  display: "flex",
                  alignItems: "flex-start",
                  gap: 12,
                  padding: "14px 16px",
                  borderRadius: 10,
                  backgroundColor: "var(--canvas)",
                  border: "1px solid var(--border-default)",
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
                <div>
                  <p style={{ margin: "0 0 4px", fontSize: 13, color: "var(--ink)", lineHeight: "19px" }}>{note.text}</p>
                  <span style={{ fontSize: 11, color: "var(--ink-tertiary)" }}>{note.date}</span>
                </div>
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

const sectionLabel: React.CSSProperties = {
  fontSize: 10,
  fontWeight: 600,
  letterSpacing: "0.08em",
  textTransform: "uppercase",
  color: "var(--ink-tertiary)",
  margin: "0 0 12px 0",
}
