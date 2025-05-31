// src/app/api/estimates/latest/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { getPayload } from 'payload'
import configPromise from '@payload-config'

const PACKAGE_RATES = {
    standard: 1,
    wine: 1.5,
    hiking: 1.2,
    film: 2,
  }
  
export async function GET(req: NextRequest) {
  const userId = req.nextUrl.searchParams.get('userId')
  const slug = req.nextUrl.searchParams.get('slug')
  if (!slug) return NextResponse.json({ error: 'Missing slug' }, { status: 400 })

  const payload = await getPayload({ config: configPromise })
  if (!slug) return NextResponse.json({ error: 'Missing slug' }, { status: 400 })

    const where: any = [
      { 'post.slug': { equals: slug } }
    ]
    if (userId) {
      where.push({ customer: { equals: userId } })
    }
    
    const estimates = await payload.find({
      collection: 'estimates',
      where: { and: where },
      sort: '-createdAt',
      limit: 1,
      depth: 2,
    })
    const estimate = estimates.docs[0] || null

  // Infer packageType if not present
  if (estimate) {
    let packageType: string | null = null
    // If you have a title convention, try to extract it
    if (estimate.title) {
      const lower = estimate.title.toLowerCase()
      if (lower.includes('wine')) packageType = 'wine'
      else if (lower.includes('hiking')) packageType = 'hiking'
      else if (lower.includes('film')) packageType = 'film'
      else if (lower.includes('standard')) packageType = 'standard'
    }
    // Or infer from total and duration if you know the base rate
    if (!packageType && estimate.fromDate && estimate.toDate && estimate.total && estimate.post && typeof estimate.post === 'object') {
      const baseRate = estimate.post.baseRate || 150
      const duration = Math.ceil((new Date(estimate.toDate).getTime() - new Date(estimate.fromDate).getTime()) / (1000 * 60 * 60 * 24))
      for (const [key, multiplier] of Object.entries(PACKAGE_RATES)) {
        if (Math.abs(estimate.total - baseRate * duration * (multiplier as number)) < 1) {
          packageType = key
          break
        }
      }
    }
    (estimate as any).packageType = packageType
  }

  return NextResponse.json(estimate)
}