'use client';

import { AlertTriangle, X } from 'lucide-react';

interface ConfirmDialogProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  confirmButtonClass?: string;
  onConfirm: () => void;
  onCancel: () => void;
  type?: 'danger' | 'warning' | 'info';
}

export default function ConfirmDialog({
  isOpen,
  title,
  message,
  confirmText = 'Подтвердить',
  cancelText = 'Отмена',
  confirmButtonClass,
  onConfirm,
  onCancel,
  type = 'warning'
}: ConfirmDialogProps) {
  if (!isOpen) return null;

  const getTypeStyles = () => {
    switch (type) {
      case 'danger':
        return {
          icon: <AlertTriangle className="h-12 w-12 text-red-600" />,
          iconBg: 'bg-red-100',
          button: confirmButtonClass || 'bg-red-600 hover:bg-red-700'
        };
      case 'warning':
        return {
          icon: <AlertTriangle className="h-12 w-12 text-yellow-600" />,
          iconBg: 'bg-yellow-100',
          button: confirmButtonClass || 'bg-yellow-600 hover:bg-yellow-700'
        };
      case 'info':
        return {
          icon: <AlertTriangle className="h-12 w-12 text-blue-600" />,
          iconBg: 'bg-blue-100',
          button: confirmButtonClass || 'bg-blue-600 hover:bg-blue-700'
        };
    }
  };

  const styles = getTypeStyles();

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[60] p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full animate-scale-in">
        <div className="p-6">
          <div className="flex items-start space-x-4">
            <div className={`flex-shrink-0 rounded-full p-3 ${styles.iconBg}`}>
              {styles.icon}
            </div>
            <div className="flex-1">
              <div className="flex justify-between items-start">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  {title}
                </h3>
                <button
                  onClick={onCancel}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
              <p className="text-sm text-gray-600 whitespace-pre-line">
                {message}
              </p>
            </div>
          </div>
        </div>

        <div className="flex justify-end space-x-3 px-6 py-4 bg-gray-50 rounded-b-lg">
          <button
            onClick={onCancel}
            className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-100 transition-colors text-gray-700 font-medium"
          >
            {cancelText}
          </button>
          <button
            onClick={onConfirm}
            className={`px-4 py-2 text-white rounded-lg transition-colors font-medium ${styles.button}`}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}

