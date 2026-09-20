from typing import Any, Dict, Optional
from pydantic import BaseModel, Field

class FieldProvenance(BaseModel):
    value: Any
    confidence: float = Field(..., ge=0.0, le=1.0)
    source: str = Field(..., description="ocr+regex, rule_parser, or ml_model")

class ExtractionResponse(BaseModel):
    documentId: str
    extractedFields: Dict[str, Any] = Field(default_factory=dict)
    confidence: float = Field(..., ge=0.0, le=1.0)
    flaggedForReview: bool
    fieldLevelConfidence: Dict[str, FieldProvenance] = Field(default_factory=dict)
    fields: Dict[str, Any] = Field(default_factory=dict, description="FILE 1 structured fields format with value and confidence")
    needs_human_review: bool = Field(default=True, description="FILE 1 review flag")
    success: bool = Field(default=True, description="API status")
    container_valid: Optional[bool] = Field(default=None, description="ISO 6346 check digit validation status")
    extractionVersion: str = "1.0.0"
    modelVersion: str = "gemini-1.5-flash+rule_v1"

