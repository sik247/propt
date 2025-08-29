import asyncio
import os
import time
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

# Configure logging
import logging
logging.basicConfig(level=logging.DEBUG)
logger = logging.getLogger(__name__)

# Configure CORS
CORS(app, resources={
    r"/*": {  # Match all routes
        "origins": "*",
        "methods": ["GET", "POST", "OPTIONS"],
        "allow_headers": ["Content-Type", "Authorization", "Accept"],
        "expose_headers": ["Content-Type", "Authorization"]
    }
})

# Add error handlers
@app.errorhandler(404)
def not_found_error(error):
    logger.error(f"404 Error: {error}")
    return jsonify({"error": "Resource not found", "path": request.path}), 404

@app.errorhandler(405)
def method_not_allowed_error(error):
    logger.error(f"405 Error: {error}, Method: {request.method}, Path: {request.path}")
    return jsonify({
        "error": "Method not allowed",
        "method": request.method,
        "path": request.path,
        "allowed_methods": list(app.url_map.iter_rules())
    }), 405

@app.errorhandler(500)
def internal_error(error):
    logger.error(f"500 Error: {error}")
    return jsonify({"error": "Internal server error", "details": str(error)}), 500

# Simple in-memory tracking for demo (use Redis/DB for production)
attempt_tracker = {}

def get_client_ip():
    """Get client IP address, considering proxies"""
    if request.headers.getlist("X-Forwarded-For"):
        return request.headers.getlist("X-Forwarded-For")[0].split(',')[0].strip()
    return request.environ.get('HTTP_X_REAL_IP', request.remote_addr)

def check_rate_limit(action_type="generate"):
    """Check if client has exceeded rate limits"""
    client_ip = get_client_ip()
    current_time = time.time()
    
    # Clean old entries (older than 24 hours)
    cutoff_time = current_time - 86400  # 24 hours
    if client_ip in attempt_tracker:
        attempt_tracker[client_ip] = [
            timestamp for timestamp in attempt_tracker[client_ip] 
            if timestamp > cutoff_time
        ]
    
    # Check current attempts
    attempts = attempt_tracker.get(client_ip, [])
    max_attempts = 2 if action_type == "generate" else 1
    
    if len(attempts) >= max_attempts:
        return False, len(attempts)
    
    # Record this attempt
    if client_ip not in attempt_tracker:
        attempt_tracker[client_ip] = []
    attempt_tracker[client_ip].append(current_time)
    
    return True, len(attempts) + 1

# Add request logging
@app.before_request
def log_request_info():
    logger.debug("Request Headers: %s", dict(request.headers))
    logger.debug("Request Method: %s", request.method)
    logger.debug("Request Path: %s", request.path)
    logger.debug("Client IP: %s", get_client_ip())
    if request.is_json:
        logger.debug("Request JSON: %s", request.get_json())

# Initialize OpenAI client
api_key = os.getenv("OPENAI_API_KEY")
if not api_key:
    raise ValueError("OPENAI_API_KEY environment variable is not set")
try:
    # Try new OpenAI client initialization
    client = OpenAI(api_key=api_key)
except TypeError:
    # Fallback for older versions
    client = OpenAI(
        api_key=api_key
    )

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
# -----------------------------------
# Utility Functions
# -----------------------------------
def load_prompt(tool_name, prompt_file=None, base_path="sample_prompts", **kwargs):
    try:
        if prompt_file is None:
            path = tool_name
        else:
            # Try multiple possible paths
            possible_paths = [
                os.path.join(os.path.dirname(__file__), base_path, tool_name, prompt_file),  # Local development
                os.path.join("/var/task/backend", base_path, tool_name, prompt_file),  # Vercel
                os.path.join(base_path, tool_name, prompt_file)  # Relative path
            ]
            
            path = None
            for p in possible_paths:
                if os.path.exists(p):
                    path = p
                    break
            
            if path is None:
                print(f"❌ Could not find prompt file. Tried paths: {possible_paths}")
                return "Error: Prompt file not found"
        
        print(f"📂 Loading prompt from: {path}")
        with open(path, "r", encoding='utf-8') as f:
            content = f.read()
        
        if kwargs:
            try:
                content = content.format(**kwargs)
            except Exception as e:
                print(f"⚠️ Error formatting prompt: {e}")
                pass
        
        return content
    except Exception as e:
        print(f"❌ Error loading prompt: {e}")
        return f"Error loading prompt: {str(e)}"

