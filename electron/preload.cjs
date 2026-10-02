const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('rohrPlanDesktop', {
  readStepRuntime: () => ipcRenderer.invoke('step:read-runtime'),
  pickDirectory: () => ipcRenderer.invoke('project:pick-directory'),
  ensureDirectory: (rootPath, name, create) => ipcRenderer.invoke('project:ensure-directory', { rootPath, name, create }),
  readFile: async (rootPath, name) => {
    try {
      return await ipcRenderer.invoke('project:read-file', { rootPath, name });
    } catch (error) {
      if (/ENOENT|no such file/i.test(error.message)) error.name = 'NotFoundError';
      throw error;
    }
  },
  writeFile: (rootPath, name, contents) => ipcRenderer.invoke('project:write-file', { rootPath, name, contents }),
  removeFile: (rootPath, name) => ipcRenderer.invoke('project:remove-file', { rootPath, name })
});
