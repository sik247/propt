import asyncio
import os
from dotenv import load_dotenv
from pydantic import BaseModel, Field
from typing import List, Dict, Any
from openai import OpenAI
from agents import Agent, Runner, get_client
from flask import Flask, request, jsonify
from flask_cors import CORS

# Load environment variables from root .env file
root_env_path = os.path.join(os.path.dirname(os.path.dirname(__file__)), '.env')
print(f"Loading environment variables from: {root_env_path}")
load_dotenv(root_env_path)

# Debug: Print environment status
if os.getenv("OPENAI_API_KEY"):
    print("✅ OPENAI_API_KEY loaded successfully")
else:
    print("❌ Failed to load OPENAI_API_KEY from:", root_env_path)

# Initialize Flask app
app = Flask(__name__)
CORS(app)

# Initialize OpenAI client
api_key = os.getenv("OPENAI_API_KEY")
if not api_key:
    raise ValueError("OPENAI_API_KEY environment variable is not set")
client = OpenAI(api_key=api_key)

# -----------------------------------
# Pydantic models (output schemas)
# -----------------------------------
class Instruction(BaseModel):
    instruction_title: str = Field(description="A 2-8 word title of the instruction.")
    extracted_instruction: str = Field(description="The exact text extracted from the prompt.")

class InstructionList(BaseModel):
    instructions: List[Instruction]

class CritiqueIssue(BaseModel):
    issue: str
    snippet: str
    explanation: str
    suggestion: str

class CritiqueIssues(BaseModel):
    issues: List[CritiqueIssue]

class RevisedPromptOutput(BaseModel):
    value: str = Field(..., description="The revised prompt as a string.")
    class Config:
        extra = "forbid"


class GenereatedPrompt(BaseModel):
    planning:str
    final_prompt: str
    considerations: str
# -----------------------------------
# Utility Functions
# -----------------------------------
def load_prompt(tool_name, prompt_file=None, base_path="sample_prompts", **kwargs):
    if prompt_file is None:
        path = tool_name
    else:
        path = os.path.join(base_path, tool_name, prompt_file)
    with open(path, "r") as f:
        content = f.read()
    if kwargs:
        try:
            content = content.format(**kwargs)
        except Exception:
            pass
    return content

# -----------------------------------
# Core Agent Functions
# -----------------------------------
def make_prompt_agent(industry, usecase, model_provider="openai", model="gpt-5-mini-2025-08-07", reasoning_effort="medium"):
    
    # Choose the appropriate prompt template based on the model
    if model_provider == "openai" and model == "gpt-5-mini-2025-08-07":
        # Use the specialized GPT-5 prompt from generate_prompt.md
        generate_prompt_template = load_prompt("prompts/generate_prompt.md")
        print(f"📝 Using generate_prompt.md for GPT-5")
    elif model_provider == "openai" and model == "gpt-4.1":
        # Use the specialized GPT-4.1 prompt from generate_prompt_gpt4.md
        generate_prompt_template = load_prompt("prompts/generate_prompt_gpt4.md")
        print(f"📝 Using generate_prompt_gpt4.md for GPT-4.1")
    elif model_provider == "claude":
        # Use main prompt for Claude models
        generate_prompt_template = load_prompt("prompts/main_prompt.md")
        print(f"📝 Using main_prompt.md for Claude")
    else:
        # Default fallback to GPT-5 prompt
        generate_prompt_template = load_prompt("prompts/generate_prompt.md")
        print(f"📝 Using generate_prompt.md as fallback")
    
    # Fill the template with industry, usecase, and default region
    filled_prompt = generate_prompt_template.format(
        industry=industry, 
        usecase=usecase, 
        region="global"  # Default region if not specified
    )
    
    # Choose the model to use based on provider and model selection
    api_model = model if model_provider == "openai" else model
    
    response = client.responses.create(
        model=api_model,
        input=filled_prompt,
        tools=[{"type": "web_search_preview"}],
        reasoning={"effort": reasoning_effort}
    )
    
    # Debug: log what the AI actually returned
    print(f"🤖 AI RESPONSE DEBUG:")
    print(f"Response object type: {type(response)}")
    print(f"Output text type: {type(response.output_text)}")
    print(f"Output text length: {len(response.output_text)}")
    print(f"Output text content: {repr(response.output_text[:500])}")
    print("="*60)
    
    # Return the response text directly - frontend will handle parsing
    return response.output_text

