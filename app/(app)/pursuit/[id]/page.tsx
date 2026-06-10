"use client"

import { useState, useRef, useEffect } from "react"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { ArrowLeft, FileText, FileSpreadsheet, Paperclip, CheckSquare, Square, ExternalLink, ChevronDown, Plus, Download, Sparkles, CheckCircle, AlertTriangle, Circle, Check, Lock } from "lucide-react"
import { ArtifactEditorContent } from "./artifact/[artifactId]/page"
import {
  FUNDERS, OPPORTUNITIES, USER, TEAMMATES,
  getArtifactsForPipeline, getAttachmentsForPipeline, getTasksForPipeline,
  getPipelineForOpportunity, createArtifact, getWritingSession,
} from "@/lib/mock-data"
import type { PipelineStatus, PipelinePhase, ArtifactStage, AttachmentCategory, Attachment, Task, Requirement, DraftSection } from "@/lib/types"
import { phaseFromStatus } from "@/lib/types"

// ── Phase + status config ──────────────────────────────────────────────────

const PHASES_ORDER: PipelinePhase[] = ["researching", "applications", "awards"]

const PHASE_LABEL: Record<PipelinePhase, string> = {
  researching:  "Researching",
  applications: "Applications",
  awards:       "Awards",
}

const PHASE_COLOR: Record<PipelinePhase, { bg: string; dot: string; text: string }> = {
  researching:  { bg: "var(--slate-tint)",     dot: "var(--ink-tertiary)", text: "var(--ink-tertiary)" },
  applications: { bg: "var(--plum-tint)",      dot: "var(--plum-soft)",   text: "var(--plum-soft)"   },
  awards:       { bg: "var(--evergreen-tint)", dot: "var(--evergreen)",   text: "var(--evergreen)"   },
}

const STATUS_LABEL: Record<PipelineStatus, string> = {
  "researching":              "Researching",
  "planned":                  "Planned",
  "loi-in-progress":          "LOI In Progress",
  "loi-submitted":            "LOI Submitted",
  "application-in-progress":  "Application In Progress",
  "application-submitted":    "Application Submitted",
  "declined":                 "Declined",
  "abandoned":                "Abandoned",
  "awarded-active":           "Awarded — Active",
  "awarded-closed":           "Awarded — Closed",
}

const STATUS_GROUPS_FOR_DROPDOWN: { phase: PipelinePhase; label: string; statuses: PipelineStatus[] }[] = [
  {
    phase: "researching",
    label: "Researching",
    statuses: ["researching"],
  },
  {
    phase: "applications",
    label: "Applications",
    statuses: [
      "planned",
      "loi-in-progress",
      "loi-submitted",
      "application-in-progress",
      "application-submitted",
      "declined",
      "abandoned",
    ],
  },
  {
    phase: "awards",
    label: "Awards",
    statuses: ["awarded-active", "awarded-closed"],
  },
]

const STAGE_BADGE: Record<ArtifactStage, { label: string; bg: string; color: string }> = {
  "pre-apply":  { label: "Pre-apply",  bg: "var(--terracotta-tint)", color: "var(--terracotta)"      },
  "apply":      { label: "Apply",      bg: "var(--slate-tint)",      color: "var(--slate-secondary)" },
  "post-apply": { label: "Post-apply", bg: "var(--evergreen-tint)",  color: "var(--evergreen)"       },
}

const ARTIFACT_TYPE_LABEL: Record<string, string> = {
  proposal: "Proposal",
  loi:      "Letter of inquiry",
  report:   "Report",
  budget:   "Budget",
  other:    "Document",
}

const CATEGORY_LABEL: Record<AttachmentCategory, string> = {
  rfp:            "RFP",
  prior_proposal: "Prior proposal",
  report:         "Report",
  contact_notes:  "Contact notes",
  other:          "File",
  application:    "Application",
}

// ── Phase indicator ────────────────────────────────────────────────────────

function PhaseIndicator({ current }: { current: PipelinePhase }) {
  const currentIdx = PHASES_ORDER.indexOf(current)

  return (
    <div style={{ display: "flex", alignItems: "center" }}>
      {PHASES_ORDER.map((phase, i) => {
        const done    = i < currentIdx
        const active  = i === currentIdx
        const pending = i > currentIdx
        const cfg     = PHASE_COLOR[phase]
        return (
          <div key={phase} style={{ display: "flex", alignItems: "center" }}>
            <div style={{
              display: "flex", alignItems: "center", gap: 6,
              padding: "4px 10px", borderRadius: 20,
              backgroundColor: active ? cfg.bg : "transparent",
            }}>
              <div style={{
                width: 7, height: 7, borderRadius: "50%",
                backgroundColor: active || done ? cfg.dot : "transparent",
                border: active || done ? "none" : "1.5px solid var(--hair-2)",
                opacity: done ? 0.5 : 1,
              }} />
              <span style={{
                fontSize: 12,
                fontWeight: active ? 600 : 400,
                color: active ? cfg.text : pending ? "var(--hair-2)" : "var(--ink-tertiary)",
                opacity: done ? 0.65 : 1,
              }}>
                {PHASE_LABEL[phase]}
              </span>
            </div>
            {i < PHASES_ORDER.length - 1 && (
              <div style={{ width: 20, height: 1, backgroundColor: done ? cfg.dot : "var(--hair-2)", opacity: done ? 0.3 : 1 }} />
            )}
          </div>
        )
      })}
    </div>
  )
}

// ── Status picker (dropdown) ───────────────────────────────────────────────

