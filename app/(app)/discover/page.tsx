"use client"

import React, { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { ChevronDown, ExternalLink, Plus, ThumbsDown } from "lucide-react"

// ── Types ──────────────────────────────────────────────────────────────────

type StatusType = "Applications open" | "Letters of inquiry open" | "Rolling deadline"
type MatchStrength = "Strong match" | "Good match" | "Partial match"

interface WhyMatch {
  icon: "check" | "warning"
  text: string
}

interface Initiative {
  name: string
  match: MatchStrength
}

interface Opportunity {
  id: string
  funder: string
  status: StatusType
  grantName: string
  meta: string
  initiativeTags: string[]
  matchLabel: string
  matchStrength: MatchStrength
  matchDots: number
  amountLabel: string
  dueDateLabel: string
  focusAreaLabel: string
  whyMatches: WhyMatch[]
  aboutGrant: string
  initiatives: Initiative[]
}

interface FilterState {
  focusAreas: Record<string, boolean>
  geography: Record<string, boolean>
  deadline: "next-6" | "next-12" | null
}

// ── Data ──────────────────────────────────────────────────────────────────

const OPPORTUNITIES: Opportunity[] = [
  {
    id: "petco-love",
    funder: "Petco Love",
    status: "Applications open",
    grantName: "Petco Love Lost & Found Grant 2026",
    meta: "Up to $50,000 · Due Aug 15, 2026 · Animal Welfare",
    initiativeTags: ["Rescue & Intake", "Foster Program"],
    matchLabel: "Strong match — focus areas, geography, and eligibility all align",
    matchStrength: "Strong match",
    matchDots: 5,
    amountLabel: "Up to $50,000",
    dueDateLabel: "Due Aug 15, 2026",
    focusAreaLabel: "Animal Welfare",
    whyMatches: [
      { icon: "check", text: "Focus areas align — Animal Welfare matches your Rescue & Intake and Foster Program initiatives" },
      { icon: "check", text: "Geography — Petco Love funds nationally, you serve California" },
      { icon: "check", text: "Eligibility — 501(c)(3) required, organization size fits grant range" },
      { icon: "warning", text: "Deadline pressure — application due in 93 days, you have no active proposal yet" },
    ],
    aboutGrant:
      "Petco Love Lost & Found grants support organizations working to reunite lost pets with their families. Funding prioritizes shelters and rescues with proven community impact in underserved areas, with preference for programs serving cats and dogs at scale.",
    initiatives: [
      { name: "Rescue & Intake", match: "Strong match" },
      { name: "Foster Program", match: "Strong match" },
    ],
  },
  {
    id: "aspca",
    funder: "ASPCA",
    status: "Applications open",
    grantName: "ASPCA Saving Lives Grant",
    meta: "Up to $75,000 · Due Sep 30, 2026 · Animal Welfare",
    initiativeTags: ["Rescue & Intake"],
    matchLabel: "Good match — strong focus area alignment",
    matchStrength: "Good match",
    matchDots: 4,
    amountLabel: "Up to $75,000",
    dueDateLabel: "Due Sep 30, 2026",
    focusAreaLabel: "Animal Welfare",
    whyMatches: [
      { icon: "check", text: "Focus areas align — Animal Welfare is a primary ASPCA funding priority" },
      { icon: "check", text: "Geography — ASPCA funds nationally, California orgs are eligible" },
      { icon: "check", text: "Eligibility — 501(c)(3) required, meets organization criteria" },
      { icon: "warning", text: "Deadline — application due in 138 days, early proposal recommended" },
    ],
    aboutGrant:
      "ASPCA Saving Lives grants fund shelters and rescue organizations focused on reducing euthanasia rates. Grants prioritize organizations with demonstrated data-driven intake reduction programs and strong community partnerships.",
    initiatives: [{ name: "Rescue & Intake", match: "Strong match" }],
  },
  {
    id: "ca-wellness",
    funder: "California Wellness Foundation",
    status: "Letters of inquiry open",
    grantName: "Advancing Wellness in Underserved Communities",
    meta: "$50,000–$200,000 · Due Jul 1, 2026 · Community Development, Health",
    initiativeTags: ["Foster Program", "Neutering"],
    matchLabel: "Partial match — geography aligns, focus areas partially overlap",
    matchStrength: "Partial match",
    matchDots: 3,
    amountLabel: "$50,000–$200,000",
    dueDateLabel: "Due Jul 1, 2026",
    focusAreaLabel: "Community Development",
    whyMatches: [
      { icon: "check", text: "Geography — California Wellness exclusively funds California-based organizations" },
      { icon: "check", text: "Community focus — underserved communities aligns with your service area" },
      { icon: "warning", text: "Focus area — health and wellness framing required; reframe animal welfare impact accordingly" },
      { icon: "warning", text: "LOI deadline — letters of inquiry due in 47 days" },
    ],
    aboutGrant:
      "California Wellness Foundation advances the health and wellness of Californians by making grants to nonprofits addressing the root causes of poor health in underserved communities. Animal welfare programs with strong community health components may be eligible.",
    initiatives: [
      { name: "Foster Program", match: "Good match" },
      { name: "Neutering", match: "Partial match" },
    ],
  },
  {
    id: "petsmart",
    funder: "PetSmart Charities",
    status: "Rolling deadline",
    grantName: "Saving Cats & Kittens Grant",
    meta: "$10,000–$100,000 · Rolling · Animal Welfare",
    initiativeTags: ["Rescue & Intake", "Foster Program"],
    matchLabel: "Good match — strong alignment with rescue programs",
    matchStrength: "Good match",
    matchDots: 4,
    amountLabel: "$10,000–$100,000",
    dueDateLabel: "Rolling",
    focusAreaLabel: "Animal Welfare",
    whyMatches: [
      { icon: "check", text: "Focus areas align — cat and kitten rescue directly matches Rescue & Intake initiative" },
      { icon: "check", text: "Geography — national funder, California orgs eligible" },
      { icon: "check", text: "Rolling deadline — apply anytime, no immediate deadline pressure" },
      { icon: "warning", text: "Cat-specific — program must demonstrate significant cat and kitten focus" },
    ],
    aboutGrant:
      "PetSmart Charities Saving Cats & Kittens grants support organizations running spay/neuter, foster, and rescue programs specifically for cats and kittens. Grants favor organizations with established trap-neuter-return programs and strong community partnerships.",
    initiatives: [
      { name: "Rescue & Intake", match: "Strong match" },
      { name: "Foster Program", match: "Good match" },
    ],
  },
]

const ENGAGEMENTS = [
  { id: "ford", name: "Ford Foundation", status: "Active" as const },
  { id: "petco", name: "Petco Love", status: "New" as const },
]

// ── Style constants ────────────────────────────────────────────────────────

const STATUS_STYLE: Record<StatusType, { bg: string; color: string }> = {
  "Applications open":       { bg: "var(--evergreen-tint)", color: "var(--evergreen)" },
  "Letters of inquiry open": { bg: "var(--amber-light)",    color: "var(--amber)"     },
  "Rolling deadline":        { bg: "var(--slate-tint)",     color: "var(--slate-secondary)" },
}

// ── Icon components ────────────────────────────────────────────────────────

function CheckCircle() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden style={{ flexShrink: 0, marginTop: 2 }}>
      <circle cx="7" cy="7" r="6.5" fill="var(--slate-tint)" stroke="var(--slate-secondary)" strokeWidth="0.75" />
      <path d="M4.5 7.2l1.7 1.7 3.3-3.3" stroke="var(--slate-secondary)" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function WarningCircle() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden style={{ flexShrink: 0, marginTop: 2 }}>
      <circle cx="7" cy="7" r="6.5" fill="var(--amber-light)" stroke="var(--amber)" strokeWidth="0.75" />
      <path d="M7 4.5v3" stroke="var(--amber)" strokeWidth="1.2" strokeLinecap="round" />
      <circle cx="7" cy="9.5" r="0.8" fill="var(--amber)" />
    </svg>
  )
}

