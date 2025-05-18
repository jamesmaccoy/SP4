'use client'

import React, { Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useUserContext } from '@/context/UserContext'
import { useSubscription } from '@/hooks/useSubscription'
import { Button } from '@/components/ui/button'
import JoinClient from './page.client'

export default function JoinPage() {
  const router = useRouter()
  const { currentUser, isLoading: isUserLoading } = useUserContext()
  const { isSubscribed, isLoading: isSubscriptionLoading, error } = useSubscription()

  // Only redirect if we're certain about both user and subscription status
  React.useEffect(() => {
    // Don't do anything while either context is loading
    if (isUserLoading || isSubscriptionLoading) {
      return
    }

    // Now we can be certain about the states
    if (!currentUser) {
      console.log('No user found, redirecting to login')
      router.push('/login')
      return
    }

    if (!error && !isSubscribed) {
      console.log('User not subscribed, redirecting to subscribe')
      router.push('/subscribe')
      return
    }
  }, [currentUser, isSubscribed, isUserLoading, isSubscriptionLoading, error, router])

  // Show loading state while either context is loading
  if (isUserLoading || isSubscriptionLoading) {
    return (
      <div className="container py-12">
        <h1 className="text-3xl font-bold mb-6">Join</h1>
        <p>Loading...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="container py-12">
        <h1 className="text-3xl font-bold mb-6">Join</h1>
        <p className="text-error">Error: {error.message}</p>
      </div>
    )
  }

  // Don't show content unless we have a user and they're subscribed
  if (!currentUser || !isSubscribed) {
    return (
      <div className="container py-12">
        <h1 className="text-3xl font-bold mb-6">Join</h1>
        <p>Verifying access...</p>
      </div>
    )
  }

  return (
    <>
      <Suspense fallback={<JoinClient />}>
        <JoinInner />
      </Suspense>
    </>
  )
}

// New component to contain logic using useSearchParams
function JoinInner() {
  const searchParams = useSearchParams()
  const bookingTotal = searchParams.get('total') ?? 'N/A'
  const bookingDuration = searchParams.get('duration') ?? 'N/A'

  return (
    <>
      {/* Booking Summary Header */}
      <div className="pt-12 pb-6">
        <div className="bg-muted p-6 rounded-lg border border-border mb-6 text-center">
          <h2 className="text-3xl font-semibold mb-2">R{bookingTotal}</h2>
          <p className="text-lg text-muted-foreground">Total for {bookingDuration} nights</p>
        </div>
      </div>
      {/* The actual premium content */}
      <JoinClient bookingTotal={bookingTotal} bookingDuration={bookingDuration} />
    </>
  )
}

// Simple loading component for the Suspense fallback
function JoinLoading() {
  return (
    <div className="container py-12 text-center">
      <p>Loading booking details...</p>
    </div>
  )
}