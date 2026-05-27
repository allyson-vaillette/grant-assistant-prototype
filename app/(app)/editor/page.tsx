"use client"

import React, { useState, useRef } from "react"
import NextLink from "next/link"
import { Bold, Italic, Underline, Link, List, ListOrdered, BarChart2, Code, Plus, RotateCcw, ChevronLeft, X } from "lucide-react"

type SectionId = "executive-summary" | "organization-overview" | "need-statement" | "goals-objectives" | "program-design" | "evaluation-plan" | "budget-narrative" | "sustainability"
type CompletionState = "done" | "active" | "empty"
type AITab = "assistant" | "suggestions" | "context"
type Scope = "section" | "document"
type ProposalStatus = "draft" | "in-review"

interface Section { id: SectionId; label: string; completion: CompletionState; funderPrompt: string; content: string }
interface ChatMessage { role: "user" | "ai"; text: string }
interface Teammate { id: string; name: string; initials: string }

const SECTIONS: Section[] = [
  { id: "executive-summary",    label: "Executive Summary",    completion: "done",   funderPrompt: "Ford Foundation asks: Provide a 2–3 paragraph summary of your organization, the proposed project, and the intended impact.", content: "Whisker Haven Cat Rescue is a 501(c)(3) nonprofit organization dedicated to the rescue, rehabilitation, and rehoming of displaced cats in the greater Los Angeles area. Founded in 2014, we have successfully placed over 4,200 cats into permanent homes while operating low-cost spay/neuter clinics serving more than 12,000 animals annually. The Equitable Futures initiative will expand our foster care network into three underserved communities — Compton, Watts, and East LA — providing wraparound support to both the animals and the families who care for them." },
  { id: "organization-overview", label: "Organization Overview", completion: "done",   funderPrompt: "Ford Foundation asks: Describe your organization's history, mission, and qualifications to carry out this project.", content: "Whisker Haven has operated continuously since 2014 with a staff of 12 and a volunteer network exceeding 300 trained foster caregivers across Los Angeles County. Our programs are grounded in a community-first model that prioritizes relationship over transaction, meeting families where they are rather than where we expect them to be." },
  { id: "need-statement",       label: "Need Statement",       completion: "active", funderPrompt: "Ford Foundation asks: Describe the community need your project addresses. Include relevant data and center the voices of those most impacted.", content: "" },
  { id: "goals-objectives",     label: "Goals & Objectives",   completion: "empty",  funderPrompt: "Ford Foundation asks: List your project's measurable goals and the specific objectives that will achieve them.", content: "" },
  { id: "program-design",       label: "Program Design",       completion: "empty",  funderPrompt: "Ford Foundation asks: Describe how your program will be implemented, including timeline, key activities, and responsible staff.", content: "" },
  { id: "evaluation-plan",      label: "Evaluation Plan",      completion: "empty",  funderPrompt: "Ford Foundation asks: Explain how you will measure progress and demonstrate impact.", content: "" },
  { id: "budget-narrative",     label: "Budget Narrative",     completion: "empty",  funderPrompt: "Ford Foundation asks: Provide a narrative explanation of your budget request.", content: "" },
  { id: "sustainability",       label: "Sustainability",        completion: "empty",  funderPrompt: "Ford Foundation asks: Describe your plan for sustaining this work beyond the grant period.", content: "" },
]

const TEAMMATES: Teammate[] = [
  { id: "taylor", name: "Taylor S.", initials: "TS" },
  { id: "marcus", name: "Marcus R.", initials: "MR" },
  { id: "jamie",  name: "Jamie K.",  initials: "JK" },
  { id: "alex",   name: "Alex M.",   initials: "AM" },
]

const UPLOADED_DOCS = [
  { name: "RFP_2026.pdf",           size: "248 KB" },
  { name: "2024 Annual Report.pdf", size: "1.2 MB" },
  { name: "Program Budget.xlsx",    size: "84 KB"  },
]

const CONTEXT_ITEMS_BASE = [
  { label: "Funder",        value: "Ford Foundation — 2026 priorities" },
  { label: "Initiative",    value: "Rescue & Intake — goals, outcomes" },
  { label: "Evidence",      value: "4 items loaded" },
  { label: "Writing style", value: "Conversational, first-person plural" },
]

// Sections that have AI-generated content, mapped to their source documents/context
const SECTION_SOURCES: Partial<Record<SectionId, string[]>> = {
  "executive-summary":     ["RFP_2026.pdf", "2024 Annual Report.pdf"],
  "organization-overview": ["2024 Annual Report.pdf", "Rescue & Intake initiative"],
}

const WORD_COUNTS: Partial<Record<SectionId, string>> = {
  "executive-summary":     "312 words · 1,847 characters",
  "organization-overview": "198 words · 1,124 characters",
  "need-statement":        "0 words · 0 characters",
}

const AI_SUGGESTION: Partial<Record<SectionId, { intro: string; text: string }>> = {
  "need-statement": { intro: "Based on your Initiative profile and Ford Foundation's priorities, here's a starting point for your Need Statement:", text: "Los Angeles County is home to an estimated 3.2 million community cats, with the highest concentrations in historically underinvested neighborhoods in South and East LA. For families in Compton, Watts, and East LA, cats are often the most accessible form of companionship and emotional support — yet resources for responsible ownership and rescue remain scarce, leaving animals and caregivers without support..." },
  "goals-objectives": { intro: "Based on your Rescue & Intake initiative goals, here are suggested objectives:", text: "Increase annual intake capacity by 40% by end of 2026, reducing average length of stay from 18 to 12 days across all partner facilities..." },
}

const EVIDENCE: Partial<Record<SectionId, Array<{ title: string; source: string }>>> = {
  "need-statement": [
    { title: "4,200+ cats placed since 2014",          source: "Whisker Haven Impact Data" },
    { title: "12,000 animals served via spay/neuter annually", source: "Program Stats" },
  ],
  "executive-summary": [
    { title: "4,200+ cats placed since 2014",          source: "Whisker Haven Impact Data" },
    { title: "94% adoption success rate",              source: "Whisker Haven Impact Data" },
  ],
}

const GLOBAL_WORDS = ["all", "every", "replace", "throughout", "entire", "whole", "document"]

function globalDetect(text: string) {
  return GLOBAL_WORDS.some((w) => text.toLowerCase().includes(w))
}

