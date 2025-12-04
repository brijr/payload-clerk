import type { CollectionConfig } from 'payload'

/**
 * Users collection: Synced from Clerk via webhooks.
 * These are frontend app users, NOT Payload admins.
 * Authentication is handled by Clerk, not Payload.
 */
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
      index: true,
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
    {
      name: 'phoneNumber',
      type: 'text',
      required: false,
      admin: {
        description: 'Phone number from Clerk',
      },
    },
    {
      name: 'phoneVerified',
      type: 'checkbox',
      defaultValue: false,
      admin: {
        description: 'Has the user verified their phone number',
      },
    },
    {
      name: 'lastSignInAt',
      type: 'date',
      required: false,
      admin: {
        description: 'Last sign-in timestamp from Clerk',
      },
    },
    {
      name: 'publicMetadata',
      type: 'json',
      required: false,
      admin: {
        description: 'Public metadata from Clerk',
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
