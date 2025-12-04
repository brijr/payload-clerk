import type { CollectionConfig, Access } from 'payload'

/**
 * Access control: Allow Payload admins full access.
 * Public API access is read-only.
 * Webhooks bypass access control (using local API).
 */
const isAdmin: Access = ({ req }) => {
  if (req.user) return true
  return false
}

const isAdminOrReadOnly: Access = ({ req }) => {
  if (req.user) return true
  return true
}

export const OrganizationMemberships: CollectionConfig = {
  slug: 'organization-memberships',
  admin: {
    useAsTitle: 'id',
    group: 'Users',
  },
  access: {
    read: isAdminOrReadOnly,
    create: isAdmin,
    update: isAdmin,
    delete: isAdmin,
  },
  fields: [
    {
      name: 'clerkMembershipId',
      type: 'text',
      unique: true,
      required: true,
      index: true,
      admin: {
        description: 'Clerk Membership ID for synchronization',
      },
    },
    {
      name: 'organization',
      type: 'relationship',
      relationTo: 'organizations',
      required: true,
      index: true,
      admin: {
        description: 'The organization this membership belongs to',
      },
    },
    {
      name: 'user',
      type: 'relationship',
      relationTo: 'users',
      required: true,
      index: true,
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
    {
      name: 'privateMetadata',
      type: 'json',
      required: false,
      admin: {
        description: 'Private metadata from Clerk',
      },
    },
  ],
  timestamps: true,
}