function StatusPicker({
  status,
  onStatusChange,
}: {
  status: PipelineStatus
  onStatusChange: (s: PipelineStatus) => void
}) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const phase = phaseFromStatus(status)
  const cfg   = PHASE_COLOR[phase]

  useEffect(() => {
    if (!open) return
    function onDown(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener("mousedown", onDown)
    return () => document.removeEventListener("mousedown", onDown)
  }, [open])

  return (
    <div ref={ref} style={{ position: "relative" }}>
      <button
        type="button"
        onClick={() => setOpen(v => !v)}
        style={{
          display: "inline-flex", alignItems: "center", gap: 6,
          padding: "5px 10px 5px 12px", borderRadius: 8,
          border: "1px solid var(--hair-2)",
          backgroundColor: "var(--canvas)",
          cursor: "pointer",
          fontSize: 12, fontWeight: 500, color: "var(--ink-secondary)",
          transition: "background-color 120ms, border-color 120ms",
        }}
        onMouseEnter={(e) => {
          const el = e.currentTarget as HTMLButtonElement
          el.style.backgroundColor = "var(--surface)"
          el.style.borderColor = "rgba(74,96,128,0.3)"
        }}
        onMouseLeave={(e) => {
          const el = e.currentTarget as HTMLButtonElement
          el.style.backgroundColor = "var(--canvas)"
          el.style.borderColor = "var(--hair-2)"
        }}
      >
        <span style={{
          display: "inline-block", width: 7, height: 7, borderRadius: "50%",
          backgroundColor: cfg.dot, flexShrink: 0,
        }} />
        {STATUS_LABEL[status]}
        <ChevronDown size={11} style={{ color: "var(--ink-tertiary)" }} />
      </button>

      {open && (
        <div style={{
          position: "absolute", top: "calc(100% + 4px)", right: 0,
          width: 240, zIndex: 200,
          backgroundColor: "var(--surface)",
          border: "1px solid var(--hair-2)",
          borderRadius: 10,
          boxShadow: "0 8px 24px rgba(28,24,64,0.12)",
          overflow: "hidden",
        }}>
          {STATUS_GROUPS_FOR_DROPDOWN.map((group, gi) => (
            <div key={group.phase}>
              {gi > 0 && <div style={{ height: 1, backgroundColor: "var(--hair)" }} />}
              <p style={{
                margin: 0, padding: "8px 12px 4px",
                fontSize: 11, fontWeight: 600, color: "var(--ink-tertiary)",
              }}>
                {group.label}
              </p>
              {group.statuses.map(s => (
                <button
                  key={s}
                  type="button"
                  onClick={() => { onStatusChange(s); setOpen(false) }}
                  style={{
                    display: "block", width: "100%",
                    padding: "7px 12px", textAlign: "left",
                    border: "none",
                    backgroundColor: s === status ? "var(--surface-sunk)" : "transparent",
                    cursor: "pointer", fontSize: 12,
                    color: s === status ? "var(--ink)" : "var(--ink-secondary)",
                    fontWeight: s === status ? 600 : 400,
                    transition: "background-color 100ms",
                  }}
                  onMouseEnter={(e) => {
                    if (s !== status) (e.currentTarget as HTMLButtonElement).style.backgroundColor = "var(--surface-sunk)"
                  }}
                  onMouseLeave={(e) => {
                    if (s !== status) (e.currentTarget as HTMLButtonElement).style.backgroundColor = "transparent"
                  }}
                >
                  {STATUS_LABEL[s]}
                </button>
              ))}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ── Tabs ───────────────────────────────────────────────────────────────────

type Tab = "requirements" | "documents" | "tasks"

function TabBar({ active, onChange, counts }: {
  active: Tab
  onChange: (t: Tab) => void
  counts: Record<Tab, number>
}) {
  return (
    <div style={{ display: "flex", gap: 0, borderBottom: "1px solid var(--hair)" }}>
      {(["requirements", "documents", "tasks"] as Tab[]).map(t => (
        <button
          key={t}
          type="button"
          onClick={() => onChange(t)}
          style={{
            padding: "10px 18px", border: "none", background: "none", cursor: "pointer",
            fontSize: 13, fontWeight: active === t ? 600 : 400,
            color: active === t ? "var(--ink)" : "var(--ink-tertiary)",
            borderBottom: active === t ? "2px solid var(--slate-primary)" : "2px solid transparent",
            marginBottom: -1, transition: "color 120ms",
          }}
        >
          {t.charAt(0).toUpperCase() + t.slice(1)}
          <span style={{
            marginLeft: 6, padding: "1px 6px", borderRadius: 10, fontSize: 11,
            backgroundColor: active === t ? "var(--slate-tint)" : "var(--canvas)",
            color: active === t ? "var(--slate-primary)" : "var(--ink-tertiary)",
          }}>
            {counts[t]}
          </span>
        </button>
      ))}
    </div>
  )
}

// ── Page ───────────────────────────────────────────────────────────────────

function todayStr() {
  const d = new Date()
  const months = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"]
  return `${months[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()}`
}

// ── Requirement helpers (mirrored from artifact editor) ───────────────────

type ComplianceStatus = "covered" | "partial" | "uncovered"

function countWords(text: string): number {
  return text.trim() === "" ? 0 : text.trim().split(/\s+/).length
}
function countChars(text: string): number {
  return text.length
}
function sectionCompliance(section: DraftSection, req: Requirement): ComplianceStatus {
  if (req.constraint?.type === "required_attachment") {
    return section.content.trim() ? "covered" : "uncovered"
  }
  if (!section.content.trim()) return "uncovered"
  if (req.wordLimit && countWords(section.content) > req.wordLimit) return "partial"
  if (req.charLimit && countChars(section.content) > req.charLimit) return "partial"
  return "covered"
}

// ── Documents tab ─────────────────────────────────────────────────────────

const SOURCE_CATS: AttachmentCategory[] = ["rfp", "prior_proposal", "report", "contact_notes", "other"]

const ORG_LIBRARY_DOCS: { id: string; filename: string; fileType: "pdf" | "docx" | "sheet" }[] = [
  { id: "lib-1", filename: "501(c)(3) determination letter.pdf", fileType: "pdf"   },
  { id: "lib-2", filename: "Org budget 2026.xlsx",               fileType: "sheet" },
  { id: "lib-3", filename: "Last year's proposal.docx",          fileType: "docx"  },
]

function inferFileType(name: string): "pdf" | "docx" | "image" | "sheet" | "other" {
  const ext = name.split(".").pop()?.toLowerCase() ?? ""
  if (ext === "pdf") return "pdf"
  if (ext === "docx" || ext === "doc") return "docx"
  if (ext === "xlsx" || ext === "xls" || ext === "csv") return "sheet"
  if (["png","jpg","jpeg","gif","webp"].includes(ext)) return "image"
  return "other"
}

function AttachmentFileIcon({ fileType }: { fileType: string }) {
  return fileType === "sheet"
    ? <FileSpreadsheet size={13} style={{ color: "var(--ink-tertiary)", flexShrink: 0 }} />
    : <FileText        size={13} style={{ color: "var(--ink-tertiary)", flexShrink: 0 }} />
}

type UploadStatus = "idle" | "uploading" | "error"

function DocumentsTab({ initialAttachments, pipId }: { initialAttachments: Attachment[]; pipId: string }) {
  const [atts,       setAtts]       = useState<Attachment[]>(initialAttachments)
  const [srcStatus,  setSrcStatus]  = useState<UploadStatus>("idle")
  const [appStatus,  setAppStatus]  = useState<UploadStatus>("idle")
  const [srcLibOpen, setSrcLibOpen] = useState(false)
  const [appLibOpen, setAppLibOpen] = useState(false)
  const srcInputRef = useRef<HTMLInputElement>(null)
  const appInputRef = useRef<HTMLInputElement>(null)
  const srcLibRef   = useRef<HTMLDivElement>(null)
  const appLibRef   = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!srcLibOpen && !appLibOpen) return
    function onDown(e: MouseEvent) {
      if (srcLibOpen && srcLibRef.current && !srcLibRef.current.contains(e.target as Node)) setSrcLibOpen(false)
      if (appLibOpen && appLibRef.current && !appLibRef.current.contains(e.target as Node)) setAppLibOpen(false)
    }
    document.addEventListener("mousedown", onDown)
    return () => document.removeEventListener("mousedown", onDown)
  }, [srcLibOpen, appLibOpen])

  const srcAtts = atts.filter(a => SOURCE_CATS.includes(a.category))
  const appAtts = atts.filter(a => a.category === "application")

  function doUpload(zone: "src" | "app", file: File) {
    const set = zone === "src" ? setSrcStatus : setAppStatus
    set("uploading")
    setTimeout(() => {
      setAtts(prev => [...prev, {
        id: `att-local-${Math.random().toString(36).slice(2)}`,
        pipelineOpportunityId: pipId,
        filename: file.name,
        fileType: inferFileType(file.name),
        stage: "apply" as const,
        category: (zone === "src" ? "other" : "application") as AttachmentCategory,
        uploadDate: todayStr(),
        uploaderId: USER.id,
      }])
      set("idle")
    }, 1200)
  }

  function addLib(zone: "src" | "app", doc: typeof ORG_LIBRARY_DOCS[number]) {
    setAtts(prev => [...prev, {
      id: `att-lib-${doc.id}-${Math.random().toString(36).slice(2)}`,
      pipelineOpportunityId: pipId,
      filename: doc.filename,
      fileType: doc.fileType,
      stage: "apply" as const,
      category: (zone === "src" ? "other" : "application") as AttachmentCategory,
      uploadDate: todayStr(),
      uploaderId: USER.id,
    }])
    if (zone === "src") setSrcLibOpen(false)
    else setAppLibOpen(false)
  }

  const sectionLabel = (text: string) => (
    <p style={{ margin: 0, padding: "10px 14px 2px", fontSize: 10, fontWeight: 700, letterSpacing: "0.06em", textTransform: "uppercase" as const, color: "var(--ink-tertiary)" }}>
      {text}
    </p>
  )

  const libDropdown = (zone: "src" | "app") => (
    <div style={{
      position: "absolute", bottom: "calc(100% + 4px)", left: 0, zIndex: 300, minWidth: 210,
      backgroundColor: "var(--surface)", border: "1px solid var(--hair-2)", borderRadius: 8,
      boxShadow: "0 8px 24px rgba(28,24,64,0.12)", overflow: "hidden",
    }}>
      <p style={{ margin: 0, padding: "8px 10px 4px", fontSize: 10, fontWeight: 700, letterSpacing: "0.06em", textTransform: "uppercase" as const, color: "var(--ink-tertiary)" }}>
        Org library
      </p>
      {ORG_LIBRARY_DOCS.map(doc => (
        <button key={doc.id} type="button" onClick={() => addLib(zone, doc)}
          style={{ display: "flex", alignItems: "center", gap: 8, width: "100%", padding: "7px 10px", border: "none", backgroundColor: "transparent", cursor: "pointer", fontSize: 12, color: "var(--ink-secondary)", textAlign: "left", transition: "background-color 100ms" }}
          onMouseEnter={e => (e.currentTarget as HTMLButtonElement).style.backgroundColor = "var(--surface-sunk)"}
          onMouseLeave={e => (e.currentTarget as HTMLButtonElement).style.backgroundColor = "transparent"}>
          <AttachmentFileIcon fileType={doc.fileType} />
          <span style={{ flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{doc.filename}</span>
        </button>
      ))}
    </div>
  )

  return (
    <div style={{ flex: 1, overflowY: "auto" }}>

      {/* ── Sources ── */}
      <div style={{ borderBottom: "1px solid var(--hair)", paddingBottom: 10 }}>
        {sectionLabel("Sources")}
        <p style={{ margin: 0, padding: "2px 14px 8px", fontSize: 10, color: "var(--ink-tertiary)", lineHeight: "14px" }}>
          Feeds the AI for grounding. Not submitted.
        </p>
        {srcAtts.length > 0 && (
          <div style={{ padding: "0 8px 4px" }}>
            {srcAtts.map(att => (
              <div key={att.id}
                style={{ display: "flex", alignItems: "center", gap: 7, padding: "5px 6px", borderRadius: 6, transition: "background-color 120ms" }}
                onMouseEnter={e => (e.currentTarget.style.backgroundColor = "var(--canvas)")}
                onMouseLeave={e => (e.currentTarget.style.backgroundColor = "transparent")}>
                <AttachmentFileIcon fileType={att.fileType} />
                <span style={{ flex: 1, fontSize: 11, color: "var(--ink)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {att.filename}
                </span>
                <span style={{ fontSize: 10, color: "var(--ink-tertiary)", flexShrink: 0 }}>
                  {CATEGORY_LABEL[att.category]}
                </span>
              </div>
            ))}
          </div>
        )}
        <input ref={srcInputRef} type="file" style={{ display: "none" }}
          onChange={e => { const f = e.target.files?.[0]; if (f) doUpload("src", f); e.target.value = "" }} />
        <div style={{ padding: "2px 8px 0", display: "flex", gap: 6, alignItems: "center" }}>
          {srcStatus === "error" ? (
            <>
              <span style={{ fontSize: 11, color: "var(--terracotta)" }}>Upload failed.</span>
              <button type="button" onClick={() => srcInputRef.current?.click()}
                style={{ fontSize: 11, color: "var(--slate-secondary)", background: "none", border: "none", cursor: "pointer", padding: 0 }}>
                Retry
              </button>
              <button type="button" onClick={() => setSrcStatus("idle")}
                style={{ fontSize: 11, color: "var(--ink-tertiary)", background: "none", border: "none", cursor: "pointer", padding: "0 0 0 2px" }}>
                Clear
              </button>
            </>
          ) : (
            <>
              <button type="button" disabled={srcStatus === "uploading"} onClick={() => srcInputRef.current?.click()}
                style={{ display: "inline-flex", alignItems: "center", gap: 4, padding: "3px 8px", borderRadius: 6, border: "1px solid var(--hair-2)", backgroundColor: "transparent", fontSize: 11, color: srcStatus === "uploading" ? "var(--ink-tertiary)" : "var(--ink-secondary)", cursor: srcStatus === "uploading" ? "default" : "pointer", transition: "background-color 120ms" }}
                onMouseEnter={e => { if (srcStatus === "idle") (e.currentTarget as HTMLButtonElement).style.backgroundColor = "var(--canvas)" }}
                onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.backgroundColor = "transparent" }}>
                <Plus size={10} />{srcStatus === "uploading" ? "Uploading…" : "Upload"}
              </button>
              <div ref={srcLibRef} style={{ position: "relative" }}>
                <button type="button" disabled={srcStatus === "uploading"} onClick={() => setSrcLibOpen(v => !v)}
                  style={{ display: "inline-flex", alignItems: "center", gap: 4, padding: "3px 8px", borderRadius: 6, border: "1px solid var(--hair-2)", backgroundColor: "transparent", fontSize: 11, color: "var(--ink-secondary)", cursor: srcStatus === "uploading" ? "default" : "pointer", transition: "background-color 120ms" }}
                  onMouseEnter={e => { if (srcStatus === "idle") (e.currentTarget as HTMLButtonElement).style.backgroundColor = "var(--canvas)" }}
                  onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.backgroundColor = "transparent" }}>
                  Add from library
                </button>
                {srcLibOpen && libDropdown("src")}
              </div>
            </>
          )}
        </div>
      </div>

      {/* ── Application attachments ── */}
      <div style={{ borderBottom: "1px solid var(--hair)", paddingBottom: 10 }}>
        {sectionLabel("Application attachments")}
        <p style={{ margin: 0, padding: "2px 14px 8px", fontSize: 10, color: "var(--ink-tertiary)", lineHeight: "14px" }}>
          Submitted with your application.
        </p>
        {appAtts.length > 0 && (
          <div style={{ padding: "0 8px 4px" }}>
            {appAtts.map(att => (
              <div key={att.id}
                style={{ display: "flex", alignItems: "center", gap: 7, padding: "5px 6px", borderRadius: 6, transition: "background-color 120ms" }}
                onMouseEnter={e => (e.currentTarget.style.backgroundColor = "var(--canvas)")}
                onMouseLeave={e => (e.currentTarget.style.backgroundColor = "transparent")}>
                <AttachmentFileIcon fileType={att.fileType} />
                <span style={{ flex: 1, fontSize: 11, color: "var(--ink)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {att.filename}
                </span>
              </div>
            ))}
          </div>
        )}
        <input ref={appInputRef} type="file" style={{ display: "none" }}
          onChange={e => { const f = e.target.files?.[0]; if (f) doUpload("app", f); e.target.value = "" }} />
        <div style={{ padding: "2px 8px 0", display: "flex", gap: 6, alignItems: "center" }}>
          {appStatus === "error" ? (
            <>
              <span style={{ fontSize: 11, color: "var(--terracotta)" }}>Upload failed.</span>
              <button type="button" onClick={() => appInputRef.current?.click()}
                style={{ fontSize: 11, color: "var(--slate-secondary)", background: "none", border: "none", cursor: "pointer", padding: 0 }}>
                Retry
              </button>
              <button type="button" onClick={() => setAppStatus("idle")}
                style={{ fontSize: 11, color: "var(--ink-tertiary)", background: "none", border: "none", cursor: "pointer", padding: "0 0 0 2px" }}>
                Clear
              </button>
            </>
          ) : (
            <>
              <button type="button" disabled={appStatus === "uploading"} onClick={() => appInputRef.current?.click()}
                style={{ display: "inline-flex", alignItems: "center", gap: 4, padding: "3px 8px", borderRadius: 6, border: "1px solid var(--hair-2)", backgroundColor: "transparent", fontSize: 11, color: appStatus === "uploading" ? "var(--ink-tertiary)" : "var(--ink-secondary)", cursor: appStatus === "uploading" ? "default" : "pointer", transition: "background-color 120ms" }}
                onMouseEnter={e => { if (appStatus === "idle") (e.currentTarget as HTMLButtonElement).style.backgroundColor = "var(--canvas)" }}
                onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.backgroundColor = "transparent" }}>
                <Plus size={10} />{appStatus === "uploading" ? "Uploading…" : "Upload"}
              </button>
              <div ref={appLibRef} style={{ position: "relative" }}>
                <button type="button" disabled={appStatus === "uploading"} onClick={() => setAppLibOpen(v => !v)}
                  style={{ display: "inline-flex", alignItems: "center", gap: 4, padding: "3px 8px", borderRadius: 6, border: "1px solid var(--hair-2)", backgroundColor: "transparent", fontSize: 11, color: "var(--ink-secondary)", cursor: appStatus === "uploading" ? "default" : "pointer", transition: "background-color 120ms" }}
                  onMouseEnter={e => { if (appStatus === "idle") (e.currentTarget as HTMLButtonElement).style.backgroundColor = "var(--canvas)" }}
                  onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.backgroundColor = "transparent" }}>
                  Add from library
                </button>
                {appLibOpen && libDropdown("app")}
              </div>
            </>
          )}
        </div>
      </div>

      {/* ── Submitted (locked) ── */}
      <div>
        <div style={{ padding: "10px 14px 4px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <p style={{ margin: 0, fontSize: 10, fontWeight: 700, letterSpacing: "0.06em", textTransform: "uppercase" as const, color: "var(--ink-tertiary)" }}>
            Submitted
          </p>
          <Lock size={10} style={{ color: "var(--ink-tertiary)" }} />
        </div>
        <p style={{ margin: 0, padding: "0 14px 12px", fontSize: 11, color: "var(--ink-tertiary)", fontStyle: "italic" }}>
          Frozen when you submit.
        </p>
      </div>

    </div>
  )
}

// params.id is the opportunity ID
export default function PursuitPage({ params }: { params: { id: string } }) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const draftParam = searchParams.get("draft")
  const [activeTab, setActiveTab] = useState<Tab>("requirements")

  const initialPip = getPipelineForOpportunity(params.id)
  const initialArtifacts = initialPip ? getArtifactsForPipeline(initialPip.id) : []
  const [currentStatus, setCurrentStatus] = useState<PipelineStatus>(
    initialPip?.status ?? "researching"
  )
  const [submittedAt, setSubmittedAt] = useState<string | undefined>(initialPip?.submittedAt)
  const [tasks, setTasks] = useState<Task[]>(() => {
    const p = getPipelineForOpportunity(params.id)
    return p ? getTasksForPipeline(p.id) : []
  })
  const [reqSubTab,       setReqSubTab]       = useState<"list" | "compliance">("list")
  const [addingTask,      setAddingTask]      = useState(false)
  const [newTaskTitle,    setNewTaskTitle]    = useState("")
  const [newTaskAssignee, setNewTaskAssignee] = useState(USER.id)

  const [selectedArtifactId, setSelectedArtifactId] = useState<string | null>(() => {
    if (!initialPip) return null
    if (draftParam && initialArtifacts.find(a => a.id === draftParam)) return draftParam
    const sorted = [...initialArtifacts].sort((a, b) => (b.updatedAt > a.updatedAt ? 1 : -1))
    if (sorted[0]) return sorted[0].id
    // No drafts yet — auto-create so onramp shows immediately
    const a = createArtifact(initialPip.id)
    return a.id
  })
  const [draftPickerOpen, setDraftPickerOpen] = useState(false)
  const draftPickerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!draftPickerOpen) return
    function onDown(e: MouseEvent) {
      if (draftPickerRef.current && !draftPickerRef.current.contains(e.target as Node)) setDraftPickerOpen(false)
    }
    document.addEventListener("mousedown", onDown)
    return () => document.removeEventListener("mousedown", onDown)
  }, [draftPickerOpen])

  const pip    = initialPip
  const opp    = OPPORTUNITIES.find(o => o.id === params.id)
  const funder = pip ? FUNDERS.find(f => f.id === pip.funderId) : null

  if (!pip || !funder || !opp) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100%", backgroundColor: "var(--canvas)" }}>
        <div style={{ textAlign: "center" }}>
          <p style={{ fontSize: 15, color: "var(--ink-tertiary)", marginBottom: 16 }}>Pursuit not found.</p>
          <Link href="/tracker" style={{ fontSize: 13, color: "var(--slate-secondary)", textDecoration: "none" }}>← Back to Tracker</Link>
        </div>
      </div>
    )
  }

  function handleStatusChange(s: PipelineStatus) {
    setCurrentStatus(s)
    if (s === "application-submitted" && !submittedAt) {
      setSubmittedAt(todayStr())
    }
  }

  const artifacts      = getArtifactsForPipeline(pip.id)
  const attachments    = getAttachmentsForPipeline(pip.id)
  const openTasks      = tasks.filter(t => !t.completed)
  const doneTasks      = tasks.filter(t => t.completed)
  const selectedArtifact = artifacts.find(a => a.id === selectedArtifactId) ?? null
  const writingSession = selectedArtifact ? getWritingSession(selectedArtifact.id) : null
  const ALL_USERS      = [USER, ...TEAMMATES]
  const currentPhase   = phaseFromStatus(currentStatus)
  const phaseCfg       = PHASE_COLOR[currentPhase]

  return (
    <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden", backgroundColor: "var(--canvas)" }}>

      {/* ── Writing-first header ─────────────────────────────────────────────── */}
      <div style={{ flexShrink: 0, backgroundColor: "var(--surface)", borderBottom: "1px solid var(--hair)" }}>

        {/* Breadcrumb row */}
        <div style={{
          padding: "0 24px", height: 40,
          display: "flex", alignItems: "center", gap: 8,
          borderBottom: "1px solid var(--hair)",
        }}>
          <button
            type="button"
            onClick={() => router.push("/tracker")}
            style={{
              display: "flex", alignItems: "center", gap: 5,
              background: "none", border: "none", cursor: "pointer",
              fontSize: 12, color: "var(--ink-tertiary)", padding: 0,
              transition: "color 120ms",
            }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.color = "var(--ink)" }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.color = "var(--ink-tertiary)" }}
          >
            <ArrowLeft size={13} /> Tracker
          </button>
          <span style={{ color: "var(--hair-2)", fontSize: 14 }}>›</span>
          <span style={{ fontSize: 12, color: "var(--ink-tertiary)", maxWidth: 200, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {funder.name}
          </span>
          <span style={{ color: "var(--hair-2)", fontSize: 14 }}>›</span>
          <span style={{ fontSize: 12, color: "var(--ink-tertiary)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {opp.name}
          </span>
        </div>

        {/* Primary header row: funder (primary), opp (secondary), status pill, deadline, Submit */}
        <div style={{ padding: "14px 24px 0", display: "flex", alignItems: "flex-start", gap: 12 }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <h1 style={{ margin: "0 0 3px", fontSize: 20, fontWeight: 700, color: "var(--ink)", lineHeight: "25px", letterSpacing: "-0.01em", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {funder.name}
            </h1>
            <p style={{ margin: 0, fontSize: 13, color: "var(--ink-secondary)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {opp.name}
            </p>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 10, flexShrink: 0, paddingTop: 2 }}>
            <StatusPicker status={currentStatus} onStatusChange={handleStatusChange} />
            {(submittedAt || opp.deadline) && (
              <span style={{ fontSize: 12, color: "var(--ink-tertiary)", whiteSpace: "nowrap" }}>
                {submittedAt ? `Submitted ${submittedAt}` : `Due ${opp.deadline}`}
              </span>
            )}
            <button
              type="button"
              disabled
              style={{
                padding: "6px 14px", borderRadius: "var(--radius-button)",
                border: "none", backgroundColor: "var(--slate-primary)", color: "#fff",
                fontSize: 12, fontWeight: 600, cursor: "not-allowed", opacity: 0.45,
              }}
            >
              Submit
            </button>
          </div>
        </div>

        {/* Draft bar */}
        <div ref={draftPickerRef} style={{ padding: "10px 24px 12px", display: "flex", alignItems: "center", gap: 8, position: "relative" }}>
          <button
            type="button"
            onClick={() => setDraftPickerOpen(v => !v)}
            style={{
              display: "inline-flex", alignItems: "center", gap: 6,
              padding: "4px 10px 4px 10px", borderRadius: "var(--radius-button)",
              border: "1px solid var(--hair-2)", backgroundColor: "var(--canvas)",
              fontSize: 12, fontWeight: 500, color: "var(--ink)", cursor: "pointer",
              transition: "background-color 120ms",
            }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.backgroundColor = "var(--surface)" }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.backgroundColor = "var(--canvas)" }}
          >
            <FileText size={12} style={{ color: "var(--slate-primary)", flexShrink: 0 }} />
            <span style={{ maxWidth: 220, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {selectedArtifact?.name ?? "Draft 1"}
            </span>
            <ChevronDown size={12} style={{ color: "var(--ink-tertiary)", flexShrink: 0 }} />
          </button>

          {draftPickerOpen && (
            <div style={{
              position: "absolute", top: "calc(100% - 2px)", left: 24, zIndex: 200,
              minWidth: 220, backgroundColor: "var(--surface)",
              border: "1px solid var(--hair-2)", borderRadius: 10,
              boxShadow: "0 8px 24px rgba(28,24,64,0.12)",
              overflow: "hidden",
            }}>
              {artifacts.map(a => (
                <button
                  key={a.id}
                  type="button"
                  onClick={() => {
                    setSelectedArtifactId(a.id)
                    setDraftPickerOpen(false)
                    router.push(`/pursuit/${params.id}?draft=${a.id}`)
                  }}
                  style={{
                    display: "flex", alignItems: "center", gap: 8,
                    width: "100%", padding: "8px 12px", border: "none",
                    backgroundColor: a.id === selectedArtifactId ? "var(--surface-sunk)" : "transparent",
                    cursor: "pointer", fontSize: 12, textAlign: "left",
                    color: a.id === selectedArtifactId ? "var(--ink)" : "var(--ink-secondary)",
                    fontWeight: a.id === selectedArtifactId ? 600 : 400,
                    transition: "background-color 100ms",
                  }}
                  onMouseEnter={(e) => { if (a.id !== selectedArtifactId) (e.currentTarget as HTMLButtonElement).style.backgroundColor = "var(--surface-sunk)" }}
                  onMouseLeave={(e) => { if (a.id !== selectedArtifactId) (e.currentTarget as HTMLButtonElement).style.backgroundColor = "transparent" }}
                >
                  <FileText size={11} style={{ color: "var(--slate-soft)", flexShrink: 0 }} />
                  <span style={{ flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{a.name}</span>
                  {a.id === selectedArtifactId && <Check size={11} style={{ color: "var(--slate-primary)", flexShrink: 0 }} />}
                </button>
              ))}
              <div style={{ height: 1, backgroundColor: "var(--hair)" }} />
              <button
                type="button"
                onClick={() => {
                  const a = createArtifact(pip.id)
                  setSelectedArtifactId(a.id)
                  setDraftPickerOpen(false)
                  router.push(`/pursuit/${params.id}?draft=${a.id}`)
                }}
                style={{
                  display: "flex", alignItems: "center", gap: 6,
                  width: "100%", padding: "8px 12px", border: "none",
                  backgroundColor: "transparent", cursor: "pointer",
                  fontSize: 12, color: "var(--ink-secondary)",
                  transition: "background-color 100ms",
                }}
                onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.backgroundColor = "var(--surface-sunk)" }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.backgroundColor = "transparent" }}
              >
                <Plus size={11} style={{ flexShrink: 0 }} /> New draft
              </button>
            </div>
          )}

          <div style={{ flex: 1 }} />
          <button
            type="button"
            onClick={() => {
              const a = createArtifact(pip.id)
              setSelectedArtifactId(a.id)
              router.push(`/pursuit/${params.id}?draft=${a.id}`)
            }}
            style={{
              display: "inline-flex", alignItems: "center", gap: 5,
              padding: "4px 10px", borderRadius: "var(--radius-button)",
              border: "1px solid var(--hair-2)", backgroundColor: "transparent",
              fontSize: 12, color: "var(--ink-secondary)", cursor: "pointer",
              transition: "background-color 120ms",
            }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.backgroundColor = "var(--slate-tint)" }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.backgroundColor = "transparent" }}
          >
            <Plus size={12} /> New draft
          </button>
          <button
            type="button"
            style={{
              display: "inline-flex", alignItems: "center", gap: 5,
              padding: "4px 10px", borderRadius: "var(--radius-button)",
              border: "1px solid var(--hair-2)", backgroundColor: "transparent",
              fontSize: 12, color: "var(--ink-secondary)", cursor: "pointer",
              transition: "background-color 120ms",
            }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.backgroundColor = "var(--slate-tint)" }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.backgroundColor = "transparent" }}
          >
            <Download size={12} /> Export
          </button>
        </div>
      </div>

      {/* ── 3-column working area ─────────────────────────────────────────────── */}
      <div style={{ flex: 1, display: "flex", overflow: "hidden" }}>

        {/* Left rail */}
        <div style={{
          width: 240, flexShrink: 0,
          display: "flex", flexDirection: "column",
          backgroundColor: "var(--surface)",
          borderRight: "1px solid var(--hair)",
        }}>
          <TabBar
            active={activeTab}
            onChange={setActiveTab}
            counts={{ requirements: writingSession?.requirements.length ?? 0, documents: attachments.length, tasks: tasks.length }}
          />
          <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>

            {/* ── Requirements tab ─────────────────────────────────────── */}
            {activeTab === "requirements" && (
              <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>

                {/* Sub-tab bar: Requirements list | Compliance matrix */}
                <div style={{ flexShrink: 0, borderBottom: "1px solid var(--hair)", display: "flex" }}>
                  {(["list", "compliance"] as const).map(st => (
                    <button
                      key={st}
                      type="button"
                      onClick={() => setReqSubTab(st)}
                      style={{
                        padding: "9px 10px", background: "none", border: "none", cursor: "pointer",
                        fontSize: 11, fontWeight: reqSubTab === st ? 600 : 400,
                        color: reqSubTab === st ? "var(--ink)" : "var(--ink-tertiary)",
                        borderBottom: `2px solid ${reqSubTab === st ? "var(--slate-primary)" : "transparent"}`,
                        transition: "all 120ms",
                      }}
                    >
                      {st === "list" ? "Requirements" : "Compliance"}
                    </button>
                  ))}
                </div>

                {/* Requirements list */}
                {reqSubTab === "list" && (
                  <div style={{ flex: 1, overflowY: "auto", padding: "12px 8px" }}>
                    {!writingSession || writingSession.requirements.length === 0 ? (
                      <p style={{ margin: 0, fontSize: 12, color: "var(--ink-tertiary)", lineHeight: "18px", padding: "4px" }}>
                        Requirements will appear here once extracted from the RFP.
                      </p>
                    ) : writingSession.requirements.map((req, idx) => {
                      const section = writingSession.sections.find(s => s.requirementId === req.id)
                      const status  = section ? sectionCompliance(section, req) : "uncovered"
                      return (
                        <div
                          key={req.id}
                          style={{
                            padding: "9px 10px", borderRadius: "var(--radius-button)",
                            marginBottom: 2, transition: "background-color 120ms",
                          }}
                          onMouseEnter={e => (e.currentTarget.style.backgroundColor = "var(--canvas)")}
                          onMouseLeave={e => (e.currentTarget.style.backgroundColor = "transparent")}
                        >
                          <div style={{ display: "flex", gap: 8, alignItems: "flex-start" }}>
                            <span style={{ fontSize: 10, color: "var(--ink-tertiary)", fontWeight: 600, paddingTop: 2, flexShrink: 0 }}>
                              {idx + 1}
                            </span>
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <p style={{ margin: "0 0 4px", fontSize: 12, color: "var(--ink)", lineHeight: "16px", overflow: "hidden", textOverflow: "ellipsis", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical" }}>
                                {req.text}
                              </p>
                              <div style={{ display: "flex", gap: 5, flexWrap: "wrap" }}>
                                {req.wordLimit && (
                                  <span style={{ fontSize: 10, fontWeight: 600, color: "var(--ink-tertiary)" }}>≤{req.wordLimit} w</span>
                                )}
                                {req.charLimit && (
                                  <span style={{ fontSize: 10, fontWeight: 600, color: "var(--ink-tertiary)" }}>≤{req.charLimit} ch</span>
                                )}
                                {req.constraint?.type === "required_attachment" && (
                                  <span style={{ fontSize: 10, fontWeight: 600, color: "var(--terracotta)" }}>Attachment req.</span>
                                )}
                              </div>
                            </div>
                            <div style={{ flexShrink: 0 }}>
                              {status === "covered"   && <CheckCircle   size={13} style={{ color: "var(--evergreen)" }} />}
                              {status === "partial"   && <AlertTriangle size={13} style={{ color: "var(--amber)"    }} />}
                              {status === "uncovered" && <Circle        size={13} style={{ color: "var(--hair-2)"   }} />}
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}

                {/* Compliance matrix */}
                {reqSubTab === "compliance" && (
                  <div style={{ flex: 1, overflowY: "auto", padding: "12px 8px" }}>
                    <p style={{ margin: "0 0 10px", fontSize: 10, fontWeight: 700, letterSpacing: "0.07em", textTransform: "uppercase", color: "var(--ink-tertiary)", padding: "0 4px" }}>
                      Compliance matrix
                    </p>
                    {!writingSession || writingSession.requirements.length === 0 ? (
                      <p style={{ margin: 0, fontSize: 12, color: "var(--ink-tertiary)", lineHeight: "18px", padding: "0 4px" }}>
                        No requirements to audit yet.
                      </p>
                    ) : writingSession.requirements.map(req => {
                      const section = writingSession.sections.find(s => s.requirementId === req.id)
                      const status  = section ? sectionCompliance(section, req) : "uncovered"
                      const words   = section ? countWords(section.content) : 0
                      const chars   = section ? countChars(section.content) : 0
                      return (
                        <div
                          key={req.id}
                          style={{
                            padding: "9px 10px", borderRadius: "var(--radius-button)",
                            marginBottom: 2,
                            borderLeft: `2px solid ${status === "covered" ? "var(--evergreen)" : status === "partial" ? "var(--amber)" : "var(--hair-2)"}`,
                            transition: "background-color 120ms",
                          }}
                          onMouseEnter={e => (e.currentTarget.style.backgroundColor = "var(--canvas)")}
                          onMouseLeave={e => (e.currentTarget.style.backgroundColor = "transparent")}
                        >
                          <p style={{ margin: "0 0 3px", fontSize: 11, color: "var(--ink)", lineHeight: "15px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                            {req.text}
                          </p>
                          <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
                            <span style={{ fontSize: 10, fontWeight: 600, color: status === "covered" ? "var(--evergreen)" : status === "partial" ? "var(--amber)" : "var(--ink-tertiary)" }}>
                              {status === "covered" ? "Covered" : status === "partial" ? "Over limit" : "Empty"}
                            </span>
                            {req.wordLimit != null && (
                              <span style={{ fontSize: 10, color: words > req.wordLimit ? "var(--amber)" : "var(--ink-tertiary)" }}>
                                {words} / {req.wordLimit} w
                              </span>
                            )}
                            {req.charLimit != null && (
                              <span style={{ fontSize: 10, color: chars > req.charLimit ? "var(--amber)" : "var(--ink-tertiary)" }}>
                                {chars} / {req.charLimit} ch
                              </span>
                            )}
                            {req.constraint?.type === "required_attachment" && (
                              <span style={{ fontSize: 10, color: "var(--terracotta)" }}>Attachment req.</span>
                            )}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            )}

            {/* ── Documents tab ────────────────────────────────────────── */}
            {activeTab === "documents" && (
              <DocumentsTab initialAttachments={attachments} pipId={pip.id} />
            )}

            {/* ── Tasks tab ─────────────────────────────────────────────── */}
            {activeTab === "tasks" && (
              <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>

                {/* Task list */}
                <div style={{ flex: 1, overflowY: "auto", padding: "12px 8px" }}>
                  {openTasks.length === 0 && doneTasks.length === 0 ? (
                    <p style={{ margin: 0, fontSize: 12, color: "var(--ink-tertiary)", lineHeight: "18px", padding: "4px" }}>
                      No tasks yet.
                    </p>
                  ) : (
                    <>
                      <div style={{ display: "flex", flexDirection: "column", gap: 1 }}>
                        {openTasks.map(task => {
                          const assignee = ALL_USERS.find(u => u.id === task.assigneeId)
                          return (
                            <div
                              key={task.id}
                              style={{ padding: "8px 8px", borderRadius: "var(--radius-button)", display: "flex", alignItems: "flex-start", gap: 8, transition: "background-color 120ms" }}
                              onMouseEnter={e => (e.currentTarget.style.backgroundColor = "var(--canvas)")}
                              onMouseLeave={e => (e.currentTarget.style.backgroundColor = "transparent")}
                            >
                              <button
                                type="button"
                                style={{ flexShrink: 0, marginTop: 1, background: "none", border: "none", cursor: "pointer", color: "var(--hair-2)", padding: 0, lineHeight: 0 }}
                                onClick={() => setTasks(prev => prev.map(t => t.id === task.id ? { ...t, completed: true } : t))}
                              >
                                <Circle size={14} />
                              </button>
                              <div style={{ flex: 1, minWidth: 0 }}>
                                <p style={{ margin: "0 0 3px", fontSize: 12, fontWeight: 500, color: "var(--ink)", lineHeight: "16px" }}>
                                  {task.title}
                                </p>
                                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                                  {task.dueDate && (
                                    <span style={{ fontSize: 10, color: "var(--ink-tertiary)" }}>Due {task.dueDate}</span>
                                  )}
                                  {assignee && (
                                    <span style={{
                                      display: "inline-flex", alignItems: "center", justifyContent: "center",
                                      width: 16, height: 16, borderRadius: "50%",
                                      background: "var(--gradient-avatar)",
                                      fontSize: 9, fontWeight: 700, color: "#fff", flexShrink: 0,
                                    }}>
                                      {assignee.initials.slice(0, 2)}
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>
                          )
                        })}
                      </div>
                      {doneTasks.length > 0 && (
                        <div style={{ marginTop: 8 }}>
                          <p style={{ margin: "0 0 4px", fontSize: 10, fontWeight: 600, color: "var(--ink-tertiary)", padding: "0 8px", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                            Done
                          </p>
                          <div style={{ display: "flex", flexDirection: "column", gap: 1 }}>
                            {doneTasks.map(task => (
                              <div key={task.id} style={{ padding: "7px 8px", borderRadius: "var(--radius-button)", display: "flex", alignItems: "center", gap: 8, opacity: 0.55 }}>
                                <CheckCircle size={14} style={{ color: "var(--evergreen)", flexShrink: 0 }} />
                                <p style={{ margin: 0, fontSize: 12, color: "var(--ink-secondary)", textDecoration: "line-through", lineHeight: "16px" }}>
                                  {task.title}
                                </p>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </>
                  )}
                </div>

                {/* Add task */}
                <div style={{ flexShrink: 0, borderTop: "1px solid var(--hair)" }}>
                  {addingTask ? (
                    <div style={{ padding: "8px 8px" }}>
                      <input
                        type="text"
                        autoFocus
                        placeholder="Task title…"
                        value={newTaskTitle}
                        onChange={e => setNewTaskTitle(e.target.value)}
                        onKeyDown={e => {
                          if (e.key === "Enter" && newTaskTitle.trim()) {
                            setTasks(prev => [...prev, {
                              id: `task-local-${Math.random().toString(36).slice(2)}`,
                              pipelineOpportunityId: pip.id,
                              title: newTaskTitle.trim(),
                              assigneeId: newTaskAssignee || undefined,
                              completed: false,
                            }])
                            setNewTaskTitle("")
                            setAddingTask(false)
                          } else if (e.key === "Escape") {
                            setNewTaskTitle("")
                            setAddingTask(false)
                          }
                        }}
                        style={{
                          width: "100%", padding: "5px 8px", borderRadius: "var(--radius-button)",
                          border: "1px solid var(--slate-soft)", fontSize: 12, outline: "none",
                          backgroundColor: "var(--canvas)", marginBottom: 6, boxSizing: "border-box",
                        }}
                      />
                      <select
                        value={newTaskAssignee}
                        onChange={e => setNewTaskAssignee(e.target.value)}
                        style={{
                          width: "100%", padding: "4px 6px", borderRadius: "var(--radius-button)",
                          border: "1px solid var(--hair-2)", fontSize: 11, outline: "none",
                          backgroundColor: "var(--canvas)", color: "var(--ink)", boxSizing: "border-box",
                        }}
                      >
                        <option value="">No assignee</option>
                        {ALL_USERS.map(u => (
                          <option key={u.id} value={u.id}>{u.name}</option>
                        ))}
                      </select>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setAddingTask(true)}
                      style={{
                        display: "flex", alignItems: "center", gap: 5,
                        width: "100%", padding: "8px 16px", borderRadius: 0,
                        border: "none", backgroundColor: "transparent",
                        fontSize: 11, color: "var(--ink-tertiary)", cursor: "pointer",
                        transition: "background-color 120ms",
                      }}
                      onMouseEnter={e => (e.currentTarget.style.backgroundColor = "var(--canvas)")}
                      onMouseLeave={e => (e.currentTarget.style.backgroundColor = "transparent")}
                    >
                      <Plus size={11} /> Add task
                    </button>
                  )}
                </div>
              </div>
            )}

          </div>
        </div>

        {/* Center: draft editor */}
        <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden", borderRight: "1px solid var(--hair)" }}>
          {selectedArtifactId && (
            <ArtifactEditorContent params={{ id: params.id, artifactId: selectedArtifactId }} />
          )}
        </div>

        {/* Right rail: AI gradient */}
        <div style={{
          width: 280, flexShrink: 0,
          display: "flex", flexDirection: "column",
          background: "var(--gradient-ai-rail)",
        }}>
          <div style={{ flex: 1, padding: "20px 16px", overflowY: "auto" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 12 }}>
              <Sparkles size={14} style={{ color: "#01B8FC", flexShrink: 0 }} />
              <span style={{ fontSize: 12, fontWeight: 600, color: "rgba(255,255,255,0.90)" }}>
                AI Assistant
              </span>
            </div>
            <p style={{ margin: 0, fontSize: 12, color: "rgba(255,255,255,0.45)", lineHeight: "18px" }}>
              Chat and AI suggestions will appear here.
            </p>
          </div>
          <div style={{ padding: "14px 16px", borderTop: "1px solid rgba(255,255,255,0.08)" }}>
            <span style={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.04em", color: "rgba(255,255,255,0.55)" }}>
              SNIPPETS
            </span>
            <p style={{ margin: "6px 0 0", fontSize: 12, color: "rgba(255,255,255,0.35)", lineHeight: "16px" }}>
              Org snippets will appear here.
            </p>
          </div>
        </div>

      </div>
    </div>
  )
}
