from typing import List, Dict, Any
from pydantic import BaseModel
from openai import OpenAI
import os

class Agent:
    """Base Agent class for handling different types of prompt processing tasks."""
    
    def __init__(self, name: str, system_prompt: str):
        self.name = name
        self.system_prompt = system_prompt
        self.client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))
    
    def process(self, input_text: str, response_format: Any = None) -> Dict[str, Any]:
        """Process input text using the agent's system prompt."""
        try:
            if response_format:
                response = self.client.beta.chat.completions.parse(
                    model="gpt-4o-mini",
                    messages=[
                        {"role": "system", "content": self.system_prompt},
                        {"role": "user", "content": input_text}
                    ],
                    response_format=response_format,
                )
                return {"success": True, "data": response.choices[0].message.parsed}
            else:
                response = self.client.chat.completions.create(
                    model="gpt-4o-mini",
                    messages=[
                        {"role": "system", "content": self.system_prompt},
                        {"role": "user", "content": input_text}
                    ],
                )
                return {"success": True, "data": response.choices[0].message.content}
        except Exception as e:
            return {"success": False, "error": str(e)}

class Runner:
    """Runner class to orchestrate multiple agents and tasks."""
    
    def __init__(self):
        self.agents: Dict[str, Agent] = {}
        self.client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))
    
    def add_agent(self, agent: Agent):
        """Add an agent to the runner."""
        self.agents[agent.name] = agent
    
    def run_agent(self, agent_name: str, input_text: str, response_format: Any = None) -> Dict[str, Any]:
        """Run a specific agent with the given input."""
        if agent_name not in self.agents:
            return {"success": False, "error": f"Agent '{agent_name}' not found"}
        
        return self.agents[agent_name].process(input_text, response_format)
    
    def run_pipeline(self, pipeline_config: List[Dict[str, Any]], initial_input: str) -> Dict[str, Any]:
        """Run a pipeline of agents in sequence."""
        current_input = initial_input
        results = []
        
        for step in pipeline_config:
            agent_name = step.get("agent")
            response_format = step.get("response_format")
            
            result = self.run_agent(agent_name, current_input, response_format)
            results.append(result)
            
            if not result["success"]:
                return {"success": False, "error": f"Pipeline failed at step {agent_name}", "results": results}
            
            # Use the output as input for the next step
            if isinstance(result["data"], str):
                current_input = result["data"]
            else:
                current_input = str(result["data"])
        
        return {"success": True, "results": results}

# Pre-configured agents for common tasks
def create_instruction_extractor() -> Agent:
    """Create an agent for extracting instructions from prompts."""
    from utils import load_prompt
    system_prompt = load_prompt("instruction_extractor")
    return Agent("instruction_extractor", system_prompt)

def create_prompt_critic() -> Agent:
    """Create an agent for critiquing prompts."""
    from utils import load_prompt
    system_prompt = load_prompt("prompt_critic")
    return Agent("prompt_critic", system_prompt)

def create_prompt_reviser() -> Agent:
    """Create an agent for revising and improving prompts."""
    from utils import load_prompt
    system_prompt = load_prompt("prompt_reviser")
    return Agent("prompt_reviser", system_prompt)