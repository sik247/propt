import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { toast } from "sonner";
import { ArrowLeft, Loader2, Sparkles, CheckCircle, FileText, Download, Key, Info, Upload, BarChart3, AlertTriangle, Plus, X } from "lucide-react";
import { useAuth } from '@/contexts/AuthContext';
import { AuthModal } from '@/components/auth/AuthModal';
import { useUsageTracking } from '@/hooks/useUsageTracking';

const GeneratePrompt = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { usage, incrementUsage, isAuthenticated, remainingAttempts } = useUsageTracking();
  const [isGenerating, setIsGenerating] = useState(false);
  const [industry, setIndustry] = useState("Finance");
  const [usecase, setUsecase] = useState("ex: Stock Research");
  const [promptDescription, setPromptDescription] = useState("");
  const [region, setRegion] = useState("global");
  const [customRegion, setCustomRegion] = useState("");
  const [tasks, setTasks] = useState<string[]>([""]);
  const [inputFormat, setInputFormat] = useState("");
  const [outputFormat, setOutputFormat] = useState("");
  const [showInputFormat, setShowInputFormat] = useState(false);
  const [showOutputFormat, setShowOutputFormat] = useState(false);
  const [generatedResult, setGeneratedResult] = useState<any>(null);
  const [selectedCompany, setSelectedCompany] = useState("openai");
  const [selectedModel, setSelectedModel] = useState("gpt-5-mini-2025-08-07");
  const [reasoningEffort, setReasoningEffort] = useState("medium");
  const [hasUsedFreeTrial, setHasUsedFreeTrial] = useState(false);
  const [showAuthPrompt, setShowAuthPrompt] = useState(false);
  const [showPlanning, setShowPlanning] = useState(false);
  const [showConsiderations, setShowConsiderations] = useState(false);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [documentContent, setDocumentContent] = useState("");
  const [links, setLinks] = useState<string[]>([""]);

  // Listen for custom events to show auth modal
  useEffect(() => {
    const handleShowAuthModal = () => {
      setShowAuthPrompt(true);
    };

    window.addEventListener('show-auth-modal', handleShowAuthModal);
    return () => {
      window.removeEventListener('show-auth-modal', handleShowAuthModal);
    };
  }, []);

  // Model configurations
  const modelOptions = {
    openai: [
      { id: "gpt-5-mini-2025-08-07", name: "GPT-5", description: "Latest" },
      { id: "gpt-4.1", name: "4.1", description: "" }
    ]
  };

  // Update selected model when company changes
  const handleCompanyChange = (company: string) => {
    setSelectedCompany(company);
    setSelectedModel(modelOptions[company as keyof typeof modelOptions][0].id);
  };

  // JSON format validation
  const isValidJSON = (str: string) => {
    if (!str.trim()) return true; // Empty is valid
    try {
      JSON.parse(str);
      return true;
    } catch {
      return false;
    }
  };

  // Handle format examples
  const setInputFormatExample = () => {
    setInputFormat(`{
  "symbol": "string",
  "timeframe": "string",
  "metrics": ["revenue", "profit", "debt"],
  "analysis_type": "fundamental | technical"
}`);
  };

  const setOutputFormatExample = () => {
    setOutputFormat(`{
  "recommendation": "buy | hold | sell",
  "confidence_score": "number (0-100)",
  "key_metrics": {
    "pe_ratio": "number",
    "revenue_growth": "number",
    "debt_ratio": "number"
  },
  "analysis_summary": "string",
  "risk_factors": ["string"],
  "price_target": "number"
}`);
  };

  // Handle tasks management
  const addTask = () => {
    setTasks([...tasks, ""]);
  };

  const updateTask = (index: number, value: string) => {
    const newTasks = [...tasks];
    newTasks[index] = value;
    setTasks(newTasks);
  };

  const removeTask = (index: number) => {
    if (tasks.length > 1) {
      setTasks(tasks.filter((_, i) => i !== index));
    }
  };

  const addLink = () => {
    setLinks([...links, ""]);
  };

  const updateLink = (index: number, value: string) => {
    const newLinks = [...links];
    newLinks[index] = value;
    setLinks(newLinks);
  };

  const removeLink = (index: number) => {
    if (links.length > 1) {
      setLinks(links.filter((_, i) => i !== index));
    }
  };

  // Handle file upload
  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setUploadedFile(file);
      // Read file content
      const reader = new FileReader();
      reader.onload = (e) => {
        const content = e.target?.result as string;
        setDocumentContent(content);
      };
      reader.readAsText(file);
    }
  };

  // Analyze document to extract industry and use case
  const analyzeDocument = async () => {
    if (!documentContent) {
      toast.error('Please upload a document first');
      return;
    }

    setIsAnalyzing(true);
    try {
      const response = await fetch('/api/analyze-document', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          document_content: documentContent,
          reasoning_effort: reasoningEffort
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      
      if (result.success) {
        setIndustry(result.industry);
        setUsecase(result.usecase);
        toast.success('Document analyzed! Industry and use case have been auto-filled.');
      } else {
        toast.error(`Analysis failed: ${result.error}`);
      }
    } catch (error) {
      console.error('Analysis error:', error);
      toast.error('Error analyzing document. Please try again.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Utility function to download content as markdown
  const downloadAsMarkdown = (content: string, filename: string) => {
    const markdownContent = `# Generated Prompt

${content}

---
*Generated by Propt - ${new Date().toLocaleDateString()}*
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

  const handleGenerate = async () => {
    if (!promptDescription.trim()) {
      toast.error('Please describe what your prompt should be about');
      return;
    }

    // Check usage limits for non-authenticated users
    if (!isAuthenticated && !usage.canGenerate) {
      toast.error('Free limit reached! Sign up to continue generating prompts.');
      setShowAuthPrompt(true);
      return;
    }

    // For non-authenticated users, check if they can make another attempt
    if (!isAuthenticated && !incrementUsage()) {
      setShowAuthPrompt(true);
      return;
    }

    setIsGenerating(true);
    setGeneratedResult(null);

    try {
      const response = await fetch('api/generate-prompt', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          industry: industry,
          use_case: usecase,
          context: promptDescription,
          region: region === 'custom' ? customRegion : region,
          tasks: tasks.filter(task => task.trim() !== ""), // Filter out empty tasks
          input_format: inputFormat && isValidJSON(inputFormat) ? inputFormat : "",
          output_format: outputFormat && isValidJSON(outputFormat) ? outputFormat : "",
          document_content: documentContent, // Include uploaded document content
          model_provider: selectedCompany,
          model: selectedModel,
          reasoning_effort: reasoningEffort
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
    <div className="min-h-screen bg-gradient-to-r from-blue-50 to-blue-100">
      {/* Header */}
      <div className="border-b border-gray-200 bg-white shadow-sm">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center gap-4">
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => navigate('/')} 
              className="flex items-center gap-2 text-blue-600 hover:text-blue-800"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Home
            </Button>
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-green-500 rounded-lg flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-semibold text-gray-800">Generate New Prompt</h1>
                <p className="text-sm text-gray-500">Create a custom prompt with AI assistance</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-6 py-8 max-w-4xl">
        <div className="space-y-8">
          {/* Configuration Section */}
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-blue-600" />
                Prompt Configuration
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Model Selection */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-800">Model to be Pro(m)pted</h3>
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Model Provider</Label>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => handleCompanyChange("openai")}
                      className={`p-4 rounded-lg border-2 transition-all ${
                        selectedCompany === "openai"
                          ? "border-blue-500 bg-blue-50 text-blue-900"
                          : "border-gray-200 hover:border-gray-300"
                      }`}
                    >
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 bg-black rounded flex items-center justify-center">
                          <span className="text-white text-xs font-bold">AI</span>
                        </div>
                        <div className="text-left">
                          <div className="font-semibold">OpenAI</div>
                          <div className="text-xs text-gray-500">GPT Models</div>
                        </div>
                      </div>
                    </button>
                  </div>
                </div>

                {/* Model Selection */}
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Model</Label>
                  <select
                    value={selectedModel}
                    onChange={(e) => setSelectedModel(e.target.value)}
                    className="w-full p-3 border border-gray-300 rounded-md bg-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    {modelOptions[selectedCompany as keyof typeof modelOptions].map((model) => (
                      <option key={model.id} value={model.id}>
                        {model.name} - {model.description}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Reasoning Effort */}
                {selectedModel !== "gpt-4.1" && (
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Reasoning Effort</Label>
                    <div className="space-y-3">
                      <div className="relative">
                        <input
                          type="range"
                          min="0"
                          max="2"
                          step="1"
                          value={reasoningEffort === "low" ? 0 : reasoningEffort === "medium" ? 1 : 2}
                          onChange={(e) => {
                            const value = parseInt(e.target.value);
                            setReasoningEffort(value === 0 ? "low" : value === 1 ? "medium" : "high");
                          }}
                          className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
                        />
                        <div className="flex justify-between text-xs text-gray-500 mt-1">
                          <span>Low</span>
                          <span>Medium</span>
                          <span>High</span>
                        </div>
                      </div>
                      <div className="text-center">
                        <span className="text-sm font-medium capitalize bg-blue-100 px-3 py-1 rounded-full">
                          {reasoningEffort} - {reasoningEffort === "low" ? "Fast" : reasoningEffort === "medium" ? "Balanced" : "Deep reasoning"}
                        </span>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Document Upload and Analysis */}
              <div className="space-y-4 border-2 border-dashed border-gray-300 rounded-lg p-6 bg-gray-50">
                <div className="text-center">
                  <Upload className="mx-auto h-8 w-8 text-gray-400 mb-2" />
                  <h3 className="text-lg font-semibold text-gray-700 mb-2">Document Analysis (Optional)</h3>
                  <p className="text-sm text-gray-600 mb-4">
                    Upload a document to automatically analyze and fill industry & use case fields
                  </p>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-center">
                    <label htmlFor="document-upload" className="cursor-pointer">
                      <div className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors">
                        <Upload className="w-4 h-4" />
                        Choose Document
                      </div>
                      <input
                        id="document-upload"
                        type="file"
                        accept=".txt,.md,.doc,.docx,.pdf"
                        onChange={handleFileUpload}
                        className="hidden"
                      />
                    </label>
                  </div>

                  {uploadedFile && (
                    <div className="text-center space-y-2">
                      <p className="text-sm text-green-600">
                        📄 {uploadedFile.name} uploaded
                      </p>
                      <Button
                        onClick={analyzeDocument}
                        disabled={isAnalyzing}
                        className="bg-green-600 hover:bg-green-700"
                        size="sm"
                      >
                        {isAnalyzing ? (
                          <>
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            Analyzing...
                          </>
                        ) : (
                          <>
                            <BarChart3 className="w-4 h-4 mr-2" />
                            Analyze & Auto-fill
                          </>
                        )}
                      </Button>
                    </div>
                  )}
                </div>
              </div>

              {/* Industry and Use Case */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="industry" className="text-sm font-medium">Industry</Label>
                  <Input
                    id="industry"
                    value={industry}
                    onChange={(e) => setIndustry(e.target.value)}
                    placeholder="e.g., Finance, Healthcare, Technology"
                    className="w-full"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="usecase" className="text-sm font-medium">Use Case</Label>
                  <Input
                    id="usecase"
                    value={usecase}
                    onChange={(e) => setUsecase(e.target.value)}
                    placeholder="e.g., Stock Research, Risk Analysis, Financial Reporting"
                    className="w-full"
                  />
                </div>
              </div>

              {/* Enhanced Context Gathering */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-800">Context & Requirements</h3>

                {/* Main Description */}
                <div className="space-y-2">
                  <Label htmlFor="description" className="text-sm font-medium">
                    What should this prompt be about? *
                  </Label>
                  <Textarea
                    id="description"
                    value={promptDescription}
                    onChange={(e) => setPromptDescription(e.target.value)}
                    placeholder="Describe what you want the prompt to do. For example: 'Create a prompt that helps analyze stock performance and generate investment recommendations based on financial metrics and market trends'"
                    className="min-h-[100px] resize-none"
                  />
                </div>

                {/* Region Selection */}
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Region (Optional)</Label>
                  <div className="space-y-3">
                    <select
                      value={region}
                      onChange={(e) => setRegion(e.target.value)}
                      className="w-full p-3 border border-gray-300 rounded-md bg-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="global">Global</option>
                      <option value="usa">United States</option>
                      <option value="canada">Canada</option>
                      <option value="uk">United Kingdom</option>
                      <option value="australia">Australia</option>
                      <option value="custom">Custom</option>
                    </select>
                    {region === 'custom' && (
                      <Input
                        value={customRegion}
                        onChange={(e) => setCustomRegion(e.target.value)}
                        placeholder="Enter specific country or state (e.g., California, Ontario)"
                        className="mt-2"
                      />
                    )}
                  </div>
                </div>

                {/* Tasks Management */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label className="text-sm font-medium">Tasks (Optional)</Label>
                    <Button
                      type="button"
                      onClick={addTask}
                      variant="outline"
                      size="sm"
                      className="flex items-center gap-2"
                    >
                      <Plus className="w-4 h-4" />
                      Add Task
                    </Button>
                  </div>
                  <div className="space-y-2">
                    {tasks.map((task, index) => (
                      <div key={index} className="flex items-center gap-2">
                        <Input
                          value={task}
                          onChange={(e) => updateTask(index, e.target.value)}
                          placeholder={`Task ${index + 1} (e.g., Analyze stock fundamentals, Calculate risk metrics, Generate investment summary)`}
                          className="flex-1"
                        />
                        {tasks.length > 1 && (
                          <Button
                            type="button"
                            onClick={() => removeTask(index)}
                            variant="outline"
                            size="sm"
                            className="p-2"
                          >
                            <X className="w-4 h-4" />
                          </Button>
                        )}
                      </div>
                    ))}
                  </div>
                  <p className="text-xs text-gray-500">
                    Add specific tasks or steps you want the prompt to help accomplish.
                  </p>
                </div>

                {/* Links/Sources Management */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label className="text-sm font-medium">Links/Sources (Optional)</Label>
                    <Button
                      type="button"
                      onClick={addLink}
                      variant="outline"
                      size="sm"
                      className="flex items-center gap-2"
                    >
                      <Plus className="w-4 h-4" />
                      Add Link
                    </Button>
                  </div>
                  <div className="space-y-2">
                    {links.map((link, index) => (
                      <div key={index} className="flex items-center gap-2">
                        <Input
                          value={link}
                          onChange={(e) => updateLink(index, e.target.value)}
                          placeholder={`Link ${index + 1} (e.g., https://example.com)`}
                          className="flex-1"
                        />
                        {links.length > 1 && (
                          <Button
                            type="button"
                            onClick={() => removeLink(index)}
                            variant="outline"
                            size="sm"
                            className="p-2"
                          >
                            <X className="w-4 h-4" />
                          </Button>
                        )}
                      </div>
                    ))}
                  </div>
                  <p className="text-xs text-gray-500">
                    Add relevant links or sources necessary to complete the prompt.
                  </p>
                </div>

                {/* JSON Input/Output Formats */}
                <div className="space-y-4">
                  <h4 className="text-md font-medium text-gray-800">Data Formats (Optional)</h4>

                  {/* Input Format */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label className="text-sm font-medium">Expected Input Format (JSON)</Label>
                      <div className="flex gap-2">
                        <Button
                          type="button"
                          onClick={setInputFormatExample}
                          variant="outline"
                          size="sm"
                          className="text-xs"
                        >
                          Example
                        </Button>
                        <Button
                          type="button"
                          onClick={() => setShowInputFormat(!showInputFormat)}
                          variant="outline"
                          size="sm"
                          className="text-xs"
                        >
                          {showInputFormat ? 'Hide' : 'Add Format'}
                        </Button>
                      </div>
                    </div>
                    {showInputFormat && (
                      <div className="space-y-2">
                        <Textarea
                          value={inputFormat}
                          onChange={(e) => setInputFormat(e.target.value)}
                          placeholder="Define expected input JSON structure..."
                          className={`min-h-[120px] font-mono text-sm resize-vertical ${
                            inputFormat && !isValidJSON(inputFormat) 
                              ? 'border-red-300 focus:border-red-500' 
                              : 'border-gray-300'
                          }`}
                        />
                        {inputFormat && !isValidJSON(inputFormat) && (
                          <p className="text-xs text-red-600">Invalid JSON format</p>
                        )}
                        {inputFormat && isValidJSON(inputFormat) && inputFormat.trim() && (
                          <p className="text-xs text-green-600">✓ Valid JSON format</p>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Output Format */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label className="text-sm font-medium">Desired Output Format (JSON)</Label>
                      <div className="flex gap-2">
                        <Button
                          type="button"
                          onClick={setOutputFormatExample}
                          variant="outline"
                          size="sm"
                          className="text-xs"
                        >
                          Example
                        </Button>
                        <Button
                          type="button"
                          onClick={() => setShowOutputFormat(!showOutputFormat)}
                          variant="outline"
                          size="sm"
                          className="text-xs"
                        >
                          {showOutputFormat ? 'Hide' : 'Add Format'}
                        </Button>
                      </div>
                    </div>
                    {showOutputFormat && (
                      <div className="space-y-2">
                        <Textarea
                          value={outputFormat}
                          onChange={(e) => setOutputFormat(e.target.value)}
                          placeholder="Define desired output JSON structure..."
                          className={`min-h-[120px] font-mono text-sm resize-vertical ${
                            outputFormat && !isValidJSON(outputFormat) 
                              ? 'border-red-300 focus:border-red-500' 
                              : 'border-gray-300'
                          }`}
                        />
                        {outputFormat && !isValidJSON(outputFormat) && (
                          <p className="text-xs text-red-600">Invalid JSON format</p>
                        )}
                        {outputFormat && isValidJSON(outputFormat) && outputFormat.trim() && (
                          <p className="text-xs text-green-600">✓ Valid JSON format</p>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Generate Button */}
              <Button 
                onClick={handleGenerate}
                disabled={isGenerating || !promptDescription.trim() || (!isAuthenticated && usage.hasReachedLimit)}
                className={`w-full ${(!isAuthenticated && usage.hasReachedLimit) ? 'bg-gray-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'}`}
                size="lg"
              >
                {isGenerating ? (
                  <div className="flex items-center justify-center">
                    <div className="relative">
                      <Loader2 className="w-5 h-5 mr-3 animate-spin text-white" />
                      <div className="absolute top-8 left-1/2 transform -translate-x-1/2 whitespace-nowrap">
                        <span className="text-white text-sm">
                          Generating with {modelOptions[selectedCompany as keyof typeof modelOptions].find(m => m.id === selectedModel)?.name}
                        </span>
                        <span className="animate-pulse">...</span>
                      </div>
                    </div>
                  </div>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 mr-2" />
                    {(!isAuthenticated && usage.hasReachedLimit) 
                      ? 'Sign Up to Continue' 
                      : !isAuthenticated 
                        ? `Generate Prompt (${remainingAttempts} free remaining)`
                        : 'Generate Prompt'
                    }
                  </>
                )}
              </Button>
            </CardContent>
          </Card>

          {/* Results Section */}
          {generatedResult && (
            <Card className="shadow-lg">
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
                            <pre className="whitespace-pre-wrap text-sm font-mono leading-relaxed overflow-x-auto">
                              {generatedResult.final_prompt}
                            </pre>
                          </div>
                          <div className="flex gap-2 flex-wrap">
                            <Button 
                              onClick={() => navigator.clipboard.writeText(generatedResult.final_prompt)}
                              variant="outline"
                              size="sm"
                            >
                              Copy Prompt
                            </Button>
                            <Button 
                              onClick={() => downloadAsMarkdown(
                                generatedResult.final_prompt, 
                                `generated-prompt-${industry}-${new Date().getTime()}`
                              )}
                              variant="outline"
                              size="sm"
                              className="flex items-center gap-2"
                            >
                              <Download className="w-4 h-4" />
                              Download .md
                            </Button>
                            <Button 
                              onClick={() => navigate('/upload-refine', { state: { promptToRefine: generatedResult.final_prompt } })}
                              className="bg-orange-600 hover:bg-orange-700"
                              size="sm"
                            >
                              Optimize This Prompt
                            </Button>
                          </div>
                        </div>

                        {/* Model's Logic Section */}
                        {generatedResult.planning_content && (
                          <div className="space-y-2">
                            <Button
                              onClick={() => setShowPlanning(!showPlanning)}
                              variant="outline"
                              size="sm"
                              className="flex items-center gap-2"
                            >
                              🧠 Model's Logic
                              {showPlanning ? ' (Hide)' : ' (Show)'}
                            </Button>
                            {showPlanning && (
                              <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                                <pre className="whitespace-pre-wrap text-sm leading-relaxed overflow-x-auto">
                                  {generatedResult.planning_content}
                                </pre>
                              </div>
                            )}
                          </div>
                        )}
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
                            onClick={() => downloadAsMarkdown(
                              generatedResult.generated_prompt, 
                              `generated-prompt-${industry}-${new Date().getTime()}`
                            )}
                            variant="outline"
                            size="sm"
                            className="flex items-center gap-2"
                          >
                            <Download className="w-4 h-4" />
                            Download .md
                          </Button>
                          <Button 
                            onClick={() => navigate('/upload-refine', { state: { promptToRefine: generatedResult.generated_prompt } })}
                            className="bg-orange-600 hover:bg-orange-700"
                            size="sm"
                          >
                            Optimize This Prompt
                          </Button>
                        </div>
                      </div>
                    )}

                    {/* Metadata */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm pt-4 border-t">
                      <div className="flex flex-col">
                        <span className="font-medium text-gray-500">Industry</span>
                        <span className="text-gray-800">{generatedResult.industry}</span>
                      </div>
                      <div className="flex flex-col">
                        <span className="font-medium text-gray-500">Use Case</span>
                        <span className="text-gray-800">{generatedResult.usecase}</span>
                      </div>
                      <div className="flex flex-col">
                        <span className="font-medium text-gray-500">Model Used</span>
                        <span className="text-gray-800">
                          {modelOptions[selectedCompany as keyof typeof modelOptions].find(m => m.id === selectedModel)?.name || selectedModel}
                        </span>
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

      {/* Authentication Modal */}
      <AuthModal 
        isOpen={showAuthPrompt} 
        onClose={() => setShowAuthPrompt(false)} 
      />
    </div>
  );
};

export default GeneratePrompt;
