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

export const SubscriptionItems: CollectionConfig = {
  slug: 'subscription-items',
  admin: {
    useAsTitle: 'clerkItemId',
    description: 'Subscription item details synced from Clerk Billing',
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
      name: 'clerkItemId',
      type: 'text',
      unique: true,
      required: true,
      index: true,
      admin: {
        description: 'Clerk Subscription Item ID for synchronization',
      },
    },
    {
      name: 'subscription',
      type: 'relationship',
      relationTo: 'subscriptions',
      required: true,
      index: true,
      admin: {
        description: 'Parent subscription',
      },
    },
    {
      name: 'planId',
      type: 'text',
      required: true,
      index: true,
      admin: {
        description: 'Plan identifier from Clerk',
      },
    },
    {
      name: 'planName',
      type: 'text',
      required: false,
      admin: {
        description: 'Human-readable plan name',
      },
    },
    {
      name: 'quantity',
      type: 'number',
      required: false,
      defaultValue: 1,
      admin: {
        description: 'Number of units for this item',
      },
    },
    {
      name: 'unitAmount',
      type: 'number',
      required: false,
      admin: {
        description: 'Price per unit in cents',
      },
    },
    {
      name: 'currency',
      type: 'text',
      required: false,
      defaultValue: 'usd',
      admin: {
        description: 'Currency code (e.g., usd, eur)',
      },
    },
    {
      name: 'interval',
      type: 'select',
      options: [
        { label: 'Monthly', value: 'month' },
        { label: 'Yearly', value: 'year' },
        { label: 'Weekly', value: 'week' },
        { label: 'Daily', value: 'day' },
      ],
      required: false,
      admin: {
        description: 'Billing interval',
      },
    },
    {
      name: 'status',
      type: 'select',
      options: [
        { label: 'Active', value: 'active' },
        { label: 'Canceled', value: 'canceled' },
        { label: 'Upcoming', value: 'upcoming' },
        { label: 'Ended', value: 'ended' },
        { label: 'Abandoned', value: 'abandoned' },
        { label: 'Incomplete', value: 'incomplete' },
        { label: 'Past Due', value: 'past_due' },
      ],
      required: true,
      defaultValue: 'active',
      index: true,
      admin: {
        description: 'Item status',
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
  ],
  timestamps: true,
}
