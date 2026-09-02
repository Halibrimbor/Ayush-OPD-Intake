import os
import shutil
import tempfile
import whisper
from fastapi import UploadFile
from starlette.concurrency import run_in_threadpool

# Add the backend root directory (where ffmpeg.exe is located) to system PATH
current_dir = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
if current_dir not in os.environ["PATH"]:
    os.environ["PATH"] = current_dir + os.pathsep + os.environ["PATH"]

# Load the base model locally
def _ensure_ffmpeg_on_path() -> bool:
    if shutil.which("ffmpeg"):
        return True
    search_roots = [
        os.path.join(os.environ.get("LOCALAPPDATA", ""), "Microsoft", "WinGet", "Packages"),
        os.path.join(os.environ.get("USERPROFILE", ""), "scoop", "shims"),
    ]
    for root in search_roots:
        if not root or not os.path.isdir(root):
            continue
        for directory, _, filenames in os.walk(root):
            if "ffmpeg.exe" in (filename.lower() for filename in filenames):
                os.environ["PATH"] = directory + os.pathsep + os.environ["PATH"]
                return True
    return False


_ensure_ffmpeg_on_path()
model = whisper.load_model("base")

async def transcribe_audio(file: UploadFile) -> str:
    if not _ensure_ffmpeg_on_path():
        raise RuntimeError(
            "FFmpeg is required for audio transcription. Install FFmpeg, add it to PATH, "
            "or place ffmpeg.exe in the backend folder, then restart the backend."
        )
    suffix = os.path.splitext(file.filename)[-1] or ".mp3"
    with tempfile.NamedTemporaryFile(delete=False, suffix=suffix) as temp_audio:
        content = await file.read()
        temp_audio.write(content)
        temp_path = temp_audio.name

    try:
        result = await run_in_threadpool(model.transcribe, temp_path, fp16=False)
        return result.get("text", "").strip()
    finally:
        if os.path.exists(temp_path):
            try:
                os.remove(temp_path)
            except Exception:
                pass