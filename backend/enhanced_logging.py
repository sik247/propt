"""
Enhanced logging system with HTML formatting and hyperlinks for model logs
"""
import logging
import json
import os
import datetime
from typing import Dict, Any, Optional, List
from html import escape
import uuid
import threading
from collections import defaultdict, deque

class HTMLLogFormatter(logging.Formatter):
    """Custom formatter that creates HTML-formatted log entries with hyperlinks"""
    
    LEVEL_COLORS = {
        'DEBUG': '#6b7280',    # Gray
        'INFO': '#3b82f6',     # Blue  
        'WARNING': '#f59e0b',  # Amber
        'ERROR': '#ef4444',    # Red
        'CRITICAL': '#dc2626'  # Dark Red
    }
    
    EMOJI_MAP = {
        'DEBUG': '🔍',
        'INFO': 'ℹ️',
        'WARNING': '⚠️',
        'ERROR': '❌',
        'CRITICAL': '🚨'
    }
    
    def format(self, record):
        # Create HTML-formatted log entry
        timestamp = datetime.datetime.fromtimestamp(record.created).strftime('%Y-%m-%d %H:%M:%S.%f')[:-3]
        level_color = self.LEVEL_COLORS.get(record.levelname, '#6b7280')
        emoji = self.EMOJI_MAP.get(record.levelname, 'ℹ️')
        
        # Escape HTML in the message
        message = escape(str(record.getMessage()))
        
        # Add hyperlinks for common patterns
        message = self._add_hyperlinks(message, record)
        
        html_entry = f"""
        <div class="log-entry log-{record.levelname.lower()}" data-timestamp="{record.created}">
            <span class="log-timestamp">{timestamp}</span>
            <span class="log-level" style="color: {level_color}">{emoji} {record.levelname}</span>
            <span class="log-module">[{record.name}]</span>
            <span class="log-message">{message}</span>
        </div>
        """
        
        return html_entry.strip()
    
    def _add_hyperlinks(self, message: str, record) -> str:
        """Add hyperlinks to various elements in log messages"""
        
        # Add hyperlinks for API endpoints
        import re
        
        # API endpoint patterns
        api_pattern = r'(/api/[^\s]+)'
        message = re.sub(api_pattern, r'<a href="#" class="api-link" data-endpoint="\1">\1</a>', message)
        
        # File path patterns
        file_pattern = r'([/\w]+\.(py|md|txt|json))'
        message = re.sub(file_pattern, r'<a href="#" class="file-link" data-file="\1">\1</a>', message)
        
        # Model names
        model_pattern = r'(gpt-[0-9]+-mini-[0-9-]+|gpt-[0-9.]+|claude-[0-9]+-[a-z]+)'
        message = re.sub(model_pattern, r'<a href="#" class="model-link" data-model="\1">\1</a>', message)
        
        # URLs
        url_pattern = r'(https?://[^\s]+)'
        message = re.sub(url_pattern, r'<a href="\1" target="_blank" class="external-link">\1</a>', message)
        
        return message

