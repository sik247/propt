import os
from main_flask import app

def handler(request):
    """Handle requests in Vercel serverless function"""
    try:
        # Debug logging
        print("Handler received request for path:", request.path)
        print("Environment variables present:", bool(os.getenv("OPENAI_API_KEY")))
        
        # Call the Flask app
        return app(request)
    except Exception as e:
        print("Error in handler:", str(e))
        return {
            "statusCode": 500,
            "body": {
                "error": str(e),
                "path": request.path,
                "method": request.method
            }
        }
