import os
from string import Template

def load_prompt(path: str, **kwargs) -> str:
    """
    Load a prompt template and substitute placeholders like ${industry}, ${tech}, etc.
    """
    project_root = os.path.dirname(os.path.abspath(__file__))
    full_path = os.path.join(project_root, path)
    if not os.path.isfile(full_path):
        raise FileNotFoundError(f"Prompt file not found: {full_path}")

    text = open(full_path, "r", encoding="utf-8").read()
    return Template(text).substitute(**kwargs)