# -----------------------------------
# Core Agent Functions
# -----------------------------------
def summarize_document(document_content, reasoning_effort="medium"):
    """Summarize document content using GPT-5"""
    try:
        summarization_prompt = f"""
        Please provide a concise summary of the key points from this document that would be relevant for prompt engineering:

        Document Content:
        {document_content[:3000]}...

        Focus on:
        - Domain-specific requirements
        - Standards or guidelines mentioned
        - Key terminology or concepts
        - Workflow or process details
        - Success criteria or metrics

        Provide a structured summary in 3-5 bullet points.
        """
        
        # Use the same client for consistency
        response = client.responses.create(
            model="gpt-5-mini-2025-08-07",
            input=summarization_prompt,
            reasoning={"effort": reasoning_effort}
        )
        
        return response.output_text.strip()
    except Exception as e:
        print(f"⚠️ Error summarizing document: {e}")
        return f"Document provided (summary unavailable): {document_content[:200]}..."

def make_prompt_agent(industry, usecase, region="global", tasks=[], links=[], document="", input_format="", output_format="", model_provider="openai", model="gpt-5-mini-2025-08-07", reasoning_effort="medium"):
    
    # Choose the appropriate prompt template based on the model
    if model_provider == "openai" and model == "gpt-5-mini-2025-08-07":
        # Use the specialized GPT-5 prompt from generate_prompt.md
        generate_prompt_template = load_prompt(os.path.join(os.path.dirname(__file__), "prompts", "generate_prompt.md"))
        print(f"📝 Using generate_prompt.md for GPT-5")
    elif model_provider == "openai" and model == "gpt-4.1":
        # Use the specialized GPT-4.1 prompt from generate_prompt_gpt4.md
        generate_prompt_template = load_prompt(os.path.join(os.path.dirname(__file__), "prompts", "generate_prompt_gpt4.md"))
        print(f"📝 Using generate_prompt_gpt4.md for GPT-4.1")
    elif model_provider == "claude":
        # Use main prompt for Claude models
        generate_prompt_template = load_prompt(os.path.join(os.path.dirname(__file__), "prompts", "main_prompt.md"))
        print(f"📝 Using main_prompt.md for Claude")
    else:
        # Default fallback to GPT-5 prompt
        generate_prompt_template = load_prompt(os.path.join(os.path.dirname(__file__), "prompts", "generate_prompt.md"))
        print(f"📝 Using generate_prompt.md as fallback")
    
    try:
        # Format tasks as a structured list
        tasks_formatted = ""
        if tasks:
            tasks_formatted = "Tasks to accomplish:\n" + "\n".join([f"- {task}" for task in tasks])
        else:
            tasks_formatted = "No specific tasks defined"
        
        # Format links/sources as a structured list
        links_formatted = ""
        if links:
            links_formatted = "Reference links and sources:\n" + "\n".join([f"- {link}" for link in links])
        else:
            links_formatted = "No reference links provided"
        
        # Format input/output formats for template
        input_format_text = ""
        output_format_text = ""
        
        if input_format:
            input_format_text = f"Expected Input Format:\n```json\n{input_format}\n```"
        else:
            input_format_text = "No specific input format specified"
            
        if output_format:
            output_format_text = f"Desired Output Format:\n```json\n{output_format}\n```"
        else:
            output_format_text = "No specific output format specified"
        
        # Fill the template with new parameter structure using safe string replacement
        filled_prompt = generate_prompt_template
        
        # Replace placeholders one by one to avoid formatting conflicts
        replacements = {
            '{industry}': industry,
            '{usecase}': usecase,
            '{region}': region,
            '{tasks}': tasks_formatted,
            '{links}': links_formatted,
            '{document}': document if document else "No document provided",
            '{input_format}': input_format_text,
            '{output_format}': output_format_text
        }
        
        for placeholder, value in replacements.items():
            filled_prompt = filled_prompt.replace(placeholder, str(value))
        
        # Choose the model to use based on provider and model selection
        api_model = model if model_provider == "openai" else model
        
        # Ensure we have a valid client
        if not client:
            raise ValueError("OpenAI client is not initialized")
            
        # Make the API call
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
        
        # Validate response
        if not response or not hasattr(response, 'output_text'):
            raise ValueError("Invalid response from OpenAI API - missing output_text")
            
        # Return the response text directly - frontend will handle parsing
        return response.output_text
        
    except Exception as e:
        print(f"❌ Error in make_prompt_agent: {str(e)}")
        raise Exception(f"Failed to generate prompt: {str(e)}")

