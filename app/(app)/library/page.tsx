"use client"

import { useState, useRef, useEffect, useId } from "react"
import {
  Layers, Building2, Folder, Plus, FileText, Link as LinkIcon,
  Upload, Search, MoreVertical, X,
} from "lucide-react"

import {
  INITIAL_SOURCES, LIBRARY_PROGRAMS, ORG_SCOPE_CONFIG, PROGRAM_SCOPE_CONFIGS, getScopeConfig,
  type Source, type SourceScope, type ScopeConfig,
} from "@/lib/sources"

// ── Types ──────────────────────────────────────────────────────────────────

type ActiveScope = "all" | "organization" | string // string = programId for programs

interface ModalState {
  mode: "upload" | "link"
  scope: SourceScope
  category: string
}

// ── Helpers ────────────────────────────────────────────────────────────────

function scopeMatches(source: Source, active: ActiveScope): boolean {
  if (active === "all") return true
  if (active === "organization") return source.scope.kind === "organization"
  return source.scope.kind === "program" && source.scope.programId === active
}

function scopeFromActive(active: ActiveScope): SourceScope {
  if (active === "organization" || active === "all") return { kind: "organization" }
  return { kind: "program", programId: active }
}

function configForActive(active: ActiveScope): ScopeConfig {
  if (active === "organization" || active === "all") return ORG_SCOPE_CONFIG
  return PROGRAM_SCOPE_CONFIGS[active] ?? ORG_SCOPE_CONFIG
}

function deriveDomain(url: string): string {
  try { return new URL(url).hostname.replace(/^www\./, "") }
  catch { return url }
}

function newId(): string {
  return `src-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`
}

function todayLabel(): string {
  return new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
}

// ── Status chip ────────────────────────────────────────────────────────────

function StatusChip({ count }: { count: number }) {
  const ready = count === 0
  return (
    <span style={{
      display: "inline-flex", alignItems: "center",
      padding: "2px 8px", borderRadius: "var(--radius-pill)",
      fontSize: 11, fontWeight: 500, lineHeight: "16px",
      backgroundColor: ready ? "var(--evergreen-tint)" : "var(--slate-tint)",
      color:           ready ? "var(--evergreen)"      : "var(--ink-secondary)",
      flexShrink: 0,
    }}>
      {ready ? "Ready" : `Used in ${count}`}
    </span>
  )
}

// ── Row menu ───────────────────────────────────────────────────────────────

const ROW_MENU_ITEMS = ["Open", "Replace", "Rename", "Move to", "Remove"] as const

function RowMenu({ sourceId, onRemove }: { sourceId: string; onRemove: (id: string) => void }) {
  const [open, setOpen] = useState(false)
  const btnRef = useRef<HTMLButtonElement>(null)
  const [pos, setPos] = useState({ top: 0, left: 0 })

  function toggle() {
    if (!open && btnRef.current) {
      const r = btnRef.current.getBoundingClientRect()
      setPos({ top: r.bottom + 4, left: r.right - 136 })
    }
    setOpen(v => !v)
  }

  return (
    <>
      {open && <div style={{ position: "fixed", inset: 0, zIndex: 88 }} onClick={() => setOpen(false)} />}
      <button
        ref={btnRef} type="button"
        onClick={toggle}
        style={{
          width: 28, height: 28, display: "flex", alignItems: "center", justifyContent: "center",
          borderRadius: 6, border: "none", background: open ? "var(--slate-tint)" : "transparent",
          cursor: "pointer", flexShrink: 0, transition: "background 150ms",
        }}
        onMouseEnter={e => { if (!open) (e.currentTarget as HTMLButtonElement).style.background = "var(--canvas)" }}
        onMouseLeave={e => { if (!open) (e.currentTarget as HTMLButtonElement).style.background = "transparent" }}
      >
        <MoreVertical size={14} color="var(--ink-tertiary)" />
      </button>
      {open && (
        <div style={{
          position: "fixed", top: pos.top, left: pos.left,
          width: 136, backgroundColor: "#fff",
          border: "1px solid var(--hair-2)", borderRadius: 8,
          boxShadow: "var(--lift-2)", zIndex: 89, overflow: "hidden",
        }}>
          {ROW_MENU_ITEMS.map(item => (
            <button
              key={item} type="button"
              onClick={() => {
                if (item === "Remove") onRemove(sourceId)
                setOpen(false)
              }}
              style={{
                width: "100%", padding: "7px 12px", textAlign: "left", background: "none",
                border: "none", fontSize: 13, color: item === "Remove" ? "var(--error)" : "var(--ink)",
                cursor: "pointer", display: "block",
              }}
              onMouseEnter={e => (e.currentTarget as HTMLButtonElement).style.background = "var(--canvas)"}
              onMouseLeave={e => (e.currentTarget as HTMLButtonElement).style.background = "none"}
            >
              {item}
            </button>
          ))}
        </div>
      )}
    </>
  )
}

