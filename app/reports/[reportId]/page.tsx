"use client"

/*
 * Report Editor — standalone full-screen page (no sidebar layout).
 *
 * Sibling of app/(app)/editor/page.tsx. Same three-column shell, same token
 * set, same gradient-ai-sidebar for the left nav rail. Differences:
 *  - Sections are derived from a parsed funder template, not a fixed proposal structure.
 *  - Loading → Ready transition simulated with a short delay.
 *  - AI panel intro message is report-scoped.
 *  - Context tab shows template + owning Opportunity + reporting period.
 */

import React, { useState, useEffect, useRef, Suspense } from "react"
import Link from "next/link"
import { useSearchParams } from "next/navigation"
import {
  Bold, Italic, Underline, List, ListOrdered, ChevronLeft,
} from "lucide-react"

// ── Types ──────────────────────────────────────────────────────────────────

type ReportType = "Interim" | "Final" | "Progress"
type AITab = "assistant" | "suggestions" | "context"
type EditorState = "loading" | "ready"

interface ParsedReportSection {
  id: string
  heading: string
  funderRequirement: string
  completion: "active" | "empty"
}

interface ChatMessage {
  role: "user" | "ai"
  text: string
}

// ── Fixture — simulated parsed template sections ──────────────────────────

const TEMPLATE_SECTIONS: ParsedReportSection[] = [
  {
    id: "executive-summary",
    heading: "Executive Summary",
    funderRequirement:
      "Provide a 2–3 paragraph overview of progress made during this reporting period, key highlights, and any significant developments relevant to the goals outlined in your original proposal.",
    completion: "active",
  },
  {
    id: "progress-against-goals",
    heading: "Progress Against Goals",
    funderRequirement:
      "For each goal outlined in your proposal, describe what you have accomplished in this reporting period. Include quantitative data and metrics where available. Goals with no activity should be noted with an explanation.",
    completion: "empty",
  },
  {
    id: "outcomes-and-impact",
    heading: "Outcomes and Impact",
    funderRequirement:
      "Describe the outcomes achieved and the evidence of impact on the communities and individuals served during this period. Include illustrative stories or case studies where available.",
    completion: "empty",
  },
  {
    id: "challenges-and-adjustments",
    heading: "Challenges and Adjustments",
    funderRequirement:
      "Describe any significant challenges encountered and how your organization responded. If any project activities were modified from the original plan, explain why and how these changes align with your original goals.",
    completion: "empty",
  },
  {
    id: "financial-summary",
    heading: "Financial Summary",
    funderRequirement:
      "Provide a summary of expenditures to date against the approved budget. Note any variances greater than 10% and explain the reasons. Attach a budget-to-actual spreadsheet if available.",
    completion: "empty",
  },
  {
    id: "next-period-plan",
    heading: "Next Period Plan",
    funderRequirement:
      "Describe planned activities for the next reporting period, key milestones you expect to achieve, anticipated challenges, and any guidance needed from the foundation.",
    completion: "empty",
  },
]

const LOADING_SECTIONS_PLACEHOLDER = 6

// ── Helper ─────────────────────────────────────────────────────────────────

function MIcon({
  name,
  size = 20,
  color,
  style,
}: {
  name: string
  size?: number
  color?: string
  style?: React.CSSProperties
}) {
  return (
    <span
      className="material-symbols-outlined"
      style={{ fontSize: size, lineHeight: 1, color: color ?? "inherit", userSelect: "none", ...style }}
    >
      {name}
    </span>
  )
}


// ── Section nav item ───────────────────────────────────────────────────────

function NavItem({
  section,
  isActive,
  onClick,
}: {
  section: ParsedReportSection
  isActive: boolean
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        display: "flex",
        alignItems: "center",
        gap: 10,
        width: "100%",
        padding: "8px 12px",
        borderRadius: 8,
        backgroundColor: isActive ? "rgba(255,255,255,0.12)" : "transparent",
        border: "none",
        cursor: "pointer",
        textAlign: "left",
        transition: "background-color 150ms",
      }}
      onMouseEnter={(e) => {
        if (!isActive)
          (e.currentTarget as HTMLButtonElement).style.backgroundColor = "rgba(255,255,255,0.07)"
      }}
      onMouseLeave={(e) => {
        if (!isActive)
          (e.currentTarget as HTMLButtonElement).style.backgroundColor = "transparent"
      }}
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
      <span
        style={{
          fontSize: 13,
          fontWeight: isActive ? 600 : 400,
          color: isActive ? "#FFFFFF" : section.completion === "empty" ? "rgba(255,255,255,0.4)" : "rgba(255,255,255,0.85)",
          lineHeight: "16px",
        }}
      >
        {section.heading}
      </span>
    </button>
  )
}

