"use client"

import React, { useState } from "react"

type SettingsTab = "organization" | "users" | "writing_styles" | "audit_logs" | "notifications"

interface NotifSetting {
  id: string
  label: string
  description: string
  inApp: boolean
  email: boolean
}

const INITIAL_NOTIF_SETTINGS: NotifSetting[] = [
  { id: "task_assigned",   label: "Task assigned to you",          description: "When someone assigns you a task", inApp: true, email: true },
  { id: "task_due_soon",   label: "Task due in 48 hours",          description: "Reminder before a task's due date",  inApp: true, email: true },
  { id: "task_overdue",    label: "Task overdue",                   description: "When a task passes its due date",  inApp: true, email: false },
  { id: "task_completed",  label: "Task completed by someone else", description: "When a task you created is marked done",  inApp: true, email: false },
  { id: "task_reassigned", label: "Task reassigned away from you",  description: "When your assignment is changed",  inApp: true, email: true },
  { id: "task_commented",  label: "Task commented on",             description: "When someone comments on a task you're part of",  inApp: true, email: false },
]

function Toggle({ on, onChange }: { on: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={on}
      onClick={() => onChange(!on)}
      style={{
        width: 36, height: 20, borderRadius: 10, border: "none", padding: 0, cursor: "pointer",
        backgroundColor: on ? "var(--slate-primary)" : "#D1D5DB",
        position: "relative", transition: "background-color 200ms", flexShrink: 0,
      }}
    >
      <div style={{
        position: "absolute", top: 2, left: on ? 18 : 2,
        width: 16, height: 16, borderRadius: "50%", backgroundColor: "#FFFFFF",
        boxShadow: "0 1px 3px rgba(0,0,0,0.2)", transition: "left 200ms",
      }} />
    </button>
  )
}

const TAB_LABELS: Record<SettingsTab, string> = {
  organization: "Organization",
  users: "Users",
  writing_styles: "Writing Styles",
  audit_logs: "Audit Logs",
  notifications: "Notifications",
}

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState<SettingsTab>("notifications")
  const [notifSettings, setNotifSettings] = useState<NotifSetting[]>(INITIAL_NOTIF_SETTINGS)

  function updateNotif(id: string, field: "inApp" | "email", value: boolean) {
    setNotifSettings(prev => prev.map(n => n.id === id ? { ...n, [field]: value } : n))
  }

  return (
    <div className="flex-1 overflow-y-auto" style={{ backgroundColor: "var(--canvas)" }}>
      <div style={{ maxWidth: 860, margin: "0 auto", padding: "32px 32px 64px 32px" }}>

        {/* Header */}
        <div style={{ marginBottom: 28 }}>
          <h1 style={{ margin: "0 0 4px", fontSize: 24, fontWeight: 500, letterSpacing: "-0.02em", color: "var(--ink)", fontFamily: "var(--font-lora)" }}>
            Settings
          </h1>
          <p style={{ margin: 0, fontSize: 14, color: "var(--ink-secondary)" }}>
            Manage your organization, team, and preferences.
          </p>
        </div>

        {/* Tabs */}
        <div style={{ display: "flex", gap: 2, borderBottom: "var(--border-subtle)", marginBottom: 28 }}>
          {(Object.keys(TAB_LABELS) as SettingsTab[]).map(tab => {
            const isActive = activeTab === tab
            return (
              <button
                key={tab}
                type="button"
                onClick={() => setActiveTab(tab)}
                style={{
                  position: "relative", padding: "8px 16px", background: "none", border: "none",
                  cursor: "pointer", fontSize: 14,
                  fontWeight: isActive ? 600 : 400,
                  color: isActive ? "var(--slate-primary)" : "var(--ink-secondary)",
                  transition: "color 150ms",
                }}
              >
                {TAB_LABELS[tab]}
                {isActive && <div style={{ position: "absolute", bottom: 0, left: 16, right: 16, height: 2, borderRadius: 1, backgroundColor: "var(--slate-primary)" }} />}
              </button>
            )
          })}
        </div>

        {/* Tab content */}

        {activeTab === "notifications" && (
          <div>
            <div style={{ marginBottom: 20 }}>
              <h2 style={{ margin: "0 0 6px", fontSize: 16, fontWeight: 600, color: "var(--ink)" }}>Notification preferences</h2>
              <p style={{ margin: 0, fontSize: 13, color: "var(--ink-secondary)", lineHeight: "19px" }}>
                Choose how you want to be notified about task activity.
              </p>
            </div>

            {/* Table */}
            <div style={{ borderRadius: "var(--radius-card)", backgroundColor: "var(--surface-white)", boxShadow: "var(--shadow-card)", overflow: "hidden" }}>
              {/* Header row */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 100px 100px", padding: "10px 20px", backgroundColor: "var(--canvas)", borderBottom: "var(--border-subtle)" }}>
                <span style={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.07em", textTransform: "uppercase", color: "var(--ink-tertiary)" }}>Notification type</span>
                <span style={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.07em", textTransform: "uppercase", color: "var(--ink-tertiary)", textAlign: "center" }}>In-app</span>
                <span style={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.07em", textTransform: "uppercase", color: "var(--ink-tertiary)", textAlign: "center" }}>Email</span>
              </div>
              {notifSettings.map((n, i) => (
                <div
                  key={n.id}
                  style={{
                    display: "grid", gridTemplateColumns: "1fr 100px 100px",
                    padding: "14px 20px", alignItems: "center",
                    borderBottom: i < notifSettings.length - 1 ? "var(--border-subtle)" : "none",
                  }}
                >
                  <div>
                    <p style={{ margin: "0 0 2px", fontSize: 14, color: "var(--ink)", fontWeight: 500 }}>{n.label}</p>
                    <p style={{ margin: 0, fontSize: 12, color: "var(--ink-tertiary)" }}>{n.description}</p>
                  </div>
                  <div style={{ display: "flex", justifyContent: "center" }}>
                    <Toggle on={n.inApp} onChange={(v) => updateNotif(n.id, "inApp", v)} />
                  </div>
                  <div style={{ display: "flex", justifyContent: "center" }}>
                    <Toggle on={n.email} onChange={(v) => updateNotif(n.id, "email", v)} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === "organization" && (
          <PlaceholderTab label="Organization" description="Manage your organization name, logo, and billing." />
        )}
        {activeTab === "users" && (
          <PlaceholderTab label="Users" description="Invite teammates, manage roles, and deactivate accounts." />
        )}
        {activeTab === "writing_styles" && (
          <PlaceholderTab label="Writing Styles" description="Configure tone profiles and style preferences for AI-assisted writing." />
        )}
        {activeTab === "audit_logs" && (
          <PlaceholderTab label="Audit Logs" description="View a history of actions taken in your organization." />
        )}
      </div>
    </div>
  )
}

function PlaceholderTab({ label, description }: { label: string; description: string }) {
  return (
    <div style={{ padding: "48px 0", textAlign: "center" }}>
      <p style={{ margin: "0 0 6px", fontSize: 15, fontWeight: 500, color: "var(--ink-secondary)" }}>{label}</p>
      <p style={{ margin: 0, fontSize: 13, color: "var(--ink-tertiary)" }}>{description}</p>
    </div>
  )
}
