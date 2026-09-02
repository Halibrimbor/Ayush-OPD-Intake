"use client";

import { ChangeEvent, useEffect, useRef, useState } from "react";
import axios from "axios";
import Image from "next/image";
import { AlertTriangle, ArrowUpDown, CheckCircle2, CircleStop, Clock3, FileAudio, FileText, HeartPulse, Languages, Leaf, LockKeyhole, LogOut, Mic, Printer, RefreshCw, Search, ShieldAlert, Stethoscope, Trash2, Upload, UserRound, Volume2 } from "lucide-react";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://127.0.0.1:8000";
const QUESTIONS = {
  en: [
    "What medical conditions or illnesses do you currently have or have had in the past?",
    "Are you currently taking any medications, including prescription drugs, over-the-counter medicines, or supplements?",
    "Have you ever been hospitalized or undergone any major surgeries or medical procedures?",
    "Do you have any known allergies to medications, foods, or other substances?",
    "Have you ever had any significant illnesses, injuries, or medical problems that required treatment in the past?",
  ],
  hi: [
    "आपको अभी या पहले कौन-कौन सी बीमारियाँ या स्वास्थ्य समस्याएँ रही हैं?",
    "क्या आप अभी कोई दवा, डॉक्टर की पर्ची वाली दवा, बिना पर्ची की दवा या सप्लीमेंट ले रहे हैं?",
    "क्या आपको कभी अस्पताल में भर्ती होना पड़ा है या कोई बड़ी सर्जरी या चिकित्सा प्रक्रिया हुई है?",
    "क्या आपको किसी दवा, भोजन या अन्य पदार्थ से कोई ज्ञात एलर्जी है?",
    "क्या आपको पहले कभी कोई गंभीर बीमारी, चोट या ऐसी स्वास्थ्य समस्या हुई है जिसके लिए इलाज की आवश्यकता पड़ी हो?",
  ],
  bn: [
    "আপনার বর্তমানে বা আগে কোন রোগ বা স্বাস্থ্য সমস্যা ছিল?",
    "আপনি কি বর্তমানে কোনো ওষুধ বা সাপ্লিমেন্ট খান?",
    "আপনাকে কি কখনও হাসপাতালে ভর্তি হতে হয়েছে বা বড় অস্ত্রোপচার হয়েছে?",
    "কোনো ওষুধ, খাবার বা অন্য কিছুর প্রতি কি আপনার অ্যালার্জি আছে?",
    "চিকিৎসার প্রয়োজন হয়েছিল এমন কোনো গুরুতর অসুস্থতা বা আঘাত কি আগে হয়েছিল?",
  ],
  mr: [
    "तुम्हाला सध्या किंवा पूर्वी कोणते आजार किंवा आरोग्य समस्या होत्या?",
    "तुम्ही सध्या कोणती औषधे किंवा सप्लिमेंट्स घेता का?",
    "तुम्हाला कधी रुग्णालयात दाखल व्हावे लागले किंवा मोठी शस्त्रक्रिया झाली का?",
    "तुम्हाला औषध, अन्न किंवा इतर कोणत्याही गोष्टीची ऍलर्जी आहे का?",
    "उपचारांची गरज पडलेला कोणता गंभीर आजार, दुखापत किंवा समस्या पूर्वी झाली आहे का?",
  ],
  ta: [
    "உங்களுக்கு தற்போது அல்லது முன்பு இருந்த நோய்கள் அல்லது உடல்நலப் பிரச்சினைகள் என்ன?",
    "நீங்கள் தற்போது ஏதேனும் மருந்துகள் அல்லது சத்து மாத்திரைகள் எடுத்துக்கொள்கிறீர்களா?",
    "நீங்கள் எப்போதாவது மருத்துவமனையில் அனுமதிக்கப்பட்டதா அல்லது பெரிய அறுவை சிகிச்சை செய்துகொண்டீர்களா?",
    "மருந்து, உணவு அல்லது வேறு ஏதேனும் பொருளுக்கு ஒவ்வாமை உள்ளதா?",
    "சிகிச்சை தேவைப்பட்ட தீவிர நோய், காயம் அல்லது பிரச்சினை முன்பு இருந்ததா?",
  ],
  te: [
    "మీకు ప్రస్తుతం లేదా గతంలో ఉన్న వ్యాధులు లేదా ఆరోగ్య సమస్యలు ఏమిటి?",
    "మీరు ప్రస్తుతం ఏదైనా మందులు లేదా సప్లిమెంట్లు తీసుకుంటున్నారా?",
    "మీరు ఎప్పుడైనా ఆసుపత్రిలో చేరారా లేదా పెద్ద శస్త్రచికిత్స చేయించుకున్నారా?",
    "మందులు, ఆహారం లేదా ఇతర పదార్థాలపై మీకు అలర్జీ ఉందా?",
    "చికిత్స అవసరమైన తీవ్రమైన అనారోగ్యం, గాయం లేదా సమస్య గతంలో ఉందా?",
  ],
  gu: [
    "તમને હાલમાં અથવા અગાઉ કયા રોગો કે સ્વાસ્થ્ય સમસ્યાઓ થઈ હતી?",
    "શું તમે હાલમાં કોઈ દવા અથવા સપ્લિમેન્ટ લો છો?",
    "શું તમને ક્યારેય હોસ્પિટલમાં દાખલ થવું પડ્યું છે અથવા મોટી સર્જરી થઈ છે?",
    "શું તમને કોઈ દવા, ખોરાક અથવા અન્ય વસ્તુથી એલર્જી છે?",
    "શું અગાઉ એવી ગંભીર બીમારી, ઈજા અથવા સમસ્યા થઈ હતી જેના માટે સારવાર જરૂરી હતી?",
  ],
  kn: [
    "ನಿಮಗೆ ಈಗ ಅಥವಾ ಹಿಂದೆ ಯಾವ ಕಾಯಿಲೆಗಳು ಅಥವಾ ಆರೋಗ್ಯ ಸಮಸ್ಯೆಗಳು ಇದ್ದವು?",
    "ನೀವು ಈಗ ಯಾವುದಾದರೂ ಔಷಧಿ ಅಥವಾ ಪೂರಕಗಳನ್ನು ತೆಗೆದುಕೊಳ್ಳುತ್ತಿದ್ದೀರಾ?",
    "ನೀವು ಎಂದಾದರೂ ಆಸ್ಪತ್ರೆಗೆ ದಾಖಲಾಗಿದ್ದೀರಾ ಅಥವಾ ದೊಡ್ಡ ಶಸ್ತ್ರಚಿಕಿತ್ಸೆ ಮಾಡಿಸಿಕೊಂಡಿದ್ದೀರಾ?",
    "ಔಷಧಿ, ಆಹಾರ ಅಥವಾ ಇತರ ವಸ್ತುಗಳಿಗೆ ನಿಮಗೆ ಅಲರ್ಜಿ ಇದೆಯೇ?",
    "ಚಿಕಿತ್ಸೆಯ ಅಗತ್ಯವಿದ್ದ ಗಂಭೀರ ಕಾಯಿಲೆ, ಗಾಯ ಅಥವಾ ಸಮಸ್ಯೆ ಹಿಂದೆ ಇತ್ತೇ?",
  ],
  ml: [
    "നിങ്ങൾക്ക് ഇപ്പോഴോ മുമ്പെയോ ഉണ്ടായ രോഗങ്ങളും ആരോഗ്യ പ്രശ്നങ്ങളും എന്തൊക്കെയാണ്?",
    "നിങ്ങൾ ഇപ്പോൾ ഏതെങ്കിലും മരുന്നുകളോ സപ്ലിമെന്റുകളോ കഴിക്കുന്നുണ്ടോ?",
    "നിങ്ങളെ എപ്പോഴെങ്കിലും ആശുപത്രിയിൽ പ്രവേശിപ്പിച്ചിട്ടുണ്ടോ അല്ലെങ്കിൽ വലിയ ശസ്ത്രചികിത്സ നടത്തിയിട്ടുണ്ടോ?",
    "മരുന്ന്, ഭക്ഷണം അല്ലെങ്കിൽ മറ്റേതെങ്കിലും വസ്തുവിനോട് അലർജി ഉണ്ടോ?",
    "ചികിത്സ ആവശ്യമായ ഗുരുതര രോഗമോ പരിക്കോ പ്രശ്നമോ മുമ്പ് ഉണ്ടായിട്ടുണ്ടോ?",
  ],
  pa: [
    "ਤੁਹਾਨੂੰ ਹੁਣ ਜਾਂ ਪਹਿਲਾਂ ਕਿਹੜੀਆਂ ਬਿਮਾਰੀਆਂ ਜਾਂ ਸਿਹਤ ਸਮੱਸਿਆਵਾਂ ਰਹੀਆਂ ਹਨ?",
    "ਕੀ ਤੁਸੀਂ ਇਸ ਵੇਲੇ ਕੋਈ ਦਵਾਈ ਜਾਂ ਸਪਲੀਮੈਂਟ ਲੈਂਦੇ ਹੋ?",
    "ਕੀ ਤੁਹਾਨੂੰ ਕਦੇ ਹਸਪਤਾਲ ਵਿੱਚ ਦਾਖਲ ਹੋਣਾ ਪਿਆ ਜਾਂ ਵੱਡੀ ਸਰਜਰੀ ਹੋਈ ਹੈ?",
    "ਕੀ ਤੁਹਾਨੂੰ ਕਿਸੇ ਦਵਾਈ, ਭੋਜਨ ਜਾਂ ਹੋਰ ਚੀਜ਼ ਤੋਂ ਐਲਰਜੀ ਹੈ?",
    "ਕੀ ਪਹਿਲਾਂ ਕੋਈ ਗੰਭੀਰ ਬਿਮਾਰੀ, ਸੱਟ ਜਾਂ ਸਮੱਸਿਆ ਹੋਈ ਹੈ ਜਿਸ ਲਈ ਇਲਾਜ ਚਾਹੀਦਾ ਸੀ?",
  ],
};
type Language = keyof typeof QUESTIONS;
const LANGUAGE_OPTIONS: { code: Language; label: string; speechCode: string }[] = [
  { code: "en", label: "English", speechCode: "en-IN" }, { code: "hi", label: "हिंदी", speechCode: "hi-IN" },
  { code: "bn", label: "বাংলা", speechCode: "bn-IN" }, { code: "mr", label: "मराठी", speechCode: "mr-IN" },
  { code: "ta", label: "தமிழ்", speechCode: "ta-IN" }, { code: "te", label: "తెలుగు", speechCode: "te-IN" },
  { code: "gu", label: "ગુજરાતી", speechCode: "gu-IN" }, { code: "kn", label: "ಕನ್ನಡ", speechCode: "kn-IN" },
  { code: "ml", label: "മലയാളം", speechCode: "ml-IN" }, { code: "pa", label: "ਪੰਜਾਬੀ", speechCode: "pa-IN" },
];
const getSpeechCode = (selectedLanguage: Language) => LANGUAGE_OPTIONS.find((item) => item.code === selectedLanguage)?.speechCode ?? "en-IN";

