# AstraMind Phase-1 MVP - Testing Guide

This guide will help you test all the features of the AstraMind AI Agent to ensure everything is working correctly.

## 🚀 Quick Start Testing

### 1. Prerequisites
- Docker and Docker Compose installed
- API keys configured in `.env` file:
  - `OPENAI_API_KEY` (required)
  - `YOUTUBE_API_KEY` (required)
  - `GOOGLE_CALENDAR_CREDENTIALS` (optional)

### 2. Start the Application
```bash
# On macOS/Linux
./start.sh

# On Windows
start.bat

# Or manually
docker-compose up --build
```

### 3. Access Points
- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:8000
- **API Documentation**: http://localhost:8000/docs

## 🧪 Feature Testing

### 1. Voice Input & Transcription

#### Test Case: Basic Voice Recording
1. **Navigate to**: Voice Input card
2. **Action**: Click "Start" button
3. **Expected**: Recording indicator shows "Recording"
4. **Action**: Speak clearly in English/Hindi/Marathi
5. **Action**: Click "Stop" button
6. **Expected**: Audio blob is captured
7. **Action**: Click "Process Audio with Whisper"
8. **Expected**: 
   - Processing indicator shows
   - Transcript appears in text area
   - Success log entry appears

#### Test Case: Manual Text Input
1. **Navigate to**: Voice Input card
2. **Action**: Type text in manual input field
3. **Expected**: Text appears in transcript area
4. **Action**: Verify text is saved to localStorage

#### Test Case: Browser Compatibility
1. **Test in Chrome/Edge**: Should work with Web Speech API
2. **Test in Firefox/Safari**: Should fallback to MediaRecorder
3. **Expected**: Appropriate warning in logs

### 2. YouTube Video Summaries

#### Test Case: Basic Search
1. **Navigate to**: YouTube Summaries card
2. **Input**: "AI sales assistant videos"
3. **Action**: Click "Search & Summarize"
4. **Expected**:
   - Loading state shows
   - 5 video results appear
   - Each result has title, summary, and watch link
   - Success log entry appears

#### Test Case: Search Validation
1. **Input**: Empty query
2. **Action**: Click search button
3. **Expected**: Warning log appears
4. **Input**: Very long query (>100 characters)
3. **Expected**: Search processes normally

#### Test Case: Result Display
1. **Verify**: Results are scrollable if >3 items
2. **Verify**: Each summary is <100 words
3. **Verify**: YouTube links open in new tab
4. **Verify**: Results persist until page refresh

### 3. Job Search

#### Test Case: Basic Job Search
1. **Navigate to**: Job Search card
2. **Input Role**: "Java Architect"
3. **Input Location**: "London"
4. **Action**: Click "Find Jobs"
5. **Expected**:
   - Loading state shows
   - 3 job results appear
   - Each job has title, company, location, AI summary
   - Apply links are functional

#### Test Case: Search Validation
1. **Test**: Empty role field
2. **Expected**: Warning log appears
3. **Test**: Empty location field
4. **Expected**: Warning log appears
5. **Test**: Both fields empty
6. **Expected**: Warning log appears

#### Test Case: Result Quality
1. **Verify**: AI summaries are 2-3 sentences
2. **Verify**: Company names are realistic
3. **Verify**: Apply links are valid URLs
4. **Verify**: Location matches search query

### 4. Smart Reminders

#### Test Case: Create Reminder
1. **Navigate to**: Smart Reminders card
2. **Input Task**: "Test reminder for tomorrow"
3. **Set Time**: "09:00"
4. **Set Date**: Tomorrow's date
5. **Action**: Click "Set Reminder"
6. **Expected**:
   - Success log appears
   - Reminder appears in active reminders list
   - Form fields clear

#### Test Case: Reminder Validation
1. **Test**: Empty task text
2. **Expected**: Warning log appears
3. **Test**: Past date/time
4. **Expected**: Reminder still creates (future enhancement: validation)

#### Test Case: Reminder Persistence
1. **Create**: Multiple reminders
2. **Refresh**: Page
3. **Expected**: Reminders persist and load from database
4. **Verify**: Reminder count in logs matches display

### 5. Text-to-Speech

#### Test Case: Basic TTS
1. **Navigate to**: Text-to-Speech card
2. **Select Language**: English
3. **Input Text**: "Hello, this is a test of text to speech conversion."
4. **Action**: Click "Convert to Speech"
5. **Expected**:
   - Loading state shows
   - Audio plays automatically
   - Success log appears

#### Test Case: Multi-language Support
1. **Test Language**: Hindi
2. **Input Text**: "नमस्ते, यह टेक्स्ट टू स्पीच का परीक्षण है।"
3. **Expected**: Audio plays in Hindi accent
4. **Test Language**: Marathi
5. **Input Text**: "नमस्कार, हे टेक्स्ट टू स्पीच चे परीक्षण आहे."
6. **Expected**: Audio plays in Marathi accent

#### Test Case: TTS Validation
1. **Test**: Empty text
2. **Expected**: Warning log appears
3. **Test**: Very long text (>500 characters)
4. **Expected**: Processes normally (may take longer)

### 6. Emergency System (Mock)

