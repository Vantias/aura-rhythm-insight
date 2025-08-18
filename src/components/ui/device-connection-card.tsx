import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Watch, Smartphone, Wifi, WifiOff, RefreshCw, Plus, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { DeviceSelectionDialog } from "./device-selection-dialog";

interface DeviceConnectionCardProps {
  devices: Array<{
    id: string;
    device_type: string;
    device_name: string;
    is_connected: boolean;
    last_sync: string | null;
  }>;
  onConnect: (deviceType: string, deviceName: string) => Promise<void>;
  onDisconnect: (deviceId: string) => Promise<void>;
  onSync: () => Promise<void>;
  isLoading: boolean;
}

export function DeviceConnectionCard({ 
  devices, 
  onConnect, 
  onDisconnect,
  onSync, 
  isLoading 
}: DeviceConnectionCardProps) {
  const [isDeviceDialogOpen, setIsDeviceDialogOpen] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const { toast } = useToast();

  const getDeviceIcon = (deviceType: string) => {
    switch (deviceType.toLowerCase()) {
      case 'apple_watch':
      case 'samsung_watch':
      case 'galaxy_watch':
      case 'fitbit':
      case 'garmin':
      case 'polar':
      case 'amazfit':
      case 'huawei_watch':
        return <Watch className="h-4 w-4" />;
      default:
        return <Smartphone className="h-4 w-4" />;
    }
  };

  const handleConnect = async (deviceType: string, deviceName: string) => {
    setIsConnecting(true);
    try {
      await onConnect(deviceType, deviceName);
      
      toast({
        title: "Device connected successfully",
        description: `${deviceName} is now syncing your health data`,
      });
    } catch (error) {
      toast({
        title: "Connection failed",
        description: "Unable to connect to your device. Make sure Bluetooth is enabled and the device is nearby.",
        variant: "destructive",
      });
    } finally {
      setIsConnecting(false);
    }
  };

  const handleDisconnect = async (deviceId: string) => {
    try {
      await onDisconnect(deviceId);
      toast({
        title: "Device disconnected",
        description: "Device has been successfully disconnected",
      });
    } catch (error) {
      toast({
        title: "Disconnection failed",
        description: "Unable to disconnect device. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleSync = async () => {
    setIsSyncing(true);
    try {
      await onSync();
      toast({
        title: "Sync completed",
        description: "Your latest health data has been updated",
      });
    } catch (error) {
      toast({
        title: "Sync failed",
        description: "Unable to sync your health data. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSyncing(false);
    }
  };

  const connectedDevices = devices.filter(d => d.is_connected);

  return (
    <Card className="bg-gradient-card border-border/50">
      <CardHeader>
        <CardTitle className="text-lg font-semibold text-foreground flex items-center gap-2">
          <Watch className="h-5 w-5" />
          Device Connections
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {connectedDevices.length > 0 ? (
          <>
            {connectedDevices.map((device) => (
              <div
                key={device.id}
                className="flex items-center justify-between p-3 rounded-lg bg-background/50 border border-border/50"
              >
                <div className="flex items-center gap-3">
                  {getDeviceIcon(device.device_type)}
                  <div>
                    <p className="text-sm font-medium text-foreground">
                      {device.device_name}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {device.last_sync
                        ? `Last sync: ${new Date(device.last_sync).toLocaleTimeString()}`
                        : "Never synced"
                      }
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge
                    variant="secondary"
                    className={cn(
                      "flex items-center gap-1",
                      device.is_connected
                        ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                        : "bg-red-500/10 text-red-400 border-red-500/20"
                    )}
                  >
                    {device.is_connected ? (
                      <Wifi className="h-3 w-3" />
                    ) : (
                      <WifiOff className="h-3 w-3" />
                    )}
                    {device.is_connected ? "Connected" : "Disconnected"}
                  </Badge>
                  
                  {device.is_connected && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDisconnect(device.id)}
                      className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive"
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  )}
                </div>
              </div>
            ))}
            
            <div className="flex gap-2">
              <Button
                onClick={handleSync}
                disabled={isSyncing || isLoading}
                className="flex-1 bg-gradient-primary hover:opacity-90 transition-opacity"
              >
                {isSyncing ? (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    Syncing...
                  </>
                ) : (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Sync Data
                  </>
                )}
              </Button>
              
              <Button
                onClick={() => setIsDeviceDialogOpen(true)}
                variant="outline"
                disabled={isLoading}
                className="shrink-0"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Device
              </Button>
            </div>
          </>
        ) : (
          <div className="text-center space-y-4">
            <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto">
              <Watch className="h-8 w-8 text-muted-foreground" />
            </div>
            <div>
              <p className="text-sm font-medium text-foreground">
                No devices connected
              </p>
              <p className="text-xs text-muted-foreground">
                Connect a health device to start monitoring your wellness data. Choose from smartwatches, fitness trackers, or use manual entry.
              </p>
            </div>
            <Button
              onClick={() => setIsDeviceDialogOpen(true)}
              disabled={isLoading}
              className="bg-gradient-primary hover:opacity-90 transition-opacity"
            >
              <Plus className="h-4 w-4 mr-2" />
              Connect Device
            </Button>
          </div>
        )}
        
        <DeviceSelectionDialog
          open={isDeviceDialogOpen}
          onOpenChange={setIsDeviceDialogOpen}
          onConnect={handleConnect}
          isConnecting={isConnecting}
        />
      </CardContent>
    </Card>
  );
}