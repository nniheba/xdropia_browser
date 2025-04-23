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
  secureCredentials: (credentials: any, token?: string, userId?: number) => 
    ipcRenderer.invoke('secure-credentials', credentials, token, userId),
  
  changePassword: (oldPassword: string, newPassword: string) => 
    ipcRenderer.invoke('change-password', oldPassword, newPassword),
    
  syncCredentialsWithCloud: (token: string, userId: number) => 
    ipcRenderer.invoke('sync-credentials-with-cloud', token, userId),
  
  addCredential: (token: string, credentialData: any) => 
    ipcRenderer.invoke('add-credential', token, credentialData),
  
  updateCredential: (token: string, credentialId: string, updates: any) => 
    ipcRenderer.invoke('update-credential', token, credentialId, updates),
    
  registerSession: (token: string, deviceInfo: any) => 
    ipcRenderer.invoke('register-session', token, deviceInfo),
    
  endSession: (token: string, sessionId: string) => 
    ipcRenderer.invoke('end-session', token, sessionId),
    
  getAllSessions: (token: string) => 
    ipcRenderer.invoke('get-all-sessions', token),
});
