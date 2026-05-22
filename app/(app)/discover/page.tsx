"use client"

import React, { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { ChevronDown, ChevronLeft, ChevronRight, ExternalLink, Plus, SlidersHorizontal, ThumbsDown, X } from "lucide-react"
import { NewEngagementModal, type NewEngagementData } from "@/components/proposals/NewEngagementModal"
import { DISCOVER_FUNDERS, type DiscoverFunder } from "@/lib/funders"

// ── Types ──────────────────────────────────────────────────────────────────

type StatusType = "Applications open" | "Letters of inquiry open" | "Rolling deadline"
type MatchStrength = "Strong match" | "Good match" | "Partial match"
type ActiveTab = "opportunities" | "funders"

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

const FUNDER_TYPES = [
  "Private foundation",
  "Community foundation",
  "Government",
  "Corporate foundation",
  "Public charity",
] as const

type FunderTypeFilter = (typeof FUNDER_TYPES)[number]

interface CombinedFilterState {
  focusAreas: Record<string, boolean>
  geography: Record<string, boolean>
  // Opportunity-specific
  deadline: "next-6" | "next-12" | null
  // Funder-specific
  funderTypes: Record<FunderTypeFilter, boolean>
  acceptsUnsolicited: boolean
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
  isNotRelevant,
  onClick,
  onNotRelevant,
}: {
  opp: Opportunity
  isSelected: boolean
  isNotRelevant: boolean
  onClick: () => void
  onNotRelevant: () => void
}) {
  const [isHovered, setIsHovered] = useState(false)

  const statusStyle = STATUS_STYLE[opp.status]
  const matchColor =
    opp.matchStrength === "Partial match" ? "var(--slate)" : "var(--slate-secondary)"
  const showMatchLabel = opp.matchStrength === "Strong match"

  return (
    <button
      type="button"
      onClick={onClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{
        display: "flex",
        flexDirection: "column",
        gap: 8,
        width: "100%",
        padding: "14px 16px 14px 14px",
        borderRadius: 12,
        backgroundColor: "var(--surface)",
        border: isSelected
          ? "1.5px solid rgba(90,138,53,0.3)"
          : isHovered
          ? "1px solid rgba(90,138,53,0.2)"
          : "1px solid var(--border-default)",
        borderLeft: isSelected
          ? "3px solid var(--slate-secondary)"
          : "3px solid transparent",
        boxShadow:
          isSelected || isHovered
            ? "0px 2px 8px rgba(28,24,64,0.07)"
            : "0px 1px 3px rgba(28,24,64,0.04)",
        cursor: "pointer",
        textAlign: "left",
        transition: "border-color 150ms ease-in-out, box-shadow 150ms ease-in-out",
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

      {/* Not relevant */}
      <div style={{ display: "flex", justifyContent: "flex-end" }}>
        <button
          type="button"
          onClick={(e) => { e.stopPropagation(); onNotRelevant() }}
          title={isNotRelevant ? "Re-evaluate this opportunity" : "Mark as not relevant"}
          style={{
            background: "none",
            border: "none",
            cursor: "pointer",
            padding: "2px 4px",
            borderRadius: 5,
            display: "flex",
            alignItems: "center",
            gap: 4,
            color: isNotRelevant ? "var(--plum-soft)" : "var(--ink-tertiary)",
            fontSize: 11,
            transition: "color 150ms, background-color 150ms",
          }}
          onMouseEnter={(e) => {
            const el = e.currentTarget as HTMLButtonElement
            if (!isNotRelevant) {
              el.style.color = "#C0302A"
              el.style.backgroundColor = "#FEEAEA"
            }
          }}
          onMouseLeave={(e) => {
            const el = e.currentTarget as HTMLButtonElement
            el.style.color = isNotRelevant ? "var(--plum-soft)" : "var(--ink-tertiary)"
            el.style.backgroundColor = "transparent"
          }}
        >
          <ThumbsDown
            size={11}
            fill={isNotRelevant ? "var(--plum-soft)" : "none"}
            color={isNotRelevant ? "var(--plum-soft)" : "currentColor"}
          />
          <span>Not relevant</span>
        </button>
      </div>
    </button>
  )
}

// ── Funder Card ─────────────────────────────────────────────────────────────

function FunderCard({
  funder,
  isSelected,
  isNotRelevant,
  onClick,
  onNotRelevant,
}: {
  funder: DiscoverFunder
  isSelected: boolean
  isNotRelevant: boolean
  onClick: () => void
  onNotRelevant: () => void
}) {
  const [isHovered, setIsHovered] = useState(false)

  const matchColor =
    funder.matchStrength === "Partial match" ? "var(--slate)" : "var(--slate-secondary)"
  const showMatchLabel = funder.matchStrength === "Strong match"
  const matchedInitiatives = funder.initiatives.filter(
    (i) => i.match === "Strong match" || i.match === "Good match"
  )

  return (
    <button
      type="button"
      onClick={onClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{
        display: "flex",
        flexDirection: "column",
        gap: 8,
        width: "100%",
        padding: "14px 16px 14px 14px",
        borderRadius: 12,
        backgroundColor: "var(--surface)",
        border: isSelected
          ? "1.5px solid rgba(90,138,53,0.3)"
          : isHovered
          ? "1px solid rgba(90,138,53,0.2)"
          : "1px solid var(--border-default)",
        borderLeft: isSelected
          ? "3px solid var(--slate-secondary)"
          : "3px solid transparent",
        boxShadow:
          isSelected || isHovered
            ? "0px 2px 8px rgba(28,24,64,0.07)"
            : "0px 1px 3px rgba(28,24,64,0.04)",
        cursor: "pointer",
        textAlign: "left",
        transition: "border-color 150ms ease-in-out, box-shadow 150ms ease-in-out",
      }}
    >
      {/* Funder type chip + (no status equivalent — chip sits right) */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "flex-end" }}>
        <span
          style={{
            flexShrink: 0,
            borderRadius: "var(--radius-pill)",
            padding: "3px 9px",
            backgroundColor: "var(--slate-tint)",
            fontSize: 11,
            fontWeight: 500,
            color: "var(--slate-primary)",
            letterSpacing: "0.02em",
            lineHeight: "14px",
          }}
        >
          {funder.type}
        </span>
      </div>

      {/* Funder name (prominent) */}
      <div
        style={{
          fontSize: 14,
          fontWeight: 600,
          color: "var(--ink)",
          lineHeight: "18px",
          letterSpacing: "-0.01em",
        }}
      >
        {funder.name}
      </div>

      {/* Geography + funding range meta */}
      <div style={{ fontSize: 12, color: "var(--slate)", lineHeight: "16px" }}>
        {funder.geography} · {funder.fundingRange}
      </div>

      {/* Focus area chips */}
      <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
        {funder.focusAreas.slice(0, 3).map((area) => (
          <span
            key={area}
            style={{
              borderRadius: "var(--radius-pill)",
              padding: "3px 8px",
              backgroundColor: "var(--slate-tint)",
              fontSize: 11,
              fontWeight: 500,
              color: "var(--slate-primary)",
              lineHeight: "14px",
            }}
          >
            {area}
          </span>
        ))}
      </div>

      {/* Initiative match + dots */}
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
            {matchedInitiatives.slice(0, 2).map((init) => (
              <span
                key={init.name}
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
                {init.name}
              </span>
            ))}
          </div>
          <MatchDots filled={funder.matchDots} />
        </div>
        <div
          style={{
            fontSize: 12,
            color: matchColor,
            lineHeight: "16px",
            fontStyle: "italic",
          }}
        >
          {funder.matchLabel}
        </div>
      </div>

      {/* Not relevant */}
      <div style={{ display: "flex", justifyContent: "flex-end" }}>
        <button
          type="button"
          onClick={(e) => { e.stopPropagation(); onNotRelevant() }}
          title={isNotRelevant ? "Re-evaluate this funder" : "Mark as not relevant"}
          style={{
            background: "none",
            border: "none",
            cursor: "pointer",
            padding: "2px 4px",
            borderRadius: 5,
            display: "flex",
            alignItems: "center",
            gap: 4,
            color: isNotRelevant ? "var(--plum-soft)" : "var(--ink-tertiary)",
            fontSize: 11,
            transition: "color 150ms, background-color 150ms",
          }}
          onMouseEnter={(e) => {
            const el = e.currentTarget as HTMLButtonElement
            if (!isNotRelevant) {
              el.style.color = "#C0302A"
              el.style.backgroundColor = "#FEEAEA"
            }
          }}
          onMouseLeave={(e) => {
            const el = e.currentTarget as HTMLButtonElement
            el.style.color = isNotRelevant ? "var(--plum-soft)" : "var(--ink-tertiary)"
            el.style.backgroundColor = "transparent"
          }}
        >
          <ThumbsDown
            size={11}
            fill={isNotRelevant ? "var(--plum-soft)" : "none"}
            color={isNotRelevant ? "var(--plum-soft)" : "currentColor"}
          />
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
        backgroundColor: "#FFFFFF",
        border: "1px solid var(--border-default)",
        borderRadius: 12,
        boxShadow: "0 4px 16px rgba(0,0,0,0.12)",
        padding: "16px",
        zIndex: 30,
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

// ── Not Relevant Modal ─────────────────────────────────────────────────────

const NOT_RELEVANT_REASONS = [
  "Wrong location",
  "No longer open",
  "Invite only",
  "Doesn't match our initiatives",
  "Other",
] as const

type NotRelevantReason = (typeof NOT_RELEVANT_REASONS)[number]

function NotRelevantModal({
  onCancel,
  onConfirm,
}: {
  onCancel: () => void
  onConfirm: (reason: NotRelevantReason, otherText: string, removeFromList: boolean) => void
}) {
  const [selectedReason, setSelectedReason] = useState<NotRelevantReason | null>(null)
  const [otherText, setOtherText] = useState("")
  const [removeFromList, setRemoveFromList] = useState(true)

  const canSubmit = selectedReason !== null

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
          width: 420,
          boxShadow: "0px 16px 48px rgba(28,24,64,0.18)",
          display: "flex",
          flexDirection: "column",
          gap: 16,
        }}
      >
        {/* Header */}
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12 }}>
          <div>
            <h3 style={{ margin: "0 0 4px", fontSize: 16, fontWeight: 600, color: "var(--ink)", letterSpacing: "-0.01em" }}>
              Why isn&apos;t this a good fit?
            </h3>
            <p style={{ margin: 0, fontSize: 13, color: "var(--ink-secondary)", lineHeight: "18px" }}>
              Your feedback helps us surface better matches.
            </p>
          </div>
          <button
            type="button"
            onClick={onCancel}
            style={{
              background: "none",
              border: "none",
              cursor: "pointer",
              padding: 4,
              borderRadius: 6,
              color: "var(--ink-tertiary)",
              display: "flex",
              flexShrink: 0,
            }}
          >
            <X size={16} />
          </button>
        </div>

        {/* Reason list */}
        <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
          {NOT_RELEVANT_REASONS.map((reason) => {
            const isActive = selectedReason === reason
            return (
              <button
                key={reason}
                type="button"
                onClick={() => setSelectedReason(reason)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 12,
                  padding: "10px 12px",
                  borderRadius: 8,
                  border: isActive ? "1.5px solid var(--slate-secondary)" : "1.5px solid transparent",
                  backgroundColor: isActive ? "var(--slate-tint)" : "transparent",
                  cursor: "pointer",
                  textAlign: "left",
                  transition: "background-color 150ms, border-color 150ms",
                }}
              >
                <div
                  style={{
                    width: 16,
                    height: 16,
                    borderRadius: "50%",
                    border: isActive ? "none" : "1.5px solid var(--ink-tertiary)",
                    backgroundColor: isActive ? "var(--slate-secondary)" : "transparent",
                    flexShrink: 0,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    transition: "background-color 150ms",
                  }}
                >
                  {isActive && (
                    <div
                      style={{ width: 6, height: 6, borderRadius: "50%", backgroundColor: "#FFFFFF" }}
                    />
                  )}
                </div>
                <span style={{ fontSize: 13, color: "var(--ink)", lineHeight: "16px" }}>{reason}</span>
              </button>
            )
          })}
        </div>

        {/* Optional "Other" text input */}
        {selectedReason === "Other" && (
          <input
            type="text"
            value={otherText}
            onChange={(e) => setOtherText(e.target.value)}
            placeholder="Tell us more (optional)"
            style={{
              width: "100%",
              padding: "9px 12px",
              borderRadius: 8,
              border: "1px solid var(--border-color)",
              fontSize: 13,
              color: "var(--ink)",
              backgroundColor: "var(--canvas)",
              outline: "none",
              boxSizing: "border-box",
            }}
          />
        )}

        {/* Divider */}
        <div style={{ height: 1, backgroundColor: "var(--border-color)" }} />

        {/* Remove from list checkbox */}
        <div>
          <button
            type="button"
            onClick={() => setRemoveFromList((v) => !v)}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
              background: "none",
              border: "none",
              cursor: "pointer",
              padding: 0,
            }}
          >
            <CheckboxIcon checked={removeFromList} />
            <span style={{ fontSize: 13, fontWeight: 500, color: "var(--ink)" }}>Remove from my list</span>
          </button>
          <p style={{ margin: "6px 0 0 24px", fontSize: 12, color: "var(--ink-tertiary)", lineHeight: "16px" }}>
            You can always find this again in Discover.
          </p>
        </div>

        {/* Footer */}
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
            onClick={() => {
              if (selectedReason) onConfirm(selectedReason, otherText, removeFromList)
            }}
            disabled={!canSubmit}
            style={{
              padding: "8px 16px",
              borderRadius: "var(--radius-button)",
              border: "none",
              backgroundColor: canSubmit ? "var(--slate-primary)" : "var(--slate-tint)",
              fontSize: 13,
              fontWeight: 600,
              color: canSubmit ? "#FFFFFF" : "var(--ink-tertiary)",
              cursor: canSubmit ? "pointer" : "not-allowed",
              transition: "background-color 150ms, color 150ms",
            }}
          >
            Submit feedback
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