function completedCount() { return SECTIONS.filter((s) => s.completion === "done").length }
const PROGRESS = Math.round((completedCount() / SECTIONS.length) * 100)

// ── Material Symbol helper ─────────────────────────────────────────────────

function MIcon({ name, size = 20, color, style }: { name: string; size?: number; color?: string; style?: React.CSSProperties }) {
  return (
    <span
      className="material-symbols-outlined"
      style={{ fontSize: size, lineHeight: 1, color: color ?? "inherit", userSelect: "none", ...style }}
    >
      {name}
    </span>
  )
}

// ── Share Modal (single-select) ────────────────────────────────────────────

function ShareModal({ onClose, onShare }: { onClose: () => void; onShare: (teammate: string) => void }) {
  const [query, setQuery] = useState("")
  const [selected, setSelected] = useState<Teammate | null>(null)
  const [note, setNote] = useState("")
  const [listOpen, setListOpen] = useState(false)

  const filtered = TEAMMATES.filter((t) => t.name.toLowerCase().includes(query.toLowerCase()))

  function handleSelect(t: Teammate) {
    setSelected(t)
    setQuery(t.name)
    setListOpen(false)
  }

  return (
    <div
      style={{ position: "fixed", inset: 0, backgroundColor: "rgba(28,24,64,0.35)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 200 }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      <div style={{ width: 400, backgroundColor: "#FFFFFF", borderRadius: 14, boxShadow: "0 16px 48px rgba(28,24,64,0.18)", display: "flex", flexDirection: "column" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "20px 24px 0" }}>
          <div>
            <h2 style={{ margin: "0 0 2px", fontSize: 17, fontWeight: 600, color: "var(--ink)", fontFamily: "var(--font-lora)" }}>Share proposal</h2>
            <p style={{ margin: 0, fontSize: 12, color: "var(--ink-tertiary)" }}>Equitable Futures — Draft 1</p>
          </div>
          <button type="button" onClick={onClose} style={{ width: 28, height: 28, display: "flex", alignItems: "center", justifyContent: "center", borderRadius: 6, border: "1px solid var(--border-default)", backgroundColor: "transparent", cursor: "pointer" }}>
            <X size={14} color="var(--ink-secondary)" />
          </button>
        </div>
        <div style={{ padding: "20px 24px 0" }}>
          <div style={{ marginBottom: 16, position: "relative" }}>
            <label style={{ display: "block", fontSize: 13, fontWeight: 500, color: "var(--ink)", marginBottom: 6 }}>Teammate</label>
            <input
              type="text"
              value={query}
              onChange={(e) => { setQuery(e.target.value); setSelected(null); setListOpen(true) }}
              onFocus={() => setListOpen(true)}
              onBlur={() => setTimeout(() => setListOpen(false), 150)}
              placeholder="Search by name..."
              style={{ width: "100%", padding: "9px 12px", borderRadius: 9, border: "1px solid var(--border-default)", fontSize: 13, color: "var(--ink)", outline: "none", boxSizing: "border-box" }}
            />
            {listOpen && filtered.length > 0 && (
              <div style={{ position: "absolute", top: "calc(100% + 4px)", left: 0, right: 0, backgroundColor: "#FFFFFF", border: "1px solid var(--border-default)", borderRadius: 10, boxShadow: "0 8px 24px rgba(28,24,64,0.12)", zIndex: 300, overflow: "hidden" }}>
                {filtered.map((t) => (
                  <button key={t.id} type="button" onMouseDown={() => handleSelect(t)}
                    style={{ display: "flex", alignItems: "center", gap: 10, width: "100%", padding: "10px 14px", background: "none", border: "none", cursor: "pointer", textAlign: "left" }}
                    onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.backgroundColor = "var(--canvas)" }}
                    onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.backgroundColor = "transparent" }}
                  >
                    <div style={{ width: 22, height: 22, borderRadius: "50%", background: "var(--gradient-avatar)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                      <span style={{ fontSize: 9, fontWeight: 700, color: "#FFFFFF" }}>{t.initials}</span>
                    </div>
                    <span style={{ fontSize: 13, color: "var(--ink)" }}>{t.name}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
          <div style={{ marginBottom: 24 }}>
            <label style={{ display: "block", fontSize: 13, fontWeight: 500, color: "var(--ink)", marginBottom: 6 }}>
              Note <span style={{ fontWeight: 400, color: "var(--ink-tertiary)" }}>(optional)</span>
            </label>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Add a message..."
              rows={3}
              style={{ width: "100%", padding: "9px 12px", borderRadius: 9, border: "1px solid var(--border-default)", fontSize: 13, color: "var(--ink)", outline: "none", resize: "none", lineHeight: "19px", boxSizing: "border-box", fontFamily: "inherit" }}
            />
          </div>
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "16px 24px 20px", borderTop: "1px solid var(--border-default)" }}>
          <button type="button" onClick={onClose} style={{ padding: "8px 18px", borderRadius: 8, border: "1px solid var(--border-default)", backgroundColor: "transparent", fontSize: 13, color: "var(--ink)", cursor: "pointer" }}>Cancel</button>
          <button
            type="button"
            disabled={!selected}
            onClick={() => { if (selected) { onShare(selected.name); onClose() } }}
            style={{ padding: "8px 18px", borderRadius: 8, border: "none", backgroundColor: selected ? "var(--slate-primary)" : "var(--slate-tint)", fontSize: 13, fontWeight: 500, color: selected ? "#FFFFFF" : "var(--ink-tertiary)", cursor: selected ? "pointer" : "not-allowed", transition: "background-color 150ms" }}
          >
            Share
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Submit for Review Modal (multi-select reviewers) ───────────────────────

function SubmitForReviewModal({ onClose, onConfirm }: { onClose: () => void; onConfirm: (reviewerNames: string[]) => void }) {
  const [query, setQuery] = useState("")
  const [selected, setSelected] = useState<Teammate[]>([])
  const [note, setNote] = useState("")
  const [listOpen, setListOpen] = useState(false)

  const filtered = TEAMMATES.filter(
    (t) => t.name.toLowerCase().includes(query.toLowerCase()) && !selected.find((s) => s.id === t.id)
  )

  function handleSelect(t: Teammate) {
    setSelected((prev) => [...prev, t])
    setQuery("")
    setListOpen(false)
  }

  function removeReviewer(id: string) {
    setSelected((prev) => prev.filter((t) => t.id !== id))
  }

  return (
    <div
      style={{ position: "fixed", inset: 0, backgroundColor: "rgba(28,24,64,0.35)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 200 }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      <div style={{ width: 440, backgroundColor: "#FFFFFF", borderRadius: 14, boxShadow: "0 16px 48px rgba(28,24,64,0.18)", display: "flex", flexDirection: "column" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "20px 24px 0" }}>
          <div>
            <h2 style={{ margin: "0 0 2px", fontSize: 17, fontWeight: 600, color: "var(--ink)", fontFamily: "var(--font-lora)" }}>Submit for review</h2>
            <p style={{ margin: 0, fontSize: 12, color: "var(--ink-tertiary)" }}>Equitable Futures — Draft 1</p>
          </div>
          <button type="button" onClick={onClose} style={{ width: 28, height: 28, display: "flex", alignItems: "center", justifyContent: "center", borderRadius: 6, border: "1px solid var(--border-default)", backgroundColor: "transparent", cursor: "pointer" }}>
            <X size={14} color="var(--ink-secondary)" />
          </button>
        </div>

        <div style={{ padding: "20px 24px 0" }}>
          {/* Reviewer selector */}
          <div style={{ marginBottom: 16, position: "relative" }}>
            <label style={{ display: "block", fontSize: 13, fontWeight: 500, color: "var(--ink)", marginBottom: 6 }}>Reviewers</label>
            {selected.length > 0 && (
              <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 8 }}>
                {selected.map((t) => (
                  <div key={t.id} style={{ display: "flex", alignItems: "center", gap: 5, padding: "3px 8px 3px 6px", borderRadius: 20, backgroundColor: "var(--slate-tint)", border: "1px solid var(--border-default)" }}>
                    <div style={{ width: 16, height: 16, borderRadius: "50%", background: "var(--gradient-avatar)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                      <span style={{ fontSize: 7, fontWeight: 700, color: "#FFFFFF" }}>{t.initials}</span>
                    </div>
                    <span style={{ fontSize: 12, color: "var(--ink)", fontWeight: 500 }}>{t.name}</span>
                    <button type="button" onClick={() => removeReviewer(t.id)} style={{ background: "none", border: "none", cursor: "pointer", padding: 0, display: "flex", alignItems: "center", marginLeft: 1 }}>
                      <X size={10} color="var(--ink-tertiary)" />
                    </button>
                  </div>
                ))}
              </div>
            )}
            <input
              type="text"
              value={query}
              onChange={(e) => { setQuery(e.target.value); setListOpen(true) }}
              onFocus={() => setListOpen(true)}
              onBlur={() => setTimeout(() => setListOpen(false), 150)}
              placeholder="Search teammates..."
              style={{ width: "100%", padding: "9px 12px", borderRadius: 9, border: "1px solid var(--border-default)", fontSize: 13, color: "var(--ink)", outline: "none", boxSizing: "border-box" }}
            />
            {listOpen && filtered.length > 0 && (
              <div style={{ position: "absolute", top: "calc(100% + 4px)", left: 0, right: 0, backgroundColor: "#FFFFFF", border: "1px solid var(--border-default)", borderRadius: 10, boxShadow: "0 8px 24px rgba(28,24,64,0.12)", zIndex: 300, overflow: "hidden" }}>
                {filtered.map((t) => (
                  <button key={t.id} type="button" onMouseDown={() => handleSelect(t)}
                    style={{ display: "flex", alignItems: "center", gap: 10, width: "100%", padding: "10px 14px", background: "none", border: "none", cursor: "pointer", textAlign: "left" }}
                    onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.backgroundColor = "var(--canvas)" }}
                    onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.backgroundColor = "transparent" }}
                  >
                    <div style={{ width: 22, height: 22, borderRadius: "50%", background: "var(--gradient-avatar)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                      <span style={{ fontSize: 9, fontWeight: 700, color: "#FFFFFF" }}>{t.initials}</span>
                    </div>
                    <span style={{ fontSize: 13, color: "var(--ink)" }}>{t.name}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Note field */}
          <div style={{ marginBottom: 24 }}>
            <label style={{ display: "block", fontSize: 13, fontWeight: 500, color: "var(--ink)", marginBottom: 6 }}>What feedback are you looking for?</label>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Describe what you'd like reviewed..."
              rows={3}
              style={{ width: "100%", padding: "9px 12px", borderRadius: 9, border: "1px solid var(--border-default)", fontSize: 13, color: "var(--ink)", outline: "none", resize: "none", lineHeight: "19px", boxSizing: "border-box", fontFamily: "inherit" }}
            />
          </div>
        </div>

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "16px 24px 20px", borderTop: "1px solid var(--border-default)" }}>
          <button type="button" onClick={onClose} style={{ padding: "8px 18px", borderRadius: 8, border: "1px solid var(--border-default)", backgroundColor: "transparent", fontSize: 13, color: "var(--ink)", cursor: "pointer" }}>Cancel</button>
          <button
            type="button"
            disabled={selected.length === 0}
            onClick={() => { onConfirm(selected.map((t) => t.name)); onClose() }}
            style={{ padding: "8px 18px", borderRadius: 8, border: "none", backgroundColor: selected.length > 0 ? "var(--slate-primary)" : "var(--slate-tint)", fontSize: 13, fontWeight: 500, color: selected.length > 0 ? "#FFFFFF" : "var(--ink-tertiary)", cursor: selected.length > 0 ? "pointer" : "not-allowed", transition: "background-color 150ms" }}
          >
            Send for review
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Toast ──────────────────────────────────────────────────────────────────

function Toast({ msg, visible }: { msg: string; visible: boolean }) {
  return (
    <div style={{ position: "fixed", bottom: 24, left: "50%", transform: `translateX(-50%) translateY(${visible ? 0 : 8}px)`, opacity: visible ? 1 : 0, transition: "transform 0.2s ease, opacity 0.2s ease", backgroundColor: "#FFFFFF", border: "1px solid var(--border-default)", borderRadius: 12, padding: "10px 20px", boxShadow: "0 4px 16px rgba(42,42,42,0.12)", fontSize: 13, color: "var(--ink)", zIndex: 150, pointerEvents: "none", whiteSpace: "nowrap" }}>
      {msg}
    </div>
  )
}

// ── Left nav item ──────────────────────────────────────────────────────────

function NavItem({ section, isActive, onClick }: { section: Section; isActive: boolean; onClick: () => void }) {
  return (
    <button type="button" onClick={onClick} style={{ display: "flex", alignItems: "center", gap: 10, width: "100%", padding: "8px 12px", borderRadius: 8, backgroundColor: isActive ? "var(--slate-tint)" : "transparent", border: "none", cursor: "pointer", textAlign: "left", transition: "background-color 150ms" }}
      onMouseEnter={(e) => { if (!isActive) (e.currentTarget as HTMLButtonElement).style.backgroundColor = "rgba(255,255,255,0.08)" }}
      onMouseLeave={(e) => { if (!isActive) (e.currentTarget as HTMLButtonElement).style.backgroundColor = "transparent" }}
    >
      {section.completion === "done" ? (
        <svg width="10" height="10" viewBox="0 0 10 10" fill="none" style={{ flexShrink: 0 }}><circle cx="5" cy="5" r="5" fill="var(--evergreen)" /><path d="M2.5 5.2l1.6 1.6L7.5 3" stroke="#fff" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" /></svg>
      ) : section.completion === "active" ? (
        <svg width="10" height="10" viewBox="0 0 10 10" fill="none" style={{ flexShrink: 0 }}><circle cx="5" cy="5" r="4.5" fill="var(--slate-primary)" stroke="var(--slate-primary)" strokeWidth="1" /></svg>
      ) : (
        <svg width="10" height="10" viewBox="0 0 10 10" fill="none" style={{ flexShrink: 0 }}><circle cx="5" cy="5" r="4" stroke="rgba(255,255,255,0.3)" strokeWidth="1.2" fill="none" /></svg>
      )}
      <span style={{ fontSize: 13, fontWeight: isActive ? 600 : 400, color: isActive ? "var(--slate-primary)" : section.completion === "empty" ? "rgba(255,255,255,0.4)" : "rgba(255,255,255,0.85)", lineHeight: "16px" }}>
        {section.label}
      </span>
    </button>
  )
}

// ── Attribution chips ──────────────────────────────────────────────────────

function AttributionChips({ sources, onChipClick }: { sources: string[]; onChipClick: () => void }) {
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null)

  return (
    <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap", marginTop: 12 }}>
      <span style={{ fontSize: 11, color: "var(--ink-tertiary)", flexShrink: 0 }}>Informed by:</span>
      {sources.map((src, i) => (
        <div key={src} style={{ position: "relative" }}>
          <button
            type="button"
            onClick={onChipClick}
            onMouseEnter={() => setHoveredIdx(i)}
            onMouseLeave={() => setHoveredIdx(null)}
            style={{ display: "flex", alignItems: "center", gap: 4, padding: "2px 8px", borderRadius: 20, backgroundColor: "var(--canvas)", border: "1px solid var(--border-default)", fontSize: 11, color: "var(--ink-secondary)", cursor: "pointer", transition: "background-color 150ms, border-color 150ms", maxWidth: 160 }}
            onFocus={() => setHoveredIdx(i)}
            onBlur={() => setHoveredIdx(null)}
          >
            <MIcon name={src.endsWith(".pdf") || src.endsWith(".xlsx") ? "description" : "folder_open"} size={12} color="var(--ink-tertiary)" />
            <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {src.length > 22 ? src.slice(0, 20) + "…" : src}
            </span>
          </button>
          {hoveredIdx === i && (
            <div style={{ position: "absolute", bottom: "calc(100% + 4px)", left: "50%", transform: "translateX(-50%)", backgroundColor: "var(--ink)", color: "#FFFFFF", fontSize: 11, padding: "4px 8px", borderRadius: 6, whiteSpace: "nowrap", zIndex: 50, pointerEvents: "none" }}>
              {src}
            </div>
          )}
        </div>
      ))}
    </div>
  )
}

// ── Page ───────────────────────────────────────────────────────────────────

export default function EditorPage() {
  const [activeId, setActiveId] = useState<SectionId>("need-statement")
  const [aiTab, setAiTab] = useState<AITab>("assistant")
  const [scope, setScope] = useState<Scope>("section")
  const [chat, setChat] = useState<ChatMessage[]>([
    { role: "ai", text: "Your impact section is strong but missing a named external evaluator. Ford Foundation consistently prioritizes this in their review criteria." },
  ])
  const [chatInput, setChatInput] = useState("")
  const [typing, setTyping] = useState(false)
  const [showScopeWarning, setShowScopeWarning] = useState(false)
  const [proposalStatus, setProposalStatus] = useState<ProposalStatus>("draft")
  const [reviewerNames, setReviewerNames] = useState<string[]>([])
  const [showSubmitModal, setShowSubmitModal] = useState(false)
  const [showShareModal, setShowShareModal] = useState(false)
  const [toast, setToast] = useState({ msg: "", visible: false })
  const scrollRef = useRef<HTMLDivElement>(null)

  const activeSection = SECTIONS.find((s) => s.id === activeId) ?? SECTIONS[0]

  function handleNavClick(id: SectionId) {
    setActiveId(id)
    document.getElementById(`section-${id}`)?.scrollIntoView({ behavior: "smooth", block: "start" })
  }

  function handleSendChat() {
    if (!chatInput.trim()) return
    const text = chatInput.trim()
    setChatInput("")
    const isGlobal = globalDetect(text)
    setChat((prev) => [...prev, { role: "user", text }])
    if (isGlobal && scope === "section") {
      setShowScopeWarning(true)
      return
    }
    setTyping(true)
    setTimeout(() => {
      setTyping(false)
      const response = activeId === "need-statement"
        ? "Here's a suggested opening for your Need Statement: Los Angeles County has an estimated 3.2 million community cats, with the highest concentrations in underserved neighborhoods in South and East LA. Consider centering a resident voice in the first paragraph — Ford Foundation reviewers respond strongly to first-person community perspectives."
        : `I can help you strengthen the ${activeSection.label} section. What specific aspect would you like to improve?`
      setChat((prev) => [...prev, { role: "ai", text: response }])
    }, 1500)
  }

  function showToast(msg: string) {
    setToast({ msg, visible: true })
    setTimeout(() => setToast((v) => ({ ...v, visible: false })), 3000)
  }

  function handleSubmitConfirm(names: string[]) {
    setReviewerNames(names)
    setProposalStatus("in-review")
    showToast(`Sent for review with ${names.join(", ")}`)
  }

  function handleNudgeReviewers() {
    showToast(`Nudge sent to ${reviewerNames.join(", ")}`)
  }

  function handleMoveBackToDraft() {
    setProposalStatus("draft")
    setReviewerNames([])
  }

  function handleChipClick() {
    setAiTab("context")
  }

  const bodyH = "calc(100vh - 44px - 40px)"

  return (
    <div className="flex flex-col flex-1" style={{ overflow: "hidden", minHeight: 0, backgroundColor: "var(--surface-white)" }}>
      <Toast msg={toast.msg} visible={toast.visible} />
      {showSubmitModal && (
        <SubmitForReviewModal
          onClose={() => setShowSubmitModal(false)}
          onConfirm={(names) => { handleSubmitConfirm(names) }}
        />
      )}
      {showShareModal && (
        <ShareModal
          onClose={() => setShowShareModal(false)}
          onShare={(teammate) => showToast(`Proposal shared with ${teammate}`)}
        />
      )}

      {/* Top bar */}
      <div style={{ flexShrink: 0, height: 44, display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 20px", backgroundColor: "var(--surface-white)", borderBottom: "1px solid var(--border-default)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <NextLink href="/opportunity/equitable-futures" style={{ width: 26, height: 26, display: "flex", alignItems: "center", justifyContent: "center", borderRadius: 6, border: "1px solid var(--border-default)", backgroundColor: "var(--surface-white)", textDecoration: "none", flexShrink: 0 }}>
            <ChevronLeft size={13} color="var(--ink-secondary)" />
          </NextLink>
          <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13, color: "var(--ink-tertiary)" }}>
            <NextLink href="/home" style={{ color: "var(--ink-tertiary)", textDecoration: "none" }}>Home</NextLink>
            <span>›</span>
            <NextLink href="/portfolio" style={{ color: "var(--ink-tertiary)", textDecoration: "none" }}>Ford Foundation</NextLink>
            <span>›</span>
            <span style={{ color: "var(--ink)", fontWeight: 500 }}>Equitable Futures — Draft 1</span>
          </div>
          {proposalStatus === "in-review" && (
            <span style={{ borderRadius: 20, padding: "2px 8px", backgroundColor: "#F2EDF3", fontSize: 11, fontWeight: 500, color: "#7A5F7E" }}>In Review</span>
          )}
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><circle cx="7" cy="7" r="6" stroke="var(--evergreen)" strokeWidth="1" fill="none" /><path d="M4.5 7.2l1.7 1.7 3.3-3.3" stroke="var(--evergreen)" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" /></svg>
          <span style={{ fontSize: 12, color: "var(--ink-tertiary)", marginRight: 12 }}>Autosaved</span>
          <button
            type="button"
            onClick={() => setShowShareModal(true)}
            style={{ ...outlineBtn, display: "flex", alignItems: "center", gap: 5 }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.backgroundColor = "var(--canvas)" }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.backgroundColor = "transparent" }}
          >
            <MIcon name="ios_share" size={14} color="var(--ink-secondary)" />
            Share
          </button>
          <button
            type="button"
            onClick={() => setShowSubmitModal(true)}
            style={{ ...outlineBtn, display: "flex", alignItems: "center", gap: 5 }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.backgroundColor = "var(--canvas)" }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.backgroundColor = "transparent" }}
          >
            <MIcon name="group" size={14} color="var(--ink-secondary)" />
            Submit for review
          </button>
          <button type="button" style={{ padding: "7px 16px", borderRadius: 8, backgroundColor: "var(--slate-primary)", border: "none", fontSize: 13, fontWeight: 500, color: "#FFFFFF", cursor: "pointer", transition: "background-color 150ms" }} onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.backgroundColor = "#3A4F6A" }} onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.backgroundColor = "var(--slate-primary)" }}>Save draft</button>
        </div>
      </div>

      {/* Toolbar */}
      <div style={{ flexShrink: 0, display: "flex", alignItems: "center", gap: 2, padding: "0 20px", height: 40, backgroundColor: "var(--surface-white)", borderBottom: "1px solid var(--border-default)" }}>
        {[Bold, Italic, Underline].map((Icon, i) => (
          <button key={i} type="button" style={toolbarBtn} onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.backgroundColor = "var(--canvas)" }} onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.backgroundColor = "transparent" }}><Icon size={13} color="var(--ink-secondary)" /></button>
        ))}
        <div style={{ width: 1, height: 16, backgroundColor: "var(--border-default)", margin: "0 4px" }} />
        {["H1", "H2"].map((t) => (
          <button key={t} type="button" style={{ ...toolbarBtn, fontSize: 12, fontWeight: 600, color: "var(--ink-secondary)" }} onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.backgroundColor = "var(--canvas)" }} onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.backgroundColor = "transparent" }}>{t}</button>
        ))}
        <div style={{ width: 1, height: 16, backgroundColor: "var(--border-default)", margin: "0 4px" }} />
        {[List, ListOrdered, Link, BarChart2, Code].map((Icon, i) => (
          <button key={i} type="button" style={toolbarBtn} onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.backgroundColor = "var(--canvas)" }} onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.backgroundColor = "transparent" }}><Icon size={13} color="var(--ink-secondary)" /></button>
        ))}
      </div>

      {/* Three-column body */}
      <div style={{ display: "flex", height: bodyH, overflow: "hidden" }}>

        {/* Left: section nav */}
        <aside style={{ width: 220, flexShrink: 0, background: "var(--gradient-ai-sidebar)", borderRight: "1px solid rgba(255,255,255,0.08)", overflowY: "auto", display: "flex", flexDirection: "column", height: "100%" }}>
          <div style={{ flexShrink: 0, padding: "14px 12px 8px 14px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <span style={{ fontSize: 10, fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase", color: "rgba(255,255,255,0.35)" }}>Sections</span>
            <button type="button" style={{ width: 22, height: 22, borderRadius: 5, display: "flex", alignItems: "center", justifyContent: "center", border: "1px solid rgba(255,255,255,0.15)", backgroundColor: "transparent", cursor: "pointer" }}><Plus size={11} color="rgba(255,255,255,0.5)" /></button>
          </div>
          <div style={{ flex: 1, padding: "0 8px", display: "flex", flexDirection: "column", gap: 2 }}>
            {SECTIONS.map((s) => <NavItem key={s.id} section={s} isActive={s.id === activeId} onClick={() => handleNavClick(s.id)} />)}
            <button type="button" style={{ display: "flex", alignItems: "center", gap: 6, background: "none", border: "none", padding: "8px 12px", cursor: "pointer", fontSize: 13, color: "rgba(255,255,255,0.45)", fontWeight: 500, textAlign: "left", borderRadius: 8, transition: "background-color 150ms" }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.backgroundColor = "rgba(255,255,255,0.07)" }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.backgroundColor = "transparent" }}
            ><Plus size={13} />Add section</button>
          </div>
          {/* Progress */}
          <div style={{ flexShrink: 0, padding: "12px 14px 16px", borderTop: "1px solid rgba(255,255,255,0.08)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
              <span style={{ fontSize: 11, color: "rgba(255,255,255,0.45)" }}>Progress</span>
              <span style={{ fontSize: 11, fontWeight: 600, color: "rgba(255,255,255,0.7)" }}>{PROGRESS}%</span>
            </div>
            <div style={{ height: 4, borderRadius: 2, backgroundColor: "rgba(255,255,255,0.1)" }}>
              <div style={{ height: "100%", borderRadius: 2, backgroundColor: "var(--slate-secondary)", width: `${PROGRESS}%` }} />
            </div>
          </div>
        </aside>

        {/* Center: writing surface */}
        <div ref={scrollRef} style={{ flex: 1, overflowY: "auto", backgroundColor: "var(--canvas)", height: "100%" }}>
          {/* In Review status banner */}
          {proposalStatus === "in-review" && (
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, padding: "10px 24px", backgroundColor: "#F2EDF3", borderBottom: "1px solid #D9CDD9" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <MIcon name="group" size={16} color="#7A5F7E" />
                <span style={{ fontSize: 13, color: "#5C3F5E", fontWeight: 500 }}>
                  In review with {reviewerNames.join(", ")}
                </span>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <button
                  type="button"
                  onClick={handleNudgeReviewers}
                  style={{ display: "flex", alignItems: "center", gap: 4, padding: "4px 10px", borderRadius: 7, border: "1px solid #C3AACC", backgroundColor: "transparent", fontSize: 12, fontWeight: 500, color: "#5C3F5E", cursor: "pointer", transition: "background-color 100ms" }}
                  onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.backgroundColor = "rgba(122,95,126,0.08)" }}
                  onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.backgroundColor = "transparent" }}
                >
                  <MIcon name="notifications_active" size={13} color="#7A5F7E" />
                  Nudge reviewers
                </button>
                <button
                  type="button"
                  onClick={handleMoveBackToDraft}
                  style={{ background: "none", border: "none", fontSize: 12, color: "var(--ink-tertiary)", cursor: "pointer", textDecoration: "underline", padding: "4px 0" }}
                >
                  Move back to Draft
                </button>
              </div>
            </div>
          )}

          <div style={{ maxWidth: 720, margin: "0 auto", padding: "40px 40px 120px 40px", backgroundColor: "var(--surface-white)", minHeight: "100%", boxShadow: "0 0 0 1px rgba(42,42,42,0.04)" }}>
            {/* Doc header */}
            <div style={{ marginBottom: 32 }}>
              <h1 style={{ margin: "0 0 6px", fontSize: 28, fontWeight: 500, color: "var(--ink)", fontFamily: "var(--font-lora)", letterSpacing: "-0.02em" }}>Equitable Futures Grant 2026</h1>
              <p style={{ margin: 0, fontSize: 13, fontWeight: 500, color: "var(--slate-secondary)" }}>Ford Foundation</p>
            </div>
            <div style={{ height: 1, backgroundColor: "var(--border-default)", marginBottom: 36 }} />

            {SECTIONS.map((section) => {
              const isActive = section.id === activeId
              const sources = SECTION_SOURCES[section.id]
              return (
                <div key={section.id} id={`section-${section.id}`} onClick={() => setActiveId(section.id)} style={{ marginBottom: 40, cursor: "text" }}>
                  <h2 style={{ margin: "0 0 12px", fontSize: 18, fontWeight: 500, color: "var(--ink)", fontFamily: "var(--font-lora)", borderBottom: isActive ? "2px solid var(--slate-primary)" : "2px solid transparent", paddingBottom: 4, display: "inline-block", transition: "border-color 150ms", letterSpacing: "-0.01em" }}>
                    {section.label}
                  </h2>
                  {/* Funder callout */}
                  <div style={{ padding: "10px 14px", marginBottom: 14, borderRadius: 8, backgroundColor: "#F5F0F6", borderLeft: "3px solid #AD9DAE" }}>
                    <p style={{ margin: 0, fontSize: 13, color: "var(--ink-secondary)", lineHeight: "19px", fontStyle: "italic" }}>{section.funderPrompt}</p>
                  </div>
                  {section.content ? (
                    <p style={{ margin: 0, fontSize: 15, color: "var(--ink)", lineHeight: "26px" }}>{section.content}</p>
                  ) : (
                    <p style={{ margin: 0, fontSize: 15, color: "var(--ink-tertiary)", lineHeight: "26px", fontStyle: "italic" }}>Start writing, or ask the AI assistant for help with this section...</p>
                  )}
                  {WORD_COUNTS[section.id] && (
                    <p style={{ margin: "10px 0 0", fontSize: 11, color: "var(--ink-tertiary)", textAlign: "right" }}>{WORD_COUNTS[section.id]}</p>
                  )}
                  {/* Section-level source attribution chips */}
                  {sources && sources.length > 0 && (
                    <AttributionChips sources={sources} onChipClick={handleChipClick} />
                  )}
                </div>
              )
            })}
          </div>
        </div>

        {/* Right: AI panel */}
        <div style={{ width: 340, flexShrink: 0, borderLeft: "1px solid var(--border-default)", backgroundColor: "var(--canvas)", display: "flex", flexDirection: "column", height: "100%", overflow: "hidden" }}>
          {/* Tabs */}
          <div style={{ flexShrink: 0, display: "flex", borderBottom: "1px solid var(--border-default)", padding: "0 16px", backgroundColor: "var(--canvas)" }}>
            {(["assistant", "suggestions", "context"] as AITab[]).map((tab) => {
              const label = tab === "assistant" ? "AI Assistant" : tab === "suggestions" ? "Suggestions" : "Context"
              const isA = aiTab === tab
              return (
                <button key={tab} type="button" onClick={() => setAiTab(tab)} style={{ position: "relative", padding: "12px 4px", marginRight: 14, background: "none", border: "none", cursor: "pointer", fontSize: 13, fontWeight: isA ? 600 : 400, color: isA ? "var(--slate-primary)" : "var(--ink-secondary)", transition: "color 150ms", borderRadius: 4 }}>
                  {label}
                  {isA && <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: 2, borderRadius: 1, backgroundColor: "var(--slate-primary)" }} />}
                </button>
              )
            })}
          </div>

          {/* Scope toggle — AI Assistant tab only */}
          {aiTab === "assistant" && (
            <div style={{ flexShrink: 0, padding: "10px 16px 8px", borderBottom: "1px solid var(--border-default)", backgroundColor: "var(--canvas)" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 0, borderRadius: 8, border: "1px solid var(--border-default)", overflow: "hidden", backgroundColor: "var(--surface-white)", marginBottom: 8 }}>
                {(["section", "document"] as Scope[]).map((s) => (
                  <button key={s} type="button" onClick={() => setScope(s)} style={{ flex: 1, padding: "6px 0", fontSize: 12, fontWeight: scope === s ? 600 : 400, color: scope === s ? "var(--slate-primary)" : "var(--ink-secondary)", backgroundColor: scope === s ? "var(--slate-tint)" : "transparent", border: "none", cursor: "pointer", transition: "background-color 150ms, color 150ms" }}>
                    {s === "section" ? "This section" : "Whole document"}
                  </button>
                ))}
              </div>
              <p style={{ margin: 0, fontSize: 11, color: "var(--ink-tertiary)" }}>
                {scope === "section"
                  ? `Helping with: ${activeSection.label}`
                  : "Working on: Entire proposal"}
              </p>
            </div>
          )}

          {/* Panel body */}
          <div style={{ flex: 1, overflowY: "auto", padding: "14px 16px" }}>

            {/* ── Assistant tab ── */}
            {aiTab === "assistant" && (
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {showScopeWarning && (
                  <div style={{ padding: "10px 12px", borderRadius: 8, backgroundColor: "#FFF3E0", border: "1px solid #F0C070" }}>
                    <p style={{ margin: "0 0 8px", fontSize: 12, color: "#7A4A10" }}>This looks like a document-wide change. Should I apply it to the whole proposal?</p>
                    <div style={{ display: "flex", gap: 6 }}>
                      <button type="button" onClick={() => { setShowScopeWarning(false); setScope("document") }} style={{ padding: "5px 12px", borderRadius: 6, backgroundColor: "var(--slate-primary)", border: "none", fontSize: 12, fontWeight: 500, color: "#FFFFFF", cursor: "pointer" }}>Yes, whole proposal</button>
                      <button type="button" onClick={() => { setShowScopeWarning(false) }} style={{ padding: "5px 12px", borderRadius: 6, backgroundColor: "transparent", border: "1px solid var(--border-default)", fontSize: 12, color: "var(--ink)", cursor: "pointer" }}>No, just this section</button>
                    </div>
                  </div>
                )}
                {chat.map((msg, i) => (
                  <div key={i} style={{ display: "flex", gap: 8, alignItems: "flex-start" }}>
                    {msg.role === "ai" && (
                      <div style={{ width: 22, height: 22, borderRadius: "50%", background: "var(--gradient-avatar)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, marginTop: 1 }}>
                        <span style={{ fontSize: 8, fontWeight: 700, color: "#FFF" }}>GA</span>
                      </div>
                    )}
                    <div style={{ flex: 1, padding: "10px 12px", borderRadius: 10, backgroundColor: msg.role === "ai" ? "var(--surface-white)" : "var(--slate-tint)", border: "1px solid var(--border-default)", fontSize: 13, color: "var(--ink)", lineHeight: "19px" }}>
                      {msg.text}
                    </div>
                  </div>
                ))}
                {typing && (
                  <div style={{ display: "flex", gap: 8, alignItems: "flex-start" }}>
                    <div style={{ width: 22, height: 22, borderRadius: "50%", background: "var(--gradient-avatar)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                      <span style={{ fontSize: 8, fontWeight: 700, color: "#FFF" }}>GA</span>
                    </div>
                    <div style={{ padding: "10px 14px", borderRadius: 10, backgroundColor: "var(--surface-white)", border: "1px solid var(--border-default)" }}>
                      <span style={{ fontSize: 18, color: "var(--ink-tertiary)", letterSpacing: 2 }}>···</span>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* ── Suggestions tab ── */}
            {aiTab === "suggestions" && (
              <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                {AI_SUGGESTION[activeId] ? (
                  <div style={{ borderRadius: 10, border: "1px solid var(--border-default)", backgroundColor: "var(--surface-white)", overflow: "hidden" }}>
                    <div style={{ padding: "10px 14px 0", borderBottom: "1px solid var(--border-default)", paddingBottom: 10, backgroundColor: "var(--slate-tint)" }}>
                      <span style={{ fontSize: 10, fontWeight: 600, letterSpacing: "0.07em", textTransform: "uppercase", color: "var(--slate-primary)" }}>Suggested content</span>
                    </div>
                    <div style={{ padding: 14 }}>
                      <p style={{ margin: "0 0 10px", fontSize: 12, color: "var(--ink-secondary)", lineHeight: "17px" }}>{AI_SUGGESTION[activeId]!.intro}</p>
                      <div style={{ padding: "10px 12px", borderRadius: 8, backgroundColor: "var(--canvas)", border: "1px solid var(--border-default)", marginBottom: 10 }}>
                        <p style={{ margin: 0, fontSize: 12, color: "var(--ink)", lineHeight: "18px", fontStyle: "italic" }}>{AI_SUGGESTION[activeId]!.text}</p>
                      </div>
                      <div style={{ display: "flex", gap: 8 }}>
                        <button type="button" onClick={() => showToast("Text inserted")} style={{ padding: "6px 14px", borderRadius: 7, backgroundColor: "var(--slate-primary)", border: "none", fontSize: 12, fontWeight: 600, color: "#FFFFFF", cursor: "pointer" }}>Insert</button>
                        <button type="button" style={{ display: "flex", alignItems: "center", gap: 5, padding: "6px 12px", borderRadius: 7, backgroundColor: "transparent", border: "1px solid var(--border-default)", fontSize: 12, color: "var(--ink-secondary)", cursor: "pointer" }}><RotateCcw size={11} />Regenerate</button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <p style={{ fontSize: 13, color: "var(--ink-tertiary)", textAlign: "center", marginTop: 20 }}>No suggestions for this section yet.</p>
                )}

                {EVIDENCE[activeId] && EVIDENCE[activeId]!.length > 0 && (
                  <div>
                    <p style={{ margin: "0 0 10px", fontSize: 10, fontWeight: 600, letterSpacing: "0.07em", textTransform: "uppercase", color: "var(--ink-tertiary)" }}>Relevant evidence</p>
                    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                      {EVIDENCE[activeId]!.map((ev) => (
                        <div key={ev.title} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8, padding: "8px 10px", borderRadius: 8, borderLeft: "3px solid var(--slate-light)", backgroundColor: "var(--canvas)" }}>
                          <div style={{ flex: 1 }}>
                            <p style={{ margin: "0 0 2px", fontSize: 12, fontWeight: 500, color: "var(--ink)", lineHeight: "16px" }}>{ev.title}</p>
                            <p style={{ margin: 0, fontSize: 11, color: "var(--ink-tertiary)" }}>{ev.source}</p>
                          </div>
                          <button type="button" onClick={() => showToast("Evidence inserted")} style={{ flexShrink: 0, background: "none", border: "none", cursor: "pointer", fontSize: 12, fontWeight: 600, color: "var(--slate-secondary)", padding: "3px 6px", borderRadius: 5 }}>Insert</button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* ── Context tab ── */}
            {aiTab === "context" && (
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                {/* Uploaded documents — always first */}
                <div>
                  <p style={{ margin: "0 0 8px", fontSize: 10, fontWeight: 600, letterSpacing: "0.07em", textTransform: "uppercase", color: "var(--ink-tertiary)" }}>Uploaded documents</p>
                  <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                    {UPLOADED_DOCS.map((doc) => (
                      <div key={doc.name} style={{ display: "flex", alignItems: "center", gap: 10, padding: "9px 12px", borderRadius: 8, backgroundColor: "var(--surface-white)", border: "1px solid var(--border-default)" }}>
                        <MIcon name="description" size={16} color="var(--slate-secondary)" style={{ flexShrink: 0 }} />
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <p style={{ margin: 0, fontSize: 12, fontWeight: 500, color: "var(--ink)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{doc.name}</p>
                          <p style={{ margin: 0, fontSize: 11, color: "var(--ink-tertiary)" }}>{doc.size}</p>
                        </div>
                      </div>
                    ))}
                    <button type="button" style={{ display: "flex", alignItems: "center", gap: 6, padding: "7px 10px", borderRadius: 8, border: "1px dashed var(--border-default)", backgroundColor: "transparent", fontSize: 12, color: "var(--ink-secondary)", cursor: "pointer" }}>
                      <MIcon name="attach_file" size={14} color="var(--ink-tertiary)" />
                      Upload document
                    </button>
                  </div>
                </div>

                <div style={{ height: 1, backgroundColor: "var(--border-default)" }} />

                {/* Base context items */}
                <p style={{ margin: "0 0 4px", fontSize: 10, fontWeight: 600, letterSpacing: "0.07em", textTransform: "uppercase", color: "var(--ink-tertiary)" }}>Working from</p>
                {CONTEXT_ITEMS_BASE.map(({ label, value }) => (
                  <div key={label} style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", padding: "10px 12px", borderRadius: 8, backgroundColor: "var(--surface-white)", border: "1px solid var(--border-default)" }}>
                    <div>
                      <p style={{ margin: "0 0 2px", fontSize: 11, fontWeight: 600, letterSpacing: "0.05em", textTransform: "uppercase", color: "var(--ink-tertiary)" }}>{label}</p>
                      <p style={{ margin: 0, fontSize: 13, color: "var(--ink)", lineHeight: "17px" }}>{value}</p>
                    </div>
                    <button type="button" style={{ flexShrink: 0, background: "none", border: "none", cursor: "pointer", fontSize: 12, color: "var(--slate-secondary)", fontWeight: 500, padding: "2px 0" }}>Edit</button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Chat input (only on assistant tab) */}
          {aiTab === "assistant" && (
            <div style={{ flexShrink: 0, borderTop: "1px solid var(--border-default)", padding: "10px 16px", backgroundColor: "var(--canvas)" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 12px", borderRadius: 9, backgroundColor: "var(--surface-white)", border: "1px solid var(--border-default)" }}>
                <input
                  type="text"
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter") handleSendChat() }}
                  placeholder={`Ask anything about ${scope === "section" ? "this section" : "the proposal"}...`}
                  style={{ flex: 1, background: "none", border: "none", outline: "none", fontSize: 12, color: "var(--ink)" }}
                />
                <button type="button" onClick={handleSendChat} style={{ width: 26, height: 26, borderRadius: 6, backgroundColor: "var(--slate-primary)", border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  <svg width="10" height="10" viewBox="0 0 10 10" fill="none"><path d="M2 5h6M6 2.5L8.5 5 6 7.5" stroke="#fff" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" /></svg>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

const outlineBtn: React.CSSProperties = {
  padding: "6px 14px", borderRadius: 8, backgroundColor: "transparent", border: "1px solid var(--border-default)", fontSize: 13, color: "var(--ink)", cursor: "pointer", transition: "background-color 150ms",
}

const toolbarBtn: React.CSSProperties = {
  width: 28, height: 28, display: "flex", alignItems: "center", justifyContent: "center", borderRadius: 5, border: "none", backgroundColor: "transparent", cursor: "pointer", transition: "background-color 150ms",
}
