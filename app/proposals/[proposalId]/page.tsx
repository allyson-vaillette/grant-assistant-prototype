"use client"

/*
 * Proposal Editor — standalone full-screen page (no sidebar layout).
 *
 * Lives outside app/(app)/ so it only inherits the root layout (font variables).
 * Three-column layout: section nav (200px) · writing surface (flex) · AI panel (340px).
 *
 * Patterns mirror app/(app)/editor/page.tsx — inline styles, same token set,
 * same gradient-ai-sidebar for the left nav rail.
 */

import React, { useState, useRef, Suspense } from "react"
import Link from "next/link"
import { useParams, useSearchParams } from "next/navigation"
import {
  Bold,
  Italic,
  Underline,
  List,
  ListOrdered,
  ChevronLeft,
  Plus,
} from "lucide-react"

// ── Types ──────────────────────────────────────────────────────────────────

type SectionId =
  | "executive-summary"
  | "statement-of-need"
  | "project-description"
  | "evaluation-plan"
  | "budget-narrative"

type CompletionState = "active" | "empty"
type AITab = "assistant" | "suggestions" | "context"

interface Section {
  id: SectionId
  label: string
  completion: CompletionState
  funderPrompt: string
}

interface ChatMessage {
  role: "user" | "ai"
  text: string
}

// ── Data ──────────────────────────────────────────────────────────────────

const SECTIONS: Section[] = [
  {
    id: "executive-summary",
    label: "Executive Summary",
    completion: "active",
    funderPrompt:
      "Ford Foundation asks: Describe how your work advances social justice and racial equity in your community. (500 words)",
  },
  {
    id: "statement-of-need",
    label: "Statement of Need",
    completion: "empty",
    funderPrompt:
      "Ford Foundation asks: Describe the community need your project addresses. Include relevant data and center the voices of those most impacted.",
  },
  {
    id: "project-description",
    label: "Project Description",
    completion: "empty",
    funderPrompt:
      "Ford Foundation asks: Describe how your program will be implemented, including timeline, key activities, and responsible staff.",
  },
  {
    id: "evaluation-plan",
    label: "Evaluation Plan",
    completion: "empty",
    funderPrompt:
      "Ford Foundation asks: Explain how you will measure progress and demonstrate impact.",
  },
  {
    id: "budget-narrative",
    label: "Budget Narrative",
    completion: "empty",
    funderPrompt:
      "Ford Foundation asks: Provide a narrative explanation of your budget request.",
  },
]

const CONTEXT_ITEMS = [
  { name: "Ford Foundation profile", processing: false },
  { name: "Community Resilience Fund requirements", processing: false },
  { name: "Youth Development Initiative", processing: false },
  { name: "Ford Foundation Proposal 2024.pdf", processing: true },
]

const INITIAL_CHAT: ChatMessage[] = [
  {
    role: "ai",
    text: "I've loaded your Youth Development Initiative profile, Ford Foundation's priorities, and your 2024 proposal. Ready to help you write. What would you like to start with?",
  },
]

// ── Toast ──────────────────────────────────────────────────────────────────

function Toast({ msg, visible }: { msg: string; visible: boolean }) {
  return (
    <div
      style={{
        position: "fixed",
        bottom: 24,
        left: "50%",
        transform: `translateX(-50%) translateY(${visible ? 0 : 8}px)`,
        opacity: visible ? 1 : 0,
        transition: "transform 0.2s ease, opacity 0.2s ease",
        backgroundColor: "#FFFFFF",
        border: "1px solid var(--border-default)",
        borderRadius: 12,
        padding: "10px 20px",
        boxShadow: "0 4px 16px rgba(42,42,42,0.12)",
        fontSize: 13,
        color: "var(--ink)",
        zIndex: 150,
        pointerEvents: "none",
        whiteSpace: "nowrap",
      }}
    >
      {msg}
    </div>
  )
}