def extract_final_prompt_from_response(response_text):
    """Extract only the final_prompt section from the structured response"""
    try:
        import re
        
        # Convert to string if it's not already
        response_str = str(response_text)
        
        print(f"🔍 Parsing response (first 500 chars): {response_str[:500]}")
        print(f"🔍 Response starts with: {repr(response_str[:50])}")
        
        # Multiple patterns to try (including new patterns for structured responses)
        patterns = [
            # Pattern 0: Handle exact case of '\n  name' at start - extract everything after the structured header
            r'^[\s\n]*name:\s*[^\n]*\n(.*?)$',
            # Pattern 1: final_prompt with triple quotes
            r'final_prompt:\s*"""(.*?)"""',
            # Pattern 2: System prompt section
            r'System:(.*?)(?:End of System prompt|Developer:|User:|$)',
            # Pattern 3: Prompt section
            r'Prompt:\s*(.*?)(?:\n\n|\n---|\nDeveloper:|\nUser:|$)',
            # Pattern 4: Looking for actual prompt content after keywords
            r'(?:Here is|Here\'s|The prompt is).*?:\s*(.*?)(?:\n\n|\n---|\nAdditional|$)',
            # Pattern 5: YAML-style structured response with name field
            r'name:\s*[^\n]+\s*.*?(?:prompt|content|system|final_prompt):\s*(.*?)(?:\n\w+:|$)',
            # Pattern 6: Content after any colon (more general)
            r'(?:content|prompt|system|final):\s*(.*?)(?:\n\w+:|$)',
            # Pattern 7: Everything after first meaningful line break if structured
            r'\n\s*\w+:.*?\n(.*?)(?:\n\w+:|$)',
            # Pattern 8: Handle JSON-like structure
            r'"(?:final_prompt|content|prompt|system)":\s*"(.*?)"',
        ]
        
        for i, pattern in enumerate(patterns):
            match = re.search(pattern, response_str, re.DOTALL | re.IGNORECASE)
            if match:
                extracted = match.group(1).strip()
                if len(extracted) > 50:  # Only return if it looks substantial
                    print(f"✅ Successfully extracted using pattern {i+1}")
                    return extracted
        
        # If no patterns match but we have content, return a cleaned version
        if len(response_str.strip()) > 0:
            print(f"⚠️ No patterns matched, trying fallback extraction")
            
            # Remove common structured headers/metadata and find actual content
            lines = response_str.split('\n')
            content_lines = []
            skip_metadata = True
            
            for line in lines:
                line = line.strip()
                # Skip empty lines and obvious metadata
                if not line or line.startswith(('name:', 'id:', 'version:', 'type:')):
                    continue
                # If we find something that looks like content, start collecting
                if len(line) > 30 or line.startswith(('You are', 'Your role', 'System:', 'As a')):
                    skip_metadata = False
                if not skip_metadata and len(line) > 10:
                    content_lines.append(line)
            
            if content_lines:
                result = '\n'.join(content_lines[:15])  # Take first 15 substantial lines
                print(f"✅ Fallback extraction found {len(content_lines)} content lines")
                return result
            else:
                # Last resort: return the whole response cleaned up
                print(f"⚠️ Using raw response as last resort")
                return response_str.strip()
        
        return response_str
        
    except Exception as e:
        print(f"⚠️ Error extracting final_prompt: {e}")
        return str(response_text)

