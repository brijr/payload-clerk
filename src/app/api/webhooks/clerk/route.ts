import { headers } from 'next/headers'
import { WebhookEvent } from '@clerk/nextjs/server'
import { Webhook } from 'svix'
import { getPayload } from 'payload'
import config from '@/payload.config'

// Clerk Billing event types (not included in @clerk/nextjs types)
interface ClerkSubscriptionData {
  id: string
  customer: string
  status?: string
  current_period_start?: number
  current_period_end?: number
  trial_start?: number
  trial_end?: number
  cancel_at_period_end?: boolean
  canceled_at?: number
  metadata?: Record<string, unknown>
}

interface ClerkSubscriptionItemData {
  id: string
  subscription: string
  plan?: {
    id: string
    nickname?: string
    name?: string
    amount?: number
    currency?: string
    interval?: string
  } | string
  quantity?: number
  metadata?: Record<string, unknown>
  status?: string
}

interface ClerkPaymentAttemptData {
  id: string
  subscription?: string
  amount?: number
  currency?: string
  status?: string
  failure_reason?: string
  failure_code?: string
  invoice?: string
  charge?: string
  payment_method_type?: string
  created?: number
  metadata?: Record<string, unknown>
}

/**
 * Clerk Webhook Handler
 *
 * Handles user, organization, membership, and billing events from Clerk.
 * Uses local API (bypasses access control) for database operations.
 *
 * Important: Returns 200 for all handled events (including "not found")
 * to prevent unnecessary Svix retries.
 */

/**
 * GET handler for webhook verification.
 * Allows users to verify their webhook URL is configured correctly.
 * Visit this URL in a browser to check the webhook is reachable.
 */
export async function GET() {
  const webhookSecretConfigured = !!process.env.CLERK_WEBHOOK_SECRET

  return Response.json({
    status: 'ok',
    endpoint: '/api/webhooks/clerk',
    webhookSecretConfigured,
    message: webhookSecretConfigured
      ? 'Webhook endpoint is ready. Configure this URL in your Clerk Dashboard under Webhooks.'
      : 'WARNING: CLERK_WEBHOOK_SECRET is not configured. Webhooks will fail.',
    supportedEvents: [
      'user.created',
      'user.updated',
      'user.deleted',
      'organization.created',
      'organization.updated',
      'organization.deleted',
      'organizationMembership.created',
      'organizationMembership.updated',
      'organizationMembership.deleted',
      'subscription.created',
      'subscription.updated',
      'subscription.active',
      'subscription.past_due',
      'subscriptionItem.created',
      'subscriptionItem.updated',
      'subscriptionItem.active',
      'subscriptionItem.canceled',
      'subscriptionItem.upcoming',
      'subscriptionItem.ended',
      'subscriptionItem.abandoned',
      'subscriptionItem.incomplete',
      'subscriptionItem.past_due',
      'paymentAttempt.created',
      'paymentAttempt.updated',
    ],
    timestamp: new Date().toISOString(),
  })
}

// Helper for structured logging
function logWebhook(eventId: string, eventType: string, message: string, data?: object) {
  console.log(JSON.stringify({
    timestamp: new Date().toISOString(),
    eventId,
    eventType,
    message,
    ...data,
  }))
}

function logWebhookError(eventId: string, eventType: string, message: string, error: unknown) {
  console.error(JSON.stringify({
    timestamp: new Date().toISOString(),
    eventId,
    eventType,
    message,
    error: error instanceof Error ? error.message : String(error),
  }))
}

