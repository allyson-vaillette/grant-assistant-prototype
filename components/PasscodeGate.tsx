"use client"

import { useEffect, useRef, useState } from "react"

const PASSCODE = "cookies2026"
const STORAGE_KEY = "prototype-access"

export function PasscodeGate({ children }: { children: React.ReactNode }) {
  // null = loading (localStorage not yet checked), false = locked, true = granted
  const [access, setAccess] = useState<boolean | null>(null)
  const [value, setValue] = useState("")
  const [error, setError] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY)
    setAccess(stored === "granted")
  }, [])

  useEffect(() => {
    if (access === false) {
      inputRef.current?.focus()
    }
  }, [access])

  function submit() {
    if (value === PASSCODE) {
      localStorage.setItem(STORAGE_KEY, "granted")
      setAccess(true)
    } else {
      setError(true)
      setValue("")
      inputRef.current?.focus()
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter") submit()
    if (error) setError(false)
  }

  // Loading — blank canvas screen to avoid content flash
  if (access === null) {
    return (
      <div style={{ position: "fixed", inset: 0, backgroundColor: "var(--canvas)" }} />
    )
  }

  if (access === true) return <>{children}</>

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        backgroundColor: "var(--canvas)",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 9999,
        padding: "24px",
      }}
    >
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 24,
          width: "100%",
          maxWidth: 360,
        }}
      >
        {/* Logo mark */}
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div
            style={{
              width: 32,
              height: 32,
              borderRadius: 7,
              background: "var(--slate-primary)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
            }}
          >
            <span style={{ fontSize: 13, fontWeight: 700, color: "#FFFFFF", lineHeight: 1 }}>G</span>
          </div>
          <span
            style={{
              fontSize: 15,
              fontWeight: 600,
              color: "var(--ink)",
              fontFamily: "var(--font-inter), system-ui, sans-serif",
              letterSpacing: "-0.01em",
            }}
          >
            Grant Assistant
          </span>
        </div>

        {/* Heading + subtext */}
        <div style={{ textAlign: "center" }}>
          <h1
            style={{
              fontFamily: "var(--font-lora), Georgia, serif",
              fontSize: 26,
              fontWeight: 500,
              color: "var(--ink)",
              margin: "0 0 10px 0",
              lineHeight: 1.25,
            }}
          >
            Welcome to Grant Assistant 2.0
          </h1>
          <p
            style={{
              fontFamily: "var(--font-inter), system-ui, sans-serif",
              fontSize: 15,
              color: "var(--ink-secondary)",
              margin: 0,
              lineHeight: 1.5,
            }}
          >
            This is an early prototype. Enter the access code to continue.
          </p>
        </div>

        {/* Input + button */}
        <div style={{ display: "flex", flexDirection: "column", gap: 10, width: 280 }}>
          <input
            ref={inputRef}
            type="password"
            placeholder="Access code"
            value={value}
            onChange={(e) => {
              setValue(e.target.value)
              if (error) setError(false)
            }}
            onKeyDown={handleKeyDown}
            style={{
              width: "100%",
              padding: "10px 14px",
              fontSize: 15,
              fontFamily: "var(--font-inter), system-ui, sans-serif",
              color: "var(--ink)",
              backgroundColor: "var(--surface-white)",
              border: `1.5px solid ${error ? "var(--error)" : "var(--border-default)"}`,
              borderRadius: "var(--radius-input)",
              outline: "none",
              boxSizing: "border-box",
              transition: "border-color 150ms",
            }}
          />

          <button
            onClick={submit}
            style={{
              width: "100%",
              padding: "10px 14px",
              fontSize: 15,
              fontWeight: 600,
              fontFamily: "var(--font-inter), system-ui, sans-serif",
              color: "#FFFFFF",
              backgroundColor: "var(--slate-primary)",
              border: "none",
              borderRadius: "var(--radius-button)",
              cursor: "pointer",
              transition: "opacity 150ms",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.opacity = "0.88")}
            onMouseLeave={(e) => (e.currentTarget.style.opacity = "1")}
          >
            Enter
          </button>

          {error && (
            <p
              style={{
                margin: 0,
                fontSize: 13,
                fontFamily: "var(--font-inter), system-ui, sans-serif",
                color: "var(--error)",
                textAlign: "center",
              }}
            >
              Incorrect code. Try again.
            </p>
          )}
        </div>
      </div>
    </div>
  )
}
