"use client"

import React, { useEffect, useRef, useState, useCallback } from "react"
import { X, EyeOff } from "lucide-react"
import type { Opportunity } from "@/lib/types"

// ── Reasons taxonomy ───────────────────────────────────────────────────────
//
// Durable reasons train the matcher's future rankings.
// Contextual reasons are recorded but must NOT suppress similar opportunities.

const HIDE_REASONS = [
  {
    id: "mission_fit",
    label: "Not aligned with our mission or focus areas",
    kind: "durable" as const,
    signal: "deprioritize_focus_area",
  },
  {
    id: "award_size",
    label: "Award size doesn't fit our needs",
    kind: "durable" as const,
    signal: "adjust_award_band",
  },
  {
    id: "eligibility",
    label: "We're not eligible",
    kind: "durable" as const,
    signal: "reinforce_eligibility_filter",
  },
  {
    id: "geography",
    label: "Geographic restriction we don't meet",
    kind: "durable" as const,
    signal: "reinforce_geo_filter",
  },
  {
    id: "funder_type",
    label: "A type of funder we tend to avoid",
    kind: "durable" as const,
    signal: "deprioritize_funder_type",
  },
  {
    id: "timing",
    label: "Deadline timing doesn't work right now",
    kind: "contextual" as const,
    signal: "note_timing_only",
  },
  {
    id: "already_pursuing",
    label: "We're already pursuing this or know the funder",
    kind: "contextual" as const,
    signal: "suggest_add_to_pipeline",
  },
  {
    id: "other",
    label: "Something else",
    kind: "contextual" as const,
    signal: "freeform_only",
  },
] as const

type ReasonId = (typeof HIDE_REASONS)[number]["id"]

export interface HidePayload {
  opportunityId: string
  reasonId: ReasonId | null
  reasonKind: "durable" | "contextual" | null
  signal: string | null
  note: string
}

interface Props {
  opp: Opportunity | null
  onConfirm: (payload: HidePayload) => void
  onCancel: () => void
  onAddToPipeline?: (oppId: string) => void
}

