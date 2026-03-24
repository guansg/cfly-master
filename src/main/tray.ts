import { app, Tray, Menu, nativeImage } from 'electron';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import { showMainWindow } from './windows/mainWindow';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let tray: Tray | null = null;

export function createTray() {
  const logoPath = path.join(__dirname, '../../resources/icons/menu/logo.png');
  const trayIconPath = path.join(__dirname, '../../resources/tray-icon.png');

  let icon;

  try {
    if (fs.existsSync(logoPath)) {
      icon = nativeImage.createFromPath(logoPath);
      if (!icon.isEmpty()) {
        tray = new Tray(icon);
        updateTray();
        tray.on('click', () => showMainWindow());
        return tray;
      }
    }
  } catch (error) {
    console.warn('Failed to load logo.png for tray icon:', error);
  }

  try {
    icon = nativeImage.createFromPath(trayIconPath);
    if (icon.isEmpty()) {
      throw new Error('Icon is empty');
    }
  } catch (error) {
    icon = nativeImage.createFromDataURL(
      'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAABHNCSVQICAgIfAhkiAAAAAlwSFlzAAAAdgAAAHYBTnsmCAAAABl0RVh0U29mdHdhcmUAd3d3Lmlua3NjYXBlLm9yZ5vuPBoAAABPSURBVDiNY2AYBaNgFIwCmICJgYHhPwMDw38C+AwDA8N/BgaG/wz4AROxmv8zMDD8Z2Bg+M+AH4xqGNUwqmFUw6iGUQ2jGkY1jGpgYBgFAACNZQQR9Vc4PAAAAABJRU5ErkJggg=='
    );
  }

  tray = new Tray(icon);

  updateTray();

  tray.on('click', () => {
    showMainWindow();
  });

  return tray;
}

export function updateTray() {
  if (!tray) return;

  tray.setToolTip('CflyPrism - 空闲');

  const menuTemplate: any[] = [
    {
      label: 'CflyPrism',
      enabled: false,
    },
    { type: 'separator' },
    {
      label: '显示主界面',
      click: () => showMainWindow(),
    },
  ];

  menuTemplate.push({ type: 'separator' });
  menuTemplate.push({
    label: '退出应用',
    click: () => {
      (app as any).isQuitting = true;
      app.quit();
    },
  });

  const contextMenu = Menu.buildFromTemplate(menuTemplate);
  tray.setContextMenu(contextMenu);
}

export function destroyTray() {
  if (tray) {
    tray.destroy();
    tray = null;
  }
}
