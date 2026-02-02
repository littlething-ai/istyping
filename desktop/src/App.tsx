import { useState, useEffect } from 'react';
import QRCode from 'qrcode.react';
import { listen } from '@tauri-apps/api/event';

type DebugLog = {
  type: 'text' | 'control';
  content: string;
};

function App() {
  const [status, setStatus] = useState<'standby' | 'ready' | 'typing'>('standby');
  const [sessionId, setSessionId] = useState<string>('demo-session-id');
  const [lastLog, setLastLog] = useState<DebugLog | null>(null);

  useEffect(() => {
    // 监听 Rust 发来的调试日志
    const unlisten = listen<DebugLog>('debug-log', (event) => {
      console.log('Received from Rust:', event.payload);
      setLastLog(event.payload);
      
      // 收到消息时闪烁状态
      setStatus('typing');
      setTimeout(() => setStatus('ready'), 500); // 500ms 后恢复
    });

    // 假设一启动就是 Ready (因为 Rust 在后台连着)
    setStatus('ready');

    return () => {
      unlisten.then(f => f());
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

      {/* 二维码 (默认显示，后续可以做成点击展开) */}
      <div className="bg-white p-1 rounded opacity-80 hover:opacity-100 transition-opacity">
        <QRCode value={`https://is_typing.com/connect/${sessionId}`} size={64} />
      </div>
    </div>
  );
}

export default App;