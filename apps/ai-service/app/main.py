from fastapi import FastAPI, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from app.config import settings
from app.schemas.request import ExtractionRequest
from app.schemas.response import ExtractionResponse
from app.schemas.risk import PredictiveRiskRequest, PredictiveRiskResponse
from app.schemas.knowledge import KnowledgeQueryRequest, KnowledgeQueryResponse, KnowledgeItem
from app.extraction.pipeline import run_document_extraction
from app.risk.advisory_predictor import AdvisoryDeterministicPredictor
from app.knowledge.chroma_service import ChromaKnowledgeService

app = FastAPI(
    title=settings.app_name,
    description="Advisory AI Document Extraction, Advisory Predictor, and Knowledge Intelligence Service for DemurrageOS",
    version="1.1.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/health", status_code=status.HTTP_200_OK)
def health_check():
    return {
        "status": "ok",
        "service": "ai-service",
        "model": settings.extraction_model,
        "embeddingModel": settings.embedding_model,
        "hasGeminiKey": bool(settings.gemini_api_key)
    }

# Canonical document extraction endpoint
@app.post("/extract", response_model=ExtractionResponse, status_code=status.HTTP_200_OK)
def extract_document(payload: ExtractionRequest):
    try:
        response = run_document_extraction(
            document_id=payload.documentId,
            file_url=payload.fileUrl,
            document_type=payload.documentType
        )
        return response
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Extraction error: {str(exc)}"
        )

# Lightweight alias for FILE 1 specification compatibility
@app.post("/api/ai/extract/document", response_model=ExtractionResponse, status_code=status.HTTP_200_OK)
def extract_document_alias(payload: ExtractionRequest):
    """Lightweight alias for canonical /extract endpoint."""
    return extract_document(payload)

# Advisory deterministic risk evaluation endpoint (FILE 1)
@app.post("/api/ai/risk/evaluate", response_model=PredictiveRiskResponse, status_code=status.HTTP_200_OK)
def evaluate_predictive_risk(payload: PredictiveRiskRequest):
    try:
        return AdvisoryDeterministicPredictor.evaluate(payload)
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Predictive risk evaluation error: {str(exc)}"
        )

# Multi-tenant knowledge search endpoint with ChromaDB (FILE 1)
@app.post("/api/ai/knowledge/query", response_model=KnowledgeQueryResponse, status_code=status.HTTP_200_OK)
def query_knowledge(payload: KnowledgeQueryRequest):
    try:
        results = ChromaKnowledgeService.query(
            query_text=payload.query,
            org_id=payload.org_id,
            n_results=payload.n_results,
            include_demo=payload.include_demo
        )
        items = [
            KnowledgeItem(
                id=r["id"],
                text=r["text"],
                metadata=r["metadata"],
                distance=r["distance"]
            )
            for r in results
        ]
        return KnowledgeQueryResponse(
            success=True,
            query=payload.query,
            org_id=payload.org_id,
            results=items
        )
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Knowledge query error: {str(exc)}"
        )
