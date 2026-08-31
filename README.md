# Ayush OPD Intake System

A full-stack healthcare application for Ayurvedic clinics with voice-enabled patient intake, AI-powered clinical analysis, and medical report processing.

## Features

✨ **Voice-Enabled Intake** - Capture patient symptoms via audio transcription  
📄 **Medical Report Processing** - Automatic PDF & image text extraction using OCR  
🤖 **Clinical NLP Analysis** - AI-powered extraction of clinical entities and symptoms  
🧘 **Ayurvedic Integration** - Specialized parameters (Agni, Prakriti, Sleep, Diet/Lifestyle)  
🌐 **Bilingual Summaries** - Auto-generated summaries in English & Hindi  
⚠️ **Red Flag Detection** - Automatic identification of critical medical conditions  
💾 **Case Management** - Complete patient case sheet storage and retrieval  

## Tech Stack

**Backend:**
- FastAPI (Python web framework)
- SQLAlchemy ORM + SQLite database
- OpenAI Whisper (speech-to-text)
- Ollama/Google Gemini (clinical NLP)
- PyPDF + Tesseract OCR (document processing)

**Frontend:**
- Next.js 16 (React meta-framework)
- TypeScript
- Tailwind CSS v4 (styling)
- Axios (HTTP client)

## Project Structure

```
ayush-opd-intake/
├── backend/
│   ├── app/
│   │   ├── main.py                 # FastAPI application
│   │   ├── api/
│   │   │   ├── audio.py            # Audio & intake endpoints
│   │   │   └── cases.py            # Case management endpoints
│   │   ├── models/
│   │   │   └── case_sheet.py       # Database models
│   │   ├── schemas/
│   │   │   └── case_sheet.py       # Pydantic validation
│   │   ├── services/
│   │   │   ├── transcription.py    # Whisper integration
│   │   │   ├── clinical_nlp.py     # NLP analysis
│   │   │   └── report_ocr.py       # PDF/Image OCR
│   │   └── core/
│   │       ├── config.py           # Configuration
│   │       └── database.py         # Database setup
│   ├── requirements.txt
│   └── venv/                       # Python virtual environment
│
├── frontend/
│   ├── src/
│   │   └── app/
│   │       ├── layout.tsx
│   │       ├── page.tsx
│   │       └── globals.css
│   ├── package.json
│   ├── tsconfig.json
│   └── next.config.ts
│
├── SETUP_GUIDE.txt                 # Quick setup guide
├── start.ps1                       # Start both services
├── stop.ps1                        # Stop services
└── README.md                       # This file
```

## Quick Start

### Prerequisites
- Python 3.9+
- Node.js 18+
- FFmpeg
- Tesseract-OCR

### Installation

1. **Install Dependencies**
   ```bash
   # Python
   python -m venv venv
   venv\Scripts\activate
   cd backend
   pip install -r requirements.txt
   
   # Node.js
   cd ../frontend
   npm install
   ```

2. **Configure Backend**
   ```bash
   cd backend
   ```
   Create `.env` file:
   ```
   PROJECT_NAME=Ayush OPD Intake System
   DATABASE_URL=sqlite:///./patient_cases.db
   OLLAMA_URL=http://127.0.0.1:11434
   OLLAMA_MODEL=llama3.2
   TESSERACT_CMD=C:\Program Files\Tesseract-OCR\tesseract.exe
   ```

3. **Configure Frontend**
   ```bash
   cd frontend
   ```
   Create `.env.local`:
   ```
   NEXT_PUBLIC_API_URL=http://localhost:8000
   ```

### Running the Application

**Option 1: Manual Start (2 terminals)**
```bash
# Terminal 1 - Backend
cd backend
venv\Scripts\activate
uvicorn app.main:app --reload --port 8000

# Terminal 2 - Frontend
cd frontend
npm run dev
```

**Option 2: Automated**
```bash
.\start.ps1
```

Open browser: http://localhost:3000

## API Endpoints

### Cases
- `POST /cases/` - Create case
- `GET /cases/` - List all cases
- `GET /cases/{id}` - Get case details
- `DELETE /cases/{id}` - Delete case

### Audio & Intake
- `POST /audio/transcribe` - Transcribe audio file
- `POST /audio/intake-from-audio` - Full patient intake with voice, forms, and reports

### Documentation
- `GET http://localhost:8000/docs` - Interactive Swagger UI

## Database Schema

Patient cases include:
- Basic info (name, age, gender, contact)
- Clinical data (chief complaint, duration, history, allergies)
- Medical reports (uploaded files + extracted text)
- Ayurvedic parameters (Agni, Prakriti, sleep, diet/lifestyle)
- AI-generated summaries (SOAP, English, Hindi)
- Red flags (critical medical conditions)

## Troubleshooting

### Common Issues

**"Python not found"**
- Reinstall Python with "Add to PATH" option

**"Module not found"**
- Activate venv: `venv\Scripts\activate`
- Install deps: `pip install -r requirements.txt`

**"FFmpeg not found"**
- Download from https://ffmpeg.org/
- Add to system PATH

**"Port 8000 in use"**
- `taskkill /PID <PID> /F`
- Or use different port: `--port 8001`

See [SETUP_GUIDE.txt](SETUP_GUIDE.txt) for more troubleshooting.

## Development

### Backend Development
```bash
cd backend
venv\Scripts\activate
uvicorn app.main:app --reload
```

### Frontend Development
```bash
cd frontend
npm run dev
```

### Build & Deploy
```bash
# Frontend production build
cd frontend
npm run build
npm start

# Backend production
pip install gunicorn
gunicorn app.main:app --workers 4
```

## License

This project is licensed under the MIT License - see [LICENSE](LICENSE) file for details.

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## Security Notice

⚠️ This is a development setup. For production deployment:
- Set CORS to specific origins
- Implement authentication/authorization
- Enable HTTPS/SSL
- Use PostgreSQL instead of SQLite
- Validate all file uploads
- Store secrets securely
- Implement rate limiting

## Support

For issues, questions, or suggestions, please open an issue on GitHub.

## Authors

- Ayush OPD Team

## Acknowledgments

- OpenAI for Whisper speech recognition
- Google for Gemini API
- Ollama for local LLM support
- Next.js and FastAPI communities
