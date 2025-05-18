import type React from 'react'
// Remove unused type imports
// import type { Page, Post } from '@/payload-types'

// Remove unused utility imports
// import { getCachedDocument } from '@/utilities/getDocument'
// import { getCachedRedirects } from '@/utilities/getRedirects'
import { notFound } from 'next/navigation' // Keep notFound
// Remove redirect as it's handled server-side
// import { redirect } from 'next/navigation'

interface Props {
  disableNotFound?: boolean
  url: string // Keep url prop for type compatibility for now
}

/* This component helps us with SSR based dynamic redirects */
export const PayloadRedirects: React.FC<Props> = ({ disableNotFound, url }) => {
  // All redirect logic is removed and handled server-side

  // If this component renders and disableNotFound is false, call notFound
  if (!disableNotFound) {
    notFound()
  }

  // Otherwise, render nothing
  return null
}
