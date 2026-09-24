import type { GlobalConfig } from 'payload'

const linkFields = [
  { name: 'label', type: 'text' as const, required: true },
  { name: 'href', type: 'text' as const, required: true },
]

export const SiteChrome: GlobalConfig = {
  slug: 'site-chrome',
  label: 'Site chrome',
  admin: {
    description:
      'Private draft of the live header, mega menu, footer, and homepage hero. Saving does not change the public website. Preview is /preview/chrome/.',
  },
  access: {
    read: ({ req }) => Boolean(req.user),
    update: ({ req }) => Boolean(req.user),
  },
  versions: {
    drafts: true,
  },
  hooks: {
    beforeChange: [
      ({ data }) => {
        if (!data) return data
        data.publishedToSite = false
        data.siteVisibility = 'private_draft'
        return data
      },
    ],
  },
  fields: [
    {
      name: 'siteVisibility',
      type: 'text',
      defaultValue: 'private_draft',
      admin: { readOnly: true, description: 'This chrome stays a private draft.' },
    },
    {
      name: 'publishedToSite',
      type: 'checkbox',
      defaultValue: false,
      admin: { readOnly: true, description: 'Hosted conversion stays off.' },
    },
    { name: 'sourceUrl', type: 'text', admin: { readOnly: true } },
    {
      name: 'logo',
      type: 'group',
      fields: [
        { name: 'src', type: 'text', required: true, label: 'Image URL' },
        { name: 'alt', type: 'text', required: true },
        { name: 'href', type: 'text', required: true, label: 'Link' },
      ],
    },
    {
      name: 'phone',
      type: 'group',
      fields: linkFields,
    },
    {
      name: 'email',
      type: 'group',
      fields: linkFields,
    },
    {
      name: 'utilityLinks',
      type: 'array',
      labels: { singular: 'Utility link', plural: 'Utility links' },
      fields: linkFields,
    },
    {
      name: 'navigation',
      type: 'array',
      labels: { singular: 'Menu item', plural: 'Menu' },
      admin: { description: 'Top item, then column groups, then the links inside a group.' },
      fields: [
        { name: 'label', type: 'text', required: true },
        { name: 'href', type: 'text', required: true, label: 'Link' },
        {
          name: 'groups',
          type: 'array',
          labels: { singular: 'Column group', plural: 'Column groups' },
          fields: [
            { name: 'label', type: 'text', required: true },
            { name: 'href', type: 'text', required: true, label: 'Link' },
            {
              name: 'links',
              type: 'array',
              labels: { singular: 'Link', plural: 'Links' },
              fields: linkFields,
            },
          ],
        },
      ],
    },
    {
      name: 'footerColumns',
      type: 'array',
      labels: { singular: 'Footer column', plural: 'Footer columns' },
      fields: [
        { name: 'title', type: 'text' },
        {
          name: 'groups',
          type: 'array',
          fields: [
            { name: 'label', type: 'text', required: true },
            { name: 'href', type: 'text', required: true, label: 'Link' },
            {
              name: 'links',
              type: 'array',
              fields: linkFields,
            },
          ],
        },
      ],
    },
    {
      name: 'badges',
      type: 'array',
      labels: { singular: 'Approval logo', plural: 'Approval logos' },
      admin: { description: 'Footer certification images. Leave the link blank when the logo is not a link.' },
      fields: [
        { name: 'label', type: 'text', required: true },
        { name: 'href', type: 'text', label: 'Link' },
        { name: 'src', type: 'text', required: true, label: 'Image URL' },
      ],
    },
    {
      name: 'socialLinks',
      type: 'array',
      labels: { singular: 'Social link', plural: 'Social links' },
      fields: linkFields,
    },
    { name: 'legalText', type: 'textarea' },
    {
      name: 'heroSlides',
      type: 'array',
      labels: { singular: 'Hero slide', plural: 'Homepage hero' },
      admin: {
        description: 'Change the headline, subcopy, background image URL, and buttons. Slide order is the rotator order.',
      },
      fields: [
        { name: 'headline', type: 'text', required: true },
        { name: 'subcopy', type: 'textarea' },
        { name: 'backgroundImage', type: 'text', label: 'Background image URL' },
        {
          name: 'callsToAction',
          type: 'array',
          labels: { singular: 'Button', plural: 'Buttons' },
          fields: linkFields,
        },
      ],
    },
    {
      name: 'notes',
      type: 'array',
      fields: [{ name: 'text', type: 'text', required: true }],
      admin: { readOnly: true, description: 'What this draft does not copy from WordPress.' },
    },
  ],
}
