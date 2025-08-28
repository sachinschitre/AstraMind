import React, { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { Shield, Mic, AlertTriangle, CheckCircle, XCircle } from 'lucide-react';

interface SecurityGateProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  operation: string;
  description: string;
  requireVoiceConfirmation?: boolean;
}

export default function SecurityGate({ 
  isOpen, 
  onClose, 
  onConfirm, 
  operation, 
  description, 
  requireVoiceConfirmation = true 
}: SecurityGateProps) {
  const [isListening, setIsListening] = useState(false);
  const [voiceConfirmed, setVoiceConfirmed] = useState(false);
  const [voiceError, setVoiceError] = useState('');
  const [manualConfirm, setManualConfirm] = useState(false);
  const recognitionRef = useRef<any>(null);

  if (!isOpen) return null;

  const startVoiceConfirmation = () => {
    setVoiceError('');
    
    if (typeof window !== "undefined" && (window as any).webkitSpeechRecognition) {
      const recognition = new (window as any).webkitSpeechRecognition();
      recognitionRef.current = recognition;
      
      recognition.lang = 'en-US';
      recognition.continuous = false;
      recognition.interimResults = false;
      
      recognition.onstart = () => {
        setIsListening(true);
      };
      
      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript.toLowerCase().trim();
        console.log('Voice input:', transcript);
        
        // Check for confirmation phrases
        const confirmPhrases = ['yes execute', 'yes, execute', 'confirm', 'proceed', 'yes'];
        const isConfirmed = confirmPhrases.some(phrase => 
          transcript.includes(phrase) || transcript === 'yes'
        );
        
        if (isConfirmed) {
          setVoiceConfirmed(true);
          setVoiceError('');
        } else {
          setVoiceError(`Said: "${transcript}". Please say "Yes, execute" to confirm.`);
        }
        
        setIsListening(false);
      };
      
      recognition.onerror = (event: any) => {
        setIsListening(false);
        setVoiceError('Voice recognition failed. Please try again or use manual confirmation.');
      };
      
      recognition.onend = () => {
        setIsListening(false);
      };
      
      recognition.start();
    } else {
      setVoiceError('Voice recognition not supported. Please use manual confirmation.');
    }
  };

  const stopVoiceConfirmation = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
    setIsListening(false);
  };

  const handleConfirm = () => {
    if (requireVoiceConfirmation && !voiceConfirmed && !manualConfirm) {
      setVoiceError('Voice confirmation required for this sensitive operation.');
      return;
    }
    onConfirm();
    onClose();
  };

  const handleCancel = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
    setIsListening(false);
    setVoiceConfirmed(false);
    setVoiceError('');
    setManualConfirm(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-background rounded-xl shadow-xl max-w-md w-full p-6 border-2 border-orange-200 dark:border-orange-800"
      >
        <div className="text-center mb-6">
          <div className="flex items-center justify-center mb-3">
            <div className="p-3 rounded-full bg-orange-100 dark:bg-orange-900">
              <Shield className="h-6 w-6 text-orange-600 dark:text-orange-400" />
            </div>
          </div>
          <h2 className="text-xl font-bold text-orange-800 dark:text-orange-200">Security Confirmation Required</h2>
        </div>

        <div className="mb-6">
          <div className="flex items-start gap-3 p-4 rounded-lg bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800">
            <AlertTriangle className="h-5 w-5 text-orange-600 dark:text-orange-400 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-medium text-orange-800 dark:text-orange-200">{operation}</p>
              <p className="text-sm text-orange-700 dark:text-orange-300 mt-1">{description}</p>
            </div>
          </div>
        </div>

        {requireVoiceConfirmation && (
          <div className="mb-6">
            <h3 className="font-medium mb-3 flex items-center gap-2">
              <Mic className="h-4 w-4" />
              Voice Confirmation
            </h3>
            
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                {!isListening ? (
                  <button
                    onClick={startVoiceConfirmation}
                    disabled={voiceConfirmed}
                    className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors ${
                      voiceConfirmed 
                        ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' 
                        : 'bg-primary text-primary-foreground hover:bg-primary/90'
                    }`}
                  >
                    <Mic className="h-4 w-4" />
                    {voiceConfirmed ? 'Confirmed' : 'Say "Yes, execute"'}
                  </button>
                ) : (
                  <button
                    onClick={stopVoiceConfirmation}
                    className="flex items-center gap-2 px-3 py-2 bg-red-600 text-white rounded-lg text-sm hover:bg-red-700"
                  >
                    <Mic className="h-4 w-4 animate-pulse" />
                    Stop Listening
                  </button>
                )}
                
                {voiceConfirmed && (
                  <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400" />
                )}
              </div>

              {isListening && (
                <div className="p-3 rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800">
                  <p className="text-sm text-blue-700 dark:text-blue-300">
                    🎤 Listening... Say "Yes, execute" to confirm the operation.
                  </p>
                </div>
              )}

              {voiceError && (
                <div className="p-3 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800">
                  <p className="text-sm text-red-700 dark:text-red-300">{voiceError}</p>
                </div>
              )}

              <div className="border-t pt-3">
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={manualConfirm}
                    onChange={(e) => setManualConfirm(e.target.checked)}
                    className="rounded"
                  />
                  <span className="text-muted-foreground">
                    I understand the risks and want to proceed without voice confirmation
                  </span>
                </label>
              </div>
            </div>
          </div>
        )}

        <div className="flex gap-3">
          <button
            onClick={handleCancel}
            className="flex-1 px-4 py-2 border rounded-lg hover:bg-accent transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            disabled={requireVoiceConfirmation && !voiceConfirmed && !manualConfirm}
            className={`flex-1 px-4 py-2 rounded-lg transition-colors ${
              (requireVoiceConfirmation && !voiceConfirmed && !manualConfirm)
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                : 'bg-orange-600 text-white hover:bg-orange-700'
            }`}
          >
            Execute
          </button>
        </div>

        <div className="mt-4 text-center">
          <p className="text-xs text-muted-foreground">
            This security gate protects sensitive operations and requires explicit confirmation.
          </p>
        </div>
      </motion.div>
    </div>
  );
}
