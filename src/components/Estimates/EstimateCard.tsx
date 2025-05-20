import { type Media as MediaType, User } from '@/payload-types'
import { formatDate } from 'date-fns'
import { CalendarIcon, UsersIcon } from 'lucide-react'
import Link from 'next/link'
import React, { FC } from 'react'
import { Media } from '../Media'
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card'

type Props = {
  estimate: {
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
        }
      | undefined
  }
}

const EstimateCard: FC<Props> = ({ estimate }) => {
  return (
    <Link key={estimate.id} href={`/estimates/${estimate.id}`}>
      <Card className="h-full hover:shadow-md transition-shadow">
        <div className="relative flex gap-3 p-2">
          <div className="relative w-24 h-24 flex-shrink-0">
            {!estimate.meta?.image && <div className="w-full h-full bg-muted flex items-center justify-center rounded-md">No Image</div>}
            {estimate.meta?.image && typeof estimate.meta?.image !== 'string' && (
              <>
                <Media resource={estimate.meta.image} size="25vw" className="w-full h-full object-cover rounded-md" />
                {estimate.guests && estimate.guests?.length > 0 && (
                  <div className="absolute bottom-1 right-1 bg-background/90 backdrop-blur-sm px-2 py-1 rounded-md flex items-center gap-1">
                    <UsersIcon className="size-4" />
                    <span className="text-sm font-medium">{estimate.guests?.length}</span>
                  </div>
                )}
              </>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <CardTitle className="text-xl mb-1">{estimate.title}</CardTitle>
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-muted-foreground">
                <CalendarIcon className="size-4" />
                <div className="text-sm">
                  {formatDate(new Date(estimate.fromDate), 'PPP')} -{' '}
                  {formatDate(new Date(estimate.toDate), 'PPP')}
                </div>
              </div>
            </div>
          </div>
        </div>
      </Card>
    </Link>
  )
}

export default EstimateCard
