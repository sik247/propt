import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { toast } from 'sonner'

interface UsageState {
  attempts: number
  hasReachedLimit: boolean
  canGenerate: boolean
}

const STORAGE_KEY = 'propt_usage_attempts'
const MAX_ATTEMPTS_GUEST = 1

export function useUsageTracking() {
  const { user } = useAuth()
  const [usage, setUsage] = useState<UsageState>({
    attempts: 0,
    hasReachedLimit: false,
    canGenerate: true
  })

  useEffect(() => {
    // If user is authenticated, they have unlimited attempts
    if (user) {
      setUsage({
        attempts: 0,
        hasReachedLimit: false,
        canGenerate: true
      })
      return
    }

    // For guests, check localStorage for usage
    const storedAttempts = localStorage.getItem(STORAGE_KEY)
    const attempts = storedAttempts ? parseInt(storedAttempts, 10) : 0
    const hasReachedLimit = attempts >= MAX_ATTEMPTS_GUEST

    setUsage({
      attempts,
      hasReachedLimit,
      canGenerate: !hasReachedLimit
    })
  }, [user])

  const incrementUsage = () => {
    // Authenticated users don't have limits
    if (user) return true

    const newAttempts = usage.attempts + 1
    const hasReachedLimit = newAttempts >= MAX_ATTEMPTS_GUEST

    // Store in localStorage
    localStorage.setItem(STORAGE_KEY, newAttempts.toString())

    setUsage({
      attempts: newAttempts,
      hasReachedLimit,
      canGenerate: !hasReachedLimit
    })

    // Show limit warning if reached
    if (hasReachedLimit) {
      toast.error(
        'Free limit reached! Sign up for unlimited prompt generation.',
        {
          duration: 5000,
          action: {
            label: 'Sign Up',
            onClick: () => {
              // This will be handled by the parent component
              window.dispatchEvent(new CustomEvent('show-auth-modal'))
            }
          }
        }
      )
    }

    return !hasReachedLimit
  }

  const resetUsage = () => {
    localStorage.removeItem(STORAGE_KEY)
    setUsage({
      attempts: 0,
      hasReachedLimit: false,
      canGenerate: true
    })
  }

  return {
    usage,
    incrementUsage,
    resetUsage,
    isAuthenticated: !!user,
    remainingAttempts: user ? Infinity : Math.max(0, MAX_ATTEMPTS_GUEST - usage.attempts)
  }
}
