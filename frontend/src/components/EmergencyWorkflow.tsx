import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Phone, 
  MessageSquare, 
  Mail, 
  AlertTriangle, 
  CheckCircle, 
  XCircle,
  Clock,
  ChevronRight,
  MapPin,
  User,
  PhoneCall
} from 'lucide-react';

interface EmergencyStep {
  id: string;
  name: string;
  icon: React.ReactNode;
  status: 'pending' | 'trying' | 'success' | 'failed';
  estimatedTime: string;
  method: string;
}

interface EmergencyWorkflowProps {
  isOpen: boolean;
  onClose: () => void;
  emergencyType: 'Ambulance' | 'Police' | 'Fire';
  userLocation?: { lat: number; lng: number; address?: string };
  user: any;
}

export default function EmergencyWorkflow({ 
  isOpen, 
  onClose, 
  emergencyType, 
  userLocation, 
  user 
}: EmergencyWorkflowProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [isExecuting, setIsExecuting] = useState(false);
  const [executionLogs, setExecutionLogs] = useState<string[]>([]);
  const [contactInfo, setContactInfo] = useState({
    primaryContact: '+1-234-567-8901',
    emergencyContact: '+1-987-654-3210',
    email: user?.email || 'user@example.com'
  });

  const [steps, setSteps] = useState<EmergencyStep[]>([
    {
      id: 'api-call',
      name: 'Emergency API Call',
      icon: <Phone className="h-5 w-5" />,
      status: 'pending',
      estimatedTime: '10-15s',
      method: 'Direct emergency services API'
    },
    {
      id: 'sms-fallback',
      name: 'SMS Notification',
      icon: <MessageSquare className="h-5 w-5" />,
      status: 'pending',
      estimatedTime: '5-10s',
      method: 'SMS to emergency contacts'
    },
    {
      id: 'whatsapp-backup',
      name: 'WhatsApp Message',
      icon: <PhoneCall className="h-5 w-5" />,
      status: 'pending',
      estimatedTime: '3-5s',
      method: 'WhatsApp emergency notification'
    },
    {
      id: 'email-notification',
      name: 'Email Alert',
      icon: <Mail className="h-5 w-5" />,
      status: 'pending',
      estimatedTime: '2-3s',
      method: 'Email to all emergency contacts'
    }
  ]);

  const getEmergencyDetails = () => {
    switch (emergencyType) {
      case 'Ambulance':
        return {
          number: '911',
          description: 'Medical Emergency',
          priority: 'CRITICAL',
          color: 'text-red-600'
        };
      case 'Police':
        return {
          number: '911',
          description: 'Police Emergency',
          priority: 'HIGH',
          color: 'text-blue-600'
        };
      case 'Fire':
        return {
          number: '911',
          description: 'Fire Emergency',
          priority: 'CRITICAL',
          color: 'text-orange-600'
        };
      default:
        return {
          number: '911',
          description: 'Emergency',
          priority: 'HIGH',
          color: 'text-red-600'
        };
    }
  };

  const executeEmergencyWorkflow = async () => {
    setIsExecuting(true);
    setExecutionLogs([]);
    
    const addLog = (message: string) => {
      setExecutionLogs(prev => [...prev, `${new Date().toLocaleTimeString()}: ${message}`]);
    };

    addLog(`🚨 EMERGENCY WORKFLOW INITIATED - ${emergencyType.toUpperCase()}`);
    addLog(`📍 Location: ${userLocation?.address || 'Location not available'}`);
    addLog(`👤 User: ${user?.displayName || user?.email || 'Anonymous'}`);

    // Step 1: Emergency API Call
    setCurrentStep(0);
    setSteps(prev => prev.map((step, index) => 
      index === 0 ? { ...step, status: 'trying' } : step
    ));
    
    addLog('📞 Attempting direct emergency API call...');
    await simulateApiCall(1500);
    
    const apiSuccess = Math.random() > 0.3; // 70% success rate for demo
    
    if (apiSuccess) {
      setSteps(prev => prev.map((step, index) => 
        index === 0 ? { ...step, status: 'success' } : step
      ));
      addLog('✅ Emergency services contacted successfully via API');
      addLog(`📋 Reference ID: EMG-${Date.now()}`);
      addLog('🚑 Emergency responders have been dispatched');
      
      // Continue with notifications for confirmation
      await executeNotificationSteps(addLog, 1);
    } else {
      setSteps(prev => prev.map((step, index) => 
        index === 0 ? { ...step, status: 'failed' } : step
      ));
      addLog('❌ Emergency API call failed - proceeding to fallback methods');
      
      // Execute all fallback steps
      await executeNotificationSteps(addLog, 1);
    }

    setIsExecuting(false);
    addLog('🏁 Emergency workflow completed');
  };

  const executeNotificationSteps = async (addLog: (msg: string) => void, startStep: number) => {
    const notificationSteps = [
      {
        name: 'SMS',
        action: async () => {
          addLog('📱 Sending SMS to emergency contacts...');
          await simulateApiCall(800);
          addLog(`✅ SMS sent to ${contactInfo.primaryContact}`);
          addLog(`✅ SMS sent to ${contactInfo.emergencyContact}`);
        }
      },
      {
        name: 'WhatsApp',
        action: async () => {
          addLog('💬 Sending WhatsApp messages...');
          await simulateApiCall(600);
          addLog('✅ WhatsApp emergency message sent');
          addLog('📍 Location shared via WhatsApp');
        }
      },
      {
        name: 'Email',
        action: async () => {
          addLog('📧 Sending email notifications...');
          await simulateApiCall(400);
          addLog(`✅ Email sent to ${contactInfo.email}`);
          addLog('✅ Emergency details forwarded to all contacts');
        }
      }
    ];

    for (let i = 0; i < notificationSteps.length; i++) {
      const stepIndex = startStep + i;
      setCurrentStep(stepIndex);
      
      setSteps(prev => prev.map((step, index) => 
        index === stepIndex ? { ...step, status: 'trying' } : step
      ));

      await notificationSteps[i].action();

      setSteps(prev => prev.map((step, index) => 
        index === stepIndex ? { ...step, status: 'success' } : step
      ));

      await new Promise(resolve => setTimeout(resolve, 300));
    }
  };

  const simulateApiCall = (duration: number) => {
    return new Promise(resolve => setTimeout(resolve, duration));
  };

  const getStepStatusIcon = (status: string) => {
    switch (status) {
      case 'trying':
        return <Clock className="h-4 w-4 text-blue-600 animate-spin" />;
      case 'success':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'failed':
        return <XCircle className="h-4 w-4 text-red-600" />;
      default:
        return <div className="h-4 w-4 rounded-full border-2 border-gray-300" />;
    }
  };

  if (!isOpen) return null;

  const emergencyDetails = getEmergencyDetails();

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-background rounded-xl shadow-xl max-w-2xl w-full max-h-[80vh] overflow-y-auto border-2 border-red-200 dark:border-red-800"
      >
        {/* Header */}
        <div className="p-6 border-b bg-red-50 dark:bg-red-900/20">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-full bg-red-100 dark:bg-red-900">
                <AlertTriangle className="h-6 w-6 text-red-600 dark:text-red-400" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-red-800 dark:text-red-200">
                  Emergency Protocol: {emergencyType}
                </h2>
                <p className="text-sm text-red-700 dark:text-red-300">
                  {emergencyDetails.description} • Priority: {emergencyDetails.priority}
                </p>
              </div>
            </div>
            {!isExecuting && (
              <button
                onClick={onClose}
                className="text-red-600 hover:text-red-800 text-xl font-bold"
              >
                ×
              </button>
            )}
          </div>
        </div>

        {/* Emergency Information */}
        <div className="p-6 border-b">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <User className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium">Requesting Help:</span>
                <span className="text-sm">{user?.displayName || user?.email || 'Anonymous'}</span>
              </div>
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium">Location:</span>
                <span className="text-sm">{userLocation?.address || 'Location not available'}</span>
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Phone className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium">Emergency Line:</span>
                <span className="text-sm font-bold">{emergencyDetails.number}</span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium">Initiated:</span>
                <span className="text-sm">{new Date().toLocaleString()}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Workflow Steps */}
        <div className="p-6">
          <h3 className="font-semibold mb-4">Emergency Response Workflow</h3>
          <div className="space-y-4">
            {steps.map((step, index) => (
              <motion.div
                key={step.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                className={`flex items-center gap-4 p-4 rounded-lg border ${
                  currentStep === index && isExecuting
                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                    : step.status === 'success'
                    ? 'border-green-500 bg-green-50 dark:bg-green-900/20'
                    : step.status === 'failed'
                    ? 'border-red-500 bg-red-50 dark:bg-red-900/20'
                    : 'border-gray-200 dark:border-gray-700'
                }`}
              >
                <div className="flex-shrink-0">
                  {getStepStatusIcon(step.status)}
                </div>
                <div className="flex items-center gap-2 text-muted-foreground">
                  {step.icon}
                </div>
                <div className="flex-1">
                  <div className="font-medium">{step.name}</div>
                  <div className="text-sm text-muted-foreground">{step.method}</div>
                </div>
                <div className="text-right">
                  <div className="text-sm text-muted-foreground">{step.estimatedTime}</div>
                  {currentStep === index && isExecuting && (
                    <div className="text-xs text-blue-600">Processing...</div>
                  )}
                </div>
                {index < steps.length - 1 && (
                  <ChevronRight className="h-4 w-4 text-muted-foreground" />
                )}
              </motion.div>
            ))}
          </div>
        </div>

        {/* Execution Logs */}
        {executionLogs.length > 0 && (
          <div className="p-6 border-t">
            <h3 className="font-semibold mb-3">Real-time Execution Log</h3>
            <div className="bg-black text-green-400 p-4 rounded-lg font-mono text-sm max-h-48 overflow-y-auto">
              {executionLogs.map((log, index) => (
                <div key={index} className="mb-1">
                  {log}
                </div>
              ))}
              {isExecuting && (
                <div className="animate-pulse">▋</div>
              )}
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="p-6 border-t flex gap-3">
          {!isExecuting ? (
            <>
              <button
                onClick={executeEmergencyWorkflow}
                className="flex-1 bg-red-600 text-white px-4 py-3 rounded-lg hover:bg-red-700 transition-colors font-medium"
              >
                🚨 EXECUTE EMERGENCY PROTOCOL
              </button>
              <button
                onClick={onClose}
                className="px-4 py-3 border rounded-lg hover:bg-accent transition-colors"
              >
                Cancel
              </button>
            </>
          ) : (
            <button
              disabled
              className="flex-1 bg-red-600 text-white px-4 py-3 rounded-lg opacity-75 font-medium cursor-not-allowed"
            >
              🚨 EMERGENCY PROTOCOL ACTIVE...
            </button>
          )}
        </div>

        {/* Safety Notice */}
        <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 border-t">
          <div className="flex items-start gap-2">
            <AlertTriangle className="h-4 w-4 text-yellow-600 flex-shrink-0 mt-0.5" />
            <div className="text-xs text-yellow-800 dark:text-yellow-200">
              <strong>Important:</strong> This is a simulation for demonstration purposes. 
              In a real emergency, always call your local emergency services directly at {emergencyDetails.number}.
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
