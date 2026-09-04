import os
import json
from urllib.error import URLError
from urllib.request import Request, urlopen
from pydantic import BaseModel, Field
from typing import Optional, List

class ExtractedClinicalData(BaseModel):
    symptoms: List[str] = Field(default_factory=list, description="Extracted symptoms with Ayurvedic/Clinical terminology")
    duration: str = Field(default="Not specified", description="Duration of symptoms")
    past_history: str = Field(default="None reported", description="Past conditions, chronic diseases")
    allergies: str = Field(default="No known drug allergies", description="Drug or food allergies")
    red_flags: List[str] = Field(default_factory=list, description="Critical warning signs like chest pain, breathlessness")
    agni_status: str = Field(default="Sama (Balanced)", description="Manda / Tikshna / Vishama / Sama")
    prakriti_indicators: str = Field(default="Balanced", description="Vata / Pitta / Kapha dominance signs")
    sleep_pattern: str = Field(default="Samyak (Normal)", description="Sleep quality, insomnia, disturbed sleep")
    diet_lifestyle_notes: str = Field(default="Standard", description="Ahara/Vihara dietary and routine notes")
    soap_summary: str = Field(default="", description="1-2 sentence doctor-ready clinical summary")
    summary_english: str = Field(default="", description="Doctor-ready summary in English")
    summary_hindi: str = Field(default="", description="Doctor-ready summary in Hindi")


def suggest_follow_up(question: str, answer: str, language: str = "English") -> Optional[str]:
    """Ask for one missing clinical detail without diagnosing or suggesting treatment."""
    if not answer.strip() or len(answer.strip()) > 180:
        return None
    prompt = f"""
You are a careful clinical intake assistant. The patient's selected language is {language}. Review this patient question and answer:
Question: {question}
Answer: {answer}
Return only JSON with one key: follow_up. The value must be either an empty string or one short,
plain-language clarification question written entirely in {language}. Ask only if a useful detail is missing (duration, severity,
frequency, medicine name, allergy detail, or relevant procedure). Ask at most one question.
Never diagnose, prescribe, or suggest treatment. Do not ask for information already provided.
"""
    provider = os.getenv("LLM_PROVIDER", "gemini").lower()
    try:
        if provider == "gemini" and os.getenv("GEMINI_API_KEY") not in (None, "", "your_actual_gemini_api_key_here"):
            from google import genai
            from google.genai import types
            response = genai.Client(api_key=os.environ["GEMINI_API_KEY"]).models.generate_content(
                model="gemini-2.5-flash", contents=prompt,
                config=types.GenerateContentConfig(response_mime_type="application/json", max_output_tokens=100),
            )
            follow_up = json.loads(response.text).get("follow_up", "").strip()
            return follow_up or None
        base_url = os.getenv("OLLAMA_URL", "http://127.0.0.1:11434").rstrip("/")
        payload = json.dumps({"model": os.getenv("OLLAMA_MODEL", "llama3.2"), "prompt": prompt, "format": "json", "stream": False, "options": {"temperature": 0.1}}).encode("utf-8")
        request = Request(f"{base_url}/api/generate", data=payload, headers={"Content-Type": "application/json"}, method="POST")
        with urlopen(request, timeout=float(os.getenv("OLLAMA_TIMEOUT", "30"))) as response:
            result = json.loads(response.read().decode("utf-8"))
        follow_up = json.loads(result["response"]).get("follow_up", "").strip()
        return follow_up or None
    except Exception as error:
        print(f"Follow-up generation unavailable: {error}")
        answer_lower = answer.lower()
        hindi = language.lower() in {"hindi", "हिंदी"}
        if "allerg" in question.lower() and "no" not in answer_lower:
            return "किस दवा, भोजन या पदार्थ से एलर्जी हुई थी और आपको क्या प्रतिक्रिया हुई?" if hindi else "Which medicine, food, or substance caused the allergy, and what reaction did you notice?"
        if "medication" in question.lower() and len(answer.split()) < 4:
            return "यदि याद हो, तो दवा का नाम और आप इसे कितनी बार लेते हैं, बताइए।" if hindi else "Please share the medicine name and how often you take it, if you remember."
        if len(answer.split()) < 3:
            return "यह कब शुरू हुआ या कितनी बार होता है, इसके बारे में थोड़ा और बताइए।" if hindi else "Could you tell us a little more about when this started or how often it happens?"
        return None


