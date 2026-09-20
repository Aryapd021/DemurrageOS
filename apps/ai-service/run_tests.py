import sys
import os

# Add apps/ai-service to sys.path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from app.tests.test_extraction import (
    test_health,
    test_iso6346_validator,
    test_bill_of_lading_extraction,
    test_delivery_order_extraction,
    test_bill_of_entry_extraction,
    test_cfs_gate_pass_extraction,
    test_carrier_invoice_extraction,
    test_missing_container_flags_review,
    test_empty_document
)
from app.tests.test_ai_features import (
    test_alias_and_canonical_endpoints,
    test_iso6346_invalid_check_digit_triggers_review,
    test_advisory_deterministic_predictor_critical_fallback,
    test_advisory_deterministic_predictor_confirmed_trucker,
    test_advisory_predictor_boundaries_and_determinism,
    test_financial_exposure_no_ai_calculation,
    test_chromadb_multi_tenant_isolation,
    test_chromadb_production_vs_demo_isolation,
    test_gemini_graceful_fallback_when_offline,
    test_gemini_malformed_response_handling
)

def main():
    print("=== Running AI Extraction Service Tests ===")
    tests = [
        ("test_health", test_health),
        ("test_iso6346_validator", test_iso6346_validator),
        ("test_bill_of_lading_extraction", test_bill_of_lading_extraction),
        ("test_delivery_order_extraction", test_delivery_order_extraction),
        ("test_bill_of_entry_extraction", test_bill_of_entry_extraction),
        ("test_cfs_gate_pass_extraction", test_cfs_gate_pass_extraction),
        ("test_carrier_invoice_extraction", test_carrier_invoice_extraction),
        ("test_missing_container_flags_review", test_missing_container_flags_review),
        ("test_empty_document", test_empty_document),
        ("test_alias_and_canonical_endpoints", test_alias_and_canonical_endpoints),
        ("test_iso6346_invalid_check_digit_triggers_review", test_iso6346_invalid_check_digit_triggers_review),
        ("test_advisory_deterministic_predictor_critical_fallback", test_advisory_deterministic_predictor_critical_fallback),
        ("test_advisory_deterministic_predictor_confirmed_trucker", test_advisory_deterministic_predictor_confirmed_trucker),
        ("test_advisory_predictor_boundaries_and_determinism", test_advisory_predictor_boundaries_and_determinism),
        ("test_financial_exposure_no_ai_calculation", test_financial_exposure_no_ai_calculation),
        ("test_chromadb_multi_tenant_isolation", test_chromadb_multi_tenant_isolation),
        ("test_chromadb_production_vs_demo_isolation", test_chromadb_production_vs_demo_isolation),
        ("test_gemini_graceful_fallback_when_offline", test_gemini_graceful_fallback_when_offline),
        ("test_gemini_malformed_response_handling", test_gemini_malformed_response_handling)
    ]


    passed = 0
    failed = 0

    for name, fn in tests:
        try:
            fn()
            print(f" PASS: {name}")
            passed += 1
        except Exception as e:
            print(f" FAIL: {name} - {str(e)}")
            failed += 1

    print(f"\nResults: {passed} passed, {failed} failed.")
    if failed > 0:
        sys.exit(1)
    else:
        print("All AI Extraction Service tests passed successfully!")

if __name__ == "__main__":
    main()