function CheckboxIcon({ checked }: { checked: boolean }) {
  return (
    <div
      style={{
        width: 14,
        height: 14,
        borderRadius: 3,
        flexShrink: 0,
        backgroundColor: checked ? "var(--slate-primary)" : "transparent",
        border: `1.5px solid ${checked ? "var(--slate-primary)" : "var(--ink-tertiary)"}`,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        transition: "background-color 150ms, border-color 150ms",
      }}
    >
      {checked && (
        <svg width="8" height="8" viewBox="0 0 8 8" fill="none">
          <path d="M1.5 4.2l1.7 1.6L6.5 2" stroke="#fff" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      )}
    </div>
  )
}

function MatchDots({ filled }: { filled: number }) {
  return (
    <div style={{ display: "flex", gap: 3, alignItems: "center", flexShrink: 0 }}>
      {Array.from({ length: 5 }).map((_, i) => (
        <div
          key={i}
          style={{
            width: 8,
            height: 8,
            borderRadius: "50%",
            backgroundColor: i < filled ? "var(--slate-secondary)" : "var(--slate-light)",
            transition: "background-color 150ms",
          }}
        />
      ))}
    </div>
  )
}

// ── Opportunity Card ────────────────────────────────────────────────────────

function OpportunityCard({
  opp,
  isSelected,
  onClick,
  onHide,
}: {
  opp: Opportunity
  isSelected: boolean
  onClick: () => void
  onHide: () => void
}) {
  const statusStyle = STATUS_STYLE[opp.status]
  const matchColor =
    opp.matchStrength === "Partial match" ? "var(--slate)" : "var(--slate-secondary)"
  const showMatchLabel = opp.matchStrength === "Strong match"

  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        display: "flex",
        flexDirection: "column",
        gap: 8,
        width: "100%",
        padding: "14px 16px 14px 14px",
        borderRadius: 12,
        backgroundColor: "var(--surface)",
        border: isSelected
          ? `1.5px solid rgba(90,138,53,0.3)`
          : "1px solid var(--border-color)",
        borderLeft: isSelected ? "3px solid var(--slate-secondary)" : "3px solid transparent",
        boxShadow: isSelected
          ? "0px 2px 8px rgba(28,24,64,0.07)"
          : "0px 1px 3px rgba(28,24,64,0.04)",
        cursor: "pointer",
        textAlign: "left",
        transition: "border-color 150ms, box-shadow 150ms",
      }}
      onMouseEnter={(e) => {
        if (!isSelected) {
          const el = e.currentTarget as HTMLButtonElement
          el.style.boxShadow = "0px 2px 8px rgba(28,24,64,0.07)"
          el.style.borderColor = "rgba(90,138,53,0.2)"
        }
      }}
      onMouseLeave={(e) => {
        if (!isSelected) {
          const el = e.currentTarget as HTMLButtonElement
          el.style.boxShadow = "0px 1px 3px rgba(28,24,64,0.04)"
          el.style.borderColor = "var(--border-color)"
        }
      }}
    >
      {/* Funder + status */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
        <span style={{ fontSize: 12, fontWeight: 500, color: "var(--ink-secondary)", lineHeight: "16px" }}>
          {opp.funder}
        </span>
        <span
          style={{
            flexShrink: 0,
            borderRadius: "var(--radius-pill)",
            padding: "3px 9px",
            backgroundColor: statusStyle.bg,
            fontSize: 11,
            fontWeight: 500,
            color: statusStyle.color,
            letterSpacing: "0.02em",
            lineHeight: "14px",
          }}
        >
          {opp.status}
        </span>
      </div>

      {/* Grant name */}
      <div
        style={{
          fontSize: 14,
          fontWeight: 600,
          color: "var(--ink)",
          lineHeight: "18px",
          letterSpacing: "-0.01em",
        }}
      >
        {opp.grantName}
      </div>

      {/* Meta */}
      <div style={{ fontSize: 12, color: "var(--slate)", lineHeight: "16px" }}>{opp.meta}</div>

      {/* Tags + dots + match label */}
      <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
            {showMatchLabel && (
              <span
                style={{
                  fontSize: 10,
                  fontWeight: 600,
                  letterSpacing: "0.06em",
                  textTransform: "uppercase",
                  color: "var(--slate-secondary)",
                  lineHeight: "12px",
                }}
              >
                Matches your initiatives
              </span>
            )}
            {opp.initiativeTags.map((tag) => (
              <span
                key={tag}
                style={{
                  borderRadius: "var(--radius-pill)",
                  padding: "3px 9px",
                  backgroundColor: "var(--slate-tint)",
                  fontSize: 11,
                  fontWeight: 500,
                  color: "var(--slate-primary)",
                  lineHeight: "14px",
                }}
              >
                {tag}
              </span>
            ))}
          </div>
          <MatchDots filled={opp.matchDots} />
        </div>
        <div
          style={{
            fontSize: 12,
            color: matchColor,
            lineHeight: "16px",
            fontStyle: "italic",
          }}
        >
          {opp.matchLabel}
        </div>
      </div>

      {/* Hide action */}
      <div style={{ display: "flex", justifyContent: "flex-end" }}>
        <button
          type="button"
          onClick={(e) => { e.stopPropagation(); onHide() }}
          title="Hide this opportunity"
          style={{
            background: "none",
            border: "none",
            cursor: "pointer",
            padding: "2px 4px",
            borderRadius: 5,
            display: "flex",
            alignItems: "center",
            gap: 4,
            color: "var(--ink-tertiary)",
            fontSize: 11,
            transition: "color 150ms, background-color 150ms",
          }}
          onMouseEnter={(e) => {
            const el = e.currentTarget as HTMLButtonElement
            el.style.color = "#C0302A"
            el.style.backgroundColor = "#FEEAEA"
          }}
          onMouseLeave={(e) => {
            const el = e.currentTarget as HTMLButtonElement
            el.style.color = "var(--ink-tertiary)"
            el.style.backgroundColor = "transparent"
          }}
        >
          <ThumbsDown size={11} />
          <span>Not relevant</span>
        </button>
      </div>
    </button>
  )
}

