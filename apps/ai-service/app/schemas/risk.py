from typing import Optional
from pydantic import BaseModel, Field

class PredictiveRiskRequest(BaseModel):
    org_id: str = Field(..., description="Organization ID")
    container_id: str = Field(..., description="Container ID")
    delivery_mode: str = Field(default="DPD_CFS", description="Delivery mode: DPD_CFS, DPD_DIRECT, CFS")
    hours_since_discharge: float = Field(default=0.0, description="Hours elapsed since vessel discharge")
    free_days: int = Field(default=3, description="Carrier free demurrage days")
    is_trucker_confirmed: bool = Field(default=False, description="Whether trucker pickup is confirmed")
    customs_hold: bool = Field(default=False, description="Whether container is on customs hold")
    authoritative_potential_exposure: Optional[float] = Field(default=None, description="Authoritative exposure in INR calculated by Express financial engine")

class PredictiveRiskResponse(BaseModel):
    status: str = Field(..., description="Advisory severity status: CRITICAL, HIGH, MEDIUM, LOW")
    predicted_fallback: bool = Field(..., description="Whether DPD to CFS fallback is predicted")
    fallback_probability: float = Field(..., ge=0.0, le=1.0, description="Estimated probability of fallback (0.00 to 1.00)")
    preventable_exposure_inr: Optional[float] = Field(default=None, description="Authoritative preventable financial exposure in INR (null if not provided by financial engine)")
    explanation: str = Field(..., description="Advisory deterministic explanation of risk factors")
