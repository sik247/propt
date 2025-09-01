"""
Auto-generate appropriate JSON input/output formats based on industry and use case
"""
import json
import os
from typing import Dict, Any, Tuple
from openai import OpenAI


def get_format_generation_client():
    """Get OpenAI client for format generation"""
    return OpenAI(api_key=os.getenv("OPENAI_API_KEY"))


def generate_json_formats(industry: str, usecase: str, tasks: list = None, reasoning_effort: str = "medium") -> Tuple[Dict[str, Any], Dict[str, Any]]:
    """
    Auto-generate appropriate JSON input and output formats based on industry and use case
    
    Args:
        industry: The industry context (e.g., "finance", "healthcare", "retail")
        usecase: The specific use case (e.g., "stock analysis", "patient diagnosis", "product recommendation")
        tasks: Optional list of specific tasks to consider
        reasoning_effort: Reasoning effort level for the LLM
        
    Returns:
        Tuple of (input_format_dict, output_format_dict)
    """
    
    try:
        client = get_format_generation_client()
        
        # Create a detailed prompt for format generation
        tasks_text = ""
        if tasks and len(tasks) > 0:
            tasks_text = f"\nSpecific tasks to consider:\n" + "\n".join([f"- {task}" for task in tasks])
        
        format_generation_prompt = f"""
        You are an expert system architect who specializes in designing JSON data formats for AI applications.
        
        Generate appropriate JSON schemas for both INPUT and OUTPUT formats for an AI system in the {industry} industry, specifically for {usecase}.{tasks_text}
        
        Requirements:
        1. Design practical, real-world JSON formats that would be used in {industry} for {usecase}
        2. Include all relevant fields that professionals in {industry} would expect
        3. Use appropriate data types (string, number, boolean, array, object)
        4. Include nested objects where appropriate for the domain
        5. Add meaningful field names that reflect industry terminology
        6. Consider compliance, regulatory, and industry-specific requirements
        7. Make the input format comprehensive enough to capture all necessary data
        8. Make the output format detailed and actionable for professionals
        
        Industry-specific considerations:
        - Finance: Include risk metrics, compliance fields, market data, regulatory requirements
        - Healthcare: Include patient data, medical codes, safety protocols, privacy considerations  
        - Retail: Include product data, customer segments, inventory, sales metrics
        - Technology: Include technical specifications, performance metrics, security considerations
        - Legal: Include case references, legal citations, compliance requirements
        - Education: Include learning objectives, assessment criteria, student data
        
        Return ONLY a JSON object with exactly this structure:
        {{
            "input_format": {{
                // Complete JSON schema for input data
            }},
            "output_format": {{
                // Complete JSON schema for output data  
            }}
        }}
        
        Make the formats comprehensive but practical for {industry} professionals working on {usecase}.
        """
        
        response = client.responses.create(
            model="gpt-5-mini-2025-08-07",
            input=format_generation_prompt,
            reasoning={"effort": reasoning_effort}
        )
        
        # Parse the response to extract JSON formats
        response_text = response.output_text.strip()
        
        # Find JSON in the response
        import re
        json_match = re.search(r'\{.*\}', response_text, re.DOTALL)
        if json_match:
            formats_data = json.loads(json_match.group())
            
            input_format = formats_data.get('input_format', {})
            output_format = formats_data.get('output_format', {})
            
            return input_format, output_format
        else:
            # Fallback to basic formats if parsing fails
            return get_fallback_formats(industry, usecase)
            
    except Exception as e:
        print(f"⚠️ Error generating JSON formats: {e}")
        return get_fallback_formats(industry, usecase)


