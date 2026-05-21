"use client"

import React, { useState } from "react"
import { Calendar, FileText, Trash2, Sparkles, Plus } from "lucide-react"

// ── Types ──────────────────────────────────────────────────────────────────

type ReportStatus = "Draft" | "Submitted" | "Overdue"
type FilterTab = "All" | ReportStatus
type OppStatus = "Submitted" | "Tracking" | "Active"

interface CoveredOpp {
  name: string
  status: OppStatus
  amount: string
}

interface SupportingFile {
  name: string
  uploaded: string
}

interface Report {
  id: string
  title: string
  funder: string
  grant: string
  due: string
  status: ReportStatus
  daysLabel: string
  reportType: "Interim" | "Final" | "Progress"
  coverageNote: string
  coveredOpps: CoveredOpp[]
  files: SupportingFile[]
  contact: string
  portal: string
}

// ── Data ──────────────────────────────────────────────────────────────────

const REPORTS: Report[] = [
  {
    id: "ford-interim",
    title: "Ford Foundation — Interim Report",
    funder: "Ford Foundation",
    grant: "Community Voice Initiative",
    due: "Jun 30, 2026",
    status: "Draft",
    daysLabel: "47 days left",
    reportType: "Interim",
    coverageNote: "Covers 2 opportunities",
    coveredOpps: [
      { name: "Community Voice Initiative", status: "Submitted", amount: "$120,000" },
      { name: "Civic Engagement Seed Fund",  status: "Tracking",  amount: "$50,000"  },
    ],
    files: [
      { name: "Q1_Outcomes_Data.xlsx",   uploaded: "Apr 3, 2026 · AW" },
      { name: "Program_Photos_Q1.zip",   uploaded: "Apr 3, 2026 · AW" },
    ],
    contact: "Dana Reeves, Program Officer",
    portal: "grants.fordfoundation.org",
  },
  {
    id: "aspca-final",
    title: "ASPCA Saving Lives — Final Report",
    funder: "ASPCA",
    grant: "Animal Welfare General Support",
    due: "Aug 15, 2026",
    status: "Draft",
    daysLabel: "93 days left",
    reportType: "Final",
    coverageNote: "Covers 1 opportunity",
    coveredOpps: [
      { name: "ASPCA Saving Lives Grant", status: "Submitted", amount: "$75,000" },
    ],
    files: [],
    contact: "Grants Team",
    portal: "aspca.org/grants",
  },
  {
    id: "petco-progress",
    title: "Petco Love — Progress Report Q1",
    funder: "Petco Love",
    grant: "Lost & Found Grant 2025",
    due: "Submitted Mar 1, 2026",
    status: "Submitted",
    daysLabel: "Submitted Mar 1, 2026",
    reportType: "Progress",
    coverageNote: "Covers 1 opportunity",
    coveredOpps: [
      { name: "Petco Love Lost & Found Grant 2025", status: "Submitted", amount: "$50,000" },
    ],
    files: [
      { name: "Q1_Program_Report.pdf", uploaded: "Feb 28, 2026 · AW" },
    ],
    contact: "Petco Love Grants",
    portal: "petcolove.org/grants",
  },
  {
    id: "kellogg-final",
    title: "W.K. Kellogg — Final Report",
    funder: "W.K. Kellogg Foundation",
    grant: "Community Resilience Grant",
    due: "May 20, 2026",
    status: "Overdue",
    daysLabel: "12 days overdue",
    reportType: "Final",
    coverageNote: "Covers 1 opportunity",
    coveredOpps: [
      { name: "Community Resilience Grant", status: "Submitted", amount: "$80,000" },
    ],
    files: [],
    contact: "Program Officer",
    portal: "wkkf.org/grants",
  },
  {
    id: "rwj-interim",
    title: "Robert Wood Johnson — Interim Report",
    funder: "RWJ Foundation",
    grant: "Health Equity Initiative",
    due: "Jul 15, 2026",
    status: "Draft",
    daysLabel: "62 days left",
    reportType: "Interim",
    coverageNote: "Covers 1 opportunity",
    coveredOpps: [
      { name: "Health Equity 2026", status: "Active", amount: "$120,000" },
    ],
    files: [],
    contact: "Grants Administration",
    portal: "rwjf.org/grants",
  },
  {
    id: "macarthur-final",
    title: "MacArthur Foundation — Final Report",
    funder: "MacArthur",
    grant: "100&Change Proposal Support",
    due: "Submitted Jan 12, 2026",
    status: "Submitted",
    daysLabel: "Submitted Jan 12, 2026",
    reportType: "Final",
    coverageNote: "Covers 1 opportunity",
    coveredOpps: [
      { name: "100&Change Proposal Support", status: "Submitted", amount: "$100,000" },
    ],
    files: [
      { name: "MacArthur_Final_Report.pdf", uploaded: "Jan 10, 2026 · AW" },
    ],
    contact: "100&Change Team",
    portal: "macfound.org/grants",
  },
]

