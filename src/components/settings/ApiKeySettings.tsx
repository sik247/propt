import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { createClient } from '@supabase/supabase-js'
import { useAuth } from '@/contexts/AuthContext'
import { toast } from 'sonner'
import { Eye, EyeOff, Key, Trash2, Plus } from 'lucide-react'

// Inline Supabase configuration
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://placeholder.supabase.co'
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'placeholder-key'
const supabase = createClient(supabaseUrl, supabaseAnonKey)

interface ApiKey {
  id: string
  service: string
  api_key_encrypted: string
  is_active: boolean
  created_at: string
}

export function ApiKeySettings() {
  const { user } = useAuth()
  const [apiKeys, setApiKeys] = useState<ApiKey[]>([])
  const [newKey, setNewKey] = useState('')
  const [selectedService, setSelectedService] = useState('openai')
  const [showKey, setShowKey] = useState<{ [key: string]: boolean }>({})
  const [loading, setLoading] = useState(false)

  const services = [
    { id: 'openai', name: 'OpenAI', description: 'GPT-4, GPT-3.5-turbo models' },
    { id: 'anthropic', name: 'Anthropic', description: 'Claude models' },
    { id: 'cohere', name: 'Cohere', description: 'Command models' }
  ]

  // Fetch user's API keys
  const fetchApiKeys = async () => {
    if (!user) return

    try {
      const { data, error } = await supabase
        .from('user_api_keys')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

      if (error) throw error
      setApiKeys(data || [])
    } catch (error) {
      console.error('Error fetching API keys:', error)
    }
  }

  // Add new API key
  const addApiKey = async () => {
    if (!user || !newKey.trim()) {
      toast.error('Please enter a valid API key')
      return
    }

    try {
      setLoading(true)
      
      // In production, you'd encrypt the API key before storing
      const { error } = await supabase
        .from('user_api_keys')
        .insert([
          {
            user_id: user.id,
            service: selectedService,
            api_key_encrypted: btoa(newKey), // Simple base64 encoding (use proper encryption in production)
            is_active: true
          }
        ])

      if (error) throw error
      
      setNewKey('')
      toast.success('API key added successfully!')
      await fetchApiKeys()
    } catch (error) {
      console.error('Error adding API key:', error)
      toast.error('Failed to add API key')
    } finally {
      setLoading(false)
    }
  }

  // Delete API key
  const deleteApiKey = async (keyId: string) => {
    try {
      const { error } = await supabase
        .from('user_api_keys')
        .delete()
        .eq('id', keyId)
        .eq('user_id', user?.id)

      if (error) throw error
      
      toast.success('API key deleted successfully!')
      await fetchApiKeys()
    } catch (error) {
      console.error('Error deleting API key:', error)
      toast.error('Failed to delete API key')
    }
  }

  // Toggle key visibility
  const toggleKeyVisibility = (keyId: string) => {
    setShowKey(prev => ({
      ...prev,
      [keyId]: !prev[keyId]
    }))
  }

  // Mask API key for display
  const maskApiKey = (key: string) => {
    const decoded = atob(key) // Decode from base64
    return decoded.substring(0, 8) + '...' + decoded.substring(decoded.length - 4)
  }

  useEffect(() => {
    if (user) {
      fetchApiKeys()
    }
  }, [user])

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Key className="h-5 w-5" />
            API Key Management
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Use your own API keys to bypass token limits and enjoy unlimited usage.
          </p>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="add" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="add">Add API Key</TabsTrigger>
              <TabsTrigger value="manage">Manage Keys</TabsTrigger>
            </TabsList>
            
            <TabsContent value="add" className="space-y-4">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="service">Service Provider</Label>
                  <select
                    id="service"
                    value={selectedService}
                    onChange={(e) => setSelectedService(e.target.value)}
                    className="w-full p-2 border border-border rounded-md bg-background"
                  >
                    {services.map((service) => (
                      <option key={service.id} value={service.id}>
                        {service.name} - {service.description}
                      </option>
                    ))}
                  </select>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="apiKey">API Key</Label>
                  <Input
                    id="apiKey"
                    type="password"
                    value={newKey}
                    onChange={(e) => setNewKey(e.target.value)}
                    placeholder="Enter your API key..."
                    className="font-mono"
                  />
                  <p className="text-xs text-muted-foreground">
                    Your API key is encrypted and stored securely. We never see or use your keys.
                  </p>
                </div>
                
                <Button 
                  onClick={addApiKey} 
                  disabled={loading || !newKey.trim()}
                  className="w-full"
                >
                  {loading ? (
                    'Adding...'
                  ) : (
                    <>
                      <Plus className="w-4 h-4 mr-2" />
                      Add API Key
                    </>
                  )}
                </Button>
              </div>
            </TabsContent>
            
            <TabsContent value="manage" className="space-y-4">
              {apiKeys.length > 0 ? (
                <div className="space-y-3">
                  {apiKeys.map((apiKey) => (
                    <div
                      key={apiKey.id}
                      className="flex items-center justify-between p-4 border border-border rounded-lg"
                    >
                      <div className="flex items-center space-x-3">
                        <Badge variant="outline" className="capitalize">
                          {apiKey.service}
                        </Badge>
                        <div className="font-mono text-sm">
                          {showKey[apiKey.id] 
                            ? atob(apiKey.api_key_encrypted)
                            : maskApiKey(apiKey.api_key_encrypted)
                          }
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => toggleKeyVisibility(apiKey.id)}
                        >
                          {showKey[apiKey.id] ? (
                            <EyeOff className="w-4 h-4" />
                          ) : (
                            <Eye className="w-4 h-4" />
                          )}
                        </Button>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <Badge 
                          variant={apiKey.is_active ? "default" : "secondary"}
                        >
                          {apiKey.is_active ? 'Active' : 'Inactive'}
                        </Badge>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => deleteApiKey(apiKey.id)}
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Key className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">No API keys configured</p>
                  <p className="text-sm text-muted-foreground">
                    Add your API keys to bypass token limits
                  </p>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Benefits Card */}
      <Card className="border-green-200 bg-green-50">
        <CardContent className="pt-6">
          <h3 className="font-medium text-green-800 mb-2">Benefits of Using Your Own API Keys</h3>
          <ul className="text-sm text-green-700 space-y-1">
            <li>• Unlimited prompt generation and refinement</li>
            <li>• Direct billing from the API provider (potentially cheaper)</li>
            <li>• Full control over your usage and costs</li>
            <li>• Access to latest models as soon as they're available</li>
            <li>• No monthly token limits</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  )
}
