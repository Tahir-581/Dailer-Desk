"use client"

import { createAuthClient } from "better-auth/react"

const authClient = createAuthClient({
  baseURL: process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
})

export const auth = authClient

export function Providers({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
