"""
Custom Agent and Runner implementation for GPT-5 compatibility
"""
import asyncio
from typing import Any, Dict, List, Optional, Type
from pydantic import BaseModel
from openai import OpenAI
import os

# Initialize client lazily to avoid import-time errors
client = None

def get_client():
    global client
    if client is None:
        client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))
    return client

class Agent:
    def __init__(
        self, 
        name: str, 
        model: str = "gpt-5",
        instructions: str = "",
        output_type: Optional[Type[BaseModel]] = None,
        tools: Optional[List[Dict]] = None
    ):
        self.name = name
        self.model = model
        self.instructions = instructions
        self.output_type = output_type
        self.tools = tools or []
    
    def as_tool(self, tool_name: str, tool_description: str) -> Dict[str, Any]:
        """Convert this agent to a tool that can be used by other agents"""
        return {
            "type": "function",
            "function": {
                "name": tool_name,
                "description": tool_description,
                "agent": self
            }
        }

class RunResult:
    def __init__(self, content: str, agent_name: str):
        self.final_output = content
        self.value = content
        self.agent_name = agent_name
        self.content = content
    
    def __str__(self):
        return self.content

class Runner:
    @staticmethod
    async def run(agent: Agent, input_data: str) -> RunResult:
        """
        Run an agent with input data and return structured results
        """
        try:
            print(f"🤖 Running {agent.name} with {agent.model}")
            
            # For agents with tools (main orchestrating agent)
            if agent.tools:
                return await Runner._run_with_tools(agent, input_data)
            
            # For simple agents without tools
            else:
                return await Runner._run_simple_agent(agent, input_data)
                
        except Exception as e:
            print(f"❌ Error running agent {agent.name}: {e}")
            return RunResult(f"Error: {str(e)}", agent.name)
    
    @staticmethod
    async def _run_simple_agent(agent: Agent, input_data: str) -> RunResult:
        """Run a simple agent without tools"""
        try:
            client = get_client()
            response = client.chat.completions.create(
                model=agent.model,
                messages=[
                    {"role": "system", "content": agent.instructions},
                    {"role": "user", "content": input_data}
                ],
                temperature=0.7,
                max_tokens=2000
            )
            
            content = response.choices[0].message.content
            print(f"✅ {agent.name} completed")
            
            # If output_type is specified, try to parse it
            if agent.output_type:
                try:
                    import json
                    # Try to extract JSON from the response
                    json_start = content.find('{')
                    json_end = content.rfind('}') + 1
                    if json_start != -1 and json_end > json_start:
                        json_str = content[json_start:json_end]
                        parsed_data = json.loads(json_str)
                        validated_output = agent.output_type(**parsed_data)
                        return RunResult(validated_output.value if hasattr(validated_output, 'value') else str(validated_output), agent.name)
                except Exception as parse_error:
                    print(f"⚠️ Could not parse output as {agent.output_type}: {parse_error}")
            
            return RunResult(content, agent.name)
            
        except Exception as e:
            print(f"❌ Error in simple agent {agent.name}: {e}")
            return RunResult(f"Error: {str(e)}", agent.name)
    
    @staticmethod
    async def _run_with_tools(agent: Agent, input_data: str) -> RunResult:
        """Run an agent that orchestrates other agents as tools"""
        try:
            print(f"🔧 {agent.name} orchestrating {len(agent.tools)} tools")
            
            # Simulate the 5-step process
            results = []
            
            # Step 1: Search (if search_agent available)
            search_tool = next((tool for tool in agent.tools if "search" in tool["function"]["name"]), None)
            if search_tool:
                search_result = await Runner.run(search_tool["function"]["agent"], f"Research information for: {input_data}")
                results.append(f"🔍 Search Results: {search_result.content[:200]}...")
            
            # Step 2: Extract (if extract_agent available)  
            extract_tool = next((tool for tool in agent.tools if "extract" in tool["function"]["name"]), None)
            if extract_tool:
                extract_result = await Runner.run(extract_tool["function"]["agent"], input_data)
                results.append(f"📋 Extracted Instructions: {extract_result.content[:200]}...")
            
            # Step 3: Critique (if critique_agent available)
            critique_tool = next((tool for tool in agent.tools if "critique" in tool["function"]["name"]), None)
            if critique_tool:
                critique_result = await Runner.run(critique_tool["function"]["agent"], input_data)
                results.append(f"🔍 Critique: {critique_result.content[:200]}...")
            
            # Step 4: Revise (if revise_agent available)
            revise_tool = next((tool for tool in agent.tools if "revise" in tool["function"]["name"]), None)
            if revise_tool:
                revision_context = f"Original: {input_data}\n\nPrevious analysis:\n" + "\n".join(results)
                revise_result = await Runner.run(revise_tool["function"]["agent"], revision_context)
                results.append(f"✏️ Revision: {revise_result.content}")
                
                # Return the revised prompt as the final output
                print(f"✅ {agent.name} orchestration completed")
                return RunResult(revise_result.content, agent.name)
            
            # If no revise tool, use the main agent to synthesize results
            synthesis_prompt = f"""
            Original prompt: {input_data}
            
            Analysis results:
            {chr(10).join(results)}
            
            Based on this analysis, provide an improved version of the original prompt.
            """
            
            client = get_client()
            response = client.chat.completions.create(
                model=agent.model,
                messages=[
                    {"role": "system", "content": agent.instructions},
                    {"role": "user", "content": synthesis_prompt}
                ],
                temperature=0.7,
                max_tokens=2000
            )
            
            final_content = response.choices[0].message.content
            print(f"✅ {agent.name} orchestration completed")
            
            return RunResult(final_content, agent.name)
            
        except Exception as e:
            print(f"❌ Error in orchestration {agent.name}: {e}")
            return RunResult(f"Error: {str(e)}", agent.name)
