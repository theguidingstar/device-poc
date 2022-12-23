import React from 'react';
import { MemoryRouter as Router, Routes, Route } from 'react-router-dom';
import './App.css';

const Hello = () => {
  const [camera, setCamera] = React.useState<MediaDeviceInfo[]>([]);
  const [bluetooth, setBluetooth] = React.useState([]);
  const [printer, setPrinter] = React.useState([]);

  const getCamera = () => {
    navigator.mediaDevices.enumerateDevices().then((devices) => {
      const cameraDevices = devices.filter(
        (device) => device.kind == 'videoinput'
      );
      if (cameraDevices && cameraDevices.length > 0) {
        setCamera(cameraDevices);
      }
    });
  };

  const getBlueToothDevice = () => {
    window.electron.ipcRenderer.getbluetoothDevices((items) => {
      setBluetooth(items);
    });
    navigator.bluetooth.requestDevice({ acceptAllDevices: true })
    .then(device => console.log(device)).catch(error => {
      console.log('Argh! ' + error);
  });
  };

  const getPrinters = () => {
    window.electron.ipcRenderer.getPrinters((items) => {
      setPrinter(items);
    });
  };

  React.useEffect(() => {
    getCamera();
    getBlueToothDevice();
    getPrinters();
  }, []);
  return (
    <div>
      <h1>Bluetooth Devices</h1>
      <table>
        <thead>
          <tr>
            <th>Device Name</th>
            <th>Device Address</th>
          </tr>
        </thead>
        <tbody>
          {bluetooth && bluetooth.length > 0 ? (
            bluetooth.map((item) => (
              <tr>
                <td>Device 1</td>
                <td>00:00:00:00:00:00</td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan={2}>No Device Found</td>
            </tr>
          )}
        </tbody>
      </table>

      <h1>Camera Devices</h1>
      <table>
        <thead>
          <tr>
            <th>Device Name</th>
            <th>Device Address</th>
          </tr>
        </thead>
        <tbody>
          {camera && camera.length > 0 ? (
            camera.map((device) => (
              <tr>
                <td>{device.label}</td>
                <td>{device.deviceId}</td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan={2}>No Device Found</td>
            </tr>
          )}
        </tbody>
      </table>

      <h1>Printers Devices</h1>
      <table>
        <thead>
          <tr>
            <th>Device Name</th>
            <th>Display Name</th>
          </tr>
        </thead>
        <tbody>
          {printer && printer.length > 0 ? (
            printer.map((device) => (
              <tr>
                <td>{device.name}</td>
                <td>{device.displayName}</td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan={2}>No Device Found</td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
};

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Hello />} />
      </Routes>
    </Router>
  );
}
