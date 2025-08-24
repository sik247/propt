import sys
import os

# Add the backend directory to the Python path so we can import main_flask
backend_path = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', 'backend'))
sys.path.insert(0, backend_path)

# Also add the root directory
root_path = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
sys.path.insert(0, root_path)

try:
    # Import your main Flask app
    from backend.main_flask import app
    print("✅ Successfully imported main_flask app")
except ImportError:
    try:
        # Fallback: try direct import
        import main_flask
        app = main_flask.app
        print("✅ Successfully imported main_flask app (fallback)")
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