from http.server import BaseHTTPRequestHandler
import json
import os
import sys

# Add the backend directory to the Python path
sys.path.append(os.path.join(os.path.dirname(__file__), '..', 'backend'))

def list_prompts():
    """List all available prompts from the sample_prompts directory"""
    try:
        sample_prompts_path = os.path.join(os.path.dirname(__file__), "..", "backend", "sample_prompts")
        
        if not os.path.exists(sample_prompts_path):
            return {"error": "Sample prompts directory not found"}, 404
        
        prompts = []
        categories = {
            "AI Coding Assistants": [],
            "Development Platforms": [],
            "Conversational AI": []
        }
        
        # Categorize based on directory names and content
        def categorize_prompt(tool_name):
            tool_lower = tool_name.lower()
            if 'cursor' in tool_lower or 'devin' in tool_lower or 'coding' in tool_lower:
                return "AI Coding Assistants"
            elif tool_name in ['Lovable', 'Replit', 'Same.dev']:
                return "Development Platforms"
            else:
                return "Conversational AI"
        
        for tool_name in os.listdir(sample_prompts_path):
            tool_path = os.path.join(sample_prompts_path, tool_name)
            
            if not os.path.isdir(tool_path):
                continue
            
            # Find prompt files in the directory
            prompt_files = [f for f in os.listdir(tool_path) 
                          if f.lower().endswith(('.txt', '.md'))]
            
            if not prompt_files:
                continue
            
            category = categorize_prompt(tool_name)
            
            prompt_data = {
                "id": len(prompts) + 1,
                "name": tool_name,
                "category": category.lower().replace(" ", "_"),
                "description": f"AI assistant and productivity tool - {tool_name}",
                "file": prompt_files[0],
                "tags": ["AI-assistant", "prompt"],
                "lastUpdated": "Recently",
                "tool_path": tool_name,
                "available_files": prompt_files
            }
            
            prompts.append(prompt_data)
            categories[category].append(prompt_data)
        
        return {
            "prompts": prompts,
            "categories": categories,
            "total": len(prompts)
        }, 200
        
    except Exception as e:
        return {"error": f"Error listing prompts: {str(e)}"}, 500

class Handler(BaseHTTPRequestHandler):
    def do_GET(self):
        if self.path == '/api/list-prompts':
            response, status_code = list_prompts()
            
            self.send_response(status_code)
            self.send_header('Content-Type', 'application/json')
            self.send_header('Access-Control-Allow-Origin', '*')
            self.end_headers()
            
            self.wfile.write(json.dumps(response).encode())
            return
        
        self.send_response(404)
        self.end_headers()

    def do_OPTIONS(self):
        self.send_response(200)
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        self.end_headers()