// ── Track This Popover ─────────────────────────────────────────────────────

function TrackPopover({ onCancel, onSelect }: { onCancel: () => void; onSelect: () => void }) {
  return (
    <div
      style={{
        position: "absolute",
        bottom: "calc(100% + 8px)",
        left: 0,
        right: 0,
        backgroundColor: "var(--surface)",
        border: "1px solid var(--border-color)",
        borderRadius: "var(--radius-card)",
        boxShadow: "0px 8px 28px rgba(28,24,64,0.13)",
        padding: "16px",
        zIndex: 20,
      }}
    >
      <p style={{ fontSize: 14, fontWeight: 600, color: "var(--ink)", margin: "0 0 3px 0" }}>
        Add to engagement
      </p>
      <p style={{ fontSize: 12, color: "var(--ink-tertiary)", margin: "0 0 12px 0", lineHeight: "16px" }}>
        Select an existing engagement or create new
      </p>

      <div style={{ display: "flex", flexDirection: "column", gap: 2, marginBottom: 12 }}>
        {ENGAGEMENTS.map((eng) => (
          <div
            key={eng.id}
            onClick={onSelect}
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              padding: "9px 10px",
              borderRadius: "var(--radius-button)",
              cursor: "pointer",
              backgroundColor: "var(--canvas)",
            }}
          >
            <span style={{ fontSize: 13, fontWeight: 500, color: "var(--ink)" }}>{eng.name}</span>
            {eng.status === "New" ? (
              <span
                style={{
                  borderRadius: "var(--radius-pill)",
                  padding: "2px 8px",
                  backgroundColor: "var(--slate-tint)",
                  fontSize: 11,
                  fontWeight: 600,
                  color: "var(--slate-primary)",
                }}
              >
                New
              </span>
            ) : (
              <span style={{ fontSize: 12, color: "var(--slate)" }}>{eng.status}</span>
            )}
          </div>
        ))}

        <div
          style={{
            padding: "9px 10px",
            cursor: "pointer",
            fontSize: 13,
            fontWeight: 500,
            color: "var(--slate-secondary)",
          }}
        >
          + Create new engagement
        </div>
      </div>

      <button
        type="button"
        onClick={onCancel}
        style={{
          background: "none",
          border: "none",
          cursor: "pointer",
          fontSize: 13,
          color: "var(--slate)",
          padding: 0,
        }}
      >
        Cancel
      </button>
    </div>
  )
}

