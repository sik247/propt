#!/usr/bin/env python3
"""
Startup script for the Propt backend with Sequential Thinking and latest OpenAI features
"""
import os
import sys
from dotenv import load_dotenv
from flask import Flask, request, jsonify
from main_flask import app

# Load environment variables from root .env file
root_env_path = os.path.join(os.path.dirname(os.path.dirname(__file__)), '.env')
print(f"Loading environment variables from: {root_env_path}")
load_dotenv(root_env_path)

# For Vercel serverless functions
def handler(request):
    """Handle incoming requests for Vercel"""
    with app.request_context(request):
        return app.full_dispatch_request()

# For local development
if __name__ == "__main__":
    print("🚀 Starting Propt API with Sequential Thinking and Latest OpenAI Features")
    app.run(debug=True, host='0.0.0.0', port=5001)