// ── Source row ─────────────────────────────────────────────────────────────

function SourceRow({ source, onRemove, last }: { source: Source; onRemove: (id: string) => void; last: boolean }) {
  const isFile = source.type === "file"
  const meta = isFile
    ? [source.fileFormat, source.fileSizeLabel, `Added ${source.addedAt}`].filter(Boolean).join(" · ")
    : [`${source.domain}`, `Added ${source.addedAt}`].filter(Boolean).join(" · ")

  return (
    <div style={{
      display: "flex", alignItems: "center", gap: 10,
      padding: "10px 14px",
      borderBottom: last ? "none" : "var(--border-subtle)",
    }}>
      {/* Icon tile */}
      <div style={{
        width: 32, height: 32, borderRadius: "var(--radius-icon-tile)",
        backgroundColor: "var(--slate-tint)",
        display: "flex", alignItems: "center", justifyContent: "center",
        flexShrink: 0,
      }}>
        {isFile
          ? <FileText size={15} color="var(--slate-primary)" strokeWidth={1.8} />
          : <LinkIcon size={15} color="var(--slate-primary)" strokeWidth={1.8} />
        }
      </div>

      {/* Text */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ margin: 0, fontSize: 13, fontWeight: 600, color: "var(--ink)", lineHeight: "17px", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
          {source.title}
        </p>
        <p style={{ margin: "1px 0 0", fontSize: 12, color: "var(--ink-tertiary)", lineHeight: "15px", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
          {meta}
        </p>
      </div>

      <StatusChip count={source.usedInCount} />
      <RowMenu sourceId={source.id} onRemove={onRemove} />
    </div>
  )
}

// ── Suggested gap row ──────────────────────────────────────────────────────

function SuggestedRow({
  label, last, onAdd,
}: { label: string; last: boolean; onAdd: () => void }) {
  const [hov, setHov] = useState(false)
  return (
    <button
      type="button"
      onClick={onAdd}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        display: "flex", alignItems: "center", gap: 10,
        padding: "10px 14px", width: "100%",
        background: hov ? "var(--canvas)" : "none",
        border: "none", borderBottom: last ? "none" : "var(--border-subtle)",
        cursor: "pointer", textAlign: "left", transition: "background 150ms",
      }}
    >
      {/* Dashed tile */}
      <div style={{
        width: 32, height: 32, borderRadius: "var(--radius-icon-tile)",
        border: "1.5px dashed var(--hair-2)",
        display: "flex", alignItems: "center", justifyContent: "center",
        flexShrink: 0,
      }}>
        <Plus size={13} color="var(--ink-tertiary)" strokeWidth={2} />
      </div>

      <span style={{ flex: 1, fontSize: 13, color: "var(--ink-secondary)", lineHeight: "17px" }}>
        {label}
      </span>

      <span style={{
        padding: "2px 8px", borderRadius: "var(--radius-pill)",
        fontSize: 11, fontWeight: 500, lineHeight: "16px",
        backgroundColor: "var(--slate-tint)", color: "var(--ink-secondary)",
        flexShrink: 0,
      }}>
        Recommended
      </span>
    </button>
  )
}

// ── Category section ───────────────────────────────────────────────────────

function CategorySection({
  category, sources, gaps, onOpenModal, onRemove,
}: {
  category: string
  sources: Source[]
  gaps: Array<{ label: string }>
  onOpenModal: (mode: "upload" | "link", category: string) => void
  onRemove: (id: string) => void
}) {
  const totalRows = sources.length + gaps.length
  if (totalRows === 0) return null

  return (
    <div style={{ marginBottom: 20 }}>
      {/* Category header */}
      <div style={{
        display: "flex", alignItems: "center", justifyContent: "space-between",
        marginBottom: 8,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <span style={{ fontSize: 13, fontWeight: 600, color: "var(--ink)" }}>{category}</span>
          <span style={{ fontSize: 12, color: "var(--ink-tertiary)" }}>{sources.length}</span>
        </div>
        <button
          type="button"
          onClick={() => onOpenModal("upload", category)}
          style={{
            display: "flex", alignItems: "center", gap: 4,
            background: "none", border: "none", cursor: "pointer", padding: "2px 4px",
            borderRadius: 5, fontSize: 12, color: "var(--slate-secondary)", fontWeight: 500,
          }}
          onMouseEnter={e => (e.currentTarget as HTMLButtonElement).style.textDecoration = "underline"}
          onMouseLeave={e => (e.currentTarget as HTMLButtonElement).style.textDecoration = "none"}
        >
          <Plus size={12} strokeWidth={2.5} />
          Add source
        </button>
      </div>

      {/* Card */}
      <div style={{
        backgroundColor: "var(--surface)",
        border: "1px solid var(--hair-2)",
        borderRadius: 12,
        overflow: "hidden",
      }}>
        {sources.map((src, i) => (
          <SourceRow
            key={src.id}
            source={src}
            onRemove={onRemove}
            last={i === sources.length - 1 && gaps.length === 0}
          />
        ))}
        {gaps.map((gap, i) => (
          <SuggestedRow
            key={gap.label}
            label={gap.label}
            last={i === gaps.length - 1}
            onAdd={() => onOpenModal("upload", category)}
          />
        ))}
      </div>
    </div>
  )
}

// ── Scope panel ────────────────────────────────────────────────────────────

function ScopePanel({
  active, sources, searchQuery, onOpenModal, onRemove,
}: {
  active: ActiveScope
  sources: Source[]
  searchQuery: string
  onOpenModal: (mode: "upload" | "link", category: string, scopeOverride?: SourceScope) => void
  onRemove: (id: string) => void
}) {
  const q = searchQuery.toLowerCase().trim()

  function renderScope(scope: SourceScope, config: ScopeConfig, isInAllView: boolean) {
    const scopeSources = sources.filter(s => {
      if (!scopeMatches(s, scope.kind === "organization" ? "organization" : (scope as { kind: "program"; programId: string }).programId)) return false
      if (q) return s.title.toLowerCase().includes(q) || s.category.toLowerCase().includes(q)
      return true
    })

    const added = scopeSources.length
    const recommended = config.recommendedCount
    const progress = Math.min(1, added / recommended)

    return (
      <div key={config.name} style={{ marginBottom: isInAllView ? 36 : 0 }}>
        {/* Scope header */}
        <div style={{
          display: "flex", alignItems: "flex-start", justifyContent: "space-between",
          marginBottom: 20, paddingBottom: 16,
          borderBottom: "var(--border-subtle)",
        }}>
          <div>
            <h2 style={{ margin: 0, fontSize: 16, fontWeight: 600, color: "var(--ink)", lineHeight: "22px" }}>
              {config.name}
            </h2>
            <p style={{ margin: "2px 0 0", fontSize: 13, color: "var(--ink-secondary)" }}>
              {config.descriptor}
            </p>
          </div>
          <div style={{ textAlign: "right", flexShrink: 0, marginLeft: 24 }}>
            <p style={{ margin: "0 0 6px", fontSize: 12, color: "var(--ink-tertiary)" }}>
              <span style={{ fontWeight: 600, color: "var(--ink-secondary)" }}>{added}</span> of {recommended} recommended
            </p>
            <div style={{
              width: 120, height: 4, borderRadius: 2,
              backgroundColor: "var(--slate-tint)",
              overflow: "hidden",
            }}>
              <div style={{
                height: "100%", width: `${progress * 100}%`,
                backgroundColor: "var(--slate-primary)",
                borderRadius: 2, transition: "width 300ms",
              }} />
            </div>
          </div>
        </div>

        {/* Categories */}
        {config.categories.map(cat => {
          const catSources = scopeSources.filter(s => s.category === cat)
          const catGaps = q ? [] : config.gaps.filter(g => g.category === cat)
          return (
            <CategorySection
              key={cat}
              category={cat}
              sources={catSources}
              gaps={catGaps}
              onOpenModal={(mode, category) => onOpenModal(mode, category, scope)}
              onRemove={onRemove}
            />
          )
        })}
      </div>
    )
  }

  if (active === "all") {
    return (
      <>
        {renderScope({ kind: "organization" }, ORG_SCOPE_CONFIG, true)}
        {LIBRARY_PROGRAMS.map(prog =>
          renderScope(
            { kind: "program", programId: prog.id },
            PROGRAM_SCOPE_CONFIGS[prog.id] ?? ORG_SCOPE_CONFIG,
            true,
          )
        )}
      </>
    )
  }

  const scope = scopeFromActive(active)
  const config = configForActive(active)
  return <>{renderScope(scope, config, false)}</>
}

// ── Upload modal ───────────────────────────────────────────────────────────

function UploadModal({
  state, onClose, onAdd,
}: {
  state: ModalState
  onClose: () => void
  onAdd: (source: Source) => void
}) {
  const [title, setTitle] = useState("")
  const [format, setFormat] = useState("PDF")
  const config = getScopeConfig(state.scope)

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!title.trim()) return
    onAdd({
      id: newId(),
      type: "file",
      title: title.trim(),
      category: state.category,
      scope: state.scope,
      addedAt: todayLabel(),
      usedInCount: 0,
      fileFormat: format,
      fileSizeLabel: "—",
    })
    onClose()
  }

  return (
    <ModalOverlay onClose={onClose}>
      <form onSubmit={handleSubmit}>
        <ModalHeader title="Upload file" onClose={onClose} />
        <div style={{ padding: "16px 20px 20px" }}>
          <ModalField label="File name">
            <input
              autoFocus
              value={title} onChange={e => setTitle(e.target.value)}
              placeholder="e.g. Annual report 2025.pdf"
              style={inputStyle}
            />
          </ModalField>
          <ModalField label="Format">
            <select value={format} onChange={e => setFormat(e.target.value)} style={inputStyle}>
              {["PDF", "DOCX", "XLSX", "JPG", "PNG", "Other"].map(f => <option key={f}>{f}</option>)}
            </select>
          </ModalField>
          <ModalField label="Scope">
            <div style={{ ...inputStyle, cursor: "default", color: "var(--ink-secondary)" }}>
              {config.name} / {state.category}
            </div>
          </ModalField>
          <button type="submit" disabled={!title.trim()} style={submitBtnStyle(!title.trim())}>
            Add file
          </button>
        </div>
      </form>
    </ModalOverlay>
  )
}

// ── Add link modal ─────────────────────────────────────────────────────────

function AddLinkModal({
  state, onClose, onAdd,
}: {
  state: ModalState
  onClose: () => void
  onAdd: (source: Source) => void
}) {
  const [url, setUrl]     = useState("")
  const [title, setTitle] = useState("")
  const config = getScopeConfig(state.scope)

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const trimUrl = url.trim()
    const trimTitle = title.trim()
    if (!trimUrl || !trimTitle) return
    onAdd({
      id: newId(),
      type: "link",
      title: trimTitle,
      category: state.category,
      scope: state.scope,
      addedAt: todayLabel(),
      usedInCount: 0,
      url: trimUrl,
      domain: deriveDomain(trimUrl),
    })
    onClose()
  }

  return (
    <ModalOverlay onClose={onClose}>
      <form onSubmit={handleSubmit}>
        <ModalHeader title="Add link" onClose={onClose} />
        <div style={{ padding: "16px 20px 20px" }}>
          <ModalField label="URL">
            <input
              autoFocus
              type="url" value={url} onChange={e => setUrl(e.target.value)}
              placeholder="https://..."
              style={inputStyle}
            />
          </ModalField>
          <ModalField label="Title">
            <input
              value={title} onChange={e => setTitle(e.target.value)}
              placeholder="e.g. Annual report 2025"
              style={inputStyle}
            />
          </ModalField>
          <ModalField label="Scope">
            <div style={{ ...inputStyle, cursor: "default", color: "var(--ink-secondary)" }}>
              {config.name} / {state.category}
            </div>
          </ModalField>
          <button type="submit" disabled={!url.trim() || !title.trim()} style={submitBtnStyle(!url.trim() || !title.trim())}>
            Add link
          </button>
        </div>
      </form>
    </ModalOverlay>
  )
}

