import os 
from dotenv import load_dotenv 
from typing import List
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field 
import openai 
from openai import OpenAI
from agents import Agent, Runner, create_instruction_extractor, create_prompt_critic, create_prompt_reviser
from utils import load_prompt 

# Load environment variables
load_dotenv() 
openai.api_key = os.getenv("OPENAI_API_KEY")
client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))

# FastAPI app initialization
app = FastAPI(title="Propt Agent API", version="1.0.0")

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:8080", "http://localhost:3000"],  # Add your frontend URLs
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Pydantic models for API
class Instruction(BaseModel):
    instruction_title: str = Field(description="A 2-8 word title of the instruction.")
    extracted_instruction: str = Field(description="The exact text extracted from the prompt.")

class InstructionList(BaseModel):
    instructions: List[Instruction]

class CritiqueIssue(BaseModel):
    issue: str
    snippet: str
    explanation: str
    suggestion: str

class CritiqueIssues(BaseModel):
    issues: List[CritiqueIssue]

class RevisedPromptOutput(BaseModel):
    value: str = Field(..., description="The revised prompt as a string.")

# Request/Response models for API endpoints
class PromptRequest(BaseModel):
    prompt: str
    task_type: str = "extract_instructions"  # extract_instructions, critique, revise

class PromptResponse(BaseModel):
    result: str
    data: dict = None

class UnifiedAnalysisResponse(BaseModel):
    result: str
    data: dict = None
    pipeline_results: List[dict] = None

# API Routes
@app.get("/")
async def root():
    return {"message": "Propt Agent API is running"}

@app.get("/health")
async def health_check():
    return {"status": "healthy", "openai_configured": bool(os.getenv("OPENAI_API_KEY"))}

@app.post("/api/extract-instructions", response_model=PromptResponse)
async def extract_instructions(request: PromptRequest):
    """Extract instructions from a prompt using OpenAI."""
    try:
        response = client.beta.chat.completions.parse(
            model="gpt-4o-mini",
            messages=[
                {
                    "role": "system", 
                    "content": "You are an expert at analyzing prompts and extracting specific instructions. Extract all discrete instructions from the given prompt."
                },
                {
                    "role": "user", 
                    "content": f"Extract all instructions from this prompt: {request.prompt}"
                }
            ],
            response_format=InstructionList,
        )
        
        instructions = response.choices[0].message.parsed
        return PromptResponse(
            result="success",
            data={"instructions": [inst.dict() for inst in instructions.instructions]}
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error extracting instructions: {str(e)}")

@app.post("/api/critique-prompt", response_model=PromptResponse)
async def critique_prompt(request: PromptRequest):
    """Critique a prompt and identify issues."""
    try:
        response = client.beta.chat.completions.parse(
            model="gpt-4o-mini",
            messages=[
                {
                    "role": "system", 
                    "content": "You are an expert prompt engineer. Analyze the given prompt and identify issues, problems, or areas for improvement."
                },
                {
                    "role": "user", 
                    "content": f"Critique this prompt and identify issues: {request.prompt}"
                }
            ],
            response_format=CritiqueIssues,
        )
        
        issues = response.choices[0].message.parsed
        return PromptResponse(
            result="success",
            data={"issues": [issue.dict() for issue in issues.issues]}
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error critiquing prompt: {str(e)}")

@app.post("/api/revise-prompt", response_model=PromptResponse)
async def revise_prompt(request: PromptRequest):
    """Revise and improve a prompt."""
    try:
        response = client.beta.chat.completions.parse(
            model="gpt-4o-mini",
            messages=[
                {
                    "role": "system", 
                    "content": "You are an expert prompt engineer. Revise and improve the given prompt to make it clearer, more effective, and better structured."
                },
                {
                    "role": "user", 
                    "content": f"Revise and improve this prompt: {request.prompt}"
                }
            ],
            response_format=RevisedPromptOutput,
        )
        
        revised = response.choices[0].message.parsed
        return PromptResponse(
            result="success",
            data={"revised_prompt": revised.value}
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error revising prompt: {str(e)}")

@app.post("/api/analyze-prompt", response_model=UnifiedAnalysisResponse)
async def analyze_prompt_unified(request: PromptRequest):
    """Run unified prompt analysis pipeline: extract, critique, and revise."""
    try:
        # Initialize the main runner with agents
        runner = Runner()
        
        # Create and add agents using your original structure
        extractor = create_instruction_extractor()
        critic = create_prompt_critic()  
        reviser = create_prompt_reviser()
        
        runner.add_agent(extractor)
        runner.add_agent(critic)
        runner.add_agent(reviser)
        
        # Run the three-step analysis pipeline
        # Step 1: Extract instructions
        extract_result = runner.run_agent("instruction_extractor", request.prompt, InstructionList)
        
        # Step 2: Critique the prompt
        critique_result = runner.run_agent("prompt_critic", request.prompt, CritiqueIssues)
        
        # Step 3: Revise the prompt (using original prompt for context)
        revise_result = runner.run_agent("prompt_reviser", request.prompt, RevisedPromptOutput)
        
        # Check if all steps succeeded
        if not (extract_result["success"] and critique_result["success"] and revise_result["success"]):
            failed_steps = []
            if not extract_result["success"]: failed_steps.append("extraction")
            if not critique_result["success"]: failed_steps.append("critique") 
            if not revise_result["success"]: failed_steps.append("revision")
            raise HTTPException(status_code=500, detail=f"Analysis failed at: {', '.join(failed_steps)}")
        
        # Format the unified response
        formatted_data = {
            "instructions": [],
            "issues": [],
            "revised_prompt": "",
            "analysis_complete": True
        }
        
        # Process extraction results
        if hasattr(extract_result["data"], 'instructions'):
            formatted_data["instructions"] = [inst.dict() for inst in extract_result["data"].instructions]
        
        # Process critique results  
        if hasattr(critique_result["data"], 'issues'):
            formatted_data["issues"] = [issue.dict() for issue in critique_result["data"].issues]
        
        # Process revision results
        if hasattr(revise_result["data"], 'value'):
            formatted_data["revised_prompt"] = revise_result["data"].value
        
        return UnifiedAnalysisResponse(
            result="success",
            data=formatted_data,
            pipeline_results=[
                {"step": 1, "success": extract_result["success"], "agent": "instruction_extractor"},
                {"step": 2, "success": critique_result["success"], "agent": "prompt_critic"},
                {"step": 3, "success": revise_result["success"], "agent": "prompt_reviser"}
            ]
        )
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error in unified analysis: {str(e)}")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)