// ── Style helpers ──────────────────────────────────────────────────────────

const STATUS_STYLE: Record<ReportStatus, { bg: string; color: string }> = {
  Draft:     { bg: "var(--slate-light)", color: "var(--slate)"     },
  Submitted: { bg: "var(--blue-light)",  color: "var(--blue)"      },
  Overdue:   { bg: "#FEEAEA",            color: "#C0302A"           },
}

const OPP_STATUS_STYLE: Record<OppStatus, { bg: string; color: string }> = {
  Submitted: { bg: "var(--blue-light)",  color: "var(--blue)"      },
  Tracking:  { bg: "var(--slate-light)", color: "var(--slate)"     },
  Active:    { bg: "var(--evergreen-tint)", color: "var(--evergreen)" },
}

const FILTER_TABS: FilterTab[] = ["All", "Draft", "Submitted", "Overdue"]

// ── Report list row ────────────────────────────────────────────────────────

function ReportRow({
  report,
  isSelected,
  onClick,
}: {
  report: Report
  isSelected: boolean
  onClick: () => void
}) {
  const statusStyle = STATUS_STYLE[report.status]
  const isOverdue = report.status === "Overdue"

  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        display: "flex",
        flexDirection: "column",
        gap: 6,
        width: "calc(100% - 16px)",
        margin: "0 8px",
        padding: "14px 14px",
        borderRadius: 10,
        backgroundColor: isSelected ? "#FFFFFF" : "transparent",
        border: isSelected ? "1px solid var(--border-color)" : "1px solid transparent",
        borderLeft: isSelected ? "3px solid var(--slate-primary)" : "3px solid transparent",
        boxShadow: isSelected ? "0px 1px 4px rgba(28,24,64,0.06)" : "none",
        cursor: "pointer",
        textAlign: "left",
        transition: "background-color 150ms",
      }}
      onMouseEnter={(e) => {
        if (!isSelected) (e.currentTarget as HTMLButtonElement).style.backgroundColor = "rgba(255,255,255,0.5)"
      }}
      onMouseLeave={(e) => {
        if (!isSelected) (e.currentTarget as HTMLButtonElement).style.backgroundColor = "transparent"
      }}
    >
      {/* Title + days label */}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 8 }}>
        <span
          style={{
            fontSize: 13,
            fontWeight: 600,
            color: "var(--ink)",
            lineHeight: "18px",
            letterSpacing: "-0.01em",
          }}
        >
          {report.title}
        </span>
        {(report.status === "Draft" || report.status === "Overdue") && (
          <span
            style={{
              flexShrink: 0,
              fontSize: 11,
              fontWeight: 500,
              color: isOverdue ? "#C0302A" : "var(--ink-tertiary)",
              lineHeight: "18px",
              whiteSpace: "nowrap",
            }}
          >
            {report.daysLabel}
          </span>
        )}
      </div>

      {/* Funder · grant */}
      <span style={{ fontSize: 12, color: "var(--ink-tertiary)", lineHeight: "16px" }}>
        {report.funder} · {report.grant}
      </span>

      {/* Due date + status badge */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
          <Calendar
            size={11}
            color={isOverdue ? "#C0302A" : "var(--ink-tertiary)"}
          />
          <span
            style={{
              fontSize: 12,
              color: isOverdue ? "#C0302A" : "var(--ink-tertiary)",
              fontWeight: isOverdue ? 500 : 400,
            }}
          >
            {report.status === "Submitted" ? report.daysLabel : `Due ${report.due}`}
          </span>
        </div>
        <span
          style={{
            borderRadius: "var(--radius-pill)",
            padding: "2px 9px",
            backgroundColor: statusStyle.bg,
            fontSize: 11,
            fontWeight: 500,
            color: statusStyle.color,
          }}
        >
          {report.status}
        </span>
      </div>
    </button>
  )
}

