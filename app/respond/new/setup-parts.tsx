"use client";

// Shared primitives for the Respond conversational creation flow.
// Figma: GA 2.0 Final Specs > 1c · Creation as conversation (node 1388-3)
//
// TOKEN MAPPING (kept as arbitrary Tailwind hexes for prototype fidelity; map
// to the repo's semantic tokens when this graduates out of research):
//   #f7f5f2  page surface        → --canvas / --surface-canvas  (also .respond-scope --cream)
//   #4a6080  accent / CTA        → --slate-primary               (also .respond-scope --slate)
//   #ece7dd  user bubble         → no exact global token yet; nearest warm sand.
//                                   Suggest adding --user-bubble (or reuse a .respond-scope tone).
//   #3c5e4c  done-green          → --evergreen                   (also .respond-scope --pine)
//   #4535a0 → #0095d4  AI grad   → --ai-a → --ai-b               (sparkle gradient endpoints)
// Neutrals (#2a2a2a ink, #738498/#9ea8b8 muted, #e8ebee/#eceef1 hairlines) track
// --ink-*, --hair* families — left literal here to match the Figma exactly.

import { Check, X } from "lucide-react";
import type { ReactNode } from "react";

/* ---------------------------------- Quill mark --------------------------------- */
// The AI mark — the real quill exported from Figma (node 1414:1259), inlined so
// it can reference the shared #ga-ai-grad gradient and scale at every call size
// (10–18px). The gradient lives in AiGradientDefs (rendered once per screen);
// the sparkle is a flat #364DAD fill straight from the asset.

export function AiGradientDefs() {
  return (
    <svg aria-hidden width={0} height={0} className="absolute">
      <defs>
        {/* Top→bottom to match the exported quill gradient; objectBoundingBox so
            it scales with the mark at any size. */}
        <linearGradient id="ga-ai-grad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#4535a0" />
          <stop offset="1" stopColor="#0095d4" />
        </linearGradient>
      </defs>
    </svg>
  );
}

export function QuillMark({ size = 18 }: { size?: number }) {
  // Natural artboard is 18×21; keep that ratio, driving width by `size` (as the
  // lucide stand-in did) and letting height follow.
  return (
    <svg
      aria-hidden
      width={size}
      height={(size * 21) / 18}
      viewBox="0 0 18 21"
      fill="none"
      className="shrink-0"
    >
      <path
        d="M15.0211 3.2959L14.2605 5.57758L12.1689 6.14801L14.3239 6.78181L15.0211 8.87335L15.9084 6.78181L17.9999 6.14801L15.845 5.5142L15.0211 3.2959Z"
        fill="#364DAD"
      />
      <path
        d="M2.24224 15.286C1.90069 16.4852 0.57752 19.3028 0 20.4718H0.508563C0.935238 20.3823 2.72494 16.455 3.54919 14.8367C3.94782 14.5371 5.14064 14.3571 5.93568 13.0083C5.65123 13.0083 4.71384 12.8283 4.97027 12.1398C5.45298 12.2292 7.01644 12.4394 7.98184 11.0299C7.44311 11.1 6.19757 11.0785 5.53816 10.431C6.33434 10.1615 9.74356 9.7414 10.3695 7.52284C10.1982 7.61335 8.94839 8.03242 7.66938 7.73301C8.69297 7.37314 10.2833 6.3839 10.9092 5.84527C11.5343 5.30548 12.1032 4.19668 12.4716 2.96733C13.0686 1.85755 14.063 1.10871 15.5974 0C14.6319 0.030169 8.72098 0.689576 4.31632 7.88272C2.81002 10.251 2.66785 13.7872 2.24224 15.286Z"
        fill="url(#ga-ai-grad)"
      />
    </svg>
  );
}

/* ----------------------------------- Top bar ----------------------------------- */

export function TopBar({
  title = "New proposal",
  funder,
  opportunity,
  due,
  onClose,
}: {
  title?: string;
  funder: string;
  opportunity: string;
  due: string;
  onClose?: () => void;
}) {
  return (
    <header className="sticky top-0 z-20 flex h-14 w-full items-center gap-3 border-b border-[rgba(42,42,42,0.08)] bg-white px-5">
      <button
        type="button"
        aria-label="Close and save as draft"
        onClick={onClose}
        className="flex size-[26px] items-center justify-center rounded-md text-[#5b6675] transition-colors hover:bg-[#f3f6fa]"
      >
        <X size={18} strokeWidth={1.8} />
      </button>
      <div className="h-6 w-px bg-[#e8ebee]" />
      <div className="flex flex-col gap-px leading-none">
        <span className="text-[13px] font-semibold text-[#2a2a2a]">{title}</span>
        <span className="text-[10.5px] text-[#738498]">
          {funder} · {opportunity} · {due}
        </span>
      </div>
      <div className="flex-1" />
      <span className="text-[10.5px] text-[#9ea8b8]">Saved as draft</span>
    </header>
  );
}

