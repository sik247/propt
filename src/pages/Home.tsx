import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Sparkles, ArrowRight, Zap, Shield, Layers } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useState } from "react";

const Home = () => {
  const navigate = useNavigate();
  const [industry, setIndustry] = useState("");
  const [useCase, setUseCase] = useState("");

  const features = [
    {
      icon: Sparkles,
      title: "AI-Powered Generation",
      description: "Generate high-quality prompts using advanced AI models and proven techniques."
    },
    {
      icon: Zap,
      title: "5-Step Pipeline",
      description: "Refine your prompts through our sophisticated 5-step optimization process."
    },
    {
      icon: Layers,
      title: "A/B Testing",
      description: "Compare different models and approaches to find the perfect prompt."
    },
    {
      icon: Shield,
      title: "Secure & Private",
      description: "Your API keys and prompts are encrypted and stored securely."
    }
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
          <div className="text-center">
            <h1 className="text-5xl sm:text-6xl font-bold text-foreground mb-6">
              Craft Perfect{" "}
              <span className="text-primary">AI Prompts</span>
            </h1>
            <p className="text-xl text-muted-foreground mb-8 max-w-3xl mx-auto">
              Generate, refine, and test AI prompts with our advanced pipeline. 
              Get better results from any AI model with optimized prompts.
            </p>
            
            {/* Quick Start Form */}
            <Card className="max-w-md mx-auto mb-8">
              <CardHeader>
                <CardTitle className="text-lg">Quick Start</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="industry">Industry</Label>
                  <Input
                    id="industry"
                    placeholder="e.g., finance, healthcare"
                    value={industry}
                    onChange={(e) => setIndustry(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="usecase">Use Case</Label>
                  <Input
                    id="usecase"
                    placeholder="e.g., report generation"
                    value={useCase}
                    onChange={(e) => setUseCase(e.target.value)}
                  />
                </div>
                <Button 
                  className="w-full"
                  onClick={() => navigate('/generate', { state: { industry, useCase } })}
                >
                  Generate Prompt
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </CardContent>
            </Card>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" onClick={() => navigate('/browse')}>
                Browse Prompts
              </Button>
              <Button size="lg" variant="outline" onClick={() => navigate('/upload')}>
                Upload & Refine
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="py-24 bg-muted/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-foreground mb-4">
              Why Choose Propt?
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Professional prompt engineering tools used by top AI companies and developers.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => (
              <Card key={index} className="text-center">
                <CardContent className="pt-6">
                  <feature.icon className="w-12 h-12 text-primary mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-foreground mb-2">
                    {feature.title}
                  </h3>
                  <p className="text-muted-foreground">
                    {feature.description}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="py-24">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold text-foreground mb-4">
            Ready to Get Started?
          </h2>
          <p className="text-lg text-muted-foreground mb-8">
            Join thousands of developers and researchers using Propt to create better AI prompts.
          </p>
          <Button size="lg" className="bg-primary hover:bg-primary/90">
            <Sparkles className="w-5 h-5 mr-2" />
            Start Creating Prompts
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Home;