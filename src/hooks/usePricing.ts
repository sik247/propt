import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'
import { toast } from 'sonner'

export interface UserPlan {
  id: string
  user_id: string
  plan_type: 'free' | 'basic' | 'pro' | 'enterprise'
  tokens_included: number
  tokens_used: number
  tokens_remaining: number
  billing_cycle: 'monthly' | 'yearly'
  subscription_start: string
  subscription_end?: string
  is_active: boolean
}

export interface PricingPlan {
  id: string
  plan_name: string
  display_name: string
  price_monthly: number
  price_yearly: number
  tokens_included: number
  features: {
    features: string[]
  }
  is_active: boolean
}

export interface TokenUsage {
  id: string
  action_type: string
  tokens_used: number
  cost_usd: number
  api_provider: string
  model_used: string
  created_at: string
}

export function usePricing() {
  const { user } = useAuth()
  const [userPlan, setUserPlan] = useState<UserPlan | null>(null)
  const [pricingPlans, setPricingPlans] = useState<PricingPlan[]>([])
  const [tokenUsage, setTokenUsage] = useState<TokenUsage[]>([])
  const [loading, setLoading] = useState(false)

  // Fetch user's current plan
  const fetchUserPlan = async () => {
    if (!user) return

    try {
      const { data, error } = await supabase
        .from('user_plans')
        .select('*')
        .eq('user_id', user.id)
        .eq('is_active', true)
        .single()

      if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
        console.error('Error fetching user plan:', error)
        return
      }

      setUserPlan(data)
    } catch (error) {
      console.error('Error fetching user plan:', error)
    }
  }

  // Fetch available pricing plans
  const fetchPricingPlans = async () => {
    try {
      const { data, error } = await supabase
        .from('pricing_plans')
        .select('*')
        .eq('is_active', true)
        .order('price_monthly', { ascending: true })

      if (error) throw error
      setPricingPlans(data || [])
    } catch (error) {
      console.error('Error fetching pricing plans:', error)
    }
  }

  // Fetch user's token usage history
  const fetchTokenUsage = async () => {
    if (!user) return

    try {
      const { data, error } = await supabase
        .from('token_usage')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(50)

      if (error) throw error
      setTokenUsage(data || [])
    } catch (error) {
      console.error('Error fetching token usage:', error)
    }
  }

  // Check if user has enough tokens
  const hasEnoughTokens = (requiredTokens: number): boolean => {
    if (!userPlan) return false
    return userPlan.tokens_remaining >= requiredTokens
  }

  // Deduct tokens for an action
  const deductTokens = async (
    tokens: number,
    actionType: string,
    modelUsed: string = 'gpt-4'
  ): Promise<boolean> => {
    if (!user || !userPlan) {
      toast.error('Please sign in to continue')
      return false
    }

    if (!hasEnoughTokens(tokens)) {
      toast.error('Insufficient tokens. Please upgrade your plan.')
      return false
    }

    try {
      const { data, error } = await supabase.rpc('deduct_tokens', {
        p_user_id: user.id,
        p_tokens: tokens,
        p_action_type: actionType,
        p_model_used: modelUsed,
        p_cost_usd: 0.00
      })

      if (error) throw error

      if (data) {
        // Refresh user plan
        await fetchUserPlan()
        await fetchTokenUsage()
        return true
      }

      return false
    } catch (error) {
      console.error('Error deducting tokens:', error)
      toast.error('Failed to process token usage')
      return false
    }
  }

  // Calculate estimated tokens for different actions
  const estimateTokens = (action: string, contentLength: number = 0): number => {
    const baseTokens = {
      generate: 2000,
      refine: 1500,
      browse: 100
    }

    const base = baseTokens[action as keyof typeof baseTokens] || 1000
    const contentTokens = Math.ceil(contentLength / 4) // Rough estimate: 4 chars = 1 token
    
    return base + contentTokens
  }

  // Upgrade plan
  const upgradePlan = async (planName: string) => {
    if (!user) return false

    try {
      setLoading(true)
      
      // In a real app, you'd integrate with Stripe/payment processor here
      // For now, we'll just update the plan directly
      
      const plan = pricingPlans.find(p => p.plan_name === planName)
      if (!plan) throw new Error('Plan not found')

      const { error } = await supabase
        .from('user_plans')
        .update({
          plan_type: planName,
          tokens_included: plan.tokens_included,
          tokens_used: 0, // Reset usage on upgrade
          subscription_start: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('user_id', user.id)
        .eq('is_active', true)

      if (error) throw error

      toast.success(`Successfully upgraded to ${plan.display_name}!`)
      await fetchUserPlan()
      return true
    } catch (error) {
      console.error('Error upgrading plan:', error)
      toast.error('Failed to upgrade plan')
      return false
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchPricingPlans()
  }, [])

  useEffect(() => {
    if (user) {
      fetchUserPlan()
      fetchTokenUsage()
    } else {
      setUserPlan(null)
      setTokenUsage([])
    }
  }, [user])

  return {
    userPlan,
    pricingPlans,
    tokenUsage,
    loading,
    hasEnoughTokens,
    deductTokens,
    estimateTokens,
    upgradePlan,
    fetchUserPlan,
    fetchTokenUsage
  }
}
