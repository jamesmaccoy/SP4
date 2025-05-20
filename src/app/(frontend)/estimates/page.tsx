import { Where } from 'payload'
import configPromise from '@payload-config'
import React from 'react'
import { Post, User } from '@/payload-types'
import { getMeUser } from '@/utilities/getMeUser'
import PageClient from '../estimates/page.client'
import EstimateCard from '@/components/Estimates/EstimateCard'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { getPayload } from 'payload'
// import { EstimatesList } from './EstimatesList'

export default async function Estimates() {
  const { user } = await getMeUser()

  if (!user) {
    redirect('/login?next=/estimates')
  }

  const [upcomingEstimates, pastEstimates] = await Promise.all([
    getEstimates('upcoming', user),
    getEstimates('past', user),
  ])

  const formattedUpcomingEstimates = upcomingEstimates.docs.map((estimate) => ({
    ...(estimate.post as Pick<Post, 'meta' | 'slug' | 'title'>),
    fromDate: estimate.fromDate,
    toDate: estimate.toDate,
    guests: estimate.guests,
    id: estimate.id,
  }))

  const formattedPastEstimates = pastEstimates.docs.map((estimate) => ({
    ...(estimate.post as Pick<Post, 'meta' | 'slug' | 'title'>),
    fromDate: estimate.fromDate,
    toDate: estimate.toDate,
    guests: estimate.guests,
    id: estimate.id,
  }))

  return (
    <>
      <PageClient />
      <div className="my-10 container space-y-10">
        <div className="flex justify-end mb-6">
          <Link href="/bookings">
            <Button variant="default">Bookings</Button>
          </Link>
        </div>

        {upcomingEstimates.docs.length === 0 && pastEstimates.docs.length === 0 ? (
          <div className="text-center py-10">
            <h2 className="text-4xl font-medium tracking-tighter mb-4">No estimates</h2>
            <p className="text-muted-foreground">
              You don&apos;t have any upcoming or past estimates.
            </p>
          </div>
        ) : (
          <>
            <div>
              {upcomingEstimates.docs.length > 0 && (
                <h2 className="text-4xl font-medium tracking-tighter my-6">Upcoming estimates</h2>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-2">
                {formattedUpcomingEstimates.map((estimate) => (
                  <EstimateCard key={estimate.id} estimate={estimate} />
                ))}
              </div>
            </div>

            {pastEstimates.docs.length > 0 && (
              <h2 className="text-4xl font-medium tracking-tighter my-6">Past estimates</h2>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-2">
              {formattedPastEstimates.map((estimate) => (
                <EstimateCard key={estimate.id} estimate={estimate} />
              ))}
            </div>
          </>
        )}
      </div>
    </>
  )
}

const getEstimates = async (type: 'upcoming' | 'past', currentUser: User) => {
  const payload = await getPayload({ config: configPromise })

  let whereQuery: Where

  if (type === 'upcoming') {
    whereQuery = {
      and: [
        {
          fromDate: {
            greater_than_equal: new Date(),
          },
        },
        {
          customer: {
            equals: currentUser.id,
          },
        },
      ],
    }
  } else {
    whereQuery = {
      and: [
        {
          fromDate: {
            less_than: new Date(),
          },
        },
        {
          customer: {
            equals: currentUser.id,
          },
        },
      ],
    }
  }

  const estimates = await payload.find({
    collection: 'estimates',
    limit: 100,
    where: whereQuery,
    depth: 2,
    sort: '-fromDate',
    select: {
      slug: true,
      post: true,
      guests: true,
      fromDate: true,
      toDate: true,
    },
  })

  return estimates
} 