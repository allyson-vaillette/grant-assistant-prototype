"use client"

import { useState, useRef } from "react"
import Link from "next/link"
import {
  ArrowLeft, Download, Sparkles, Loader2,
  Check, X, AlertCircle, RefreshCw,
} from "lucide-react"
import {
  FUNDERS, OPPORTUNITIES,
  getArtifact, getPipelineForOpportunity,
} from "@/lib/mock-data"
import type { ArtifactStage } from "@/lib/types"

// ── Constants ──────────────────────────────────────────────────────────────

const STAGE_BADGE: Record<ArtifactStage, { label: string; bg: string; color: string }> = {
  "pre-apply":  { label: "Pre-apply",  bg: "var(--terracotta-tint)", color: "var(--terracotta)"      },
  "apply":      { label: "Apply",      bg: "var(--slate-tint)",      color: "var(--slate-secondary)" },
  "post-apply": { label: "Post-apply", bg: "var(--evergreen-tint)",  color: "var(--evergreen)"       },
}

const MAX_SNAPSHOTS  = 5
const AUTOSAVE_DELAY = 1500

// ── Mock AI ────────────────────────────────────────────────────────────────

function mockAIRevise(
  content: string,
  scope: "document" | "section",
  selectedText: string | null,
  prompt: string,
): string {
  const p = prompt.toLowerCase()

  if (scope === "section" && selectedText) {
    const trimmed = selectedText.trimEnd()
    if (p.includes("concis") || p.includes("shorter") || p.includes("brief")) {
      const sentences = trimmed.split(/(?<=[.!?])\s+/)
      return sentences.slice(0, Math.max(1, Math.ceil(sentences.length * 0.65))).join(" ")
    }
    return `${trimmed} Our organization's demonstrated track record — a 97% live release rate across more than 4,200 rescues — underscores our capacity to deliver measurable, sustained impact with this investment, in direct alignment with the funder's stated priorities.`
  }

  const paras   = content.split(/\n\n+/).filter(s => s.trim())
  const opening = (paras[0] ?? "").replace(
    "dedicated to rescuing cats and kittens in need and placing them in loving homes",
    "committed to ending preventable cat euthanasia in San Diego County through direct rescue, foster care, and evidence-based community programs",
  )
  const evaluationPara =
    "We track outcomes rigorously: monthly intake-to-outcome reports, live release rate benchmarking against national no-kill standards, and community reach metrics reviewed by our board quarterly. This data-driven accountability ensures every grant dollar is traceable to a life saved."

  return [opening, ...paras.slice(1), evaluationPara].join("\n\n")
}

// ── Types ──────────────────────────────────────────────────────────────────

type AIScope  = "document" | "section"
type AIPhase  = "idle" | "generating" | "preview" | "error"

interface TextSelection {
  start: number
  end: number
  text: string
}

interface Proposal {
  scope: AIScope
  proposed: string
  selectionStart?: number
  selectionEnd?: number
  originalSelection?: string
}

// ── Page ───────────────────────────────────────────────────────────────────

