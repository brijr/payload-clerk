import type { CollectionConfig } from 'payload'

export const OrganizationMemberships: CollectionConfig = {
  slug: 'organization-memberships',
  admin: {
    useAsTitle: 'id',
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
      name: 'clerkMembershipId',
      type: 'text',
      unique: true,
      required: true,
      admin: {
        description: 'Clerk Membership ID for synchronization',
      },
    },
    {
      name: 'organization',
      type: 'relationship',
      relationTo: 'organizations',
      required: true,
      admin: {
        description: 'The organization this membership belongs to',
      },
    },
    {
      name: 'user',
      type: 'relationship',
      relationTo: 'users',
      required: true,
      admin: {
        description: 'The user who is a member',
      },
    },
    {
      name: 'role',
      type: 'select',
      options: [
        { label: 'Admin', value: 'org:admin' },
        { label: 'Member', value: 'org:member' },
        { label: 'Billing', value: 'org:billing' },
        { label: 'Developer', value: 'org:developer' },
        { label: 'Viewer', value: 'org:viewer' },
      ],
      required: true,
      defaultValue: 'org:member',
      admin: {
        description: 'Role within the organization',
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
  ],
  timestamps: true,
}
