import os
from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session
from typing import List
from app.core.database import get_db
from app.models.case_sheet import PatientCase
from app.schemas.case_sheet import PatientCaseCreate, PatientCaseResponse

router = APIRouter(prefix="/cases", tags=["Case Sheets"])
REPORTS_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), "uploaded_reports")

@router.post("/", response_model=PatientCaseResponse)
def create_case(case: PatientCaseCreate, db: Session = Depends(get_db)):
    db_case = PatientCase(**case.model_dump())
    db.add(db_case)
    db.commit()
    db.refresh(db_case)
    return db_case

@router.get("/", response_model=List[PatientCaseResponse])
def get_all_cases(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    return db.query(PatientCase).offset(skip).limit(limit).all()

@router.get("/{case_id}", response_model=PatientCaseResponse)
def get_case(case_id: int, db: Session = Depends(get_db)):
    case = db.query(PatientCase).filter(PatientCase.id == case_id).first()
    if not case:
        raise HTTPException(status_code=404, detail="Case sheet not found")
    return case

@router.get("/{case_id}/reports/{stored_name}")
def read_report(case_id: int, stored_name: str, db: Session = Depends(get_db)):
    case = db.query(PatientCase).filter(PatientCase.id == case_id).first()
    if not case:
        raise HTTPException(status_code=404, detail="Case sheet not found")
    report_path = os.path.abspath(os.path.join(REPORTS_DIR, stored_name))
    if os.path.dirname(report_path) != os.path.abspath(REPORTS_DIR) or not os.path.isfile(report_path):
        raise HTTPException(status_code=404, detail="Report not found")
    return FileResponse(report_path, filename=stored_name, content_disposition_type="inline")

@router.delete("/{case_id}")
def delete_case(case_id: int, db: Session = Depends(get_db)):
    case = db.query(PatientCase).filter(PatientCase.id == case_id).first()
    if not case:
        raise HTTPException(status_code=404, detail="Case sheet not found")
    db.delete(case)
    db.commit()
    return {"status": "deleted", "case_id": case_id}