def extract_planning_from_response(response_text):
    """Extract planning section from the structured response"""
    try:
        import re
        
        # Look for planning: """ content """
        planning_match = re.search(r'planning:\s*"""(.*?)"""', response_text, re.DOTALL)
        if planning_match:
            return planning_match.group(1).strip()
        
        return "No planning information available."
        
    except Exception as e:
        print(f"⚠️ Error extracting planning: {e}")
        return "Planning information could not be extracted."

def extract_considerations_from_response(response_text):
    """Extract considerations section from the structured response"""
    try:
        import re
        
        # Look for considerations: """ content """
        considerations_match = re.search(r'considerations:\s*"""(.*?)"""', response_text, re.DOTALL)
        if considerations_match:
            return considerations_match.group(1).strip()
        
        return "No considerations information available."
        
    except Exception as e:
        print(f"⚠️ Error extracting considerations: {e}")
        return "Considerations information could not be extracted."




def make_prompt_editing_agent(industry, usecase, reasoning_effort="medium"):
    # Load prompt templates with templating
    original_prompt   = load_prompt("prompts/original_prompt.md", industry=industry, usecase=usecase)
    extraction_prompt = load_prompt("prompts/extraction_prompt.md", industry=industry, usecase=usecase)
    critique_prompt   = load_prompt("prompts/critique_system.md", industry=industry, usecase=usecase)
    critique_user     = load_prompt("prompts/critique_user.md", industry=industry, usecase=usecase)
    revise_prompt     = load_prompt("prompts/revise_prompt.md", industry=industry, usecase=usecase)
    main_prompt       = load_prompt("prompts/main_prompt.md", industry=industry, usecase=usecase)

    MODEL = "gpt-5-mini-2025-08-07"

    search_agent = Agent(
        name="search_agent",
        model=MODEL,
        instructions=f"""
        You are a **Web-Search Assistant** for **{industry}**.  
        When invoked, call the `web.search_query` tool with a concise, focused query  
        to retrieve up-to-date domain facts that are relevant to prompt engineering.  
        Return only JSON: {{ "query": "...", "results": [{{title, snippet, url}}...] }}
        """,
        reasoning_effort=reasoning_effort
    )

    revise_agent = Agent(
        name="revise_agent",
        model=MODEL,
        instructions=revise_prompt,
        output_type=RevisedPromptOutput,
        reasoning_effort=reasoning_effort
    )
    critique_agent = Agent(
        name="critique_agent",
        model=MODEL,
        instructions=critique_prompt,
        output_type=CritiqueIssues,
        reasoning_effort=reasoning_effort
    )
    extract_agent = Agent(
        name="extract_agent",
        model=MODEL,
        instructions=extraction_prompt,
        output_type=InstructionList,
        reasoning_effort=reasoning_effort
    )
    prmopt_editing_agent = Agent(
        name="prmopt_editing_agent",
        model=MODEL,
        instructions=main_prompt,
        output_type=RevisedPromptOutput,
        reasoning_effort=reasoning_effort,
        tools=[
            search_agent.as_tool(
                tool_name="search_agent",
                tool_description="Search the web for industry and use case specific information",
            ),
            extract_agent.as_tool(
                tool_name="extract_agent",
                tool_description="Extract the instructions from the prompt",
            ),
            critique_agent.as_tool(
                tool_name="critique_agent",
                tool_description="Critique the instructions from the prompt",
            ),
            revise_agent.as_tool(
                tool_name="revise_agent",
                tool_description="Revise the instructions from the prompt",
            ),
        ]
    )
    return prmopt_editing_agent

