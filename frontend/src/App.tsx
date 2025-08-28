import React, { useEffect, useMemo, useRef, useState } from "react";
import { motion } from "framer-motion";
import {
  LayoutGrid,
  Mic,
  BellRing,
  PhoneCall,
  Moon,
  SunMedium,
  Settings,
  HelpCircle,
  LogOut,
  PlayCircle,
  PauseCircle,
  Trash2,
  CheckCircle2,
  Youtube,
  Briefcase,
  Volume2,
  Download,
  Calendar,
  Clock,
  Search,
  FileAudio,
  AlertCircle,
  User,
  Shield,
} from "lucide-react";

// Phase 3 Components
import AuthModal from "./components/AuthModal";
import ProfilePage from "./components/ProfilePage";
import SecurityGate from "./components/SecurityGate";
import { authService, onAuthStateChange, UserProfile } from "./firebase";

// -------------------------------------------------------------
// ASTRA MIND – Phase 3 User Management & Security
// - Firebase Authentication (Login/Signup)
// - User Profiles with Role-based Permissions
// - Security Gates for Sensitive Operations
// - Task History and Usage Analytics
// - Enhanced Voice Confirmation System
// -------------------------------------------------------------

// Simple local storage helpers
const ls = {
  get: (k: string, def: any = null) => {
    try {
      const v = localStorage.getItem(k);
      return v !== null ? JSON.parse(v) : def;
    } catch {
      return def;
    }
  },
  set: (k: string, v: any) => {
    try {
      localStorage.setItem(k, JSON.stringify(v));
    } catch {}
  },
};

// Types
type LogRow = {
  id: string;
  when: string;
  level: "info" | "warn" | "error" | "success";
  msg: string;
};

type NavKey = "tasks" | "settings" | "help" | "profile";

type YouTubeSummary = {
  video_id: string;
  title: string;
  summary: string;
  url: string;
};

type JobResult = {
  title: string;
  company: string;
  location: string;
  apply_link: string;
  description: string;
  ai_summary: string;
};

type Reminder = {
  id: number;
  task: string;
  reminder_time: string;
  status: string;
  created_at: string;
};

