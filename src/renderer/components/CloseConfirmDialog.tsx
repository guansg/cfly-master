import { useState } from 'react';
import * as Dialog from '@radix-ui/react-dialog';

interface CloseConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onChoose: (behavior: 'minimize_to_tray' | 'exit', remember: boolean) => void;
}

export function CloseConfirmDialog({ open, onOpenChange, onChoose }: CloseConfirmDialogProps) {
  const [remember, setRemember] = useState(false);

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/50 z-50" />
        <Dialog.Content className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-md p-6 z-50">
          <Dialog.Title className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
            关闭主窗口
          </Dialog.Title>
          <Dialog.Description className="text-sm text-gray-600 dark:text-gray-400 mb-4">
            您希望点击关闭按钮时如何处理？
          </Dialog.Description>

          <label className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300 mb-4 cursor-pointer">
            <input
              type="checkbox"
              checked={remember}
              onChange={(e) => setRemember(e.target.checked)}
              className="rounded border-gray-300"
            />
            记住我的选择
          </label>

          <div className="flex gap-2 justify-end">
            <button
              type="button"
              className="px-4 py-2 text-sm rounded-lg border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700"
              onClick={() => onOpenChange(false)}
            >
              取消
            </button>
            <button
              type="button"
              className="px-4 py-2 text-sm rounded-lg bg-sky-600 text-white hover:bg-sky-700"
              onClick={() => onChoose('minimize_to_tray', remember)}
            >
              最小化到托盘
            </button>
            <button
              type="button"
              className="px-4 py-2 text-sm rounded-lg bg-red-600 text-white hover:bg-red-700"
              onClick={() => onChoose('exit', remember)}
            >
              直接退出
            </button>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