async def process_prompt_with_agent_thinking(prompt_content: str, industry: str, usecase: str, reasoning_effort: str = "medium"):
    """Process prompt using the 5-step agent pipeline with sequential thinking"""
    try:
        print(f"🚀 Starting 5-step agent pipeline with sequential thinking for {industry} - {usecase}")
        
        # Create the main agent with industry and usecase context
        main_agent = make_prompt_editing_agent(industry, usecase, reasoning_effort)
        
        # Execute the main agent with sequential thinking
        result = await Runner.run(main_agent, prompt_content)
        
        # Extract the final processed prompt from the result
        if hasattr(result, 'final_output'):
            final_prompt = result.final_output
        elif hasattr(result, 'value'):
            final_prompt = result.value
        else:
            final_prompt = str(result)
            
        print("✅ 5-step pipeline completed successfully!")
        
        return {
            "success": True,
            "original_prompt": prompt_content,
            "refined_prompt": final_prompt,
            "result": final_prompt,  # Fallback for compatibility
            "industry": industry,
            "usecase": usecase,
            "method": "5-step agent pipeline with sequential thinking"
        }
        
    except Exception as e:
        print(f"❌ Error in agent pipeline: {e}")
        return {
            "success": False,
            "error": str(e),
            "original_prompt": prompt_content,
            "industry": industry,
            "usecase": usecase
        }

# -----------------------------------
# API Routes
# -----------------------------------
@app.route('/api/generate-prompt', methods=['POST'])
def generate_prompt_api():
    """
    API endpoint to generate a new prompt using sequential thinking
    """
    try:
        data = request.get_json()
        
        if not data:
            return jsonify({"error": "No JSON data provided"}), 400
            
        industry = data.get('industry', 'general')
        usecase = data.get('use_case', 'general')
        user_context = data.get('context', '')
        model_provider = data.get('model_provider', 'openai')
        model = data.get('model', 'gpt-5-mini-2025-08-07')
        reasoning_effort = data.get('reasoning_effort', 'medium')
        
        print(f"🎨 Generating prompt for {industry} - {usecase} using {model_provider}/{model} with {reasoning_effort} reasoning")
        
        # Initialize response variable
        generated_response = None
        
        # Generate prompt using the selected model and provider
        generated_response = make_prompt_agent(industry, usecase, model_provider, model, reasoning_effort)
        
        # Debug: log the response to understand its structure
        print(f"📋 FULL AI RESPONSE:")
        print("="*50)
        print(str(generated_response))
        print("="*50)
        print(f"📋 Response type: {type(generated_response)}")
        print(f"📋 Response length: {len(str(generated_response))}")
        
        # TEMPORARY: Just return the raw response to see what we're getting
        print(f"🔍 RAW RESPONSE DEBUG:")
        print(f"Type: {type(generated_response)}")
        print(f"Length: {len(str(generated_response))}")
        print(f"Content: {repr(str(generated_response))}")
        print("="*80)
        
        # For now, just use the response as-is
        final_prompt_only = str(generated_response).strip()
        planning_content = extract_planning_from_response(generated_response)
        considerations_content = extract_considerations_from_response(generated_response)
        
        # Return the generated prompt with separated sections
        return jsonify({
            "success": True,
            "final_prompt": final_prompt_only,  # Only the System prompt content
            "planning": planning_content,  # For planning button
            "considerations": considerations_content,  # For considerations button
            "generated_prompt": final_prompt_only,  # Fallback for compatibility
            "industry": industry,
            "usecase": usecase,
            "context": user_context,
            "model_provider": model_provider,
            "model": model,
            "method": f"{model} with sequential thinking"
        })
        
    except Exception as parse_error:
            print(f"⚠️ Could not parse structured response: {parse_error}")
            print(f"🔍 FULL RESPONSE FOR DEBUGGING:")
            print(f"Response type: {type(generated_response)}")
            print(f"Response length: {len(str(generated_response)) if generated_response else 0}")
            print(f"Response content: {repr(str(generated_response)[:1000])}")
            print("="*80)
            return jsonify({
                "success": True,
                "generated_prompt": str(generated_response) if generated_response else "Error generating prompt",
                "industry": industry,
                "usecase": usecase,
                "context": user_context,
                "model_provider": model_provider,
                "model": model,
                "method": f"{model} (fallback)"
            })
        
    except Exception as e:
        return jsonify({
            "success": False,
            "error": f"API error: {str(e)}"
        }), 500

