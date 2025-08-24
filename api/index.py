import sys
import os

# Add the backend directory to the Python path so we can import main_flask
backend_path = os.path.join(os.path.dirname(__file__), '..', 'backend')
sys.path.insert(0, backend_path)

try:
    # Import your main Flask app
    from main_flask import app
    print("✅ Successfully imported main_flask app")
except ImportError as e:
    print(f"❌ Failed to import main_flask: {e}")
    # Create a fallback Flask app
    from flask import Flask, jsonify
    app = Flask(__name__)
    
    @app.route('/')
    def fallback():
        return jsonify({"error": "Failed to import main Flask app", "details": str(e)})

# This is the entry point for Vercel
# Vercel will call this 'app' variable
if __name__ == '__main__':
    app.run()