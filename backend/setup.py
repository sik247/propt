#!/usr/bin/env python3
"""
Setup script for the propt backend
"""
import subprocess
import sys
import os

def install_requirements():
    """Install Python requirements"""
    try:
        subprocess.check_call([sys.executable, '-m', 'pip', 'install', '-r', 'requirements.txt'])
        print("✅ Dependencies installed successfully!")
        return True
    except subprocess.CalledProcessError:
        print("❌ Failed to install dependencies")
        return False

def check_env_file():
    """Check if .env file exists"""
    if os.path.exists('.env'):
        print("✅ .env file found")
        return True
    else:
        print("⚠️  .env file not found. Creating template...")
        with open('.env', 'w') as f:
            f.write("OPENAI_API_KEY=your_openai_api_key_here\n")
        print("📝 Created .env template. Please add your OpenAI API key.")
        return False

def main():
    print("🚀 Setting up propt backend...")
    
    # Install requirements
    if not install_requirements():
        sys.exit(1)
    
    # Check environment file
    env_ready = check_env_file()
    
    print("\n" + "="*50)
    if env_ready:
        print("✅ Setup complete! Run the backend with:")
        print("   python main.py")
    else:
        print("⚠️  Setup incomplete. Please:")
        print("   1. Add your OpenAI API key to .env file")
        print("   2. Run: python main.py")
    print("="*50)

if __name__ == "__main__":
    main()
