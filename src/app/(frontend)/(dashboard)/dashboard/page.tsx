import { Section, Container } from '@/components/ds'
import { currentUser } from '@clerk/nextjs/server'
import type { User } from '@clerk/nextjs/server'

export default async function Dashboard() {
  const user = await currentUser()

  return <ToDelete user={user as User} />
}

const ToDelete = ({ user }: { user: User }) => {
  const createdAt = new Date(user.createdAt)
  const now = new Date()
  const accountAgeDays = Math.floor((now.getTime() - createdAt.getTime()) / (1000 * 60 * 60 * 24))
  const email =
    user.primaryEmailAddress?.emailAddress ?? user.emailAddresses[0]?.emailAddress ?? 'Unknown'

  return (
    <Section>
      <Container className="font-mono space-y-2">
        <h1 className="mb-4">Payload Starter Dashboard</h1>
        <p>
          &gt; Your email is <span className="text-primary">{email}</span>
        </p>
        <p>
          &gt; Your created your account at{' '}
          <span className="text-primary">{createdAt.toLocaleString()}</span>
        </p>
        <p>
          &gt; Your account is <span className="text-primary">{accountAgeDays}</span> days old
        </p>
      </Container>
    </Section>
  )
}
