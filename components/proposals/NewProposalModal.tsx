"use client"

/*
 * NewProposalModal — two-step modal for creating a proposal from an Opportunity.
 *
 * Step 1: Proposal name + format (Document / Portal)
 * Step 2: Add context — already-loaded chips, file uploads (visual mock), RFP paste/URL
 *
 * Patterns: inline styles throughout, matching SubmitModal in app/(app)/editor/page.tsx.
 * On completion → /proposals/equitable-futures-2026-draft
 */

import React, { useState, useRef } from "react"
import { useRouter } from "next/navigation"
import { X, ChevronLeft, Upload, FileText } from "lucide-react"

// ── Types ──────────────────────────────────────────────────────────────────

interface UploadItem {
  id: string
  name: string
  progress: number
}

export interface NewProposalModalProps {
  open: boolean
  onClose: () => void
  opportunityName: string
}

// ── Constants ──────────────────────────────────────────────────────────────

const ALREADY_LOADED = [
  "Ford Foundation profile",
  "Community Resilience Fund requirements",
  "Youth Development Initiative",
]

// ── Sub-components ─────────────────────────────────────────────────────────

function CloseBtn({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        width: 28,
        height: 28,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        borderRadius: 6,
        border: "1px solid var(--border-default)",
        backgroundColor: "transparent",
        cursor: "pointer",
        flexShrink: 0,
      }}
    >
      <X size={14} color="var(--ink-secondary)" />
    </button>
  )
}

function Dropzone({
  hint,
  accept,
  onFiles,
}: {
  hint: string
  accept: string
  onFiles: (files: File[]) => void
}) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [dragOver, setDragOver] = useState(false)

  function handleDrop(e: React.DragEvent) {
    e.preventDefault()
    setDragOver(false)
    onFiles(Array.from(e.dataTransfer.files))
  }

  return (
    <div
      onDragOver={(e) => {
        e.preventDefault()
        setDragOver(true)
      }}
      onDragLeave={() => setDragOver(false)}
      onDrop={handleDrop}
      onClick={() => inputRef.current?.click()}
      style={{
        borderRadius: 9,
        border: `1.5px dashed ${dragOver ? "var(--slate-primary)" : "var(--border-default)"}`,
        backgroundColor: dragOver ? "var(--slate-tint)" : "var(--canvas)",
        padding: "13px 16px",
        display: "flex",
        alignItems: "center",
        gap: 10,
        cursor: "pointer",
        transition: "border-color 150ms, background-color 150ms",
      }}
    >
      <Upload size={15} color="var(--ink-tertiary)" style={{ flexShrink: 0 }} />
      <span style={{ fontSize: 13, color: "var(--ink-tertiary)" }}>{hint}</span>
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        multiple
        style={{ display: "none" }}
        onChange={(e) => {
          onFiles(Array.from(e.target.files ?? []))
          e.target.value = ""
        }}
      />
    </div>
  )
}

function UploadRow({
  item,
  onRemove,
}: {
  item: UploadItem
  onRemove: () => void
}) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 10,
        padding: "10px 12px",
        borderRadius: 8,
        backgroundColor: "var(--surface-white)",
        border: "1px solid var(--border-default)",
      }}
    >
      <FileText size={14} color="var(--slate-secondary)" style={{ flexShrink: 0 }} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "baseline",
            marginBottom: 5,
            gap: 8,
          }}
        >
          <span
            style={{
              fontSize: 13,
              fontWeight: 500,
              color: "var(--ink)",
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            {item.name}
          </span>
          <span style={{ fontSize: 11, color: "var(--ink-tertiary)", flexShrink: 0 }}>
            {item.progress < 100 ? `Uploading… ${item.progress}%` : "Done"}
          </span>
        </div>
        <div
          style={{ height: 3, borderRadius: 2, backgroundColor: "var(--border-default)" }}
        >
          <div
            style={{
              height: "100%",
              borderRadius: 2,
              backgroundColor:
                item.progress < 100 ? "var(--slate-secondary)" : "var(--evergreen)",
              width: `${item.progress}%`,
              transition: "width 250ms ease",
            }}
          />
        </div>
      </div>
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation()
          onRemove()
        }}
        style={{
          width: 22,
          height: 22,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          borderRadius: 4,
          border: "1px solid var(--border-default)",
          backgroundColor: "transparent",
          cursor: "pointer",
          flexShrink: 0,
        }}
      >
        <X size={11} color="var(--ink-tertiary)" />
      </button>
    </div>
  )
}

