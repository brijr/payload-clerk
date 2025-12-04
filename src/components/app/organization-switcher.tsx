'use client'

import { OrganizationSwitcher } from '@clerk/nextjs'
import { useRouter } from 'next/navigation'

/**
 * Custom OrganizationSwitcher that reloads the page when switching organizations.
 * This ensures no stale data persists from the previous organization context.
 */
export function AppOrganizationSwitcher() {
  const router = useRouter()

  return (
    <OrganizationSwitcher
      afterSelectOrganizationUrl="/dashboard"
      afterSelectPersonalUrl="/dashboard"
      afterLeaveOrganizationUrl="/dashboard"
      afterCreateOrganizationUrl="/dashboard"
      hideSlug
      appearance={{
        elements: {
          rootBox: 'flex items-center',
        },
      }}
      // Reload the page data when organization changes to clear any cached/stale data
      afterSelectOrganization={() => {
        // Use router.refresh() to revalidate all data on the current route
        // This clears React Server Component cache and refetches data
        router.refresh()
      }}
    />
  )
}
