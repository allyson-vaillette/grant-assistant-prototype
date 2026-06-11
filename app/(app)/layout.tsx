"use client"
import { usePathname } from "next/navigation"
import { Sidebar } from "@/components/layout/sidebar"
import { ScopeProvider } from "@/lib/scope-context"
import { ProfileProvider } from "@/lib/profile-context"

export default function AppLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname()
  const isWriting = pathname?.startsWith("/pursuit/")

  return (
    <ProfileProvider>
      <ScopeProvider>
        <div className="flex" style={{ height: "100vh", overflow: "hidden" }}>
          {!isWriting && <Sidebar />}
          <main
            className="flex-1 flex flex-col"
            style={{ overflow: "hidden", minHeight: 0, backgroundColor: "var(--canvas)" }}
          >
            {children}
          </main>
        </div>
      </ScopeProvider>
    </ProfileProvider>
  )
}
