export type DebugLog = {
  type: 'text' | 'control';
  content: string;
};

export type SessionInfo = {
  roomId: string;
  roomNumber: string;
};
