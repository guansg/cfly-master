import { BrowserWindow, app, session, screen } from 'electron';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import { settingsDAO, SETTINGS_KEYS } from '../database/dao/settings-dao';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let mainWindow: BrowserWindow | null = null;

const DEFAULT_WIDTH = 1400;
const DEFAULT_HEIGHT = 900;
const MIN_WIDTH = 1000;
const MIN_HEIGHT = 600;

interface WindowBounds {
  x: number;
  y: number;
  width: number;
  height: number;
  isMaximized?: boolean;
}

function getSavedBounds(): WindowBounds | null {
  try {
    const raw = settingsDAO.get(SETTINGS_KEYS.WINDOW_BOUNDS);
    if (!raw) return null;
    const bounds = JSON.parse(raw) as WindowBounds;
    if (typeof bounds.x !== 'number' || typeof bounds.y !== 'number' ||
        typeof bounds.width !== 'number' || typeof bounds.height !== 'number') {
      return null;
    }
    return bounds;
  } catch {
    return null;
  }
}

function saveBounds(bounds: WindowBounds) {
  settingsDAO.set(SETTINGS_KEYS.WINDOW_BOUNDS, JSON.stringify(bounds));
}

function isVisibleOnAnyDisplay(bounds: WindowBounds): boolean {
  const displays = screen.getAllDisplays();
  return displays.some(display => {
    const { x, y, width, height } = display.workArea;
    return (
      bounds.x < x + width &&
      bounds.x + bounds.width > x &&
      bounds.y < y + height &&
      bounds.y + bounds.height > y
    );
  });
}

function getInitialBounds(): { x?: number; y?: number; width: number; height: number; shouldMaximize: boolean } {
  const mode = settingsDAO.get(SETTINGS_KEYS.WINDOW_SIZE_MODE) || 'remember';

  if (mode === 'maximized') {
    return { width: DEFAULT_WIDTH, height: DEFAULT_HEIGHT, shouldMaximize: true };
  }

  if (mode === 'remember') {
    const saved = getSavedBounds();
    if (saved && isVisibleOnAnyDisplay(saved)) {
      return {
        x: saved.x,
        y: saved.y,
        width: Math.max(saved.width, MIN_WIDTH),
        height: Math.max(saved.height, MIN_HEIGHT),
        shouldMaximize: !!saved.isMaximized,
      };
    }
  }

  return { width: DEFAULT_WIDTH, height: DEFAULT_HEIGHT, shouldMaximize: false };
}

let saveBoundsTimer: ReturnType<typeof setTimeout> | null = null;

function debouncedSaveBounds() {
  if (!mainWindow || mainWindow.isDestroyed()) return;
  if (saveBoundsTimer) clearTimeout(saveBoundsTimer);
  saveBoundsTimer = setTimeout(() => {
    if (!mainWindow || mainWindow.isDestroyed()) return;
    const isMaximized = mainWindow.isMaximized();
    const bounds = mainWindow.getNormalBounds();
    saveBounds({
      x: bounds.x,
      y: bounds.y,
      width: bounds.width,
      height: bounds.height,
      isMaximized,
    });
  }, 500);
}

