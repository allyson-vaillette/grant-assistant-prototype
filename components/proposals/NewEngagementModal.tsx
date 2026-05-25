"use client"

import React, { useState, useRef, useEffect, useCallback } from "react"
import { X, Search, Check } from "lucide-react"
import { PLATFORM_FUNDERS, type PlatformFunder } from "@/lib/funders"

// ── Types ──────────────────────────────────────────────────────────────────

export type NewEngagementStatus = "Active" | "Lapsed" | "Closed"

export interface NewEngagementData {
  funderName: string
  engagementName: string
  status: NewEngagementStatus
}

interface Props {
  open: boolean
  onClose: () => void
  onCreate: (data: NewEngagementData) => void
  lockedFunderName?: string
}

// ── Component ──────────────────────────────────────────────────────────────

export function NewEngagementModal({ open, onClose, onCreate, lockedFunderName }: Props) {
  const [funderQuery, setFunderQuery] = useState("")
  const [selectedFunder, setSelectedFunder] = useState<PlatformFunder | null>(null)
  const [manualMode, setManualMode] = useState(false)
  const [manualFunderName, setManualFunderName] = useState("")
  const [engagementName, setEngagementName] = useState("")
  const [status, setStatus] = useState<NewEngagementStatus>("Active")
  const [showDropdown, setShowDropdown] = useState(false)
  const blurTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const resetAndClose = useCallback(() => {
    setFunderQuery("")
    setSelectedFunder(null)
    setManualMode(false)
    setManualFunderName("")
    setEngagementName("")
    setStatus("Active")
    setShowDropdown(false)
    onClose()
  }, [onClose])

  // Pre-fill funder when modal opens with a locked funder name
  useEffect(() => {
    if (open && lockedFunderName) {
      setManualMode(true)
      setManualFunderName(lockedFunderName)
      setEngagementName((prev) => prev || lockedFunderName)
    }
  }, [open, lockedFunderName])

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape" && open) resetAndClose()
    }
    document.addEventListener("keydown", onKey)
    return () => document.removeEventListener("keydown", onKey)
  }, [open, resetAndClose])

  if (!open) return null

  const results = funderQuery.trim()
    ? PLATFORM_FUNDERS.filter((f) =>
        f.name.toLowerCase().includes(funderQuery.toLowerCase().trim())
      ).slice(0, 7)
    : []

  const dropdownVisible = showDropdown && !manualMode && funderQuery.trim().length > 0

  const funderFieldValue = manualMode ? manualFunderName : funderQuery
  const canCreate = manualMode
    ? manualFunderName.trim().length > 0
    : funderQuery.trim().length > 0

  function pickFunder(funder: PlatformFunder) {
    if (blurTimer.current) clearTimeout(blurTimer.current)
    setSelectedFunder(funder)
    setFunderQuery(funder.name)
    setShowDropdown(false)
    // Auto-fill engagement name only if it's still empty or was previously auto-filled
    setEngagementName((prev) => (prev === "" || prev === selectedFunder?.name) ? funder.name : prev)
  }

  function enterManualMode() {
    if (blurTimer.current) clearTimeout(blurTimer.current)
    setManualMode(true)
    setFunderQuery("")
    setSelectedFunder(null)
    setShowDropdown(false)
  }

  function handleCreate() {
    if (!canCreate) return
    const resolvedFunder = funderFieldValue.trim()
    const resolvedName = engagementName.trim() || resolvedFunder
    onCreate({ funderName: resolvedFunder, engagementName: resolvedName, status })
    resetAndClose()
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
      onClick={(e) => { if (e.target === e.currentTarget) resetAndClose() }}
    >
      <div
        style={{
          width: 480,
          backgroundColor: "#FFFFFF",
          borderRadius: 14,
          boxShadow: "0 16px 48px rgba(42,42,42,0.18)",
          display: "flex",
          flexDirection: "column",
          // overflow visible so the funder dropdown can escape the container
          overflow: "visible",
        }}
      >
        {/* Rounded top corners need clipping for header bg — apply per-section */}
        {/* Header */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "20px 24px 0",
            flexShrink: 0,
          }}
        >
          <h2
            style={{
              margin: 0,
              fontSize: 17,
              fontWeight: 600,
              color: "var(--ink)",
              fontFamily: "var(--font-lora)",
            }}
          >
            New engagement
          </h2>
          <button
            type="button"
            onClick={resetAndClose}
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
        </div>

        {/* Body */}
        <div style={{ padding: "20px 24px 0", flex: 1 }}>

          {/* ── Funder field ── */}
          <div style={{ marginBottom: 18 }}>
            <label style={labelStyle}>Funder</label>

            {lockedFunderName ? (
              /* Locked funder — pre-selected from context */
              <div
                style={{
                  ...inputStyle,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  backgroundColor: "var(--canvas)",
                  cursor: "default",
                }}
              >
                <span style={{ fontWeight: 500, color: "var(--ink)" }}>{lockedFunderName}</span>
                <span style={{ fontSize: 11, color: "var(--ink-tertiary)" }}>Pre-selected</span>
              </div>
            ) : manualMode ? (
              /* Manual entry mode */
              <div>
                <input
                  type="text"
                  value={manualFunderName}
                  onChange={(e) => setManualFunderName(e.target.value)}
                  placeholder="Enter funder name"
                  style={inputStyle}
                  autoFocus
                />
                <button
                  type="button"
                  onClick={() => {
                    setManualMode(false)
                    setManualFunderName("")
                  }}
                  style={{
                    marginTop: 6,
                    background: "none",
                    border: "none",
                    fontSize: 12,
                    color: "var(--slate-secondary)",
                    cursor: "pointer",
                    padding: 0,
                    display: "block",
                  }}
                >
                  ← Search funders
                </button>
              </div>
            ) : (
              /* Search mode */
              <div style={{ position: "relative" }}>
                {/* Search input */}
                <div style={{ position: "relative" }}>
                  <Search
                    size={13}
                    style={{
                      position: "absolute",
                      left: 10,
                      top: "50%",
                      transform: "translateY(-50%)",
                      color: "var(--ink-tertiary)",
                      pointerEvents: "none",
                    }}
                  />
                  <input
                    type="text"
                    value={funderQuery}
                    onChange={(e) => {
                      setFunderQuery(e.target.value)
                      setSelectedFunder(null)
                      setShowDropdown(true)
                    }}
                    onFocus={() => setShowDropdown(true)}
                    onBlur={() => {
                      blurTimer.current = setTimeout(() => setShowDropdown(false), 160)
                    }}
                    placeholder="Search funders..."
                    style={{ ...inputStyle, paddingLeft: 32 }}
                    autoFocus
                  />
                  {selectedFunder && (
                    <Check
                      size={13}
                      style={{
                        position: "absolute",
                        right: 10,
                        top: "50%",
                        transform: "translateY(-50%)",
                        color: "var(--evergreen)",
                        pointerEvents: "none",
                      }}
                    />
                  )}
                </div>

                {/* Dropdown */}
                {dropdownVisible && (
                  <div
                    style={{
                      position: "absolute",
                      top: "calc(100% + 4px)",
                      left: 0,
                      right: 0,
                      backgroundColor: "var(--surface-white)",
                      border: "1px solid var(--border-default)",
                      borderRadius: 9,
                      boxShadow: "0 6px 20px rgba(42,42,42,0.12)",
                      zIndex: 400,
                      overflow: "hidden",
                    }}
                  >
                    {results.length > 0 ? (
                      results.map((funder) => (
                        <button
                          key={funder.id}
                          type="button"
                          onMouseDown={() => pickFunder(funder)}
                          style={{
                            display: "flex",
                            alignItems: "center",
                            width: "100%",
                            padding: "10px 14px",
                            border: "none",
                            borderBottom: "1px solid var(--border-default)",
                            backgroundColor: "transparent",
                            cursor: "pointer",
                            textAlign: "left",
                            gap: 6,
                          }}
                          onMouseEnter={(e) => {
                            ;(e.currentTarget as HTMLButtonElement).style.backgroundColor = "var(--canvas)"
                          }}
                          onMouseLeave={(e) => {
                            ;(e.currentTarget as HTMLButtonElement).style.backgroundColor = "transparent"
                          }}
                        >
                          <span style={{ fontSize: 13, fontWeight: 500, color: "var(--ink)" }}>
                            {funder.name}
                          </span>
                          <span style={{ fontSize: 12, color: "var(--ink-tertiary)" }}>
                            · {funder.type}
                          </span>
                        </button>
                      ))
                    ) : (
                      <div style={{ padding: "10px 14px", borderBottom: "1px solid var(--border-default)" }}>
                        <span style={{ fontSize: 13, color: "var(--ink-tertiary)" }}>No funders found</span>
                      </div>
                    )}
                    {/* Manual fallback */}
                    <button
                      type="button"
                      onMouseDown={enterManualMode}
                      style={{
                        display: "block",
                        width: "100%",
                        padding: "10px 14px",
                        border: "none",
                        backgroundColor: "transparent",
                        cursor: "pointer",
                        textAlign: "left",
                        fontSize: 13,
                        fontWeight: 500,
                        color: "var(--slate-secondary)",
                      }}
                      onMouseEnter={(e) => {
                        ;(e.currentTarget as HTMLButtonElement).style.backgroundColor = "var(--canvas)"
                      }}
                      onMouseLeave={(e) => {
                        ;(e.currentTarget as HTMLButtonElement).style.backgroundColor = "transparent"
                      }}
                    >
                      + Add funder manually
                    </button>
                  </div>
                )}

                {/* Persistent manual link (when dropdown is closed and no funder selected) */}
                {!showDropdown && !selectedFunder && (
                  <button
                    type="button"
                    onClick={enterManualMode}
                    style={{
                      marginTop: 6,
                      background: "none",
                      border: "none",
                      fontSize: 12,
                      color: "var(--slate-secondary)",
                      cursor: "pointer",
                      padding: 0,
                      display: "block",
                    }}
                  >
                    + Add funder manually
                  </button>
                )}
              </div>
            )}
          </div>

          {/* ── Engagement name ── */}
          <div style={{ marginBottom: 18 }}>
            <label style={labelStyle}>Engagement name</label>
            <input
              type="text"
              value={engagementName}
              onChange={(e) => setEngagementName(e.target.value)}
              placeholder="e.g. Ford Foundation"
              style={inputStyle}
            />
          </div>

          {/* ── Status ── */}
          <div style={{ marginBottom: 24 }}>
            <label style={labelStyle}>Status</label>
            <div
              style={{
                display: "flex",
                borderRadius: 9,
                border: "1px solid var(--border-default)",
                overflow: "hidden",
              }}
            >
              {(["Active", "Lapsed", "Closed"] as NewEngagementStatus[]).map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setStatus(s)}
                  style={{
                    flex: 1,
                    padding: "8px 0",
                    border: "none",
                    backgroundColor: status === s ? "var(--slate-primary)" : "var(--canvas)",
                    color: status === s ? "#FFFFFF" : "var(--ink-secondary)",
                    fontSize: 12,
                    fontWeight: status === s ? 600 : 400,
                    cursor: "pointer",
                    transition: "background-color 150ms, color 150ms",
                  }}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            padding: "16px 24px 20px",
            borderTop: "1px solid var(--border-default)",
            flexShrink: 0,
            borderRadius: "0 0 14px 14px",
            backgroundColor: "#FFFFFF",
          }}
        >
          <GhostBtn onClick={resetAndClose}>Cancel</GhostBtn>
          <SlateBtn onClick={handleCreate} disabled={!canCreate}>
            Create engagement
          </SlateBtn>
        </div>
      </div>
    </div>
  )
}

// ── Shared button helpers ──────────────────────────────────────────────────

function GhostBtn({ children, onClick }: { children: React.ReactNode; onClick: () => void }) {
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
  disabled,
}: {
  children: React.ReactNode
  onClick: () => void
  disabled?: boolean
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      style={{
        padding: "8px 18px",
        borderRadius: 8,
        border: "none",
        backgroundColor: disabled ? "var(--slate-soft)" : "var(--slate-primary)",
        fontSize: 13,
        fontWeight: 500,
        color: disabled ? "rgba(255,255,255,0.6)" : "#FFFFFF",
        cursor: disabled ? "not-allowed" : "pointer",
        transition: "background-color 150ms",
      }}
      onMouseEnter={(e) => {
        if (!disabled) (e.currentTarget as HTMLButtonElement).style.backgroundColor = "#3A4F6A"
      }}
      onMouseLeave={(e) => {
        if (!disabled) (e.currentTarget as HTMLButtonElement).style.backgroundColor = "var(--slate-primary)"
      }}
    >
      {children}
    </button>
  )
}

// ── Style constants ────────────────────────────────────────────────────────

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
  fontFamily: "inherit",
}
