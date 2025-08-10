const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

export interface PromptRequest {
  prompt: string;
  task_type?: string;
}

export interface PromptResponse {
  result: string;
  data?: any;
}

export interface Instruction {
  instruction_title: string;
  extracted_instruction: string;
}

export interface CritiqueIssue {
  issue: string;
  snippet: string;
  explanation: string;
  suggestion: string;
}

class ApiService {
  private baseUrl: string;

  constructor(baseUrl: string = API_BASE_URL) {
    this.baseUrl = baseUrl;
  }

  private async makeRequest<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;
    
    const response = await fetch(url, {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ detail: 'Unknown error' }));
      throw new Error(errorData.detail || `HTTP error! status: ${response.status}`);
    }

    return response.json();
  }

  async healthCheck(): Promise<{ status: string; openai_configured: boolean }> {
    return this.makeRequest('/health');
  }

  async extractInstructions(prompt: string): Promise<{ instructions: Instruction[] }> {
    const response = await this.makeRequest<PromptResponse>('/api/extract-instructions', {
      method: 'POST',
      body: JSON.stringify({ prompt, task_type: 'extract_instructions' }),
    });
    
    return response.data;
  }

  async critiquePrompt(prompt: string): Promise<{ issues: CritiqueIssue[] }> {
    const response = await this.makeRequest<PromptResponse>('/api/critique-prompt', {
      method: 'POST',
      body: JSON.stringify({ prompt, task_type: 'critique' }),
    });
    
    return response.data;
  }

  async revisePrompt(prompt: string): Promise<{ revised_prompt: string }> {
    const response = await this.makeRequest<PromptResponse>('/api/revise-prompt', {
      method: 'POST',
      body: JSON.stringify({ prompt, task_type: 'revise' }),
    });
    
    return response.data;
  }
}

export const apiService = new ApiService();
export default apiService;