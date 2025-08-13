import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FileText, Search, Download } from "lucide-react";
import { toast } from "sonner";

const BrowsePrompts = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedPrompt, setSelectedPrompt] = useState<any>(null);

  const categories = [
    { id: "all", name: "All Prompts", count: 10 },
    { id: "coding", name: "AI Coding Assistants", count: 6 },
    { id: "conversational", name: "Conversational AI", count: 2 },
    { id: "development", name: "Development Platforms", count: 4 }
  ];

  const prompts = [
    {
      id: 1,
      name: "Devin AI",
      category: "coding",
      description: "A software engineer using a real computer operating system, specialized in understanding codebases and writing functional code",
      file: "Prompt.txt",
      content: "You are Devin, a software engineer using a real computer operating system. You are a real code-wiz: few programmers are as talented as you at understanding codebases, writing functional and clean code, and iterating on your changes until they are correct...",
      tags: ["coding", "software-engineering", "codebase"],
      lastUpdated: "2 months ago"
    },
    {
      id: 2,
      name: "Cursor Agent v1.2",
      category: "coding",
      description: "AI coding assistant powered by GPT-4, specialized in pair programming and code completion",
      file: "Agent Prompt v1.2.txt",
      content: "You are an AI coding assistant, powered by GPT-4.1. You operate in Cursor. You are pair programming with a USER to solve their coding task...",
      tags: ["coding", "IDE", "completion", "pair-programming"],
      lastUpdated: "1 month ago"
    },
    {
      id: 3,
      name: "Lovable",
      category: "development",
      description: "AI editor that creates and modifies web applications with React, TypeScript, and modern tools",
      file: "Prompt.txt",
      content: "You are Lovable, an AI editor that creates and modifies web applications. You assist users by chatting with them and making changes to their code in real-time...",
      tags: ["web-dev", "react", "frontend", "typescript"],
      lastUpdated: "1 week ago"
    },
    {
      id: 4,
      name: "Perplexity",
      category: "conversational",
      description: "Helpful search assistant trained to provide accurate, detailed answers using search results",
      file: "Prompt.txt",
      content: "You are Perplexity, a helpful search assistant trained by Perplexity AI. Your goal is to write an accurate, detailed, and comprehensive answer to the Query...",
      tags: ["search", "research", "information", "AI-assistant"],
      lastUpdated: "2 months ago"
    },
    {
      id: 5,
      name: "Manus Agent",
      category: "development",
      description: "AI agent specialized in information gathering, data processing, and creating applications",
      file: "Agent loop.txt",
      content: "You are Manus, an AI agent created by the Manus team. You excel at information gathering, fact-checking, documentation, data processing, analysis, and visualization...",
      tags: ["development", "data-processing", "documentation", "analysis"],
      lastUpdated: "3 weeks ago"
    },
    {
      id: 6,
      name: "Replit Agent",
      category: "development",
      description: "Coding assistant for the Replit development environment",
      file: "Prompt.txt",
      content: "You are a helpful coding assistant created by Replit...",
      tags: ["coding", "replit", "development", "assistant"],
      lastUpdated: "2 months ago"
    },
    {
      id: 7,
      name: "Windsurf Wave 11",
      category: "coding",
      description: "Advanced AI coding assistant with comprehensive development capabilities",
      file: "Prompt Wave 11.txt",
      content: "You are Windsurf, an advanced AI coding assistant...",
      tags: ["coding", "development", "AI-assistant", "comprehensive"],
      lastUpdated: "1 month ago"
    },
    {
      id: 8,
      name: "Claude (Anthropic)",
      category: "conversational",
      description: "AI assistant focused on being helpful, harmless, and honest",
      file: "Chat Prompt.txt",
      content: "I'm Claude, an AI assistant created by Anthropic. I'm designed to be helpful, harmless, and honest...",
      tags: ["conversation", "assistant", "general", "anthropic"],
      lastUpdated: "1 month ago"
    },
    {
      id: 9,
      name: "Bolt (Open Source)",
      category: "development",
      description: "Open source AI coding assistant for rapid development",
      file: "Prompt.txt",
      content: "You are Bolt, an open source AI coding assistant...",
      tags: ["open-source", "coding", "development", "rapid"],
      lastUpdated: "2 months ago"
    },
    {
      id: 10,
      name: "Cline",
      category: "coding",
      description: "Open source coding assistant with autonomous capabilities",
      file: "Prompt.txt",
      content: "You are Cline, an autonomous coding assistant...",
      tags: ["open-source", "coding", "autonomous", "assistant"],
      lastUpdated: "2 months ago"
    }
  ];

  const filteredPrompts = prompts.filter(prompt => {
    const matchesSearch = prompt.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         prompt.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         prompt.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesCategory = selectedCategory === "all" || prompt.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const handleLoadPrompt = async (prompt: any) => {
    try {
      // Simulate loading prompt content
      setSelectedPrompt(prompt);
      toast.success(`Loaded ${prompt.name} prompt`);
    } catch (error) {
      toast.error(`Error loading ${prompt.name} prompt`);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">Browse Prompts</h1>
          <p className="text-muted-foreground">
            Discover and explore prompts from top AI services and the community
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Sidebar */}
          <div className="lg:col-span-1">
            <div className="space-y-6">
              {/* Search */}
              <div className="relative">
                <Search className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Search prompts..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>

              {/* Categories */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Categories</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {categories.map((category) => (
                    <button
                      key={category.id}
                      onClick={() => setSelectedCategory(category.id)}
                      className={`w-full text-left px-3 py-2 rounded-md text-sm transition-colors ${
                        selectedCategory === category.id
                          ? "bg-primary text-primary-foreground"
                          : "hover:bg-muted"
                      }`}
                    >
                      <div className="flex justify-between items-center">
                        <span>{category.name}</span>
                        <span className="text-xs opacity-60">{category.count}</span>
                      </div>
                    </button>
                  ))}
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3">
            {selectedPrompt ? (
              /* Prompt Detail View */
              <Card>
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        <FileText className="w-5 h-5 text-primary" />
                        {selectedPrompt.name}
                      </CardTitle>
                      <p className="text-muted-foreground mt-1">{selectedPrompt.description}</p>
                    </div>
                    <Button
                      variant="outline"
                      onClick={() => setSelectedPrompt(null)}
                      size="sm"
                    >
                      Back to List
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    {/* Metadata */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div>
                        <span className="font-medium text-muted-foreground">File:</span>
                        <div className="text-foreground">{selectedPrompt.file}</div>
                      </div>
                      <div>
                        <span className="font-medium text-muted-foreground">Category:</span>
                        <div className="text-foreground capitalize">{selectedPrompt.category}</div>
                      </div>
                      <div>
                        <span className="font-medium text-muted-foreground">Updated:</span>
                        <div className="text-foreground">{selectedPrompt.lastUpdated}</div>
                      </div>
                      <div>
                        <span className="font-medium text-muted-foreground">Tags:</span>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {selectedPrompt.tags.map((tag: string) => (
                            <span
                              key={tag}
                              className="px-2 py-1 bg-muted text-muted-foreground text-xs rounded"
                            >
                              {tag}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* Prompt Content */}
                    <div>
                      <h3 className="font-semibold text-foreground mb-3">Prompt Content</h3>
                      <div className="p-4 bg-muted rounded-lg border">
                        <pre className="whitespace-pre-wrap text-sm text-foreground font-mono max-h-96 overflow-y-auto">
                          {selectedPrompt.content}
                        </pre>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-3">
                      <Button
                        onClick={() => navigator.clipboard.writeText(selectedPrompt.content)}
                        className="flex items-center gap-2"
                      >
                        <Download className="w-4 h-4" />
                        Copy Prompt
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => {
                          // Navigate to upload page with this prompt loaded
                          window.location.href = `/upload?prompt=${encodeURIComponent(selectedPrompt.content)}`;
                        }}
                      >
                        Refine This Prompt
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ) : (
              /* Prompt Grid View */
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <p className="text-muted-foreground">
                    {filteredPrompts.length} prompts found
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {filteredPrompts.map((prompt) => (
                    <Card
                      key={prompt.id}
                      className="cursor-pointer hover:shadow-md transition-shadow"
                      onClick={() => handleLoadPrompt(prompt)}
                    >
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-lg">
                          <FileText className="w-5 h-5 text-primary" />
                          {prompt.name}
                        </CardTitle>
                        <p className="text-muted-foreground text-sm">{prompt.description}</p>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-3">
                          <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">File: {prompt.file}</span>
                            <span className="text-muted-foreground">{prompt.lastUpdated}</span>
                          </div>
                          <div className="flex flex-wrap gap-1">
                            {prompt.tags.map((tag) => (
                              <span
                                key={tag}
                                className="px-2 py-1 bg-muted text-muted-foreground text-xs rounded"
                              >
                                {tag}
                              </span>
                            ))}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default BrowsePrompts;