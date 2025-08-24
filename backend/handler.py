from main_flask import app

# Vercel serverless handler
def handler(request):
    """Handle requests in Vercel serverless function"""
    return app(request)
