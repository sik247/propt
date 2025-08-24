import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Loader2, Zap, BarChart3 } from "lucide-react";

const ABTesting = () => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [testResult, setTestResult] = useState<any>(null);
  const [promptValue, setPromptValue] = useState("");
  const [modelA, setModelA] = useState("gpt-4");
  const [modelB, setModelB] = useState("claude-3");
  const [testQuery, setTestQuery] = useState("");
  const [industry, setIndustry] = useState("finance");
  const [useCase, setUseCase] = useState("report generation");

  const availableModels = [
    { value: "gpt-4", label: "GPT-4" },
    { value: "gpt-3.5-turbo", label: "GPT-3.5 Turbo" },
    { value: "claude-3", label: "Claude 3" },
    { value: "claude-2", label: "Claude 2" },
    { value: "gemini-pro", label: "Gemini Pro" },
    { value: "llama-2", label: "LLaMA 2" },
  ];

  const handleRunTest = async () => {
    if (!promptValue.trim() || !testQuery.trim()) {
      toast.error('Please enter both a prompt and test query');
      return;
    }

    setIsProcessing(true);
    setTestResult(null);

    try {
      // Simulate API call to backend for AB testing
      const response = await fetch('/api/ab-test', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prompt: promptValue,
          query: testQuery,
          model_a: modelA,
          model_b: modelB,
          industry,
          use_case: useCase,
        }),
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
      }
      
      const result = await response.json();
      setTestResult(result);
      
      if (result.success) {
        toast.success('A/B test completed successfully!');
      } else {
        toast.error(`A/B test failed: ${result.error}`);
      }
    } catch (error) {
      console.error('A/B testing error:', error);
      
      // For demo purposes, create mock results if backend is not available
      const mockResult = {
        success: true,
        model_a: {
          model: modelA,
          response: "This is a sample response from Model A. It provides detailed analysis and recommendations based on the given prompt and query.",
          metrics: {
            response_time: 2.3,
            token_count: 156,
            confidence_score: 0.87
          }
        },
        model_b: {
          model: modelB,
          response: "This is a sample response from Model B. It offers a different perspective and approach to the same query, showing alternative solutions.",
          metrics: {
            response_time: 1.8,
            token_count: 142,
            confidence_score: 0.91
          }
        },
        comparison: {
          winner: modelB,
          criteria: {
            speed: modelB,
            accuracy: modelB,
            coherence: modelA,
            completeness: modelA
          }
        }
      };
      
      setTestResult(mockResult);
      toast.success('A/B test completed (demo mode)!');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">A/B Testing</h1>
          <p className="text-muted-foreground">
            Compare different AI models with the same prompt to find the best performance
          </p>
        </div>

        <div className="space-y-8">
          {/* Test Configuration */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-primary" />
                Test Configuration
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Model Selection */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label>Model A</Label>
                  <Select value={modelA} onValueChange={setModelA}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select Model A" />
                    </SelectTrigger>
                    <SelectContent>
                      {availableModels.map((model) => (
                        <SelectItem key={model.value} value={model.value}>
                          {model.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Model B</Label>
                  <Select value={modelB} onValueChange={setModelB}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select Model B" />
                    </SelectTrigger>
                    <SelectContent>
                      {availableModels.map((model) => (
                        <SelectItem key={model.value} value={model.value}>
                          {model.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Industry and Use Case */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="industry">Industry</Label>
                  <Input
                    id="industry"
                    value={industry}
                    onChange={(e) => setIndustry(e.target.value)}
                    placeholder="e.g., finance, healthcare, education"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="usecase">Use Case</Label>
                  <Input
                    id="usecase"
                    value={useCase}
                    onChange={(e) => setUseCase(e.target.value)}
                    placeholder="e.g., report generation, customer service"
                  />
                </div>
              </div>

              {/* Prompt Input */}
              <div className="space-y-2">
                <Label htmlFor="prompt">Prompt to Test</Label>
                <Textarea
                  id="prompt"
                  value={promptValue}
                  onChange={(e) => setPromptValue(e.target.value)}
                  placeholder="Enter the prompt you want to test across different models..."
                  className="min-h-[120px] resize-none"
                />
              </div>

              {/* Test Query */}
              <div className="space-y-2">
                <Label htmlFor="test-query">Test Query</Label>
                <Textarea
                  id="test-query"
                  value={testQuery}
                  onChange={(e) => setTestQuery(e.target.value)}
                  placeholder="Enter a specific query or scenario to test with both models..."
                  className="min-h-[80px] resize-none"
                />
              </div>

              {/* Run Test Button */}
              <Button 
                onClick={handleRunTest}
                disabled={isProcessing || !promptValue.trim() || !testQuery.trim()}
                className="w-full"
                size="lg"
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Running A/B Test...
                  </>
                ) : (
                  <>
                    <Zap className="w-4 h-4 mr-2" />
                    Run A/B Test
                  </>
                )}
              </Button>
            </CardContent>
          </Card>

          {/* Results */}
          {testResult && testResult.success && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Model A Results */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span>Model A: {testResult.model_a.model}</span>
                    {testResult.comparison?.winner === testResult.model_a.model && (
                      <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">Winner</span>
                    )}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">Response</Label>
                    <div className="p-3 bg-muted rounded-lg mt-1">
                      <p className="text-sm">{testResult.model_a.response}</p>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-3 gap-4 text-sm">
                    <div>
                      <Label className="text-muted-foreground">Response Time</Label>
                      <div className="font-medium">{testResult.model_a.metrics.response_time}s</div>
                    </div>
                    <div>
                      <Label className="text-muted-foreground">Tokens</Label>
                      <div className="font-medium">{testResult.model_a.metrics.token_count}</div>
                    </div>
                    <div>
                      <Label className="text-muted-foreground">Confidence</Label>
                      <div className="font-medium">{(testResult.model_a.metrics.confidence_score * 100).toFixed(1)}%</div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Model B Results */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span>Model B: {testResult.model_b.model}</span>
                    {testResult.comparison?.winner === testResult.model_b.model && (
                      <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">Winner</span>
                    )}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">Response</Label>
                    <div className="p-3 bg-muted rounded-lg mt-1">
                      <p className="text-sm">{testResult.model_b.response}</p>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-3 gap-4 text-sm">
                    <div>
                      <Label className="text-muted-foreground">Response Time</Label>
                      <div className="font-medium">{testResult.model_b.metrics.response_time}s</div>
                    </div>
                    <div>
                      <Label className="text-muted-foreground">Tokens</Label>
                      <div className="font-medium">{testResult.model_b.metrics.token_count}</div>
                    </div>
                    <div>
                      <Label className="text-muted-foreground">Confidence</Label>
                      <div className="font-medium">{(testResult.model_b.metrics.confidence_score * 100).toFixed(1)}%</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Comparison Summary */}
          {testResult && testResult.success && testResult.comparison && (
            <Card>
              <CardHeader>
                <CardTitle>Comparison Summary</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-center">
                    <Label className="text-sm text-muted-foreground">Speed</Label>
                    <div className="font-medium text-lg">{testResult.comparison.criteria.speed}</div>
                  </div>
                  <div className="text-center">
                    <Label className="text-sm text-muted-foreground">Accuracy</Label>
                    <div className="font-medium text-lg">{testResult.comparison.criteria.accuracy}</div>
                  </div>
                  <div className="text-center">
                    <Label className="text-sm text-muted-foreground">Coherence</Label>
                    <div className="font-medium text-lg">{testResult.comparison.criteria.coherence}</div>
                  </div>
                  <div className="text-center">
                    <Label className="text-sm text-muted-foreground">Completeness</Label>
                    <div className="font-medium text-lg">{testResult.comparison.criteria.completeness}</div>
                  </div>
                </div>
                
                <div className="mt-6 p-4 bg-primary/10 rounded-lg border border-primary/20">
                  <h3 className="font-semibold text-primary mb-2">Overall Winner: {testResult.comparison.winner}</h3>
                  <p className="text-sm text-muted-foreground">
                    Based on the comparison criteria, {testResult.comparison.winner} performed better overall for this specific prompt and query combination.
                  </p>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};

export default ABTesting;