def get_fallback_formats(industry: str, usecase: str) -> Tuple[Dict[str, Any], Dict[str, Any]]:
    """
    Provide fallback JSON formats based on industry templates
    """
    
    # Industry-specific fallback formats
    fallback_formats = {
        "finance": {
            "input_format": {
                "request_id": "string",
                "user_id": "string", 
                "data": {
                    "market_data": {
                        "symbols": ["string"],
                        "timeframe": "string",
                        "metrics": ["string"]
                    },
                    "analysis_type": "string",
                    "risk_tolerance": "string",
                    "compliance_requirements": ["string"]
                },
                "timestamp": "string"
            },
            "output_format": {
                "analysis_id": "string",
                "results": {
                    "summary": "string",
                    "recommendations": ["string"],
                    "risk_assessment": {
                        "risk_level": "string",
                        "risk_factors": ["string"],
                        "risk_score": "number"
                    },
                    "financial_metrics": {
                        "key_indicators": "object",
                        "performance_data": "object"
                    }
                },
                "compliance": {
                    "regulatory_notes": ["string"],
                    "approval_status": "string"
                },
                "timestamp": "string",
                "confidence_level": "number"
            }
        },
        
        "healthcare": {
            "input_format": {
                "patient_id": "string",
                "request_type": "string",
                "clinical_data": {
                    "symptoms": ["string"],
                    "medical_history": ["string"],
                    "current_medications": ["string"],
                    "vital_signs": "object",
                    "lab_results": "object"
                },
                "privacy_consent": "boolean",
                "urgency_level": "string"
            },
            "output_format": {
                "analysis_id": "string", 
                "clinical_assessment": {
                    "primary_findings": ["string"],
                    "differential_diagnosis": ["string"],
                    "risk_stratification": "string"
                },
                "recommendations": {
                    "immediate_actions": ["string"],
                    "follow_up_care": ["string"],
                    "referrals": ["string"]
                },
                "safety_alerts": ["string"],
                "confidence_metrics": {
                    "certainty_level": "number",
                    "evidence_quality": "string"
                },
                "compliance_notes": ["string"]
            }
        },
        
        "technology": {
            "input_format": {
                "project_id": "string",
                "requirements": {
                    "functional_specs": ["string"],
                    "technical_constraints": ["string"],
                    "performance_criteria": "object",
                    "security_requirements": ["string"]
                },
                "context": {
                    "technology_stack": ["string"],
                    "team_size": "number",
                    "timeline": "string",
                    "budget_constraints": "string"
                }
            },
            "output_format": {
                "solution_id": "string",
                "technical_solution": {
                    "architecture_design": "object",
                    "implementation_plan": ["string"],
                    "technology_recommendations": ["string"]
                },
                "risk_analysis": {
                    "technical_risks": ["string"],
                    "mitigation_strategies": ["string"]
                },
                "resource_estimates": {
                    "time_estimate": "string",
                    "effort_breakdown": "object",
                    "skill_requirements": ["string"]
                },
                "success_metrics": ["string"]
            }
        }
    }
    
    # Get industry-specific format or use generic fallback
    industry_lower = industry.lower()
    if industry_lower in fallback_formats:
        formats = fallback_formats[industry_lower]
    else:
        # Generic fallback for unknown industries
        formats = {
            "input_format": {
                "request_id": "string",
                "user_input": "string",
                "context": "object",
                "parameters": "object"
            },
            "output_format": {
                "response_id": "string", 
                "result": "string",
                "metadata": "object",
                "confidence": "number",
                "timestamp": "string"
            }
        }
    
    return formats["input_format"], formats["output_format"]


def format_json_for_prompt(json_data: Dict[str, Any]) -> str:
    """
    Format JSON data as a readable string for prompt inclusion
    """
    return json.dumps(json_data, indent=2, ensure_ascii=False)


def get_format_examples(industry: str, usecase: str) -> Tuple[str, str]:
    """
    Get example JSON format strings ready for prompt inclusion
    
    Returns:
        Tuple of (input_format_string, output_format_string)
    """
    input_format, output_format = generate_json_formats(industry, usecase)
    
    input_format_string = format_json_for_prompt(input_format)
    output_format_string = format_json_for_prompt(output_format)
    
    return input_format_string, output_format_string


# Pre-defined industry patterns for quick lookup
INDUSTRY_PATTERNS = {
    "finance": ["finance", "banking", "investment", "trading", "insurance", "fintech"],
    "healthcare": ["healthcare", "medical", "clinical", "patient", "diagnosis", "treatment"],
    "technology": ["technology", "software", "development", "engineering", "IT", "tech"],
    "retail": ["retail", "ecommerce", "sales", "marketing", "customer", "product"],
    "legal": ["legal", "law", "compliance", "regulatory", "contract", "litigation"],
    "education": ["education", "learning", "training", "academic", "student", "course"]
}


def detect_industry_from_usecase(usecase: str) -> str:
    """
    Try to detect industry from use case description
    """
    usecase_lower = usecase.lower()
    
    for industry, keywords in INDUSTRY_PATTERNS.items():
        if any(keyword in usecase_lower for keyword in keywords):
            return industry
    
    return "general"
