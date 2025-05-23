// src/pages/api/estimates.ts (or /app/api/estimates/route.ts for app router)
import { getPayload } from 'payload'
import configPromise from '@/payload.config'

export async function POST(request: Request) {
  const body = await request.json();
  const { postId, fromDate, toDate, guests, title, total, customer } = body;
  // You may want to get the user from the session/auth

  const payload = await getPayload({ config: configPromise });

  let postRef = postId;

  // If postId is not a valid ObjectId, look up the post by slug
  if (!/^[a-f\d]{24}$/i.test(postId)) {
    const post = await payload.find({
      collection: 'posts',
      where: { slug: { equals: postId } },
      limit: 1,
    });
    if (!post.docs.length) {
      return new Response(JSON.stringify({ error: 'Post not found' }), { status: 400, headers: { 'Content-Type': 'application/json' } });
    }
    postRef = post.docs[0].id;
  }

  // Check for existing estimate for this post/customer/dates
  const existing = await payload.find({
    collection: 'estimates',
    where: {
      post: { equals: postRef },
      customer: { equals: customer },
      fromDate: { equals: fromDate },
      toDate: { equals: toDate }
    },
    limit: 1,
  });
  if (existing.docs.length) {
    return new Response(JSON.stringify(existing.docs[0]), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  // Create new estimate
  const estimate = await payload.create({
    collection: 'estimates',
    data: {
      title: title || `Estimate for ${postRef}`,
      post: postRef,
      fromDate,
      toDate,
      guests,
      total,
      customer,
    },
  });

  return new Response(JSON.stringify(estimate), {
    status: 201,
    headers: { 'Content-Type': 'application/json' },
  });
}