from flask import Flask, request, jsonify
from flask_cors import CORS
import sys
import os

# Add the backend directory to the Python path
sys.path.append(os.path.join(os.path.dirname(__file__), '..', 'backend'))

# Import your Flask app
from main_flask import app as flask_app

# Create the handler for Vercel
def handler(request):
    with flask_app.request_context(request):
        return flask_app.full_dispatch_request()

# Define the app variable that Vercel looks for
app = flask_app
