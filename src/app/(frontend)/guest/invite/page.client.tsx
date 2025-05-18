'use client'

import { Button } from '@/components/ui/button'
import {
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
  Card,
} from '@/components/ui/card'
import { Booking } from '@/payload-types'
import { formatDateTime } from '@/utilities/formatDateTime'

import { CheckIcon, CircleAlert, Loader2Icon } from 'lucide-react'
import Link from 'next/link'
import { notFound, useRouter } from 'next/navigation'
import React from 'react'

type Props = {
  booking: Pick<Booking, 'post' | 'fromDate' | 'createdAt' | 'customer'>
  tokenPayload: Record<string, string>
  token: string
}

export default function InviteClientPage({ booking, tokenPayload, token }: Props) {
  if (
    typeof booking.post === 'string' ||
    typeof booking.customer === 'string' ||
    !('bookingId' in tokenPayload)
  ) {
    notFound()
  }

  const router = useRouter()

  const [isLoading, setIsLoading] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)

  const handleInviteAccept = async () => {
    try {
      setIsLoading(true)
      const res = await fetch(`/api/bookings/${tokenPayload.bookingId}/accept-invite/${token}`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      const data = await res.json()

      if (!res.ok) {
        console.error('Error accepting invite:', res.statusText)
        setError(data.message || 'Unknown error')
        return
      }

      router.push(`/bookings/${tokenPayload.bookingId}`)
    } catch (err) {
      console.error('Error accepting invite:', err)
    } finally {
      setIsLoading(false)
    }
  }

  if (error) {
    return (
      <div className="border-2 flex items-center gap-6 mt-10 flex-col border-red-500 bg-red-100 max-w-[450px] w-full mx-auto p-6 rounded-xl ">
        <div>
          <CircleAlert className="size-8" />
        </div>
        <div className="text-center">
          <h2 className="text-lg font-medium tracking-tight">Something went wrong</h2>
          <p className="tracking-wide ">{error}</p>
        </div>
        <Button asChild variant="default" className="w-full">
          <Link href={'/'}>Return Home</Link>
        </Button>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-screen-md my-10">
      <Card>
        <CardHeader>
          <CardTitle>
            Join <strong>{booking.post.title}</strong> as a guest
          </CardTitle>
          <CardDescription>
            You have been invited by <strong>{booking.customer?.name}</strong> to join them on this
            booking.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-start gap-10">
            <p className="text-lg font-medium">Date Booked: {formatDateTime(booking.createdAt)}</p>
            <p className="text-lg font-medium">Arrival Date: {formatDateTime(booking.fromDate)}</p>
          </div>
        </CardContent>
        <CardFooter>
          <Button onClick={handleInviteAccept} disabled={isLoading}>
            {!isLoading ? (
              <>
                <CheckIcon className="size-4 mr-2" />
                Accept Invitation
              </>
            ) : (
              <>
                <Loader2Icon className="animate-spin mr-2" />
                <span>Accepting...</span>
              </>
            )}
          </Button>
        </CardFooter>
      </Card>
    </div>
  )
}
