"use client"

import { useState, useRef, useEffect } from "react"
import Link from "next/link"
import {
  ArrowLeft, Download, Sparkles, Loader2,
  Check, X, AlertCircle, RefreshCw,
  ChevronLeft, ChevronRight,
  Plus, Trash2, Edit3,
  BookOpen, Sliders, MessageCircle, Users,
  List, BarChart2,
  CheckCircle, AlertTriangle, Circle,
  Search, Upload, FileText, Paperclip,
  Send, Copy,
} from "lucide-react"
import {
  FUNDERS, OPPORTUNITIES, ORG, USER, TEAMMATES,
  getArtifact, getPipelineForOpportunity,
  getAttachmentsForPipeline, getWritingSession, getSnippetsForOrg,
  getCommentThreadsForArtifact,
} from "@/lib/mock-data"
import type {
  ArtifactStage, Requirement, DraftSection, Snippet, CommentThread, Comment,
} from "@/lib/types"

// ── Local types ────────────────────────────────────────────────────────────

type OnrampStep = "source" | "extracting" | "requirements" | "context" | "generating"
type AIPhase    = "idle" | "generating" | "preview" | "error"
type LeftTab    = "requirements" | "compliance"
type RightTab   = "chat" | "snippets" | "voice" | "comments"
type VoiceTone  = "as-written" | "formal" | "conversational" | "compelling"

interface AIProposal {
  sectionId: string
  proposed: string
  originalText: string
}

interface ChatMessage {
  id: string
  role: "user" | "assistant"
  content: string
  sectionId?: string
}

// ── Constants ──────────────────────────────────────────────────────────────

const STAGE_BADGE: Record<ArtifactStage, { label: string; bg: string; color: string }> = {
  "pre-apply":  { label: "Pre-apply",  bg: "var(--terracotta-tint)", color: "var(--terracotta)"      },
  "apply":      { label: "Apply",      bg: "var(--slate-tint)",      color: "var(--slate-secondary)" },
  "post-apply": { label: "Post-apply", bg: "var(--evergreen-tint)",  color: "var(--evergreen)"       },
}

const AUTOSAVE_DELAY = 1500

const VOICE_TONES: Array<{ value: VoiceTone; label: string; hint: string }> = [
  { value: "as-written",     label: "As written",        hint: "Keep the current voice" },
  { value: "formal",         label: "More formal",        hint: "Professional, precise language" },
  { value: "conversational", label: "Conversational",     hint: "Warm, direct, reader-first" },
  { value: "compelling",     label: "More compelling",    hint: "Lead with impact and urgency" },
]

// ── Helpers ────────────────────────────────────────────────────────────────

function formatCommentTime(iso: string): string {
  try {
    const d = new Date(iso)
    return d.toLocaleDateString([], { month: "short", day: "numeric" })
  } catch { return "" }
}

const ALL_USERS = [USER, ...TEAMMATES]

function countWords(text: string): number {
  return text.trim() === "" ? 0 : text.trim().split(/\s+/).length
}

function countChars(text: string): number {
  return text.length
}

function autosize(el: HTMLTextAreaElement | null) {
  if (!el) return
  el.style.height = "auto"
  el.style.height = el.scrollHeight + "px"
}

type ComplianceStatus = "covered" | "partial" | "uncovered"

function sectionCompliance(
  section: DraftSection,
  req: Requirement,
): ComplianceStatus {
  if (req.constraint?.type === "required_attachment") {
    return section.content.trim() ? "covered" : "uncovered"
  }
  if (!section.content.trim()) return "uncovered"
  if (req.wordLimit && countWords(section.content) > req.wordLimit) return "partial"
  if (req.charLimit && countChars(section.content) > req.charLimit) return "partial"
  return "covered"
}

// ── Mock AI ────────────────────────────────────────────────────────────────

function mockExtractRequirements(): Requirement[] {
  return [
    { id: "req-ex-1", text: "Organization overview and mission alignment",     wordLimit: 500, charLimit: 3000 },
    { id: "req-ex-2", text: "Program description and activities to be funded", wordLimit: 750 },
    { id: "req-ex-3", text: "Expected outcomes and impact metrics",            wordLimit: 500, charLimit: 3200 },
    { id: "req-ex-4", text: "Evaluation methodology and reporting plan",       wordLimit: 250 },
    { id: "req-ex-5", text: "Budget narrative",                                constraint: { type: "required_attachment", value: "Budget spreadsheet (xlsx or pdf)" } },
  ]
}

function mockGenerateSection(req: Requirement): string {
  const map: Record<string, string> = {
    "req-ex-1": `Whisker Haven Cat Rescue is a 501(c)(3) nonprofit based in San Diego, California, dedicated to ending preventable cat euthanasia across the region. Since 2018, we have rescued over 4,200 animals and maintained a live release rate of 97% — placing us among California's highest-performing cat rescues.\n\nOur programs span the full rescue continuum: direct intake, a 180-volunteer foster network, a community spay/neuter clinic serving 600+ cats annually, and a kitten nursery providing 24-hour care for neonates.`,
    "req-ex-2": `The Petco Love Lost & Found Grant will fund three program expansions over 12 months: increasing rescue intake capacity by 20% through a part-time coordinator; adding a second mobile outreach vehicle to reach underserved neighborhoods; and formalizing transfer protocols with two municipal shelter partners.\n\nEach investment is designed to compound — more intake capacity enables more placements, and municipal partnerships reduce repeat rescue of the same animals.`,
    "req-ex-3": `Projected outcomes over the 12-month grant period:\n\n• 240 additional rescues above baseline (20% intake increase)\n• Live release rate sustained at or above 96%\n• 150 additional TNR procedures in target zip codes\n• Two formal municipal transfer partnerships established\n\nWe track all outcomes in our shelter management system and report monthly to our board.`,
  }
  return map[req.id] ?? ""
}

function mockAIReviseSection(content: string, instruction: string): string {
  const lower = instruction.toLowerCase()
  if (lower.includes("concis") || lower.includes("shorter") || lower.includes("brief")) {
    const sentences = content.split(/(?<=[.!?])\s+/).filter(Boolean)
    return sentences.slice(0, Math.max(1, Math.ceil(sentences.length * 0.65))).join(" ")
  }
  if (lower.includes("compelling") || lower.includes("stronger") || lower.includes("urgent")) {
    return content + "\n\nOur 97% live release rate across 4,200+ rescues demonstrates that this investment will translate directly to measurable lifesaving — not just program activity, but verified outcomes aligned with Petco Love's core mission."
  }
  return content + "\n\nThis work is grounded in demonstrated community need: San Diego County records over 40,000 cat intakes annually, and each capacity expansion we deliver converts directly into additional lives saved and families reunited."
}

function mockAIChatReply(userMessage: string, sectionTitle?: string): string {
  const lower = userMessage.toLowerCase()
  const ctx   = sectionTitle ? ` for "${sectionTitle}"` : ""
  if (lower.includes("compli") || lower.includes("requirem")) {
    return `Based on the requirements, sections 4 (Evaluation Methodology) and 5 (Budget Narrative) are currently empty. Section 4 has a 250-word limit — a good starting point. Want me to draft it?`
  }
  if (lower.includes("shorter") || lower.includes("concis") || lower.includes("trim")) {
    return `I can trim this${ctx}. The main opportunities: (1) cut throat-clearing phrases like "It is worth noting that…", and (2) collapse the program list into fewer, denser sentences. Want me to revise?`
  }
  if (lower.includes("compelling") || lower.includes("stronger") || lower.includes("impact")) {
    return `To strengthen the narrative${ctx}: lead with the specific outcome rather than the activity. Instead of "we will add a vehicle," try "we will reach 150 more animals in underserved neighborhoods." Funders respond to impact-forward framing.`
  }
  return `The strongest move${ctx} is anchoring every claim to a specific number or data point — rescues completed, live release rate, zip codes served. Petco Love reviewers look for measurable impact over narrative description. Want me to scan for unanchored claims?`
}

// ── Page ───────────────────────────────────────────────────────────────────

