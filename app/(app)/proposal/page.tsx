"use client"

import React, { useState, useRef } from "react"
import NextLink from "next/link"
import { Bold, Italic, Underline, Link, List, ListOrdered, AlignLeft, Plus, RotateCcw, ChevronLeft } from "lucide-react"

// ── Types ──────────────────────────────────────────────────────────────────

type SectionId =
  | "executive-summary"
  | "organization-overview"
  | "need-statement"
  | "goals-objectives"
  | "program-design"
  | "evaluation-plan"
  | "budget-narrative"
  | "sustainability"

type CompletionState = "done" | "active" | "empty"

interface Section {
  id: SectionId
  label: string
  completion: CompletionState
  funderPrompt: string
  content: string
}

interface EvidenceSuggestion {
  title: string
  source: string
}

interface AISuggestion {
  intro: string
  excerpt: string
}

// ── Data ──────────────────────────────────────────────────────────────────

const INITIAL_SECTIONS: Section[] = [
  {
    id: "executive-summary",
    label: "Executive Summary",
    completion: "done",
    funderPrompt:
      "Ford Foundation asks: Provide a 2–3 paragraph summary of your organization, the proposed project, and the intended impact.",
    content:
      "Whisker Haven Cat Rescue is a 501(c)(3) nonprofit organization dedicated to the rescue, rehabilitation, and rehoming of displaced cats in the greater Los Angeles area. Founded in 2014, we have successfully placed over 4,200 cats into permanent homes while operating low-cost spay/neuter clinics serving more than 12,000 animals annually. The Equitable Futures initiative will expand our foster care network into three underserved communities — Compton, Watts, and East LA — providing wraparound support to both the animals and the families who care for them.",
  },
  {
    id: "organization-overview",
    label: "Organization Overview",
    completion: "done",
    funderPrompt:
      "Ford Foundation asks: Describe your organization's history, mission, and qualifications to carry out this project.",
    content:
      "Whisker Haven has operated continuously since 2014 with a staff of 12 and a volunteer network exceeding 300 trained foster caregivers across Los Angeles County. Our programs are grounded in a community-first model that prioritizes relationship over transaction, meeting families where they are rather than where we expect them to be.",
  },
  {
    id: "need-statement",
    label: "Need Statement",
    completion: "active",
    funderPrompt:
      "Ford Foundation asks: Describe the community need your project addresses. Include relevant data and center the voices of those most impacted.",
    content: "",
  },
  {
    id: "goals-objectives",
    label: "Goals & Objectives",
    completion: "empty",
    funderPrompt:
      "Ford Foundation asks: List your project's measurable goals and the specific objectives that will achieve them.",
    content: "",
  },
  {
    id: "program-design",
    label: "Program Design",
    completion: "empty",
    funderPrompt:
      "Ford Foundation asks: Describe how your program will be implemented, including timeline, key activities, and responsible staff.",
    content: "",
  },
  {
    id: "evaluation-plan",
    label: "Evaluation Plan",
    completion: "empty",
    funderPrompt:
      "Ford Foundation asks: Explain how you will measure progress and demonstrate impact. Describe your data collection methods.",
    content: "",
  },
  {
    id: "budget-narrative",
    label: "Budget Narrative",
    completion: "empty",
    funderPrompt:
      "Ford Foundation asks: Provide a narrative explanation of your budget request. Describe how grant funds will be used and any matching contributions.",
    content: "",
  },
  {
    id: "sustainability",
    label: "Sustainability",
    completion: "empty",
    funderPrompt:
      "Ford Foundation asks: Describe your plan for sustaining this work beyond the grant period.",
    content: "",
  },
]

