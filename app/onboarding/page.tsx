"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"

type Fields = {
  orgName: string
  website: string
  ein: string
  location: string
}

export default function OnboardingPage() {
  const router = useRouter()
  const [step, setStep] = useState(1)
  const [fields, setFields] = useState<Fields>({
    orgName: "Whisker Haven Cat Rescue",
    website: "",
    ein: "",
    location: "",
  })

  function update(key: keyof Fields, value: string) {
    setFields(prev => ({ ...prev, [key]: value }))
  }

  function finish() {
    router.push("/discover")
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        backgroundColor: "var(--canvas)",
        display: "flex",
        flexDirection: "column",
      }}
    >
      {/* Header */}
      <header
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "16px 32px",
          borderBottom: "1px solid var(--hair)",
          backgroundColor: "var(--surface)",
          flexShrink: 0,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <div
            style={{
              width: 26,
              height: 26,
              borderRadius: 7,
              background: "var(--sidebar-gradient)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
            }}
          >
            <span style={{ fontSize: 11, fontWeight: 700, color: "#FFFFFF", lineHeight: 1 }}>G</span>
          </div>
          <span
            style={{
              fontSize: 14,
              fontWeight: 600,
              color: "var(--ink)",
              letterSpacing: "-0.01em",
              lineHeight: "18px",
            }}
          >
            Grant Assistant
          </span>
        </div>

        <Link
          href="/discover"
          style={{
            fontSize: 13,
            color: "var(--ink-secondary)",
            textDecoration: "none",
            fontWeight: 400,
          }}
          onMouseEnter={(e) => {
            ;(e.currentTarget as HTMLAnchorElement).style.textDecoration = "underline"
          }}
          onMouseLeave={(e) => {
            ;(e.currentTarget as HTMLAnchorElement).style.textDecoration = "none"
          }}
        >
          Skip for now
        </Link>
      </header>

      {/* Main content */}
      <div
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          padding: "48px 24px 64px",
        }}
      >
        <div style={{ width: "100%", maxWidth: 520 }}>
          {/* Progress indicator */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              marginBottom: 32,
            }}
          >
            <div
              style={{
                height: 3,
                flex: 1,
                borderRadius: 2,
                backgroundColor: step >= 1 ? "var(--slate-primary)" : "var(--hair-2)",
                transition: "background-color 200ms",
              }}
            />
            <div
              style={{
                height: 3,
                flex: 1,
                borderRadius: 2,
                backgroundColor: step >= 2 ? "var(--slate-primary)" : "var(--hair-2)",
                transition: "background-color 200ms",
              }}
            />
            <span
              style={{
                fontSize: 12,
                color: "var(--ink-tertiary)",
                lineHeight: "16px",
                flexShrink: 0,
                marginLeft: 4,
              }}
            >
              Step {step} of 2
            </span>
          </div>

          {/* Intro */}
          <div style={{ marginBottom: 32 }}>
            <h1
              style={{
                margin: "0 0 10px",
                fontSize: 26,
                fontWeight: 500,
                color: "var(--ink)",
                lineHeight: "32px",
                letterSpacing: "-0.02em",
                fontFamily: "var(--font-lora), Georgia, serif",
              }}
            >
              Let's get Whisker Haven Cat Rescue set up
            </h1>
            <p
              style={{
                margin: 0,
                fontSize: 14,
                color: "var(--ink-secondary)",
                lineHeight: "20px",
              }}
            >
              This takes a couple of minutes. Put in what you have, you can change anything later.
            </p>
          </div>

          {/* Step content */}
          {step === 1 ? (
            <Step1
              fields={fields}
              onChange={update}
              onContinue={() => setStep(2)}
              onSkip={() => setStep(2)}
            />
          ) : (
            <Step2 onFinish={finish} onSkip={finish} onBack={() => setStep(1)} />
          )}
        </div>
      </div>
    </div>
  )
}

// ── Step 1 ────────────────────────────────────────────────────────────────

