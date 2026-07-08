"use client"

import { Suspense } from "react"

import { RespondEditor } from "@/components/respond/respond-editor"

/**
 * /pursuit/[id]/respond — the Respond writing surface (Model 4 editor).
 * Reached from the creation wizard. Added alongside the existing artifact
 * editor, not in place of it. useSearchParams (read inside RespondEditor)
 * requires a Suspense boundary for static generation.
 */
export default function RespondPage() {
  return (
    <Suspense fallback={null}>
      <RespondEditor />
    </Suspense>
  )
}
