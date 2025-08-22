from http.server import BaseHTTPRequestHandler
import json
import os
import sys
from dotenv import load_dotenv

# Add the backend directory to the Python path
sys.path.append(os.path.join(os.path.dirname(__file__), '..', 'backend'))

# Load environment variables
load_dotenv()

def handle_request(request):
    # Set CORS headers
    headers = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Content-Type': 'application/json'
    }

    # Handle OPTIONS request (CORS preflight)
    if request.get('method') == 'OPTIONS':
        return {
            'statusCode': 200,
            'headers': headers,
            'body': ''
        }

    try:
        # Parse request body
        body = json.loads(request.get('body', '{}'))
        
        # Extract parameters
        industry = body.get('industry', 'general')
        usecase = body.get('use_case', 'general')
        model_provider = body.get('model_provider', 'openai')
        model = body.get('model', 'gpt-5-mini-2025-08-07')
        reasoning_effort = body.get('reasoning_effort', 'medium')

        # Import the function here to avoid circular imports
        from main_flask import make_prompt_agent
        
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