function Step1({
  fields,
  onChange,
  onContinue,
  onSkip,
}: {
  fields: Fields
  onChange: (key: keyof Fields, value: string) => void
  onContinue: () => void
  onSkip: () => void
}) {
  return (
    <div
      style={{
        backgroundColor: "var(--surface)",
        border: "1px solid var(--hair)",
        borderRadius: 16,
        padding: 32,
        boxShadow: "var(--lift-2)",
      }}
    >
      <div style={{ marginBottom: 24 }}>
        <h2
          style={{
            margin: "0 0 6px",
            fontSize: 16,
            fontWeight: 600,
            color: "var(--ink)",
            lineHeight: "22px",
          }}
        >
          Tell us about your organization
        </h2>
        <p
          style={{
            margin: 0,
            fontSize: 13,
            color: "var(--ink-tertiary)",
            lineHeight: "18px",
          }}
        >
          The basics help us match you to the right funders. Skip anything you are not sure about.
        </p>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
        <FieldGroup label="Organization name">
          <input
            type="text"
            value={fields.orgName}
            onChange={(e) => onChange("orgName", e.target.value)}
            style={inputStyle}
          />
        </FieldGroup>

        <FieldGroup label="Website">
          <input
            type="text"
            value={fields.website}
            onChange={(e) => onChange("website", e.target.value)}
            placeholder="whiskerhaven.org"
            style={inputStyle}
          />
        </FieldGroup>

        <FieldGroup label="EIN" helper="Optional">
          <input
            type="text"
            value={fields.ein}
            onChange={(e) => onChange("ein", e.target.value)}
            placeholder="12-3456789"
            style={inputStyle}
          />
        </FieldGroup>

        <FieldGroup label="Location">
          <input
            type="text"
            value={fields.location}
            onChange={(e) => onChange("location", e.target.value)}
            placeholder="City, State"
            style={inputStyle}
          />
        </FieldGroup>
      </div>

      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: 32 }}>
        <button
          type="button"
          onClick={onSkip}
          style={skipLinkStyle}
          onMouseEnter={(e) => {
            ;(e.currentTarget as HTMLButtonElement).style.textDecoration = "underline"
          }}
          onMouseLeave={(e) => {
            ;(e.currentTarget as HTMLButtonElement).style.textDecoration = "none"
          }}
        >
          Skip this step
        </button>
        <button type="button" onClick={onContinue} style={primaryButtonStyle}>
          Continue
        </button>
      </div>
    </div>
  )
}

// ── Step 2 ────────────────────────────────────────────────────────────────

const SUGGESTED_AREAS = ["Animal Welfare", "Spay/Neuter", "Foster Care", "Rescue & Intake", "Community Cats"]

