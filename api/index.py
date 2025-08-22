from flask import Flask, request, jsonify
from flask_cors import CORS
import sys
import os
from http.server import BaseHTTPRequestHandler

# Add the backend directory to the Python path
sys.path.append(os.path.join(os.path.dirname(__file__), '..', 'backend'))

# Import your Flask app
from main_flask import app as flask_app

class handler(BaseHTTPRequestHandler):
    def do_GET(self):
        if self.path == '/api/health':
            self.send_response(200)
            self.send_header('Content-type', 'application/json')
            self.end_headers()
            response = {
                "status": "healthy",
                "message": "Propt API is running"
            }
            self.wfile.write(json.dumps(response).encode())
            return

    def do_POST(self):
        content_length = int(self.headers['Content-Length'])
        post_data = self.rfile.read(content_length)
        
        # Parse the request path
        if self.path == '/api/generate-prompt':
            # Handle generate prompt endpoint
            response = flask_app.generate_prompt_api()
        elif self.path == '/api/process-prompt':
            # Handle process prompt endpoint
            response = flask_app.process_prompt_api()
        else:
            self.send_response(404)
            self.end_headers()
            return

        # Send response
        self.send_response(200)
        self.send_header('Content-type', 'application/json')
        self.end_headers()
        self.wfile.write(json.dumps(response).encode())
