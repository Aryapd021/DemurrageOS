import re
from typing import Dict, Tuple, Any
from app.extraction.base import BaseExtractor
from app.schemas.response import FieldProvenance

class BillOfEntryExtractor(BaseExtractor):
    def extract(self, text: str) -> Tuple[Dict[str, Any], Dict[str, FieldProvenance], float]:
        fields: Dict[str, Any] = {}
        provenance: Dict[str, FieldProvenance] = {}
        confidences = []

        # 1. B/E Number
        be_match = re.search(r'(?:B\.?E\.?\s*(?:NO|NUMBER)?|BILL\s*OF\s*ENTRY\s*(?:NO|NUMBER)?)[:\s]+([0-9]{7,10})', text, re.IGNORECASE)
        if be_match:
            be_no = be_match.group(1).strip()
            fields["beNumber"] = be_no
            provenance["beNumber"] = FieldProvenance(value=be_no, confidence=0.97, source="ocr+regex")
            confidences.append(0.97)

        # 2. B/E Date
        be_date = self.extract_dates(text, r'B\.?E\.?\s*DATE|DATE')
        if be_date:
            fields["beDate"] = be_date[0]
            provenance["beDate"] = FieldProvenance(value=be_date[0], confidence=be_date[1], source="ocr+date_parser")
            confidences.append(be_date[1])

        # 3. HS Code (Standard 6 or 8 digits)
        hs_match = re.search(r'(?:CTH|HS\s*CODE|CUSTOMS\s*TARIFF\s*HEADING)[:\s]+([0-9]{4}(?:\.[0-9]{2}(?:\.[0-9]{2})?|[0-9]{2,4}))', text, re.IGNORECASE)
        if hs_match:
            raw_hs = hs_match.group(1).replace('.', '').strip()
            formatted_hs = f"{raw_hs[:4]}.{raw_hs[4:6]}" if len(raw_hs) >= 6 else raw_hs
            fields["hsCode"] = formatted_hs
            provenance["hsCode"] = FieldProvenance(value=formatted_hs, confidence=0.94, source="ocr+hs_lookup")
            confidences.append(0.94)

        # 4. Assessable / Declared Value
        val_res = self.extract_monetary_amount(text, r'ASSESSABLE\s*VALUE|TOTAL\s*INVOICE\s*VALUE|DECLARED\s*VALUE')
        if val_res:
            amount, curr, conf = val_res
            fields["declaredValue"] = amount
            fields["currency"] = curr
            provenance["declaredValue"] = FieldProvenance(value=amount, confidence=conf, source="ocr+financial_parser")
            confidences.append(conf)

        # 5. Duty Amount
        duty_res = self.extract_monetary_amount(text, r'TOTAL\s*DUTY|DUTY\s*PAYABLE|CUSTOMS\s*DUTY')
        if duty_res:
            amount, curr, conf = duty_res
            fields["dutyAmount"] = amount
            provenance["dutyAmount"] = FieldProvenance(value=amount, confidence=conf, source="ocr+financial_parser")
            confidences.append(conf)

        overall = sum(confidences) / len(confidences) if confidences else 0.0
        return fields, provenance, round(overall, 2)
