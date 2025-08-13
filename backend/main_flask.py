import asyncio
import os
from dotenv import load_dotenv
from pydantic import BaseModel, Field
from typing import List, Dict, Any
from openai import OpenAI
from agents import Agent, Runner
from flask import Flask, request, jsonify
from flask_cors import CORS

load_dotenv()

# Initialize Flask app
app = Flask(__name__)
CORS(app)

# Initialize OpenAI client
client = OpenAI(api_key = os.getenv("OPENAI_API_KEY"))

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
def make_prompt_agent(industry, usecase):
    
    # Load the prompt generation template with placeholders filled
    generate_prompt_template = load_prompt("prompts/generate_prompt.md")
    filled_prompt = generate_prompt_template.format(industry=industry, usecase=usecase)
    
    response = client.responses.parse(
        model="gpt-5",
        input=filled_prompt,
        tools=[{"type": "web_search_preview"}],
        reasoning={
            "effort": "medium"
        },
        text_format=GenereatedPrompt
    )
    return response.output_parsed




def make_prompt_editing_agent(industry, usecase):
    # Load prompt templates with templating
    original_prompt   = load_prompt("prompts/original_prompt.md", industry=industry, usecase=usecase)
    extraction_prompt = load_prompt("prompts/extraction_prompt.md", industry=industry, usecase=usecase)
    critique_prompt   = load_prompt("prompts/critique_system.md", industry=industry, usecase=usecase)
    critique_user     = load_prompt("prompts/critique_user.md", industry=industry, usecase=usecase)
    revise_prompt     = load_prompt("prompts/revise_prompt.md", industry=industry, usecase=usecase)
    main_prompt       = load_prompt("prompts/main_prompt.md", industry=industry, usecase=usecase)

    MODEL = "gpt-5"

    search_agent = Agent(
        name="search_agent",
        model=MODEL,
        instructions=f"""
        You are a **Web-Search Assistant** for **{industry}**.  
        When invoked, call the `web.search_query` tool with a concise, focused query  
        to retrieve up-to-date domain facts that are relevant to prompt engineering.  
        Return only JSON: {{ "query": "...", "results": [{{title, snippet, url}}...] }}
        """
    )

    revise_agent = Agent(
        name="revise_agent",
        model=MODEL,
        instructions=revise_prompt,
        output_type=RevisedPromptOutput
    )
    critique_agent = Agent(
        name="critique_agent",
        model=MODEL,
        instructions=critique_prompt,
        output_type=CritiqueIssues
    )
    extract_agent = Agent(
        name="extract_agent",
        model=MODEL,
        instructions=extraction_prompt,
        output_type=InstructionList,
    )
    prmopt_editing_agent = Agent(
        name="prmopt_editing_agent",
        model=MODEL,
        instructions=main_prompt,
        output_type=RevisedPromptOutput,
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

async def process_prompt_with_agent_thinking(prompt_content: str, industry: str, usecase: str):
    """Process prompt using the 5-step agent pipeline with sequential thinking"""
    try:
        print(f"🚀 Starting 5-step agent pipeline with sequential thinking for {industry} - {usecase}")
        
        # Create the main agent with industry and usecase context
        main_agent = make_prompt_editing_agent(industry, usecase)
        
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
            "processed_prompt": final_prompt,
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
        
        print(f"🎨 Generating prompt for {industry} - {usecase}")
        
        # Generate prompt using your GPT-5 settings
        generated_prompt = make_prompt_agent(industry, usecase)
        
        # Parse the structured response if it's a structured output
        try:
            # If generated_prompt is a structured response with planning/final_prompt/considerations
            if hasattr(generated_prompt, 'planning'):
                return jsonify({
                    "success": True,
                    "planning": generated_prompt.planning,
                    "final_prompt": generated_prompt.final_prompt,
                    "considerations": generated_prompt.considerations,
                    "industry": industry,
                    "usecase": usecase,
                    "context": user_context,
                    "method": "GPT-5 with structured output"
                })
            else:
                # Fallback for plain text response
                return jsonify({
                    "success": True,
                    "generated_prompt": generated_prompt,
                    "industry": industry,
                    "usecase": usecase,
                    "context": user_context,
                    "method": "GPT-5 with sequential thinking"
                })
        except Exception as parse_error:
            print(f"⚠️ Could not parse structured response: {parse_error}")
            return jsonify({
                "success": True,
                "generated_prompt": str(generated_prompt),
                "industry": industry,
                "usecase": usecase,
                "context": user_context,
                "method": "GPT-5 (fallback)"
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
        result = asyncio.run(process_prompt_with_agent_thinking(prompt_content, industry, usecase))
        
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
