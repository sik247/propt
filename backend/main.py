import os 
from dotenv import load_dotenv 
from typing import List
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field 
import openai 
from openai import OpenAI 

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

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)