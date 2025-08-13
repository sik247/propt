import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { ArrowLeft, Loader2, Sparkles, CheckCircle, FileText } from "lucide-react";

const GeneratePrompt = () => {
  const navigate = useNavigate();
  const [isGenerating, setIsGenerating] = useState(false);
  const [industry, setIndustry] = useState("finance");
  const [usecase, setUsecase] = useState("report generation");
  const [promptDescription, setPromptDescription] = useState("");
  const [generatedResult, setGeneratedResult] = useState<any>(null);

  const handleGenerate = async () => {
    if (!promptDescription.trim()) {
      toast.error('Please describe what your prompt should be about');
      return;
    }

    setIsGenerating(true);
    setGeneratedResult(null);

    try {
      const response = await fetch('http://localhost:5001/api/generate-prompt', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          industry: industry,
          use_case: usecase,
          context: promptDescription
        }),
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
      }
      
      const result = await response.json();
      setGeneratedResult(result);
      
      if (result.success) {
        toast.success('Prompt generated successfully!');
      } else {
        toast.error(`Generation failed: ${result.error}`);
      }
    } catch (error) {
      console.error('Generation error:', error);
      toast.error(`Error generating prompt: ${error instanceof Error ? error.message : 'Unknown error'}`);
      setGeneratedResult({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b border-border bg-card">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center gap-4">
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => navigate('/')}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Home
            </Button>
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-semibold text-foreground">Generate New Prompt</h1>
                <p className="text-sm text-muted-foreground">Create a custom prompt with AI assistance</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-6 py-8 max-w-4xl">
        <div className="space-y-8">
          
          {/* Top AI Services Section */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-purple-600" />
                Check out the prompts of the top AI services
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {[
                  "Claude", "ChatGPT", "Perplexity", "Cursor Prompts", 
                  "Devin AI", "Replit", "Lovable", "Open Source prompts"
                ].map((service) => (
                  <Button
                    key={service}
                    variant="outline"
                    className="h-20 flex flex-col items-center justify-center gap-2 text-foreground border-border hover:bg-muted"
                    onClick={async () => {
                      try {
                        const response = await fetch(`http://localhost:5001/api/load-prompt/${encodeURIComponent(service)}`);
                        if (response.ok) {
                          const data = await response.json();
                          setPromptDescription(data.content);
                          toast.success(`Loaded ${service} prompt as template`);
                        } else {
                          toast.error(`Failed to load ${service} prompt`);
                        }
                      } catch (error) {
                        toast.error(`Error loading ${service} prompt`);
                      }
                    }}
                  >
                    <FileText className="w-6 h-6" />
                    <span className="text-sm text-center">{service}</span>
                  </Button>
                ))}
              </div>
              <p className="text-xs text-muted-foreground mt-4">
                Click any service to load their prompt as a starting template for your generation.
              </p>
            </CardContent>
          </Card>

          {/* Configuration Section */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-blue-600" />
                Prompt Configuration
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              
              {/* Industry and Use Case */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="industry" className="text-sm font-medium">Industry</Label>
                  <Input
                    id="industry"
                    value={industry}
                    onChange={(e) => setIndustry(e.target.value)}
                    placeholder="e.g., finance, healthcare, education"
                    className="w-full"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="usecase" className="text-sm font-medium">Use Case</Label>
                  <Input
                    id="usecase"
                    value={usecase}
                    onChange={(e) => setUsecase(e.target.value)}
                    placeholder="e.g., report generation, customer service"
                    className="w-full"
                  />
                </div>
              </div>

              {/* Prompt Description */}
              <div className="space-y-2">
                <Label htmlFor="description" className="text-sm font-medium">
                  What should this prompt be about?
                </Label>
                <Textarea
                  id="description"
                  value={promptDescription}
                  onChange={(e) => setPromptDescription(e.target.value)}
                  placeholder="Describe what you want the prompt to do. For example: 'Create a prompt that helps generate financial reports with key metrics and insights for quarterly reviews'"
                  className="min-h-[120px] resize-none"
                />
                <p className="text-xs text-muted-foreground">
                  Be specific about the task, desired output format, and any special requirements.
                </p>
              </div>

              {/* Generate Button */}
              <Button 
                onClick={handleGenerate}
                disabled={isGenerating || !promptDescription.trim()}
                className="w-full bg-blue-600 hover:bg-blue-700"
                size="lg"
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Generating with GPT-5...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 mr-2" />
                    Generate Prompt
                  </>
                )}
              </Button>
            </CardContent>
          </Card>

          {/* Results Section */}
          {generatedResult && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  {generatedResult.success ? (
                    <>
                      <CheckCircle className="w-5 h-5 text-green-600" />
                      <span className="text-green-800">Generated Prompt</span>
                    </>
                  ) : (
                    <span className="text-red-800">Generation Failed</span>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {generatedResult.success ? (
                  <div className="space-y-6">
                    {/* Show structured sections if available */}
                    {generatedResult.final_prompt ? (
                      <>
                        {/* 1. Final System Prompt */}
                        <div className="space-y-2">
                          <Label className="text-lg font-semibold text-green-800 flex items-center gap-2">
                            🎯 Final System Prompt
                          </Label>
                          <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                            <pre className="whitespace-pre-wrap text-sm font-mono max-h-96 overflow-y-auto">
                              {generatedResult.final_prompt}
                            </pre>
                          </div>
                          <div className="flex gap-2">
                            <Button 
                              onClick={() => navigator.clipboard.writeText(generatedResult.final_prompt)}
                              variant="outline"
                              size="sm"
                            >
                              Copy Final Prompt
                            </Button>
                            <Button 
                              onClick={() => navigate('/', { state: { promptToRefine: generatedResult.final_prompt } })}
                              className="bg-orange-600 hover:bg-orange-700"
                              size="sm"
                            >
                              Refine This Prompt
                            </Button>
                          </div>
                        </div>

                        {/* 2. Planning & Research */}
                        <div className="space-y-2">
                          <Label className="text-lg font-semibold text-blue-800 flex items-center gap-2">
                            📋 Research & Planning
                          </Label>
                          <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                            <pre className="whitespace-pre-wrap text-sm max-h-64 overflow-y-auto">
                              {generatedResult.planning}
                            </pre>
                          </div>
                        </div>

                        {/* 3. Considerations & Implementation */}
                        <div className="space-y-2">
                          <Label className="text-lg font-semibold text-purple-800 flex items-center gap-2">
                            ⚙️ Implementation Considerations
                          </Label>
                          <div className="p-4 bg-purple-50 rounded-lg border border-purple-200">
                            <pre className="whitespace-pre-wrap text-sm max-h-64 overflow-y-auto">
                              {generatedResult.considerations}
                            </pre>
                          </div>
                        </div>
                      </>
                    ) : (
                      /* Fallback for unstructured response */
                      <div className="space-y-2">
                        <Label className="text-sm font-medium text-green-800">Generated Prompt:</Label>
                        <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                          <pre className="whitespace-pre-wrap text-sm font-mono max-h-96 overflow-y-auto">
                            {generatedResult.generated_prompt}
                          </pre>
                        </div>
                        <div className="flex gap-2">
                          <Button 
                            onClick={() => navigator.clipboard.writeText(generatedResult.generated_prompt)}
                            variant="outline"
                            size="sm"
                          >
                            Copy Prompt
                          </Button>
                          <Button 
                            onClick={() => navigate('/', { state: { promptToRefine: generatedResult.generated_prompt } })}
                            className="bg-orange-600 hover:bg-orange-700"
                            size="sm"
                          >
                            Refine This Prompt
                          </Button>
                        </div>
                      </div>
                    )}
                    
                    {/* Metadata */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm pt-4 border-t">
                      <div className="flex flex-col">
                        <span className="font-medium text-muted-foreground">Industry</span>
                        <span className="text-foreground">{generatedResult.industry}</span>
                      </div>
                      <div className="flex flex-col">
                        <span className="font-medium text-muted-foreground">Use Case</span>
                        <span className="text-foreground">{generatedResult.usecase}</span>
                      </div>
                      <div className="flex flex-col">
                        <span className="font-medium text-muted-foreground">Method</span>
                        <span className="text-foreground">{generatedResult.method || 'GPT-5 Sequential Thinking'}</span>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="p-4 bg-red-50 rounded-lg border border-red-200">
                    <p className="text-red-800 text-sm">
                      <strong>Error:</strong> {generatedResult.error}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};

export default GeneratePrompt;
