# Agent Structure Documentation

## Overview

The Propt application now uses your original agentic structure with a single unified analysis button that runs all three agents sequentially.

## Agent Structure

### Agent Files (`/backend/agent_prompts/`)

1. **`instruction_extractor.txt`** - Extracts discrete, actionable instructions
2. **`prompt_critic.txt`** - Identifies issues and areas for improvement  
3. **`prompt_reviser.txt`** - Generates improved prompt versions

### Main Agent Pipeline

The main agent (`/api/analyze-prompt`) runs all three agents in sequence:

```
Input Prompt → Instruction Extractor → Prompt Critic → Prompt Reviser → Unified Results
```

### Implementation Details

**Backend (`/backend/main.py`):**
- Single endpoint: `/api/analyze-prompt`
- Uses `Runner` class to orchestrate agents
- Runs all three agents with original prompt as input
- Returns comprehensive results from all analyses

**Agent Creation (`/backend/agents.py`):**
- Loads prompts from `agent_prompts/` directory
- Each agent initialized with its specific prompt file
- Uses `load_prompt()` utility to read prompt files

**Frontend (`/src/components/PromptAnalyzer.tsx`):**
- Single "Analyze Prompt (Extract + Critique + Improve)" button
- Shows unified results with progress summary
- Displays all three result types automatically

## How It Works

### 1. Agent Initialization
```python
# Create agents using prompts from files
extractor = create_instruction_extractor()  # Loads instruction_extractor.txt
critic = create_prompt_critic()            # Loads prompt_critic.txt  
reviser = create_prompt_reviser()          # Loads prompt_reviser.txt
```

### 2. Sequential Execution
```python
# Run each agent independently with original prompt
extract_result = runner.run_agent("instruction_extractor", prompt, InstructionList)
critique_result = runner.run_agent("prompt_critic", prompt, CritiqueIssues)  
revise_result = runner.run_agent("prompt_reviser", prompt, RevisedPromptOutput)
```

### 3. Unified Response
- Combines all three analysis results
- Shows progress summary with completion status
- Displays results in organized sections

## Customizing Agent Prompts

To modify the agent behavior, edit the prompt files:

1. **`/backend/agent_prompts/instruction_extractor.txt`**
   - Controls how instructions are identified and extracted
   - Defines instruction format and criteria

2. **`/backend/agent_prompts/prompt_critic.txt`**
   - Sets criteria for critique analysis
   - Defines what issues to look for

3. **`/backend/agent_prompts/prompt_reviser.txt`**
   - Controls revision guidelines and principles
   - Defines improvement strategies

## API Endpoints

### Main Analysis Endpoint
```
POST /api/analyze-prompt
{
  "prompt": "Your prompt text here"
}
```

**Response:**
```json
{
  "result": "success",
  "data": {
    "instructions": [...],
    "issues": [...], 
    "revised_prompt": "...",
    "analysis_complete": true
  },
  "pipeline_results": [
    {"step": 1, "success": true, "agent": "instruction_extractor"},
    {"step": 2, "success": true, "agent": "prompt_critic"},
    {"step": 3, "success": true, "agent": "prompt_reviser"}
  ]
}
```

### Individual Endpoints (still available)
- `POST /api/extract-instructions`
- `POST /api/critique-prompt` 
- `POST /api/revise-prompt`

## Frontend Usage

1. Go to "Analyze & Improve" tab
2. Paste your prompt in the text area
3. Click "Analyze Prompt (Extract + Critique + Improve)"
4. View comprehensive results with all three analyses

The interface now provides a complete prompt analysis with a single click, using your original agentic structure and custom prompts.