import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Watch, Smartphone, Bluetooth, CheckCircle, Search, Wifi } from "lucide-react";
import { cn } from "@/lib/utils";
import { useBluetoothDevices } from "@/hooks/useBluetoothDevices";

interface Device {
  type: string;
  name: string;
  brand: string;
  compatibility: string;
  features: string[];
}

interface DeviceSelectionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConnect: (deviceType: string, deviceName: string) => Promise<void>;
  isConnecting: boolean;
}

const availableDevices: Device[] = [
  {
    type: 'apple_watch',
    name: 'Apple Watch',
    brand: 'Apple',
    compatibility: 'iOS',
    features: ['Heart Rate', 'HRV', 'Sleep', 'Activity', 'ECG']
  },
  {
    type: 'samsung_watch',
    name: 'Galaxy Watch',
    brand: 'Samsung',
    compatibility: 'Android/iOS',
    features: ['Heart Rate', 'Sleep', 'Stress', 'Activity', 'SpO2']
  },
  {
    type: 'fitbit',
    name: 'Fitbit',
    brand: 'Fitbit',
    compatibility: 'Android/iOS',
    features: ['Heart Rate', 'Sleep', 'Steps', 'Stress', 'Active Minutes']
  },
  {
    type: 'garmin',
    name: 'Garmin Watch',
    brand: 'Garmin',
    compatibility: 'Android/iOS',
    features: ['Heart Rate', 'HRV', 'Sleep', 'Training', 'Recovery']
  },
  {
    type: 'polar',
    name: 'Polar Watch',
    brand: 'Polar',
    compatibility: 'Android/iOS',
    features: ['Heart Rate', 'HRV', 'Sleep', 'Training Load', 'Recovery']
  },
  {
    type: 'amazfit',
    name: 'Amazfit',
    brand: 'Zepp Health',
    compatibility: 'Android/iOS',
    features: ['Heart Rate', 'Sleep', 'Activity', 'SpO2', 'Stress']
  },
  {
    type: 'huawei_watch',
    name: 'Huawei Watch',
    brand: 'Huawei',
    compatibility: 'Android/iOS',
    features: ['Heart Rate', 'Sleep', 'Stress', 'SpO2', 'Activity']
  },
  {
    type: 'smartphone',
    name: 'Smartphone Only',
    brand: 'Manual Entry',
    compatibility: 'Any',
    features: ['Manual Logging', 'Health Apps Integration']
  }
];

