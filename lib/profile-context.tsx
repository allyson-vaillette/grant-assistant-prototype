"use client"

import React, { createContext, useContext, useState, useEffect } from "react"

const SESSION_KEY = "ga_profile_complete"

export function writeProfileComplete(v: boolean) {
  if (typeof window !== "undefined") {
    sessionStorage.setItem(SESSION_KEY, String(v))
  }
}

interface ProfileContextValue {
  isProfileComplete: boolean
  setProfileComplete: (v: boolean) => void
  isBannerDismissed: boolean
  dismissBanner: () => void
}

const ProfileContext = createContext<ProfileContextValue | null>(null)

export function ProfileProvider({ children }: { children: React.ReactNode }) {
  const [isProfileComplete, setIsProfileComplete] = useState(true)
  const [isBannerDismissed, setIsBannerDismissed] = useState(false)

  useEffect(() => {
    const stored = sessionStorage.getItem(SESSION_KEY)
    if (stored === "false") setIsProfileComplete(false)
  }, [])

  function setProfileComplete(v: boolean) {
    setIsProfileComplete(v)
    sessionStorage.setItem(SESSION_KEY, String(v))
  }

  return (
    <ProfileContext.Provider
      value={{
        isProfileComplete,
        setProfileComplete,
        isBannerDismissed,
        dismissBanner: () => setIsBannerDismissed(true),
      }}
    >
      {children}
    </ProfileContext.Provider>
  )
}

export function useProfile() {
  const ctx = useContext(ProfileContext)
  if (!ctx) throw new Error("useProfile must be used within ProfileProvider")
  return ctx
}
