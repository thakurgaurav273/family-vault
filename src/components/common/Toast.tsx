import React from 'react';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';
import { useFamilyVault } from '../../context/FamilyVaultContext';

export const Toast: React.FC = () => {
  const { toast } = useFamilyVault();

  if (!toast) return null;

  return (
    <div className="fixed bottom-20 md:bottom-6 right-4 sm:right-6 z-50 max-w-sm w-full bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl shadow-lg p-3.5 flex items-center gap-3 animate-in slide-in-from-bottom-2 duration-200">
      <div className="shrink-0">
        {toast.type === 'success' && <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />}
        {toast.type === 'error' && <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400" />}
        {toast.type === 'info' && <Info className="w-5 h-5 text-blue-600 dark:text-blue-400" />}
      </div>
      <p className="text-xs sm:text-sm font-medium text-neutral-800 dark:text-neutral-200 flex-1 truncate">
        {toast.text}
      </p>
    </div>
  );
};
