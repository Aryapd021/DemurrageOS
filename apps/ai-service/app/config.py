import os
from pydantic import BaseModel

class Settings(BaseModel):
    app_name: str = "DemurrageOS AI Extraction Service"
    port: int = int(os.getenv("PORT", 8000))
    extraction_model: str = os.getenv("AI_EXTRACTION_MODEL", "deepseek-ocr-v1")
    embedding_model: str = os.getenv("AI_EMBEDDING_MODEL", "sentence-transformers/all-MiniLM-L6-v2")
    gemini_api_key: str = os.getenv("GEMINI_API_KEY", "")
    gemini_model: str = os.getenv("GEMINI_MODEL", "gemini-3.8-flash")
    backend_api_url: str = os.getenv("BACKEND_API_URL", "http://localhost:4000")
    internal_service_key: str = os.getenv("INTERNAL_SERVICE_KEY", "")
    chroma_db_dir: str = os.getenv("CHROMA_DB_DIR", "./chroma_db")
    environment: str = os.getenv("ENVIRONMENT", "development")
    dpd_pickup_window_hours: int = int(os.getenv("DPD_PICKUP_WINDOW_HOURS", 48))
    debug: bool = os.getenv("DEBUG", "false").lower() == "true"

settings = Settings()
