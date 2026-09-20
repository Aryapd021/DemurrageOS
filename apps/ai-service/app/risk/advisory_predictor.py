import logging
from typing import Optional
from app.config import settings
from app.schemas.risk import PredictiveRiskRequest, PredictiveRiskResponse

logger = logging.getLogger(__name__)

class AdvisoryDeterministicPredictor:
    """
    AdvisoryDeterministicPredictor provides advisory, rule-based operational forecasts
    for container clearance under Direct Port Delivery (DPD - CBIC Circular 16/2016).
    
    IMPORTANT ARCHITECTURAL INVARIANTS:
    1. This is an advisory deterministic heuristic model, NOT machine learning.
    2. The authoritative operational risk score (0-100) and severity remain 100%
       computed by the Express DeterministicRiskEngine.
    3. The AI service NEVER calculates or fabricates independent financial charges.
       Preventable financial exposure (INR) is passed from the authoritative Express
       financial engine (Prisma tariffs); if not provided, it is returned as None (null).
    4. Exact fallback probability is derived deterministically from the configured
       DPD pickup window (settings.dpd_pickup_window_hours), elapsed hours post-discharge,
       customs hold status, and transporter dispatch confirmation.
    """

    @staticmethod
    def evaluate(req: PredictiveRiskRequest) -> PredictiveRiskResponse:
        hours = req.hours_since_discharge
        mode = req.delivery_mode.upper()
        confirmed = req.is_trucker_confirmed
        hold = req.customs_hold
        w = float(settings.dpd_pickup_window_hours)  # Configured DPD window, default 48.0h

        # Case 1: Customs Hold Active
        # Under Indian customs law, cargo on hold cannot legally gate-out.
        # Direct port clearance is blocked, so evacuation to CFS is inevitable.
        if hold:
            return PredictiveRiskResponse(
                status="CRITICAL",
                predicted_fallback=True,
                fallback_probability=1.00,
                preventable_exposure_inr=req.authoritative_potential_exposure,
                explanation=(
                    "Container is under active customs hold at the port terminal. "
                    "Port removal is legally blocked; mandatory fallback to CFS is inevitable "
                    "unless customs clearance is completed immediately."
                )
            )

        # Case 2: Standard CFS Mode (Container pre-routed to CFS directly)
        # Containers booked as CFS Direct do not undergo DPD gate-out deadlines.
        if mode not in ["DPD_CFS", "DPD_DIRECT"]:
            return PredictiveRiskResponse(
                status="LOW",
                predicted_fallback=False,
                fallback_probability=0.00,
                preventable_exposure_inr=0.0 if req.authoritative_potential_exposure is not None else None,
                explanation=(
                    f"Container is routed via standard CFS mode ({hours:.1f} hrs elapsed). "
                    "DPD terminal evacuation deadline does not apply."
                )
            )

        # Case 3: Transporter Dispatch Confirmed
        # A transporter has accepted the pickup task and scheduled gate-out within allowable window.
        if confirmed:
            return PredictiveRiskResponse(
                status="LOW",
                predicted_fallback=False,
                fallback_probability=0.05,
                preventable_exposure_inr=0.0 if req.authoritative_potential_exposure is not None else None,
                explanation=(
                    f"Transporter dispatch is confirmed for container ({hours:.1f} hrs elapsed). "
                    "Scheduled gate-out is coordinated within the allowable DPD window."
                )
            )

        # Case 4: Unconfirmed Transporter in DPD mode -> Deterministic Window Evaluation
        # Window W = settings.dpd_pickup_window_hours (e.g. 48 hours).
        # We model four operational stages:
        #   A. Expired (hours >= W): Window fully elapsed without confirmation.
        #      Probability scales from 0.85 up to 1.00 based on excess hours over W.
        #   B. High Urgency (0.75*W <= hours < W, e.g. 36h-48h):
        #      Last quarter of window remaining. Probability ranges from 0.60 to 0.85.
        #   C. Moderate Window (0.50*W <= hours < 0.75*W, e.g. 24h-36h):
        #      Half window elapsed without confirmation. Probability ranges from 0.30 to 0.60.
        #   D. Early Window (hours < 0.50*W, e.g. 0h-24h):
        #      Early staging. Probability ranges from 0.10 to 0.30.

        if hours >= w:
            predicted_fallback = True
            excess = hours - w
            # Scales linearly from 0.85 at W to 1.00 at W + 24 hours
            fallback_probability = min(1.00, 0.85 + (excess / 24.0) * 0.15)
            status = "CRITICAL"
            explanation = (
                f"DPD pickup window of {w:.0f} hours has expired ({hours:.1f} hrs elapsed) "
                "without transporter dispatch confirmation. Terminal operator is entitled to initiate "
                "en-bloc evacuation to an off-dock CFS."
            )
        elif hours >= 0.75 * w:
            predicted_fallback = True
            ratio = (hours - 0.75 * w) / (0.25 * w)
            fallback_probability = 0.60 + ratio * 0.25
            status = "HIGH"
            remaining = w - hours
            explanation = (
                f"Approaching DPD {w:.0f}-hour deadline ({hours:.1f} hrs elapsed, {remaining:.1f} hrs remaining). "
                "Transporter dispatch has not been confirmed. Immediate carrier release required."
            )
        elif hours >= 0.50 * w:
            predicted_fallback = False
            ratio = (hours - 0.50 * w) / (0.25 * w)
            fallback_probability = 0.30 + ratio * 0.30
            status = "MEDIUM"
            remaining = w - hours
            explanation = (
                f"Over half of allowable DPD window elapsed ({hours:.1f} hrs elapsed, {remaining:.1f} hrs remaining). "
                "Transporter assignment is pending."
            )
        else:
            predicted_fallback = False
            ratio = max(0.0, hours) / (0.50 * w)
            fallback_probability = 0.10 + ratio * 0.20
            status = "LOW"
            remaining = w - hours
            explanation = (
                f"Within normal DPD staging window ({hours:.1f} hrs elapsed, {remaining:.1f} hrs remaining). "
                "Transporter assignment pending."
            )

        # Preventable exposure INR is ONLY returned if authoritative exposure was provided
        preventable_exposure = (
            req.authoritative_potential_exposure
            if predicted_fallback
            else (0.0 if req.authoritative_potential_exposure is not None else None)
        )

        return PredictiveRiskResponse(
            status=status,
            predicted_fallback=predicted_fallback,
            fallback_probability=round(fallback_probability, 2),
            preventable_exposure_inr=preventable_exposure,
            explanation=explanation
        )
