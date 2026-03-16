import { useEffect } from 'react';
import { useStore } from './store';
import { Smartphone, Monitor, Globe, RefreshCw, X, CheckCircle2, AlertCircle, Loader2, Link2, Scan } from 'lucide-react';
import { invoke } from '@tauri-apps/api/core';
import QRCode from "qrcode.react";

export const PairingApp = () => {
  const { session, serverConfig, updateServerConfig, init } = useStore();
  const { roomNumber, participants, status, roomId, serverUrl } = session;

  useEffect(() => {
    const unlisten = init();
    return () => {
      unlisten.then(f => f());
    };
  }, [init]);

  const handleClose = () => {
    invoke('hide_window', { label: 'pairing' }).catch(console.error);
  };

  const handleStartDrag = () => {
    invoke('start_drag').catch(console.error);
  };

  const handleReconnect = async () => {
    try {
      await updateServerConfig(serverConfig);
    } catch (e) {
      console.error(e);
    }
  };

  const handleDisconnect = async () => {
    try {
      await invoke('disconnect_server');
    } catch (e) {
      console.error(e);
    }
  };

  const getStatusIcon = () => {
    switch (status) {
      case 'connected': return <CheckCircle2 className="text-green-400" size={14} />;
      case 'connecting': return <Loader2 className="text-blue-400 animate-spin" size={14} />;
      case 'error': return <AlertCircle className="text-red-400" size={14} />;
      default: return <AlertCircle className="text-gray-400" size={14} />;
    }
  };

  return (
    <div 
      className="fixed inset-0 bg-[#080809] text-white overflow-hidden font-sans"
      style={{ backgroundColor: '#080809', color: 'white' }}
    >
      <div className="absolute inset-x-0 top-0 h-5 z-30" onMouseDown={handleStartDrag} />
      <div className="absolute inset-y-0 left-0 w-4 z-30" onMouseDown={handleStartDrag} />
      <div className="absolute inset-y-0 right-0 w-4 z-30" onMouseDown={handleStartDrag} />
      <div className="absolute inset-x-0 bottom-0 h-4 z-30" onMouseDown={handleStartDrag} />

      {/* Background Decor */}
      <div className="absolute top-[-20%] left-[-10%] w-[60%] h-[60%] bg-blue-600/10 blur-[100px] rounded-full pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-purple-600/10 blur-[100px] rounded-full pointer-events-none" />

      <div className="relative z-10 h-full flex flex-col p-6">
        {/* Header */}
        <header className="flex items-center justify-between mb-8 select-none" onMouseDown={handleStartDrag}>
          <div className="flex items-center gap-3">
            <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full border border-white/10 bg-white/5`}>
              {getStatusIcon()}
              <span className="text-[10px] font-black uppercase tracking-tighter text-gray-300">
                {status}
              </span>
            </div>
            <div className="flex items-center gap-1.5 text-[9px] text-gray-500 font-mono bg-black/40 px-2.5 py-1.5 rounded-lg border border-white/5">
              <Link2 size={10} className="text-blue-500/50" />
              <span className="truncate max-w-[140px] tracking-tight">{serverUrl || 'establishing...'}</span>
            </div>
          </div>
          <button 
            onClick={handleClose}
            onMouseDown={(e) => e.stopPropagation()}
            className="w-8 h-8 flex items-center justify-center hover:bg-white/10 rounded-full transition-all text-gray-400 hover:text-white"
          >
            <X size={18} />
          </button>
        </header>

        <div className="flex-1 flex flex-col items-center overflow-y-auto custom-scrollbar pr-1">
          {/* QR Code Section */}
          <div className="mb-10 text-center">
            <div className="inline-block p-4 bg-white/5 border border-white/10 rounded-[32px] backdrop-blur-sm relative group">
               <div className="p-3 bg-white rounded-2xl">
                {roomId ? (
                  <QRCode 
                    value={`https://is-typing.vercel.app/?room=${roomId}`} 
                    size={140} 
                    renderAs="svg"
                  />
                ) : (
                  <div className="w-[140px] h-[140px] bg-gray-100 rounded-lg flex items-center justify-center text-gray-400">
                    <Loader2 className="animate-spin" size={32} />
                  </div>
                )}
              </div>
              <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 bg-blue-600 text-[9px] font-black px-3 py-1 rounded-full shadow-lg shadow-blue-500/40 flex items-center gap-1.5 whitespace-nowrap">
                <Scan size={10} />
                SCAN TO CONNECT
              </div>
            </div>
          </div>

          {/* Room Code Section */}
          <div className="text-center mb-10 w-full">
            <h2 className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-500 mb-4 px-4">Direct Entry Code</h2>
            <div className="flex gap-2.5 justify-center px-4">
              {roomNumber.split('').map((char, i) => (
                <div 
                  key={i}
                  className="w-11 h-16 bg-white/5 border border-white/10 rounded-2xl flex items-center justify-center text-3xl font-black font-mono text-white shadow-xl"
                >
                  {char}
                </div>
              ))}
            </div>
          </div>

          {/* Participants Section */}
          <div className="w-full max-w-[320px] px-2 mb-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-[10px] font-black uppercase tracking-[0.1em] text-gray-500">Live Participants</h3>
              <span className="text-[10px] bg-blue-500/10 px-2 py-0.5 rounded border border-blue-500/20 text-blue-400 font-bold">
                {participants.length}
              </span>
            </div>
            
            <div className="space-y-2.5">
              {participants.length === 0 ? (
                <div className="bg-white/[0.02] border border-dashed border-white/5 rounded-2xl p-6 text-center">
                  <p className="text-[10px] text-gray-600 leading-relaxed font-medium italic">
                    No active listeners detected. Join the room to start.
                  </p>
                </div>
              ) : (
                participants.map((p) => (
                  <div 
                    key={p.id}
                    className="flex items-center justify-between bg-white/[0.03] border border-white/5 rounded-2xl p-4"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-400">
                        {p.deviceType === 'pc' ? <Monitor size={16} /> : 
                         p.deviceType === 'mobile' ? <Smartphone size={16} /> : <Globe size={16} />}
                      </div>
                      <div>
                        <div className="text-xs font-bold text-gray-200">{p.deviceName}</div>
                        <div className="text-[9px] text-gray-500 uppercase font-mono tracking-tighter mt-0.5">{p.deviceType} NODE</div>
                      </div>
                    </div>
                    <div className="w-1.5 h-1.5 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.4)]" />
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <footer className="mt-auto pt-4 border-t border-white/5 flex gap-3">
          {status === 'connected' ? (
            <button 
              onClick={handleDisconnect}
              className="flex-1 flex items-center justify-center gap-2 bg-red-500/10 text-red-400 hover:bg-red-500/20 py-4 rounded-2xl text-[11px] font-black uppercase tracking-tight transition-all active:scale-[0.98]"
            >
              <X size={14} />
              Disconnect Cluster
            </button>
          ) : (
            <button 
              onClick={handleReconnect}
              disabled={status === 'connecting'}
              className="flex-1 flex items-center justify-center gap-2 bg-white text-black hover:bg-gray-100 py-4 rounded-2xl text-[11px] font-black uppercase tracking-tight transition-all active:scale-[0.98] shadow-xl disabled:opacity-50"
            >
              <RefreshCw size={14} className={status === 'connecting' ? 'animate-spin' : ''} />
              {status === 'disconnected' ? 'Connect Cluster' : 'Reconnect Cluster'}
            </button>
          )}
        </footer>
      </div>
    </div>
  );
};
