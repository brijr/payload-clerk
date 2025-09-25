import type { CollectionConfig } from 'payload'

export const Subscriptions: CollectionConfig = {
  slug: 'subscriptions',
  admin: {
    useAsTitle: 'clerkSubscriptionId',
    description: 'Subscription data synced from Clerk Billing',
    group: 'Billing',
  },
  access: {
    read: () => true,
    create: () => true, // Allow webhook to create
    update: () => true, // Allow webhook to update
    delete: () => true, // Allow webhook to delete
  },
  fields: [
    {
      name: 'clerkSubscriptionId',
      type: 'text',
      unique: true,
      required: true,
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
