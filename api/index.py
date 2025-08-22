from flask import Flask, Response
import json
import sys
import os
from http.server import BaseHTTPRequestHandler

# Add the backend directory to the Python path
sys.path.append(os.path.join(os.path.dirname(__file__), '..', 'backend'))

def handle_request(event, context):
    """
    Main handler for Vercel serverless function
    """
    # Get the HTTP method and path from the event
    http_method = event.get('httpMethod', '')
    path = event.get('path', '')
    
    # Set default headers
    headers = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Content-Type': 'application/json'
    }
    
    # Handle OPTIONS requests (CORS preflight)
    if http_method == 'OPTIONS':
        return {
            'statusCode': 200,
            'headers': headers,
            'body': ''
        }
    
    try:
        # Handle GET requests
        if http_method == 'GET':
            if path == '/api/health':
                return {
                    'statusCode': 200,
                    'headers': headers,
                    'body': json.dumps({
                        'status': 'healthy',
                        'message': 'Propt API is running'
                    })
                }
        
        # Handle POST requests
        elif http_method == 'POST':
            # Parse the request body
            body = json.loads(event.get('body', '{}'))
            
            if path == '/api/generate-prompt':
                # Extract parameters from the request body
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
            
            elif path == '/api/process-prompt':
                # Extract parameters from the request body
                prompt_content = body.get('content', '')
                industry = body.get('industry', 'general')
                usecase = body.get('use_case', 'general')
                reasoning_effort = body.get('reasoning_effort', 'medium')
                
                if not prompt_content.strip():
                    return {
                        'statusCode': 400,
                        'headers': headers,
                        'body': json.dumps({
                            'error': 'Prompt content is required'
                        })
                    }
                
                # Import the function here to avoid circular imports
                from main_flask import process_prompt_with_agent_thinking
                import asyncio
                
                # Process the prompt
                result = asyncio.run(
                    process_prompt_with_agent_thinking(
                        prompt_content,
                        industry,
                        usecase,
                        reasoning_effort
                    )
                )
                
                return {
                    'statusCode': 200,
                    'headers': headers,
                    'body': json.dumps(result)
                }
        
        # Handle unsupported methods
        return {
            'statusCode': 405,
            'headers': headers,
            'body': json.dumps({
                'error': 'Method not allowed'
            })
        }
        
    except Exception as e:
        # Log the error (Vercel will capture this in its logs)
        print(f"Error processing request: {str(e)}")
        
        return {
            'statusCode': 500,
            'headers': headers,
            'body': json.dumps({
                'error': f'Internal server error: {str(e)}'
            })
        }
