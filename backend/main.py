#!/usr/bin/env python3
"""
Propt Backend - Agentic Prompt Processing System
"""

import os
import sys
import json
import asyncio
from pathlib import Path
from typing import Dict, List, Optional, Any
from dataclasses import dataclass
from datetime import datetime

# Add current directory to path for imports
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

@dataclass
class PromptRequest:
    """Data structure for prompt processing requests"""
    content: str
    industry: str = "general"
    use_case: str = "general"
    company: str = "generic"
    file_path: Optional[str] = None

@dataclass
class ProcessingResult:
    """Data structure for processing results"""
    original_prompt: str
    processed_prompt: str
    analysis: Dict[str, Any]
    recommendations: List[str]
    timestamp: str
    success: bool
    error_message: Optional[str] = None

class PromptAgent:
    """Main agent class for prompt processing"""
    
    def __init__(self):
        self.sample_prompts_dir = Path(__file__).parent / "sample_prompts"
        self.available_companies = self._load_available_companies()
        
    def _load_available_companies(self) -> List[str]:
        """Load list of available company prompt templates"""
        if not self.sample_prompts_dir.exists():
            return []
        
        companies = []
        for item in self.sample_prompts_dir.iterdir():
            if item.is_dir():
                companies.append(item.name)
        
        return sorted(companies)
    
    def get_company_prompt(self, company: str) -> Optional[str]:
        """Load a specific company's prompt template"""
        company_dir = self.sample_prompts_dir / company
        
        # Try common prompt file names
        for filename in ["Prompt.txt", "prompt.txt", "Default Prompt.txt", "Agent Prompt.txt"]:
            prompt_file = company_dir / filename
            if prompt_file.exists():
                try:
                    return prompt_file.read_text(encoding='utf-8')
                except Exception as e:
                    print(f"Error reading {prompt_file}: {e}")
                    continue
        
        return None
    
    async def analyze_prompt(self, prompt_content: str) -> Dict[str, Any]:
        """Analyze prompt for quality and effectiveness"""
        analysis = {
            "word_count": len(prompt_content.split()),
            "character_count": len(prompt_content),
            "has_examples": "example" in prompt_content.lower(),
            "has_instructions": any(word in prompt_content.lower() for word in ["instruction", "rule", "guideline"]),
            "clarity_score": self._calculate_clarity_score(prompt_content),
            "structure_score": self._calculate_structure_score(prompt_content),
            "completeness_score": self._calculate_completeness_score(prompt_content)
        }
        
        return analysis
    
    def _calculate_clarity_score(self, content: str) -> float:
        """Calculate clarity score based on readability metrics"""
        # Simple heuristic: longer sentences reduce clarity
        sentences = content.split('.')
        avg_sentence_length = sum(len(s.split()) for s in sentences) / max(len(sentences), 1)
        
        # Score inversely related to sentence length (optimal around 15-20 words)
        if avg_sentence_length <= 20:
            return min(1.0, avg_sentence_length / 20)
        else:
            return max(0.3, 1.0 - (avg_sentence_length - 20) / 50)
    
    def _calculate_structure_score(self, content: str) -> float:
        """Calculate structure score based on organization"""
        score = 0.0
        
        # Check for headers/sections
        if any(marker in content for marker in ['##', '###', '#', '*', '-']):
            score += 0.3
        
        # Check for numbered lists
        if any(f"{i}." in content for i in range(1, 6)):
            score += 0.3
        
        # Check for examples section
        if "example" in content.lower():
            score += 0.2
        
        # Check for instructions section
        if any(word in content.lower() for word in ["instruction", "rule", "guideline"]):
            score += 0.2
        
        return min(1.0, score)
    
    def _calculate_completeness_score(self, content: str) -> float:
        """Calculate completeness score"""
        score = 0.0
        
        # Check for role definition
        if any(phrase in content.lower() for phrase in ["you are", "act as", "role"]):
            score += 0.25
        
        # Check for capabilities
        if any(phrase in content.lower() for phrase in ["can", "able to", "capabilities"]):
            score += 0.25
        
        # Check for constraints/limitations
        if any(phrase in content.lower() for phrase in ["don't", "cannot", "avoid", "limitation"]):
            score += 0.25
        
        # Check for examples
        if "example" in content.lower():
            score += 0.25
        
        return score
    
    def generate_recommendations(self, analysis: Dict[str, Any]) -> List[str]:
        """Generate recommendations based on analysis"""
        recommendations = []
        
        if analysis["clarity_score"] < 0.7:
            recommendations.append("Consider breaking long sentences into shorter, clearer statements")
        
        if analysis["structure_score"] < 0.6:
            recommendations.append("Add section headers and numbered lists for better organization")
        
        if analysis["completeness_score"] < 0.6:
            recommendations.append("Include role definition, capabilities, and examples for completeness")
        
        if not analysis["has_examples"]:
            recommendations.append("Add concrete examples to illustrate expected behavior")
        
        if analysis["word_count"] < 50:
            recommendations.append("Consider expanding the prompt with more detailed instructions")
        elif analysis["word_count"] > 500:
            recommendations.append("Consider condensing the prompt for better focus")
        
        return recommendations
    
    async def process_prompt(self, request: PromptRequest) -> ProcessingResult:
        """Main processing function for prompts"""
        try:
            # Analyze the input prompt
            analysis = await self.analyze_prompt(request.content)
            
            # Generate recommendations
            recommendations = self.generate_recommendations(analysis)
            
            # Apply improvements based on company template if available
            improved_prompt = await self.improve_prompt(request)
            
            return ProcessingResult(
                original_prompt=request.content,
                processed_prompt=improved_prompt,
                analysis=analysis,
                recommendations=recommendations,
                timestamp=datetime.now().isoformat(),
                success=True
            )
            
        except Exception as e:
            return ProcessingResult(
                original_prompt=request.content,
                processed_prompt=request.content,
                analysis={},
                recommendations=[],
                timestamp=datetime.now().isoformat(),
                success=False,
                error_message=str(e)
            )
    
    async def improve_prompt(self, request: PromptRequest) -> str:
        """Improve prompt based on company template and best practices"""
        base_prompt = request.content
        
        # Try to get company-specific template
        if request.company in self.available_companies:
            template = self.get_company_prompt(request.company)
            if template:
                # Simple improvement: combine template structure with user content
                improved = f"{template}\n\n## Custom Instructions:\n{base_prompt}"
                return improved
        
        # Default improvements
        improved_sections = []
        
        # Add role definition if missing
        if not any(phrase in base_prompt.lower() for phrase in ["you are", "act as", "role"]):
            improved_sections.append(f"You are an AI assistant specialized in {request.industry} for {request.use_case}.")
        
        improved_sections.append(base_prompt)
        
        # Add structure if missing
        if "##" not in base_prompt and "#" not in base_prompt:
            improved_sections.append("\n## Instructions:\n- Follow the guidelines above carefully\n- Provide clear and helpful responses\n- Ask for clarification when needed")
        
        return "\n\n".join(improved_sections)

