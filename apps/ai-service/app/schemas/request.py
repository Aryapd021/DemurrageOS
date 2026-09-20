from enum import Enum
from pydantic import BaseModel, Field

class DocumentType(str, Enum):
    BILL_OF_LADING = "BILL_OF_LADING"
    DELIVERY_ORDER = "DELIVERY_ORDER"
    BILL_OF_ENTRY = "BILL_OF_ENTRY"
    CFS_GATE_PASS = "CFS_GATE_PASS"
    CARRIER_DD_INVOICE = "CARRIER_DD_INVOICE"

class ExtractionRequest(BaseModel):
    documentId: str = Field(..., description="Unique document ID in DemurrageOS")
    fileUrl: str = Field(..., description="File path or URL to the document (PDF or image)")
    documentType: DocumentType = Field(..., description="Standardized document type")
