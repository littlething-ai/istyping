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

export type ServerMode = 'auto' | 'prod' | 'dev' | 'custom';

export type ServerConfig = {
  mode: ServerMode;
  customUrl: string;
  proxyEnabled: boolean;
  proxyUrl: string;
};
