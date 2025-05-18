'use client'

import React, { useState, useEffect } from 'react'
import { cn } from '@/utilities/cn'
import { format } from 'date-fns'
import { Calendar } from '@/components/ui/calendar'
import { Button } from '@/components/ui/button'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { CalendarIcon } from 'lucide-react'
import type { SelectSingleEventHandler } from 'react-day-picker'
import type { StayDurationBlock } from './types'

export type StayDurationProps = StayDurationBlock & {
  className?: string
}

// Define package tiers with their thresholds and multipliers
const packageTiers = [
  {
    id: "per_night",
    title: "Per Night",
    minNights: 1,
    maxNights: 1,
    multiplier: 1.0,
  },
  {
    id: "three_nights",
    title: "3 Night Package",
    minNights: 2,
    maxNights: 3,
    multiplier: 0.9, // 10% discount
  },
  {
    id: "Weekly",
    title: "Weekly Package",
    minNights: 4,
    maxNights: 7,
    multiplier: 0.8, // 20% discount
  },
  {
    id: "2Xweekly",
    title: "2X Weekly Package",
    minNights: 8,
    maxNights: 13,
    multiplier: 0.7, // 30% discount
  },
  {
    id: "weekX3",
    title: "3 Week Package",
    minNights: 14,
    maxNights: 28,
    multiplier: 0.5, // 50% discount
  },
  {
    id: "monthly",
    title: "Monthly Package",
    minNights: 29,
    maxNights: 365,
    multiplier: 0.7, // 30% discount
  }
]

export const StayDuration: React.FC<StayDurationProps> = ({ className, baseRate = 150, blockType }) => {
  const [startDate, setStartDate] = useState<Date | null>(null)
  const [endDate, setEndDate] = useState<Date | null>(null)
  const [selectedDuration, setSelectedDuration] = useState(1)
  const [totalPrice, setTotalPrice] = useState(baseRate)
  const [currentTier, setCurrentTier] = useState(packageTiers[0])

  useEffect(() => {
    if (startDate && endDate) {
      const diffTime = Math.abs(endDate.getTime() - startDate.getTime())
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
      
      // Find the appropriate package tier
      const tier = packageTiers.find(tier => 
        diffDays >= tier.minNights && diffDays <= tier.maxNights
      ) || packageTiers[0]

      setSelectedDuration(diffDays)
      setCurrentTier(tier)
      setTotalPrice(baseRate * diffDays * tier.multiplier)
    }
  }, [startDate, endDate, baseRate])

  if (blockType !== 'stayDuration') {
    return null
  }

  return (
    <div 
      data-stay-duration 
      className={cn('flex flex-col space-y-4 p-6 bg-card rounded-lg border border-border', className)}
    >
      <h3 className="text-lg font-semibold">Book Your Stay</h3>
      
      {/* Date Selection */}
      <div className="flex flex-col space-y-2">
        <label className="text-sm font-medium">Select Dates</label>
        <div className="flex space-x-2">
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  "w-full justify-start text-left font-normal",
                  !startDate && "text-muted-foreground"
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {startDate ? format(startDate, "PPP") : <span>Check-in date</span>}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0">
              <Calendar
                mode="single"
                selected={startDate || undefined}
                onSelect={(date) => setStartDate(date || null)}
                disabled={(date) => date < new Date()}
              />
            </PopoverContent>
          </Popover>

          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  "w-full justify-start text-left font-normal",
                  !endDate && "text-muted-foreground"
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {endDate ? format(endDate, "PPP") : <span>Check-out date</span>}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0">
              <Calendar
                mode="single"
                selected={endDate || undefined}
                onSelect={(date) => setEndDate(date || null)}
                disabled={(date) => !startDate || date <= startDate}
              />
            </PopoverContent>
          </Popover>
        </div>
      </div>

      {/* Package Information */}
      <div className="space-y-2">
        <div className="flex justify-between items-center">
          <span className="text-sm text-muted-foreground">Package:</span>
          <span className="font-medium">{currentTier.title}</span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-sm text-muted-foreground">Base Rate:</span>
          <span className="font-medium">R{baseRate}/night</span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-sm text-muted-foreground">Duration:</span>
          <span className="font-medium">{selectedDuration} night{selectedDuration !== 1 ? 's' : ''}</span>
        </div>
        {currentTier.multiplier !== 1 && (
          <div className="flex justify-between items-center text-green-600">
            <span className="text-sm">Discount:</span>
            <span className="font-medium">{((1 - currentTier.multiplier) * 100).toFixed(0)}% off</span>
          </div>
        )}
      </div>

      {/* Total Price */}
      <div className="pt-4 border-t border-border">
        <div className="flex justify-between items-center">
          <span className="text-lg font-medium">Total:</span>
          <span className="text-2xl font-bold">R{totalPrice.toFixed(2)}</span>
        </div>
      </div>

      {/* Book Now Button */}
      <Button 
        className="w-full bg-primary text-primary-foreground hover:bg-primary/90"
        disabled={!startDate || !endDate}
        onClick={() => {
          // Navigate to join page with parameters
          window.location.href = `/join?total=${baseRate}&duration=${selectedDuration}`
        }}
      >
        {!startDate || !endDate ? 'Select dates to book' : 'Request Availability'}
      </Button>
    </div>
  )
} 