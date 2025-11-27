"use client"

import { useState, useEffect } from "react"
import { Clock } from "lucide-react"

interface CountdownTimerProps {
  endTime: string
  onExpire?: () => void
  className?: string
}

export function CountdownTimer({ endTime, onExpire, className = "" }: CountdownTimerProps) {
  const [timeLeft, setTimeLeft] = useState<{
    days: number
    hours: number
    minutes: number
    seconds: number
    isExpired: boolean
  }>({ days: 0, hours: 0, minutes: 0, seconds: 0, isExpired: false })

  useEffect(() => {
    const calculateTimeLeft = () => {
      const now = new Date().getTime()
      const end = new Date(endTime).getTime()
      const difference = end - now

      if (difference <= 0) {
        setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0, isExpired: true })
        if (onExpire) onExpire()
        return
      }

      const days = Math.floor(difference / (1000 * 60 * 60 * 24))
      const hours = Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
      const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60))
      const seconds = Math.floor((difference % (1000 * 60)) / 1000)

      setTimeLeft({ days, hours, minutes, seconds, isExpired: false })
    }

    calculateTimeLeft()
    const timer = setInterval(calculateTimeLeft, 1000)

    return () => clearInterval(timer)
  }, [endTime, onExpire])

  if (timeLeft.isExpired) {
    return (
      <div className={`flex items-center space-x-1 text-red-400 ${className}`}>
        <Clock className="w-4 h-4" />
        <span className="text-sm font-medium">Voting Ended</span>
      </div>
    )
  }

  return (
    <div className={`flex items-center space-x-2 ${className}`}>
      <Clock className="w-4 h-4 text-orange-400" />
      <div className="flex items-center space-x-1 text-sm font-mono">
        {timeLeft.days > 0 && (
          <>
            <span className="text-white font-bold">{timeLeft.days}</span>
            <span className="text-gray-400">d</span>
          </>
        )}
        <span className="text-white font-bold">{timeLeft.hours.toString().padStart(2, "0")}</span>
        <span className="text-gray-400">:</span>
        <span className="text-white font-bold">{timeLeft.minutes.toString().padStart(2, "0")}</span>
        <span className="text-gray-400">:</span>
        <span className="text-white font-bold">{timeLeft.seconds.toString().padStart(2, "0")}</span>
      </div>
    </div>
  )
}