// ── Loading skeleton nav item ──────────────────────────────────────────────

function NavItemSkeleton({ index }: { index: number }) {
  const widths = [120, 148, 108, 156, 100, 130]
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 10,
        padding: "8px 12px",
      }}
    >
      <div
        style={{
          width: 10,
          height: 10,
          borderRadius: "50%",
          border: "1px solid rgba(255,255,255,0.2)",
          flexShrink: 0,
        }}
      />
      <div
        style={{
          height: 10,
          borderRadius: 4,
          backgroundColor: "rgba(255,255,255,0.1)",
          width: widths[index % widths.length],
        }}
      />
    </div>
  )
}

// ── Format helpers ─────────────────────────────────────────────────────────

function formatPeriod(start: string, end: string): string {
  if (!start || !end) return ""
  try {
    const s = new Date(start + "T12:00:00")
    const e = new Date(end + "T12:00:00")
    const fmt = new Intl.DateTimeFormat("en-US", { month: "short", year: "numeric" })
    return `${fmt.format(s)} - ${fmt.format(e)}`
  } catch {
    return `${start} to ${end}`
  }
}

function formatDate(iso: string): string {
  if (!iso) return ""
  try {
    return new Date(iso + "T12:00:00").toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    })
  } catch {
    return iso
  }
}

// ── Page ───────────────────────────────────────────────────────────────────

