import type { CollectionAfterChangeHook, CollectionConfig } from 'payload'
import { exportHomepageFromPage, isHomepageAdminSave } from '../../../shared/cms-export/write'

const exportHomepageAfterChange: CollectionAfterChangeHook = ({ doc, req }) => {
  if (!isHomepageAdminSave(doc)) return doc
  const written = exportHomepageFromPage(doc)
  if (!written) {
    req.payload.logger.error('Homepage save was not exported. Astro keeps the last JSON file.')
  }
  return doc
}

export const Pages: CollectionConfig = {
  slug: 'pages',
  admin: {
    useAsTitle: 'title',
    defaultColumns: ['title', 'path'],
    description:
      'Edit rows and columns here. Saving the homepage (/) updates local and preview Astro. Saving does not publish the public website.',
    components: {
      beforeListTable: ['/components/ReadinessBoard#ReadinessList'],
    },
  },
  access: {
    read: ({ req }) => Boolean(req.user),
    create: ({ req }) => Boolean(req.user),
    update: ({ req }) => Boolean(req.user),
    delete: ({ req }) => Boolean(req.user),
  },
  hooks: {
    beforeChange: [
      ({ data }) => {
        if (!data) return data
        const layout = data.layout
        if (layout && typeof layout === 'object') {
          const record = layout as { title?: unknown; path?: unknown }
          if (typeof record.title === 'string') data.title = record.title
          if (typeof record.path === 'string') data.path = record.path
        }
        return data
      },
    ],
    afterChange: [exportHomepageAfterChange],
  },
  fields: [
    {
      name: 'title',
      type: 'text',
      required: true,
      admin: { hidden: true },
    },
    {
      name: 'path',
      type: 'text',
      required: true,
      unique: true,
      admin: { hidden: true },
    },
    {
      name: 'layout',
      type: 'json',
      required: true,
      admin: {
        components: {
          Field: '/components/PayloadColumnField#PayloadColumnField',
        },
      },
    },
  ],
}
