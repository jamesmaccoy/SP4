'use client'

import { Media } from '@/components/Media'
import { Booking, User } from '@/payload-types'
import { formatDateTime } from '@/utilities/formatDateTime'
import { PlusCircleIcon, TrashIcon, UserIcon } from 'lucide-react'
import React from 'react'
import InviteUrlDialog from './_components/invite-url-dialog'
import { Button } from '@/components/ui/button'

type Props = {
  data: Booking
  user: User
}

export default function BookingDetailsClientPage({ data, user }: Props) {
  const [removedGuests, setRemovedGuests] = React.useState<string[]>([])

  const removeGuestHandler = async (guestId: string) => {
    const res = await fetch(`/api/bookings/${data.id}/guests/${guestId}`, {
      method: 'DELETE',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
      },
    })

    if (!res.ok) {
      console.error('Error removing guest:', res.statusText)
      return
    }

    setRemovedGuests((prev) => [...prev, guestId])
  }

  return (
    <div className="container my-10">
      {data && 'post' in data && typeof data?.post !== 'string' ? (
        <div className="flex items-start flex-col md:flex-row gap-5 md:gap-10">
          <div className="md:max-w-[450px] w-full rounded-md overflow-hidden">
            {!!data?.post.meta?.image && <Media resource={data?.post.meta?.image || undefined} />}
          </div>
          <div className="md:py-5 py-3">
            <h1 className="text-4xl mb-3 font-bold">{data?.post.title}</h1>

            <p className="text-lg font-medium">
              Date Booked: {formatDateTime(data?.post.createdAt)}
            </p>
            <p className="text-lg font-medium">Arrival Date: {formatDateTime(data?.fromDate)}</p>
          </div>
        </div>
      ) : (
        <div>Error loading booking details</div>
      )}

      <div className="mt-10 max-w-screen-md mx-auto">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold">Guests</h2>

          {data &&
            'customer' in data &&
            typeof data?.customer !== 'string' &&
            data.customer?.id === user.id && (
              <InviteUrlDialog
                bookingId={data.id}
                trigger={
                  <Button>
                    <PlusCircleIcon className="size-4 mr-2" />
                    <span>Invite</span>
                  </Button>
                }
              />
            )}
        </div>

        <div className="mt-2 space-y-3">
          <div className="shadow-sm p-2 border border-border rounded-lg flex items-center gap-2">
            <div className="p-2 border border-border rounded-full">
              <UserIcon className="size-6" />
            </div>
            <div>
              <div>{typeof data.customer === 'string' ? 'Customer' : data.customer?.name}</div>
              <div className="font-medium text-sm">Customer</div>
            </div>
          </div>

          {data.guests
            ?.filter((guest) =>
              typeof guest === 'string'
                ? !removedGuests.includes(guest)
                : !removedGuests.includes(guest.id),
            )
            ?.map((guest) => {
              if (typeof guest === 'string') {
                return <div key={guest}>{guest}</div>
              }

              return (
                <div
                  key={guest.id}
                  className="shadow-sm p-2 border border-border rounded-lg flex items-center gap-2 justify-between"
                >
                  <div className="flex items-center gap-2">
                    <div className="p-2 border border-border rounded-full">
                      <UserIcon className="size-6" />
                    </div>
                    <div>
                      <div>{guest.name}</div>
                      <div className="font-medium text-sm">Guest</div>
                    </div>
                  </div>
                  {data &&
                    'customer' in data &&
                    typeof data?.customer !== 'string' &&
                    data.customer?.id === user.id && (
                      <Button
                        variant="secondary"
                        size="icon"
                        onClick={() => removeGuestHandler(guest.id)}
                      >
                        <TrashIcon className="size-4" />
                        <span className="sr-only">Remove Guest</span>
                      </Button>
                    )}
                </div>
              )
            })}
        </div>
      </div>
    </div>
  )
}
