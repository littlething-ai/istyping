import { useState, useEffect } from 'react';
import QRCode from 'qrcode.react';
import { listen } from '@tauri-apps/api/event';
import { invoke } from '@tauri-apps/api/core';

type DebugLog = {
  type: 'text' | 'control';
  content: string;
};

type SessionInfo = {
  roomId: string;
  roomNumber: string;
};

function App() {
  const [status, setStatus] = useState<'standby' | 'ready' | 'typing'>('standby');
  const [session, setSession] = useState<SessionInfo>({ roomId: '', roomNumber: '------' });
  const [lastLog, setLastLog] = useState<DebugLog | null>(null);

  useEffect(() => {
    // 1. 主动拉取初始信息 (解决时序竞争)
    invoke<SessionInfo>('get_session_info')
      .then((data) => {
        console.log('Fetched initial session info:', data);
        if (data.roomId) setSession(data);
      })
      .catch(console.error);

    // 2. 监听从 Rust 发来的 Session Info (后续更新)
    const unlistenSession = listen<SessionInfo>('session-info', (event) => {
      console.log('Frontend received session-info:', event.payload);
      if (event.payload) {
        setSession(event.payload);
      }
    });

    // 定期拉取保底 (每 5 秒一次，防止任何意外)
    const timer = setInterval(() => {
      invoke<SessionInfo>('get_session_info').then(data => {
        if (data.roomId) setSession(data);
      });
    }, 5000);

    // 监听 Rust 发来的调试日志
    const unlistenLog = listen<DebugLog>('debug-log', (event) => {
      console.log('Received from Rust:', event.payload);
      setLastLog(event.payload);
      
      // 收到消息时闪烁状态
      setStatus('typing');
      setTimeout(() => setStatus('ready'), 500); // 500ms 后恢复
    });

    // 假设一启动就是 Ready (因为 Rust 在后台连着)
    setStatus('ready');

    return () => {
      unlistenSession.then(f => f());
      unlistenLog.then(f => f());
      clearInterval(timer);
    };
  }, []);

  return (
    <div className="w-screen h-screen flex flex-col items-center justify-center bg-gray-900/90 text-white backdrop-blur-md rounded-lg border border-gray-700 select-none cursor-move overflow-hidden" data-tauri-drag-region>
      
      {/* 状态指示灯 */}
      <div className={`w-3 h-3 rounded-full mb-2 transition-all duration-200 ${
        status === 'standby' ? 'bg-gray-400' :
        status === 'ready' ? 'bg-green-500 shadow-[0_0_10px_rgba(34,197,94,0.5)]' :
        'bg-blue-500 scale-125 shadow-[0_0_15px_rgba(59,130,246,0.8)]'
      }`} />
      
      {/* 状态文本 */}
      <div className="text-xs font-mono text-gray-400 mb-2 uppercase tracking-widest">
        {status === 'typing' ? 'RECEIVING...' : status}
      </div>

      {/* 调试日志显示区域 */}
      {lastLog && (
        <div className="mb-3 px-3 py-1 bg-gray-800 rounded text-sm font-mono max-w-[90%] truncate animate-fade-in text-blue-300 border border-gray-700">
           {lastLog.type === 'control' ? `[Key: ${lastLog.content}]` : `"${lastLog.content}"`}
        </div>
      )}

      {/* 二维码与数字 ID */}
      <div className="flex flex-col items-center gap-3 mt-2">
        <div className="bg-white p-1.5 rounded-lg shadow-lg opacity-90 hover:opacity-100 transition-opacity cursor-pointer">
          <QRCode value={`https://is-typing.vercel.app/?room=${session.roomId}`} size={80} />
        </div>
        <div className="flex flex-col items-center">
          <div className="text-[10px] font-mono text-gray-500 uppercase tracking-tighter">Room Number</div>
          <div className="text-2xl font-black font-mono text-blue-400 tracking-widest -mt-1">
            {session.roomNumber}
          </div>
          <div className="text-[9px] font-mono text-gray-600 mt-1 select-all opacity-50 hover:opacity-100 transition-opacity">
            ID: {session.roomId || 'Connecting...'}
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;