def extract_final_prompt_from_response(response_text):
    """Extract only the clean system prompt section from the structured response"""
    try:
        import re
        
        # Convert to string if it's not already
        response_str = str(response_text)
        
        print(f"🔍 Parsing response (first 500 chars): {response_str[:500]}")
        print(f"🔍 Response starts with: {repr(response_str[:50])}")
        
        # Look for the final_prompt section and extract only the clean system prompt
        patterns = [
            # Pattern for **final_prompt**: content
            r'\*\*final_prompt\*\*:\s*(.*?)(?=\n\n|$|(?:\*\*[a-zA-Z_]+\*\*:))',
            # Pattern for final_prompt: content  
            r'final_prompt:\s*(.*?)(?=\n\n|$|(?:\*\*[a-zA-Z_]+\*\*:))',
            # Pattern for # System Prompt directly
            r'(# System Prompt.*?)(?=\n\n(?:\*\*|planning|Context|Assumptions)|$)',
        ]
        
        for pattern in patterns:
            match = re.search(pattern, response_str, re.DOTALL | re.IGNORECASE)
            if match:
                extracted = match.group(1).strip()
                print(f"✅ Extracted final_prompt using pattern: {pattern[:50]}...")
                print(f"📝 Extracted content (first 200 chars): {extracted[:200]}")
                
                # Clean up the extracted content
                # Remove any leading/trailing whitespace and ensure it starts with # System Prompt
                if not extracted.startswith('# System Prompt'):
                    # If it doesn't start with the header, add it
                    if extracted.startswith('System Prompt'):
                        extracted = '# ' + extracted
                    elif 'System Prompt' in extracted:
                        # Find the System Prompt section
                        system_prompt_match = re.search(r'(# System Prompt.*)', extracted, re.DOTALL)
                        if system_prompt_match:
                            extracted = system_prompt_match.group(1)
                
                return extracted
        
        # If no pattern matches, return the whole response but try to clean it
        print("⚠️ No specific pattern matched, returning cleaned full response")
        return clean_response_for_prompt(response_str)
        
    except Exception as e:
        print(f"❌ Error extracting final prompt: {e}")
        return str(response_text)

def clean_response_for_prompt(response_text):
    """Clean the response to make it suitable as a system prompt"""
    try:
        # Remove common non-prompt content
        lines = response_text.split('\n')
        cleaned_lines = []
        skip_sections = ['planning', 'context', 'assumptions', 'planned vs', 'sources used']
        
        for line in lines:
            line_lower = line.lower().strip()
            if any(skip in line_lower for skip in skip_sections):
                continue
            if line.startswith('**') and line.endswith('**') and any(skip in line_lower for skip in skip_sections):
                continue
            cleaned_lines.append(line)
        
        return '\n'.join(cleaned_lines).strip()
        
    except Exception as e:
        print(f"❌ Error cleaning response: {e}")
        return response_text

