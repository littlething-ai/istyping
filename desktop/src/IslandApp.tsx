import { useEffect, useRef, useCallback } from 'react';
import { useStore } from './store';
import { DynamicHeader } from './components/DynamicHeader';
import { AppContainer } from './components/AppContainer';
import { invoke } from '@tauri-apps/api/core';

export const IslandApp = () => {
  const { status, session, recentText, init } = useStore();
  const prevRoomId = useRef<string>('');

  useEffect(() => {
    init();
  }, [init]);

  // 配对成功自动隐藏配对窗口
  useEffect(() => {
    if (session.roomId && !prevRoomId.current) {
      invoke('hide_window', { label: 'pairing' }).catch(console.error);
    }
    prevRoomId.current = session.roomId;
  }, [session.roomId]);

  const toggleSettings = useCallback(async () => {
    // 调用后端显示设置窗口
    await invoke('show_window', { label: 'settings' });
  }, []);

  return (
    <div className="flex items-center justify-center w-screen h-screen bg-transparent overflow-hidden select-none">
      <AppContainer>
        <DynamicHeader 
          status={status}
          roomId={session.roomId}
          roomNumber={session.roomNumber}
          onAction={toggleSettings}
          recentText={recentText}
        />
      </AppContainer>
    </div>
  );
};
