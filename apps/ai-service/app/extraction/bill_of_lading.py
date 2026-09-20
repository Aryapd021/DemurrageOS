import re
from typing import Dict, Tuple, Any
from app.extraction.base import BaseExtractor
from app.schemas.response import FieldProvenance

class BillOfLadingExtractor(BaseExtractor):
    def extract(self, text: str) -> Tuple[Dict[str, Any], Dict[str, FieldProvenance], float]:
        fields: Dict[str, Any] = {}
        provenance: Dict[str, FieldProvenance] = {}
        confidences = []

        # 1. Container Number
        cntr_res = self.extract_container_numbers(text)
        if cntr_res:
            fields["containerNumber"] = cntr_res[0]
            provenance["containerNumber"] = FieldProvenance(value=cntr_res[0], confidence=cntr_res[1], source="ocr+iso6346")
            confidences.append(cntr_res[1])
        else:
            confidences.append(0.3)

        # 2. Bill of Lading Number
        bl_match = re.search(r'(?:B/L\s*(?:NO|NUMBER)?|BILL\s*OF\s*LADING\s*(?:NO|NUMBER)?)[:\s]+([A-Z0-9\-\/]{6,25})', text, re.IGNORECASE)
        if bl_match:
            bl_no = bl_match.group(1).strip()
            fields["billOfLading"] = bl_no
            provenance["billOfLading"] = FieldProvenance(value=bl_no, confidence=0.95, source="ocr+regex")
            confidences.append(0.95)

        # 3. Carrier Name
        carrier_match = re.search(r'(?:CARRIER|SHIPPING\s*LINE|VESSEL\s*OPERATOR)[:\s]+([A-Za-z0-9\s,\.\-]{3,40})', text, re.IGNORECASE)
        if carrier_match:
            carrier = carrier_match.group(1).strip()
            fields["carrier"] = carrier
            provenance["carrier"] = FieldProvenance(value=carrier, confidence=0.88, source="ocr+pattern")
            confidences.append(0.88)

        # 4. Port of Discharge
        pod_match = re.search(r'(?:PORT\s*OF\s*DISCHARGE|POD)[:\s]+([A-Za-z\s,\.\-]{3,30})', text, re.IGNORECASE)
        if pod_match:
            pod = pod_match.group(1).strip()
            fields["portOfDischarge"] = pod
            provenance["portOfDischarge"] = FieldProvenance(value=pod, confidence=0.85, source="ocr+pattern")
            confidences.append(0.85)

        # 5. Gross Weight
        weight_match = re.search(r'(?:GROSS\s*WEIGHT|GW)[:\s]+([0-9,\.]+)\s*(KGS?|MTS?)?', text, re.IGNORECASE)
        if weight_match:
            weight = float(weight_match.group(1).replace(',', ''))
            unit = weight_match.group(2) or "KGS"
            fields["grossWeight"] = f"{weight} {unit}"
            provenance["grossWeight"] = FieldProvenance(value=fields["grossWeight"], confidence=0.87, source="ocr+regex")
            confidences.append(0.87)

        # 6. Free Days
        free_days_res = self.extract_free_days(text)
        if free_days_res:
            fields["freeDays"] = free_days_res[0]
            provenance["freeDays"] = FieldProvenance(value=free_days_res[0], confidence=free_days_res[1], source="ocr+regex")
            confidences.append(free_days_res[1])

        # 7. CFS Name
        cfs_res = self.extract_cfs_name(text)
        if cfs_res:
            fields["cfsName"] = cfs_res[0]
            provenance["cfsName"] = FieldProvenance(value=cfs_res[0], confidence=cfs_res[1], source="ocr+regex")
            confidences.append(cfs_res[1])

        overall = sum(confidences) / len(confidences) if confidences else 0.0
        return fields, provenance, round(overall, 2)