// ── Detail panel ───────────────────────────────────────────────────────────

function DetailPanel({ report }: { report: Report }) {
  const statusStyle = STATUS_STYLE[report.status]
  const isOverdue = report.status === "Overdue"

  return (
    <div
      style={{
        flex: 1,
        overflowY: "auto",
        padding: "28px 40px",
        backgroundColor: "#FFFFFF",
        borderLeft: "1px solid var(--border-color)",
        display: "flex",
        flexDirection: "column",
        gap: 0,
      }}
    >
      {/* Title */}
      <div style={{ marginBottom: 10 }}>
        <h2
          style={{
            margin: "0 0 10px 0",
            fontSize: 22,
            fontWeight: 700,
            letterSpacing: "-0.025em",
            color: "var(--ink)",
          }}
        >
          {report.title}
        </h2>

        {/* Status + due + Edit */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <span
              style={{
                borderRadius: "var(--radius-pill)",
                padding: "3px 10px",
                backgroundColor: statusStyle.bg,
                fontSize: 12,
                fontWeight: 500,
                color: statusStyle.color,
              }}
            >
              {report.status}
            </span>
            {report.status !== "Submitted" && (
              <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
                <Calendar size={12} color={isOverdue ? "#C0302A" : "var(--amber)"} />
                <span
                  style={{
                    fontSize: 13,
                    fontWeight: 500,
                    color: isOverdue ? "#C0302A" : "var(--amber)",
                  }}
                >
                  Due {report.due}
                </span>
              </div>
            )}
          </div>
          <button
            type="button"
            style={{
              padding: "6px 14px",
              borderRadius: "var(--radius-button)",
              border: "1px solid var(--border-color)",
              backgroundColor: "transparent",
              fontSize: 13,
              color: "var(--ink)",
              cursor: "pointer",
              transition: "background-color 150ms",
            }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.backgroundColor = "#F3F0EA" }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.backgroundColor = "transparent" }}
          >
            Edit
          </button>
        </div>
      </div>

      {/* Meta chips */}
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 20 }}>
        <span
          style={{
            borderRadius: "var(--radius-pill)",
            padding: "4px 12px",
            backgroundColor: "var(--subtle)",
            border: "1px solid var(--border-color)",
            fontSize: 13,
            color: "var(--ink-secondary)",
          }}
        >
          {report.funder}
        </span>
        <span
          style={{
            borderRadius: "var(--radius-pill)",
            padding: "4px 12px",
            backgroundColor: "var(--subtle)",
            border: "1px solid var(--border-color)",
            fontSize: 13,
            color: "var(--ink-secondary)",
          }}
        >
          {report.reportType}
        </span>
        <span style={{ fontSize: 13, color: "var(--ink-tertiary)" }}>{report.coverageNote}</span>
      </div>

      <Divider />

      {/* Opportunities Covered */}
      <Section label="Opportunities Covered">
        <div
          style={{
            borderRadius: "var(--radius-card)",
            border: "1px solid var(--border-color)",
            overflow: "hidden",
          }}
        >
          {report.coveredOpps.map((opp, i) => {
            const os = OPP_STATUS_STYLE[opp.status]
            return (
              <div
                key={opp.name}
                style={{
                  display: "flex",
                  alignItems: "center",
                  padding: "10px 16px",
                  borderBottom:
                    i < report.coveredOpps.length - 1
                      ? "1px solid var(--border-color)"
                      : "none",
                  gap: 12,
                }}
              >
                <span style={{ flex: 1, fontSize: 13, color: "var(--ink)" }}>{opp.name}</span>
                <span
                  style={{
                    borderRadius: "var(--radius-pill)",
                    padding: "2px 9px",
                    backgroundColor: os.bg,
                    fontSize: 11,
                    fontWeight: 500,
                    color: os.color,
                    flexShrink: 0,
                  }}
                >
                  {opp.status}
                </span>
                <span
                  style={{
                    fontSize: 13,
                    fontWeight: 500,
                    color: "var(--evergreen)",
                    flexShrink: 0,
                    minWidth: 60,
                    textAlign: "right",
                  }}
                >
                  {opp.amount}
                </span>
              </div>
            )
          })}
        </div>
      </Section>

      <Divider />

      {/* Report Content */}
      <Section label="Report Content">
        <div
          style={{
            padding: "14px 16px",
            borderRadius: "var(--radius-card)",
            backgroundColor: "var(--slate-tint)",
            border: "1px solid rgba(74,96,128,0.15)",
            marginBottom: 12,
          }}
        >
          <p style={{ margin: 0, fontSize: 13, color: "var(--ink-secondary)", lineHeight: "19px" }}>
            Start writing your {report.reportType.toLowerCase()} report, or let the AI assistant
            generate a draft based on your proposal content and submitted outcomes.
          </p>
        </div>
        <div style={{ display: "flex", gap: 10 }}>
          <button
            type="button"
            style={{
              padding: "9px 18px",
              borderRadius: "var(--radius-button)",
              backgroundColor: "var(--slate-primary)",
              border: "none",
              fontSize: 13,
              fontWeight: 500,
              color: "#FFFFFF",
              cursor: "pointer",
              transition: "background-color 150ms",
            }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.backgroundColor = "#3A4F6A" }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.backgroundColor = "var(--slate-primary)" }}
          >
            Write report
          </button>
          <button
            type="button"
            style={{
              display: "flex",
              alignItems: "center",
              gap: 7,
              padding: "10px 16px",
              borderRadius: "var(--radius-button)",
              background: "linear-gradient(135deg, var(--slate-primary) 0%, var(--slate-secondary) 100%)",
              border: "none",
              fontSize: 13,
              fontWeight: 500,
              color: "#FFFFFF",
              cursor: "pointer",
            }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = "linear-gradient(135deg, #3A4F6A 0%, #58708A 100%)" }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = "linear-gradient(135deg, var(--slate-primary) 0%, var(--slate-secondary) 100%)" }}
          >
            <Sparkles size={13} color="#FFFFFF" />
            Generate draft with AI
          </button>
        </div>
      </Section>

      <Divider />

      {/* Supporting Files */}
      <Section label={`Supporting Files (${report.files.length})`}>
        {report.files.length > 0 ? (
          <div
            style={{
              borderRadius: "var(--radius-card)",
              border: "1px solid var(--border-color)",
              overflow: "hidden",
              marginBottom: 10,
            }}
          >
            {report.files.map((file, i) => (
              <div
                key={file.name}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 12,
                  padding: "12px 16px",
                  borderBottom:
                    i < report.files.length - 1 ? "1px solid var(--border-color)" : "none",
                }}
              >
                <FileText size={14} color="var(--ink-tertiary)" style={{ flexShrink: 0 }} />
                <div style={{ flex: 1 }}>
                  <p style={{ margin: "0 0 2px 0", fontSize: 13, fontWeight: 500, color: "var(--ink)" }}>
                    {file.name}
                  </p>
                  <p style={{ margin: 0, fontSize: 12, color: "var(--ink-tertiary)" }}>
                    Uploaded {file.uploaded}
                  </p>
                </div>
                <button
                  type="button"
                  style={{
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                    padding: 4,
                    flexShrink: 0,
                    display: "flex",
                    alignItems: "center",
                  }}
                >
                  <Trash2 size={14} color="var(--ink-tertiary)" />
                </button>
              </div>
            ))}
          </div>
        ) : null}
        <button
          type="button"
          style={{
            background: "none",
            border: "none",
            padding: 0,
            cursor: "pointer",
            fontSize: 13,
            fontWeight: 500,
            color: "var(--slate-secondary)",
          }}
        >
          + Upload file
        </button>
      </Section>

      <Divider />

      {/* Submission */}
      <Section label="Submission">
        <div style={{ marginBottom: 16 }}>
          <p style={{ margin: "0 0 2px 0", fontSize: 13, fontWeight: 500, color: "var(--ink)" }}>
            {report.contact}
          </p>
          <p style={{ margin: 0, fontSize: 13, color: "var(--ink-secondary)" }}>
            Online portal —{" "}
            <span style={{ color: "var(--blue)", cursor: "pointer" }}>{report.portal}</span>
          </p>
        </div>
        <button
          type="button"
          style={{
            width: "100%",
            padding: "12px 20px",
            borderRadius: "var(--radius-button)",
            backgroundColor: "var(--slate-primary)",
            border: "none",
            fontSize: 14,
            fontWeight: 600,
            color: "#FFFFFF",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 8,
            marginBottom: 8,
            transition: "background-color 150ms",
          }}
          onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.backgroundColor = "#3A4F6A" }}
          onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.backgroundColor = "var(--slate-primary)" }}
        >
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden>
            <rect x="2" y="6" width="10" height="7" rx="1.5" stroke="rgba(255,255,255,0.7)" strokeWidth="1.2" fill="none" />
            <path d="M4.5 6V4.5a2.5 2.5 0 0 1 5 0V6" stroke="rgba(255,255,255,0.7)" strokeWidth="1.2" strokeLinecap="round" />
          </svg>
          Submit report
        </button>
        <p
          style={{
            margin: 0,
            fontSize: 12,
            color: "var(--ink-tertiary)",
            textAlign: "center",
          }}
        >
          Submitting will mark this report as complete and notify your team.
        </p>
      </Section>
    </div>
  )
}

