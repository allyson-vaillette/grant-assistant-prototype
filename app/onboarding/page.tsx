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
            <Step2 onFinish={finish} onSkip={finish} />
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

// ── Step 2 (stub) ─────────────────────────────────────────────────────────

function Step2({
  onFinish,
  onSkip,
}: {
  onFinish: () => void
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
      <div style={{ marginBottom: 40 }}>
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
          Coming up next.
        </p>
      </div>

      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
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
