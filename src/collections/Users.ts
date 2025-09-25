import type { CollectionConfig } from 'payload'

export const Users: CollectionConfig = {
  slug: 'users',
  admin: {
    useAsTitle: 'email',
    description: 'Users synced from Clerk',
    group: 'Users',
  },
  auth: false, // No auth needed - these are Clerk users
  fields: [
    {
      name: 'clerkId',
      type: 'text',
      unique: true,
      required: true,
      admin: {
        description: 'Clerk User ID for synchronization',
        position: 'sidebar',
      },
    },
    {
      name: 'email',
      type: 'email',
      required: true,
      unique: true,
    },
    {
      name: 'firstName',
      type: 'text',
      required: false,
    },
    {
      name: 'lastName',
      type: 'text',
      required: false,
    },
    {
      name: 'imageUrl',
      type: 'text',
      required: false,
      admin: {
        description: 'Profile image URL from Clerk',
      },
    },
    {
      name: 'emailVerified',
      type: 'checkbox',
      defaultValue: false,
      admin: {
        description: 'Has the user verified their email address',
      },
    },
    {
      name: 'emailVerifiedAt',
      type: 'date',
      required: false,
      admin: {
        description: 'Date when the email was verified',
      },
    },
    // Virtual field to show organization memberships
    {
      name: 'organizations',
      type: 'join',
      collection: 'organization-memberships',
      on: 'user',
      admin: {
        description: 'Organizations this user belongs to',
        position: 'sidebar',
      },
    },
    // Virtual field to show user subscriptions
    {
      name: 'subscriptions',
      type: 'join',
      collection: 'subscriptions',
      on: 'subscriberUser',
      admin: {
        description: 'User subscriptions',
        position: 'sidebar',
      },
    },
  ],
  timestamps: true,
}