export function DeviceSelectionDialog({
  open,
  onOpenChange,
  onConnect,
  isConnecting
}: DeviceSelectionDialogProps) {
  const [selectedDevice, setSelectedDevice] = useState<Device | null>(null);
  const [selectedBluetoothDevice, setSelectedBluetoothDevice] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'available' | 'bluetooth'>('available');
  const bluetooth = useBluetoothDevices();

  const getDeviceIcon = (deviceType: string) => {
    if (deviceType === 'smartphone') {
      return <Smartphone className="h-6 w-6" />;
    }
    return <Watch className="h-6 w-6" />;
  };

  const handleConnect = async () => {
    if (activeTab === 'available' && selectedDevice) {
      await onConnect(selectedDevice.type, selectedDevice.name);
      onOpenChange(false);
      setSelectedDevice(null);
    } else if (activeTab === 'bluetooth' && selectedBluetoothDevice) {
      const device = bluetooth.devices.find(d => d.id === selectedBluetoothDevice);
      if (device) {
        await onConnect(device.type, device.name);
        onOpenChange(false);
        setSelectedBluetoothDevice(null);
      }
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Bluetooth className="h-5 w-5" />
            Select Your Device
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Choose your health device to start tracking metrics. Scan for nearby Bluetooth devices or select from available options.
          </p>
          
          {/* Tab Navigation */}
          <div className="flex space-x-1 bg-muted p-1 rounded-lg">
            <button
              className={cn(
                "flex-1 py-2 px-4 text-sm font-medium rounded-md transition-colors",
                activeTab === 'available' 
                  ? "bg-background text-foreground shadow-sm" 
                  : "text-muted-foreground hover:text-foreground"
              )}
              onClick={() => setActiveTab('available')}
            >
              Available Devices
            </button>
            <button
              className={cn(
                "flex-1 py-2 px-4 text-sm font-medium rounded-md transition-colors",
                activeTab === 'bluetooth' 
                  ? "bg-background text-foreground shadow-sm" 
                  : "text-muted-foreground hover:text-foreground"
              )}
              onClick={() => setActiveTab('bluetooth')}
            >
              <Bluetooth className="h-4 w-4 mr-2 inline" />
              Bluetooth Scan
            </button>
          </div>

          {activeTab === 'bluetooth' && (
            <div className="space-y-4">
              {!bluetooth.isSupported && (
                <div className="p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
                  <p className="text-sm text-yellow-600 dark:text-yellow-400">
                    Bluetooth is not supported in this browser. Please use Chrome, Edge, or Opera.
                  </p>
                </div>
              )}
              
              {bluetooth.isSupported && (
                <>
                  <div className="flex items-center gap-2">
                    <Button
                      onClick={bluetooth.scanForDevices}
                      disabled={bluetooth.isScanning}
                      variant="outline"
                      className="flex-1"
                    >
                      {bluetooth.isScanning ? (
                        <>
                          <Search className="h-4 w-4 mr-2 animate-spin" />
                          Scanning...
                        </>
                      ) : (
                        <>
                          <Search className="h-4 w-4 mr-2" />
                          Scan for Devices
                        </>
                      )}
                    </Button>
                  </div>

                  {bluetooth.devices.length > 0 && (
                    <div className="space-y-2">
                      <h4 className="text-sm font-medium">Found Devices:</h4>
                      {bluetooth.devices.map((device) => (
                        <Card
                          key={device.id}
                          className={cn(
                            "p-3 cursor-pointer transition-all hover:shadow-md border-2",
                            selectedBluetoothDevice === device.id
                              ? "border-primary bg-primary/5"
                              : "border-border hover:border-primary/50"
                          )}
                          onClick={() => setSelectedBluetoothDevice(device.id)}
                        >
                          <div className="flex items-center gap-3">
                            <div className="flex items-center gap-2">
                              {getDeviceIcon(device.type)}
                              <div>
                                <p className="text-sm font-medium">{device.name}</p>
                                <div className="flex items-center gap-2 mt-1">
                                  <Badge variant={device.connected ? "default" : "secondary"} className="text-xs">
                                    <Wifi className={cn("h-3 w-3 mr-1", device.connected ? "text-green-500" : "text-gray-500")} />
                                    {device.connected ? "Connected" : "Available"}
                                  </Badge>
                                </div>
                              </div>
                            </div>
                            {selectedBluetoothDevice === device.id && (
                              <CheckCircle className="h-4 w-4 text-primary ml-auto" />
                            )}
                          </div>
                        </Card>
                      ))}
                    </div>
                  )}

                  {bluetooth.error && (
                    <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
                      <p className="text-sm text-red-600 dark:text-red-400">{bluetooth.error}</p>
                    </div>
                  )}
                </>
              )}
            </div>
          )}

          {activeTab === 'available' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {availableDevices.map((device) => (
              <Card
                key={device.type}
                className={cn(
                  "p-4 cursor-pointer transition-all hover:shadow-md border-2",
                  selectedDevice?.type === device.type
                    ? "border-primary bg-primary/5"
                    : "border-border hover:border-primary/50"
                )}
                onClick={() => setSelectedDevice(device)}
              >
                <div className="flex items-start gap-3">
                  <div className="mt-1">
                    {getDeviceIcon(device.type)}
                  </div>
                  
                  <div className="flex-1 space-y-2">
                    <div className="flex items-center justify-between">
                      <h3 className="font-semibold text-sm">{device.name}</h3>
                      {selectedDevice?.type === device.type && (
                        <CheckCircle className="h-4 w-4 text-primary" />
                      )}
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="text-xs">
                        {device.brand}
                      </Badge>
                      <Badge variant="secondary" className="text-xs">
                        {device.compatibility}
                      </Badge>
                    </div>
                    
                    <div className="flex flex-wrap gap-1">
                      {device.features.map((feature) => (
                        <span
                          key={feature}
                          className="text-xs bg-muted px-2 py-1 rounded"
                        >
                          {feature}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </Card>
            ))}
            </div>
          )}
          
          <div className="flex gap-2 pt-4">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              onClick={handleConnect}
              disabled={
                (activeTab === 'available' && !selectedDevice) || 
                (activeTab === 'bluetooth' && !selectedBluetoothDevice) || 
                isConnecting
              }
              className="flex-1 bg-gradient-primary hover:opacity-90"
            >
              {isConnecting ? "Connecting..." : "Connect Device"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}