def extract_planning_from_response(response_text):
    """Extract planning section from the structured response"""
    try:
        import re
        
        # Look for different planning patterns
        patterns = [
            # Pattern for **planning**: content
            r'\*\*planning\*\*:\s*(.*?)(?=\n\n|$|(?:\*\*[a-zA-Z_]+\*\*:))',
            # Pattern for planning: content
            r'planning:\s*(.*?)(?=\n\n|$|(?:\*\*[a-zA-Z_]+\*\*:))',
            # Pattern for sources used section
            r'planning — Sources used.*?\n(.*?)(?=\n\n|$|(?:final_prompt|Context))',
        ]
        
        for pattern in patterns:
            planning_match = re.search(pattern, response_text, re.DOTALL | re.IGNORECASE)
            if planning_match:
                planning_content = planning_match.group(1).strip()
                if len(planning_content) > 20:  # Only return if substantial
                    return planning_content
        
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
    original_prompt   = load_prompt(os.path.join(os.path.dirname(__file__), "prompts", "original_prompt.md"), industry=industry, usecase=usecase)
    extraction_prompt = load_prompt(os.path.join(os.path.dirname(__file__), "prompts", "extraction_prompt.md"), industry=industry, usecase=usecase)
    critique_prompt   = load_prompt(os.path.join(os.path.dirname(__file__), "prompts", "critique_system.md"), industry=industry, usecase=usecase)
    critique_user     = load_prompt(os.path.join(os.path.dirname(__file__), "prompts", "critique_user.md"), industry=industry, usecase=usecase)
    revise_prompt     = load_prompt(os.path.join(os.path.dirname(__file__), "prompts", "revise_prompt.md"), industry=industry, usecase=usecase)
    main_prompt       = load_prompt(os.path.join(os.path.dirname(__file__), "prompts", "main_prompt.md"), industry=industry, usecase=usecase)

    MODEL = "gpt-5-mini-2025-08-07"

    search_agent = Agent(
        name="search_agent",
        model=MODEL,
        instructions=f"""
        You are a **Web-Search Assistant** for **{industry}** and **{usecase}**.  
        When invoked, call the `web.search_query` tool with a concise, focused query  
        to retrieve up-to-date domain facts that are necessary to create the optimal prompt for {usecase}
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
@app.route('/generate-prompt', methods=['POST', 'OPTIONS'])
@app.route('/api/generate-prompt', methods=['POST', 'OPTIONS'])
def generate_prompt_api():
    """
    API endpoint to generate a new prompt using sequential thinking
    """
    # Handle CORS preflight request
    if request.method == 'OPTIONS':
        response = app.make_default_options_response()
        response.headers['Access-Control-Allow-Methods'] = 'POST'
        response.headers['Access-Control-Allow-Headers'] = 'Content-Type'
        response.headers['Access-Control-Allow-Origin'] = '*'
        return response

    try:
        print(f"📝 Generate prompt request received - Method: {request.method}")
        print(f"📝 Request headers: {dict(request.headers)}")
        
        # Handle POST request
        if not request.is_json:
            print("❌ Request is not JSON")
            return jsonify({"error": "Request must be JSON"}), 400
            
        data = request.get_json()
        print(f"📝 Request data: {data}")
        
        if not data:
            print("❌ No JSON data provided")
            return jsonify({"error": "No JSON data provided"}), 400
            
        # Check rate limiting for non-authenticated users
        # For now, we'll assume all requests are from non-authenticated users
        # In production, you'd check if user has valid auth token
        can_proceed, current_attempts = check_rate_limit("generate")
        if not can_proceed:
            return jsonify({
                "success": False,
                "error": "Rate limit exceeded. You have used your 2 free attempts for today. Please try again tomorrow or sign up for unlimited access.",
                "rate_limited": True,
                "attempts_used": current_attempts
            }), 429
            
        industry = data.get('industry', 'Finance')
        usecase = data.get('use_case', 'ex: Stock Research')
        region = data.get('region', 'global')
        user_context = data.get('context', '')
        document_content = data.get('document_content', '')  # New: document content
        tasks = data.get('tasks', [])  # Array of tasks
        links = data.get('links', [])  # Array of links/sources
        input_format = data.get('input_format', '')  # JSON input format
        output_format = data.get('output_format', '')  # JSON output format
        model_provider = data.get('model_provider', 'openai')
        model = data.get('model', 'gpt-5-mini-2025-08-07')
        reasoning_effort = data.get('reasoning_effort', 'medium')
        
        print(f"🎨 Generating prompt for {industry} - {usecase} using {model_provider}/{model} with {reasoning_effort} reasoning")
        
        try:
            # Summarize document if provided
            document_summary = ""
            if document_content:
                document_summary = summarize_document(document_content, reasoning_effort)
            
            # Generate prompt using the selected model and provider
            generated_response = make_prompt_agent(industry, usecase, region, tasks, links, document_summary, input_format, output_format, model_provider, model, reasoning_effort)
            
            # Debug: log the response to understand its structure
            print(f"📋 FULL AI RESPONSE:")
            print("="*50)
            print(str(generated_response))
            print("="*50)
            print(f"📋 Response type: {type(generated_response)}")
            print(f"📋 Response length: {len(str(generated_response))}")
            
            # Extract the clean final prompt from the response
            final_prompt_only = extract_final_prompt_from_response(str(generated_response))
            
            # Extract planning_content from the final generated_response
            planning_content = extract_planning_from_response(str(generated_response))

            # Include planning_content in the API response
            return jsonify({
                "success": True,
                "final_prompt": final_prompt_only,
                "planning_content": planning_content,
                # Remove considerations_content if not defined
                # "considerations_content": considerations_content,
                "generated_prompt": final_prompt_only,  # Fallback for compatibility
                "industry": industry,
                "usecase": usecase,
                "context": user_context,
                "model_provider": model_provider,
                "model": model,
                "method": f"{model} with sequential thinking"
            })
        except Exception as agent_error:
            print(f"❌ Error in make_prompt_agent: {agent_error}")
            return jsonify({
                "success": False,
                "error": str(agent_error),
                "error_type": "agent_error",
                "industry": industry,
                "usecase": usecase
            }), 500
        
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
        industry = data.get('industry', 'Finance')
        usecase = data.get('use_case', 'ex: Stock Research')
        
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
        # Try multiple possible paths for sample_prompts directory
        possible_paths = [
            os.path.join(os.path.dirname(__file__), "sample_prompts"),  # Local development
            os.path.join("/var/task/backend", "sample_prompts"),  # Vercel
            "sample_prompts"  # Relative path
        ]
        
        sample_prompts_path = None
        for path in possible_paths:
            if os.path.exists(path):
                sample_prompts_path = path
                print(f"✅ Found sample_prompts directory at: {path}")
                break
            else:
                print(f"❌ Directory not found at: {path}")
        
        if not sample_prompts_path:
            return jsonify({
                "error": "Sample prompts directory not found",
                "tried_paths": possible_paths
            }), 404
        
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
