import { app, BrowserWindow, session, ipcMain, globalShortcut, net } from 'electron';
import * as path from 'path';
import * as url from 'url';
import Store from 'electron-store';
import * as crypto from 'crypto';
import * as os from 'os';

const getMachineId = () => {
  const networkInterfaces = os.networkInterfaces();
  let macAddress = '';
  
  Object.keys(networkInterfaces).forEach((interfaceName) => {
    const interfaces = networkInterfaces[interfaceName];
    if (interfaces) {
      for (let i = 0; i < interfaces.length; i++) {
        if (!interfaces[i].internal) {
          macAddress = interfaces[i].mac;
          break;
        }
      }
    }
  });
  
  return crypto.createHash('sha256').update(macAddress + os.hostname()).digest('hex');
};

const encryptionKey = crypto.scryptSync(
  'xdropia-secure-encryption-key', 
  'xdropia-salt', 
  32
);

const IV_LENGTH = 16;

const encrypt = (text: string): string => {
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv('aes-256-gcm', encryptionKey, iv);
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  const authTag = cipher.getAuthTag().toString('hex');
  return iv.toString('hex') + ':' + authTag + ':' + encrypted;
};

const decrypt = (text: string): string => {
  try {
    const parts = text.split(':');
    if (parts.length !== 3) throw new Error('Invalid encrypted text format');
    
    const iv = Buffer.from(parts[0], 'hex');
    const authTag = Buffer.from(parts[1], 'hex');
    const encryptedText = parts[2];
    
    const decipher = crypto.createDecipheriv('aes-256-gcm', encryptionKey, iv);
    decipher.setAuthTag(authTag);
    
    let decrypted = decipher.update(encryptedText, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    
    return decrypted;
  } catch (error) {
    console.error('Decryption error:', error);
    return '';
  }
};

const store = new Store({
  encryptionKey: encryptionKey.toString('hex'),
  clearInvalidConfig: true,
  beforeEachMigration: (store, context) => {
    console.log(`Migrating store from version ${context.fromVersion} to ${context.toVersion}`);
  }
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

interface SessionResponse {
  session_id: string;
  expires_at: string;
  user_id: number;
  status: string;
}

const syncSessionWithCloud = async (token: string, sessionData: any): Promise<SessionResponse | null> => {
  try {
    const request = net.request({
      method: 'POST',
      url: `${CLOUD_API_URL}/sessions`,
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    return new Promise<SessionResponse>((resolve, reject) => {
      let data = '';
      
      request.on('response', (response) => {
        response.on('data', (chunk) => {
          data += chunk;
        });
        
        response.on('end', () => {
          if (response.statusCode === 200 || response.statusCode === 201) {
            try {
              const result = JSON.parse(data) as SessionResponse;
              resolve(result);
            } catch (error) {
              reject(new Error('Invalid JSON response'));
            }
          } else {
            reject(new Error(`HTTP Error: ${response.statusCode}`));
          }
        });
      });
      
      request.on('error', (error) => {
        reject(error);
      });
      
      const postData = JSON.stringify({
        ...sessionData,
        machine_id: getMachineId()
      });
      
      request.write(postData);
      request.end();
    });
  } catch (error) {
    console.error('Error syncing session with cloud:', error);
    return null;
  }
};

ipcMain.handle('get-user-data', async () => {
  const userData = store.get('userData');
  if (userData && typeof userData === 'string') {
    try {
      return JSON.parse(decrypt(userData));
    } catch (error) {
      console.error('Error decrypting user data:', error);
      return null;
    }
  }
  return userData;
});

ipcMain.handle('set-user-data', async (_, userData) => {
  if (userData) {
    store.set('userData', encrypt(JSON.stringify(userData)));
  } else {
    store.delete('userData');
  }
  return true;
});

ipcMain.handle('clear-user-data', async () => {
  store.delete('userData');
  store.delete('encryptedCredentials');
  store.delete('sessionData');
  return true;
});

ipcMain.handle('check-active-session', async (_, userData) => {
  if (!userData) return false;
  
  const sessionData = store.get('sessionData');
  if (!sessionData) return false;
  
  try {
    const decryptedSession = typeof sessionData === 'string' 
      ? JSON.parse(decrypt(sessionData))
      : sessionData;
    
    if (decryptedSession.expires_at && new Date(decryptedSession.expires_at) < new Date()) {
      store.delete('sessionData');
      return false;
    }
    
    return true;
  } catch (error) {
    console.error('Error checking active session:', error);
    return false;
  }
});

ipcMain.handle('register-session', async (_, token, deviceInfo) => {
  try {
    const sessionData = {
      device_name: deviceInfo.name || 'XDropia Browser',
      device_type: deviceInfo.type || 'desktop',
      app_version: app.getVersion(),
      os_type: os.type(),
      os_platform: os.platform(),
      os_release: os.release(),
      created_at: new Date().toISOString()
    };
    
    const result = await syncSessionWithCloud(token, sessionData);
    
    if (result && result.session_id) {
      const sessionToStore = {
        ...sessionData,
        session_id: result.session_id,
        expires_at: result.expires_at
      };
      
      store.set('sessionData', encrypt(JSON.stringify(sessionToStore)));
      return { success: true, session: sessionToStore };
    }
    
    return { success: false, message: 'No se pudo registrar la sesión' };
  } catch (error) {
    console.error('Error registering session:', error);
    return { success: false, message: 'Error al registrar la sesión' };
  }
});

ipcMain.handle('end-session', async (_, token, sessionId) => {
  try {
    const request = net.request({
      method: 'DELETE',
      url: `${CLOUD_API_URL}/sessions/${sessionId}`,
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    return new Promise((resolve, reject) => {
      let data = '';
      
      request.on('response', (response) => {
        response.on('data', (chunk) => {
          data += chunk;
        });
        
        response.on('end', () => {
          if (response.statusCode === 200 || response.statusCode === 204) {
            const sessionData = store.get('sessionData');
            if (sessionData) {
              try {
                const decryptedSession = typeof sessionData === 'string' 
                  ? JSON.parse(decrypt(sessionData))
                  : sessionData;
                
                if (decryptedSession.session_id === sessionId) {
                  store.delete('sessionData');
                }
              } catch (error) {
                console.error('Error decrypting session data:', error);
              }
            }
            
            resolve({ success: true });
          } else {
            try {
              const errorData = JSON.parse(data);
              reject(new Error(errorData.message || `HTTP Error: ${response.statusCode}`));
            } catch (error) {
              reject(new Error(`HTTP Error: ${response.statusCode}`));
            }
          }
        });
      });
      
      request.on('error', (error) => {
        reject(error);
      });
      
      request.end();
    });
  } catch (error) {
    console.error('Error ending session:', error);
    return { success: false, message: 'Error al finalizar la sesión' };
  }
});

ipcMain.handle('get-all-sessions', async (_, token) => {
  try {
    const request = net.request({
      method: 'GET',
      url: `${CLOUD_API_URL}/sessions/all`,
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    return new Promise((resolve, reject) => {
      let data = '';
      
      request.on('response', (response) => {
        response.on('data', (chunk) => {
          data += chunk;
        });
        
        response.on('end', () => {
          if (response.statusCode === 200) {
            try {
              const sessions = JSON.parse(data);
              resolve({ success: true, sessions });
            } catch (error) {
              reject(new Error('Invalid JSON response'));
            }
          } else {
            reject(new Error(`HTTP Error: ${response.statusCode}`));
          }
        });
      });
      
      request.on('error', (error) => {
        reject(error);
      });
      
      request.end();
    });
  } catch (error) {
    console.error('Error getting all sessions:', error);
    return { success: false, message: 'Error al obtener las sesiones', sessions: [] };
  }
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

const CLOUD_API_URL = 'https://app.xdropia.com/wp-json/xdropia/v1';

const fetchCredentialsFromCloud = async (token: string, userId: number) => {
  try {
    const request = net.request({
      method: 'GET',
      url: `${CLOUD_API_URL}/credentials/user/${userId}`,
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    return new Promise((resolve, reject) => {
      let data = '';
      
      request.on('response', (response) => {
        response.on('data', (chunk) => {
          data += chunk;
        });
        
        response.on('end', () => {
          if (response.statusCode === 200) {
            try {
              const credentials = JSON.parse(data);
              store.set('encryptedCredentials', encrypt(JSON.stringify(credentials)));
              resolve(credentials);
            } catch (error) {
              reject(new Error('Invalid JSON response'));
            }
          } else {
            reject(new Error(`HTTP Error: ${response.statusCode}`));
          }
        });
      });
      
      request.on('error', (error) => {
        reject(error);
      });
      
      request.end();
    });
  } catch (error) {
    console.error('Error fetching credentials from cloud:', error);
    const encryptedCredentials = store.get('encryptedCredentials') as string;
    if (encryptedCredentials) {
      try {
        return JSON.parse(decrypt(encryptedCredentials));
      } catch (error) {
        console.error('Error decrypting local credentials:', error);
        return null;
      }
    }
    return null;
  }
};

ipcMain.handle('add-credential', async (_, token, credentialData) => {
  try {
    const request = net.request({
      method: 'POST',
      url: `${CLOUD_API_URL}/credentials`,
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    return new Promise((resolve, reject) => {
      let data = '';
      
      request.on('response', (response) => {
        response.on('data', (chunk) => {
          data += chunk;
        });
        
        response.on('end', () => {
          if (response.statusCode === 200 || response.statusCode === 201) {
            try {
              const result = JSON.parse(data);
              resolve({ success: true, credential: result });
            } catch (error) {
              reject(new Error('Invalid JSON response'));
            }
          } else {
            try {
              const errorData = JSON.parse(data);
              reject(new Error(errorData.message || `HTTP Error: ${response.statusCode}`));
            } catch (error) {
              reject(new Error(`HTTP Error: ${response.statusCode}`));
            }
          }
        });
      });
      
      request.on('error', (error) => {
        reject(error);
      });
      
      const postData = JSON.stringify(credentialData);
      request.write(postData);
      request.end();
    });
  } catch (error) {
    console.error('Error adding credential:', error);
    return { success: false, message: 'Error al añadir credencial' };
  }
});

ipcMain.handle('update-credential', async (_, token, credentialId, updates) => {
  try {
    const request = net.request({
      method: 'PATCH',
      url: `${CLOUD_API_URL}/credentials/${credentialId}`,
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    return new Promise((resolve, reject) => {
      let data = '';
      
      request.on('response', (response) => {
        response.on('data', (chunk) => {
          data += chunk;
        });
        
        response.on('end', () => {
          if (response.statusCode === 200) {
            try {
              const result = JSON.parse(data);
              resolve({ success: true, credential: result });
            } catch (error) {
              reject(new Error('Invalid JSON response'));
            }
          } else {
            try {
              const errorData = JSON.parse(data);
              reject(new Error(errorData.message || `HTTP Error: ${response.statusCode}`));
            } catch (error) {
              reject(new Error(`HTTP Error: ${response.statusCode}`));
            }
          }
        });
      });
      
      request.on('error', (error) => {
        reject(error);
      });
      
      const postData = JSON.stringify(updates);
      request.write(postData);
      request.end();
    });
  } catch (error) {
    console.error('Error updating credential:', error);
    return { success: false, message: 'Error al actualizar credencial' };
  }
});

ipcMain.handle('sync-credentials-with-cloud', async (_, token, userId) => {
  try {
    const cloudCredentials = await fetchCredentialsFromCloud(token, userId);
    if (cloudCredentials) {
      return { success: true, credentials: cloudCredentials };
    } else {
      return { success: false, message: 'No se pudieron sincronizar las credenciales' };
    }
  } catch (error) {
    console.error('Error syncing credentials with cloud:', error);
    return { success: false, message: 'Error al sincronizar credenciales' };
  }
});

ipcMain.handle('secure-credentials', async (_, credentials, token, userId) => {
  if (!credentials) {
    if (token && userId) {
      try {
        const cloudCredentials = await fetchCredentialsFromCloud(token, userId);
        if (cloudCredentials) {
          credentials = cloudCredentials;
        }
      } catch (error) {
        console.error('Error fetching cloud credentials:', error);
      }
    }
    
    if (!credentials) {
      const encryptedCredentials = store.get('encryptedCredentials') as string;
      if (encryptedCredentials) {
        try {
          credentials = JSON.parse(decrypt(encryptedCredentials));
        } catch (error) {
          console.error('Error decrypting local credentials:', error);
          return null;
        }
      } else {
        return null;
      }
    }
  }
  
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
