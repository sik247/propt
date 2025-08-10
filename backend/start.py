#!/usr/bin/env python3
"""
Start script for the Propt Agent API backend server.
"""
import os
import sys
from pathlib import Path

# Add the backend directory to the Python path
backend_dir = Path(__file__).parent
sys.path.insert(0, str(backend_dir))

def check_dependencies():
    """Check if all required dependencies are installed."""
    try:
        import fastapi
        import uvicorn
        import openai
        import pydantic
        from dotenv import load_dotenv
        print("✅ All dependencies are installed")
        return True
    except ImportError as e:
        print(f"❌ Missing dependency: {e.name}")
        print("Please install dependencies: pip install -r requirements.txt")
        return False

def check_environment():
    """Check if environment variables are configured."""
    from dotenv import load_dotenv
    load_dotenv()
    
    openai_key = os.getenv("OPENAI_API_KEY")
    if not openai_key:
        print("⚠️  Warning: OPENAI_API_KEY not found in environment")
        print("Please create a .env file with your OpenAI API key")
        print("Example: OPENAI_API_KEY=your_api_key_here")
        return False
    else:
        print("✅ OpenAI API key configured")
        return True

def main():
    """Main function to start the server."""
    print("🚀 Starting Propt Agent API...")
    
    if not check_dependencies():
        sys.exit(1)
    
    env_configured = check_environment()
    if not env_configured:
        print("⚠️  Continuing without OpenAI API key (some features will be disabled)")
    
    print("🌐 Starting server on http://localhost:8000")
    print("📖 API docs available at http://localhost:8000/docs")
    
    # Import and run the FastAPI app
    import uvicorn
    from main import app
    
    uvicorn.run(
        app, 
        host="0.0.0.0", 
        port=8000,
        reload=True,
        log_level="info"
    )

if __name__ == "__main__":
    main()