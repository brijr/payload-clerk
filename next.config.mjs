import { withPayload } from '@payloadcms/next/withPayload'

/**
 * Environment variable validation
 * Throws build error if required Clerk variables are missing in production
 */
const requiredEnvVars = [
  'CLERK_WEBHOOK_SECRET',
  'NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY',
  'CLERK_SECRET_KEY',
]

if (process.env.NODE_ENV === 'production' || process.env.npm_lifecycle_event === 'build') {
  const missingVars = requiredEnvVars.filter((envVar) => !process.env[envVar])

  if (missingVars.length > 0) {
    throw new Error(
      `\n\n❌ Missing required environment variables:\n${missingVars.map((v) => `   - ${v}`).join('\n')}\n\n` +
      `Please set these in your .env file or deployment environment.\n` +
      `See README.md for setup instructions.\n`
    )
  }
}

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Your Next.js config here
  output: 'standalone', // Required for Docker deployment
  
  // Security headers
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=()',
          },
        ],
      },
    ]
  },
}

export default withPayload(nextConfig)
