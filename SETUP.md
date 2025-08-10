# Propt Setup Guide

This guide will help you set up the Propt application in different environments.

## Quick Setup (Recommended)

### Prerequisites
- Node.js 18+ and npm
- Python 3.8+ with pip
- OpenAI API key

### Steps

1. **Clone the repository:**
   ```bash
   git clone <your-repo-url>
   cd propt
   ```

2. **Install frontend dependencies:**
   ```bash
   npm install
   ```

3. **Set up Python backend:**
   ```bash
   # Create virtual environment
   cd backend
   python3 -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   
   # Install dependencies
   pip install -r requirements.txt
   ```

4. **Configure environment:**
   ```bash
   # Copy environment templates
   cp .env.example .env
   cp backend/.env.example backend/.env
   
   # Edit backend/.env and add your OpenAI API key:
   OPENAI_API_KEY=your_actual_api_key_here
   ```

5. **Start the applications:**
   ```bash
   # Terminal 1: Start backend (from backend directory)
   cd backend
   source venv/bin/activate
   python start.py
   
   # Terminal 2: Start frontend (from project root)
   npm run dev
   ```

6. **Open your browser:**
   - Frontend: http://localhost:8080
   - Backend API docs: http://localhost:8000/docs

## Environment-Specific Instructions

### Ubuntu/Debian Systems

If you encounter "externally-managed-environment" error:

```bash
# Install venv package
sudo apt update
sudo apt install python3-venv python3-pip

# Then follow the normal setup steps
cd backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
```

### Windows Systems

```bash
# Use Command Prompt or PowerShell
cd backend
python -m venv venv
venv\Scripts\activate
pip install -r requirements.txt
```

### macOS Systems

```bash
# Install Python via Homebrew if needed
brew install python3

# Follow normal setup
cd backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
```

### Docker Setup (Alternative)

If you prefer Docker:

1. **Create Dockerfile for backend:**
   ```dockerfile
   FROM python:3.11-slim
   WORKDIR /app
   COPY requirements.txt .
   RUN pip install -r requirements.txt
   COPY . .
   EXPOSE 8000
   CMD ["python", "start.py"]
   ```

2. **Create docker-compose.yml:**
   ```yaml
   version: '3.8'
   services:
     frontend:
       build: .
       ports:
         - "8080:8080"
     backend:
       build: ./backend
       ports:
         - "8000:8000"
       environment:
         - OPENAI_API_KEY=${OPENAI_API_KEY}
   ```

## Troubleshooting

### Backend Issues

**"Command python not found":**
- Try `python3` instead of `python`
- Install Python from python.org

**"Permission denied" errors:**
- Use virtual environment: `python3 -m venv venv`
- Don't use `sudo pip install`

**"ModuleNotFoundError":**
- Ensure virtual environment is activated
- Reinstall dependencies: `pip install -r requirements.txt`

**OpenAI API errors:**
- Check your API key in `backend/.env`
- Verify you have OpenAI credits
- Test connection: `curl -H "Authorization: Bearer YOUR_KEY" https://api.openai.com/v1/models`

### Frontend Issues

**"Module not found" errors:**
- Delete `node_modules` and run `npm install` again
- Check Node.js version: `node --version` (should be 18+)

**CORS errors:**
- Ensure backend is running on port 8000
- Check `VITE_API_URL` in `.env`

**Build failures:**
- Clear cache: `npm run build -- --force`
- Check TypeScript errors: `npm run lint`

### Network Issues

**Cannot connect to backend:**
- Verify backend is running: http://localhost:8000/health
- Check firewall settings
- Try different ports if occupied

## Development Workflow

### Making Changes

1. **Frontend changes:**
   - Edit files in `src/`
   - Hot reload active during `npm run dev`

2. **Backend changes:**
   - Edit files in `backend/`
   - Restart server or use auto-reload: `uvicorn main:app --reload`

3. **API changes:**
   - Update backend endpoints in `backend/main.py`
   - Update frontend API calls in `src/lib/api.ts`
   - Update types in `src/hooks/useApi.ts`

### Testing Integration

1. **Check backend health:**
   ```bash
   curl http://localhost:8000/health
   ```

2. **Test API endpoints:**
   ```bash
   curl -X POST http://localhost:8000/api/extract-instructions \
     -H "Content-Type: application/json" \
     -d '{"prompt": "Write a blog post about AI"}'
   ```

3. **Frontend integration:**
   - Go to "Upload & Refine" tab
   - Enter a prompt and click analyze
   - Check browser console for errors

## Production Deployment

### Environment Variables

Set these in production:

```bash
# Frontend
VITE_API_URL=https://your-backend-domain.com

# Backend
OPENAI_API_KEY=your_production_api_key
```

### Build Commands

```bash
# Frontend
npm run build
# Serve the dist/ directory

# Backend
pip install -r requirements.txt
python start.py
# Or use gunicorn: gunicorn main:app -w 4 -k uvicorn.workers.UvicornWorker
```

## Getting Help

1. **Check logs:**
   - Frontend: Browser console (F12)
   - Backend: Terminal output

2. **API Documentation:**
   - Visit http://localhost:8000/docs when backend is running

3. **Common solutions:**
   - Restart both frontend and backend
   - Clear browser cache
   - Recreate virtual environment
   - Check environment variables

4. **Still stuck?**
   - Check this README.md for latest updates
   - Review the project structure in README.md
   - Ensure all dependencies are correctly installed