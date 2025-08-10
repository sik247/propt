import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, CheckCircle, AlertCircle, FileText, Wand2 } from "lucide-react";
import { useExtractInstructions, useCritiquePrompt, useRevisePrompt, useHealthCheck } from "@/hooks/useApi";
import { toast } from "sonner";

const PromptAnalyzer = () => {
  const [prompt, setPrompt] = useState('');
  const [activeTab, setActiveTab] = useState<'extract' | 'critique' | 'revise'>('extract');
  
  const { data: healthData } = useHealthCheck();
  const extractMutation = useExtractInstructions();
  const critiqueMutation = useCritiquePrompt();
  const reviseMutation = useRevisePrompt();

  const handleAnalyze = () => {
    if (!prompt.trim()) {
      toast.error("Please enter a prompt to analyze");
      return;
    }

    if (!healthData?.openai_configured) {
      toast.error("OpenAI API is not configured. Please check backend configuration.");
      return;
    }

    switch (activeTab) {
      case 'extract':
        extractMutation.mutate(prompt, {
          onSuccess: () => toast.success("Instructions extracted successfully!"),
          onError: (error) => toast.error(`Error: ${error.message}`)
        });
        break;
      case 'critique':
        critiqueMutation.mutate(prompt, {
          onSuccess: () => toast.success("Prompt critique completed!"),
          onError: (error) => toast.error(`Error: ${error.message}`)
        });
        break;
      case 'revise':
        reviseMutation.mutate(prompt, {
          onSuccess: () => toast.success("Prompt revision completed!"),
          onError: (error) => toast.error(`Error: ${error.message}`)
        });
        break;
    }
  };

  const isLoading = extractMutation.isPending || critiqueMutation.isPending || reviseMutation.isPending;

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <h3 className="text-xl font-semibold text-foreground">AI Prompt Analysis</h3>
        <p className="text-muted-foreground">
          Upload or paste your prompt and let our AI agents analyze, critique, and improve it.
        </p>
        
        {/* Backend Status */}
        <div className="flex items-center gap-2 text-sm">
          {healthData?.status === 'healthy' ? (
            <>
              <CheckCircle className="w-4 h-4 text-green-500" />
              <span className="text-green-600">Backend Connected</span>
              {healthData.openai_configured ? (
                <Badge variant="secondary" className="text-green-600">OpenAI Ready</Badge>
              ) : (
                <Badge variant="destructive">OpenAI Not Configured</Badge>
              )}
            </>
          ) : (
            <>
              <AlertCircle className="w-4 h-4 text-red-500" />
              <span className="text-red-600">Backend Disconnected</span>
            </>
          )}
        </div>
      </div>

      {/* Prompt Input */}
      <div className="space-y-2">
        <Label htmlFor="prompt-input" className="text-foreground">Prompt Content</Label>
        <Textarea
          id="prompt-input"
          placeholder="Enter your prompt here for analysis..."
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          className="min-h-[120px] bg-input border-border text-foreground"
        />
      </div>

      {/* Analysis Type Tabs */}
      <div className="flex gap-2">
        <Button
          variant={activeTab === 'extract' ? 'default' : 'outline'}
          onClick={() => setActiveTab('extract')}
          className="flex items-center gap-2"
        >
          <FileText className="w-4 h-4" />
          Extract Instructions
        </Button>
        <Button
          variant={activeTab === 'critique' ? 'default' : 'outline'}
          onClick={() => setActiveTab('critique')}
          className="flex items-center gap-2"
        >
          <AlertCircle className="w-4 h-4" />
          Critique Prompt
        </Button>
        <Button
          variant={activeTab === 'revise' ? 'default' : 'outline'}
          onClick={() => setActiveTab('revise')}
          className="flex items-center gap-2"
        >
          <Wand2 className="w-4 h-4" />
          Revise Prompt
        </Button>
      </div>

      {/* Analyze Button */}
      <Button 
        onClick={handleAnalyze} 
        disabled={isLoading || !prompt.trim() || !healthData?.openai_configured}
        className="w-full bg-primary hover:bg-primary/90"
      >
        {isLoading ? (
          <>
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            Analyzing...
          </>
        ) : (
          `Analyze Prompt - ${activeTab.charAt(0).toUpperCase() + activeTab.slice(1)}`
        )}
      </Button>

      {/* Results */}
      {extractMutation.data && activeTab === 'extract' && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5" />
              Extracted Instructions
            </CardTitle>
            <CardDescription>
              {extractMutation.data.instructions.length} instruction(s) found
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {extractMutation.data.instructions.map((instruction, index) => (
                <div key={index} className="p-3 bg-muted rounded-lg">
                  <h4 className="font-medium text-foreground mb-1">
                    {instruction.instruction_title}
                  </h4>
                  <p className="text-sm text-muted-foreground">
                    {instruction.extracted_instruction}
                  </p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {critiqueMutation.data && activeTab === 'critique' && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertCircle className="w-5 h-5" />
              Prompt Critique
            </CardTitle>
            <CardDescription>
              {critiqueMutation.data.issues.length} issue(s) identified
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {critiqueMutation.data.issues.map((issue, index) => (
                <div key={index} className="p-4 border border-border rounded-lg">
                  <div className="flex items-start gap-2 mb-2">
                    <AlertCircle className="w-4 h-4 text-amber-500 mt-0.5" />
                    <h4 className="font-medium text-foreground">{issue.issue}</h4>
                  </div>
                  {issue.snippet && (
                    <div className="bg-muted p-2 rounded text-sm mb-2">
                      <code>{issue.snippet}</code>
                    </div>
                  )}
                  <p className="text-sm text-muted-foreground mb-2">{issue.explanation}</p>
                  <div className="text-sm text-green-600">
                    <strong>Suggestion:</strong> {issue.suggestion}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {reviseMutation.data && activeTab === 'revise' && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Wand2 className="w-5 h-5" />
              Revised Prompt
            </CardTitle>
            <CardDescription>
              Improved version of your prompt
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="p-4 bg-muted rounded-lg">
              <p className="text-foreground whitespace-pre-wrap">
                {reviseMutation.data.revised_prompt}
              </p>
            </div>
            <Button 
              className="mt-3" 
              onClick={() => setPrompt(reviseMutation.data.revised_prompt)}
            >
              Use Revised Prompt
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default PromptAnalyzer;