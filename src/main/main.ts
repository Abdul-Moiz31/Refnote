import { app, BrowserWindow } from 'electron';
import path from 'node:path';
import started from 'electron-squirrel-startup';
import { registerDocumentIpcHandlers } from './ipc/documents';

// Handle creating/removing shortcuts on Windows when installing/uninstalling.
if (started) {
  app.quit();
}

const APP_NAME = 'Refnote';
const WINDOW_DEFAULT_WIDTH = 1180;
const WINDOW_DEFAULT_HEIGHT = 780;
const WINDOW_MIN_WIDTH = 860;
const WINDOW_MIN_HEIGHT = 560;
// Matches --color-bg in the renderer stylesheet, so the window does not flash
// a different shade before the page paints.
const WINDOW_BACKGROUND_COLOR = '#ffffff';

const createWindow = () => {
  const mainWindow = new BrowserWindow({
    title: APP_NAME,
    width: WINDOW_DEFAULT_WIDTH,
    height: WINDOW_DEFAULT_HEIGHT,
    minWidth: WINDOW_MIN_WIDTH,
    minHeight: WINDOW_MIN_HEIGHT,
    backgroundColor: WINDOW_BACKGROUND_COLOR,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      // Explicit rather than relying on the defaults: the renderer gets no
      // Node access and reaches the main process only through the preload
      // bridge.
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  if (MAIN_WINDOW_VITE_DEV_SERVER_URL) {
    mainWindow.loadURL(MAIN_WINDOW_VITE_DEV_SERVER_URL);
  } else {
    mainWindow.loadFile(
      path.join(__dirname, `../renderer/${MAIN_WINDOW_VITE_NAME}/index.html`),
    );
  }
};

app.on('ready', () => {
  registerDocumentIpcHandlers();
  createWindow();
});

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// On macOS it's common to re-create a window when the dock icon is clicked
// and there are no other windows open.
app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});
