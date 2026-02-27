import { useEffect } from 'react';
import { useStore } from './store';
import { Smartphone, Monitor, Globe, RefreshCw, X, CheckCircle2, AlertCircle, Loader2, Link2 } from 'lucide-react';
import { invoke } from '@tauri-apps/api/core';
import QRCode from "qrcode.react";

export const PairingApp = () => {
  const { session, serverConfig, updateServerConfig, init } = useStore();
  const { roomNumber, participants, status, roomId } = session;

  useEffect(() => {
    const unlisten = init();
    return () => {
      unlisten.then(f => f());
    };
  }, [init]);

  const handleClose = () => {
    invoke('hide_window', { label: 'pairing' }).catch(console.error);
  };

  const handleReconnect = async () => {
    try {
      await updateServerConfig(serverConfig);
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

  const getActualServerUrl = () => {
    if (serverConfig.mode === 'custom') return serverConfig.customUrl;
    if (serverConfig.mode === 'dev') return 'http://localhost:2020';
    if (serverConfig.mode === 'prod') return 'https://backend.istyping.app';
    return 'Determining...';
  };

  return (
    <div className="flex flex-col h-screen bg-[#121212] text-white p-6 relative overflow-hidden">
      {/* Background Glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-64 h-64 bg-blue-500/10 blur-[100px] pointer-events-none" />

      {/* Header */}
      <div className="flex items-center justify-between mb-4 relative z-10">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 bg-white/5 px-3 py-1.5 rounded-full border border-white/10">
            {getStatusIcon()}
            <span className="text-[10px] font-bold uppercase tracking-wider text-gray-300">
              {status}
            </span>
          </div>
          <div className="flex items-center gap-1.5 text-[9px] text-gray-500 font-mono bg-white/[0.02] px-2 py-1 rounded-md border border-white/5">
            <Link2 size={10} />
            <span className="truncate max-w-[120px]">{session.serverUrl || 'Determining...'}</span>
          </div>
        </div>
        <button 
          onClick={handleClose}
          className="p-2 hover:bg-white/10 rounded-full transition-colors text-gray-400 hover:text-white"
        >
          <X size={18} />
        </button>
      </div>

      <div className="flex-1 flex flex-col items-center overflow-y-auto custom-scrollbar pr-2 relative z-10">
        {/* QR Code Section */}
        {roomId && (
          <div className="bg-white p-2 rounded-xl shadow-2xl shadow-blue-500/10 mb-6">
            <QRCode value={`https://is-typing.vercel.app/?room=${roomId}`} size={120} />
          </div>
        )}

        <div className="text-center mb-8">
          <h2 className="text-sm font-medium text-gray-400 mb-2">Connect your device</h2>
          <div className="flex gap-2 justify-center">
            {roomNumber.split('').map((char, i) => (
              <div 
                key={i}
                className="w-10 h-14 bg-white/5 border border-white/10 rounded-xl flex items-center justify-center text-2xl font-bold font-mono text-blue-400 shadow-lg shadow-blue-500/5"
              >
                {char}
              </div>
            ))}
          </div>
        </div>

        {/* Participants Section */}
        <div className="w-full max-w-[320px]">
          <div className="flex items-center justify-between mb-3 px-1">
            <h3 className="text-[10px] font-bold uppercase tracking-widest text-gray-500">Participants</h3>
            <span className="text-[10px] bg-white/5 px-2 py-0.5 rounded-full text-gray-400 border border-white/5">
              {participants.length}
            </span>
          </div>
          
          <div className="space-y-2">
            {participants.length === 0 ? (
              <div className="bg-white/[0.02] border border-dashed border-white/10 rounded-xl p-4 text-center">
                <p className="text-[10px] text-gray-500 leading-relaxed italic">
                  Waiting for other devices to join...
                </p>
              </div>
            ) : (
              participants.map((p) => (
                <div 
                  key={p.id}
                  className="flex items-center justify-between bg-white/5 border border-white/5 rounded-xl p-3 group hover:bg-white/[0.08] transition-all"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center text-blue-400 group-hover:scale-110 transition-transform">
                      {p.deviceType === 'pc' ? <Monitor size={14} /> : 
                       p.deviceType === 'mobile' ? <Smartphone size={14} /> : <Globe size={14} />}
                    </div>
                    <div>
                      <div className="text-xs font-bold truncate max-w-[150px]">{p.deviceName}</div>
                      <div className="text-[9px] text-gray-500 uppercase font-mono">{p.deviceType}</div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Footer Actions */}
      <div className="mt-6 pt-6 border-t border-white/5 flex gap-3 relative z-10">
        <button 
          onClick={handleReconnect}
          className="flex-1 flex items-center justify-center gap-2 bg-white/5 hover:bg-white/10 py-3 rounded-xl text-xs font-bold transition-all active:scale-95"
        >
          <RefreshCw size={14} className={status === 'connecting' ? 'animate-spin' : ''} />
          Reconnect
        </button>
      </div>
    </div>
  );
};