// ── View Toggle ─────────────────────────────────────────────────────────────

function ViewToggle({
  activeTab,
  onSwitch,
}: {
  activeTab: ActiveTab
  onSwitch: (tab: ActiveTab) => void
}) {
  return (
    <div
      style={{
        display: "flex",
        borderRadius: 9,
        border: "1px solid var(--border-default)",
        overflow: "hidden",
        width: "fit-content",
      }}
    >
      {(["opportunities", "funders"] as const).map((tab) => {
        const isActive = activeTab === tab
        return (
          <button
            key={tab}
            type="button"
            onClick={() => onSwitch(tab)}
            style={{
              padding: "7px 18px",
              border: "none",
              backgroundColor: isActive ? "var(--slate-primary)" : "transparent",
              color: isActive ? "#FFFFFF" : "var(--ink-secondary)",
              fontSize: 13,
              fontWeight: isActive ? 600 : 400,
              cursor: "pointer",
              transition: "background-color 150ms, color 150ms",
              whiteSpace: "nowrap",
            }}
          >
            {tab === "opportunities" ? "Opportunities" : "Funders"}
          </button>
        )
      })}
    </div>
  )
}

// ── Opportunity Detail Panel ────────────────────────────────────────────────

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
          onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.backgroundColor = "var(--slate-secondary)" }}
          onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.backgroundColor = "var(--slate-primary)" }}
        >
          <Plus size={15} color="#FFFFFF" style={{ flexShrink: 0 }} />
          <span style={{ fontSize: 14, fontWeight: 600, color: "#FFFFFF", lineHeight: "18px" }}>
            Track This
          </span>
        </button>

        <p style={{ fontSize: 12, color: "var(--ink-tertiary)", textAlign: "center", margin: 0 }}>
          Already tracking a similar opportunity
        </p>
      </div>
    </div>
  )
}

