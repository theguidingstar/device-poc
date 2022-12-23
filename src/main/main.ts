/* eslint global-require: off, no-console: off, promise/always-return: off */

/**
 * This module executes inside of electron's main process. You can start
 * electron renderer process from here and communicate with the other processes
 * through IPC.
 *
 * When running `npm run build` or `npm run build:main`, this file is compiled to
 * `./src/main.js` using webpack. This gives us some performance wins.
 */
import path from 'path';
import { app, BrowserWindow, shell, ipcMain } from 'electron';
import { autoUpdater } from 'electron-updater';
import log from 'electron-log';
import MenuBuilder from './menu';
import { resolveHtmlPath } from './util';

class AppUpdater {
  constructor() {
    log.transports.file.level = 'info';
    autoUpdater.logger = log;
    autoUpdater.checkForUpdatesAndNotify();
  }
}

let mainWindow: BrowserWindow | null = null;

ipcMain.on('ipc-example', async (event, arg) => {
  const msgTemplate = (pingPong: string) => `IPC test: ${pingPong}`;
  console.log(msgTemplate(arg));
  event.reply('ipc-example', msgTemplate('pong'));
});

if (process.env.NODE_ENV === 'production') {
  const sourceMapSupport = require('source-map-support');
  sourceMapSupport.install();
}

const isDebug =
  process.env.NODE_ENV === 'development' || process.env.DEBUG_PROD === 'true';

if (isDebug) {
  require('electron-debug')();
}
if (process.platform === 'linux') {
  app.commandLine.appendSwitch(
    'enable-experimental-web-platform-features',
    true
  );
} else {
  app.commandLine.appendSwitch('enable-web-bluetooth', true);
}
const installExtensions = async () => {
  const installer = require('electron-devtools-installer');
  const forceDownload = !!process.env.UPGRADE_EXTENSIONS;
  const extensions = ['REACT_DEVELOPER_TOOLS'];

  return installer
    .default(
      extensions.map((name) => installer[name]),
      forceDownload
    )
    .catch(console.log);
};
let blueToothDevices = null;
let connectCallBack = null;
const createWindow = async () => {
  if (isDebug) {
    await installExtensions();
  }

  const RESOURCES_PATH = app.isPackaged
    ? path.join(process.resourcesPath, 'assets')
    : path.join(__dirname, '../../assets');

  const getAssetPath = (...paths: string[]): string => {
    return path.join(RESOURCES_PATH, ...paths);
  };

  mainWindow = new BrowserWindow({
    show: false,
    width: 1024,
    height: 728,
    icon: getAssetPath('icon.png'),
    webPreferences: {
      preload: app.isPackaged
        ? path.join(__dirname, 'preload.js')
        : path.join(__dirname, '../../.erb/dll/preload.js'),
    },
  });

  mainWindow.webContents.on(
    'select-bluetooth-device',
    (event, deviceList, callback) => {
      event.preventDefault();
      console.log('--devicelist', deviceList);
      blueToothDevices = deviceList;
      connectCallBack = callback;
    }
  );

  mainWindow.loadURL(resolveHtmlPath('index.html'));

  mainWindow.on('ready-to-show', () => {
    if (!mainWindow) {
      throw new Error('"mainWindow" is not defined');
    }
    if (process.env.START_MINIMIZED) {
      mainWindow.minimize();
    } else {
      mainWindow.show();
    }
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  const menuBuilder = new MenuBuilder(mainWindow);
  menuBuilder.buildMenu();

  // Open urls in the user's browser
  mainWindow.webContents.setWindowOpenHandler((edata) => {
    shell.openExternal(edata.url);
    return { action: 'deny' };
  });

  // Remove this if your app does not use auto updates
  // eslint-disable-next-line
  new AppUpdater();
};

/**
 * Add event listeners...
 */

app.on('window-all-closed', () => {
  // Respect the OSX convention of having the application in memory even
  // after all windows have been closed
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('web-contents-created', (event, webContents) => {
  webContents.on('select-bluetooth-device', (event, devices, callback) => {
    // Prevent default behavior
    console.log(devices)
    event.preventDefault();
    // Cancel the request
    callback('');
  });
});

app
  .whenReady()
  .then(() => {
    createWindow();
    app.on('activate', () => {
      // On macOS it's common to re-create a window in the app when the
      // dock icon is clicked and there are no other windows open.
      if (mainWindow === null) createWindow();
    });
  })
  .catch(console.log);

//function to get all camera devices attached to windown in electron
function getCameraDevices() {
  if (mainWindow) {
    return mainWindow.webContents
      .executeJavaScript('window.anyWantedProperty')
      .then((result) => {
        return result.navigator.mediaDevices
          .enumerateDevices()
          .then((devices: MediaDeviceInfo[]) => {
            if (devices && devices.length > 0) {
              return devices.filter((device) => device.kind === 'videoinput');
            }
            return [];
          });
      });
  } else return [];
}

function getPrinters() {
  if (mainWindow) {
    return mainWindow.webContents
      .getPrintersAsync()
      .then((printers: Electron.PrinterInfo[]) => {
        if (printers && printers.length > 0) {
          return printers;
        }
        return [];
      });
  } else return [];
}

function getBluetoothDevice() {
  try {
    if (mainWindow) {
      console.log(blueToothDevices);
      return blueToothDevices;
    } else return [];
  } catch (err) {
    return [];
  }
}

function connectToBlueToothDevice(
  __args: any,
  { deviceId }: { deviceId: string }
) {
  if (mainWindow) {
    return mainWindow.webContents.on(
      'select-bluetooth-device',
      (event, deviceList, callback) => {
        event.preventDefault();
        callback(deviceId);
      }
    );
  } else return [];
}

function printFileFromPrinter(
  __args: any,
  { filePath, printerName }: { filePath: string; printerName: string }
) {
  //print file from printer with printer name in electron
}

ipcMain.handle('get-camera', getCameraDevices);
ipcMain.handle('get-printers', getPrinters);
ipcMain.handle('get-bluetooth-devices', getBluetoothDevice);
ipcMain.handle('connect-to-bluetooth-device', connectToBlueToothDevice);
ipcMain.handle('print-file', printFileFromPrinter);
