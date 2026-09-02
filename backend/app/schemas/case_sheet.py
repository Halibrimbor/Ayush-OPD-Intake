from pydantic import BaseModel
from typing import Optional
from datetime import datetime

class PatientCaseBase(BaseModel):
    patient_name: str
    age: int
    gender: str
    contact_number: Optional[str] = None
    chief_complaint_raw: str
    patient_answers: Optional[str] = None
    chief_complaint_structured: Optional[str] = None
    duration: str
    past_history: Optional[str] = None
    known_allergies: Optional[str] = None
    medical_reports: Optional[str] = None
    medical_reports_text: Optional[str] = None
    agni_status: Optional[str] = None
    prakriti_predominance: Optional[str] = None
    diet_lifestyle: Optional[str] = None
    sleep_pattern: Optional[str] = None
    soap_summary: Optional[str] = None
    summary_english: Optional[str] = None
    summary_hindi: Optional[str] = None
    red_flags: Optional[str] = None

class PatientCaseCreate(PatientCaseBase):
    pass

class PatientCaseResponse(PatientCaseBase):
    id: int
    created_at: datetime

    class Config:
        from_attributes = True