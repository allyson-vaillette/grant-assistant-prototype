"use client";

// Respond · New proposal — creation as conversation.
// Figma: GA 2.0 Final Specs > 1c · Creation as conversation (node 1388-3)
//
// One scrolling thread. Each setup step is an AI message; committed steps
// collapse to a receipt line and the user's choice renders as a chat bubble.
// The rail on the right mirrors progress. Edit on a receipt rewinds the flow.
//
// WIRING (integration into grant-assistant):
//   This standalone flow carries no opportunity id (it uses the ENGAGEMENT
//   mock), so exits target the canonical demo pursuit opp-1 — the same default
//   RespondEditor and WizardProvider use.
//     · Close X          → /pursuit/opp-1                (workspace hub, "Saved as draft")
//     · Draft it for me  → /pursuit/opp-1/respond?mode=ai   (RespondEditor, AI first pass)
//     · I'll write it     → /pursuit/opp-1/respond?mode=self (RespondEditor, empty outline)
//   mode=ai|self and name are the exact params the existing RespondEditor and
//   RespondWizard already read, so this flow is a drop-in for the modal wizard.

import {
  ChevronDown,
  FileText,
  FolderOpen,
  Link2,
  Paperclip,
  Pencil,
  TriangleAlert,
  Upload,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  COPY,
  ENGAGEMENT,
  INITIAL_REQUIREMENTS,
  INITIAL_SOURCES,
  LIBRARY_EXTRA,
  PHASE_ORDER,
  PROJECT_OPTIONS,
  QUESTIONS,
  UPLOAD_EXTRA,
  type Phase,
  type SourceDoc,
} from "./setup-data";
import {
  AiGradientDefs,
  AiMessage,
  PrimaryButton,
  QuillMark,
  ReceiptLine,
  SecondaryButton,
  SetupRail,
  ThinkingMessage,
  TopBar,
  UserBubble,
  type RailStep,
} from "./setup-parts";

type QuestionOutcome = { kind: "answered"; text: string } | { kind: "skipped" };

const SOURCES_SCAN_MS = 2600;

// Exit targets — closest existing workspace routes (see WIRING note above).
const WORKSPACE_HUB = "/pursuit/opp-1";
const RESPOND_EDITOR = "/pursuit/opp-1/respond";

