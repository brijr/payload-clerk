import type { CollectionConfig, Access } from 'payload'

/**
 * Access control: Billing data is sensitive.
 * Only Payload admins can access via API.
 * Webhooks bypass access control (using local API).
 */
const isAdmin: Access = ({ req }) => {
  if (req.user) return true
  return false
}

export const Subscriptions: CollectionConfig = {
  slug: 'subscriptions',
  admin: {
    useAsTitle: 'clerkSubscriptionId',
    description: 'Subscription data synced from Clerk Billing',
    group: 'Billing',
  },
  access: {
    read: isAdmin,
    create: isAdmin,
    update: isAdmin,
    delete: isAdmin,
  },
  fields: [
    {
      name: 'clerkSubscriptionId',
      type: 'text',
      unique: true,
      required: true,
      index: true,
      admin: {
        description: 'Clerk Subscription ID for synchronization',
      },
    },
    {
      name: 'subscriberType',
      type: 'select',
      options: [
        { label: 'User', value: 'user' },
        { label: 'Organization', value: 'organization' },
      ],
      required: true,
      admin: {
        description: 'Type of subscriber',
      },
    },
    {
      name: 'subscriberUser',
      type: 'relationship',
      relationTo: 'users',
      required: false,
      index: true,
      admin: {
        description: 'User subscriber (if subscriberType is user)',
        condition: (data) => data.subscriberType === 'user',
      },
    },
    {
      name: 'subscriberOrganization',
      type: 'relationship',
      relationTo: 'organizations',
      required: false,
      index: true,
      admin: {
        description: 'Organization subscriber (if subscriberType is organization)',
        condition: (data) => data.subscriberType === 'organization',
      },
    },
    {
      name: 'status',
      type: 'select',
      options: [
        { label: 'Active', value: 'active' },
        { label: 'Past Due', value: 'past_due' },
        { label: 'Canceled', value: 'canceled' },
        { label: 'Incomplete', value: 'incomplete' },
        { label: 'Incomplete Expired', value: 'incomplete_expired' },
        { label: 'Trialing', value: 'trialing' },
        { label: 'Unpaid', value: 'unpaid' },
      ],
      required: true,
      defaultValue: 'active',
      index: true,
      admin: {
        description: 'Current subscription status',
      },
    },
    {
      name: 'currentPeriodStart',
      type: 'date',
      required: false,
      admin: {
        description: 'Start of the current billing period',
      },
    },
    {
      name: 'currentPeriodEnd',
      type: 'date',
      required: false,
      admin: {
        description: 'End of the current billing period',
      },
    },
    {
      name: 'trialStart',
      type: 'date',
      required: false,
      admin: {
        description: 'Start of trial period',
      },
    },
    {
      name: 'trialEnd',
      type: 'date',
      required: false,
      admin: {
        description: 'End of trial period',
      },
    },
    {
      name: 'canceledAt',
      type: 'date',
      required: false,
      admin: {
        description: 'Date when subscription was canceled',
      },
    },
    {
      name: 'cancelAtPeriodEnd',
      type: 'checkbox',
      defaultValue: false,
      admin: {
        description: 'Whether to cancel at the end of the current period',
      },
    },
    {
      name: 'metadata',
      type: 'json',
      required: false,
      admin: {
        description: 'Additional metadata from Clerk',
      },
    },
    // Virtual fields for relationships
    {
      name: 'items',
      type: 'join',
      collection: 'subscription-items',
      on: 'subscription',
      admin: {
        description: 'Subscription items',
      },
    },
    {
      name: 'payments',
      type: 'join',
      collection: 'payment-attempts',
      on: 'subscription',
      admin: {
        description: 'Payment attempts for this subscription',
      },
    },
  ],
  timestamps: true,
}
