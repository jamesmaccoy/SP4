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
import Link from 'next/link';
import { Estimate } from '@/payload-types'
import configPromise from '@payload-config'
import { getPayload } from 'payload'

export interface PageClientProps {
  page: PageType | null
  draft: boolean
  url: string
  baseRate?: number
}

// Gemini AI Example (client-side only)
const ai = typeof window !== 'undefined' ? new GoogleGenAI({ apiKey: process.env.NEXT_PUBLIC_GEMINI_API_KEY || "AIzaSyAEQx7gPPm28A8kmsuFCaUCDcoYM08SL-E" }) : null;

const PackageBlock = ({ currentUser, router, baseRate = 150, heroImage, slug, propertyTitle }) => {
  const [selectedTab, setSelectedTab] = useState('standard')
  const [startDate, setStartDate] = useState<Date | null>(new Date())
  const [endDate, setEndDate] = useState<Date | null>(new Date(new Date().setDate(new Date().getDate() + 5)))
  const [loading, setLoading] = useState(false)
  const [hikeImage, setHikeImage] = useState<string | null>(null)

  const [listening, setListening] = useState(false);
  const recognitionRef = useRef<any>(null);

  // Gemini input and state moved here for access to setStartDate/setEndDate
  const [geminiInput, setGeminiInput] = useState("");
  const [geminiResult, setGeminiResult] = useState("");
  const [geminiLoading, setGeminiLoading] = useState(false);
  const [geminiPlaceholder, setGeminiPlaceholder] = useState("");

  const [latestEstimate, setLatestEstimate] = useState<Estimate | null>(null);
  const [acceptedSuggestion, setAcceptedSuggestion] = useState(false);

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
  type EstimateWithPackage = Estimate & { packageType?: string | null }
  let pkgType = (latestEstimate as EstimateWithPackage)?.packageType;
  if (!pkgType && latestEstimate?.title) {
    const lower = latestEstimate.title.toLowerCase();
    if (lower.includes('wine')) pkgType = 'wine';
    else if (lower.includes('hiking')) pkgType = 'hiking';
    else if (lower.includes('film')) pkgType = 'film';
    else if (lower.includes('standard')) pkgType = 'standard';
    else pkgType = 'standard';
  }

  useEffect(() => {
    if (latestEstimate) {
      let pkgType = (latestEstimate as EstimateWithPackage)?.packageType;
      if (!pkgType && latestEstimate?.title) {
        const lower = latestEstimate.title.toLowerCase();
        if (lower.includes('wine')) pkgType = 'wine';
        else if (lower.includes('hiking')) pkgType = 'hiking';
        else if (lower.includes('film')) pkgType = 'film';
        else if (lower.includes('standard')) pkgType = 'standard';
        else pkgType = 'standard';
      }
      setSelectedTab(pkgType || 'standard');
    }
  }, [latestEstimate]);

  useEffect(() => {
    if (selectedTab === 'hiking' && slug) {
      // Example: fetch image from /posts/{slug} (simulate with static image for now)
      // Replace this with a real fetch if you have an API
      setHikeImage('https://llandudnoshack.co.za/images/Gallery-shack.jpg')
    }
  }, [selectedTab, slug])

  // Build a context-rich placeholder
  useEffect(() => {
    let placeholder = "";
    if (pkgType && latestEstimate?.fromDate && latestEstimate?.toDate) {
      const lastPackageTitle = packages[pkgType]?.title || capitalize(pkgType);
      placeholder = `Welcome back! Last time you considered the ${lastPackageTitle} package for ${slug} from ${formatDate(latestEstimate.fromDate)} to ${formatDate(latestEstimate.toDate)}.\nAvailable packages: ${Object.values(packages).map(p => p.title).join(', ')}.\nLet me know if you want to book the same again, try a different package, or get a recommendation!`;
    } else {
      // No previous package info
      placeholder = `I don't have information about your last package yet. Let me know which package you'd like to book and when!\nAvailable packages: ${Object.values(packages).map(p => p.title).join(', ')}.`;
    }
    setGeminiPlaceholder(placeholder);
    setGeminiInput("");
  }, [selectedTab, pkgType, latestEstimate, slug]);

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

  useEffect(() => {
    if (!currentUser?.id) return
    fetch(`/api/estimates/latest?userId=${currentUser.id}`)
      .then(res => res.json())
      .then(setLatestEstimate)
  }, [currentUser?.id])

  const pkg = packages[selectedTab] || packages["standard"]

  // Calculate duration
  let duration = 5
  if (startDate && endDate && !isNaN(startDate.getTime()) && !isNaN(endDate.getTime())) {
    const diffTime = Math.abs(endDate.getTime() - startDate.getTime())
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    if (diffDays > 0) duration = diffDays
  }
  const total = calculateTotal(pkg.rate, duration, 1)

  // Use the previous estimate's property for context if available
  let lastPropertyContext = slug;
  if (latestEstimate && typeof latestEstimate.post === 'object') {
    lastPropertyContext = latestEstimate.post.title || latestEstimate.post.slug || slug;
  } else if (latestEstimate && typeof latestEstimate.post === 'string') {
    lastPropertyContext = latestEstimate.post;
  }
  const propertyContext = latestEstimate ? lastPropertyContext : (propertyTitle || slug || 'this property');

  const assistantContext = latestEstimate
    ? {
        message: `Welcome back! Last time you considered the ${capitalize(pkgType)} package for ${propertyContext} from ${formatDate(latestEstimate?.fromDate)} to ${formatDate(latestEstimate?.toDate)}. Would you like to book the same again, or try a different package?` + (pkgType === 'wine' ? " 🍷" : pkgType === 'hiking' ? " 🥾" : pkgType === 'film' ? " 🎬" : " 🏡"),
        prefill: latestEstimate
      }
    : {
        message: `Welcome! Here are the available packages for ${propertyContext}: ${Object.values(packages).map(p => p.title).join(', ')}. Which would you like to book?` + "\nLet me know if you want a recommendation!",
        prefill: null
      }

  // Optionally, prefill the form fields if assistantContext.prefill exists
  useEffect(() => {
    if (assistantContext.prefill) {
      setStartDate(new Date(assistantContext.prefill.fromDate))
      setEndDate(new Date(assistantContext.prefill.toDate))
      setSelectedTab((assistantContext.prefill as EstimateWithPackage).packageType || 'standard')
      // Optionally prefill guests, etc.
    }
  }, [assistantContext.prefill])

  // Build the context string for display and Gemini
  const contextParts: string[] = [];
  if (latestEstimate && pkgType) {
    const lastPackageTitle = packages[pkgType]?.title || capitalize(pkgType);
    contextParts.push(
      `The user's last package was "${lastPackageTitle}" for "${propertyContext}".`
    );
    if (latestEstimate.fromDate && latestEstimate.toDate) {
      contextParts.push(
        `Their last check-in date was ${formatDate(latestEstimate.fromDate)} and check-out date was ${formatDate(latestEstimate.toDate)}.`
      );
    }
  }
  contextParts.push(
    `Available packages: ${Object.values(packages).map(p => p.title).join(', ')}.`
  );
  const assistantContextString = contextParts.join(' ');

  // Personalized Gemini input placeholder
  const personalizedPlaceholder = pkgType && latestEstimate?.fromDate && latestEstimate?.toDate
    ? `Welcome back! Last time you considered the ${packages[pkgType]?.title || capitalize(pkgType)} package for ${propertyContext} from ${formatDate(latestEstimate.fromDate)} to ${formatDate(latestEstimate.toDate)}. Would you like to book the same again, or try a different package?`
    : geminiPlaceholder;

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

      const contextParts: string[] = [];
      if (latestEstimate && pkgType) {
        const lastPackageTitle = packages[pkgType]?.title || capitalize(pkgType);
        contextParts.push(
          `The user's last package was "${lastPackageTitle}" for "${propertyContext}".`
        );
        if (latestEstimate.fromDate && latestEstimate.toDate) {
          contextParts.push(
            `Their last check-in date was ${formatDate(latestEstimate.fromDate)} and check-out date was ${formatDate(latestEstimate.toDate)}.`
          );
        }
      }
      contextParts.push(
        `Available packages: ${Object.values(packages).map(p => p.title).join(', ')}.`
      );
      const assistantContextString = contextParts.join(' ');

      const prompt = `
${assistantContextString}
Today is ${todayStr}. ${context}
Extract the check-in and check-out dates from this booking request: "${geminiInput}".
Return as JSON: {"fromDate": "YYYY-MM-DD", "toDate": "YYYY-MM-DD"}.
Dates must be in the future, relative to today.
If a specific time is relevant (like 9am or 1pm for film studio), include it in the JSON as {"fromDate":"YYYY-MM-DDTHH:MM","toDate":"YYYY-MM-DDTHH:MM"}.
If the user asks about their last package, respond with the last package info and suggest available packages.
`
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
    <div className="blockbg-card shadow p-6 flex flex-col items-left ">
      {/* Show context info at the top */}
     {/* <div className="mb-4 p-3 bg-muted rounded text-sm text-muted-foreground w-full h-full">
        {assistantContextString}
      </div> */}
     

      {/* Issue Booking Form */}
      <div className="flex flex-col space-y-2 w-full  rounded-lg shadow-lg">
        
        <label className="text-gray-700 font-medium center-content">When where you thinking</label>
        {/* Gemini natural language input and button in a form */}
        <form
          onSubmit={e => {
            e.preventDefault();
            if (!geminiLoading && geminiInput) runGeminiDateParse();
          }}
          className="flex flex-col"
        >
          
         
          <div className=" w-full items-center space-x-2">
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
          <textarea
            placeholder={personalizedPlaceholder}
            value={geminiInput}
            onChange={e => setGeminiInput(e.target.value || "")}
            onKeyDown={e => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                if (!geminiLoading && geminiInput) runGeminiDateParse();
              }
            }}
            enterKeyHint="send"
            className="w-full border-2 rounded-2xl text-xl px-6 py-4 shadow-lg focus:ring-4 focus:ring-green-200 resize-none overscroll-contain text-foreground dark:text-foreground bg-transparent"
          />
         
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
          <Button
            variant="default"
            className="mt-2"
            disabled={loading}
            onClick={async () => {
              let useEstimate = false;
              let useStartDate = startDate;
              let useEndDate = endDate;
              let usePackage = selectedTab;
              let usePostId = slug;
              // If there is a previous estimate, use its values and property
              if (latestEstimate) {
                useEstimate = true;
                useStartDate = new Date(latestEstimate.fromDate);
                useEndDate = new Date(latestEstimate.toDate);
                let pkgType = (latestEstimate as EstimateWithPackage)?.packageType;
                if (!pkgType && latestEstimate?.title) {
                  const lower = latestEstimate.title.toLowerCase();
                  if (lower.includes('wine')) pkgType = 'wine';
                  else if (lower.includes('hiking')) pkgType = 'hiking';
                  else if (lower.includes('film')) pkgType = 'film';
                  else if (lower.includes('standard')) pkgType = 'standard';
                  else pkgType = 'standard';
                }
                usePackage = pkgType || 'standard';
                // Use the postId/slug/title from the previous estimate
                if (typeof latestEstimate.post === 'object') {
                  usePostId = latestEstimate.post.id || latestEstimate.post.slug || latestEstimate.post.title || slug;
                } else if (typeof latestEstimate.post === 'string') {
                  usePostId = latestEstimate.post;
                }
              }
              if (!usePostId) {
                alert('Property is missing. Cannot create estimate.');
                return;
              }
              if (!useStartDate) {
                alert('Please select a check-in date.');
                return;
              }
              if (!useEndDate) {
                alert('Please select a check-out date.');
                return;
              }
              setLoading(true)
              const duration = Math.max(1, Math.ceil((useEndDate.getTime() - useStartDate.getTime()) / (1000 * 60 * 60 * 24)));
              const res = await fetch('/api/estimates', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  postId: usePostId,
                  fromDate: useStartDate.toISOString(),
                  toDate: useEndDate.toISOString(),
                  guests: [],
                  customer: currentUser?.id,
                  packageType: usePackage,
                  total: calculateTotal(packages[usePackage].rate, duration, 1),
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
            {latestEstimate ? 'Book Again with Suggested Dates & Package' : 'Request Availability'}
          </Button>
        </div>
        {/* Image floated right on desktop, below on mobile */}
        <a
          href={`/posts/${slug}`}
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
          href={`/posts/${slug}`}
          className="text-primary underline font-medium"
          rel="noopener noreferrer"
        >
          {slug}
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
    {/* TODO: Disable button if no dates are selected */}
    <Button
      variant="default"
      className="px-4 py-2 whitespace-nowrap"
      disabled={loading || !propertyTitle || (!acceptedSuggestion && (!startDate || !endDate))}
      onClick={async () => {
        if (!propertyTitle) {
          alert('Property title is missing. Cannot create estimate.');
          return;
        }
        setLoading(true)
        console.log({
          postId: propertyTitle,
          fromDate: startDate ? startDate.toISOString() : undefined,
          toDate: endDate ? endDate.toISOString() : undefined,
          guests: [],
          customer: currentUser?.id,
          packageType: selectedTab,
          total: total,
        })
        const res = await fetch('/api/estimates', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            postId: propertyTitle,
            fromDate: startDate ? startDate.toISOString() : undefined,
            toDate: endDate ? endDate.toISOString() : undefined,
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

  const slug = typeof window !== 'undefined' ? window.location.pathname.split('/').filter(Boolean).pop() : ''

  if (!page) {
    return <div className="container py-12"><p>Page not found.</p></div>
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

    const propertyTitle =
      page?.title ||
      (typeof (page as any)?.post === 'object' && (page as any).post?.title) ||
      slug;

    return (
      <article className="pt-16 pb-24">
        {draft && <LivePreviewListener />}

        { /* Pro entitlement for revenuecat */}
        <div className="container flex flex-col items-center space-y-4 w-full">
          <div className="w-full">
            {isCustomer && isSubscribed && entitlements.includes('pro') ? (
              <PackageBlock
                currentUser={currentUser}
                router={router}
                baseRate={baseRate}
                heroImage={heroImage}
                slug={slug}
                propertyTitle={propertyTitle}
              />
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

function formatDate(dateStr) {
  return new Date(dateStr).toLocaleDateString()
}

function capitalize(str) {
  return str.charAt(0).toUpperCase() + str.slice(1)
}

export default PageClient