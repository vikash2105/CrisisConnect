import { GeistSans } from "geist/font/sans"
import { GeistMono } from "geist/font/mono"
import { Analytics } from "@vercel/analytics/next"
import "./globals.css"

// Page metadata
export const metadata = {
  title: "CrisisConnect",
  description: "Connect. Respond. Save.",
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className={`font-sans ${GeistSans.variable} ${GeistMono.variable}`}>
        {/* The Header component has been REMOVED from this file. */}
        {children}
        <Analytics />
      </body>
    </html>
  )
}
