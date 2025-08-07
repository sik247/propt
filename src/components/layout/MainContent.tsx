import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FileText, Upload } from "lucide-react";

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
              Prompt Refiner Agent
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
          <TabsList className="grid w-full grid-cols-3 bg-muted">
            <TabsTrigger value="intro" className="text-primary data-[state=active]:text-primary">
              Intro
            </TabsTrigger>
            <TabsTrigger value="browse" className="data-[state=active]:text-primary">
              Browse Prompts
            </TabsTrigger>
            <TabsTrigger value="upload" className="data-[state=active]:text-primary">
              Upload & Refine
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="intro" className="mt-6">
            <div className="space-y-6">
              <h2 className="text-3xl font-bold text-foreground">
                Welcome to the Prompt Refiner Agent!
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
            <div className="space-y-4">
              <h3 className="text-xl font-semibold text-foreground">Upload & Refine Your Prompts</h3>
              <p className="text-muted-foreground">
                Upload your prompt files and let our AI refine them for optimal performance.
              </p>
              
              <div className="border-2 border-dashed border-border rounded-lg p-8 text-center">
                <Upload className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                <p className="text-foreground font-medium mb-2">Drop your files here</p>
                <p className="text-sm text-muted-foreground mb-4">
                  Supports .md, .txt files up to 10MB
                </p>
                <Button className="bg-primary hover:bg-primary/90">
                  Choose Files
                </Button>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default MainContent;