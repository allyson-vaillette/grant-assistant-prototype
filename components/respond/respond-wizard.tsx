"use client"

import * as React from "react"

import { DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Checkbox } from "@/components/ui/checkbox"
import { Icon } from "@/components/respond/icons"
import {
  OPP,
  SOURCES,
  LIB,
  PICKER_NAMES,
  PICKER_FULL_NAMES,
} from "@/lib/respond-data"

const cx = (...a: (string | false | null | undefined)[]) => a.filter(Boolean).join(" ")

export interface CreateParams {
  mode: "ai" | "self"
  wmode: "document" | "portal"
  name: string
  gapsC3: boolean
  gapsBoard: boolean
}

interface WizardState {
  step: 1 | 2 | 3
  name: string
  mode: "document" | "portal"
  project: string | null
  projectMenu: boolean
  rfpUp: boolean
  pasteOpen: boolean
  pastedText: string
  urlOpen: boolean
  urlValue: string
  urls: string[]
  srcSel: Record<string, boolean>
  gaps: { c3: boolean; board: boolean }
  expanded: boolean
  picker: boolean
  pickerView: "root" | "budg"
  pickerSel: Set<string>
  picks: string[]
  uploads: string[]
}

/** Projects the org can attach (mirrors the picker rail + repo Project model). */
const PROJECTS = ["Community Cat TNR", "Shelter Medicine", "General"]

const INITIAL: WizardState = {
  step: 1,
  name: "Petco Love Lost & Found Proposal",
  mode: "document",
  project: OPP.initiative,
  projectMenu: false,
  rfpUp: true,
  pasteOpen: false,
  pastedText: "",
  urlOpen: false,
  urlValue: "",
  urls: [],
  srcSel: { petco: true, impact: true, tnrbudget: true },
  gaps: { c3: false, board: false },
  expanded: false,
  picker: false,
  pickerView: "root",
  pickerSel: new Set(),
  picks: [],
  uploads: [],
}

/**
 * The 3-step creation flow, ported from the prototype's Wizard/Picker. State
 * model is preserved exactly: a light Step 3 with an expandable "Adjust" state,
 * gap adds that flip requirements, a library picker with persistent selection,
 * and the draft-for-me vs write-myself fork. Uses shadcn Dialog/Checkbox.
 */
