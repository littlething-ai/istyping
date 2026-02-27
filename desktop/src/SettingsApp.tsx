import { useEffect, useState } from 'react';
import { useStore } from './store';
import { HistoryList } from './components/HistoryList';
import { invoke } from '@tauri-apps/api/core';
import { Smartphone, RefreshCw, Server, Save } from 'lucide-react';
import { ServerMode } from './types';

export const SettingsApp = () => {
  const { history, session, serverConfig, updateServerConfig, init } = useStore();
  const [localConfig, setLocalConfig] = useState(serverConfig);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    init();
  }, [init]);

  useEffect(() => {
    setLocalConfig(serverConfig);
  }, [serverConfig]);

  const openPairing = () => {
    invoke('show_window', { label: 'pairing' }).catch(console.error);
  };

  const handleSaveConfig = async () => {
    setIsSaving(true);
    try {
      await updateServerConfig(localConfig);
    } catch (e) {
      console.error(e);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="flex flex-col h-screen bg-[#121212] text-white p-6">
      <div className="flex items-center justify-between mb-8 border-b border-white/10 pb-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight">Settings & History</h1>
          <p className="text-xs text-gray-500 mt-1 uppercase tracking-widest">Manage your connection</p>
        </div>
      </div>

      <div className="overflow-y-auto pr-2 custom-scrollbar">
        {/* 配对控制区 */}
        <div className="mb-6 bg-white/5 rounded-2xl p-5 border border-white/5">
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

        {/* 服务器配置区 */}
        <div className="mb-8 bg-white/5 rounded-2xl p-5 border border-white/5">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-full bg-purple-500/20 flex items-center justify-center text-purple-400">
              <Server size={20} />
            </div>
            <div className="text-sm font-bold">Server Configuration</div>
          </div>
          
          <div className="grid grid-cols-2 gap-2 mb-4">
            {(['auto', 'prod', 'dev', 'custom'] as ServerMode[]).map((mode) => (
              <button
                key={mode}
                onClick={() => setLocalConfig({ ...localConfig, mode })}
                className={`px-3 py-2 rounded-lg text-xs font-medium transition-all border ${
                  localConfig.mode === mode 
                    ? 'bg-purple-600 border-purple-500 text-white' 
                    : 'bg-white/5 border-white/5 text-gray-400 hover:bg-white/10'
                }`}
              >
                {mode.toUpperCase()}
              </button>
            ))}
          </div>

          {localConfig.mode === 'custom' && (
            <input
              type="text"
              value={localConfig.customUrl}
              onChange={(e) => setLocalConfig({ ...localConfig, customUrl: e.target.value })}
              placeholder="https://your-server.com"
              className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-2 text-xs font-mono mb-4 focus:outline-none focus:border-purple-500/50"
            />
          )}

          <button
            onClick={handleSaveConfig}
            disabled={isSaving || JSON.stringify(localConfig) === JSON.stringify(serverConfig)}
            className="w-full py-2.5 bg-white/10 hover:bg-white/20 disabled:opacity-30 disabled:cursor-not-allowed text-white text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-2"
          >
            <Save size={14} />
            {isSaving ? 'Saving...' : 'Save & Reconnect'}
          </button>
        </div>

        <div className="flex flex-col min-h-[300px]">
          <HistoryList history={history} />
        </div>
      </div>
      
      <div className="mt-auto pt-4 border-t border-white/10 text-xs text-gray-600 flex justify-between items-center font-mono">
        <span>V0.1.0</span>
        <div className="flex gap-4">
          <span className="hover:text-gray-400 cursor-pointer">Support</span>
          <span className="hover:text-gray-400 cursor-pointer">Feedback</span>
        </div>
      </div>
    </div>
  );
};
