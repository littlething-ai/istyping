import { useEffect, useState } from 'react';
import { useStore } from './store';
import { HistoryList } from './components/HistoryList';
import { invoke } from '@tauri-apps/api/core';
import { Smartphone, RefreshCw, Server, Save, Clock, Shield, Settings2 } from 'lucide-react';
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
    <div className="flex flex-col h-screen bg-[#0A0A0B] text-white overflow-hidden relative font-sans selection:bg-blue-500/30">
      {/* Background Decor */}
      <div className="absolute top-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-600/10 blur-[120px] rounded-full" />
      <div className="absolute bottom-[-5%] left-[-5%] w-[30%] h-[30%] bg-purple-600/10 blur-[100px] rounded-full" />

      {/* Header */}
      <header className="px-8 pt-8 pb-6 flex items-center justify-between relative z-10">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl shadow-lg shadow-blue-500/20">
            <Settings2 size={22} className="text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-400">
              Control Center
            </h1>
            <p className="text-[10px] text-blue-400/60 font-mono tracking-widest uppercase mt-0.5">istyping.desktop v0.1.0</p>
          </div>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto px-8 pb-8 custom-scrollbar relative z-10 space-y-6">
        {/* Device Status Card */}
        <section className="group bg-white/[0.03] hover:bg-white/[0.05] border border-white/10 rounded-[24px] p-6 transition-all duration-300">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="relative">
                <div className="w-12 h-12 rounded-2xl bg-blue-500/10 flex items-center justify-center text-blue-400 group-hover:scale-110 transition-transform duration-500">
                  <Smartphone size={24} />
                </div>
                {session.status === 'connected' && (
                  <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 border-2 border-[#0A0A0B] rounded-full animate-pulse" />
                )}
              </div>
              <div>
                <h3 className="text-sm font-bold">Connection Status</h3>
                <div className="flex items-center gap-2 mt-1">
                  <span className={`w-1.5 h-1.5 rounded-full ${session.status === 'connected' ? 'bg-green-500' : 'bg-gray-600'}`} />
                  <span className="text-xs text-gray-400 font-mono">
                    {session.status === 'connected' ? `Linked: ${session.roomNumber}` : 'Ready for pairing'}
                  </span>
                </div>
              </div>
            </div>
            <button 
              onClick={openPairing}
              className="px-5 py-2.5 bg-white text-black hover:bg-blue-50 active:scale-95 text-xs font-bold rounded-xl transition-all flex items-center gap-2 shadow-xl shadow-white/5"
            >
              <RefreshCw size={14} className={session.status === 'connecting' ? 'animate-spin' : ''} />
              {session.roomId ? 'Manage Link' : 'Pair Device'}
            </button>
          </div>
        </section>

        {/* Server Config Card */}
        <section className="bg-white/[0.03] border border-white/10 rounded-[24px] p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-8 h-8 rounded-lg bg-purple-500/10 flex items-center justify-center text-purple-400">
              <Server size={18} />
            </div>
            <h3 className="text-sm font-bold tracking-tight">Server Endpoint</h3>
          </div>
          
          <div className="grid grid-cols-3 gap-2 mb-4">
            {(['prod', 'dev', 'custom'] as ServerMode[]).map((mode) => (
              <button
                key={mode}
                onClick={() => setLocalConfig({ ...localConfig, mode })}
                className={`py-2 rounded-xl text-[10px] font-bold transition-all border ${
                  localConfig.mode === mode 
                    ? 'bg-purple-600 border-purple-500 text-white shadow-lg shadow-purple-500/20' 
                    : 'bg-white/[0.02] border-white/5 text-gray-500 hover:border-white/20 hover:text-gray-300'
                }`}
              >
                {mode === 'prod' ? 'PRODUCTION' : mode.toUpperCase()}
              </button>
            ))}
          </div>

          <div className="relative group mb-4">
            <input
              type="text"
              readOnly={localConfig.mode !== 'custom'}
              value={localConfig.mode === 'custom' ? localConfig.customUrl : (localConfig.mode === 'dev' ? 'http://localhost:2020' : 'https://backend.istyping.app')}
              onChange={(e) => setLocalConfig({ ...localConfig, customUrl: e.target.value })}
              className={`w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-xs font-mono focus:outline-none focus:border-purple-500/50 transition-all ${localConfig.mode !== 'custom' ? 'text-gray-600' : 'text-purple-300'}`}
            />
          </div>

          <div className="mb-6 p-4 rounded-xl bg-black/20 border border-white/5">
            <div className="flex items-center justify-between gap-4 mb-3">
              <div>
                <h4 className="text-xs font-bold text-gray-300">Custom Room ID</h4>
                <p className="text-[10px] text-gray-500 mt-1">
                  Leave empty to use the default behavior. In local debug builds, empty falls back to the built-in dev room.
                </p>
              </div>
            </div>
            <input
              type="text"
              placeholder="e.g. dev-laptop-a"
              value={localConfig.customRoomId}
              onChange={(e) => setLocalConfig({ ...localConfig, customRoomId: e.target.value })}
              className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-xs font-mono text-purple-200 focus:outline-none focus:border-purple-500/50 transition-all"
            />
          </div>

          {/* Proxy Configuration */}
          <div className="flex flex-col gap-3 mb-6 p-4 rounded-xl bg-black/20 border border-white/5">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold text-gray-300">HTTP/HTTPS Proxy</h4>
              <button
                onClick={() => setLocalConfig({ ...localConfig, proxyEnabled: !localConfig.proxyEnabled })}
                className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${localConfig.proxyEnabled ? 'bg-purple-500' : 'bg-gray-600'}`}
              >
                <span
                  className={`inline-block h-3 w-3 transform rounded-full bg-white transition-transform ${localConfig.proxyEnabled ? 'translate-x-5' : 'translate-x-1'}`}
                />
              </button>
            </div>
            {localConfig.proxyEnabled && (
              <input
                type="text"
                placeholder="e.g. http://127.0.0.1:7890"
                value={localConfig.proxyUrl}
                onChange={(e) => setLocalConfig({ ...localConfig, proxyUrl: e.target.value })}
                className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-xs font-mono text-purple-200 focus:outline-none focus:border-purple-500/50 transition-all"
              />
            )}
          </div>

          <button
            onClick={handleSaveConfig}
            disabled={isSaving || JSON.stringify(localConfig) === JSON.stringify(serverConfig)}
            className="w-full py-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 disabled:opacity-20 disabled:grayscale disabled:cursor-not-allowed text-white text-xs font-black rounded-xl transition-all flex items-center justify-center gap-2 shadow-lg shadow-purple-500/10 uppercase tracking-tighter"
          >
            <Save size={14} />
            {isSaving ? 'Updating...' : 'Apply & Reconnect'}
          </button>
        </section>

        {/* History Section */}
        <section className="flex flex-col min-h-[400px]">
          <div className="flex items-center gap-3 mb-4 px-1">
            <div className="w-8 h-8 rounded-lg bg-orange-500/10 flex items-center justify-center text-orange-400">
              <Clock size={18} />
            </div>
            <h3 className="text-sm font-bold tracking-tight">Recent Sessions</h3>
            <div className="ml-auto flex gap-1">
               <div className="w-1 h-1 rounded-full bg-orange-500/40" />
               <div className="w-1 h-1 rounded-full bg-orange-500/20" />
            </div>
          </div>
          <div className="bg-white/[0.01] border border-white/5 rounded-[24px] overflow-hidden">
            <HistoryList history={history} />
          </div>
        </section>
      </main>
      
      {/* Footer */}
      <footer className="px-8 py-6 border-t border-white/5 bg-[#0A0A0B]/80 backdrop-blur-md relative z-20 flex justify-between items-center">
        <div className="flex items-center gap-2 text-[10px] font-mono text-gray-600">
          <Shield size={12} className="text-green-900" />
          <span>ENCRYPTED_P2P_SESSION</span>
        </div>
        <div className="flex gap-6">
          <button className="text-[10px] text-gray-500 hover:text-white transition-colors uppercase font-bold tracking-tighter">Support</button>
          <button className="text-[10px] text-gray-500 hover:text-white transition-colors uppercase font-bold tracking-tighter">Feedback</button>
        </div>
      </footer>
    </div>
  );
};
