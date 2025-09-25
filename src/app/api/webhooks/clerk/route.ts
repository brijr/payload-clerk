import { headers } from 'next/headers'
import { WebhookEvent } from '@clerk/nextjs/server'
import { Webhook } from 'svix'
import { getPayload } from 'payload'
import config from '@/payload.config'

export async function POST(req: Request) {
  // Get the headers
  const headerPayload = await headers()
  const svix_id = headerPayload.get('svix-id')
  const svix_timestamp = headerPayload.get('svix-timestamp')
  const svix_signature = headerPayload.get('svix-signature')

  // If there are no headers, error out
  if (!svix_id || !svix_timestamp || !svix_signature) {
    return new Response('Error occured -- no svix headers', {
      status: 400,
    })
  }

  // Get the body
  const body = await req.text()

  // Create a new Svix instance with your webhook secret
  const wh = new Webhook(process.env.CLERK_WEBHOOK_SECRET!)

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
    return new Response('Error occured', {
      status: 400,
    })
  }

  // Get Payload instance
  const payload = await getPayload({
    config,
  })

  // Handle the event
  const eventType = evt.type
  console.log('Webhook event received:', eventType)

  switch (eventType) {
    // User events
    case 'user.created':
      try {
        const { id, email_addresses, first_name, last_name, image_url, created_at } = evt.data

        // Find primary email
        const primaryEmail = email_addresses.find(email => email.id === evt.data.primary_email_address_id)

        if (!primaryEmail) {
          console.error('No primary email found for user:', id)
          return new Response('No primary email found', { status: 400 })
        }

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
            createdAt: new Date(created_at),
          },
        })

        console.log('User created in Payload:', primaryEmail.email_address)
      } catch (error) {
        console.error('Error creating user in Payload:', error)
        return new Response('Error creating user', { status: 500 })
      }
      break

    case 'user.updated':
      try {
        const { id, email_addresses, first_name, last_name, image_url } = evt.data

        // Find primary email
        const primaryEmail = email_addresses.find(email => email.id === evt.data.primary_email_address_id)

        if (!primaryEmail) {
          console.error('No primary email found for user:', id)
          return new Response('No primary email found', { status: 400 })
        }

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
            },
          })
          console.log('User created in Payload (from update event):', primaryEmail.email_address)
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
            },
          })
          console.log('User updated in Payload:', primaryEmail.email_address)
        }
      } catch (error) {
        console.error('Error updating user in Payload:', error)
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
          // Delete user from Payload
          await payload.delete({
            collection: 'users',
            id: users.docs[0].id,
          })
          console.log('User deleted from Payload:', users.docs[0].email)
        }
      } catch (error) {
        console.error('Error deleting user from Payload:', error)
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
          console.error('Organization not found in Payload:', id)
          return new Response('Organization not found', { status: 404 })
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

        console.log('Organization updated in Payload:', name)
      } catch (error) {
        console.error('Error updating organization in Payload:', error)
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
          // Delete all memberships for this organization first
          const memberships = await payload.find({
            collection: 'organization-memberships',
            where: {
              organization: {
                equals: orgs.docs[0].id,
              },
            },
            limit: 1000,
          })

          for (const membership of memberships.docs) {
            await payload.delete({
              collection: 'organization-memberships',
              id: membership.id,
            })
          }

          // Delete organization from Payload
          await payload.delete({
            collection: 'organizations',
            id: orgs.docs[0].id,
          })
          console.log('Organization deleted from Payload:', orgs.docs[0].name)
        }
      } catch (error) {
        console.error('Error deleting organization from Payload:', error)
        return new Response('Error deleting organization', { status: 500 })
      }
      break

    // Organization membership events
    case 'organizationMembership.created':
      try {
        const { id, organization, public_user_data, role, public_metadata } = evt.data

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
          console.error('Organization not found for membership:', organization.id)
          return new Response('Organization not found', { status: 404 })
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
          console.error('User not found for membership:', public_user_data.user_id)
          return new Response('User not found', { status: 404 })
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

        console.log('Organization membership created:', `${users.docs[0].email} -> ${orgs.docs[0].name}`)
      } catch (error) {
        console.error('Error creating organization membership:', error)
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
          console.error('Membership not found in Payload:', id)
          return new Response('Membership not found', { status: 404 })
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

        console.log('Organization membership updated:', id)
      } catch (error) {
        console.error('Error updating organization membership:', error)
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
          // Delete membership
          await payload.delete({
            collection: 'organization-memberships',
            id: memberships.docs[0].id,
          })
          console.log('Organization membership deleted:', id)
        }
      } catch (error) {
        console.error('Error deleting organization membership:', error)
        return new Response('Error deleting membership', { status: 500 })
      }
      break

    // Billing Events - Subscriptions
    case 'subscription.created':
    case 'subscription.updated':
    case 'subscription.active':
    case 'subscription.past_due':
      try {
        const subscriptionData = evt.data as any
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
        const itemData = evt.data as any
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
          console.error('Parent subscription not found for item:', subscriptionId)
          return new Response('Parent subscription not found', { status: 404 })
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

        const itemPayload = {
          clerkItemId: id,
          subscription: subscriptions.docs[0].id,
          planId: plan?.id || plan,
          planName: plan?.nickname || plan?.name,
          quantity: quantity || 1,
          unitAmount: plan?.amount,
          currency: plan?.currency,
          interval: plan?.interval,
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
        const paymentData = evt.data as any
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