export function RespondWizard({
  onClose,
  onCreate,
}: {
  onClose: () => void
  onCreate: (params: CreateParams) => void
}) {
  const [w, setW] = React.useState<WizardState>(INITIAL)
  const set = (patch: Partial<WizardState>) => setW((s) => ({ ...s, ...patch }))

  const selCount =
    Object.values(w.srcSel).filter(Boolean).length + w.uploads.length + w.picks.length
  const gapsOpen = (["c3", "board"] as const).filter((k) => !w.gaps[k])

  const create = (draftMode: "ai" | "self") =>
    onCreate({
      mode: draftMode,
      wmode: w.mode,
      name: w.name,
      gapsC3: w.gaps.c3,
      gapsBoard: w.gaps.board,
    })

  const head = (title: string, sub: string) => (
    <>
      <div className="modal-head">
        <div>
          <DialogTitle asChild>
            <h2>{title}</h2>
          </DialogTitle>
          <DialogDescription asChild>
            <p>{sub}</p>
          </DialogDescription>
        </div>
        <div className="grow" />
        <span className="chip chip-gray">Step {w.step} of 3</span>
        <button className="icon-btn" onClick={onClose} aria-label="Close">
          <Icon name="close" size={18} />
        </button>
      </div>
      <div className="hr" />
    </>
  )

  const contentProps = {
    className: cx("respond-scope", "modal", w.picker && "modal-wide"),
    onPointerDownOutside: (e: Event) => e.preventDefault(),
  }

  if (w.picker) {
    return (
      <DialogContent {...contentProps}>
        <Picker w={w} set={set} />
      </DialogContent>
    )
  }

  return (
    <DialogContent {...contentProps}>
      {w.step === 1 && (
        <>
          {head("Start writing", `${OPP.funder} · ${OPP.opp}`)}
          <div className="modal-body">
            <div className="field">
              <label htmlFor="pname">Proposal name</label>
              <input
                id="pname"
                className="input"
                value={w.name}
                onChange={(e) => set({ name: e.target.value })}
              />
              <div className="hint">Pre-filled from the opportunity. You can rename it any time.</div>
            </div>
            <div className="field">
              <label>How will you submit this proposal?</label>
              <div className="mode-cards">
                <button
                  className={cx("mode-card", w.mode === "document" && "on")}
                  onClick={() => set({ mode: "document" })}
                >
                  <span className="t">
                    <Icon name="doc" size={15} color={w.mode === "document" ? "var(--slate)" : "var(--muted)"} />
                    Document
                  </span>
                  <span className="d">Write a full document and export a package to send or upload.</span>
                </button>
                <button
                  className={cx("mode-card", w.mode === "portal" && "on")}
                  onClick={() => set({ mode: "portal" })}
                >
                  <span className="t">
                    <Icon name="globe" size={15} color={w.mode === "portal" ? "var(--slate)" : "var(--muted)"} />
                    Portal
                  </span>
                  <span className="d">Answer questions to copy into the funder's online portal.</span>
                </button>
              </div>
            </div>
          </div>
          <div className="hr" />
          <div className="modal-foot">
            <button className="btn btn-ghost" onClick={onClose}>Cancel</button>
            <div className="grow" />
            <button className="btn btn-primary" onClick={() => set({ step: 2 })}>
              Next · Funder instructions
            </button>
          </div>
        </>
      )}

      {w.step === 2 && (
        <>
          {head("Add the funder's instructions", "We'll turn these into your requirements checklist.")}
          <div className="modal-body">
            <div className="field">
              <label>
                Project{" "}
                <span style={{ fontWeight: 600, fontSize: 9, color: "var(--muted)", letterSpacing: ".03em" }}>
                  RECOMMENDED
                </span>
              </label>
              <div style={{ position: "relative" }}>
                <button
                  className="input"
                  style={{ display: "flex", alignItems: "center", gap: 8, textAlign: "left" }}
                  onClick={() => set({ projectMenu: !w.projectMenu })}
                  aria-haspopup="listbox"
                  aria-expanded={w.projectMenu}
                >
                  {w.project ? (
                    <span className="chip chip-tan">{w.project}</span>
                  ) : (
                    <span style={{ color: "var(--faint)" }}>Select a project</span>
                  )}
                  <span className="grow" />
                  <Icon name="chevD" size={16} color="var(--muted)" />
                </button>
                {w.projectMenu && (
                  <div
                    role="listbox"
                    style={{
                      position: "absolute", top: "calc(100% + 4px)", left: 0, right: 0, zIndex: 10,
                      background: "var(--paper)", border: "1px solid var(--hair-strong)", borderRadius: 8,
                      boxShadow: "var(--shadow-pop)", padding: 4, display: "flex", flexDirection: "column",
                    }}
                  >
                    {PROJECTS.map((p) => (
                      <button
                        key={p}
                        role="option"
                        aria-selected={w.project === p}
                        className="src-row"
                        onClick={() => set({ project: p, projectMenu: false })}
                      >
                        <span className="name">{p}</span>
                        <span className="grow" />
                        {w.project === p && <Icon name="check" size={13} color="var(--slate)" />}
                      </button>
                    ))}
                    <div className="hr" style={{ margin: "4px 0" }} />
                    <button
                      className="src-row"
                      style={{ color: "var(--muted)" }}
                      onClick={() => set({ project: null, projectMenu: false })}
                    >
                      <span className="name" style={{ color: "var(--muted)" }}>No project</span>
                    </button>
                  </div>
                )}
              </div>
              {!w.project && (
                <div className="warn-inline" style={{ marginTop: 8 }}>
                  <Icon name="warn" size={15} color="var(--amber-icon)" />
                  <div>
                    <strong>No project selected</strong>
                    Drafts will rely on your organization profile only. Linking a project gives the AI your program
                    goals, outcomes, and budget context.
                  </div>
                </div>
              )}
            </div>
            <div className="field">
              <label>Application instructions</label>
              {!w.rfpUp ? (
                <button className="dropzone" onClick={() => set({ rfpUp: true })}>
                  <Icon name="upload" size={20} color="var(--slate)" />
                  <strong>Drop the RFP here or browse files</strong>
                  <span className="meta">RFP, grant guidelines, NOFO, or the list of application questions</span>
                </button>
              ) : (
                <div className="file-row">
                  <span className="fbadge">PDF</span>
                  <div>
                    <div className="name">{OPP.rfp}</div>
                    <div className="meta">1.2 MB · uploaded just now</div>
                  </div>
                  <div className="grow" />
                  <button className="icon-btn" onClick={() => set({ rfpUp: false })} aria-label="Remove file">
                    <Icon name="close" size={14} />
                  </button>
                </div>
              )}
              <div className="alt-row" style={{ marginTop: 8 }}>
                <button
                  className={cx("btn", "btn-ghost", w.pasteOpen && "on")}
                  style={{ padding: "7px 12px", fontSize: 11, ...(w.pasteOpen ? { borderColor: "var(--slate)", color: "var(--slate)" } : {}) }}
                  onClick={() => set({ pasteOpen: !w.pasteOpen, urlOpen: false })}
                >
                  <Icon name="paste" size={13} />Paste text
                </button>
                <button
                  className={cx("btn", "btn-ghost", w.urlOpen && "on")}
                  style={{ padding: "7px 12px", fontSize: 11, ...(w.urlOpen ? { borderColor: "var(--slate)", color: "var(--slate)" } : {}) }}
                  onClick={() => set({ urlOpen: !w.urlOpen, pasteOpen: false })}
                >
                  <Icon name="link" size={13} />Add a URL
                </button>
                <button
                  className="btn btn-ghost"
                  style={{ padding: "7px 12px", fontSize: 11 }}
                  onClick={() => set({ picker: true, pickerView: "root" })}
                >
                  <Icon name="folder" size={13} />Add from library
                </button>
              </div>

              {w.pasteOpen && (
                <div style={{ marginTop: 8 }}>
                  <textarea
                    className="input"
                    style={{ minHeight: 96, resize: "vertical", fontFamily: "var(--sans)" }}
                    placeholder="Paste the funder's application questions or guidelines here…"
                    value={w.pastedText}
                    onChange={(e) => set({ pastedText: e.target.value })}
                    autoFocus
                  />
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 6 }}>
                    <button
                      className={cx("btn", w.pastedText.trim() ? "btn-primary" : "btn-disabled")}
                      style={{ padding: "6px 12px", fontSize: 11 }}
                      disabled={!w.pastedText.trim()}
                      onClick={() => set({ rfpUp: true, pasteOpen: false })}
                    >
                      Use this text
                    </button>
                    <span className="meta">We'll extract requirements from what you paste.</span>
                  </div>
                </div>
              )}

              {w.urlOpen && (
                <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
                  <input
                    className="input"
                    style={{ flex: 1 }}
                    placeholder="https://funder.org/grant-guidelines"
                    value={w.urlValue}
                    onChange={(e) => set({ urlValue: e.target.value })}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && w.urlValue.trim()) {
                        set({ urls: [...w.urls, w.urlValue.trim()], urlValue: "", urlOpen: false })
                      }
                    }}
                    autoFocus
                  />
                  <button
                    className={cx("btn", w.urlValue.trim() ? "btn-primary" : "btn-disabled")}
                    style={{ padding: "8px 14px", fontSize: 11 }}
                    disabled={!w.urlValue.trim()}
                    onClick={() => set({ urls: [...w.urls, w.urlValue.trim()], urlValue: "", urlOpen: false })}
                  >
                    Add
                  </button>
                </div>
              )}

              {w.urls.map((u) => (
                <div key={u} className="file-row" style={{ marginTop: 8 }}>
                  <span className="fbadge" style={{ background: "#e8eef4", color: "var(--slate)" }}>URL</span>
                  <div>
                    <div className="name" style={{ wordBreak: "break-all" }}>{u}</div>
                    <div className="meta">Linked · we'll read it for requirements</div>
                  </div>
                  <div className="grow" />
                  <button
                    className="icon-btn"
                    onClick={() => set({ urls: w.urls.filter((x) => x !== u) })}
                    aria-label="Remove URL"
                  >
                    <Icon name="close" size={14} />
                  </button>
                </div>
              ))}

              <div className="hint">
                Your own documents, like past proposals and impact reports, come in the next step.
              </div>
            </div>
          </div>
          <div className="hr" />
          <div className="modal-foot">
            <button className="btn btn-ghost" onClick={() => set({ step: 1 })}>Back</button>
            <div className="grow" />
            <button className="btn-quiet" onClick={() => set({ step: 3 })}>Skip for now</button>
            <button className="btn btn-primary" onClick={() => set({ step: 3 })}>Next · Source material</button>
          </div>
        </>
      )}

      {w.step === 3 && !w.expanded && (
        <>
          {head("Your source material", "We found 3 documents in your library that fit this proposal.")}
          <div className="modal-body" style={{ gap: 6 }}>
            {SOURCES.map((s) => (
              <label key={s.id} className={cx("src-row", !w.srcSel[s.id] && "off")} style={{ cursor: "pointer" }}>
                <Checkbox
                  className="r-cb"
                  checked={!!w.srcSel[s.id]}
                  onCheckedChange={(v) => set({ srcSel: { ...w.srcSel, [s.id]: !!v } })}
                />
                <Icon name="doc" size={14} color="var(--muted)" />
                <span className="name">{s.name}</span>
                <span className={cx("chip", s.hi ? "chip-green" : "chip-tan")}>
                  {s.hi && <Icon name="star" size={10} />}
                  {s.badge}
                </span>
                {s.meta && <span className="meta">{s.meta}</span>}
              </label>
            ))}
            {w.picks.map((p) => (
              <div key={p} className="src-row">
                <Checkbox className="r-cb" checked aria-hidden tabIndex={-1} />
                <Icon name="doc" size={14} color="var(--muted)" />
                <span className="name">{p}</span>
                <span className="chip chip-tan">Library</span>
              </div>
            ))}
            {w.uploads.map((u) => (
              <div key={u} className="src-row">
                <Checkbox className="r-cb" checked aria-hidden tabIndex={-1} />
                <Icon name="doc" size={14} color="var(--muted)" />
                <span className="name">{u}</span>
                <span className="chip chip-tan">Upload · saved to library</span>
              </div>
            ))}
            {gapsOpen.length > 0 && (
              <div className="gap-strip">
                <Icon name="warn" size={13} color="var(--amber-icon)" />
                <span>
                  Doesn't cover {gapsOpen.length} requirement{gapsOpen.length > 1 ? "s" : ""}:{" "}
                  {gapsOpen.map((k) => (k === "c3" ? "501(c)(3) letter" : "board list")).join(", ")}
                </span>
                <span className="grow" />
                <button onClick={() => set({ expanded: true })}>Add</button>
              </div>
            )}
            <button className="addmore" onClick={() => set({ expanded: true })}>
              <Icon name="add" size={13} /> Add or upload more{" "}
              <span className="meta">opens your full library</span>
            </button>
          </div>
          <div className="hr" />
          <div className="modal-foot">
            <button className="btn btn-ghost" onClick={() => set({ step: 2 })}>Back</button>
            <div className="grow" />
            <button className="btn btn-ghost" onClick={() => create("self")}>I'll write it myself</button>
            <button className="btn btn-primary" onClick={() => create("ai")}>Draft it for me</button>
          </div>
        </>
      )}

      {w.step === 3 && w.expanded && (
        <>
          {head("Your source material", "Adjust what we'll draft from, add gaps, or upload something new.")}
          <div className="modal-body" style={{ gap: 12 }}>
            <div className="overline" style={{ letterSpacing: ".05em" }}>FROM YOUR SOURCE LIBRARY</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              {SOURCES.map((s) => (
                <label
                  key={s.id}
                  className={cx("src-row", !w.srcSel[s.id] && "off")}
                  style={{ border: "1px solid var(--hair)", borderRadius: 10, padding: "10px 12px", cursor: "pointer" }}
                >
                  <Checkbox
                    className="r-cb"
                    checked={!!w.srcSel[s.id]}
                    onCheckedChange={(v) => set({ srcSel: { ...w.srcSel, [s.id]: !!v } })}
                  />
                  <div style={{ textAlign: "left" }}>
                    <div className="name" style={{ display: "flex", gap: 7, alignItems: "center" }}>
                      {s.name}
                      <span className={cx("chip", s.hi ? "chip-green" : "chip-tan")}>
                        {s.hi && <Icon name="star" size={10} />}
                        {s.badge}
                      </span>
                    </div>
                    {s.meta && <div className="meta">{s.meta}</div>}
                  </div>
                </label>
              ))}
            </div>
            <div className="gap-card">
              <div>
                <div className="gh">WORTH ADDING · FROM THE FUNDER'S INSTRUCTIONS</div>
                <div className="gs" style={{ marginTop: 3 }}>
                  {((["c3", "board"] as const).filter((k) => !w.gaps[k]).length || "No") +
                    " of the 9 requirements still uncovered."}
                </div>
              </div>
              {(
                [
                  { k: "c3", icon: "verified", n: "Proof of 501(c)(3) status", w: "Required attachment we don't see in your library" },
                  { k: "board", icon: "people", n: "Board of directors list", w: "Required attachment" },
                ] as const
              ).map((g) => (
                <div key={g.k} className="gap-row">
                  <span className="ic">
                    <Icon name={g.icon} size={13} color="var(--amber-icon)" />
                  </span>
                  <div>
                    <div className="n">{g.n}</div>
                    <div className="w">{g.w}</div>
                  </div>
                  <div className="grow" />
                  {w.gaps[g.k] ? (
                    <span className="chip chip-green">
                      <Icon name="check" size={10} />Added
                    </span>
                  ) : (
                    <button
                      className="btn btn-ghost"
                      style={{ padding: "5px 10px", fontSize: 10.5 }}
                      onClick={() => set({ gaps: { ...w.gaps, [g.k]: true } })}
                    >
                      <Icon name="upload" size={11} color="var(--slate)" />Add
                    </button>
                  )}
                </div>
              ))}
              <div className="meta" style={{ lineHeight: 1.4 }}>
                Skip these and we'll draft those sections from your organization profile only. You can add them
                anytime from the Context tab.
              </div>
            </div>
            <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
              <button
                className="btn btn-ghost"
                style={{ padding: "7px 12px", fontSize: 11 }}
                onClick={() => set({ uploads: [...w.uploads, `Upload-${w.uploads.length + 1}.pdf`] })}
              >
                <Icon name="upload" size={13} color="var(--slate)" />Upload something else
              </button>
              <button
                className="btn-quiet"
                style={{ fontSize: 11 }}
                onClick={() => set({ picker: true, pickerView: "root" })}
              >
                or pick from the full library
              </button>
            </div>
            {w.uploads.map((u) => (
              <div key={u} className="file-row">
                <span className="fbadge">PDF</span>
                <div>
                  <div className="name">{u}</div>
                  <label className="save-lib" style={{ cursor: "pointer" }}>
                    <Checkbox className="r-cb mini" iconSize={10} defaultChecked /> Save to Source Library{" "}
                    <span className="chip chip-tan">{OPP.initiative}</span>
                  </label>
                </div>
                <div className="grow" />
                <button
                  className="icon-btn"
                  onClick={() => set({ uploads: w.uploads.filter((x) => x !== u) })}
                  aria-label="Remove"
                >
                  <Icon name="close" size={14} />
                </button>
              </div>
            ))}
          </div>
          <div className="hr" />
          <div className="modal-foot">
            <button className="btn btn-ghost" onClick={() => set({ expanded: false })}>
              <Icon name="back" size={13} />Done adjusting
            </button>
            <div className="grow" />
            <span className="meta">
              {selCount} source{selCount === 1 ? "" : "s"} selected
            </span>
          </div>
        </>
      )}
    </DialogContent>
  )
}

