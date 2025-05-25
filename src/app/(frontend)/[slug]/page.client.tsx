"use client"

import React, { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useUserContext } from '@/context/UserContext'
import { useSubscription } from '@/hooks/useSubscription'
import { useHeaderTheme } from '@/providers/HeaderTheme'
import type { Page as PageType } from '@/payload-types'
import { RenderHero } from '@/heros/RenderHero'
import { RenderBlocks } from '@/blocks/RenderBlocks'
import { LivePreviewListener } from '@/components/LivePreviewListener'
import { PayloadRedirects } from '@/components/PayloadRedirects'
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Button } from "@/components/ui/button"
import { CalendarIcon, Wine, BedDouble } from "lucide-react"
import { format } from "date-fns"
import { cn } from "@/lib/utils"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { calculateTotal } from '@/lib/calculateTotal'

export interface PageClientProps {
  page: PageType | null
  draft: boolean
  url: string
  baseRate?: number
}

// Refactor: Only render one PackageBlock, which manages its own tab state and renders the tabs inside itself
const PackageBlock = ({ currentUser, router, baseRate = 150 }) => {
  const [selectedTab, setSelectedTab] = useState('standard')
  const [startDate, setStartDate] = useState<Date | null>(new Date())
  const [endDate, setEndDate] = useState<Date | null>(new Date(new Date().setDate(new Date().getDate() + 5)))
  const [loading, setLoading] = useState(false)

  const packages = {
    standard: {
      title: "Standard Package",
      features: ["Standard accommodation", "Basic amenities", "Self-service"],
      rate: baseRate
    },
    wine: {
      title: "Wine Experience",
      features: ["Standard accommodation", "Wine tasting experience", "Curated wine selection", "Sommelier consultation"],
      rate: baseRate * 1.5
    }
  }
  const pkg = packages[selectedTab]

  // Calculate duration
  let duration = 5
  if (startDate && endDate && !isNaN(startDate.getTime()) && !isNaN(endDate.getTime())) {
    const diffTime = Math.abs(endDate.getTime() - startDate.getTime())
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    if (diffDays > 0) duration = diffDays
  }
  const total = calculateTotal(pkg.rate, duration, 1)

  return (
    <div className="block bg-card shadow p-6 flex flex-col items-left">
      {/* Tabs and button on the same row */}
      <div className="flex flex-row items-center justify-between mb-8 gap-4 w-full max-w-md">
        <Tabs value={selectedTab} onValueChange={setSelectedTab} className="flex-1">
          <TabsList className="bg-muted p-2 rounded-full flex flex-row gap-2">
            <TabsTrigger value="standard" className="px-3 py-2 text-base font-medium rounded-full data-[state=active]:bg-secondary data-[state=active]:text-foreground data-[state=inactive]:text-muted-foreground transition-colors shadow-none flex items-center justify-center">
              <BedDouble className="h-5 w-5" />
            </TabsTrigger>
            <TabsTrigger value="wine" className="px-3 py-2 text-base font-medium rounded-full data-[state=active]:bg-secondary data-[state=active]:text-foreground data-[state=inactive]:text-muted-foreground transition-colors shadow-none flex items-center justify-center">
              <Wine className="h-5 w-5" />
            </TabsTrigger>
          </TabsList>
        </Tabs>
        <Button
          variant="default"
          className="px-4 py-2 whitespace-nowrap"
          disabled={loading}
          onClick={async () => {
            setLoading(true)
            const postId = window.location.pathname.split('/').pop()
            const res = await fetch('/api/estimates', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                postId,
                fromDate: startDate,
                toDate: endDate,
                guests: [],
                customer: currentUser?.id,
                packageType: selectedTab,
                total: total,
              }),
            })
            setLoading(false)
            if (res.ok) {
              const estimate = await res.json()
              router.push(`/estimate/${estimate.id}`)
            } else {
              alert('Failed to create estimate')
            }
          }}
        >
          {loading ? 'Requesting...' : 'Request Availability'}
        </Button>
      </div>
      {/* Stay Length Form */}
      <div className="flex flex-col space-y-2 w-full max-w-md mb-6">
        <label className="text-gray-700 font-medium">Stay Length</label>
        <div className="flex space-x-2">
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant={"outline"}
                className={cn(
                  "w-full justify-start text-left font-normal",
                  !startDate && "text-muted-foreground"
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {startDate ? format(startDate, "PPP") : <span>Pick a date</span>}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0">
              <Calendar
                mode="single"
                selected={startDate || undefined}
                onSelect={(date) => setStartDate(date || null)}
                initialFocus
                disabled={(date) => date < new Date()}
              />
            </PopoverContent>
          </Popover>
          <span className="text-gray-500 self-center">to</span>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant={"outline"}
                className={cn(
                  "w-full justify-start text-left font-normal",
                  !endDate && "text-muted-foreground"
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {endDate ? format(endDate, "PPP") : <span>Pick a date</span>}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0">
              <Calendar
                mode="single"
                selected={endDate || undefined}
                onSelect={(date) => setEndDate(date || null)}
                initialFocus
                disabled={(date) => !startDate || date < startDate}
              />
            </PopoverContent>
          </Popover>
        </div>
      </div>
      <h3 className="text-xl font-semibold mb-2">{pkg.title}</h3>
      <ul className="mb-4 list-disc pl-5 text-gray-700">
        {pkg.features.map((f, i) => <li key={i}>{f}</li>)}
        <li>
          <span className="font-bold">Total:</span> R{total.toFixed(2)}
        </li>
        <li>
          <span className="font-bold">Post ID:</span> {window.location.pathname.split('/').pop()}
        </li>
        <li>
          <a
            href={`/posts/${window.location.pathname.split('/').pop()}`}
            className="text-primary underline"
            rel="noopener noreferrer"
          >
            /posts/{window.location.pathname.split('/').pop()}
          </a>
        </li>
      </ul>
    </div>
  )
}

const PageClient: React.FC<PageClientProps> = ({ page, draft, url, baseRate }) => {
  const { setHeaderTheme } = useHeaderTheme()
  const router = useRouter()
  const { currentUser, isLoading: isUserLoading } = useUserContext()
  const { isSubscribed, entitlements, isLoading: isSubscriptionLoading } = useSubscription('pro')

  const isPublicPage = url === '/' || url === '/terms-and-conditions'

  useEffect(() => {
    setHeaderTheme('light')
  }, [setHeaderTheme])

  useEffect(() => {
    if (isPublicPage) return

    if (isUserLoading) {
      console.log('User context loading...')
      return
    }

    if (!currentUser) {
      console.log('User context loaded, user not found, redirecting subscribe.')
      router.push('/subscribe')
      return
    }

    if (isSubscriptionLoading) {
      console.log('Subscription context loading...')
      return
    }

    if (!isSubscribed) {
      console.log('User authenticated but not subscribed, redirecting to subscribe.')
      router.push('/subscribe')
    }
  }, [currentUser, isUserLoading, isSubscribed, isSubscriptionLoading, router, isPublicPage, url])

  if (!page) {
    return <PayloadRedirects url={url} disableNotFound={false} />
  }

  if (!isPublicPage) {
    if (isUserLoading || isSubscriptionLoading) {
      return (
        <div className="container py-12">
          <p>Loading user data...</p>
        </div>
      )
    }

    if (!isSubscribed) {
      return (
        <div className="container py-12">
          <p className="text-error">Error loading subscription: User not subscribed</p>
        </div>
      )
    }
  }

  const shouldRenderContent = isPublicPage || (currentUser && isSubscribed)

  if (shouldRenderContent) {
    const { hero, layout } = page

    const isCustomer = currentUser?.role?.includes('customer')

    return (
      <article className="pt-16 pb-24">
        {draft && <LivePreviewListener />}

        { /* Pro entitlement for revenuecat */}
        <div className="container mt-8 flex flex-col items-center space-y-4">
          <div className="w-full max-w-2xl mt-8">
            {isCustomer && isSubscribed && entitlements.includes('pro') ? (
              <PackageBlock currentUser={currentUser} router={router} baseRate={baseRate} />
            ) : isSubscriptionLoading ? (
              <div className="text-center text-muted-foreground py-12">Checking subscription...</div>
            ) : (
              <div className="text-center text-muted-foreground py-12"><a href='/subscribe' className='text-primary underline'>Stay at our self built cabins.</a></div>
            )}
          </div>
        </div>

        {/* Render hero and blocks */}
        <RenderHero {...hero} />
        <RenderBlocks blocks={layout} />
      </article>
    )
  }

  return (
    <div className="container py-12">
      <p>Checking access...</p>
    </div>
  )
}

export default PageClient