/* --------------------------------- Message chrome -------------------------------- */

export function AiMessage({
  eyebrow,
  children,
}: {
  eyebrow: string;
  children: ReactNode;
}) {
  return (
    <div className="flex w-full flex-col gap-3">
      <QuillMark />
      <p className="text-[9px] font-semibold uppercase tracking-[0.5px] text-[#9ea8b8]">{eyebrow}</p>
      <div className="text-[14px] leading-[22px] text-[#2a2a2a]">{children}</div>
    </div>
  );
}

// A "composing" placeholder shown in place of an AI message while the next
// step is being prepared — the quill lifts and breathes, the label shimmers on
// the AI gradient (same treatment as the Step 3 scan line).
export function ThinkingMessage({ label = "Thinking…" }: { label?: string }) {
  return (
    <div className="flex animate-fade-in items-center gap-2">
      <span className="animate-quill-bob">
        <QuillMark />
      </span>
      <span className="animate-pulse bg-gradient-to-r from-[#4535a0] to-[#0095d4] bg-clip-text text-[11.5px] font-medium text-transparent">
        {label}
      </span>
    </div>
  );
}

export function ReceiptLine({
  text,
  onEdit,
}: {
  text: string;
  onEdit?: () => void;
}) {
  return (
    <div className="flex items-center gap-1.5 text-[11.5px] text-[#738498]">
      <Check size={12} strokeWidth={2.2} className="text-[#3c5e4c]" />
      <span>{text}</span>
      {onEdit && (
        <>
          <span aria-hidden>·</span>
          <button type="button" onClick={onEdit} className="underline-offset-2 hover:underline">
            Edit
          </button>
        </>
      )}
    </div>
  );
}

export function UserBubble({ children, wide = false }: { children: ReactNode; wide?: boolean }) {
  return (
    <div className="flex w-full justify-end">
      <div
        className={`rounded-[14px] bg-[#ece7dd] px-4 py-3 text-[14px] text-[#2a2a2a] ${
          wide ? "max-w-[440px] text-[13px] leading-[19px]" : ""
        }`}
      >
        {children}
      </div>
    </div>
  );
}

/* ----------------------------------- Buttons ------------------------------------ */

export function PrimaryButton({
  children,
  onClick,
  disabled = false,
}: {
  children: ReactNode;
  onClick?: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`rounded-[9px] px-4 py-2 text-[12px] font-semibold transition-colors ${
        disabled
          ? "cursor-default bg-[#e8ebee] text-[#9ea8b8]"
          : "bg-[#4a6080] text-white hover:bg-[#3e5169]"
      }`}
    >
      {children}
    </button>
  );
}

export function SecondaryButton({
  children,
  onClick,
}: {
  children: ReactNode;
  onClick?: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="rounded-[9px] border border-[rgba(42,42,42,0.15)] bg-white px-3.5 py-2 text-[12px] font-medium text-[#5b6675] transition-colors hover:bg-[#faf9f7]"
    >
      {children}
    </button>
  );
}

/* ------------------------------------- Rail ------------------------------------- */

export interface RailStep {
  label: string;
  sublabel?: string;
  state: "done" | "active" | "upcoming";
}

export function SetupRail({ steps }: { steps: RailStep[] }) {
  return (
    <aside className="sticky top-[124px] flex w-56 flex-col gap-1 rounded-xl border border-[rgba(42,42,42,0.08)] bg-white p-3.5">
      <p className="text-[9.5px] font-semibold uppercase tracking-[0.5px] text-[#9ea8b8]">
        Setup · {steps.length} steps
      </p>
      {steps.map((step, i) => (
        <div
          key={step.label}
          className={`flex w-full items-center gap-2 rounded-[7px] px-1 py-[5px] ${
            step.state === "active" ? "bg-[#f3f6fa]" : ""
          }`}
        >
          {step.state === "done" ? (
            <span className="flex size-[18px] shrink-0 items-center justify-center rounded-full bg-[#3c5e4c]">
              <Check size={10} strokeWidth={3} className="text-white" />
            </span>
          ) : (
            <span
              className={`flex size-[18px] shrink-0 items-center justify-center rounded-full text-[9px] font-semibold ${
                step.state === "active" ? "bg-[#4a6080] text-white" : "bg-[#e8ebee] text-[#9ea8b8]"
              }`}
            >
              {i + 1}
            </span>
          )}
          <span className="flex min-w-0 flex-col leading-tight">
            <span
              className={`truncate text-[11px] ${
                step.state === "active"
                  ? "font-semibold text-[#4a6080]"
                  : step.state === "done"
                    ? "font-medium text-[#2a2a2a]"
                    : "font-medium text-[#9ea8b8]"
              }`}
            >
              {step.label}
            </span>
            {step.sublabel && (
              <span className="truncate text-[9px] text-[#9ea8b8]">{step.sublabel}</span>
            )}
          </span>
        </div>
      ))}
    </aside>
  );
}
