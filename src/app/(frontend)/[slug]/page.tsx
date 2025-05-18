import type { Metadata } from 'next'
import { PayloadRedirects } from '@/components/PayloadRedirects'
import configPromise from '@payload-config'
import { getPayload } from 'payload'
import { draftMode } from 'next/headers'
import React, { cache } from 'react'
import { homeStatic } from '@/endpoints/seed/home-static'
import { redirect, notFound } from 'next/navigation'
import { getCachedRedirects } from '@/utilities/getRedirects'
import { getCachedDocument } from '@/utilities/getDocument'

import type { Page as PageType, Post } from '@/payload-types'

import { RenderBlocks } from '@/blocks/RenderBlocks'
import { RenderHero } from '@/heros/RenderHero'
import { generateMeta } from '@/utilities/generateMeta'
import PageClient from './page.client'
import { LivePreviewListener } from '@/components/LivePreviewListener'

export async function generateStaticParams() {
  const payload = await getPayload({ config: configPromise })
  const pages = await payload.find({
    collection: 'pages',
    draft: false,
    limit: 1000,
    pagination: false,
    select: {
      slug: true,
    },
  })

  const params = (pages.docs || [])
    .filter((doc) => doc?.slug && doc.slug !== 'home')
    .map(({ slug }) => ({ slug }))

  return params
}

type Args = {
  params: Promise<{
    slug?: string
  }>
}

export default async function Page({ params: paramsPromise }: Args) {
  const { isEnabled: draft } = await draftMode()
  const { slug = 'home' } = await paramsPromise
  const url = '/' + (slug === 'home' ? '' : slug)

  const redirects = await getCachedRedirects()()
  const redirectItem = redirects.find((r) => r.from === url)

  if (redirectItem) {
    if (redirectItem.to?.url) {
      redirect(redirectItem.to.url)
    }

    if (redirectItem.to?.reference?.value) {
      let redirectUrl: string | undefined;
      const { relationTo, value } = redirectItem.to.reference;

      if (typeof value === 'string') {
        const document = (await getCachedDocument(relationTo, value)()) as PageType | Post;
        if (document?.slug) {
          redirectUrl = `${relationTo !== 'pages' ? `/${relationTo}` : ''}/${document.slug}`; 
        }
      } else if (typeof value === 'object' && value?.slug) {
         redirectUrl = `${relationTo !== 'pages' ? `/${relationTo}` : ''}/${value.slug}`;
      }

      if (redirectUrl) {
        redirect(redirectUrl);
      }
    }
    console.warn(`Redirect found for ${url} but has invalid target.`);
  }

  let page: PageType | null

  page = await queryPageBySlug({
    slug,
  })

  if (!page && slug === 'home') {
    page = homeStatic
  }

  if (!page) {
    return <PageClient page={page} draft={draft} url={url} />
  }

  return <PageClient page={page} draft={draft} url={url} />
}

export async function generateMetadata({ params: paramsPromise }): Promise<Metadata> {
  const { slug = 'home' } = await paramsPromise
  const page = await queryPageBySlug({
    slug,
  })

  return generateMeta({ doc: page })
}

const queryPageBySlug = cache(async ({ slug }: { slug: string }) => {
  const { isEnabled: draft } = await draftMode()

  const payload = await getPayload({ config: configPromise })

  const result = await payload.find({
    collection: 'pages',
    draft,
    depth: 2,
    limit: 1,
    pagination: false,
    where: {
      slug: {
        equals: slug,
      },
    },
  })

  return result.docs?.[0] || null
})
