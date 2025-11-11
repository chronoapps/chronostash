import { X, AlertTriangle } from 'lucide-react';
import Button from './ui/Button';

interface DeleteConfirmModalProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  itemName?: string;
  isDeleting?: boolean;
}

export default function DeleteConfirmModal({
  open,
  onClose,
  onConfirm,
  title,
  message,
  itemName,
  isDeleting = false,
}: DeleteConfirmModalProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50
                    bg-gray-900/20 dark:bg-black/40
                    backdrop-blur-md
                    animate-fade-in
                    flex items-center justify-center p-4">
      <div className="glass-light dark:glass-strong rounded-2xl
                      max-w-md w-full
                      shadow-2xl dark:shadow-blue-500/10
                      animate-slide-up
                      border-2 border-gray-200 dark:border-slate-700/50
                      overflow-hidden">

        {/* Header */}
        <div className="px-6 py-4
                        border-b border-gray-200 dark:border-slate-700/50
                        bg-gradient-to-r from-gray-50 to-white
                        dark:from-slate-900/50 dark:to-slate-800/50">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="p-2 rounded-lg bg-red-100 dark:bg-red-500/10">
                <AlertTriangle className="w-5 h-5 text-red-600 dark:text-red-400" />
              </div>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                {title}
              </h2>
            </div>
            <button
              onClick={onClose}
              className="p-1 rounded-lg
                         hover:bg-gray-200 dark:hover:bg-slate-700
                         transition-colors"
              disabled={isDeleting}
            >
              <X className="w-5 h-5 text-gray-500 dark:text-slate-400" />
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="px-6 py-4">
          <p className="text-gray-600 dark:text-slate-300">
            {message}
          </p>
          {itemName && (
            <div className="mt-3 p-3 rounded-lg
                            bg-gray-100 dark:bg-slate-800
                            border border-gray-200 dark:border-slate-700">
              <p className="text-sm font-medium text-gray-900 dark:text-white">
                {itemName}
              </p>
            </div>
          )}
          <p className="text-sm text-gray-500 dark:text-slate-400 mt-2">
            This action cannot be undone.
          </p>
        </div>

        {/* Footer */}
        <div className="px-6 py-4
                        border-t border-gray-200 dark:border-slate-700/50
                        bg-gray-50 dark:bg-slate-900/50
                        flex justify-end space-x-3">
          <Button
            variant="secondary"
            onClick={onClose}
            disabled={isDeleting}
          >
            Cancel
          </Button>
          <Button
            variant="danger"
            onClick={onConfirm}
            isLoading={isDeleting}
          >
            Delete
          </Button>
        </div>
      </div>
    </div>
  );
}
