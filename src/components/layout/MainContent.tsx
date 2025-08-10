import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FileText, Upload } from "lucide-react";
import PromptAnalyzer from "@/components/PromptAnalyzer";

const MainContent = () => {
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
                defaultValue="finance"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="usecase" className="text-foreground">Use case</Label>
              <Input 
                id="usecase"
                placeholder="e.g., report generation"
                className="bg-input border-border text-foreground"
                defaultValue="report generation"
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
            <div className="space-y-4">
              <h3 className="text-xl font-semibold text-foreground">Browse AI Service Prompts</h3>
              <p className="text-muted-foreground">
                Explore optimized prompts for various AI tools and services.
              </p>
              
              <div className="grid grid-cols-2 gap-4 mt-6">
                {[
                  "Manus Agent Tools",
                  "Devin AI Prompts", 
                  "Z.ai Code Templates",
                  "Trae Workflows",
                  "Perplexity Queries",
                  "Cluely Prompts",
                  "Kiro Templates",
                  "Replit Snippets"
                ].map((service) => (
                  <Button
                    key={service}
                    variant="outline"
                    className="h-20 flex flex-col items-center justify-center gap-2 text-foreground border-border hover:bg-muted"
                  >
                    <FileText className="w-6 h-6" />
                    <span className="text-sm">{service}</span>
                  </Button>
                ))}
              </div>
            </div>
          </TabsContent>
          
          <TabsContent value="upload" className="mt-6">
            <PromptAnalyzer />
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