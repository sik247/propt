import os
from main_flask import app
from flask import Request, Response

def handler(request):
    """Handle requests in Vercel serverless function"""
    try:
        # Debug logging
        print("Handler received request for path:", request.path)
        print("Request method:", request.method)
        print("Environment variables present:", bool(os.getenv("OPENAI_API_KEY")))
        
        # Create a Flask Request object
        context = app.test_request_context(
            path=request.path,
            method=request.method,
            headers=request.headers,
            data=request.get_data()
        )
        
        with context:
            # Process the request through Flask
            response = app.full_dispatch_request()
            return response
            
    except Exception as e:
        print("Error in handler:", str(e))
        return Response(
            response=str({"error": str(e)}),
            status=500,
            mimetype='application/json'
        )