@app.route('/api/process-prompt', methods=['POST'])
def process_prompt_api():
    """
    API endpoint to process prompts using the 5-step agent pipeline with sequential thinking
    """
    try:
        data = request.get_json()
        
        if not data:
            return jsonify({"error": "No JSON data provided"}), 400
            
        prompt_content = data.get('content', '')
        industry = data.get('industry', 'general')
        usecase = data.get('use_case', 'general')
        
        if not prompt_content.strip():
            return jsonify({"error": "Prompt content is required"}), 400
            
        print(f"🔄 Processing prompt through 5-step pipeline for {industry} - {usecase}")
        
        # Run the async processing function with sequential thinking
        reasoning_effort = data.get('reasoning_effort', 'medium')
        result = asyncio.run(process_prompt_with_agent_thinking(prompt_content, industry, usecase, reasoning_effort))
        
        return jsonify(result)
        
    except Exception as e:
        return jsonify({
            "success": False,
            "error": f"API error: {str(e)}"
        }), 500

@app.route('/api/load-prompt/<tool_name>', methods=['GET'])
def load_sample_prompt(tool_name):
    """
    Load a sample prompt from the sample_prompts directory
    """
    try:
        # Decode the tool name
        tool_name = tool_name.replace('%20', ' ')
        
        # Get the path to the sample prompts
        sample_prompts_path = os.path.join(os.path.dirname(__file__), "sample_prompts", tool_name)
        
        if not os.path.exists(sample_prompts_path):
            return jsonify({"error": f"Tool '{tool_name}' not found"}), 404
        
        # Look for common prompt file names
        prompt_files = []
        for file in os.listdir(sample_prompts_path):
            if file.lower().endswith(('.txt', '.md')) and ('prompt' in file.lower() or file.lower() == 'prompt.txt'):
                prompt_files.append(file)
        
        if not prompt_files:
            # If no specific prompt file, get the first .txt file
            txt_files = [f for f in os.listdir(sample_prompts_path) if f.endswith('.txt')]
            if txt_files:
                prompt_files = [txt_files[0]]
        
        if not prompt_files:
            return jsonify({"error": f"No prompt file found for '{tool_name}'"}), 404
        
        # Load the first prompt file found
        prompt_file_path = os.path.join(sample_prompts_path, prompt_files[0])
        with open(prompt_file_path, 'r', encoding='utf-8') as f:
            content = f.read()
        
        return jsonify({
            "tool_name": tool_name,
            "file_name": prompt_files[0],
            "content": content,
            "available_files": os.listdir(sample_prompts_path)
        })
        
    except Exception as e:
        return jsonify({"error": f"Error loading prompt: {str(e)}"}), 500

