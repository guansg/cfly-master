const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  versions: {
    node: process.versions.node,
    chrome: process.versions.chrome,
    electron: process.versions.electron,
  },

  getAppVersion: () => {
    return ipcRenderer.invoke('get-app-version');
  },

  quit: () => {
    return ipcRenderer.invoke('quit-app');
  },

  on: (channel: string, callback: Function) => {
    const validChannels = [
      'navigate-to',
      'set-theme',
      'menu-action',
      'workflow:node-start',
      'workflow:node-done',
      'workflow:node-error',
      'workflow:log',
    ];

    if (validChannels.includes(channel)) {
      const subscription = (_event: any, ...args: any[]) => callback(...args);
      ipcRenderer.on(channel, subscription);
      return subscription;
    }
  },

  removeListener: (channel: string, callback: Function) => {
    ipcRenderer.removeListener(channel, callback as any);
  },

  notifyThemeChanged: (theme: string) => {
    ipcRenderer.send('theme-changed', theme);
  },

  minimizeWindow: () => {
    return ipcRenderer.invoke('window-minimize');
  },

  maximizeWindow: () => {
    return ipcRenderer.invoke('window-maximize');
  },

  closeWindow: (behavior?: string) => {
    return ipcRenderer.invoke('window-close', behavior);
  },

  getCloseBehavior: () => {
    return ipcRenderer.invoke('get-close-behavior');
  },

  setCloseBehavior: (value: string | null) => {
    return ipcRenderer.invoke('set-close-behavior', value);
  },

  openExternal: (url: string) => {
    return ipcRenderer.invoke('shell:open-external', url);
  },
});

contextBridge.exposeInMainWorld('electron', {
  ipcRenderer: {
    invoke: (channel: string, ...args: any[]) => {
      const validChannels = [
        'get-close-behavior',
        'set-close-behavior',
        'shell:open-external',
        'workflow:list',
        'workflow:get',
        'workflow:create',
        'workflow:update',
        'workflow:save',
        'workflow:delete',
        'workflow:execute',
        'workflow:cancel',
        'workflow:running-instances',
      ];

      if (validChannels.includes(channel)) {
        return ipcRenderer.invoke(channel, ...args);
      }

      throw new Error(`Invalid IPC channel: ${channel}`);
    },
  },
});

declare global {
  interface Window {
    electronAPI: {
      versions: {
        node: string;
        chrome: string;
        electron: string;
      };
      getAppVersion: () => Promise<string>;
      quit: () => Promise<void>;
      on: (channel: string, callback: Function) => Function | undefined;
      removeListener: (channel: string, callback: Function) => void;
      notifyThemeChanged: (theme: string) => void;
      minimizeWindow: () => Promise<{ success: boolean }>;
      maximizeWindow: () => Promise<{ success: boolean }>;
      closeWindow: (behavior?: string) => Promise<{ success: boolean }>;
      getCloseBehavior: () => Promise<string | null>;
      setCloseBehavior: (value: string | null) => Promise<boolean>;
      openExternal: (url: string) => Promise<{ success: boolean; error?: string }>;
    };
    electron: {
      ipcRenderer: {
        invoke: (channel: string, ...args: any[]) => Promise<any>;
      };
    };
  }
}

export {};