class EnhancedLogger:
    """Enhanced logger with structured output and HTML formatting"""
    
    def __init__(self, name: str):
        self.name = name
        self.logger = logging.getLogger(name)
        self.session_id = str(uuid.uuid4())[:8]
        self._log_entries = deque(maxlen=1000)  # Keep last 1000 entries
        self._lock = threading.Lock()
        
        # Set up dual output (console + HTML)
        self._setup_logger()
    
    def _setup_logger(self):
        """Setup logger with both console and HTML formatters"""
        self.logger.setLevel(logging.DEBUG)
        
        # Clear existing handlers
        for handler in self.logger.handlers[:]:
            self.logger.removeHandler(handler)
        
        # Console handler with emoji formatter
        console_handler = logging.StreamHandler()
        console_handler.setLevel(logging.DEBUG)
        console_formatter = logging.Formatter(
            '%(asctime)s - %(name)s - %(levelname)s - %(message)s',
            datefmt='%Y-%m-%d %H:%M:%S'
        )
        console_handler.setFormatter(console_formatter)
        self.logger.addHandler(console_handler)
        
        # HTML file handler
        log_dir = os.path.join(os.path.dirname(__file__), 'logs')
        os.makedirs(log_dir, exist_ok=True)
        
        html_log_file = os.path.join(log_dir, f'model_logs_{self.session_id}.html')
        html_handler = logging.FileHandler(html_log_file, mode='w')
        html_handler.setLevel(logging.DEBUG)
        html_handler.setFormatter(HTMLLogFormatter())
        self.logger.addHandler(html_handler)
        
        # Initialize HTML file with CSS and structure
        self._initialize_html_log_file(html_log_file)
    
    def _initialize_html_log_file(self, html_log_file: str):
        """Initialize HTML log file with CSS styling"""
        html_template = """
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Model Logs - Session {session_id}</title>
            <style>
                body {{
                    font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
                    margin: 0;
                    padding: 20px;
                    background: #1a1a1a;
                    color: #e0e0e0;
                    line-height: 1.4;
                }}
                .header {{
                    border-bottom: 2px solid #333;
                    padding-bottom: 20px;
                    margin-bottom: 20px;
                }}
                .log-container {{
                    max-width: 100%;
                    overflow-x: auto;
                }}
                .log-entry {{
                    padding: 8px 12px;
                    margin: 2px 0;
                    border-left: 3px solid #333;
                    background: rgba(255, 255, 255, 0.02);
                    border-radius: 4px;
                    transition: all 0.2s ease;
                }}
                .log-entry:hover {{
                    background: rgba(255, 255, 255, 0.05);
                    transform: translateX(5px);
                }}
                .log-timestamp {{
                    color: #888;
                    margin-right: 10px;
                    font-size: 0.9em;
                }}
                .log-level {{
                    margin-right: 10px;
                    font-weight: bold;
                    min-width: 80px;
                    display: inline-block;
                }}
                .log-module {{
                    color: #60a5fa;
                    margin-right: 10px;
                    font-size: 0.9em;
                }}
                .log-message {{
                    flex: 1;
                }}
                .log-debug {{ border-left-color: #6b7280; }}
                .log-info {{ border-left-color: #3b82f6; }}
                .log-warning {{ border-left-color: #f59e0b; }}
                .log-error {{ border-left-color: #ef4444; }}
                .log-critical {{ border-left-color: #dc2626; }}
                
                /* Hyperlink styles */
                .api-link {{
                    color: #34d399;
                    text-decoration: none;
                    border-bottom: 1px dotted #34d399;
                    cursor: pointer;
                }}
                .api-link:hover {{
                    background: rgba(52, 211, 153, 0.1);
                    padding: 2px 4px;
                    border-radius: 3px;
                }}
                .file-link {{
                    color: #fbbf24;
                    text-decoration: none;
                    border-bottom: 1px dotted #fbbf24;
                    cursor: pointer;
                }}
                .file-link:hover {{
                    background: rgba(251, 191, 36, 0.1);
                    padding: 2px 4px;
                    border-radius: 3px;
                }}
                .model-link {{
                    color: #a78bfa;
                    text-decoration: none;
                    border-bottom: 1px dotted #a78bfa;
                    cursor: pointer;
                }}
                .model-link:hover {{
                    background: rgba(167, 139, 250, 0.1);
                    padding: 2px 4px;
                    border-radius: 3px;
                }}
                .external-link {{
                    color: #60a5fa;
                    text-decoration: none;
                }}
                .external-link:hover {{
                    text-decoration: underline;
                }}
                
                /* Filter controls */
                .filter-controls {{
                    margin-bottom: 20px;
                    padding: 15px;
                    background: rgba(255, 255, 255, 0.05);
                    border-radius: 8px;
                }}
                .filter-controls select, .filter-controls input {{
                    background: #333;
                    color: #e0e0e0;
                    border: 1px solid #555;
                    padding: 5px 10px;
                    margin: 5px;
                    border-radius: 4px;
                }}
                
                /* Auto-refresh indicator */
                .refresh-indicator {{
                    position: fixed;
                    top: 20px;
                    right: 20px;
                    padding: 10px 15px;
                    background: #10b981;
                    color: white;
                    border-radius: 20px;
                    font-size: 0.9em;
                }}
            </style>
        </head>
        <body>
            <div class="header">
                <h1>🤖 Model Logs - Session {session_id}</h1>
                <p>Started: {start_time}</p>
                <div class="refresh-indicator">🔄 Auto-refreshing</div>
            </div>
            
            <div class="filter-controls">
                <select id="levelFilter" onchange="filterLogs()">
                    <option value="">All Levels</option>
                    <option value="DEBUG">Debug</option>
                    <option value="INFO">Info</option>
                    <option value="WARNING">Warning</option>
                    <option value="ERROR">Error</option>
                </select>
                <input type="text" id="searchFilter" placeholder="Search logs..." onkeyup="filterLogs()">
                <button onclick="clearLogs()">Clear View</button>
                <button onclick="scrollToBottom()">Jump to Bottom</button>
            </div>
            
            <div class="log-container" id="logContainer">
        """.format(
            session_id=self.session_id,
            start_time=datetime.datetime.now().strftime('%Y-%m-%d %H:%M:%S')
        )
        
        # Write initial HTML structure with JavaScript for interactivity
        javascript_template = """
            <script>
                function filterLogs() {
                    const levelFilter = document.getElementById('levelFilter').value;
                    const searchFilter = document.getElementById('searchFilter').value.toLowerCase();
                    const logEntries = document.querySelectorAll('.log-entry');
                    
                    logEntries.forEach(entry => {
                        const matchesLevel = !levelFilter || entry.classList.contains('log-' + levelFilter.toLowerCase());
                        const matchesSearch = !searchFilter || entry.textContent.toLowerCase().includes(searchFilter);
                        
                        entry.style.display = matchesLevel && matchesSearch ? 'block' : 'none';
                    });
                }
                
                function clearLogs() {
                    document.getElementById('logContainer').innerHTML = '';
                }
                
                function scrollToBottom() {
                    window.scrollTo(0, document.body.scrollHeight);
                }
                
                // Auto-refresh functionality
                function refreshLogs() {
                    // In a real implementation, this would fetch new logs via AJAX
                    // For now, just indicate refresh capability
                    console.log('Auto-refresh not implemented for static HTML');
                }
                
                // Add click handlers for hyperlinks
                document.addEventListener('click', function(e) {
                    if (e.target.classList.contains('api-link')) {
                        e.preventDefault();
                        const endpoint = e.target.dataset.endpoint;
                        console.log('API Endpoint clicked:', endpoint);
                        // You could implement navigation or API testing here
                    }
                    
                    if (e.target.classList.contains('file-link')) {
                        e.preventDefault();
                        const file = e.target.dataset.file;
                        console.log('File link clicked:', file);
                        // You could implement file viewing here
                    }
                    
                    if (e.target.classList.contains('model-link')) {
                        e.preventDefault();
                        const model = e.target.dataset.model;
                        console.log('Model link clicked:', model);
                        // You could show model information here
                    }
                });
                
                // Initialize on page load
                window.addEventListener('load', function() {
                    scrollToBottom();
                });
            </script>
            </div>
            </body>
            </html>
        """
        
        # Write initial HTML structure
        with open(html_log_file, 'w') as f:
            f.write(html_template + javascript_template)
    
    def log_model_interaction(self, 
                             level: str,
                             event_type: str, 
                             model: str,
                             input_data: Optional[str] = None,
                             output_data: Optional[str] = None,
                             metadata: Optional[Dict[str, Any]] = None):
        """Log a model interaction with structured data"""
        
        with self._lock:
            entry = {
                'timestamp': datetime.datetime.now().isoformat(),
                'event_type': event_type,
                'model': model,
                'input_length': len(input_data) if input_data else 0,
                'output_length': len(output_data) if output_data else 0,
                'metadata': metadata or {}
            }
            
            self._log_entries.append(entry)
            
            # Create formatted message
            message = f"🤖 {event_type.upper()}: {model}"
            if input_data:
                message += f" | Input: {len(input_data)} chars"
            if output_data:
                message += f" | Output: {len(output_data)} chars"
            if metadata:
                message += f" | Metadata: {json.dumps(metadata, default=str)}"
            
            # Log to both console and HTML
            log_func = getattr(self.logger, level.lower())
            log_func(message)
    
    def log_api_request(self, method: str, endpoint: str, status_code: int, response_time: float):
        """Log API request with hyperlinks"""
        message = f"🌐 API {method} {endpoint} → {status_code} ({response_time:.2f}ms)"
        
        if status_code >= 400:
            self.logger.error(message)
        elif status_code >= 300:
            self.logger.warning(message)
        else:
            self.logger.info(message)
    
    def log_agent_step(self, agent_name: str, step: str, details: str):
        """Log agent pipeline steps"""
        message = f"🔧 Agent [{agent_name}] Step: {step} | {details}"
        self.logger.info(message)
    
    def get_recent_logs(self, count: int = 50) -> List[Dict[str, Any]]:
        """Get recent log entries as structured data"""
        with self._lock:
            return list(self._log_entries)[-count:]
    
    def get_html_log_path(self) -> str:
        """Get path to the HTML log file"""
        log_dir = os.path.join(os.path.dirname(__file__), 'logs')
        return os.path.join(log_dir, f'model_logs_{self.session_id}.html')

