import re
from typing import Dict, Tuple, Any
from app.extraction.base import BaseExtractor
from app.schemas.response import FieldProvenance

class DeliveryOrderExtractor(BaseExtractor):
    def extract(self, text: str) -> Tuple[Dict[str, Any], Dict[str, FieldProvenance], float]:
        fields: Dict[str, Any] = {}
        provenance: Dict[str, FieldProvenance] = {}
        confidences = []

        # 1. DO Number
        do_match = re.search(r'(?:D\.?O\.?\s*(?:NO|NUMBER)?|DELIVERY\s*ORDER\s*(?:NO|NUMBER)?)[:\s]+([A-Z0-9\-\/]{5,25})', text, re.IGNORECASE)
        if do_match:
            do_no = do_match.group(1).strip()
            fields["doNumber"] = do_no
            provenance["doNumber"] = FieldProvenance(value=do_no, confidence=0.96, source="ocr+regex")
            confidences.append(0.96)

        # 2. Validity Date
        val_date = self.extract_dates(text, r'VALID\s*UPTO|VALIDITY\s*DATE|EXPIRY\s*DATE|VALID\s*TILL')
        if val_date:
            fields["validityDate"] = val_date[0]
            provenance["validityDate"] = FieldProvenance(value=val_date[0], confidence=val_date[1], source="ocr+date_parser")
            confidences.append(val_date[1])

        # 3. Container Number
        cntr_res = self.extract_container_numbers(text)
        if cntr_res:
            fields["containerNumber"] = cntr_res[0]
            provenance["containerNumber"] = FieldProvenance(value=cntr_res[0], confidence=cntr_res[1], source="ocr+iso6346")
            confidences.append(cntr_res[1])

        # 4. Consignee
        consignee_match = re.search(r'(?:CONSIGNEE|DELIVER\s*TO)[:\s]+([A-Za-z0-9\s,\.\-]{3,40})', text, re.IGNORECASE)
        if consignee_match:
            consignee = consignee_match.group(1).strip()
            fields["consignee"] = consignee
            provenance["consignee"] = FieldProvenance(value=consignee, confidence=0.86, source="ocr+pattern")
            confidences.append(0.86)

        # 5. Bill of Lading Number
        bl_res = self.extract_bl_number(text)
        if bl_res:
            fields["billOfLading"] = bl_res[0]
            provenance["billOfLading"] = FieldProvenance(value=bl_res[0], confidence=bl_res[1], source="ocr+regex")
            confidences.append(bl_res[1])

        # 6. Shipping Line / Carrier
        carrier_res = self.extract_shipping_line(text)
        if carrier_res:
            fields["carrier"] = carrier_res[0]
            provenance["carrier"] = FieldProvenance(value=carrier_res[0], confidence=carrier_res[1], source="ocr+regex")
            confidences.append(carrier_res[1])

        # 7. Free Days
        free_days_res = self.extract_free_days(text)
        if free_days_res:
            fields["freeDays"] = free_days_res[0]
            provenance["freeDays"] = FieldProvenance(value=free_days_res[0], confidence=free_days_res[1], source="ocr+regex")
            confidences.append(free_days_res[1])

        # 8. CFS Name
        cfs_res = self.extract_cfs_name(text)
        if cfs_res:
            fields["cfsName"] = cfs_res[0]
            provenance["cfsName"] = FieldProvenance(value=cfs_res[0], confidence=cfs_res[1], source="ocr+regex")
            confidences.append(cfs_res[1])

        overall = sum(confidences) / len(confidences) if confidences else 0.0
        return fields, provenance, round(overall, 2)