function Step2({
  onFinish,
  onSkip,
  onBack,
}: {
  onFinish: () => void
  onSkip: () => void
  onBack: () => void
}) {
  const [programAreas, setProgramAreas] = useState<string[]>([])
  const [programInput, setProgramInput] = useState("")
  const [whoServe, setWhoServe] = useState("")
  const [whereWork, setWhereWork] = useState("")
  const [budget, setBudget] = useState("")

  function addArea(value: string) {
    const trimmed = value.trim()
    if (trimmed && !programAreas.includes(trimmed)) {
      setProgramAreas(prev => [...prev, trimmed])
    }
  }

  function removeArea(area: string) {
    setProgramAreas(prev => prev.filter(a => a !== area))
  }

  function handleProgramKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault()
      addArea(programInput)
      setProgramInput("")
    }
  }

  function handleProgramChange(e: React.ChangeEvent<HTMLInputElement>) {
    const val = e.target.value
    // Auto-split on comma as user types
    if (val.endsWith(",")) {
      addArea(val.slice(0, -1))
      setProgramInput("")
    } else {
      setProgramInput(val)
    }
  }

  return (
    <div
      style={{
        backgroundColor: "var(--surface)",
        border: "1px solid var(--hair)",
        borderRadius: 16,
        padding: 32,
        boxShadow: "var(--lift-2)",
      }}
    >
      <div style={{ marginBottom: 24 }}>
        <h2
          style={{
            margin: "0 0 6px",
            fontSize: 16,
            fontWeight: 600,
            color: "var(--ink)",
            lineHeight: "22px",
          }}
        >
          Tell us about your work
        </h2>
        <p
          style={{
            margin: 0,
            fontSize: 13,
            color: "var(--ink-tertiary)",
            lineHeight: "18px",
          }}
        >
          This is what we use to find funding that fits. Add what you can.
        </p>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
        {/* Program areas */}
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          <div style={{ display: "flex", alignItems: "baseline", gap: 6 }}>
            <label style={{ fontSize: 13, fontWeight: 500, color: "var(--ink)", lineHeight: "16px" }}>
              Program areas
            </label>
            <span style={{ fontSize: 12, color: "var(--ink-tertiary)", lineHeight: "16px" }}>
              Type to add your own, or pick from the suggestions.
            </span>
          </div>

          {/* Tag input container */}
          <div
            style={{
              minHeight: 40,
              borderRadius: "var(--radius-input)",
              border: "1px solid var(--hair-2)",
              backgroundColor: "var(--surface)",
              padding: programAreas.length > 0 ? "6px 8px" : "0 12px",
              display: "flex",
              flexWrap: "wrap",
              alignItems: "center",
              gap: 6,
              cursor: "text",
              boxSizing: "border-box",
            }}
            onClick={(e) => {
              const input = (e.currentTarget as HTMLDivElement).querySelector("input")
              input?.focus()
            }}
          >
            {programAreas.map(area => (
              <span
                key={area}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 4,
                  height: 26,
                  paddingLeft: 10,
                  paddingRight: 6,
                  borderRadius: 6,
                  backgroundColor: "var(--slate-tint, color-mix(in srgb, var(--slate-primary) 12%, transparent))",
                  fontSize: 12,
                  fontWeight: 500,
                  color: "var(--slate-primary)",
                  whiteSpace: "nowrap",
                  flexShrink: 0,
                }}
              >
                {area}
                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); removeArea(area) }}
                  style={{
                    background: "none",
                    border: "none",
                    padding: 0,
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    color: "var(--slate-primary)",
                    opacity: 0.7,
                    lineHeight: 1,
                  }}
                  aria-label={`Remove ${area}`}
                >
                  <span className="material-symbols-outlined" style={{ fontSize: 14 }}>close</span>
                </button>
              </span>
            ))}
            <input
              type="text"
              value={programInput}
              onChange={handleProgramChange}
              onKeyDown={handleProgramKeyDown}
              placeholder={programAreas.length === 0 ? "e.g. Animal Welfare" : ""}
              style={{
                flex: 1,
                minWidth: 80,
                height: programAreas.length > 0 ? 26 : 38,
                border: "none",
                outline: "none",
                background: "transparent",
                fontSize: 14,
                color: "var(--ink)",
                padding: programAreas.length > 0 ? "0 4px" : "0",
                fontFamily: "var(--font-inter), system-ui, sans-serif",
              }}
            />
          </div>

          {/* Suggestion chips */}
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
            {SUGGESTED_AREAS.filter(s => !programAreas.includes(s)).map(s => (
              <button
                key={s}
                type="button"
                onClick={() => addArea(s)}
                style={{
                  height: 28,
                  paddingLeft: 10,
                  paddingRight: 10,
                  borderRadius: 6,
                  border: "1px solid var(--hair-2)",
                  backgroundColor: "var(--surface)",
                  fontSize: 12,
                  fontWeight: 400,
                  color: "var(--ink-secondary)",
                  cursor: "pointer",
                  fontFamily: "var(--font-inter), system-ui, sans-serif",
                  transition: "border-color 150ms, color 150ms",
                }}
                onMouseEnter={(e) => {
                  const el = e.currentTarget as HTMLButtonElement
                  el.style.borderColor = "var(--slate-primary)"
                  el.style.color = "var(--slate-primary)"
                }}
                onMouseLeave={(e) => {
                  const el = e.currentTarget as HTMLButtonElement
                  el.style.borderColor = "var(--hair-2)"
                  el.style.color = "var(--ink-secondary)"
                }}
              >
                {s}
              </button>
            ))}
          </div>
        </div>

        {/* Who you serve */}
        <FieldGroup label="Who you serve" helper="Optional. People, communities, or animals your work supports.">
          <input
            type="text"
            value={whoServe}
            onChange={(e) => setWhoServe(e.target.value)}
            style={inputStyle}
          />
        </FieldGroup>

        {/* Where you work */}
        <FieldGroup label="Where you work" helper="Optional.">
          <input
            type="text"
            value={whereWork}
            onChange={(e) => setWhereWork(e.target.value)}
            placeholder="City, state, or region"
            style={inputStyle}
          />
        </FieldGroup>

        {/* Annual budget */}
        <FieldGroup label="Annual budget" helper="Optional. A rough range is fine.">
          <select
            value={budget}
            onChange={(e) => setBudget(e.target.value)}
            style={{
              ...inputStyle,
              color: budget ? "var(--ink)" : "var(--ink-tertiary)",
              appearance: "none",
              backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='%231C2E26' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E")`,
              backgroundRepeat: "no-repeat",
              backgroundPosition: "right 12px center",
              paddingRight: 36,
            }}
          >
            <option value="" disabled>Select a range</option>
            <option value="under-100k">Under $100K</option>
            <option value="100k-500k">$100K to $500K</option>
            <option value="500k-1m">$500K to $1M</option>
            <option value="1m-5m">$1M to $5M</option>
            <option value="over-5m">Over $5M</option>
          </select>
        </FieldGroup>
      </div>

      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: 32 }}>
        <button
          type="button"
          onClick={onBack}
          style={skipLinkStyle}
          onMouseEnter={(e) => {
            ;(e.currentTarget as HTMLButtonElement).style.textDecoration = "underline"
          }}
          onMouseLeave={(e) => {
            ;(e.currentTarget as HTMLButtonElement).style.textDecoration = "none"
          }}
        >
          Back
        </button>
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <button
            type="button"
            onClick={onSkip}
            style={skipLinkStyle}
            onMouseEnter={(e) => {
              ;(e.currentTarget as HTMLButtonElement).style.textDecoration = "underline"
            }}
            onMouseLeave={(e) => {
              ;(e.currentTarget as HTMLButtonElement).style.textDecoration = "none"
            }}
          >
            Skip this step
          </button>
          <button type="button" onClick={onFinish} style={primaryButtonStyle}>
            Finish
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Field group ────────────────────────────────────────────────────────────