// ── Section nav item ───────────────────────────────────────────────────────

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
        backgroundColor: isActive ? "rgba(255,255,255,0.12)" : "transparent",
        border: "none",
        cursor: "pointer",
        textAlign: "left",
        transition: "background-color 150ms",
      }}
      onMouseEnter={(e) => {
        if (!isActive)
          (e.currentTarget as HTMLButtonElement).style.backgroundColor =
            "rgba(255,255,255,0.07)"
      }}
      onMouseLeave={(e) => {
        if (!isActive)
          (e.currentTarget as HTMLButtonElement).style.backgroundColor = "transparent"
      }}
    >
      {section.completion === "active" ? (
        /* Filled dot — active section */
        <svg
          width="10"
          height="10"
          viewBox="0 0 10 10"
          fill="none"
          style={{ flexShrink: 0 }}
        >
          <circle cx="5" cy="5" r="5" fill="var(--slate-primary)" />
        </svg>
      ) : (
        /* Empty ring — incomplete */
        <svg
          width="10"
          height="10"
          viewBox="0 0 10 10"
          fill="none"
          style={{ flexShrink: 0 }}
        >
          <circle
            cx="5"
            cy="5"
            r="4"
            stroke="rgba(255,255,255,0.3)"
            strokeWidth="1.2"
            fill="none"
          />
        </svg>
      )}
      <span
        style={{
          fontSize: 13,
          fontWeight: isActive ? 600 : 400,
          color: isActive
            ? "#FFFFFF"
            : section.completion === "empty"
            ? "rgba(255,255,255,0.4)"
            : "rgba(255,255,255,0.85)",
          lineHeight: "16px",
        }}
      >
        {section.label}
      </span>
    </button>
  )
}

// ── Page ───────────────────────────────────────────────────────────────────

