import re
from typing import Dict, Tuple, Any
from app.extraction.base import BaseExtractor
from app.schemas.response import FieldProvenance

class CFSGatePassExtractor(BaseExtractor):
    def extract(self, text: str) -> Tuple[Dict[str, Any], Dict[str, FieldProvenance], float]:
        fields: Dict[str, Any] = {}
        provenance: Dict[str, FieldProvenance] = {}
        confidences = []

        # 1. Gate Pass Number
        gp_match = re.search(r'(?:GATE\s*PASS\s*(?:NO|NUMBER)?|GP\s*NO)[:\s]+([A-Z0-9\-\/]{4,20})', text, re.IGNORECASE)
        if gp_match:
            gp_no = gp_match.group(1).strip()
            fields["gatePassNumber"] = gp_no
            provenance["gatePassNumber"] = FieldProvenance(value=gp_no, confidence=0.96, source="ocr+regex")
            confidences.append(0.96)

        # 2. Container Number
        cntr_res = self.extract_container_numbers(text)
        if cntr_res:
            fields["containerNumber"] = cntr_res[0]
            provenance["containerNumber"] = FieldProvenance(value=cntr_res[0], confidence=cntr_res[1], source="ocr+iso6346")
            confidences.append(cntr_res[1])

        # 3. Gate Out / Movement Date
        date_res = self.extract_dates(text, r'GATE\s*OUT\s*DATE|OUT\s*TIME|DATE|TIME')
        if date_res:
            fields["gateDate"] = date_res[0]
            provenance["gateDate"] = FieldProvenance(value=date_res[0], confidence=date_res[1], source="ocr+date_parser")
            confidences.append(date_res[1])

        # 4. Vehicle / Truck Number
        veh_match = re.search(r'(?:VEHICLE\s*NO|TRUCK\s*NO|LORRY\s*NO)[:\s]+([A-Z]{2}[-\s]?[0-9]{1,2}[-\s]?[A-Z]{1,3}[-\s]?[0-9]{4})', text, re.IGNORECASE)
        if veh_match:
            veh_no = re.sub(r'\s+', '', veh_match.group(1)).upper()
            fields["truckNumber"] = veh_no
            provenance["truckNumber"] = FieldProvenance(value=veh_no, confidence=0.92, source="ocr+regex")
            confidences.append(0.92)

        overall = sum(confidences) / len(confidences) if confidences else 0.0
        return fields, provenance, round(overall, 2)
