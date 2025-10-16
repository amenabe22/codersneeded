"""
AI-powered applicant ranking service using Google Gemini
"""
import logging
import json
from typing import List, Dict, Optional
import google.generativeai as genai
from app.config import settings
from app.models import Application

logger = logging.getLogger(__name__)


class ApplicantAIAnalyzer:
    """Analyzes and ranks job applicants using Gemini AI"""
    
    def __init__(self):
        self.api_key = settings.GEMINI_API_KEY
        if self.api_key:
            try:
                genai.configure(api_key=self.api_key)
                self.model = genai.GenerativeModel('gemini-2.0-flash-exp')
                logger.info("Gemini AI initialized successfully")
            except Exception as e:
                logger.error(f"Failed to initialize Gemini AI: {e}")
                self.model = None
        else:
            logger.warning("GEMINI_API_KEY not configured")
            self.model = None
    
    def analyze_applicants(
        self, 
        applications: List[Application], 
        job_title: str,
        job_description: str,
        job_requirements: Optional[str] = None
    ) -> List[Dict]:
        """
        Analyze and rank applicants using AI
        
        Returns list of applications with AI scores and insights
        """
        if not self.model:
            logger.warning("Gemini AI not available, returning unranked applications")
            return self._fallback_ranking(applications)
        
        if not applications:
            return []
        
        try:
            # Prepare applicant data for AI analysis
            applicants_data = []
            for app in applications:
                applicant_info = {
                    "id": app.id,
                    "name": f"{app.applicant.first_name} {app.applicant.last_name or ''}".strip(),
                    "username": app.applicant.username or "N/A",
                    "cover_letter": app.cover_letter or "No cover letter provided",
                    "has_resume": bool(app.resume_url),
                    "status": app.status.value
                }
                applicants_data.append(applicant_info)
            
            # Create comprehensive prompt for Gemini
            prompt = self._create_analysis_prompt(
                job_title=job_title,
                job_description=job_description,
                job_requirements=job_requirements,
                applicants=applicants_data
            )
            
            # Get AI analysis
            response = self.model.generate_content(prompt)
            analysis_text = response.text
            
            # Parse the AI response
            ranked_applicants = self._parse_ai_response(analysis_text, applications)
            
            return ranked_applicants
            
        except Exception as e:
            logger.error(f"AI analysis failed: {e}")
            return self._fallback_ranking(applications)
    
    def _create_analysis_prompt(
        self, 
        job_title: str, 
        job_description: str,
        job_requirements: Optional[str],
        applicants: List[Dict]
    ) -> str:
        """Create a detailed prompt for Gemini to analyze applicants"""
        
        requirements_section = f"\n**Requirements:**\n{job_requirements}" if job_requirements else ""
        
        prompt = f"""You are an expert HR professional and talent acquisition specialist. Analyze the following job applicants and rank them based on their suitability for the position.

**Job Position:** {job_title}

**Job Description:**
{job_description}
{requirements_section}

**Applicants to Analyze:**
"""
        
        for i, applicant in enumerate(applicants, 1):
            prompt += f"""
{i}. **{applicant['name']}** (@{applicant['username']})
   - Application ID: {applicant['id']}
   - Resume Attached: {"Yes" if applicant['has_resume'] else "No"}
   - Cover Letter: "{applicant['cover_letter']}"
   - Current Status: {applicant['status']}

"""
        
        prompt += """
**Your Task:**
Analyze each applicant and provide a JSON response with the following structure for each applicant:

```json
[
  {
    "application_id": <application_id>,
    "overall_score": <0-100>,
    "cover_letter_score": <0-100>,
    "completeness_score": <0-100>,
    "relevance_score": <0-100>,
    "ai_summary": "<2-3 sentence summary of why this candidate is a good or poor fit>",
    "strengths": ["<strength 1>", "<strength 2>", "<strength 3>"],
    "concerns": ["<concern 1>", "<concern 2>"],
    "recommendation": "<hire|interview|maybe|pass>"
  }
]
```

**Scoring Criteria:**
- **overall_score**: Holistic assessment (0-100)
- **cover_letter_score**: Quality, relevance, and professionalism of cover letter (0-100)
- **completeness_score**: How complete is the application (resume attached, detailed cover letter) (0-100)
- **relevance_score**: How well the applicant's experience/skills match the job requirements (0-100)

**Recommendations:**
- "hire" - Strong candidate, highly recommended
- "interview" - Good candidate, worth interviewing
- "maybe" - Moderate fit, consider as backup
- "pass" - Not a good fit for this position

Please provide ONLY the JSON array, no additional text or markdown formatting. Order by overall_score descending (best candidates first).
"""
        
        return prompt
    
    def _parse_ai_response(self, response_text: str, applications: List[Application]) -> List[Dict]:
        """Parse AI response and merge with application data"""
        
        try:
            # Clean the response text
            cleaned_text = response_text.strip()
            
            # Remove markdown code blocks if present
            if cleaned_text.startswith("```json"):
                cleaned_text = cleaned_text[7:]
            elif cleaned_text.startswith("```"):
                cleaned_text = cleaned_text[3:]
            
            if cleaned_text.endswith("```"):
                cleaned_text = cleaned_text[:-3]
            
            cleaned_text = cleaned_text.strip()
            
            # Parse JSON
            ai_rankings = json.loads(cleaned_text)
            
            # Create a map of application_id to application object
            app_map = {app.id: app for app in applications}
            
            # Merge AI data with application data
            ranked_results = []
            for ranking in ai_rankings:
                app_id = ranking.get("application_id")
                if app_id in app_map:
                    app = app_map[app_id]
                    result = {
                        "application": app,
                        "ai_analysis": {
                            "overall_score": ranking.get("overall_score", 0),
                            "cover_letter_score": ranking.get("cover_letter_score", 0),
                            "completeness_score": ranking.get("completeness_score", 0),
                            "relevance_score": ranking.get("relevance_score", 0),
                            "ai_summary": ranking.get("ai_summary", ""),
                            "strengths": ranking.get("strengths", []),
                            "concerns": ranking.get("concerns", []),
                            "recommendation": ranking.get("recommendation", "maybe")
                        }
                    }
                    ranked_results.append(result)
            
            return ranked_results
            
        except json.JSONDecodeError as e:
            logger.error(f"Failed to parse AI response as JSON: {e}")
            logger.error(f"Response text: {response_text[:500]}")
            return self._fallback_ranking(applications)
        except Exception as e:
            logger.error(f"Error parsing AI response: {e}")
            return self._fallback_ranking(applications)
    
    def _fallback_ranking(self, applications: List[Application]) -> List[Dict]:
        """Fallback ranking when AI is unavailable - simple rule-based scoring"""
        
        results = []
        for app in applications:
            # Simple scoring based on completeness
            completeness_score = 0
            if app.cover_letter:
                completeness_score += 50
            if app.resume_url:
                completeness_score += 50
            
            # Basic cover letter quality check
            cover_letter_score = 0
            if app.cover_letter:
                length = len(app.cover_letter)
                if length > 200:
                    cover_letter_score = 80
                elif length > 100:
                    cover_letter_score = 60
                elif length > 50:
                    cover_letter_score = 40
                else:
                    cover_letter_score = 20
            
            overall_score = (completeness_score + cover_letter_score) / 2
            
            result = {
                "application": app,
                "ai_analysis": {
                    "overall_score": int(overall_score),
                    "cover_letter_score": cover_letter_score,
                    "completeness_score": completeness_score,
                    "relevance_score": 50,  # Default neutral score
                    "ai_summary": "AI analysis unavailable. Basic scoring applied.",
                    "strengths": [],
                    "concerns": [],
                    "recommendation": "review"
                }
            }
            results.append(result)
        
        # Sort by overall score descending
        results.sort(key=lambda x: x["ai_analysis"]["overall_score"], reverse=True)
        
        return results


# Singleton instance
ai_analyzer = ApplicantAIAnalyzer()

