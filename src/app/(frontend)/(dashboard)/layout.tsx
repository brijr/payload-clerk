import { AppNav } from '@/components/app/nav'

import { redirect } from 'next/navigation'
import { auth } from '@clerk/nextjs/server'

export const dynamic = 'force-dynamic'

type AuthLayoutProps = {
  children: React.ReactNode
}

export default async function AuthLayout({ children }: AuthLayoutProps) {
  const { isAuthenticated } = await auth()

  if (!isAuthenticated) {
    redirect('/')
  }

  return (
    <main className="flex flex-col min-h-screen">
      <AppNav />
      <section className="flex-1">{children}</section>
    </main>
  )
}
