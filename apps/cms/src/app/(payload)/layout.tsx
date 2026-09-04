/* THIS FILE WAS GENERATED FOR PAYLOAD v3 — the admin panel and the REST/GraphQL
 * API are mounted as a Next.js route group. Keep it in sync with
 * `@payloadcms/next` when upgrading Payload. */
import type { ServerFunctionClient } from 'payload';

import config from '@payload-config';
import { handleServerFunctions, RootLayout } from '@payloadcms/next/layouts';
import React from 'react';

import { importMap } from './admin/importMap.js';

import '@payloadcms/next/css';

type Args = {
  children: React.ReactNode;
};

const serverFunction: ServerFunctionClient = async function (args) {
  'use server';
  return handleServerFunctions({
    ...args,
    config,
    importMap,
  });
};

const Layout = ({ children }: Args) => (
  <RootLayout config={config} importMap={importMap} serverFunction={serverFunction}>
    {children}
  </RootLayout>
);

export default Layout;