// ── Funder Detail Panel ─────────────────────────────────────────────────────

function FunderDetailPanel({
  funder,
  onCreateEngagement,
  onOpportunityClick,
}: {
  funder: DiscoverFunder
  onCreateEngagement: (funderName: string) => void
  onOpportunityClick: (oppId: string) => void
}) {
  const hasExistingEngagement = ENGAGEMENTS.some(
    (e) => e.name.toLowerCase() === funder.name.toLowerCase()
  )

  return (
    <div
      style={{
        width: 320,
        flexShrink: 0,
        display: "flex",
        flexDirection: "column",
        borderLeft: "1px solid var(--border-color)",
        backgroundColor: "var(--canvas)",
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
          minHeight: 0,
        }}
      >
        {/* Header */}
        <div>
          <a
            href={funder.website}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 5,
              textDecoration: "none",
              marginBottom: 8,
            }}
          >
            <h3
              style={{
                margin: 0,
                fontSize: 17,
                fontWeight: 600,
                letterSpacing: "-0.025em",
                lineHeight: "22px",
                color: "var(--ink)",
                fontFamily: "var(--font-lora)",
              }}
            >
              {funder.name}
            </h3>
            <ExternalLink size={13} color="var(--ink-tertiary)" style={{ flexShrink: 0 }} />
          </a>
          <div>
            <span
              style={{
                display: "inline-block",
                borderRadius: "var(--radius-pill)",
                padding: "4px 10px",
                backgroundColor: "var(--slate-tint)",
                fontSize: 12,
                fontWeight: 500,
                color: "var(--slate-primary)",
              }}
            >
              {funder.type}
            </span>
          </div>
        </div>

        <div style={{ height: 1, backgroundColor: "var(--border-color)" }} />

        {/* Details */}
        <div>
          <p style={sectionLabelStyle}>Focus areas</p>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 12 }}>
            {funder.focusAreas.map((area) => (
              <span
                key={area}
                style={{
                  borderRadius: "var(--radius-pill)",
                  padding: "4px 10px",
                  backgroundColor: "var(--slate-tint)",
                  fontSize: 12,
                  fontWeight: 500,
                  color: "var(--slate-primary)",
                }}
              >
                {area}
              </span>
            ))}
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
            {[
              { label: "Geography", value: funder.geography },
              { label: "Funding range", value: funder.fundingRange },
              { label: "Unsolicited applications", value: funder.acceptsUnsolicited ? "Yes" : "No" },
            ].map(({ label, value }) => (
              <div key={label} style={{ fontSize: 12, color: "var(--ink)", lineHeight: "16px" }}>
                <span style={{ color: "var(--ink-tertiary)", fontWeight: 500 }}>{label}: </span>
                {value}
              </div>
            ))}
          </div>
        </div>

        {/* Description */}
        <p style={{ fontSize: 12, color: "var(--ink)", lineHeight: "19px", margin: 0 }}>
          {funder.description}
        </p>

        <div style={{ height: 1, backgroundColor: "var(--border-color)" }} />

        {/* Why this matches */}
        <div>
          <p style={sectionLabelStyle}>Why this matches you</p>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {funder.whyMatches.map((item, i) => (
              <div key={i} style={{ display: "flex", gap: 8, alignItems: "flex-start" }}>
                {item.icon === "check" ? <CheckCircle /> : <WarningCircle />}
                <span style={{ fontSize: 12, color: "var(--ink)", lineHeight: "18px" }}>{item.text}</span>
              </div>
            ))}
          </div>
        </div>

        <div style={{ height: 1, backgroundColor: "var(--border-color)" }} />

        {/* Your initiatives */}
        <div>
          <p style={sectionLabelStyle}>Your initiatives</p>
          <div>
            {funder.initiatives.map((init, i) => (
              <div
                key={i}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  padding: "9px 0",
                  borderBottom:
                    i < funder.initiatives.length - 1
                      ? "1px solid var(--border-color)"
                      : "none",
                }}
              >
                <span style={{ fontSize: 13, fontWeight: 500, color: "var(--ink)" }}>{init.name}</span>
                <span
                  style={{
                    fontSize: 12,
                    color: init.match === "Partial match" ? "var(--slate)" : "var(--slate-secondary)",
                  }}
                >
                  {init.match}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Known opportunities */}
        {funder.knownOpportunities.length > 0 && (
          <>
            <div style={{ height: 1, backgroundColor: "var(--border-color)" }} />
            <div style={{ paddingBottom: 20 }}>
              <p style={sectionLabelStyle}>Open opportunities</p>
              <div>
                {funder.knownOpportunities.map((opp, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => onOpportunityClick(opp.id)}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      width: "100%",
                      padding: "8px 0",
                      background: "none",
                      border: "none",
                      borderBottom:
                        i < funder.knownOpportunities.length - 1
                          ? "1px solid var(--border-color)"
                          : "none",
                      cursor: "pointer",
                      textAlign: "left",
                      gap: 8,
                    }}
                    onMouseEnter={(e) => {
                      ;(e.currentTarget as HTMLButtonElement).style.opacity = "0.7"
                    }}
                    onMouseLeave={(e) => {
                      ;(e.currentTarget as HTMLButtonElement).style.opacity = "1"
                    }}
                  >
                    <span style={{ fontSize: 13, color: "var(--ink)", fontWeight: 500, lineHeight: "16px" }}>
                      {opp.name}
                    </span>
                    <span
                      style={{
                        flexShrink: 0,
                        borderRadius: "var(--radius-pill)",
                        padding: "2px 8px",
                        backgroundColor: "var(--slate-tint)",
                        fontSize: 11,
                        fontWeight: 500,
                        color: "var(--slate-primary)",
                      }}
                    >
                      {opp.deadline}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          </>
        )}
        {funder.knownOpportunities.length === 0 && <div style={{ paddingBottom: 8 }} />}
      </div>

      {/* Sticky footer: Create engagement */}
      <div
        style={{
          flexShrink: 0,
          borderTop: "1px solid var(--border-color)",
          padding: "14px 20px",
          backgroundColor: "var(--canvas)",
        }}
      >
        <button
          type="button"
          onClick={() => onCreateEngagement(funder.name)}
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
            marginBottom: hasExistingEngagement ? 8 : 0,
            transition: "background-color 150ms",
          }}
          onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.backgroundColor = "var(--slate-secondary)" }}
          onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.backgroundColor = "var(--slate-primary)" }}
        >
          <Plus size={15} color="#FFFFFF" style={{ flexShrink: 0 }} />
          <span style={{ fontSize: 14, fontWeight: 600, color: "#FFFFFF", lineHeight: "18px" }}>
            Create new engagement
          </span>
        </button>

        {hasExistingEngagement && (
          <p style={{ fontSize: 12, color: "var(--ink-tertiary)", textAlign: "center", margin: 0 }}>
            Already have an engagement with this funder
          </p>
        )}
      </div>
    </div>
  )
}

