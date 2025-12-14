export enum ConnectionState {
  DISCONNECTED = 'DISCONNECTED',
  CONNECTING = 'CONNECTING',
  CONNECTED = 'CONNECTED',
  ERROR = 'ERROR',
}

export interface TranscriptionItem {
  text: string;
  sender: 'user' | 'model';
  timestamp: Date;
}

export interface AudioVolumeState {
  inputVolume: number; // 0-1
  outputVolume: number; // 0-1
}

export interface LiveConfig {
  voiceName: string;
}
