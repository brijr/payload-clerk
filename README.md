# Payload and Clerk App Starter

A modern, open-source SaaS starter kit built with Next.js 15 and Payload CMS, designed to accelerate your SaaS development.

![Payload SaaS Starter](https://payloadstarter.dev/opengraph-image.jpg)

> Don't want to use Clerk? just use the [Payload Starter](https://github.com/brijr/payload-starter)

## What's Included

This starter provides a complete foundation for building SaaS applications:

- ✅ **Full Clerk Integration** - Authentication, organizations, and billing webhooks
- ✅ **Dual User System** - Separate admin accounts for CMS, Clerk users for your app
- ✅ **Complete Webhook Sync** - Real-time data synchronization between Clerk and Payload
- ✅ **Billing Ready** - Subscription, payment tracking, and failure handling
- ✅ **Organization Support** - Multi-tenancy with role-based memberships
- ✅ **Type Safety** - End-to-end TypeScript with auto-generated types
- ✅ **Production Ready** - Docker support, security headers, and Vercel deployment

## Features

- **Authentication System**
  - Frontend authentication powered by Clerk
  - Drop-in sign-in, sign-up, and password reset experiences
  - Automatic session management and middleware protections
  - Redirect handling for authenticated and unauthenticated routes
  - Full organization support with role-based memberships
  - Automatic user, organization, and membership sync via webhooks
  - Complete Clerk Billing integration with subscription and payment tracking
  - Dual user system: separate admin accounts for CMS access

- **Modern Tech Stack**
  - Next.js 15+ with App Router
  - Payload CMS 3+ for content management
  - TypeScript 5+ for type safety
  - PostgreSQL database with Payload adapter
  - Tailwind 4+ for styling
  - shadcn/ui components
  - Dark/light mode with theme persistence
  - Resend for transactional emails
  - Vercel Blob Storage (or S3/R2)

- **Developer Experience**
  - Clean project structure with dual user system (Admins for CMS, Users for app)
  - Server components and actions
  - Reusable design system components
  - Type-safe APIs with auto-generated types
  - Cross-platform support with cross-env
  - Built-in security headers
  - Docker support included
  - Vercel deployment ready
  - Comprehensive webhook integration for real-time data sync
  - Organized admin UI with collection grouping

## Getting Started

### Prerequisites

- Node.js v18.20.2+ or v20.9.0+ and pnpm
- PostgreSQL database
- Blob Storage (Vercel Blob or S3/R2)
- Clerk account for authentication and optional billing
- Resend account for email functionality (optional but recommended)

### Installation

1. Clone the repository:

   ```bash
   git clone https://github.com/brijr/payload-starter.git
   cd payload-starter
   ```

2. Install dependencies:

   ```bash
   pnpm install
   ```

3. Set up environment variables:

   ```bash
   cp .env.example .env
   ```

   Edit the `.env` file with your database credentials and other settings. See the [Environment Variables](#environment-variables) section for details.

4. Start the development server:

   ```bash
   pnpm dev
   ```

5. Visit `http://localhost:3000` to see your application.

6. **Set up Clerk Webhooks** (Required for user sync):
   - Go to your Clerk Dashboard > Webhooks
   - Add endpoint: `https://your-domain.com/api/webhooks/clerk` (or use ngrok for local testing)
   - Select all user, organization, and billing events
   - Copy the signing secret to `CLERK_WEBHOOK_SECRET` in your `.env`

7. **Create a Payload Admin** (for CMS access):
   ```bash
   pnpm payload create-user
   ```
   Use this account to access `/admin` - it's separate from Clerk users.

## Available Scripts

```bash
# Development
pnpm dev              # Start development server
pnpm devsafe          # Start dev server (clears .next cache first)

# Production
pnpm build            # Build for production
pnpm start            # Start production server

# Code Quality
pnpm lint             # Run ESLint

# Payload CMS
pnpm payload          # Access Payload CLI
pnpm generate:types   # Generate TypeScript types
pnpm generate:importmap # Generate import map
```

## Project Structure

```
/src
  /app                 # Next.js App Router
    /(frontend)        # Frontend routes
      /(site)          # Public site routes
      /dashboard       # Protected dashboard routes (Clerk auth)
    /(payload)         # Payload CMS routes
    /api               # API routes
      /webhooks        # Webhook endpoints
        /clerk         # Clerk webhook handler (user, org, billing sync)
  /collections         # Payload collections (grouped in admin UI)
    # Admin Group
    Admins.ts          # CMS admin users (Payload auth)

    # Users Group
    Users.ts           # Clerk-synced app users
    Organizations.ts   # Clerk organizations
    OrganizationMemberships.ts # User-org relationships

    # Billing Group
    Subscriptions.ts   # Billing subscriptions
    SubscriptionItems.ts # Subscription line items
    PaymentAttempts.ts # Payment records

    # Content
    Media.ts           # File uploads

  /components          # React components
    /app               # App-specific components
    /auth              # Authentication components
    /site              # Site components
    /theme             # Theme components
    /ui                # Shadcn UI components
    ds.tsx             # Design system exports
  /lib                 # Utility functions
  /public              # Static assets
  middleware.ts        # Clerk route protection
  payload.config.ts    # Payload configuration
```

## Environment Variables

Create a `.env` file in the root directory with the following variables:

### Required Variables

```bash
# Database
DATABASE_URI=postgres://user:password@localhost:5432/dbname

# Payload
PAYLOAD_SECRET=your-secret-key-here
APP_URL=http://localhost:3000  # Your app URL (production URL in deployment)

# Clerk Authentication
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_xxxxx
CLERK_SECRET_KEY=sk_test_xxxxx
CLERK_WEBHOOK_SECRET=whsec_xxxxx  # Get from Clerk Dashboard > Webhooks

# Email (Resend)
RESEND_API_KEY=re_xxxxxxxxxxxxxxxx  # Get from resend.com
EMAIL_FROM=noreply@yourdomain.com

# Storage
BLOB_READ_WRITE_TOKEN=vercel_blob_xxxxxx  # From Vercel dashboard
```

### Optional Variables (for S3/R2 storage)

```bash
# Cloudflare R2 or AWS S3
R2_ACCESS_KEY_ID=your-access-key
R2_SECRET_ACCESS_KEY=your-secret-key
R2_BUCKET=your-bucket-name
R2_ENDPOINT=https://your-endpoint.r2.cloudflarestorage.com
```

## User Management System

This project uses a **dual user system** for maximum flexibility:

### 1. Admins Collection (Payload CMS Access)
- Used for accessing the Payload admin dashboard at `/admin`
- Authenticated via Payload's built-in auth system
- Create admin users via:
  - The Payload dashboard itself
  - CLI: `pnpm payload create-user`
- These users manage content and system configuration

### 2. Users Collection (Frontend App Users)
- Synchronized from Clerk automatically
- Authenticated via Clerk for frontend routes
- Includes full profile data (name, image, email verification)
- Supports organization memberships and roles
- Cannot access Payload admin dashboard

## Clerk Webhook Setup

To enable automatic user and organization synchronization:

1. **Configure Webhook in Clerk Dashboard**:
   - Go to **Webhooks** in your Clerk Dashboard
   - Click **Add Endpoint**
   - Set the URL to: `https://yourdomain.com/api/webhooks/clerk`
   - Select these events:
     - **User Events**: `user.created`, `user.updated`, `user.deleted`
     - **Organization Events**: `organization.created`, `organization.updated`, `organization.deleted`
     - **Membership Events**: `organizationMembership.created`, `organizationMembership.updated`, `organizationMembership.deleted`
     - **Billing Events**: `subscription.*`, `subscriptionItem.*`, `paymentAttempt.*`

2. **Add Webhook Secret to Environment**:
   ```bash
   CLERK_WEBHOOK_SECRET=whsec_xxxxxxxxxxxxx
   ```

3. **What Gets Synced**:
   - **Users**: Email, name, profile image, verification status
   - **Organizations**: Name, slug, logo, metadata, member limits
   - **Memberships**: User-organization relationships with roles (admin, member, billing, developer, viewer)
   - **Subscriptions**: Billing plans, status, trial periods, cancellation info
   - **Subscription Items**: Plan details, quantities, pricing
   - **Payment Attempts**: Payment records, success/failure status, amounts

## Organization Support

The system fully supports Clerk organizations:

- Organizations are automatically synced to Payload
- User memberships are tracked with role assignments
- When organizations are deleted, all memberships are cleaned up
- Organization creators are linked in Payload
- Support for organization metadata (public and private)

## Clerk Billing Integration

The system includes full support for Clerk Billing webhooks:

### Billing Collections
- **Subscriptions**: Tracks active subscriptions for users and organizations
- **Subscription Items**: Individual line items within subscriptions
- **Payment Attempts**: Complete payment history with success/failure tracking

### Supported Billing Events
- **Subscription Events**: `created`, `updated`, `active`, `past_due`
- **Subscription Item Events**: `created`, `updated`, `active`, `canceled`, `ended`
- **Payment Events**: `created`, `updated` with full status tracking

### Features
- Automatic linking of subscriptions to users or organizations
- Payment failure tracking with reasons and error codes
- Trial period management
- Subscription cancellation tracking
- Full metadata support for custom billing data

## Email Configuration

This starter uses [Resend](https://resend.com) for transactional emails. To set up:

1. Create a free account at [resend.com](https://resend.com)
2. Verify your domain or use their test domain
3. Generate an API key
4. Add the API key to your `.env` file

Email features include:

- Welcome emails on registration
- Email verification links
- Password reset emails
- Customizable email templates in `/src/lib/email.ts`

## Key Components

### Authentication & User Management

- `middleware.ts` - Clerk middleware protecting `/dashboard/*` routes
- `app/(frontend)/layout.tsx` - Wraps the frontend with `ClerkProvider`
- `app/api/webhooks/clerk/route.ts` - Comprehensive webhook handler for:
  - User synchronization (create, update, delete)
  - Organization management
  - Membership tracking
  - Billing events (subscriptions, payments)
- `collections/Admins.ts` - Payload admin users with built-in authentication
- `collections/Users.ts` - Clerk-synced frontend users
- `collections/Organizations.ts` - Organization data from Clerk
- `collections/OrganizationMemberships.ts` - User-organization relationships

### Billing System

- `collections/Subscriptions.ts` - Active subscriptions for users/organizations
- `collections/SubscriptionItems.ts` - Individual subscription line items
- `collections/PaymentAttempts.ts` - Payment history and status tracking

### Design System

- All UI components are in `/src/components/ui/`
- Import common components from `/src/components/ds.tsx`
- Consistent theming with CSS variables
- Full dark mode support

## Security Features

- **Authentication**: HTTP-only cookies, secure flag in production
- **Headers**: Security headers configured in `next.config.mjs`
- **CSRF**: Built-in protection via Payload
- **Input Validation**: Zod schemas for all forms
- **Password Security**: Strength requirements, bcrypt hashing
- **Rate Limiting**: Built into Payload auth endpoints

## Deployment

This project is ready to deploy on Vercel:

1. Push your code to a GitHub repository
2. Connect the repository to Vercel
3. Configure all required environment variables
4. Deploy!

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments

- [Payload CMS](https://payloadcms.com)
- [Next.js](https://nextjs.org)
- [Shadcn UI](https://ui.shadcn.com)
- [Tailwind CSS](https://tailwindcss.com)

---

Created by [brijr](https://github.com/brijr)
