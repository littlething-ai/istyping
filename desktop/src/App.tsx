import { useState, useEffect } from 'react';
import { listen } from '@tauri-apps/api/event';
import { invoke } from '@tauri-apps/api/core';
import { AnimatePresence } from 'framer-motion';

import { AppContainer } from './components/AppContainer';
import { DynamicHeader } from './components/DynamicHeader';
import { PairingView } from './components/PairingView';
import { HistoryList } from './components/HistoryList';
import { DebugLog, SessionInfo, ViewMode } from './types';

function App() {
  const [status, setStatus] = useState<'standby' | 'ready' | 'typing'>('standby');
  const [session, setSession] = useState<SessionInfo>({ roomId: '', roomNumber: '------' });
  const [history, setHistory] = useState<string[]>([]);
  const [recentText, setRecentText] = useState("");

  // 显式状态管理
  const [viewMode, setViewMode] = useState<ViewMode>('pairing');

  // 同步物理窗口大小
  useEffect(() => {
    let width = 300;
    let height = 480;

    if (viewMode === 'compact') {
      width = 200; // 更新为 200
      height = 60;
    } else if (viewMode === 'history') {
      width = 320;
      height = 500;
    } else {
      // pairing
      width = 300;
      height = 480;
    }

    invoke('set_window_size', { width, height }).catch(console.error);
  }, [viewMode]);

  // 监听连接状态变化，自动切换模式
  useEffect(() => {
    if (status === 'standby') {
      setViewMode('pairing');
    } else if (status === 'ready' && viewMode === 'pairing') {
      // 只有当前是 pairing 且连上了才自动切到 compact
      setViewMode('compact');
    }
  }, [status, viewMode]);

  useEffect(() => {
    // 1. 初始化拉取
    invoke<SessionInfo>('get_session_info')
      .then((data) => {
        if (data.roomId) setSession(data);
      })
      .catch(console.error);

    // 2. 监听 Session 更新
    const unlistenSession = listen<SessionInfo>('session-info', (event) => {
      if (event.payload) setSession(event.payload);
    });

    // 3. 监听日志消息
    const unlistenLog = listen<DebugLog>('debug-log', (event) => {
      if (event.payload.type === 'text') {
        const text = event.payload.content;
        setRecentText(text);
        setHistory(prev => [text, ...prev].slice(0, 10));
      }

      setStatus('typing');
      setTimeout(() => setStatus('ready'), 800);
    });

    // 4. 定时保底
    const timer = setInterval(() => {
      invoke<SessionInfo>('get_session_info').then(data => {
        if (data.roomId) setSession(data);
      });
    }, 5000);

    // 假设初始状态为 Ready (后端已启动)
    setStatus('ready');

    return () => {
      unlistenSession.then(f => f());
      unlistenLog.then(f => f());
      clearInterval(timer);
    };
  }, []);

  return (
    <div className="flex items-center justify-center min-h-screen bg-transparent p-4">
      <AppContainer viewMode={viewMode}>
        {/* 常驻头部 */}
        <DynamicHeader 
          status={status}
          roomId={session.roomId}
          roomNumber={session.roomNumber}
          viewMode={viewMode}
          onToggleExpand={() => setViewMode(prev => prev === 'compact' ? 'history' : 'compact')}
          recentText={recentText}
        />

        {/* 扩展内容区 */}
        <div className="flex-1 overflow-hidden flex flex-col relative h-full">
          <AnimatePresence mode="wait">
            {viewMode === 'pairing' && (
              <PairingView 
                key="pairing"
                roomId={session.roomId}
                roomNumber={session.roomNumber}
              />
            )}
            
            {viewMode === 'history' && (
              <HistoryList key="history" history={history} />
            )}
          </AnimatePresence>
        </div>
      </AppContainer>
    </div>
  );
}

export default App;
