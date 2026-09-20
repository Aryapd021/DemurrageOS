import json
import logging
from typing import Dict, Any, Optional
import httpx
from app.config import settings

logger = logging.getLogger(__name__)

EXTRACTION_SYSTEM_PROMPT = """You are an expert shipping document parser for Customs House Agents (CHAs) and maritime logistics.
Extract the following key fields from the provided document text:
- container_number: ISO 6346 container number (e.g. MSCU1234567, CSQU3054383)
- bl_number: Bill of Lading number
- free_days: Number of free demurrage days allowed as integer (e.g. 5, 14)
- shipping_line: Ocean carrier or shipping line name (e.g. Maersk Line, MSC, CMA CGM)
- cfs_name: Container Freight Station terminal name (e.g. Speedy CFS Terminal 2, Gateway CFS)
- declared_value: Total assessable or declared value as float (if present)
- hs_code: Harmonized system tariff code (if present)

Respond ONLY with valid JSON in this exact structure:
{
  "container_number": {"value": string or null, "confidence": float between 0.0 and 1.0},
  "bl_number": {"value": string or null, "confidence": float between 0.0 and 1.0},
  "free_days": {"value": integer or null, "confidence": float between 0.0 and 1.0},
  "shipping_line": {"value": string or null, "confidence": float between 0.0 and 1.0},
  "cfs_name": {"value": string or null, "confidence": float between 0.0 and 1.0},
  "declared_value": {"value": float or null, "confidence": float between 0.0 and 1.0},
  "hs_code": {"value": string or null, "confidence": float between 0.0 and 1.0}
}
"""

def get_gemini_endpoint() -> str:
    """Builds the dynamic Gemini generateContent endpoint based on configured model."""
    model = settings.gemini_model.strip() if settings.gemini_model else "gemini-3.8-flash"
    return f"https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent"

def extract_with_gemini(text: str) -> Optional[Dict[str, Any]]:
    """
    Advisory extraction via Google Gemini (configurable model, e.g. gemini-3.8-flash).
    Returns None if GEMINI_API_KEY is not configured or if any API/network error occurs,
    allowing the system to gracefully fall back to local deterministic rule extractors.
    """
    api_key = settings.gemini_api_key
    if not api_key or not api_key.strip():
        return None

    if not text or not text.strip():
        return None

    try:
        payload = {
            "contents": [
                {
                    "parts": [
                        {"text": EXTRACTION_SYSTEM_PROMPT},
                        {"text": f"Document text to extract from:\n\"\"\"\n{text[:8000]}\n\"\"\""}
                    ]
                }
            ],
            "generationConfig": {
                "temperature": 0.1,
                "responseMimeType": "application/json"
            }
        }

        endpoint = get_gemini_endpoint()
        with httpx.Client(timeout=8.0) as client:
            resp = client.post(
                f"{endpoint}?key={api_key}",
                json=payload,
                headers={"Content-Type": "application/json"}
            )

        if resp.status_code != 200:
            logger.warning(f"Gemini API returned status {resp.status_code}: {resp.text[:200]}")
            return None

        data = resp.json()
        candidates = data.get("candidates", [])
        if not candidates:
            return None

        content_parts = candidates[0].get("content", {}).get("parts", [])
        if not content_parts:
            return None

        raw_text = content_parts[0].get("text", "").strip()
        # Clean any accidental markdown code fences
        if raw_text.startswith("```json"):
            raw_text = raw_text[7:]
        if raw_text.startswith("```"):
            raw_text = raw_text[3:]
        if raw_text.endswith("```"):
            raw_text = raw_text[:-3]

        parsed = json.loads(raw_text.strip())
        return parsed
    except Exception as exc:
        logger.warning(f"Gemini advisory extraction failed: {exc}. Gracefully falling back.")
        return None