// ── Hide Modal ─────────────────────────────────────────────────────────────

function HideModal({ grantName, onCancel, onConfirm }: { grantName: string; onCancel: () => void; onConfirm: () => void }) {
  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        backgroundColor: "rgba(28,24,64,0.35)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 50,
      }}
      onClick={onCancel}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          backgroundColor: "#FFFFFF",
          borderRadius: 14,
          padding: "24px 28px",
          width: 360,
          boxShadow: "0px 16px 48px rgba(28,24,64,0.18)",
        }}
      >
        <h3 style={{ margin: "0 0 8px", fontSize: 16, fontWeight: 600, color: "var(--ink)", letterSpacing: "-0.01em" }}>
          Hide this opportunity?
        </h3>
        <p style={{ margin: "0 0 20px", fontSize: 13, color: "var(--ink-secondary)", lineHeight: "19px" }}>
          <strong style={{ color: "var(--ink)", fontWeight: 500 }}>{grantName}</strong> won&apos;t appear in your Discover feed.
        </p>
        <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
          <button
            type="button"
            onClick={onCancel}
            style={{
              padding: "8px 16px",
              borderRadius: "var(--radius-button)",
              border: "1px solid var(--border-color)",
              backgroundColor: "transparent",
              fontSize: 13,
              color: "var(--ink)",
              cursor: "pointer",
            }}
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            style={{
              padding: "8px 16px",
              borderRadius: "var(--radius-button)",
              border: "none",
              backgroundColor: "#C0302A",
              fontSize: 13,
              fontWeight: 600,
              color: "#FFFFFF",
              cursor: "pointer",
            }}
          >
            Hide opportunity
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Toast ───────────────────────────────────────────────────────────────────

