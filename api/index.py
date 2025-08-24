from flask import Flask, request, jsonify
from flask_cors import CORS
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

app = Flask(__name__)
CORS(app)

@app.route('/')
def home():
    return jsonify({
        "message": "Propt API is running",
        "status": "healthy",
        "endpoints": [
            "/api/health",
            "/api/generate-prompt",
            "/api/list-prompts",
            "/api/load-prompt/<tool_name>"
        ]
    })

@app.route('/api/health')
def health():
    return jsonify({
        "status": "healthy", 
        "message": "Propt API is running",
        "openai_configured": bool(os.getenv("OPENAI_API_KEY"))
    })

# This is required for Vercel
if __name__ == '__main__':
    app.run()