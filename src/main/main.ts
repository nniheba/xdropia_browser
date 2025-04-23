import { app, BrowserWindow, session, ipcMain } from 'electron';
import * as path from 'path';
import * as url from 'url';
import Store from 'electron-store';

const store = new Store();

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
      devTools: process.env.NODE_ENV === 'development'
    },
    title: 'XDropia Browser',
    icon: path.join(__dirname, '../renderer/assets/icon.png')
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
