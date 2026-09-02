from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import inspect, text
from app.core.config import settings
from app.core.database import engine, Base
from app.api import cases, audio

# Auto-create tables in SQLite
Base.metadata.create_all(bind=engine)

if "patient_cases" in inspect(engine).get_table_names():
    existing_columns = {
        column["name"] for column in inspect(engine).get_columns("patient_cases")
    }
    with engine.begin() as connection:
        for column_name in ("soap_summary", "summary_english", "summary_hindi", "red_flags", "medical_reports", "medical_reports_text", "patient_answers"):
            if column_name not in existing_columns:
                connection.execute(text(f"ALTER TABLE patient_cases ADD COLUMN {column_name} TEXT"))

app = FastAPI(title=settings.PROJECT_NAME)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(cases.router)
app.include_router(audio.router)

@app.get("/")
def health_check():
    return {"status": "active", "system": settings.PROJECT_NAME}