@app.route('/api/list-prompts', methods=['GET'])
def list_all_prompts():
    """
    List all available prompts from the sample_prompts directory
    """
    try:
        sample_prompts_path = os.path.join(os.path.dirname(__file__), "sample_prompts")
        
        if not os.path.exists(sample_prompts_path):
            return jsonify({"error": "Sample prompts directory not found"}), 404
        
        prompts = []
        categories = {
            "AI Coding Assistants": [],
            "Development Platforms": [],
            "Conversational AI": []
        }
        
        # Categorize based on directory names and content
        def categorize_prompt(tool_name):
            tool_lower = tool_name.lower()
            if 'cursor' in tool_lower or 'devin' in tool_lower or 'coding' in tool_lower or tool_name in ['Z.ai Code']:
                return "AI Coding Assistants"
            elif tool_name in ['Lovable', 'Replit', 'Same.dev', 'v0 Prompts and Tools', 'Manus Agent Tools & Prompt', 'Windsurf', 'Warp.dev']:
                return "Development Platforms"
            else:
                return "Conversational AI"
        
        for tool_name in os.listdir(sample_prompts_path):
            tool_path = os.path.join(sample_prompts_path, tool_name)
            
            if not os.path.isdir(tool_path):
                continue
                
            # Find prompt files in the directory
            prompt_files = []
            
            # Generate service-specific descriptions
            descriptions = {
                "Cursor Prompts": "Advanced AI coding assistant integrated with Cursor IDE, specializing in pair programming and intelligent code completion.",
                "Devin AI": "Autonomous software engineer capable of understanding codebases, writing functional code, and iterating on solutions.",
                "Lovable": "AI-powered web development platform that creates and modifies React applications with TypeScript and modern tooling.",
                "Perplexity": "Intelligent search assistant that provides accurate, detailed answers by leveraging real-time search results.",
                "Replit": "Cloud-based development environment with AI assistance for coding, debugging, and collaborative programming.",
                "Windsurf": "Advanced AI coding assistant with comprehensive development capabilities and intelligent code suggestions.",
                "Manus Agent Tools & Prompt": "Specialized AI agent for information gathering, data processing, documentation, and analysis tasks.",
                "Same.dev": "AI-powered development platform focused on streamlining the software development workflow.",
                "v0 Prompts and Tools": "Vercel's AI design tool for generating React components and UI elements from prompts.",
                "Trae": "AI assistant designed for enhanced productivity and intelligent task automation.",
                "Warp.dev": "Modern terminal with AI-powered command suggestions and intelligent shell assistance.",
                "Cluely": "AI assistant platform with customizable prompts for enterprise and general use cases.",
                "-Spawn": "AI tool for creative content generation and automated task execution.",
                "dia": "Specialized AI assistant for data analysis and intelligent insights generation.",
                "Junie": "AI companion focused on personal productivity and intelligent task management.",
                "Kiro": "Multi-mode AI assistant with specialized prompts for classification, specification, and vibe analysis.",
                "Z.ai Code": "AI coding assistant designed for efficient code generation and development tasks.",
                "Open Source prompts": "Collection of community-driven AI prompts for various open source tools and platforms."
            }
            
            description = descriptions.get(tool_name, f"AI assistant and productivity tool - {tool_name}")
            
            for file in os.listdir(tool_path):
                if file.lower().endswith(('.txt', '.md')):
                    prompt_files.append(file)
            
            if not prompt_files:
                continue
                
            # Get the main prompt file
            main_prompt_file = None
            for file in prompt_files:
                if 'prompt' in file.lower() and not any(x in file.lower() for x in ['tools', 'rating', 'memory']):
                    main_prompt_file = file
                    break
            
            if not main_prompt_file:
                main_prompt_file = prompt_files[0]
            
            # Generate tags based on content and tool name
            tags = []
            tool_lower = tool_name.lower()
            if 'cursor' in tool_lower:
                tags = ['coding', 'IDE', 'completion', 'pair-programming']
            elif 'devin' in tool_lower:
                tags = ['coding', 'software-engineering', 'codebase']
            elif 'lovable' in tool_lower:
                tags = ['web-dev', 'react', 'frontend', 'typescript']
            elif 'perplexity' in tool_lower:
                tags = ['search', 'research', 'information', 'AI-assistant']
            elif 'replit' in tool_lower:
                tags = ['coding', 'replit', 'development', 'assistant']
            else:
                tags = ['AI-assistant', 'general', 'prompt']
            
            category = categorize_prompt(tool_name)
            
            prompt_data = {
                "id": len(prompts) + 1,
                "name": tool_name,
                "category": category.lower().replace(" ", "_"),
                "description": description,
                "file": main_prompt_file,
                "tags": tags,
                "lastUpdated": "Recently",
                "tool_path": tool_name,
                "available_files": prompt_files
            }
            
            prompts.append(prompt_data)
            categories[category].append(prompt_data)
        
        # Count prompts per category
        category_counts = {
            "all": len(prompts),
            "ai_coding_assistants": len(categories["AI Coding Assistants"]),
            "development_platforms": len(categories["Development Platforms"]),
            "conversational_ai": len(categories["Conversational AI"])
        }
        
        return jsonify({
            "prompts": prompts,
            "categories": categories,
            "category_counts": category_counts,
            "total": len(prompts)
        })
        
    except Exception as e:
        return jsonify({"error": f"Error listing prompts: {str(e)}"}), 500

