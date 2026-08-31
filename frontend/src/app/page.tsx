"use client";

import { ChangeEvent, useEffect, useRef, useState } from "react";
import axios from "axios";
import { Activity, AlertTriangle, CheckCircle2, CircleStop, FileAudio, FileText, HeartPulse, Languages, Mic, RefreshCw, ShieldAlert, Stethoscope, Upload, UserRound, Volume2 } from "lucide-react";

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
};

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
  past_history?: string; known_allergies?: string; diet_lifestyle?: string; prakriti_predominance?: string;
  agni_status: string; sleep_pattern: string; soap_summary?: string;
  summary_english?: string; summary_hindi?: string; red_flags?: string; medical_reports?: string; created_at: string;
};

export default function AyushOPDApp() {
  const [portal, setPortal] = useState<"patient" | "doctor">("patient");
  const [patientName, setPatientName] = useState("");
  const [age, setAge] = useState("");
  const [gender, setGender] = useState("Prefer not to say");
  const [duration, setDuration] = useState("Not specified");
  const [language, setLanguage] = useState<"en" | "hi">("en");
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
        recognition.continuous = true; recognition.interimResults = true; recognition.lang = language === "hi" ? "hi-IN" : "en-IN";
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
  const nextQuestion = () => { setAudioFile(null); setAudioUrl(null); setQuestionIndex((index) => Math.min(4, index + 1)); };
  const speakQuestion = () => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) {
      setStatus("Voice questions are not supported in this browser. You can read and answer the question below."); return;
    }
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(QUESTIONS[language][questionIndex]);
    utterance.lang = language === "hi" ? "hi-IN" : "en-IN";
    utterance.rate = 0.9;
    window.speechSynthesis.speak(utterance);
    setStatus(language === "hi" ? "प्रश्न हिंदी में पढ़ा जा रहा है।" : "The question is being read aloud in English.");
  };
  const submit = async () => {
    if (!patientName || !age || (!answers.some(Boolean) && !audioFile)) {
      setStatus("Please add your name, age, and at least one spoken or typed answer."); return;
    }
    setLoading(true); setStatus("Preparing your answers and medical history for the doctor...");
    try {
      const form = new FormData();
      form.append("patient_name", patientName); form.append("age", age); form.append("gender", gender);
      form.append("duration", duration); form.append("answers", JSON.stringify(answers));
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

  return <main className="app-shell">
    <div className="floating-slogans" aria-hidden="true"><span className="slogan-one">सुनिए · समझिए</span><span className="slogan-two">Care begins with listening</span><span className="slogan-three">आपकी बात महत्वपूर्ण है</span><span className="slogan-four">A clearer story. A better visit.</span></div>
    <header className="topbar"><div className="brand"><span className="brand-mark"><Activity size={20} /></span><span>Ayush<span className="brand-accent">/</span>OPD</span></div><div className="government-lockup"><span className="chakra-mark">✺</span><span><strong>भारत सरकार</strong><small>Government of India</small></span></div><div className="topbar-meta"><span className="live-dot" /> Local clinical intake</div></header>
    <section className="portal-switch"><button className={portal === "patient" ? "portal-tab active" : "portal-tab"} onClick={() => setPortal("patient")}><Mic size={17} /> Patient portal</button><button className={portal === "doctor" ? "portal-tab active" : "portal-tab"} onClick={() => setPortal("doctor")}><Stethoscope size={17} /> Doctor portal</button></section>
    {portal === "patient" ? <PatientPortal {...{ patientName, setPatientName, age, setAge, gender, setGender, duration, setDuration, answers, reports, questionIndex, setQuestionIndex, language, setLanguage, audioUrl, isRecording, timer, startMic, stopMic, handleAudio, handleReports, removeReport, updateAnswer, nextQuestion, speakQuestion, submit, loading, status, latestCase, selectedSlogan, setSelectedSlogan, setStatus }} /> : <DoctorPortal cases={cases} refresh={fetchCases} />}
  </main>;
}

type PatientProps = {
  patientName: string; setPatientName: (value: string) => void; age: string; setAge: (value: string) => void; gender: string; setGender: (value: string) => void; duration: string; setDuration: (value: string) => void;
  answers: string[]; reports: File[]; questionIndex: number; setQuestionIndex: (value: number) => void; language: "en" | "hi"; setLanguage: (value: "en" | "hi") => void; audioUrl: string | null; isRecording: boolean; timer: number; startMic: () => void; stopMic: () => void;
  handleAudio: (event: ChangeEvent<HTMLInputElement>) => void; handleReports: (event: ChangeEvent<HTMLInputElement>) => void; removeReport: (name: string) => void; updateAnswer: (value: string) => void; nextQuestion: () => void; speakQuestion: () => void; submit: () => void; loading: boolean; status: string; latestCase: CaseRecord | null; selectedSlogan: string; setSelectedSlogan: (value: string) => void; setStatus: (value: string) => void;
};

function PatientPortal(props: PatientProps) {
  const setText = (setter: (value: string) => void) => (event: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => setter(event.target.value);
  const lastStep = props.questionIndex === 4;
  const question = QUESTIONS[props.language][props.questionIndex];
  const chooseSlogan = (slogan: string, message: string) => { props.setSelectedSlogan(slogan); props.setStatus(message); };
  return <div className="content-grid">
    <section className="intro-panel"><p className="eyebrow">PATIENT PORTAL / GUIDED INTAKE</p><h1 className="hero-slogans"><span>सुनिए। समझिए।</span><br /><em>Care begins with listening.</em></h1><p className="intro-copy">जन स्वास्थ्य के लिए सरल डिजिटल देखभाल।<br />Simple digital care for better health conversations.</p><p className="intro-copy">Five short steps. Answer by voice or text, attach past reports, and arrive with a clearer clinical brief.</p><div className="slogan-cloud" aria-label="Helpful starting prompts"><button className={props.selectedSlogan === "अपनी भाषा में बोलें" ? "slogan-chip selected" : "slogan-chip"} onClick={() => chooseSlogan("अपनी भाषा में बोलें", "You can answer in the language that feels natural.")}>अपनी भाषा में बोलें</button><button className={props.selectedSlogan === "Start with what hurts" ? "slogan-chip selected" : "slogan-chip"} onClick={() => chooseSlogan("Start with what hurts", "Start with the symptom that matters most to you.")}>Start with what hurts</button><button className={props.selectedSlogan === "आराम से बताइए" ? "slogan-chip selected" : "slogan-chip"} onClick={() => chooseSlogan("आराम से बताइए", "Take your time. Short answers are completely fine.")}>आराम से बताइए</button></div><div className="process-line"><span><strong>01</strong> Details</span><span><strong>02</strong> Reports</span><span><strong>03</strong> Answers</span><span><strong>04</strong> Review</span><span><strong>05</strong> Doctor</span></div></section>
    <section className="work-panel"><div className="section-heading"><div><p className="eyebrow">STEP {String(props.questionIndex + 1).padStart(2, "0")} / 05</p><h2>Medical history</h2></div><div className="language-switch" aria-label="Question language"><button className={props.language === "en" ? "language-option active" : "language-option"} onClick={() => props.setLanguage("en")}>English</button><button className={props.language === "hi" ? "language-option active" : "language-option"} onClick={() => props.setLanguage("hi")}>हिंदी</button></div></div><div className="progress-track"><span style={{ width: `${((props.questionIndex + 1) / 5) * 100}%` }} /></div>
      <div className="form-row"><label>Full name<input value={props.patientName} onChange={setText(props.setPatientName)} placeholder="Patient name" /></label><label>Age<input type="number" min="1" max="120" value={props.age} onChange={setText(props.setAge)} placeholder="Years" /></label></div>
      <div className="form-row"><label>Gender<select value={props.gender} onChange={setText(props.setGender)}><option>Prefer not to say</option><option>Female</option><option>Male</option><option>Other</option></select></label><label>Symptoms for<input value={props.duration} onChange={setText(props.setDuration)} placeholder="e.g. 3 days" /></label></div>
      <div className="question-card"><div className="question-label-row"><span className="question-number">QUESTION {String(props.questionIndex + 1).padStart(2, "0")}</span><button className="listen-button" onClick={props.speakQuestion}><Volume2 size={15} /> Listen</button></div><p>{question}</p><textarea value={props.answers[props.questionIndex]} onChange={(event) => props.updateAnswer(event.target.value)} placeholder={props.language === "hi" ? "अपना उत्तर यहाँ लिखें या नीचे बोलें..." : "Type your answer here, or use your voice below..."} rows={3} /><div className="question-actions"><button className="text-button" onClick={() => props.setQuestionIndex(Math.max(0, props.questionIndex - 1))} disabled={props.questionIndex === 0}>Back</button><button className="text-button" onClick={props.nextQuestion} disabled={lastStep}>Next question</button></div></div>
      <div className="record-box"><div className={props.isRecording ? "record-orb recording" : "record-orb"}>{props.isRecording ? <CircleStop size={20} /> : <Mic size={20} />}</div><div><strong>{props.isRecording ? `Listening · 0:${String(props.timer).padStart(2, "0")}` : "Prefer to speak?"}</strong><span>{props.isRecording ? "Tap stop when you are done." : "A short answer is enough."}</span></div><button className={props.isRecording ? "stop-button" : "record-button"} onClick={props.isRecording ? props.stopMic : props.startMic}>{props.isRecording ? "Stop" : "Record"}</button></div>
      {props.audioUrl && <audio className="audio-preview" controls src={props.audioUrl} />}
      <div className="reports-box"><div><FileText size={20} /><div><strong>Verify old medical reports <small>(optional)</small></strong><span>Upload PDFs, prescriptions, lab results, or report photos. The AI will read them with your answers.</span></div></div><label className="upload-button"><Upload size={15} /> {props.reports.length ? `${props.reports.length} report${props.reports.length === 1 ? "" : "s"} selected` : "Add PDF or reports"}<input type="file" multiple accept=".pdf,.jpg,.jpeg,.png,.webp" onChange={props.handleReports} /></label>{props.reports.length > 0 && <div className="report-list">{props.reports.map((file) => <span key={file.name}><FileText size={13} />{file.name}<button type="button" onClick={() => props.removeReport(file.name)} aria-label={`Remove ${file.name}`}>×</button></span>)}</div>}</div>
      <label className="file-picker"><FileAudio size={17} /> Choose an existing audio answer<input type="file" accept="audio/*" onChange={props.handleAudio} /></label><div className="status-line"><CheckCircle2 size={15} className="status-icon" />{props.loading ? "Preparing brief..." : props.status}</div><button className="submit-button" onClick={props.submit} disabled={props.loading}><span>{lastStep ? "Send to doctor" : "Save my answers"}</span><span>→</span></button>{props.latestCase && <SummaryCard caseRecord={props.latestCase} />}
    </section>
  </div>;
}

function SummaryCard({ caseRecord }: { caseRecord: CaseRecord }) { return <section className="result-card"><div className="result-heading"><div><p className="eyebrow">READY FOR DOCTOR</p><h2>Your clinical brief</h2></div><Languages size={22} /></div><div className="summary-columns"><div><span className="language-label">ENGLISH</span><p>{caseRecord.summary_english || caseRecord.soap_summary}</p></div><div lang="hi"><span className="language-label">हिंदी</span><p>{caseRecord.summary_hindi || "सारांश उपलब्ध नहीं है"}</p></div></div><div className="transcript"><span>TRANSCRIPT</span><p>{caseRecord.chief_complaint_raw}</p></div></section>; }
function DoctorPortal({ cases, refresh }: { cases: CaseRecord[]; refresh: () => void }) {
  return <div className="doctor-view"><div className="doctor-header"><div><p className="eyebrow">DOCTOR PORTAL / CLINICAL QUEUE</p><h1>Patient briefs</h1><p>Structured intake summaries, ready for review.</p></div><button className="refresh-button" onClick={refresh}><RefreshCw size={16} /> Refresh queue</button></div><div className="queue-meta"><span>{cases.length} patients waiting</span><span>Local processing enabled</span></div>{cases.length === 0 ? <div className="empty-state"><Stethoscope size={32} /><h2>No patient briefs yet</h2><p>Completed patient intakes will appear here.</p></div> : <div className="case-list">{cases.map((record) => {
    const hasRedFlags = record.red_flags && record.red_flags !== "None identified";
    let reportNames: { name?: string; stored_name?: string }[] = [];
    try { reportNames = record.medical_reports ? JSON.parse(record.medical_reports) : []; } catch { reportNames = []; }
    return <article className="case-card" key={record.id}><div className="case-top"><div><span className="case-id">CASE #{record.id}</span><h2>{record.patient_name}</h2><p>{record.age} years | {record.gender} | Symptoms for {record.duration}</p></div><span className="case-date">{new Date(record.created_at).toLocaleDateString()}</span></div>
      <div className="doctor-summary"><div className="summary-title"><HeartPulse size={18} /><div><span className="language-label">CLINICAL SUMMARY</span><p>{record.summary_english || record.soap_summary || "Summary pending"}</p></div></div><div className="hindi-summary" lang="hi"><span className="language-label">हिंदी सारांश</span><p>{record.summary_hindi || "सारांश उपलब्ध नहीं है"}</p></div></div>
      <div className="structured-heading"><span className="eyebrow">STRUCTURED ASSESSMENT</span><span className={hasRedFlags ? "alert-badge" : "clear-badge"}>{hasRedFlags ? <AlertTriangle size={13} /> : <CheckCircle2 size={13} />}{hasRedFlags ? "Review red flags" : "No red flags"}</span></div>
      <div className="structured-grid"><div className="clinical-field wide"><strong><HeartPulse size={14} /> Presenting symptoms</strong><span>{record.chief_complaint_structured || "Not specified"}</span></div><div className="clinical-field"><strong>Past history</strong><span>{record.past_history || "None reported"}</span></div><div className="clinical-field"><strong>Allergies</strong><span>{record.known_allergies || "No known allergies"}</span></div><div className="clinical-field"><strong>Agni</strong><span>{record.agni_status || "Not assessed"}</span></div><div className="clinical-field"><strong>Prakriti indicators</strong><span>{record.prakriti_predominance || "Not assessed"}</span></div><div className="clinical-field"><strong>Sleep</strong><span>{record.sleep_pattern || "Not reported"}</span></div><div className="clinical-field wide"><strong>Diet and lifestyle</strong><span>{record.diet_lifestyle || "Not reported"}</span></div><div className={hasRedFlags ? "clinical-field wide red-flag" : "clinical-field wide"}><strong><ShieldAlert size={14} /> Red flags</strong><span>{record.red_flags || "None identified"}</span></div></div>
      <details><summary><UserRound size={14} /> View patient answers and reports</summary><p>{record.chief_complaint_raw}</p>{reportNames.map((report) => report.stored_name && <p key={report.stored_name}><a className="report-read-link" href={`${API_URL}/cases/${record.id}/reports/${report.stored_name}`} target="_blank" rel="noreferrer"><FileText size={14} /> {report.name || "Read uploaded report"}</a></p>)}</details></article>;
  })}</div>}</div>;
}
