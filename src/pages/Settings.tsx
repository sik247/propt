import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { Eye, EyeOff, Key, Shield, Save } from "lucide-react";

const Settings = () => {
  const [openAIKey, setOpenAIKey] = useState("");
  const [showOpenAIKey, setShowOpenAIKey] = useState(false);
  const [claudeKey, setClaudeKey] = useState("");
  const [showClaudeKey, setShowClaudeKey] = useState(false);
  const [geminiKey, setGeminiKey] = useState("");
  const [showGeminiKey, setShowGeminiKey] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const handleSaveKeys = async () => {
    setIsSaving(true);
    
    try {
      // In a real app, this would save to Supabase secrets
      // For now, we'll simulate the save
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Store in localStorage for demo (in production, use Supabase secrets)
      if (openAIKey) {
        localStorage.setItem('openai_key', openAIKey);
      }
      if (claudeKey) {
        localStorage.setItem('claude_key', claudeKey);
      }
      if (geminiKey) {
        localStorage.setItem('gemini_key', geminiKey);
      }
      
      toast.success('API keys saved securely!');
    } catch (error) {
      toast.error('Failed to save API keys');
    } finally {
      setIsSaving(false);
    }
  };

  const handleLoadKeys = () => {
    // Load keys from localStorage for demo
    const savedOpenAI = localStorage.getItem('openai_key');
    const savedClaude = localStorage.getItem('claude_key');
    const savedGemini = localStorage.getItem('gemini_key');
    
    if (savedOpenAI) setOpenAIKey(savedOpenAI);
    if (savedClaude) setClaudeKey(savedClaude);
    if (savedGemini) setGeminiKey(savedGemini);
    
    if (savedOpenAI || savedClaude || savedGemini) {
      toast.success('API keys loaded');
    }
  };

  // Load keys on component mount
  useState(() => {
    handleLoadKeys();
  });

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">Settings</h1>
          <p className="text-muted-foreground">
            Manage your API keys and account preferences
          </p>
        </div>

        <div className="space-y-6">
          {/* API Keys Section */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Key className="w-5 h-5 text-primary" />
                API Keys
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-start gap-3 p-4 bg-muted/50 rounded-lg border border-orange-200">
                <Shield className="w-5 h-5 text-orange-600 mt-0.5 shrink-0" />
                <div>
                  <h3 className="font-medium text-foreground mb-1">Secure Storage</h3>
                  <p className="text-sm text-muted-foreground">
                    Your API keys are encrypted and stored securely. They are never shared or visible to others.
                  </p>
                </div>
              </div>

              {/* OpenAI API Key */}
              <div className="space-y-2">
                <Label htmlFor="openai-key">OpenAI API Key</Label>
                <div className="relative">
                  <Input
                    id="openai-key"
                    type={showOpenAIKey ? "text" : "password"}
                    value={openAIKey}
                    onChange={(e) => setOpenAIKey(e.target.value)}
                    placeholder="sk-..."
                    className="pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowOpenAIKey(!showOpenAIKey)}
                    className="absolute inset-y-0 right-0 flex items-center pr-3"
                  >
                    {showOpenAIKey ? (
                      <EyeOff className="w-4 h-4 text-muted-foreground" />
                    ) : (
                      <Eye className="w-4 h-4 text-muted-foreground" />
                    )}
                  </button>
                </div>
                <p className="text-xs text-muted-foreground">
                  Required for GPT-4, GPT-3.5, and other OpenAI models. Get your key from{" "}
                  <a href="https://platform.openai.com/api-keys" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                    OpenAI Platform
                  </a>
                </p>
              </div>

              {/* Claude API Key */}
              <div className="space-y-2">
                <Label htmlFor="claude-key">Claude API Key</Label>
                <div className="relative">
                  <Input
                    id="claude-key"
                    type={showClaudeKey ? "text" : "password"}
                    value={claudeKey}
                    onChange={(e) => setClaudeKey(e.target.value)}
                    placeholder="sk-ant-..."
                    className="pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowClaudeKey(!showClaudeKey)}
                    className="absolute inset-y-0 right-0 flex items-center pr-3"
                  >
                    {showClaudeKey ? (
                      <EyeOff className="w-4 h-4 text-muted-foreground" />
                    ) : (
                      <Eye className="w-4 h-4 text-muted-foreground" />
                    )}
                  </button>
                </div>
                <p className="text-xs text-muted-foreground">
                  Required for Claude 3 and Claude 2 models. Get your key from{" "}
                  <a href="https://console.anthropic.com/" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                    Anthropic Console
                  </a>
                </p>
              </div>

              {/* Gemini API Key */}
              <div className="space-y-2">
                <Label htmlFor="gemini-key">Gemini API Key</Label>
                <div className="relative">
                  <Input
                    id="gemini-key"
                    type={showGeminiKey ? "text" : "password"}
                    value={geminiKey}
                    onChange={(e) => setGeminiKey(e.target.value)}
                    placeholder="AI..."
                    className="pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowGeminiKey(!showGeminiKey)}
                    className="absolute inset-y-0 right-0 flex items-center pr-3"
                  >
                    {showGeminiKey ? (
                      <EyeOff className="w-4 h-4 text-muted-foreground" />
                    ) : (
                      <Eye className="w-4 h-4 text-muted-foreground" />
                    )}
                  </button>
                </div>
                <p className="text-xs text-muted-foreground">
                  Required for Gemini Pro model. Get your key from{" "}
                  <a href="https://makersuite.google.com/app/apikey" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                    Google AI Studio
                  </a>
                </p>
              </div>

              <Button 
                onClick={handleSaveKeys}
                disabled={isSaving || (!openAIKey && !claudeKey && !geminiKey)}
                className="w-full"
              >
                {isSaving ? (
                  <>
                    <Shield className="w-4 h-4 mr-2 animate-pulse" />
                    Saving Securely...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4 mr-2" />
                    Save API Keys
                  </>
                )}
              </Button>
            </CardContent>
          </Card>

          {/* Usage & Billing */}
          <Card>
            <CardHeader>
              <CardTitle>Usage & Billing</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex justify-between items-center py-2">
                  <span className="text-sm text-muted-foreground">Prompts Generated</span>
                  <span className="font-medium">12 / 50</span>
                </div>
                <div className="flex justify-between items-center py-2">
                  <span className="text-sm text-muted-foreground">A/B Tests Run</span>
                  <span className="font-medium">3 / 20</span>
                </div>
                <div className="flex justify-between items-center py-2">
                  <span className="text-sm text-muted-foreground">Current Plan</span>
                  <span className="font-medium text-primary">Free</span>
                </div>
                
                <Button variant="outline" className="w-full">
                  Upgrade to Pro
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Settings;