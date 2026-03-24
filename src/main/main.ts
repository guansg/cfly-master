import { app, Menu } from 'electron';
import { createMainWindow, showMainWindow } from './windows/mainWindow';
import { createTray, destroyTray } from './tray';
import { getDatabase, closeDatabase } from './database/db';
import { settingsDAO, SETTINGS_KEYS } from './database/dao/settings-dao';
import './ipc';

(app as any).isQuitting = false;

app.whenReady().then(async () => {
  try {
    getDatabase();
    console.log('[Main] Database initialized');
  } catch (error) {
    console.error('[Main] Failed to initialize database:', error);
  }

  const storedLang = settingsDAO.get(SETTINGS_KEYS.LANGUAGE);
  if (storedLang && storedLang !== 'zh-CN') {
    settingsDAO.set(SETTINGS_KEYS.LANGUAGE, 'zh-CN');
  }

  createMainWindow();

  createTray();

  if (process.platform === 'darwin') {
    Menu.setApplicationMenu(null);
  }

  app.on('activate', () => {
    showMainWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    // keep running while tray exists
  }
});

app.on('before-quit', () => {
  (app as any).isQuitting = true;
  destroyTray();
  closeDatabase();
  console.log('[Main] Application cleanup completed');
});

const gotTheLock = app.requestSingleInstanceLock();

if (!gotTheLock) {
  app.quit();
} else {
  app.on('second-instance', () => {
    showMainWindow();
  });
}
