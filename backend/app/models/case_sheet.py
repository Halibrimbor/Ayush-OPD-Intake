from sqlalchemy import Column, Integer, String, Text, DateTime
from datetime import datetime
from app.core.database import Base

class PatientCase(Base):
    __tablename__ = "patient_cases"

    id = Column(Integer, primary_key=True, index=True)
    patient_name = Column(String, index=True)
    age = Column(Integer)
    gender = Column(String)
    contact_number = Column(String, nullable=True)
    
    # Clinical History Fields
    chief_complaint_raw = Column(Text)          # Raw transcription/patient input
    patient_answers = Column(Text, nullable=True)  # Structured question-answer pairs as JSON
    chief_complaint_structured = Column(Text)   # Standardized summary/extracted symptoms
    duration = Column(String)                   # e.g., "3 days", "2 weeks"
    past_history = Column(Text, nullable=True)  # Chronic conditions, past surgeries
    known_allergies = Column(Text, nullable=True)
    medical_reports = Column(Text, nullable=True)  # Uploaded report filenames as JSON
    medical_reports_text = Column(Text, nullable=True)  # Text extracted from uploaded reports

    # Ayush Specific Parameters
    agni_status = Column(String, nullable=True)     # Manda / Tikshna / Vishama / Sama
    prakriti_predominance = Column(String, nullable=True) # Vata / Pitta / Kapha
    diet_lifestyle = Column(Text, nullable=True)    # Ahara / Vihara notes
    sleep_pattern = Column(String, nullable=True)   # Nidra status
    soap_summary = Column(Text, nullable=True)
    summary_english = Column(Text, nullable=True)
    summary_hindi = Column(Text, nullable=True)
    red_flags = Column(Text, nullable=True)

    created_at = Column(DateTime, default=datetime.utcnow)