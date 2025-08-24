from flask import Flask, request, jsonify
from flask_cors import CORS
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

app = Flask(__name__)
CORS(app)

@app.route('/api/generate-prompt', methods=['POST', 'OPTIONS'])
def generate_prompt():
    if request.method == 'OPTIONS':
        # Handle CORS preflight
        response = jsonify({})
        response.headers.add('Access-Control-Allow-Methods', 'POST, OPTIONS')
        response.headers.add('Access-Control-Allow-Headers', 'Content-Type')
        return response
    
    try:
        data = request.get_json()
        
        if not data:
            return jsonify({"error": "No JSON data provided"}), 400
            
        # For now, return a simple response to test the endpoint
        return jsonify({
            "success": True,
            "message": "Generate prompt endpoint is working",
            "received_data": data,
            "generated_prompt": "This is a test prompt generated for your use case.",
            "industry": data.get('industry', 'general'),
            "usecase": data.get('use_case', 'general')
        })
        
    except Exception as e:
        return jsonify({
            "success": False,
            "error": f"API error: {str(e)}"
        }), 500

# This is required for Vercel
if __name__ == '__main__':
    app.run()
