import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, CheckCircle, AlertCircle, FileText, Wand2, Brain } from "lucide-react";
import { useUnifiedAnalysis, useHealthCheck } from "@/hooks/useApi";
import { toast } from "sonner";

const PromptAnalyzer = () => {
  const [prompt, setPrompt] = useState('');
  
  const { data: healthData } = useHealthCheck();
  const unifiedAnalysis = useUnifiedAnalysis();

  const handleAnalyze = () => {
    if (!prompt.trim()) {
      toast.error("Please enter a prompt to analyze");
      return;
    }

    if (!healthData?.openai_configured) {
      toast.error("OpenAI API is not configured. Please check backend configuration.");
      return;
    }

    unifiedAnalysis.mutate(prompt, {
      onSuccess: () => toast.success("Complete analysis finished!"),
      onError: (error) => toast.error(`Error: ${error.message}`)
    });
  };

  const isLoading = unifiedAnalysis.isPending;

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <h3 className="text-xl font-semibold text-foreground">AI Prompt Analysis</h3>
        <p className="text-muted-foreground">
          Upload or paste your prompt and get a complete analysis: instructions extraction, critique, and improvement suggestions.
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

      {/* Unified Analyze Button */}
      <Button 
        onClick={handleAnalyze} 
        disabled={isLoading || !prompt.trim() || !healthData?.openai_configured}
        className="w-full bg-primary hover:bg-primary/90 h-12"
        size="lg"
      >
        {isLoading ? (
          <>
            <Loader2 className="w-5 h-5 mr-2 animate-spin" />
            Running Complete Analysis...
          </>
        ) : (
          <>
            <Brain className="w-5 h-5 mr-2" />
            Analyze Prompt (Extract + Critique + Improve)
          </>
        )}
      </Button>

      {/* Unified Results */}
      {unifiedAnalysis.data && (
        <div className="space-y-6">
          {/* Progress Summary */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Brain className="w-5 h-5" />
                Analysis Complete
              </CardTitle>
              <CardDescription>
                Full prompt analysis completed successfully
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-4">
                <div className="text-center">
                  <CheckCircle className="w-6 h-6 text-green-500 mx-auto mb-1" />
                  <p className="text-sm font-medium">Instructions</p>
                  <p className="text-xs text-muted-foreground">{unifiedAnalysis.data.instructions.length} found</p>
                </div>
                <div className="text-center">
                  <CheckCircle className="w-6 h-6 text-green-500 mx-auto mb-1" />
                  <p className="text-sm font-medium">Issues</p>
                  <p className="text-xs text-muted-foreground">{unifiedAnalysis.data.issues.length} identified</p>
                </div>
                <div className="text-center">
                  <CheckCircle className="w-6 h-6 text-green-500 mx-auto mb-1" />
                  <p className="text-sm font-medium">Improved</p>
                  <p className="text-xs text-muted-foreground">Version ready</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Instructions */}
          {unifiedAnalysis.data.instructions.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="w-5 h-5" />
                  Extracted Instructions
                </CardTitle>
                <CardDescription>
                  {unifiedAnalysis.data.instructions.length} instruction(s) found
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {unifiedAnalysis.data.instructions.map((instruction, index) => (
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

          {/* Issues */}
          {unifiedAnalysis.data.issues.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertCircle className="w-5 h-5" />
                  Prompt Critique
                </CardTitle>
                <CardDescription>
                  {unifiedAnalysis.data.issues.length} issue(s) identified
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {unifiedAnalysis.data.issues.map((issue, index) => (
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

          {/* Revised Prompt */}
          {unifiedAnalysis.data.revised_prompt && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Wand2 className="w-5 h-5" />
                  Improved Prompt
                </CardTitle>
                <CardDescription>
                  Enhanced version based on analysis
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="p-4 bg-muted rounded-lg">
                  <p className="text-foreground whitespace-pre-wrap">
                    {unifiedAnalysis.data.revised_prompt}
                  </p>
                </div>
                <Button 
                  className="mt-3" 
                  onClick={() => setPrompt(unifiedAnalysis.data.revised_prompt)}
                >
                  Use Improved Prompt
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  );
};

export default PromptAnalyzer;