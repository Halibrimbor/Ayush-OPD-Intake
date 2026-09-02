import io
import os
import re
from datetime import date
from typing import Any, Optional

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


def _find_report_date(text: str, filename: str) -> tuple[Optional[str], str]:
    """Find the earliest usable date, preferring dates printed in the report."""
    candidates = re.findall(
        r"\b(20\d{2}[-_/.]\d{1,2}[-_/.]\d{1,2}|\d{1,2}[-_/.]\d{1,2}[-_/.]20\d{2}|20\d{2})\b",
        text,
    )
    source = "report"
    if not candidates:
        candidates = re.findall(r"(?<!\d)20\d{2}(?:[-_/.]\d{1,2})?(?!\d)", filename)
        source = "filename"
    if not candidates:
        return None, "unknown"

    for candidate in candidates:
        parts = re.split(r"[-_/.]", candidate)
        try:
            if len(parts) == 1:
                parsed = date(int(parts[0]), 1, 1)
            elif len(parts) == 2 and len(parts[0]) == 4:
                parsed = date(int(parts[0]), int(parts[1]), 1)
            elif len(parts[0]) == 4:
                parsed = date(int(parts[0]), int(parts[1]), int(parts[2]))
            else:
                parsed = date(int(parts[2]), int(parts[1]), int(parts[0]))
            return parsed.isoformat(), source
        except ValueError:
            continue
    return None, "unknown"


async def extract_uploaded_reports(
    reports: Optional[list[UploadFile]],
) -> tuple[list[str], str, list[dict[str, Any]]]:
    names: list[str] = []
    report_details: list[dict[str, Any]] = []
    for upload_index, report in enumerate(reports or []):
        if not report.filename:
            continue
        names.append(report.filename)
        text = await extract_report_text(report)
        report_date, date_source = _find_report_date(text, report.filename)
        report_details.append({
            "name": report.filename,
            "report_date": report_date,
            "date_source": date_source,
            "upload_index": upload_index,
        })
        if text:
            report_details[-1]["text"] = text

    report_details.sort(
        key=lambda item: (
            item["report_date"] is None,
            item["report_date"] or "",
            item["upload_index"],
        )
    )
    sections = [
        f"Report date: {item['report_date'] or 'Unknown date'}\n"
        f"Report: {item['name']}\n{item['text']}"
        for item in report_details
        if item.get("text")
    ]
    for item in report_details:
        item.pop("text", None)
        item.pop("upload_index", None)
    return names, "\n\n".join(sections), report_details
