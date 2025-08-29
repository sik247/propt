# Prompt Routing Guide

This document explains how different prompt templates are used based on the selected model in the Generate tab.

## Model-Specific Prompt Routing

### GPT-5 (OpenAI)
**File Used**: `backend/prompts/generate_prompt.md`
- **Description**: Specialized prompt for GPT-5 with advanced reasoning capabilities
- **Features**: 
  - Uses GPT-5 prompting best practices
  - Includes search-first strategy
  - Draft → Lint → Optimize Prompt: Navigate to the prompt optimization page.
  - Structured output format with planning/final_prompt/considerations

### GPT-4.1 (OpenAI)  
**File Used**: `backend/prompts/openai_main_prompt.md`
- **Description**: OpenAI-optimized prompt for GPT-4.1
- **Features**: Tailored for GPT-4.1 capabilities

### Claude Models (Anthropic)
**File Used**: `backend/prompts/main_prompt.md`
- **Description**: General prompt suitable for Claude models
- **Features**: Compatible with Claude's reasoning style

### Fallback
**File Used**: `backend/prompts/generate_prompt.md`
- **Description**: Default to GPT-5 prompt for unknown models

## How It Works

1. **Frontend Selection**: User selects model provider and specific model in the Generate tab
2. **API Call**: Frontend sends `model_provider` and `model` in the request
3. **Backend Routing**: `make_prompt_agent()` function selects appropriate prompt file
4. **Template Processing**: Selected prompt is filled with industry/usecase variables
5. **Model Execution**: Request is sent to the selected model with the appropriate prompt

## Backend Implementation

```python
def make_prompt_agent(industry, usecase, model_provider="openai", model="gpt-5"):
    if model_provider == "openai" and model == "gpt-5":
        generate_prompt_template = load_prompt("prompts/generate_prompt.md")
    elif model_provider == "openai" and model == "gpt-4.1":
        generate_prompt_template = load_prompt("prompts/openai_main_prompt.md")
    elif model_provider == "claude":
        generate_prompt_template = load_prompt("prompts/main_prompt.md")
    else:
        generate_prompt_template = load_prompt("prompts/generate_prompt.md")
```

## Key Benefits

- **Model-Optimized**: Each model gets prompts tailored to its strengths
- **Consistent Results**: Users get the best output for their chosen model
- **Flexible**: Easy to add new models and prompt templates
- **Logged**: Console shows which prompt file is being used for debugging
