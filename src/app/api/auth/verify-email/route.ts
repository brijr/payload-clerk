import { NextRequest, NextResponse } from 'next/server'
import { getPayload } from 'payload'
import configPromise from '@payload-config'
import { sendEmail, welcomeEmailTemplate } from '@/lib/email'

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const token = searchParams.get('token')
  const email = searchParams.get('email')
  const signInDestination = getSignInUrl(request)

  if (!token || !email) {
    return NextResponse.redirect(signInDestination)
  }

  try {
    const payload = await getPayload({ config: await configPromise })

    // Find user with matching email and token
    const users = await payload.find({
      collection: 'users',
      where: {
        and: [
          { email: { equals: email } },
          { emailVerificationToken: { equals: token } },
          { emailVerificationExpires: { greater_than: new Date().toISOString() } },
        ],
      },
    })

    if (users.docs.length === 0) {
      return NextResponse.redirect(signInDestination)
    }

    const user = users.docs[0]

    // Update user to mark email as verified
    await payload.update({
      collection: 'users',
      id: user.id,
      data: {
        emailVerified: true,
        emailVerificationToken: null,
        emailVerificationExpires: null,
      },
    })

    // Send welcome email
    await sendEmail({
      to: email,
      subject: 'Welcome! Your email has been verified',
      html: welcomeEmailTemplate(email),
    })

    // Redirect to Clerk sign-in page
    return NextResponse.redirect(signInDestination)
  } catch (error) {
    console.error('Email verification error:', error)
    return NextResponse.redirect(signInDestination)
  }
}

function getSignInUrl(request: NextRequest) {
  const signInUrl = process.env.NEXT_PUBLIC_CLERK_SIGN_IN_URL || '/sign-in'

  if (signInUrl.startsWith('http')) {
    return signInUrl
  }

  return new URL(signInUrl, request.url).toString()
}