// ── Modal primitives ───────────────────────────────────────────────────────

function ModalOverlay({ children, onClose }: { children: React.ReactNode; onClose: () => void }) {
  return (
    <>
      <div
        style={{ position: "fixed", inset: 0, backgroundColor: "rgba(42,42,42,0.35)", zIndex: 100 }}
        onClick={onClose}
      />
      <div style={{
        position: "fixed", top: "50%", left: "50%", transform: "translate(-50%, -50%)",
        width: 400, backgroundColor: "#fff", borderRadius: 12,
        boxShadow: "var(--elevation-overlay)", zIndex: 101,
      }}>
        {children}
      </div>
    </>
  )
}

function ModalHeader({ title, onClose }: { title: string; onClose: () => void }) {
  return (
    <div style={{
      display: "flex", alignItems: "center", justifyContent: "space-between",
      padding: "16px 20px 12px", borderBottom: "var(--border-subtle)",
    }}>
      <span style={{ fontSize: 15, fontWeight: 600, color: "var(--ink)" }}>{title}</span>
      <button type="button" onClick={onClose} style={{
        width: 28, height: 28, display: "flex", alignItems: "center", justifyContent: "center",
        borderRadius: 6, border: "1px solid var(--hair-2)", background: "none", cursor: "pointer",
      }}>
        <X size={13} color="var(--ink-secondary)" />
      </button>
    </div>
  )
}

