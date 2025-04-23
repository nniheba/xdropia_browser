import { app, BrowserWindow, session, ipcMain, globalShortcut } from 'electron';
import * as path from 'path';
import * as url from 'url';
import Store from 'electron-store';

const store = new Store({
  encryptionKey: 'xdropia-secure-encryption-key',
  clearInvalidConfig: true
});

let mainWindow: BrowserWindow | null = null;

const createWindow = () => {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js'),
      webSecurity: true,
      devTools: process.env.NODE_ENV === 'development',
      spellcheck: false,
      allowRunningInsecureContent: false,
      experimentalFeatures: false,
      enableBlinkFeatures: '',
      disableBlinkFeatures: 'Auxclick,ContextMenu'
    },
    title: 'XDropia Browser',
    icon: path.join(__dirname, '../renderer/assets/icon.png'),
    autoHideMenuBar: process.env.NODE_ENV !== 'development',
    fullscreenable: true,
    darkTheme: true
  });

  if (process.env.NODE_ENV === 'development') {
    mainWindow.loadURL('http://localhost:3000');
    mainWindow.webContents.openDevTools();
  } else {
    mainWindow.loadURL(
      url.format({
        pathname: path.join(__dirname, '../renderer/index.html'),
        protocol: 'file:',
        slashes: true
      })
    );
  }

  if (process.env.NODE_ENV !== 'development') {
    mainWindow.setMenu(null);
  }

  if (process.env.NODE_ENV !== 'development') {
    mainWindow.webContents.on('context-menu', (e, params) => {
      e.preventDefault();
    });
  }

  if (process.env.NODE_ENV !== 'development') {
    mainWindow.webContents.on('devtools-opened', () => {
      mainWindow?.webContents.closeDevTools();
    });
  }

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
};

app.whenReady().then(() => {
  createWindow();
  
  if (process.env.NODE_ENV !== 'development') {
    globalShortcut.register('CommandOrControl+Shift+I', () => false);
    globalShortcut.register('CommandOrControl+Shift+J', () => false);
    globalShortcut.register('CommandOrControl+Shift+C', () => false);
    globalShortcut.register('F12', () => false);
    
    globalShortcut.register('CommandOrControl+Shift+X', () => false);
  }
  
  session.defaultSession.webRequest.onHeadersReceived((details, callback) => {
    callback({
      responseHeaders: {
        ...details.responseHeaders,
        'Content-Security-Policy': [
          "default-src 'self'; script-src 'self'; object-src 'none'; " +
          "style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; " +
          "connect-src 'self' https://app.xdropia.com; " +
          "frame-src 'none'; font-src 'self'; " +
          "base-uri 'self'; form-action 'self'"
        ]
      }
    });
  });

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

ipcMain.handle('get-user-data', async () => {
  return store.get('userData');
});

ipcMain.handle('set-user-data', async (_, userData) => {
  store.set('userData', userData);
  return true;
});

ipcMain.handle('clear-user-data', async () => {
  store.delete('userData');
  return true;
});

ipcMain.handle('check-active-session', async (_, userData) => {
  return true;
});

ipcMain.handle('prevent-inspection', async () => {
  if (process.env.NODE_ENV !== 'development' && mainWindow) {
    if (mainWindow.webContents.isDevToolsOpened()) {
      mainWindow.webContents.closeDevTools();
    }
    
    mainWindow.webContents.on('context-menu', (e) => {
      e.preventDefault();
    });
    
    return true;
  }
  return false;
});

ipcMain.handle('secure-credentials', async (_, credentials) => {
  if (!credentials) return null;
  
  const secureCredentials = Array.isArray(credentials) 
    ? credentials.map(cred => {
        if (cred.email) {
          const [username, domain] = cred.email.split('@');
          cred.maskedEmail = `${username.substring(0, 2)}***@${domain}`;
          delete cred.email;
        }
        
        if (cred.password) {
          cred.hasPassword = true;
          delete cred.password;
        }
        
        return cred;
      })
    : credentials;
  
  return secureCredentials;
});

ipcMain.handle('change-password', async (_, oldPassword, newPassword) => {
  try {
    const userData = store.get('userData');
    
    if (!userData) {
      return { success: false, message: 'No se encontró información de usuario' };
    }
    
    return { 
      success: true, 
      message: 'Contraseña actualizada correctamente' 
    };
  } catch (error) {
    console.error('Error changing password:', error);
    return { 
      success: false, 
      message: 'Error al cambiar la contraseña' 
    };
  }
});
