const { app, BrowserWindow, dialog, ipcMain } = require('electron');
const { autoUpdater } = require('electron-updater');
const fs = require('node:fs/promises');
const path = require('node:path');

function resolveChild(rootPath, relativePath) {
  if (typeof rootPath !== 'string' || !path.isAbsolute(rootPath)) throw new Error('Ungültiger Projektordner.');
  if (typeof relativePath !== 'string' || !relativePath || path.isAbsolute(relativePath)) throw new Error('Ungültiger Dateiname.');
  const root = path.resolve(rootPath);
  const target = path.resolve(root, relativePath);
  if (!target.startsWith(`${root}${path.sep}`)) throw new Error('Der Dateiname liegt außerhalb des Projektordners.');
  return target;
}

ipcMain.handle('project:pick-directory', async (event) => {
  const result = await dialog.showOpenDialog(BrowserWindow.fromWebContents(event.sender), {
    title: 'Projektordner auswählen',
    properties: ['openDirectory', 'createDirectory']
  });
  if (result.canceled || !result.filePaths[0]) return null;
  const selectedPath = result.filePaths[0];
  return { path: selectedPath, name: path.basename(selectedPath) };
});

ipcMain.handle('project:ensure-directory', async (_event, { rootPath, name, create }) => {
  if (typeof name !== 'string' || !name || /[<>:"/\\|?*\u0000-\u001f]/.test(name) || /[. ]$/.test(name)) throw new Error('Ungültiger Ordnername.');
  const target = resolveChild(rootPath, name);
  if (create) await fs.mkdir(target, { recursive: true });
  else await fs.access(target);
  return { path: target, name };
});

ipcMain.handle('project:read-file', async (_event, { rootPath, name }) => fs.readFile(resolveChild(rootPath, name), 'utf8'));
ipcMain.handle('project:write-file', async (_event, { rootPath, name, contents }) => {
  if (typeof contents !== 'string') throw new Error('Ungültiger Dateiinhalt.');
  const target = resolveChild(rootPath, name);
  await fs.mkdir(path.dirname(target), { recursive: true });
  await fs.writeFile(target, contents, 'utf8');
});
ipcMain.handle('project:remove-file', async (_event, { rootPath, name }) => fs.unlink(resolveChild(rootPath, name)));
ipcMain.handle('step:read-runtime', async () => new Uint8Array(await fs.readFile(path.join(__dirname, '..', 'vendor', 'occt-import-js', 'occt-import-js.wasm'))));

function createWindow() {
  const window = new BrowserWindow({
    width: 1440,
    height: 960,
    minWidth: 900,
    minHeight: 650,
    title: 'RohrPlan',
    backgroundColor: '#111816',
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true
    }
  });
  window.loadFile(path.join(__dirname, '..', 'zeichenfeld.html'));
}

app.whenReady().then(() => {
  createWindow();
  if (app.isPackaged) {
    const checkForUpdates = () => autoUpdater.checkForUpdatesAndNotify().catch((error) => console.error('RohrPlan update check failed:', error));
    setTimeout(checkForUpdates, 5000);
    setInterval(checkForUpdates, 6 * 60 * 60 * 1000).unref();
  }
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});
