import type { CollectionConfig } from 'payload'

// import { anyone } from '../access/anyone'
import { slugField } from '@/fields/slug'
import { isAdmin } from '@/access/isAdmin'

export const Categories: CollectionConfig = {
  slug: 'categories',
  access: {
    create: isAdmin,
    delete: isAdmin,
    read: isAdmin,
    update: isAdmin,
  },
  admin: {
    useAsTitle: 'title',
  },
  fields: [
    {
      name: 'title',
      type: 'text',
      required: true,
    },
    ...slugField(),
  ],
}
