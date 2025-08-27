import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { toast } from 'sonner'

interface UsageState {
  attempts: number
  refineAttempts: number
  hasReachedLimit: boolean
  hasReachedRefineLimit: boolean
  canGenerate: boolean
  canRefine: boolean
}

const STORAGE_KEY = 'propt_usage_attempts'
const MAX_ATTEMPTS_GUEST = 2
const MAX_REFINE_ATTEMPTS_GUEST = 1
const REFINE_STORAGE_KEY = 'propt_refine_attempts'

export function useUsageTracking() {
  const { user } = useAuth()
  const [usage, setUsage] = useState<UsageState>({
    attempts: 0,
    refineAttempts: 0,
    hasReachedLimit: false,
    hasReachedRefineLimit: false,
    canGenerate: true,
    canRefine: true
  })

  useEffect(() => {
    // If user is authenticated, they have unlimited attempts
    if (user) {
      setUsage({
        attempts: 0,
        refineAttempts: 0,
        hasReachedLimit: false,
        hasReachedRefineLimit: false,
        canGenerate: true,
        canRefine: true
      })
      return
    }

    // For guests, check localStorage for usage
    const storedAttempts = localStorage.getItem(STORAGE_KEY)
    const storedRefineAttempts = localStorage.getItem(REFINE_STORAGE_KEY)
    const attempts = storedAttempts ? parseInt(storedAttempts, 10) : 0
    const refineAttempts = storedRefineAttempts ? parseInt(storedRefineAttempts, 10) : 0
    const hasReachedLimit = attempts >= MAX_ATTEMPTS_GUEST
    const hasReachedRefineLimit = refineAttempts >= MAX_REFINE_ATTEMPTS_GUEST

    setUsage({
      attempts,
      refineAttempts,
      hasReachedLimit,
      hasReachedRefineLimit,
      canGenerate: !hasReachedLimit,
      canRefine: !hasReachedRefineLimit
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
    localStorage.removeItem(REFINE_STORAGE_KEY)
    setUsage({
      attempts: 0,
      refineAttempts: 0,
      hasReachedLimit: false,
      hasReachedRefineLimit: false,
      canGenerate: true,
      canRefine: true
    })
  }

  const incrementRefineUsage = () => {
    // Authenticated users don't have limits
    if (user) return true

    const newRefineAttempts = usage.refineAttempts + 1
    const hasReachedRefineLimit = newRefineAttempts >= MAX_REFINE_ATTEMPTS_GUEST

    // Store in localStorage
    localStorage.setItem(REFINE_STORAGE_KEY, newRefineAttempts.toString())

    setUsage(prev => ({
      ...prev,
      refineAttempts: newRefineAttempts,
      hasReachedRefineLimit,
      canRefine: !hasReachedRefineLimit
    }))

    // Show limit warning if reached
    if (hasReachedRefineLimit) {
      toast.error(
        'Free refine limit reached! Sign up for unlimited prompt refinement.',
        {
          duration: 5000,
          action: {
            label: 'Sign Up',
            onClick: () => {
              window.dispatchEvent(new CustomEvent('show-auth-modal'))
            }
          }
        }
      )
    }

    return !hasReachedRefineLimit
  }

  return {
    usage,
    incrementUsage,
    incrementRefineUsage,
    resetUsage,
    isAuthenticated: !!user,
    remainingAttempts: user ? Infinity : Math.max(0, MAX_ATTEMPTS_GUEST - usage.attempts),
    remainingRefineAttempts: user ? Infinity : Math.max(0, MAX_REFINE_ATTEMPTS_GUEST - usage.refineAttempts)
  }
}
