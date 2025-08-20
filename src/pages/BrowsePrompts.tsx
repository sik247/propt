import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FileText, Search, Download, Loader2 } from "lucide-react";
import { toast } from "sonner";

const BrowsePrompts = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedPrompt, setSelectedPrompt] = useState<any>(null);
  const [prompts, setPrompts] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Utility function to download content as markdown
  const downloadAsMarkdown = (content: string, filename: string) => {
    const markdownContent = `# ${filename}

${content}

---
*Downloaded from Propt - ${new Date().toLocaleDateString()}*
`;
    
    const blob = new Blob([markdownContent], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${filename}.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success('Prompt downloaded as Markdown file');
  };

  // Fetch prompts from backend
  useEffect(() => {
    const fetchPrompts = async () => {
      try {
        setLoading(true);
        const response = await fetch('http://localhost:5001/api/list-prompts');
        
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        setPrompts(data.prompts);
        
        // Set up categories
        const categoryList = [
          { id: "all", name: "All Prompts", count: data.category_counts.all },
          { id: "ai_coding_assistants", name: "AI Coding Assistants", count: data.category_counts.ai_coding_assistants },
          { id: "development_platforms", name: "Development Platforms", count: data.category_counts.development_platforms },
          { id: "conversational_ai", name: "Conversational AI", count: data.category_counts.conversational_ai }
        ];
        setCategories(categoryList);
        
      } catch (error) {
        console.error('Error fetching prompts:', error);
        toast.error('Failed to load prompts from server');
        // Set empty fallback data
        setPrompts([]);
        setCategories([
          { id: "all", name: "All Prompts", count: 0 }
        ]);
      } finally {
        setLoading(false);
      }
    };

    fetchPrompts();
  }, []);

  const filteredPrompts = prompts.filter(prompt => {
    const matchesSearch = prompt.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         prompt.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         prompt.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesCategory = selectedCategory === "all" || prompt.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const handleLoadPrompt = async (prompt: any) => {
    try {
      setLoading(true);
      // Fetch the actual prompt content from backend
      const response = await fetch(`http://localhost:5001/api/load-prompt/${encodeURIComponent(prompt.tool_path)}`);
      
      if (!response.ok) {
        throw new Error(`Failed to load prompt: ${response.status}`);
      }
      
      const data = await response.json();
      
      // Update the prompt with actual content
      const promptWithContent = {
        ...prompt,
        content: data.content,
        available_files: data.available_files
      };
      
      setSelectedPrompt(promptWithContent);
      toast.success(`Loaded ${prompt.name} prompt`);
    } catch (error) {
      console.error('Error loading prompt:', error);
      toast.error(`Error loading ${prompt.name} prompt`);
    } finally {
      setLoading(false);
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
            {loading ? (
              <div className="flex items-center justify-center min-h-[400px]">
                <div className="text-center">
                  <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-primary" />
                  <p className="text-muted-foreground">Loading prompts...</p>
                </div>
              </div>
            ) : selectedPrompt ? (
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

                    {/* Service Information */}
                    <div>
                      <h3 className="font-semibold text-foreground mb-3">About This Service</h3>
                      <div className="p-4 bg-muted rounded-lg border">
                        <p className="text-sm text-foreground leading-relaxed">
                          {selectedPrompt.description}
                        </p>
                        <div className="mt-4 pt-3 border-t border-border">
                          <p className="text-xs text-muted-foreground">
                            <strong>Available Files:</strong> {selectedPrompt.available_files?.join(', ') || 'Loading...'}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Prompt Content */}
                    <div>
                      <h3 className="font-semibold text-foreground mb-3">Prompt Content</h3>
                      <div className="p-4 bg-background border rounded-lg">
                        {selectedPrompt.content ? (
                          <pre className="text-sm text-foreground whitespace-pre-wrap font-mono leading-relaxed overflow-x-auto">
                            {selectedPrompt.content}
                          </pre>
                        ) : (
                          <div className="flex items-center justify-center py-8">
                            <div className="text-center">
                              <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2 text-muted-foreground" />
                              <p className="text-sm text-muted-foreground">Loading prompt content...</p>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-3">
                      <Button
                        onClick={async () => {
                          if (selectedPrompt.content) {
                            navigator.clipboard.writeText(selectedPrompt.content);
                            toast.success('Prompt copied to clipboard');
                          } else {
                            // Load content first
                            const response = await fetch(`http://localhost:5001/api/load-prompt/${encodeURIComponent(selectedPrompt.tool_path)}`);
                            if (response.ok) {
                              const data = await response.json();
                              navigator.clipboard.writeText(data.content);
                              toast.success('Prompt copied to clipboard');
                            } else {
                              toast.error('Failed to copy prompt');
                            }
                          }
                        }}
                        variant="outline"
                        size="sm"
                      >
                        Copy Prompt
                      </Button>
                      <Button
                        onClick={async () => {
                          let content = selectedPrompt.content;
                          if (!content) {
                            // Load content first
                            const response = await fetch(`http://localhost:5001/api/load-prompt/${encodeURIComponent(selectedPrompt.tool_path)}`);
                            if (response.ok) {
                              const data = await response.json();
                              content = data.content;
                            }
                          }
                          if (content) {
                            downloadAsMarkdown(content, selectedPrompt.name);
                          } else {
                            toast.error('Failed to load prompt for download');
                          }
                        }}
                        variant="outline"
                        size="sm"
                        className="flex items-center gap-2"
                      >
                        <Download className="w-4 h-4" />
                        Download .md
                      </Button>
                      <Button
                        onClick={async () => {
                          let content = selectedPrompt.content;
                          if (!content) {
                            // Load content first
                            const response = await fetch(`http://localhost:5001/api/load-prompt/${encodeURIComponent(selectedPrompt.tool_path)}`);
                            if (response.ok) {
                              const data = await response.json();
                              content = data.content;
                            }
                          }
                          if (content) {
                            window.location.href = `/upload?prompt=${encodeURIComponent(content)}`;
                          } else {
                            toast.error('Failed to load prompt for refinement');
                          }
                        }}
                        size="sm"
                      >
                        Use This Prompt
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