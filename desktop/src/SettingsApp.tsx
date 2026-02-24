import { useEffect } from 'react';
import { useStore } from './store';
import { HistoryList } from './components/HistoryList';
import { invoke } from '@tauri-apps/api/core';
import { Smartphone, RefreshCw } from 'lucide-react';

export const SettingsApp = () => {
  const { history, session, init } = useStore();

  useEffect(() => {
    init();
  }, [init]);

  const openPairing = () => {
    invoke('show_window', { label: 'pairing' }).catch(console.error);
  };

  return (
    <div className="flex flex-col h-screen bg-[#121212] text-white p-6">
      <div className="flex items-center justify-between mb-8 border-b border-white/10 pb-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight">Settings & History</h1>
          <p className="text-xs text-gray-500 mt-1 uppercase tracking-widest">Manage your connection</p>
        </div>
      </div>

      {/* 配对控制区 */}
      <div className="mb-8 bg-white/5 rounded-2xl p-5 border border-white/5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-blue-500/20 flex items-center justify-center text-blue-400">
              <Smartphone size={20} />
            </div>
            <div>
              <div className="text-sm font-bold">Device Connection</div>
              <div className="text-[10px] text-gray-500 font-mono mt-0.5 tracking-wider uppercase">
                {session.roomId ? `Connected: ${session.roomNumber}` : 'No device connected'}
              </div>
            </div>
          </div>
          <button 
            onClick={openPairing}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-500 active:scale-95 text-white text-xs font-bold rounded-xl transition-all flex items-center gap-2"
          >
            <RefreshCw size={14} />
            {session.roomId ? 'Reconnect' : 'Connect Device'}
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-hidden flex flex-col">
        <HistoryList history={history} />
      </div>
      
      <div className="mt-6 pt-4 border-t border-white/10 text-xs text-gray-600 flex justify-between items-center font-mono">
        <span>V0.1.0</span>
        <div className="flex gap-4">
          <span className="hover:text-gray-400 cursor-pointer">Support</span>
          <span className="hover:text-gray-400 cursor-pointer">Feedback</span>
        </div>
      </div>
    </div>
  );
};
