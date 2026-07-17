"use client"

import * as React from "react"
import { useParams, useRouter, useSearchParams } from "next/navigation"

import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { Checkbox } from "@/components/ui/checkbox"
import { Icon, AiIcon } from "@/components/respond/icons"
import {
  OPP,
  SUG,
  SECTIONS,
  REQS,
  ATTACHMENTS,
  SNIPPETS,
  COMMENTS,
  type RespondReq,
  type RespondSection,
} from "@/lib/respond-data"

const cx = (...a: (string | false | null | undefined)[]) => a.filter(Boolean).join(" ")

type TabKey = "assistant" | "context" | "snippets"
type AttachState = { budgetX: boolean; c3: boolean; board: boolean }
type LimitUnit = "words" | "characters"
type SectionLimit = { value: number; unit: LimitUnit }

/** Pre-fill limits from the RFP requirement strings (e.g. "…, 500 words max"). */
const initialLimits = (): Record<string, SectionLimit | null> => {
  const m: Record<string, SectionLimit | null> = {}
  SECTIONS.forEach((s) => {
    const mt = s.req.match(/(\d[\d,]*)\s*(word|character|char)/i)
    m[s.id] = mt
      ? { value: parseInt(mt[1].replace(/,/g, ""), 10), unit: /char/i.test(mt[2]) ? "characters" : "words" }
      : null
  })
  return m
}

interface Setup {
  mode: "ai" | "self"
  wmode: "document" | "portal"
  name: string
  gaps: { c3: boolean; board: boolean }
}

const scrimStyle: React.CSSProperties = {
  position: "fixed",
  inset: 0,
  background: "rgba(28, 24, 64, 0.28)",
  display: "grid",
  placeItems: "center",
  padding: 30,
  overflow: "auto",
  zIndex: 50,
}

/** Ported contentEditable section body (memoised on id/readOnly/version). */
const Body = React.memo(
  function Body({
    id,
    text,
    readOnly,
    onEdit,
  }: {
    id: string
    text: string
    version: number
    readOnly: boolean
    onEdit: (id: string, text: string) => void
  }) {
    return (
      <div
        className="body"
        contentEditable={!readOnly}
        suppressContentEditableWarning
        onInput={(e) => onEdit(id, (e.currentTarget as HTMLDivElement).innerText)}
        role="textbox"
        aria-label="Section text"
      >
        {text}
      </div>
    )
  },
  (a, b) => a.id === b.id && a.readOnly === b.readOnly && a.version === b.version
)

/**
 * Reads the wizard's hand-off from the URL and renders the Model 4 editor.
 * Mounted (via a Suspense boundary in page.tsx) at /pursuit/[id]/respond.
 */
export function RespondEditor() {
  const params = useParams<{ id: string }>()
  const sp = useSearchParams()
  const router = useRouter()
  const pursuitId = params?.id ?? "opp-1"

  const setup: Setup = React.useMemo(
    () => ({
      mode: sp.get("mode") === "ai" ? "ai" : "self",
      wmode: sp.get("wmode") === "portal" ? "portal" : "document",
      name: sp.get("name") || "Proposal",
      gaps: { c3: sp.get("gapsC3") === "true", board: sp.get("gapsBoard") === "true" },
    }),
    [sp]
  )

  return (
    <Editor
      key={setup.mode + setup.wmode}
      setup={setup}
      onExit={() => router.push(`/pursuit/${pursuitId}`)}
    />
  )
}

