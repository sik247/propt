# Enhanced Logging and Auto-Format Generation Features

## Overview

Your Propt application now includes two major enhancements:

1. **🤖 Auto-Generation of JSON Input/Output Formats** - The LLM automatically generates appropriate JSON formats based on industry and use case
2. **📊 Enhanced HTML Logging with Hyperlinks** - Beautiful, interactive logs with clickable links and real-time filtering

---

## 🎯 Auto-Generated JSON Formats

### How It Works

When you don't provide specific `input_format` or `output_format` parameters, the system automatically generates appropriate JSON schemas based on:

- **Industry Context**: Finance, Healthcare, Technology, Retail, Legal, Education, etc.
- **Use Case**: Specific task like "stock analysis", "patient diagnosis", "code review"
- **Tasks**: Additional context from the tasks array

### API Usage

#### Automatic Generation (Default Behavior)
```bash
curl -X POST http://localhost:5001/api/generate-prompt \
  -H "Content-Type: application/json" \
  -d '{
    "industry": "finance",
    "use_case": "stock analysis",
    "tasks": ["analyze performance", "assess risk", "recommend actions"]
  }'
```

The system will automatically generate appropriate JSON formats for financial stock analysis.

#### Explicit Format Generation
```bash
curl -X POST http://localhost:5001/api/generate-formats \
  -H "Content-Type: application/json" \
  -d '{
    "industry": "healthcare",
    "use_case": "patient diagnosis",
    "tasks": ["analyze symptoms", "recommend treatment"]
  }'
```

#### Response Format
```json
{
  "success": true,
  "industry": "healthcare",
  "use_case": "patient diagnosis",
  "formats": {
    "input_format": {
      "json_object": { /* Structured JSON object */ },
      "json_string": "{\n  \"patient_id\": \"string\",\n  ...\n}"
    },
    "output_format": {
      "json_object": { /* Structured JSON object */ },
      "json_string": "{\n  \"analysis_id\": \"string\",\n  ...\n}"
    }
  }
}
```

### Industry-Specific Examples

#### Finance
```json
{
  "input_format": {
    "request_id": "string",
    "data": {
      "market_data": {
        "symbols": ["string"],
        "timeframe": "string", 
        "metrics": ["string"]
      },
      "risk_tolerance": "string",
      "compliance_requirements": ["string"]
    }
  },
  "output_format": {
    "analysis_id": "string",
    "results": {
      "recommendations": ["string"],
      "risk_assessment": {
        "risk_level": "string",
        "risk_score": "number"
      }
    }
  }
}
```

#### Healthcare
```json
{
  "input_format": {
    "patient_id": "string",
    "clinical_data": {
      "symptoms": ["string"],
      "medical_history": ["string"],
      "vital_signs": "object",
      "lab_results": "object"
    },
    "privacy_consent": "boolean"
  },
  "output_format": {
    "clinical_assessment": {
      "primary_findings": ["string"],
      "differential_diagnosis": ["string"]
    },
    "recommendations": {
      "immediate_actions": ["string"],
      "follow_up_care": ["string"]
    }
  }
}
```

---

## 📊 Enhanced HTML Logging

### Features

- **🎨 Beautiful Dark Theme**: Easy on the eyes with syntax highlighting
- **🔗 Interactive Hyperlinks**: Click on API endpoints, file paths, models
- **🔍 Real-time Filtering**: Filter by log level or search text
- **📊 Structured Data**: JSON metadata for each log entry
- **⚡ Performance Tracking**: Processing times and success rates
- **🚀 Auto-scroll**: Automatically jump to latest logs

### Viewing Logs

#### Via Web Browser
```bash
# Get the HTML log file path
curl http://localhost:5001/api/logs?format=html
```

Open the returned HTML file in your browser for an interactive experience.

#### Via API (JSON)
```bash
# Get recent logs in JSON format
curl http://localhost:5001/api/logs?count=50&format=json
```

### Log Types

#### 🤖 Model Interactions
- Request/Response tracking
- Processing times
- Token usage
- Error handling

#### 🔧 Agent Pipeline Steps
- Multi-step process tracking
- Agent orchestration
- Success/failure rates

#### 🌐 API Requests
- HTTP method and endpoints
- Response codes
- Client information

### Interactive Features

#### Filtering
- **Level Filter**: DEBUG, INFO, WARNING, ERROR
- **Search Filter**: Full-text search across all logs
- **Time Range**: Filter by timestamp

#### Hyperlinks
- **API Endpoints**: `/api/generate-prompt` → Click to test
- **File Paths**: `backend/main.py` → Click to view
- **Model Names**: `gpt-5-mini-2025-08-07` → Click for details
- **External URLs**: Full clickable links

#### Controls
- **Clear View**: Remove displayed logs
- **Jump to Bottom**: Scroll to latest entries
- **Auto-refresh**: Real-time log updates

---

## 🚀 Getting Started

### 1. Start the Enhanced Server
```bash
cd backend
python3 run_server.py
```

### 2. Test Auto-Format Generation
```bash
curl -X POST http://localhost:5001/api/generate-formats \
  -H "Content-Type: application/json" \
  -d '{
    "industry": "technology",
    "use_case": "code review"
  }'
```

### 3. View Enhanced Logs
```bash
# Get HTML logs
curl http://localhost:5001/api/logs?format=html

# Or JSON logs
curl http://localhost:5001/api/logs?format=json&count=100
```

### 4. Generate Prompts with Auto-Formats
```bash
curl -X POST http://localhost:5001/api/generate-prompt \
  -H "Content-Type: application/json" \
  -d '{
    "industry": "retail",
    "use_case": "product recommendation",
    "tasks": ["analyze customer behavior", "suggest products"]
  }'
```

---

## 🔧 Technical Details

### Auto-Format Generation
- **Engine**: GPT-5 with industry-specific prompts
- **Fallback**: Template-based formats for known industries
- **Caching**: Formats cached per industry/usecase combination
- **Validation**: JSON schema validation and type checking

### Enhanced Logging
- **Storage**: HTML file per session + in-memory deque
- **Performance**: O(1) log writing, O(n) retrieval
- **Thread Safety**: Thread-safe logging operations
- **Memory Usage**: Limited to 1000 recent entries per session

### File Locations
```
backend/
├── logs/                           # HTML log files
│   └── model_logs_[session].html   # Interactive log viewer
├── enhanced_logging.py             # Logging implementation
├── format_generator.py             # Auto-format generation  
└── test_enhancements.py           # Test suite
```

---

## 📝 Example Workflow

1. **Start the server** - Enhanced logging begins automatically
2. **Make API calls** - Auto-formats generated based on industry/usecase
3. **View real-time logs** - Open HTML file in browser
4. **Filter and search** - Use interactive controls
5. **Click hyperlinks** - Navigate to related resources
6. **Monitor performance** - Track processing times and success rates

---

## 🎉 Benefits

### For Developers
- **Faster Development**: No need to manually create JSON schemas
- **Better Debugging**: Rich, hyperlinked logs with context
- **Performance Monitoring**: Built-in timing and success tracking

### For Users
- **Intelligent Defaults**: System generates appropriate formats automatically
- **Industry Expertise**: Formats tailored to specific domains
- **Compliance Ready**: Includes regulatory and safety considerations

### For Operations
- **Easy Troubleshooting**: Interactive log viewing with filtering
- **Performance Insights**: Processing times and bottleneck identification
- **Audit Trail**: Complete request/response history

---

*The enhanced features are now live and ready to use! 🚀*
