from unittest.mock import patch, MagicMock
from app.main import app
from app.config import settings
from app.schemas.request import DocumentType, ExtractionRequest
from app.schemas.risk import PredictiveRiskRequest
from app.schemas.knowledge import KnowledgeQueryRequest
from app.extraction.pipeline import run_document_extraction
from app.extraction.base import validate_iso6346_container_number
from app.risk.advisory_predictor import AdvisoryDeterministicPredictor
from app.knowledge.chroma_service import ChromaKnowledgeService

def test_alias_and_canonical_endpoints():
    bl_text = """
    OCEAN BILL OF LADING
    B/L NO: MEDU192837465
    CARRIER: MEDITERRANEAN SHIPPING COMPANY
    CONTAINER NUMBER: CSQU3054383
    FREE DAYS: 7
    CFS NAME: Speedy CFS Terminal 2
    """
    res = run_document_extraction("doc-test", "dummy.pdf", DocumentType.BILL_OF_LADING, direct_text=bl_text)
    assert res.success is True
    assert res.extractedFields["containerNumber"] == "CSQU3054383"
    assert res.extractedFields["freeDays"] == 7
    assert res.extractedFields["cfsName"] == "Speedy CFS Terminal 2"
    assert res.container_valid is True
    assert res.needs_human_review is False
    assert "container_number" in res.fields
    assert res.fields["container_number"]["value"] == "CSQU3054383"

def test_iso6346_invalid_check_digit_triggers_review():
    # CSQU3054380 has an invalid check digit (valid check digit is 3)
    bl_text = """
    OCEAN BILL OF LADING
    B/L NO: MEDU192837465
    CONTAINER NUMBER: CSQU3054380
    """
    res = run_document_extraction("doc-test-invalid", "dummy.pdf", DocumentType.BILL_OF_LADING, direct_text=bl_text)
    assert res.container_valid is False
    assert res.needs_human_review is True
    assert res.confidence <= 0.65

def test_advisory_deterministic_predictor_critical_fallback():
    # Over 48h since discharge, DPD_CFS mode, not confirmed -> CRITICAL fallback
    req = PredictiveRiskRequest(
        org_id="org_mehta_123",
        container_id="cnt_msku_8294102",
        delivery_mode="DPD_CFS",
        hours_since_discharge=52.0,
        free_days=5,
        is_trucker_confirmed=False,
        authoritative_potential_exposure=45000.0
    )
    res = AdvisoryDeterministicPredictor.evaluate(req)
    assert res.status == "CRITICAL"
    assert res.predicted_fallback is True
    assert res.fallback_probability >= 0.85
    assert res.preventable_exposure_inr == 45000.0
    assert "DPD pickup window" in res.explanation
    # Verify advisoryRiskScore is NOT present in response schema
    assert not hasattr(res, "advisoryRiskScore")

def test_advisory_deterministic_predictor_confirmed_trucker():
    # Trucker confirmed -> low risk, no fallback predicted
    req = PredictiveRiskRequest(
        org_id="org_mehta_123",
        container_id="cnt_msku_8294102",
        delivery_mode="DPD_CFS",
        hours_since_discharge=20.0,
        free_days=5,
        is_trucker_confirmed=True,
        authoritative_potential_exposure=45000.0
    )
    res = AdvisoryDeterministicPredictor.evaluate(req)
    assert res.status == "LOW"
    assert res.predicted_fallback is False
    assert res.fallback_probability <= 0.10
    assert res.preventable_exposure_inr == 0.0

def test_advisory_predictor_boundaries_and_determinism():
    # Test boundary conditions across the DPD window (Rule 24)
    # Window = 48 hours
    # 1. Early Window: 12 hours (ratio 0.5, prob 0.10 + 0.5*0.20 = 0.20)
    req_12h = PredictiveRiskRequest(org_id="org_1", container_id="c1", delivery_mode="DPD_DIRECT", hours_since_discharge=12.0)
    res_12h = AdvisoryDeterministicPredictor.evaluate(req_12h)
    assert res_12h.status == "LOW"
    assert res_12h.predicted_fallback is False
    assert res_12h.fallback_probability == 0.20

    # 2. Moderate Window: 24 hours (ratio 0.0, prob 0.30)
    req_24h = PredictiveRiskRequest(org_id="org_1", container_id="c1", delivery_mode="DPD_DIRECT", hours_since_discharge=24.0)
    res_24h = AdvisoryDeterministicPredictor.evaluate(req_24h)
    assert res_24h.status == "MEDIUM"
    assert res_24h.predicted_fallback is False
    assert res_24h.fallback_probability == 0.30

    # 3. High Urgency Window: 36 hours (ratio 0.0, prob 0.60)
    req_36h = PredictiveRiskRequest(org_id="org_1", container_id="c1", delivery_mode="DPD_DIRECT", hours_since_discharge=36.0)
    res_36h = AdvisoryDeterministicPredictor.evaluate(req_36h)
    assert res_36h.status == "HIGH"
    assert res_36h.predicted_fallback is True
    assert res_36h.fallback_probability == 0.60

    # 4. Exactly at Boundary: 48 hours (excess 0, prob 0.85)
    req_48h = PredictiveRiskRequest(org_id="org_1", container_id="c1", delivery_mode="DPD_DIRECT", hours_since_discharge=48.0)
    res_48h = AdvisoryDeterministicPredictor.evaluate(req_48h)
    assert res_48h.status == "CRITICAL"
    assert res_48h.predicted_fallback is True
    assert res_48h.fallback_probability == 0.85

    # 5. Determinism: Calling repeatedly with identical input yields identical output
    res_48h_repeat = AdvisoryDeterministicPredictor.evaluate(req_48h)
    assert res_48h.fallback_probability == res_48h_repeat.fallback_probability
    assert res_48h.status == res_48h_repeat.status
    assert res_48h.explanation == res_48h_repeat.explanation

