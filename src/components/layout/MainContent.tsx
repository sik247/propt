import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FileText, Upload, Loader2, CheckCircle, XCircle, Sparkles, Plus, ChevronDown, ChevronUp } from "lucide-react";
import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { toast } from "sonner";

// Function to process prompts using the backend
const processPrompt = async (content: string, industry: string, useCase: string) => {
  try {
    // Call the Flask backend API
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

const MainContent = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [isProcessing, setIsProcessing] = useState(false);
  const [processResult, setProcessResult] = useState<any>(null);
  const [promptValue, setPromptValue] = useState("");
  const [industryValue, setIndustryValue] = useState("finance");
  const [usecaseValue, setUsecaseValue] = useState("report generation");
  const [showTopServices, setShowTopServices] = useState(false);

  // Handle prompt passed from Generate page
  useEffect(() => {
    if (location.state?.promptToRefine) {
      setPromptValue(location.state.promptToRefine);
      toast.success("Prompt loaded for refinement!");
    }
  }, [location.state]);

  const handleNavigateToGenerate = () => {
    navigate('/generate');
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

  return (
    <div className="flex-1 flex flex-col h-screen bg-background">
      {/* Header */}
      <div className="border-b border-border bg-card">
        <div className="flex items-center justify-between p-6">
          <div className="flex items-center gap-4">
            <img 
              src="/lovable-uploads/0fc2130e-03a0-44e0-9b18-d3249c9f27ac.png" 
              alt="Propt" 
              className="w-8 h-8"
            />
            <h1 className="text-2xl font-bold text-foreground">
              propt
            </h1>
          </div>
        </div>
        
        {/* Industry and Use Case Fields */}
        <div className="px-6 pb-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="industry" className="text-foreground">Industry</Label>
              <Input 
                id="industry"
                placeholder="e.g., finance"
                className="bg-input border-border text-foreground"
                value={industryValue}
                onChange={(e) => setIndustryValue(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="usecase" className="text-foreground">Use case</Label>
              <Input 
                id="usecase"
                placeholder="e.g., report generation"
                className="bg-input border-border text-foreground"
                value={usecaseValue}
                onChange={(e) => setUsecaseValue(e.target.value)}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 p-6">
        <Tabs defaultValue="intro" className="w-full">
          <TabsList className="grid w-full grid-cols-4 bg-muted">
            <TabsTrigger value="intro" className="text-primary data-[state=active]:text-primary">
              Intro
            </TabsTrigger>
            <TabsTrigger value="browse" className="data-[state=active]:text-primary">
              Browse Prompts
            </TabsTrigger>
            <TabsTrigger value="upload" className="data-[state=active]:text-primary">
              Upload & Refine
            </TabsTrigger>
            <TabsTrigger value="testing" className="data-[state=active]:text-primary">
              A/B Testing
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="intro" className="mt-6">
            <div className="space-y-6">
              <h2 className="text-3xl font-bold text-foreground">
                Welcome to propt!
              </h2>
              
              <div className="space-y-4 text-foreground">
                <div className="flex items-start gap-3">
                  <span className="w-2 h-2 bg-primary rounded-full mt-2 shrink-0"></span>
                  <div>
                    <span className="font-semibold">Browse Prompts:</span> Select from preloaded prompt tools and files.
                  </div>
                </div>
                
                <div className="flex items-start gap-3">
                  <span className="w-2 h-2 bg-primary rounded-full mt-2 shrink-0"></span>
                  <div>
                    <span className="font-semibold">Upload & Refine:</span> Upload your own prompt file (
                    <code className="bg-muted px-1 rounded text-primary">.md</code> or{" "}
                    <code className="bg-muted px-1 rounded text-primary">.txt</code>
                    ) and let the agent refine it.
                  </div>
                </div>
                
                <div className="flex items-start gap-3">
                  <span className="w-2 h-2 bg-primary rounded-full mt-2 shrink-0"></span>
                  <div>
                    <span className="font-semibold">Powered by your custom agent pipeline.</span>
                  </div>
                </div>
              </div>
              
              <div className="mt-8 p-4 bg-card border border-border rounded-lg">
                <h3 className="font-semibold text-foreground mb-2">Supported AI Models:</h3>
                <div className="grid grid-cols-2 gap-2 text-sm text-muted-foreground">
                  <div>• ChatGPT (GPT-4, GPT-3.5)</div>
                  <div>• Claude (Anthropic)</div>
                  <div>• Meta LLaMA</div>
                  <div>• Mistral AI</div>
                  <div>• Google Gemini</div>
                  <div>• Perplexity</div>
                </div>
              </div>
            </div>
          </TabsContent>
          
          <TabsContent value="browse" className="mt-6">
            <div className="space-y-6">
              <div className="text-center">
                <h3 className="text-xl font-semibold text-foreground">Browse AI Service Prompts</h3>
                <p className="text-muted-foreground">
                  Explore and discover prompts from top AI tools and services
                </p>
              </div>

              {/* AI Coding Assistants */}
              <div className="space-y-4">
                <h4 className="text-lg font-semibold text-foreground flex items-center gap-2">
                  💻 AI Coding Assistants
                </h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {["Cursor Prompts", "Devin AI", "Windsurf", "Z.ai Code"].map((service) => (
                    <div
                      key={service}
                      className="h-20 flex flex-col items-center justify-center gap-2 p-4 border border-border rounded-lg bg-card hover:bg-muted/50 transition-colors"
                    >
                      <FileText className="w-6 h-6 text-blue-600" />
                      <span className="text-sm text-center font-medium">{service}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Conversational AI */}
              <div className="space-y-4">
                <h4 className="text-lg font-semibold text-foreground flex items-center gap-2">
                  💬 Conversational AI
                </h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {["Cluely", "Perplexity", "Junie", "Kiro"].map((service) => (
                    <div
                      key={service}
                      className="h-20 flex flex-col items-center justify-center gap-2 p-4 border border-border rounded-lg bg-card hover:bg-muted/50 transition-colors"
                    >
                      <FileText className="w-6 h-6 text-green-600" />
                      <span className="text-sm text-center font-medium">{service}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Development Platforms */}
              <div className="space-y-4">
                <h4 className="text-lg font-semibold text-foreground flex items-center gap-2">
                  🚀 Development Platforms
                </h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {["Lovable", "Replit", "v0 Prompts and Tools", "Warp.dev"].map((service) => (
                    <div
                      key={service}
                      className="h-20 flex flex-col items-center justify-center gap-2 p-4 border border-border rounded-lg bg-card hover:bg-muted/50 transition-colors"
                    >
                      <FileText className="w-6 h-6 text-purple-600" />
                      <span className="text-sm text-center font-medium">{service}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Community & Tools */}
              <div className="space-y-4">
                <h4 className="text-lg font-semibold text-foreground flex items-center gap-2">
                  🛠️ Community & Tools
                </h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {["Open Source prompts", "Manus Agent Tools & Prompt", "Same.dev", "dia"].map((service) => (
                    <div
                      key={service}
                      className="h-20 flex flex-col items-center justify-center gap-2 p-4 border border-border rounded-lg bg-card hover:bg-muted/50 transition-colors"
                    >
                      <FileText className="w-6 h-6 text-orange-600" />
                      <span className="text-sm text-center font-medium">{service}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="text-center pt-4 border-t">
                <p className="text-sm text-muted-foreground">
                  Browse and discover different prompt styles and approaches. To load and use prompts, visit the{" "}
                  <Button
                    variant="link"
                    className="h-auto p-0 text-blue-600 underline"
                    onClick={handleNavigateToGenerate}
                  >
                    Generate New Prompt
                  </Button>{" "}
                  page.
                </p>
              </div>
            </div>
          </TabsContent>
          
          <TabsContent value="upload" className="mt-6">
            <div className="space-y-4">
              <h3 className="text-xl font-semibold text-foreground">Upload & Refine Your Prompts</h3>
              <p className="text-muted-foreground">
                Upload your prompt files and let our AI refine them for optimal performance.
              </p>
              
              {/* Top Services Toggle Section */}
              <div className="space-y-4 mb-6">
                <Button
                  variant="outline"
                  onClick={() => setShowTopServices(!showTopServices)}
                  className="w-full flex items-center justify-between"
                >
                  <span>Load from Top AI Services</span>
                  {showTopServices ? (
                    <ChevronUp className="w-4 h-4" />
                  ) : (
                    <ChevronDown className="w-4 h-4" />
                  )}
                </Button>
                
                {showTopServices && (
                  <div className="p-4 border border-border rounded-lg bg-muted/20">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
                      {[
                        "Claude", "ChatGPT", "Perplexity", "Cursor Prompts", 
                        "Devin AI", "Replit", "Lovable", "Open Source prompts"
                      ].map((service) => (
                        <Button
                          key={service}
                          variant="outline"
                          size="sm"
                          className="h-16 flex flex-col items-center justify-center gap-1 text-foreground border-border hover:bg-muted"
                          onClick={async () => {
                            try {
                              const response = await fetch(`http://localhost:5001/api/load-prompt/${encodeURIComponent(service)}`);
                              if (response.ok) {
                                const data = await response.json();
                                setPromptValue(data.content);
                                toast.success(`Loaded ${service} prompt`);
                                setShowTopServices(false); // Collapse after loading
                              } else {
                                toast.error(`Failed to load ${service} prompt`);
                              }
                            } catch (error) {
                              toast.error(`Error loading ${service} prompt`);
                            }
                          }}
                        >
                          <FileText className="w-4 h-4" />
                          <span className="text-xs text-center">{service}</span>
                        </Button>
                      ))}
                    </div>
                    <p className="text-xs text-muted-foreground text-center">
                      Click any service to load their prompt into the editor below
                    </p>
                  </div>
                )}
              </div>

              {/* Prompt Input Area */}
              <div className="space-y-4 mb-6">
                <Label htmlFor="prompt-input" className="text-foreground text-lg font-medium">Enter Your Prompt</Label>
                <textarea 
                  id="prompt-input"
                  placeholder="Enter your prompt here to be processed by our AI agent..."
                  className="w-full h-32 px-3 py-2 rounded-md border border-border bg-input text-foreground placeholder:text-muted-foreground resize-none"
                  value={promptValue}
                  onChange={(e) => setPromptValue(e.target.value)}
                  disabled={isProcessing}
                />
              </div>
              
              <div className="border-2 border-dashed border-border rounded-lg p-8 text-center">
                <Upload className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                <p className="text-foreground font-medium mb-2">Drop your files here</p>
                <p className="text-sm text-muted-foreground mb-4">
                  Supports .md, .txt files up to 10MB
                </p>
                <div className="space-y-3">
                  <Button className="bg-primary hover:bg-primary/90">
                    Choose Files
                  </Button>
                  <div className="text-sm text-muted-foreground">or</div>
                  <div className="space-y-3">
                    <Button 
                      className="bg-blue-600 hover:bg-blue-700 w-full"
                      onClick={handleNavigateToGenerate}
                    >
                      <Sparkles className="w-4 h-4 mr-2" />
                      Generate New Prompt
                    </Button>
                    
                    <Button 
                      className="bg-primary hover:bg-primary/90 w-full"
                      onClick={handleProcessPrompt}
                      disabled={isProcessing || !promptValue.trim()}
                    >
                      {isProcessing ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Refining...
                        </>
                      ) : (
                        "Refine with 5-Step Pipeline"
                      )}
                    </Button>
                  </div>
                </div>
              </div>

              {/* Results Section */}
              {processResult && (
                <div className="mt-8 space-y-4">
                  <h4 className="text-lg font-medium text-foreground">Processing Results</h4>
                  
                  {processResult.success ? (
                    <Card className="bg-green-50 border-green-200">
                      <CardHeader className="pb-3">
                        <CardTitle className="flex items-center gap-2 text-green-800">
                          <CheckCircle className="w-5 h-5" />
                          Prompt Successfully Refined
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div>
                          <Label className="text-sm font-medium text-green-800">Original Prompt:</Label>
                          <div className="mt-1 p-3 bg-white rounded border text-sm">
                            {processResult.original_prompt}
                          </div>
                        </div>
                        <div>
                          <Label className="text-sm font-medium text-green-800">Refined Prompt:</Label>
                          <div className="mt-1 p-3 bg-white rounded border text-sm whitespace-pre-wrap">
                            {processResult.processed_prompt}
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4 text-xs text-green-700">
                          <div><span className="font-medium">Method:</span> {processResult.method || '5-Step Agent Pipeline'}</div>
                          <div><span className="font-medium">Industry:</span> {processResult.industry}</div>
                        </div>
                      </CardContent>
                    </Card>
                  ) : (
                    <Card className="bg-red-50 border-red-200">
                      <CardHeader className="pb-3">
                        <CardTitle className="flex items-center gap-2 text-red-800">
                          <XCircle className="w-5 h-5" />
                          Processing Failed
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="text-red-700 text-sm">
                          {processResult.error || 'An unknown error occurred during processing.'}
                        </div>
                      </CardContent>
                    </Card>
                  )}
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="testing" className="mt-6">
            <div className="space-y-6">
              <h3 className="text-xl font-semibold text-foreground">A/B Testing & Model Comparison</h3>
              <p className="text-muted-foreground">
                Compare prompts across different AI models with visual results.
              </p>
              
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Prompt Input Section */}
                <div className="space-y-4">
                  <h4 className="text-lg font-medium text-foreground">Prompt Input</h4>
                  
                  <div className="space-y-3">
                    <div className="flex gap-2">
                      <Button variant="outline" className="flex-1">
                        Upload .md File
                      </Button>
                      <Button variant="outline" className="flex-1">
                        Paste Prompt
                      </Button>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="test-prompt" className="text-foreground">Prompt Content</Label>
                      <textarea 
                        id="test-prompt"
                        placeholder="Enter your prompt to test across different models..."
                        className="w-full h-32 px-3 py-2 rounded-md border border-border bg-input text-foreground placeholder:text-muted-foreground resize-none"
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="query-input" className="text-foreground">Test Query</Label>
                      <Input 
                        id="query-input"
                        placeholder="Enter a test query to evaluate responses..."
                        className="bg-input border-border text-foreground"
                      />
                    </div>
                  </div>
                </div>

                {/* Model Selection Section */}
                <div className="space-y-4">
                  <h4 className="text-lg font-medium text-foreground">Select AI Models</h4>
                  <div className="grid grid-cols-2 gap-3">
                    {[
                      { name: "GPT-4", company: "OpenAI", logo: "🤖" },
                      { name: "Claude-3", company: "Anthropic", logo: "🧠" },
                      { name: "Gemini Pro", company: "Google", logo: "🔍" },
                      { name: "Mistral Large", company: "Mistral", logo: "⚡" },
                      { name: "LLaMA 2", company: "Meta", logo: "📘" },
                      { name: "Perplexity", company: "Perplexity", logo: "🔮" }
                    ].map((model) => (
                      <div key={model.name} className="flex items-center gap-3 p-3 border border-border rounded-lg hover:bg-muted cursor-pointer">
                        <input 
                          type="checkbox" 
                          id={model.name.toLowerCase().replace(/[\s.-]/g, '-')}
                          className="rounded border-border"
                        />
                        <div className="flex items-center gap-2">
                          <span className="text-2xl">{model.logo}</span>
                          <div>
                            <div className="text-sm font-medium text-foreground">{model.name}</div>
                            <div className="text-xs text-muted-foreground">{model.company}</div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                  
                  <Button className="w-full bg-primary hover:bg-primary/90">
                    Start Comparison Test
                  </Button>
                </div>
              </div>

              {/* Test Results */}
              <div className="mt-8 space-y-4">
                <h4 className="text-lg font-medium text-foreground">Comparison Results</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {[
                    { model: "GPT-4", company: "OpenAI", logo: "🤖", score: "9.2/10" },
                    { model: "Claude-3", company: "Anthropic", logo: "🧠", score: "8.8/10" }
                  ].map((result) => (
                    <div key={result.model} className="p-4 bg-card border border-border rounded-lg">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <span className="text-xl">{result.logo}</span>
                          <div>
                            <div className="font-medium text-foreground">{result.model}</div>
                            <div className="text-xs text-muted-foreground">{result.company}</div>
                          </div>
                        </div>
                        <div className="text-sm font-medium text-primary">{result.score}</div>
                      </div>
                      <div className="text-sm text-muted-foreground">
                        Response quality analysis will appear here after testing...
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default MainContent;