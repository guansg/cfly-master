import { useState } from 'react';
import { Minus, Square, X } from 'lucide-react';
import { MenuBar } from './MenuBar';
import { CloseConfirmDialog } from './CloseConfirmDialog';

interface TitleBarProps {
  onAction: (action: string) => void;
}

export function TitleBar({ onAction }: TitleBarProps) {
  const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
  const [closeDialogOpen, setCloseDialogOpen] = useState(false);

  const handleMinimize = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    try {
      const electronAPI = (window as any).electronAPI;
      if (electronAPI?.minimizeWindow) {
        await electronAPI.minimizeWindow();
      } else {
        console.error('[TitleBar] electronAPI.minimizeWindow is not available');
      }
    } catch (error) {
      console.error('[TitleBar] Error minimizing window:', error);
    }
  };

  const handleMaximize = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    try {
      const electronAPI = (window as any).electronAPI;
      if (electronAPI?.maximizeWindow) {
        await electronAPI.maximizeWindow();
      } else {
        console.error('electronAPI.maximizeWindow is not available');
      }
    } catch (error) {
      console.error('Error maximizing window:', error);
    }
  };

  const handleClose = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    try {
      const electronAPI = (window as any).electronAPI;
      if (!electronAPI?.closeWindow) {
        console.error('electronAPI.closeWindow is not available');
        return;
      }

      const behavior = await electronAPI.getCloseBehavior?.();
      if (behavior) {
        await electronAPI.closeWindow(behavior);
      } else {
        setCloseDialogOpen(true);
      }
    } catch (error) {
      console.error('Error closing window:', error);
    }
  };

  const handleCloseChoice = async (behavior: 'minimize_to_tray' | 'exit', remember: boolean) => {
    setCloseDialogOpen(false);
    try {
      const electronAPI = (window as any).electronAPI;
      if (remember) {
        await electronAPI.setCloseBehavior?.(behavior);
      }
      await electronAPI.closeWindow?.(behavior);
    } catch (error) {
      console.error('Error executing close behavior:', error);
    }
  };

  return (
    <div className="h-9 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 flex items-center select-none relative z-0">
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <span className="text-xs font-semibold text-gray-600 dark:text-gray-400">
          CflyPrism
        </span>
      </div>

      {isMac && (
        <div
          className="flex items-center gap-2 px-3 flex-shrink-0"
          style={{ WebkitAppRegion: 'no-drag' } as React.CSSProperties}
        >
          <button
            onClick={handleClose}
            className="w-3 h-3 rounded-full bg-red-500 hover:bg-red-600 transition-colors focus:outline-none"
            aria-label="关闭"
          />
          <button
            onClick={handleMinimize}
            className="w-3 h-3 rounded-full bg-yellow-500 hover:bg-yellow-600 transition-colors focus:outline-none"
            aria-label="最小化"
          />
          <button
            onClick={handleMaximize}
            className="w-3 h-3 rounded-full bg-green-500 hover:bg-green-600 transition-colors focus:outline-none"
            aria-label="最大化"
          />
        </div>
      )}

      <div
        className="flex-1 flex items-center px-2 h-full relative"
        style={{ WebkitAppRegion: 'drag' } as React.CSSProperties}
      >
        <div
          style={{ WebkitAppRegion: 'no-drag' } as React.CSSProperties}
          className="h-full"
        >
          <MenuBar onAction={onAction} />
        </div>
      </div>

      {!isMac && (
        <div
          className="flex items-center flex-shrink-0"
          style={{ WebkitAppRegion: 'no-drag' } as React.CSSProperties}
        >
          <button
            onClick={handleMinimize}
            className="h-9 w-12 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center justify-center transition-colors focus:outline-none"
            aria-label="最小化"
          >
            <Minus size={16} className="text-gray-700 dark:text-gray-300" />
          </button>
          <button
            onClick={handleMaximize}
            className="h-9 w-12 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center justify-center transition-colors focus:outline-none"
            aria-label="最大化"
          >
            <Square size={14} className="text-gray-700 dark:text-gray-300" />
          </button>
          <button
            onClick={handleClose}
            className="h-9 w-12 hover:bg-red-500 hover:text-white flex items-center justify-center transition-colors focus:outline-none"
            aria-label="关闭"
          >
            <X size={16} className="text-gray-700 dark:text-gray-300" />
          </button>
        </div>
      )}

      <CloseConfirmDialog
        open={closeDialogOpen}
        onOpenChange={setCloseDialogOpen}
        onChoose={handleCloseChoice}
      />
    </div>
  );
}