@app.route('/api/analyze-document', methods=['POST'])
def analyze_document():
    """
    Analyze a document to extract industry and use case information
    """
    try:
        data = request.get_json()
        
        if not data:
            return jsonify({"error": "No JSON data provided"}), 400
            
        document_content = data.get('document_content', '')
        reasoning_effort = data.get('reasoning_effort', 'medium')
        
        if not document_content.strip():
            return jsonify({"error": "Document content is required"}), 400
            
        print(f"🔍 Analyzing document with {reasoning_effort} reasoning effort")
        
        # Create analysis prompt
        analysis_prompt = f"""
        Analyze the following document and extract the most appropriate industry and specific use case.
        
        Instructions:
        1. Identify the PRIMARY industry this document belongs to (e.g., finance, healthcare, technology, retail, etc.)
        2. Determine the SPECIFIC use case or purpose (e.g., report generation, data analysis, customer communication, etc.)
        3. Be precise and specific rather than generic
        4. Return ONLY a JSON object with "industry" and "usecase" fields
        
        Document content:
        {document_content[:2000]}
        
        Respond with ONLY this JSON format:
        {{"industry": "specific_industry", "usecase": "specific_use_case"}}
        """
        
        # Call GPT-5 for analysis
        client = get_client()
        response = client.responses.create(
            model="gpt-5-mini-2025-08-07",
            input=analysis_prompt,
            reasoning={"effort": reasoning_effort}
        )
        
        # Parse the response
        analysis_result = response.output_text.strip()
        
        try:
            # Try to extract JSON from the response
            import json
            import re
            
            # Look for JSON in the response
            json_match = re.search(r'\{.*\}', analysis_result, re.DOTALL)
            if json_match:
                parsed_result = json.loads(json_match.group())
                industry = parsed_result.get('industry', '').lower()
                usecase = parsed_result.get('usecase', '').lower()
                
                if industry and usecase:
                    return jsonify({
                        "success": True,
                        "industry": industry,
                        "usecase": usecase,
                        "analysis": analysis_result
                    })
            
            # Fallback if JSON parsing fails
            return jsonify({
                "success": False,
                "error": "Could not parse industry and use case from document",
                "raw_response": analysis_result
            })
            
        except json.JSONDecodeError:
            return jsonify({
                "success": False,
                "error": "Invalid JSON response from analysis",
                "raw_response": analysis_result
            })
        
    except Exception as e:
        print(f"❌ Error analyzing document: {e}")
        return jsonify({
            "success": False,
            "error": f"Analysis error: {str(e)}"
        }), 500

@app.route('/api/health', methods=['GET'])
def health_check():
    """
    Health check endpoint
    """
    return jsonify({
        "status": "healthy", 
        "message": "Propt API with Sequential Thinking is running",
        "features": ["Sequential Thinking", "Latest OpenAI Models", "5-Step Agent Pipeline"]
    })

if __name__ == '__main__':
    # Check if OpenAI API key is set
    if not os.getenv("OPENAI_API_KEY"):
        print("❌ Please set your OPENAI_API_KEY in the .env file")
        exit(1)
    
    print("🚀 Starting Propt API with Sequential Thinking and Latest OpenAI Features")
    app.run(debug=True, host='0.0.0.0', port=5001)
