import type { Metadata } from "next"
import { Inter, Lora, Inclusive_Sans } from "next/font/google"
import "./globals.css"
import { PasscodeGate } from "@/components/PasscodeGate"

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
})

const lora = Lora({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-lora",
  display: "swap",
})

const inclusiveSans = Inclusive_Sans({
  subsets: ["latin"],
  weight: ["400"],
  variable: "--font-inclusive-sans",
  display: "swap",
})

export const metadata: Metadata = {
  title: "Grant Assistant",
  description: "Discover funding opportunities and draft grant proposals for nonprofits",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.variable} ${lora.variable} ${inclusiveSans.variable} font-sans antialiased`}>
        <PasscodeGate>{children}</PasscodeGate>
      </body>
    </html>
  )
}