# Global logger instance
_enhanced_logger = None

def get_enhanced_logger(name: str = "model_logs") -> EnhancedLogger:
    """Get or create the global enhanced logger instance"""
    global _enhanced_logger
    if _enhanced_logger is None:
        _enhanced_logger = EnhancedLogger(name)
    return _enhanced_logger

# Utility functions for common logging patterns
def log_model_request(model: str, prompt: str, reasoning_effort: str = "medium", **metadata):
    """Log a model request"""
    logger = get_enhanced_logger()
    logger.log_model_interaction(
        level="INFO",
        event_type="request",
        model=model,
        input_data=prompt,
        metadata={
            "reasoning_effort": reasoning_effort,
            **metadata
        }
    )

def log_model_response(model: str, response: str, processing_time: float = None, **metadata):
    """Log a model response"""
    logger = get_enhanced_logger()
    logger.log_model_interaction(
        level="INFO", 
        event_type="response",
        model=model,
        output_data=response,
        metadata={
            "processing_time": processing_time,
            **metadata
        }
    )

def log_model_error(model: str, error: str, **metadata):
    """Log a model error"""
    logger = get_enhanced_logger()
    logger.log_model_interaction(
        level="ERROR",
        event_type="error", 
        model=model,
        metadata={
            "error": error,
            **metadata
        }
    )

def log_agent_pipeline_start(agent_name: str, industry: str, usecase: str):
    """Log the start of an agent pipeline"""
    logger = get_enhanced_logger()
    logger.log_agent_step(
        agent_name=agent_name,
        step="PIPELINE_START",
        details=f"Industry: {industry}, Use Case: {usecase}"
    )

def log_agent_pipeline_end(agent_name: str, success: bool, duration: float = None):
    """Log the end of an agent pipeline"""
    logger = get_enhanced_logger()
    status = "SUCCESS" if success else "FAILED"
    details = f"Status: {status}"
    if duration:
        details += f", Duration: {duration:.2f}s"
        
    logger.log_agent_step(
        agent_name=agent_name,
        step="PIPELINE_END", 
        details=details
    )
