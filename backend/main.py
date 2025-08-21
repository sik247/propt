import asyncio
import os
from dotenv import load_dotenv
from pydantic import BaseModel, Field
from typing import List, Dict, Any
from openai import OpenAI
from agents import Agent, Runner


load_dotenv()

client = OpenAI()

# Initialize Flask app

# -----------------------------------
# 1) Pydantic models (output schemas)
# -----------------------------------
class Instruction(BaseModel):
    instruction_title: str = Field(description="A 2-8 word title of the instruction.")
    extracted_instruction: str = Field(description="The exact text extracted from the prompt.")

class InstructionList(BaseModel):
    instructions: List[Instruction]

class CritiqueIssue(BaseModel):
    issue:       str
    snippet:     str
    explanation: str
    suggestion:  str

class CritiqueIssues(BaseModel):
    issues: List[CritiqueIssue]

class RevisedPromptOutput(BaseModel):
    value: str = Field(..., description="The revised prompt as a string.")
    class Config:
        extra = "forbid"

# -----------------------------------
# 2) Load .env & set API key
# -----------------------------------
SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
load_dotenv(os.path.join(SCRIPT_DIR, ".env"))
client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))

def list_tools(base_path="sample_prompts"):
    return [name for name in os.listdir(base_path) if os.path.isdir(os.path.join(base_path, name))]

def list_prompts(tool_name, base_path="sample_prompts"):
    tool_path = os.path.join(base_path, tool_name)
    return [f for f in os.listdir(tool_path) if os.path.isfile(os.path.join(tool_path, f))]

def load_prompt(tool_name, prompt_file=None, base_path="sample_prompts", **kwargs):
    if prompt_file is None:
        path = tool_name
    else:
        path = os.path.join(base_path, tool_name, prompt_file)
    with open(path, "r") as f:
        content = f.read()
    if kwargs:
        try:
            content = content.format(**kwargs)
        except Exception:
            pass
    return content


def make_prompt_agent(industry, usecase):
    
    # Load the prompt generation template with placeholders filled
    generate_prompt_template = load_prompt("prompts/generate_prompt.md")
    filled_prompt = generate_prompt_template.format(industry=industry, usecase=usecase)
    
    response = client.responses.create(
        model="gpt-5",
        input = filled_prompt,
        tools=[{"type": "web_search_preview"}],
        reasoning_effort = {
            "effort": "medium"
        }

    )
    print(response.output_text)




def make_prompt_editing_agent(industry, usecase):
    # Load prompt templates with templating
    original_prompt   = load_prompt("prompts/original_prompt.md", industry=industry, usecase=usecase)
    extraction_prompt = load_prompt("prompts/extraction_prompt.md", industry=industry, usecase=usecase)
    critique_prompt   = load_prompt("prompts/critique_system.md", industry=industry, usecase=usecase)
    critique_user     = load_prompt("prompts/critique_user.md", industry=industry, usecase=usecase)
    revise_prompt     = load_prompt("prompts/revise_prompt.md", industry=industry, usecase=usecase)
    main_prompt       = load_prompt("prompts/main_prompt.md", industry=industry, usecase=usecase)

    MODEL = "gpt-4.1"

    search_agent = Agent(
        name="search_agent",
        model=MODEL,
        instructions=f"""
        You are a **Web-Search Assistant** for **{industry}** and **{usecase}**.  
        When invoked, call the `web.search_query` tool with a concise, focused query  
        to retrieve up-to-date domain facts that are relevant to prompt engineering.  
        Return only JSON: {{ "query": "...", "results": [{{title, snippet, url}}...] }}
        """
    )

    revise_agent = Agent(
        name="revise_agent",
        model=MODEL,
        instructions=revise_prompt,
        output_type=RevisedPromptOutput
    )
    critique_agent = Agent(
        name="critique_agent",
        model=MODEL,
        instructions=critique_prompt,
        output_type=CritiqueIssues
    )
    extract_agent = Agent(
        name="extract_agent",
        model=MODEL,
        instructions=extraction_prompt,
        output_type=InstructionList,
    )
    prmopt_editing_agent = Agent(
        name="prmopt_editing_agent",
        model=MODEL,
        instructions=main_prompt,
        output_type=RevisedPromptOutput,
        tools=[
            search_agent.as_tool(
                tool_name="search_agent",
                tool_description="Search the web for industry and use case specific information",
            ),
            extract_agent.as_tool(
                tool_name="extract_agent",
                tool_description="Extract the instructions from the prompt",
            ),
            critique_agent.as_tool(
                tool_name="critique_agent",
                tool_description="Critique the instructions from the prompt",
            ),
            revise_agent.as_tool(
                tool_name="revise_agent",
                tool_description="Revise the instructions from the prompt",
            ),
        ]
    )
    return prmopt_editing_agent

async def main():
    original_prompt   = load_prompt("prompts/original_prompt.md") 
    make_prompt = make_prompt_agent("healthcare", "patient_engagement")
    main_agent = make_prompt_editing_agent("healthcare", "patient_engagement")
    result = await Runner.run(main_agent, original_prompt)
    print(result.final_output)

if __name__ == "__main__":
    asyncio.run(main())