def extract_with_ollama(raw_transcript: str) -> Optional[ExtractedClinicalData]:
    base_url = os.getenv("OLLAMA_URL", "http://127.0.0.1:11434").rstrip("/")
    model = os.getenv("OLLAMA_MODEL", "llama3.2")
    prompt = f"""
You are a clinical intake assistant for an Ayurvedic OPD. Analyze this patient narrative:
\"\"\"{raw_transcript}\"\"\"
Return only valid JSON with exactly these keys: symptoms (array), duration (string),
past_history (string), allergies (string), red_flags (array), agni_status (string),
prakriti_indicators (string), sleep_pattern (string), diet_lifestyle_notes (string),
    soap_summary (one concise doctor-ready sentence), summary_english (doctor-ready summary in English),
    summary_hindi (same summary in Hindi using Devanagari). Do not diagnose or recommend treatment.
Report uncertainty clearly and use only information from the narrative.
"""
    payload = json.dumps({
        "model": model,
        "prompt": prompt,
        "format": "json",
        "stream": False,
        "keep_alive": "5m",
        "options": {"temperature": 0.1},
    }).encode("utf-8")

    try:
        request = Request(
            f"{base_url}/api/generate",
            data=payload,
            headers={"Content-Type": "application/json"},
            method="POST",
        )
        with urlopen(request, timeout=float(os.getenv("OLLAMA_TIMEOUT", "30"))) as response:
            result = json.loads(response.read().decode("utf-8"))
        return ExtractedClinicalData(**json.loads(result["response"]))
    except (OSError, URLError, KeyError, json.JSONDecodeError, ValueError) as error:
        print(f"Ollama extraction unavailable: {error}")
        return None


def extract_with_llm(raw_transcript: str) -> Optional[ExtractedClinicalData]:
    api_key = os.getenv("GEMINI_API_KEY")
    if not api_key or api_key == "your_actual_gemini_api_key_here":
        return None

    try:
        from google import genai
        from google.genai import types

        client = genai.Client(api_key=api_key)
        
        prompt = f"""
You are an expert Ayurvedic & Allopathic Clinical Assistant for an OPD in India.
Analyze the following patient narrative (which may be in Hindi, English, or Hinglish):

\"\"\"{raw_transcript}\"\"\"

Extract and structure the data into JSON matching these exact keys:
- symptoms: list of symptoms with dual Allopathic & Ayurvedic names where possible (e.g. "Fever (Jwara)")
- duration: duration mentioned by patient
- past_history: any chronic illnesses (Diabetes, Hypertension, etc.)
- allergies: any allergies mentioned
- red_flags: list of critical/urgent symptoms (chest pain, high fever, hemoptysis, breathlessness)
- agni_status: assess appetite/digestion as "Manda Agni (Sluggish)", "Tikshna Agni (Hyperactive)", "Vishama Agni (Irregular)", or "Sama Agni (Normal)"
- prakriti_indicators: physical/mental clues pointing towards Vata, Pitta, or Kapha
- sleep_pattern: sleep quality (e.g., "Anidra (Insomnia)", "Khandita (Interrupted)", "Samyak (Normal)")
- diet_lifestyle_notes: dietary triggers (spicy, oily, irregular timings, stress)
- soap_summary: a crisp doctor-ready summary for the doctor to review in 5 seconds.
- summary_english: a concise, factual summary including relevant report findings.
- summary_hindi: the same summary in simple Hindi using Devanagari.

Use only reported information. Never diagnose, prescribe, or invent missing values. Medical reports
are labeled with dates and ordered oldest to newest; summarize their findings in that same order.
Return ONLY raw valid JSON matching every field in the response schema.
"""
        response = client.models.generate_content(
            model="gemini-2.5-flash",
            contents=prompt,
            config=types.GenerateContentConfig(
                response_mime_type="application/json",
                response_schema=ExtractedClinicalData,
                max_output_tokens=600,
            )
        )
        data = json.loads(response.text)
        return ExtractedClinicalData(**data)
    except Exception as e:
        print(f"LLM Extraction failed: {e}. Falling back to heuristic extraction.")
        return None