function Toast({ message, onDismiss }: { message: string; onDismiss: () => void }) {
  useEffect(() => {
    const t = setTimeout(onDismiss, 3000)
    return () => clearTimeout(t)
  }, [onDismiss])

  return (
    <div
      style={{
        position: "fixed",
        bottom: 28,
        left: "50%",
        transform: "translateX(-50%)",
        backgroundColor: "var(--ink)",
        color: "#FFFFFF",
        borderRadius: 10,
        padding: "10px 20px",
        fontSize: 13,
        fontWeight: 500,
        boxShadow: "0px 6px 20px rgba(28,24,64,0.22)",
        zIndex: 60,
        whiteSpace: "nowrap",
        pointerEvents: "none",
      }}
    >
      {message}
    </div>
  )
}

// ── Detail Panel ───────────────────────────────────────────────────────────

function DetailPanel({
  opp,
  showPopover,
  onTrackClick,
  onCancelPopover,
  onSelectEngagement,
}: {
  opp: Opportunity
  showPopover: boolean
  onTrackClick: () => void
  onCancelPopover: () => void
  onSelectEngagement: () => void
}) {
  return (
    <div
      style={{
        width: 320,
        flexShrink: 0,
        display: "flex",
        flexDirection: "column",
        borderLeft: "1px solid var(--border-color)",
        backgroundColor: "var(--canvas)",
        position: "sticky",
        top: 44,
        height: "calc(100vh - 44px)",
        overflow: "hidden",
      }}
    >
      {/* Scrollable body */}
      <div
        style={{
          flex: 1,
          overflowY: "auto",
          padding: "20px 20px 0 20px",
          display: "flex",
          flexDirection: "column",
          gap: 14,
        }}
      >
        {/* Header: funder + title + meta tags */}
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 5, marginBottom: 6 }}>
            <span style={{ fontSize: 12, fontWeight: 500, color: "var(--ink-secondary)" }}>
              {opp.funder}
            </span>
            <ExternalLink size={11} color="var(--ink-tertiary)" />
          </div>
          <h3
            style={{
              margin: "0 0 10px 0",
              fontSize: 17,
              fontWeight: 600,
              letterSpacing: "-0.025em",
              lineHeight: "22px",
              color: "var(--ink)",
              fontFamily: "var(--font-lora)",
            }}
          >
            {opp.grantName}
          </h3>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
            {[opp.amountLabel, opp.dueDateLabel, opp.focusAreaLabel].map((label) => (
              <span
                key={label}
                style={{
                  borderRadius: "var(--radius-pill)",
                  padding: "4px 10px",
                  backgroundColor: "var(--slate-tint)",
                  fontSize: 12,
                  fontWeight: 500,
                  color: "var(--slate-primary)",
                  lineHeight: "16px",
                }}
              >
                {label}
              </span>
            ))}
          </div>
        </div>

        <div style={{ height: 1, backgroundColor: "var(--border-color)" }} />

        {/* Why this matches */}
        <div>
          <p style={sectionLabelStyle}>Why this matches you</p>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {opp.whyMatches.map((item, i) => (
              <div key={i} style={{ display: "flex", gap: 8, alignItems: "flex-start" }}>
                {item.icon === "check" ? <CheckCircle /> : <WarningCircle />}
                <span style={{ fontSize: 12, color: "var(--ink)", lineHeight: "18px" }}>{item.text}</span>
              </div>
            ))}
          </div>
        </div>

        <div style={{ height: 1, backgroundColor: "var(--border-color)" }} />

        {/* About this grant */}
        <div>
          <p style={sectionLabelStyle}>About this grant</p>
          <p style={{ fontSize: 12, color: "var(--ink)", lineHeight: "19px", margin: 0 }}>
            {opp.aboutGrant}
          </p>
        </div>

        <div style={{ height: 1, backgroundColor: "var(--border-color)" }} />

        {/* Your initiatives */}
        <div style={{ paddingBottom: 20 }}>
          <p style={sectionLabelStyle}>Your initiatives</p>
          <div>
            {opp.initiatives.map((init, i) => (
              <div
                key={i}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  padding: "9px 0",
                  borderBottom:
                    i < opp.initiatives.length - 1
                      ? "1px solid var(--border-color)"
                      : "none",
                }}
              >
                <span style={{ fontSize: 13, fontWeight: 500, color: "var(--ink)" }}>
                  {init.name}
                </span>
                <span
                  style={{
                    fontSize: 12,
                    color:
                      init.match === "Partial match"
                        ? "var(--slate)"
                        : "var(--slate-secondary)",
                  }}
                >
                  {init.match}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Sticky footer: Track This */}
      <div
        style={{
          flexShrink: 0,
          position: "relative",
          borderTop: "1px solid var(--border-color)",
          padding: "14px 20px",
          backgroundColor: "var(--canvas)",
        }}
      >
        {showPopover && <TrackPopover onCancel={onCancelPopover} onSelect={onSelectEngagement} />}

        <button
          type="button"
          onClick={onTrackClick}
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 8,
            width: "100%",
            height: 40,
            borderRadius: 10,
            backgroundColor: "var(--slate-primary)",
            border: "none",
            cursor: "pointer",
            marginBottom: 8,
            transition: "background-color 150ms",
          }}
          onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.backgroundColor = "#3A4F6A" }}
          onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.backgroundColor = "var(--slate-primary)" }}
        >
          <Plus size={15} color="#FFFFFF" style={{ flexShrink: 0 }} />
          <span style={{ fontSize: 14, fontWeight: 600, color: "#FFFFFF", lineHeight: "18px" }}>
            Track This
          </span>
        </button>

        <p
          style={{
            fontSize: 12,
            color: "var(--ink-tertiary)",
            textAlign: "center",
            margin: 0,
          }}
        >
          Already tracking a similar opportunity
        </p>
      </div>
    </div>
  )
}

