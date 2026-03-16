import { create } from 'zustand';
import { SessionInfo, DebugLog, ServerConfig } from './types';
import { listen } from '@tauri-apps/api/event';
import { invoke } from '@tauri-apps/api/core';

interface AppState {
  status: 'standby' | 'ready' | 'typing';
  session: SessionInfo;
  serverConfig: ServerConfig;
  history: string[];
  recentText: string;
  
  setStatus: (status: 'standby' | 'ready' | 'typing') => void;
  setSession: (session: SessionInfo) => void;
  setServerConfig: (config: ServerConfig) => void;
  updateServerConfig: (config: ServerConfig) => Promise<void>;
  addHistory: (text: string) => void;
  setRecentText: (text: string) => void;
  
  init: () => Promise<() => void>;
}

export const useStore = create<AppState>((set, get) => ({
  status: 'standby',
  session: { roomId: '', roomNumber: '------', participants: [], status: 'disconnected', serverUrl: '' },
  serverConfig: { mode: 'prod', customUrl: '', customRoomId: '', islandPosition: null, proxyEnabled: false, proxyUrl: '' },
  history: [],
  recentText: '',

  setStatus: (status) => set({ status }),
  setSession: (session) => set({ session }),
  setServerConfig: (serverConfig) => set({ serverConfig }),
  updateServerConfig: async (config) => {
    try {
      await invoke('update_server_config', { config });
      set({ serverConfig: config });
    } catch (e) {
      console.error('Failed to update server config', e);
      throw e;
    }
  },
  addHistory: (text) => set((state) => ({ 
    history: [text, ...state.history].slice(0, 50),
    recentText: text 
  })),
  setRecentText: (text) => set({ recentText: text }),

  init: async () => {
    // 1. 初始拉取 Session 和 ServerConfig
    try {
      const [session, config] = await Promise.all([
        invoke<SessionInfo>('get_session_info'),
        invoke<ServerConfig>('get_server_config')
      ]);
      if (session.roomId) set({ session });
      set({ serverConfig: config });
    } catch (e) {
      console.error('Failed to initialize store', e);
    }

    // 2. 监听 Session 更新
    const unlistenSession = await listen<SessionInfo>('session-info', (event) => {
      if (event.payload) set({ session: event.payload });
    });

    // 3. 监听日志消息 (输入内容)
    const unlistenLog = await listen<DebugLog>('debug-log', (event) => {
      if (event.payload.type === 'text') {
        const text = event.payload.content;
        get().addHistory(text);
        
        set({ status: 'typing' });
        // 800ms 后恢复 Ready
        setTimeout(() => set({ status: 'ready' }), 800);
      }
    });

    // 假设初始状态
    set({ status: 'ready' });

    return () => {
      unlistenSession();
      unlistenLog();
    };
  }
}));
