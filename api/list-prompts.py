from flask import Flask, request, jsonify
from flask_cors import CORS
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

app = Flask(__name__)
CORS(app)

@app.route('/api/list-prompts', methods=['GET'])
def list_prompts():
    try:
        # Return a simple list of prompts for testing
        prompts = [
            {
                "id": 1,
                "name": "Cursor Prompts",
                "category": "ai_coding_assistants",
                "description": "Advanced AI coding assistant integrated with Cursor IDE",
                "tags": ["coding", "IDE", "completion"],
                "tool_path": "Cursor Prompts"
            },
            {
                "id": 2,
                "name": "ChatGPT",
                "category": "conversational_ai",
                "description": "General purpose AI assistant",
                "tags": ["general", "AI-assistant"],
                "tool_path": "ChatGPT"
            }
        ]
        
        return jsonify({
            "prompts": prompts,
            "total": len(prompts),
            "status": "success"
        })
        
    except Exception as e:
        return jsonify({
            "error": f"Error listing prompts: {str(e)}"
        }), 500

# This is required for Vercel
if __name__ == '__main__':
    app.run()