function FieldGroup({
  label,
  helper,
  children,
}: {
  label: string
  helper?: string
  children: React.ReactNode
}) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
      <div style={{ display: "flex", alignItems: "baseline", gap: 6 }}>
        <label
          style={{
            fontSize: 13,
            fontWeight: 500,
            color: "var(--ink)",
            lineHeight: "16px",
          }}
        >
          {label}
        </label>
        {helper && (
          <span style={{ fontSize: 12, color: "var(--ink-tertiary)", lineHeight: "16px" }}>
            {helper}
          </span>
        )}
      </div>
      {children}
    </div>
  )
}

// ── Shared styles ──────────────────────────────────────────────────────────

const inputStyle: React.CSSProperties = {
  width: "100%",
  height: 40,
  borderRadius: "var(--radius-input)",
  border: "1px solid var(--hair-2)",
  backgroundColor: "var(--surface)",
  padding: "0 12px",
  fontSize: 14,
  color: "var(--ink)",
  outline: "none",
  transition: "border-color 150ms",
  boxSizing: "border-box",
  fontFamily: "var(--font-inter), system-ui, sans-serif",
}

const primaryButtonStyle: React.CSSProperties = {
  height: 40,
  paddingLeft: 24,
  paddingRight: 24,
  borderRadius: "var(--radius-button)",
  backgroundColor: "var(--slate-primary)",
  color: "#FFFFFF",
  fontSize: 14,
  fontWeight: 600,
  border: "none",
  cursor: "pointer",
  lineHeight: "16px",
  fontFamily: "var(--font-inter), system-ui, sans-serif",
  transition: "opacity 150ms",
}

const skipLinkStyle: React.CSSProperties = {
  background: "none",
  border: "none",
  padding: 0,
  fontSize: 13,
  color: "var(--ink-tertiary)",
  cursor: "pointer",
  fontFamily: "var(--font-inter), system-ui, sans-serif",
  lineHeight: "16px",
}