#### Test Case: Emergency Initiation
1. **Navigate to**: Emergency card
2. **Select Type**: Ambulance
3. **Action**: Click "Initiate Emergency"
4. **Expected**: Confirmation dialog appears
5. **Action**: Confirm emergency
6. **Expected**: Warning log appears with emergency details

#### Test Case: Emergency Types
1. **Test**: All three emergency types
2. **Expected**: Each shows appropriate simulation message
3. **Verify**: Dialog closes after confirmation

### 7. Execution Logs

#### Test Case: Log Generation
1. **Perform**: Multiple actions across different features
2. **Expected**: Logs appear in real-time
3. **Verify**: Log levels are correct (info, warn, error, success)
4. **Verify**: Timestamps are accurate

#### Test Case: Log Management
1. **Action**: Click "Clear" button
2. **Expected**: All logs are removed
3. **Action**: Perform new actions
4. **Expected**: New logs appear
5. **Verify**: Log limit is 200 entries

### 8. Theme System

#### Test Case: Theme Toggle
1. **Action**: Click theme toggle in header
2. **Expected**: Theme changes immediately
3. **Refresh**: Page
4. **Expected**: Theme preference persists
5. **Verify**: All components adapt to theme

### 9. Responsive Design

#### Test Case: Mobile Layout
1. **Resize**: Browser to mobile dimensions
2. **Expected**: Sidebar collapses
3. **Expected**: Cards stack vertically
4. **Expected**: Touch-friendly button sizes

#### Test Case: Tablet Layout
1. **Resize**: Browser to tablet dimensions
2. **Expected**: 2-column grid layout
3. **Expected**: Sidebar remains visible

## 🔍 API Testing

### 1. Health Check
```bash
curl http://localhost:8000/health
# Expected: {"status": "healthy", "timestamp": "..."}
```

### 2. Voice Input
```bash
# Create test audio file
ffmpeg -f lavfi -i "sine=frequency=1000:duration=3" test.wav

# Test voice input endpoint
curl -X POST http://localhost:8000/voice-input \
  -F "audio_file=@test.wav"
```

### 3. YouTube Summary
```bash
curl "http://localhost:8000/yt-summary?topic=AI%20tutorials"
# Expected: JSON with video summaries
```

### 4. Job Search
```bash
curl "http://localhost:8000/job-search?role=Developer&location=San%20Francisco"
# Expected: JSON with job results
```

### 5. Reminder Creation
```bash
curl -X POST http://localhost:8000/reminder \
  -F "task=Test reminder" \
  -F "reminder_time=10:00" \
  -F "date=2024-01-15"
```

### 6. Text-to-Speech
```bash
curl "http://localhost:8000/speak?text=Hello%20World&language=en" \
  -o speech.mp3
# Expected: MP3 audio file
```

## 🐛 Common Issues & Solutions

### 1. Voice Not Working
- **Issue**: "Web Speech API not available"
- **Solution**: Use Chrome/Edge or check microphone permissions
- **Fallback**: MediaRecorder will be used automatically

### 2. API Errors
- **Issue**: "OpenAI API key not configured"
- **Solution**: Check `.env` file and API key validity
- **Verify**: Key has sufficient credits

### 3. Docker Issues
- **Issue**: Ports already in use
- **Solution**: Stop other services using ports 3000/8000
- **Alternative**: Modify ports in docker-compose.yml

### 4. Audio Playback Issues
- **Issue**: No audio output
- **Solution**: Check browser audio permissions
- **Verify**: System volume is not muted

## 📊 Performance Testing

### 1. Load Testing
```bash
# Install Apache Bench
sudo apt-get install apache2-utils

# Test backend performance
ab -n 100 -c 10 http://localhost:8000/health
```

### 2. Memory Usage
```bash
# Monitor Docker containers
docker stats astramind-backend astramind-frontend
```

### 3. Response Times
- **Voice Input**: Should complete within 5-10 seconds
- **YouTube Search**: Should complete within 10-15 seconds
- **Job Search**: Should complete within 3-5 seconds
- **TTS**: Should complete within 2-5 seconds

## ✅ Success Criteria

### Phase 1 MVP Complete When:
- [ ] Voice input works in all supported browsers
- [ ] YouTube summaries generate accurate results
- [ ] Job search returns relevant positions
- [ ] Reminders persist across sessions
- [ ] TTS works in multiple languages
- [ ] All API endpoints respond correctly
- [ ] UI is responsive on mobile/tablet/desktop
- [ ] Dark/light theme works correctly
- [ ] Execution logs capture all activities
- [ ] Docker deployment works locally

### Ready for Phase 2 When:
- [ ] All Phase 1 features tested and working
- [ ] Performance meets requirements
- [ ] Error handling is robust
- [ ] User experience is smooth
- [ ] Code quality meets standards

## 🚀 Next Steps

After successful testing:
1. **Document**: Any issues found and solutions
2. **Optimize**: Performance bottlenecks
3. **Enhance**: Error handling and user feedback
4. **Plan**: Phase 2 feature development
5. **Deploy**: To staging environment for user testing

---

**Happy Testing! 🎉**

If you encounter any issues, check the execution logs first, then refer to the troubleshooting section above.
