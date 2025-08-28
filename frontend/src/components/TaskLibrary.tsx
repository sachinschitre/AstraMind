import React, { useState, useEffect } from 'react';
import { motion, Reorder } from 'framer-motion';
import { 
  Briefcase, 
  Phone, 
  UserCheck, 
  AlertTriangle,
  Play,
  Pause,
  Clock,
  CheckCircle,
  XCircle,
  MoreVertical,
  Settings,
  Trash2,
  Copy,
  BarChart3,
  Bot,
  Globe,
  Zap
} from 'lucide-react';

export interface TaskCard {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  category: 'automation' | 'analysis' | 'communication' | 'emergency';
  estimatedTime: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  status: 'ready' | 'running' | 'completed' | 'failed';
  progress?: number;
  color: string;
  automationFeatures: string[];
}

interface TaskLibraryProps {
  user: any;
  userProfile: any;
  onTaskExecute: (taskId: string) => void;
  onTaskProgress?: (taskId: string, progress: number, logs: string[]) => void;
}

export default function TaskLibrary({ user, userProfile, onTaskExecute, onTaskProgress }: TaskLibraryProps) {
  const [tasks, setTasks] = useState<TaskCard[]>([
    {
      id: 'job-search-automation',
      title: 'Job Search Automation',
      description: 'Automated job search across LinkedIn, Indeed, and company websites with AI-powered application filtering',
      icon: <Briefcase className="h-6 w-6" />,
      category: 'automation',
      estimatedTime: '15-30 min',
      difficulty: 'Medium',
      status: 'ready',
      color: 'bg-blue-500',
      automationFeatures: ['LinkedIn scraping', 'Resume matching', 'Auto-apply', 'Email follow-ups']
    },
    {
      id: 'sales-call-analysis',
      title: 'Sales Call Analysis',
      description: 'AI-powered analysis of sales calls with sentiment analysis, key insights, and follow-up recommendations',
      icon: <BarChart3 className="h-6 w-6" />,
      category: 'analysis',
      estimatedTime: '5-10 min',
      difficulty: 'Easy',
      status: 'ready',
      color: 'bg-green-500',
      automationFeatures: ['Voice transcription', 'Sentiment analysis', 'Key insights', 'Action items']
    },
    {
      id: 'mock-interview',
      title: 'Mock Interview Coach',
      description: 'Interactive mock interview with AI feedback, question generation, and performance analytics',
      icon: <UserCheck className="h-6 w-6" />,
      category: 'analysis',
      estimatedTime: '20-45 min',
      difficulty: 'Medium',
      status: 'ready',
      color: 'bg-purple-500',
      automationFeatures: ['Question generation', 'Response analysis', 'Body language tips', 'Performance scoring']
    },
    {
      id: 'emergency-protocol',
      title: 'Emergency Call Protocol',
      description: 'Multi-channel emergency communication with API calling, SMS, WhatsApp, and email fallback chain',
      icon: <AlertTriangle className="h-6 w-6" />,
      category: 'emergency',
      estimatedTime: '2-5 min',
      difficulty: 'Easy',
      status: 'ready',
      color: 'bg-red-500',
      automationFeatures: ['API calling', 'SMS fallback', 'WhatsApp backup', 'Email notification']
    },
    {
      id: 'browser-automation',
      title: 'Browser Automation',
      description: 'Web automation tasks using Puppeteer for form filling, data extraction, and workflow automation',
      icon: <Globe className="h-6 w-6" />,
      category: 'automation',
      estimatedTime: '10-20 min',
      difficulty: 'Hard',
      status: 'ready',
      color: 'bg-orange-500',
      automationFeatures: ['Form automation', 'Data scraping', 'Screenshot capture', 'PDF generation']
    },
    {
      id: 'ai-workflow-builder',
      title: 'AI Workflow Builder',
      description: 'Create custom AI workflows with drag-and-drop interface and multi-step automation chains',
      icon: <Bot className="h-6 w-6" />,
      category: 'automation',
      estimatedTime: '30-60 min',
      difficulty: 'Hard',
      status: 'ready',
      color: 'bg-indigo-500',
      automationFeatures: ['Visual workflow', 'Chain automation', 'Custom triggers', 'API integrations']
    }
  ]);

  const [runningTasks, setRunningTasks] = useState<Set<string>>(new Set());
  const [taskProgress, setTaskProgress] = useState<Record<string, { progress: number; logs: string[] }>>({});

  const executeTask = async (task: TaskCard) => {
    if (!user) {
      alert('Please sign in to execute tasks');
      return;
    }

    if (runningTasks.has(task.id)) {
      return; // Already running
    }

    // Start task execution
    setRunningTasks(prev => new Set(prev).add(task.id));
    setTasks(prev => prev.map(t => t.id === task.id ? { ...t, status: 'running', progress: 0 } : t));
    setTaskProgress(prev => ({ ...prev, [task.id]: { progress: 0, logs: [`Starting ${task.title}...`] } }));

    try {
      // Simulate task execution with progress updates
      onTaskExecute(task.id);
      
      // Simulate progress updates
      for (let i = 0; i <= 100; i += 10) {
        await new Promise(resolve => setTimeout(resolve, 500));
        setTasks(prev => prev.map(t => t.id === task.id ? { ...t, progress: i } : t));
        setTaskProgress(prev => ({
          ...prev,
          [task.id]: {
            progress: i,
            logs: [
              ...prev[task.id]?.logs || [],
              `Progress: ${i}% - ${getProgressMessage(task.category, i)}`
            ]
          }
        }));

        if (onTaskProgress) {
          onTaskProgress(task.id, i, taskProgress[task.id]?.logs || []);
        }
      }

      // Complete task
      setTasks(prev => prev.map(t => t.id === task.id ? { ...t, status: 'completed', progress: 100 } : t));
      setTaskProgress(prev => ({
        ...prev,
        [task.id]: {
          progress: 100,
          logs: [...prev[task.id]?.logs || [], `✅ ${task.title} completed successfully!`]
        }
      }));

    } catch (error) {
      setTasks(prev => prev.map(t => t.id === task.id ? { ...t, status: 'failed' } : t));
      setTaskProgress(prev => ({
        ...prev,
        [task.id]: {
          progress: 0,
          logs: [...prev[task.id]?.logs || [], `❌ ${task.title} failed: ${error}`]
        }
      }));
    } finally {
      setRunningTasks(prev => {
        const newSet = new Set(prev);
        newSet.delete(task.id);
        return newSet;
      });
    }
  };

  const getProgressMessage = (category: string, progress: number): string => {
    if (progress <= 20) return 'Initializing automation...';
    if (progress <= 40) return 'Processing data...';
    if (progress <= 60) return 'Executing main workflow...';
    if (progress <= 80) return 'Generating results...';
    return 'Finalizing task...';
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'Easy': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'Medium': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      case 'Hard': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'running': return <Clock className="h-4 w-4 text-blue-600 animate-spin" />;
      case 'completed': return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'failed': return <XCircle className="h-4 w-4 text-red-600" />;
      default: return <Play className="h-4 w-4 text-gray-600" />;
    }
  };

  const resetTask = (taskId: string) => {
    setTasks(prev => prev.map(t => t.id === taskId ? { ...t, status: 'ready', progress: 0 } : t));
    setTaskProgress(prev => {
      const newProgress = { ...prev };
      delete newProgress[taskId];
      return newProgress;
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Zap className="h-6 w-6 text-primary" />
            Agentic Task Library
          </h2>
          <p className="text-muted-foreground">Drag to reorder • Click to execute advanced AI automation tasks</p>
        </div>
        {userProfile?.role === 'admin' && (
          <button className="flex items-center gap-2 px-3 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90">
            <Settings className="h-4 w-4" />
            Manage Tasks
          </button>
        )}
      </div>

      {/* Task Grid with Drag and Drop */}
      <Reorder.Group 
        axis="y" 
        values={tasks} 
        onReorder={setTasks}
        className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4"
      >
        {tasks.map((task) => (
          <Reorder.Item key={task.id} value={task}>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="relative rounded-xl border bg-card p-6 cursor-move hover:shadow-lg transition-all"
            >
              {/* Status Indicator */}
              <div className="absolute top-4 right-4 flex items-center gap-2">
                {getStatusIcon(task.status)}
                <button className="text-muted-foreground hover:text-foreground">
                  <MoreVertical className="h-4 w-4" />
                </button>
              </div>

              {/* Task Header */}
              <div className="flex items-start gap-3 mb-4">
                <div className={`p-3 rounded-lg ${task.color} text-white`}>
                  {task.icon}
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-lg">{task.title}</h3>
                  <p className="text-sm text-muted-foreground mt-1">{task.description}</p>
                </div>
              </div>

              {/* Progress Bar (if running) */}
              {task.status === 'running' && task.progress !== undefined && (
                <div className="mb-4">
                  <div className="flex items-center justify-between text-sm mb-1">
                    <span>Progress</span>
                    <span>{task.progress}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2 dark:bg-gray-700">
                    <div 
                      className="bg-primary h-2 rounded-full transition-all duration-300"
                      style={{ width: `${task.progress}%` }}
                    ></div>
                  </div>
                </div>
              )}

              {/* Task Details */}
              <div className="space-y-3 mb-4">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Duration:</span>
                  <span className="font-medium">{task.estimatedTime}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Difficulty:</span>
                  <span className={`px-2 py-1 rounded text-xs ${getDifficultyColor(task.difficulty)}`}>
                    {task.difficulty}
                  </span>
                </div>
              </div>

              {/* Automation Features */}
              <div className="mb-4">
                <div className="text-sm text-muted-foreground mb-2">Features:</div>
                <div className="flex flex-wrap gap-1">
                  {task.automationFeatures.slice(0, 3).map((feature, index) => (
                    <span key={index} className="px-2 py-1 bg-muted text-xs rounded">
                      {feature}
                    </span>
                  ))}
                  {task.automationFeatures.length > 3 && (
                    <span className="px-2 py-1 bg-muted text-xs rounded">
                      +{task.automationFeatures.length - 3} more
                    </span>
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-2">
                {task.status === 'ready' && (
                  <button
                    onClick={() => executeTask(task)}
                    className="flex-1 flex items-center justify-center gap-2 bg-primary text-primary-foreground px-3 py-2 rounded-lg hover:bg-primary/90 transition-colors"
                  >
                    <Play className="h-4 w-4" />
                    Execute
                  </button>
                )}
                
                {task.status === 'running' && (
                  <button
                    disabled
                    className="flex-1 flex items-center justify-center gap-2 bg-blue-600 text-white px-3 py-2 rounded-lg opacity-75"
                  >
                    <Clock className="h-4 w-4 animate-spin" />
                    Running...
                  </button>
                )}
                
                {(task.status === 'completed' || task.status === 'failed') && (
                  <button
                    onClick={() => resetTask(task.id)}
                    className="flex-1 flex items-center justify-center gap-2 border px-3 py-2 rounded-lg hover:bg-accent transition-colors"
                  >
                    <Copy className="h-4 w-4" />
                    Reset
                  </button>
                )}

                <button className="px-3 py-2 border rounded-lg hover:bg-accent transition-colors">
                  <Settings className="h-4 w-4" />
                </button>
              </div>

              {/* Real-time Logs (if running) */}
              {task.status === 'running' && taskProgress[task.id] && (
                <div className="mt-4 p-3 bg-muted rounded-lg">
                  <div className="text-xs text-muted-foreground mb-1">Live Progress:</div>
                  <div className="max-h-20 overflow-y-auto text-xs space-y-1">
                    {taskProgress[task.id].logs.slice(-3).map((log, index) => (
                      <div key={index} className="text-xs">{log}</div>
                    ))}
                  </div>
                </div>
              )}
            </motion.div>
          </Reorder.Item>
        ))}
      </Reorder.Group>

      {/* Running Tasks Summary */}
      {runningTasks.size > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="fixed bottom-4 right-4 bg-card border rounded-lg p-4 shadow-lg max-w-sm"
        >
          <div className="flex items-center gap-2 mb-2">
            <Clock className="h-4 w-4 text-blue-600 animate-spin" />
            <span className="font-medium">Active Tasks ({runningTasks.size})</span>
          </div>
          <div className="space-y-2 text-sm">
            {Array.from(runningTasks).map(taskId => {
              const task = tasks.find(t => t.id === taskId);
              return task ? (
                <div key={taskId} className="flex items-center justify-between">
                  <span className="truncate">{task.title}</span>
                  <span className="text-blue-600">{task.progress || 0}%</span>
                </div>
              ) : null;
            })}
          </div>
        </motion.div>
      )}
    </div>
  );
}