type SpeechRecognitionLike = {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  onresult: ((event: { resultIndex: number; results: SpeechRecognitionResultList }) => void) | null;
  onerror: (() => void) | null;
  start: () => void;
  stop: () => void;
};
type SpeechRecognitionConstructor = new () => SpeechRecognitionLike;

type CaseRecord = {
  id: number; patient_name: string; age: number; gender: string;
  chief_complaint_raw: string; chief_complaint_structured: string; duration: string;
  patient_answers?: string;
  past_history?: string; known_allergies?: string; diet_lifestyle?: string; prakriti_predominance?: string;
  agni_status: string; sleep_pattern: string; soap_summary?: string;
  summary_english?: string; summary_hindi?: string; red_flags?: string; medical_reports?: string; created_at: string;
};
type ReportTimelineItem = { name?: string; stored_name?: string; report_date?: string | null; date_source?: string };
type PatientAnswer = { question: string; answer: string };

export default function AyushOPDApp() {
  const [portal, setPortal] = useState<"patient" | "doctor">("patient");
  const [patientPhone, setPatientPhone] = useState("");
  const [patientLoggedIn, setPatientLoggedIn] = useState(false);
  const [doctorLoggedIn, setDoctorLoggedIn] = useState(false);
  const [doctorId, setDoctorId] = useState("");
  const [doctorPassword, setDoctorPassword] = useState("");
  const [loginError, setLoginError] = useState("");
  const [patientName, setPatientName] = useState("");
  const [age, setAge] = useState("");
  const [gender, setGender] = useState("Prefer not to say");
  const [duration, setDuration] = useState("Not specified");
  const [language, setLanguage] = useState<Language>("en");
  const [followUpQuestion, setFollowUpQuestion] = useState("");
  const [followUpAnswer, setFollowUpAnswer] = useState("");
  const [followUpLoading, setFollowUpLoading] = useState(false);
  const [answers, setAnswers] = useState<string[]>(Array(5).fill(""));
  const [reports, setReports] = useState<File[]>([]);
  const [questionIndex, setQuestionIndex] = useState(0);
  const [audioFile, setAudioFile] = useState<File | Blob | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [timer, setTimer] = useState(0);
  const [status, setStatus] = useState("Ready for your health story.");
  const [loading, setLoading] = useState(false);
  const [latestCase, setLatestCase] = useState<CaseRecord | null>(null);
  const [selectedSlogan, setSelectedSlogan] = useState("");
  const [cases, setCases] = useState<CaseRecord[]>([]);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const speechRef = useRef<SpeechRecognitionLike | null>(null);
  const speechBaseRef = useRef("");
  const speechFinalRef = useRef("");

  const fetchCases = async () => {
    try { setCases((await axios.get<CaseRecord[]>(`${API_URL}/cases/`)).data); }
    catch { setStatus("Doctor portal could not reach the local API."); }
  };
  const deleteCase = async (caseId: number, patientName: string) => {
    if (!window.confirm(`Delete ${patientName} from the waiting list?`)) return;
    try { await axios.delete(`${API_URL}/cases/${caseId}`); setCases((current) => current.filter((record) => record.id !== caseId)); }
    catch { setStatus("Could not delete this patient brief."); }
  };
  useEffect(() => {
    if (portal !== "doctor") return;
    const refreshTimer = window.setTimeout(() => { void fetchCases(); }, 0);
    return () => window.clearTimeout(refreshTimer);
  }, [portal]);

  const startMic = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      recorderRef.current = recorder; chunksRef.current = [];
      recorder.ondataavailable = (event) => { if (event.data.size) chunksRef.current.push(event.data); };
      recorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: "audio/webm" });
        setAudioFile(blob); setAudioUrl(URL.createObjectURL(blob));
        stream.getTracks().forEach((track) => track.stop()); setStatus("Answer ready. You can edit it or continue.");
      };
      recorder.start(); setIsRecording(true); setTimer(0);
      const speechConstructor = (window as Window & { SpeechRecognition?: SpeechRecognitionConstructor; webkitSpeechRecognition?: SpeechRecognitionConstructor }).SpeechRecognition
        ?? (window as Window & { webkitSpeechRecognition?: SpeechRecognitionConstructor }).webkitSpeechRecognition;
      if (speechConstructor) {
        const recognition = new speechConstructor();
        speechBaseRef.current = answers[questionIndex];
        speechFinalRef.current = "";
        recognition.continuous = true; recognition.interimResults = true; recognition.lang = getSpeechCode(language);
        recognition.onresult = (event) => {
          let interimTranscript = "";
          for (let index = event.resultIndex; index < event.results.length; index += 1) {
            if (event.results[index].isFinal) speechFinalRef.current += `${event.results[index][0].transcript} `;
            else interimTranscript += event.results[index][0].transcript;
          }
          const prefix = speechBaseRef.current.trim();
          const spoken = `${speechFinalRef.current}${interimTranscript}`.trim();
          updateAnswer(`${prefix}${prefix && spoken ? " " : ""}${spoken}`);
        };
        recognition.onerror = () => setStatus("Speech recognition stopped. You can continue typing in the answer box.");
        speechRef.current = recognition;
        recognition.start();
      }
      setStatus(`Listening: ${QUESTIONS[language][questionIndex]}`);
      intervalRef.current = setInterval(() => setTimer((value) => value + 1), 1000);
    } catch { setStatus("Microphone unavailable. Type your answer or choose an audio file."); }
  };
  const stopMic = () => {
    recorderRef.current?.stop(); setIsRecording(false);
    speechRef.current?.stop(); speechRef.current = null;
    if (intervalRef.current) clearInterval(intervalRef.current);
  };
  const handleAudio = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]; if (!file) return;
    setAudioFile(file); setAudioUrl(URL.createObjectURL(file)); setStatus(`Selected ${file.name}.`);
  };
  const handleReports = (event: ChangeEvent<HTMLInputElement>) => {
    const selected = Array.from(event.target.files ?? []);
    setReports((current) => [...current, ...selected].slice(0, 8));
    if (selected.length) setStatus(`${selected.length} report${selected.length === 1 ? "" : "s"} added for the doctor.`);
  };
  const removeReport = (name: string) => setReports((current) => current.filter((file) => file.name !== name));
  const updateAnswer = (value: string) => setAnswers((current) => current.map((item, index) => index === questionIndex ? value : item));
  const advanceQuestion = () => { setAudioFile(null); setAudioUrl(null); setQuestionIndex((index) => Math.min(4, index + 1)); };
  const nextQuestion = async () => {
    if (!answers[questionIndex].trim()) return;
    setFollowUpLoading(true);
    try {
      const response = await axios.post<{ follow_up?: string }>(`${API_URL}/audio/follow-up`, { question: QUESTIONS[language][questionIndex], answer: answers[questionIndex] });
      if (response.data.follow_up) { setFollowUpQuestion(response.data.follow_up); setFollowUpLoading(false); return; }
    } catch { /* Follow-up is optional when the model is unavailable. */ }
    setFollowUpLoading(false); advanceQuestion();
  };
  const continueAfterFollowUp = () => {
    if (followUpAnswer.trim()) setAnswers((current) => current.map((item, index) => index === questionIndex ? `${item} Follow-up: ${followUpAnswer.trim()}` : item));
    setFollowUpQuestion(""); setFollowUpAnswer(""); advanceQuestion();
  };
  const speakQuestion = () => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) {
      setStatus("Voice questions are not supported in this browser. You can read and answer the question below."); return;
    }
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(QUESTIONS[language][questionIndex]);
    utterance.lang = getSpeechCode(language);
    utterance.rate = 0.9;
    window.speechSynthesis.speak(utterance);
    setStatus(`Question is being read aloud in ${LANGUAGE_OPTIONS.find((item) => item.code === language)?.label ?? "English"}.`);
  };
  const loginPatient = () => {
    if (!/^\d{10}$/.test(patientPhone.replace(/\D/g, ""))) { setLoginError("Enter a valid 10-digit mobile number."); return; }
    setPatientLoggedIn(true); setLoginError("");
  };
  const loginDoctor = () => {
    if (doctorId.trim().toLowerCase() !== "doctor" || doctorPassword !== "0000") { setLoginError("Use Doctor ID doctor and password 0000 for demo access."); return; }
    setDoctorLoggedIn(true); setLoginError("");
  };
  const switchPortal = (nextPortal: "patient" | "doctor") => { setPortal(nextPortal); setLoginError(""); };
  const submit = async () => {
    if (!patientName || !age || (!answers.some(Boolean) && !audioFile)) {
      setStatus("Please add your name, age, and at least one spoken or typed answer."); return;
    }
    setLoading(true); setStatus("Preparing your answers and medical history for the doctor...");
    try {
      const form = new FormData();
      form.append("patient_name", patientName); form.append("age", age); form.append("gender", gender);
      form.append("duration", duration); form.append("answers", JSON.stringify(answers));
      form.append("question_answers", JSON.stringify(QUESTIONS[language].map((question, index) => ({ question, answer: answers[index] }))));
      form.append("report_names", JSON.stringify(reports.map((file) => file.name)));
      reports.forEach((report) => form.append("reports", report, report.name));
      if (audioFile) form.append("file", audioFile, audioFile instanceof File ? audioFile.name : "patient-answer.webm");
      const response = await axios.post<{ db_record: CaseRecord }>(`${API_URL}/audio/intake-from-audio`, form);
      setLatestCase(response.data.db_record); setStatus("Your health story was securely prepared for the doctor.");
    } catch (error) {
      const message = axios.isAxiosError(error) ? error.response?.data?.detail : null;
      setStatus(message || "Processing failed. Confirm the backend and clinical model are running.");
    } finally { setLoading(false); }
  };

  const authenticated = portal === "patient" ? patientLoggedIn : doctorLoggedIn;
  return <main className="app-shell">
    <div className="floating-slogans" aria-hidden="true"><span className="slogan-one">सुनिए · समझिए</span><span className="slogan-two">Care begins with listening</span><span className="slogan-three">आपकी बात महत्वपूर्ण है</span><span className="slogan-four">A clearer story. A better visit.</span></div>
    <header className="topbar"><div className="brand"><Image src="/nivara-logo.svg" alt="NIVARA" width={52} height={52} className="brand-logo" /><span className="brand-name">NIVARA<small>Care · Connect · Recover</small></span></div><div className="government-lockup"><Image src="/ayush-logo.svg" alt="Ministry of AYUSH" width={290} height={58} className="ayush-logo" /></div><div className="topbar-meta"><span className="live-dot" /> Secure clinical intake</div></header>
    <section className="portal-switch"><button className={portal === "patient" ? "portal-tab active" : "portal-tab"} onClick={() => switchPortal("patient")}><Mic size={17} /> Patient portal</button><button className={portal === "doctor" ? "portal-tab active" : "portal-tab"} onClick={() => switchPortal("doctor")}><Stethoscope size={17} /> Doctor portal</button></section>
    {!authenticated ? <LoginPanel portal={portal} patientPhone={patientPhone} setPatientPhone={setPatientPhone} doctorId={doctorId} setDoctorId={setDoctorId} doctorPassword={doctorPassword} setDoctorPassword={setDoctorPassword} loginPatient={loginPatient} loginDoctor={loginDoctor} loginError={loginError} /> : portal === "patient" ? <><button className="logout-button" onClick={() => setPatientLoggedIn(false)}><LogOut size={14} /> Sign out</button><PatientPortal {...{ patientName, setPatientName, age, setAge, gender, setGender, duration, setDuration, answers, reports, questionIndex, setQuestionIndex, language, setLanguage, audioUrl, isRecording, timer, startMic, stopMic, handleAudio, handleReports, removeReport, updateAnswer, nextQuestion, speakQuestion, submit, loading, status, latestCase, selectedSlogan, setSelectedSlogan, setStatus, followUpQuestion, followUpAnswer, setFollowUpAnswer, followUpLoading, continueAfterFollowUp }} /></> : <><button className="logout-button" onClick={() => setDoctorLoggedIn(false)}><LogOut size={14} /> Sign out</button><DoctorPortal cases={cases} refresh={fetchCases} deleteCase={deleteCase} /></>}
  </main>;
}

