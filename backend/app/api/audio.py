import traceback
import json
import os
import re
from uuid import uuid4
from typing import Optional
from fastapi import APIRouter, UploadFile, File, Form, HTTPException, Depends
from pydantic import BaseModel
from starlette.concurrency import run_in_threadpool
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.models.case_sheet import PatientCase
from app.schemas.case_sheet import PatientCaseResponse
from app.services.transcription import transcribe_audio
from app.services.clinical_nlp import extract_clinical_entities, suggest_follow_up
from app.services.report_ocr import extract_uploaded_reports

router = APIRouter(prefix="/audio", tags=["Audio & Intake"])
REPORTS_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), "uploaded_reports")

class FollowUpRequest(BaseModel):
    question: str
    answer: str

@router.post("/follow-up")
async def follow_up_question(request: FollowUpRequest):
    question = await run_in_threadpool(suggest_follow_up, request.question, request.answer)
    return {"follow_up": question}

@router.post("/transcribe")
async def process_audio(file: UploadFile = File(...)):
    try:
        text = await transcribe_audio(file)
        return {"filename": file.filename, "transcription": text}
    except HTTPException:
        raise
    except Exception as e:
        print("Error during transcription:", traceback.format_exc())
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/intake-from-audio")
async def voice_intake_case(
    patient_name: str = Form(...),
    age: int = Form(...),
    gender: str = Form(...),
    duration: str = Form("Not specified"),
    file: Optional[UploadFile] = File(None),
    reports: Optional[list[UploadFile]] = File(None),
    answers: str = Form("[]"),
    question_answers: str = Form("[]"),
    report_names: str = Form("[]"),
    db: Session = Depends(get_db)
):
    try:
        # 1. Extract text when reports are provided; reports remain optional.
        received_report_names, report_text, report_timeline = await extract_uploaded_reports(reports)
        stored_reports = []
        os.makedirs(REPORTS_DIR, exist_ok=True)
        for report in reports or []:
            if not report.filename:
                continue
            safe_name = re.sub(r"[^A-Za-z0-9._-]", "_", os.path.basename(report.filename))
            stored_name = f"{uuid4().hex}_{safe_name}"
            with open(os.path.join(REPORTS_DIR, stored_name), "wb") as output:
                output.write(getattr(report, "_content_cache", b""))
            stored_reports.append({"name": report.filename, "stored_name": stored_name})
        try:
            answer_list = json.loads(answers)
            structured_answers = json.loads(question_answers)
            if not isinstance(structured_answers, list):
                structured_answers = []
            if stored_reports:
                stored_by_name = {stored["name"]: stored["stored_name"] for stored in stored_reports}
                report_list = [
                    {**timeline_item, "stored_name": stored_by_name[timeline_item["name"]]}
                    for timeline_item in report_timeline
                ]
            else:
                report_list = report_timeline or received_report_names or json.loads(report_names)
        except json.JSONDecodeError:
            raise HTTPException(status_code=422, detail="Answers and report names must be valid JSON.")
        def remove_arabic_script(value: str) -> str:
            return re.sub(r"[\u0600-\u06ff\u0750-\u077f\u08a0-\u08ff\ufb50-\ufdff\ufe70-\ufeff]", "", value).strip()

        answer_list = [remove_arabic_script(str(answer)) for answer in answer_list]
        structured_answers = [
            {"question": str(item.get("question", "")), "answer": remove_arabic_script(str(item.get("answer", "")))}
            for item in structured_answers
            if isinstance(item, dict) and item.get("answer")
        ]
        typed_text = "\n".join(
            f"Question {index + 1}: {answer}" for index, answer in enumerate(answer_list) if answer
        )
        spoken_text = remove_arabic_script(await transcribe_audio(file)) if file else ""
        raw_text = "\n".join(part for part in (typed_text, spoken_text) if part).strip()
        if not raw_text:
            raise HTTPException(status_code=422, detail="Please provide at least one typed or spoken answer.")
        
        # 3. Give the AI both patient answers and extracted report text.
        analysis_text = raw_text
        if report_text:
            analysis_text += (
                "\n\nMEDICAL REPORTS (OCR/TEXT), already ordered from oldest to newest. "
                "Use this chronology in the clinical summary and do not invent missing dates.\n"
                f"{report_text}"
            )
        nlp_data = await run_in_threadpool(extract_clinical_entities, analysis_text)

        # 4. Store in Database
        db_case = PatientCase(
            patient_name=patient_name,
            age=age,
            gender=gender,
            contact_number=None,
            chief_complaint_raw=raw_text,
            patient_answers=json.dumps(structured_answers, ensure_ascii=False),
            chief_complaint_structured=", ".join(nlp_data.get("symptoms", [])),
            duration=duration if duration != "Not specified" else nlp_data.get("duration", "Not specified"),
            past_history=nlp_data.get("past_history", "None"),
            known_allergies=nlp_data.get("allergies", "None"),
            medical_reports=json.dumps(report_list),
            medical_reports_text=report_text or None,
            agni_status=nlp_data.get("agni_status", "Sama (Normal)"),
            prakriti_predominance=nlp_data.get("prakriti_indicators", "General"),
            diet_lifestyle=nlp_data.get("diet_lifestyle_notes", "Standard daily routine"),
            sleep_pattern=nlp_data.get("sleep_pattern", "Samyak (Normal)"),
            soap_summary=nlp_data.get("soap_summary", ""),
            summary_english=nlp_data.get("summary_english", nlp_data.get("soap_summary", "")),
            summary_hindi=nlp_data.get("summary_hindi", "सारांश उपलब्ध नहीं है"),
            red_flags=", ".join(nlp_data.get("red_flags", [])) or "None identified"
        )
        
        db.add(db_case)
        db.commit()
        db.refresh(db_case)

        # Serialize DB record safely
        serialized_case = PatientCaseResponse.model_validate(db_case)

        return {
            "status": "success",
            "case_id": db_case.id,
            "patient_name": db_case.patient_name,
            "raw_transcription": raw_text,
            "structured_extraction": nlp_data,
            "db_record": serialized_case
        }
    except Exception as e:
        print("Error in intake-from-audio:", traceback.format_exc())
        raise HTTPException(status_code=500, detail=str(e))