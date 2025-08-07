import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ChevronDown } from "lucide-react";

const MainContent = () => {
  const promptSuggestions = [
    "Write user stories for...",
    "Outline a PRD for...",
    "Analyze competitors of...",
    "Define KPIs for...",
    "Create a user persona for...",
    "Brainstorm A/B tests for...",
    "Summarize customer feedback about...",
    "Draft a GTM plan for...",
    "Prioritize features using..."
  ];

  return (
    <div className="flex-1 flex flex-col h-screen">
      {/* Header */}
      <div className="border-b border-border bg-background">
        <div className="flex items-center justify-between p-4">
          <div className="flex items-center gap-4">
            <Button variant="default" className="bg-primary hover:bg-primary/90">
              Generate
            </Button>
            <Button variant="outline">
              Compare Models
            </Button>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">💰 8</span>
            <Button variant="ghost" size="sm">
              <ChevronDown className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-4xl text-center space-y-8">
          {/* Welcome Section */}
          <div className="space-y-4">
            <div className="w-20 h-20 bg-primary rounded-full flex items-center justify-center mx-auto mb-6">
              <img 
                src="/lovable-uploads/0fc2130e-03a0-44e0-9b18-d3249c9f27ac.png" 
                alt="Propt" 
                className="w-12 h-12"
              />
            </div>
            <h1 className="text-3xl font-bold text-foreground">
              Hello there!
            </h1>
            <p className="text-xl text-primary font-medium">
              Let's optimize those AI conversations!
            </p>
          </div>

          {/* Prompt Input Area */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 max-w-2xl mx-auto">
              <Button variant="outline" size="sm" className="shrink-0">
                <ChevronDown className="w-4 h-4 mr-2" />
                Text Mode
              </Button>
            </div>
            
            <div className="max-w-2xl mx-auto">
              <Textarea
                placeholder="Optimize your AI prompts..."
                className="min-h-[120px] resize-none border-border focus:ring-primary focus:border-primary"
              />
            </div>

            <div className="flex items-center gap-4 max-w-2xl mx-auto">
              <Button variant="outline" size="sm">
                <span className="text-primary">⚡</span>
                <span className="ml-2">Primer</span>
                <ChevronDown className="w-4 h-4 ml-2" />
              </Button>
              <Button variant="outline" size="sm">
                Add Context
                <ChevronDown className="w-4 h-4 ml-2" />
              </Button>
              <Button className="bg-primary hover:bg-primary/90 ml-auto">
                Generate Prompt
              </Button>
            </div>
          </div>

          {/* Prompt Suggestions */}
          <div className="space-y-4">
            <div className="flex flex-wrap gap-2 justify-center max-w-3xl mx-auto">
              {promptSuggestions.map((suggestion, index) => (
                <Button
                  key={index}
                  variant="secondary"
                  size="sm"
                  className="text-sm hover:bg-muted border border-border"
                >
                  {suggestion}
                </Button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MainContent;