type LoginPanelProps = { portal: "patient" | "doctor"; patientPhone: string; setPatientPhone: (value: string) => void; doctorId: string; setDoctorId: (value: string) => void; doctorPassword: string; setDoctorPassword: (value: string) => void; loginPatient: () => void; loginDoctor: () => void; loginError: string };
function LoginPanel(props: LoginPanelProps) {
  return <section className="login-panel"><div className="login-mark"><LockKeyhole size={22} /></div><p className="eyebrow">NIVARA / SECURE ACCESS</p><h1>{props.portal === "patient" ? "Begin your health story" : "Doctor sign in"}</h1><p className="login-copy">{props.portal === "patient" ? "Use your mobile number to enter the patient portal." : "Access patient briefs with your clinic credentials."}</p>{props.portal === "patient" ? <label>Mobile number<input type="tel" inputMode="numeric" value={props.patientPhone} onChange={(event) => props.setPatientPhone(event.target.value.replace(/\D/g, "").slice(0, 10))} placeholder="10-digit mobile number" /></label> : <><label>Doctor ID<input value={props.doctorId} onChange={(event) => props.setDoctorId(event.target.value)} placeholder="Doctor ID" /></label><label>Password<input type="password" value={props.doctorPassword} onChange={(event) => props.setDoctorPassword(event.target.value)} placeholder="Password" /></label></>}{props.loginError && <p className="login-error">{props.loginError}</p>}<button className="login-button" onClick={props.portal === "patient" ? props.loginPatient : props.loginDoctor}><LockKeyhole size={16} /> Enter {props.portal === "patient" ? "patient portal" : "doctor portal"}</button>{props.portal === "doctor" && <p className="demo-note">Demo access: Doctor ID <strong>doctor</strong> · Password <strong>0000</strong></p>}</section>;
}