const AI_SUGGESTIONS: Partial<Record<SectionId, AISuggestion>> = {
  "need-statement": {
    intro:
      "Based on your Initiative profile and Ford Foundation's priorities, here's a starting point for your Need Statement:",
    excerpt:
      "Los Angeles County is home to an estimated 3.2 million community cats, with the highest concentrations in historically underinvested neighborhoods...",
  },
  "goals-objectives": {
    intro: "Based on your Rescue & Intake initiative goals, here are suggested objectives:",
    excerpt:
      "Increase annual intake capacity by 40% by end of 2026, reducing average length of stay from 18 to 12 days across all partner facilities...",
  },
  "program-design": {
    intro: "Here's a program design opening based on your Foster Program initiative:",
    excerpt:
      "The Equitable Futures program will operate in three phases over 18 months, beginning with community needs assessments in Compton, Watts, and East LA...",
  },
  "evaluation-plan": {
    intro: "Ford Foundation favors Theory of Change frameworks. Here's a suggested opening:",
    excerpt:
      "Our evaluation framework tracks three outcome levels: immediate (animal welfare metrics), intermediate (family stability indicators), and long-term (community-level shelter intake reduction)...",
  },
  "budget-narrative": {
    intro: "Here's a budget narrative opening aligned with Ford Foundation's reporting expectations:",
    excerpt:
      "The $75,000 grant request supports 18 months of expanded operations across three underserved communities. Personnel costs (62%) cover one full-time Foster Coordinator and part-time community outreach support...",
  },
  "sustainability": {
    intro: "Here's a sustainability narrative based on your current funding mix:",
    excerpt:
      "Whisker Haven's sustainability strategy rests on three pillars: diversified public funding, earned revenue through clinic services, and a growing individual donor base that grew 28% in 2025...",
  },
}

const RELEVANT_EVIDENCE: Partial<Record<SectionId, EvidenceSuggestion[]>> = {
  "need-statement": [
    { title: "4,200+ cats placed since 2014",        source: "Whisker Haven Impact Data" },
    { title: "12,000 animals served annually",        source: "Program Stats · spay/neuter clinics" },
    { title: "LA County has 3.2M community cats",     source: "LA Animal Services Report 2025" },
  ],
  "executive-summary": [
    { title: "4,200+ cats placed since 2014",         source: "Whisker Haven Impact Data" },
    { title: "94% adoption success rate over 5 years",source: "Whisker Haven Impact Data" },
  ],
  "organization-overview": [
    { title: "300+ trained foster caregivers in LA County", source: "Foster Network Report" },
    { title: "14 municipal shelter partnerships active",     source: "Partnership Records" },
  ],
  "goals-objectives": [
    { title: "Average LOS reduced 23% since 2022",    source: "Internal Program Data" },
    { title: "4,200+ cats placed since 2014",         source: "Whisker Haven Impact Data" },
  ],
  "program-design": [
    { title: "300+ trained foster caregivers in LA County", source: "Foster Network Report" },
    { title: "Underserved communities: 67% of intake volume", source: "Internal Intake Data" },
  ],
  "evaluation-plan": [
    { title: "94% adoption success rate over 5 years",     source: "Whisker Haven Impact Data" },
    { title: "Average LOS reduced 23% since 2022",         source: "Internal Program Data" },
  ],
  "budget-narrative": [
    { title: "12,000 animals served via spay/neuter annually", source: "Program Stats" },
  ],
  "sustainability": [
    { title: "14 municipal shelter partnerships active", source: "Partnership Records" },
  ],
}

// ── Left nav item ──────────────────────────────────────────────────────────

function NavItem({
  section,
  isActive,
  onClick,
}: {
  section: Section
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
        backgroundColor: isActive ? "var(--olive-pale)" : "transparent",
        border: "none",
        cursor: "pointer",
        textAlign: "left",
        transition: "background-color 150ms",
      }}
    >
      {/* Completion indicator */}
      {section.completion === "done" ? (
        <svg width="10" height="10" viewBox="0 0 10 10" fill="none" style={{ flexShrink: 0 }}>
          <circle cx="5" cy="5" r="5" fill="var(--olive-dark)" />
          <path d="M2.5 5.2l1.6 1.6L7.5 3" stroke="#fff" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      ) : section.completion === "active" ? (
        <svg width="10" height="10" viewBox="0 0 10 10" fill="none" style={{ flexShrink: 0 }}>
          <circle cx="5" cy="5" r="4.5" fill="var(--olive-dark)" stroke="var(--olive-dark)" strokeWidth="1" />
        </svg>
      ) : (
        <svg width="10" height="10" viewBox="0 0 10 10" fill="none" style={{ flexShrink: 0 }}>
          <circle cx="5" cy="5" r="4" stroke="var(--ink-tertiary)" strokeWidth="1.2" fill="none" />
        </svg>
      )}

      <span
        style={{
          fontSize: 13,
          fontWeight: isActive ? 600 : 400,
          color: isActive ? "var(--olive-dark)" : section.completion === "empty" ? "var(--ink-tertiary)" : "var(--ink)",
          lineHeight: "16px",
        }}
      >
        {section.label}
      </span>
    </button>
  )
}

