import { contextBridge, ipcRenderer } from 'electron';

if (process.env.NODE_ENV !== 'development') {
  const originalConsole = window.console;
  window.console = {
    ...originalConsole,
    log: (...args: any[]) => {
      if (process.env.NODE_ENV === 'development') {
        originalConsole.log(...args);
      }
    },
    debug: (...args: any[]) => {
      if (process.env.NODE_ENV === 'development') {
        originalConsole.debug(...args);
      }
    },
    info: (...args: any[]) => {
      if (process.env.NODE_ENV === 'development') {
        originalConsole.info(...args);
      }
    },
    warn: (...args: any[]) => {
      if (process.env.NODE_ENV === 'development') {
        originalConsole.warn(...args);
      }
    },
    error: (...args: any[]) => {
      if (process.env.NODE_ENV === 'development') {
        originalConsole.error(...args);
      }
    }
  };
}

contextBridge.exposeInMainWorld('api', {
  getUserData: () => ipcRenderer.invoke('get-user-data'),
  setUserData: (userData: any) => ipcRenderer.invoke('set-user-data', userData),
  clearUserData: () => ipcRenderer.invoke('clear-user-data'),
  
  checkActiveSession: (userData: any) => ipcRenderer.invoke('check-active-session', userData),
  
  preventInspection: () => ipcRenderer.invoke('prevent-inspection'),
  secureCredentials: (credentials: any) => ipcRenderer.invoke('secure-credentials', credentials),
  
  changePassword: (oldPassword: string, newPassword: string) => 
    ipcRenderer.invoke('change-password', oldPassword, newPassword),
});
