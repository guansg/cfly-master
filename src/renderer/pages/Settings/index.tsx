/**
 * 设置 — 仅常规
 */

import { useState, useEffect } from 'react';
import { Settings as SettingsIcon } from 'lucide-react';

export function Settings() {
  const [closeBehavior, setCloseBehavior] = useState<string>('');

  useEffect(() => {
    loadGeneralSettings();
  }, []);

  const loadGeneralSettings = async () => {
    try {
      const behavior = await window.electron.ipcRenderer.invoke('get-close-behavior');
      setCloseBehavior(behavior || '');
    } catch (error) {
      console.error('[Settings] Failed to load general settings:', error);
    }
  };

  const handleCloseBehaviorChange = async (value: string) => {
    setCloseBehavior(value);
    try {
      await window.electron.ipcRenderer.invoke('set-close-behavior', value || null);
    } catch (error) {
      console.error('[Settings] Failed to save close behavior:', error);
    }
  };

  return (
    <div className="flex h-full bg-white dark:bg-gray-900">
      <div className="w-52 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 flex-shrink-0">
        <div className="p-4">
          <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100">
            设置
          </h1>
          <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
            管理应用程序设置和偏好
          </p>
        </div>

        <nav className="px-2 pb-4">
          <div
            className="
              w-full flex items-center gap-2 px-3 py-2.5 rounded-lg transition-all mb-1
              bg-sky-50 dark:bg-sky-900/20 text-sky-600 dark:text-sky-400
            "
          >
            <SettingsIcon size={18} />
            <span className="font-medium text-sm">常规</span>
          </div>
        </nav>
      </div>

      <div className="flex-1 overflow-y-auto bg-white dark:bg-gray-900">
        <div className="max-w-2xl p-6 space-y-10 pb-40">
          <div>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4">
              常规
            </h2>

            <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
              <label className="block text-sm font-medium text-gray-900 dark:text-gray-100">
                关闭窗口行为
              </label>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 mb-3">
                点击关闭按钮时的默认操作
              </p>

              <select
                value={closeBehavior}
                onChange={(e) => handleCloseBehaviorChange(e.target.value)}
                className="w-full max-w-xs px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-sky-500 focus:border-transparent"
              >
                <option value="">每次询问</option>
                <option value="minimize_to_tray">
                  最小化到托盘
                </option>
                <option value="exit">直接退出</option>
              </select>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
