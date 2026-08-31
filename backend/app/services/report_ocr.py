import io
import os
from typing import Optional

from fastapi import UploadFile
from starlette.concurrency import run_in_threadpool


def _extract_pdf_text(content: bytes) -> str:
    try:
        from pypdf import PdfReader

        reader = PdfReader(io.BytesIO(content))
        return "\n".join(page.extract_text() or "" for page in reader.pages).strip()
    except Exception as error:
        print(f"PDF text extraction unavailable: {error}")
        return ""


def _extract_image_text(content: bytes, filename: str) -> str:
    try:
        from PIL import Image
        import pytesseract

        if os.name == "nt" and not os.environ.get("TESSERACT_CMD"):
            windows_path = r"C:\Program Files\Tesseract-OCR\tesseract.exe"
            if os.path.exists(windows_path):
                pytesseract.pytesseract.tesseract_cmd = windows_path
        elif os.environ.get("TESSERACT_CMD"):
            pytesseract.pytesseract.tesseract_cmd = os.environ["TESSERACT_CMD"]

        image = Image.open(io.BytesIO(content))
        return pytesseract.image_to_string(image).strip()
    except Exception as error:
        print(f"Image OCR unavailable for {filename}: {error}")
        return ""


async def extract_report_text(report: UploadFile) -> str:
    content = await report.read()
    report._content_cache = content
    filename = (report.filename or "report").lower()
    if not content:
        return ""
    if filename.endswith(".pdf"):
        return await run_in_threadpool(_extract_pdf_text, content)
    if filename.endswith((".jpg", ".jpeg", ".png", ".webp", ".bmp", ".tiff")):
        return await run_in_threadpool(_extract_image_text, content, report.filename or "report")
    return ""


async def extract_uploaded_reports(reports: Optional[list[UploadFile]]) -> tuple[list[str], str]:
    names: list[str] = []
    sections: list[str] = []
    for report in reports or []:
        if not report.filename:
            continue
        names.append(report.filename)
        text = await extract_report_text(report)
        if text:
            sections.append(f"Report: {report.filename}\n{text}")
    return names, "\n\n".join(sections)
