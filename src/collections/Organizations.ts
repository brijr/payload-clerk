import type { CollectionConfig } from 'payload'

export const Organizations: CollectionConfig = {
  slug: 'organizations',
  admin: {
    useAsTitle: 'name',
    group: 'Users',
  },
  access: {
    read: () => true,
    create: () => true,
    update: () => true,
    delete: () => true,
  },
  fields: [
    {
      name: 'clerkId',
      type: 'text',
      unique: true,
      required: true,
      admin: {
        description: 'Clerk Organization ID for synchronization',
        position: 'sidebar',
      },
    },
    {
      name: 'name',
      type: 'text',
      required: true,
    },
    {
      name: 'slug',
      type: 'text',
      unique: true,
      required: false,
      admin: {
        description: 'URL-friendly version of the organization name',
      },
    },
    {
      name: 'imageUrl',
      type: 'text',
      required: false,
      admin: {
        description: 'Organization logo/image URL from Clerk',
      },
    },
    {
      name: 'description',
      type: 'textarea',
      required: false,
    },
    {
      name: 'maxAllowedMemberships',
      type: 'number',
      required: false,
      admin: {
        description: 'Maximum number of members allowed in this organization',
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
    {
      name: 'privateMetadata',
      type: 'json',
      required: false,
      admin: {
        description: 'Private metadata from Clerk',
        condition: (data, siblingData, { user }) => {
          return true
        },
      },
    },
    {
      name: 'createdBy',
      type: 'relationship',
      relationTo: 'users', // This refers to Clerk users
      required: false,
      admin: {
        description: 'User who created this organization',
        position: 'sidebar',
      },
    },
    // Virtual field to show organization subscriptions
    {
      name: 'subscriptions',
      type: 'join',
      collection: 'subscriptions',
      on: 'subscriberOrganization',
      admin: {
        description: 'Organization subscriptions',
        position: 'sidebar',
      },
    },
  ],
  timestamps: true,
}
