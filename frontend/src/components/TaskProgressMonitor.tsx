import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Monitor, 
  Activity, 
  Clock, 
  CheckCircle, 
  XCircle, 
  AlertCircle,
  Minimize2,
  Maximize2,
  X,
  Download,
  Share,
  RefreshCw
} from 'lucide-react';

interface TaskProgress {
  taskId: string;
  taskName: string;
  progress: number;
  status: 'running' | 'completed' | 'failed' | 'paused';
  logs: string[];
  startTime: Date;
  estimatedCompletion?: Date;
  currentOperation?: string;
  metrics?: {
    cpuUsage?: number;
    memoryUsage?: number;
    networkActivity?: number;
  };
}

interface TaskProgressMonitorProps {
  activeTasks: TaskProgress[];
  onTaskCancel?: (taskId: string) => void;
  onTaskPause?: (taskId: string) => void;
  onTaskResume?: (taskId: string) => void;
}

export default function TaskProgressMonitor({ 
  activeTasks, 
  onTaskCancel, 
  onTaskPause, 
  onTaskResume 
}: TaskProgressMonitorProps) {
  const [isMinimized, setIsMinimized] = useState(false);
  const [selectedTask, setSelectedTask] = useState<string | null>(null);
  const [autoScroll, setAutoScroll] = useState(true);
  const [showMetrics, setShowMetrics] = useState(false);

  useEffect(() => {
    if (activeTasks.length === 0) {
      setSelectedTask(null);
    } else if (selectedTask && !activeTasks.find(t => t.taskId === selectedTask)) {
      setSelectedTask(activeTasks[0]?.taskId || null);
    } else if (!selectedTask && activeTasks.length > 0) {
      setSelectedTask(activeTasks[0].taskId);
    }
  }, [activeTasks, selectedTask]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'running': return 'text-blue-600';
      case 'completed': return 'text-green-600';
      case 'failed': return 'text-red-600';
      case 'paused': return 'text-yellow-600';
      default: return 'text-gray-600';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'running': return <Activity className="h-4 w-4 animate-pulse" />;
      case 'completed': return <CheckCircle className="h-4 w-4" />;
      case 'failed': return <XCircle className="h-4 w-4" />;
      case 'paused': return <Clock className="h-4 w-4" />;
      default: return <AlertCircle className="h-4 w-4" />;
    }
  };

  const formatDuration = (startTime: Date) => {
    const now = new Date();
    const diff = now.getTime() - startTime.getTime();
    const minutes = Math.floor(diff / 60000);
    const seconds = Math.floor((diff % 60000) / 1000);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const exportLogs = (task: TaskProgress) => {
    const logContent = task.logs.join('\n');
    const blob = new Blob([logContent], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${task.taskName}-logs-${new Date().toISOString().slice(0, 10)}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (activeTasks.length === 0) {
    return null;
  }

  const selectedTaskData = activeTasks.find(t => t.taskId === selectedTask);

  return (
    <motion.div
      initial={{ opacity: 0, y: 100 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 100 }}
      className={`fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:w-96 bg-card border rounded-xl shadow-xl transition-all duration-300 z-40 ${
        isMinimized ? 'h-16' : 'h-96'
      }`}
    >
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b">
        <div className="flex items-center gap-2">
          <Monitor className="h-5 w-5 text-primary" />
          <span className="font-semibold">Task Monitor</span>
          <span className="px-2 py-1 bg-primary/20 text-primary text-xs rounded-full">
            {activeTasks.length} active
          </span>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={() => setShowMetrics(!showMetrics)}
            className="p-1 rounded hover:bg-accent"
            title="Toggle metrics"
          >
            <Activity className="h-4 w-4" />
          </button>
          <button
            onClick={() => setIsMinimized(!isMinimized)}
            className="p-1 rounded hover:bg-accent"
          >
            {isMinimized ? <Maximize2 className="h-4 w-4" /> : <Minimize2 className="h-4 w-4" />}
          </button>
        </div>
      </div>

      <AnimatePresence>
        {!isMinimized && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="flex flex-col h-80"
          >
            {/* Task Tabs */}
            {activeTasks.length > 1 && (
              <div className="flex gap-1 p-2 border-b bg-muted/50 overflow-x-auto">
                {activeTasks.map((task) => (
                  <button
                    key={task.taskId}
                    onClick={() => setSelectedTask(task.taskId)}
                    className={`px-3 py-1 rounded text-xs whitespace-nowrap transition-colors ${
                      selectedTask === task.taskId
                        ? 'bg-primary text-primary-foreground'
                        : 'hover:bg-accent'
                    }`}
                  >
                    <div className="flex items-center gap-1">
                      <div className={getStatusColor(task.status)}>
                        {getStatusIcon(task.status)}
                      </div>
                      <span className="truncate max-w-20">{task.taskName}</span>
                    </div>
                  </button>
                ))}
              </div>
            )}

            {selectedTaskData && (
              <>
                {/* Task Info */}
                <div className="p-3 border-b space-y-2">
                  <div className="flex items-center justify-between">
                    <h3 className="font-medium truncate">{selectedTaskData.taskName}</h3>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Clock className="h-3 w-3" />
                      {formatDuration(selectedTaskData.startTime)}
                    </div>
                  </div>
                  
                  {/* Progress Bar */}
                  <div className="space-y-1">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Progress</span>
                      <span className="font-medium">{selectedTaskData.progress}%</span>
                    </div>
                    <div className="w-full bg-secondary rounded-full h-2">
                      <motion.div
                        className={`h-2 rounded-full transition-all duration-300 ${
                          selectedTaskData.status === 'completed' ? 'bg-green-500' :
                          selectedTaskData.status === 'failed' ? 'bg-red-500' :
                          selectedTaskData.status === 'paused' ? 'bg-yellow-500' :
                          'bg-primary'
                        }`}
                        style={{ width: `${selectedTaskData.progress}%` }}
                        initial={{ width: 0 }}
                        animate={{ width: `${selectedTaskData.progress}%` }}
                      />
                    </div>
                  </div>

                  {/* Current Operation */}
                  {selectedTaskData.currentOperation && (
                    <div className="text-sm text-muted-foreground">
                      <span className="font-medium">Current:</span> {selectedTaskData.currentOperation}
                    </div>
                  )}

                  {/* Metrics */}
                  {showMetrics && selectedTaskData.metrics && (
                    <div className="grid grid-cols-3 gap-2 text-xs">
                      <div className="text-center p-1 bg-muted rounded">
                        <div className="font-medium">CPU</div>
                        <div>{selectedTaskData.metrics.cpuUsage || 0}%</div>
                      </div>
                      <div className="text-center p-1 bg-muted rounded">
                        <div className="font-medium">RAM</div>
                        <div>{selectedTaskData.metrics.memoryUsage || 0}MB</div>
                      </div>
                      <div className="text-center p-1 bg-muted rounded">
                        <div className="font-medium">Net</div>
                        <div>{selectedTaskData.metrics.networkActivity || 0}KB/s</div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Real-time Logs */}
                <div className="flex-1 flex flex-col">
                  <div className="flex items-center justify-between px-3 py-2 bg-muted/50">
                    <span className="text-sm font-medium">Live Logs</span>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => setAutoScroll(!autoScroll)}
                        className={`p-1 rounded text-xs ${autoScroll ? 'bg-primary text-primary-foreground' : 'hover:bg-accent'}`}
                        title="Auto-scroll"
                      >
                        <RefreshCw className="h-3 w-3" />
                      </button>
                      <button
                        onClick={() => exportLogs(selectedTaskData)}
                        className="p-1 rounded hover:bg-accent"
                        title="Export logs"
                      >
                        <Download className="h-3 w-3" />
                      </button>
                    </div>
                  </div>
                  
                  <div className="flex-1 overflow-y-auto bg-black text-green-400 p-3 font-mono text-xs">
                    {selectedTaskData.logs.length === 0 ? (
                      <div className="text-gray-500">No logs yet...</div>
                    ) : (
                      <div className="space-y-1">
                        {selectedTaskData.logs.map((log, index) => (
                          <motion.div
                            key={index}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="text-xs"
                          >
                            {log}
                          </motion.div>
                        ))}
                        {selectedTaskData.status === 'running' && (
                          <div className="animate-pulse text-white">▋</div>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="p-3 border-t flex gap-2">
                  {selectedTaskData.status === 'running' && (
                    <>
                      {onTaskPause && (
                        <button
                          onClick={() => onTaskPause(selectedTaskData.taskId)}
                          className="flex-1 px-3 py-2 text-sm bg-yellow-600 text-white rounded hover:bg-yellow-700 transition-colors"
                        >
                          Pause
                        </button>
                      )}
                      {onTaskCancel && (
                        <button
                          onClick={() => onTaskCancel(selectedTaskData.taskId)}
                          className="flex-1 px-3 py-2 text-sm bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
                        >
                          Cancel
                        </button>
                      )}
                    </>
                  )}
                  
                  {selectedTaskData.status === 'paused' && onTaskResume && (
                    <button
                      onClick={() => onTaskResume(selectedTaskData.taskId)}
                      className="flex-1 px-3 py-2 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
                    >
                      Resume
                    </button>
                  )}

                  {(selectedTaskData.status === 'completed' || selectedTaskData.status === 'failed') && (
                    <button
                      onClick={() => exportLogs(selectedTaskData)}
                      className="flex-1 px-3 py-2 text-sm border rounded hover:bg-accent transition-colors"
                    >
                      Export Results
                    </button>
                  )}
                </div>
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