function ModalField({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 12 }}>
      <label style={{ display: "block", fontSize: 12, fontWeight: 500, color: "var(--ink-secondary)", marginBottom: 4 }}>
        {label}
      </label>
      {children}
    </div>
  )
}

const inputStyle: React.CSSProperties = {
  width: "100%", boxSizing: "border-box",
  padding: "8px 10px", fontSize: 13,
  border: "1px solid var(--hair-2)", borderRadius: "var(--radius-input)",
  background: "var(--canvas)", color: "var(--ink)",
  outline: "none",
}

function submitBtnStyle(disabled: boolean): React.CSSProperties {
  return {
    marginTop: 4, width: "100%", padding: "9px 0",
    borderRadius: "var(--radius-button)", border: "none",
    backgroundColor: disabled ? "var(--slate-tint)" : "var(--slate-primary)",
    color: disabled ? "var(--ink-tertiary)" : "#fff",
    fontSize: 13, fontWeight: 600, cursor: disabled ? "default" : "pointer",
    transition: "background 150ms",
  }
}

// ── Rail item ──────────────────────────────────────────────────────────────

function RailItem({
  icon: Icon, label, count, active, onClick,
}: {
  icon: React.ElementType
  label: string
  count: number
  active: boolean
  onClick: () => void
}) {
  const [hov, setHov] = useState(false)
  return (
    <button
      type="button"
      onClick={onClick}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        display: "flex", alignItems: "center", gap: 8, width: "100%",
        padding: "7px 10px", borderRadius: 8, border: "none",
        backgroundColor: active ? "var(--slate-tint)" : hov ? "var(--canvas)" : "transparent",
        cursor: "pointer", transition: "background 150ms", textAlign: "left",
      }}
    >
      <Icon size={15} color={active ? "var(--slate-primary)" : "var(--ink-tertiary)"} strokeWidth={1.8} style={{ flexShrink: 0 }} />
      <span style={{
        flex: 1, fontSize: 13, lineHeight: "17px",
        color: active ? "var(--slate-primary)" : "var(--ink-secondary)",
        fontWeight: active ? 600 : 400,
        whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
      }}>
        {label}
      </span>
      <span style={{
        fontSize: 11, color: active ? "var(--slate-secondary)" : "var(--ink-tertiary)",
        fontWeight: 500, flexShrink: 0,
      }}>
        {count}
      </span>
    </button>
  )
}