// ── Shared primitives ──────────────────────────────────────────────────────

function Section({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ paddingBottom: 20 }}>
      <p
        style={{
          fontSize: 10,
          fontWeight: 600,
          letterSpacing: "0.08em",
          textTransform: "uppercase",
          color: "var(--ink-tertiary)",
          margin: "0 0 12px 0",
        }}
      >
        {label}
      </p>
      {children}
    </div>
  )
}

function Divider() {
  return (
    <div style={{ height: 1, backgroundColor: "var(--border-color)", margin: "4px 0 20px 0" }} />
  )
}

// ── Page ───────────────────────────────────────────────────────────────────

export default function ReportsPage() {
  const [selectedId, setSelectedId] = useState("ford-interim")
  const [activeFilter, setActiveFilter] = useState<FilterTab>("All")

  const filtered =
    activeFilter === "All"
      ? REPORTS
      : REPORTS.filter((r) => r.status === activeFilter)

  const selected =
    filtered.find((r) => r.id === selectedId) ?? filtered[0] ?? REPORTS[0]

  function handleFilterChange(tab: FilterTab) {
    setActiveFilter(tab)
    const first = tab === "All" ? REPORTS[0] : REPORTS.find((r) => r.status === tab)
    if (first) setSelectedId(first.id)
  }

  return (
    <div className="flex flex-col flex-1" style={{ overflow: "hidden", minHeight: 0 }}>
      {/* Page header */}
      <div
        style={{
          flexShrink: 0,
          padding: "20px 32px",
          backgroundColor: "#FFFFFF",
          borderBottom: "1px solid var(--border-color)",
          display: "flex",
          alignItems: "flex-start",
          justifyContent: "space-between",
        }}
      >
        <div>
          <h1
            style={{
              margin: "0 0 4px 0",
              fontSize: 22,
              fontWeight: 700,
              letterSpacing: "-0.025em",
              color: "var(--ink)",
            }}
          >
            Reports
          </h1>
          <p style={{ margin: 0, fontSize: 13, color: "var(--ink-secondary)" }}>
            Post-award reporting across all your engagements.
          </p>
        </div>
        <button
          type="button"
          style={{
            display: "flex",
            alignItems: "center",
            gap: 6,
            padding: "8px 18px",
            borderRadius: "var(--radius-button)",
            backgroundColor: "var(--slate-primary)",
            border: "none",
            fontSize: 14,
            fontWeight: 500,
            color: "#FFFFFF",
            cursor: "pointer",
            flexShrink: 0,
            transition: "background-color 150ms",
          }}
          onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.backgroundColor = "#3A4F6A" }}
          onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.backgroundColor = "var(--slate-primary)" }}
        >
          <Plus size={15} style={{ flexShrink: 0 }} />
          New report
        </button>
      </div>

      {/* Body */}
      <div className="flex flex-1" style={{ overflow: "hidden", minHeight: 0 }}>
        {/* Left column */}
        <aside
          style={{
            width: 268,
            flexShrink: 0,
            backgroundColor: "#F3F0EA",
            borderRight: "1px solid var(--border-color)",
            overflowY: "auto",
            display: "flex",
            flexDirection: "column",
          }}
        >
          {/* Filter pills */}
          <div
            style={{
              flexShrink: 0,
              padding: "14px 16px 10px 16px",
              display: "flex",
              gap: 6,
              flexWrap: "wrap",
            }}
          >
            {FILTER_TABS.map((tab) => {
              const isActive = activeFilter === tab
              const isOverdueTab = tab === "Overdue"
              return (
                <button
                  key={tab}
                  type="button"
                  onClick={() => handleFilterChange(tab)}
                  style={{
                    borderRadius: "var(--radius-pill)",
                    padding: "4px 12px",
                    border: isActive ? "none" : "1px solid var(--border-color)",
                    backgroundColor: isActive
                      ? isOverdueTab
                        ? "#C0302A"
                        : "var(--slate-primary)"
                      : "transparent",
                    fontSize: 12,
                    fontWeight: isActive ? 600 : 400,
                    color: isActive ? "#FFFFFF" : "var(--ink-secondary)",
                    cursor: "pointer",
                    transition: "background-color 150ms, color 150ms",
                  }}
                >
                  {tab}
                </button>
              )
            })}
          </div>

          {/* Count */}
          <p
            style={{
              margin: "0 0 8px 16px",
              fontSize: 12,
              color: "var(--ink-tertiary)",
            }}
          >
            {filtered.length} report{filtered.length !== 1 ? "s" : ""}
          </p>

          {/* Rows */}
          <div style={{ display: "flex", flexDirection: "column", gap: 4, padding: "0 0 12px 0" }}>
            {filtered.map((report) => (
              <ReportRow
                key={report.id}
                report={report}
                isSelected={report.id === selected.id}
                onClick={() => setSelectedId(report.id)}
              />
            ))}
          </div>
        </aside>

        {/* Right detail */}
        <DetailPanel report={selected} />
      </div>
    </div>
  )
}
