import { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { Upload, Loader2, CheckCircle, XCircle } from "lucide-react";

const UploadRefine = () => {
  const location = useLocation();
  const [isProcessing, setIsProcessing] = useState(false);
  const [processResult, setProcessResult] = useState<any>(null);
  const [promptValue, setPromptValue] = useState("");
  const [industryValue, setIndustryValue] = useState("finance");
  const [usecaseValue, setUsecaseValue] = useState("report generation");

  // Load prompt from URL params if available
  useEffect(() => {
    const urlParams = new URLSearchParams(location.search);
    const promptFromUrl = urlParams.get('prompt');
    if (promptFromUrl) {
      setPromptValue(decodeURIComponent(promptFromUrl));
      toast.success("Prompt loaded for refinement!");
    }
  }, [location]);

  // Handle prompt passed from other pages
  useEffect(() => {
    if (location.state?.promptToRefine) {
      setPromptValue(location.state.promptToRefine);
      toast.success("Prompt loaded for refinement!");
    }
  }, [location.state]);

  const processPrompt = async (content: string, industry: string, useCase: string) => {
    try {
      const response = await fetch('http://localhost:5001/api/process-prompt', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          content,
          industry,
          use_case: useCase,
        }),
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('Backend processing error:', error);
      throw error;
    }
  };

  const handleProcessPrompt = async () => {
    if (!promptValue.trim()) {
      toast.error('Please enter a prompt to process');
      return;
    }

    setIsProcessing(true);
    setProcessResult(null);

    try {
      const result = await processPrompt(promptValue, industryValue, usecaseValue);
      setProcessResult(result);
      
      if (result.success) {
        toast.success('Prompt refined successfully!');
      } else {
        toast.error(`Refinement failed: ${result.error}`);
      }
    } catch (error) {
      console.error('Processing error:', error);
      toast.error(`Error refining prompt: ${error instanceof Error ? error.message : 'Unknown error'}`);
      setProcessResult({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const content = e.target?.result as string;
        setPromptValue(content);
        toast.success(`File "${file.name}" loaded successfully!`);
      };
      reader.readAsText(file);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">Upload & Refine</h1>
          <p className="text-muted-foreground">
            Upload your prompt files and refine them with our AI-powered 5-step pipeline
          </p>
        </div>

        <div className="space-y-8">
          {/* Configuration */}
          <Card>
            <CardHeader>
              <CardTitle>Configuration</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="industry">Industry</Label>
                  <Input
                    id="industry"
                    value={industryValue}
                    onChange={(e) => setIndustryValue(e.target.value)}
                    placeholder="e.g., finance, healthcare, education"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="usecase">Use Case</Label>
                  <Input
                    id="usecase"
                    value={usecaseValue}
                    onChange={(e) => setUsecaseValue(e.target.value)}
                    placeholder="e.g., report generation, customer service"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Upload Area */}
          <Card>
            <CardHeader>
              <CardTitle>Upload Prompt File</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="border-2 border-dashed border-border rounded-lg p-8 text-center">
                <Upload className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                <p className="text-foreground font-medium mb-2">Drop your files here</p>
                <p className="text-sm text-muted-foreground mb-4">
                  Supports .md, .txt files up to 10MB
                </p>
                <input
                  type="file"
                  accept=".md,.txt"
                  onChange={handleFileUpload}
                  className="hidden"
                  id="file-upload"
                />
                <Button asChild>
                  <label htmlFor="file-upload" className="cursor-pointer">
                    Choose Files
                  </label>
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Prompt Editor */}
          <Card>
            <CardHeader>
              <CardTitle>Prompt Editor</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="prompt-input">Enter Your Prompt</Label>
                <Textarea
                  id="prompt-input"
                  value={promptValue}
                  onChange={(e) => setPromptValue(e.target.value)}
                  placeholder="Enter your prompt here to be processed by our AI agent..."
                  className="min-h-[200px] resize-none"
                  disabled={isProcessing}
                />
              </div>
              
              <Button 
                onClick={handleProcessPrompt}
                disabled={isProcessing || !promptValue.trim()}
                className="w-full"
                size="lg"
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Refining with 5-Step Pipeline...
                  </>
                ) : (
                  "Refine with 5-Step Pipeline"
                )}
              </Button>
            </CardContent>
          </Card>

          {/* Results */}
          {processResult && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  {processResult.success ? (
                    <>
                      <CheckCircle className="w-5 h-5 text-green-600" />
                      <span className="text-green-800">Refinement Complete</span>
                    </>
                  ) : (
                    <>
                      <XCircle className="w-5 h-5 text-red-600" />
                      <span className="text-red-800">Refinement Failed</span>
                    </>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {processResult.success ? (
                  <div className="space-y-6">
                    {/* Refined Prompt */}
                    <div className="space-y-2">
                      <Label className="text-lg font-semibold text-green-800">
                        Refined Prompt
                      </Label>
                      <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                        <pre className="whitespace-pre-wrap text-sm font-mono max-h-96 overflow-y-auto">
                          {processResult.refined_prompt || processResult.result}
                        </pre>
                      </div>
                      <Button 
                        onClick={() => navigator.clipboard.writeText(processResult.refined_prompt || processResult.result)}
                        variant="outline"
                        size="sm"
                      >
                        Copy Refined Prompt
                      </Button>
                    </div>

                    {/* Processing Steps */}
                    {processResult.steps && (
                      <div className="space-y-2">
                        <Label className="text-lg font-semibold text-blue-800">
                          Processing Steps
                        </Label>
                        <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                          <pre className="whitespace-pre-wrap text-sm max-h-64 overflow-y-auto">
                            {processResult.steps}
                          </pre>
                        </div>
                      </div>
                    )}
                    
                    {/* Metadata */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm pt-4 border-t">
                      <div className="flex flex-col">
                        <span className="font-medium text-muted-foreground">Industry</span>
                        <span className="text-foreground">{processResult.industry || industryValue}</span>
                      </div>
                      <div className="flex flex-col">
                        <span className="font-medium text-muted-foreground">Use Case</span>
                        <span className="text-foreground">{processResult.use_case || usecaseValue}</span>
                      </div>
                      <div className="flex flex-col">
                        <span className="font-medium text-muted-foreground">Method</span>
                        <span className="text-foreground">5-Step AI Pipeline</span>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="p-4 bg-red-50 rounded-lg border border-red-200">
                    <p className="text-red-800 text-sm">
                      <strong>Error:</strong> {processResult.error}
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

export default UploadRefine;