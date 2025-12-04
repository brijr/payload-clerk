import { AppNav } from '@/components/app/nav'

import { redirect } from 'next/navigation'
import { auth } from '@clerk/nextjs/server'

export const dynamic = 'force-dynamic'

type AuthLayoutProps = {
  children: React.ReactNode
}

export default async function AuthLayout({ children }: AuthLayoutProps) {
  const { userId, orgId } = await auth()

  if (!userId) {
    redirect('/')
  }

  // Use orgId (or visitorId for personal account) as key to force remount
  // when organization changes. This resets all client component state.
  const contextKey = orgId ?? `personal-${userId}`

  return (
    <main className="flex flex-col min-h-screen">
      <AppNav />
      {/*
        Key prop pattern: When orgId changes, React unmounts and remounts
        all children, clearing any stale state from the previous organization.
        This prevents data from Org A persisting when switching to Org B.
      */}
      <section key={contextKey} className="flex-1">
        {children}
      </section>
    </main>
  )
}
