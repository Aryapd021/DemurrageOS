# DemurrageOS — AI Engine & Differentiation Layer Guide
> **Assigned to:** Hari (AI Engine Lead)  
> **Service:** `apps/ai-service` (Python + FastAPI + Google Gemini 1.5 + LangChain + ChromaDB)  
> **Date:** September 2024  
> **Reference Plan:** `AI & Differentiation Layer Plan` in Master Plan

---

## 📌 Executive Summary
Hari, you own the **AI Engine and Predictive Differentiation Layer**. Your mission is to build the Python service that handles automated document extraction (Bills of Entry, e-Delivery Orders, Arrival Notices), computes predictive container risk scores (0-100), and maintains the vector search for port tariffs and customs circulars.

> [!IMPORTANT]
> **Architectural Law:** AI is **advisory**, never the source of truth. Express (Arya) and PostgreSQL (Dhyan) store the authoritative state. If your AI service goes offline, container tracking and basic demurrage calculations must continue working uninterrupted.

---

## 1. Account You Need to Create & API Key

### Google AI Studio (Gemini 1.5 Flash Vision & Embeddings)
1. Go to **[https://aistudio.google.com](https://aistudio.google.com)**.
2. Sign in with your Google account.
3. Click **"Get API key"** -> **"Create API key in new project"**.
4. Copy the generated key (starts with `AIzaSy...`).
5. Put it in `apps/ai-service/.env` as `GEMINI_API_KEY`.

---

## 2. Environment Configuration (`apps/ai-service/.env`)

```env
PORT=5000
ENVIRONMENT=development

# Google Gemini API Key
GEMINI_API_KEY="AIzaSyxxxxxxxxxxxxxxxxxxxxxxxxxxxx"

# Core Express API (Arya's service)
BACKEND_API_URL=http://localhost:8000

# Shared Secret for Service-to-Service Communication
INTERNAL_SERVICE_KEY="demurrageos_internal_ai_token_secret_key_991"
```

---

## 3. Python Environment & Packages

In `apps/ai-service/requirements.txt`:

```txt
fastapi>=0.110.0
uvicorn>=0.28.0
google-generativeai>=0.4.0
langchain>=0.1.0
langchain-google-genai>=0.0.8
chromadb>=0.4.22
pydantic>=2.6.0
python-multipart>=0.0.9
requests>=2.31.0
```

Install packages:
```bash
pip install -r requirements.txt
```

---

## 4. Endpoints You Must Expose (`apps/ai-service/main.py`)

### 1. Document Extraction (`POST /api/ai/extract/document`)
Extracts structured shipping fields from PDFs/images with confidence scores.

* **Target Fields:**
  - `container_number`: ISO 6346 code (e.g. `MSCU 829 4102 6`)
  - `bl_number`: Bill of Lading number
  - `free_days`: Allowed free demurrage days
  - `shipping_line`: Ocean carrier name
  - `cfs_name`: Designated Container Freight Station
* **Response Format:**
  ```json
  {
    "success": true,
    "fields": {
      "container_number": { "value": "MSCU 829 4102 6", "confidence": 0.99 },
      "bl_number": { "value": "MAEU2024118439", "confidence": 0.97 },
      "free_days": { "value": 5, "confidence": 0.91 },
      "shipping_line": { "value": "Maersk Line", "confidence": 0.96 },
      "cfs_name": { "value": "Speedy CFS Terminal 2", "confidence": 0.88 }
    },
    "needs_human_review": false
  }
  ```

---

### 2. Predictive Risk Calculation (`POST /api/ai/risk/evaluate`)
Calculates delay risk and DPD-to-CFS fallback probabilities.

* **Input:**
  ```json
  {
    "org_id": "org_mehta_123",
    "container_id": "cnt_msku_8294102",
    "delivery_mode": "DPD_CFS",
    "hours_since_discharge": 52.0,
    "free_days": 5,
    "is_trucker_confirmed": false
  }
  ```
* **Response:**
  ```json
  {
    "risk_score": 88,
    "status": "CRITICAL",
    "predicted_fallback": true,
    "fallback_probability": 0.94,
    "preventable_exposure_inr": 85000,
    "explanation": "DPD 48-hour pickup window exceeded (52 hrs elapsed) without driver dispatch confirmation. High probability of fallback to Speedy CFS."
  }
  ```

---

### 3. Tariff Query with Multi-Tenant ChromaDB (`POST /api/ai/knowledge/query`)
Allows querying port tariffs and customs circulars.

> [!CAUTION]
> Always filter by `where={"org_id": org_id}` in ChromaDB so private CHA customer rebates are never disclosed across organizations.

```python
# ChromaDB multi-tenant search
results = collection.query(
    query_texts=[user_query],
    n_results=3,
    where={
        "$or": [
            {"org_id": "GLOBAL_PUBLIC"},
            {"org_id": request.org_id}
        ]
    }
)
```

---

## 5. Hari's Checklist
- [ ] Sign up at Google AI Studio & copy `GEMINI_API_KEY`.
- [ ] Set up virtualenv in `apps/ai-service/` and install `requirements.txt`.
- [ ] Implement `POST /api/ai/extract/document` with Gemini 1.5 Flash Vision.
- [ ] Implement `POST /api/ai/risk/evaluate` using the two-clock demurrage model.
- [ ] Launch FastAPI server with `uvicorn main:app --port 5000 --reload`.