export default function App() {
  // --- Authentication (Phase 3) ---
  const [user, setUser] = useState<any>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showSecurityGate, setShowSecurityGate] = useState(false);
  const [pendingOperation, setPendingOperation] = useState<any>(null);

  // Monitor auth state
  useEffect(() => {
    const unsubscribe = onAuthStateChange(async (user) => {
      setUser(user);
      if (user) {
        // Load user profile
        const profile = await authService.getUserProfile(user.uid);
        setUserProfile(profile);
      } else {
        setUserProfile(null);
      }
      setAuthLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // --- Theme ---
  const [dark, setDark] = useState<boolean>(() => ls.get("themeDark", true));
  useEffect(() => {
    const root = document.documentElement;
    if (dark) root.classList.add("dark");
    else root.classList.remove("dark");
    ls.set("themeDark", dark);
  }, [dark]);

  // --- Navigation ---
  const [nav, setNav] = useState<NavKey>("tasks");

  // --- Logs ---
  const [logs, setLogs] = useState<LogRow[]>(() => ls.get("logs", []));
  useEffect(() => ls.set("logs", logs), [logs]);

  // --- Voice Input ---
  const [listening, setListening] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const recognitionRef = useRef<any>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  const canUseWebSpeech = useMemo(() => 
    typeof window !== "undefined" && (window as any).webkitSpeechRecognition, 
    []
  );

  const startListening = () => {
    if (!canUseWebSpeech) {
      pushLog("warn", "Web Speech API not available. Using MediaRecorder for audio capture.");
      startAudioRecording();
      return;
    }
    
    const Rec = (window as any).webkitSpeechRecognition;
    const rec = new Rec();
    recognitionRef.current = rec;
    rec.lang = "en-IN";
    rec.continuous = true;
    rec.interimResults = true;
    rec.onresult = (e: any) => {
      let t = "";
      for (let i = e.resultIndex; i < e.results.length; i++) {
        t += e.results[i][0].transcript;
      }
      setTranscript(t);
    };
    rec.onend = () => setListening(false);
    rec.onerror = () => setListening(false);
    rec.start();
    setListening(true);
    pushLog("info", "Voice dictation started.");
  };

  const startAudioRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        chunksRef.current.push(event.data);
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: 'audio/wav' });
        setAudioBlob(blob);
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      setListening(true);
      pushLog("info", "Audio recording started.");
    } catch (error) {
      pushLog("error", "Failed to start audio recording: " + error);
    }
  };

  const stopListening = () => {
    if (recognitionRef.current) {
      recognitionRef.current?.stop?.();
    }
    if (mediaRecorderRef.current) {
      mediaRecorderRef.current.stop();
    }
    setListening(false);
    pushLog("info", "Recording stopped.");
  };

  const processVoiceInput = async () => {
    if (!audioBlob && !transcript.trim()) {
      pushLog("warn", "No audio or transcript to process.");
      return;
    }

    setIsProcessing(true);
    try {
      if (audioBlob) {
        // Send audio to backend for Whisper processing
        const formData = new FormData();
        formData.append('audio_file', audioBlob, 'voice.wav');
        
        const response = await fetch('/api/voice-input', {
          method: 'POST',
          body: formData,
        });
        
        if (response.ok) {
          const result = await response.json();
          setTranscript(result.text);
          pushLog("success", `Voice transcribed: ${result.text}`);
        } else {
          throw new Error('Voice transcription failed');
        }
      }
    } catch (error) {
      pushLog("error", "Voice processing failed: " + error);
    } finally {
      setIsProcessing(false);
      setAudioBlob(null);
    }
  };

  // --- YouTube Summaries ---
  const [youtubeQuery, setYoutubeQuery] = useState("");
  const [youtubeResults, setYoutubeResults] = useState<YouTubeSummary[]>([]);
  const [isYoutubeLoading, setIsYoutubeLoading] = useState(false);

  const searchYouTube = async () => {
    if (!youtubeQuery.trim()) {
      pushLog("warn", "Please enter a YouTube search query.");
      return;
    }

    setIsYoutubeLoading(true);
    try {
      const response = await fetch(`/api/yt-summary?topic=${encodeURIComponent(youtubeQuery)}`);
      if (response.ok) {
        const result = await response.json();
        setYoutubeResults(result.summaries);
        pushLog("success", `Found ${result.count} YouTube videos for "${youtubeQuery}"`);
      } else {
        throw new Error('YouTube search failed');
      }
    } catch (error) {
      pushLog("error", "YouTube search failed: " + error);
    } finally {
      setIsYoutubeLoading(false);
    }
  };

  // --- Job Search ---
  const [jobRole, setJobRole] = useState("");
  const [jobLocation, setJobLocation] = useState("");
  const [jobResults, setJobResults] = useState<JobResult[]>([]);
  const [isJobSearching, setIsJobSearching] = useState(false);

  const searchJobs = async () => {
    if (!jobRole.trim() || !jobLocation.trim()) {
      pushLog("warn", "Please enter both job role and location.");
      return;
    }

    setIsJobSearching(true);
    try {
      const response = await fetch(`/api/job-search?role=${encodeURIComponent(jobRole)}&location=${encodeURIComponent(jobLocation)}`);
      if (response.ok) {
        const result = await response.json();
        setJobResults(result.jobs);
        pushLog("success", `Found ${result.count} jobs for ${jobRole} in ${jobLocation}`);
      } else {
        throw new Error('Job search failed');
      }
    } catch (error) {
      pushLog("error", "Job search failed: " + error);
    } finally {
      setIsJobSearching(false);
    }
  };

  // --- Reminders ---
  const [reminderText, setReminderText] = useState("");
  const [reminderTime, setReminderTime] = useState("08:00");
  const [reminderDate, setReminderDate] = useState(new Date().toISOString().split('T')[0]);
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [isReminderLoading, setIsReminderLoading] = useState(false);

  const loadReminders = async () => {
    setIsReminderLoading(true);
    try {
      const response = await fetch('/api/reminders');
      if (response.ok) {
        const result = await response.json();
        setReminders(result.reminders);
      }
    } catch (error) {
      pushLog("error", "Failed to load reminders: " + error);
    } finally {
      setIsReminderLoading(false);
    }
  };

  const createReminder = async () => {
    if (!reminderText.trim()) {
      pushLog("warn", "Please enter reminder text.");
      return;
    }

    try {
      const formData = new FormData();
      formData.append('task', reminderText);
      formData.append('reminder_time', reminderTime);
      formData.append('date', reminderDate);

      const response = await fetch('/api/reminder', {
        method: 'POST',
        body: formData,
      });

      if (response.ok) {
        const result = await response.json();
        pushLog("success", `Reminder set: ${reminderText} for ${reminderDate} at ${reminderTime}`);
        setReminderText("");
        loadReminders();
      } else {
        throw new Error('Reminder creation failed');
      }
    } catch (error) {
      pushLog("error", "Reminder creation failed: " + error);
    }
  };

  // --- Text-to-Speech ---
  const [ttsText, setTtsText] = useState("");
  const [isTtsLoading, setIsTtsLoading] = useState(false);
  const [ttsLanguage, setTtsLanguage] = useState("en");

  const speakText = async () => {
    if (!ttsText.trim()) {
      pushLog("warn", "Please enter text to convert to speech.");
      return;
    }

    setIsTtsLoading(true);
    try {
      const response = await fetch(`/api/speak?text=${encodeURIComponent(ttsText)}&language=${ttsLanguage}`);
      if (response.ok) {
        const blob = await response.blob();
        const url = URL.createObjectURL(blob);
        const audio = new Audio(url);
        audio.play();
        pushLog("success", `Text converted to speech and played.`);
      } else {
        throw new Error('Text-to-speech failed');
      }
    } catch (error) {
      pushLog("error", "Text-to-speech failed: " + error);
    } finally {
      setIsTtsLoading(false);
    }
  };

  // --- Settings (Phase 2) ---
  const [llmProvider, setLlmProvider] = useState<string>(() => ls.get("llmProvider", "openai"));
  const [voiceLibrary, setVoiceLibrary] = useState<string>(() => ls.get("voiceLibrary", "web-speech"));
  const [apiKeys, setApiKeys] = useState({
    openai: ls.get("openaiKey", ""),
    anthropic: ls.get("anthropicKey", ""),
    azure: ls.get("azureKey", ""),
    elevenlabs: ls.get("elevenlabsKey", "")
  });

  // Update settings in localStorage
  useEffect(() => {
    ls.set("llmProvider", llmProvider);
    ls.set("voiceLibrary", voiceLibrary);
    ls.set("openaiKey", apiKeys.openai);
    ls.set("anthropicKey", apiKeys.anthropic);
    ls.set("azureKey", apiKeys.azure);
    ls.set("elevenlabsKey", apiKeys.elevenlabs);
  }, [llmProvider, voiceLibrary, apiKeys]);

  const updateApiKey = (provider: string, key: string) => {
    setApiKeys(prev => ({ ...prev, [provider]: key }));
  };

  // --- Emergency (mock) ---
  const [emergencyOpen, setEmergencyOpen] = useState(false);
  const [emergencyType, setEmergencyType] = useState<"Ambulance" | "Police" | "Fire">("Ambulance");

  const triggerEmergency = () => {
    pushLog("warn", `EMERGENCY (${emergencyType}) requested. Simulating call → SMS → WhatsApp → Email.`);
    setEmergencyOpen(false);
  };

  // --- Security & Permissions (Phase 3) ---
  const requiresSecurityGate = (operation: string) => {
    const sensitiveOps = ['delete', 'remove', 'clear', 'send', 'message', 'whatsapp', 'email', 'emergency'];
    return sensitiveOps.some(op => operation.toLowerCase().includes(op));
  };

  const checkPermissions = (operation: string) => {
    if (!user) return false;
    if (userProfile?.role === 'admin') return true;
    
    // Regular users can't perform admin operations
    const adminOps = ['emergency', 'system', 'admin', 'configure'];
    const isAdminOp = adminOps.some(op => operation.toLowerCase().includes(op));
    
    return !isAdminOp;
  };

  const executeWithSecurity = (operation: string, description: string, action: () => void) => {
    if (!checkPermissions(operation)) {
      pushLog("error", "⛔ Permission denied. Admin access required.");
      return;
    }

    if (requiresSecurityGate(operation)) {
      setPendingOperation({
        operation,
        description,
        action
      });
      setShowSecurityGate(true);
    } else {
      action();
    }
  };

  const handleSecurityConfirm = () => {
    if (pendingOperation) {
      pendingOperation.action();
      setPendingOperation(null);
    }
    setShowSecurityGate(false);
  };

  // --- Task Execution (Phase 3 Enhanced) ---
  const executeTask = async (command: string) => {
    if (!user) {
      pushLog("warn", "🔐 Please sign in to execute tasks");
      setShowAuthModal(true);
      return;
    }

    const executeAction = async () => {
      pushLog("info", `🎯 Executing task: "${command}"`);
      
      try {
        // Log task activity
        await authService.logTaskActivity(user.uid, {
          taskType: 'task-execute',
          command: command,
          status: 'pending',
          details: { llmProvider, timestamp: new Date() }
        });

        const formData = new FormData();
        formData.append('command', command);
        formData.append('provider', llmProvider);
        formData.append('userId', user.uid);
        
        // Add API key if available
        const currentApiKey = apiKeys[llmProvider as keyof typeof apiKeys];
        if (currentApiKey) {
          formData.append('api_key', currentApiKey);
        }
        
        const response = await fetch('/api/task-execute', {
          method: 'POST',
          body: formData,
        });
        
        if (response.ok) {
          const result = await response.json();
          pushLog("success", result.message);
          
          // Log successful completion
          await authService.logTaskActivity(user.uid, {
            taskType: 'task-execute',
            command: command,
            status: 'success',
            details: result
          });
          
          // Update UI based on task type
          if (result.task_type === "reminder" && result.action === "created") {
            loadReminders();
          }
        } else {
          const error = await response.json();
          pushLog("error", `Task execution failed: ${error.detail}`);
          
          // Log error
          await authService.logTaskActivity(user.uid, {
            taskType: 'task-execute',
            command: command,
            status: 'error',
            details: error
          });
        }
      } catch (error) {
        pushLog("error", `Task execution failed: ${error}`);
        
        // Log error
        if (user) {
          await authService.logTaskActivity(user.uid, {
            taskType: 'task-execute',
            command: command,
            status: 'error',
            details: { error: String(error) }
          });
        }
      }
    };

    executeWithSecurity(
      `Execute Command: ${command}`,
      `This will execute the voice command: "${command}". This may trigger actions like sending messages or creating reminders.`,
      executeAction
    );
  };

  // --- Enhanced Functions with User Logging ---
  const logUserActivity = async (taskType: string, details: any, status: 'success' | 'error' | 'pending' = 'success') => {
    if (user) {
      await authService.logTaskActivity(user.uid, {
        taskType: taskType as any,
        status,
        details
      });
    }
  };

  // --- Sign Out ---
  const handleSignOut = async () => {
    executeWithSecurity(
      "Sign Out",
      "This will sign you out of AstraMind and clear your session.",
      async () => {
        try {
          await authService.signOut();
          pushLog("info", "👋 Signed out successfully");
          setNav("tasks");
        } catch (error) {
          pushLog("error", `Sign out failed: ${error}`);
        }
      }
    );
  };

  // --- Log helpers ---
  const pushLog = (level: LogRow["level"], msg: string) => {
    const row: LogRow = {
      id: Math.random().toString(36).slice(2),
      when: new Date().toISOString(),
      level,
      msg,
    };
    setLogs((p) => [row, ...p].slice(0, 200));
  };
  const clearLogs = () => setLogs([]);

  // Load reminders on mount
  useEffect(() => {
    loadReminders();
  }, []);

  return (
    <div className="min-h-screen w-full bg-background text-foreground transition-colors">
      {/* Header */}
      <header className="sticky top-0 z-30 border-b bg-background/70 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-4 py-3">
          <div className="flex items-center gap-2">
            <LayoutGrid className="h-6 w-6" />
            <span className="font-semibold tracking-tight">AstraMind • Phase 3 Security</span>
          </div>
          <div className="flex items-center gap-2">
            {/* Quick Voice Command Button */}
            <button
              className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm border-2 transition-colors ${
                listening 
                  ? "border-red-500 bg-red-50 text-red-700 dark:bg-red-900 dark:text-red-300" 
                  : "border-primary bg-primary text-primary-foreground hover:bg-primary/90"
              }`}
              onClick={listening ? stopListening : startListening}
            >
              <Mic className={`h-4 w-4 ${listening ? "animate-pulse" : ""}`} />
              {listening ? "Stop" : "Voice"}
            </button>
            
            <div className="mx-1 h-6 w-px bg-border" />
            
            {/* Authentication Status */}
            {user ? (
              <>
                <button
                  className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm hover:bg-accent"
                  onClick={() => setNav("profile")}
                >
                  <User className="h-4 w-4"/>
                  {userProfile?.displayName || user.email}
                  {userProfile?.role === 'admin' && (
                    <Shield className="h-3 w-3 text-purple-600" />
                  )}
                </button>
              </>
            ) : (
              <button
                className="flex items-center gap-2 rounded-lg border border-primary bg-primary text-primary-foreground px-3 py-2 text-sm hover:bg-primary/90"
                onClick={() => setShowAuthModal(true)}
              >
                <User className="h-4 w-4"/>
                Sign In
              </button>
            )}
            
            <button
              className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm hover:bg-accent"
              onClick={() => setNav("help")}
            >
              <HelpCircle className="h-5 w-5"/>
              Help
            </button>
            <button
              className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm hover:bg-accent"
              onClick={() => setNav("settings")}
            >
              <Settings className="h-5 w-5"/>
              Settings
            </button>
            <div className="mx-1 h-6 w-px bg-border" />
            <button
              className="flex items-center gap-2 rounded-lg border px-3 py-2 text-sm hover:bg-accent"
              onClick={() => setDark((d) => !d)}
            >
              {dark ? <SunMedium className="mr-2 h-4 w-4" /> : <Moon className="mr-2 h-4 w-4" />}
              {dark ? "Light" : "Dark"}
            </button>
            {user ? (
              <button 
                className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm hover:bg-accent text-red-600"
                onClick={handleSignOut}
              >
                <LogOut className="h-5 w-5"/>
                Sign Out
              </button>
            ) : null}
          </div>
        </div>
      </header>

      {/* Body */}
      <div className="mx-auto grid max-w-7xl grid-cols-1 gap-4 p-4 md:grid-cols-[240px_1fr]">
        {/* Sidebar */}
        <aside className="hidden rounded-2xl border md:block">
          <nav className="p-3">
            <button
              onClick={() => setNav("tasks")}
              className={`flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm transition-colors hover:bg-accent hover:text-accent-foreground ${
                nav === "tasks" ? "bg-accent text-accent-foreground" : ""
              }`}
            >
              <LayoutGrid className="h-4 w-4" />
              <span>Tasks</span>
            </button>
            <button
              onClick={() => setNav("settings")}
              className={`flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm transition-colors hover:bg-accent hover:text-accent-foreground ${
                nav === "settings" ? "bg-accent text-accent-foreground" : ""
              }`}
            >
              <Settings className="h-4 w-4" />
              <span>Settings</span>
            </button>
            {user && (
              <button
                onClick={() => setNav("profile")}
                className={`flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm transition-colors hover:bg-accent hover:text-accent-foreground ${
                  nav === "profile" ? "bg-accent text-accent-foreground" : ""
                }`}
              >
                <User className="h-4 w-4" />
                <span>Profile</span>
                {userProfile?.role === 'admin' && (
                  <Shield className="h-3 w-3 text-purple-600" />
                )}
              </button>
            )}
            <button
              onClick={() => setNav("help")}
              className={`flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm transition-colors hover:bg-accent hover:text-accent-foreground ${
                nav === "help" ? "bg-accent text-accent-foreground" : ""
              }`}
            >
              <HelpCircle className="h-4 w-4" />
              <span>Help</span>
            </button>
          </nav>
        </aside>

        {/* Main */}
        <main className="grid grid-cols-1 gap-4">
          {/* Voice Command Display */}
          {transcript && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              className="rounded-xl border bg-card p-4"
            >
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Mic className="h-4 w-4" />
                  <span className="font-medium text-sm">Voice Command</span>
                  <span className={`px-2 py-1 rounded text-xs ${
                    listening ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200" : "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200"
                  }`}>
                    {listening ? "Listening..." : "Captured"}
                  </span>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => executeTask(transcript)}
                    className="px-3 py-1 rounded bg-primary text-primary-foreground text-xs hover:bg-primary/90"
                  >
                    Execute
                  </button>
                  <button
                    onClick={() => setTranscript("")}
                    className="px-3 py-1 rounded border text-xs hover:bg-accent"
                  >
                    Clear
                  </button>
                </div>
              </div>
              <div className="rounded-lg border p-3 text-sm bg-muted/50">
                "{transcript}"
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                Try saying: "Set a reminder to call mom" or "Send a WhatsApp message"
              </p>
            </motion.div>
          )}

          {nav === "tasks" && (
            <>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
                {/* Voice Input */}
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.25 }}
                  className="rounded-xl border bg-card p-6"
                >
                  <div className="flex items-center gap-2 mb-4">
                    <Mic className="h-5 w-5" />
                    <h3 className="font-semibold">Voice Input</h3>
                  </div>
                  <p className="text-sm text-muted-foreground mb-4">
                    Record voice in Hindi, Marathi, or English. Uses OpenAI Whisper for transcription.
                  </p>
                  
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      {!listening ? (
                        <button
                          onClick={startListening}
                          className="flex items-center gap-2 rounded-lg bg-primary px-3 py-2 text-sm text-primary-foreground hover:bg-primary/90"
                        >
                          <PlayCircle className="h-4 w-4"/>
                          Start
                        </button>
                      ) : (
                        <button
                          onClick={stopListening}
                          className="flex items-center gap-2 rounded-lg bg-destructive px-3 py-2 text-sm text-destructive-foreground hover:bg-destructive/90"
                        >
                          <PauseCircle className="h-4 w-4"/>
                          Stop
                        </button>
                      )}
                      <span className={`px-2 py-1 rounded text-xs ${
                        listening ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200" : "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200"
                      }`}>
                        {listening ? "Recording" : "Idle"}
                      </span>
                    </div>

                    {audioBlob && (
                      <button
                        onClick={processVoiceInput}
                        disabled={isProcessing}
                        className="w-full rounded-lg bg-blue-600 px-3 py-2 text-sm text-white hover:bg-blue-700 disabled:opacity-50"
                      >
                        {isProcessing ? "Processing..." : "Process Audio with Whisper"}
                      </button>
                    )}

                    <div className="rounded-lg border p-3 text-sm min-h-[80px] whitespace-pre-wrap bg-muted/50">
                      {transcript || "Say something or record audio..."}
                    </div>

                    <input
                      placeholder="Or type manually"
                      value={transcript}
                      onChange={(e) => setTranscript(e.target.value)}
                      className="w-full rounded-lg border px-3 py-2 text-sm"
                    />
                  </div>
                </motion.div>

                {/* YouTube Summaries */}
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.25, delay: 0.1 }}
                  className="rounded-xl border bg-card p-6"
                >
                  <div className="flex items-center gap-2 mb-4">
                    <Youtube className="h-5 w-5" />
                    <h3 className="font-semibold">YouTube Summaries</h3>
                  </div>
                  <p className="text-sm text-muted-foreground mb-4">
                    Search and summarize YouTube videos on any topic using GPT-4.
                  </p>
                  
                  <div className="space-y-3">
                    <input
                      placeholder="e.g., AI sales assistant videos"
                      value={youtubeQuery}
                      onChange={(e) => setYoutubeQuery(e.target.value)}
                      className="w-full rounded-lg border px-3 py-2 text-sm"
                    />
                    <button
                      onClick={searchYouTube}
                      disabled={isYoutubeLoading}
                      className="w-full rounded-lg bg-red-600 px-3 py-2 text-sm text-white hover:bg-red-700 disabled:opacity-50"
                    >
                      {isYoutubeLoading ? "Searching..." : "Search & Summarize"}
                    </button>

                    {youtubeResults.length > 0 && (
                      <div className="space-y-2 max-h-40 overflow-y-auto">
                        {youtubeResults.map((result, index) => (
                          <div key={index} className="rounded-lg border p-2 text-xs">
                            <div className="font-medium">{result.title}</div>
                            <div className="text-muted-foreground">{result.summary}</div>
                            <a
                              href={result.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-blue-600 hover:underline"
                            >
                              Watch Video
                            </a>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </motion.div>

                {/* Job Search */}
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.25, delay: 0.2 }}
                  className="rounded-xl border bg-card p-6"
                >
                  <div className="flex items-center gap-2 mb-4">
                    <Briefcase className="h-5 w-5" />
                    <h3 className="font-semibold">Job Search</h3>
                  </div>
                  <p className="text-sm text-muted-foreground mb-4">
                    Find and summarize job opportunities with AI-powered insights.
                  </p>
                  
                  <div className="space-y-3">
                    <input
                      placeholder="Job role (e.g., Java Architect)"
                      value={jobRole}
                      onChange={(e) => setJobRole(e.target.value)}
                      className="w-full rounded-lg border px-3 py-2 text-sm"
                    />
                    <input
                      placeholder="Location (e.g., London)"
                      value={jobLocation}
                      onChange={(e) => setJobLocation(e.target.value)}
                      className="w-full rounded-lg border px-3 py-2 text-sm"
                    />
                    <button
                      onClick={searchJobs}
                      disabled={isJobSearching}
                      className="w-full rounded-lg bg-blue-600 px-3 py-2 text-sm text-white hover:bg-blue-700 disabled:opacity-50"
                    >
                      {isJobSearching ? "Searching..." : "Find Jobs"}
                    </button>

                    {jobResults.length > 0 && (
                      <div className="space-y-2 max-h-40 overflow-y-auto">
                        {jobResults.map((job, index) => (
                          <div key={index} className="rounded-lg border p-2 text-xs">
                            <div className="font-medium">{job.title}</div>
                            <div className="text-muted-foreground">{job.company} • {job.location}</div>
                            <div className="text-muted-foreground">{job.ai_summary}</div>
                            <a
                              href={job.apply_link}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-blue-600 hover:underline"
                            >
                              Apply
                            </a>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </motion.div>

                {/* Reminders */}
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.25, delay: 0.3 }}
                  className="rounded-xl border bg-card p-6"
                >
                  <div className="flex items-center gap-2 mb-4">
                    <BellRing className="h-5 w-5" />
                    <h3 className="font-semibold">Smart Reminders</h3>
                  </div>
                  <p className="text-sm text-muted-foreground mb-4">
                    Set reminders with SQLite storage and optional Google Calendar sync.
                  </p>
                  
                  <div className="space-y-3">
                    <input
                      placeholder="Reminder text"
                      value={reminderText}
                      onChange={(e) => setReminderText(e.target.value)}
                      className="w-full rounded-lg border px-3 py-2 text-sm"
                    />
                    <div className="grid grid-cols-2 gap-2">
                      <input
                        type="time"
                        value={reminderTime}
                        onChange={(e) => setReminderTime(e.target.value)}
                        className="rounded-lg border px-3 py-2 text-sm"
                      />
                      <input
                        type="date"
                        value={reminderDate}
                        onChange={(e) => setReminderDate(e.target.value)}
                        className="rounded-lg border px-3 py-2 text-sm"
                      />
                    </div>
                    <button
                      onClick={createReminder}
                      className="w-full rounded-lg bg-green-600 px-3 py-2 text-sm text-white hover:bg-green-700"
                    >
                      Set Reminder
                    </button>

                    {reminders.length > 0 && (
                      <div className="space-y-2 max-h-32 overflow-y-auto">
                        <div className="text-xs font-medium">Active Reminders:</div>
                        {reminders.map((reminder) => (
                          <div key={reminder.id} className="rounded-lg border p-2 text-xs">
                            <div className="font-medium">{reminder.task}</div>
                            <div className="text-muted-foreground">
                              {new Date(reminder.reminder_time).toLocaleString()}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </motion.div>

                {/* Text-to-Speech */}
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.25, delay: 0.4 }}
                  className="rounded-xl border bg-card p-6"
                >
                  <div className="flex items-center gap-2 mb-4">
                    <Volume2 className="h-5 w-5" />
                    <h3 className="font-semibold">Text-to-Speech</h3>
                  </div>
                  <p className="text-sm text-muted-foreground mb-4">
                    Convert text to speech using gTTS with multi-language support.
                  </p>
                  
                  <div className="space-y-3">
                    <select
                      value={ttsLanguage}
                      onChange={(e) => setTtsLanguage(e.target.value)}
                      className="w-full rounded-lg border px-3 py-2 text-sm"
                    >
                      <option value="en">English</option>
                      <option value="hi">Hindi</option>
                      <option value="mr">Marathi</option>
                    </select>
                    <textarea
                      placeholder="Enter text to convert to speech..."
                      value={ttsText}
                      onChange={(e) => setTtsText(e.target.value)}
                      rows={3}
                      className="w-full rounded-lg border px-3 py-2 text-sm resize-none"
                    />
                    <button
                      onClick={speakText}
                      disabled={isTtsLoading}
                      className="w-full rounded-lg bg-purple-600 px-3 py-2 text-sm text-white hover:bg-purple-700 disabled:opacity-50"
                    >
                      {isTtsLoading ? "Converting..." : "Convert to Speech"}
                    </button>
                  </div>
                </motion.div>

                {/* Emergency */}
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.25, delay: 0.5 }}
                  className="rounded-xl border bg-card p-6"
                >
                  <div className="flex items-center gap-2 mb-4">
                    <PhoneCall className="h-5 w-5" />
                    <h3 className="font-semibold">Emergency (Mock)</h3>
                  </div>
                  <p className="text-sm text-muted-foreground mb-4">
                    Simulate emergency protocols with fallback chain.
                  </p>
                  
                  <div className="space-y-3">
                    <select
                      value={emergencyType}
                      onChange={(e) => setEmergencyType(e.target.value as any)}
                      className="w-full rounded-lg border px-3 py-2 text-sm"
                    >
                      <option>Ambulance</option>
                      <option>Police</option>
                      <option>Fire</option>
                    </select>
                    <button
                      onClick={() => setEmergencyOpen(true)}
                      className="w-full rounded-lg bg-destructive px-3 py-2 text-sm text-destructive-foreground hover:bg-destructive/90"
                    >
                      Initiate Emergency
                    </button>
                  </div>
                </motion.div>
              </div>

              {/* Logs */}
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.25, delay: 0.6 }}
                className="rounded-xl border bg-card p-6"
              >
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="font-semibold">Execution Log</h3>
                    <p className="text-sm text-muted-foreground">Real-time status, errors, and confirmations</p>
                  </div>
                  <button
                    onClick={clearLogs}
                    className="flex items-center gap-2 rounded-lg border px-3 py-2 text-sm hover:bg-accent"
                  >
                    <Trash2 className="h-4 w-4"/>
                    Clear
                  </button>
                </div>
                
                <div className="rounded-lg border bg-muted/50 max-h-64 overflow-y-auto">
                  {logs.length === 0 ? (
                    <div className="p-4 text-sm text-muted-foreground text-center">
                      No logs yet. Try a task above.
                    </div>
                  ) : (
                    <div className="divide-y">
                      {logs.map((row) => (
                        <div key={row.id} className="flex items-start justify-between gap-3 p-3 text-sm">
                          <div className="flex min-w-0 flex-col">
                            <div className="flex items-center gap-2">
                              <span className={`px-2 py-1 rounded text-xs ${
                                row.level === 'info' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200' :
                                row.level === 'warn' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200' :
                                row.level === 'error' ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200' :
                                'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                              }`}>
                                {row.level.toUpperCase()}
                              </span>
                              <span className="truncate font-medium">{row.msg}</span>
                            </div>
                            <span className="text-xs text-muted-foreground">
                              {new Date(row.when).toLocaleString()}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </motion.div>
            </>
          )}

          {nav === "settings" && (
            <div className="space-y-6">
              {/* Header */}
              <div className="rounded-xl border bg-card p-6">
                <h3 className="font-semibold mb-2">Settings - Phase 2</h3>
                <p className="text-sm text-muted-foreground">
                  Configure AI providers, voice libraries, and API keys for enhanced functionality.
                </p>
              </div>

              {/* AI Provider Settings */}
              <div className="rounded-xl border bg-card p-6">
                <h4 className="font-medium mb-4">AI Provider Configuration</h4>
                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <label className="block text-sm font-medium mb-2">LLM Provider</label>
                    <select
                      value={llmProvider}
                      onChange={(e) => setLlmProvider(e.target.value)}
                      className="w-full rounded-lg border px-3 py-2 text-sm bg-background"
                    >
                      <option value="openai">OpenAI (GPT-4, GPT-3.5)</option>
                      <option value="anthropic">Anthropic (Claude)</option>
                      <option value="azure">Azure OpenAI</option>
                      <option value="local">Local LLM (Ollama)</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium mb-2">Voice Library</label>
                    <select
                      value={voiceLibrary}
                      onChange={(e) => setVoiceLibrary(e.target.value)}
                      className="w-full rounded-lg border px-3 py-2 text-sm bg-background"
                    >
                      <option value="web-speech">Web Speech API</option>
                      <option value="azure-tts">Azure Text-to-Speech</option>
                      <option value="elevenlabs">ElevenLabs</option>
                      <option value="gtts">Google TTS (Current)</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* API Keys */}
              <div className="rounded-xl border bg-card p-6">
                <h4 className="font-medium mb-4">API Keys (Securely stored in localStorage)</h4>
                <div className="grid gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">OpenAI API Key</label>
                    <input
                      type="password"
                      placeholder="sk-..."
                      value={apiKeys.openai}
                      onChange={(e) => updateApiKey("openai", e.target.value)}
                      className="w-full rounded-lg border px-3 py-2 text-sm bg-background"
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      Used for GPT models and Whisper speech recognition
                    </p>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium mb-2">Anthropic API Key</label>
                    <input
                      type="password"
                      placeholder="sk-ant-..."
                      value={apiKeys.anthropic}
                      onChange={(e) => updateApiKey("anthropic", e.target.value)}
                      className="w-full rounded-lg border px-3 py-2 text-sm bg-background"
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      Used for Claude models and advanced reasoning
                    </p>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium mb-2">Azure API Key</label>
                    <input
                      type="password"
                      placeholder="Azure subscription key..."
                      value={apiKeys.azure}
                      onChange={(e) => updateApiKey("azure", e.target.value)}
                      className="w-full rounded-lg border px-3 py-2 text-sm bg-background"
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      Used for Azure OpenAI and TTS services
                    </p>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium mb-2">ElevenLabs API Key</label>
                    <input
                      type="password"
                      placeholder="ElevenLabs API key..."
                      value={apiKeys.elevenlabs}
                      onChange={(e) => updateApiKey("elevenlabs", e.target.value)}
                      className="w-full rounded-lg border px-3 py-2 text-sm bg-background"
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      Used for high-quality voice synthesis
                    </p>
                  </div>
                </div>
              </div>

              {/* Current Configuration */}
              <div className="rounded-xl border bg-card p-6">
                <h4 className="font-medium mb-4">Current Configuration</h4>
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="rounded-lg border p-3 bg-muted/50">
                    <div className="font-medium text-sm">Active LLM Provider</div>
                    <div className="text-sm text-muted-foreground capitalize">{llmProvider}</div>
                    <div className="text-xs text-muted-foreground mt-1">
                      {apiKeys[llmProvider as keyof typeof apiKeys] ? "✅ API key configured" : "❌ API key missing"}
                    </div>
                  </div>
                  
                  <div className="rounded-lg border p-3 bg-muted/50">
                    <div className="font-medium text-sm">Active Voice Library</div>
                    <div className="text-sm text-muted-foreground">{voiceLibrary.replace("-", " ").toUpperCase()}</div>
                    <div className="text-xs text-muted-foreground mt-1">
                      {voiceLibrary === "web-speech" || voiceLibrary === "gtts" ? "✅ Always available" : 
                       apiKeys[voiceLibrary === "azure-tts" ? "azure" : "elevenlabs"] ? "✅ API key configured" : "❌ API key missing"}
                    </div>
                  </div>
                  
                  <div className="rounded-lg border p-3 bg-muted/50">
                    <div className="font-medium text-sm">Theme</div>
                    <div className="text-sm text-muted-foreground">
                      {dark ? "Dark" : "Light"} mode
                    </div>
                    <div className="text-xs text-muted-foreground mt-1">
                      Toggle in header
                    </div>
                  </div>
                  
                  <div className="rounded-lg border p-3 bg-muted/50">
                    <div className="font-medium text-sm">Version</div>
                    <div className="text-sm text-muted-foreground">Phase 2 MVP</div>
                    <div className="text-xs text-muted-foreground mt-1">
                      Enhanced AI & Voice Integration
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {nav === "profile" && user && (
            <ProfilePage
              user={user}
              userProfile={userProfile}
              apiKeys={apiKeys}
            />
          )}

          {nav === "help" && (
            <div className="rounded-xl border bg-card p-6">
              <h3 className="font-semibold mb-4">Help & Tips</h3>
              <p className="text-sm text-muted-foreground mb-6">Quick guide to get started</p>
              
              <div className="space-y-4">
                <div className="rounded-lg border p-4">
                  <h4 className="font-medium mb-2">Voice Input</h4>
                  <p className="text-sm text-muted-foreground">
                    Click "Start" to begin recording. Speak in Hindi, Marathi, or English. 
                    The audio will be processed using OpenAI Whisper for accurate transcription.
                  </p>
                </div>
                
                <div className="rounded-lg border p-4">
                  <h4 className="font-medium mb-2">YouTube Summaries</h4>
                  <p className="text-sm text-muted-foreground">
                    Enter a search topic and get AI-generated summaries of the top 5 videos. 
                    Each summary is under 100 words and stored in the local database.
                  </p>
                </div>
                
                <div className="rounded-lg border p-4">
                  <h4 className="font-medium mb-2">Job Search</h4>
                  <p className="text-sm text-muted-foreground">
                    Search for jobs by role and location. Get AI-powered summaries of each 
                    position with company details and application links.
                  </p>
                </div>
                
                <div className="rounded-lg border p-4">
                  <h4 className="font-medium mb-2">Reminders</h4>
                  <p className="text-sm text-muted-foreground">
                    Set reminders with specific dates and times. All reminders are stored 
                    locally in SQLite and can optionally sync with Google Calendar.
                  </p>
                </div>
                
                <div className="rounded-lg border p-4">
                  <h4 className="font-medium mb-2">Text-to-Speech</h4>
                  <p className="text-sm text-muted-foreground">
                    Convert any text to speech in multiple languages. Uses gTTS for 
                    high-quality audio output that can be played directly in the browser.
                  </p>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>

      {/* Emergency Dialog */}
      {emergencyOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-background rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="font-semibold mb-2">Confirm Emergency</h3>
            <p className="text-sm text-muted-foreground mb-4">
              High-risk action. In later phases this requires explicit voice confirmation.
            </p>
            <div className="space-y-3">
              <div className="flex items-center justify-between rounded-lg border p-3">
                <span>Type</span>
                <select
                  className="rounded-md border bg-background px-2 py-1"
                  value={emergencyType}
                  onChange={(e) => setEmergencyType(e.target.value as any)}
                >
                  <option>Ambulance</option>
                  <option>Police</option>
                  <option>Fire</option>
                </select>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={triggerEmergency}
                  className="flex-1 rounded-lg bg-destructive px-3 py-2 text-sm text-destructive-foreground hover:bg-destructive/90"
                >
                  Confirm & Simulate
                </button>
                <button
                  onClick={() => setEmergencyOpen(false)}
                  className="flex-1 rounded-lg border px-3 py-2 text-sm hover:bg-accent"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Authentication Modal */}
      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        onSuccess={(user) => {
          pushLog("success", `👋 Welcome ${user.displayName || user.email}!`);
          setShowAuthModal(false);
        }}
      />

      {/* Security Gate */}
      <SecurityGate
        isOpen={showSecurityGate}
        onClose={() => {
          setShowSecurityGate(false);
          setPendingOperation(null);
        }}
        onConfirm={handleSecurityConfirm}
        operation={pendingOperation?.operation || ""}
        description={pendingOperation?.description || ""}
        requireVoiceConfirmation={true}
      />

      {/* Loading Overlay */}
      {authLoading && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-background rounded-lg p-6 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading AstraMind...</p>
          </div>
        </div>
      )}
    </div>
  );
}