def extract_clinical_entities(raw_transcript: str) -> dict:
    """
    Main extraction pipeline: Tries LLM first, falls back to rule-based heuristics.
    """
    provider = os.getenv("LLM_PROVIDER", "gemini").lower()
    llm_result = extract_with_llm(raw_transcript) if provider == "gemini" else extract_with_ollama(raw_transcript)
    if not llm_result:
        llm_result = extract_with_ollama(raw_transcript) if provider == "gemini" else extract_with_llm(raw_transcript)
    if llm_result:
        data = llm_result.model_dump()
        data["past_history"] = data["past_history"] or "None reported"
        data["allergies"] = data["allergies"] or "No known drug allergies"
        data["agni_status"] = data["agni_status"] or "Requires clinical assessment"
        data["prakriti_indicators"] = data["prakriti_indicators"] or "Requires physician assessment"
        data["sleep_pattern"] = data["sleep_pattern"] or "Not reported"
        data["diet_lifestyle_notes"] = data["diet_lifestyle_notes"] or "Not reported"
        data["soap_summary"] = data["soap_summary"] or data["summary_english"]
        data["summary_english"] = data["summary_english"] or data["soap_summary"]
        data["summary_hindi"] = data["summary_hindi"] or "सारांश उपलब्ध नहीं है।"
        return data

    # Fallback Heuristic
    text = raw_transcript.lower()
    symptoms = []
    red_flags = []

    symptom_map = {
        "fever": "Fever (Jwara)",
        "bukhar": "Fever (Jwara)",
        "headache": "Headache (Shiroruka)",
        "sar dard": "Headache (Shiroruka)",
        "cough": "Cough (Kasa)",
        "khasi": "Cough (Kasa)",
        "stomach pain": "Abdominal Pain (Udarashoola)",
        "pet dard": "Abdominal Pain (Udarashoola)",
        "gas": "Bloating / Flatulence (Adhmana)",
        "acidity": "Hyperacidity (Amlapitta)",
        "jalan": "Heartburn / Burning Sensation (Daha)",
        "joint pain": "Joint Pain (Sandhishoola)",
        "ghutno me dard": "Knee Pain (Janu Sandhishoola)",
        "vomiting": "Vomiting (Chhardi)",
        "ulti": "Vomiting (Chhardi)"
    }

    for key, val in symptom_map.items():
        if key in text and val not in symptoms:
            symptoms.append(val)

    red_flag_triggers = ["chest pain", "saans lene", "breathlessness", "khoon", "blood", "behoshi"]
    for rf in red_flag_triggers:
        if rf in text:
            red_flags.append(rf)

    agni = "Sama (Balanced)"
    if any(k in text for k in ["bhookh nahi", "loss of appetite", "hazam nahi"]):
        agni = "Manda Agni (Low Digestion)"
    elif any(k in text for k in ["acidity", "jalan", "zyada bhookh"]):
        agni = "Tikshna Agni (Hyperactive)"
    elif any(k in text for k in ["gas", "bloating"]):
        agni = "Vishama Agni (Irregular)"

    sleep = "Samyak (Normal)"
    if any(k in text for k in ["neend nahi", "sleepless", "insomnia"]):
        sleep = "Anidra (Disturbed)"

    return {
        "symptoms": symptoms if symptoms else ["General Clinical Evaluation"],
        "duration": "Reported during intake",
        "past_history": "None reported",
        "allergies": "No known drug allergies",
        "red_flags": red_flags,
        "agni_status": agni,
        "prakriti_indicators": "Requires physician pulse assessment",
        "sleep_pattern": sleep,
        "diet_lifestyle_notes": "Standard daily routine",
        "soap_summary": f"Patient presents with {', '.join(symptoms) if symptoms else 'unspecified symptoms'} with {agni}.",
        "summary_english": f"Patient presents with {', '.join(symptoms) if symptoms else 'unspecified symptoms'} with {agni}.",
        "summary_hindi": "रोगी में बताए गए लक्षणों के आधार पर चिकित्सकीय मूल्यांकन आवश्यक है।",
    }