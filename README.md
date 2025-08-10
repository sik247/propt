# Propt - AI Prompt Engineering Tool

A full-stack application that helps you analyze, critique, and improve AI prompts using intelligent agents.

## Features

- **Extract Instructions**: Automatically identify and extract discrete instructions from prompts
- **Critique Prompts**: Get detailed analysis of prompt issues and areas for improvement  
- **Revise Prompts**: Generate improved versions of your prompts with AI assistance
- **Real-time Analysis**: Live backend integration with immediate feedback
- **Modern UI**: Built with React, TypeScript, and Tailwind CSS

## Architecture

### Frontend
- **React 18** with TypeScript
- **Vite** for fast development and building
- **Tailwind CSS** for styling
- **shadcn/ui** components
- **TanStack Query** for API state management
- **React Router** for navigation

### Backend
- **FastAPI** for high-performance API endpoints
- **OpenAI GPT-4** for intelligent prompt analysis
- **Pydantic** for data validation
- **Python 3.8+** runtime

## Quick Start

### Prerequisites
- Node.js 18+ and npm
- Python 3.8+
- OpenAI API key

### Installation

1. **Clone and install dependencies:**
   ```bash
   git clone <your-repo-url>
   cd propt
   npm run setup
   ```

2. **Configure environment:**
   ```bash
   # Copy and edit environment files
   cp .env.example .env
   cp backend/.env.example backend/.env
   
   # Add your OpenAI API key to backend/.env
   echo "OPENAI_API_KEY=your_api_key_here" >> backend/.env
   ```

3. **Start the application:**
   ```bash
   # Start both frontend and backend
   npm run start:full
   
   # Or start individually:
   npm run backend:dev  # Backend on http://localhost:8000
   npm run dev          # Frontend on http://localhost:8080
   ```

## Usage

1. **Navigate to http://localhost:8080**
2. **Go to "Upload & Refine" tab**
3. **Paste your prompt in the text area**
4. **Select analysis type:**
   - Extract Instructions
   - Critique Prompt  
   - Revise Prompt
5. **Click "Analyze Prompt" to get AI-powered insights**

## API Endpoints

The backend provides the following API endpoints:

- `GET /health` - Check backend health and OpenAI configuration
- `POST /api/extract-instructions` - Extract instructions from prompt
- `POST /api/critique-prompt` - Analyze prompt for issues
- `POST /api/revise-prompt` - Generate improved prompt version
- `GET /docs` - Interactive API documentation

## Development

### Frontend Development
```bash
npm run dev          # Start Vite dev server
npm run build        # Build for production
npm run preview      # Preview production build
npm run lint         # Run ESLint
```

### Backend Development
```bash
cd backend
python start.py      # Start with startup checks
# or
python -m uvicorn main:app --reload  # Direct uvicorn start
```

### Project Structure
```
propt/
├── src/                    # Frontend React app
│   ├── components/         # React components
│   ├── hooks/             # Custom React hooks
│   ├── lib/               # API services and utilities
│   └── pages/             # Page components
├── backend/               # Python FastAPI backend
│   ├── main.py           # FastAPI application
│   ├── agents.py         # AI agent logic
│   ├── utils.py          # Utility functions
│   ├── requirements.txt  # Python dependencies
│   └── start.py          # Startup script
└── package.json          # Node.js configuration
```

## Configuration

### Environment Variables

**Frontend (.env):**
```bash
VITE_API_URL=http://localhost:8000
```

**Backend (backend/.env):**
```bash
OPENAI_API_KEY=your_openai_api_key_here
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test both frontend and backend
5. Submit a pull request

## Technologies Used

### Frontend Stack
- Vite + React + TypeScript
- Tailwind CSS + shadcn/ui
- TanStack Query for API integration
- React Router for navigation
- Sonner for notifications

### Backend Stack  
- FastAPI for REST API
- OpenAI GPT-4 for AI capabilities
- Pydantic for data validation
- Python-dotenv for configuration
- Uvicorn ASGI server

## License

MIT License - see LICENSE file for details

## Support

For issues and questions:
1. Check the [API documentation](http://localhost:8000/docs) when backend is running
2. Review console logs for debugging
3. Ensure OpenAI API key is properly configured
4. Verify both frontend and backend are running
