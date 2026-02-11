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
  const [history, setHistory] = useState<string[]>([]);

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text).then(() => {
      console.log('Copied to clipboard');
    });
  };

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
      
      if (event.payload.type === 'text') {
        setHistory(prev => [event.payload.content, ...prev].slice(0, 10));
      }

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
    <div className="w-screen h-screen flex flex-col items-center pt-6 bg-gray-900/90 text-white backdrop-blur-md rounded-lg border border-gray-700 select-none overflow-hidden" data-tauri-drag-region>
      
      <div className="flex flex-col items-center shrink-0">
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
        <div className="flex flex-col items-center gap-3 mt-1">
          <div className="bg-white p-1.5 rounded-lg shadow-lg opacity-90 hover:opacity-100 transition-opacity cursor-pointer">
            <QRCode value={`https://is-typing.vercel.app/?room=${session.roomId}`} size={80} />
          </div>
          <div className="flex flex-col items-center">
            <div className="text-[10px] font-mono text-gray-500 uppercase tracking-tighter">Room Number</div>
            <div className="text-2xl font-black font-mono text-blue-400 tracking-widest -mt-1">
              {session.roomNumber}
            </div>
          </div>
        </div>
      </div>

      {/* 历史记录列表 */}
      <div className="w-full flex-grow mt-4 px-4 overflow-y-auto custom-scrollbar pb-4">
        <div className="text-[10px] text-gray-500 uppercase mb-2 font-bold sticky top-0 bg-gray-900/10 backdrop-blur-sm py-1">Recent History</div>
        <div className="flex flex-col gap-2">
          {history.length === 0 ? (
            <div className="text-xs text-gray-600 italic text-center mt-4">No messages yet...</div>
          ) : (
            history.map((text, idx) => (
              <div key={idx} className="group relative flex items-center bg-gray-800/50 border border-gray-700/50 rounded p-2 hover:bg-gray-800 transition-colors">
                <div className="flex-grow text-xs font-mono text-gray-300 break-all pr-8 line-clamp-2">
                  {text}
                </div>
                <button 
                  onClick={() => copyToClipboard(text)}
                  className="absolute right-2 p-1.5 bg-gray-700 rounded text-[10px] opacity-0 group-hover:opacity-100 hover:bg-blue-600 transition-all active:scale-90"
                  title="Copy to clipboard"
                >
                  📋
                </button>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

export default App;