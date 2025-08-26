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
} from "lucide-react";

// --- shadcn/ui imports ---
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";

// -------------------------------------------------------------
// OUTSKILL – Phase 1 MVP Dashboard
// - Sidebar (Tasks, Settings, Help)
// - Central dashboard with 3 core task cards
// - Dark/Light mode toggle (persisted)
// - Task Execution Logs
// - Responsive (desktop + mobile)
// -------------------------------------------------------------

// Simple local storage helpers
const ls = {
  get: (k, def = null) => {
    try {
      const v = localStorage.getItem(k);
      return v !== null ? JSON.parse(v) : def;
    } catch {
      return def;
    }
  },
  set: (k, v) => {
    try {
      localStorage.setItem(k, JSON.stringify(v));
    } catch {}
  },
};

// Types
type LogRow = {
  id: string;
  when: string; // ISO
  level: "info" | "warn" | "error" | "success";
  msg: string;
};

type NavKey = "tasks" | "settings" | "help";

export default function App() {
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

  // --- Voice (placeholder) ---
  const [listening, setListening] = useState(false);
  const [transcript, setTranscript] = useState("");
  const recognitionRef = useRef<any>(null);

  const canUseWebSpeech = useMemo(() => typeof window !== "undefined" && (window as any).webkitSpeechRecognition, []);

  const startListening = () => {
    if (!canUseWebSpeech) {
      pushLog("warn", "Web Speech API not available in this browser. This is a placeholder.");
      return;
    }
    const Rec = (window as any).webkitSpeechRecognition;
    const rec = new Rec();
    recognitionRef.current = rec;
    rec.lang = "en-IN"; // default; will become user selectable in Phase 2
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
  const stopListening = () => {
    recognitionRef.current?.stop?.();
    setListening(false);
    pushLog("info", "Voice dictation stopped.");
  };

  // --- Reminders (mock) ---
  const [reminderText, setReminderText] = useState("");
  const [reminderMin, setReminderMin] = useState<number>(15);
  const reminderTimerRef = useRef<any>(null);

  const scheduleReminder = () => {
    if (!reminderText.trim()) {
      pushLog("warn", "Please enter reminder text.");
      return;
    }
    clearTimeout(reminderTimerRef.current);
    const ms = Math.max(1, Math.floor(reminderMin)) * 60 * 1000;
    reminderTimerRef.current = setTimeout(() => {
      pushLog("success", `Reminder: ${reminderText}`);
      // Phase 2+: trigger OS notification / TTS here
    }, ms);
    pushLog("info", `Reminder set for ${reminderMin} min(s): "${reminderText}"`);
    setReminderText("");
  };

  // --- Emergency (mock) with fallback chain ---
  const [emergencyOpen, setEmergencyOpen] = useState(false);
  const [emergencyType, setEmergencyType] = useState<"Ambulance" | "Police" | "Fire">("Ambulance");

  const triggerEmergency = () => {
    // Phase 1: simulate only
    pushLog("warn", `EMERGENCY (${emergencyType}) requested. Simulating call → SMS → WhatsApp → Email.`);
    setEmergencyOpen(false);
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

  return (
    <TooltipProvider>
      <div className="min-h-screen w-full bg-background text-foreground transition-colors">
        {/* Header */}
        <header className="sticky top-0 z-30 border-b bg-background/70 backdrop-blur supports-[backdrop-filter]:bg-background/60">
          <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-4 py-3">
            <div className="flex items-center gap-2">
              <LayoutGrid className="h-6 w-6" />
              <span className="font-semibold tracking-tight">OUTSKILL • Phase 1 Dashboard</span>
            </div>
            <div className="flex items-center gap-2">
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="icon" onClick={() => setNav("help")}> <HelpCircle className="h-5 w-5"/> </Button>
                </TooltipTrigger>
                <TooltipContent>Help</TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="icon" onClick={() => setNav("settings")}> <Settings className="h-5 w-5"/> </Button>
                </TooltipTrigger>
                <TooltipContent>Settings</TooltipContent>
              </Tooltip>
              <Separator orientation="vertical" className="mx-1 h-6" />
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="outline" size="sm" onClick={() => setDark((d) => !d)}>
                    {dark ? <SunMedium className="mr-2 h-4 w-4" /> : <Moon className="mr-2 h-4 w-4" />} {dark ? "Light" : "Dark"}
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Toggle theme</TooltipContent>
              </Tooltip>
              <Button variant="ghost" size="icon"> <LogOut className="h-5 w-5"/> </Button>
            </div>
          </div>
        </header>

        {/* Body */}
        <div className="mx-auto grid max-w-7xl grid-cols-1 gap-4 p-4 md:grid-cols-[240px_1fr]">
          {/* Sidebar */}
          <aside className="hidden rounded-2xl border md:block">
            <nav className="p-3">
              <SidebarItem active={nav === "tasks"} onClick={() => setNav("tasks")} label="Tasks" icon={<LayoutGrid className="h-4 w-4" />} />
              <SidebarItem active={nav === "settings"} onClick={() => setNav("settings")} label="Settings" icon={<Settings className="h-4 w-4" />} />
              <SidebarItem active={nav === "help"} onClick={() => setNav("help")} label="Help" icon={<HelpCircle className="h-4 w-4" />} />
            </nav>
          </aside>

          {/* Main */}
          <main className="grid grid-cols-1 gap-4">
            {nav === "tasks" && (
              <>
                <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                  {/* Voice Dictation */}
                  <TaskCard
                    title="Voice Dictation"
                    desc="Start/stop microphone and preview transcript (placeholder)."
                    icon={<Mic className="h-5 w-5" />}
                    footer={
                      <div className="flex items-center gap-2">
                        {!listening ? (
                          <Button onClick={startListening} size="sm"> <PlayCircle className="mr-2 h-4 w-4"/> Start </Button>
                        ) : (
                          <Button onClick={stopListening} variant="destructive" size="sm"> <PauseCircle className="mr-2 h-4 w-4"/> Stop </Button>
                        )}
                        <Badge variant={listening ? "default" : "secondary"}>{listening ? "Listening" : "Idle"}</Badge>
                      </div>
                    }
                  >
                    <div className="rounded-lg border p-2 text-sm min-h-[72px] whitespace-pre-wrap">{transcript || "Say something… (or use manual input below)"}</div>
                    <div className="mt-2">
                      <Input placeholder="Type transcript manually (for demo)" value={transcript} onChange={(e) => setTranscript(e.target.value)} />
                    </div>
                  </TaskCard>

                  {/* Reminder */}
                  <TaskCard
                    title="Set Reminder"
                    desc="Create a quick reminder (mock)."
                    icon={<BellRing className="h-5 w-5" />}
                    footer={
                      <div className="flex items-center gap-2">
                        <Button size="sm" onClick={scheduleReminder}><CheckCircle2 className="mr-2 h-4 w-4"/>Schedule</Button>
                      </div>
                    }
                  >
                    <div className="grid grid-cols-1 gap-2 md:grid-cols-[1fr_140px]">
                      <Input placeholder="Reminder text" value={reminderText} onChange={(e) => setReminderText(e.target.value)} />
                      <Input type="number" min={1} max={1440} value={reminderMin} onChange={(e) => setReminderMin(Number(e.target.value))} placeholder="Minutes"/>
                    </div>
                    <p className="mt-1 text-xs text-muted-foreground">Phase 2+: will add system notifications + TTS in EN/HI/MR.</p>
                  </TaskCard>

                  {/* Emergency */}
                  <TaskCard
                    title="Emergency Call (Mock)"
                    desc="Simulate call → SMS/WhatsApp → Email fallback."
                    icon={<PhoneCall className="h-5 w-5" />}
                    footer={
                      <Dialog open={emergencyOpen} onOpenChange={setEmergencyOpen}>
                        <DialogTrigger asChild>
                          <Button size="sm" variant="destructive">Initiate</Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Confirm Emergency</DialogTitle>
                            <DialogDescription>High-risk action. In later phases this requires explicit voice confirmation.</DialogDescription>
                          </DialogHeader>
                          <div className="mt-2 grid gap-2">
                            <div className="flex items-center justify-between rounded-lg border p-2">
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
                            <Button onClick={triggerEmergency} variant="destructive">Confirm & Simulate</Button>
                          </div>
                        </DialogContent>
                      </Dialog>
                    }
                  >
                    <p className="text-sm text-muted-foreground">Phase 2+: Add location sharing & multilingual prompts (EN/HI/MR).</p>
                  </TaskCard>
                </div>

                {/* Logs */}
                <Card className="overflow-hidden">
                  <CardHeader className="flex flex-row items-center justify-between">
                    <div>
                      <CardTitle>Execution Log</CardTitle>
                      <CardDescription>Realtime status, errors, confirmations.</CardDescription>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button variant="outline" size="sm" onClick={clearLogs}> <Trash2 className="mr-2 h-4 w-4"/> Clear </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <ScrollArea className="h-64 rounded-md border">
                      <div className="divide-y">
                        {logs.length === 0 && (
                          <div className="p-3 text-sm text-muted-foreground">No logs yet. Try a task above.</div>
                        )}
                        {logs.map((r) => (
                          <LogRowView key={r.id} row={r} />
                        ))}
                      </div>
                    </ScrollArea>
                  </CardContent>
                </Card>
              </>
            )}

            {nav === "settings" && <SettingsView />}
            {nav === "help" && <HelpView />}
          </main>
        </div>
      </div>
    </TooltipProvider>
  );
}

function SidebarItem({
  active,
  onClick,
  label,
  icon,
}: {
  active?: boolean;
  onClick?: () => void;
  label: string;
  icon: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm transition-colors hover:bg-accent hover:text-accent-foreground ${
        active ? "bg-accent text-accent-foreground" : ""
      }`}
    >
      {icon}
      <span>{label}</span>
    </button>
  );
}

function TaskCard({
  title,
  desc,
  icon,
  footer,
  children,
}: {
  title: string;
  desc?: string;
  icon?: React.ReactNode;
  footer?: React.ReactNode;
  children?: React.ReactNode;
}) {
  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25 }}>
      <Card className="h-full">
        <CardHeader>
          <div className="flex items-center gap-2">
            {icon}
            <CardTitle className="text-base">{title}</CardTitle>
          </div>
          {desc && <CardDescription>{desc}</CardDescription>}
        </CardHeader>
        <CardContent>{children}</CardContent>
        <CardFooter className="flex items-center justify-between">{footer}</CardFooter>
      </Card>
    </motion.div>
  );
}

function LogRowView({ row }: { row: LogRow }) {
  const levelBadge = {
    info: <Badge variant="secondary">INFO</Badge>,
    warn: <Badge variant="destructive">WARN</Badge>,
    error: <Badge variant="destructive">ERROR</Badge>,
    success: <Badge>OK</Badge>,
  }[row.level];

  return (
    <div className="flex items-start justify-between gap-3 p-3 text-sm">
      <div className="flex min-w-0 flex-col">
        <div className="flex items-center gap-2">
          {levelBadge}
          <span className="truncate font-medium">{row.msg}</span>
        </div>
        <span className="text-xs text-muted-foreground">{new Date(row.when).toLocaleString()}</span>
      </div>
    </div>
  );
}

function SettingsView() {
  const [dark] = useState<boolean>(() => ls.get("themeDark", true));
  return (
    <Card>
      <CardHeader>
        <CardTitle>Settings</CardTitle>
        <CardDescription>These are Phase 1 placeholders. Phase 2 adds providers & keys.</CardDescription>
      </CardHeader>
      <CardContent className="grid gap-4 md:grid-cols-2">
        <div className="rounded-xl border p-3">
          <div className="mb-2 flex items-center justify-between">
            <div>
              <div className="font-medium">Theme</div>
              <div className="text-sm text-muted-foreground">Currently {dark ? "Dark" : "Light"} (toggle in header)</div>
            </div>
            <Switch checked={dark} disabled />
          </div>
          <p className="text-xs text-muted-foreground">In Phase 2+: choose LLM, voice engine, and add API keys here.</p>
        </div>
        <div className="rounded-xl border p-3">
          <div className="mb-2 font-medium">About</div>
          <p className="text-sm text-muted-foreground">OUTSKILL MVP—agentic assistant scaffold with logs and secure UX patterns.</p>
        </div>
      </CardContent>
    </Card>
  );
}

function HelpView() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Help & Tips</CardTitle>
        <CardDescription>Quick guide to get started</CardDescription>
      </CardHeader>
      <CardContent className="grid gap-4">
        <Tip title="Run a task" desc="Try Voice Dictation or set a Reminder. Watch the Execution Log below update in real-time." />
        <Tip title="Dark/Light mode" desc="Use the toggle in the header. Your preference is saved to localStorage." />
        <Tip title=