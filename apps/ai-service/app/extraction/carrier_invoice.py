import re
from typing import Dict, Tuple, Any
from app.extraction.base import BaseExtractor
from app.schemas.response import FieldProvenance

class CarrierInvoiceExtractor(BaseExtractor):
    def extract(self, text: str) -> Tuple[Dict[str, Any], Dict[str, FieldProvenance], float]:
        fields: Dict[str, Any] = {}
        provenance: Dict[str, FieldProvenance] = {}
        confidences = []

        # 1. Invoice Number
        inv_match = re.search(r'(?:INVOICE\s*(?:NO|NUMBER|#)|TAX\s*INVOICE\s*(?:NO|NUMBER|#)|INV\s*NO)[:\s]+([A-Z0-9\-\/]{5,25})', text, re.IGNORECASE)
        if inv_match:
            inv_no = inv_match.group(1).strip()
            fields["invoiceNumber"] = inv_no
            provenance["invoiceNumber"] = FieldProvenance(value=inv_no, confidence=0.96, source="ocr+regex")
            confidences.append(0.96)

        # 2. Invoice Date
        inv_date = self.extract_dates(text, r'INVOICE\s*DATE|DATE')
        if inv_date:
            fields["invoiceDate"] = inv_date[0]
            provenance["invoiceDate"] = FieldProvenance(value=inv_date[0], confidence=inv_date[1], source="ocr+date_parser")
            confidences.append(inv_date[1])

        # 3. Container Number
        cntr_res = self.extract_container_numbers(text)
        if cntr_res:
            fields["containerNumber"] = cntr_res[0]
            provenance["containerNumber"] = FieldProvenance(value=cntr_res[0], confidence=cntr_res[1], source="ocr+iso6346")
            confidences.append(cntr_res[1])

        # 4. Demurrage Amount
        dem_res = self.extract_monetary_amount(text, r'DEMURRAGE\s*(?:CHARGES|AMOUNT)?')
        if dem_res:
            amount, curr, conf = dem_res
            fields["demurrageAmount"] = amount
            fields["currency"] = curr
            provenance["demurrageAmount"] = FieldProvenance(value=amount, confidence=conf, source="ocr+financial_parser")
            confidences.append(conf)

        # 5. Detention Amount
        det_res = self.extract_monetary_amount(text, r'DETENTION\s*(?:CHARGES|AMOUNT)?')
        if det_res:
            amount, curr, conf = det_res
            fields["detentionAmount"] = amount
            provenance["detentionAmount"] = FieldProvenance(value=amount, confidence=conf, source="ocr+financial_parser")
            confidences.append(conf)

        # 6. Total Amount
        tot_res = self.extract_monetary_amount(text, r'TOTAL\s*(?:AMOUNT|INVOICE\s*VALUE)?')
        if tot_res:
            amount, curr, conf = tot_res
            fields["totalAmount"] = amount
            if "currency" not in fields:
                fields["currency"] = curr
            provenance["totalAmount"] = FieldProvenance(value=amount, confidence=conf, source="ocr+financial_parser")
            confidences.append(conf)

        overall = sum(confidences) / len(confidences) if confidences else 0.0
        return fields, provenance, round(overall, 2)