def test_financial_exposure_no_ai_calculation():
    # Rule 13: When financial exposure is missing from Express, AI returns None (null)
    # AI must NEVER invent money.
    req_no_financial = PredictiveRiskRequest(
        org_id="org_1",
        container_id="c1",
        delivery_mode="DPD_DIRECT",
        hours_since_discharge=50.0,
        authoritative_potential_exposure=None
    )
    res = AdvisoryDeterministicPredictor.evaluate(req_no_financial)
    assert res.predicted_fallback is True
    assert res.preventable_exposure_inr is None

    # When authoritative exposure is provided, it reflects that exact number
    req_with_financial = PredictiveRiskRequest(
        org_id="org_1",
        container_id="c1",
        delivery_mode="DPD_DIRECT",
        hours_since_discharge=50.0,
        authoritative_potential_exposure=36000.0
    )
    res_with_financial = AdvisoryDeterministicPredictor.evaluate(req_with_financial)
    assert res_with_financial.preventable_exposure_inr == 36000.0

def test_chromadb_multi_tenant_isolation():
    org_a = "00000000-0000-0000-0000-000000000001"
    org_b = "99999999-9999-9999-9999-999999999999"

    # Query demo collection where private rebates exist
    results_a = ChromaKnowledgeService.query("rebate tariff", org_id=org_a, n_results=5, include_demo=True)
    doc_ids_a = [r["id"] for r in results_a]

    # Org A MUST be able to see GLOBAL_PUBLIC documents
    assert any(r["metadata"]["org_id"] == "GLOBAL_PUBLIC" for r in results_a)
    # Org A MUST be able to see Org A private rebate
    assert "demo_private_apex_logistics_rebate" in doc_ids_a
    # Org A MUST NOT see Org B's private rebate (Strict Tenant Isolation)
    assert "demo_private_competitor_rebate" not in doc_ids_a

    # Org B queries tariffs
    results_b = ChromaKnowledgeService.query("rebate tariff", org_id=org_b, n_results=5, include_demo=True)
    doc_ids_b = [r["id"] for r in results_b]

    # Org B MUST NOT see Org A's private rebate
    assert "demo_private_apex_logistics_rebate" not in doc_ids_b
    # Org B CAN see Org B's private rebate
    assert "demo_private_competitor_rebate" in doc_ids_b

def test_chromadb_production_vs_demo_isolation():
    # In production, queries NEVER access knowledge_demo (Rule 18)
    org_a = "00000000-0000-0000-0000-000000000001"
    original_env = settings.environment
    try:
        settings.environment = "production"
        # Even if caller sets include_demo=True, production guard forces it to False
        prod_results = ChromaKnowledgeService.query("tariff", org_id=org_a, n_results=5, include_demo=True)
        # Production collection should only contain verified public circulars, never demo records
        for r in prod_results:
            assert r["metadata"].get("is_demo") is False
            assert r["metadata"].get("environment") == "production"
    finally:
        settings.environment = original_env

def test_gemini_graceful_fallback_when_offline():
    # Extraction must succeed seamlessly using local rule extractors even without Gemini API key
    bl_text = """
    OCEAN BILL OF LADING
    B/L NO: MEDU192837465
    CARRIER: MEDITERRANEAN SHIPPING COMPANY
    CONTAINER NUMBER: CSQU3054383
    FREE DAYS: 14
    """
    res = run_document_extraction("doc-fallback", "dummy.pdf", DocumentType.BILL_OF_LADING, direct_text=bl_text)
    assert res.success is True
    assert res.extractedFields["containerNumber"] == "CSQU3054383"
    assert res.extractedFields["freeDays"] == 14

def test_gemini_malformed_response_handling():
    # If Gemini returns malformed response, extraction falls back safely (Rule 23)
    bl_text = """
    OCEAN BILL OF LADING
    B/L NO: MEDU192837465
    CONTAINER NUMBER: CSQU3054383
    FREE DAYS: 10
    """
    with patch("app.extraction.pipeline.extract_with_gemini", return_value=None):
        res = run_document_extraction("doc-mock-fail", "dummy.pdf", DocumentType.BILL_OF_LADING, direct_text=bl_text)
        assert res.success is True
        assert res.extractedFields["containerNumber"] == "CSQU3054383"
        assert res.extractedFields["freeDays"] == 10