export default function ConversationalSetup() {
  const router = useRouter();
  const [phase, setPhase] = useState<Phase>("name");
  const [name, setName] = useState(ENGAGEMENT.defaultName);
  const [project, setProject] = useState(ENGAGEMENT.defaultProject);
  const [projectOpen, setProjectOpen] = useState(false);
  const [sources, setSources] = useState<SourceDoc[]>(INITIAL_SOURCES);
  const [uncheckedIds, setUncheckedIds] = useState<Set<string>>(new Set());
  const [noteEditingId, setNoteEditingId] = useState<string | null>(null);
  const [noteDraft, setNoteDraft] = useState("");
  const [uploadMenuOpen, setUploadMenuOpen] = useState(false);
  const [checklistCollapsed, setChecklistCollapsed] = useState(false);
  const [questionIndex, setQuestionIndex] = useState(0);
  const [outcomes, setOutcomes] = useState<Record<string, QuestionOutcome>>({});
  const [answerDraft, setAnswerDraft] = useState("");
  const [draftChoice, setDraftChoice] = useState<"ai" | "self" | null>(null);
  // While set, the AI message for `phase` is still being "composed": show the
  // ThinkingMessage placeholder instead of that step's content for a beat.
  const [composing, setComposing] = useState<{ phase: Phase; label: string } | null>(null);

  const threadEndRef = useRef<HTMLDivElement>(null);
  const phaseIdx = PHASE_ORDER.indexOf(phase);
  const reached = useCallback(
    (p: Phase) => phaseIdx >= PHASE_ORDER.indexOf(p),
    [phaseIdx],
  );

  /* Sources scan timer */
  useEffect(() => {
    if (phase !== "sources-loading") return;
    const t = setTimeout(() => setPhase("sources-review"), SOURCES_SCAN_MS);
    return () => clearTimeout(t);
  }, [phase]);

  /* Clear the composing placeholder after its beat */
  useEffect(() => {
    if (!composing) return;
    const t = setTimeout(
      () => setComposing((c) => (c?.phase === composing.phase ? null : c)),
      950,
    );
    return () => clearTimeout(t);
  }, [composing]);

  /* Keep the newest message in view */
  useEffect(() => {
    threadEndRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [phase, questionIndex, composing, Object.keys(outcomes).length]);

  /* Advance to the next phase, but hold on a composing placeholder first. */
  const think = (next: Phase, label: string) => {
    setPhase(next);
    setComposing({ phase: next, label });
  };

  /* Once the closing message shows, open the workspace (message reads
     "opening your workspace…", so hold briefly before routing). */
  useEffect(() => {
    if (phase !== "done" || !draftChoice) return;
    const q = new URLSearchParams({
      mode: draftChoice,
      name,
    }).toString();
    const t = setTimeout(() => router.push(`${RESPOND_EDITOR}?${q}`), 1300);
    return () => clearTimeout(t);
  }, [phase, draftChoice, name, router]);

  const usedSources = sources.filter((s) => !uncheckedIds.has(s.id));

  const requirements = useMemo(() => {
    return INITIAL_REQUIREMENTS.map((req) => {
      const question = QUESTIONS.find((q) => q.requirementId === req.id);
      if (!question) return req;
      const outcome = outcomes[question.id];
      if (outcome?.kind === "answered") {
        const short = outcome.text.trim().split(/[.\n]/)[0].slice(0, 32);
        return { ...req, covered: true, source: short || question.answeredSource };
      }
      return req;
    });
  }, [outcomes]);

  const coveredCount = requirements.filter((r) => r.covered).length;
  const skippedCount = QUESTIONS.filter(
    (q) => q.requirementId && outcomes[q.id]?.kind === "skipped",
  ).length;

  /* ------------------------------- Rewind (Edit) ------------------------------- */

  const rewindTo = (target: Phase) => {
    setPhase(target);
    setComposing(null);
    if (PHASE_ORDER.indexOf(target) <= PHASE_ORDER.indexOf("requirements")) {
      setQuestionIndex(0);
      setOutcomes({});
      setAnswerDraft("");
      setDraftChoice(null);
    }
    if (PHASE_ORDER.indexOf(target) <= PHASE_ORDER.indexOf("sources-review")) {
      setUploadMenuOpen(false);
      setNoteEditingId(null);
    }
  };

  /* --------------------------------- Question flow --------------------------------- */

  const commitQuestion = (outcome: QuestionOutcome) => {
    const q = QUESTIONS[questionIndex];
    setOutcomes((prev) => ({ ...prev, [q.id]: outcome }));
    setAnswerDraft("");
    if (questionIndex < QUESTIONS.length - 1) {
      setQuestionIndex(questionIndex + 1);
    } else {
      think("wrapup", "Pulling everything together…");
    }
  };

  /* ------------------------------------ Rail ------------------------------------ */

  const railSteps: RailStep[] = [
    {
      label: "Name",
      sublabel: reached("project") ? name : undefined,
      state: reached("project") ? "done" : "active",
    },
    {
      label: "Project",
      sublabel: reached("sources-loading") ? project : undefined,
      state: reached("sources-loading") ? "done" : phase === "project" ? "active" : "upcoming",
    },
    {
      label: "Sources",
      sublabel: reached("requirements") ? `Using ${usedSources.length} documents` : undefined,
      state: reached("requirements")
        ? "done"
        : phase === "sources-loading" || phase === "sources-review"
          ? "active"
          : "upcoming",
    },
    {
      label: "Requirements",
      sublabel: reached("wrapup")
        ? skippedCount > 0
          ? `${skippedCount} skipped`
          : "All answered"
        : undefined,
      state: reached("wrapup") ? "done" : phase === "requirements" ? "active" : "upcoming",
    },
    {
      label: "Draft or write",
      state: phase === "done" ? "done" : phase === "wrapup" ? "active" : "upcoming",
    },
  ];

  /* ------------------------------------ Render ------------------------------------ */

  return (
    <div className="min-h-screen bg-[#f7f5f2] font-[Inter,sans-serif]">
      <AiGradientDefs />
      <TopBar
        title={reached("project") ? name : "New proposal"}
        funder={ENGAGEMENT.funder}
        opportunity={ENGAGEMENT.opportunity}
        due={ENGAGEMENT.due}
        onClose={() => router.push(WORKSPACE_HUB)}
      />

      <div className="mx-auto flex max-w-[1100px] items-start gap-12 px-6 pb-24 pt-[68px]">
        {/* Thread */}
        <main className="flex min-w-0 max-w-[720px] flex-1 flex-col gap-7">
          {/* ------------------------------ Step 1 · Name ------------------------------ */}
          <AiMessage eyebrow={COPY.step1Eyebrow}>{COPY.step1Message}</AiMessage>

          {phase === "name" ? (
            <div className="flex flex-col gap-3">
              <div className="flex w-full flex-col gap-2 rounded-xl border border-[rgba(42,42,42,0.08)] bg-white px-4 py-3.5">
                <label htmlFor="proposal-name" className="text-[11.5px] font-semibold text-[#2a2a2a]">
                  Proposal name
                </label>
                <input
                  id="proposal-name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full rounded-[9px] border-[1.5px] border-[#4a6080] bg-white px-3.5 py-2.5 text-[13.5px] text-[#2a2a2a] outline-none"
                />
              </div>
              <div>
                <PrimaryButton
                  onClick={() => think("project", "Thinking…")}
                  disabled={!name.trim()}
                >
                  Keep this name
                </PrimaryButton>
              </div>
            </div>
          ) : (
            <>
              <ReceiptLine
                text={`Step 1 · Named it ${name}`}
                onEdit={() => rewindTo("name")}
              />
              <UserBubble>Keep this name</UserBubble>
            </>
          )}

          {/* ----------------------------- Step 2 · Project ----------------------------- */}
          {reached("project") &&
            (composing?.phase === "project" ? (
              <ThinkingMessage label={composing.label} />
            ) : (
              <>
              <AiMessage eyebrow={COPY.step2Eyebrow}>
                {COPY.step2Message(ENGAGEMENT.defaultProject)}
              </AiMessage>

              {phase === "project" ? (
                <div className="flex flex-col gap-3">
                  <div className="flex w-full flex-col gap-2 rounded-xl border border-[rgba(42,42,42,0.08)] bg-white px-4 py-3.5">
                    <span className="text-[11.5px] font-semibold text-[#2a2a2a]">Project</span>
                    <div className="relative">
                      <button
                        type="button"
                        onClick={() => setProjectOpen((v) => !v)}
                        aria-expanded={projectOpen}
                        className="flex w-full items-center gap-2 rounded-[9px] border-[1.5px] border-[#4a6080] bg-white px-3.5 py-2.5 text-left"
                      >
                        <span className="rounded-md bg-[#f2ede4] px-2 py-[3px] text-[10.5px] font-semibold text-[#738498]">
                          {project}
                        </span>
                        <span className="flex-1" />
                        <ChevronDown size={16} className="text-[#738498]" />
                      </button>
                      {projectOpen && (
                        <div className="absolute left-0 top-[calc(100%+4px)] z-10 w-full rounded-[10px] border border-[rgba(42,42,42,0.12)] bg-white p-1.5 shadow-[0px_10px_30px_0px_rgba(31,36,46,0.18)]">
                          {PROJECT_OPTIONS.map((option) => (
                            <button
                              key={option}
                              type="button"
                              onClick={() => {
                                setProject(option);
                                setProjectOpen(false);
                              }}
                              className={`flex w-full rounded-[7px] px-2.5 py-1.5 text-left text-[12px] font-medium hover:bg-[#f3f6fa] ${
                                option === project ? "text-[#4a6080]" : "text-[#5b6675]"
                              }`}
                            >
                              {option}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                  <div>
                    <PrimaryButton onClick={() => setPhase("sources-loading")}>
                      Continue
                    </PrimaryButton>
                  </div>
                </div>
              ) : (
                <>
                  <ReceiptLine
                    text={`Step 2 · Using ${project}`}
                    onEdit={() => rewindTo("project")}
                  />
                  <UserBubble>Continue</UserBubble>
                </>
              )}
              </>
            ))}

          {/* ----------------------------- Step 3 · Sources ----------------------------- */}
          {phase === "sources-loading" && (
            <div className="flex flex-col gap-3">
              <AiMessage eyebrow={COPY.step3Eyebrow}>{COPY.step3LoadingMessage(name)}</AiMessage>
              <div className="flex w-full flex-col gap-3 rounded-xl border border-[rgba(42,42,42,0.08)] bg-white px-[18px] py-4">
                <div className="flex items-center gap-2">
                  <FileText size={13} className="text-[#738498]" />
                  <span className="text-[12.5px] font-medium text-[#2a2a2a]">
                    BPF-Spay-Waggin-RFP-2026.pdf
                  </span>
                  <span className="rounded-[5px] bg-[#eceef1] px-[7px] py-[3px] text-[9px] font-semibold text-[#5b6675]">
                    From this opportunity
                  </span>
                  <span className="animate-pulse bg-gradient-to-r from-[#4535a0] to-[#0095d4] bg-clip-text text-[11px] text-transparent">
                    Reading · extracting requirements…
                  </span>
                </div>
                <div className="h-px w-full bg-[rgba(42,42,42,0.06)]" />
                <div className="flex items-center gap-2">
                  <FileText size={14} className="text-[#738498]" />
                  <span className="text-[12.5px] font-medium text-[#2a2a2a]">2024 Bissell proposal</span>
                </div>
                <div className="h-[11px] w-[280px] animate-pulse rounded-full bg-[#e8ebee]" />
                <div className="h-[11px] w-[236px] animate-pulse rounded-full bg-[#e8ebee]" />
                <p className="text-[10.5px] text-[#9ea8b8]">Matching more documents from your library…</p>
              </div>
            </div>
          )}

          {(phase === "sources-review" || reached("requirements")) && (
            <>
              <AiMessage eyebrow={COPY.step3Eyebrow}>{COPY.step3Message(sources.length)}</AiMessage>

              {phase === "sources-review" ? (
                <div className="flex flex-col gap-3">
                  <div className="flex w-full flex-col gap-2.5 rounded-xl border border-[rgba(42,42,42,0.08)] bg-white px-4 py-3.5">
                    {sources.map((doc) => {
                      const checked = !uncheckedIds.has(doc.id);
                      const editingNote = noteEditingId === doc.id;
                      return (
                        <div
                          key={doc.id}
                          className={`flex w-full flex-col gap-1.5 rounded-[9px] px-2.5 py-2 ${
                            checked ? "bg-[#faf9f7]" : "opacity-60"
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              role="checkbox"
                              aria-checked={checked}
                              aria-label={`Use ${doc.name}`}
                              onClick={() =>
                                setUncheckedIds((prev) => {
                                  const next = new Set(prev);
                                  if (next.has(doc.id)) next.delete(doc.id);
                                  else next.add(doc.id);
                                  return next;
                                })
                              }
                              className={`flex size-4 items-center justify-center rounded ${
                                checked ? "bg-[#4a6080]" : "border border-[rgba(42,42,42,0.25)] bg-white"
                              }`}
                            >
                              {checked && (
                                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" aria-hidden>
                                  <path d="M5 12.5L10 17L19 7" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
                                </svg>
                              )}
                            </button>
                            <span className="text-[12.5px] font-medium text-[#2a2a2a]">{doc.name}</span>
                            <span className="rounded-[5px] bg-[#eceef1] px-[7px] py-[3px] text-[9px] font-semibold text-[#5b6675]">
                              {doc.tag}
                            </span>
                          </div>
                          <div className="flex items-start gap-1.5">
                            <QuillMark size={11} />
                            <p className="flex-1 text-[11px] leading-[15px] text-[#5b6675]">{doc.plan}</p>
                          </div>
                          {editingNote ? (
                            <div className="flex w-full items-center gap-1.5 rounded-lg border-[1.5px] border-[#4a6080] bg-white px-2.5 py-2">
                              <Pencil size={11} className="shrink-0 text-[#738498]" />
                              <input
                                autoFocus
                                value={noteDraft}
                                onChange={(e) => setNoteDraft(e.target.value)}
                                onKeyDown={(e) => {
                                  if (e.key === "Enter") {
                                    setSources((prev) =>
                                      prev.map((s) =>
                                        s.id === doc.id ? { ...s, note: noteDraft.trim() || null } : s,
                                      ),
                                    );
                                    setNoteEditingId(null);
                                  }
                                  if (e.key === "Escape") setNoteEditingId(null);
                                }}
                                onBlur={() => {
                                  setSources((prev) =>
                                    prev.map((s) =>
                                      s.id === doc.id ? { ...s, note: noteDraft.trim() || null } : s,
                                    ),
                                  );
                                  setNoteEditingId(null);
                                }}
                                placeholder="How should this document be used?"
                                className="w-full bg-transparent text-[11.5px] text-[#2a2a2a] outline-none placeholder:text-[#9ea8b8]"
                              />
                            </div>
                          ) : doc.note ? (
                            <button
                              type="button"
                              onClick={() => {
                                setNoteDraft(doc.note ?? "");
                                setNoteEditingId(doc.id);
                              }}
                              className="flex w-full items-center gap-1.5 rounded-lg border border-[rgba(42,42,42,0.12)] bg-white px-2.5 py-2 text-left"
                            >
                              <Pencil size={11} className="shrink-0 text-[#738498]" />
                              <span className="text-[11.5px] text-[#2a2a2a]">{doc.note}</span>
                            </button>
                          ) : (
                            <button
                              type="button"
                              onClick={() => {
                                setNoteDraft("");
                                setNoteEditingId(doc.id);
                              }}
                              className="flex items-center gap-1 text-[10px] font-medium text-[#9ea8b8] hover:text-[#738498]"
                            >
                              <Pencil size={10} />
                              Add a note
                            </button>
                          )}
                        </div>
                      );
                    })}
                  </div>

                  <div className="relative flex gap-2">
                    <PrimaryButton
                      onClick={() => think("requirements", "Checking the RFP against your sources…")}
                      disabled={usedSources.length === 0}
                    >
                      Looks right
                    </PrimaryButton>
                    <SecondaryButton onClick={() => setUploadMenuOpen((v) => !v)}>
                      Upload more
                    </SecondaryButton>
                    {uploadMenuOpen && (
                      <div className="absolute left-[104px] top-[calc(100%+6px)] z-10 flex w-[186px] flex-col gap-0.5 rounded-[10px] border border-[rgba(42,42,42,0.12)] bg-white px-1.5 py-[7px] shadow-[0px_10px_30px_0px_rgba(31,36,46,0.18)]">
                        <button
                          type="button"
                          onClick={() => {
                            setSources((prev) =>
                              prev.some((s) => s.id === UPLOAD_EXTRA.id) ? prev : [...prev, UPLOAD_EXTRA],
                            );
                            setUploadMenuOpen(false);
                          }}
                          className="flex w-full items-center gap-1 rounded-[7px] px-2.5 py-[7px] text-[12px] font-medium text-[#5b6675] hover:bg-[#f3f6fa]"
                        >
                          <Upload size={13} />
                          Upload from computer
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setSources((prev) =>
                              prev.some((s) => s.id === LIBRARY_EXTRA.id) ? prev : [...prev, LIBRARY_EXTRA],
                            );
                            setUploadMenuOpen(false);
                          }}
                          className="flex w-full items-center gap-2 rounded-[7px] px-2.5 py-[7px] text-[12px] font-medium text-[#5b6675] hover:bg-[#f3f6fa]"
                        >
                          <FolderOpen size={13} />
                          From source library
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <>
                  <ReceiptLine
                    text={`Step 3 · Using ${usedSources.length + 2} sources`}
                    onEdit={() => rewindTo("sources-review")}
                  />
                  <UserBubble>Looks right</UserBubble>
                </>
              )}
            </>
          )}

          {/* -------------------------- Step 4 · Requirements -------------------------- */}
          {reached("requirements") &&
            (composing?.phase === "requirements" ? (
              <ThinkingMessage label={composing.label} />
            ) : (
              <>
              <AiMessage eyebrow={COPY.step4Eyebrow}>{COPY.step4Message}</AiMessage>

              {/* Coverage checklist — live document, stays visible through Q&A */}
              <div className="flex w-full flex-col gap-1.5 rounded-xl border border-[rgba(42,42,42,0.08)] bg-white px-4 py-3.5">
                <div className="flex items-center gap-2">
                  <span className="text-[12px] font-semibold text-[#2a2a2a]">Requirements from the RFP</span>
                  <span className="rounded-md bg-[#e4f0ea] px-[7px] py-[3px] text-[9.5px] font-semibold text-[#2f6e5e]">
                    {coveredCount} of {requirements.length} covered
                  </span>
                  <span className="flex-1" />
                  <button
                    type="button"
                    onClick={() => setChecklistCollapsed((v) => !v)}
                    className="text-[10px] font-medium text-[#4a6080] hover:underline"
                  >
                    {checklistCollapsed ? "Expand" : "Collapse"}
                  </button>
                </div>
                {!checklistCollapsed && (
                  <>
                    {requirements.map((req) => (
                      <div key={req.id} className="flex w-full items-center gap-2 py-[3px]">
                        {req.covered ? (
                          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" aria-hidden>
                            <path d="M5 12.5L10 17L19 7" stroke="#3c5e4c" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
                          </svg>
                        ) : (
                          <TriangleAlert size={12} className="text-[#b98a2b]" />
                        )}
                        <span className="text-[11.5px] text-[#2a2a2a]">{req.label}</span>
                        <span className="flex-1" />
                        <span
                          className={`text-[9.5px] ${req.covered ? "text-[#9ea8b8]" : "text-[#8a6116]"}`}
                        >
                          {req.covered ? req.source : "needs your answer"}
                        </span>
                      </div>
                    ))}
                    <p className="text-[9.5px] leading-[13px] text-[#9ea8b8]">{COPY.step4Footnote}</p>
                  </>
                )}
              </div>

              {/* Q&A thread */}
              {QUESTIONS.map((q, i) => {
                const outcome = outcomes[q.id];
                const isCurrent = phase === "requirements" && i === questionIndex;
                if (!outcome && !isCurrent) return null;
                return (
                  <div key={q.id} className="flex flex-col gap-4">
                    <div className="flex w-full flex-col gap-2 rounded-xl border border-[rgba(42,42,42,0.07)] bg-[#faf9f7] px-3.5 py-3">
                      <p className="text-[9px] font-semibold uppercase tracking-[0.5px] text-[#9ea8b8]">
                        {q.ordinal}
                      </p>
                      <p className="text-[14.5px] font-semibold leading-[21px] text-[#2a2a2a]">
                        {q.question}
                      </p>
                      <div className="flex items-center gap-1.5">
                        <QuillMark size={10} />
                        <p className="text-[10px] text-[#5b6675]">{q.context}</p>
                      </div>

                      {isCurrent && (
                        <>
                          <div className="flex w-full flex-col gap-2 rounded-[10px] border border-[rgba(42,42,42,0.15)] bg-white px-3.5 py-3 focus-within:border-[#4a6080]">
                            <textarea
                              value={answerDraft}
                              onChange={(e) => setAnswerDraft(e.target.value)}
                              placeholder="Type your answer, paste a link, or drop a file…"
                              rows={2}
                              className="w-full resize-none bg-transparent text-[13px] text-[#2a2a2a] outline-none placeholder:text-[#9ea8b8]"
                            />
                            <div className="flex items-center">
                              <span className="flex-1" />
                              <Paperclip size={15} className="text-[#9ea8b8]" />
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <PrimaryButton
                              disabled={!answerDraft.trim()}
                              onClick={() => commitQuestion({ kind: "answered", text: answerDraft.trim() })}
                            >
                              Save &amp; next
                            </PrimaryButton>
                            <SecondaryButton onClick={() => commitQuestion({ kind: "skipped" })}>
                              Skip — draft without it
                            </SecondaryButton>
                          </div>
                        </>
                      )}
                    </div>

                    {outcome &&
                      (outcome.kind === "answered" ? (
                        <UserBubble wide>
                          <span className="flex flex-col items-end gap-2">
                            <span className="w-full">{outcome.text}</span>
                            {q.id === "q-outcomes" && (
                              <span className="flex gap-2">
                                <span className="flex items-center gap-1 rounded-lg border border-[rgba(42,42,42,0.1)] bg-white px-2 py-1.5 text-[10.5px] font-medium text-[#4a6080]">
                                  <Link2 size={11} />
                                  whiskerhaven.org/2025-impact
                                </span>
                              </span>
                            )}
                          </span>
                        </UserBubble>
                      ) : (
                        <UserBubble wide>
                          <span className="text-[12px] font-medium text-[#5b6675]">
                            Skip — draft without it
                          </span>
                        </UserBubble>
                      ))}
                  </div>
                );
              })}
              </>
            ))}

          {/* ------------------------- Step 4 recap + Step 5 ------------------------- */}
          {reached("wrapup") &&
            (composing?.phase === "wrapup" ? (
              <ThinkingMessage label={composing.label} />
            ) : (
              <>
              <AiMessage eyebrow={COPY.step4Eyebrow}>
                {outcomes["q-context"]?.kind === "answered"
                  ? COPY.step4Recap(skippedCount)
                  : "Got it. I'll draft with what we have and mark anything that still needs you."}
              </AiMessage>
              <ReceiptLine
                text={
                  skippedCount > 0
                    ? `Step 4 · ${skippedCount} requirement${skippedCount > 1 ? "s" : ""} skipped`
                    : "Step 4 · All questions answered"
                }
                onEdit={() => rewindTo("requirements")}
              />

              <AiMessage eyebrow={COPY.step5Eyebrow}>
                {COPY.step5Message(usedSources.length + 2, requirements.length)}
              </AiMessage>

              <div className="flex w-full gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setDraftChoice("ai");
                    setPhase("done");
                  }}
                  className={`flex w-[246px] items-center gap-2 rounded-[10px] border border-[#4535a0] bg-gradient-to-r from-[rgba(69,53,160,0.07)] to-[rgba(0,149,212,0.07)] px-3.5 py-[11px] text-left transition-shadow hover:shadow-sm ${
                    draftChoice === "ai" ? "ring-2 ring-[#4535a0]/30" : ""
                  }`}
                >
                  <QuillMark size={13} />
                  <span className="flex flex-col gap-px leading-none">
                    <span className="text-[13px] font-semibold text-[#6b4f8a]">Draft it for me</span>
                    <span className="text-[10.5px] text-[#4d6585]">First pass using AI from your sources</span>
                  </span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setDraftChoice("self");
                    setPhase("done");
                  }}
                  className={`flex w-[253px] items-center rounded-[10px] border border-[rgba(42,42,42,0.12)] bg-white px-3.5 py-[11px] text-left transition-shadow hover:shadow-sm ${
                    draftChoice === "self" ? "ring-2 ring-[#4a6080]/30" : ""
                  }`}
                >
                  <span className="flex flex-col gap-px leading-none">
                    <span className="text-[13px] font-semibold text-[#2a2a2a]">I&apos;ll write it myself</span>
                    <span className="text-[10.5px] text-[#9ea8b8]">
                      Empty outline. Draft any section with AI later.
                    </span>
                  </span>
                </button>
              </div>
              </>
            ))}

          {phase === "done" && (
            <>
              <UserBubble>{draftChoice === "ai" ? "Draft it for me" : "I'll write it myself"}</UserBubble>
              <AiMessage eyebrow="SETUP COMPLETE">
                {draftChoice === "ai"
                  ? "On it. Drafting your first pass from 6 sources, opening your workspace…"
                  : "Opening your workspace with an empty outline. Draft any section with AI whenever you want."}
              </AiMessage>
            </>
          )}

          <div ref={threadEndRef} />
        </main>

        <SetupRail steps={railSteps} />
      </div>
    </div>
  );
}
