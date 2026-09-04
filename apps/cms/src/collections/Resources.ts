import type { CollectionConfig } from 'payload';

import { authenticated, publishedOrAuthenticated } from '../access/index.ts';

export const Resources: CollectionConfig = {
  slug: 'resources',
  admin: {
    useAsTitle: 'title',
    defaultColumns: ['title', 'type', '_status', 'updatedAt'],
  },
  access: {
    read: publishedOrAuthenticated,
    create: authenticated,
    update: authenticated,
    delete: authenticated,
  },
  versions: {
    drafts: true,
  },
  fields: [
    {
      name: 'title',
      type: 'text',
      required: true,
      localized: true,
    },
    {
      name: 'type',
      type: 'select',
      required: true,
      options: [
        { label: 'Whitepaper', value: 'whitepaper' },
        { label: 'Guide', value: 'guide' },
        { label: 'Template', value: 'template' },
        { label: 'Ebook', value: 'ebook' },
        { label: 'Webinar', value: 'webinar' },
      ],
    },
    {
      name: 'description',
      type: 'textarea',
      required: true,
      localized: true,
    },
    {
      name: 'file',
      type: 'upload',
      relationTo: 'media',
      required: true,
    },
    {
      name: 'gated',
      type: 'checkbox',
      defaultValue: true,
      admin: {
        description: 'Require form submission to download',
      },
    },
  ],
};
