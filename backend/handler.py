import os
import json
import traceback
from main_flask import app
from flask import Request, Response

def handler(request):
    """Handle requests in Vercel serverless function"""
    try:
        # Debug logging
        print("=== Request Details ===")
        print(f"Path: {request.path}")
        print(f"Method: {request.method}")
        print(f"Headers: {dict(request.headers)}")
        print(f"Query Params: {dict(request.query_params)}")
        print(f"Environment: OPENAI_API_KEY present = {bool(os.getenv('OPENAI_API_KEY'))}")
        
        # Log request body for POST requests
        if request.method == 'POST':
            try:
                body = request.get_data()
                if body:
                    print(f"Request Body: {body.decode('utf-8')}")
            except Exception as e:
                print(f"Could not decode request body: {e}")
        
        # Create Flask Request context
        context = app.test_request_context(
            path=request.path,
            base_url=f"https://{request.headers.get('host', '')}",
            method=request.method,
            headers=dict(request.headers),
            data=request.get_data()
        )
        
        with context:
            # Process the request through Flask
            response = app.full_dispatch_request()
            print("=== Response Details ===")
            print(f"Status: {response.status_code}")
            print(f"Headers: {dict(response.headers)}")
            print(f"Body: {response.get_data().decode('utf-8')}")
            return response
            
    except Exception as e:
        error_details = {
            "error": str(e),
            "traceback": traceback.format_exc(),
            "request": {
                "path": request.path,
                "method": request.method,
                "headers": dict(request.headers)
            }
        }
        print("=== Error Details ===")
        print(json.dumps(error_details, indent=2))
        return Response(
            response=json.dumps(error_details),
            status=500,
            mimetype='application/json'
        )
