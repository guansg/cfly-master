import { ipcMain, BrowserWindow, app, shell } from 'electron';
import { getMainWindow } from './windows/mainWindow';
import { settingsDAO, SETTINGS_KEYS } from './database/dao/settings-dao';
import { workflowDAO } from './workflow/database/workflow-dao';

console.log('[IPC] IPC handlers module loaded');

ipcMain.on('toggle-devtools', (event) => {
  const window = BrowserWindow.fromWebContents(event.sender);
  if (window) {
    if (window.webContents.isDevToolsOpened()) {
      window.webContents.closeDevTools();
    } else {
      window.webContents.openDevTools();
    }
  }
});

ipcMain.handle('get-app-version', async () => {
  return app.getVersion();
});

// Quit application
ipcMain.handle('quit-app', async () => {
  (app as any).isQuitting = true;
  app.quit();
});

// Theme broadcast
ipcMain.on('theme-changed', (_event, theme) => {
  BrowserWindow.getAllWindows().forEach((win) => {
    win.webContents.send('set-theme', theme);
  });
});

// Window: minimize
ipcMain.handle('window-minimize', () => {
  const window = BrowserWindow.getFocusedWindow();
  if (window) {
    window.minimize();
  }
  return { success: true };
});

// Window: maximize / restore
ipcMain.handle('window-maximize', () => {
  const window = BrowserWindow.getFocusedWindow();
  if (window) {
    if (window.isMaximized()) {
      window.unmaximize();
    } else {
      window.maximize();
    }
  }
  return { success: true };
});

// Window: close (behavior from settings or argument)
ipcMain.handle('window-close', (_event, behavior?: string) => {
  const window = BrowserWindow.getFocusedWindow();
  if (window) {
    const mainWin = getMainWindow();
    if (window === mainWin) {
      const action = behavior || settingsDAO.get(SETTINGS_KEYS.CLOSE_BEHAVIOR);
      if (action === 'exit') {
        (app as any).isQuitting = true;
        app.quit();
      } else {
        window.hide();
      }
    } else {
      window.close();
    }
  }
  return { success: true };
});

ipcMain.handle('get-close-behavior', () => {
  return settingsDAO.get(SETTINGS_KEYS.CLOSE_BEHAVIOR);
});

ipcMain.handle('set-close-behavior', (_event, value: string | null) => {
  return settingsDAO.set(SETTINGS_KEYS.CLOSE_BEHAVIOR, value);
});

/** Open a URL in the system default browser. */
ipcMain.handle('shell:open-external', async (_event, url: string) => {
  try {
    if (!url || (!url.startsWith('https://') && !url.startsWith('http://'))) {
      throw new Error('Only http/https URLs are allowed');
    }
    await shell.openExternal(url);
    return { success: true };
  } catch (error: any) {
    console.error('[IPC] Failed to open external URL:', error);
    return { success: false, error: error.message };
  }
});

// ==================== Workflow CRUD IPC ====================

ipcMain.handle('workflow:list', async () => {
  try {
    return { success: true, data: workflowDAO.getAll() };
  } catch (error: any) {
    console.error('[IPC] workflow:list error:', error);
    return { success: false, error: error.message };
  }
});

ipcMain.handle('workflow:get', async (_event, id: string) => {
  try {
    const workflow = workflowDAO.getById(id);
    if (!workflow) return { success: false, error: 'Workflow not found' };
    return { success: true, data: workflow };
  } catch (error: any) {
    console.error('[IPC] workflow:get error:', error);
    return { success: false, error: error.message };
  }
});

ipcMain.handle('workflow:create', async (_event, data: { name: string; description?: string; definition: string; tags?: string }) => {
  try {
    const workflow = workflowDAO.create(data);
    return { success: true, data: workflow };
  } catch (error: any) {
    console.error('[IPC] workflow:create error:', error);
    return { success: false, error: error.message };
  }
});

ipcMain.handle('workflow:update', async (_event, id: string, updates: any) => {
  try {
    const ok = workflowDAO.update(id, updates);
    return { success: ok };
  } catch (error: any) {
    console.error('[IPC] workflow:update error:', error);
    return { success: false, error: error.message };
  }
});

ipcMain.handle('workflow:save', async (_event, id: string, definition: string, changeNote?: string) => {
  try {
    const ok = workflowDAO.save(id, definition, changeNote);
    return { success: ok };
  } catch (error: any) {
    console.error('[IPC] workflow:save error:', error);
    return { success: false, error: error.message };
  }
});

ipcMain.handle('workflow:delete', async (_event, id: string) => {
  try {
    const ok = workflowDAO.delete(id);
    return { success: ok };
  } catch (error: any) {
    console.error('[IPC] workflow:delete error:', error);
    return { success: false, error: error.message };
  }
});

// ==================== Workflow execution IPC (worker thread) ====================

ipcMain.handle('workflow:execute', async (_event, workflowId: string) => {
  try {
    const { workflowOrchestrator } = await import('./workflow');

    const wfRow = workflowDAO.getById(workflowId);
    if (!wfRow) return { success: false, error: 'Workflow not found' };

    const mainWindow = getMainWindow();
    const result = await workflowOrchestrator.execute({
      workflowId: wfRow.id,
      workflowName: wfRow.name,
      definition: wfRow.definition,
      mainWindow,
    });

    if (!result.success) return result;

    return {
      success: true,
      data: {
        status: result.status,
        durationMs: result.durationMs,
        lastNodeExecuted: result.lastNodeExecuted,
        error: result.error,
        nodeResults: result.nodeResults || {},
      },
    };
  } catch (error: any) {
    console.error('[IPC] workflow:execute error:', error);
    return { success: false, error: error.message };
  }
});

ipcMain.handle('workflow:cancel', async (_event, executionId: string) => {
  try {
    const { workflowOrchestrator } = await import('./workflow');
    workflowOrchestrator.cancel(executionId);
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
});

ipcMain.handle('workflow:running-instances', async () => {
  try {
    const { workflowOrchestrator } = await import('./workflow');
    return { success: true, data: workflowOrchestrator.getRunningInstances() };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
});