export function HideOpportunityDialog({ opp, onConfirm, onCancel, onAddToPipeline }: Props) {
  const [selectedReason, setSelectedReason] = useState<ReasonId | null>(null)
  const [note, setNote] = useState("")
  const dialogRef = useRef<HTMLDivElement>(null)
  const firstRadioRef = useRef<HTMLInputElement>(null)

  const isOpen = opp !== null

  useEffect(() => {
    if (!opp) return
    setSelectedReason(null)
    setNote("")
    const id = setTimeout(() => firstRadioRef.current?.focus(), 50)
    return () => clearTimeout(id)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [opp?.id])

  useEffect(() => {
    if (!isOpen) return
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onCancel() }
    document.addEventListener("keydown", handler)
    return () => document.removeEventListener("keydown", handler)
  }, [isOpen, onCancel])

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key !== "Tab") return
    const dialog = dialogRef.current
    if (!dialog) return
    const focusable = Array.from(dialog.querySelectorAll<HTMLElement>(
      'button:not([disabled]), input:not([disabled]), textarea, [tabindex]:not([tabindex="-1"])',
    ))
    if (!focusable.length) return
    const first = focusable[0]
    const last = focusable[focusable.length - 1]
    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault(); last.focus()
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault(); first.focus()
    }
  }, [])

  const selectedReasonObj = HIDE_REASONS.find(r => r.id === selectedReason)

  function handleConfirm() {
    if (!opp) return
    onConfirm({
      opportunityId: opp.id,
      reasonId: selectedReason,
      reasonKind: selectedReasonObj?.kind ?? null,
      signal: selectedReasonObj?.signal ?? null,
      note,
    })
  }

  if (!isOpen) return null

  return (
    <>
      {/* Backdrop */}
      <div
        aria-hidden="true"
        onClick={onCancel}
        style={{
          position: "fixed", inset: 0,
          backgroundColor: "rgba(28,24,64,0.32)",
          zIndex: 100,
        }}
      />

      {/* Dialog */}
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="hide-dialog-title"
        onKeyDown={handleKeyDown}
        style={{
          position: "fixed",
          top: "50%", left: "50%",
          transform: "translate(-50%, -50%)",
          width: 480,
          maxWidth: "calc(100vw - 32px)",
          backgroundColor: "var(--surface)",
          borderRadius: 14,
          boxShadow: "0 8px 40px rgba(28,24,64,0.20), 0 1px 4px rgba(28,24,64,0.12)",
          overflow: "hidden",
          zIndex: 101,
        }}
      >
        {/* Header — slate-to-plum gradient (matcher signal surface) */}
        <div style={{
          background: "var(--gradient-ai-hero)",
          padding: "18px 20px 16px",
          display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12,
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, minWidth: 0 }}>
            <EyeOff size={17} style={{ color: "rgba(255,255,255,0.70)", flexShrink: 0 }} />
            <div style={{ minWidth: 0 }}>
              <h2
                id="hide-dialog-title"
                style={{ margin: 0, fontSize: 15, fontWeight: 700, color: "#fff", lineHeight: "20px", letterSpacing: "-0.01em" }}
              >
                Hide opportunity
              </h2>
              {opp && (
                <p style={{
                  margin: "3px 0 0", fontSize: 12,
                  color: "rgba(255,255,255,0.60)",
                  lineHeight: "16px",
                  overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                  maxWidth: 340,
                }}>
                  {opp.name}
                </p>
              )}
            </div>
          </div>
          <button
            type="button"
            aria-label="Cancel"
            onClick={onCancel}
            style={{
              flexShrink: 0, width: 28, height: 28, borderRadius: 8,
              border: "1px solid rgba(255,255,255,0.18)",
              backgroundColor: "rgba(255,255,255,0.10)",
              display: "flex", alignItems: "center", justifyContent: "center",
              cursor: "pointer", color: "rgba(255,255,255,0.75)",
              transition: "background-color 120ms",
            }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.backgroundColor = "rgba(255,255,255,0.20)" }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.backgroundColor = "rgba(255,255,255,0.10)" }}
          >
            <X size={14} />
          </button>
        </div>

        {/* Body */}
        <div style={{ padding: "20px 20px 0" }}>
          <fieldset style={{ border: "none", padding: 0, margin: 0 }}>
            <legend style={{
              fontSize: 13, fontWeight: 600, color: "var(--ink)",
              marginBottom: 10, padding: 0,
              display: "block",
            }}>
              Why are you hiding this?{" "}
              <span style={{ fontWeight: 400, color: "var(--ink-tertiary)" }}>(optional)</span>
            </legend>

            <div role="radiogroup" aria-labelledby="hide-dialog-title">
              {HIDE_REASONS.map((reason, i) => {
                const isSelected = selectedReason === reason.id
                return (
                  <label
                    key={reason.id}
                    style={{
                      display: "flex", alignItems: "flex-start", gap: 10,
                      padding: "8px 10px",
                      borderRadius: 8,
                      cursor: "pointer",
                      backgroundColor: isSelected ? "var(--slate-tint)" : "transparent",
                      transition: "background-color 100ms",
                    }}
                    onMouseEnter={(e) => {
                      if (!isSelected) (e.currentTarget as HTMLLabelElement).style.backgroundColor = "var(--canvas)"
                    }}
                    onMouseLeave={(e) => {
                      if (!isSelected) (e.currentTarget as HTMLLabelElement).style.backgroundColor = "transparent"
                    }}
                  >
                    <input
                      ref={i === 0 ? firstRadioRef : undefined}
                      type="radio"
                      name="hide-reason"
                      value={reason.id}
                      checked={isSelected}
                      onChange={() => setSelectedReason(reason.id)}
                      style={{ marginTop: 2, flexShrink: 0, accentColor: "var(--slate-primary)", cursor: "pointer" }}
                    />
                    <span style={{
                      fontSize: 13,
                      color: isSelected ? "var(--ink)" : "var(--ink-secondary)",
                      lineHeight: "18px",
                      transition: "color 100ms",
                    }}>
                      {reason.label}
                    </span>
                  </label>
                )
              })}
            </div>
          </fieldset>

          {/* Pipeline nudge — shown only for "already_pursuing" */}
          {selectedReason === "already_pursuing" && (
            <div style={{
              marginTop: 8,
              padding: "10px 12px",
              borderRadius: 8,
              backgroundColor: "var(--canvas)",
              border: "1px solid var(--hair-2)",
              display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12,
            }}>
              <p style={{ margin: 0, fontSize: 12, color: "var(--ink-secondary)", lineHeight: "17px" }}>
                Add to your pipeline to track progress with this funder instead.
              </p>
              {onAddToPipeline && opp ? (
                <button
                  type="button"
                  onClick={() => { onAddToPipeline(opp.id); onCancel() }}
                  style={{
                    flexShrink: 0,
                    padding: "5px 12px", borderRadius: 6,
                    border: "1px solid var(--slate-primary)", backgroundColor: "transparent",
                    fontSize: 12, fontWeight: 600, color: "var(--slate-primary)",
                    cursor: "pointer", transition: "background-color 120ms",
                    whiteSpace: "nowrap",
                  }}
                  onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.backgroundColor = "var(--slate-tint)" }}
                  onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.backgroundColor = "transparent" }}
                >
                  Add to pipeline
                </button>
              ) : (
                // TODO: wire to add-to-pipeline path when handler is available
                <span style={{ fontSize: 11, color: "var(--ink-tertiary)", flexShrink: 0, whiteSpace: "nowrap" }}>
                  Add to pipeline
                </span>
              )}
            </div>
          )}

          {/* Optional note */}
          <div style={{ marginTop: 14 }}>
            <label
              htmlFor="hide-note"
              style={{ display: "block", fontSize: 12, fontWeight: 500, color: "var(--ink-secondary)", marginBottom: 6 }}
            >
              Anything else?{" "}
              <span style={{ fontWeight: 400, color: "var(--ink-tertiary)" }}>It sharpens your matches.</span>
            </label>
            <textarea
              id="hide-note"
              rows={3}
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Optional note…"
              style={{
                width: "100%",
                boxSizing: "border-box",
                padding: "8px 10px",
                borderRadius: "var(--radius-input)",
                border: "1px solid var(--hair-2)",
                backgroundColor: "var(--canvas)",
                fontSize: 13, color: "var(--ink)",
                lineHeight: "18px",
                resize: "vertical",
                outline: "none",
                fontFamily: "inherit",
                transition: "border-color 120ms",
              }}
              onFocus={(e) => { (e.currentTarget as HTMLTextAreaElement).style.borderColor = "var(--slate-primary)" }}
              onBlur={(e) => { (e.currentTarget as HTMLTextAreaElement).style.borderColor = "var(--hair-2)" }}
            />
          </div>
        </div>

        {/* Footer */}
        <div style={{
          display: "flex", justifyContent: "flex-end", gap: 8,
          padding: "16px 20px",
          marginTop: 4,
        }}>
          <button
            type="button"
            onClick={onCancel}
            style={{
              padding: "8px 16px", borderRadius: 8,
              border: "1px solid var(--hair-2)", backgroundColor: "transparent",
              fontSize: 13, color: "var(--ink-secondary)", cursor: "pointer",
              transition: "background-color 120ms",
            }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.backgroundColor = "var(--canvas)" }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.backgroundColor = "transparent" }}
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            style={{
              padding: "8px 16px", borderRadius: 8,
              border: "none",
              backgroundColor: "var(--slate-primary)",
              fontSize: 13, fontWeight: 600, color: "#fff",
              cursor: "pointer",
              transition: "background-color 120ms",
            }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.backgroundColor = "var(--slate-secondary)" }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.backgroundColor = "var(--slate-primary)" }}
          >
            Hide opportunity
          </button>
        </div>
      </div>
    </>
  )
}
