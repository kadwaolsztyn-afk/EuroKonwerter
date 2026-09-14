const { app, BrowserWindow, shell, Menu, screen } = require('electron');
const path = require('path');
const fs = require('fs');

let mainWindow = null;

// Force 100% portable isolation: store all Electron data inside program directory, not in Windows AppData
const programDir = app.isPackaged ? path.dirname(app.getPath('exe')) : process.cwd();
const portableDataDir = path.join(programDir, 'data');
if (!fs.existsSync(portableDataDir)) {
  try {
    fs.mkdirSync(portableDataDir, { recursive: true });
  } catch (_) {}
}

try {
  app.setPath('userData', path.join(portableDataDir, 'userData'));
  app.setPath('sessionData', path.join(portableDataDir, 'sessionData'));
} catch (e) {
  // Ignored if setPath cannot be altered at this phase
}

// File path for storing window bounds and maximized state inside program directory
function getWindowStateFilePath() {
  return path.join(portableDataDir, 'window-state.json');
}

function loadWindowState() {
  const defaultState = {
    width: 1440,
    height: 920,
    x: undefined,
    y: undefined,
    isMaximized: false,
  };

  try {
    const filePath = getWindowStateFilePath();
    if (fs.existsSync(filePath)) {
      const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
      
      // Validate that the saved position is still visible on one of the connected displays
      if (data.x !== undefined && data.y !== undefined) {
        const displays = screen.getAllDisplays();
        const isVisible = displays.some(display => {
          const { x, y, width, height } = display.bounds;
          return (
            data.x >= x - 50 &&
            data.x < x + width &&
            data.y >= y - 50 &&
            data.y < y + height
          );
        });

        if (!isVisible) {
          data.x = undefined;
          data.y = undefined;
        }
      }

      return { ...defaultState, ...data };
    }
  } catch (err) {
    console.error('Error loading window state:', err);
  }

  return defaultState;
}

function saveWindowState(win) {
  if (!win) return;
  try {
    const isMaximized = win.isMaximized();
    let bounds;
    
    if (isMaximized) {
      bounds = win.getNormalBounds();
    } else {
      bounds = win.getBounds();
    }

    const state = {
      width: bounds.width,
      height: bounds.height,
      x: bounds.x,
      y: bounds.y,
      isMaximized: isMaximized,
    };

    fs.writeFileSync(getWindowStateFilePath(), JSON.stringify(state, null, 2), 'utf8');
  } catch (err) {
    console.error('Error saving window state:', err);
  }
}

function createWindow() {
  const iconPath = path.join(__dirname, 'icon.png');
  const windowState = loadWindowState();

  const windowOptions = {
    width: windowState.width || 1440,
    height: windowState.height || 920,
    minWidth: 1024,
    minHeight: 700,
    backgroundColor: '#020617',
    title: 'Cennik Lamp Samochodowych',
    icon: iconPath,
    show: false,
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: true,
      spellcheck: false,
    },
  };

  if (windowState.x !== undefined && windowState.y !== undefined) {
    windowOptions.x = windowState.x;
    windowOptions.y = windowState.y;
  }

  mainWindow = new BrowserWindow(windowOptions);

  // Remove default menu for a clean modern app feel
  Menu.setApplicationMenu(null);

  if (windowState.isMaximized) {
    mainWindow.maximize();
  }

  const isDev = !app.isPackaged && process.env.NODE_ENV === 'development';

  if (isDev && process.env.ELECTRON_START_URL) {
    mainWindow.loadURL(process.env.ELECTRON_START_URL);
  } else {
    // In production or built package, load the compiled Vite index.html
    const indexPath = path.join(__dirname, '../dist/index.html');
    mainWindow.loadFile(indexPath);
  }

  // Gracefully reveal window when ready to prevent visual flickering
  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
  });

  // Track window resizing and moving to remember user preferences
  let resizeTimer = null;
  const debouncedSaveState = () => {
    if (resizeTimer) clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => {
      if (mainWindow && !mainWindow.isDestroyed()) {
        saveWindowState(mainWindow);
      }
    }, 300);
  };

  mainWindow.on('resize', debouncedSaveState);
  mainWindow.on('move', debouncedSaveState);
  mainWindow.on('maximize', debouncedSaveState);
  mainWindow.on('unmaximize', debouncedSaveState);

  mainWindow.on('close', () => {
    if (mainWindow && !mainWindow.isDestroyed()) {
      saveWindowState(mainWindow);
    }
  });

  // Open target="_blank" links in default external system browser
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    if (url.startsWith('http:') || url.startsWith('https:')) {
      shell.openExternal(url);
      return { action: 'deny' };
    }
    return { action: 'allow' };
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

// Ensure single instance lock so multiple clicks don't spawn duplicate apps
const gotTheLock = app.requestSingleInstanceLock();

if (!gotTheLock) {
  app.quit();
} else {
  app.on('second-instance', () => {
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore();
      mainWindow.focus();
    }
  });

  app.whenReady().then(() => {
    createWindow();

    app.on('activate', () => {
      if (BrowserWindow.getAllWindows().length === 0) {
        createWindow();
      }
    });
  });
}

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
