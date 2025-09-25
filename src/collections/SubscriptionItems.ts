import type { CollectionConfig } from 'payload'

export const SubscriptionItems: CollectionConfig = {
  slug: 'subscription-items',
  admin: {
    useAsTitle: 'clerkItemId',
    description: 'Subscription item details synced from Clerk Billing',
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
      name: 'clerkItemId',
      type: 'text',
      unique: true,
      required: true,
      admin: {
        description: 'Clerk Subscription Item ID for synchronization',
      },
    },
    {
      name: 'subscription',
      type: 'relationship',
      relationTo: 'subscriptions',
      required: true,
      admin: {
        description: 'Parent subscription',
      },
    },
    {
      name: 'planId',
      type: 'text',
      required: true,
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