function ProposalEditorContent() {
  const routeParams = useParams()
  const searchParams = useSearchParams()
  const proposalId = routeParams.proposalId as string

  const isKnown = proposalId === "equitable-futures-2026-draft"
  const documentTitle = isKnown ? "Equitable Futures Grant 2026" : (searchParams.get("name") ?? "New Proposal")
  const opportunityName = isKnown ? "Equitable Futures Grant 2026" : (searchParams.get("opportunityName") ?? "")
  const opportunityId = isKnown ? "equitable-futures" : (searchParams.get("opportunityId") ?? "")
  const funderLabel = isKnown ? "Ford Foundation" : opportunityName

  const [activeId, setActiveId] = useState<SectionId>("executive-summary")
  const [aiTab, setAiTab] = useState<AITab>("assistant")
  const [chat, setChat] = useState<ChatMessage[]>(INITIAL_CHAT)
  const [chatInput, setChatInput] = useState("")
  const [typing, setTyping] = useState(false)
  const [toast, setToast] = useState({ msg: "", visible: false })
  const scrollRef = useRef<HTMLDivElement>(null)

  const activeSection = SECTIONS.find((s) => s.id === activeId) ?? SECTIONS[0]

  function showToast(msg: string) {
    setToast({ msg, visible: true })
    setTimeout(() => setToast((v) => ({ ...v, visible: false })), 3000)
  }

  function handleSend() {
    if (!chatInput.trim()) return
    const text = chatInput.trim()
    setChatInput("")
    setChat((prev) => [...prev, { role: "user", text }])
    setTyping(true)
    setTimeout(() => {
      setTyping(false)
      setChat((prev) => [
        ...prev,
        {
          role: "ai",
          text: `I can help you strengthen the ${activeSection.label} section. What specific aspect would you like to work on?`,
        },
      ])
    }, 1400)
  }

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        height: "100vh",
        overflow: "hidden",
        backgroundColor: "var(--surface-white)",
      }}
    >
      <Toast msg={toast.msg} visible={toast.visible} />

      {/* ── Top bar ── */}
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
          position: "relative",
        }}
      >
        {/* Left: back + breadcrumb */}
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <Link
            href={opportunityId ? `/opportunity/${opportunityId}` : "/portfolio"}
            style={{
              width: 26,
              height: 26,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              borderRadius: 6,
              border: "1px solid var(--border-default)",
              textDecoration: "none",
              flexShrink: 0,
            }}
          >
            <ChevronLeft size={13} color="var(--ink-secondary)" />
          </Link>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 5,
              fontSize: 13,
              color: "var(--ink-tertiary)",
            }}
          >
            <Link href="/portfolio" style={{ color: "var(--ink-tertiary)", textDecoration: "none" }}>
              Portfolio
            </Link>
            <span>›</span>
            {isKnown && (
              <>
                <Link href="/portfolio" style={{ color: "var(--ink-tertiary)", textDecoration: "none" }}>
                  Ford Foundation
                </Link>
                <span>›</span>
              </>
            )}
            {opportunityId && (
              <>
                <Link href={`/opportunity/${opportunityId}`} style={{ color: "var(--ink-tertiary)", textDecoration: "none" }}>
                  {opportunityName || "Opportunity"}
                </Link>
                <span>›</span>
              </>
            )}
            <span style={{ color: "var(--ink)", fontWeight: 500 }}>{documentTitle}</span>
          </div>
        </div>

        {/* Center: autosave */}
        <div
          style={{
            position: "absolute",
            left: "50%",
            transform: "translateX(-50%)",
            display: "flex",
            alignItems: "center",
            gap: 6,
          }}
        >
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <circle cx="7" cy="7" r="6" stroke="var(--evergreen)" strokeWidth="1" fill="none" />
            <path
              d="M4.5 7.2l1.7 1.7 3.3-3.3"
              stroke="var(--evergreen)"
              strokeWidth="1.2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          <span style={{ fontSize: 12, color: "var(--ink-tertiary)" }}>Draft saved</span>
        </div>

        {/* Right: actions */}
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <button
            type="button"
            onClick={() => showToast("Draft saved")}
            style={topBarBtnStyle}
            onMouseEnter={(e) => {
              ;(e.currentTarget as HTMLButtonElement).style.backgroundColor = "var(--canvas)"
            }}
            onMouseLeave={(e) => {
              ;(e.currentTarget as HTMLButtonElement).style.backgroundColor = "transparent"
            }}
          >
            Save draft
          </button>
          <button
            type="button"
            disabled
            style={{ ...topBarBtnStyle, opacity: 0.4, cursor: "not-allowed" }}
          >
            Submit for review
          </button>
        </div>
      </div>

      {/* ── Formatting toolbar ── */}
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
        {([Bold, Italic, Underline] as React.FC<{ size: number; color: string }>[]).map(
          (Icon, i) => (
            <ToolbarBtn key={i}>
              <Icon size={13} color="var(--ink-secondary)" />
            </ToolbarBtn>
          )
        )}
        <div
          style={{
            width: 1,
            height: 16,
            backgroundColor: "var(--border-default)",
            margin: "0 4px",
          }}
        />
        {["H1", "H2"].map((t) => (
          <button
            key={t}
            type="button"
            style={{
              ...toolbarBtnBase,
              fontSize: 12,
              fontWeight: 600,
              color: "var(--ink-secondary)",
            }}
            onMouseEnter={(e) => {
              ;(e.currentTarget as HTMLButtonElement).style.backgroundColor = "var(--canvas)"
            }}
            onMouseLeave={(e) => {
              ;(e.currentTarget as HTMLButtonElement).style.backgroundColor = "transparent"
            }}
          >
            {t}
          </button>
        ))}
        <div
          style={{
            width: 1,
            height: 16,
            backgroundColor: "var(--border-default)",
            margin: "0 4px",
          }}
        />
        {([List, ListOrdered] as React.FC<{ size: number; color: string }>[]).map(
          (Icon, i) => (
            <ToolbarBtn key={i}>
              <Icon size={13} color="var(--ink-secondary)" />
            </ToolbarBtn>
          )
        )}
      </div>

      {/* ── Three-column body ── */}
      <div style={{ display: "flex", flex: 1, overflow: "hidden" }}>

        {/* Left: section outline (200px) */}
        <aside
          style={{
            width: 200,
            flexShrink: 0,
            background: "var(--gradient-ai-sidebar)",
            borderRight: "1px solid rgba(255,255,255,0.08)",
            display: "flex",
            flexDirection: "column",
            height: "100%",
            overflowY: "auto",
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
            <button
              type="button"
              style={{
                width: 22,
                height: 22,
                borderRadius: 5,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                border: "1px solid rgba(255,255,255,0.15)",
                backgroundColor: "transparent",
                cursor: "pointer",
              }}
            >
              <Plus size={11} color="rgba(255,255,255,0.5)" />
            </button>
          </div>

          <div
            style={{
              flex: 1,
              padding: "0 8px",
              display: "flex",
              flexDirection: "column",
              gap: 2,
            }}
          >
            {SECTIONS.map((s) => (
              <NavItem
                key={s.id}
                section={s}
                isActive={s.id === activeId}
                onClick={() => setActiveId(s.id)}
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
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                marginBottom: 6,
              }}
            >
              <span style={{ fontSize: 11, color: "rgba(255,255,255,0.45)" }}>Progress</span>
              <span style={{ fontSize: 11, fontWeight: 600, color: "rgba(255,255,255,0.7)" }}>
                0%
              </span>
            </div>
            <div
              style={{
                height: 4,
                borderRadius: 2,
                backgroundColor: "rgba(255,255,255,0.1)",
              }}
            >
              <div
                style={{
                  height: "100%",
                  borderRadius: 2,
                  backgroundColor: "var(--slate-secondary)",
                  width: "0%",
                }}
              />
            </div>
          </div>
        </aside>

        {/* Center: writing surface */}
        <div
          ref={scrollRef}
          style={{
            flex: 1,
            overflowY: "auto",
            backgroundColor: "var(--canvas)",
            height: "100%",
          }}
        >
          <div
            style={{
              maxWidth: 720,
              margin: "0 auto",
              padding: "40px 40px 120px",
              backgroundColor: "var(--surface-white)",
              minHeight: "100%",
              boxShadow: "0 0 0 1px rgba(42,42,42,0.04)",
            }}
          >
            {/* Document header */}
            <div style={{ marginBottom: 32 }}>
              <h1
                style={{
                  margin: "0 0 6px",
                  fontSize: 28,
                  fontWeight: 500,
                  color: "var(--ink)",
                  fontFamily: "var(--font-lora)",
                  letterSpacing: "-0.02em",
                }}
              >
                {documentTitle}
              </h1>
              {funderLabel && (
                <p
                  style={{
                    margin: 0,
                    fontSize: 13,
                    fontWeight: 500,
                    color: "var(--slate-secondary)",
                  }}
                >
                  {funderLabel}
                </p>
              )}
            </div>
            <div
              style={{
                height: 1,
                backgroundColor: "var(--border-default)",
                marginBottom: 36,
              }}
            />

            {/* Active section content */}
            <div>
              <h2
                style={{
                  margin: "0 0 12px",
                  fontSize: 18,
                  fontWeight: 500,
                  color: "var(--ink)",
                  fontFamily: "var(--font-lora)",
                  borderBottom: "2px solid var(--slate-primary)",
                  paddingBottom: 4,
                  display: "inline-block",
                  letterSpacing: "-0.01em",
                }}
              >
                {activeSection.label}
              </h2>

              {/* Funder prompt callout */}
              <div
                style={{
                  padding: "10px 14px",
                  marginBottom: 16,
                  borderRadius: 8,
                  backgroundColor: "var(--plum-tint)",
                  borderLeft: "3px solid var(--plum-soft)",
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
                  {activeSection.funderPrompt}
                </p>
              </div>

              {/* Writing area */}
              <textarea
                placeholder="Start writing here..."
                style={{
                  width: "100%",
                  minHeight: 220,
                  fontSize: 15,
                  color: "var(--ink)",
                  lineHeight: "26px",
                  outline: "none",
                  border: "none",
                  resize: "none" as const,
                  backgroundColor: "transparent",
                  fontFamily: "inherit",
                  padding: 0,
                  boxSizing: "border-box" as const,
                }}
              />
            </div>
          </div>
        </div>

        {/* Right: AI panel (340px) */}
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
          {/* Panel header + tabs */}
          <div
            style={{
              flexShrink: 0,
              padding: "12px 16px 0",
              borderBottom: "1px solid var(--border-default)",
              backgroundColor: "var(--canvas)",
            }}
          >
            <p
              style={{
                margin: "0 0 10px",
                fontSize: 11,
                fontWeight: 600,
                letterSpacing: "0.05em",
                textTransform: "uppercase",
                color: "var(--ink-tertiary)",
              }}
            >
              Helping with: {activeSection.label}
            </p>
            <div style={{ display: "flex" }}>
              {(["assistant", "suggestions", "context"] as AITab[]).map((tab) => {
                const label =
                  tab === "assistant"
                    ? "AI Assistant"
                    : tab === "suggestions"
                    ? "Suggestions"
                    : "Context"
                const isA = aiTab === tab
                return (
                  <button
                    key={tab}
                    type="button"
                    onClick={() => setAiTab(tab)}
                    style={{
                      position: "relative",
                      padding: "8px 4px",
                      marginRight: 14,
                      background: "none",
                      border: "none",
                      cursor: "pointer",
                      fontSize: 13,
                      fontWeight: isA ? 600 : 400,
                      color: isA ? "var(--slate-primary)" : "var(--ink-secondary)",
                      transition: "color 150ms",
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
          </div>

          {/* Panel body */}
          <div style={{ flex: 1, overflowY: "auto", padding: "14px 16px" }}>

            {/* AI Assistant tab */}
            {aiTab === "assistant" && (
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {chat.map((msg, i) => (
                  <div
                    key={i}
                    style={{ display: "flex", gap: 8, alignItems: "flex-start" }}
                  >
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
                        <span
                          style={{ fontSize: 8, fontWeight: 700, color: "#FFF" }}
                        >
                          GA
                        </span>
                      </div>
                    )}
                    <div
                      style={{
                        flex: 1,
                        padding: "10px 12px",
                        borderRadius: 10,
                        backgroundColor:
                          msg.role === "ai" ? "var(--plum-tint)" : "var(--slate-tint)",
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
                  <div
                    style={{ display: "flex", gap: 8, alignItems: "flex-start" }}
                  >
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
                      <span
                        style={{
                          fontSize: 18,
                          color: "var(--ink-tertiary)",
                          letterSpacing: 2,
                        }}
                      >
                        ···
                      </span>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Suggestions tab */}
            {aiTab === "suggestions" && (
              <p
                style={{
                  fontSize: 13,
                  color: "var(--ink-tertiary)",
                  textAlign: "center",
                  marginTop: 24,
                  lineHeight: "19px",
                }}
              >
                No suggestions yet. Start writing to get AI-powered suggestions.
              </p>
            )}

            {/* Context tab */}
            {aiTab === "context" && (
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
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
                  Loaded context
                </p>
                {CONTEXT_ITEMS.map((item) => (
                  <div
                    key={item.name}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      gap: 10,
                      padding: "10px 12px",
                      borderRadius: 8,
                      backgroundColor: "var(--surface-white)",
                      border: "1px solid var(--border-default)",
                    }}
                  >
                    <span
                      style={{
                        fontSize: 13,
                        color: "var(--ink)",
                        lineHeight: "17px",
                        flex: 1,
                        minWidth: 0,
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {item.name}
                    </span>
                    {item.processing ? (
                      <span
                        style={{
                          fontSize: 11,
                          color: "var(--ink-tertiary)",
                          flexShrink: 0,
                          fontStyle: "italic",
                        }}
                      >
                        processing…
                      </span>
                    ) : (
                      /* Checkmark for loaded items */
                      <svg
                        width="14"
                        height="14"
                        viewBox="0 0 14 14"
                        fill="none"
                        style={{ flexShrink: 0 }}
                      >
                        <circle cx="7" cy="7" r="6" fill="var(--evergreen-tint)" />
                        <path
                          d="M4 7.2l2 2 4-4"
                          stroke="var(--evergreen)"
                          strokeWidth="1.3"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Chat input — assistant tab only */}
          {aiTab === "assistant" && (
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
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleSend()
                  }}
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
                  onClick={handleSend}
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
                    <path
                      d="M2 5h6M6 2.5L8.5 5 6 7.5"
                      stroke="#fff"
                      strokeWidth="1.3"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// ── Style helpers ──────────────────────────────────────────────────────────

const topBarBtnStyle: React.CSSProperties = {
  padding: "6px 14px",
  borderRadius: 8,
  backgroundColor: "transparent",
  border: "1px solid var(--border-default)",
  fontSize: 13,
  color: "var(--ink)",
  cursor: "pointer",
  transition: "background-color 150ms",
}

const toolbarBtnBase: React.CSSProperties = {
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

function ToolbarBtn({ children }: { children: React.ReactNode }) {
  return (
    <button
      type="button"
      style={toolbarBtnBase}
      onMouseEnter={(e) => {
        ;(e.currentTarget as HTMLButtonElement).style.backgroundColor = "var(--canvas)"
      }}
      onMouseLeave={(e) => {
        ;(e.currentTarget as HTMLButtonElement).style.backgroundColor = "transparent"
      }}
    >
      {children}
    </button>
  )
}

export default function ProposalEditorPage() {
  return (
    <Suspense fallback={null}>
      <ProposalEditorContent />
    </Suspense>
  )
}
