import * as Dialog from '@radix-ui/react-dialog';
import { AlertTriangle } from 'lucide-react';

interface ConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  onConfirm: () => void;
  type?: 'danger' | 'warning' | 'info';
}

export function ConfirmDialog({
  open,
  onOpenChange,
  title,
  message,
  confirmText,
  cancelText,
  onConfirm,
  type = 'warning',
}: ConfirmDialogProps) {
  const getColors = () => {
    switch (type) {
      case 'danger':
        return {
          bgColor: 'bg-red-100 dark:bg-red-900/30',
          iconColor: 'text-red-600 dark:text-red-400',
          buttonColor: 'bg-red-600 hover:bg-red-700 dark:bg-red-500 dark:hover:bg-red-600',
        };
      case 'warning':
        return {
          bgColor: 'bg-yellow-100 dark:bg-yellow-900/30',
          iconColor: 'text-yellow-600 dark:text-yellow-400',
          buttonColor: 'bg-yellow-600 hover:bg-yellow-700 dark:bg-yellow-500 dark:hover:bg-yellow-600',
        };
      default:
        return {
          bgColor: 'bg-blue-100 dark:bg-blue-900/30',
          iconColor: 'text-blue-600 dark:text-blue-400',
          buttonColor: 'bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600',
        };
    }
  };

  const { bgColor, iconColor, buttonColor } = getColors();

  const handleConfirm = () => {
    onConfirm();
    onOpenChange(false);
  };

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/50 z-[100]" />
        <Dialog.Content
          className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white dark:bg-gray-800 rounded-xl shadow-xl w-full max-w-md p-6 z-[100]"
          style={{ pointerEvents: 'auto', WebkitAppRegion: 'no-drag' } as React.CSSProperties}
          onPointerDown={(e) => e.stopPropagation()}
          onMouseDown={(e) => e.stopPropagation()}
        >
          <div className="flex items-start gap-4">
            <div className="flex-shrink-0">
              <div className={`w-12 h-12 rounded-full ${bgColor} flex items-center justify-center`}>
                <div className={iconColor}>
                  <AlertTriangle size={24} />
                </div>
              </div>
            </div>
            <div className="flex-1 min-w-0">
              <Dialog.Title className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                {title}
              </Dialog.Title>
              <Dialog.Description className="text-sm text-gray-600 dark:text-gray-400 whitespace-pre-line">
                {message}
              </Dialog.Description>
            </div>
          </div>
          <div className="flex justify-end gap-3 mt-6">
            <button
              onClick={() => onOpenChange(false)}
              className="px-6 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg transition-colors"
              style={{ WebkitAppRegion: 'no-drag' } as React.CSSProperties}
            >
              {cancelText || '取消'}
            </button>
            <button
              onClick={handleConfirm}
              className={`px-6 py-2 text-sm font-medium text-white rounded-lg transition-colors ${buttonColor}`}
              style={{ WebkitAppRegion: 'no-drag' } as React.CSSProperties}
            >
              {confirmText || '确认'}
            </button>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