// ── Document section ───────────────────────────────────────────────────────

function DocumentSection({
  section,
  isActive,
  onClick,
}: {
  section: Section
  isActive: boolean
  onClick: () => void
}) {
  return (
    <div
      id={`section-${section.id}`}
      onClick={onClick}
      style={{ marginBottom: 40, cursor: "text" }}
    >
      <h2
        style={{
          margin: "0 0 12px 0",
          fontSize: 20,
          fontWeight: 700,
          letterSpacing: "-0.02em",
          color: "var(--ink)",
          borderBottom: isActive ? "2px solid var(--olive-dark)" : "2px solid transparent",
          paddingBottom: 4,
          display: "inline-block",
          transition: "border-color 150ms",
        }}
      >
        {section.label}
      </h2>

      {/* Funder requirement callout */}
      <div
        style={{
          padding: "12px 16px",
          marginBottom: 14,
          borderRadius: 8,
          backgroundColor: "var(--olive-pale)",
          borderLeft: "3px solid var(--olive-mid)",
        }}
      >
        <p style={{ margin: 0, fontSize: 13, color: "var(--ink-secondary)", lineHeight: "19px" }}>
          {section.funderPrompt}
        </p>
      </div>

      {/* Content or empty state */}
      {section.content ? (
        <p style={{ margin: 0, fontSize: 15, color: "var(--ink)", lineHeight: "26px" }}>
          {section.content}
        </p>
      ) : (
        <p
          style={{
            margin: 0,
            fontSize: 15,
            color: "var(--ink-tertiary)",
            lineHeight: "26px",
            fontStyle: "italic",
          }}
        >
          Start writing, or ask the AI assistant for help with this section...
        </p>
      )}
    </div>
  )
}

// ── AI panel ───────────────────────────────────────────────────────────────

