from app.main import app, health_check
from app.schemas.request import DocumentType
from app.extraction.pipeline import run_document_extraction
from app.extraction.base import validate_iso6346_container_number

def test_health():
    data = health_check()
    assert data["status"] == "ok"
    assert "model" in data

def test_iso6346_validator():
    # MSCU1234567: M(24), S(30), C(13), U(32), 1, 2, 3, 4, 5, 6
    # Let's test standard known valid containers: e.g. CSQU3054383
    assert validate_iso6346_container_number("CSQU3054383") is True
    # Wrong check digit
    assert validate_iso6346_container_number("CSQU3054380") is False
    # Invalid length
    assert validate_iso6346_container_number("CSQU30543") is False

def test_bill_of_lading_extraction():
    bl_text = """
    OCEAN BILL OF LADING
    B/L NO: MEDU192837465
    CARRIER: MEDITERRANEAN SHIPPING COMPANY
    PORT OF DISCHARGE: NHAVA SHEVA, INDIA
    CONTAINER NUMBER: CSQU3054383
    GROSS WEIGHT: 21500.00 KGS
    """
    res = run_document_extraction("doc-1", "dummy.pdf", DocumentType.BILL_OF_LADING, direct_text=bl_text)
    assert res.confidence >= 0.85
    assert res.extractedFields["containerNumber"] == "CSQU3054383"
    assert res.extractedFields["billOfLading"] == "MEDU192837465"
    assert "MEDITERRANEAN" in res.extractedFields["carrier"]
    assert res.flaggedForReview is False
    assert "containerNumber" in res.fieldLevelConfidence

def test_delivery_order_extraction():
    do_text = """
    DELIVERY ORDER
    D.O. NO: DO-2026-99182
    VALID UPTO: 24/09/2026
    CONTAINER: CSQU3054383
    CONSIGNEE: APEX IMPORTS PRIVATE LIMITED
    """
    res = run_document_extraction("doc-2", "dummy.pdf", DocumentType.DELIVERY_ORDER, direct_text=do_text)
    assert res.confidence >= 0.85
    assert res.extractedFields["doNumber"] == "DO-2026-99182"
    assert res.extractedFields["validityDate"] == "24/09/2026"
    assert res.extractedFields["containerNumber"] == "CSQU3054383"
    assert res.flaggedForReview is False

def test_bill_of_entry_extraction():
    boe_text = """
    INDIAN CUSTOMS EDI SYSTEM - BILL OF ENTRY FOR HOME CONSUMPTION
    B.E. NO: 7892145
    B.E. DATE: 18-09-2026
    CUSTOMS TARIFF HEADING: 8471.30.10
    ASSESSABLE VALUE: INR 4500000.00
    TOTAL DUTY: INR 810000.00
    """
    res = run_document_extraction("doc-3", "dummy.pdf", DocumentType.BILL_OF_ENTRY, direct_text=boe_text)
    assert res.confidence >= 0.85
    assert res.extractedFields["beNumber"] == "7892145"
    assert res.extractedFields["hsCode"] == "8471.30"
    assert res.extractedFields["declaredValue"] == 4500000.0
    assert res.extractedFields["dutyAmount"] == 810000.0

def test_cfs_gate_pass_extraction():
    gp_text = """
    CONTAINER FREIGHT STATION - GATE PASS
    GP NO: GP-NS-4491
    CONTAINER: CSQU3054383
    GATE OUT DATE: 19/09/2026
    VEHICLE NO: MH04AB1234
    """
    res = run_document_extraction("doc-4", "dummy.pdf", DocumentType.CFS_GATE_PASS, direct_text=gp_text)
    assert res.confidence >= 0.85
    assert res.extractedFields["gatePassNumber"] == "GP-NS-4491"
    assert res.extractedFields["containerNumber"] == "CSQU3054383"
    assert res.extractedFields["truckNumber"] == "MH04AB1234"

def test_carrier_invoice_extraction():
    inv_text = """
    MAERSK INDIA PVT LTD - TAX INVOICE
    INVOICE NO: INV-2026-8812
    INVOICE DATE: 18/09/2026
    CONTAINER: CSQU3054383
    DEMURRAGE AMOUNT: INR 45000.00
    DETENTION AMOUNT: INR 15000.00
    TOTAL AMOUNT: INR 60000.00
    """
    res = run_document_extraction("doc-5", "dummy.pdf", DocumentType.CARRIER_DD_INVOICE, direct_text=inv_text)
    assert res.confidence >= 0.85
    assert res.extractedFields["invoiceNumber"] == "INV-2026-8812"
    assert res.extractedFields["demurrageAmount"] == 45000.0
    assert res.extractedFields["detentionAmount"] == 15000.0
    assert res.extractedFields["totalAmount"] == 60000.0

def test_missing_container_flags_review():
    # Document with missing container number should be flagged for review
    incomplete_text = """
    OCEAN BILL OF LADING
    B/L NO: MEDU192837465
    CARRIER: MSC
    """
    res = run_document_extraction("doc-6", "dummy.pdf", DocumentType.BILL_OF_LADING, direct_text=incomplete_text)
    assert res.flaggedForReview is True

def test_empty_document():
    res = run_document_extraction("doc-7", "nonexistent.pdf", DocumentType.BILL_OF_LADING, direct_text="")
    assert res.confidence == 0.0
    assert res.flaggedForReview is True
    assert res.extractedFields == {}