function ReportEditorContent() {
  const searchParams = useSearchParams()

  // Data from setup modal via search params
  const reportName = searchParams.get("reportName") ?? "Progress Report"
  const reportType = (searchParams.get("reportType") as ReportType) ?? "Progress"
  const opportunityName = searchParams.get("opportunityName") ?? "Unknown Opportunity"
  const opportunityId = searchParams.get("opportunityId") ?? "equitable-futures"
  const periodStart = searchParams.get("periodStart") ?? ""
  const periodEnd = searchParams.get("periodEnd") ?? ""
  const dueDate = searchParams.get("dueDate") ?? ""
  const templateName = searchParams.get("templateName") ?? "Funder report template"
  const templateKind = searchParams.get("templateKind") ?? ""

  // Editor state
  const [editorState, setEditorState] = useState<EditorState>("loading")
  const [fileProcessing, setFileProcessing] = useState(templateKind === "file")
  const [activeId, setActiveId] = useState<string>(TEMPLATE_SECTIONS[0].id)
  const [aiTab, setAiTab] = useState<AITab>("assistant")
  const [chatInput, setChatInput] = useState("")
  const [chat, setChat] = useState<ChatMessage[]>([])
  const [typing, setTyping] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)

  const period = formatPeriod(periodStart, periodEnd)
  const formattedDue = formatDate(dueDate)
  const sectionCount = TEMPLATE_SECTIONS.length

  useEffect(() => {
    // Simulate template parsing (1.5s)
    const t1 = setTimeout(() => {
      setEditorState("ready")
      setChat([
        {
          role: "ai",
          text: `I've loaded your ${templateName ? `"${templateName}"` : "funder report template"} and found ${sectionCount} sections. This is your ${reportType} report for ${opportunityName}${period ? `, covering ${period}` : ""}. Start writing in any section, or ask me to help draft one.`,
        },
      ])
    }, 1500)

    // Simulate file processing completing slightly after sections load
    let t2: ReturnType<typeof setTimeout> | undefined
    if (fileProcessing) {
      t2 = setTimeout(() => {
        setFileProcessing(false)
      }, 3000)
    }

    return () => {
      clearTimeout(t1)
      if (t2) clearTimeout(t2)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  function handleSendChat() {
    if (!chatInput.trim()) return
    const text = chatInput.trim()
    setChatInput("")
    setChat((prev) => [...prev, { role: "user", text }])
    setTyping(true)
    setTimeout(() => {
      setTyping(false)
      const activeSection = TEMPLATE_SECTIONS.find((s) => s.id === activeId)
      setChat((prev) => [
        ...prev,
        {
          role: "ai",
          text: activeSection
            ? `I can help you write the ${activeSection.heading} section. What specific aspect of your progress would you like to highlight?`
            : "I can help you with this report. What would you like to work on?",
        },
      ])
    }, 1500)
  }

  const isLoading = editorState === "loading"
  const completedCount = 0
  const progress = Math.round((completedCount / sectionCount) * 100)
  const activeSection = TEMPLATE_SECTIONS.find((s) => s.id === activeId) ?? TEMPLATE_SECTIONS[0]
  const bodyH = "calc(100vh - 44px - 40px)"

  return (
    <div
      className="flex flex-col"
      style={{ height: "100vh", overflow: "hidden", backgroundColor: "var(--surface-white)" }}
    >
      {/* Top bar */}
      <div
        style={{
          flexShrink: 0,
          height: 44,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "0 20px",
          backgroundColor: "var(--surface-white)",
          borderBottom: "1px solid var(--border-default)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <Link
            href={`/opportunity/${opportunityId}`}
            style={{
              width: 26,
              height: 26,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              borderRadius: 6,
              border: "1px solid var(--border-default)",
              backgroundColor: "var(--surface-white)",
              textDecoration: "none",
              flexShrink: 0,
            }}
          >
            <ChevronLeft size={13} color="var(--ink-secondary)" />
          </Link>
          <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13, color: "var(--ink-tertiary)" }}>
            <Link href={`/opportunity/${opportunityId}`} style={{ color: "var(--ink-tertiary)", textDecoration: "none" }}>
              {opportunityName}
            </Link>
            <span>›</span>
            <span style={{ color: "var(--ink)", fontWeight: 500 }}>{reportName}</span>
          </div>
          <span
            style={{
              borderRadius: 20,
              padding: "2px 8px",
              backgroundColor: "var(--canvas)",
              border: "1px solid var(--border-default)",
              fontSize: 11,
              fontWeight: 500,
              color: "var(--ink-secondary)",
            }}
          >
            {reportType}
          </span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <circle cx="7" cy="7" r="6" stroke="var(--evergreen)" strokeWidth="1" fill="none" />
            <path d="M4.5 7.2l1.7 1.7 3.3-3.3" stroke="var(--evergreen)" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          <span style={{ fontSize: 12, color: "var(--ink-tertiary)", marginRight: 12 }}>Autosaved</span>
          <button
            type="button"
            style={outlineBtn}
            onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.backgroundColor = "var(--canvas)" }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.backgroundColor = "transparent" }}
          >
            <MIcon name="ios_share" size={13} color="var(--ink-secondary)" />
            Share
          </button>
          <button
            type="button"
            style={outlineBtn}
            onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.backgroundColor = "var(--canvas)" }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.backgroundColor = "transparent" }}
          >
            Submit
          </button>
          <button
            type="button"
            style={{
              padding: "7px 16px",
              borderRadius: 8,
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
            Save draft
          </button>
        </div>
      </div>

      {/* Toolbar */}
      <div
        style={{
          flexShrink: 0,
          display: "flex",
          alignItems: "center",
          gap: 2,
          padding: "0 20px",
          height: 40,
          backgroundColor: "var(--surface-white)",
          borderBottom: "1px solid var(--border-default)",
        }}
      >
        {[Bold, Italic, Underline].map((Icon, i) => (
          <button
            key={i}
            type="button"
            style={toolbarBtn}
            onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.backgroundColor = "var(--canvas)" }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.backgroundColor = "transparent" }}
          >
            <Icon size={13} color="var(--ink-secondary)" />
          </button>
        ))}
        <div style={{ width: 1, height: 16, backgroundColor: "var(--border-default)", margin: "0 4px" }} />
        {["H1", "H2"].map((t) => (
          <button
            key={t}
            type="button"
            style={{ ...toolbarBtn, fontSize: 12, fontWeight: 600, color: "var(--ink-secondary)" }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.backgroundColor = "var(--canvas)" }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.backgroundColor = "transparent" }}
          >
            {t}
          </button>
        ))}
        <div style={{ width: 1, height: 16, backgroundColor: "var(--border-default)", margin: "0 4px" }} />
        {[List, ListOrdered].map((Icon, i) => (
          <button
            key={i}
            type="button"
            style={toolbarBtn}
            onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.backgroundColor = "var(--canvas)" }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.backgroundColor = "transparent" }}
          >
            <Icon size={13} color="var(--ink-secondary)" />
          </button>
        ))}
      </div>

      {/* Three-column body */}
      <div style={{ display: "flex", height: bodyH, overflow: "hidden" }}>

        {/* Left: section nav */}
        <aside
          style={{
            width: 220,
            flexShrink: 0,
            background: "var(--gradient-ai-sidebar)",
            borderRight: "1px solid rgba(255,255,255,0.08)",
            overflowY: "auto",
            display: "flex",
            flexDirection: "column",
            height: "100%",
          }}
        >
          <div
            style={{
              flexShrink: 0,
              padding: "14px 12px 8px 14px",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <span
              style={{
                fontSize: 10,
                fontWeight: 600,
                letterSpacing: "0.08em",
                textTransform: "uppercase",
                color: "rgba(255,255,255,0.35)",
              }}
            >
              Sections
            </span>
          </div>

          <div style={{ flex: 1, padding: "0 8px", display: "flex", flexDirection: "column", gap: 2 }}>
            {isLoading
              ? Array.from({ length: LOADING_SECTIONS_PLACEHOLDER }).map((_, i) => (
                  <NavItemSkeleton key={i} index={i} />
                ))
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

          {/* Progress */}
          <div
            style={{
              flexShrink: 0,
              padding: "12px 14px 16px",
              borderTop: "1px solid rgba(255,255,255,0.08)",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
              <span style={{ fontSize: 11, color: "rgba(255,255,255,0.45)" }}>Progress</span>
              <span style={{ fontSize: 11, fontWeight: 600, color: "rgba(255,255,255,0.7)" }}>
                {isLoading ? "—" : `${progress}%`}
              </span>
            </div>
            <div style={{ height: 4, borderRadius: 2, backgroundColor: "rgba(255,255,255,0.1)" }}>
              {!isLoading && (
                <div
                  style={{
                    height: "100%",
                    borderRadius: 2,
                    backgroundColor: "var(--slate-secondary)",
                    width: `${progress}%`,
                    transition: "width 400ms ease",
                  }}
                />
              )}
            </div>
          </div>
        </aside>

        {/* Center: writing surface */}
        <div
          ref={scrollRef}
          style={{ flex: 1, overflowY: "auto", backgroundColor: "var(--canvas)", height: "100%" }}
        >
          {isLoading ? (
            /* Loading state — gentle placeholder, no blocking */
            <div
              style={{
                maxWidth: 720,
                margin: "0 auto",
                padding: "40px 40px 120px 40px",
                backgroundColor: "var(--surface-white)",
                minHeight: "100%",
                boxShadow: "0 0 0 1px rgba(42,42,42,0.04)",
              }}
            >
              <div style={{ marginBottom: 32 }}>
                <div
                  style={{
                    height: 28,
                    borderRadius: 6,
                    backgroundColor: "var(--canvas)",
                    width: "60%",
                    marginBottom: 10,
                  }}
                />
                <div
                  style={{
                    height: 14,
                    borderRadius: 4,
                    backgroundColor: "var(--canvas)",
                    width: "30%",
                  }}
                />
              </div>
              <div style={{ height: 1, backgroundColor: "var(--border-default)", marginBottom: 36 }} />
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  padding: "14px 16px",
                  borderRadius: 10,
                  backgroundColor: "var(--canvas)",
                  border: "1px solid var(--border-default)",
                }}
              >
                <div
                  style={{
                    width: 16,
                    height: 16,
                    borderRadius: "50%",
                    border: "2px solid var(--slate-soft)",
                    borderTopColor: "var(--slate-primary)",
                    animation: "spin 0.8s linear infinite",
                    flexShrink: 0,
                  }}
                />
                <span style={{ fontSize: 13, color: "var(--ink-tertiary)" }}>
                  Analyzing template and preparing sections...
                </span>
              </div>
            </div>
          ) : (
            /* Ready state */
            <div
              style={{
                maxWidth: 720,
                margin: "0 auto",
                padding: "40px 40px 120px 40px",
                backgroundColor: "var(--surface-white)",
                minHeight: "100%",
                boxShadow: "0 0 0 1px rgba(42,42,42,0.04)",
              }}
            >
              {/* Doc header */}
              <div style={{ marginBottom: 32 }}>
                <h1
                  style={{
                    margin: "0 0 6px",
                    fontSize: 26,
                    fontWeight: 500,
                    color: "var(--ink)",
                    fontFamily: "var(--font-lora)",
                    letterSpacing: "-0.02em",
                  }}
                >
                  {reportName}
                </h1>
                <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" as const }}>
                  <span style={{ fontSize: 13, fontWeight: 500, color: "var(--slate-secondary)" }}>
                    {opportunityName}
                  </span>
                  {period && (
                    <>
                      <span style={{ fontSize: 13, color: "var(--ink-tertiary)" }}>·</span>
                      <span style={{ fontSize: 13, color: "var(--ink-tertiary)" }}>{period}</span>
                    </>
                  )}
                  {formattedDue && (
                    <>
                      <span style={{ fontSize: 13, color: "var(--ink-tertiary)" }}>·</span>
                      <span style={{ fontSize: 13, color: "var(--ink-tertiary)" }}>Due {formattedDue}</span>
                    </>
                  )}
                </div>
              </div>
              <div style={{ height: 1, backgroundColor: "var(--border-default)", marginBottom: 36 }} />

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
                    <h2
                      style={{
                        margin: "0 0 12px",
                        fontSize: 18,
                        fontWeight: 500,
                        color: "var(--ink)",
                        fontFamily: "var(--font-lora)",
                        borderBottom: isActive ? "2px solid var(--slate-primary)" : "2px solid transparent",
                        paddingBottom: 4,
                        display: "inline-block",
                        transition: "border-color 150ms",
                        letterSpacing: "-0.01em",
                      }}
                    >
                      {section.heading}
                    </h2>

                    {/* Funder-requirement callout — plum-tinted, left border */}
                    <div
                      style={{
                        padding: "10px 14px",
                        marginBottom: 14,
                        borderRadius: 8,
                        backgroundColor: "#F5F0F6",
                        borderLeft: "3px solid #AD9DAE",
                      }}
                    >
                      <p
                        style={{
                          margin: 0,
                          fontSize: 13,
                          color: "var(--ink-secondary)",
                          lineHeight: "19px",
                          fontStyle: "italic",
                        }}
                      >
                        {section.funderRequirement}
                      </p>
                    </div>

                    {/* Editable body area */}
                    <div
                      contentEditable
                      suppressContentEditableWarning
                      data-placeholder={`Write your ${section.heading.toLowerCase()} here, or ask the AI assistant for help...`}
                      style={{
                        minHeight: 80,
                        fontSize: 15,
                        color: "var(--ink)",
                        lineHeight: "26px",
                        outline: "none",
                        caretColor: "var(--slate-primary)",
                      }}
                      onFocus={() => setActiveId(section.id)}
                    />
                    <style>{`
                      [contenteditable]:empty:before {
                        content: attr(data-placeholder);
                        color: var(--ink-tertiary);
                        font-style: italic;
                        pointer-events: none;
                      }
                    `}</style>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Right: AI panel */}
        <div
          style={{
            width: 340,
            flexShrink: 0,
            borderLeft: "1px solid var(--border-default)",
            backgroundColor: "var(--canvas)",
            display: "flex",
            flexDirection: "column",
            height: "100%",
            overflow: "hidden",
          }}
        >
          {/* Tabs */}
          <div
            style={{
              flexShrink: 0,
              display: "flex",
              borderBottom: "1px solid var(--border-default)",
              padding: "0 16px",
              backgroundColor: "var(--canvas)",
            }}
          >
            {(["assistant", "suggestions", "context"] as AITab[]).map((tab) => {
              const label = tab === "assistant" ? "AI Assistant" : tab === "suggestions" ? "Suggestions" : "Context"
              const isA = aiTab === tab
              return (
                <button
                  key={tab}
                  type="button"
                  onClick={() => setAiTab(tab)}
                  style={{
                    position: "relative",
                    padding: "12px 4px",
                    marginRight: 14,
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                    fontSize: 13,
                    fontWeight: isA ? 600 : 400,
                    color: isA ? "var(--slate-primary)" : "var(--ink-secondary)",
                    transition: "color 150ms",
                    borderRadius: 4,
                  }}
                >
                  {label}
                  {isA && (
                    <div
                      style={{
                        position: "absolute",
                        bottom: 0,
                        left: 0,
                        right: 0,
                        height: 2,
                        borderRadius: 1,
                        backgroundColor: "var(--slate-primary)",
                      }}
                    />
                  )}
                </button>
              )
            })}
          </div>

          {/* Panel body */}
          <div style={{ flex: 1, overflowY: "auto", padding: "14px 16px" }}>

            {/* ── Assistant tab ── */}
            {aiTab === "assistant" && (
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {isLoading ? (
                  /* Loading state messages */
                  <>
                    <div style={{ display: "flex", gap: 8, alignItems: "flex-start" }}>
                      <div
                        style={{
                          width: 22,
                          height: 22,
                          borderRadius: "50%",
                          background: "var(--gradient-avatar)",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          flexShrink: 0,
                          marginTop: 1,
                        }}
                      >
                        <span style={{ fontSize: 8, fontWeight: 700, color: "#FFF" }}>GA</span>
                      </div>
                      <div
                        style={{
                          flex: 1,
                          padding: "10px 12px",
                          borderRadius: 10,
                          backgroundColor: "var(--surface-white)",
                          border: "1px solid var(--border-default)",
                          fontSize: 13,
                          color: "var(--ink)",
                          lineHeight: "19px",
                        }}
                      >
                        Setting up your report...
                      </div>
                    </div>
                    {fileProcessing && templateName && (
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 8,
                          padding: "8px 12px",
                          borderRadius: 8,
                          backgroundColor: "var(--canvas)",
                          border: "1px solid var(--border-default)",
                          fontSize: 12,
                          color: "var(--ink-secondary)",
                        }}
                      >
                        <div
                          style={{
                            width: 12,
                            height: 12,
                            borderRadius: "50%",
                            border: "1.5px solid var(--slate-soft)",
                            borderTopColor: "var(--slate-primary)",
                            animation: "spin 0.8s linear infinite",
                            flexShrink: 0,
                          }}
                        />
                        Still processing {templateName}...
                      </div>
                    )}
                  </>
                ) : (
                  /* Ready state — messages */
                  <>
                    {chat.map((msg, i) => (
                      <div key={i} style={{ display: "flex", gap: 8, alignItems: "flex-start" }}>
                        {msg.role === "ai" && (
                          <div
                            style={{
                              width: 22,
                              height: 22,
                              borderRadius: "50%",
                              background: "var(--gradient-avatar)",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              flexShrink: 0,
                              marginTop: 1,
                            }}
                          >
                            <span style={{ fontSize: 8, fontWeight: 700, color: "#FFF" }}>GA</span>
                          </div>
                        )}
                        <div
                          style={{
                            flex: 1,
                            padding: "10px 12px",
                            borderRadius: 10,
                            backgroundColor: msg.role === "ai" ? "var(--surface-white)" : "var(--slate-tint)",
                            border: "1px solid var(--border-default)",
                            fontSize: 13,
                            color: "var(--ink)",
                            lineHeight: "19px",
                          }}
                        >
                          {msg.text}
                        </div>
                      </div>
                    ))}
                    {typing && (
                      <div style={{ display: "flex", gap: 8, alignItems: "flex-start" }}>
                        <div
                          style={{
                            width: 22,
                            height: 22,
                            borderRadius: "50%",
                            background: "var(--gradient-avatar)",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            flexShrink: 0,
                          }}
                        >
                          <span style={{ fontSize: 8, fontWeight: 700, color: "#FFF" }}>GA</span>
                        </div>
                        <div
                          style={{
                            padding: "10px 14px",
                            borderRadius: 10,
                            backgroundColor: "var(--surface-white)",
                            border: "1px solid var(--border-default)",
                          }}
                        >
                          <span style={{ fontSize: 18, color: "var(--ink-tertiary)", letterSpacing: 2 }}>···</span>
                        </div>
                      </div>
                    )}
                  </>
                )}
              </div>
            )}

            {/* ── Suggestions tab ── */}
            {aiTab === "suggestions" && (
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                {isLoading ? (
                  <p style={{ fontSize: 13, color: "var(--ink-tertiary)", margin: 0 }}>
                    Preparing suggestions...
                  </p>
                ) : (
                  <div
                    style={{
                      padding: "14px",
                      borderRadius: 10,
                      backgroundColor: "var(--canvas)",
                      border: "1px solid var(--border-default)",
                    }}
                  >
                    <p style={{ margin: 0, fontSize: 13, color: "var(--ink-tertiary)", lineHeight: "19px" }}>
                      Suggestions for <strong style={{ color: "var(--ink)" }}>{activeSection.heading}</strong> will appear here once you start writing.
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* ── Context tab ── */}
            {aiTab === "context" && (
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                {/* Uploaded template — first */}
                <div>
                  <p
                    style={{
                      margin: "0 0 8px",
                      fontSize: 10,
                      fontWeight: 600,
                      letterSpacing: "0.07em",
                      textTransform: "uppercase",
                      color: "var(--ink-tertiary)",
                    }}
                  >
                    Funder template
                  </p>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 10,
                      padding: "9px 12px",
                      borderRadius: 8,
                      backgroundColor: "var(--surface-white)",
                      border: "1px solid var(--border-default)",
                    }}
                  >
                    <MIcon
                      name="description"
                      size={16}
                      color="var(--slate-secondary)"
                      style={{ flexShrink: 0 }}
                    />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p
                        style={{
                          margin: 0,
                          fontSize: 12,
                          fontWeight: 500,
                          color: "var(--ink)",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {templateName || "Funder report template"}
                      </p>
                      <p style={{ margin: 0, fontSize: 11, color: "var(--ink-tertiary)" }}>
                        {isLoading ? "Processing..." : `${sectionCount} sections detected`}
                      </p>
                    </div>
                  </div>
                </div>

                <div style={{ height: 1, backgroundColor: "var(--border-default)" }} />

                {/* Owning opportunity */}
                <div>
                  <p
                    style={{
                      margin: "0 0 8px",
                      fontSize: 10,
                      fontWeight: 600,
                      letterSpacing: "0.07em",
                      textTransform: "uppercase",
                      color: "var(--ink-tertiary)",
                    }}
                  >
                    Working from
                  </p>
                  {[
                    { label: "Opportunity", value: opportunityName },
                    {
                      label: "Report type",
                      value: reportType,
                    },
                    ...(period ? [{ label: "Reporting period", value: period }] : []),
                    ...(formattedDue ? [{ label: "Due date", value: formattedDue }] : []),
                  ].map(({ label, value }) => (
                    <div
                      key={label}
                      style={{
                        display: "flex",
                        alignItems: "flex-start",
                        justifyContent: "space-between",
                        padding: "10px 12px",
                        borderRadius: 8,
                        backgroundColor: "var(--surface-white)",
                        border: "1px solid var(--border-default)",
                        marginBottom: 6,
                      }}
                    >
                      <div>
                        <p
                          style={{
                            margin: "0 0 2px",
                            fontSize: 11,
                            fontWeight: 600,
                            letterSpacing: "0.05em",
                            textTransform: "uppercase",
                            color: "var(--ink-tertiary)",
                          }}
                        >
                          {label}
                        </p>
                        <p style={{ margin: 0, fontSize: 13, color: "var(--ink)", lineHeight: "17px" }}>{value}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Chat input — only on assistant tab */}
          {aiTab === "assistant" && !isLoading && (
            <div
              style={{
                flexShrink: 0,
                borderTop: "1px solid var(--border-default)",
                padding: "10px 16px",
                backgroundColor: "var(--canvas)",
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  padding: "8px 12px",
                  borderRadius: 9,
                  backgroundColor: "var(--surface-white)",
                  border: "1px solid var(--border-default)",
                }}
              >
                <input
                  type="text"
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter") handleSendChat() }}
                  placeholder={`Ask anything about ${activeSection.heading}...`}
                  style={{
                    flex: 1,
                    background: "none",
                    border: "none",
                    outline: "none",
                    fontSize: 12,
                    color: "var(--ink)",
                  }}
                />
                <button
                  type="button"
                  onClick={handleSendChat}
                  style={{
                    width: 26,
                    height: 26,
                    borderRadius: 6,
                    backgroundColor: "var(--slate-primary)",
                    border: "none",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                  }}
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
      `}</style>
    </div>
  )
}

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
  border: "1px solid var(--border-default)",
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
