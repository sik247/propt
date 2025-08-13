#!/usr/bin/env python3
"""
Startup script for the Propt backend with Sequential Thinking and latest OpenAI features
"""
import os
import sys

def check_requirements():
    """Check if all required environment variables and dependencies are available"""
    print("🔍 Checking requirements...")
    
    # Check if OpenAI API key is set
    if not os.getenv("OPENAI_API_KEY"):
        print("❌ OPENAI_API_KEY is not set in environment variables")
        print("💡 Please add your OpenAI API key to the .env file")
        return False
    
    # Check if required files exist
    required_files = [
        "prompts/generate_prompt.md",
        "prompts/main_prompt.md",
        "prompts/extraction_prompt.md",
        "prompts/critique_system.md",
        "prompts/revise_prompt.md"
    ]
    
    for file in required_files:
        if not os.path.exists(file):
            print(f"❌ Required file missing: {file}")
            return False
    
    print("✅ All requirements satisfied!")
    return True

def main():
    """Main function to start the server"""
    print("🚀 PROPT BACKEND STARTUP")
    print("=" * 50)
    print("Features:")
    print("- Sequential Thinking with Context7 MCP")
    print("- Latest OpenAI GPT-4o Model")
    print("- Two-Button Frontend Integration")
    print("- 5-Step Agent Pipeline")
    print("=" * 50)
    
    if not check_requirements():
        print("\n❌ Startup failed. Please fix the issues above.")
        sys.exit(1)
    
    print("\n🎯 Starting Flask server with enhanced features...")
    
    try:
        # Import and run the Flask app
        from main_flask import app
        print("✅ Flask app imported successfully")
        print("🌐 Server will be available at: http://localhost:5001")
        print("📋 API Endpoints:")
        print("  - POST /api/generate-prompt    (Generate new prompts)")
        print("  - POST /api/process-prompt     (5-step refinement)")
        print("  - GET  /api/load-prompt/<name> (Load sample prompts)")
        print("  - GET  /api/health             (Health check)")
        print("\n🚀 Starting server...\n")
        
        app.run(debug=True, host='0.0.0.0', port=5001)
        
    except ImportError as e:
        print(f"❌ Import error: {e}")
        print("💡 Make sure all dependencies are installed:")
        print("   pip install flask flask-cors openai python-dotenv pydantic agents")
        sys.exit(1)
    except Exception as e:
        print(f"❌ Server startup error: {e}")
        sys.exit(1)

if __name__ == "__main__":
    main()
