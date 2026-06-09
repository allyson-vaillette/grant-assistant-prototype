"use client"

import { useState } from "react"
import Link from "next/link"
import { ArrowLeft, Sparkles, Save, Download } from "lucide-react"
import {
  FUNDERS, OPPORTUNITIES, PIPELINE_OPPORTUNITIES,
  getArtifact,
} from "@/lib/mock-data"
import type { ArtifactStage } from "@/lib/types"

const STAGE_BADGE: Record<ArtifactStage, { label: string; bg: string; color: string }> = {
  "pre-apply":  { label: "Pre-apply",  bg: "var(--terracotta-tint)", color: "var(--terracotta)"      },
  "apply":      { label: "Apply",      bg: "var(--slate-tint)",      color: "var(--slate-secondary)"  },
  "post-apply": { label: "Post-apply", bg: "var(--evergreen-tint)",  color: "var(--evergreen)"        },
}

// ── AI Panel ───────────────────────────────────────────────────────────────

function AIPanel({ oppName }: { oppName: string }) {
  const [input, setInput] = useState("")
  const [response, setResponse] = useState("")

  function handleAsk() {
    if (!input.trim()) return
    setResponse("I can help you strengthen this section. Consider leading with your organization's most compelling outcome metric, then connecting it directly to the funder's stated priority areas.")
    setInput("")
  }

  return (
    <div style={{
      width: 280, flexShrink: 0, borderLeft: "1px solid var(--hair)",
      backgroundColor: "var(--surface)", display: "flex", flexDirection: "column",
      height: "100%",
    }}>
      <div style={{ padding: "14px 16px", borderBottom: "1px solid var(--hair)", flexShrink: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
          <Sparkles size={13} style={{ color: "var(--slate-secondary)" }} />
          <span style={{ fontSize: 13, fontWeight: 600, color: "var(--ink)" }}>AI Assist</span>
        </div>
      </div>

      <div style={{ flex: 1, overflowY: "auto", padding: "16px" }}>
        {!response && (
          <div style={{ padding: "12px 14px", borderRadius: 8, backgroundColor: "var(--canvas)", border: "1px solid var(--hair-2)" }}>
            <p style={{ margin: 0, fontSize: 12, color: "var(--ink-secondary)", lineHeight: "17px" }}>
              Ask me to improve a section, check for gaps, or suggest stronger language for <strong>{oppName}</strong>.
            </p>
          </div>
        )}
        {response && (
          <div style={{ padding: "12px 14px", borderRadius: 8, backgroundColor: "var(--slate-tint)", border: "1px solid rgba(74,96,128,0.15)" }}>
            <p style={{ margin: 0, fontSize: 12, color: "var(--ink-secondary)", lineHeight: "18px" }}>{response}</p>
          </div>
        )}
      </div>

      <div style={{ padding: "12px 14px", borderTop: "1px solid var(--hair)", flexShrink: 0 }}>
        <div style={{
          display: "flex", alignItems: "flex-end", gap: 8,
          padding: "8px 10px", borderRadius: 9,
          border: "1px solid var(--hair-2)", backgroundColor: "var(--canvas)",
        }}>
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleAsk() }}}
            placeholder="Ask anything…"
            rows={2}
            style={{
              flex: 1, background: "none", border: "none", outline: "none", resize: "none",
              fontSize: 12, color: "var(--ink)", lineHeight: "17px", fontFamily: "inherit",
            }}
          />
          <button
            type="button"
            onClick={handleAsk}
            disabled={!input.trim()}
            style={{
              padding: "5px 10px", borderRadius: 6, border: "none",
              backgroundColor: input.trim() ? "var(--slate-primary)" : "var(--hair-2)",
              color: input.trim() ? "#FFFFFF" : "var(--ink-tertiary)",
              fontSize: 11, fontWeight: 600, cursor: input.trim() ? "pointer" : "default",
              flexShrink: 0, transition: "background-color 150ms",
            }}
          >
            Ask
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Page ───────────────────────────────────────────────────────────────────

export default function ArtifactEditorPage({ params }: { params: { id: string; artifactId: string } }) {
  const artifact  = getArtifact(params.artifactId)
  const pip       = PIPELINE_OPPORTUNITIES.find(p => p.id === params.id)
  const funder    = pip ? FUNDERS.find(f => f.id === pip.funderId) : null
  const opp       = pip ? OPPORTUNITIES.find(o => o.id === pip.opportunityId) : null
  const [content, setContent] = useState(artifact?.content ?? "")
  const [saved, setSaved]     = useState(false)

  function handleSave() {
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  if (!artifact || !pip || !funder || !opp) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100%", backgroundColor: "var(--canvas)" }}>
        <div style={{ textAlign: "center" }}>
          <p style={{ fontSize: 15, color: "var(--ink-tertiary)", marginBottom: 16 }}>Artifact not found.</p>
          <Link href={`/pursuit/${params.id}`} style={{ fontSize: 13, color: "var(--slate-secondary)", textDecoration: "none" }}>← Back to pursuit</Link>
        </div>
      </div>
    )
  }

  const stageCfg = STAGE_BADGE[artifact.stage]

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%", overflow: "hidden", backgroundColor: "var(--canvas)" }}>
      {/* Top bar */}
      <div style={{
        flexShrink: 0, height: 52,
        backgroundColor: "var(--surface)", borderBottom: "1px solid var(--hair)",
        padding: "0 20px",
        display: "flex", alignItems: "center", gap: 12,
      }}>
        <Link href={`/pursuit/${pip.id}`} style={{ textDecoration: "none" }}>
          <button
            type="button"
            style={{
              display: "flex", alignItems: "center", gap: 5,
              background: "none", border: "none", cursor: "pointer",
              fontSize: 13, color: "var(--ink-tertiary)", padding: 0,
            }}
          >
            <ArrowLeft size={14} />
            {funder.name}
          </button>
        </Link>
        <span style={{ color: "var(--hair-2)", fontSize: 16 }}>·</span>
        <span style={{ fontSize: 13, color: "var(--ink-tertiary)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: 240 }}>
          {artifact.name}
        </span>
        <span style={{
          padding: "2px 8px", borderRadius: 20,
          fontSize: 10, fontWeight: 600, backgroundColor: stageCfg.bg, color: stageCfg.color,
        }}>
          {stageCfg.label}
        </span>

        <div style={{ flex: 1 }} />

        <span style={{ fontSize: 12, color: "var(--ink-tertiary)" }}>
          {saved ? "Saved" : `Updated ${artifact.updatedAt}`}
        </span>

        <button
          type="button"
          onClick={handleSave}
          style={{
            display: "flex", alignItems: "center", gap: 5,
            padding: "6px 14px", borderRadius: 7,
            border: "1px solid var(--hair-2)", backgroundColor: "var(--canvas)",
            fontSize: 12, fontWeight: 500, color: "var(--ink-secondary)", cursor: "pointer",
            transition: "background-color 150ms",
          }}
          onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.backgroundColor = "var(--slate-tint)" }}
          onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.backgroundColor = "var(--canvas)" }}
        >
          <Save size={12} /> Save
        </button>

        <button
          type="button"
          style={{
            display: "flex", alignItems: "center", gap: 5,
            padding: "6px 14px", borderRadius: 7,
            border: "none", backgroundColor: "var(--slate-primary)",
            fontSize: 12, fontWeight: 600, color: "#FFFFFF", cursor: "pointer",
            transition: "background-color 150ms",
          }}
          onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.backgroundColor = "#3A4F6A" }}
          onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.backgroundColor = "var(--slate-primary)" }}
        >
          <Download size={12} /> Export
        </button>
      </div>

      {/* Editor + AI panel */}
      <div style={{ flex: 1, display: "flex", overflow: "hidden" }}>

        {/* Editor */}
        <div style={{ flex: 1, overflowY: "auto", padding: "40px 64px" }}>
          <h1
            contentEditable
            suppressContentEditableWarning
            style={{
              margin: "0 0 32px", fontSize: 26, fontWeight: 700, color: "var(--ink)",
              lineHeight: "32px", letterSpacing: "-0.02em", outline: "none",
              borderBottom: "1px solid transparent",
            }}
            onFocus={(e) => { (e.currentTarget as HTMLHeadingElement).style.borderBottomColor = "var(--slate-tint)" }}
            onBlur={(e) => { (e.currentTarget as HTMLHeadingElement).style.borderBottomColor = "transparent" }}
          >
            {artifact.name}
          </h1>
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder={`Start writing your ${artifact.type === "proposal" ? "proposal" : artifact.type}…`}
            style={{
              width: "100%", minHeight: "60vh",
              background: "none", border: "none", outline: "none", resize: "none",
              fontSize: 15, color: "var(--ink)", lineHeight: "26px",
              fontFamily: "inherit",
            }}
          />
        </div>

        <AIPanel oppName={opp.name} />
      </div>
    </div>
  )
}
