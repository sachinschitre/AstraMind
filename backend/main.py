from fastapi import FastAPI, File, UploadFile, HTTPException, Form
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, JSONResponse
from fastapi.staticfiles import StaticFiles
import os
import sqlite3
import json
import tempfile
import asyncio
from datetime import datetime, timedelta
from typing import List, Optional
import openai
import requests
from gtts import gTTS
import tempfile
import re
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

app = FastAPI(title="AstraMind AI Agent", version="1.0.0")

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize API keys
openai.api_key = os.getenv("OPENAI_API_KEY")
YOUTUBE_API_KEY = os.getenv("YOUTUBE_API_KEY")
ANTHROPIC_API_KEY = os.getenv("ANTHROPIC_API_KEY")
AZURE_API_KEY = os.getenv("AZURE_API_KEY")
ELEVENLABS_API_KEY = os.getenv("ELEVENLABS_API_KEY")

# Database initialization
def init_db():
    conn = sqlite3.connect('astramind.db')
    cursor = conn.cursor()
    
    # Create tables
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS youtube_summaries (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            topic TEXT NOT NULL,
            video_id TEXT NOT NULL,
            title TEXT NOT NULL,
            summary TEXT NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    ''')
    
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS job_searches (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            role TEXT NOT NULL,
            location TEXT NOT NULL,
            results TEXT NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    ''')
    
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS reminders (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            task TEXT NOT NULL,
            reminder_time TIMESTAMP NOT NULL,
            status TEXT DEFAULT 'pending',
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    ''')
    
    conn.commit()
    conn.close()

# Initialize database on startup
@app.on_event("startup")
async def startup_event():
    init_db()

# Models
class ReminderRequest:
    task: str
    reminder_time: str
    date: str

class YouTubeSummary:
    video_id: str
    title: str
    summary: str

class JobResult:
    title: str
    company: str
    location: str
    apply_link: str
    description: str

# Utility functions
def clean_text(text: str) -> str:
    """Clean and format text for better processing"""
    return re.sub(r'\s+', ' ', text.strip())

def extract_video_id(url: str) -> str:
    """Extract YouTube video ID from URL"""
    patterns = [
        r'(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)',
        r'youtube\.com\/v\/([^&\n?#]+)'
    ]
    for pattern in patterns:
        match = re.search(pattern, url)
        if match:
            return match.group(1)
    return url

# API Endpoints

@app.post("/voice-input")
async def voice_input(audio_file: UploadFile = File(...)):
    """Convert voice input to text using OpenAI Whisper"""
    try:
        if not openai.api_key:
            raise HTTPException(status_code=500, detail="OpenAI API key not configured")
        
        # Save uploaded file temporarily
        with tempfile.NamedTemporaryFile(delete=False, suffix=".wav") as temp_file:
            content = await audio_file.read()
            temp_file.write(content)
            temp_file_path = temp_file.name
        
        # Transcribe using OpenAI Whisper
        with open(temp_file_path, "rb") as audio:
            transcript = openai.Audio.transcribe("whisper-1", audio)
        
        # Clean up temp file
        os.unlink(temp_file_path)
        
        return {"text": transcript["text"], "language": transcript.get("language", "en")}
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Voice transcription failed: {str(e)}")

@app.get("/yt-summary")
async def youtube_summary(topic: str):
    """Fetch and summarize YouTube videos on a given topic"""
    try:
        if not YOUTUBE_API_KEY:
            raise HTTPException(status_code=500, detail="YouTube API key not configured")
        
        # Search YouTube for videos
        search_url = "https://www.googleapis.com/youtube/v3/search"
        search_params = {
            "part": "snippet",
            "q": topic,
            "key": YOUTUBE_API_KEY,
            "type": "video",
            "maxResults": 5,
            "relevanceLanguage": "en"
        }
        
        response = requests.get(search_url, params=search_params)
        response.raise_for_status()
        search_results = response.json()
        
        summaries = []
        
        for item in search_results.get("items", []):
            video_id = item["id"]["videoId"]
            title = item["snippet"]["title"]
            
            try:
                # Get video transcript
                transcript_url = f"https://www.googleapis.com/youtube/v3/captions"
                transcript_params = {
                    "part": "snippet",
                    "videoId": video_id,
                    "key": YOUTUBE_API_KEY
                }
                
                transcript_response = requests.get(transcript_url, params=transcript_params)
                if transcript_response.status_code == 200:
                    transcript_data = transcript_response.json()
                    
                    # For demo purposes, we'll use the video description as fallback
                    # In production, you'd want to use youtube-transcript-api
                    video_description = item["snippet"]["description"]
                    
                    # Generate summary using GPT-4
                    if openai.api_key:
                        summary_response = openai.ChatCompletion.create(
                            model="gpt-4o-mini",
                            messages=[
                                {"role": "system", "content": "You are a helpful assistant that summarizes content concisely."},
                                {"role": "user", "content": f"Summarize this YouTube video content in under 100 words: {video_description[:1000]}"}
                            ],
                            max_tokens=150
                        )
                        summary = summary_response.choices[0].message.content
                    else:
                        summary = f"Summary of {title}: {video_description[:200]}..."
                    
                    # Store in database
                    conn = sqlite3.connect('astramind.db')
                    cursor = conn.cursor()
                    cursor.execute('''
                        INSERT INTO youtube_summaries (topic, video_id, title, summary)
                        VALUES (?, ?, ?, ?)
                    ''', (topic, video_id, title, summary))
                    conn.commit()
                    conn.close()
                    
                    summaries.append({
                        "video_id": video_id,
                        "title": title,
                        "summary": summary,
                        "url": f"https://www.youtube.com/watch?v={video_id}"
                    })
                    
            except Exception as e:
                print(f"Error processing video {video_id}: {e}")
                continue
        
        return {"topic": topic, "summaries": summaries, "count": len(summaries)}
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"YouTube summary failed: {str(e)}")

@app.get("/job-search")
async def job_search(role: str, location: str):
    """Search for jobs and return summaries"""
    try:
        # For demo purposes, we'll return mock job data
        # In production, you'd integrate with LinkedIn/Indeed APIs
        
        mock_jobs = [
            {
                "title": f"Senior {role}",
                "company": "TechCorp Inc.",
                "location": location,
                "apply_link": f"https://example.com/jobs/{role.lower().replace(' ', '-')}",
                "description": f"Looking for an experienced {role} to join our team in {location}."
            },
            {
                "title": f"{role} Developer",
                "company": "Innovation Labs",
                "location": location,
                "apply_link": f"https://example.com/careers/{role.lower().replace(' ', '-')}",
                "description": f"Join our {location} office as a {role} and help build amazing products."
            },
            {
                "title": f"Lead {role}",
                "company": "Future Systems",
                "location": location,
                "apply_link": f"https://example.com/positions/{role.lower().replace(' ', '-')}",
                "description": f"Lead {role} position available in {location} with competitive salary."
            }
        ]
        
        # Generate AI summaries for each job
        if openai.api_key:
            for job in mock_jobs:
                try:
                    summary_response = openai.ChatCompletion.create(
                        model="gpt-4o-mini",
                        messages=[
                            {"role": "system", "content": "You are a helpful assistant that summarizes job postings."},
                            {"role": "user", "content": f"Summarize this job posting in 2-3 sentences: {job['title']} at {job['company']} in {job['location']}. {job['description']}"}
                        ],
                        max_tokens=100
                    )
                    job["ai_summary"] = summary_response.choices[0].message.content
                except:
                    job["ai_summary"] = job["description"]
        else:
            for job in mock_jobs:
                job["ai_summary"] = job["description"]
        
        # Store in database
        conn = sqlite3.connect('astramind.db')
        cursor = conn.cursor()
        cursor.execute('''
            INSERT INTO job_searches (role, location, results)
            VALUES (?, ?, ?)
        ''', (role, location, json.dumps(mock_jobs)))
        conn.commit()
        conn.close()
        
        return {"role": role, "location": location, "jobs": mock_jobs, "count": len(mock_jobs)}
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Job search failed: {str(e)}")

@app.post("/reminder")
async def create_reminder(task: str = Form(...), reminder_time: str = Form(...), date: str = Form(...)):
    """Create a new reminder"""
    try:
        # Parse date and time
        datetime_str = f"{date} {reminder_time}"
        reminder_datetime = datetime.strptime(datetime_str, "%Y-%m-%d %H:%M")
        
        # Store in database
        conn = sqlite3.connect('astramind.db')
        cursor = conn.cursor()
        cursor.execute('''
            INSERT INTO reminders (task, reminder_time, status)
            VALUES (?, ?, ?)
        ''', (task, reminder_datetime.isoformat(), 'pending'))
        conn.commit()
        conn.close()
        
        return {
            "message": "Reminder created successfully",
            "task": task,
            "reminder_time": reminder_datetime.isoformat(),
            "id": cursor.lastrowid
        }
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Reminder creation failed: {str(e)}")

@app.get("/reminders")
async def get_reminders():
    """Get all pending reminders"""
    try:
        conn = sqlite3.connect('astramind.db')
        cursor = conn.cursor()
        cursor.execute('''
            SELECT id, task, reminder_time, status, created_at
            FROM reminders
            WHERE status = 'pending'
            ORDER BY reminder_time ASC
        ''')
        
        reminders = []
        for row in cursor.fetchall():
            reminders.append({
                "id": row[0],
                "task": row[1],
                "reminder_time": row[2],
                "status": row[3],
                "created_at": row[4]
            })
        
        conn.close()
        return {"reminders": reminders}
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch reminders: {str(e)}")

@app.get("/speak")
async def text_to_speech(text: str, language: str = "en"):
    """Convert text to speech using gTTS"""
    try:
        # Create temporary file for audio
        with tempfile.NamedTemporaryFile(delete=False, suffix=".mp3") as temp_file:
            temp_file_path = temp_file.name
        
        # Generate speech
        tts = gTTS(text=text, lang=language, slow=False)
        tts.save(temp_file_path)
        
        # Return audio file
        return FileResponse(
            temp_file_path,
            media_type="audio/mpeg",
            filename="speech.mp3",
            headers={"Content-Disposition": "attachment; filename=speech.mp3"}
        )
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Text-to-speech failed: {str(e)}")

@app.post("/llm-process")
async def llm_process(
    text: str = Form(...), 
    provider: str = Form("openai"),
    api_key: str = Form(None)
):
    """Process text using specified LLM provider"""
    try:
        if provider == "openai":
            # Use provided API key if available, otherwise fallback to environment
            current_api_key = api_key if api_key else openai.api_key
            if not current_api_key:
                raise HTTPException(status_code=400, detail="OpenAI API key required")
            
            # Temporarily set the API key for this request
            original_key = openai.api_key
            openai.api_key = current_api_key
            
            try:
                response = openai.ChatCompletion.create(
                    model="gpt-4o-mini",
                    messages=[
                        {"role": "system", "content": "You are AstraMind, a helpful AI assistant. Process the user's request and provide a clear, actionable response."},
                        {"role": "user", "content": text}
                    ],
                    max_tokens=500
                )
                result = response.choices[0].message.content
            finally:
                openai.api_key = original_key
                
        elif provider == "anthropic":
            if not api_key and not ANTHROPIC_API_KEY:
                raise HTTPException(status_code=400, detail="Anthropic API key required")
            
            # For demo purposes, simulate Anthropic response
            result = f"[ANTHROPIC SIMULATION] Processed: {text[:100]}... Response would be generated using Claude API."
            
        elif provider == "azure":
            if not api_key and not AZURE_API_KEY:
                raise HTTPException(status_code=400, detail="Azure API key required")
            
            # For demo purposes, simulate Azure OpenAI response
            result = f"[AZURE SIMULATION] Processed: {text[:100]}... Response would be generated using Azure OpenAI."
            
        else:
            raise HTTPException(status_code=400, detail="Unsupported LLM provider")
        
        return {
            "provider": provider,
            "response": result,
            "timestamp": datetime.now().isoformat()
        }
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"LLM processing failed: {str(e)}")

@app.post("/task-execute")
async def task_execute(
    command: str = Form(...),
    provider: str = Form("openai"),
    api_key: str = Form(None)
):
    """Execute a task based on voice command"""
    try:
        command_lower = command.lower()
        
        if "reminder" in command_lower or "remind" in command_lower:
            # Extract reminder text and create a mock reminder
            reminder_text = command.replace("remind", "").replace("reminder", "").replace("me", "").replace("to", "").strip()
            
            # Create reminder with current time + 1 hour
            reminder_time = datetime.now() + timedelta(hours=1)
            
            conn = sqlite3.connect('astramind.db')
            cursor = conn.cursor()
            cursor.execute('''
                INSERT INTO reminders (task, reminder_time, status)
                VALUES (?, ?, ?)
            ''', (reminder_text, reminder_time.isoformat(), 'pending'))
            conn.commit()
            reminder_id = cursor.lastrowid
            conn.close()
            
            return {
                "task_type": "reminder",
                "action": "created",
                "details": {
                    "id": reminder_id,
                    "task": reminder_text,
                    "reminder_time": reminder_time.isoformat()
                },
                "message": f"✅ Reminder created: '{reminder_text}' for {reminder_time.strftime('%Y-%m-%d %H:%M')}"
            }
            
        elif "whatsapp" in command_lower or "message" in command_lower:
            # Simulate WhatsApp message sending
            message_content = "Hello! This is a simulated message from AstraMind AI."
            
            return {
                "task_type": "whatsapp",
                "action": "sent",
                "details": {
                    "message": message_content,
                    "recipient": "primary_contact",
                    "platform": "whatsapp"
                },
                "message": f"✅ Mock WhatsApp message sent: '{message_content}'"
            }
            
        else:
            # Use LLM to interpret and respond to the command
            llm_response = await llm_process(
                text=f"Interpret this command and suggest an appropriate action: {command}",
                provider=provider,
                api_key=api_key
            )
            
            return {
                "task_type": "interpretation",
                "action": "analyzed",
                "details": {
                    "original_command": command,
                    "llm_response": llm_response["response"]
                },
                "message": "Command interpreted by AI"
            }
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Task execution failed: {str(e)}")

@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {"status": "healthy", "timestamp": datetime.now().isoformat()}

@app.get("/")
async def root():
    """Root endpoint"""
    return {"message": "AstraMind AI Agent API", "version": "1.0.0"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
