"use client"

import React, { useEffect, useState, useRef } from 'react'
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
import { CalendarIcon, Wine, BedDouble, Mountain, Camera } from "lucide-react"
import { format } from "date-fns"
import { cn } from "@/lib/utils"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { calculateTotal } from '@/lib/calculateTotal'
import { GoogleGenAI } from "@google/genai";
import { Input } from '@/components/ui/input';

export interface PageClientProps {
  page: PageType | null
  draft: boolean
  url: string
  baseRate?: number
}

// Gemini AI Example (client-side only)
const ai = typeof window !== 'undefined' ? new GoogleGenAI({ apiKey: process.env.NEXT_PUBLIC_GEMINI_API_KEY || "AIzaSyAEQx7gPPm28A8kmsuFCaUCDcoYM08SL-E" }) : null;

const PackageBlock = ({ currentUser, router, baseRate = 150, heroImage }) => {
  const [selectedTab, setSelectedTab] = useState('standard')
  const [startDate, setStartDate] = useState<Date | null>(new Date())
  const [endDate, setEndDate] = useState<Date | null>(new Date(new Date().setDate(new Date().getDate() + 5)))
  const [loading, setLoading] = useState(false)
  const [hikeImage, setHikeImage] = useState<string | null>(null)

  // Gemini input and state moved here for access to setStartDate/setEndDate
  const [geminiInput, setGeminiInput] = useState("");
  const [geminiResult, setGeminiResult] = useState("");
  const [geminiLoading, setGeminiLoading] = useState(false);
  const [geminiPlaceholder, setGeminiPlaceholder] = useState("e.g. next Friday to Sunday");

  const postId = typeof window !== 'undefined' ? window.location.pathname.split('/').pop() : ''

  const [listening, setListening] = useState(false);
  const recognitionRef = useRef<SpeechRecognition | null>(null);

  useEffect(() => {
    if (selectedTab === 'hiking' && postId) {
      // Example: fetch image from /posts/{postId} (simulate with static image for now)
      // Replace this with a real fetch if you have an API
      setHikeImage('https://llandudnoshack.co.za/images/Gallery-shack.jpg')
    }
  }, [selectedTab, postId])

  // Update placeholder and suggest input when package changes
  useEffect(() => {
    let placeholder = "e.g. next Friday to Sunday";
    let suggestion = "";
    if (selectedTab === "wine") {
      placeholder = "e.g. wine weekend next month";
      suggestion = "next month wine weekend";
    } else if (selectedTab === "hiking") {
      placeholder = "e.g. hiking trip this Saturday to Sunday";
      suggestion = "this Saturday to Sunday hiking";
    } else if (selectedTab === "film") {
      placeholder = "e.g. book film studio for 9am next Wednesday";
      suggestion = "next Wednesday 9am film studio";
    } else if (selectedTab === "standard") {
      placeholder = "e.g. next Friday to Sunday";
      suggestion = "next Friday to Sunday";
    }
    setGeminiPlaceholder(placeholder);
    setGeminiInput(""); // Optionally: setGeminiInput(suggestion);
  }, [selectedTab]);

  useEffect(() => {
    if (typeof window !== "undefined" && "webkitSpeechRecognition" in window) {
      // @ts-ignore
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.lang = "en-US";
      recognitionRef.current.interimResults = false;
      recognitionRef.current.maxAlternatives = 1;

      recognitionRef.current.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        setGeminiInput(transcript);
        setListening(false);
      };

      recognitionRef.current.onend = () => setListening(false);
      recognitionRef.current.onerror = () => setListening(false);
    }
  }, []);

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
    },
    hiking: {
      title: "Hiking Package",
      features: ["Standard accommodation", "Guided hike included", "Trail snacks", "Nature immersion"],
      rate: baseRate * 1.2
    },
    film: {
      title: "Film Studio",
      features: [
        "4-hour studio session",
        "Choose 9am or 1pm slot",
        "Professional lighting & backdrop",
        "Quiet environment"
      ],
      rate: baseRate * 2
    }
  }
  const pkg = packages[selectedTab] || packages["standard"]

  // Calculate duration
  let duration = 5
  if (startDate && endDate && !isNaN(startDate.getTime()) && !isNaN(endDate.getTime())) {
    const diffTime = Math.abs(endDate.getTime() - startDate.getTime())
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    if (diffDays > 0) duration = diffDays
  }
  const total = calculateTotal(pkg.rate, duration, 1)

  async function runGeminiDateParse() {
    if (!ai || !geminiInput) return;
    setGeminiLoading(true);
    setGeminiResult("");
    try {
      const today = new Date();
      const todayStr = today.toISOString().split('T')[0];
      let context = "";
      if (selectedTab === "film") {
        context = "The user wants to book a 4-hour film studio session, available at 9am or 1pm. Suggest the next available slot in the future.";
      } else if (selectedTab === "wine") {
        context = "The user wants a wine experience package, typically a weekend stay.";
      } else if (selectedTab === "hiking") {
        context = "The user wants a hiking package, typically a Saturday to Sunday stay.";
      } else {
        context = "The user wants a standard accommodation stay.";
      }
      const prompt = `Today is ${todayStr}. ${context} Extract the check-in and check-out dates from this booking request: "${geminiInput}". Return as JSON: {\"fromDate\": \"YYYY-MM-DD\", \"toDate\": \"YYYY-MM-DD\"}. Dates must be in the future, relative to today. If a specific time is relevant (like 9am or 1pm for film studio), include it in the JSON as {\"fromDate\":\"YYYY-MM-DDTHH:MM\",\"toDate\":\"YYYY-MM-DDTHH:MM\"}.`;
      const response = await ai.models.generateContent({
        model: "gemini-2.0-flash",
        contents: prompt,
      });
      let text = response.text || "";
      setGeminiResult(text);
      // Try to parse JSON from Gemini's response
      const match = text.match(/\{[\s\S]*\}/);
      if (match) {
        const json = JSON.parse(match[0]);
        if (json.fromDate && json.toDate) {
          setStartDate(new Date(json.fromDate));
          setEndDate(new Date(json.toDate));
        }
      }
    } catch (err) {
      setGeminiResult("Could not parse dates. Try a different phrase.");
    }
    setGeminiLoading(false);
  }

  return (
    <div className="block bg-card shadow p-6 flex flex-col items-left">
    

      {/* Stay Length Form */}
      <div className="flex flex-col space-y-2 w-full max-w-md mb-6">
        
        <label className="text-gray-700 font-medium">When where you thinking</label>
        {/* Gemini natural language input and button in a form */}
        <form
          onSubmit={e => {
            e.preventDefault();
            if (!geminiLoading && geminiInput) runGeminiDateParse();
          }}
          className="flex flex-col"
        >
          
         
          <div className="flex w-full max-w-sm items-center space-x-2">
          <Input
            type="text"
            placeholder={geminiPlaceholder}
            value={geminiInput}
            onChange={e => setGeminiInput(e.target.value || "")}
            className="mx-50"
          />
          <Button
            type="button"
            variant="ghost"
            onClick={() => {
              if (recognitionRef.current && !listening) {
                setListening(true);
                recognitionRef.current.start();
              }
            }}
            disabled={listening}
            aria-label="Speak your request"
          >
            {listening ? "Listening..." : <span role="img" aria-label="microphone">🎤</span>}
          </Button>
    </div>
        </form>
        
        <div>
        {geminiResult && (
          <div className="p-2 rounded text-sm">
            <p>Gemini Output:</p>
            <pre className="whitespace-pre-wrap">{geminiResult}</pre>
          </div>
        )}</div>

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
      {/* Package title, features, and image side by side */}
      <div className="flex flex-col sm:flex-row sm:items-start gap-6 mb-4">
        <div className="flex-1">
          <h3 className="text-xl font-semibold mb-2">{pkg.title}</h3>
          <ul className="list-disc pl-5 text-gray-700 mb-2">
            {pkg.features.map((f, i) => <li key={i}>{f}</li>)}
            <li>
              <span className="font-bold">Total:</span> R{total.toFixed(2)}
            </li>
          </ul>
        </div>
        {/* Image floated right on desktop, below on mobile */}
        <a
          href={`/posts/${postId}`}
          rel="noopener noreferrer"
          className="group block flex-shrink-0"
          tabIndex={-1}
        >
          <img
            src={heroImage || 'https://llandudnoshack.co.za/images/Gallery-shack.jpg'}
            alt="Preview"
            className="w-60 h-30 rounded-xl object-cover border border-border transition-transform group-hover:scale-99 group-hover:ring-2 group-hover:ring-primary"
          />
        </a>
      </div>
      {/* Breadcrumb */}
      <nav className="flex items-center space-x-2 text-sm mb-4 pl-5">
        <span className="text-muted-foreground">Home</span>
        <span className="text-muted-foreground">&gt;</span>
        <span className="text-muted-foreground">Posts</span>
        <span className="text-muted-foreground">&gt;</span>
        <a
          href={`/posts/${postId}`}
          className="text-primary underline font-medium"
          rel="noopener noreferrer"
        >
          {postId}
        </a>
      </nav>

<div className="flex justify-center items-stretch w-full">
  <div className="flex items-center w-full max-w-2xl">
    {/* Tabs and button on the same row */}
    <Tabs value={selectedTab} onValueChange={setSelectedTab} className="flex-1">
      <TabsList className="p-2  flex flex-row gap-2">
         <TabsTrigger value="film" className="px-3 py-2 text-base font-medium rounded-full data-[state=active]:bg-secondary data-[state=active]:text-foreground data-[state=inactive]:text-muted-foreground transition-colors shadow-none flex items-center justify-center">
          <Camera className="h-5 w-5" />
        </TabsTrigger>
        <TabsTrigger value="standard" className="px-3 py-2 text-base font-medium rounded-full data-[state=active]:bg-secondary data-[state=active]:text-foreground data-[state=inactive]:text-muted-foreground transition-colors shadow-none flex items-center justify-center">
          <BedDouble className="h-5 w-5" />
        </TabsTrigger>
        <TabsTrigger value="wine" className="px-3 py-2 text-base font-medium rounded-full data-[state=active]:bg-secondary data-[state=active]:text-foreground data-[state=inactive]:text-muted-foreground transition-colors shadow-none flex items-center justify-center">
          <Wine className="h-5 w-5" />
        </TabsTrigger>
        <TabsTrigger value="hiking" className="px-3 py-2 text-base font-medium rounded-full data-[state=active]:bg-secondary data-[state=active]:text-foreground data-[state=inactive]:text-muted-foreground transition-colors shadow-none flex items-center justify-center">
          <Mountain className="h-5 w-5" />
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
</div>
      {/* Show image for hiking package */}
      {selectedTab === 'hiking' && hikeImage && (
        <img src={hikeImage} alt="Hiking" className="rounded-lg mb-4 w-full max-w-md object-cover" />
      )}
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

    const heroImage =
      typeof hero?.media === 'object' && hero.media?.url
        ? hero.media.url
        : typeof hero?.media === 'string'
          ? `/media/${hero.media}` // fallback if only ID is present
          : null;

    return (
      <article className="pt-16 pb-24">
        {draft && <LivePreviewListener />}

        { /* Pro entitlement for revenuecat */}
        <div className="container mt-8 flex flex-col items-center space-y-4">
          <div className="w-full max-w-2xl mt-8">
            {isCustomer && isSubscribed && entitlements.includes('pro') ? (
              <PackageBlock currentUser={currentUser} router={router} baseRate={baseRate} heroImage={heroImage} />
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