function Picker({
  w,
  set,
}: {
  w: WizardState
  set: (patch: Partial<WizardState>) => void
}) {
  const view = w.pickerView
  const files = view === "root" ? LIB.root : LIB.budg
  const sel = w.pickerSel
  const toggle = (id: string) => {
    const n = new Set(sel)
    n.has(id) ? n.delete(id) : n.add(id)
    set({ pickerSel: n })
  }
  return (
    <>
      <div className="modal-head" style={{ padding: "16px 20px" }}>
        <DialogTitle asChild>
          <h2 style={{ fontSize: 17 }}>Add from your Source Library</h2>
        </DialogTitle>
        <div className="grow" />
        <div className="chat-input" style={{ width: 240, padding: "2px 6px 2px 10px" }}>
          <Icon name="search" size={13} color="var(--faint)" />
          <input placeholder={view === "root" ? "Search all documents" : "Search in Budgets"} readOnly />
        </div>
        <button className="icon-btn" onClick={() => set({ picker: false })} aria-label="Close picker">
          <Icon name="close" size={18} />
        </button>
      </div>
      <div className="hr" />
      <div className="picker-body">
        <div className="picker-rail">
          <button className={cx("scope-row", view === "root" && "on")} onClick={() => set({ pickerView: "root" })}>
            <Icon name="grid" size={13} color={view === "root" ? "var(--slate)" : "var(--muted)"} />
            All documents<span className="cnt">24</span>
          </button>
          <button className={cx("scope-row", view === "budg" && "on")} onClick={() => set({ pickerView: "budg" })}>
            <Icon name="org" size={13} color={view === "budg" ? "var(--slate)" : "var(--muted)"} />
            Organization<span className="cnt">11</span>
          </button>
          <div className="overline" style={{ fontSize: 9.5, padding: "8px 10px 2px" }}>PROJECTS</div>
          <button className="scope-row">
            <Icon name="folder" size={13} color="var(--muted)" />Community Cat TNR<span className="cnt">8</span>
          </button>
          <button className="scope-row">
            <Icon name="folder" size={13} color="var(--muted)" />Shelter Medicine<span className="cnt">5</span>
          </button>
          <div className="hr" style={{ margin: "8px 4px" }} />
          <button className="scope-row">
            <Icon name="share" size={13} color="var(--muted)" />Shared with you
          </button>
          <div className="meta" style={{ padding: "2px 10px", fontSize: 9.5, lineHeight: 1.35 }}>
            Documents your network admin shares appear here
          </div>
        </div>
        <div className="picker-main">
          {view === "root" ? (
            <>
              <div className="overline" style={{ letterSpacing: ".05em" }}>FOLDERS</div>
              <div className="folder-cards">
                {LIB.folders.map((f) => (
                  <button
                    key={f.id}
                    className="folder-card"
                    onClick={() => f.id === "budg" && set({ pickerView: "budg" })}
                  >
                    <Icon name="folder" size={15} color="var(--amber-icon)" />
                    <span>
                      <span className="n">{f.name}</span>
                      <span className="c">{f.count}</span>
                    </span>
                  </button>
                ))}
              </div>
              <div className="overline" style={{ letterSpacing: ".05em" }}>RECENT DOCUMENTS</div>
            </>
          ) : (
            <div className="crumb">
              <button onClick={() => set({ pickerView: "root" })}>
                <Icon name="back" size={13} />Organization
              </button>
              <Icon name="chevR" size={12} color="#b4bdcd" />
              <Icon name="folder" size={13} color="var(--amber-icon)" />
              <strong style={{ fontSize: 11.5 }}>Budgets</strong>
              <span className="meta">· 3 documents</span>
            </div>
          )}
          {files.map((f) => (
            <label
              key={f.id}
              className={cx("pick-row", sel.has(f.id) && "on", f.locked && "locked")}
              style={{ cursor: f.locked ? "default" : "pointer" }}
            >
              <Checkbox
                className="r-cb"
                checked={f.locked ? true : sel.has(f.id)}
                disabled={f.locked}
                onCheckedChange={() => !f.locked && toggle(f.id)}
              />
              <Icon name="doc" size={14} color="var(--muted)" />
              <span>
                <span className="n" style={{ display: "block" }}>{f.name}</span>
                <span className="meta">{f.meta}</span>
              </span>
              <span className="grow" />
              {f.locked ? (
                <span className="meta" style={{ fontWeight: 500 }}>Already selected</span>
              ) : (
                f.scope && <span className="chip chip-tan">{f.scope}</span>
              )}
            </label>
          ))}
        </div>
      </div>
      <div className="hr" />
      <div className="modal-foot" style={{ padding: "14px 20px" }}>
        <strong style={{ fontSize: 12 }}>{sel.size} selected</strong>
        <div style={{ display: "flex", gap: 5, flexWrap: "wrap" }}>
          {Array.from(sel).map((id) => (
            <span key={id} className="sel-chip">
              {PICKER_NAMES[id]}
              <button className="icon-btn" style={{ padding: 0 }} onClick={() => toggle(id)}>
                <Icon name="close" size={9} />
              </button>
            </span>
          ))}
        </div>
        <span className="meta" style={{ marginLeft: 4 }}>
          {sel.size > 0 ? "" : "Selections stay as you browse folders"}
        </span>
        <div className="grow" />
        <button className="btn btn-ghost" onClick={() => set({ picker: false, pickerSel: new Set() })}>
          Cancel
        </button>
        <button
          className={cx("btn", sel.size ? "btn-primary" : "btn-disabled")}
          disabled={!sel.size}
          onClick={() =>
            set({
              picker: false,
              picks: Array.from(
                new Set([...w.picks, ...Array.from(sel).map((id) => PICKER_FULL_NAMES[id])])
              ),
              pickerSel: new Set(),
            })
          }
        >
          Add {sel.size || ""} document{sel.size === 1 ? "" : "s"}
        </button>
      </div>
    </>
  )
}
