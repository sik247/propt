import os
from typing import Dict, Any, Optional

def load_prompt(prompt_name: str, prompts_dir: str = "agent_prompts") -> str:
    """Load a prompt from a file in the prompts directory."""
    try:
        # Try .md first, then .txt as fallback
        for ext in ['.md', '.txt']:
            prompt_path = os.path.join(prompts_dir, f"{prompt_name}{ext}")
            if os.path.exists(prompt_path):
                with open(prompt_path, 'r', encoding='utf-8') as file:
                    return file.read().strip()
        
        # If neither exists, return a default prompt
        return f"Default prompt for {prompt_name}"
    except Exception as e:
        return f"Error loading prompt: {str(e)}"

def save_prompt(prompt_name: str, content: str, prompts_dir: str = "prompts") -> bool:
    """Save a prompt to a file in the prompts directory."""
    try:
        os.makedirs(prompts_dir, exist_ok=True)
        prompt_path = os.path.join(prompts_dir, f"{prompt_name}.txt")
        with open(prompt_path, 'w', encoding='utf-8') as file:
            file.write(content)
        return True
    except Exception as e:
        print(f"Error saving prompt: {str(e)}")
        return False

def validate_openai_key() -> bool:
    """Check if OpenAI API key is configured."""
    return bool(os.getenv("OPENAI_API_KEY"))

def format_response(success: bool, data: Any = None, error: str = None) -> Dict[str, Any]:
    """Format a standardized response."""
    response = {"success": success}
    if data is not None:
        response["data"] = data
    if error is not None:
        response["error"] = error
    return response

def clean_text(text: str) -> str:
    """Clean and normalize text input."""
    if not text:
        return ""
    return text.strip().replace('\r\n', '\n').replace('\r', '\n')

def truncate_text(text: str, max_length: int = 1000) -> str:
    """Truncate text to a maximum length."""
    if len(text) <= max_length:
        return text
    return text[:max_length] + "..."