# Web API setup (using FastAPI-style structure)
class ProptAPI:
    """API interface for the prompt processing system"""
    
    def __init__(self):
        self.agent = PromptAgent()
    
    async def health_check(self):
        """Health check endpoint"""
        return {"status": "healthy", "timestamp": datetime.now().isoformat()}
    
    async def get_companies(self):
        """Get list of available companies"""
        return {"companies": self.agent.available_companies}
    
    async def process_prompt_endpoint(self, request_data: Dict[str, Any]):
        """Process prompt endpoint"""
        try:
            request = PromptRequest(
                content=request_data.get("content", ""),
                industry=request_data.get("industry", "general"),
                use_case=request_data.get("use_case", "general"),
                company=request_data.get("company", "generic"),
                file_path=request_data.get("file_path")
            )
            
            result = await self.agent.process_prompt(request)
            
            return {
                "success": result.success,
                "original_prompt": result.original_prompt,
                "processed_prompt": result.processed_prompt,
                "analysis": result.analysis,
                "recommendations": result.recommendations,
                "timestamp": result.timestamp,
                "error_message": result.error_message
            }
            
        except Exception as e:
            return {
                "success": False,
                "error_message": str(e),
                "timestamp": datetime.now().isoformat()
            }

# CLI interface
async def main():
    """Main CLI function"""
    if len(sys.argv) < 2:
        print("Usage: python main.py <prompt_content> [--industry <industry>] [--use-case <use_case>] [--company <company>]")
        print(f"Available companies: {', '.join(PromptAgent().available_companies)}")
        return
    
    # Parse command line arguments
    prompt_content = sys.argv[1]
    industry = "general"
    use_case = "general"
    company = "generic"
    
    for i, arg in enumerate(sys.argv[2:], 2):
        if arg == "--industry" and i + 1 < len(sys.argv):
            industry = sys.argv[i + 1]
        elif arg == "--use-case" and i + 1 < len(sys.argv):
            use_case = sys.argv[i + 1]
        elif arg == "--company" and i + 1 < len(sys.argv):
            company = sys.argv[i + 1]
    
    # Process the prompt
    agent = PromptAgent()
    request = PromptRequest(
        content=prompt_content,
        industry=industry,
        use_case=use_case,
        company=company
    )
    
    result = await agent.process_prompt(request)
    
    # Output results
    print("=" * 50)
    print("PROPT - Prompt Processing Results")
    print("=" * 50)
    print(f"Success: {result.success}")
    print(f"Timestamp: {result.timestamp}")
    
    if result.error_message:
        print(f"Error: {result.error_message}")
        return
    
    print("\n--- Analysis ---")
    for key, value in result.analysis.items():
        print(f"{key}: {value}")
    
    print("\n--- Recommendations ---")
    for i, rec in enumerate(result.recommendations, 1):
        print(f"{i}. {rec}")
    
    print("\n--- Improved Prompt ---")
    print(result.processed_prompt)

if __name__ == "__main__":
    asyncio.run(main())