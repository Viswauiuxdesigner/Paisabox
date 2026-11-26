import React from 'react';
import { CheckCircle2, AlertCircle, Info } from 'lucide-react';
import type { ToastMessage } from '../types/expense';

interface ToastContainerProps {
  toasts: ToastMessage[];
}

export const ToastContainer: React.FC<ToastContainerProps> = ({ toasts }) => {
  if (toasts.length === 0) return null;

  return (
    <div className="fixed top-4 right-4 left-4 md:left-auto md:w-80 z-50 flex flex-col gap-2 pointer-events-none">
      {toasts.map((t) => {
        const isError = t.type === 'error';
        const isInfo = t.type === 'info';
        return (
          <div
            key={t.id}
            className={`animate-slide-up pointer-events-auto flex items-center gap-2.5 px-4 py-3 rounded-xl shadow-lg border text-sm font-medium backdrop-blur-md ${
              isError
                ? 'bg-rose-600 text-white border-rose-500'
                : isInfo
                  ? 'bg-slate-800 text-white border-slate-700'
                  : 'bg-teal-700 text-white border-teal-600'
            }`}
          >
            {isError ? (
              <AlertCircle size={18} className="shrink-0" />
            ) : isInfo ? (
              <Info size={18} className="shrink-0" />
            ) : (
              <CheckCircle2 size={18} className="shrink-0" />
            )}
            <span>{t.text}</span>
          </div>
        );
      })}
    </div>
  );
};
