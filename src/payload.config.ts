import { payloadCloudPlugin } from '@payloadcms/payload-cloud'
import { vercelBlobStorage } from '@payloadcms/storage-vercel-blob'
import { postgresAdapter } from '@payloadcms/db-postgres'
import { fileURLToPath } from 'url'
import { lexicalEditor } from '@payloadcms/richtext-lexical'
import { buildConfig } from 'payload'

import sharp from 'sharp'
import path from 'node:path'

import { Admins } from '@/collections/Admins'
import { Users } from '@/collections/Users'
import { Media } from '@/collections/Media'
import { Organizations } from '@/collections/Organizations'
import { OrganizationMemberships } from '@/collections/OrganizationMemberships'
import { Subscriptions } from '@/collections/Subscriptions'
import { SubscriptionItems } from '@/collections/SubscriptionItems'
import { PaymentAttempts } from '@/collections/PaymentAttempts'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

export default buildConfig({
  admin: {
    user: Admins.slug,
    importMap: {
      baseDir: path.resolve(dirname),
    },
  },
  collections: [
    Admins,
    Users,
    Media,
    Organizations,
    OrganizationMemberships,
    Subscriptions,
    SubscriptionItems,
    PaymentAttempts,
  ],
  editor: lexicalEditor(),
  secret: process.env.PAYLOAD_SECRET || '',
  typescript: {
    outputFile: path.resolve(dirname, 'payload-types.ts'),
  },
  db: postgresAdapter({
    pool: {
      connectionString: process.env.DATABASE_URI || '',
    },
  }),
  sharp,
  plugins: [
    payloadCloudPlugin(),
    vercelBlobStorage({
      enabled: true,
      collections: {
        media: true,
      },
      token: process.env.BLOB_READ_WRITE_TOKEN || '',
    }),
  ],
})
