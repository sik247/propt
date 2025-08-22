from http.server import BaseHTTPRequestHandler
import json
import os
import sys
from dotenv import load_dotenv
from openai import OpenAI

# Add the backend directory to the Python path
sys.path.append(os.path.join(os.path.dirname(__file__), '..', 'backend'))

# Load environment variables
load_dotenv()

# Initialize OpenAI client
client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))

def load_prompt(prompt_path):
    """Load a prompt file from the absolute path"""
    try:
        absolute_path = os.path.join(os.path.dirname(__file__), '..', 'backend', prompt_path)
        with open(absolute_path, 'r', encoding='utf-8') as f:
            return f.read()
    except Exception as e:
        print(f"Error loading prompt file {prompt_path}: {e}")
        return None

def make_prompt_agent(industry, usecase, model_provider="openai", model="gpt-5-mini-2025-08-07", reasoning_effort="medium"):
    """Generate a prompt using the specified model"""
    try:
        # Check if OpenAI API key is set
        if not os.getenv("OPENAI_API_KEY"):
            raise Exception("OpenAI API key is not set. Please set OPENAI_API_KEY environment variable.")

        # Choose the appropriate prompt template
        if model_provider == "openai" and model == "gpt-5-mini-2025-08-07":
            template_path = "prompts/generate_prompt.md"
        elif model_provider == "openai" and model == "gpt-4.1":
            template_path = "prompts/generate_prompt_gpt4.md"
        else:
            template_path = "prompts/generate_prompt.md"

        print(f"Loading template from: {template_path}")

        # Load and fill the template
        template = load_prompt(template_path)
        if not template:
            raise Exception(f"Failed to load prompt template: {template_path}")

        print(f"Template loaded successfully, length: {len(template)}")

        filled_prompt = template.format(
            industry=industry,
            usecase=usecase,
            region="global"
        )

        print(f"Template filled successfully, making API call with model: {model}")

        # Generate the response
        response = client.responses.create(
            model=model,
            input=filled_prompt,
            tools=[{"type": "web_search_preview"}],
            reasoning={"effort": reasoning_effort}
        )

        print("API call successful, returning response")
        return response.output_text

    except Exception as e:
        print(f"Error in make_prompt_agent: {str(e)}")
        print(f"Error type: {type(e)}")
        print(f"Error details: {e.__dict__ if hasattr(e, '__dict__') else 'No additional details'}")
        raise Exception(f"Failed to generate prompt: {str(e)}")

def handle_request(request):
    """Handle incoming requests"""
    headers = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Content-Type': 'application/json'
    }

    try:
        # Handle OPTIONS request
        if request.get('method') == 'OPTIONS':
            return {
                'statusCode': 200,
                'headers': headers,
                'body': ''
            }

        # Parse request body
        body = json.loads(request.get('body', '{}'))
        
        # Extract parameters
        industry = body.get('industry', 'general')
        usecase = body.get('use_case', 'general')
        model_provider = body.get('model_provider', 'openai')
        model = body.get('model', 'gpt-5-mini-2025-08-07')
        reasoning_effort = body.get('reasoning_effort', 'medium')

        # Generate the prompt
        response = make_prompt_agent(
            industry=industry,
            usecase=usecase,
            model_provider=model_provider,
            model=model,
            reasoning_effort=reasoning_effort
        )

        return {
            'statusCode': 200,
            'headers': headers,
            'body': json.dumps({
                'success': True,
                'generated_prompt': str(response),
                'industry': industry,
                'usecase': usecase,
                'model_provider': model_provider,
                'model': model
            })
        }

    except Exception as e:
        print(f"Error processing request: {str(e)}")
        return {
            'statusCode': 500,
            'headers': headers,
            'body': json.dumps({
                'success': False,
                'error': str(e)
            })
        }
