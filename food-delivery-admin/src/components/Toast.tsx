import { X, CheckCircle, XCircle, AlertTriangle, Info } from 'lucide-react';

interface ToastProps {
  message: string;
  type: 'success' | 'error' | 'warning' | 'info';
  onClose: () => void;
}

export default function Toast({ message, type, onClose }: ToastProps) {
  const getIcon = () => {
    switch (type) {
      case 'success':
        return <CheckCircle className="h-5 w-5" />;
      case 'error':
        return <XCircle className="h-5 w-5" />;
      case 'warning':
        return <AlertTriangle className="h-5 w-5" />;
      case 'info':
        return <Info className="h-5 w-5" />;
      default:
        return <Info className="h-5 w-5" />;
    }
  };

  const getStyles = () => {
    switch (type) {
      case 'success':
        return 'bg-green-600 text-white';
      case 'error':
        return 'bg-red-600 text-white';
      case 'warning':
        return 'bg-yellow-600 text-white';
      case 'info':
        return 'bg-blue-600 text-white';
      default:
        return 'bg-blue-600 text-white';
    }
  };

  return (
    <div className={`fixed top-4 right-4 z-[9999] px-6 py-4 rounded-lg shadow-lg flex items-center space-x-2 ${getStyles()}`}>
      {getIcon()}
      <span>{message}</span>
      <button onClick={onClose} className="ml-4 hover:opacity-75">
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}
