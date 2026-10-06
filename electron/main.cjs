const { app, BrowserWindow, dialog, ipcMain, shell } = require('electron');
const { autoUpdater } = require('electron-updater');
const fs = require('node:fs/promises');
const path = require('node:path');

function validatePipeProfiles(profiles) {
  if (!Array.isArray(profiles) || profiles.some(profile => !profile || typeof profile.id !== 'string' || !profile.id || ![profile.diameter, profile.wall, profile.radius, profile.sampleLength].every(value => Number.isFinite(value) && value > 0) || !Array.isArray(profile.legs) || profile.legs.length !== 3 || !profile.legs.every(value => Number.isFinite(value) && value > 0))) {
    throw new Error('Die Datei enthält ungültige Rohrdatensätze.');
  }
  return profiles;
}

function pipeProfilesFile() {
  return path.join(app.getPath('documents'), 'RohrPlan', 'Stammdaten', 'Rohrdatensaetze.json');
}

ipcMain.handle('pipe-profiles:load', async () => {
  try {
    const data = JSON.parse(await fs.readFile(pipeProfilesFile(), 'utf8'));
    if (data.format !== 'rohrplan-pipe-profiles' || data.version !== 1) throw new Error('Unbekanntes Rohrdaten-Dateiformat.');
    return { profiles: validatePipeProfiles(data.profiles) };
  } catch (error) {
    if (error.code === 'ENOENT') return { profiles: null };
    throw new Error(`Rohrdaten konnten nicht geladen werden: ${error.message}`);
  }
});

let pipeProfileWriteQueue = Promise.resolve();
ipcMain.handle('pipe-profiles:save', (_event, profiles) => {
  validatePipeProfiles(profiles);
  const save = pipeProfileWriteQueue.then(async () => {
    const file = pipeProfilesFile();
    await fs.mkdir(path.dirname(file), { recursive: true });
    try {
      await fs.copyFile(file, `${file}.bak`);
    } catch (error) {
      if (error.code !== 'ENOENT') throw error;
    }
    const temporary = `${file}.tmp`;
    await fs.writeFile(temporary, JSON.stringify({ format: 'rohrplan-pipe-profiles', version: 1, profiles }, null, 2), 'utf8');
    await fs.rename(temporary, file);
    return true;
  });
  pipeProfileWriteQueue = save.catch(() => {});
  return save;
});

function resolveChild(rootPath, relativePath) {
  if (typeof rootPath !== 'string' || !path.isAbsolute(rootPath)) throw new Error('Ungültiger Projektordner.');
  if (typeof relativePath !== 'string' || !relativePath || path.isAbsolute(relativePath)) throw new Error('Ungültiger Dateiname.');
  const root = path.resolve(rootPath);
  const target = path.resolve(root, relativePath);
  if (!target.startsWith(`${root}${path.sep}`)) throw new Error('Der Dateiname liegt außerhalb des Projektordners.');
  return target;
}

async function projectsRoot() {
  const rootPath = path.join(app.getPath('documents'), 'RohrPlan');
  await fs.mkdir(rootPath, { recursive: true });
  return { path: rootPath, name: 'RohrPlan' };
}

ipcMain.handle('project:get-root', () => projectsRoot());
ipcMain.handle('project:show-root', async () => {
  const root = await projectsRoot();
  const error = await shell.openPath(root.path);
  if (error) throw new Error(error);
});
ipcMain.handle('project:list-directory', async (_event, { rootPath }) => {
  if (typeof rootPath !== 'string' || !path.isAbsolute(rootPath)) throw new Error('Ungültiger Projektordner.');
  const entries = await fs.readdir(rootPath, { withFileTypes: true });
  return entries.filter(entry => entry.isDirectory() || entry.isFile()).map(entry => ({ name: entry.name, kind: entry.isDirectory() ? 'directory' : 'file' }));
});

ipcMain.handle('isometry:save-file', async (event, { name, contents }) => {
  if (typeof name !== 'string' || /[<>:"/\\|?*\u0000-\u001f]/.test(name) || typeof contents !== 'string') throw new Error('Ungültige Isometrie-Datei.');
  const data = JSON.parse(contents);
  if (data.formatVersion !== 1 || !Array.isArray(data.segments) || !data.profile) throw new Error('Ungültige Isometrie.');
  const result = await dialog.showSaveDialog(BrowserWindow.fromWebContents(event.sender), { title: 'Isometrie als Datei speichern', defaultPath: path.join((await projectsRoot()).path, name), filters: [{ name: 'RohrPlan-Isometrie', extensions: ['json'] }] });
  if (result.canceled || !result.filePath) return { canceled: true };
  await fs.writeFile(result.filePath, contents, 'utf8');
  return { canceled: false };
});

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
  if (typeof name !== 'string' || !name || /[<>:"/\\|?*\u0000-\u001f]/.test(name) || /[. ]$/.test(name) || /^(con|prn|aux|nul|com[1-9]|lpt[1-9])(?:\.|$)/i.test(name)) throw new Error('Ungültiger Ordnername.');
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

ipcMain.handle('bend-data:export-pdf', async (event) => {
  const window = BrowserWindow.fromWebContents(event.sender);
  if (!window) throw new Error('Das Anwendungsfenster ist nicht verfügbar.');
  const result = await dialog.showSaveDialog(window, {
    title: 'Biegedaten als PDF speichern',
    defaultPath: path.join(app.getPath('documents'), 'RohrPlan-Biegedaten.pdf'),
    filters: [{ name: 'PDF-Dateien', extensions: ['pdf'] }]
  });
  if (result.canceled || !result.filePath) return { canceled: true };
  const pdf = await window.webContents.printToPDF({
    pageSize: 'A4',
    printBackground: true,
    preferCSSPageSize: true,
    margins: { top: 0, bottom: 0, left: 0, right: 0 }
  });
  await fs.writeFile(result.filePath, pdf);
  const openError = await shell.openPath(result.filePath);
  if (openError) throw new Error(`PDF wurde gespeichert, konnte aber nicht geöffnet werden: ${openError}`);
  return { canceled: false, filePath: result.filePath };
});

function createWindow() {
  const window = new BrowserWindow({
    width: 1440,
    height: 960,
    minWidth: 900,
    minHeight: 650,
    title: 'RohrPlan',
    backgroundColor: '#252c36',
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
  projectsRoot().catch(error => console.error('RohrPlan project directory:', error));
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