type PatientProps = {
  patientName: string; setPatientName: (value: string) => void; age: string; setAge: (value: string) => void; gender: string; setGender: (value: string) => void; duration: string; setDuration: (value: string) => void;
  answers: string[]; reports: File[]; questionIndex: number; setQuestionIndex: (value: number) => void; language: Language; setLanguage: (value: Language) => void; audioUrl: string | null; isRecording: boolean; timer: number; startMic: () => void; stopMic: () => void;
  handleAudio: (event: ChangeEvent<HTMLInputElement>) => void; handleReports: (event: ChangeEvent<HTMLInputElement>) => void; removeReport: (name: string) => void; updateAnswer: (value: string) => void; nextQuestion: () => void; speakQuestion: () => void; submit: () => void; loading: boolean; status: string; latestCase: CaseRecord | null; selectedSlogan: string; setSelectedSlogan: (value: string) => void; setStatus: (value: string) => void; followUpQuestion: string; followUpAnswer: string; setFollowUpAnswer: (value: string) => void; followUpLoading: boolean; continueAfterFollowUp: () => void;
};

function PatientPortal(props: PatientProps) {
  const setText = (setter: (value: string) => void) => (event: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => setter(event.target.value);
  const lastStep = props.questionIndex === 4;
  const question = QUESTIONS[props.language][props.questionIndex];
  const chooseSlogan = (slogan: string, message: string) => { props.setSelectedSlogan(slogan); props.setStatus(message); };
  return <div className="content-grid">
    <section className="intro-panel"><p className="eyebrow">PATIENT PORTAL / GUIDED INTAKE</p><h1 className="hero-slogans"><span>सुनिए। समझिए।</span><br /><em>Care begins with listening.</em></h1><p className="intro-copy">जन स्वास्थ्य के लिए सरल डिजिटल देखभाल।<br />Simple digital care for better health conversations.</p><p className="intro-copy">Five short steps. Answer by voice or text, attach past reports, and arrive with a clearer clinical brief.</p><div className="slogan-cloud" aria-label="Helpful starting prompts"><button className={props.selectedSlogan === "अपनी भाषा में बोलें" ? "slogan-chip selected" : "slogan-chip"} onClick={() => chooseSlogan("अपनी भाषा में बोलें", "You can answer in the language that feels natural.")}>अपनी भाषा में बोलें</button><button className={props.selectedSlogan === "Start with what hurts" ? "slogan-chip selected" : "slogan-chip"} onClick={() => chooseSlogan("Start with what hurts", "Start with the symptom that matters most to you.")}>Start with what hurts</button><button className={props.selectedSlogan === "आराम से बताइए" ? "slogan-chip selected" : "slogan-chip"} onClick={() => chooseSlogan("आराम से बताइए", "Take your time. Short answers are completely fine.")}>आराम से बताइए</button></div><div className="process-line"><span className={props.questionIndex === 0 ? "active" : "complete"}><strong>01</strong> Details</span><span className={props.questionIndex === 1 ? "active" : props.questionIndex > 1 ? "complete" : ""}><strong>02</strong> Reports</span><span className={props.questionIndex === 2 ? "active" : props.questionIndex > 2 ? "complete" : ""}><strong>03</strong> Answers</span><span className={props.questionIndex === 3 ? "active" : props.questionIndex > 3 ? "complete" : ""}><strong>04</strong> Review</span><span className={props.questionIndex === 4 ? "active" : ""}><strong>05</strong> Doctor</span></div><div className="intake-signal"><div className="signal-top"><span>INTAKE SIGNAL</span><b>LIVE</b></div><div className="signal-grid"><div><strong>{props.answers.filter(Boolean).length}<small>/05</small></strong><span>answers captured</span></div><div><strong>{props.reports.length}<small> files</small></strong><span>reports attached</span></div><div><strong>{String(props.questionIndex + 1).padStart(2, "0")}</strong><span>current step</span></div></div></div></section>
    <section className="work-panel"><div className="section-heading"><div><p className="eyebrow">STEP {String(props.questionIndex + 1).padStart(2, "0")} / 05</p><h2>Medical history</h2></div><label className="language-picker">Question language<select value={props.language} onChange={(event) => props.setLanguage(event.target.value as Language)}>{LANGUAGE_OPTIONS.map((option) => <option key={option.code} value={option.code}>{option.label}</option>)}</select></label></div><div className="progress-track"><span style={{ width: `${((props.questionIndex + 1) / 5) * 100}%` }} /></div>
      <div className="form-row"><label>Full name<input value={props.patientName} onChange={setText(props.setPatientName)} placeholder="Patient name" /></label><label>Age<input type="number" min="1" max="120" value={props.age} onChange={setText(props.setAge)} placeholder="Years" /></label></div>
      <div className="form-row"><label>Gender<select value={props.gender} onChange={setText(props.setGender)}><option>Prefer not to say</option><option>Female</option><option>Male</option><option>Other</option></select></label><label>Symptoms for<input value={props.duration} onChange={setText(props.setDuration)} placeholder="e.g. 3 days" /></label></div>
      <div className="question-card"><div className="question-label-row"><span className="question-number">QUESTION {String(props.questionIndex + 1).padStart(2, "0")}</span><button className="listen-button" onClick={props.speakQuestion}><Volume2 size={15} /> Listen</button></div><p>{question}</p><textarea value={props.answers[props.questionIndex]} onChange={(event) => props.updateAnswer(event.target.value)} placeholder={props.language === "hi" ? "अपना उत्तर यहाँ लिखें या नीचे बोलें..." : "Type your answer here, or use your voice below..."} rows={3} />{props.followUpQuestion && <div className="follow-up-card"><span className="eyebrow">NIVARA FOLLOW-UP</span><p>{props.followUpQuestion}</p><textarea value={props.followUpAnswer} onChange={(event) => props.setFollowUpAnswer(event.target.value)} placeholder="Add a short clarification, or leave blank to skip..." rows={2} /><button className="follow-up-button" onClick={props.continueAfterFollowUp}>Continue <span>→</span></button></div>}<div className="question-actions"><button className="text-button" onClick={() => props.setQuestionIndex(Math.max(0, props.questionIndex - 1))} disabled={props.questionIndex === 0}>Back</button><button className="text-button" onClick={props.nextQuestion} disabled={lastStep || props.followUpLoading}>{props.followUpLoading ? "Checking..." : "Next question"}</button></div></div>
      <div className="record-box"><div className={props.isRecording ? "record-orb recording" : "record-orb"}>{props.isRecording ? <CircleStop size={20} /> : <Mic size={20} />}</div><div><strong>{props.isRecording ? `Listening · 0:${String(props.timer).padStart(2, "0")}` : "Prefer to speak?"}</strong><span>{props.isRecording ? "Tap stop when you are done." : "A short answer is enough."}</span></div><button className={props.isRecording ? "stop-button" : "record-button"} onClick={props.isRecording ? props.stopMic : props.startMic}>{props.isRecording ? "Stop" : "Record"}</button></div>
      {props.audioUrl && <audio className="audio-preview" controls src={props.audioUrl} />}
      <div className="reports-box"><div><FileText size={20} /><div><strong>Verify old medical reports <small>(optional)</small></strong><span>Upload PDFs, prescriptions, lab results, or report photos. The AI will read them with your answers.</span></div></div><label className="upload-button"><Upload size={15} /> {props.reports.length ? `${props.reports.length} report${props.reports.length === 1 ? "" : "s"} selected` : "Add PDF or reports"}<input type="file" multiple accept=".pdf,.jpg,.jpeg,.png,.webp" onChange={props.handleReports} /></label>{props.reports.length > 0 && <div className="report-list">{props.reports.map((file) => <span key={file.name}><FileText size={13} />{file.name}<button type="button" onClick={() => props.removeReport(file.name)} aria-label={`Remove ${file.name}`}>×</button></span>)}</div>}</div>
      <label className="file-picker"><FileAudio size={17} /> Choose an existing audio answer<input type="file" accept="audio/*" onChange={props.handleAudio} /></label><div className="status-line"><CheckCircle2 size={15} className="status-icon" />{props.loading ? "Preparing brief..." : props.status}</div><div className="privacy-strip"><span className="privacy-dot" /> Your answers stay private and are shared only with your doctor.</div><button className="submit-button" onClick={props.submit} disabled={props.loading}><span>{lastStep ? "Send to doctor" : "Save my answers"}</span><span>→</span></button>{props.latestCase && <SummaryCard caseRecord={props.latestCase} />}
    </section>
  </div>;
}

function SummaryCard({ caseRecord }: { caseRecord: CaseRecord }) { return <section className="result-card"><div className="result-heading"><div><p className="eyebrow">READY FOR DOCTOR</p><h2>Your clinical brief</h2></div><Languages size={22} /></div><div className="summary-columns"><div><span className="language-label">ENGLISH</span><p>{caseRecord.summary_english || caseRecord.soap_summary}</p></div><div lang="hi"><span className="language-label">हिंदी</span><p>{caseRecord.summary_hindi || "सारांश उपलब्ध नहीं है"}</p></div></div></section>; }
function parseReportTimeline(value?: string): ReportTimelineItem[] {
  try {
    const parsed: unknown = value ? JSON.parse(value) : [];
    return Array.isArray(parsed) && parsed.every((item) => typeof item === "object" && item !== null) ? parsed as ReportTimelineItem[] : [];
  } catch { return []; }
}
function cleanDisplayedAnswer(value: string): string {
  return value.replace(/[\u0600-\u06ff\u0750-\u077f\u08a0-\u08ff\ufb50-\ufdff\ufe70-\ufeff]/g, "").replace(/\s+/g, " ").trim();
}
function parsePatientAnswers(record: CaseRecord): PatientAnswer[] {
  try {
    const parsed: unknown = record.patient_answers ? JSON.parse(record.patient_answers) : [];
    if (Array.isArray(parsed)) {
      const answers = parsed.filter((item): item is PatientAnswer => typeof item === "object" && item !== null && typeof item.question === "string" && typeof item.answer === "string").map((item) => ({ ...item, answer: cleanDisplayedAnswer(item.answer) })).filter((item) => item.answer);
      if (answers.length) return answers;
    }
  } catch { /* Use legacy records below. */ }
  return Array.from(record.chief_complaint_raw.matchAll(/Question\s+(\d+):\s*([\s\S]*?)(?=\s*Question\s+\d+:|$)/gi), (match) => ({ question: QUESTIONS.en[Number(match[1]) - 1] || `Patient answer ${match[1]}`, answer: cleanDisplayedAnswer(match[2]) })).filter((item) => item.answer);
}
function AyurvedicCareNotes({ record }: { record: CaseRecord }) {
  const notes = [
    record.agni_status && `Agni: ${record.agni_status}. Review appetite and digestion before advising dietary changes.`,
    record.sleep_pattern && `Sleep: ${record.sleep_pattern}. Discuss a consistent sleep and rest routine during consultation.`,
    record.diet_lifestyle && `Diet and lifestyle: ${record.diet_lifestyle}. Correlate reported triggers with symptoms before making recommendations.`,
    record.prakriti_predominance && `Prakriti indicators: ${record.prakriti_predominance}. Confirm constitution clinically; this is not a diagnosis.`,
  ].filter(Boolean) as string[];
  return <div className="ayurvedic-notes"><div className="ayurvedic-heading"><Leaf size={16} /> AYURVEDIC CARE NOTES <span>physician review</span></div>{notes.map((note) => <p key={note}>{note}</p>)}</div>;
}
function DoctorPortal({ cases, refresh, deleteCase }: { cases: CaseRecord[]; refresh: () => void; deleteCase: (caseId: number, patientName: string) => void }) {
  const [searchTerm, setSearchTerm] = useState("");
  const [redFlagsOnly, setRedFlagsOnly] = useState(false);
  const [sortOrder, setSortOrder] = useState<"newest" | "oldest">("newest");
  const visibleCases = [...cases].filter((record) => {
    const searchable = `${record.patient_name} ${record.chief_complaint_structured} ${record.duration}`.toLowerCase();
    const hasRedFlags = Boolean(record.red_flags && record.red_flags !== "None identified");
    return searchable.includes(searchTerm.toLowerCase()) && (!redFlagsOnly || hasRedFlags);
  }).sort((first, second) => sortOrder === "newest" ? second.id - first.id : first.id - second.id);
  return <div className="doctor-view"><div className="doctor-header"><div><p className="eyebrow">DOCTOR PORTAL / CLINICAL QUEUE</p><h1>Patient briefs</h1><p>Structured intake summaries, ready for review.</p></div><button className="refresh-button" onClick={refresh}><RefreshCw size={16} /> Refresh queue</button></div><div className="queue-toolbar"><label className="queue-search"><Search size={16} /><span className="sr-only">Search patient briefs</span><input value={searchTerm} onChange={(event) => setSearchTerm(event.target.value)} placeholder="Search patients or symptoms" /></label><button className={redFlagsOnly ? "filter-button active" : "filter-button"} onClick={() => setRedFlagsOnly((value) => !value)}><ShieldAlert size={15} /> Red flags only</button><button className="filter-button" onClick={() => setSortOrder((value) => value === "newest" ? "oldest" : "newest")}><ArrowUpDown size={15} /> {sortOrder === "newest" ? "Newest first" : "Oldest first"}</button></div><div className="queue-meta"><span>{visibleCases.length} of {cases.length} briefs shown</span><span>{cases.filter((record) => record.red_flags && record.red_flags !== "None identified").length} need review</span></div>{cases.length === 0 ? <div className="empty-state"><Stethoscope size={32} /><h2>No patient briefs yet</h2><p>Completed patient intakes will appear here.</p></div> : visibleCases.length === 0 ? <div className="empty-state"><Search size={32} /><h2>No matching briefs</h2><p>Try another patient name, symptom, or filter.</p></div> : <div className="case-list">{visibleCases.map((record) => {
    const hasRedFlags = record.red_flags && record.red_flags !== "None identified";
    const reportNames = parseReportTimeline(record.medical_reports);
    const patientAnswers = parsePatientAnswers(record);
    return <article className="case-card" key={record.id}><div className="case-top"><div><span className="case-id">CASE #{record.id}</span><h2>{record.patient_name}</h2><p>{record.age} years | {record.gender} | Symptoms for {record.duration}</p></div><div className="case-actions"><span className="case-date">{new Date(record.created_at).toLocaleDateString()}</span><button className="icon-button" title="Print patient brief" aria-label={`Print ${record.patient_name} brief`} onClick={() => window.print()}><Printer size={15} /></button><button className="icon-button danger" title="Delete patient brief" aria-label={`Delete ${record.patient_name} brief`} onClick={() => void deleteCase(record.id, record.patient_name)}><Trash2 size={15} /></button></div></div>
      <div className="doctor-summary"><div className="summary-title"><HeartPulse size={18} /><div><span className="language-label">CLINICAL SUMMARY</span><p>{record.summary_english || record.soap_summary || "Summary pending"}</p></div></div><div className="hindi-summary" lang="hi"><span className="language-label">हिंदी सारांश</span><p>{record.summary_hindi || "सारांश उपलब्ध नहीं है"}</p></div></div>
      <div className="structured-heading"><span className="eyebrow">STRUCTURED ASSESSMENT</span><span className={hasRedFlags ? "alert-badge" : "clear-badge"}>{hasRedFlags ? <AlertTriangle size={13} /> : <CheckCircle2 size={13} />}{hasRedFlags ? "Review red flags" : "No red flags"}</span></div>
      <div className="assessment-group"><div className="group-title"><HeartPulse size={15} /> PRESENTING CONCERN</div><div className="structured-grid"><div className="clinical-field wide"><strong>Symptoms identified</strong><span>{record.chief_complaint_structured || "Not specified"}</span></div><div className="clinical-field"><strong>Duration</strong><span>{record.duration || "Not specified"}</span></div></div></div><div className="assessment-group"><div className="group-title">PATIENT CONTEXT</div><div className="structured-grid"><div className="clinical-field"><strong>Past history</strong><span>{record.past_history || "None reported"}</span></div><div className="clinical-field"><strong>Allergies</strong><span>{record.known_allergies || "No known allergies"}</span></div><div className="clinical-field"><strong>Sleep</strong><span>{record.sleep_pattern || "Not reported"}</span></div><div className="clinical-field wide"><strong>Diet and lifestyle</strong><span>{record.diet_lifestyle || "Not reported"}</span></div></div></div><div className="assessment-group ayurveda-group"><div className="group-title"><Leaf size={15} /> AYURVEDIC OBSERVATIONS</div><div className="structured-grid"><div className="clinical-field"><strong>Agni status</strong><span>{record.agni_status || "Not assessed"}</span></div><div className="clinical-field"><strong>Prakriti indicators</strong><span>{record.prakriti_predominance || "Not assessed"}</span></div></div></div><div className={hasRedFlags ? "clinical-field wide red-flag" : "clinical-field wide red-flag clear-red-flag"}><strong><ShieldAlert size={14} /> Red flags</strong><span>{record.red_flags || "None identified"}</span></div><AyurvedicCareNotes record={record} />
      <details open><summary><UserRound size={14} /> Patient answers and reports</summary>{patientAnswers.length > 0 && <div className="patient-answers"><div className="answers-heading">PATIENT ANSWERS</div>{patientAnswers.map((answer, index) => <div className="answer-item" key={`${record.id}-answer-${index}`}><span className="answer-number">{String(index + 1).padStart(2, "0")}</span><div><strong>{answer.question}</strong><p>{answer.answer}</p></div></div>)}</div>}{reportNames.length > 0 && <div className="report-timeline"><div className="timeline-heading"><Clock3 size={15} /> REPORT TIMELINE <span>oldest to newest</span></div>{reportNames.map((report) => <div className="timeline-item" key={`${report.name}-${report.report_date}`}><span className="timeline-date">{report.report_date ? new Date(`${report.report_date}T00:00:00`).toLocaleDateString() : "Date not found"}</span>{report.stored_name ? <a className="report-read-link" href={`${API_URL}/cases/${record.id}/reports/${report.stored_name}`} target="_blank" rel="noreferrer"><FileText size={14} /> {report.name || "Read uploaded report"}</a> : <span>{report.name || "Uploaded report"}</span>}</div>)}</div>}</details></article>;
  })}</div>}</div>;
}
