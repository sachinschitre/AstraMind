import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { 
  User, 
  Key, 
  Activity, 
  Shield, 
  Calendar, 
  Clock,
  CheckCircle,
  XCircle,
  Crown,
  Users
} from 'lucide-react';
import { authService, UserProfile, TaskHistory } from '../firebase';

interface ProfilePageProps {
  user: any;
  userProfile: UserProfile | null;
  apiKeys: any;
}

export default function ProfilePage({ user, userProfile, apiKeys }: ProfilePageProps) {
  const [taskHistory, setTaskHistory] = useState<TaskHistory[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (user) {
      loadTaskHistory();
    }
  }, [user]);

  const loadTaskHistory = async () => {
    try {
      const history = await authService.getUserTaskHistory(user.uid, 20);
      setTaskHistory(history);
    } catch (error) {
      console.error('Error loading task history:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getConfiguredApiKeys = () => {
    return Object.entries(apiKeys)
      .filter(([_, value]) => value && value.length > 0)
      .map(([key, _]) => key);
  };

  const formatDate = (date: Date | any) => {
    if (!date) return 'N/A';
    const d = date.toDate ? date.toDate() : new Date(date);
    return d.toLocaleDateString() + ' ' + d.toLocaleTimeString();
  };

  const getTaskIcon = (taskType: string) => {
    switch (taskType) {
      case 'voice-input': return '🎤';
      case 'youtube-summary': return '📺';
      case 'job-search': return '💼';
      case 'reminder': return '⏰';
      case 'text-to-speech': return '🔊';
      case 'task-execute': return '⚡';
      default: return '📋';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'success': return 'text-green-600 dark:text-green-400';
      case 'error': return 'text-red-600 dark:text-red-400';
      case 'pending': return 'text-yellow-600 dark:text-yellow-400';
      default: return 'text-gray-600 dark:text-gray-400';
    }
  };

  if (!userProfile) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading profile...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Profile Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-xl border bg-card p-6"
      >
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-4">
            <div className="p-4 rounded-full bg-primary/10">
              <User className="h-8 w-8 text-primary" />
            </div>
            <div>
              <h2 className="text-2xl font-bold">{userProfile.displayName}</h2>
              <p className="text-muted-foreground">{userProfile.email}</p>
              <div className="flex items-center gap-2 mt-2">
                <div className={`flex items-center gap-1 px-2 py-1 rounded text-xs ${
                  userProfile.role === 'admin' ? 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200' : 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
                }`}>
                  {userProfile.role === 'admin' ? <Crown className="h-3 w-3" /> : <Users className="h-3 w-3" />}
                  {userProfile.role.toUpperCase()}
                </div>
                <div className={`px-2 py-1 rounded text-xs ${
                  userProfile.plan === 'premium' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200' : 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200'
                }`}>
                  {userProfile.plan.toUpperCase()}
                </div>
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="rounded-xl border bg-card p-4"
        >
          <div className="flex items-center gap-3">
            <Activity className="h-5 w-5 text-blue-600" />
            <div>
              <p className="text-sm text-muted-foreground">Total Tasks</p>
              <p className="text-2xl font-bold">{userProfile.taskCount || 0}</p>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="rounded-xl border bg-card p-4"
        >
          <div className="flex items-center gap-3">
            <Key className="h-5 w-5 text-green-600" />
            <div>
              <p className="text-sm text-muted-foreground">API Keys</p>
              <p className="text-2xl font-bold">{getConfiguredApiKeys().length}/4</p>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="rounded-xl border bg-card p-4"
        >
          <div className="flex items-center gap-3">
            <Calendar className="h-5 w-5 text-purple-600" />
            <div>
              <p className="text-sm text-muted-foreground">Member Since</p>
              <p className="text-sm font-medium">{formatDate(userProfile.createdAt).split(' ')[0]}</p>
            </div>
          </div>
        </motion.div>
      </div>

      {/* API Keys Status */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="rounded-xl border bg-card p-6"
      >
        <h3 className="font-semibold mb-4 flex items-center gap-2">
          <Key className="h-5 w-5" />
          API Keys Configuration
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {Object.entries(apiKeys).map(([provider, key]) => (
            <div key={provider} className="flex items-center justify-between p-3 rounded-lg border bg-muted/50">
              <div className="flex items-center gap-3">
                <div className={`p-1 rounded ${key ? 'bg-green-100 dark:bg-green-900' : 'bg-gray-100 dark:bg-gray-800'}`}>
                  {key ? (
                    <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400" />
                  ) : (
                    <XCircle className="h-4 w-4 text-gray-400" />
                  )}
                </div>
                <span className="font-medium capitalize">{provider}</span>
              </div>
              <span className={`text-xs px-2 py-1 rounded ${
                key ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' : 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400'
              }`}>
                {key ? 'Configured' : 'Not Set'}
              </span>
            </div>
          ))}
        </div>
      </motion.div>

      {/* Account Information */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="rounded-xl border bg-card p-6"
      >
        <h3 className="font-semibold mb-4 flex items-center gap-2">
          <Shield className="h-5 w-5" />
          Account Information
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-3">
            <div>
              <p className="text-sm text-muted-foreground">User ID</p>
              <p className="font-mono text-xs bg-muted px-2 py-1 rounded">{userProfile.uid}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Created At</p>
              <p className="text-sm">{formatDate(userProfile.createdAt)}</p>
            </div>
          </div>
          <div className="space-y-3">
            <div>
              <p className="text-sm text-muted-foreground">Last Login</p>
              <p className="text-sm">{formatDate(userProfile.lastLoginAt)}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Role & Permissions</p>
              <div className="flex items-center gap-2">
                <span className="text-sm">{userProfile.role}</span>
                {userProfile.role === 'admin' && (
                  <span className="text-xs bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200 px-2 py-1 rounded">
                    Full Access
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Task History */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
        className="rounded-xl border bg-card p-6"
      >
        <h3 className="font-semibold mb-4 flex items-center gap-2">
          <Clock className="h-5 w-5" />
          Recent Task History
        </h3>
        {isLoading ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary mx-auto mb-2"></div>
            <p className="text-sm text-muted-foreground">Loading history...</p>
          </div>
        ) : taskHistory.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-muted-foreground">No task history yet. Start using AstraMind to see your activity!</p>
          </div>
        ) : (
          <div className="space-y-3 max-h-64 overflow-y-auto">
            {taskHistory.map((task) => (
              <div key={task.id} className="flex items-center justify-between p-3 rounded-lg border bg-muted/50">
                <div className="flex items-center gap-3">
                  <span className="text-lg">{getTaskIcon(task.taskType)}</span>
                  <div>
                    <p className="font-medium text-sm">{task.taskType.replace('-', ' ').toUpperCase()}</p>
                    {task.command && (
                      <p className="text-xs text-muted-foreground truncate max-w-xs">"{task.command}"</p>
                    )}
                  </div>
                </div>
                <div className="text-right">
                  <span className={`text-xs px-2 py-1 rounded ${getStatusColor(task.status)}`}>
                    {task.status.toUpperCase()}
                  </span>
                  <p className="text-xs text-muted-foreground mt-1">
                    {formatDate(task.timestamp).split(' ')[1]}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </motion.div>
    </div>
  );
}
