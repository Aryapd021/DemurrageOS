import re
from abc import ABC, abstractmethod
from typing import Dict, Tuple, Optional, Any
from app.schemas.response import FieldProvenance

# ISO 6346 container number validation
LETTER_MAP = {
    'A': 10, 'B': 12, 'C': 13, 'D': 14, 'E': 15, 'F': 16, 'G': 17, 'H': 18, 'I': 19,
    'J': 20, 'K': 21, 'L': 23, 'M': 24, 'N': 25, 'O': 26, 'P': 27, 'Q': 28, 'R': 29,
    'S': 30, 'T': 31, 'U': 32, 'V': 34, 'W': 35, 'X': 36, 'Y': 37, 'Z': 38
}

def validate_iso6346_container_number(number: str) -> bool:
    clean = re.sub(r'[^A-Za-z0-9]', '', number).upper()
    if len(clean) != 11:
        return False
    if not clean[:4].isalpha() or not clean[4:].isdigit():
        return False
    
    total = 0
    for idx in range(10):
        char = clean[idx]
        val = LETTER_MAP.get(char, int(char) if char.isdigit() else 0)
        total += val * (2 ** idx)
    
    check_digit = (total % 11) % 10
    return check_digit == int(clean[10])

class BaseExtractor(ABC):
    def __init__(self, model_version: str = "rule_ocr_v1"):
        self.model_version = model_version

    @abstractmethod
    def extract(self, text: str) -> Tuple[Dict[str, Any], Dict[str, FieldProvenance], float]:
        """
        Returns:
            extracted_fields: Dict[str, Any]
            provenance: Dict[str, FieldProvenance]
            overall_confidence: float
        """
        pass

    def extract_container_numbers(self, text: str) -> Optional[Tuple[str, float]]:
        # Match pattern 4 letters followed by 7 digits (with optional hyphen/space)
        matches = re.findall(r'\b([A-Z]{4}[-\s]?\d{7})\b', text)
        for match in matches:
            cleaned = re.sub(r'[-\s]', '', match).upper()
            is_valid = validate_iso6346_container_number(cleaned)
            return (cleaned, 0.98 if is_valid else 0.70)
        return None

    def extract_dates(self, text: str, keyword: str) -> Optional[Tuple[str, float]]:
        # Pattern: keyword followed by date in formats like YYYY-MM-DD, DD/MM/YYYY, DD-Mon-YYYY
        pattern = rf'(?:{keyword})[:\s]+(\d{{1,2}}[-/]\d{{1,2}}[-/]\d{{2,4}}|\d{{4}}[-/]\d{{1,2}}[-/]\d{{1,2}})'
        match = re.search(pattern, text, re.IGNORECASE)
        if match:
            return (match.group(1).strip(), 0.90)
        return None

    def extract_monetary_amount(self, text: str, keyword: str) -> Optional[Tuple[float, str, float]]:
        # Find amounts near currency symbols or words
        pattern = rf'(?:{keyword})[:\s]+(?:(INR|USD|EUR|Rs\.?|₹)\s*)?([0-9,]+(?:\.\d{{2}})?)\b'
        match = re.search(pattern, text, re.IGNORECASE)
        if match:
            currency = match.group(1) or "INR"
            if currency in ["Rs", "Rs.", "₹"]:
                currency = "INR"
            raw_amount = match.group(2).replace(',', '')
            try:
                return (float(raw_amount), currency, 0.92)
            except ValueError:
                return None
        return None

    def extract_free_days(self, text: str) -> Optional[Tuple[int, float]]:
        pattern = r'(?:FREE\s*(?:DAYS|TIME|PERIOD)|DEMURRAGE\s*FREE\s*DAYS)[:\s]+(\d+)\s*(?:DAYS)?'
        match = re.search(pattern, text, re.IGNORECASE)
        if match:
            try:
                return (int(match.group(1)), 0.91)
            except ValueError:
                return None
        return None

    def extract_shipping_line(self, text: str) -> Optional[Tuple[str, float]]:
        pattern = r'(?:SHIPPING\s*LINE|CARRIER|VESSEL\s*OPERATOR)[:\s]+([A-Za-z0-9\s,\.\-]{3,40})'
        match = re.search(pattern, text, re.IGNORECASE)
        if match:
            return (match.group(1).strip(), 0.93)
        return None

    def extract_cfs_name(self, text: str) -> Optional[Tuple[str, float]]:
        pattern = r'(?:CFS\s*(?:NAME)?|CONTAINER\s*FREIGHT\s*STATION|DESTINATION\s*CFS)[:\s]+([A-Za-z0-9\s,\.\-]{3,40})'
        match = re.search(pattern, text, re.IGNORECASE)
        if match:
            return (match.group(1).strip(), 0.90)
        return None

    def extract_bl_number(self, text: str) -> Optional[Tuple[str, float]]:
        pattern = r'(?:B/L\s*(?:NO|NUMBER)?|BILL\s*OF\s*LADING\s*(?:NO|NUMBER)?)[:\s]+([A-Z0-9\-\/]{6,25})'
        match = re.search(pattern, text, re.IGNORECASE)
        if match:
            return (match.group(1).strip(), 0.95)
        return None

