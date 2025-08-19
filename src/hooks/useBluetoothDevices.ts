import { useState, useEffect, useCallback } from "react";

// Web Bluetooth API type definitions
interface BluetoothRequestDeviceOptions {
  filters?: BluetoothLEScanFilter[];
  optionalServices?: BluetoothServiceUUID[];
  acceptAllDevices?: boolean;
}

interface BluetoothLEScanFilter {
  services?: BluetoothServiceUUID[];
  name?: string;
  namePrefix?: string;
}

type BluetoothServiceUUID = string;

interface WebBluetoothDevice {
  id: string;
  name?: string;
  gatt?: BluetoothRemoteGATTServer;
}

interface BluetoothRemoteGATTServer {
  connected: boolean;
  connect(): Promise<BluetoothRemoteGATTServer>;
  disconnect(): void;
  getPrimaryServices(): Promise<BluetoothRemoteGATTService[]>;
}

interface BluetoothRemoteGATTService {
  uuid: string;
}

// Extend Navigator interface for Web Bluetooth API
declare global {
  interface Navigator {
    bluetooth?: {
      requestDevice(options: BluetoothRequestDeviceOptions): Promise<WebBluetoothDevice>;
      getDevices(): Promise<WebBluetoothDevice[]>;
    };
  }
}

interface BluetoothDevice {
  id: string;
  name: string;
  type: string;
  rssi?: number;
  connected: boolean;
  services?: string[];
}

interface BluetoothState {
  devices: BluetoothDevice[];
  isScanning: boolean;
  isSupported: boolean;
  error: string | null;
  scanForDevices: () => Promise<void>;
  connectToDevice: (deviceId: string) => Promise<void>;
  disconnectDevice: (deviceId: string) => Promise<void>;
}

// Known fitness device service UUIDs
const FITNESS_SERVICES = [
  '0000180d-0000-1000-8000-00805f9b34fb', // Heart Rate Service
  '0000180f-0000-1000-8000-00805f9b34fb', // Battery Service
  '0000181b-0000-1000-8000-00805f9b34fb', // Body Composition Service
  '0000181c-0000-1000-8000-00805f9b34fb', // User Data Service
  '0000181d-0000-1000-8000-00805f9b34fb', // Weight Scale Service
];

export function useBluetoothDevices(): BluetoothState {
  const [devices, setDevices] = useState<BluetoothDevice[]>([]);
  const [isScanning, setIsScanning] = useState(false);
  const [isSupported, setIsSupported] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Check if Web Bluetooth is supported
    setIsSupported('bluetooth' in navigator && navigator.bluetooth !== undefined);
  }, []);

  const getDeviceType = (deviceName: string): string => {
    const name = deviceName.toLowerCase();
    if (name.includes('apple watch') || name.includes('watch')) return 'apple_watch';
    if (name.includes('galaxy') || name.includes('samsung')) return 'samsung_watch';
    if (name.includes('fitbit')) return 'fitbit';
    if (name.includes('garmin')) return 'garmin';
    if (name.includes('polar')) return 'polar';
    if (name.includes('amazfit')) return 'amazfit';
    if (name.includes('huawei')) return 'huawei_watch';
    return 'wearable_device';
  };

  const scanForDevices = useCallback(async () => {
    if (!isSupported) {
      setError('Bluetooth is not supported in this browser');
      return;
    }

    setIsScanning(true);
    setError(null);

    try {
      // Request device with fitness-related services
      const device = await navigator.bluetooth!.requestDevice({
        filters: [
          { services: FITNESS_SERVICES },
          { namePrefix: 'Apple Watch' },
          { namePrefix: 'Galaxy Watch' },
          { namePrefix: 'Fitbit' },
          { namePrefix: 'Garmin' },
          { namePrefix: 'Polar' },
          { namePrefix: 'Amazfit' },
          { namePrefix: 'Huawei Watch' },
        ],
        optionalServices: FITNESS_SERVICES
      });

      if (device) {
        const newDevice: BluetoothDevice = {
          id: device.id,
          name: device.name || 'Unknown Device',
          type: getDeviceType(device.name || ''),
          connected: device.gatt?.connected || false,
          services: []
        };

        setDevices(prev => {
          const existing = prev.find(d => d.id === device.id);
          if (existing) {
            return prev.map(d => d.id === device.id ? { ...d, ...newDevice } : d);
          }
          return [...prev, newDevice];
        });

        // Try to get available services
        if (device.gatt) {
          try {
            const server = await device.gatt.connect();
            const services = await server.getPrimaryServices();
            const serviceUUIDs = services.map(service => service.uuid);
            
            setDevices(prev => prev.map(d => 
              d.id === device.id ? { ...d, services: serviceUUIDs, connected: true } : d
            ));
          } catch (serviceError) {
            console.warn('Could not get services:', serviceError);
          }
        }
      }
    } catch (error: any) {
      if (error.name === 'NotFoundError') {
        setError('No compatible devices found. Make sure your device is in pairing mode and nearby.');
      } else if (error.name === 'SecurityError') {
        setError('Bluetooth access denied. Please allow Bluetooth permissions.');
      } else {
        setError(`Bluetooth error: ${error.message}`);
      }
      console.error('Bluetooth scan error:', error);
    } finally {
      setIsScanning(false);
    }
  }, [isSupported]);

  const connectToDevice = useCallback(async (deviceId: string) => {
    const device = devices.find(d => d.id === deviceId);
    if (!device) return;

    try {
      setError(null);
      
      // Get the actual Bluetooth device
      const bluetoothDevices = await navigator.bluetooth!.getDevices();
      const bluetoothDevice = bluetoothDevices.find(d => d.id === deviceId);
      
      if (bluetoothDevice && bluetoothDevice.gatt) {
        await bluetoothDevice.gatt.connect();
        
        setDevices(prev => prev.map(d => 
          d.id === deviceId ? { ...d, connected: true } : d
        ));
      }
    } catch (error: any) {
      setError(`Failed to connect to device: ${error.message}`);
      console.error('Connection error:', error);
    }
  }, [devices]);

  const disconnectDevice = useCallback(async (deviceId: string) => {
    try {
      setError(null);
      
      const bluetoothDevices = await navigator.bluetooth!.getDevices();
      const bluetoothDevice = bluetoothDevices.find(d => d.id === deviceId);
      
      if (bluetoothDevice && bluetoothDevice.gatt) {
        bluetoothDevice.gatt.disconnect();
        
        setDevices(prev => prev.map(d => 
          d.id === deviceId ? { ...d, connected: false } : d
        ));
      }
    } catch (error: any) {
      setError(`Failed to disconnect device: ${error.message}`);
      console.error('Disconnection error:', error);
    }
  }, []);

  // Load previously paired devices on mount
  useEffect(() => {
    if (isSupported) {
      navigator.bluetooth!.getDevices().then(pairedDevices => {
        const deviceList: BluetoothDevice[] = pairedDevices.map(device => ({
          id: device.id,
          name: device.name || 'Unknown Device',
          type: getDeviceType(device.name || ''),
          connected: device.gatt?.connected || false,
          services: []
        }));
        
        setDevices(deviceList);
      }).catch(error => {
        console.warn('Could not get paired devices:', error);
      });
    }
  }, [isSupported]);

  return {
    devices,
    isScanning,
    isSupported,
    error,
    scanForDevices,
    connectToDevice,
    disconnectDevice
  };
}