export function createMainWindow() {
  const isMac = process.platform === 'darwin';
  
  const isDev = process.env.VITE_DEV_SERVER_URL !== undefined;
  let preloadPath: string;
  
  if (isDev) {
    preloadPath = path.join(__dirname, '../preload/preload.js');
  } else {
    preloadPath = path.join(app.getAppPath(), 'dist/preload/preload.js');
  }
  
  console.log('[mainWindow] Preload path:', preloadPath);
  console.log('[mainWindow] __dirname:', __dirname);
  console.log('[mainWindow] isDev:', isDev);
  
  let iconPath: string | undefined;
  if (isDev) {
    iconPath = path.join(__dirname, '../../resources/icon.ico');
  } else {
    iconPath = path.join(app.getAppPath(), 'resources/icon.ico');
  }
  
  if (iconPath && fs.existsSync(iconPath)) {
    console.log('[mainWindow] Icon path:', iconPath);
  } else {
    console.warn('[mainWindow] Icon file not found at:', iconPath);
    iconPath = undefined;
  }

  const { x, y, width, height, shouldMaximize } = getInitialBounds();
  
  mainWindow = new BrowserWindow({
    x,
    y,
    width,
    height,
    minWidth: MIN_WIDTH,
    minHeight: MIN_HEIGHT,
    frame: false,
    titleBarStyle: isMac ? 'hiddenInset' : 'default',
    icon: iconPath,
    webPreferences: {
      preload: preloadPath,
      nodeIntegration: false,
      contextIsolation: true,
    },
    title: 'CflyPrism',
    show: false,
    autoHideMenuBar: true,
  });

  mainWindow.setMenuBarVisibility(false);
  mainWindow.setMenu(null);

  mainWindow.on('resize', debouncedSaveBounds);
  mainWindow.on('move', debouncedSaveBounds);
  mainWindow.on('maximize', debouncedSaveBounds);
  mainWindow.on('unmaximize', debouncedSaveBounds);

  const customUserAgent = `CflyPrism-Client/${app.getVersion()} (Electron)`;
  
  session.defaultSession.webRequest.onBeforeSendHeaders((details, callback) => {
    if (details.url.includes('/api/')) {
      details.requestHeaders['User-Agent'] = customUserAgent;
      console.log(`[MainWindow] Setting User-Agent for API request: ${customUserAgent}`);
    }
    callback({ requestHeaders: details.requestHeaders });
  });

  mainWindow.webContents.session.webRequest.onHeadersReceived((details, callback) => {
    const isDev = process.env.VITE_DEV_SERVER_URL !== undefined;
    
    const csp = isDev
      ? "default-src 'self'; script-src 'self' 'unsafe-inline' http://localhost:* ws://localhost:*; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' data:; connect-src 'self' https: http: ws://localhost:* wss://localhost:*; frame-src 'self' https:;"
      : "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' data:; connect-src 'self' https: http:; frame-src 'self' https:;";
    
    callback({
      responseHeaders: {
        ...details.responseHeaders,
        'Content-Security-Policy': [csp],
      },
    });
  });

  mainWindow.webContents.on('did-fail-load', (_event, errorCode, errorDescription, validatedURL) => {
    console.error('[MainWindow] Failed to load:', {
      errorCode,
      errorDescription,
      validatedURL
    });
  });

  mainWindow.webContents.on('console-message', (_event, level, message, line, sourceId) => {
    const levelStr = ['verbose', 'info', 'warning', 'error'][level] || 'log';
    console.log(`[Renderer ${levelStr.toUpperCase()}] ${message} (${sourceId}:${line})`);
  });

  mainWindow.webContents.on('did-finish-load', () => {
    console.log('[MainWindow] Page finished loading');
  });

  mainWindow.webContents.on('dom-ready', () => {
    console.log('[MainWindow] DOM ready');
  });

  mainWindow.once('ready-to-show', () => {
    if (mainWindow && !mainWindow.isDestroyed()) {
      if (shouldMaximize) {
        mainWindow.maximize();
      }
      mainWindow.show();
    }
  });

  if (process.env.VITE_DEV_SERVER_URL) {
    mainWindow.loadURL(process.env.VITE_DEV_SERVER_URL);
  } else {
    const indexPath = path.join(app.getAppPath(), 'dist', 'index.html');
    console.log('[MainWindow] Loading index.html from:', indexPath);
    console.log('[MainWindow] __dirname:', __dirname);
    console.log('[MainWindow] app.getAppPath():', app.getAppPath());
    console.log('[MainWindow] File exists:', fs.existsSync(indexPath));
    
    mainWindow.loadFile(indexPath).then(() => {
      console.log('[MainWindow] Successfully loaded index.html');
    }).catch((error) => {
      console.error('[MainWindow] Failed to load index.html:', error);
    });
  }

  mainWindow.on('close', (event) => {
    if (!(app as any).isQuitting) {
      const behavior = settingsDAO.get(SETTINGS_KEYS.CLOSE_BEHAVIOR);
      if (behavior === 'exit') {
        (app as any).isQuitting = true;
      } else {
        event.preventDefault();
        mainWindow?.hide();
      }
    }
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  return mainWindow;
}

export function getMainWindow() {
  return mainWindow;
}

export function showMainWindow() {
  if (mainWindow) {
    if (mainWindow.isMinimized()) {
      mainWindow.restore();
    }
    mainWindow.show();
    mainWindow.focus();
  }
}

export function hideMainWindow() {
  mainWindow?.hide();
}

export function resetWindowBounds() {
  if (!mainWindow || mainWindow.isDestroyed()) return;
  if (mainWindow.isMaximized()) {
    mainWindow.unmaximize();
  }
  mainWindow.setSize(DEFAULT_WIDTH, DEFAULT_HEIGHT);
  mainWindow.center();
  settingsDAO.delete(SETTINGS_KEYS.WINDOW_BOUNDS);
}
