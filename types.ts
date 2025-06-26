
export interface ScriptConfig {
  dietPiImageUrl: string;
  usbDeviceName: string; // es. sdb
  hostname: string;
  networkConfig: {
    type: 'ethernet' | 'wifi';
    wifiSsid?: string;
    wifiPassword?: string;
  };
  customWelcomeMessage?: boolean; // Potrebbe essere aggiunto in futuro
}

export enum AppStep {
  Welcome,
  ImageUrl,
  UsbDevice,
  SystemConfig,
  ReviewScript,
}