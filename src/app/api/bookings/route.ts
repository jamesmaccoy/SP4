// app/api/bookings/route.ts
import { NextResponse } from 'next/server'
import { getPayload } from 'payload'
import { getMeUser } from '@/utilities/getMeUser'
import config from '@payload-config'
import type { Booking } from '@/payload-types'

export async function POST(req: Request) {
  try {
    const currentUser = await getMeUser()
    if (!currentUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const payload = await getPayload({ config })
    const data = await req.json()
    
    const { postId, fromDate, toDate } = data

    // Create booking in Payload CMS
    const booking = await payload.create({
      collection: "bookings",
      data: {
        title: `Booking for ${currentUser.user.email}`,
        post: postId,
        fromDate,
        toDate,
        customer: currentUser.user.id,
        token: Math.random().toString(36).substring(2, 15),
        paymentStatus: 'unpaid'
      },
    })

    return NextResponse.json(booking)
  } catch (error) {
    console.error('Error creating booking:', error)
    return NextResponse.json(
      { error: 'Failed to create booking' },
      { status: 500 }
    )
  }
}