// ── Filter Sidebar ─────────────────────────────────────────────────────────

function FilterSidebar({
  activeTab,
  filters,
  onChange,
  onClear,
  collapsed,
  onToggleCollapse,
}: {
  activeTab: ActiveTab
  filters: CombinedFilterState
  onChange: (next: CombinedFilterState) => void
  onClear: () => void
  collapsed: boolean
  onToggleCollapse: () => void
}) {
  const [openSections, setOpenSections] = useState({
    focusAreas: true,
    geography: true,
    fundingRange: true,
    funderTypes: true,
  })

  function toggleSection(key: keyof typeof openSections) {
    setOpenSections((s) => ({ ...s, [key]: !s[key] }))
  }

  function toggleFocus(key: string) {
    onChange({ ...filters, focusAreas: { ...filters.focusAreas, [key]: !filters.focusAreas[key] } })
  }

  function toggleGeo(key: string) {
    onChange({ ...filters, geography: { ...filters.geography, [key]: !filters.geography[key] } })
  }

  function setDeadline(val: CombinedFilterState["deadline"]) {
    onChange({ ...filters, deadline: filters.deadline === val ? null : val })
  }

  function toggleFunderType(key: FunderTypeFilter) {
    onChange({ ...filters, funderTypes: { ...filters.funderTypes, [key]: !filters.funderTypes[key] } })
  }

  function toggleUnsolicited() {
    onChange({ ...filters, acceptsUnsolicited: !filters.acceptsUnsolicited })
  }

  const hasActiveFilters =
    Object.values(filters.focusAreas).some(Boolean) ||
    Object.values(filters.geography).some(Boolean) ||
    filters.deadline !== null ||
    Object.values(filters.funderTypes).some(Boolean) ||
    filters.acceptsUnsolicited

  return (
    <aside
      style={{
        width: collapsed ? 40 : 268,
        flexShrink: 0,
        backgroundColor: "var(--canvas)",
        borderRight: "1px solid var(--border-default)",
        display: "flex",
        flexDirection: "row",
        overflow: "hidden",
        transition: "width 200ms ease-in-out",
      }}
    >
      {/* Chevron strip */}
      <div
        style={{
          width: 40,
          flexShrink: 0,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          paddingTop: 18,
        }}
      >
        <button
          type="button"
          onClick={onToggleCollapse}
          title={collapsed ? "Expand filters" : "Collapse filters"}
          style={{
            background: "none",
            border: "none",
            cursor: "pointer",
            padding: 4,
            borderRadius: 6,
            color: "var(--ink-tertiary)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            transition: "color 150ms, background-color 150ms",
          }}
          onMouseEnter={(e) => {
            const el = e.currentTarget as HTMLButtonElement
            el.style.color = "var(--ink-secondary)"
            el.style.backgroundColor = "var(--slate-tint)"
          }}
          onMouseLeave={(e) => {
            const el = e.currentTarget as HTMLButtonElement
            el.style.color = "var(--ink-tertiary)"
            el.style.backgroundColor = "transparent"
          }}
        >
          {collapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
        </button>

        {collapsed && (
          <div style={{ position: "relative", marginTop: 8 }}>
            <SlidersHorizontal size={14} color="var(--ink-tertiary)" />
            {hasActiveFilters && (
              <div
                style={{
                  position: "absolute",
                  top: -2,
                  right: -2,
                  width: 5,
                  height: 5,
                  borderRadius: "50%",
                  backgroundColor: "var(--plum-primary)",
                  border: "1.5px solid var(--canvas)",
                }}
              />
            )}
          </div>
        )}
      </div>

      {/* Filter content */}
      <div
        style={{
          flex: 1,
          minWidth: 0,
          overflowY: "auto",
          overflowX: "hidden",
          display: "flex",
          flexDirection: "column",
        }}
      >
        <div style={{ padding: "20px 16px 12px 0", display: "flex", alignItems: "center" }}>
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
        </div>

        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 20,
            padding: "0 16px 20px 0",
            flex: 1,
          }}
        >
          {/* Focus Areas — shared */}
          <div>
            <button type="button" onClick={() => toggleSection("focusAreas")} style={sectionToggleStyle}>
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
                  <button key={label} type="button" onClick={() => toggleFocus(label)} style={checkRowStyle}>
                    <CheckboxIcon checked={checked} />
                    <span style={{ fontSize: 13, color: "var(--ink)", lineHeight: "16px" }}>{label}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          <div style={{ height: 1, backgroundColor: "var(--border-color)" }} />

          {/* Geography — shared */}
          <div>
            <button type="button" onClick={() => toggleSection("geography")} style={sectionToggleStyle}>
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
                  <button key={label} type="button" onClick={() => toggleGeo(label)} style={checkRowStyle}>
                    <CheckboxIcon checked={checked} />
                    <span style={{ fontSize: 13, color: "var(--ink)", lineHeight: "16px" }}>{label}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          <div style={{ height: 1, backgroundColor: "var(--border-color)" }} />

          {activeTab === "opportunities" ? (
            <>
              {/* Funding Range — opportunities */}
              <div>
                <button type="button" onClick={() => toggleSection("fundingRange")} style={sectionToggleStyle}>
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
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                      <span style={{ fontSize: 12, color: "var(--slate)" }}>$25,000</span>
                      <span style={{ fontSize: 12, color: "var(--slate)" }}>$150,000</span>
                    </div>
                    <div style={{ position: "relative", height: 4, borderRadius: 2, backgroundColor: "var(--slate-light)" }}>
                      <div style={{ position: "absolute", left: 0, width: "75%", height: "100%", borderRadius: 2, backgroundColor: "var(--slate-primary)" }} />
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

              {/* Deadline — opportunities only */}
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
            </>
          ) : (
            <>
              {/* Funder Type — funders only */}
              <div>
                <button type="button" onClick={() => toggleSection("funderTypes")} style={sectionToggleStyle}>
                  <span style={{ fontSize: 13, fontWeight: 500, color: "var(--ink)" }}>Funder Type</span>
                  <ChevronDown
                    size={12}
                    color="var(--ink-tertiary)"
                    style={{
                      transform: openSections.funderTypes ? "rotate(0deg)" : "rotate(-90deg)",
                      transition: "transform 150ms",
                    }}
                  />
                </button>
                {openSections.funderTypes && (
                  <div style={{ marginTop: 8, display: "flex", flexDirection: "column", gap: 8 }}>
                    {FUNDER_TYPES.map((ft) => (
                      <button key={ft} type="button" onClick={() => toggleFunderType(ft)} style={checkRowStyle}>
                        <CheckboxIcon checked={filters.funderTypes[ft] ?? false} />
                        <span style={{ fontSize: 13, color: "var(--ink)", lineHeight: "16px" }}>{ft}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <div style={{ height: 1, backgroundColor: "var(--border-color)" }} />

              {/* Funding Range — funders */}
              <div>
                <button type="button" onClick={() => toggleSection("fundingRange")} style={sectionToggleStyle}>
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
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                      <span style={{ fontSize: 12, color: "var(--slate)" }}>$10,000</span>
                      <span style={{ fontSize: 12, color: "var(--slate)" }}>$200,000</span>
                    </div>
                    <div style={{ position: "relative", height: 4, borderRadius: 2, backgroundColor: "var(--slate-light)" }}>
                      <div style={{ position: "absolute", left: 0, width: "80%", height: "100%", borderRadius: 2, backgroundColor: "var(--slate-primary)" }} />
                      <div
                        style={{
                          position: "absolute",
                          left: "calc(80% - 6px)",
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

              {/* Accepts unsolicited — funders only */}
              <div>
                <p style={{ fontSize: 13, fontWeight: 500, color: "var(--ink)", margin: "0 0 10px 0" }}>
                  Application
                </p>
                <button type="button" onClick={toggleUnsolicited} style={checkRowStyle}>
                  <CheckboxIcon checked={filters.acceptsUnsolicited} />
                  <span style={{ fontSize: 13, color: "var(--ink)", lineHeight: "16px" }}>
                    Accepts unsolicited
                  </span>
                </button>
              </div>
            </>
          )}

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
        </div>
      </div>
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

// ── Default filter state ───────────────────────────────────────────────────

const DEFAULT_COMBINED_FILTERS: CombinedFilterState = {
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
  funderTypes: {
    "Private foundation": false,
    "Community foundation": false,
    Government: false,
    "Corporate foundation": false,
    "Public charity": false,
  },
  acceptsUnsolicited: false,
}

// ── Page ───────────────────────────────────────────────────────────────────

export default function DiscoverPage() {
  const router = useRouter()

  // Tab
  const [activeTab, setActiveTab] = useState<ActiveTab>("opportunities")

  // Opportunities state
  const [selectedId, setSelectedId] = useState("petco-love")
  const [showPopover, setShowPopover] = useState(false)
  const [hiddenOppIds, setHiddenOppIds] = useState<Set<string>>(new Set())
  const [dismissingOppIds, setDismissingOppIds] = useState<Set<string>>(new Set())
  const [notRelevantOppModalFor, setNotRelevantOppModalFor] = useState<string | null>(null)
  const [notRelevantOppIds, setNotRelevantOppIds] = useState<Set<string>>(new Set())

  // Funders state
  const [selectedFunderId, setSelectedFunderId] = useState<string>(DISCOVER_FUNDERS[0]?.id ?? "")
  const [hiddenFunderIds, setHiddenFunderIds] = useState<Set<string>>(new Set())
  const [dismissingFunderIds, setDismissingFunderIds] = useState<Set<string>>(new Set())
  const [notRelevantFunderModalFor, setNotRelevantFunderModalFor] = useState<string | null>(null)
  const [notRelevantFunderIds, setNotRelevantFunderIds] = useState<Set<string>>(new Set())

  // Shared / layout state
  const [filters, setFilters] = useState<CombinedFilterState>(DEFAULT_COMBINED_FILTERS)
  const [toast, setToast] = useState<string | null>(null)
  const [filterCollapsed, setFilterCollapsed] = useState(false)

  // Engagement modal
  const [showEngagementModal, setShowEngagementModal] = useState(false)
  const [engagementModalFunderName, setEngagementModalFunderName] = useState("")

  useEffect(() => {
    const stored = localStorage.getItem("discover-filter-collapsed")
    if (stored !== null) setFilterCollapsed(stored === "true")
  }, [])

  function handleToggleFilter() {
    setFilterCollapsed((v) => {
      const next = !v
      localStorage.setItem("discover-filter-collapsed", String(next))
      return next
    })
  }

  const visibleOpps = OPPORTUNITIES.filter((o) => !hiddenOppIds.has(o.id))
  const visibleFunders = DISCOVER_FUNDERS.filter((f) => !hiddenFunderIds.has(f.id))

  const selectedOpp =
    visibleOpps.find((o) => o.id === selectedId) ??
    visibleOpps[0] ??
    OPPORTUNITIES[0]

  const selectedFunder =
    visibleFunders.find((f) => f.id === selectedFunderId) ??
    visibleFunders[0] ??
    DISCOVER_FUNDERS[0]

  function handleTabSwitch(tab: ActiveTab) {
    if (tab === activeTab) return
    setActiveTab(tab)
    setShowPopover(false)
    // Reset right panel to first card of the new tab
    if (tab === "funders") {
      const first = DISCOVER_FUNDERS.find((f) => !hiddenFunderIds.has(f.id))
      if (first) setSelectedFunderId(first.id)
    } else {
      const first = OPPORTUNITIES.find((o) => !hiddenOppIds.has(o.id))
      if (first) setSelectedId(first.id)
    }
  }

  // ── Opportunity handlers ──

  function handleOppCardClick(id: string) {
    setSelectedId(id)
    setShowPopover(false)
  }

  function handleSelectEngagement() {
    setShowPopover(false)
    setToast("Added to portfolio")
    router.push("/opportunity/equitable-futures")
  }

  function handleOppNotRelevantConfirm(
    _reason: NotRelevantReason,
    _otherText: string,
    removeFromList: boolean,
  ) {
    const id = notRelevantOppModalFor
    if (!id) return

    if (removeFromList) {
      setDismissingOppIds((prev) => new Set(Array.from(prev).concat(id)))
      setTimeout(() => {
        setHiddenOppIds((prev) => new Set(Array.from(prev).concat(id)))
        setDismissingOppIds((prev) => {
          const next = new Set(Array.from(prev))
          next.delete(id)
          return next
        })
        if (selectedId === id) {
          const next = visibleOpps.find((o) => o.id !== id)
          if (next) setSelectedId(next.id)
        }
      }, 220)
    } else {
      setNotRelevantOppIds((prev) => new Set(Array.from(prev).concat(id)))
    }

    setNotRelevantOppModalFor(null)
  }

  // ── Funder handlers ──

  function handleFunderCardClick(id: string) {
    setSelectedFunderId(id)
  }

  function handleFunderNotRelevantConfirm(
    _reason: NotRelevantReason,
    _otherText: string,
    removeFromList: boolean,
  ) {
    const id = notRelevantFunderModalFor
    if (!id) return

    if (removeFromList) {
      setDismissingFunderIds((prev) => new Set(Array.from(prev).concat(id)))
      setTimeout(() => {
        setHiddenFunderIds((prev) => new Set(Array.from(prev).concat(id)))
        setDismissingFunderIds((prev) => {
          const next = new Set(Array.from(prev))
          next.delete(id)
          return next
        })
        if (selectedFunderId === id) {
          const next = visibleFunders.find((f) => f.id !== id)
          if (next) setSelectedFunderId(next.id)
        }
      }, 220)
    } else {
      setNotRelevantFunderIds((prev) => new Set(Array.from(prev).concat(id)))
    }

    setNotRelevantFunderModalFor(null)
  }

  function handleOpportunityClickFromFunderPanel(oppId: string) {
    setActiveTab("opportunities")
    if (oppId && OPPORTUNITIES.some((o) => o.id === oppId)) {
      setSelectedId(oppId)
    } else {
      const first = OPPORTUNITIES.find((o) => !hiddenOppIds.has(o.id))
      if (first) setSelectedId(first.id)
    }
  }

  function handleCreateEngagement(funderName: string) {
    setEngagementModalFunderName(funderName)
    setShowEngagementModal(true)
  }

  function handleEngagementCreated(_data: NewEngagementData) { // eslint-disable-line @typescript-eslint/no-unused-vars
    setToast("Engagement created")
  }

  // ── Clear filters ──

  function handleClearFilters() {
    setFilters({
      focusAreas: Object.fromEntries(
        Object.keys(DEFAULT_COMBINED_FILTERS.focusAreas).map((k) => [k, false])
      ),
      geography: Object.fromEntries(
        Object.keys(DEFAULT_COMBINED_FILTERS.geography).map((k) => [k, false])
      ),
      deadline: null,
      funderTypes: Object.fromEntries(
        FUNDER_TYPES.map((k) => [k, false])
      ) as Record<FunderTypeFilter, boolean>,
      acceptsUnsolicited: false,
    })
  }

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        flex: 1,
        overflow: "hidden",
        minHeight: 0,
        backgroundColor: "#FFFFFF",
      }}
    >
      {/* ── View Toggle Header ── */}
      <div
        style={{
          flexShrink: 0,
          padding: "10px 20px",
          borderBottom: "1px solid var(--border-color)",
          backgroundColor: "#FFFFFF",
          display: "flex",
          alignItems: "center",
        }}
      >
        <ViewToggle activeTab={activeTab} onSwitch={handleTabSwitch} />
      </div>

      {/* ── Three-column layout ── */}
      <div
        style={{
          flex: 1,
          display: "flex",
          overflow: "hidden",
          minHeight: 0,
        }}
      >
        {/* Filter Sidebar */}
        <FilterSidebar
          activeTab={activeTab}
          filters={filters}
          onChange={setFilters}
          onClear={handleClearFilters}
          collapsed={filterCollapsed}
          onToggleCollapse={handleToggleFilter}
        />

        {/* Center: results list */}
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
              {activeTab === "opportunities"
                ? `${visibleOpps.length} opportunities matching your initiatives`
                : `${visibleFunders.length} funders matching your initiatives`}
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
            {activeTab === "opportunities"
              ? visibleOpps.map((opp) => {
                  const isDismissing = dismissingOppIds.has(opp.id)
                  return (
                    <div
                      key={opp.id}
                      style={{
                        opacity: isDismissing ? 0 : 1,
                        maxHeight: isDismissing ? 0 : "2000px",
                        overflow: isDismissing ? "hidden" : "visible",
                        transition: "opacity 200ms ease-in-out, max-height 200ms ease-in-out",
                      }}
                    >
                      <OpportunityCard
                        opp={opp}
                        isSelected={opp.id === selectedId}
                        isNotRelevant={notRelevantOppIds.has(opp.id)}
                        onClick={() => handleOppCardClick(opp.id)}
                        onNotRelevant={() => setNotRelevantOppModalFor(opp.id)}
                      />
                    </div>
                  )
                })
              : visibleFunders.map((funder) => {
                  const isDismissing = dismissingFunderIds.has(funder.id)
                  return (
                    <div
                      key={funder.id}
                      style={{
                        opacity: isDismissing ? 0 : 1,
                        maxHeight: isDismissing ? 0 : "2000px",
                        overflow: isDismissing ? "hidden" : "visible",
                        transition: "opacity 200ms ease-in-out, max-height 200ms ease-in-out",
                      }}
                    >
                      <FunderCard
                        funder={funder}
                        isSelected={funder.id === selectedFunderId}
                        isNotRelevant={notRelevantFunderIds.has(funder.id)}
                        onClick={() => handleFunderCardClick(funder.id)}
                        onNotRelevant={() => setNotRelevantFunderModalFor(funder.id)}
                      />
                    </div>
                  )
                })}
          </div>
        </div>

        {/* Right panel */}
        {activeTab === "opportunities" ? (
          <DetailPanel
            opp={selectedOpp}
            showPopover={showPopover}
            onTrackClick={() => setShowPopover((v) => !v)}
            onCancelPopover={() => setShowPopover(false)}
            onSelectEngagement={handleSelectEngagement}
          />
        ) : (
          <FunderDetailPanel
            funder={selectedFunder}
            onCreateEngagement={handleCreateEngagement}
            onOpportunityClick={handleOpportunityClickFromFunderPanel}
          />
        )}
      </div>

      {/* ── Not Relevant Modals ── */}
      {notRelevantOppModalFor && (
        <NotRelevantModal
          onCancel={() => setNotRelevantOppModalFor(null)}
          onConfirm={handleOppNotRelevantConfirm}
        />
      )}
      {notRelevantFunderModalFor && (
        <NotRelevantModal
          onCancel={() => setNotRelevantFunderModalFor(null)}
          onConfirm={handleFunderNotRelevantConfirm}
        />
      )}

      {/* ── New Engagement Modal ── */}
      <NewEngagementModal
        open={showEngagementModal}
        onClose={() => setShowEngagementModal(false)}
        onCreate={handleEngagementCreated}
        lockedFunderName={engagementModalFunderName}
      />

      {/* ── Toast ── */}
      {toast && <Toast message={toast} onDismiss={() => setToast(null)} />}
    </div>
  )
}
