'use client';

import React, { createContext, useContext, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { CheckCircle2, AlertCircle, Info as InfoIcon, Coffee, Sparkles, X } from 'lucide-react';

export type ToastType = 'success' | 'error' | 'info' | 'greeting';
export type GreetingKind = 'customer' | 'admin';

interface Toast {
  id: string;
  message: string;
  type: ToastType;
  title?: string;
  kind?: GreetingKind;
}

interface ToastContextType {
  showToast: (message: string, type?: ToastType) => void;
  showGreetingToast: (title: string, message: string, kind?: GreetingKind) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const showToast = useCallback((message: string, type: ToastType = 'success') => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { id, message, type }]);

    // Auto remove after 4 seconds
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  }, []);

  // Greeting toasts (customer/admin) share the provider but look different:
  // dark background, light text and an icon from the app palette.
  const showGreetingToast = useCallback((title: string, message: string, kind: GreetingKind = 'customer') => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { id, message, type: 'greeting', title, kind }]);

    // Keep the greeting visible a bit longer than ordinary toasts.
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 7000);
  }, []);

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  return (
    <ToastContext.Provider value={{ showToast, showGreetingToast }}>
      {children}

      {/* Toast Portal Container: bottom-right on tablet/desktop, bottom-center full-width on mobile */}
      <div className="fixed bottom-6 left-1/2 -translate-x-1/2 sm:left-auto sm:right-6 sm:translate-x-0 sm:items-end z-50 flex flex-col gap-3 pointer-events-none w-full max-w-md px-4 sm:px-0 sm:w-auto">
        <AnimatePresence>
          {toasts.map((toast) => {
            if (toast.type === 'greeting') {
              const GreetingIcon = toast.kind === 'admin' ? Sparkles : Coffee;
              return (
                <motion.div
                  key={toast.id}
                  layout
                  initial={{ opacity: 0, y: 30, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.2 } }}
                  className="pointer-events-auto flex items-start gap-3.5 p-4 rounded-2xl border border-[#C09E6D]/50 bg-[#3E2F26] text-[#FAF6EE] shadow-xl shadow-black/30"
                >
                  <div className="mt-0.5 shrink-0 text-[#E9C78E]">
                    <GreetingIcon className="w-6 h-6" strokeWidth={1.8} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold tracking-wide font-display leading-snug">{toast.title}</p>
                    <p className="mt-1 text-xs font-medium text-[#E6DFD5]/90 font-sans leading-relaxed whitespace-pre-line">
                      {toast.message}
                    </p>
                  </div>
                  <button
                    onClick={() => removeToast(toast.id)}
                    className="shrink-0 text-[#E6DFD5]/70 hover:text-white transition-colors p-0.5 rounded-lg hover:bg-white/10"
                    aria-label="Close greeting"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </motion.div>
              );
            }

            let bgColor = 'bg-[#FDFBF7]';
            let borderColor = 'border-[#E6DFD5]';
            let textColor = 'text-[#3E2F26]';
            let Icon = InfoIcon;
            let iconColor = 'text-[#C09E6D]';

            // Toasts stay in the app's coffee/gold palette for every type;
            // the icon only gets a subtle tone shift to hint success/error.
            if (toast.type === 'success') {
              iconColor = 'text-[#C09E6D]';
              Icon = CheckCircle2;
            } else if (toast.type === 'error') {
              iconColor = 'text-[#8E7A68]';
              Icon = AlertCircle;
            }

            return (
              <motion.div
                key={toast.id}
                layout
                initial={{ opacity: 0, y: 30, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.2 } }}
                className={`pointer-events-auto flex items-start gap-3 p-4 rounded-xl border ${bgColor} ${borderColor} ${textColor} shadow-lg shadow-[#3E2F26]/5 backdrop-blur-md`}
              >
                <div className={`${iconColor} mt-0.5 shrink-0`}>
                  <Icon className="w-5 h-5" />
                </div>

                <div className="flex-1 text-xs font-semibold tracking-wide font-sans leading-relaxed">
                  {toast.message}
                </div>

                <button
                  onClick={() => removeToast(toast.id)}
                  className="shrink-0 text-[#8E7A68] hover:text-[#3E2F26] transition-colors p-0.5 rounded-lg hover:bg-[#F1ECE3]"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
}
