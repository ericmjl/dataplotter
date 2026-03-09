const { app, BrowserWindow, Menu } = require('electron');
const path = require('path');
let autoUpdater;
try {
  autoUpdater = require('electron-updater').autoUpdater;
} catch {
  autoUpdater = null;
}

const isDev = process.env.NODE_ENV === 'development' || !app.isPackaged;

function createWindow() {
  const preloadPath = path.join(__dirname, 'preload.cjs');
  const win = new BrowserWindow({
    width: 1280,
    height: 800,
    webPreferences: {
      preload: preloadPath,
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
    },
  });

  if (isDev) {
    win.loadURL('http://localhost:5173');
    win.webContents.openDevTools();
  } else {
    win.loadFile(path.join(__dirname, '..', 'dist', 'index.html'));
  }

  const menu = Menu.buildFromTemplate([
    {
      label: 'File',
      submenu: [
        { role: 'quit', label: 'Quit' },
      ],
    },
    { role: 'editMenu', label: 'Edit' },
    { role: 'windowMenu', label: 'Window' },
    { role: 'help', label: 'Help' },
  ]);
  Menu.setApplicationMenu(menu);
}

function setupAutoUpdater() {
  if (isDev || !autoUpdater) return;

  autoUpdater.logger = console;
  autoUpdater.autoDownload = false;
  autoUpdater.autoInstallOnAppQuit = true;

  autoUpdater.checkForUpdates();

  autoUpdater.on('update-available', () => {
    console.log('Update available. Downloading...');
    autoUpdater.downloadUpdate();
  });

  autoUpdater.on('update-not-available', () => {
    console.log('No updates available.');
  });

  autoUpdater.on('update-downloaded', () => {
    console.log('Update downloaded. Will install on quit.');
  });

  autoUpdater.on('error', (error) => {
    console.error('Auto-updater error:', error);
  });
}

app.whenReady().then(() => {
  createWindow();
  setupAutoUpdater();
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) createWindow();
});
