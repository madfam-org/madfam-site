import type { CollectionConfig } from 'payload';

import { authenticated, publishedOrAuthenticated } from '../access/index.ts';
import { mirrorDraftStatus } from '../hooks/mirrorDraftStatus.ts';

export const CaseStudies: CollectionConfig = {
  slug: 'case-studies',
  admin: {
    useAsTitle: 'title',
    defaultColumns: ['title', 'client', '_status', 'updatedAt'],
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
  hooks: {
    beforeChange: [mirrorDraftStatus],
  },
  fields: [
    {
      name: 'title',
      type: 'text',
      required: true,
      localized: true,
    },
    {
      name: 'slug',
      type: 'text',
      required: true,
      unique: true,
    },
    {
      name: 'client',
      type: 'text',
      required: true,
    },
    {
      // Mirror of `_status`; see BlogPosts.
      name: 'status',
      type: 'select',
      defaultValue: 'draft',
      index: true,
      enumName: 'enum_case_studies_content_status',
      admin: {
        hidden: true,
      },
      options: [
        { label: 'Draft', value: 'draft' },
        { label: 'Published', value: 'published' },
      ],
    },
    {
      name: 'summary',
      type: 'textarea',
      required: true,
      localized: true,
    },
    {
      name: 'content',
      type: 'richText',
      required: true,
      localized: true,
    },
  ],
};
