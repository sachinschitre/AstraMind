# AstraMind Phase-1 MVP - Local AI Agent

🎯 **Objective**: Build a local demo AI agent that takes voice input (Hindi, Marathi, English), summarizes YouTube videos, finds LinkedIn jobs, sets reminders, and runs locally in Docker.

## 🚀 Features

### Core Features (Phase 1)
- **Voice Capture**: Microphone input with OpenAI Whisper transcription
- **YouTube Summarizer**: Fetch and summarize top 5 videos on any topic
- **Job Search**: Find and summarize top 10 jobs from LinkedIn/Indeed
- **Reminders**: Set reminders with SQLite storage and Google Calendar integration
- **Voice Output**: Convert summaries to spoken audio using gTTS/ElevenLabs
- **Multi-language Support**: Hindi, Marathi, English

### Tech Stack
- **Frontend**: React + TypeScript + Vite + Tailwind CSS + shadcn/ui
- **Backend**: Python + FastAPI
- **Voice**: OpenAI Whisper (speech→text), gTTS (text→speech)
- **LLM**: GPT-4o-mini for summaries
- **Storage**: SQLite (local history)
- **Container**: Docker

## 🏗️ Project Structure

```
AstraMind/
├── frontend/                 # React frontend
├── backend/                  # FastAPI backend
├── docker-compose.yml        # Local development
├── Dockerfile               # Backend container
└── README.md
```

## 🚀 Quick Start

### Option 1: Docker (Recommended)
```bash
# Clone and run
git clone <repo>
cd AstraMind
docker-compose up --build

# Access at http://localhost:3000
```

### Option 2: Local Development
```bash
# Backend
cd backend
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt
uvicorn main:app --reload --port 8000

# Frontend (new terminal)
cd frontend
npm install
npm run dev
```

## 📡 API Endpoints

### 1. Voice Input
- **POST** `/voice-input`
- Accepts audio file (Hindi, Marathi, English)
- Uses OpenAI Whisper API to transcribe
- Returns text

### 2. YouTube Summary
- **GET** `/yt-summary?topic=<query>`
- Fetches top 5 video transcripts via YouTube API
- Summarizes each in <100 words with GPT-4
- Stores summaries in SQLite
- Returns summaries

### 3. Job Search
- **GET** `/job-search?role=<query>&location=<city>`
- Scrapes LinkedIn/Indeed jobs
- Returns top 10 jobs with summaries

### 4. Reminders
- **POST** `/reminder`
- Input: task, time, date
- Saves in SQLite
- Optionally pushes to Google Calendar
- Returns confirmation

### 5. Text-to-Speech
- **GET** `/speak?text=<summary>`
- Converts text to audio using gTTS
- Returns MP3 file

## 🔧 Configuration

### Environment Variables
Create `.env` file in backend directory:
```env
OPENAI_API_KEY=your_openai_key
YOUTUBE_API_KEY=your_youtube_key
GOOGLE_CALENDAR_CREDENTIALS=path_to_credentials.json
```

### API Keys Required
- OpenAI API key (for Whisper + GPT-4)
- YouTube Data API v3 key
- Google Calendar API (optional, for reminders)

## 🧪 Testing

### Voice Input Test
1. Click "Voice Dictation" card
2. Speak in Hindi/Marathi/English
3. Verify transcription accuracy

### YouTube Summary Test
1. Use voice or text: "Summarize AI sales assistant videos"
2. Check execution logs for API calls
3. Verify summaries are generated

### Job Search Test
1. Query: "Find Java architect jobs in London"
2. Verify job results and summaries
3. Check database storage

### Reminder Test
1. Set reminder: "Remind me tomorrow at 8am about Outskill pitch"
2. Verify SQLite storage
3. Check Google Calendar integration

## 📱 UI Features

- **Responsive Design**: Works on desktop and mobile
- **Dark/Light Theme**: Persisted in localStorage
- **Real-time Logs**: Execution status and errors
- **Voice Controls**: Start/stop recording
- **Task Cards**: Voice Dictation, Reminders, Emergency
- **Settings Panel**: API key management
- **Help System**: User guidance

## 🔮 Phase 2 Roadmap

- Email triage + WhatsApp integration
- Basic mock interview assistant
- Enhanced voice recognition
- Multi-language TTS
- Advanced reminder system

## 🐛 Troubleshooting

### Common Issues
1. **Voice not working**: Check browser permissions and Web Speech API support
2. **API errors**: Verify API keys in environment variables
3. **Docker issues**: Ensure ports 3000 and 8000 are available
4. **Audio playback**: Check browser audio permissions

### Browser Compatibility
- Chrome/Edge: Full Web Speech API support
- Firefox: Limited support
- Safari: Limited support

## 📄 License

MIT License - see LICENSE file for details

## 🤝 Contributing

1. Fork the repository
2. Create feature branch
3. Make changes
4. Test thoroughly
5. Submit pull request

---

**Built with ❤️ using Cursor AI for rapid development**