// ── Filter Sidebar ─────────────────────────────────────────────────────────

function FilterSidebar({
  filters,
  onChange,
  onClear,
}: {
  filters: FilterState
  onChange: (next: FilterState) => void
  onClear: () => void
}) {
  const [openSections, setOpenSections] = useState({
    focusAreas: true,
    geography: true,
    fundingRange: true,
  })

  function toggleSection(key: keyof typeof openSections) {
    setOpenSections((s) => ({ ...s, [key]: !s[key] }))
  }

  function toggleFocus(key: string) {
    onChange({
      ...filters,
      focusAreas: { ...filters.focusAreas, [key]: !filters.focusAreas[key] },
    })
  }

  function toggleGeo(key: string) {
    onChange({
      ...filters,
      geography: { ...filters.geography, [key]: !filters.geography[key] },
    })
  }

  function setDeadline(val: FilterState["deadline"]) {
    onChange({ ...filters, deadline: filters.deadline === val ? null : val })
  }

  return (
    <aside
      style={{
        width: 268,
        flexShrink: 0,
        backgroundColor: "var(--canvas)",
        borderRight: "1px solid var(--border-color)",
        padding: "20px 16px",
        display: "flex",
        flexDirection: "column",
        gap: 20,
        position: "sticky",
        top: 44,
        height: "calc(100vh - 44px)",
        overflowY: "auto",
      }}
    >
      {/* Label */}
      <span
        style={{
          fontSize: 10,
          fontWeight: 600,
          letterSpacing: "0.08em",
          textTransform: "uppercase",
          color: "var(--ink-tertiary)",
        }}
      >
        Filters
      </span>

      {/* Focus Areas */}
      <div>
        <button
          type="button"
          onClick={() => toggleSection("focusAreas")}
          style={sectionToggleStyle}
        >
          <span style={{ fontSize: 13, fontWeight: 500, color: "var(--ink)" }}>Focus Areas</span>
          <ChevronDown
            size={12}
            color="var(--ink-tertiary)"
            style={{
              transform: openSections.focusAreas ? "rotate(0deg)" : "rotate(-90deg)",
              transition: "transform 150ms",
            }}
          />
        </button>
        {openSections.focusAreas && (
          <div style={{ marginTop: 8, display: "flex", flexDirection: "column", gap: 8 }}>
            {Object.entries(filters.focusAreas).map(([label, checked]) => (
              <button
                key={label}
                type="button"
                onClick={() => toggleFocus(label)}
                style={checkRowStyle}
              >
                <CheckboxIcon checked={checked} />
                <span style={{ fontSize: 13, color: "var(--ink)", lineHeight: "16px" }}>{label}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      <div style={{ height: 1, backgroundColor: "var(--border-color)" }} />

      {/* Geography */}
      <div>
        <button
          type="button"
          onClick={() => toggleSection("geography")}
          style={sectionToggleStyle}
        >
          <span style={{ fontSize: 13, fontWeight: 500, color: "var(--ink)" }}>Geography</span>
          <ChevronDown
            size={12}
            color="var(--ink-tertiary)"
            style={{
              transform: openSections.geography ? "rotate(0deg)" : "rotate(-90deg)",
              transition: "transform 150ms",
            }}
          />
        </button>
        {openSections.geography && (
          <div style={{ marginTop: 8, display: "flex", flexDirection: "column", gap: 8 }}>
            {Object.entries(filters.geography).map(([label, checked]) => (
              <button
                key={label}
                type="button"
                onClick={() => toggleGeo(label)}
                style={checkRowStyle}
              >
                <CheckboxIcon checked={checked} />
                <span style={{ fontSize: 13, color: "var(--ink)", lineHeight: "16px" }}>{label}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      <div style={{ height: 1, backgroundColor: "var(--border-color)" }} />

      {/* Funding Range */}
      <div>
        <button
          type="button"
          onClick={() => toggleSection("fundingRange")}
          style={sectionToggleStyle}
        >
          <span style={{ fontSize: 13, fontWeight: 500, color: "var(--ink)" }}>Funding Range</span>
          <ChevronDown
            size={12}
            color="var(--ink-tertiary)"
            style={{
              transform: openSections.fundingRange ? "rotate(0deg)" : "rotate(-90deg)",
              transition: "transform 150ms",
            }}
          />
        </button>
        {openSections.fundingRange && (
          <div style={{ marginTop: 10 }}>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                marginBottom: 6,
              }}
            >
              <span style={{ fontSize: 12, color: "var(--slate)" }}>$25,000</span>
              <span style={{ fontSize: 12, color: "var(--slate)" }}>$150,000</span>
            </div>
            <div style={{ position: "relative", height: 4, borderRadius: 2, backgroundColor: "var(--slate-light)" }}>
              <div
                style={{
                  position: "absolute",
                  left: 0,
                  width: "75%",
                  height: "100%",
                  borderRadius: 2,
                  backgroundColor: "var(--slate-primary)",
                }}
              />
              <div
                style={{
                  position: "absolute",
                  left: "calc(75% - 6px)",
                  top: -4,
                  width: 12,
                  height: 12,
                  borderRadius: "50%",
                  backgroundColor: "var(--slate-primary)",
                  border: "2px solid var(--surface)",
                  boxShadow: "0 1px 3px rgba(28,24,64,0.15)",
                }}
              />
            </div>
          </div>
        )}
      </div>

      <div style={{ height: 1, backgroundColor: "var(--border-color)" }} />

      {/* Deadline */}
      <div>
        <p style={{ fontSize: 13, fontWeight: 500, color: "var(--ink)", margin: "0 0 10px 0" }}>
          Deadline
        </p>
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          {(["next-6", "next-12"] as const).map((val) => {
            const isActive = filters.deadline === val
            const label = val === "next-6" ? "Next 6 months" : "Next 12 months"
            return (
              <button
                key={val}
                type="button"
                onClick={() => setDeadline(val)}
                style={{
                  borderRadius: "var(--radius-pill)",
                  padding: "6px 14px",
                  border: isActive ? "none" : "1px solid var(--border-color)",
                  backgroundColor: isActive ? "var(--slate-primary)" : "transparent",
                  fontSize: 12,
                  fontWeight: isActive ? 500 : 400,
                  color: isActive ? "#FFFFFF" : "var(--ink)",
                  cursor: "pointer",
                  textAlign: "left",
                  transition: "background-color 150ms, color 150ms",
                }}
              >
                {label}
              </button>
            )
          })}
        </div>
      </div>

      {/* Clear filters */}
      <button
        type="button"
        onClick={onClear}
        style={{
          background: "none",
          border: "none",
          padding: 0,
          cursor: "pointer",
          fontSize: 13,
          color: "var(--slate-secondary)",
          textAlign: "left",
          marginTop: "auto",
        }}
      >
        Clear filters
      </button>
    </aside>
  )
}

// ── Shared style objects ───────────────────────────────────────────────────

const sectionLabelStyle: React.CSSProperties = {
  fontSize: 10,
  fontWeight: 600,
  letterSpacing: "0.07em",
  textTransform: "uppercase",
  color: "var(--ink-tertiary)",
  margin: "0 0 10px 0",
}

const sectionToggleStyle: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  width: "100%",
  background: "none",
  border: "none",
  padding: 0,
  cursor: "pointer",
}

const checkRowStyle: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: 8,
  background: "none",
  border: "none",
  padding: 0,
  cursor: "pointer",
  textAlign: "left",
  width: "100%",
}

// ── Page ───────────────────────────────────────────────────────────────────

const DEFAULT_FILTERS: FilterState = {
  focusAreas: {
    "Animal Welfare": true,
    "Community Development": true,
    Education: false,
    Health: false,
    Environment: false,
  },
  geography: {
    California: true,
    National: true,
    International: false,
  },
  deadline: "next-6",
}

export default function OpportunitiesPage() {
  const router = useRouter()
  const [selectedId, setSelectedId] = useState("petco-love")
  const [showPopover, setShowPopover] = useState(false)
  const [filters, setFilters] = useState<FilterState>(DEFAULT_FILTERS)
  const [hiddenIds, setHiddenIds] = useState<Set<string>>(new Set())
  const [hideModalFor, setHideModalFor] = useState<string | null>(null)
  const [toast, setToast] = useState<string | null>(null)

  const visibleOpps = OPPORTUNITIES.filter((o) => !hiddenIds.has(o.id))
  const selected =
    visibleOpps.find((o) => o.id === selectedId) ??
    visibleOpps[0] ??
    OPPORTUNITIES[0]

  function handleCardClick(id: string) {
    setSelectedId(id)
    setShowPopover(false)
  }

  function handleSelectEngagement() {
    setShowPopover(false)
    setToast("Added to portfolio")
    router.push("/opportunity")
  }

  function handleHideConfirm() {
    if (!hideModalFor) return
    setHiddenIds((prev) => new Set(Array.from(prev).concat(hideModalFor)))
    if (selectedId === hideModalFor) {
      const next = visibleOpps.find((o) => o.id !== hideModalFor)
      if (next) setSelectedId(next.id)
    }
    setHideModalFor(null)
  }

  function handleClearFilters() {
    setFilters({
      focusAreas: Object.fromEntries(
        Object.keys(DEFAULT_FILTERS.focusAreas).map((k) => [k, false])
      ),
      geography: Object.fromEntries(
        Object.keys(DEFAULT_FILTERS.geography).map((k) => [k, false])
      ),
      deadline: null,
    })
  }

  return (
    <div className="flex flex-1" style={{ overflow: "hidden", minHeight: 0, backgroundColor: "#FFFFFF" }}>
      {/* ── Filter Sidebar ── */}
      <FilterSidebar
        filters={filters}
        onChange={setFilters}
        onClear={handleClearFilters}
      />

      {/* ── Center: results list ── */}
      <div
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
          borderRight: "1px solid var(--border-color)",
          backgroundColor: "#FFFFFF",
        }}
      >
        {/* Results header */}
        <div
          style={{
            flexShrink: 0,
            padding: "14px 20px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            backgroundColor: "#FFFFFF",
            borderBottom: "1px solid var(--border-color)",
          }}
        >
          <span style={{ fontSize: 13, color: "var(--ink-secondary)", lineHeight: "16px" }}>
            43 opportunities match your initiatives
          </span>
          <button
            type="button"
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              borderRadius: "var(--radius-button)",
              padding: "6px 12px",
              backgroundColor: "#FFFFFF",
              border: "1px solid var(--border-color)",
              fontSize: 13,
              color: "var(--ink)",
              cursor: "pointer",
              transition: "background-color 150ms",
            }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.backgroundColor = "var(--canvas)" }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.backgroundColor = "#FFFFFF" }}
          >
            <span>Sort: Relevance</span>
            <ChevronDown size={12} color="var(--ink-tertiary)" />
          </button>
        </div>

        {/* Cards */}
        <div
          style={{
            flex: 1,
            overflowY: "auto",
            padding: "16px 20px",
            display: "flex",
            flexDirection: "column",
            gap: 10,
          }}
        >
          {visibleOpps.map((opp) => (
            <OpportunityCard
              key={opp.id}
              opp={opp}
              isSelected={opp.id === selectedId}
              onClick={() => handleCardClick(opp.id)}
              onHide={() => setHideModalFor(opp.id)}
            />
          ))}
        </div>
      </div>

      {/* ── Detail Panel ── */}
      <DetailPanel
        opp={selected}
        showPopover={showPopover}
        onTrackClick={() => setShowPopover((v) => !v)}
        onCancelPopover={() => setShowPopover(false)}
        onSelectEngagement={handleSelectEngagement}
      />

      {/* ── Hide Modal ── */}
      {hideModalFor && (() => {
        const opp = OPPORTUNITIES.find((o) => o.id === hideModalFor)
        return opp ? (
          <HideModal
            grantName={opp.grantName}
            onCancel={() => setHideModalFor(null)}
            onConfirm={handleHideConfirm}
          />
        ) : null
      })()}

      {/* ── Toast ── */}
      {toast && <Toast message={toast} onDismiss={() => setToast(null)} />}
    </div>
  )
}