function Editor({ setup, onExit }: { setup: Setup; onExit: () => void }) {
  const initialContents = React.useMemo(() => {
    const c: Record<string, string | null> = {}
    SECTIONS.forEach((s) => {
      if (s.id === "budget" || s.id === "sustain") c[s.id] = null
      else c[s.id] = setup.mode === "ai" ? (s.body ?? "rich") : null
    })
    return c
  }, [setup.mode])

  const [contents, setContents] = React.useState(initialContents)
  const [versions, setVersions] = React.useState<Record<string, number>>({})
  const [aiDrafted, setAiDrafted] = React.useState<Set<string>>(new Set())
  const [drafting, setDrafting] = React.useState<Set<string>>(new Set())
  const [sug, setSug] = React.useState<"pending" | "applied" | "dismissed" | "none">(
    setup.mode === "ai" ? "pending" : "none"
  )
  const [attach, setAttach] = React.useState<AttachState>({
    budgetX: false,
    c3: setup.gaps.c3,
    board: setup.gaps.board,
  })
  const [status, setStatus] = React.useState<"draft" | "submitted">("draft")
  const [title, setTitle] = React.useState(setup.name)
  const [active, setActive] = React.useState("program")
  const [limits, setLimits] = React.useState<Record<string, SectionLimit | null>>(initialLimits)
  const [editingLimit, setEditingLimit] = React.useState<string | null>(null)
  const [draftLimit, setDraftLimit] = React.useState<{ value: string; unit: LimitUnit }>({
    value: "",
    unit: "words",
  })
  const limitInputRef = React.useRef<HTMLInputElement>(null)
  const [reqOpen, setReqOpen] = React.useState(false)
  const [tab, setTab] = React.useState<TabKey>("assistant")
  const [chips, setChips] = React.useState(["Warm, community voice", "Cite local data"])
  const [resolved, setResolved] = React.useState<Set<string>>(new Set())
  const [cpanel, setCpanel] = React.useState(false)
  const [pop, setPop] = React.useState<{ kind: "sug" | "thread"; x: number; y: number } | null>(null)
  const [gate, setGate] = React.useState(false)
  const [copied, setCopied] = React.useState<Set<string>>(new Set())
  const [toast, setToast] = React.useState<string | null>(null)
  const [ctxDone, setCtxDone] = React.useState(false)
  const [input, setInput] = React.useState("")
  const [msgs, setMsgs] = React.useState<{ role: "ai" | "user"; t: string; acts?: string[] }[]>(() =>
    setup.mode === "ai"
      ? [
          {
            role: "ai",
            t: "I drafted these sections from your 2025 Impact Report and the Community Cat TNR initiative. The RFP asks for your delivery model in detail, so I led with staffing and scheduling in §3.",
            acts: [],
          },
          { role: "user", t: "Make the second paragraph more specific about how families sign up" },
          {
            role: "ai",
            t: "Done. I suggested one edit in §3 paragraph 2 that names your sign-up partners and the three-language intake. It's underlined in the document. Click it to preview the exact change before anything is applied.",
            acts: ["jump"],
          },
        ]
      : [
          {
            role: "ai",
            t: 'Your outline and requirements checklist are ready. Write in any section, or use “Draft this section” to have me take the first pass. Everything I write is marked so your team can review it.',
            acts: [],
          },
        ]
  )
  const secRefs = React.useRef<Record<string, HTMLDivElement | null>>({})
  const readOnly = status === "submitted"

  React.useEffect(() => {
    const t = setTimeout(() => setCtxDone(true), 7000)
    return () => clearTimeout(t)
  }, [])

  const [selBar, setSelBar] = React.useState<{ x: number; y: number } | null>(null)
  React.useEffect(() => {
    if (readOnly) {
      setSelBar(null)
      return
    }
    const onSel = () => {
      const s = window.getSelection()
      if (!s || s.isCollapsed || !s.rangeCount) {
        setSelBar(null)
        return
      }
      const range = s.getRangeAt(0)
      const docEl = document.querySelector(".respond-scope .doc")
      if (!docEl || !docEl.contains(range.commonAncestorContainer)) {
        setSelBar(null)
        return
      }
      const r = range.getBoundingClientRect()
      if (!r.width) {
        setSelBar(null)
        return
      }
      setSelBar({
        x: Math.max(12, Math.min(r.left, window.innerWidth - 380)),
        y: Math.max(60, r.top - 44),
      })
    }
    document.addEventListener("selectionchange", onSel)
    return () => document.removeEventListener("selectionchange", onSel)
  }, [readOnly])

  React.useEffect(() => {
    if (!toast) return
    const t = setTimeout(() => setToast(null), 2200)
    return () => clearTimeout(t)
  }, [toast])

  const say = (t: string) => setToast(t)
  /** Full plain text of a section (handles the rich Program Description). */
  const sectionText = (id: string): string => {
    if (id === "program" && contents.program === "rich") {
      const s = SECTIONS.find((x) => x.id === "program")!
      return (
        s.p1! + s.p1mark! + s.p1b! + " " + s.p2a! + (sug === "applied" ? SUG.next : SUG.old) + s.p2b! + " " + s.p3!
      )
    }
    return contents[id] || ""
  }
  const wordsOf = (id: string) => sectionText(id).split(/\s+/).filter(Boolean).length
  const countOf = (id: string, unit: LimitUnit) =>
    unit === "characters" ? sectionText(id).length : wordsOf(id)
  const secMet = (id: string) =>
    id === "program" ? contents.program !== null : !!(contents[id] && contents[id]!.trim())
  const reqMet = (r: RespondReq) => (r.kind === "section" ? secMet(r.sec!) : attach[r.att!])
  const openReqs = REQS.filter((r) => !reqMet(r))
  const metCount = 9 - openReqs.length

  const onEdit = (id: string, text: string) => setContents((c) => ({ ...c, [id]: text }))
  const bump = (id: string) => setVersions((v) => ({ ...v, [id]: (v[id] || 0) + 1 }))

  // ---- GAP-1: word/character limits (advisory — never block typing or export) ----
  React.useEffect(() => {
    if (editingLimit) {
      limitInputRef.current?.focus()
      limitInputRef.current?.select()
    }
  }, [editingLimit])
  const startEditLimit = (id: string) => {
    const lim = limits[id]
    setDraftLimit({ value: lim ? String(lim.value) : "", unit: lim?.unit ?? "words" })
    setEditingLimit(id)
  }
  const commitLimit = () => {
    const id = editingLimit
    if (!id) return
    const v = parseInt(draftLimit.value, 10)
    setLimits((l) => ({
      ...l,
      [id]: !isNaN(v) && v > 0 ? { value: v, unit: draftLimit.unit } : l[id],
    }))
    setEditingLimit(null)
  }
  const removeLimit = () => {
    const id = editingLimit
    if (!id) return
    setLimits((l) => ({ ...l, [id]: null }))
    setEditingLimit(null)
  }
  /** Strip a trailing "…, 500 words max" from the requirement once it's a control. */
  const displayReq = (s: RespondSection) =>
    limits[s.id]
      ? s.req.replace(/,?\s*\d[\d,]*\s*(words?|characters?|chars?)\s*(max)?\.?$/i, "").trim() || s.req
      : s.req
  const tighten = (id: string) => {
    const s = SECTIONS.find((x) => x.id === id)!
    const lim = limits[id]
    if (!lim) return
    setTab("assistant")
    setMsgs((m) => [
      ...m,
      { role: "user", t: `Tighten ${s.title} to fit the ${lim.value} ${lim.unit} limit` },
      {
        role: "ai",
        t: `I'll tighten ${s.title} to fit ${lim.value} ${lim.unit}. It arrives as one suggested edit in the document — nothing changes until you apply it.`,
        acts: [],
      },
    ])
    say(`Tightening ${s.title} — arrives as one suggested edit`)
    // TODO(suggestion-engine): route through the real pessimistic suggestion flow
    // (setSug + the pop.kind==="sug" popover) once it accepts a target section +
    // rewrite intent instead of the hardcoded §3 SUG fixture. For now the ask
    // echoes into the assistant thread as the user's request.
  }

  // ---- GAP-4: snippet insert aftermath (just-inserted tick + Blend pill) ----
  const [justInserted, setJustInserted] = React.useState<string | null>(null)
  React.useEffect(() => {
    if (!justInserted) return
    const clear = () => setJustInserted(null)
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") clear()
    }
    const surface = document.querySelector(".respond-scope .surface")
    // Let the insertion's own event loop settle, then arm the dismissers:
    // next edit (any input), Esc, or scrolling the section away.
    const t = setTimeout(() => {
      document.addEventListener("input", clear, true)
      document.addEventListener("keydown", onKey, true)
      surface?.addEventListener("scroll", clear, { passive: true })
    }, 50)
    return () => {
      clearTimeout(t)
      document.removeEventListener("input", clear, true)
      document.removeEventListener("keydown", onKey, true)
      surface?.removeEventListener("scroll", clear)
    }
  }, [justInserted])
  const blend = (id: string) => {
    const s = SECTIONS.find((x) => x.id === id)!
    setJustInserted(null)
    setTab("assistant")
    setMsgs((m) => [
      ...m,
      {
        role: "user",
        t: `Blend the inserted snippet into ${s.title} — smooth the transitions, fix redundancy, match tone`,
      },
      {
        role: "ai",
        t: `I'll blend it in and bring it back as one suggested edit — nothing changes until you apply it.`,
        acts: [],
      },
    ])
    say(`Blending into ${s.title} — arrives as one suggested edit`)
    // TODO(suggestion-engine): same integration point as tighten()/runRewrite() —
    // the output contract is one section-level suggested edit via the pessimistic flow.
  }

  // ---- GAP-2: section-header Rewrite instructions popover ----
  const [rewriteSec, setRewriteSec] = React.useState<string | null>(null)
  const [rwText, setRwText] = React.useState("")
  const rwTextRef = React.useRef<HTMLTextAreaElement>(null)
  const openRewrite = (id: string) => {
    setRwText("")
    setRewriteSec(id)
  }
  React.useEffect(() => {
    if (rewriteSec) rwTextRef.current?.focus()
  }, [rewriteSec])
  /** Quick-intent chips INSERT into the field (stackable, editable) — never fire. */
  const rwChip = (text: string) => {
    setRwText((v) => (v ? v.replace(/[.\s]*$/, "") + ". " : "") + text)
    rwTextRef.current?.focus()
  }
  const runRewrite = () => {
    const id = rewriteSec
    if (!id) return
    const s = SECTIONS.find((x) => x.id === id)!
    const instr = rwText.trim()
    setRewriteSec(null)
    setRwText("")
    setTab("assistant")
    // Plain Rewrite = default redraft from the funder's ask + sources, keeping
    // the user's content (snippets included) as material.
    const ask = instr
      ? `Rewrite ${s.title} — ${instr}`
      : `Rewrite ${s.title} (default redraft from the funder's ask and my sources, keeping my content)`
    setMsgs((m) => [
      ...m,
      { role: "user", t: ask },
      {
        role: "ai",
        t: `I'll rewrite ${s.title} and bring it back as one suggested edit — nothing changes until you apply it.`,
        acts: [],
      },
    ])
    say(`Rewriting ${s.title} — arrives as one suggested edit`)
    // TODO(suggestion-engine): same integration point as tighten() — the output
    // contract is one section-level suggested edit through the pessimistic flow.
  }

  const draftSection = (id: string) => {
    setDrafting((d) => new Set(d).add(id))
    setTimeout(() => {
      const s = SECTIONS.find((x) => x.id === id)!
      const text =
        s.body ?? s.p1! + s.p1mark! + s.p1b! + "\n\n" + s.p2a! + SUG.old + s.p2b! + "\n\n" + s.p3!
      setContents((c) => ({ ...c, [id]: text }))
      setAiDrafted((a) => new Set(a).add(id))
      setDrafting((d) => {
        const n = new Set(d)
        n.delete(id)
        return n
      })
      bump(id)
    }, 950)
  }
  const insertSnippet = (snip: { title: string; body: string }) => {
    if (readOnly) return
    const id = active
    if (id === "program" && contents.program === "rich") {
      say("Snippets insert at your cursor. In this prototype, pick an editable section first.")
      return
    }
    setContents((c) => ({ ...c, [id]: c[id] ? c[id] + "\n\n" + snip.body : snip.body }))
    bump(id)
    setJustInserted(id)
    say(`Inserted “${snip.title}” into ${SECTIONS.find((s) => s.id === id)!.title}`)
  }
  const goSec = (id: string) => {
    setActive(id)
    const el = secRefs.current[id]
    if (el && typeof el.scrollIntoView === "function") el.scrollIntoView({ behavior: "smooth", block: "start" })
  }
  const jumpToSug = () => {
    goSec("program")
    setTimeout(() => {
      const el = document.getElementById("sug-anchor")
      if (el) {
        const r = el.getBoundingClientRect()
        setPop({
          kind: "sug",
          x: Math.min(r.left, window.innerWidth - 420),
          y: Math.min(r.bottom + 8, window.innerHeight - 340),
        })
      }
    }, 450)
  }
  const send = () => {
    if (!input.trim()) return
    setMsgs((m) => [
      ...m,
      { role: "user", t: input.trim() },
      {
        role: "ai",
        t: "In the full build I'd take a pass at that. In this prototype, try the underlined suggestion in §3, “Draft this section” on any empty section, or the Snippets tab.",
        acts: sug === "pending" ? ["jump"] : [],
      },
    ])
    setInput("")
  }
  const trySubmit = () => {
    if (openReqs.length) setGate(true)
    else doSubmit()
  }
  const doSubmit = () => {
    setGate(false)
    setStatus("submitted")
    setReqOpen(false)
    setPop(null)
  }
  const duplicate = () => {
    setStatus("draft")
    setTitle((t) => t.replace(/ \(revision\)$/, "") + " (revision)")
    setCopied(new Set())
    say("Duplicated. You are now editing the revision.")
  }
  const downloadPkg = () => {
    const md = [`# ${title}`, `${OPP.funder} · ${OPP.opp}`, ""]
      .concat(
        SECTIONS.map((s) => {
          const body =
            s.id === "program" && contents.program === "rich"
              ? s.p1! + s.p1mark! + s.p1b! + "\n\n" + s.p2a! + (sug === "applied" ? SUG.next : SUG.old) + s.p2b! + "\n\n" + s.p3!
              : contents[s.id] || "(not written)"
          return `## ${s.num}. ${s.title}\n\n${body}\n`
        })
      )
      .join("\n")
    try {
      const blob = new Blob([md], { type: "text/markdown" })
      const a = document.createElement("a")
      a.href = URL.createObjectURL(blob)
      a.download = title.replace(/\s+/g, "-") + ".md"
      a.click()
      URL.revokeObjectURL(a.href)
      say("Package downloaded as Markdown")
    } catch (e) {
      say("Download is available in a full browser")
    }
  }
  /**
   * Copy a section's committed text to the clipboard. The pending suggestion,
   * comment marks, and other working artifacts never make it out — sectionText
   * returns only the applied prose. `portal` mode also ticks the checklist row.
   */
  const copySection = async (s: RespondSection, opts?: { portal?: boolean }) => {
    try {
      await navigator.clipboard.writeText(sectionText(s.id))
    } catch (e) {
      /* clipboard may be blocked */
    }
    if (opts?.portal) {
      setCopied((c) => new Set(c).add(s.id))
      say(`Copied “${s.title}”. Paste it into the portal.`)
    } else {
      say(`${s.title} copied`)
    }
  }

  const openComments = COMMENTS.filter((c) => !resolved.has(c.id))
  const prog = SECTIONS.find((s) => s.id === "program")!

  return (
    <div className="respond-scope editor">
      {/* top bar */}
      <div className="topbar">
        <button className="icon-btn" onClick={onExit} aria-label="Back">
          <Icon name="back" size={18} />
        </button>
        <span className="vd" />
        <div>
          <div className="title">
            {title}
            <span className={cx("chip", status === "submitted" ? "chip-green" : "chip-gray")}>
              {status === "submitted" ? "Submitted" : "Draft"}
            </span>
          </div>
          <div className="sub">
            {OPP.funder} · {OPP.opp} · Due {OPP.due}
          </div>
        </div>
        <div className="grow" />
        <span className="meta">{readOnly ? "Read-only" : "Saved just now"}</span>
        <button className="count-btn" onClick={() => setCpanel((v) => !v)}>
          <Icon name="comment" size={13} />
          {openComments.length}
        </button>
        <button className="icon-btn" aria-label="More">
          <Icon name="more" size={18} />
        </button>
        {status === "draft" ? (
          <button
            className={cx("btn", openReqs.length ? "btn-disabled" : "btn-primary")}
            style={openReqs.length ? { cursor: "pointer" } : undefined}
            onClick={trySubmit}
            title={openReqs.length ? `${openReqs.length} open requirements` : ""}
          >
            Mark as submitted
          </button>
        ) : setup.wmode === "portal" ? (
          <button className="btn btn-primary" onClick={() => say("Would open the funder portal in a new tab")}>
            Open funder portal
          </button>
        ) : (
          <button className="btn btn-primary" onClick={downloadPkg}>
            <Icon name="download" size={13} color="#fff" />
            Download package
          </button>
        )}
      </div>

      {status === "submitted" && (
        <div className="banner">
          <Icon name="check" size={15} />
          {setup.wmode === "portal"
            ? "Marked as submitted Jul 3, 2026. Copy each section into the funder's portal on the right."
            : "Submitted Jul 3, 2026 by Taylor S. This proposal is now read-only."}
          <div className="grow" />
          <button className="btn btn-outline-g" onClick={duplicate}>Duplicate to revise</button>
          {setup.wmode === "document" && (
            <button className="btn btn-green" onClick={downloadPkg}>
              <Icon name="download" size={12} color="#fff" />
              Download package
            </button>
          )}
        </div>
      )}

      <div className="cols">
        {/* outline rail */}
        <div className="rail-l">
          <div className="rail-scroll">
            <div className="rail-head">
              <span className="overline">SECTIONS</span>
              <span className="grow" />
              <Icon name="add" size={15} color="var(--muted)" />
            </div>
            {SECTIONS.map((s) => (
              <button key={s.id} className={cx("sec-row", active === s.id && "on")} onClick={() => goSec(s.id)}>
                <span className="num">{s.num}</span>
                {s.title}
                <span className="st">
                  {secMet(s.id) ? <Icon name="check" size={12} color="var(--pine)" /> : <span className="r-ring" />}
                </span>
              </button>
            ))}
            <div className="rail-head">
              <span className="overline">ATTACHMENTS</span>
              <span className="grow" />
              <Icon name="add" size={15} color="var(--muted)" />
            </div>
            {ATTACHMENTS.map((a) => (
              <button
                key={a.key}
                className="sec-row"
                style={{ fontSize: 11.5 }}
                onClick={() => {
                  if (readOnly) return
                  setAttach((x) => ({ ...x, [a.key]: !x[a.key] }))
                  say(attach[a.key] ? "Attachment removed (simulated)" : "Attachment added (simulated)")
                }}
              >
                <Icon name="clip" size={12} color="var(--faint)" />
                {a.label}
                <span className="st">
                  {attach[a.key] ? <Icon name="check" size={12} color="var(--pine)" /> : <span className="r-ring" />}
                </span>
              </button>
            ))}
          </div>
          <button className="readiness" onClick={() => setReqOpen((v) => !v)} aria-expanded={reqOpen}>
            <div className="row1">
              {metCount} of 9 requirements met
              <span className="grow" />
              <Icon name={reqOpen ? "chevD" : "chevU"} size={14} color="var(--muted)" />
            </div>
            <div className="track">
              <div className={cx("fill", metCount === 9 && "full")} style={{ width: `${(metCount / 9) * 100}%` }} />
            </div>
            <div className="meta">From {OPP.rfp}</div>
          </button>
          {reqOpen && (
            <div className="req-panel">
              <div className="ph">
                <div>
                  <h3>Requirements</h3>
                  <div className="src">Extracted from {OPP.rfp}</div>
                </div>
                <div className="grow" />
                <button className="icon-btn" onClick={() => setReqOpen(false)} aria-label="Close requirements">
                  <Icon name="close" size={14} />
                </button>
              </div>
              <div className="hr" />
              <div className="req-list">
                {REQS.map((r) => {
                  const met = reqMet(r)
                  return (
                    <button
                      key={r.id}
                      className={cx("req-row", !met && "open-item")}
                      onClick={() => {
                        if (r.kind === "section") {
                          goSec(r.sec!)
                          setReqOpen(false)
                        } else if (!readOnly) {
                          setAttach((x) => ({ ...x, [r.att!]: true }))
                          say("Attachment added (simulated)")
                        }
                      }}
                    >
                      {met ? (
                        <Icon name="check" size={13} color="var(--pine)" />
                      ) : (
                        <span className="r-ring" style={{ width: 11, height: 11, borderColor: "var(--amber-icon)" }} />
                      )}
                      <span>
                        <span className="n" style={{ display: "block" }}>{r.name}</span>
                        <span className="m">{r.map}</span>
                      </span>
                      {!met && (
                        <span className="go">
                          <Icon name="chevR" size={14} />
                        </span>
                      )}
                    </button>
                  )
                })}
              </div>
              <div className="hr" />
              <div className="req-foot">
                {openReqs.length ? (
                  <span className="warn-t">
                    {openReqs.length} open item{openReqs.length > 1 ? "s" : ""} block submission
                  </span>
                ) : (
                  <span className="ok-t">All requirements met · ready to submit</span>
                )}
                <button onClick={() => say("Rechecked against the RFP. No new requirements found.")}>
                  Recheck against RFP
                </button>
              </div>
            </div>
          )}
        </div>

        {/* writing surface */}
        <div className="surface">
          <div className="doc">
            {readOnly && (
              <span className="chip chip-gray" style={{ alignSelf: "flex-start" }}>
                <Icon name="lock" size={12} />
                Final submitted version
              </span>
            )}
            {SECTIONS.map((s) => {
              const lim = limits[s.id]
              const isEditingLimit = editingLimit === s.id
              const wc = countOf(s.id, lim?.unit ?? "words")
              const over = !!lim && wc > lim.value
              const warn = !!lim && !over && wc >= lim.value * 0.85
              // Emptiness is COMPUTED, not a one-time event — deleting all
              // content restores the empty affordances (GAP-3).
              const raw = contents[s.id]
              const isEmpty = raw === null || (typeof raw === "string" && raw.trim() === "")
              return (
              <div
                key={s.id}
                className="doc-sec"
                ref={(el) => {
                  secRefs.current[s.id] = el
                }}
                onClick={() => setActive(s.id)}
              >
                <div className="sec-head">
                  <div className="overline" style={{ color: "var(--faint)" }}>
                    SECTION {s.num} OF 7
                  </div>
                  <div className="sec-titlerow">
                    <h3>{s.title}</h3>
                    {!readOnly && (
                      <span className="header-actions">
                        <button
                          className="hdr-act"
                          title="Copy section"
                          aria-label={`Copy ${s.title}`}
                          onClick={(e) => {
                            e.stopPropagation()
                            copySection(s)
                          }}
                        >
                          <Icon name="copy" size={13} />
                        </button>
                        <button
                          className="hdr-act"
                          title="Rewrite section"
                          aria-label={`Rewrite ${s.title}`}
                          onClick={(e) => {
                            e.stopPropagation()
                            if (rewriteSec === s.id) setRewriteSec(null)
                            else openRewrite(s.id)
                          }}
                        >
                          <AiIcon size={13} />
                        </button>
                      </span>
                    )}
                    {rewriteSec === s.id && (
                      <div
                        className="pop rewrite-pop"
                        role="dialog"
                        aria-label={`Rewrite ${s.title}`}
                        onClick={(e) => e.stopPropagation()}
                        onKeyDown={(e) => {
                          if (e.key === "Escape") {
                            e.preventDefault()
                            setRewriteSec(null)
                          }
                        }}
                      >
                        <div className="pop-head">
                          <AiIcon size={13} />
                          Rewrite this section
                        </div>
                        <div className="hr" />
                        <div className="pop-body">
                          <textarea
                            ref={rwTextRef}
                            className="rw-input"
                            placeholder="Tell it how — tone, structure, what to keep… (optional)"
                            value={rwText}
                            onChange={(e) => setRwText(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === "Enter" && !e.shiftKey) {
                                e.preventDefault()
                                runRewrite()
                              }
                            }}
                          />
                          <div className="rw-chips">
                            {["Smooth in my snippet", "More formal", "Tighten to the limit", "Lead with local data"].map(
                              (c) => (
                                <button key={c} className="rw-chip" onClick={() => rwChip(c)}>
                                  {c}
                                </button>
                              )
                            )}
                          </div>
                        </div>
                        <div className="hr" />
                        <div className="pop-foot">
                          <span className="meta">Arrives as a suggested edit</span>
                          <button
                            className="btn btn-ghost"
                            style={{ padding: "6px 12px", fontSize: 11 }}
                            onClick={() => setRewriteSec(null)}
                          >
                            Cancel
                          </button>
                          <button
                            className="btn btn-primary"
                            style={{ padding: "6px 14px", fontSize: 11 }}
                            onClick={runRewrite}
                          >
                            Rewrite
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                  <div className="smeta">
                    {isEditingLimit ? (
                      <span
                        className="limit-editor"
                        onClick={(e) => e.stopPropagation()}
                        onBlur={(e) => {
                          if (!e.currentTarget.contains(e.relatedTarget as Node)) commitLimit()
                        }}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            e.preventDefault()
                            commitLimit()
                          }
                          if (e.key === "Escape") {
                            e.preventDefault()
                            setEditingLimit(null)
                          }
                        }}
                      >
                        <input
                          ref={limitInputRef}
                          type="number"
                          min={1}
                          value={draftLimit.value}
                          aria-label="Word or character limit"
                          onChange={(e) => setDraftLimit((d) => ({ ...d, value: e.target.value }))}
                        />
                        <select
                          value={draftLimit.unit}
                          aria-label="Limit unit"
                          onChange={(e) => setDraftLimit((d) => ({ ...d, unit: e.target.value as LimitUnit }))}
                        >
                          <option value="words">words</option>
                          <option value="characters">characters</option>
                        </select>
                        <button className="limit-remove" onClick={removeLimit}>
                          Remove limit
                        </button>
                      </span>
                    ) : (
                      <>
                        <span className={cx("wc", over && "over", warn && "warn")}>
                          {lim ? `${wc} / ${lim.value} ${lim.unit}` : `${wc} words`}
                        </span>
                        {!readOnly && (
                          <button
                            className="edit-limit"
                            onClick={(e) => {
                              e.stopPropagation()
                              startEditLimit(s.id)
                            }}
                          >
                            {lim ? "Edit Limit" : "+ Set word or character limit"}
                          </button>
                        )}
                      </>
                    )}
                    <span style={{ width: 3, height: 3, borderRadius: 2, background: "#b4bdcd" }} /> Requirement:{" "}
                    {displayReq(s)}
                  </div>
                </div>
                {s.id === "program" && contents.program === "rich" ? (
                  <>
                    <div className="body">
                      {prog.p1}
                      <button
                        className="cm-mark"
                        onClick={(e) => {
                          e.stopPropagation()
                          setPop({
                            kind: "thread",
                            x: Math.min(e.clientX - 100, window.innerWidth - 420),
                            y: Math.min(e.clientY + 12, window.innerHeight - 320),
                          })
                        }}
                      >
                        {prog.p1mark}
                      </button>
                      {prog.p1b}
                    </div>
                    <div className="body">
                      {prog.p2a}
                      {sug === "pending" ? (
                        <button
                          id="sug-anchor"
                          className="sug"
                          onClick={(e) => {
                            e.stopPropagation()
                            setPop({
                              kind: "sug",
                              x: Math.min(e.clientX - 120, window.innerWidth - 420),
                              y: Math.min(e.clientY + 14, window.innerHeight - 340),
                            })
                          }}
                        >
                          {SUG.old}
                        </button>
                      ) : (
                        <span>{sug === "applied" ? SUG.next : SUG.old}</span>
                      )}
                      {prog.p2b}
                    </div>
                    {sug === "pending" && !readOnly && (
                      <button
                        className="chip chip-ai sug-hint"
                        style={{ background: "var(--ai-soft)", padding: "5px 10px", fontSize: 11, fontWeight: 500 }}
                        onClick={jumpToSug}
                      >
                        <AiIcon size={11} /> 1 suggested edit in this section · click underlined text to preview
                      </button>
                    )}
                    <div className="body">{prog.p3}</div>
                    <div className="src-chips">
                      <span className="lbl">Sources:</span>
                      {prog.sources!.map((x) => (
                        <span key={x} className="sc">{x}</span>
                      ))}
                    </div>
                  </>
                ) : drafting.has(s.id) ? (
                  <div className="drafting">
                    <span className="spin mini-spin" style={{ borderTopColor: "var(--ai-a)" }} />
                    Drafting from your source material…
                  </div>
                ) : (
                  <div className="empty-scaffold">
                    {/* No card, no dashed border — an empty section is plain
                        document space: a caret + ghost placeholder at body
                        metrics, with the two actions left-aligned beneath. */}
                    {isEmpty && !readOnly && (
                      <div className="ghost-line" aria-hidden="true">
                        <span className="ghost-caret" />
                        <span className="ghost-text">Start typing, or take the first pass with AI…</span>
                      </div>
                    )}
                    {/* Tick is always rendered (opacity-toggled) so the Body's
                        DOM position is stable and never remounts mid-edit. */}
                    <div className="body-wrap">
                      <span
                        className={cx("inserted-tick", justInserted === s.id && "on")}
                        aria-hidden="true"
                      />
                      <Body
                        id={s.id}
                        text={(contents[s.id] as string) || ""}
                        version={versions[s.id] || 0}
                        readOnly={readOnly}
                        onEdit={onEdit}
                      />
                    </div>
                    {justInserted === s.id && !readOnly && (
                      <div className="blend-row">
                        <button
                          className="chip-btn ai"
                          style={{ background: "var(--ai-soft)" }}
                          onClick={(e) => {
                            e.stopPropagation()
                            blend(s.id)
                          }}
                        >
                          <AiIcon size={12} />
                          Blend snippet into this section
                        </button>
                      </div>
                    )}
                    {isEmpty ? (
                      !readOnly && (
                        <>
                          <div className="empty-actions">
                            <button
                              className="chip-btn ai"
                              style={{ background: "var(--ai-soft)" }}
                              onClick={(e) => {
                                e.stopPropagation()
                                draftSection(s.id)
                              }}
                            >
                              <AiIcon size={12} />
                              Draft this section
                            </button>
                            <button
                              className="chip-btn ghost"
                              onClick={(e) => {
                                e.stopPropagation()
                                setTab("snippets")
                              }}
                            >
                              Insert snippet
                            </button>
                          </div>
                          <div className="empty-caption">
                            Uses the funder's instructions plus your selected source material
                          </div>
                        </>
                      )
                    ) : (
                      aiDrafted.has(s.id) && (
                        <span
                          className="chip chip-ai ai-badge"
                          style={{ background: "var(--ai-soft)", fontWeight: 500, fontSize: 10, padding: "4px 9px" }}
                        >
                          <AiIcon size={10} /> Drafted with AI · review before submitting
                        </span>
                      )
                    )}
                  </div>
                )}
                {over && !readOnly && (
                  <div className="tighten-row">
                    <button
                      className="chip-btn ai"
                      style={{ background: "var(--ai-soft)" }}
                      onClick={(e) => {
                        e.stopPropagation()
                        tighten(s.id)
                      }}
                    >
                      <AiIcon size={12} />
                      Tighten to fit the {lim!.value} {lim!.unit} limit
                    </button>
                  </div>
                )}
              </div>
              )
            })}
          </div>
        </div>

        {/* right rail */}
        <div className="rail-r">
          {status === "submitted" && setup.wmode === "portal" ? (
            <>
              <div style={{ padding: "14px 14px 10px" }}>
                <h3 style={{ fontSize: 13, fontWeight: 600 }}>Submission checklist</h3>
                <div className="meta" style={{ marginTop: 2 }}>Copy each section into the portal, then check it off.</div>
              </div>
              <div className="hr" />
              <div className="rail-scrolly" style={{ gap: 6 }}>
                {SECTIONS.map((s) => (
                  <div key={s.id} className={cx("check-row", copied.has(s.id) && "done")}>
                    <Checkbox className="r-cb mini" iconSize={10} checked={copied.has(s.id)} aria-hidden tabIndex={-1} />
                    <span className="n">{s.title}</span>
                    <button className="copy-btn" onClick={() => copySection(s, { portal: true })}>
                      <Icon name="copy" size={11} />
                      {copied.has(s.id) ? "Copied" : "Copy"}
                    </button>
                  </div>
                ))}
              </div>
              <div className="rail-foot">
                <strong style={{ fontSize: 11.5 }}>{copied.size} of 7 sections copied</strong>
                <div className="track" style={{ margin: 0 }}>
                  <div className="fill" style={{ width: `${(copied.size / 7) * 100}%`, background: "var(--pine)" }} />
                </div>
                <button
                  className="btn btn-primary"
                  style={{ alignSelf: "flex-start", padding: "7px 12px", fontSize: 11 }}
                  onClick={() => say("Would open the funder portal in a new tab")}
                >
                  <Icon name="open" size={12} color="#fff" />
                  Open funder portal
                </button>
              </div>
            </>
          ) : (
            <Tabs
              value={tab}
              onValueChange={(v) => setTab(v as TabKey)}
              style={{ display: "flex", flexDirection: "column", flex: 1, minHeight: 0 }}
            >
              <TabsList className="rail-tabs">
                {(["assistant", "context", "snippets"] as TabKey[]).map((t) => (
                  <TabsTrigger key={t} className="rail-tab" value={t}>
                    {t[0].toUpperCase() + t.slice(1)}
                  </TabsTrigger>
                ))}
              </TabsList>

              {/* Plain flex-growing wrapper: Radix TabsContent doesn't grow as a
                  flex child here, so the panels fill this via position:absolute. */}
              <div style={{ position: "relative", flex: 1, minHeight: 0 }}>
              <TabsContent
                value="assistant"
                style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column" }}
              >
                <div className="rail-scrolly">
                  <div className="scopeline">
                    <AiIcon size={11} />
                    Working in: {SECTIONS.find((s) => s.id === active)!.title}
                  </div>
                  {msgs.map((m, i) =>
                    m.role === "ai" ? (
                      <div key={i} className="msg-ai">
                        {m.t}
                        {m.acts?.includes("jump") && sug === "pending" && (
                          <div className="msg-acts">
                            <button
                              style={{ background: "var(--ai-soft)", border: 0, color: "var(--ai-text)", fontWeight: 600 }}
                              onClick={jumpToSug}
                            >
                              <AiIcon size={10} style={{ marginRight: 5 }} />
                              Jump to suggestion
                            </button>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div key={i} className="msg-user">{m.t}</div>
                    )
                  )}
                </div>
                {!readOnly && (
                  <div className="composer">
                    <div className="meta" style={{ fontSize: 10 }}>Applies to every draft:</div>
                    <div className="ichips">
                      {chips.map((c) => (
                        <span key={c} className="ichip">
                          {c}
                          <button onClick={() => setChips(chips.filter((x) => x !== c))} aria-label={`Remove ${c}`}>
                            <Icon name="close" size={10} />
                          </button>
                        </span>
                      ))}
                    </div>
                    <div className="chat-input">
                      <input
                        placeholder="Ask about this proposal or request an edit…"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && send()}
                      />
                      <button onClick={send} aria-label="Send">
                        <Icon name="send" size={14} />
                      </button>
                    </div>
                  </div>
                )}
              </TabsContent>

              <TabsContent value="context" style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column" }}>
                <div className="rail-scrolly">
                  <div className="overline" style={{ letterSpacing: ".05em" }}>WHAT THE AI IS USING</div>
                  <div className="ctx-card">
                    <h4>Uploaded for this proposal</h4>
                    <div className="ctx-file">
                      <Icon name="doc" size={13} color="var(--muted)" />
                      <span>
                        {OPP.rfp}
                        <span className="fm" style={{ display: "block" }}>9 requirements extracted</span>
                      </span>
                    </div>
                    <div className="ctx-file">
                      <Icon name="doc" size={13} color={ctxDone ? "var(--muted)" : "var(--amber-icon)"} />
                      <span>
                        2025-Impact-Report.pdf
                        <span className={cx("fm", !ctxDone && "busy")} style={{ display: "block" }}>
                          {ctxDone ? "Ready" : "Still processing… you can keep writing"}
                        </span>
                      </span>
                    </div>
                    <div className="meta">Uploads rank first when drafting.</div>
                  </div>
                  <div className="ctx-card">
                    <h4>Project · {OPP.initiative}</h4>
                    <div className="ctx-file">
                      <Icon name="doc" size={13} color="var(--muted)" />
                      <span>
                        Program goals & outcomes
                        <span className="fm" style={{ display: "block" }}>6 outcomes available</span>
                      </span>
                    </div>
                    <div className="ctx-file">
                      <Icon name="doc" size={13} color="var(--muted)" />
                      <span>
                        TNR budget 2026.xlsx
                        <span className="fm" style={{ display: "block" }}>Line items available</span>
                      </span>
                    </div>
                  </div>
                  <div className="ctx-card">
                    <h4>Organization profile</h4>
                    <div className="ctx-file">
                      <Icon name="org" size={13} color="var(--muted)" />
                      <span>
                        {OPP.org}
                        <span className="fm" style={{ display: "block" }}>Mission, EIN, service area, staffing</span>
                      </span>
                    </div>
                    <div className="meta">Always included, lowest priority.</div>
                  </div>
                  <button
                    className="btn btn-ghost"
                    style={{ alignSelf: "flex-start", padding: "7px 12px", fontSize: 11 }}
                    onClick={() => say("Would open the upload / library picker")}
                  >
                    <Icon name="upload" size={13} color="var(--slate)" />
                    Add more context
                  </button>
                </div>
              </TabsContent>

              <TabsContent value="snippets" style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column" }}>
                <div className="rail-scrolly">
                  <div className="chat-input" style={{ padding: "6px 6px 6px 12px" }}>
                    <Icon name="search" size={13} color="var(--faint)" />
                    <input placeholder="Search snippets" readOnly />
                  </div>
                  <div style={{ display: "flex", gap: 6 }}>
                    <span className="chip" style={{ background: "var(--slate)", color: "#fff", borderRadius: 12, padding: "4px 10px" }}>All</span>
                    <span className="chip" style={{ border: "1px solid var(--hair-strong)", color: "var(--chipgray-ink)", borderRadius: 12, padding: "4px 10px", fontWeight: 500 }}>Organization</span>
                    <span className="chip" style={{ border: "1px solid var(--hair-strong)", color: "var(--chipgray-ink)", borderRadius: 12, padding: "4px 10px", fontWeight: 500 }}>TNR</span>
                  </div>
                  {SNIPPETS.map((s) => (
                    <div key={s.id} className="snip-card">
                      <h4>
                        <Icon name="book" size={12} color="var(--slate)" />
                        {s.title}
                      </h4>
                      <div className="b">{s.body}</div>
                      <div className="f">
                        <span className="chip chip-tan">{s.scope}</span>
                        <span className="meta">{s.uses}</span>
                        <button className="ins" onClick={() => insertSnippet(s)}>Insert</button>
                      </div>
                    </div>
                  ))}
                  <div className="tip">Tip: select any text in the document and choose Save as snippet to add it here.</div>
                </div>
              </TabsContent>
              </div>
            </Tabs>
          )}
        </div>
      </div>

      {/* floating selection toolbar */}
      {selBar && !readOnly && (
        <div
          className="toolbar sel-float"
          style={{ position: "fixed", left: selBar.x, top: selBar.y, zIndex: 45 }}
          onMouseDown={(e) => e.preventDefault()}
        >
          <button className="tb-btn" aria-label="Bold"><Icon name="bold" size={15} /></button>
          <button className="tb-btn" aria-label="Italic"><Icon name="italic" size={15} /></button>
          <button className="tb-btn" aria-label="Heading"><Icon name="h1" size={15} /></button>
          <button className="tb-btn" aria-label="List"><Icon name="ulist" size={15} /></button>
          <span className="vd" style={{ width: 1, height: 16, background: "#e8ebee" }} />
          <button className="tb-btn" aria-label="Comment" onClick={() => say("Would start a comment on the selection")}>
            <Icon name="comment" size={14} />
          </button>
          <button
            className="tb-btn"
            style={{ fontSize: 10.5, fontWeight: 500, gap: 4, display: "inline-flex", alignItems: "center" }}
            onClick={() => say("Saved selection as a snippet (simulated)")}
          >
            <Icon name="book" size={13} />Save as snippet
          </button>
          <span className="vd" style={{ width: 1, height: 16, background: "#e8ebee" }} />
          <button className="tb-ai" onClick={() => { setTab("assistant"); say("Selection sent to the assistant") }}>
            <AiIcon size={12} />Ask AI
          </button>
        </div>
      )}

      {/* suggestion popover */}
      {pop?.kind === "sug" && (
        <>
          <div style={{ position: "fixed", inset: 0, zIndex: 55 }} onClick={() => setPop(null)} />
          <div className="pop" style={{ left: Math.max(12, pop.x), top: pop.y }}>
            <div className="pop-head">
              <AiIcon size={13} />
              Suggested edit
              <span className="grow" />
              <span className="meta">1 of 1</span>
            </div>
            <div className="hr" />
            <div className="pop-body">
              <div className="diff rm">
                <span className="lbl">REMOVES</span>
                <span className="txt">{SUG.old}</span>
              </div>
              <div className="diff add">
                <span className="lbl">ADDS</span>
                {SUG.next}
              </div>
              <div className="why">Why: {SUG.why}</div>
            </div>
            <div className="hr" />
            <div className="pop-foot">
              <span className="meta">Nothing changes until you apply</span>
              <button
                className="btn btn-ghost"
                style={{ padding: "6px 12px", fontSize: 11 }}
                onClick={() => {
                  setSug("dismissed")
                  setPop(null)
                }}
              >
                Dismiss
              </button>
              <button
                className="btn btn-primary"
                style={{ padding: "6px 14px", fontSize: 11 }}
                onClick={() => {
                  setSug("applied")
                  setPop(null)
                  say("Edit applied to §3 Program Description")
                }}
              >
                Apply edit
              </button>
            </div>
          </div>
        </>
      )}

      {/* comment thread popover */}
      {pop?.kind === "thread" && (
        <>
          <div style={{ position: "fixed", inset: 0, zIndex: 55 }} onClick={() => setPop(null)} />
          <div className="pop" style={{ left: Math.max(12, pop.x), top: pop.y, width: 340 }}>
            <div className="thread-anchor">ON: &ldquo;Operating four days per week…&rdquo;</div>
            <div className="pop-body">
              <div className="cmsg">
                <div className="who">
                  <Ava ini="ES" color="#4a6080" />
                  Erin S.<span className="when">Yesterday</span>
                </div>
                <div className="t">Should we say five days? We added Saturdays in the spring.</div>
              </div>
              <div className="cmsg">
                <div className="who">
                  <Ava ini="TS" color="#7b5e7c" />
                  Taylor S.<span className="when">2h ago</span>
                </div>
                <div className="t">
                  Saturdays are grant-funded through August only. Keep four and mention Saturday pilots in
                  Sustainability?
                </div>
              </div>
              <button className="reply">Reply…</button>
            </div>
            <div className="hr" />
            <div className="pop-foot">
              <button
                className="resolve"
                onClick={() => {
                  setResolved((r) => new Set(r).add("c1"))
                  setPop(null)
                  say("Thread resolved")
                }}
              >
                <Icon name="check" size={13} />
                Resolve thread
              </button>
            </div>
          </div>
        </>
      )}

      {/* comments panel */}
      {cpanel && (
        <>
          <div style={{ position: "fixed", inset: 0, zIndex: 50 }} onClick={() => setCpanel(false)} />
          <div className="cpanel">
            <div className="pop-head">
              <Icon name="comment" size={14} color="var(--chipgray-ink)" />
              Comments
              <div className="seg">
                <button className="on">Open · {openComments.length}</button>
                <button>Resolved · {5 + resolved.size}</button>
              </div>
            </div>
            <div className="hr" />
            <div className="pop-body" style={{ gap: 8 }}>
              {openComments.map((c) => (
                <div key={c.id} className="citem">
                  <div className="who" style={{ display: "flex", alignItems: "center", gap: 7, fontSize: 11, fontWeight: 600 }}>
                    <Ava ini={c.ini} color={c.color} />
                    {c.who}
                    <span className="grow" />
                    <span className="meta">{c.when}</span>
                  </div>
                  <div className="b">{c.body}</div>
                  <span
                    className="chip"
                    style={{ background: "var(--wash)", color: "var(--slate)", fontSize: 9, alignSelf: "flex-start" }}
                  >
                    {c.sec}
                  </span>
                </div>
              ))}
              {!openComments.length && (
                <div className="meta" style={{ textAlign: "center", padding: 10 }}>No open comments. Nice.</div>
              )}
            </div>
          </div>
        </>
      )}

      {/* readiness gate */}
      {gate && (
        <div style={scrimStyle}>
          <div className="modal" style={{ width: 520 }}>
            <div className="modal-head">
              <div>
                <h2>Almost ready to submit</h2>
                <p>
                  {openReqs.length} requirement{openReqs.length > 1 ? "s" : ""} from the RFP{" "}
                  {openReqs.length > 1 ? "are" : "is"} still open.
                </p>
              </div>
              <div className="grow" />
              <button className="icon-btn" onClick={() => setGate(false)} aria-label="Close">
                <Icon name="close" size={18} />
              </button>
            </div>
            <div className="hr" />
            <div className="modal-body" style={{ gap: 8 }}>
              {openReqs.map((r) => (
                <button
                  key={r.id}
                  className="warn-inline"
                  style={{ alignItems: "center", width: "100%", textAlign: "left" }}
                  onClick={() => {
                    setGate(false)
                    if (r.kind === "section") goSec(r.sec!)
                    else setReqOpen(true)
                  }}
                >
                  <Icon name="warn" size={14} color="var(--amber-icon)" />
                  <div style={{ flex: 1 }}>
                    <strong>{r.name}</strong>
                    {r.kind === "section" ? `${r.map} · ${wordsOf(r.sec!)} words` : "Attachment not uploaded"}
                  </div>
                  <span style={{ fontWeight: 600, fontSize: 10.5, display: "inline-flex", alignItems: "center", gap: 2 }}>
                    Go to item
                    <Icon name="chevR" size={12} />
                  </span>
                </button>
              ))}
              <div className="meta" style={{ lineHeight: 1.5 }}>
                You can still mark this as submitted if you handled these outside Grant Assistant. The requirement
                list stays with the proposal for your records.
              </div>
            </div>
            <div className="hr" />
            <div className="modal-foot">
              <button className="btn btn-ghost" onClick={() => setGate(false)}>Keep working</button>
              <div className="grow" />
              <button className="btn btn-ghost" onClick={doSubmit}>Mark as submitted anyway</button>
              <button className="btn btn-primary" onClick={() => { setGate(false); setReqOpen(true) }}>
                Resolve open items
              </button>
            </div>
          </div>
        </div>
      )}

      {toast && <div className="toast">{toast}</div>}
    </div>
  )
}

function Ava({ ini, color }: { ini: string; color: string }) {
  return (
    <span className="ava" style={{ background: color }}>
      {ini}
    </span>
  )
}
