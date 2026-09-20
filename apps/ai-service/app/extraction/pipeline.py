import os
import pypdf
from typing import Optional, Dict, Any
from app.schemas.request import DocumentType
from app.schemas.response import ExtractionResponse, FieldProvenance
from app.extraction.base import validate_iso6346_container_number
from app.extraction.bill_of_lading import BillOfLadingExtractor
from app.extraction.delivery_order import DeliveryOrderExtractor
from app.extraction.bill_of_entry import BillOfEntryExtractor
from app.extraction.cfs_gate_pass import CFSGatePassExtractor
from app.extraction.carrier_invoice import CarrierInvoiceExtractor
from app.extraction.gemini_client import extract_with_gemini
from app.config import settings

# Reuse the existing domain extractors
EXTRACTOR_REGISTRY = {
    DocumentType.BILL_OF_LADING: BillOfLadingExtractor(),
    DocumentType.DELIVERY_ORDER: DeliveryOrderExtractor(),
    DocumentType.BILL_OF_ENTRY: BillOfEntryExtractor(),
    DocumentType.CFS_GATE_PASS: CFSGatePassExtractor(),
    DocumentType.CARRIER_DD_INVOICE: CarrierInvoiceExtractor()
}

FIELD_KEY_MAP = {
    "containerNumber": "container_number",
    "billOfLading": "bl_number",
    "freeDays": "free_days",
    "carrier": "shipping_line",
    "cfsName": "cfs_name",
    "declaredValue": "declared_value",
    "hsCode": "hs_code"
}

def extract_text_from_pdf_or_file(file_path: str) -> str:
    if not os.path.exists(file_path):
        return ""
    
    try:
        reader = pypdf.PdfReader(file_path)
        text_parts = []
        for page in reader.pages:
            t = page.extract_text()
            if t:
                text_parts.append(t)
        full_text = "\n".join(text_parts).strip()
        if full_text:
            return full_text
    except Exception:
        pass

    try:
        with open(file_path, "r", encoding="utf-8", errors="ignore") as f:
            return f.read()
    except Exception:
        return ""

def run_document_extraction(
    document_id: str,
    file_url: str,
    document_type: DocumentType,
    direct_text: Optional[str] = None
) -> ExtractionResponse:
    text = direct_text
    if text is None:
        text = extract_text_from_pdf_or_file(file_url)

    extractor = EXTRACTOR_REGISTRY.get(document_type)
    if not extractor:
        return ExtractionResponse(
            documentId=document_id,
            extractedFields={},
            confidence=0.0,
            flaggedForReview=True,
            fieldLevelConfidence={},
            fields={},
            needs_human_review=True,
            success=False,
            container_valid=None,
            extractionVersion="1.0.0",
            modelVersion="rule_ocr_v1"
        )

    if not text.strip():
        return ExtractionResponse(
            documentId=document_id,
            extractedFields={},
            confidence=0.0,
            flaggedForReview=True,
            fieldLevelConfidence={},
            fields={},
            needs_human_review=True,
            success=True,
            container_valid=None,
            extractionVersion="1.0.0",
            modelVersion=extractor.model_version
        )

    # 1. Authoritative base extraction using existing extractors
    fields, provenance, confidence = extractor.extract(text)
    active_model = extractor.model_version

    # 2. Optional Gemini advisory enrichment when configured
    gemini_data = extract_with_gemini(text)
    if gemini_data:
        gem_model = settings.gemini_model.strip() if settings.gemini_model else "gemini-3.8-flash"
        active_model = f"{gem_model}+{extractor.model_version}"
        
        # Integrate Gemini fields if missing or to augment
        if "container_number" in gemini_data and gemini_data["container_number"].get("value"):
            g_cntr = str(gemini_data["container_number"]["value"]).replace(" ", "").upper()
            g_conf = float(gemini_data["container_number"].get("confidence", 0.90))
            if "containerNumber" not in fields:
                fields["containerNumber"] = g_cntr
                provenance["containerNumber"] = FieldProvenance(value=g_cntr, confidence=g_conf, source=gem_model)

        if "bl_number" in gemini_data and gemini_data["bl_number"].get("value"):
            g_bl = str(gemini_data["bl_number"]["value"]).strip()
            g_conf = float(gemini_data["bl_number"].get("confidence", 0.90))
            if "billOfLading" not in fields:
                fields["billOfLading"] = g_bl
                provenance["billOfLading"] = FieldProvenance(value=g_bl, confidence=g_conf, source=gem_model)

        if "free_days" in gemini_data and gemini_data["free_days"].get("value") is not None:
            try:
                g_fd = int(gemini_data["free_days"]["value"])
                g_conf = float(gemini_data["free_days"].get("confidence", 0.90))
                if "freeDays" not in fields:
                    fields["freeDays"] = g_fd
                    provenance["freeDays"] = FieldProvenance(value=g_fd, confidence=g_conf, source=gem_model)
            except (ValueError, TypeError):
                pass

        if "shipping_line" in gemini_data and gemini_data["shipping_line"].get("value"):
            g_carrier = str(gemini_data["shipping_line"]["value"]).strip()
            g_conf = float(gemini_data["shipping_line"].get("confidence", 0.90))
            if "carrier" not in fields:
                fields["carrier"] = g_carrier
                provenance["carrier"] = FieldProvenance(value=g_carrier, confidence=g_conf, source=gem_model)

        if "cfs_name" in gemini_data and gemini_data["cfs_name"].get("value"):
            g_cfs = str(gemini_data["cfs_name"]["value"]).strip()
            g_conf = float(gemini_data["cfs_name"].get("confidence", 0.88))
            if "cfsName" not in fields:
                fields["cfsName"] = g_cfs
                provenance["cfsName"] = FieldProvenance(value=g_cfs, confidence=g_conf, source=gem_model)

        # Recalculate confidence
        if provenance:
            confidence = round(sum(p.confidence for p in provenance.values()) / len(provenance), 2)

    # 3. Deterministic ISO 6346 Container Number Validation
    container_valid = None
    if "containerNumber" in fields:
        raw_cntr = str(fields["containerNumber"])
        container_valid = validate_iso6346_container_number(raw_cntr)
        if not container_valid:
            # Deterministic check failed -> reduce confidence and flag for review
            if "containerNumber" in provenance:
                provenance["containerNumber"].confidence = min(0.60, provenance["containerNumber"].confidence)
            confidence = min(0.65, confidence)

    # 4. Human Review Trigger
    requires_review = (
        confidence < 0.80
        or ("containerNumber" not in fields and document_type in [
            DocumentType.BILL_OF_LADING,
            DocumentType.DELIVERY_ORDER,
            DocumentType.CFS_GATE_PASS,
            DocumentType.CARRIER_DD_INVOICE
        ])
        or (container_valid is False)
    )

    # 5. Build FILE 1 structured fields format
    file_1_fields: Dict[str, Any] = {}
    for camel_k, prov in provenance.items():
        snake_k = FIELD_KEY_MAP.get(camel_k, camel_k)
        file_1_fields[snake_k] = {
            "value": prov.value,
            "confidence": prov.confidence
        }

    return ExtractionResponse(
        documentId=document_id,
        extractedFields=fields,
        confidence=confidence,
        flaggedForReview=requires_review,
        fieldLevelConfidence=provenance,
        fields=file_1_fields,
        needs_human_review=requires_review,
        success=True,
        container_valid=container_valid,
        extractionVersion="1.0.0",
        modelVersion=active_model
    )
