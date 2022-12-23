import { contextBridge, ipcRenderer, IpcRendererEvent } from 'electron';

export type Channels = 'ipc-example';

contextBridge.exposeInMainWorld('electron', {
  ipcRenderer: {
    sendMessage(channel: Channels, args: unknown[]) {
      ipcRenderer.send(channel, args);
    },
    on(channel: Channels, func: (...args: unknown[]) => void) {
      const subscription = (_event: IpcRendererEvent, ...args: unknown[]) =>
        func(...args);
      ipcRenderer.on(channel, subscription);

      return () => {
        ipcRenderer.removeListener(channel, subscription);
      };
    },
    once(channel: Channels, func: (...args: unknown[]) => void) {
      ipcRenderer.once(channel, (_event, ...args) => func(...args));
    },
    getCamera() {
      return ipcRenderer.invoke('get-camera');
    },
    getPrinters() {
      return ipcRenderer.invoke('get-printers');
    },
    getbluetoothDevices() {
      return ipcRenderer.invoke('get-bluetooth-devices');
    },
    connectToBlueToothDevice(deviceId: string) {
      return ipcRenderer.invoke('connect-to-bluetooth-device', deviceId);
    },
    printFile(filePath: string, printerName: string) {
      return ipcRenderer.invoke('print-file', filePath, printerName);
    },
    takeCameraPhoto() {
      return ipcRenderer.invoke('take-camera-photo');
    },
  },
});