// ── Page ───────────────────────────────────────────────────────────────────

export default function LibraryPage() {
  const [sources, setSources] = useState<Source[]>([...INITIAL_SOURCES])
  const [active, setActive]   = useState<ActiveScope>("organization")
  const [search, setSearch]   = useState("")
  const [modal, setModal]     = useState<ModalState | null>(null)

  function countForScope(a: ActiveScope) {
    return sources.filter(s => scopeMatches(s, a)).length
  }

  function openModal(mode: "upload" | "link", category: string, scopeOverride?: SourceScope) {
    const scope = scopeOverride ?? scopeFromActive(active)
    setModal({ mode, scope, category })
  }

  function addSource(source: Source) {
    setSources(prev => [...prev, source])
  }

  function removeSource(id: string) {
    setSources(prev => prev.filter(s => s.id !== id))
  }

  const defaultCategory = configForActive(active).categories[0] ?? "Organization"

  // search-filtered sources for "All" stat (header shows total, not filtered)
  const visibleSources = search.trim()
    ? sources.filter(s => s.title.toLowerCase().includes(search.toLowerCase()) || s.category.toLowerCase().includes(search.toLowerCase()))
    : sources

  return (
    <div style={{
      display: "flex", flexDirection: "column", height: "100vh",
      backgroundColor: "var(--canvas)", overflow: "hidden",
    }}>
      {/* Header */}
      <div style={{
        padding: "24px 32px 20px",
        borderBottom: "var(--border-subtle)",
        flexShrink: 0,
        backgroundColor: "var(--canvas)",
      }}>
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 16 }}>
          <div>
            <h1 style={{ margin: 0, fontSize: 22, fontWeight: 600, color: "var(--ink)", lineHeight: "28px" }}>
              Source library
            </h1>
            <p style={{ margin: "4px 0 0", fontSize: 13, color: "var(--ink-secondary)", lineHeight: "18px" }}>
              Documents and links the assistant draws from when drafting for Whisker Haven Cat Rescue
            </p>
          </div>

          {/* Controls */}
          <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0, paddingTop: 2 }}>
            {/* Search */}
            <div style={{ position: "relative" }}>
              <Search
                size={13} strokeWidth={2}
                style={{ position: "absolute", top: "50%", left: 10, transform: "translateY(-50%)", color: "var(--ink-tertiary)", pointerEvents: "none" }}
              />
              <input
                type="text" value={search} onChange={e => setSearch(e.target.value)}
                placeholder="Search sources"
                style={{
                  paddingLeft: 30, paddingRight: 10, paddingTop: 7, paddingBottom: 7,
                  fontSize: 13, border: "1px solid var(--hair-2)", borderRadius: "var(--radius-input)",
                  background: "#fff", color: "var(--ink)", width: 188, outline: "none",
                }}
              />
            </div>

            {/* Add link */}
            <button
              type="button"
              onClick={() => openModal("link", defaultCategory)}
              style={{
                display: "flex", alignItems: "center", gap: 6,
                padding: "7px 12px", borderRadius: "var(--radius-button)",
                border: "1px solid var(--hair-2)", background: "none",
                fontSize: 13, color: "var(--ink-secondary)", fontWeight: 500,
                cursor: "pointer", transition: "background 150ms, border-color 150ms",
              }}
              onMouseEnter={e => { const b = e.currentTarget as HTMLButtonElement; b.style.background = "var(--canvas)"; b.style.borderColor = "var(--slate-light)" }}
              onMouseLeave={e => { const b = e.currentTarget as HTMLButtonElement; b.style.background = "none"; b.style.borderColor = "var(--hair-2)" }}
            >
              <LinkIcon size={13} strokeWidth={2} />
              Add link
            </button>

            {/* Upload */}
            <button
              type="button"
              onClick={() => openModal("upload", defaultCategory)}
              style={{
                display: "flex", alignItems: "center", gap: 6,
                padding: "7px 14px", borderRadius: "var(--radius-button)",
                border: "none", backgroundColor: "var(--slate-primary)",
                fontSize: 13, color: "#fff", fontWeight: 600,
                cursor: "pointer", transition: "opacity 150ms",
              }}
              onMouseEnter={e => (e.currentTarget as HTMLButtonElement).style.opacity = "0.88"}
              onMouseLeave={e => (e.currentTarget as HTMLButtonElement).style.opacity = "1"}
            >
              <Upload size={13} strokeWidth={2.5} />
              Upload
            </button>
          </div>
        </div>
      </div>

      {/* Two-pane layout */}
      <div style={{ display: "flex", flex: 1, overflow: "hidden" }}>
        {/* Scope rail */}
        <aside style={{
          width: 240, flexShrink: 0,
          padding: "12px 8px",
          borderRight: "var(--border-subtle)",
          overflowY: "auto",
        }}>
          <RailItem
            icon={Layers}
            label="All sources"
            count={sources.length}
            active={active === "all"}
            onClick={() => setActive("all")}
          />
          <RailItem
            icon={Building2}
            label="Organization"
            count={countForScope("organization")}
            active={active === "organization"}
            onClick={() => setActive("organization")}
          />

          <p style={{ margin: "14px 10px 4px", fontSize: 11, fontWeight: 600, color: "var(--ink-tertiary)", letterSpacing: "0.04em" }}>
            PROGRAMS
          </p>

          {LIBRARY_PROGRAMS.map(prog => (
            <RailItem
              key={prog.id}
              icon={Folder}
              label={prog.name}
              count={countForScope(prog.id)}
              active={active === prog.id}
              onClick={() => setActive(prog.id)}
            />
          ))}

          <button
            type="button"
            style={{
              display: "flex", alignItems: "center", gap: 8, width: "100%",
              padding: "7px 10px", marginTop: 2,
              borderRadius: 8, border: "none", background: "none",
              fontSize: 13, color: "var(--ink-tertiary)", cursor: "pointer",
              transition: "background 150ms", textAlign: "left",
            }}
            onMouseEnter={e => (e.currentTarget as HTMLButtonElement).style.background = "var(--canvas)"}
            onMouseLeave={e => (e.currentTarget as HTMLButtonElement).style.background = "none"}
          >
            <Plus size={15} color="var(--ink-tertiary)" strokeWidth={2} style={{ flexShrink: 0 }} />
            <span style={{ fontSize: 13, lineHeight: "17px" }}>Add program</span>
          </button>
        </aside>

        {/* Content panel */}
        <main style={{ flex: 1, overflowY: "auto", padding: "24px 32px" }}>
          <ScopePanel
            active={active}
            sources={sources}
            searchQuery={search}
            onOpenModal={openModal}
            onRemove={removeSource}
          />
        </main>
      </div>

      {/* Modals */}
      {modal?.mode === "upload" && (
        <UploadModal state={modal} onClose={() => setModal(null)} onAdd={addSource} />
      )}
      {modal?.mode === "link" && (
        <AddLinkModal state={modal} onClose={() => setModal(null)} onAdd={addSource} />
      )}
    </div>
  )
}
