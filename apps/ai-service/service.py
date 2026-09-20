import json
import logging
from http.server import HTTPServer, BaseHTTPRequestHandler
import sys

logging.basicConfig(level=logging.INFO, format='{"time": "%(asctime)s", "level": "%(levelname)s", "msg": "%(message)s"}')
logger = logging.getLogger("ai-service")

PORT = 8000

class AIServiceHandler(BaseHTTPRequestHandler):
    def _set_headers(self, status=200):
        self.send_response(status)
        self.send_header('Content-Type', 'application/json')
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        self.end_headers()

    def do_OPTIONS(self):
        self._set_headers(204)

    def do_GET(self):
        if self.path == '/health':
            self._set_headers(200)
            self.wfile.write(json.dumps({
                "status": "healthy",
                "service": "demurrageos-ai-service",
                "version": "1.0.0"
            }).encode('utf-8'))
        else:
            self._set_headers(404)
            self.wfile.write(json.dumps({"error": "Not Found"}).encode('utf-8'))

    def do_POST(self):
        content_length = int(self.headers.get('Content-Length', 0))
        body = self.rfile.read(content_length).decode('utf-8') if content_length > 0 else '{}'
        try:
            data = json.loads(body)
        except Exception:
            data = {}

        if self.path == '/api/extract':
            file_name = data.get('fileName', 'document.pdf')
            logger.info(f"Received document extraction request for {file_name}")
            
            # Advisory extraction simulation (Human review mandatory before authoritative write)
            extraction_result = {
                "success": True,
                "confidence": 0.95,
                "documentType": "BILL_OF_LADING",
                "fields": {
                    "blNumber": "MSKU-MUM-984321",
                    "shipper": "Bosch Automotive Components Stuttgart GmbH",
                    "consignee": "Tata Motors Commercial Vehicles Ltd",
                    "declaredWeightKg": 22400,
                    "hsCode": "8471.30",
                    "commodityDescription": "Automotive Engine Sensors & Microcontrollers",
                    "portOfLoading": "DEHAM (Hamburg)",
                    "portOfDischarge": "INNSA (Nhava Sheva)"
                },
                "reviewFlag": False,
                "provenance": {
                    "model": "ocr-doc-parser-v2.1",
                    "extractionTimestamp": "2026-09-19T18:30:00Z"
                }
            }
            self._set_headers(200)
            self.wfile.write(json.dumps(extraction_result).encode('utf-8'))

        elif self.path == '/api/signals/evaluate':
            container_number = data.get('containerNumber', 'UNKNOWN')
            logger.info(f"Evaluating advisory signals for {container_number}")
            signals_result = {
                "success": True,
                "signals": [
                    {
                        "signalType": "HS_CODE_NOVELTY",
                        "scoreImpact": 12,
                        "advisoryNote": "HS code 8471.30 has not been imported under this IEC in last 180 days."
                    }
                ]
            }
            self._set_headers(200)
            self.wfile.write(json.dumps(signals_result).encode('utf-8'))
        else:
            self._set_headers(404)
            self.wfile.write(json.dumps({"error": "Not Found"}).encode('utf-8'))

    def log_message(self, format, *args):
        # Override default server logging
        return

if __name__ == '__main__':
    server = HTTPServer(('0.0.0.0', PORT), AIServiceHandler)
    logger.info(f"DemurrageOS AI Advisory Service running at http://0.0.0.0:{PORT}")
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        pass
    server.server_close()
