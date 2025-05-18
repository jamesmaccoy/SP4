import { type Media as MediaType, User } from '@/payload-types'
import { formatDate } from 'date-fns'
import { CalendarIcon, UsersIcon } from 'lucide-react'
import Link from 'next/link'
import React, { FC } from 'react'
import { Media } from '../Media'

type Props = {
  booking: {
    fromDate: string
    toDate: string
    guests: (string | User)[] | null | undefined
    id: string
    slug?: string | null | undefined
    title: string
    meta?:
      | {
          title?: string | null | undefined
          image?: string | MediaType | null | undefined
          description?: string | null | undefined
        }
      | undefined
  }
}

const BookingCard: FC<Props> = ({ booking }) => {
  return (
    <Link key={booking.id} href={`/bookings/${booking.id}`}>
      <div className="flex flex-col gap-4 border border-border bg-card h-full">
        <div className="relative w-full">
          {!booking.meta?.image && <div>No Image</div>}
          {booking.meta?.image && typeof booking.meta?.image !== 'string' && (
            <Media resource={booking.meta.image} size="33vw" />
          )}
        </div>
        <div className="p-4">
          <h3 className="text-2xl font-medium">{booking.title}</h3>
          <p className="my-2">{booking.meta?.description}</p>
          <div
            className="flex items-center gap-2 font-medium
        "
          >
            <div>
              <CalendarIcon className="size-4" />
            </div>
            <div className="text-sm font-medium">
              {formatDate(new Date(booking.fromDate), 'PPP')} -{' '}
              {formatDate(new Date(booking.toDate), 'PPP')}
            </div>
          </div>
          {booking.guests && booking.guests?.length > 0 && (
            <div className="flex items-center gap-2">
              <div>
                <UsersIcon className="size-4" />
              </div>
              <div className="font-medium text-sm">{booking.guests?.length} Guests</div>
            </div>
          )}
        </div>
      </div>
    </Link>
  )
}

export default BookingCard
