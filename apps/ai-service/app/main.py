from flask import Flask, request, jsonify
from pydantic import BaseModel
import logging
import os
from datetime import datetime

app = Flask(__name__)

# Configure logging
logging.basicConfig(level=os.getenv('LOG_LEVEL', 'INFO'))
logger = logging.getLogger(__name__)


class DocumentExtractionRequest(BaseModel):
    documentId: str
    fileUrl: str
    documentType: str


@app.route('/health', methods=['GET'])
def health():
    return jsonify({'status': 'ok', 'timestamp': datetime.utcnow().isoformat()})


@app.route('/extract', methods=['POST'])
def extract_document():
    """
    Extract fields from a document using AI/ML

    This endpoint receives a document URL and returns:
    - extracted fields
    - confidence scores
    - flag for review if confidence is low
    - provenance information
    """
    try:
        data = request.json

        if not data or 'documentId' not in data or 'fileUrl' not in data:
            return jsonify({'error': 'Missing required fields'}), 400

        document_id = data.get('documentId')
        file_url = data.get('fileUrl')
        document_type = data.get('documentType', 'UNKNOWN')

        logger.info(f'Processing document extraction: {document_id}')

        # Mock extraction - in production, this would use OCR/ML models
        extracted_fields = {
            'containerNo': f'CONT{document_id[-8:]}',
            'billOfLadingNo': f'BL-{document_id[:6]}',
            'shipper': 'Sample Shipper',
            'consignee': 'Sample Consignee',
            'goodsDescription': 'Electronics Equipment',
            'weight': 15000,
            'quantity': 100,
        }

        confidence = 0.85  # Mock confidence score

        result = {
            'documentId': document_id,
            'extractedFields': extracted_fields,
            'confidence': confidence,
            'flaggedForReview': confidence < 0.75,
            'provenance': {
                'model': 'mock-model-v1',
                'modelVersion': '1.0.0',
                'promptVersion': '1.0',
                'extractionSchema': 'v1',
                'extractedAt': datetime.utcnow().isoformat(),
            },
        }

        logger.info(f'Extraction completed for document {document_id}')
        return jsonify(result), 200

    except Exception as e:
        logger.error(f'Extraction failed: {str(e)}')
        return jsonify({'error': str(e)}), 500


if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=os.getenv('FLASK_ENV') == 'development')