export async function POST(req: Request) {
  // Get the headers
  const headerPayload = await headers()
  const svix_id = headerPayload.get('svix-id')
  const svix_timestamp = headerPayload.get('svix-timestamp')
  const svix_signature = headerPayload.get('svix-signature')

  // If there are no headers, error out
  if (!svix_id || !svix_timestamp || !svix_signature) {
    return new Response('Error occurred -- no svix headers', {
      status: 400,
    })
  }

  // Validate webhook secret is configured
  if (!process.env.CLERK_WEBHOOK_SECRET) {
    console.error('CLERK_WEBHOOK_SECRET is not configured')
    return new Response('Webhook secret not configured', { status: 500 })
  }

  // Get the body
  const body = await req.text()

  // Create a new Svix instance with your webhook secret
  const wh = new Webhook(process.env.CLERK_WEBHOOK_SECRET)

  let evt: WebhookEvent

  // Verify the webhook signature and extract the event object
  try {
    evt = wh.verify(body, {
      'svix-id': svix_id,
      'svix-timestamp': svix_timestamp,
      'svix-signature': svix_signature,
    }) as WebhookEvent
  } catch (err) {
    console.error('Error verifying webhook:', err)
    return new Response('Error occurred', {
      status: 400,
    })
  }

  // Get Payload instance
  const payload = await getPayload({
    config,
  })

  // Handle the event
  const eventType = evt.type
  const eventId = svix_id
  logWebhook(eventId, eventType, 'Webhook event received')

  switch (eventType) {
    // User events
    case 'user.created':
      try {
        const { id, email_addresses, first_name, last_name, image_url, created_at, phone_numbers, last_sign_in_at, public_metadata } = evt.data

        // Find primary email
        const primaryEmail = email_addresses.find(email => email.id === evt.data.primary_email_address_id)

        if (!primaryEmail) {
          logWebhook(eventId, eventType, 'No primary email found', { clerkId: id })
          return new Response('No primary email found', { status: 400 })
        }

        // Find primary phone if exists
        const primaryPhone = phone_numbers?.find(phone => phone.id === (evt.data as { primary_phone_number_id?: string }).primary_phone_number_id)

        // Create user in Payload
        await payload.create({
          collection: 'users',
          data: {
            email: primaryEmail.email_address,
            firstName: first_name || '',
            lastName: last_name || '',
            clerkId: id,
            imageUrl: image_url || '',
            emailVerified: primaryEmail.verification?.status === 'verified',
            emailVerifiedAt: primaryEmail.verification?.status === 'verified' ? new Date() : null,
            phoneNumber: primaryPhone?.phone_number || null,
            phoneVerified: primaryPhone?.verification?.status === 'verified' || false,
            lastSignInAt: last_sign_in_at ? new Date(last_sign_in_at) : null,
            publicMetadata: public_metadata || null,
            createdAt: new Date(created_at),
          },
        })

        logWebhook(eventId, eventType, 'User created', { email: primaryEmail.email_address })
      } catch (error) {
        logWebhookError(eventId, eventType, 'Error creating user', error)
        return new Response('Error creating user', { status: 500 })
      }
      break

    case 'user.updated':
      try {
        const { id, email_addresses, first_name, last_name, image_url, phone_numbers, last_sign_in_at, public_metadata } = evt.data

        // Find primary email
        const primaryEmail = email_addresses.find(email => email.id === evt.data.primary_email_address_id)

        if (!primaryEmail) {
          logWebhook(eventId, eventType, 'No primary email found', { clerkId: id })
          return new Response('No primary email found', { status: 400 })
        }

        // Find primary phone if exists
        const primaryPhone = phone_numbers?.find(phone => phone.id === (evt.data as { primary_phone_number_id?: string }).primary_phone_number_id)

        // Find user by clerkId
        const users = await payload.find({
          collection: 'users',
          where: {
            clerkId: {
              equals: id,
            },
          },
          limit: 1,
        })

        if (users.docs.length === 0) {
          // User doesn't exist in Payload, create them
          await payload.create({
            collection: 'users',
            data: {
              email: primaryEmail.email_address,
              firstName: first_name || '',
              lastName: last_name || '',
              clerkId: id,
              imageUrl: image_url || '',
              emailVerified: primaryEmail.verification?.status === 'verified',
              emailVerifiedAt: primaryEmail.verification?.status === 'verified' ? new Date() : null,
              phoneNumber: primaryPhone?.phone_number || null,
              phoneVerified: primaryPhone?.verification?.status === 'verified' || false,
              lastSignInAt: last_sign_in_at ? new Date(last_sign_in_at) : null,
              publicMetadata: public_metadata || null,
            },
          })
          logWebhook(eventId, eventType, 'User created (from update event)', { email: primaryEmail.email_address })
        } else {
          // Update existing user
          await payload.update({
            collection: 'users',
            id: users.docs[0].id,
            data: {
              email: primaryEmail.email_address,
              firstName: first_name || '',
              lastName: last_name || '',
              imageUrl: image_url || '',
              emailVerified: primaryEmail.verification?.status === 'verified',
              emailVerifiedAt: primaryEmail.verification?.status === 'verified' && !users.docs[0].emailVerifiedAt ? new Date() : users.docs[0].emailVerifiedAt,
              phoneNumber: primaryPhone?.phone_number || null,
              phoneVerified: primaryPhone?.verification?.status === 'verified' || false,
              lastSignInAt: last_sign_in_at ? new Date(last_sign_in_at) : null,
              publicMetadata: public_metadata || null,
            },
          })
          logWebhook(eventId, eventType, 'User updated', { email: primaryEmail.email_address })
        }
      } catch (error) {
        logWebhookError(eventId, eventType, 'Error updating user', error)
        return new Response('Error updating user', { status: 500 })
      }
      break

    case 'user.deleted':
      try {
        const { id } = evt.data

        // Find user by clerkId
        const users = await payload.find({
          collection: 'users',
          where: {
            clerkId: {
              equals: id,
            },
          },
          limit: 1,
        })

        if (users.docs.length > 0) {
          const userId = users.docs[0].id

          // Cascade delete: Remove organization memberships
          await payload.delete({
            collection: 'organization-memberships',
            where: {
              user: {
                equals: userId,
              },
            },
          })

          // Cascade delete: Remove user subscriptions
          await payload.delete({
            collection: 'subscriptions',
            where: {
              subscriberUser: {
                equals: userId,
              },
            },
          })

          // Delete user from Payload
          await payload.delete({
            collection: 'users',
            id: userId,
          })
          logWebhook(eventId, eventType, 'User and related data deleted', { email: users.docs[0].email })
        } else {
          logWebhook(eventId, eventType, 'User not found in Payload (already deleted)', { clerkId: id })
        }
      } catch (error) {
        logWebhookError(eventId, eventType, 'Error deleting user', error)
        return new Response('Error deleting user', { status: 500 })
      }
      break

    // Organization events
    case 'organization.created':
      try {
        const { id, name, slug, image_url, created_by, max_allowed_memberships, public_metadata, private_metadata } = evt.data

        // Find the creator user if they exist
        let creatorId = undefined
        if (created_by) {
          const creators = await payload.find({
            collection: 'users',
            where: {
              clerkId: {
                equals: created_by,
              },
            },
            limit: 1,
          })
          if (creators.docs.length > 0) {
            creatorId = creators.docs[0].id
          }
        }

        // Create organization in Payload
        await payload.create({
          collection: 'organizations',
          data: {
            clerkId: id,
            name,
            slug: slug || undefined,
            imageUrl: image_url || undefined,
            maxAllowedMemberships: max_allowed_memberships || undefined,
            publicMetadata: public_metadata || undefined,
            privateMetadata: private_metadata || undefined,
            createdBy: creatorId,
          },
        })

        console.log('Organization created in Payload:', name)
      } catch (error) {
        console.error('Error creating organization in Payload:', error)
        return new Response('Error creating organization', { status: 500 })
      }
      break

    case 'organization.updated':
      try {
        const { id, name, slug, image_url, max_allowed_memberships, public_metadata, private_metadata } = evt.data

        // Find organization by clerkId
        const orgs = await payload.find({
          collection: 'organizations',
          where: {
            clerkId: {
              equals: id,
            },
          },
          limit: 1,
        })

        if (orgs.docs.length === 0) {
          logWebhook(eventId, eventType, 'Organization not found in Payload', { clerkId: id })
          break
        }

        // Update organization
        await payload.update({
          collection: 'organizations',
          id: orgs.docs[0].id,
          data: {
            name,
            slug: slug || undefined,
            imageUrl: image_url || undefined,
            maxAllowedMemberships: max_allowed_memberships || undefined,
            publicMetadata: public_metadata || undefined,
            privateMetadata: private_metadata || undefined,
          },
        })

        logWebhook(eventId, eventType, 'Organization updated', { name })
      } catch (error) {
        logWebhookError(eventId, eventType, 'Error updating organization', error)
        return new Response('Error updating organization', { status: 500 })
      }
      break

    case 'organization.deleted':
      try {
        const { id } = evt.data

        // Find organization by clerkId
        const orgs = await payload.find({
          collection: 'organizations',
          where: {
            clerkId: {
              equals: id,
            },
          },
          limit: 1,
        })

        if (orgs.docs.length > 0) {
          const orgId = orgs.docs[0].id

          // Cascade delete: Remove all memberships (batch delete)
          await payload.delete({
            collection: 'organization-memberships',
            where: {
              organization: {
                equals: orgId,
              },
            },
          })

          // Cascade delete: Remove organization subscriptions
          await payload.delete({
            collection: 'subscriptions',
            where: {
              subscriberOrganization: {
                equals: orgId,
              },
            },
          })

          // Delete organization from Payload
          await payload.delete({
            collection: 'organizations',
            id: orgId,
          })
          logWebhook(eventId, eventType, 'Organization and related data deleted', { name: orgs.docs[0].name })
        } else {
          logWebhook(eventId, eventType, 'Organization not found in Payload (already deleted)', { clerkId: id })
        }
      } catch (error) {
        logWebhookError(eventId, eventType, 'Error deleting organization', error)
        return new Response('Error deleting organization', { status: 500 })
      }
      break

    // Organization membership events
    case 'organizationMembership.created':
      try {
        const { id, organization, public_user_data, role, public_metadata } = evt.data

        // Check if membership already exists (idempotency)
        const existingMembership = await payload.find({
          collection: 'organization-memberships',
          where: {
            clerkMembershipId: {
              equals: id,
            },
          },
          limit: 1,
        })

        if (existingMembership.docs.length > 0) {
          logWebhook(eventId, eventType, 'Membership already exists (idempotent)', { clerkMembershipId: id })
          break
        }

        // Find the organization
        const orgs = await payload.find({
          collection: 'organizations',
          where: {
            clerkId: {
              equals: organization.id,
            },
          },
          limit: 1,
        })

        if (orgs.docs.length === 0) {
          // Organization not synced yet - this can happen due to race conditions
          // Return 200 but log for monitoring (Clerk will retry automatically)
          logWebhook(eventId, eventType, 'Organization not found - may sync later', { orgClerkId: organization.id })
          break
        }

        // Find the user
        const users = await payload.find({
          collection: 'users',
          where: {
            clerkId: {
              equals: public_user_data.user_id,
            },
          },
          limit: 1,
        })

        if (users.docs.length === 0) {
          // User not synced yet - this can happen due to race conditions
          logWebhook(eventId, eventType, 'User not found - may sync later', { userClerkId: public_user_data.user_id })
          break
        }

        // Create membership
        await payload.create({
          collection: 'organization-memberships',
          data: {
            clerkMembershipId: id,
            organization: orgs.docs[0].id,
            user: users.docs[0].id,
            role: role || 'org:member',
            publicMetadata: public_metadata || undefined,
          },
        })

        logWebhook(eventId, eventType, 'Membership created', { email: users.docs[0].email, org: orgs.docs[0].name })
      } catch (error) {
        logWebhookError(eventId, eventType, 'Error creating membership', error)
        return new Response('Error creating membership', { status: 500 })
      }
      break

    case 'organizationMembership.updated':
      try {
        const { id, role, public_metadata } = evt.data

        // Find membership by clerkMembershipId
        const memberships = await payload.find({
          collection: 'organization-memberships',
          where: {
            clerkMembershipId: {
              equals: id,
            },
          },
          limit: 1,
        })

        if (memberships.docs.length === 0) {
          // Membership not found - may have been deleted or not synced yet
          logWebhook(eventId, eventType, 'Membership not found', { clerkMembershipId: id })
          break
        }

        // Update membership
        await payload.update({
          collection: 'organization-memberships',
          id: memberships.docs[0].id,
          data: {
            role: role || 'org:member',
            publicMetadata: public_metadata || undefined,
          },
        })

        logWebhook(eventId, eventType, 'Membership updated', { clerkMembershipId: id })
      } catch (error) {
        logWebhookError(eventId, eventType, 'Error updating membership', error)
        return new Response('Error updating membership', { status: 500 })
      }
      break

    case 'organizationMembership.deleted':
      try {
        const { id } = evt.data

        // Find membership by clerkMembershipId
        const memberships = await payload.find({
          collection: 'organization-memberships',
          where: {
            clerkMembershipId: {
              equals: id,
            },
          },
          limit: 1,
        })

        if (memberships.docs.length > 0) {
          await payload.delete({
            collection: 'organization-memberships',
            id: memberships.docs[0].id,
          })
          logWebhook(eventId, eventType, 'Membership deleted', { clerkMembershipId: id })
        } else {
          logWebhook(eventId, eventType, 'Membership not found (already deleted)', { clerkMembershipId: id })
        }
      } catch (error) {
        logWebhookError(eventId, eventType, 'Error deleting membership', error)
        return new Response('Error deleting membership', { status: 500 })
      }
      break

    // Billing Events - Subscriptions
    case 'subscription.created':
    case 'subscription.updated':
    case 'subscription.active':
    case 'subscription.past_due':
      try {
        const subscriptionData = evt.data as unknown as ClerkSubscriptionData
        const { id, customer, status, current_period_start, current_period_end, trial_start, trial_end, cancel_at_period_end, canceled_at, metadata } = subscriptionData

        // Determine subscriber type and ID
        let subscriberType: 'user' | 'organization' = 'user'
        let subscriberUser = undefined
        let subscriberOrganization = undefined

        // Check if customer ID matches an organization or user
        const orgs = await payload.find({
          collection: 'organizations',
          where: {
            clerkId: {
              equals: customer,
            },
          },
          limit: 1,
        })

        if (orgs.docs.length > 0) {
          subscriberType = 'organization'
          subscriberOrganization = orgs.docs[0].id
        } else {
          // Try to find as user
          const users = await payload.find({
            collection: 'users',
            where: {
              clerkId: {
                equals: customer,
              },
            },
            limit: 1,
          })

          if (users.docs.length > 0) {
            subscriberUser = users.docs[0].id
          }
        }

        // Check if subscription exists
        const existingSubscriptions = await payload.find({
          collection: 'subscriptions',
          where: {
            clerkSubscriptionId: {
              equals: id,
            },
          },
          limit: 1,
        })

        const subscriptionPayload = {
          clerkSubscriptionId: id,
          subscriberType,
          subscriberUser,
          subscriberOrganization,
          status: status || evt.type.split('.')[1], // Use event type suffix if status not provided
          currentPeriodStart: current_period_start ? new Date(current_period_start * 1000) : null,
          currentPeriodEnd: current_period_end ? new Date(current_period_end * 1000) : null,
          trialStart: trial_start ? new Date(trial_start * 1000) : null,
          trialEnd: trial_end ? new Date(trial_end * 1000) : null,
          cancelAtPeriodEnd: cancel_at_period_end || false,
          canceledAt: canceled_at ? new Date(canceled_at * 1000) : null,
          metadata,
        }

        if (existingSubscriptions.docs.length > 0) {
          // Update existing subscription
          await payload.update({
            collection: 'subscriptions',
            id: existingSubscriptions.docs[0].id,
            data: subscriptionPayload,
          })
          console.log('Subscription updated:', id, status)
        } else if (evt.type === 'subscription.created') {
          // Create new subscription
          await payload.create({
            collection: 'subscriptions',
            data: subscriptionPayload,
          })
          console.log('Subscription created:', id)
        }
      } catch (error) {
        console.error('Error handling subscription event:', error)
        return new Response('Error handling subscription', { status: 500 })
      }
      break

    // Billing Events - Subscription Items
    case 'subscriptionItem.created':
    case 'subscriptionItem.updated':
    case 'subscriptionItem.active':
    case 'subscriptionItem.canceled':
    case 'subscriptionItem.upcoming':
    case 'subscriptionItem.ended':
    case 'subscriptionItem.abandoned':
    case 'subscriptionItem.incomplete':
    case 'subscriptionItem.past_due':
      try {
        const itemData = evt.data as unknown as ClerkSubscriptionItemData
        const { id, subscription: subscriptionId, plan, quantity, metadata, status: itemStatus } = itemData

        // Find the parent subscription
        const subscriptions = await payload.find({
          collection: 'subscriptions',
          where: {
            clerkSubscriptionId: {
              equals: subscriptionId,
            },
          },
          limit: 1,
        })

        if (subscriptions.docs.length === 0) {
          // Parent subscription not synced yet - return 200 but log
          logWebhook(eventId, eventType, 'Parent subscription not found - may sync later', { subscriptionId })
          break
        }

        // Check if item exists
        const existingItems = await payload.find({
          collection: 'subscription-items',
          where: {
            clerkItemId: {
              equals: id,
            },
          },
          limit: 1,
        })

        // Handle plan being either a string ID or an object
        const planObj = typeof plan === 'object' ? plan : null
        const itemPayload = {
          clerkItemId: id,
          subscription: subscriptions.docs[0].id,
          planId: planObj?.id || (typeof plan === 'string' ? plan : ''),
          planName: planObj?.nickname || planObj?.name,
          quantity: quantity || 1,
          unitAmount: planObj?.amount,
          currency: planObj?.currency,
          interval: planObj?.interval,
          status: itemStatus || evt.type.split('.')[1], // Use event type suffix if status not provided
          metadata,
        }

        if (existingItems.docs.length > 0) {
          // Update existing item
          await payload.update({
            collection: 'subscription-items',
            id: existingItems.docs[0].id,
            data: itemPayload,
          })
          console.log('Subscription item updated:', id)
        } else if (evt.type === 'subscriptionItem.created') {
          // Create new item
          await payload.create({
            collection: 'subscription-items',
            data: itemPayload,
          })
          console.log('Subscription item created:', id)
        }
      } catch (error) {
        console.error('Error handling subscription item event:', error)
        return new Response('Error handling subscription item', { status: 500 })
      }
      break

    // Billing Events - Payment Attempts
    case 'paymentAttempt.created':
    case 'paymentAttempt.updated':
      try {
        const paymentData = evt.data as unknown as ClerkPaymentAttemptData
        const { id, subscription: subscriptionId, amount, currency, status, failure_reason, failure_code, invoice, charge, payment_method_type, created } = paymentData

        // Find the related subscription if provided
        let subscriptionRelation = undefined
        if (subscriptionId) {
          const subscriptions = await payload.find({
            collection: 'subscriptions',
            where: {
              clerkSubscriptionId: {
                equals: subscriptionId,
              },
            },
            limit: 1,
          })

          if (subscriptions.docs.length > 0) {
            subscriptionRelation = subscriptions.docs[0].id
          }
        }

        // Check if payment attempt exists
        const existingPayments = await payload.find({
          collection: 'payment-attempts',
          where: {
            clerkPaymentId: {
              equals: id,
            },
          },
          limit: 1,
        })

        const paymentPayload = {
          clerkPaymentId: id,
          subscription: subscriptionRelation,
          amount: amount || 0,
          currency: currency || 'usd',
          status: status || 'processing',
          failureReason: failure_reason,
          failureCode: failure_code,
          invoiceId: invoice,
          chargeId: charge,
          paymentMethodType: payment_method_type,
          attemptedAt: created ? new Date(created * 1000) : new Date(),
          metadata: paymentData.metadata,
        }

        if (existingPayments.docs.length > 0) {
          // Update existing payment attempt
          await payload.update({
            collection: 'payment-attempts',
            id: existingPayments.docs[0].id,
            data: paymentPayload,
          })
          console.log('Payment attempt updated:', id, status)
        } else {
          // Create new payment attempt
          await payload.create({
            collection: 'payment-attempts',
            data: paymentPayload,
          })
          console.log('Payment attempt created:', id)
        }
      } catch (error) {
        console.error('Error handling payment attempt event:', error)
        return new Response('Error handling payment attempt', { status: 500 })
      }
      break

    default:
      console.log('Unhandled webhook event type:', eventType)
  }

  return new Response('', { status: 200 })
}