"use client"

import * as React from "react"
import { useRouter } from "next/navigation"

import { Dialog } from "@/components/ui/dialog"
import { RespondWizard, type CreateParams } from "./respond-wizard"

interface WizardCtx {
  /** Open the 3-step creation wizard for a PipelineOpportunity (defaults to the demo opp-1). */
  openWizard: (opportunityId?: string) => void
}

const Ctx = React.createContext<WizardCtx>({ openWizard: () => {} })

export function useRespondWizard() {
  return React.useContext(Ctx)
}

/**
 * WizardProvider mounts once in the (app) layout so every entry point
 * (pursuit write CTA, Home "Start new application", Tracker drawer CTA) can
 * open the same creation wizard, which then routes to the editor at
 * /pursuit/[id]/respond. Wizard state is intentionally not persisted — each
 * open remounts RespondWizard fresh.
 */
export function WizardProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const [open, setOpen] = React.useState(false)
  const [opportunityId, setOpportunityId] = React.useState("opp-1")

  const openWizard = React.useCallback((id = "opp-1") => {
    setOpportunityId(id)
    setOpen(true)
  }, [])

  const handleCreate = React.useCallback(
    (params: CreateParams) => {
      setOpen(false)
      const q = new URLSearchParams({
        mode: params.mode,
        wmode: params.wmode,
        name: params.name,
        gapsC3: String(params.gapsC3),
        gapsBoard: String(params.gapsBoard),
      }).toString()
      router.push(`/pursuit/${opportunityId}/respond?${q}`)
    },
    [opportunityId, router]
  )

  return (
    <Ctx.Provider value={{ openWizard }}>
      {children}
      <Dialog open={open} onOpenChange={setOpen}>
        {open && (
          <RespondWizard onClose={() => setOpen(false)} onCreate={handleCreate} />
        )}
      </Dialog>
    </Ctx.Provider>
  )
}
