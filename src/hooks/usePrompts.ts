import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'
import { toast } from 'sonner'

export interface Prompt {
  id?: string
  user_id?: string
  title: string
  content: string
  industry: string
  use_case: string
  tags?: string[]
  is_public?: boolean
  created_at?: string
  updated_at?: string
}

export function usePrompts() {
  const { user } = useAuth()
  const [prompts, setPrompts] = useState<Prompt[]>([])
  const [loading, setLoading] = useState(false)

  // Fetch user's prompts
  const fetchPrompts = async () => {
    if (!user) return

    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('prompts')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

      if (error) throw error
      setPrompts(data || [])
    } catch (error) {
      console.error('Error fetching prompts:', error)
      toast.error('Failed to load prompts')
    } finally {
      setLoading(false)
    }
  }

  // Save a new prompt
  const savePrompt = async (prompt: Omit<Prompt, 'id' | 'user_id' | 'created_at' | 'updated_at'>) => {
    if (!user) {
      toast.error('Please sign in to save prompts')
      return false
    }

    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('prompts')
        .insert([
          {
            ...prompt,
            user_id: user.id,
          }
        ])
        .select()

      if (error) throw error
      
      if (data) {
        setPrompts(prev => [data[0], ...prev])
        toast.success('Prompt saved successfully!')
        return true
      }
    } catch (error) {
      console.error('Error saving prompt:', error)
      toast.error('Failed to save prompt')
      return false
    } finally {
      setLoading(false)
    }
  }

  // Update an existing prompt
  const updatePrompt = async (id: string, updates: Partial<Prompt>) => {
    if (!user) return false

    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('prompts')
        .update({
          ...updates,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id)
        .eq('user_id', user.id)
        .select()

      if (error) throw error
      
      if (data) {
        setPrompts(prev => prev.map(p => p.id === id ? data[0] : p))
        toast.success('Prompt updated successfully!')
        return true
      }
    } catch (error) {
      console.error('Error updating prompt:', error)
      toast.error('Failed to update prompt')
      return false
    } finally {
      setLoading(false)
    }
  }

  // Delete a prompt
  const deletePrompt = async (id: string) => {
    if (!user) return false

    try {
      setLoading(true)
      const { error } = await supabase
        .from('prompts')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id)

      if (error) throw error
      
      setPrompts(prev => prev.filter(p => p.id !== id))
      toast.success('Prompt deleted successfully!')
      return true
    } catch (error) {
      console.error('Error deleting prompt:', error)
      toast.error('Failed to delete prompt')
      return false
    } finally {
      setLoading(false)
    }
  }

  // Fetch public prompts
  const fetchPublicPrompts = async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('prompts')
        .select('*')
        .eq('is_public', true)
        .order('created_at', { ascending: false })

      if (error) throw error
      return data || []
    } catch (error) {
      console.error('Error fetching public prompts:', error)
      toast.error('Failed to load public prompts')
      return []
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (user) {
      fetchPrompts()
    } else {
      setPrompts([])
    }
  }, [user])

  return {
    prompts,
    loading,
    savePrompt,
    updatePrompt,
    deletePrompt,
    fetchPrompts,
    fetchPublicPrompts,
  }
}
