'use client'

import { Button } from '@/components/ui/button'
import { LogOut } from 'lucide-react'
import { SignOutButton } from '@clerk/nextjs'

export const LogoutButton = () => {
  return (
    <SignOutButton redirectUrl="/">
      <Button variant="outline">Logout</Button>
    </SignOutButton>
  )
}

export const LogoutIconButton = () => {
  return (
    <SignOutButton redirectUrl="/">
      <Button variant="outline" size="icon">
        <LogOut />
      </Button>
    </SignOutButton>
  )
}