export default function ArtifactEditorPage({
  params,
}: {
  params: { id: string; artifactId: string }
}) {
  const pip             = getPipelineForOpportunity(params.id)
  const artifact        = getArtifact(params.artifactId)
  const funder          = pip ? FUNDERS.find(f => f.id === pip.funderId) : null
  const opp             = pip ? OPPORTUNITIES.find(o => o.id === pip.opportunityId) : null
  const pipelineAttachments = pip ? getAttachmentsForPipeline(pip.id) : []
  const existingSession = artifact ? getWritingSession(artifact.id) : null
  const orgSnippets     = getSnippetsForOrg(ORG.id)

  // ── Initial view ─────────────────────────────────────────────────────
  const [view, setView] = useState<"onramp" | "working">(existingSession ? "working" : "onramp")

  // ── On-ramp state ────────────────────────────────────────────────────
  const [onrampStep,         setOnrampStep]         = useState<OnrampStep>("source")
  const [selectedSource,     setSelectedSource]     = useState<"existing" | "upload" | "none" | null>(null)
  const [draftReqs,          setDraftReqs]          = useState<Requirement[]>([])
  const [editingReqId,         setEditingReqId]         = useState<string | null>(null)
  const [editingReqText,       setEditingReqText]       = useState("")
  const [editingWordLimit,     setEditingWordLimit]     = useState("")
  const [editingCharLimit,     setEditingCharLimit]     = useState("")
  const [editingAttachmentNote, setEditingAttachmentNote] = useState("")
  const [selectedContextIds,   setSelectedContextIds]   = useState<Set<string>>(new Set(["att-2"]))

  // ── Working state: document ──────────────────────────────────────────
  const [requirements,  setRequirements]  = useState<Requirement[]>(existingSession?.requirements ?? [])
  const [sections,      setSections]      = useState<DraftSection[]>(existingSession?.sections ?? [])
  const [saveStatus,    setSaveStatus]    = useState<"saved" | "saving">("saved")
  const [updatedAt,     setUpdatedAt]     = useState(artifact?.updatedAt ?? "")
  const docWordLimit = existingSession?.wordLimit
  const docCharLimit = existingSession?.charLimit

  // ── Working state: layout ────────────────────────────────────────────
  const [leftTab,        setLeftTab]        = useState<LeftTab>("requirements")
  const [rightTab,       setRightTab]       = useState<RightTab>("chat")
  const [leftCollapsed,  setLeftCollapsed]  = useState(false)
  const [rightCollapsed, setRightCollapsed] = useState(false)
  const [activeSectionId, setActiveSectionId] = useState<string | null>(null)

  // ── Working state: AI ────────────────────────────────────────────────
  const [aiPhase,   setAiPhase]   = useState<AIPhase>("idle")
  const [aiProposal, setAiProposal] = useState<AIProposal | null>(null)
  const [aiPrompt,  setAiPrompt]  = useState("")
  const [aiError,   setAiError]   = useState("")
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([
    { id: "init-1", role: "assistant", content: "I've reviewed the Petco Love RFP and your prior proposal. Ask me anything, or focus a section for targeted help." },
  ])
  const [chatInput,   setChatInput]   = useState("")
  const [isChatBusy,  setIsChatBusy]  = useState(false)

  // ── Working state: snippets + voice ─────────────────────────────────
  const [snippetSearch,  setSnippetSearch]  = useState("")
  const [insertedSnip,   setInsertedSnip]   = useState<string | null>(null)
  const [voiceTone,      setVoiceTone]      = useState<VoiceTone>("as-written")
  const [isHumanizing,   setIsHumanizing]   = useState(false)

  // ── Working state: comments ───────────────────────────────────────────
  const [commentThreads,  setCommentThreads]  = useState<CommentThread[]>(
    artifact ? getCommentThreadsForArtifact(artifact.id) : []
  )
  const [activeThreadId,  setActiveThreadId]  = useState<string | null>(null)
  const [showResolved,    setShowResolved]    = useState(false)
  const [pendingAnchor,   setPendingAnchor]   = useState<{
    sectionId: string; anchorText: string; anchorStart: number; anchorEnd: number
  } | null>(null)
  const [newCommentText,  setNewCommentText]  = useState("")
  const [replyTexts,      setReplyTexts]      = useState<Record<string, string>>({})
  const [selectionBySec,  setSelectionBySec]  = useState<Record<string, { text: string; start: number; end: number } | null>>({})
  const [mentionToast,    setMentionToast]    = useState<string | null>(null)
  const [mentionQuery,    setMentionQuery]    = useState<string | null>(null)
  const [mentionTarget,   setMentionTarget]   = useState<"new" | string | null>(null)

  // ── Refs ─────────────────────────────────────────────────────────────
  const saveTimerRef        = useRef<ReturnType<typeof setTimeout> | null>(null)
  const abortRef            = useRef<AbortController | null>(null)
  const chatEndRef          = useRef<HTMLDivElement | null>(null)
  const chatInputRef        = useRef<HTMLTextAreaElement | null>(null)
  const editReqInputRef     = useRef<HTMLInputElement | null>(null)
  const sectionRefs         = useRef<Record<string, HTMLTextAreaElement | null>>({})
  const newCommentInputRef  = useRef<HTMLTextAreaElement | null>(null)
  const activeThreadRef     = useRef<HTMLDivElement | null>(null)
  const mentionToastTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // ── Effects ───────────────────────────────────────────────────────────

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [chatMessages])

  // Autosize all section textareas on mount / section change
  useEffect(() => {
    Object.values(sectionRefs.current).forEach(el => autosize(el))
  }, [sections.length])

  // Focus editing input in onramp when editingReqId changes
  useEffect(() => {
    if (editingReqId) editReqInputRef.current?.focus()
  }, [editingReqId])

  // Focus new comment input when anchor is set
  useEffect(() => {
    if (pendingAnchor) setTimeout(() => newCommentInputRef.current?.focus(), 60)
  }, [pendingAnchor])

  // Scroll active thread into view
  useEffect(() => {
    if (activeThreadId) setTimeout(() => activeThreadRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" }), 60)
  }, [activeThreadId])

  // Escape closes overlays
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key !== "Escape") return
      if (aiPhase === "preview") { setAiProposal(null); setAiPhase("idle") }
      if (editingReqId) { setEditingReqId(null); setEditingReqText("") }
      if (pendingAnchor) { setPendingAnchor(null); setNewCommentText(""); setMentionQuery(null); setMentionTarget(null) }
      if (activeThreadId) setActiveThreadId(null)
    }
    document.addEventListener("keydown", onKey)
    return () => document.removeEventListener("keydown", onKey)
  }, [aiPhase, editingReqId, pendingAnchor, activeThreadId])

  // ── Autosave ─────────────────────────────────────────────────────────

  function triggerAutosave() {
    setSaveStatus("saving")
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current)
    saveTimerRef.current = setTimeout(() => {
      setUpdatedAt(new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }))
      setSaveStatus("saved")
    }, AUTOSAVE_DELAY)
  }

  // ── On-ramp handlers ─────────────────────────────────────────────────

  async function handleSourceSelect(source: "existing" | "upload" | "none") {
    setSelectedSource(source)
    if (source === "none") {
      setDraftReqs([])
      setOnrampStep("requirements")
    } else {
      setOnrampStep("extracting")
      await new Promise(r => setTimeout(r, 2600))
      setDraftReqs(mockExtractRequirements())
      setOnrampStep("requirements")
    }
  }

  function handleAddReq() {
    const id = `req-new-${Date.now()}`
    setDraftReqs(prev => [...prev, { id, text: "" }])
    setEditingReqId(id)
    setEditingReqText("")
    setEditingWordLimit("")
    setEditingCharLimit("")
    setEditingAttachmentNote("")
  }

  function handleEditReq(req: Requirement) {
    setEditingReqId(req.id)
    setEditingReqText(req.text)
    setEditingWordLimit(req.wordLimit ? String(req.wordLimit) : "")
    setEditingCharLimit(req.charLimit ? String(req.charLimit) : "")
    setEditingAttachmentNote(req.constraint?.type === "required_attachment" ? req.constraint.value : "")
  }

  function handleSaveReqEdit() {
    if (!editingReqId) return
    setDraftReqs(prev => prev.map(r => {
      if (r.id !== editingReqId) return r
      const wordLimit = editingWordLimit.trim() ? (Number(editingWordLimit) || undefined) : undefined
      const charLimit = editingCharLimit.trim() ? (Number(editingCharLimit) || undefined) : undefined
      const constraint = editingAttachmentNote.trim()
        ? { type: "required_attachment" as const, value: editingAttachmentNote.trim() }
        : undefined
      return { ...r, text: editingReqText, wordLimit, charLimit, constraint }
    }))
    setEditingReqId(null)
    setEditingReqText("")
    setEditingWordLimit("")
    setEditingCharLimit("")
    setEditingAttachmentNote("")
  }

  function handleDeleteReq(id: string) {
    setDraftReqs(prev => prev.filter(r => r.id !== id))
    if (editingReqId === id) {
      setEditingReqId(null)
      setEditingReqText("")
      setEditingWordLimit("")
      setEditingCharLimit("")
      setEditingAttachmentNote("")
    }
  }

  function handleContextToggle(attachmentId: string) {
    setSelectedContextIds(prev => {
      const next = new Set(prev)
      if (next.has(attachmentId)) next.delete(attachmentId)
      else next.add(attachmentId)
      return next
    })
  }

  async function handleGenerateDraft() {
    if (editingReqId) handleSaveReqEdit()
    setOnrampStep("generating")
    await new Promise(r => setTimeout(r, 3000))
    const finalReqs = draftReqs.filter(r => r.text.trim())
    const newSections: DraftSection[] = finalReqs.map(req => ({
      id:            `sec-${req.id}`,
      requirementId: req.id,
      title:         req.text.length > 52 ? req.text.slice(0, 52) + "…" : req.text,
      content:       mockGenerateSection(req),
    }))
    setRequirements(finalReqs)
    setSections(newSections)
    setView("working")
  }

  // ── Working state: document handlers ─────────────────────────────────

  function checkAnchors(sectionId: string, newContent: string) {
    setCommentThreads(prev => prev.map(t => {
      if (t.sectionId !== sectionId) return t
      return { ...t, anchorStatus: newContent.includes(t.anchorText) ? "intact" : "text_changed" }
    }))
  }

  function handleSectionChange(sectionId: string, value: string) {
    setSections(prev => prev.map(s => s.id === sectionId ? { ...s, content: value } : s))
    autosize(sectionRefs.current[sectionId])
    checkAnchors(sectionId, value)
    triggerAutosave()
  }

  function scrollToSection(sectionId: string) {
    const el = sectionRefs.current[sectionId]
    if (el) { el.scrollIntoView({ behavior: "smooth", block: "center" }); el.focus() }
    setActiveSectionId(sectionId)
  }

  // ── Working state: AI handlers ────────────────────────────────────────

  async function handleAIGenerate(promptOverride?: string) {
    const prompt = promptOverride ?? aiPrompt
    if (!prompt.trim()) return
    const ctrl = new AbortController()
    abortRef.current = ctrl
    const targetSection = sections.find(s => s.id === activeSectionId) ?? sections.find(s => s.content.trim())

    setAiPhase("generating")
    setAiError("")
    try {
      await new Promise<void>((resolve, reject) => {
        const t = setTimeout(resolve, 1800)
        ctrl.signal.addEventListener("abort", () => { clearTimeout(t); reject(new Error("aborted")) })
      })
      if (ctrl.signal.aborted) return
      if (targetSection) {
        setAiProposal({
          sectionId:    targetSection.id,
          proposed:     mockAIReviseSection(targetSection.content, prompt),
          originalText: targetSection.content,
        })
      }
      setAiPhase("preview")
    } catch (err) {
      if ((err as Error).message === "aborted") { setAiPhase("idle"); return }
      setAiError("Generation failed — your document is unchanged.")
      setAiPhase("error")
    }
  }

  function handleAICancel() {
    abortRef.current?.abort()
    abortRef.current = null
    setAiPhase("idle")
  }

  function handleAIAccept() {
    if (!aiProposal) return
    setSections(prev => prev.map(s => s.id === aiProposal.sectionId ? { ...s, content: aiProposal.proposed } : s))
    setTimeout(() => autosize(sectionRefs.current[aiProposal.sectionId]), 0)
    checkAnchors(aiProposal.sectionId, aiProposal.proposed)
    triggerAutosave()
    setAiProposal(null)
    setAiPhase("idle")
    setAiPrompt("")
  }

  function handleAIDiscard() {
    setAiProposal(null)
    setAiPhase("idle")
  }

  // ── Chat handlers ─────────────────────────────────────────────────────

  const REVISION_INTENT = /\b(revis|rewrit|rephras|trim|shorten|shorter|longer|expand|strengthen|compel|improve|make it|change|cut|add|remov)/i

  async function handleChatSend() {
    const msg = chatInput.trim()
    if (!msg || isChatBusy || aiPhase === "generating") return
    const activeSection = sections.find(s => s.id === activeSectionId)
    const userMsg: ChatMessage = { id: `msg-${Date.now()}`, role: "user", content: msg, sectionId: activeSectionId ?? undefined }
    setChatMessages(prev => [...prev, userMsg])
    setChatInput("")

    if (REVISION_INTENT.test(msg) && (activeSection || sections.some(s => s.content.trim()))) {
      await handleAIGenerate(msg)
    } else {
      setIsChatBusy(true)
      await new Promise(r => setTimeout(r, 1100))
      const reply = mockAIChatReply(msg, activeSection?.title)
      setChatMessages(prev => [...prev, { id: `msg-${Date.now()}-a`, role: "assistant", content: reply }])
      setIsChatBusy(false)
    }
  }

  // ── Snippets handler ──────────────────────────────────────────────────

  function handleInsertSnippet(snippet: Snippet) {
    const targetId = activeSectionId ?? sections[0]?.id
    if (!targetId) return
    const ta = sectionRefs.current[targetId]
    setSections(prev => prev.map(s => {
      if (s.id !== targetId) return s
      if (ta) {
        const start = ta.selectionStart ?? s.content.length
        const end   = ta.selectionEnd   ?? s.content.length
        return { ...s, content: s.content.slice(0, start) + snippet.body + s.content.slice(end) }
      }
      return { ...s, content: s.content + (s.content ? "\n\n" : "") + snippet.body }
    }))
    triggerAutosave()
    setTimeout(() => autosize(sectionRefs.current[targetId]), 0)
    setInsertedSnip(snippet.id)
    setTimeout(() => setInsertedSnip(null), 1400)
  }

  // ── Voice handler ─────────────────────────────────────────────────────

  async function handleHumanize() {
    setIsHumanizing(true)
    await new Promise(r => setTimeout(r, 1400))
    const targetId = activeSectionId ?? sections.find(s => s.content.trim())?.id
    if (targetId) {
      setSections(prev => prev.map(s => {
        if (s.id !== targetId) return s
        const humanized = s.content
          .replace(/It is worth noting that /gi, "")
          .replace(/It should be noted that /gi, "")
          .replace(/We are committed to /gi, "We ")
          .replace(/This grant will enable us to /gi, "With this grant, we'll ")
          .replace(/It is important to /gi, "")
          .replace(/We are pleased to /gi, "")
          .replace(/In order to /gi, "To ")
        return { ...s, content: humanized }
      }))
      triggerAutosave()
      setTimeout(() => autosize(sectionRefs.current[targetId ?? ""]), 0)
    }
    setIsHumanizing(false)
  }

  // ── Comment handlers ──────────────────────────────────────────────────

  function handleTextSelectionEnd(sectionId: string) {
    const ta = sectionRefs.current[sectionId]
    if (!ta) return
    const start = ta.selectionStart
    const end   = ta.selectionEnd
    if (end > start) {
      setSelectionBySec(prev => ({ ...prev, [sectionId]: { text: ta.value.slice(start, end).trim(), start, end } }))
    } else {
      setSelectionBySec(prev => ({ ...prev, [sectionId]: null }))
    }
  }

  function handleSectionCommentClick(sectionId: string) {
    const sel = selectionBySec[sectionId]
    if (!sel || !sel.text) return
    setPendingAnchor({ sectionId, anchorText: sel.text, anchorStart: sel.start, anchorEnd: sel.end })
    setSelectionBySec(prev => ({ ...prev, [sectionId]: null }))
    setRightCollapsed(false)
    setRightTab("comments")
    setActiveThreadId(null)
  }

  function parseMentions(text: string): string[] {
    return ALL_USERS.filter(u => text.includes(`@${u.name}`)).map(u => u.id)
  }

  function fireMentionToasts(mentions: string[]) {
    if (!mentions.length) return
    const names = mentions.map(id => ALL_USERS.find(u => u.id === id)?.name ?? "").filter(Boolean)
    if (!names.length) return
    if (mentionToastTimerRef.current) clearTimeout(mentionToastTimerRef.current)
    setMentionToast(`Notification sent to ${names.join(", ")}`)
    mentionToastTimerRef.current = setTimeout(() => setMentionToast(null), 3000)
  }

  function handleSubmitComment() {
    if (!pendingAnchor || !newCommentText.trim() || !artifact) return
    const now = Date.now()
    const threadId = `thread-${now}`
    const mentions = parseMentions(newCommentText)
    const thread: CommentThread = {
      id: threadId,
      artifactId: artifact.id,
      sectionId: pendingAnchor.sectionId,
      requirementId: sections.find(s => s.id === pendingAnchor.sectionId)?.requirementId ?? "",
      anchorText: pendingAnchor.anchorText,
      anchorStart: pendingAnchor.anchorStart,
      anchorEnd: pendingAnchor.anchorEnd,
      anchorStatus: "intact",
      status: "open",
      createdAt: new Date(now).toISOString(),
      comments: [{
        id: `cmt-${now}`,
        threadId,
        authorId: USER.id,
        content: newCommentText.trim(),
        createdAt: new Date(now).toISOString(),
        mentions,
      }],
    }
    setCommentThreads(prev => [...prev, thread])
    setPendingAnchor(null)
    setNewCommentText("")
    setMentionQuery(null)
    setMentionTarget(null)
    setActiveThreadId(threadId)
    fireMentionToasts(mentions)
  }

  function handleSubmitReply(threadId: string) {
    const text = (replyTexts[threadId] ?? "").trim()
    if (!text) return
    const mentions = parseMentions(text)
    const now = Date.now()
    const reply: Comment = {
      id: `cmt-${now}`,
      threadId,
      authorId: USER.id,
      content: text,
      createdAt: new Date(now).toISOString(),
      mentions,
    }
    setCommentThreads(prev => prev.map(t => t.id !== threadId ? t : { ...t, comments: [...t.comments, reply] }))
    setReplyTexts(prev => ({ ...prev, [threadId]: "" }))
    setMentionQuery(null)
    setMentionTarget(null)
    fireMentionToasts(mentions)
  }

  function handleResolve(threadId: string) {
    setCommentThreads(prev => prev.map(t => t.id === threadId ? { ...t, status: "resolved" } : t))
    if (activeThreadId === threadId) setActiveThreadId(null)
  }

  function handleReopen(threadId: string) {
    setCommentThreads(prev => prev.map(t => t.id === threadId ? { ...t, status: "open" } : t))
  }

  function openThread(threadId: string, sectionId: string) {
    setRightCollapsed(false)
    setRightTab("comments")
    setActiveThreadId(threadId)
    scrollToSection(sectionId)
  }

  // ── Computed ──────────────────────────────────────────────────────────

  const activeSection     = sections.find(s => s.id === activeSectionId) ?? null
  const filteredSnippets  = orgSnippets.filter(s =>
    !snippetSearch || s.title.toLowerCase().includes(snippetSearch.toLowerCase()) || s.body.toLowerCase().includes(snippetSearch.toLowerCase())
  )
  const openThreads       = commentThreads.filter(t => t.status === "open")
  const visibleThreads    = showResolved ? commentThreads : openThreads
  const sectionThreadMap  = new Map<string, CommentThread[]>()
  commentThreads.forEach(t => {
    const arr = sectionThreadMap.get(t.sectionId) ?? []
    arr.push(t)
    sectionThreadMap.set(t.sectionId, arr)
  })

  const rfpAttachment     = pipelineAttachments.find(a => a.category === "rfp")
  const contextCandidates = pipelineAttachments.filter(a => a.category === "prior_proposal" || a.category === "report")

  // ── Not found ─────────────────────────────────────────────────────────

  if (!artifact || !pip || !funder || !opp) {
    return (
      <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", backgroundColor: "var(--canvas)" }}>
        <div style={{ textAlign: "center" }}>
          <p style={{ fontSize: 15, color: "var(--ink-tertiary)", marginBottom: 16 }}>Artifact not found.</p>
          <Link href={`/pursuit/${params.id}`} style={{ fontSize: 13, color: "var(--slate-secondary)", textDecoration: "none" }}>
            ← Back to workspace
          </Link>
        </div>
      </div>
    )
  }

  const stageCfg = STAGE_BADGE[artifact.stage]

  // ─────────────────────────────────────────────────────────────────────────
  // RENDER
  // ─────────────────────────────────────────────────────────────────────────

  return (
    <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden", backgroundColor: "var(--canvas)" }}>

      {/* ══ TOP BAR ══════════════════════════════════════════════════════════ */}
      <div
        role="banner"
        style={{
          flexShrink: 0, height: 52,
          backgroundColor: "var(--surface)", borderBottom: "1px solid var(--hair)",
          padding: "0 20px", display: "flex", alignItems: "center", gap: 10,
        }}
      >
        <Link href={`/pursuit/${params.id}`} style={{ textDecoration: "none" }}>
          <button
            type="button"
            style={{
              display: "flex", alignItems: "center", gap: 5,
              background: "none", border: "none", cursor: "pointer",
              fontSize: 13, color: "var(--ink-tertiary)", padding: 0, transition: "color 120ms",
            }}
            onMouseEnter={e => (e.currentTarget.style.color = "var(--ink)")}
            onMouseLeave={e => (e.currentTarget.style.color = "var(--ink-tertiary)")}
          >
            <ArrowLeft size={14} />{funder.name}
          </button>
        </Link>

        <span style={{ color: "var(--hair-2)", fontSize: 16 }}>·</span>

        <span style={{ fontSize: 13, color: "var(--ink-tertiary)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: 220 }}>
          {artifact.name}
        </span>

        <span style={{
          padding: "2px 8px", borderRadius: "var(--radius-pill)",
          fontSize: 10, fontWeight: 600, flexShrink: 0,
          backgroundColor: stageCfg.bg, color: stageCfg.color,
        }}>
          {stageCfg.label}
        </span>

        <div style={{ flex: 1 }} />

        {view === "working" && (
          <span style={{ fontSize: 12, color: "var(--ink-tertiary)" }}>
            {saveStatus === "saving" ? "Saving…" : `Updated ${updatedAt}`}
          </span>
        )}

        <button
          type="button"
          style={{
            display: "flex", alignItems: "center", gap: 5,
            padding: "5px 12px", borderRadius: "var(--radius-button)",
            border: "1px solid var(--hair-2)", backgroundColor: "transparent",
            fontSize: 12, fontWeight: 500, color: "var(--ink-secondary)", cursor: "pointer",
            transition: "background-color 120ms",
          }}
          onMouseEnter={e => (e.currentTarget.style.backgroundColor = "var(--canvas)")}
          onMouseLeave={e => (e.currentTarget.style.backgroundColor = "transparent")}
        >
          <Download size={12} /> Export
        </button>

        <Link href={`/pursuit/${params.id}`} style={{ textDecoration: "none" }}>
          <button
            type="button"
            style={{
              padding: "5px 16px", borderRadius: "var(--radius-button)",
              border: "none", backgroundColor: "var(--slate-primary)",
              fontSize: 12, fontWeight: 600, color: "#fff", cursor: "pointer",
              transition: "background-color 150ms",
            }}
            onMouseEnter={e => (e.currentTarget.style.backgroundColor = "#3A4F6A")}
            onMouseLeave={e => (e.currentTarget.style.backgroundColor = "var(--slate-primary)")}
          >
            Done
          </button>
        </Link>
      </div>

      {/* ══ CONTENT ══════════════════════════════════════════════════════════ */}

      {view === "onramp" ? (

        // ── ON-RAMP WIZARD ──────────────────────────────────────────────────
        <div
          role="main"
          aria-label="Draft setup"
          style={{
            flex: 1, overflowY: "auto",
            display: "flex", flexDirection: "column", alignItems: "center",
            padding: "48px 24px 80px",
          }}
        >
          {/* Step progress */}
          {onrampStep !== "extracting" && onrampStep !== "generating" && (
            <div style={{ display: "flex", alignItems: "center", gap: 0, marginBottom: 40 }}>
              {(["source", "requirements", "context"] as const).map((step, i) => {
                const steps: OnrampStep[] = ["source", "requirements", "context"]
                const currentIdx = steps.indexOf(onrampStep) === -1 ? 0 : steps.indexOf(onrampStep)
                const isActive   = step === onrampStep
                const isDone     = steps.indexOf(step) < currentIdx
                const label      = step === "source" ? "Source" : step === "requirements" ? "Requirements" : "Context"
                return (
                  <div key={step} style={{ display: "flex", alignItems: "center" }}>
                    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
                      <div style={{
                        width: 24, height: 24, borderRadius: "50%",
                        display: "flex", alignItems: "center", justifyContent: "center",
                        backgroundColor: isDone ? "var(--evergreen)" : isActive ? "var(--slate-primary)" : "var(--hair-2)",
                        transition: "background-color 200ms",
                      }}>
                        {isDone
                          ? <Check size={12} color="#fff" />
                          : <span style={{ fontSize: 11, fontWeight: 700, color: isActive ? "#fff" : "var(--ink-tertiary)" }}>{i + 1}</span>
                        }
                      </div>
                      <span style={{ fontSize: 11, fontWeight: isActive ? 600 : 400, color: isActive ? "var(--ink)" : "var(--ink-tertiary)" }}>
                        {label}
                      </span>
                    </div>
                    {i < 2 && (
                      <div style={{ width: 64, height: 1, margin: "0 8px", marginBottom: 18, backgroundColor: "var(--hair-2)" }} />
                    )}
                  </div>
                )
              })}
            </div>
          )}

          {/* ── SOURCE STEP ── */}
          {onrampStep === "source" && (
            <div style={{ width: "100%", maxWidth: 560 }}>
              <h1 style={{ margin: "0 0 6px", fontSize: 22, fontWeight: 700, color: "var(--ink)", fontFamily: "var(--font-lora, serif)", letterSpacing: "-0.02em" }}>
                Set up your draft
              </h1>
              <p style={{ margin: "0 0 28px", fontSize: 14, color: "var(--ink-tertiary)", lineHeight: "20px" }}>
                Tell Grant Assistant where to look for requirements.
              </p>

              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {/* Option 1 — use existing RFP */}
                {rfpAttachment && (
                  <button
                    type="button"
                    onClick={() => handleSourceSelect("existing")}
                    style={{
                      width: "100%", padding: "16px 20px", borderRadius: "var(--radius-card)",
                      border: "2px solid var(--slate-primary)",
                      backgroundColor: "var(--slate-tint)",
                      textAlign: "left", cursor: "pointer",
                      display: "flex", alignItems: "flex-start", gap: 14,
                      transition: "background-color 120ms",
                    }}
                    onMouseEnter={e => (e.currentTarget.style.backgroundColor = "#dce7f0")}
                    onMouseLeave={e => (e.currentTarget.style.backgroundColor = "var(--slate-tint)")}
                  >
                    <div style={{
                      width: 36, height: 36, borderRadius: "var(--radius-button)",
                      backgroundColor: "var(--slate-primary)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
                    }}>
                      <FileText size={16} color="#fff" />
                    </div>
                    <div>
                      <p style={{ margin: "0 0 2px", fontSize: 13, fontWeight: 600, color: "var(--ink)" }}>
                        Use RFP already attached
                      </p>
                      <p style={{ margin: 0, fontSize: 12, color: "var(--ink-secondary)" }}>
                        {rfpAttachment.filename} · uploaded {rfpAttachment.uploadDate}
                      </p>
                      <p style={{ margin: "6px 0 0", fontSize: 11, color: "var(--slate-secondary)", fontWeight: 500 }}>
                        Grant Assistant will extract requirements automatically
                      </p>
                    </div>
                    <div style={{ marginLeft: "auto", flexShrink: 0, color: "var(--slate-primary)" }}>
                      <ChevronRight size={16} />
                    </div>
                  </button>
                )}

                {/* Option 2 — upload different RFP */}
                <button
                  type="button"
                  onClick={() => handleSourceSelect("upload")}
                  style={{
                    width: "100%", padding: "16px 20px", borderRadius: "var(--radius-card)",
                    border: "1px solid var(--hair-2)", backgroundColor: "var(--surface)",
                    textAlign: "left", cursor: "pointer",
                    display: "flex", alignItems: "flex-start", gap: 14,
                    transition: "background-color 120ms",
                  }}
                  onMouseEnter={e => (e.currentTarget.style.backgroundColor = "var(--canvas)")}
                  onMouseLeave={e => (e.currentTarget.style.backgroundColor = "var(--surface)")}
                >
                  <div style={{
                    width: 36, height: 36, borderRadius: "var(--radius-button)",
                    backgroundColor: "var(--canvas)", border: "1px solid var(--hair-2)",
                    display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
                  }}>
                    <Upload size={16} color="var(--ink-tertiary)" />
                  </div>
                  <div>
                    <p style={{ margin: "0 0 2px", fontSize: 13, fontWeight: 600, color: "var(--ink)" }}>
                      Upload an RFP
                    </p>
                    <p style={{ margin: 0, fontSize: 12, color: "var(--ink-tertiary)" }}>
                      PDF, Word doc, or any grant guidelines
                    </p>
                  </div>
                  <div style={{ marginLeft: "auto", flexShrink: 0, color: "var(--ink-tertiary)" }}>
                    <ChevronRight size={16} />
                  </div>
                </button>

                {/* Option 3 — no RFP */}
                <button
                  type="button"
                  onClick={() => handleSourceSelect("none")}
                  style={{
                    width: "100%", padding: "16px 20px", borderRadius: "var(--radius-card)",
                    border: "1px solid var(--hair-2)", backgroundColor: "var(--surface)",
                    textAlign: "left", cursor: "pointer",
                    display: "flex", alignItems: "flex-start", gap: 14,
                    transition: "background-color 120ms",
                  }}
                  onMouseEnter={e => (e.currentTarget.style.backgroundColor = "var(--canvas)")}
                  onMouseLeave={e => (e.currentTarget.style.backgroundColor = "var(--surface)")}
                >
                  <div style={{
                    width: 36, height: 36, borderRadius: "var(--radius-button)",
                    backgroundColor: "var(--canvas)", border: "1px solid var(--hair-2)",
                    display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
                  }}>
                    <Edit3 size={16} color="var(--ink-tertiary)" />
                  </div>
                  <div>
                    <p style={{ margin: "0 0 2px", fontSize: 13, fontWeight: 600, color: "var(--ink)" }}>
                      No RFP — enter requirements manually
                    </p>
                    <p style={{ margin: 0, fontSize: 12, color: "var(--ink-tertiary)" }}>
                      Build the requirements list yourself or describe what the funder wants
                    </p>
                  </div>
                  <div style={{ marginLeft: "auto", flexShrink: 0, color: "var(--ink-tertiary)" }}>
                    <ChevronRight size={16} />
                  </div>
                </button>
              </div>
            </div>
          )}

          {/* ── EXTRACTING STEP ── */}
          {onrampStep === "extracting" && (
            <div style={{ width: "100%", maxWidth: 440, textAlign: "center", paddingTop: 40 }}>
              <div style={{
                width: 56, height: 56, borderRadius: "50%",
                background: "var(--gradient-ai-wash)",
                border: "1px solid rgba(74,96,128,0.15)",
                display: "flex", alignItems: "center", justifyContent: "center",
                margin: "0 auto 20px",
              }}>
                <Loader2 size={24} className="animate-spin" style={{ color: "var(--slate-primary)" }} />
              </div>
              <h2 style={{ margin: "0 0 8px", fontSize: 18, fontWeight: 700, color: "var(--ink)", fontFamily: "var(--font-lora, serif)" }}>
                Reading the RFP
              </h2>
              <p style={{ margin: "0 0 24px", fontSize: 13, color: "var(--ink-tertiary)", lineHeight: "20px" }}>
                Grant Assistant is extracting requirements, sections, and constraints from {rfpAttachment?.filename ?? "the RFP"}.
              </p>
              <div style={{ display: "flex", flexDirection: "column", gap: 8, textAlign: "left" }}>
                {["Identifying required sections…", "Extracting word limits and constraints…", "Checking for attachment requirements…"].map((label, i) => (
                  <div key={i} style={{ display: "flex", alignItems: "center", gap: 9, padding: "9px 14px", borderRadius: "var(--radius-button)", backgroundColor: "var(--surface)", border: "1px solid var(--hair)" }}>
                    <Loader2 size={13} className="animate-spin" style={{ color: "var(--slate-soft)", flexShrink: 0 }} />
                    <span style={{ fontSize: 12, color: "var(--ink-secondary)" }}>{label}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ── REQUIREMENTS STEP ── */}
          {onrampStep === "requirements" && (
            <div style={{ width: "100%", maxWidth: 600 }}>
              <div style={{ marginBottom: 24 }}>
                <h1 style={{ margin: "0 0 4px", fontSize: 22, fontWeight: 700, color: "var(--ink)", fontFamily: "var(--font-lora, serif)", letterSpacing: "-0.02em" }}>
                  Review requirements
                </h1>
                <p style={{ margin: 0, fontSize: 13, color: "var(--ink-tertiary)", lineHeight: "19px" }}>
                  {selectedSource === "none"
                    ? "Add the sections and constraints the funder requires."
                    : "Extracted from the RFP. Edit, add, or remove before generating."}
                </p>
              </div>

              {/* Requirement list */}
              <div style={{ display: "flex", flexDirection: "column", gap: 6, marginBottom: 12 }}>
                {draftReqs.length === 0 && (
                  <div style={{ padding: "24px 20px", borderRadius: "var(--radius-card)", border: "1px dashed var(--hair-2)", textAlign: "center" }}>
                    <p style={{ margin: 0, fontSize: 13, color: "var(--ink-tertiary)" }}>No requirements yet — add one below.</p>
                  </div>
                )}

                {draftReqs.map((req, idx) => (
                  <div key={req.id}>
                    {editingReqId === req.id ? (
                      // Editing row
                      <div style={{ padding: "14px 16px", borderRadius: "var(--radius-card)", border: "2px solid var(--slate-primary)", backgroundColor: "var(--surface)" }}>
                        <input
                          ref={editReqInputRef}
                          value={editingReqText}
                          onChange={e => setEditingReqText(e.target.value)}
                          onKeyDown={e => { if (e.key === "Enter") handleSaveReqEdit() }}
                          placeholder="Describe this requirement…"
                          style={{
                            width: "100%", padding: "7px 10px", borderRadius: "var(--radius-input)",
                            border: "1px solid var(--hair-2)", backgroundColor: "var(--canvas)",
                            fontSize: 13, color: "var(--ink)", outline: "none", boxSizing: "border-box",
                            marginBottom: 10,
                          }}
                        />
                        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                            <label style={{ fontSize: 11, color: "var(--ink-tertiary)", whiteSpace: "nowrap" }}>Word limit</label>
                            <input
                              type="number"
                              value={editingWordLimit}
                              onChange={e => setEditingWordLimit(e.target.value)}
                              placeholder="e.g. 500"
                              style={{
                                width: 80, padding: "5px 8px", borderRadius: "var(--radius-input)",
                                border: "1px solid var(--hair-2)", backgroundColor: "var(--canvas)",
                                fontSize: 12, color: "var(--ink)", outline: "none",
                              }}
                            />
                            <label style={{ fontSize: 11, color: "var(--ink-tertiary)", whiteSpace: "nowrap", marginLeft: 8 }}>Char limit</label>
                            <input
                              type="number"
                              value={editingCharLimit}
                              onChange={e => setEditingCharLimit(e.target.value)}
                              placeholder="e.g. 3000"
                              style={{
                                width: 90, padding: "5px 8px", borderRadius: "var(--radius-input)",
                                border: "1px solid var(--hair-2)", backgroundColor: "var(--canvas)",
                                fontSize: 12, color: "var(--ink)", outline: "none",
                              }}
                            />
                            <div style={{ flex: 1 }} />
                            <button type="button" onClick={handleSaveReqEdit} style={{ padding: "5px 14px", borderRadius: "var(--radius-button)", border: "none", backgroundColor: "var(--slate-primary)", color: "#fff", fontSize: 12, fontWeight: 600, cursor: "pointer" }}>
                              Save
                            </button>
                            <button type="button" onClick={() => { setEditingReqId(null); setEditingReqText(""); if (!req.text.trim()) handleDeleteReq(req.id) }} style={{ padding: "5px 10px", borderRadius: "var(--radius-button)", border: "1px solid var(--hair-2)", backgroundColor: "transparent", color: "var(--ink-secondary)", fontSize: 12, cursor: "pointer" }}>
                              Cancel
                            </button>
                          </div>
                          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                            <label style={{ fontSize: 11, color: "var(--ink-tertiary)", whiteSpace: "nowrap" }}>Attachment note</label>
                            <input
                              value={editingAttachmentNote}
                              onChange={e => setEditingAttachmentNote(e.target.value)}
                              placeholder="e.g. Budget spreadsheet (xlsx or pdf)"
                              style={{
                                flex: 1, padding: "5px 8px", borderRadius: "var(--radius-input)",
                                border: "1px solid var(--hair-2)", backgroundColor: "var(--canvas)",
                                fontSize: 12, color: "var(--ink)", outline: "none",
                              }}
                            />
                          </div>
                        </div>
                      </div>
                    ) : (
                      // Display row
                      <div
                        style={{
                          padding: "12px 16px", borderRadius: "var(--radius-card)",
                          border: "1px solid var(--hair)", backgroundColor: "var(--surface)",
                          display: "flex", alignItems: "flex-start", gap: 10,
                          transition: "background-color 120ms",
                        }}
                        onMouseEnter={e => (e.currentTarget.style.backgroundColor = "var(--canvas)")}
                        onMouseLeave={e => (e.currentTarget.style.backgroundColor = "var(--surface)")}
                      >
                        <span style={{ fontSize: 11, color: "var(--ink-tertiary)", fontWeight: 600, paddingTop: 1, minWidth: 18, flexShrink: 0 }}>{idx + 1}.</span>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <p style={{ margin: "0 0 4px", fontSize: 13, color: "var(--ink)", lineHeight: "18px" }}>
                            {req.text || <em style={{ color: "var(--ink-tertiary)" }}>Untitled requirement</em>}
                          </p>
                          <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
                            {req.wordLimit && (
                              <span style={{
                                display: "inline-flex", alignItems: "center",
                                padding: "2px 7px", borderRadius: "var(--radius-pill)",
                                fontSize: 10, fontWeight: 600,
                                backgroundColor: "var(--slate-tint)", color: "var(--slate-secondary)",
                              }}>
                                ≤{req.wordLimit} words
                              </span>
                            )}
                            {req.charLimit && (
                              <span style={{
                                display: "inline-flex", alignItems: "center",
                                padding: "2px 7px", borderRadius: "var(--radius-pill)",
                                fontSize: 10, fontWeight: 600,
                                backgroundColor: "var(--slate-tint)", color: "var(--slate-secondary)",
                              }}>
                                ≤{req.charLimit} chars
                              </span>
                            )}
                            {req.constraint?.type === "required_attachment" && (
                              <span style={{
                                display: "inline-flex", alignItems: "center",
                                padding: "2px 7px", borderRadius: "var(--radius-pill)",
                                fontSize: 10, fontWeight: 600,
                                backgroundColor: "var(--terracotta-tint)", color: "var(--terracotta)",
                              }}>
                                Attachment: {req.constraint.value}
                              </span>
                            )}
                          </div>
                        </div>
                        <div style={{ display: "flex", gap: 4, flexShrink: 0 }}>
                          <button type="button" onClick={() => handleEditReq(req)} style={{ padding: 4, background: "none", border: "none", cursor: "pointer", color: "var(--ink-tertiary)", borderRadius: 4 }} title="Edit">
                            <Edit3 size={13} />
                          </button>
                          <button type="button" onClick={() => handleDeleteReq(req.id)} style={{ padding: 4, background: "none", border: "none", cursor: "pointer", color: "var(--ink-tertiary)", borderRadius: 4 }} title="Delete">
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>

              <button
                type="button"
                onClick={handleAddReq}
                style={{
                  display: "flex", alignItems: "center", gap: 6,
                  padding: "8px 14px", borderRadius: "var(--radius-button)",
                  border: "1px dashed var(--hair-2)", backgroundColor: "transparent",
                  fontSize: 12, color: "var(--ink-secondary)", cursor: "pointer",
                  marginBottom: 28, transition: "background-color 120ms",
                }}
                onMouseEnter={e => (e.currentTarget.style.backgroundColor = "var(--canvas)")}
                onMouseLeave={e => (e.currentTarget.style.backgroundColor = "transparent")}
              >
                <Plus size={13} /> Add requirement
              </button>

              <div style={{ display: "flex", justifyContent: "flex-end" }}>
                <button
                  type="button"
                  disabled={draftReqs.filter(r => r.text.trim()).length === 0}
                  onClick={() => { if (editingReqId) handleSaveReqEdit(); setOnrampStep("context") }}
                  style={{
                    padding: "9px 24px", borderRadius: "var(--radius-button)", border: "none",
                    backgroundColor: draftReqs.filter(r => r.text.trim()).length > 0 ? "var(--slate-primary)" : "var(--hair-2)",
                    color: draftReqs.filter(r => r.text.trim()).length > 0 ? "#fff" : "var(--ink-tertiary)",
                    fontSize: 13, fontWeight: 600, cursor: draftReqs.filter(r => r.text.trim()).length > 0 ? "pointer" : "default",
                    display: "flex", alignItems: "center", gap: 6, transition: "background-color 150ms",
                  }}
                  onMouseEnter={e => { if (draftReqs.filter(r => r.text.trim()).length > 0) (e.currentTarget.style.backgroundColor = "#3A4F6A") }}
                  onMouseLeave={e => { if (draftReqs.filter(r => r.text.trim()).length > 0) (e.currentTarget.style.backgroundColor = "var(--slate-primary)") }}
                >
                  Continue <ChevronRight size={14} />
                </button>
              </div>
            </div>
          )}

          {/* ── CONTEXT STEP ── */}
          {onrampStep === "context" && (
            <div style={{ width: "100%", maxWidth: 560 }}>
              <div style={{ marginBottom: 24 }}>
                <h1 style={{ margin: "0 0 4px", fontSize: 22, fontWeight: 700, color: "var(--ink)", fontFamily: "var(--font-lora, serif)", letterSpacing: "-0.02em" }}>
                  Add context
                </h1>
                <p style={{ margin: 0, fontSize: 13, color: "var(--ink-tertiary)", lineHeight: "19px" }}>
                  Prior proposals and org documents help Grant Assistant write in your voice and ground claims in your history.
                </p>
              </div>

              {contextCandidates.length === 0 && (
                <div style={{ padding: "20px", borderRadius: "var(--radius-card)", border: "1px dashed var(--hair-2)", textAlign: "center", marginBottom: 20 }}>
                  <p style={{ margin: 0, fontSize: 13, color: "var(--ink-tertiary)" }}>No prior proposals attached yet.</p>
                </div>
              )}

              <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 16 }}>
                {contextCandidates.map(att => {
                  const selected = selectedContextIds.has(att.id)
                  return (
                    <button
                      key={att.id}
                      type="button"
                      onClick={() => handleContextToggle(att.id)}
                      style={{
                        padding: "12px 16px", borderRadius: "var(--radius-card)",
                        border: `1px solid ${selected ? "var(--slate-primary)" : "var(--hair)"}`,
                        backgroundColor: selected ? "var(--slate-tint)" : "var(--surface)",
                        display: "flex", alignItems: "center", gap: 12, cursor: "pointer",
                        textAlign: "left", transition: "all 120ms",
                      }}
                    >
                      <div style={{
                        width: 32, height: 32, borderRadius: "var(--radius-button)",
                        backgroundColor: selected ? "var(--slate-primary)" : "var(--canvas)",
                        border: selected ? "none" : "1px solid var(--hair-2)",
                        display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
                      }}>
                        {selected ? <Check size={14} color="#fff" /> : <Paperclip size={14} color="var(--ink-tertiary)" />}
                      </div>
                      <div>
                        <p style={{ margin: "0 0 1px", fontSize: 13, fontWeight: 500, color: "var(--ink)" }}>{att.filename}</p>
                        <p style={{ margin: 0, fontSize: 11, color: "var(--ink-tertiary)" }}>{att.uploadDate}</p>
                      </div>
                    </button>
                  )
                })}
              </div>

              <button
                type="button"
                style={{
                  display: "flex", alignItems: "center", gap: 6,
                  padding: "8px 14px", borderRadius: "var(--radius-button)",
                  border: "1px dashed var(--hair-2)", backgroundColor: "transparent",
                  fontSize: 12, color: "var(--ink-secondary)", cursor: "pointer",
                  marginBottom: 32, transition: "background-color 120ms",
                }}
                onMouseEnter={e => (e.currentTarget.style.backgroundColor = "var(--canvas)")}
                onMouseLeave={e => (e.currentTarget.style.backgroundColor = "transparent")}
              >
                <Plus size={13} /> Add another document
              </button>

              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <button
                  type="button"
                  onClick={() => setOnrampStep("requirements")}
                  style={{
                    padding: "8px 14px", borderRadius: "var(--radius-button)",
                    border: "1px solid var(--hair-2)", backgroundColor: "transparent",
                    fontSize: 12, color: "var(--ink-secondary)", cursor: "pointer",
                    display: "flex", alignItems: "center", gap: 5,
                  }}
                >
                  <ChevronLeft size={13} /> Back
                </button>
                <button
                  type="button"
                  onClick={handleGenerateDraft}
                  style={{
                    padding: "10px 24px", borderRadius: "var(--radius-button)", border: "none",
                    background: "var(--gradient-ai-cta)",
                    color: "#fff", fontSize: 13, fontWeight: 600, cursor: "pointer",
                    display: "flex", alignItems: "center", gap: 7,
                    transition: "opacity 150ms",
                  }}
                  onMouseEnter={e => (e.currentTarget.style.opacity = "0.9")}
                  onMouseLeave={e => (e.currentTarget.style.opacity = "1")}
                >
                  <Sparkles size={14} /> Generate draft
                </button>
              </div>
            </div>
          )}

          {/* ── GENERATING STEP ── */}
          {onrampStep === "generating" && (
            <div style={{ width: "100%", maxWidth: 440, textAlign: "center", paddingTop: 40 }}>
              <div style={{
                width: 56, height: 56, borderRadius: "50%",
                background: "var(--gradient-ai-cta)",
                display: "flex", alignItems: "center", justifyContent: "center",
                margin: "0 auto 20px",
              }}>
                <Sparkles size={22} color="#fff" />
              </div>
              <h2 style={{ margin: "0 0 8px", fontSize: 18, fontWeight: 700, color: "var(--ink)", fontFamily: "var(--font-lora, serif)" }}>
                Writing your draft
              </h2>
              <p style={{ margin: "0 0 28px", fontSize: 13, color: "var(--ink-tertiary)" }}>
                Grant Assistant is composing one section per requirement, grounded in your prior proposals.
              </p>
              <div style={{ display: "flex", flexDirection: "column", gap: 8, textAlign: "left" }}>
                {["Organizing sections from requirements…", "Grounding in your prior proposals…", "Applying your organization's voice…"].map((label, i) => (
                  <div key={i} style={{ display: "flex", alignItems: "center", gap: 9, padding: "9px 14px", borderRadius: "var(--radius-button)", backgroundColor: "var(--surface)", border: "1px solid var(--hair)" }}>
                    <Loader2 size={13} className="animate-spin" style={{ color: "var(--slate-soft)", flexShrink: 0 }} />
                    <span style={{ fontSize: 12, color: "var(--ink-secondary)" }}>{label}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

      ) : (

        // ══ WORKING STATE ════════════════════════════════════════════════════
        <div
          style={{ flex: 1, display: "flex", overflow: "hidden" }}
        >

          {/* ── LEFT RAIL ─────────────────────────────────────────────── */}
          <div
            role="region"
            aria-label="Requirements and compliance"
            style={{
              width: leftCollapsed ? 40 : 252,
              flexShrink: 0, transition: "width 200ms ease",
              borderRight: "1px solid var(--hair)",
              backgroundColor: "var(--surface)",
              display: "flex", flexDirection: "column",
              overflow: "hidden",
            }}
          >
            {leftCollapsed ? (
              // Collapsed strip
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", paddingTop: 12, gap: 6 }}>
                <button
                  type="button"
                  title="Requirements"
                  onClick={() => { setLeftCollapsed(false); setLeftTab("requirements") }}
                  style={{
                    width: 32, height: 32, borderRadius: "var(--radius-button)",
                    border: "none", backgroundColor: "transparent",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    cursor: "pointer", color: "var(--ink-tertiary)", transition: "background-color 120ms",
                  }}
                  onMouseEnter={e => (e.currentTarget.style.backgroundColor = "var(--canvas)")}
                  onMouseLeave={e => (e.currentTarget.style.backgroundColor = "transparent")}
                >
                  <List size={15} />
                </button>
                <button
                  type="button"
                  title="Compliance"
                  onClick={() => { setLeftCollapsed(false); setLeftTab("compliance") }}
                  style={{
                    width: 32, height: 32, borderRadius: "var(--radius-button)",
                    border: "none", backgroundColor: "transparent",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    cursor: "pointer", color: "var(--ink-tertiary)", transition: "background-color 120ms",
                  }}
                  onMouseEnter={e => (e.currentTarget.style.backgroundColor = "var(--canvas)")}
                  onMouseLeave={e => (e.currentTarget.style.backgroundColor = "transparent")}
                >
                  <BarChart2 size={15} />
                </button>
                <div style={{ flex: 1 }} />
                <button
                  type="button"
                  title="Expand"
                  onClick={() => setLeftCollapsed(false)}
                  style={{
                    width: 32, height: 32, borderRadius: "var(--radius-button)",
                    border: "none", backgroundColor: "transparent",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    cursor: "pointer", color: "var(--ink-tertiary)", marginBottom: 12,
                  }}
                >
                  <ChevronRight size={14} />
                </button>
              </div>
            ) : (
              // Expanded rail
              <>
                {/* Rail header + tabs */}
                <div style={{ flexShrink: 0, borderBottom: "1px solid var(--hair)" }}>
                  <div style={{ display: "flex", alignItems: "center", padding: "0 4px 0 12px" }}>
                    <div style={{ display: "flex", flex: 1 }}>
                      {(["requirements", "compliance"] as const).map(tab => {
                        const active = leftTab === tab
                        const label  = tab === "requirements" ? "Requirements" : "Compliance"
                        return (
                          <button
                            key={tab}
                            type="button"
                            onClick={() => setLeftTab(tab)}
                            style={{
                              padding: "11px 8px", background: "none", border: "none", cursor: "pointer",
                              fontSize: 11, fontWeight: active ? 600 : 400,
                              color: active ? "var(--ink)" : "var(--ink-tertiary)",
                              borderBottom: `2px solid ${active ? "var(--slate-primary)" : "transparent"}`,
                              transition: "all 120ms",
                            }}
                          >
                            {label}
                          </button>
                        )
                      })}
                    </div>
                    <button
                      type="button"
                      title="Collapse"
                      onClick={() => setLeftCollapsed(true)}
                      style={{
                        width: 28, height: 28, borderRadius: "var(--radius-button)",
                        border: "none", backgroundColor: "transparent",
                        display: "flex", alignItems: "center", justifyContent: "center",
                        cursor: "pointer", color: "var(--ink-tertiary)", flexShrink: 0,
                      }}
                      onMouseEnter={e => (e.currentTarget.style.backgroundColor = "var(--canvas)")}
                      onMouseLeave={e => (e.currentTarget.style.backgroundColor = "transparent")}
                    >
                      <ChevronLeft size={14} />
                    </button>
                  </div>
                </div>

                {/* Rail body */}
                <div style={{ flex: 1, overflowY: "auto" }}>

                  {leftTab === "requirements" && (
                    <div style={{ padding: "12px 8px" }}>
                      {requirements.map((req, idx) => {
                        const section = sections.find(s => s.requirementId === req.id)
                        const status  = section ? sectionCompliance(section, req) : "uncovered"
                        return (
                          <div
                            key={req.id}
                            onClick={() => section && scrollToSection(section.id)}
                            style={{
                              padding: "9px 10px", borderRadius: "var(--radius-button)",
                              cursor: section ? "pointer" : "default",
                              marginBottom: 2, transition: "background-color 120ms",
                            }}
                            onMouseEnter={e => { if (section) (e.currentTarget.style.backgroundColor = "var(--canvas)") }}
                            onMouseLeave={e => (e.currentTarget.style.backgroundColor = "transparent")}
                          >
                            <div style={{ display: "flex", gap: 8, alignItems: "flex-start" }}>
                              <span style={{ fontSize: 10, color: "var(--ink-tertiary)", fontWeight: 600, paddingTop: 2, flexShrink: 0 }}>{idx + 1}</span>
                              <div style={{ flex: 1, minWidth: 0 }}>
                                <p style={{ margin: "0 0 4px", fontSize: 12, color: "var(--ink)", lineHeight: "16px", overflow: "hidden", textOverflow: "ellipsis", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical" }}>
                                  {req.text}
                                </p>
                                <div style={{ display: "flex", gap: 5, flexWrap: "wrap" }}>
                                  {req.wordLimit && (
                                    <span style={{ fontSize: 10, fontWeight: 600, color: "var(--ink-tertiary)" }}>
                                      ≤{req.wordLimit} w
                                    </span>
                                  )}
                                  {req.charLimit && (
                                    <span style={{ fontSize: 10, fontWeight: 600, color: "var(--ink-tertiary)" }}>
                                      ≤{req.charLimit} ch
                                    </span>
                                  )}
                                  {req.constraint?.type === "required_attachment" && (
                                    <span style={{ fontSize: 10, fontWeight: 600, color: "var(--terracotta)" }}>
                                      Attachment req.
                                    </span>
                                  )}
                                </div>
                              </div>
                              <div style={{ flexShrink: 0 }}>
                                {status === "covered"   && <CheckCircle  size={13} style={{ color: "var(--evergreen)" }} />}
                                {status === "partial"   && <AlertTriangle size={13} style={{ color: "var(--amber)" }} />}
                                {status === "uncovered" && <Circle        size={13} style={{ color: "var(--hair-2)" }} />}
                              </div>
                            </div>
                          </div>
                        )
                      })}

                      <button
                        type="button"
                        onClick={() => {}}
                        style={{
                          display: "flex", alignItems: "center", gap: 5,
                          width: "100%", padding: "7px 10px", borderRadius: "var(--radius-button)",
                          border: "none", backgroundColor: "transparent",
                          fontSize: 11, color: "var(--ink-tertiary)", cursor: "pointer",
                          marginTop: 4, transition: "background-color 120ms",
                        }}
                        onMouseEnter={e => (e.currentTarget.style.backgroundColor = "var(--canvas)")}
                        onMouseLeave={e => (e.currentTarget.style.backgroundColor = "transparent")}
                      >
                        <Plus size={11} /> Add requirement
                      </button>
                    </div>
                  )}

                  {leftTab === "compliance" && (() => {
                    const totalWords = sections.reduce((s, sec) => s + countWords(sec.content), 0)
                    const totalChars = sections.reduce((s, sec) => s + countChars(sec.content), 0)
                    const docOverWord = docWordLimit != null && totalWords > docWordLimit
                    const docOverChar = docCharLimit != null && totalChars > docCharLimit
                    return (
                      <div style={{ padding: "12px 8px" }}>
                        <p style={{ margin: "0 0 10px", fontSize: 10, fontWeight: 700, letterSpacing: "0.07em", textTransform: "uppercase", color: "var(--ink-tertiary)", padding: "0 4px" }}>
                          Compliance matrix
                        </p>
                        {requirements.map(req => {
                          const section = sections.find(s => s.requirementId === req.id)
                          const status  = section ? sectionCompliance(section, req) : "uncovered"
                          const words   = section ? countWords(section.content) : 0
                          const chars   = section ? countChars(section.content) : 0
                          return (
                            <div
                              key={req.id}
                              onClick={() => section && scrollToSection(section.id)}
                              style={{
                                padding: "9px 10px", borderRadius: "var(--radius-button)",
                                marginBottom: 2, cursor: section ? "pointer" : "default",
                                borderLeft: `2px solid ${status === "covered" ? "var(--evergreen)" : status === "partial" ? "var(--amber)" : "var(--hair-2)"}`,
                                transition: "background-color 120ms",
                              }}
                              onMouseEnter={e => { if (section) (e.currentTarget.style.backgroundColor = "var(--canvas)") }}
                              onMouseLeave={e => (e.currentTarget.style.backgroundColor = "transparent")}
                            >
                              <p style={{ margin: "0 0 3px", fontSize: 11, color: "var(--ink)", lineHeight: "15px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                                {req.text}
                              </p>
                              <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
                                <span style={{ fontSize: 10, color: status === "covered" ? "var(--evergreen)" : status === "partial" ? "var(--amber)" : "var(--ink-tertiary)", fontWeight: 600 }}>
                                  {status === "covered" ? "Covered" : status === "partial" ? "Over limit" : "Empty"}
                                </span>
                                {req.wordLimit != null && (
                                  <span style={{ fontSize: 10, color: words > req.wordLimit ? "var(--amber)" : "var(--ink-tertiary)" }}>
                                    {words} / {req.wordLimit} w
                                  </span>
                                )}
                                {req.charLimit != null && (
                                  <span style={{ fontSize: 10, color: chars > req.charLimit ? "var(--amber)" : "var(--ink-tertiary)" }}>
                                    {chars} / {req.charLimit} ch
                                  </span>
                                )}
                                {req.constraint?.type === "required_attachment" && (
                                  <span style={{ fontSize: 10, color: "var(--terracotta)" }}>Attachment req.</span>
                                )}
                              </div>
                            </div>
                          )
                        })}

                        {(docWordLimit != null || docCharLimit != null) && (
                          <div style={{
                            marginTop: 10, padding: "9px 10px",
                            borderRadius: "var(--radius-button)",
                            borderLeft: `2px solid ${docOverWord || docOverChar ? "var(--amber)" : "var(--evergreen)"}`,
                            borderTop: "1px solid var(--hair)",
                          }}>
                            <p style={{ margin: "0 0 3px", fontSize: 11, color: "var(--ink)", fontWeight: 600, lineHeight: "15px" }}>
                              Total document
                            </p>
                            <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
                              <span style={{ fontSize: 10, fontWeight: 600, color: docOverWord || docOverChar ? "var(--amber)" : "var(--evergreen)" }}>
                                {docOverWord || docOverChar ? "Over limit" : "Within limit"}
                              </span>
                              {docWordLimit != null && (
                                <span style={{ fontSize: 10, color: docOverWord ? "var(--amber)" : "var(--ink-tertiary)" }}>
                                  {totalWords} / {docWordLimit} w
                                </span>
                              )}
                              {docCharLimit != null && (
                                <span style={{ fontSize: 10, color: docOverChar ? "var(--amber)" : "var(--ink-tertiary)" }}>
                                  {totalChars} / {docCharLimit} ch
                                </span>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    )
                  })()}

                </div>
              </>
            )}
          </div>

          {/* ── CENTER EDITOR ─────────────────────────────────────────── */}
          <div
            role="main"
            aria-label="Document editor"
            style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden", minWidth: 0, backgroundColor: "#fff" }}
          >
            {/* Preview notice banner */}
            {aiPhase === "preview" && aiProposal && (
              <div style={{
                flexShrink: 0, display: "flex", alignItems: "center", gap: 9,
                padding: "9px 32px",
                backgroundColor: "rgba(74,96,128,0.05)",
                borderBottom: "1px solid var(--slate-light)",
              }}>
                <Sparkles size={12} style={{ color: "var(--slate-primary)" }} />
                <span style={{ fontSize: 12, fontWeight: 500, color: "var(--slate-primary)" }}>
                  Revision ready — accept or discard in the panel
                </span>
                <div style={{ flex: 1 }} />
                <button type="button" onClick={handleAIAccept} style={{ padding: "4px 12px", borderRadius: "var(--radius-button)", border: "none", backgroundColor: "var(--evergreen)", color: "#fff", fontSize: 11, fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", gap: 4 }}>
                  <Check size={11} /> Accept
                </button>
                <button type="button" onClick={handleAIDiscard} style={{ padding: "4px 10px", borderRadius: "var(--radius-button)", border: "1px solid var(--hair-2)", backgroundColor: "transparent", color: "var(--ink-secondary)", fontSize: 11, cursor: "pointer" }}>
                  Discard
                </button>
              </div>
            )}

            {/* Scrollable document */}
            <div style={{ flex: 1, overflowY: "auto", padding: "40px 0" }}>
              <div style={{ maxWidth: 740, margin: "0 auto", padding: "0 48px" }}>

                {/* Document title */}
                <h1
                  contentEditable
                  suppressContentEditableWarning
                  style={{
                    margin: "0 0 40px",
                    fontSize: 28, fontWeight: 700, color: "var(--ink)",
                    fontFamily: "var(--font-lora, serif)",
                    lineHeight: "34px", letterSpacing: "-0.02em",
                    outline: "none", borderBottom: "1px solid transparent",
                    transition: "border-color 120ms",
                  }}
                  onFocus={e => (e.currentTarget.style.borderBottomColor = "var(--slate-tint)")}
                  onBlur={e  => (e.currentTarget.style.borderBottomColor = "transparent")}
                >
                  {artifact.name}
                </h1>

                {/* Sections */}
                {sections.map((section) => {
                  const req        = requirements.find(r => r.id === section.requirementId)
                  const isActive   = activeSectionId === section.id
                  const isProposed = aiProposal?.sectionId === section.id
                  const wordCount  = countWords(section.content)
                  const charCount  = countChars(section.content)
                  const overWord   = req?.wordLimit != null && wordCount > req.wordLimit
                  const overChar   = req?.charLimit != null && charCount > req.charLimit

                  const secOpenThreads = (sectionThreadMap.get(section.id) ?? []).filter(t => t.status === "open")
                  const secSel = selectionBySec[section.id]
                  const secActiveThread = secOpenThreads.some(t => t.id === activeThreadId)

                  return (
                    <div
                      key={section.id}
                      style={{
                        marginBottom: 40,
                        position: "relative",
                      }}
                    >
                      {/* Section heading */}
                      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
                        <h2
                          style={{
                            margin: 0,
                            fontSize: 17, fontWeight: 600, color: isActive ? "var(--ink)" : "var(--ink-secondary)",
                            fontFamily: "var(--font-lora, serif)",
                            letterSpacing: "-0.01em", lineHeight: "22px",
                            flex: 1,
                            transition: "color 120ms",
                          }}
                        >
                          {section.title}
                        </h2>

                        {/* Comment trigger — appears when text is selected */}
                        {secSel && secSel.text && (
                          <button
                            type="button"
                            onMouseDown={e => e.preventDefault()}
                            onClick={() => handleSectionCommentClick(section.id)}
                            style={{
                              flexShrink: 0, display: "flex", alignItems: "center", gap: 4,
                              padding: "3px 8px", borderRadius: "var(--radius-pill)",
                              border: "none", backgroundColor: "var(--slate-primary)",
                              fontSize: 10, fontWeight: 600, color: "#fff", cursor: "pointer",
                              transition: "all 120ms",
                            }}
                          >
                            <MessageCircle size={9} /> Comment
                          </button>
                        )}

                        {/* Margin marker — open thread count */}
                        {secOpenThreads.length > 0 && (
                          <button
                            type="button"
                            aria-label={`${secOpenThreads.length} open comment${secOpenThreads.length !== 1 ? "s" : ""} on ${section.title}`}
                            onClick={() => openThread(secOpenThreads[0].id, section.id)}
                            style={{
                              flexShrink: 0, display: "flex", alignItems: "center", gap: 3,
                              padding: "3px 6px", borderRadius: "var(--radius-pill)",
                              border: `1px solid ${secActiveThread ? "var(--slate-primary)" : "var(--amber)"}`,
                              backgroundColor: secActiveThread ? "var(--slate-tint)" : "rgba(251,191,36,0.15)",
                              color: secActiveThread ? "var(--slate-primary)" : "var(--amber)",
                              fontSize: 10, fontWeight: 700, cursor: "pointer",
                              transition: "all 120ms",
                            }}
                            onMouseEnter={e => { (e.currentTarget.style.opacity = "0.8") }}
                            onMouseLeave={e => { (e.currentTarget.style.opacity = "1") }}
                          >
                            <MessageCircle size={9} /> {secOpenThreads.length}
                          </button>
                        )}

                        <button
                          type="button"
                          onClick={() => { setActiveSectionId(section.id); setRightCollapsed(false); setRightTab("chat"); setAiPrompt("") }}
                          style={{
                            flexShrink: 0, display: "flex", alignItems: "center", gap: 4,
                            padding: "3px 8px", borderRadius: "var(--radius-pill)",
                            border: "1px solid var(--hair-2)", backgroundColor: "transparent",
                            fontSize: 10, fontWeight: 600, color: "var(--ink-tertiary)", cursor: "pointer",
                            transition: "all 120ms",
                          }}
                          onMouseEnter={e => { (e.currentTarget.style.backgroundColor = "var(--slate-tint)"); (e.currentTarget.style.color = "var(--slate-secondary)"); (e.currentTarget.style.borderColor = "var(--slate-soft)") }}
                          onMouseLeave={e => { (e.currentTarget.style.backgroundColor = "transparent"); (e.currentTarget.style.color = "var(--ink-tertiary)"); (e.currentTarget.style.borderColor = "var(--hair-2)") }}
                        >
                          <Sparkles size={9} /> Ask AI
                        </button>
                      </div>

                      {/* Section textarea */}
                      <div style={{ position: "relative" }}>
                        {/* Preview overlay */}
                        {isProposed && aiProposal && (
                          <div style={{
                            position: "absolute", inset: 0, zIndex: 2,
                            borderRadius: "var(--radius-button)",
                            backgroundColor: "rgba(224,237,230,0.7)",
                            border: "1px solid rgba(60,94,76,0.2)",
                            backdropFilter: "blur(1px)",
                            display: "flex", flexDirection: "column",
                            overflow: "hidden",
                          }}>
                            <div style={{ padding: "8px 12px", borderBottom: "1px solid rgba(60,94,76,0.12)", display: "flex", alignItems: "center", gap: 6 }}>
                              <Sparkles size={11} style={{ color: "var(--evergreen)" }} />
                              <span style={{ fontSize: 11, fontWeight: 600, color: "var(--evergreen)" }}>Proposed revision</span>
                              <div style={{ flex: 1 }} />
                              <button type="button" onClick={handleAIAccept} style={{ padding: "3px 10px", borderRadius: "var(--radius-button)", border: "none", backgroundColor: "var(--evergreen)", color: "#fff", fontSize: 11, fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", gap: 3 }}>
                                <Check size={10} /> Accept
                              </button>
                              <button type="button" onClick={handleAIDiscard} style={{ padding: "3px 8px", borderRadius: "var(--radius-button)", border: "1px solid rgba(60,94,76,0.2)", backgroundColor: "transparent", color: "var(--evergreen)", fontSize: 11, cursor: "pointer" }}>
                                Discard
                              </button>
                            </div>
                            {/* Open comments notice in AI preview */}
                            {(() => {
                              const threads = (sectionThreadMap.get(section.id) ?? []).filter(t => t.status === "open")
                              if (!threads.length) return null
                              return (
                                <div style={{ flexShrink: 0, padding: "6px 12px", borderBottom: "1px solid rgba(60,94,76,0.12)", backgroundColor: "rgba(251,191,36,0.12)" }}>
                                  <p style={{ margin: "0 0 3px", fontSize: 9, fontWeight: 700, letterSpacing: "0.07em", textTransform: "uppercase", color: "var(--amber)" }}>
                                    {threads.length} open comment{threads.length !== 1 ? "s" : ""}
                                  </p>
                                  {threads.map(t => (
                                    <p key={t.id} style={{ margin: "0 0 2px", fontSize: 11, color: "var(--ink-secondary)", lineHeight: "15px" }}>
                                      <em>&ldquo;{t.anchorText.length > 40 ? t.anchorText.slice(0, 40) + "…" : t.anchorText}&rdquo;</em>{" — "}{t.comments[0]?.content.slice(0, 55)}{(t.comments[0]?.content.length ?? 0) > 55 ? "…" : ""}
                                    </p>
                                  ))}
                                </div>
                              )
                            })()}
                            <div style={{ flex: 1, overflowY: "auto", padding: "12px 14px", fontSize: 14, color: "var(--ink)", lineHeight: "22px", whiteSpace: "pre-wrap" }}>
                              {aiProposal.proposed}
                            </div>
                          </div>
                        )}

                        <textarea
                          ref={el => { sectionRefs.current[section.id] = el }}
                          value={section.content}
                          onChange={e => handleSectionChange(section.id, e.target.value)}
                          onFocus={() => setActiveSectionId(section.id)}
                          onBlur={() => {}}
                          onMouseUp={() => handleTextSelectionEnd(section.id)}
                          onKeyUp={() => handleTextSelectionEnd(section.id)}
                          placeholder={section.content === "" ? "Write here, or click Ask AI above to generate content for this section…" : undefined}
                          readOnly={isProposed}
                          style={{
                            width: "100%", minHeight: 80,
                            background: "none", border: "none", outline: "none", resize: "none",
                            fontSize: 15, color: "var(--ink)", lineHeight: "24px",
                            fontFamily: "inherit", padding: 0,
                            opacity: isProposed ? 0.4 : 1,
                            cursor: isProposed ? "default" : "text",
                            transition: "opacity 200ms",
                            overflow: "hidden",
                          }}
                          rows={1}
                        />
                      </div>

                      {/* Word + character count */}
                      {(req?.wordLimit != null || req?.charLimit != null || section.content.trim()) && (
                        <div style={{ marginTop: 6, display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
                          {req?.wordLimit != null ? (
                            <span style={{ fontSize: 11, color: overWord ? "var(--amber)" : "var(--ink-tertiary)" }}>
                              {wordCount} / {req.wordLimit} words{overWord && <span style={{ marginLeft: 4 }}>— over limit</span>}
                            </span>
                          ) : section.content.trim() ? (
                            <span style={{ fontSize: 11, color: "var(--ink-tertiary)" }}>{wordCount} words</span>
                          ) : null}
                          {req?.charLimit != null ? (
                            <span style={{ fontSize: 11, color: overChar ? "var(--amber)" : "var(--ink-tertiary)" }}>
                              {charCount} / {req.charLimit} characters{overChar && <span style={{ marginLeft: 4 }}>— over limit</span>}
                            </span>
                          ) : section.content.trim() ? (
                            <span style={{ fontSize: 11, color: "var(--ink-tertiary)" }}>{charCount} characters</span>
                          ) : null}
                          {req?.constraint?.type === "required_attachment" && (
                            <span style={{ fontSize: 11, color: "var(--terracotta)", display: "flex", alignItems: "center", gap: 3 }}>
                              <Paperclip size={10} /> Attachment required: {req.constraint.value}
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>

            {/* ── DOCUMENT FOOTER ─────────────────────────────────────── */}
            {(docWordLimit != null || docCharLimit != null) && (() => {
              const totalWords = sections.reduce((s, sec) => s + countWords(sec.content), 0)
              const totalChars = sections.reduce((s, sec) => s + countChars(sec.content), 0)
              const overWord   = docWordLimit != null && totalWords > docWordLimit
              const overChar   = docCharLimit != null && totalChars > docCharLimit
              return (
                <div style={{
                  flexShrink: 0,
                  borderTop: "1px solid var(--hair)",
                  padding: "8px 48px",
                  display: "flex", alignItems: "center", gap: 20,
                  backgroundColor: "#fff",
                }}>
                  <span style={{ fontSize: 11, color: "var(--ink-tertiary)", fontWeight: 600 }}>Document total</span>
                  {docWordLimit != null && (
                    <span style={{ fontSize: 11, color: overWord ? "var(--amber)" : "var(--ink-tertiary)" }}>
                      {totalWords.toLocaleString()} / {docWordLimit.toLocaleString()} words
                      {overWord && <span style={{ marginLeft: 4, fontWeight: 600 }}>— over limit</span>}
                    </span>
                  )}
                  {docCharLimit != null && (
                    <span style={{ fontSize: 11, color: overChar ? "var(--amber)" : "var(--ink-tertiary)" }}>
                      {totalChars.toLocaleString()} / {docCharLimit.toLocaleString()} characters
                      {overChar && <span style={{ marginLeft: 4, fontWeight: 600 }}>— over limit</span>}
                    </span>
                  )}
                </div>
              )
            })()}
          </div>

          {/* ── RIGHT RAIL ────────────────────────────────────────────── */}
          <div
            role="complementary"
            aria-label="AI assistant and snippets"
            style={{
              width: rightCollapsed ? 40 : 280,
              flexShrink: 0, transition: "width 200ms ease",
              borderLeft: "1px solid var(--hair)",
              backgroundColor: "var(--surface)",
              display: "flex", flexDirection: "column",
              overflow: "hidden",
              boxShadow: "var(--shadow-panel)",
            }}
          >
            {rightCollapsed ? (
              // Collapsed strip
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", paddingTop: 12, gap: 6 }}>
                <button type="button" title="AI Chat" onClick={() => { setRightCollapsed(false); setRightTab("chat") }} style={{ width: 32, height: 32, borderRadius: "var(--radius-button)", border: "none", backgroundColor: "transparent", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", color: "var(--ink-tertiary)" }}
                  onMouseEnter={e => (e.currentTarget.style.backgroundColor = "var(--canvas)")}
                  onMouseLeave={e => (e.currentTarget.style.backgroundColor = "transparent")}
                >
                  <Sparkles size={15} />
                </button>
                <button type="button" title="Snippets" onClick={() => { setRightCollapsed(false); setRightTab("snippets") }} style={{ width: 32, height: 32, borderRadius: "var(--radius-button)", border: "none", backgroundColor: "transparent", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", color: "var(--ink-tertiary)" }}
                  onMouseEnter={e => (e.currentTarget.style.backgroundColor = "var(--canvas)")}
                  onMouseLeave={e => (e.currentTarget.style.backgroundColor = "transparent")}
                >
                  <BookOpen size={15} />
                </button>
                <button type="button" title="Voice" onClick={() => { setRightCollapsed(false); setRightTab("voice") }} style={{ width: 32, height: 32, borderRadius: "var(--radius-button)", border: "none", backgroundColor: "transparent", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", color: "var(--ink-tertiary)" }}
                  onMouseEnter={e => (e.currentTarget.style.backgroundColor = "var(--canvas)")}
                  onMouseLeave={e => (e.currentTarget.style.backgroundColor = "transparent")}
                >
                  <Sliders size={15} />
                </button>
                <button type="button" title={`Comments${openThreads.length ? ` (${openThreads.length})` : ""}`} onClick={() => { setRightCollapsed(false); setRightTab("comments") }} style={{ width: 32, height: 32, borderRadius: "var(--radius-button)", border: "none", backgroundColor: "transparent", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", color: openThreads.length ? "var(--amber)" : "var(--ink-tertiary)", position: "relative" }}
                  onMouseEnter={e => (e.currentTarget.style.backgroundColor = "var(--canvas)")}
                  onMouseLeave={e => (e.currentTarget.style.backgroundColor = "transparent")}
                >
                  <Users size={15} />
                  {openThreads.length > 0 && (
                    <span style={{ position: "absolute", top: 4, right: 4, width: 10, height: 10, borderRadius: "50%", backgroundColor: "var(--amber)", border: "2px solid var(--surface)", fontSize: 0 }} />
                  )}
                </button>
                <div style={{ flex: 1 }} />
                <button type="button" title="Expand" onClick={() => setRightCollapsed(false)} style={{ width: 32, height: 32, borderRadius: "var(--radius-button)", border: "none", backgroundColor: "transparent", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", color: "var(--ink-tertiary)", marginBottom: 12 }}>
                  <ChevronLeft size={14} />
                </button>
              </div>
            ) : (
              // Expanded rail
              <>
                {/* Rail header + tabs */}
                <div style={{ flexShrink: 0, borderBottom: "1px solid var(--hair)" }}>
                  <div style={{ display: "flex", alignItems: "center", padding: "0 4px 0 4px" }}>
                    <button
                      type="button"
                      title="Collapse"
                      onClick={() => setRightCollapsed(true)}
                      style={{
                        width: 28, height: 28, borderRadius: "var(--radius-button)",
                        border: "none", backgroundColor: "transparent",
                        display: "flex", alignItems: "center", justifyContent: "center",
                        cursor: "pointer", color: "var(--ink-tertiary)", flexShrink: 0, marginRight: 2,
                      }}
                      onMouseEnter={e => (e.currentTarget.style.backgroundColor = "var(--canvas)")}
                      onMouseLeave={e => (e.currentTarget.style.backgroundColor = "transparent")}
                    >
                      <ChevronRight size={14} />
                    </button>
                    <div style={{ display: "flex", flex: 1, overflow: "hidden" }}>
                      {(["chat", "snippets", "voice", "comments"] as const).map(tab => {
                        const active = rightTab === tab
                        const icon   = tab === "chat" ? <Sparkles size={11} /> : tab === "snippets" ? <BookOpen size={11} /> : tab === "voice" ? <Sliders size={11} /> : <Users size={11} />
                        const label  = tab === "chat" ? "Chat" : tab === "snippets" ? "Snippets" : tab === "voice" ? "Voice" : "Comments"
                        const badge  = tab === "comments" && openThreads.length > 0
                        return (
                          <button
                            key={tab}
                            type="button"
                            onClick={() => setRightTab(tab)}
                            style={{
                              display: "flex", alignItems: "center", gap: 3,
                              padding: "10px 6px", background: "none", border: "none", cursor: "pointer",
                              fontSize: 11, fontWeight: active ? 600 : 400,
                              color: active ? "var(--ink)" : badge ? "var(--amber)" : "var(--ink-tertiary)",
                              borderBottom: `2px solid ${active ? "var(--slate-primary)" : "transparent"}`,
                              transition: "all 120ms",
                              whiteSpace: "nowrap",
                            }}
                          >
                            {icon}{label}{badge && <span style={{ fontSize: 9, fontWeight: 700, backgroundColor: "var(--amber)", color: "#fff", borderRadius: 9, padding: "1px 4px", lineHeight: 1 }}>{openThreads.length}</span>}
                          </button>
                        )
                      })}
                    </div>
                  </div>
                </div>

                {/* ── AI CHAT TAB ── */}
                {rightTab === "chat" && (
                  <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>

                    {/* Scope indicator */}
                    {activeSection && (
                      <div style={{
                        flexShrink: 0, padding: "7px 14px",
                        borderBottom: "1px solid var(--hair)",
                        backgroundColor: "var(--slate-tint)",
                        display: "flex", alignItems: "center", gap: 6,
                      }}>
                        <span style={{ fontSize: 10, fontWeight: 700, color: "var(--slate-secondary)", textTransform: "uppercase", letterSpacing: "0.06em" }}>Section</span>
                        <span style={{ fontSize: 11, color: "var(--slate-primary)", fontWeight: 500, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                          {activeSection.title}
                        </span>
                        <button
                          type="button"
                          onClick={() => setActiveSectionId(null)}
                          style={{ marginLeft: "auto", background: "none", border: "none", cursor: "pointer", color: "var(--slate-soft)", padding: 2, flexShrink: 0 }}
                          title="Clear scope"
                        >
                          <X size={11} />
                        </button>
                      </div>
                    )}

                    {/* AI phase: error */}
                    {aiPhase === "error" && (
                      <div style={{ flexShrink: 0, padding: "10px 14px", backgroundColor: "var(--error-light)", borderBottom: "1px solid rgba(185,28,28,0.15)", display: "flex", gap: 8 }}>
                        <AlertCircle size={13} style={{ color: "var(--error)", flexShrink: 0, marginTop: 1 }} />
                        <div>
                          <p style={{ margin: "0 0 5px", fontSize: 12, color: "var(--error)", lineHeight: "16px" }}>{aiError}</p>
                          <button type="button" onClick={() => handleAIGenerate()} style={{ display: "inline-flex", alignItems: "center", gap: 3, fontSize: 11, fontWeight: 600, color: "var(--error)", background: "none", border: "none", cursor: "pointer", padding: 0 }}>
                            <RefreshCw size={10} /> Retry
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Chat messages */}
                    <div style={{ flex: 1, overflowY: "auto", padding: "14px 14px 8px" }}>
                      {chatMessages.map(msg => (
                        <div key={msg.id} style={{ marginBottom: 12 }}>
                          {msg.role === "assistant" ? (
                            <div style={{
                              padding: "10px 12px", borderRadius: "var(--radius-button)",
                              backgroundColor: "var(--canvas)", border: "1px solid var(--hair)",
                              fontSize: 12, color: "var(--ink)", lineHeight: "18px",
                            }}>
                              {msg.content}
                            </div>
                          ) : (
                            <div style={{
                              padding: "10px 12px", borderRadius: "var(--radius-button)",
                              backgroundColor: "var(--slate-tint)",
                              fontSize: 12, color: "var(--ink)", lineHeight: "18px",
                              marginLeft: 20,
                            }}>
                              {msg.content}
                            </div>
                          )}
                        </div>
                      ))}
                      {isChatBusy && (
                        <div style={{ display: "flex", gap: 4, alignItems: "center", padding: "8px 12px" }}>
                          <Loader2 size={12} className="animate-spin" style={{ color: "var(--slate-soft)" }} />
                          <span style={{ fontSize: 11, color: "var(--ink-tertiary)" }}>Thinking…</span>
                        </div>
                      )}
                      <div ref={chatEndRef} />
                    </div>

                    {/* Generating state */}
                    {aiPhase === "generating" && (
                      <div style={{ flexShrink: 0, padding: "16px 14px", borderTop: "1px solid var(--hair)", display: "flex", flexDirection: "column", alignItems: "center", gap: 10 }}>
                        <Loader2 size={20} className="animate-spin" style={{ color: "var(--slate-primary)" }} />
                        <p style={{ margin: 0, fontSize: 12, color: "var(--ink-secondary)", textAlign: "center" }}>Revising…</p>
                        <button type="button" onClick={handleAICancel} style={{ fontSize: 11, color: "var(--ink-tertiary)", background: "none", border: "none", cursor: "pointer", textDecoration: "underline" }}>
                          Cancel
                        </button>
                      </div>
                    )}

                    {/* Preview accept/discard */}
                    {aiPhase === "preview" && aiProposal && (
                      <div style={{ flexShrink: 0, padding: "10px 14px", borderTop: "1px solid var(--hair)", display: "flex", flexDirection: "column", gap: 8 }}>
                        <p style={{ margin: 0, fontSize: 10, fontWeight: 700, letterSpacing: "0.07em", textTransform: "uppercase", color: "var(--ink-tertiary)" }}>
                          Proposed change
                        </p>
                        <div style={{
                          padding: "8px 10px", borderRadius: "var(--radius-button)",
                          backgroundColor: "var(--evergreen-tint)", border: "1px solid rgba(60,94,76,0.18)",
                          fontSize: 11, color: "var(--ink-secondary)", lineHeight: "17px",
                          maxHeight: 140, overflowY: "auto", whiteSpace: "pre-wrap",
                        }}>
                          {aiProposal.proposed.slice(0, 280)}{aiProposal.proposed.length > 280 ? "…" : ""}
                        </div>
                        <div style={{ display: "flex", gap: 6 }}>
                          <button type="button" onClick={handleAIAccept} style={{ flex: 1, padding: "8px 0", borderRadius: "var(--radius-button)", border: "none", backgroundColor: "var(--evergreen)", color: "#fff", fontSize: 12, fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 5 }}>
                            <Check size={12} /> Accept
                          </button>
                          <button type="button" onClick={handleAIDiscard} style={{ flex: 1, padding: "8px 0", borderRadius: "var(--radius-button)", border: "1px solid var(--hair-2)", backgroundColor: "transparent", color: "var(--ink-secondary)", fontSize: 12, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 5 }}>
                            <X size={12} /> Discard
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Chat input */}
                    <div style={{ flexShrink: 0, borderTop: "1px solid var(--hair)" }}>
                      {activeSection && aiPhase === "idle" && (
                        <p style={{ margin: 0, padding: "6px 14px 0", fontSize: 10, color: "var(--ink-tertiary)", lineHeight: "14px" }}>
                          Ask a question or say &ldquo;make it shorter&rdquo; — revisions preview before applying.
                        </p>
                      )}
                    <div style={{ padding: "8px 14px 10px", display: "flex", gap: 8, alignItems: "flex-end" }}>
                      <textarea
                        ref={chatInputRef}
                        value={chatInput}
                        onChange={e => setChatInput(e.target.value)}
                        onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleChatSend() } }}
                        placeholder={activeSection ? `Ask about or revise "${activeSection.title.split(" ").slice(0, 3).join(" ")}…"` : "Ask anything…"}
                        rows={1}
                        style={{
                          flex: 1, padding: "7px 10px", borderRadius: "var(--radius-input)",
                          border: "1px solid var(--hair-2)", backgroundColor: "var(--canvas)",
                          fontSize: 12, color: "var(--ink)", lineHeight: "18px",
                          fontFamily: "inherit", outline: "none", resize: "none",
                          transition: "border-color 120ms",
                        }}
                        onFocus={e  => (e.currentTarget.style.borderColor = "var(--slate-soft)")}
                        onBlur={e   => (e.currentTarget.style.borderColor = "var(--hair-2)")}
                      />
                      <button
                        type="button"
                        onClick={handleChatSend}
                        disabled={!chatInput.trim() || isChatBusy}
                        style={{
                          width: 32, height: 32, borderRadius: "var(--radius-button)", border: "none", flexShrink: 0,
                          backgroundColor: chatInput.trim() && !isChatBusy ? "var(--slate-primary)" : "var(--hair-2)",
                          color: chatInput.trim() && !isChatBusy ? "#fff" : "var(--ink-tertiary)",
                          cursor: chatInput.trim() && !isChatBusy ? "pointer" : "default",
                          display: "flex", alignItems: "center", justifyContent: "center",
                          transition: "background-color 120ms",
                        }}
                      >
                        <Send size={13} />
                      </button>
                    </div>
                    </div>
                  </div>
                )}

                {/* ── SNIPPETS TAB ── */}
                {rightTab === "snippets" && (
                  <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>

                    <div style={{ flexShrink: 0, padding: "10px 14px", borderBottom: "1px solid var(--hair)" }}>
                      <div style={{ position: "relative" }}>
                        <Search size={12} style={{ position: "absolute", left: 9, top: "50%", transform: "translateY(-50%)", color: "var(--ink-tertiary)", pointerEvents: "none" }} />
                        <input
                          value={snippetSearch}
                          onChange={e => setSnippetSearch(e.target.value)}
                          placeholder="Search snippets…"
                          style={{
                            width: "100%", padding: "6px 10px 6px 28px",
                            borderRadius: "var(--radius-input)", border: "1px solid var(--hair-2)",
                            backgroundColor: "var(--canvas)", fontSize: 12, color: "var(--ink)",
                            outline: "none", boxSizing: "border-box", transition: "border-color 120ms",
                          }}
                          onFocus={e  => (e.currentTarget.style.borderColor = "var(--slate-soft)")}
                          onBlur={e   => (e.currentTarget.style.borderColor = "var(--hair-2)")}
                        />
                      </div>
                    </div>

                    <div style={{ flex: 1, overflowY: "auto", padding: "8px 10px" }}>
                      {filteredSnippets.length === 0 && (
                        <p style={{ fontSize: 12, color: "var(--ink-tertiary)", textAlign: "center", marginTop: 24 }}>No snippets found.</p>
                      )}
                      {filteredSnippets.map(snip => {
                        const justInserted = insertedSnip === snip.id
                        return (
                          <div
                            key={snip.id}
                            style={{
                              padding: "10px 12px", borderRadius: "var(--radius-button)",
                              border: "1px solid var(--hair)", backgroundColor: "var(--surface)",
                              marginBottom: 6, transition: "background-color 120ms",
                            }}
                            onMouseEnter={e => (e.currentTarget.style.backgroundColor = "var(--canvas)")}
                            onMouseLeave={e => (e.currentTarget.style.backgroundColor = "var(--surface)")}
                          >
                            <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 8, marginBottom: 5 }}>
                              <p style={{ margin: 0, fontSize: 12, fontWeight: 600, color: "var(--ink)", lineHeight: "16px" }}>{snip.title}</p>
                              <button
                                type="button"
                                onClick={() => handleInsertSnippet(snip)}
                                style={{
                                  flexShrink: 0, padding: "3px 8px", borderRadius: "var(--radius-button)",
                                  border: "none",
                                  backgroundColor: justInserted ? "var(--evergreen)" : "var(--slate-tint)",
                                  color: justInserted ? "#fff" : "var(--slate-secondary)",
                                  fontSize: 10, fontWeight: 600, cursor: "pointer",
                                  display: "flex", alignItems: "center", gap: 3,
                                  transition: "background-color 200ms",
                                }}
                              >
                                {justInserted ? <><Check size={9} /> Inserted</> : <><Copy size={9} /> Insert</>}
                              </button>
                            </div>
                            <p style={{ margin: 0, fontSize: 11, color: "var(--ink-tertiary)", lineHeight: "16px", overflow: "hidden", textOverflow: "ellipsis", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical" }}>
                              {snip.body}
                            </p>
                          </div>
                        )
                      })}

                      <button
                        type="button"
                        style={{
                          display: "flex", alignItems: "center", gap: 5, width: "100%",
                          padding: "8px 12px", borderRadius: "var(--radius-button)",
                          border: "1px dashed var(--hair-2)", backgroundColor: "transparent",
                          fontSize: 11, color: "var(--ink-tertiary)", cursor: "pointer",
                          transition: "background-color 120ms",
                        }}
                        onMouseEnter={e => (e.currentTarget.style.backgroundColor = "var(--canvas)")}
                        onMouseLeave={e => (e.currentTarget.style.backgroundColor = "transparent")}
                      >
                        <Plus size={11} /> Save selection as snippet
                      </button>
                    </div>

                    {!activeSectionId && (
                      <div style={{ flexShrink: 0, padding: "8px 14px", borderTop: "1px solid var(--hair)" }}>
                        <p style={{ margin: 0, fontSize: 11, color: "var(--ink-tertiary)", lineHeight: "15px" }}>
                          Focus a section to insert snippets at the cursor.
                        </p>
                      </div>
                    )}
                  </div>
                )}

                {/* ── VOICE TAB ── */}
                {rightTab === "voice" && (
                  <div style={{ flex: 1, overflowY: "auto", padding: "16px 14px" }}>
                    <p style={{ margin: "0 0 12px", fontSize: 10, fontWeight: 700, letterSpacing: "0.07em", textTransform: "uppercase", color: "var(--ink-tertiary)" }}>
                      Tone
                    </p>

                    <div style={{ display: "flex", flexDirection: "column", gap: 6, marginBottom: 24 }}>
                      {VOICE_TONES.map(tone => {
                        const active = voiceTone === tone.value
                        return (
                          <button
                            key={tone.value}
                            type="button"
                            onClick={() => setVoiceTone(tone.value)}
                            style={{
                              padding: "9px 12px", borderRadius: "var(--radius-button)",
                              border: `1px solid ${active ? "var(--slate-primary)" : "var(--hair-2)"}`,
                              backgroundColor: active ? "var(--slate-tint)" : "transparent",
                              textAlign: "left", cursor: "pointer",
                              transition: "all 120ms",
                            }}
                            onMouseEnter={e => { if (!active) (e.currentTarget.style.backgroundColor = "var(--canvas)") }}
                            onMouseLeave={e => { if (!active) (e.currentTarget.style.backgroundColor = "transparent") }}
                          >
                            <p style={{ margin: "0 0 2px", fontSize: 12, fontWeight: active ? 600 : 400, color: active ? "var(--slate-primary)" : "var(--ink)" }}>{tone.label}</p>
                            <p style={{ margin: 0, fontSize: 11, color: active ? "var(--slate-secondary)" : "var(--ink-tertiary)" }}>{tone.hint}</p>
                          </button>
                        )
                      })}
                    </div>

                    <div style={{ borderTop: "1px solid var(--hair)", paddingTop: 20, marginBottom: 24 }}>
                      <p style={{ margin: "0 0 8px", fontSize: 10, fontWeight: 700, letterSpacing: "0.07em", textTransform: "uppercase", color: "var(--ink-tertiary)" }}>
                        Humanize
                      </p>
                      <p style={{ margin: "0 0 12px", fontSize: 12, color: "var(--ink-tertiary)", lineHeight: "17px" }}>
                        Softens AI-sounding patterns, calibrated against your prior proposals.
                      </p>
                      <button
                        type="button"
                        disabled={isHumanizing}
                        onClick={handleHumanize}
                        style={{
                          width: "100%", padding: "9px 0", borderRadius: "var(--radius-button)", border: "none",
                          background: isHumanizing ? "var(--hair-2)" : "var(--gradient-ai-cta)",
                          color: isHumanizing ? "var(--ink-tertiary)" : "#fff",
                          fontSize: 12, fontWeight: 600, cursor: isHumanizing ? "default" : "pointer",
                          display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
                          transition: "opacity 150ms",
                        }}
                        onMouseEnter={e => { if (!isHumanizing) (e.currentTarget.style.opacity = "0.9") }}
                        onMouseLeave={e => (e.currentTarget.style.opacity = "1")}
                      >
                        {isHumanizing ? <><Loader2 size={12} className="animate-spin" /> Humanizing…</> : <><Sparkles size={12} /> Humanize{activeSection ? ` this section` : " draft"}</>}
                      </button>
                    </div>

                    <div style={{ borderTop: "1px solid var(--hair)", paddingTop: 20 }}>
                      <p style={{ margin: "0 0 10px", fontSize: 10, fontWeight: 700, letterSpacing: "0.07em", textTransform: "uppercase", color: "var(--ink-tertiary)" }}>
                        Sources
                      </p>
                      {existingSession?.sourceAttachmentId && (
                        <div style={{ display: "flex", gap: 8, alignItems: "center", padding: "8px 10px", borderRadius: "var(--radius-button)", border: "1px solid var(--hair)", backgroundColor: "var(--canvas)", marginBottom: 6 }}>
                          <FileText size={12} style={{ color: "var(--slate-soft)", flexShrink: 0 }} />
                          <div>
                            <p style={{ margin: 0, fontSize: 11, color: "var(--ink)", fontWeight: 500 }}>
                              {pipelineAttachments.find(a => a.id === existingSession?.sourceAttachmentId)?.filename ?? "RFP"}
                            </p>
                            <p style={{ margin: 0, fontSize: 10, color: "var(--ink-tertiary)" }}>RFP source</p>
                          </div>
                        </div>
                      )}
                      {existingSession?.contextAttachmentIds.map(id => {
                        const att = pipelineAttachments.find(a => a.id === id)
                        if (!att) return null
                        return (
                          <div key={id} style={{ display: "flex", gap: 8, alignItems: "center", padding: "8px 10px", borderRadius: "var(--radius-button)", border: "1px solid var(--hair)", backgroundColor: "var(--canvas)", marginBottom: 6 }}>
                            <Paperclip size={12} style={{ color: "var(--slate-soft)", flexShrink: 0 }} />
                            <div>
                              <p style={{ margin: 0, fontSize: 11, color: "var(--ink)", fontWeight: 500 }}>{att.filename}</p>
                              <p style={{ margin: 0, fontSize: 10, color: "var(--ink-tertiary)" }}>Context</p>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )}
                {/* ── COMMENTS TAB ── */}
                {rightTab === "comments" && (
                  <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>

                    {/* Header */}
                    <div style={{ flexShrink: 0, padding: "8px 14px", borderBottom: "1px solid var(--hair)", display: "flex", alignItems: "center", gap: 8 }}>
                      <span style={{ fontSize: 12, fontWeight: 600, color: "var(--ink)", flex: 1 }}>
                        {openThreads.length} open
                      </span>
                      <button
                        type="button"
                        onClick={() => setShowResolved(v => !v)}
                        style={{ fontSize: 11, background: "none", border: "none", cursor: "pointer", color: showResolved ? "var(--slate-primary)" : "var(--ink-tertiary)", fontWeight: showResolved ? 600 : 400, padding: 0 }}
                      >
                        {showResolved ? "Hide resolved" : "Show resolved"}
                      </button>
                    </div>

                    {/* New comment form */}
                    {pendingAnchor && (
                      <div style={{ flexShrink: 0, padding: "10px 12px", borderBottom: "1px solid var(--hair)", backgroundColor: "var(--canvas)" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 6 }}>
                          <div style={{ width: 22, height: 22, borderRadius: "50%", backgroundColor: "var(--slate-primary)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 9, fontWeight: 700, color: "#fff", flexShrink: 0 }}>
                            {USER.initials}
                          </div>
                          <span style={{ fontSize: 11, fontWeight: 600, color: "var(--ink)", flex: 1 }}>{USER.name}</span>
                          <button type="button" onClick={() => { setPendingAnchor(null); setNewCommentText(""); setMentionQuery(null); setMentionTarget(null) }} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--ink-tertiary)", padding: 2 }}>
                            <X size={12} />
                          </button>
                        </div>
                        <div style={{ marginBottom: 8, padding: "4px 8px", borderRadius: 4, borderLeft: "2px solid var(--amber)", backgroundColor: "rgba(251,191,36,0.12)", fontSize: 11, color: "var(--ink-secondary)", fontStyle: "italic", lineHeight: "16px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                          &ldquo;{pendingAnchor.anchorText.length > 55 ? pendingAnchor.anchorText.slice(0, 55) + "…" : pendingAnchor.anchorText}&rdquo;
                        </div>
                        <div style={{ position: "relative" }}>
                          <textarea
                            ref={newCommentInputRef}
                            value={newCommentText}
                            onChange={e => {
                              setNewCommentText(e.target.value)
                              const atIdx = e.target.value.lastIndexOf("@")
                              if (atIdx !== -1) {
                                const q = e.target.value.slice(atIdx + 1)
                                if (!q.includes(" ") || q.length === 0) { setMentionQuery(q); setMentionTarget("new") }
                                else { setMentionQuery(null); setMentionTarget(null) }
                              } else { setMentionQuery(null); setMentionTarget(null) }
                            }}
                            placeholder="Add a comment… type @ to mention"
                            rows={2}
                            onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSubmitComment() } }}
                            style={{
                              width: "100%", padding: "7px 10px", borderRadius: "var(--radius-input)",
                              border: "1px solid var(--hair-2)", backgroundColor: "#fff",
                              fontSize: 12, color: "var(--ink)", lineHeight: "18px",
                              fontFamily: "inherit", outline: "none", resize: "none", boxSizing: "border-box",
                              transition: "border-color 120ms",
                            }}
                            onFocus={e => (e.currentTarget.style.borderColor = "var(--slate-soft)")}
                            onBlur={e => (e.currentTarget.style.borderColor = "var(--hair-2)")}
                          />
                          {mentionQuery !== null && mentionTarget === "new" && (() => {
                            const filtered = TEAMMATES.filter(u => u.name.toLowerCase().includes(mentionQuery.toLowerCase()))
                            if (!filtered.length) return null
                            return (
                              <div style={{ position: "absolute", bottom: "100%", left: 0, right: 0, marginBottom: 4, backgroundColor: "#fff", border: "1px solid var(--hair-2)", borderRadius: "var(--radius-button)", boxShadow: "0 4px 12px rgba(28,24,64,0.15)", zIndex: 10, overflow: "hidden" }}>
                                {filtered.map(u => (
                                  <button key={u.id} type="button"
                                    onMouseDown={e => e.preventDefault()}
                                    onClick={() => {
                                      const atIdx = newCommentText.lastIndexOf("@")
                                      setNewCommentText(newCommentText.slice(0, atIdx) + `@${u.name} `)
                                      setMentionQuery(null); setMentionTarget(null)
                                      newCommentInputRef.current?.focus()
                                    }}
                                    style={{ width: "100%", padding: "6px 10px", textAlign: "left", background: "none", border: "none", cursor: "pointer", fontSize: 12, color: "var(--ink)", display: "flex", alignItems: "center", gap: 8 }}
                                    onMouseEnter={e => (e.currentTarget.style.backgroundColor = "var(--canvas)")}
                                    onMouseLeave={e => (e.currentTarget.style.backgroundColor = "transparent")}
                                  >
                                    <div style={{ width: 20, height: 20, borderRadius: "50%", backgroundColor: "var(--slate-tint)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 8, fontWeight: 700, color: "var(--slate-primary)", flexShrink: 0 }}>{u.initials}</div>
                                    {u.name}
                                  </button>
                                ))}
                              </div>
                            )
                          })()}
                        </div>
                        <div style={{ marginTop: 8, display: "flex", gap: 6, justifyContent: "flex-end" }}>
                          <button type="button" onClick={() => { setPendingAnchor(null); setNewCommentText("") }} style={{ padding: "5px 10px", borderRadius: "var(--radius-button)", border: "1px solid var(--hair-2)", background: "transparent", fontSize: 11, color: "var(--ink-secondary)", cursor: "pointer" }}>Cancel</button>
                          <button type="button" onClick={handleSubmitComment} disabled={!newCommentText.trim()} style={{ padding: "5px 10px", borderRadius: "var(--radius-button)", border: "none", backgroundColor: newCommentText.trim() ? "var(--slate-primary)" : "var(--hair-2)", color: newCommentText.trim() ? "#fff" : "var(--ink-tertiary)", fontSize: 11, fontWeight: 600, cursor: newCommentText.trim() ? "pointer" : "default" }}>Comment</button>
                        </div>
                      </div>
                    )}

                    {/* Thread list */}
                    <div style={{ flex: 1, overflowY: "auto", padding: "8px 0" }}>
                      {visibleThreads.length === 0 && !pendingAnchor && (
                        <div style={{ padding: "32px 14px", textAlign: "center" }}>
                          <MessageCircle size={24} style={{ color: "var(--hair-2)", display: "block", margin: "0 auto 8px" }} />
                          <p style={{ margin: 0, fontSize: 12, color: "var(--ink-tertiary)", lineHeight: "18px" }}>Select text in a section, then click Comment to start a thread.</p>
                        </div>
                      )}
                      {visibleThreads.map(thread => {
                        const isActive = activeThreadId === thread.id
                        const sectionTitle = sections.find(s => s.id === thread.sectionId)?.title ?? ""
                        return (
                          <div
                            key={thread.id}
                            ref={isActive ? activeThreadRef : undefined}
                            tabIndex={0}
                            role="region"
                            aria-label={`Comment thread on "${thread.anchorText}"`}
                            onClick={() => setActiveThreadId(isActive ? null : thread.id)}
                            onKeyDown={e => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); setActiveThreadId(isActive ? null : thread.id) } }}
                            style={{
                              margin: "0 8px 6px", borderRadius: "var(--radius-card)",
                              border: `1px solid ${isActive ? "var(--slate-soft)" : "var(--hair)"}`,
                              backgroundColor: isActive ? "#fff" : "var(--surface)",
                              cursor: "pointer", transition: "all 120ms",
                              outline: isActive ? `2px solid var(--slate-tint)` : "none",
                              outlineOffset: 1,
                            }}
                          >
                            {/* Thread meta */}
                            <div style={{ padding: "7px 10px 0", display: "flex", alignItems: "center", gap: 6 }}>
                              <span style={{ fontSize: 10, color: "var(--ink-tertiary)", flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{sectionTitle}</span>
                              {thread.status === "resolved" && (
                                <span style={{ fontSize: 9, fontWeight: 600, color: "var(--evergreen)", backgroundColor: "var(--evergreen-tint)", padding: "2px 6px", borderRadius: 9, flexShrink: 0 }}>Resolved</span>
                              )}
                            </div>

                            {/* Anchor text */}
                            <div style={{ padding: "4px 10px 6px" }}>
                              <div style={{ padding: "3px 7px", borderRadius: 4, borderLeft: `2px solid ${thread.status === "resolved" ? "var(--hair-2)" : "var(--amber)"}`, backgroundColor: thread.status === "resolved" ? "transparent" : "rgba(251,191,36,0.1)", fontSize: 11, color: thread.status === "resolved" ? "var(--ink-tertiary)" : "var(--ink-secondary)", fontStyle: "italic", lineHeight: "15px" }}>
                                {thread.anchorStatus === "text_changed" && (
                                  <span style={{ display: "block", fontSize: 9, fontWeight: 600, color: "var(--amber)", marginBottom: 2, fontStyle: "normal" }}>Referenced text changed</span>
                                )}
                                &ldquo;{thread.anchorText.length > 65 ? thread.anchorText.slice(0, 65) + "…" : thread.anchorText}&rdquo;
                              </div>
                            </div>

                            {/* Comments — first comment always visible, rest only when expanded */}
                            <div style={{ padding: "0 10px" }}>
                              {thread.comments.slice(0, isActive ? undefined : 1).map((comment, idx) => {
                                const author = ALL_USERS.find(u => u.id === comment.authorId)
                                return (
                                  <div key={comment.id} style={{ display: "flex", gap: 6, marginBottom: 8, opacity: thread.status === "resolved" ? 0.7 : 1 }}>
                                    <div style={{ width: 22, height: 22, borderRadius: "50%", backgroundColor: idx === 0 ? "var(--slate-primary)" : "var(--slate-tint)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 9, fontWeight: 700, color: idx === 0 ? "#fff" : "var(--slate-primary)", flexShrink: 0, marginTop: 1 }}>
                                      {author?.initials ?? "?"}
                                    </div>
                                    <div style={{ flex: 1, minWidth: 0 }}>
                                      <div style={{ display: "flex", alignItems: "baseline", gap: 6, marginBottom: 2 }}>
                                        <span style={{ fontSize: 11, fontWeight: 600, color: "var(--ink)" }}>{author?.name ?? "Unknown"}</span>
                                        <span style={{ fontSize: 10, color: "var(--ink-tertiary)" }}>{formatCommentTime(comment.createdAt)}</span>
                                      </div>
                                      <p style={{ margin: 0, fontSize: 12, color: "var(--ink)", lineHeight: "17px", wordBreak: "break-word" }}>{comment.content}</p>
                                    </div>
                                  </div>
                                )
                              })}
                              {!isActive && thread.comments.length > 1 && (
                                <p style={{ margin: "0 0 8px", fontSize: 11, color: "var(--ink-tertiary)", paddingLeft: 28 }}>
                                  +{thread.comments.length - 1} {thread.comments.length > 2 ? "replies" : "reply"}
                                </p>
                              )}
                            </div>

                            {/* Expanded actions */}
                            {isActive && (
                              <div style={{ padding: "0 10px 10px" }} onClick={e => e.stopPropagation()}>
                                {/* Reply input */}
                                {thread.status === "open" && (() => {
                                  const replyText = replyTexts[thread.id] ?? ""
                                  const tid = thread.id
                                  return (
                                    <div style={{ position: "relative", marginBottom: 8 }}>
                                      <div style={{ display: "flex", gap: 6, alignItems: "flex-end" }}>
                                        <div style={{ width: 22, height: 22, borderRadius: "50%", backgroundColor: "var(--slate-primary)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 9, fontWeight: 700, color: "#fff", flexShrink: 0 }}>
                                          {USER.initials}
                                        </div>
                                        <textarea
                                          value={replyText}
                                          onChange={e => {
                                            setReplyTexts(prev => ({ ...prev, [tid]: e.target.value }))
                                            const atIdx = e.target.value.lastIndexOf("@")
                                            if (atIdx !== -1) {
                                              const q = e.target.value.slice(atIdx + 1)
                                              if (!q.includes(" ")) { setMentionQuery(q); setMentionTarget(tid) }
                                              else { setMentionQuery(null); setMentionTarget(null) }
                                            } else { setMentionQuery(null); setMentionTarget(null) }
                                          }}
                                          placeholder="Reply… type @ to mention"
                                          rows={1}
                                          onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSubmitReply(tid) } }}
                                          style={{
                                            flex: 1, padding: "5px 8px", borderRadius: "var(--radius-input)",
                                            border: "1px solid var(--hair-2)", backgroundColor: "var(--canvas)",
                                            fontSize: 11, color: "var(--ink)", lineHeight: "16px",
                                            fontFamily: "inherit", outline: "none", resize: "none",
                                            transition: "border-color 120ms",
                                          }}
                                          onFocus={e => (e.currentTarget.style.borderColor = "var(--slate-soft)")}
                                          onBlur={e => (e.currentTarget.style.borderColor = "var(--hair-2)")}
                                        />
                                        <button
                                          type="button"
                                          disabled={!replyText.trim()}
                                          onClick={() => handleSubmitReply(tid)}
                                          style={{ width: 26, height: 26, borderRadius: "var(--radius-button)", border: "none", flexShrink: 0, backgroundColor: replyText.trim() ? "var(--slate-primary)" : "var(--hair-2)", color: replyText.trim() ? "#fff" : "var(--ink-tertiary)", cursor: replyText.trim() ? "pointer" : "default", display: "flex", alignItems: "center", justifyContent: "center" }}
                                        >
                                          <Send size={11} />
                                        </button>
                                      </div>
                                      {mentionQuery !== null && mentionTarget === tid && (() => {
                                        const filtered = TEAMMATES.filter(u => u.name.toLowerCase().includes(mentionQuery.toLowerCase()))
                                        if (!filtered.length) return null
                                        return (
                                          <div style={{ position: "absolute", bottom: "100%", left: 28, right: 32, marginBottom: 4, backgroundColor: "#fff", border: "1px solid var(--hair-2)", borderRadius: "var(--radius-button)", boxShadow: "0 4px 12px rgba(28,24,64,0.15)", zIndex: 10, overflow: "hidden" }}>
                                            {filtered.map(u => (
                                              <button key={u.id} type="button"
                                                onMouseDown={e => e.preventDefault()}
                                                onClick={() => {
                                                  const text = replyTexts[tid] ?? ""
                                                  const atIdx = text.lastIndexOf("@")
                                                  setReplyTexts(prev => ({ ...prev, [tid]: text.slice(0, atIdx) + `@${u.name} ` }))
                                                  setMentionQuery(null); setMentionTarget(null)
                                                }}
                                                style={{ width: "100%", padding: "5px 8px", textAlign: "left", background: "none", border: "none", cursor: "pointer", fontSize: 11, color: "var(--ink)", display: "flex", alignItems: "center", gap: 6 }}
                                                onMouseEnter={e => (e.currentTarget.style.backgroundColor = "var(--canvas)")}
                                                onMouseLeave={e => (e.currentTarget.style.backgroundColor = "transparent")}
                                              >
                                                <div style={{ width: 18, height: 18, borderRadius: "50%", backgroundColor: "var(--slate-tint)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 8, fontWeight: 700, color: "var(--slate-primary)", flexShrink: 0 }}>{u.initials}</div>
                                                {u.name}
                                              </button>
                                            ))}
                                          </div>
                                        )
                                      })()}
                                    </div>
                                  )
                                })()}
                                <div style={{ display: "flex", justifyContent: "flex-end" }}>
                                  {thread.status === "open" ? (
                                    <button
                                      type="button"
                                      onClick={() => handleResolve(thread.id)}
                                      style={{ padding: "4px 10px", borderRadius: "var(--radius-button)", border: "1px solid var(--evergreen)", background: "transparent", fontSize: 11, fontWeight: 600, color: "var(--evergreen)", cursor: "pointer", display: "flex", alignItems: "center", gap: 4 }}
                                    >
                                      <CheckCircle size={11} /> Resolve
                                    </button>
                                  ) : (
                                    <button
                                      type="button"
                                      onClick={() => handleReopen(thread.id)}
                                      style={{ padding: "4px 10px", borderRadius: "var(--radius-button)", border: "1px solid var(--hair-2)", background: "transparent", fontSize: 11, color: "var(--ink-tertiary)", cursor: "pointer", display: "flex", alignItems: "center", gap: 4 }}
                                    >
                                      <RefreshCw size={10} /> Reopen
                                    </button>
                                  )}
                                </div>
                              </div>
                            )}
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )}

              </>
            )}
          </div>

        </div>
      )}

      {/* Mention notification toast */}
      {mentionToast && (
        <div style={{
          position: "fixed", bottom: 24, right: 24, zIndex: 200,
          backgroundColor: "var(--ink)", color: "#fff",
          padding: "10px 16px", borderRadius: 10,
          fontSize: 13, fontWeight: 500, lineHeight: "18px",
          boxShadow: "0 4px 16px rgba(28,24,64,0.25)",
          pointerEvents: "none",
        }}>
          {mentionToast}
        </div>
      )}

    </div>
  )
}
