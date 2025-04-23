import { contextBridge, ipcRenderer } from 'electron';

contextBridge.exposeInMainWorld('api', {
  getUserData: () => ipcRenderer.invoke('get-user-data'),
  setUserData: (userData: any) => ipcRenderer.invoke('set-user-data', userData),
  clearUserData: () => ipcRenderer.invoke('clear-user-data'),
  
  checkActiveSession: (userData: any) => ipcRenderer.invoke('check-active-session', userData),
});
