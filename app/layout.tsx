import type { Metadata } from "next"
import { Inter, Lora } from "next/font/google"
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
      <head>
        <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..24,400,0,0" />
      </head>
      <body className={`${inter.variable} ${lora.variable} font-sans antialiased`}>
        {children}
      </body>
    </html>
  )
}
