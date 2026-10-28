import React from 'react';
import { Shield, Loader2, FileText, Clock, ShieldCheck, Lock, Key } from 'lucide-react';

const ProfessionalLoadingScreen = ({ 
  progress = 0, 
  currentStep = "Initializing", 
  steps = [], 
  estimatedTime = null, 
  fileName = "" 
}) => {
  return (
    <div className="fixed inset-0 z-[200] flex flex-col items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 p-6">
      {/* Background patterns */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-1/3 -left-1/3 h-2/3 w-2/3 animate-pulse-slow bg-gradient-to-r from-blue-50/20 via-transparent to-blue-50/10 dark:from-blue-900/10 dark:via-transparent dark:to-blue-900/5 rounded-full"></div>
        <div className="absolute -bottom-1/3 -right-1/3 h-2/3 w-2/3 animate-pulse-slower bg-gradient-to-l from-gray-50/10 via-transparent to-gray-50/5 dark:from-gray-800/10 dark:via-transparent dark:to-gray-800/5 rounded-full"></div>
        <div className="absolute inset-0 opacity-[0.03] dark:opacity-[0.05]">
          <div className="h-full w-full" style={{
            backgroundImage: `linear-gradient(to right, #000 1px, transparent 1px),
                              linear-gradient(to bottom, #000 1px, transparent 1px)`,
            backgroundSize: '30px 30px',
          }}></div>
        </div>
      </div>

      <div className="relative z-10 flex w-full max-w-md flex-col items-center">
        {/* Icon */}
        <div className="mb-6 flex flex-col items-center">
          <div className="relative mb-4">
            <div className="absolute -inset-3 animate-ping rounded-full bg-blue-100/30 dark:bg-blue-900/20"></div>
            <div className="absolute -inset-2 rounded-full border-2 border-blue-200/50 dark:border-blue-700/30 animate-spin-slow"></div>
            <div className="relative flex h-16 w-16 items-center justify-center rounded-xl bg-gradient-to-br from-blue-600 via-blue-500 to-blue-700 dark:from-blue-700 dark:via-blue-600 dark:to-blue-800 shadow-lg">
              <div className="absolute inset-0 rounded-xl bg-gradient-to-t from-white/10 to-transparent"></div>
              <Shield className="h-8 w-8 text-white" strokeWidth={1.5} />
            </div>
            <div className="absolute -bottom-1 -right-1 flex h-6 w-6 items-center justify-center rounded-full border-2 border-white dark:border-gray-900 bg-green-500 shadow-md">
              <Loader2 className="h-3 w-3 animate-spin text-white" />
            </div>
          </div>
          
          <h1 className="text-xl font-bold text-gray-800 dark:text-white">Secure Document Viewer</h1>
          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">Loading protected content</p>
          
          {fileName && (
            <div className="mt-2 flex items-center gap-2 rounded-lg bg-white/50 dark:bg-white/5 px-3 py-1.5 backdrop-blur-sm">
              <FileText className="h-3 w-3 text-gray-500 dark:text-gray-400" />
              <span className="max-w-[220px] truncate text-xs font-medium text-gray-700 dark:text-gray-300">{fileName}</span>
            </div>
          )}
        </div>

        {/* Progress bar */}
        <div className="mb-6 w-full space-y-3">
          <div className="relative">
            <div className="absolute -inset-0.5 rounded-full bg-gradient-to-r from-blue-400/20 to-blue-600/20 dark:from-blue-600/10 dark:to-blue-700/10 blur"></div>
            <div className="relative h-1.5 overflow-hidden rounded-full bg-gray-200/80 dark:bg-gray-800/80 backdrop-blur-sm">
              <div 
                className="h-full rounded-full bg-gradient-to-r from-blue-500 via-blue-600 to-blue-700 transition-all duration-500 ease-out"
                style={{ width: `${progress}%` }}
              >
                <div className="absolute inset-0 animate-shimmer bg-gradient-to-r from-transparent via-white/40 dark:via-white/20 to-transparent"></div>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{currentStep}</span>
              <div className="flex items-center gap-2">
                <div className="h-1 w-12 rounded-full bg-gray-200 dark:bg-gray-800">
                  <div 
                    className="h-full rounded-full bg-gradient-to-r from-blue-400 to-blue-500"
                    style={{ width: `${progress}%` }}
                  ></div>
                </div>
                <span className="text-xs font-semibold text-blue-600 dark:text-blue-400">{progress}%</span>
              </div>
            </div>
            
            {estimatedTime && (
              <div className="flex items-center gap-1 rounded-full bg-blue-50 dark:bg-blue-900/30 px-2.5 py-1">
                <Clock className="h-3 w-3 text-blue-500 dark:text-blue-400" />
                <span className="text-xs font-medium text-blue-600 dark:text-blue-300">{estimatedTime}</span>
              </div>
            )}
          </div>
        </div>

        {/* Steps */}
        <div className="mb-6 w-full space-y-2">
          {steps.slice(0, 5).map((step, index) => (
            <div key={index} className="flex items-start gap-2 rounded-lg p-2 transition-all duration-200 hover:bg-gray-100/50 dark:hover:bg-white/5">
              <div className="relative">
                <div className={`relative flex h-6 w-6 items-center justify-center rounded-full border transition-all duration-300 ${
                  step.completed 
                    ? 'border-green-500 bg-green-500 text-white' 
                    : step.active 
                    ? 'border-blue-500 bg-blue-500 text-white shadow-md shadow-blue-200/50 dark:shadow-blue-900/50 animate-pulse'
                    : 'border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-500'
                }`}>
                  {step.completed ? (
                    <span className="text-xs font-bold">✓</span>
                  ) : (
                    <span className="text-xs font-bold">{index + 1}</span>
                  )}
                </div>
              </div>
              
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <span className={`text-sm truncate transition-all duration-300 ${
                    step.completed 
                      ? 'text-gray-600 dark:text-gray-400' 
                      : step.active 
                      ? 'text-blue-600 dark:text-blue-400 font-medium'
                      : 'text-gray-500'
                  }`}>
                    {step.label}
                  </span>
                  {step.details && (
                    <span className="text-xs text-gray-500 ml-2 flex-shrink-0">{step.details}</span>
                  )}
                </div>
                
                {step.active && (
                  <div className="mt-1 flex items-center gap-1">
                    <Loader2 className="h-2.5 w-2.5 animate-spin text-blue-500 dark:text-blue-400" />
                    <span className="text-xs text-blue-500 dark:text-blue-400">Processing...</span>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Security badges */}
        <div className="grid w-full grid-cols-2 gap-2 mb-4">
          <div className="flex items-center gap-1.5 rounded-lg border border-gray-200 dark:border-gray-700/50 bg-white/60 dark:bg-white/5 px-3 py-2 backdrop-blur-sm">
            <ShieldCheck className="h-3.5 w-3.5 text-green-500 dark:text-green-400" />
            <span className="text-xs font-medium text-gray-700 dark:text-gray-300">256-bit SSL</span>
          </div>
          
          <div className="flex items-center gap-1.5 rounded-lg border border-gray-200 dark:border-gray-700/50 bg-white/60 dark:bg-white/5 px-3 py-2 backdrop-blur-sm">
            <Lock className="h-3.5 w-3.5 text-green-500 dark:text-green-400" />
            <span className="text-xs font-medium text-gray-700 dark:text-gray-300">Encrypted</span>
          </div>
        </div>

        <div className="text-center">
          <div className="inline-flex items-center gap-1.5 rounded-full bg-gradient-to-r from-blue-50 to-gray-50 dark:from-blue-900/20 dark:to-gray-900/20 px-3 py-1.5">
            <Key className="h-3 w-3 text-blue-500 dark:text-blue-400" />
            <p className="text-xs text-gray-500 dark:text-gray-400">
              <span className="font-medium text-gray-700 dark:text-gray-300">Tip:</span> Secure loading in progress
            </p>
          </div>
        </div>
      </div>

      <div className="absolute bottom-4 text-center">
        <p className="text-[9px] text-gray-500 dark:text-gray-400">
          Secured by DMS • {new Date().getFullYear()}
        </p>
      </div>

      <style jsx>{`
        @keyframes shimmer {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }
        @keyframes spin-slow {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        @keyframes pulse-slow {
          0%, 100% { opacity: 0.3; }
          50% { opacity: 0.1; }
        }
        @keyframes pulse-slower {
          0%, 100% { opacity: 0.2; }
          50% { opacity: 0.05; }
        }
        .animate-shimmer { animation: shimmer 2s infinite; }
        .animate-spin-slow { animation: spin-slow 8s linear infinite; }
        .animate-pulse-slow { animation: pulse-slow 4s ease-in-out infinite; }
        .animate-pulse-slower { animation: pulse-slower 6s ease-in-out infinite; }
      `}</style>
    </div>
  );
};

export default ProfessionalLoadingScreen;