const { contextBridge } = require('electron');

// Expose safe desktop environment flags and APIs to the renderer
contextBridge.exposeInMainWorld('desktopAPI', {
  isDesktop: true,
  platform: process.platform,
  arch: process.arch,
});