export default function ArtifactEditorPage({
  params,
}: {
  params: { id: string; artifactId: string }
}) {
  // params.id is the opportunity ID
  const pip      = getPipelineForOpportunity(params.id)
  const artifact = getArtifact(params.artifactId)
  const funder   = pip ? FUNDERS.find(f => f.id === pip.funderId)      : null
  const opp      = pip ? OPPORTUNITIES.find(o => o.id === pip.opportunityId) : null

  // ── Document state ──────────────────────────────────────────────────────
  const [content,    setContent]    = useState(artifact?.content ?? "")
  const [updatedAt,  setUpdatedAt]  = useState(artifact?.updatedAt ?? "")
  const [saveStatus, setSaveStatus] = useState<"saved" | "saving">("saved")
  const [_snapshots, setSnapshots]  = useState<string[]>([artifact?.content ?? ""])

  // ── Selection state ─────────────────────────────────────────────────────
  const [selection, setSelection] = useState<TextSelection | null>(null)

  // ── AI state ────────────────────────────────────────────────────────────
  const [aiScope,  setAiScope]  = useState<AIScope>("document")
  const [prompt,   setPrompt]   = useState("")
  const [aiPhase,  setAiPhase]  = useState<AIPhase>("idle")
  const [aiError,  setAiError]  = useState("")
  const [proposal, setProposal] = useState<Proposal | null>(null)

  const textareaRef  = useRef<HTMLTextAreaElement>(null)
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const abortRef     = useRef<AbortController | null>(null)

  const isPreview  = aiPhase === "preview"
  const canGenerate = !!prompt.trim() && !(aiScope === "section" && !selection)

  // ── Helpers ─────────────────────────────────────────────────────────────

  function pushSnapshot(c: string) {
    setSnapshots(prev => [...prev, c].slice(-MAX_SNAPSHOTS))
  }

  function triggerAutosave(_newContent: string) {
    setSaveStatus("saving")
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current)
    saveTimerRef.current = setTimeout(() => {
      const now = new Date()
      setUpdatedAt(
        now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
      )
      setSaveStatus("saved")
    }, AUTOSAVE_DELAY)
  }

  // ── Editor handlers ─────────────────────────────────────────────────────

  function handleContentChange(e: React.ChangeEvent<HTMLTextAreaElement>) {
    setContent(e.target.value)
    triggerAutosave(e.target.value)
  }

  function handleSelect() {
    const ta = textareaRef.current
    if (!ta) return
    const start = ta.selectionStart
    const end   = ta.selectionEnd
    if (start !== end) {
      setSelection({ start, end, text: content.slice(start, end) })
      setAiScope("section")
    } else {
      setSelection(null)
      setAiScope("document")
    }
  }

  // ── AI handlers ─────────────────────────────────────────────────────────

  async function handleGenerate() {
    if (!prompt.trim()) return
    if (aiScope === "section" && !selection) return

    const ctrl = new AbortController()
    abortRef.current = ctrl

    pushSnapshot(content)

    const scopeAtGenerate     = aiScope
    const selectionAtGenerate = aiScope === "section" ? selection : null

    setAiPhase("generating")
    setAiError("")

    try {
      await new Promise<void>((resolve, reject) => {
        const t = setTimeout(resolve, 1800)
        ctrl.signal.addEventListener("abort", () => { clearTimeout(t); reject(new Error("aborted")) })
      })

      if (ctrl.signal.aborted) return

      const result = mockAIRevise(
        content,
        scopeAtGenerate,
        selectionAtGenerate?.text ?? null,
        prompt,
      )

      setProposal({
        scope:             scopeAtGenerate,
        proposed:          result,
        selectionStart:    selectionAtGenerate?.start,
        selectionEnd:      selectionAtGenerate?.end,
        originalSelection: selectionAtGenerate?.text,
      })
      setAiPhase("preview")
    } catch (err) {
      if ((err as Error).message === "aborted") {
        setAiPhase("idle")
        return
      }
      setAiError("Generation failed — your document is unchanged. Please try again.")
      setAiPhase("error")
    }
  }

  function handleCancel() {
    abortRef.current?.abort()
    abortRef.current = null
    setAiPhase("idle")
  }

  function handleAccept() {
    if (!proposal) return

    let newContent: string
    if (
      proposal.scope === "section" &&
      proposal.selectionStart !== undefined &&
      proposal.selectionEnd   !== undefined
    ) {
      newContent =
        content.slice(0, proposal.selectionStart) +
        proposal.proposed +
        content.slice(proposal.selectionEnd)
    } else {
      newContent = proposal.proposed
    }

    pushSnapshot(content)
    setContent(newContent)
    triggerAutosave(newContent)
    setProposal(null)
    setAiPhase("idle")
    setPrompt("")
    setSelection(null)
    setAiScope("document")
  }

  function handleDiscard() {
    setProposal(null)
    setAiPhase("idle")
  }

  // ── Not found ───────────────────────────────────────────────────────────

  if (!artifact || !pip || !funder || !opp) {
    return (
      <div style={{
        flex: 1, display: "flex", alignItems: "center", justifyContent: "center",
        backgroundColor: "var(--canvas)",
      }}>
        <div style={{ textAlign: "center" }}>
          <p style={{ fontSize: 15, color: "var(--ink-tertiary)", marginBottom: 16 }}>
            Artifact not found.
          </p>
          <Link
            href={`/pursuit/${params.id}`}
            style={{ fontSize: 13, color: "var(--slate-secondary)", textDecoration: "none" }}
          >
            ← Back to workspace
          </Link>
        </div>
      </div>
    )
  }

  const stageCfg = STAGE_BADGE[artifact.stage]

  return (
    <div style={{
      flex: 1, display: "flex", flexDirection: "column",
      overflow: "hidden",
      backgroundColor: "var(--canvas)",
    }}>

      {/* ── Top bar ────────────────────────────────────────────────────── */}
      <div style={{
        flexShrink: 0, height: 52,
        backgroundColor: "var(--surface)", borderBottom: "1px solid var(--hair)",
        padding: "0 20px",
        display: "flex", alignItems: "center", gap: 10,
      }}>

        {/* Breadcrumb / back */}
        <Link href={`/pursuit/${params.id}`} style={{ textDecoration: "none" }}>
          <button
            type="button"
            style={{
              display: "flex", alignItems: "center", gap: 5,
              background: "none", border: "none", cursor: "pointer",
              fontSize: 13, color: "var(--ink-tertiary)", padding: 0,
              transition: "color 120ms",
            }}
            onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.color = "var(--ink)" }}
            onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.color = "var(--ink-tertiary)" }}
          >
            <ArrowLeft size={14} />
            {funder.name}
          </button>
        </Link>

        <span style={{ color: "var(--hair-2)", fontSize: 16 }}>·</span>

        <span style={{
          fontSize: 13, color: "var(--ink-tertiary)",
          overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: 280,
        }}>
          {artifact.name}
        </span>

        <span style={{
          padding: "2px 8px", borderRadius: "var(--radius-pill)",
          fontSize: 10, fontWeight: 600,
          backgroundColor: stageCfg.bg, color: stageCfg.color,
          flexShrink: 0,
        }}>
          {stageCfg.label}
        </span>

        <div style={{ flex: 1 }} />

        {/* Save status */}
        <span style={{ fontSize: 12, color: "var(--ink-tertiary)" }}>
          {saveStatus === "saving" ? "Saving…" : `Updated ${updatedAt}`}
        </span>

        {/* Export */}
        <button
          type="button"
          style={{
            display: "flex", alignItems: "center", gap: 5,
            padding: "6px 12px", borderRadius: "var(--radius-button)",
            border: "1px solid var(--hair-2)", backgroundColor: "transparent",
            fontSize: 12, fontWeight: 500, color: "var(--ink-secondary)", cursor: "pointer",
            transition: "background-color 120ms",
          }}
          onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.backgroundColor = "var(--canvas)" }}
          onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.backgroundColor = "transparent" }}
        >
          <Download size={12} /> Export
        </button>

        {/* Done */}
        <Link href={`/pursuit/${params.id}`} style={{ textDecoration: "none" }}>
          <button
            type="button"
            style={{
              padding: "6px 16px", borderRadius: "var(--radius-button)",
              border: "none", backgroundColor: "var(--slate-primary)",
              fontSize: 12, fontWeight: 600, color: "#FFFFFF", cursor: "pointer",
              transition: "background-color 150ms",
            }}
            onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.backgroundColor = "#3A4F6A" }}
            onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.backgroundColor = "var(--slate-primary)" }}
          >
            Done
          </button>
        </Link>
      </div>

      {/* ── Main ───────────────────────────────────────────────────────── */}
      <div style={{ flex: 1, display: "flex", overflow: "hidden" }}>

        {/* ── Editor pane ──────────────────────────────────────────── */}
        <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>

          {/* Preview notice */}
          {isPreview && (
            <div style={{
              flexShrink: 0,
              display: "flex", alignItems: "center", gap: 9,
              padding: "10px 48px",
              backgroundColor: "rgba(74,96,128,0.05)",
              borderBottom: "1px solid var(--slate-light)",
            }}>
              <Sparkles size={13} style={{ color: "var(--slate-primary)" }} />
              <span style={{ fontSize: 13, fontWeight: 500, color: "var(--slate-primary)" }}>
                {proposal?.scope === "section"
                  ? "Section revision ready to review"
                  : "Document revision ready to review"}
              </span>
              <span style={{ fontSize: 12, color: "var(--ink-tertiary)" }}>
                — accept or discard in the panel →
              </span>
            </div>
          )}

          {/* Scrollable editor */}
          <div style={{ flex: 1, overflowY: "auto", padding: "40px 64px" }}>

            <h1
              contentEditable={!isPreview}
              suppressContentEditableWarning
              style={{
                margin: "0 0 32px",
                fontSize: 26, fontWeight: 700, color: "var(--ink)",
                lineHeight: "32px", letterSpacing: "-0.02em",
                outline: "none", borderBottom: "1px solid transparent",
                opacity: isPreview ? 0.55 : 1,
                transition: "opacity 200ms",
              }}
              onFocus={e  => { (e.currentTarget as HTMLHeadingElement).style.borderBottomColor = "var(--slate-tint)" }}
              onBlur={e   => { (e.currentTarget as HTMLHeadingElement).style.borderBottomColor = "transparent" }}
            >
              {artifact.name}
            </h1>

            <textarea
              ref={textareaRef}
              value={content}
              onChange={handleContentChange}
              onSelect={handleSelect}
              onMouseUp={handleSelect}
              onKeyUp={handleSelect}
              readOnly={isPreview}
              placeholder={`Start writing your ${artifact.type === "proposal" ? "proposal" : artifact.type}…`}
              style={{
                width: "100%", minHeight: "60vh",
                background: "none", border: "none", outline: "none", resize: "none",
                fontSize: 15, color: "var(--ink)", lineHeight: "26px",
                fontFamily: "inherit",
                opacity: isPreview ? 0.55 : 1,
                cursor: isPreview ? "default" : "text",
                transition: "opacity 200ms",
              }}
            />
          </div>
        </div>

        {/* ── AI panel ─────────────────────────────────────────────── */}
        <div style={{
          width: 300, flexShrink: 0,
          borderLeft: "1px solid var(--hair)",
          backgroundColor: "var(--surface)",
          display: "flex", flexDirection: "column",
          height: "100%",
          boxShadow: "var(--shadow-panel)",
        }}>

          {/* Panel header */}
          <div style={{
            flexShrink: 0,
            padding: "14px 16px", borderBottom: "1px solid var(--hair)",
            display: "flex", alignItems: "center", gap: 7,
          }}>
            <Sparkles size={14} style={{ color: "var(--slate-secondary)" }} />
            <span style={{ fontSize: 13, fontWeight: 600, color: "var(--ink)" }}>AI Assist</span>
          </div>

          {/* Panel body */}
          <div style={{ flex: 1, overflowY: "auto" }}>

            {/* ── IDLE / ERROR ── */}
            {(aiPhase === "idle" || aiPhase === "error") && (
              <div style={{ padding: 16, display: "flex", flexDirection: "column", gap: 14 }}>

                {/* Error banner */}
                {aiPhase === "error" && (
                  <div style={{
                    display: "flex", gap: 8, alignItems: "flex-start",
                    padding: "10px 12px", borderRadius: "var(--radius-button)",
                    backgroundColor: "var(--error-light)",
                    border: "1px solid rgba(185,28,28,0.2)",
                  }}>
                    <AlertCircle size={13} style={{ color: "var(--error)", flexShrink: 0, marginTop: 1 }} />
                    <div>
                      <p style={{ margin: "0 0 7px", fontSize: 12, color: "var(--error)", lineHeight: "16px" }}>
                        {aiError}
                      </p>
                      <button
                        type="button"
                        onClick={handleGenerate}
                        style={{
                          display: "inline-flex", alignItems: "center", gap: 4,
                          fontSize: 11, fontWeight: 600, color: "var(--error)",
                          background: "none", border: "none", cursor: "pointer", padding: 0,
                        }}
                      >
                        <RefreshCw size={11} /> Retry
                      </button>
                    </div>
                  </div>
                )}

                {/* Scope selector */}
                <div>
                  <p style={{
                    margin: "0 0 8px",
                    fontSize: 10, fontWeight: 700, letterSpacing: "0.07em", textTransform: "uppercase",
                    color: "var(--ink-tertiary)",
                  }}>
                    Revise
                  </p>
                  <div style={{ display: "flex", gap: 6 }}>
                    {(["document", "section"] as const).map(scope => {
                      const active   = aiScope === scope
                      const disabled = scope === "section" && !selection
                      return (
                        <button
                          key={scope}
                          type="button"
                          disabled={disabled}
                          onClick={() => !disabled && setAiScope(scope)}
                          style={{
                            flex: 1, padding: "7px 8px", borderRadius: "var(--radius-button)",
                            border: `1px solid ${active ? "var(--slate-primary)" : "var(--hair-2)"}`,
                            backgroundColor: active ? "var(--slate-tint)" : "transparent",
                            fontSize: 12, fontWeight: active ? 600 : 400,
                            color: disabled
                              ? "var(--ink-tertiary)"
                              : active
                              ? "var(--slate-primary)"
                              : "var(--ink-secondary)",
                            cursor: disabled ? "not-allowed" : "pointer",
                            opacity: disabled ? 0.5 : 1,
                            transition: "all 120ms",
                          }}
                        >
                          {scope === "document" ? "Full doc" : "Selection"}
                        </button>
                      )
                    })}
                  </div>

                  <p style={{ margin: "6px 0 0", fontSize: 11, color: "var(--ink-tertiary)", lineHeight: "15px" }}>
                    {aiScope === "section" && selection
                      ? `${selection.text.length} chars selected`
                      : aiScope === "section"
                      ? "Select text in the editor to target a section"
                      : "Entire document will be revised"}
                  </p>
                </div>

                {/* Prompt */}
                <div>
                  <p style={{
                    margin: "0 0 6px",
                    fontSize: 10, fontWeight: 700, letterSpacing: "0.07em", textTransform: "uppercase",
                    color: "var(--ink-tertiary)",
                  }}>
                    Instruction
                  </p>
                  <textarea
                    value={prompt}
                    onChange={e => setPrompt(e.target.value)}
                    onKeyDown={e => {
                      if (e.key === "Enter" && !e.shiftKey && canGenerate) {
                        e.preventDefault()
                        handleGenerate()
                      }
                    }}
                    placeholder={
                      aiScope === "section"
                        ? "How should this section be improved?"
                        : "What should be strengthened or changed?"
                    }
                    rows={3}
                    style={{
                      width: "100%", padding: "8px 10px", borderRadius: "var(--radius-input)",
                      border: "1px solid var(--hair-2)",
                      backgroundColor: "var(--canvas)",
                      fontSize: 12, color: "var(--ink)", lineHeight: "18px",
                      fontFamily: "inherit", outline: "none", resize: "none",
                      boxSizing: "border-box",
                      transition: "border-color 120ms",
                    }}
                    onFocus={e  => { (e.currentTarget as HTMLTextAreaElement).style.borderColor = "var(--slate-soft)" }}
                    onBlur={e   => { (e.currentTarget as HTMLTextAreaElement).style.borderColor = "var(--hair-2)" }}
                  />
                </div>

                {/* Generate */}
                <button
                  type="button"
                  disabled={!canGenerate}
                  onClick={handleGenerate}
                  style={{
                    width: "100%", padding: "9px 0", borderRadius: "var(--radius-button)", border: "none",
                    backgroundColor: canGenerate ? "var(--slate-primary)" : "var(--hair-2)",
                    color: canGenerate ? "#fff" : "var(--ink-tertiary)",
                    fontSize: 13, fontWeight: 600,
                    cursor: canGenerate ? "pointer" : "default",
                    display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
                    transition: "background-color 150ms",
                  }}
                  onMouseEnter={e => {
                    if (canGenerate)
                      (e.currentTarget as HTMLButtonElement).style.backgroundColor = "#3A4F6A"
                  }}
                  onMouseLeave={e => {
                    if (canGenerate)
                      (e.currentTarget as HTMLButtonElement).style.backgroundColor = "var(--slate-primary)"
                  }}
                >
                  <Sparkles size={13} /> Generate revision
                </button>

                <p style={{ margin: 0, fontSize: 11, color: "var(--ink-tertiary)", lineHeight: "16px" }}>
                  Changes preview before they apply. Nothing updates until you accept.
                </p>
              </div>
            )}

            {/* ── GENERATING ── */}
            {aiPhase === "generating" && (
              <div style={{
                padding: "32px 16px 16px",
                display: "flex", flexDirection: "column", alignItems: "center", gap: 20,
              }}>
                <div style={{ textAlign: "center" }}>
                  <Loader2
                    size={28}
                    className="animate-spin"
                    style={{ color: "var(--slate-primary)", marginBottom: 12 }}
                  />
                  <p style={{ margin: "0 0 4px", fontSize: 13, fontWeight: 500, color: "var(--ink)" }}>
                    {aiScope === "section" ? "Revising section…" : "Revising document…"}
                  </p>
                  <p style={{ margin: 0, fontSize: 11, color: "var(--ink-tertiary)" }}>
                    Your edits are safe
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleCancel}
                  style={{
                    width: "100%", padding: "8px 0", borderRadius: "var(--radius-button)",
                    border: "1px solid var(--hair-2)", backgroundColor: "transparent",
                    fontSize: 13, color: "var(--ink-secondary)", cursor: "pointer",
                    transition: "background-color 120ms",
                  }}
                  onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.backgroundColor = "var(--canvas)" }}
                  onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.backgroundColor = "transparent" }}
                >
                  Cancel
                </button>
              </div>
            )}

            {/* ── PREVIEW ── */}
            {aiPhase === "preview" && proposal && (
              <div style={{ padding: 16, display: "flex", flexDirection: "column", gap: 12 }}>

                <p style={{
                  margin: 0, fontSize: 10, fontWeight: 700,
                  letterSpacing: "0.07em", textTransform: "uppercase",
                  color: "var(--ink-tertiary)",
                }}>
                  Proposed {proposal.scope === "section" ? "section revision" : "document revision"}
                </p>

                {/* Section preview: before + after */}
                {proposal.scope === "section" && proposal.originalSelection && (
                  <>
                    <div>
                      <p style={{
                        margin: "0 0 4px", fontSize: 10, fontWeight: 600,
                        color: "var(--ink-tertiary)", textTransform: "uppercase", letterSpacing: "0.06em",
                      }}>
                        Original
                      </p>
                      <div style={{
                        padding: "10px 12px", borderRadius: "var(--radius-button)",
                        backgroundColor: "var(--canvas)", border: "1px solid var(--hair-2)",
                        fontSize: 12, color: "var(--ink-tertiary)", lineHeight: "18px",
                        maxHeight: 130, overflowY: "auto",
                      }}>
                        {proposal.originalSelection}
                      </div>
                    </div>
                    <div>
                      <p style={{
                        margin: "0 0 4px", fontSize: 10, fontWeight: 600,
                        color: "var(--evergreen)", textTransform: "uppercase", letterSpacing: "0.06em",
                      }}>
                        Proposed
                      </p>
                      <div style={{
                        padding: "10px 12px", borderRadius: "var(--radius-button)",
                        backgroundColor: "var(--evergreen-tint)",
                        border: "1px solid rgba(60,94,76,0.18)",
                        fontSize: 12, color: "var(--ink-secondary)", lineHeight: "18px",
                        maxHeight: 200, overflowY: "auto",
                      }}>
                        {proposal.proposed}
                      </div>
                    </div>
                  </>
                )}

                {/* Document preview */}
                {proposal.scope === "document" && (
                  <div>
                    <p style={{
                      margin: "0 0 4px", fontSize: 10, fontWeight: 600,
                      color: "var(--evergreen)", textTransform: "uppercase", letterSpacing: "0.06em",
                    }}>
                      Proposed document
                    </p>
                    <div style={{
                      padding: "10px 12px", borderRadius: "var(--radius-button)",
                      backgroundColor: "var(--evergreen-tint)",
                      border: "1px solid rgba(60,94,76,0.18)",
                      fontSize: 11, color: "var(--ink-secondary)", lineHeight: "17px",
                      maxHeight: 300, overflowY: "auto",
                      whiteSpace: "pre-wrap",
                    }}>
                      {proposal.proposed}
                    </div>
                  </div>
                )}

                {/* Accept / Discard */}
                <div style={{ display: "flex", gap: 8, paddingTop: 4 }}>
                  <button
                    type="button"
                    onClick={handleAccept}
                    style={{
                      flex: 1, padding: "9px 0", borderRadius: "var(--radius-button)", border: "none",
                      backgroundColor: "var(--evergreen)", color: "#fff",
                      fontSize: 13, fontWeight: 600, cursor: "pointer",
                      display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
                      transition: "background-color 150ms",
                    }}
                    onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.backgroundColor = "#2E4A3A" }}
                    onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.backgroundColor = "var(--evergreen)" }}
                  >
                    <Check size={13} /> Accept
                  </button>
                  <button
                    type="button"
                    onClick={handleDiscard}
                    style={{
                      flex: 1, padding: "9px 0", borderRadius: "var(--radius-button)",
                      border: "1px solid var(--hair-2)", backgroundColor: "transparent",
                      fontSize: 13, color: "var(--ink-secondary)", cursor: "pointer",
                      display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
                      transition: "background-color 120ms",
                    }}
                    onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.backgroundColor = "var(--canvas)" }}
                    onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.backgroundColor = "transparent" }}
                  >
                    <X size={13} /> Discard
                  </button>
                </div>

              </div>
            )}

          </div>
        </div>
      </div>
    </div>
  )
}