function AIPanel({ activeSection }: { activeSection: Section }) {
  const [aiTab, setAiTab] = useState<"assistant" | "funder">("assistant")
  const suggestion = AI_SUGGESTIONS[activeSection.id]
  const evidence = RELEVANT_EVIDENCE[activeSection.id] ?? []

  return (
    <div
      style={{
        width: 300,
        flexShrink: 0,
        borderLeft: "1px solid var(--border-color)",
        backgroundColor: "var(--surface)",
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
      }}
    >
      {/* Tabs */}
      <div
        style={{
          flexShrink: 0,
          display: "flex",
          borderBottom: "1px solid var(--border-color)",
          padding: "0 16px",
        }}
      >
        {(["assistant", "funder"] as const).map((tab) => {
          const label = tab === "assistant" ? "AI Assistant" : "Funder Context"
          const isActive = aiTab === tab
          return (
            <button
              key={tab}
              type="button"
              onClick={() => setAiTab(tab)}
              style={{
                position: "relative",
                padding: "12px 4px",
                marginRight: 16,
                background: "none",
                border: "none",
                cursor: "pointer",
                fontSize: 13,
                fontWeight: isActive ? 600 : 400,
                color: isActive ? "var(--olive-dark)" : "var(--ink-secondary)",
                transition: "color 150ms",
              }}
            >
              {label}
              {isActive && (
                <div
                  style={{
                    position: "absolute",
                    bottom: 0,
                    left: 0,
                    right: 0,
                    height: 2,
                    borderRadius: 1,
                    backgroundColor: "var(--olive-dark)",
                  }}
                />
              )}
            </button>
          )
        })}
      </div>

      {/* Body */}
      <div style={{ flex: 1, overflowY: "auto", padding: "16px" }}>
        {aiTab === "assistant" ? (
          <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
            {/* Helping with label */}
            <p
              style={{
                margin: "0 0 14px 0",
                fontSize: 12,
                fontWeight: 500,
                color: "var(--ink-tertiary)",
              }}
            >
              Helping with:{" "}
              <span style={{ color: "var(--olive-dark)", fontWeight: 600 }}>
                {activeSection.label}
              </span>
            </p>

            {/* Suggested content */}
            {suggestion && (
              <div
                style={{
                  padding: "14px",
                  borderRadius: "var(--radius-card)",
                  border: "1px solid var(--border-color)",
                  marginBottom: 16,
                }}
              >
                <p
                  style={{
                    margin: "0 0 10px 0",
                    fontSize: 10,
                    fontWeight: 600,
                    letterSpacing: "0.07em",
                    textTransform: "uppercase",
                    color: "var(--olive-mid)",
                  }}
                >
                  Suggested Content
                </p>
                <p style={{ margin: "0 0 10px 0", fontSize: 12, color: "var(--ink-secondary)", lineHeight: "17px" }}>
                  {suggestion.intro}
                </p>
                <div
                  style={{
                    padding: "10px 12px",
                    borderRadius: 8,
                    backgroundColor: "var(--canvas)",
                    border: "1px solid var(--border-color)",
                    marginBottom: 10,
                  }}
                >
                  <p style={{ margin: 0, fontSize: 12, color: "var(--ink)", lineHeight: "18px", fontStyle: "italic" }}>
                    {suggestion.excerpt}
                  </p>
                </div>
                <div style={{ display: "flex", gap: 8 }}>
                  <button
                    type="button"
                    style={{
                      padding: "7px 14px",
                      borderRadius: "var(--radius-button)",
                      backgroundColor: "var(--olive-dark)",
                      border: "none",
                      fontSize: 12,
                      fontWeight: 600,
                      color: "#FFFFFF",
                      cursor: "pointer",
                    }}
                  >
                    Insert
                  </button>
                  <button
                    type="button"
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 5,
                      padding: "7px 12px",
                      borderRadius: "var(--radius-button)",
                      backgroundColor: "transparent",
                      border: "1px solid var(--border-color)",
                      fontSize: 12,
                      color: "var(--ink-secondary)",
                      cursor: "pointer",
                    }}
                  >
                    <RotateCcw size={11} />
                    Regenerate
                  </button>
                </div>
              </div>
            )}

            {/* Relevant evidence */}
            {evidence.length > 0 && (
              <>
                <div style={{ height: 1, backgroundColor: "var(--border-color)", margin: "0 0 12px 0" }} />
                <p
                  style={{
                    margin: "0 0 10px 0",
                    fontSize: 10,
                    fontWeight: 600,
                    letterSpacing: "0.07em",
                    textTransform: "uppercase",
                    color: "var(--ink-tertiary)",
                  }}
                >
                  Relevant Evidence
                </p>
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {evidence.map((ev) => (
                    <div
                      key={ev.title}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        gap: 8,
                      }}
                    >
                      <div style={{ flex: 1 }}>
                        <p style={{ margin: "0 0 2px 0", fontSize: 12, fontWeight: 500, color: "var(--ink)", lineHeight: "16px" }}>
                          {ev.title}
                        </p>
                        <p style={{ margin: 0, fontSize: 11, color: "var(--ink-tertiary)", lineHeight: "14px" }}>
                          {ev.source}
                        </p>
                      </div>
                      <button
                        type="button"
                        style={{
                          flexShrink: 0,
                          background: "none",
                          border: "none",
                          cursor: "pointer",
                          fontSize: 12,
                          fontWeight: 600,
                          color: "var(--olive-mid)",
                          padding: 0,
                        }}
                      >
                        Insert
                      </button>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        ) : (
          /* Funder Context tab */
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <div>
              <p style={sectionLabelStyle}>Funder</p>
              <p style={{ margin: 0, fontSize: 13, fontWeight: 600, color: "var(--ink)" }}>Ford Foundation</p>
              <p style={{ margin: "2px 0 0 0", fontSize: 12, color: "var(--ink-secondary)" }}>
                Equitable Futures Grant 2026
              </p>
            </div>
            <div style={{ height: 1, backgroundColor: "var(--border-color)" }} />
            <div>
              <p style={sectionLabelStyle}>Priorities</p>
              {["Economic justice", "Civic engagement", "Racial equity"].map((p) => (
                <div key={p} style={{ display: "flex", gap: 8, alignItems: "flex-start", marginBottom: 6 }}>
                  <div style={{ width: 5, height: 5, borderRadius: "50%", backgroundColor: "var(--olive-mid)", flexShrink: 0, marginTop: 6 }} />
                  <span style={{ fontSize: 12, color: "var(--ink-secondary)", lineHeight: "17px" }}>{p}</span>
                </div>
              ))}
            </div>
            <div style={{ height: 1, backgroundColor: "var(--border-color)" }} />
            <div>
              <p style={sectionLabelStyle}>Grant details</p>
              <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
                {[["Amount", "$75,000"], ["Deadline", "Jun 15, 2026"], ["Type", "Project support"]].map(([k, v]) => (
                  <div key={k} style={{ display: "flex", justifyContent: "space-between" }}>
                    <span style={{ fontSize: 12, color: "var(--ink-tertiary)" }}>{k}</span>
                    <span style={{ fontSize: 12, fontWeight: 500, color: "var(--ink)" }}>{v}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Chat input */}
      <div
        style={{
          flexShrink: 0,
          borderTop: "1px solid var(--border-color)",
          padding: "10px 16px",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            padding: "9px 12px",
            borderRadius: "var(--radius-input)",
            backgroundColor: "var(--canvas)",
            border: "1px solid var(--border-color)",
          }}
        >
          <input
            type="text"
            placeholder="Ask anything about this section..."
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
            style={{
              width: 26,
              height: 26,
              borderRadius: 6,
              backgroundColor: "var(--olive-dark)",
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
    </div>
  )
}

// ── Shared ─────────────────────────────────────────────────────────────────

const sectionLabelStyle: React.CSSProperties = {
  fontSize: 10,
  fontWeight: 600,
  letterSpacing: "0.07em",
  textTransform: "uppercase",
  color: "var(--ink-tertiary)",
  margin: "0 0 8px 0",
}

// ── Page ───────────────────────────────────────────────────────────────────

export default function ProposalEditorPage() {
  const sections = INITIAL_SECTIONS
  const [activeId, setActiveId] = useState<SectionId>("need-statement")
  const scrollRef = useRef<HTMLDivElement>(null)

  const activeSection = sections.find((s) => s.id === activeId) ?? sections[0]

  function handleNavClick(id: SectionId) {
    setActiveId(id)
    const el = document.getElementById(`section-${id}`)
    el?.scrollIntoView({ behavior: "smooth", block: "start" })
  }

  return (
    <div className="flex flex-col flex-1 overflow-hidden" style={{ backgroundColor: "var(--canvas)" }}>
      {/* Editor top bar */}
      <div
        style={{
          flexShrink: 0,
          height: 44,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "0 20px",
          backgroundColor: "var(--surface)",
          borderBottom: "1px solid var(--border-color)",
        }}
      >
        {/* Left: back + title + status */}
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <NextLink
            href="/opportunity"
            style={{
              width: 26,
              height: 26,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              borderRadius: "var(--radius-icon-tile)",
              border: "1px solid var(--border-color)",
              backgroundColor: "var(--surface)",
              textDecoration: "none",
              flexShrink: 0,
            }}
          >
            <ChevronLeft size={13} color="var(--ink-secondary)" />
          </NextLink>
          <span style={{ fontSize: 14, fontWeight: 600, color: "var(--ink)" }}>
            Equitable Futures — Draft 1
          </span>
          <span
            style={{
              borderRadius: "var(--radius-pill)",
              padding: "2px 9px",
              backgroundColor: "var(--slate-light)",
              fontSize: 11,
              fontWeight: 500,
              color: "var(--slate)",
            }}
          >
            Draft
          </span>
          <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
              <circle cx="6" cy="6" r="5" stroke="var(--ink-tertiary)" strokeWidth="1" fill="none" />
              <path d="M4 6.5l1.5 1.5L8.5 4" stroke="var(--ink-tertiary)" strokeWidth="1.1" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <span style={{ fontSize: 12, color: "var(--ink-tertiary)" }}>Autosaved</span>
          </div>
        </div>

        {/* Right: actions */}
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <button type="button" style={outlineBtn}>Share</button>
          <button type="button" style={outlineBtn}>Submit for review</button>
          <button
            type="button"
            style={{
              padding: "7px 16px",
              borderRadius: "var(--radius-button)",
              backgroundColor: "var(--amber)",
              border: "none",
              fontSize: 13,
              fontWeight: 600,
              color: "#FFFFFF",
              cursor: "pointer",
            }}
          >
            Save draft
          </button>
        </div>
      </div>

      {/* Rich text toolbar */}
      <div
        style={{
          flexShrink: 0,
          display: "flex",
          alignItems: "center",
          gap: 2,
          padding: "0 20px",
          height: 40,
          backgroundColor: "var(--surface)",
          borderBottom: "1px solid var(--border-color)",
        }}
      >
        {[Bold, Italic, Underline].map((Icon, i) => (
          <button key={i} type="button" style={toolbarBtn}>
            <Icon size={13} color="var(--ink-secondary)" />
          </button>
        ))}
        <div style={{ width: 1, height: 16, backgroundColor: "var(--border-color)", margin: "0 4px" }} />
        {["H1", "H2"].map((t) => (
          <button key={t} type="button" style={{ ...toolbarBtn, fontSize: 12, fontWeight: 600, color: "var(--ink-secondary)" }}>
            {t}
          </button>
        ))}
        <div style={{ width: 1, height: 16, backgroundColor: "var(--border-color)", margin: "0 4px" }} />
        {[List, ListOrdered].map((Icon, i) => (
          <button key={i} type="button" style={toolbarBtn}>
            <Icon size={13} color="var(--ink-secondary)" />
          </button>
        ))}
        <div style={{ width: 1, height: 16, backgroundColor: "var(--border-color)", margin: "0 4px" }} />
        {[Link, AlignLeft].map((Icon, i) => (
          <button key={i} type="button" style={toolbarBtn}>
            <Icon size={13} color="var(--ink-secondary)" />
          </button>
        ))}
      </div>

      {/* Three-column body */}
      <div className="flex flex-1 overflow-hidden">

        {/* Left: section navigator */}
        <aside
          style={{
            width: 220,
            flexShrink: 0,
            backgroundColor: "var(--surface)",
            borderRight: "1px solid var(--border-color)",
            overflowY: "auto",
            display: "flex",
            flexDirection: "column",
          }}
        >
          {/* SECTIONS header */}
          <div
            style={{
              flexShrink: 0,
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              padding: "14px 12px 8px 14px",
            }}
          >
            <span style={{ fontSize: 10, fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--ink-tertiary)" }}>
              Sections
            </span>
            <button
              type="button"
              style={{
                width: 22,
                height: 22,
                borderRadius: 5,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                border: "1px solid var(--border-color)",
                backgroundColor: "transparent",
                cursor: "pointer",
              }}
            >
              <Plus size={11} color="var(--ink-secondary)" />
            </button>
          </div>

          {/* Nav items */}
          <div style={{ flex: 1, padding: "0 8px", display: "flex", flexDirection: "column", gap: 2 }}>
            {sections.map((s) => (
              <NavItem
                key={s.id}
                section={s}
                isActive={s.id === activeId}
                onClick={() => handleNavClick(s.id)}
              />
            ))}
            <button
              type="button"
              style={{
                background: "none",
                border: "none",
                padding: "8px 12px",
                cursor: "pointer",
                fontSize: 13,
                color: "var(--olive-mid)",
                fontWeight: 500,
                textAlign: "left",
              }}
            >
              + Add section
            </button>
          </div>
        </aside>

        {/* Center: continuous document */}
        <div
          ref={scrollRef}
          style={{
            flex: 1,
            overflowY: "auto",
            backgroundColor: "var(--canvas)",
          }}
        >
          <div style={{ maxWidth: 720, margin: "0 auto", padding: "40px 40px 80px 40px" }}>
            {/* Document header */}
            <div style={{ marginBottom: 32 }}>
              <h1
                style={{
                  margin: "0 0 6px 0",
                  fontSize: 26,
                  fontWeight: 700,
                  letterSpacing: "-0.03em",
                  color: "var(--ink)",
                }}
              >
                Equitable Futures Grant 2026
              </h1>
              <p style={{ margin: 0, fontSize: 14, fontWeight: 500, color: "var(--olive-mid)" }}>
                Ford Foundation
              </p>
            </div>

            <div style={{ height: 1, backgroundColor: "var(--border-color)", marginBottom: 36 }} />

            {/* All sections */}
            {sections.map((section) => (
              <DocumentSection
                key={section.id}
                section={section}
                isActive={section.id === activeId}
                onClick={() => setActiveId(section.id)}
              />
            ))}

            {/* Word count */}
            <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 16 }}>
              <span style={{ fontSize: 12, color: "var(--ink-tertiary)" }}>0 words</span>
            </div>
          </div>
        </div>

        {/* Right: AI panel */}
        <AIPanel activeSection={activeSection} />
      </div>
    </div>
  )
}

// ── Button style helpers ───────────────────────────────────────────────────

const outlineBtn: React.CSSProperties = {
  padding: "6px 14px",
  borderRadius: "var(--radius-button)",
  backgroundColor: "transparent",
  border: "1px solid var(--border-color)",
  fontSize: 13,
  color: "var(--ink)",
  cursor: "pointer",
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
}
