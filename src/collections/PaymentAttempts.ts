import type { CollectionConfig } from 'payload'

export const PaymentAttempts: CollectionConfig = {
  slug: 'payment-attempts',
  admin: {
    useAsTitle: 'clerkPaymentId',
    description: 'Payment attempt records synced from Clerk Billing',
    group: 'Billing',
  },
  access: {
    read: () => true,
    create: () => true, // Allow webhook to create
    update: () => true, // Allow webhook to update
    delete: () => true, // Allow deletion
  },
  fields: [
    {
      name: 'clerkPaymentId',
      type: 'text',
      unique: true,
      required: true,
      admin: {
        description: 'Clerk Payment Attempt ID for synchronization',
      },
    },
    {
      name: 'subscription',
      type: 'relationship',
      relationTo: 'subscriptions',
      required: false,
      admin: {
        description: 'Related subscription',
      },
    },
    {
      name: 'amount',
      type: 'number',
      required: true,
      admin: {
        description: 'Payment amount in cents',
      },
    },
    {
      name: 'currency',
      type: 'text',
      required: true,
      defaultValue: 'usd',
      admin: {
        description: 'Currency code (e.g., usd, eur)',
      },
    },
    {
      name: 'status',
      type: 'select',
      options: [
        { label: 'Succeeded', value: 'succeeded' },
        { label: 'Failed', value: 'failed' },
        { label: 'Processing', value: 'processing' },
        { label: 'Requires Action', value: 'requires_action' },
        { label: 'Requires Payment Method', value: 'requires_payment_method' },
        { label: 'Canceled', value: 'canceled' },
      ],
      required: true,
      admin: {
        description: 'Payment attempt status',
      },
    },
    {
      name: 'failureReason',
      type: 'text',
      required: false,
      admin: {
        description: 'Reason for payment failure',
      },
    },
    {
      name: 'failureCode',
      type: 'text',
      required: false,
      admin: {
        description: 'Failure code from payment processor',
      },
    },
    {
      name: 'invoiceId',
      type: 'text',
      required: false,
      admin: {
        description: 'Related invoice ID from Stripe/payment processor',
      },
    },
    {
      name: 'chargeId',
      type: 'text',
      required: false,
      admin: {
        description: 'Charge ID from payment processor',
      },
    },
    {
      name: 'paymentMethodType',
      type: 'text',
      required: false,
      admin: {
        description: 'Type of payment method used (card, bank_transfer, etc)',
      },
    },
    {
      name: 'attemptedAt',
      type: 'date',
      required: true,
      admin: {
        description: 'When the payment was attempted',
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
