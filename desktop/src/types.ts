export type DebugLog = {
  type: 'text' | 'control';
  content: string;
};

export type Participant = {
  id: string;
  deviceName: string;
  deviceType: 'pc' | 'mobile' | 'web';
  isMe?: boolean;
};

export type ConnectionStatus = 'disconnected' | 'connecting' | 'connected' | 'error';

export type SessionInfo = {
  roomId: string;
  roomNumber: string;
  participants: Participant[];
  status: ConnectionStatus;
  serverUrl: string;
};

export type ServerMode = 'prod' | 'dev' | 'custom';

export type IslandPosition = {
  x: number;
  y: number;
};

export type ServerConfig = {
  mode: ServerMode;
  customUrl: string;
  customRoomId: string;
  islandPosition?: IslandPosition | null;
  proxyEnabled: boolean;
  proxyUrl: string;
};
