import type { Post, ArchiveBlock as ArchiveBlockProps } from '@/payload-types'
import React from 'react'
import RichText from '@/components/RichText'
import { CollectionArchive } from '@/components/CollectionArchive'

// Assuming ArchiveBlockProps includes `populateBy`, `selectedDocs`, `limit`, `categories`
// And potentially a field like `populatedCollectionDocs` if populated by collection with depth > 0
// (Adjust `populatedCollectionDocs` if your actual populated field name differs)
export const ArchiveBlock: React.FC<
  ArchiveBlockProps & {
    id?: string
    // We might not need the explicit `posts?: Post[]` prop 
    // if ArchiveBlockProps correctly reflects populated data
  }
> = (props) => {
  // Destructure props based on ArchiveBlockProps type
  const {
    id,
    introContent,
    populateBy,
    selectedDocs,
    limit,
  } = props

  let postsToRender: Post[] = []

  if (populateBy === 'collection') {
    // If populated by collection, assume the server query (depth: 2)
    // made the posts available directly, potentially on a specific prop 
    // or implicitly fetched data needs mapping (check your types/payload logs)
    // For now, let's assume it's not directly on props and might require further type inspection
    // If you have a specific field name, use it here. Example:
    // postsToRender = (populatedCollectionDocs || []).slice(0, limit || 3);
    console.warn('[ArchiveBlock] populateBy="collection" relies on server-populated data. Verify data structure.')
    // Placeholder: Use selectedDocs as fallback or leave empty if collection population needs specific handling
    postsToRender = selectedDocs?.map(doc => doc.value as Post).filter(Boolean).slice(0, limit || 3) || []

  } else if (populateBy === 'selection') {
    // If populated by selection, the `value` should be the populated Post object
    postsToRender = selectedDocs?.map(doc => {
      if (typeof doc.value === 'object' && doc.value !== null) {
        return doc.value as Post;
      }
      return null;
    }).filter((post): post is Post => post !== null) || [];
  }

  // Limit posts if limit is specified
  if (limit && postsToRender.length > limit) {
    postsToRender = postsToRender.slice(0, limit);
  }

  return (
    <div className="my-16" id={`block-${id}`}>
      {introContent && (
        <div className="container mb-16">
          <RichText className="ml-0 max-w-[48rem]" data={introContent} enableGutter={false} />
        </div>
      )}
      <CollectionArchive posts={postsToRender} />
    </div>
  )
}