// ── Main component ─────────────────────────────────────────────────────────

export function NewProposalModal({ open, onClose, opportunityName }: NewProposalModalProps) {
  const router = useRouter()
  const [step, setStep] = useState<1 | 2>(1)
  const [proposalName, setProposalName] = useState(`${opportunityName} — 2026`)
  const [format, setFormat] = useState<"document" | "portal">("document")
  const [priorUploads, setPriorUploads] = useState<UploadItem[]>([])
  const [contextUploads, setContextUploads] = useState<UploadItem[]>([])
  const [rfpText, setRfpText] = useState("")
  const [rfpUrl, setRfpUrl] = useState("")

  if (!open) return null

  function handleClose() {
    setStep(1)
    onClose()
  }

  function handleComplete() {
    handleClose()
    router.push("/proposals/equitable-futures-2026-draft")
  }

  function addUploads(
    files: File[],
    setter: React.Dispatch<React.SetStateAction<UploadItem[]>>
  ) {
    files.forEach((file) => {
      const id = `${file.name}-${Date.now()}-${Math.random()}`
      setter((prev) => [...prev, { id, name: file.name, progress: 0 }])
      let p = 0
      const tick = setInterval(() => {
        p += Math.random() * 22 + 8
        if (p >= 100) {
          p = 100
          clearInterval(tick)
        }
        setter((prev) =>
          prev.map((u) => (u.id === id ? { ...u, progress: Math.round(p) } : u))
        )
      }, 280)
    })
  }

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        backgroundColor: "rgba(42,42,42,0.35)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 200,
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) handleClose()
      }}
    >
      <div
        style={{
          width: step === 1 ? 480 : 560,
          maxHeight: "88vh",
          backgroundColor: "#FFFFFF",
          borderRadius: 14,
          boxShadow: "0 16px 48px rgba(42,42,42,0.18)",
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
        }}
      >
        {step === 1 ? (
          /* ── Step 1: Name + Mode ── */
          <>
            <div style={headerStyle}>
              <h2 style={modalTitleStyle}>New proposal</h2>
              <CloseBtn onClick={handleClose} />
            </div>

            <div style={{ padding: "20px 24px 0", flex: 1 }}>
              {/* Proposal name */}
              <div style={{ marginBottom: 20 }}>
                <label style={labelStyle}>Proposal name</label>
                <input
                  type="text"
                  value={proposalName}
                  onChange={(e) => setProposalName(e.target.value)}
                  style={inputStyle}
                />
              </div>

              {/* Format toggle */}
              <div style={{ marginBottom: 24 }}>
                <label style={labelStyle}>Format</label>
                <div
                  style={{
                    display: "flex",
                    borderRadius: 9,
                    border: "1px solid var(--border-default)",
                    overflow: "hidden",
                  }}
                >
                  {(["document", "portal"] as const).map((f) => (
                    <button
                      key={f}
                      type="button"
                      onClick={() => setFormat(f)}
                      style={{
                        flex: 1,
                        padding: "9px 0",
                        border: "none",
                        backgroundColor:
                          format === f ? "var(--slate-primary)" : "var(--canvas)",
                        color: format === f ? "#FFFFFF" : "var(--ink-secondary)",
                        fontSize: 13,
                        fontWeight: format === f ? 600 : 400,
                        cursor: "pointer",
                        transition: "background-color 150ms, color 150ms",
                      }}
                    >
                      {f === "document" ? "Document" : "Portal"}
                    </button>
                  ))}
                </div>
                <p
                  style={{
                    margin: "8px 0 0",
                    fontSize: 12,
                    color: "var(--ink-tertiary)",
                    lineHeight: "17px",
                  }}
                >
                  Document exports as a DOCX or PDF. Portal generates field-by-field answers for
                  copy-paste into a funder portal.
                </p>
              </div>
            </div>

            <div style={footerStyle}>
              <GhostBtn onClick={handleClose}>Cancel</GhostBtn>
              <SlateBtn onClick={() => setStep(2)}>Next</SlateBtn>
            </div>
          </>
        ) : (
          /* ── Step 2: Add Context ── */
          <>
            <div style={headerStyle}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  style={{
                    width: 28,
                    height: 28,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    borderRadius: 6,
                    border: "1px solid var(--border-default)",
                    backgroundColor: "transparent",
                    cursor: "pointer",
                  }}
                >
                  <ChevronLeft size={14} color="var(--ink-secondary)" />
                </button>
                <h2 style={modalTitleStyle}>Add context</h2>
              </div>
              <CloseBtn onClick={handleClose} />
            </div>

            {/* Scrollable body */}
            <div style={{ flex: 1, overflowY: "auto", padding: "16px 24px 0" }}>
              <p
                style={{
                  margin: "0 0 18px",
                  fontSize: 13,
                  color: "var(--ink-secondary)",
                  lineHeight: "19px",
                }}
              >
                The more context you add, the better your first draft.
              </p>

              {/* Already loaded */}
              <div style={{ marginBottom: 16 }}>
                <p style={sectionLabelStyle}>Already loaded</p>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                  {ALREADY_LOADED.map((item) => (
                    <span
                      key={item}
                      style={{
                        borderRadius: 20,
                        padding: "5px 12px",
                        fontSize: 12,
                        fontWeight: 500,
                        backgroundColor: "var(--plum-tint)",
                        color: "var(--plum-soft)",
                        border: "1px solid rgba(173,157,174,0.25)",
                      }}
                    >
                      {item}
                    </span>
                  ))}
                </div>
              </div>

              <div
                style={{
                  height: 1,
                  backgroundColor: "var(--border-default)",
                  marginBottom: 18,
                }}
              />

              {/* Upload prior proposals */}
              <div style={{ marginBottom: 20 }}>
                <p style={sectionLabelStyle}>Upload prior proposals</p>
                <Dropzone
                  hint="Drag a PDF or DOCX here, or browse"
                  accept=".pdf,.docx"
                  onFiles={(files) => addUploads(files, setPriorUploads)}
                />
                {priorUploads.length > 0 && (
                  <div
                    style={{
                      marginTop: 8,
                      display: "flex",
                      flexDirection: "column",
                      gap: 6,
                    }}
                  >
                    {priorUploads.map((u, i) => (
                      <UploadRow
                        key={u.id}
                        item={u}
                        onRemove={() =>
                          setPriorUploads((prev) => prev.filter((_, j) => j !== i))
                        }
                      />
                    ))}
                  </div>
                )}
              </div>

              {/* Upload additional context */}
              <div style={{ marginBottom: 20 }}>
                <p style={sectionLabelStyle}>Upload additional context</p>
                <Dropzone
                  hint="RFP, org reports, analysis docs · browse"
                  accept=".pdf,.docx,.txt,.xlsx"
                  onFiles={(files) => addUploads(files, setContextUploads)}
                />
                {contextUploads.length > 0 && (
                  <div
                    style={{
                      marginTop: 8,
                      display: "flex",
                      flexDirection: "column",
                      gap: 6,
                    }}
                  >
                    {contextUploads.map((u, i) => (
                      <UploadRow
                        key={u.id}
                        item={u}
                        onRemove={() =>
                          setContextUploads((prev) => prev.filter((_, j) => j !== i))
                        }
                      />
                    ))}
                  </div>
                )}
              </div>

              {/* Paste RFP text */}
              <div style={{ marginBottom: 20 }}>
                <p style={sectionLabelStyle}>Paste RFP text</p>
                <textarea
                  value={rfpText}
                  onChange={(e) => setRfpText(e.target.value)}
                  placeholder="Paste the funder's requirements or questions here"
                  rows={4}
                  style={{
                    width: "100%",
                    padding: "9px 12px",
                    borderRadius: 9,
                    border: "1px solid var(--border-default)",
                    backgroundColor: "var(--surface-white)",
                    fontSize: 13,
                    color: "var(--ink)",
                    outline: "none",
                    resize: "vertical" as const,
                    lineHeight: "19px",
                    boxSizing: "border-box" as const,
                    fontFamily: "inherit",
                  }}
                />
              </div>

              {/* RFP URL */}
              <div style={{ marginBottom: 24 }}>
                <p style={sectionLabelStyle}>RFP URL</p>
                <input
                  type="url"
                  value={rfpUrl}
                  onChange={(e) => setRfpUrl(e.target.value)}
                  placeholder="https://..."
                  style={inputStyle}
                />
              </div>
            </div>

            <div style={footerStyle}>
              <GhostBtn onClick={handleComplete}>Skip for now</GhostBtn>
              <SlateBtn onClick={handleComplete}>Create Proposal</SlateBtn>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

// ── Shared button helpers ──────────────────────────────────────────────────

function GhostBtn({
  children,
  onClick,
}: {
  children: React.ReactNode
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        padding: "8px 18px",
        borderRadius: 8,
        border: "1px solid var(--border-default)",
        backgroundColor: "transparent",
        fontSize: 13,
        color: "var(--ink)",
        cursor: "pointer",
        transition: "background-color 150ms",
      }}
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

function SlateBtn({
  children,
  onClick,
}: {
  children: React.ReactNode
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        padding: "8px 18px",
        borderRadius: 8,
        border: "none",
        backgroundColor: "var(--slate-primary)",
        fontSize: 13,
        fontWeight: 500,
        color: "#FFFFFF",
        cursor: "pointer",
        transition: "background-color 150ms",
      }}
      onMouseEnter={(e) => {
        ;(e.currentTarget as HTMLButtonElement).style.backgroundColor = "#3A4F6A"
      }}
      onMouseLeave={(e) => {
        ;(e.currentTarget as HTMLButtonElement).style.backgroundColor = "var(--slate-primary)"
      }}
    >
      {children}
    </button>
  )
}

// ── Style constants ────────────────────────────────────────────────────────

const headerStyle: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  padding: "20px 24px 0",
  flexShrink: 0,
}

const footerStyle: React.CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  padding: "16px 24px 20px",
  borderTop: "1px solid var(--border-default)",
  flexShrink: 0,
}

const modalTitleStyle: React.CSSProperties = {
  margin: 0,
  fontSize: 17,
  fontWeight: 600,
  color: "var(--ink)",
  fontFamily: "var(--font-lora)",
}

const labelStyle: React.CSSProperties = {
  display: "block",
  fontSize: 13,
  fontWeight: 500,
  color: "var(--ink)",
  marginBottom: 6,
}

const inputStyle: React.CSSProperties = {
  width: "100%",
  padding: "9px 12px",
  borderRadius: 9,
  border: "1px solid var(--border-default)",
  backgroundColor: "var(--surface-white)",
  fontSize: 13,
  color: "var(--ink)",
  outline: "none",
  boxSizing: "border-box" as const,
}

const sectionLabelStyle: React.CSSProperties = {
  fontSize: 10,
  fontWeight: 600,
  letterSpacing: "0.08em",
  textTransform: "uppercase" as const,
  color: "var(--ink-tertiary)",
  margin: "0 0 8px 0",
}
