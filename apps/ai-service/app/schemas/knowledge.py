from typing import List, Dict, Any, Optional
from pydantic import BaseModel, Field

class KnowledgeQueryRequest(BaseModel):
    query: str = Field(..., min_length=2, description="Natural language search query")
    org_id: str = Field(..., description="Authenticated organization ID")
    n_results: int = Field(default=3, ge=1, le=10, description="Number of results to return")
    include_demo: bool = Field(default=False, description="Whether to search demo collection (forbidden in production)")

class KnowledgeItem(BaseModel):
    id: str
    text: str
    metadata: Dict[str, Any]
    distance: Optional[float] = None

class KnowledgeQueryResponse(BaseModel):
    success: bool = True
    query: str
    org_id: str
    results: List[KnowledgeItem]
