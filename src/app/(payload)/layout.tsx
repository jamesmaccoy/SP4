/* THIS FILE WAS GENERATED AUTOMATICALLY BY PAYLOAD. */
/* DO NOT MODIFY IT BECAUSE IT COULD BE REWRITTEN AT ANY TIME. */
import config from '@payload-config'
import '@payloadcms/next/css'
import { handleServerFunctions, RootLayout } from '@payloadcms/next/layouts'
import React from 'react'
import { UploadHandlersProvider } from '@payloadcms/ui/providers/UploadHandlers'
import type { ServerFunctionClient } from 'payload'
import { importMap } from './admin/importMap.js'
import './custom.scss'

type Args = {
  children: React.ReactNode
}

// Infer the type from the imported function
type InferredServerFunction = typeof handleServerFunctions;
// Then, if handleServerFunctions itself is not the direct type you assign,
// but rather the function it returns or similar, you might need to extract
// the return type or a more specific signature if available from its JSDoc or definition.
// For now, let's assume the prop expects something compatible with handleServerFunctions.

const serverFunction: ServerFunctionClient = async function (args) {
  'use server'
  // Note: handleServerFunctions might be intended to be assigned directly,
  // or it might be a factory. The original code `const serverFunction = handleServerFunctions`
  // suggests it might be assignable directly if its signature matches what RootLayout expects.
  // The explicit async wrapper is often used to ensure 'use server' is at the top level of the server action.

  return handleServerFunctions({ // Calling it here implies it's a factory or needs to be wrapped.
    ...args,
    config,
    importMap,
  })
}

const Layout = ({ children }: Args) => (
  <RootLayout config={config} importMap={importMap} serverFunction={serverFunction}>
    <UploadHandlersProvider>{children}</UploadHandlersProvider>
  </RootLayout>
)

export default Layout