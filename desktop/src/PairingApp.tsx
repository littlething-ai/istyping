import { useEffect } from 'react';
import { useStore } from './store';
import { PairingView } from './components/PairingView';

export const PairingApp = () => {
  const { session, init } = useStore();

  useEffect(() => {
    init();
  }, [init]);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-[#121212] text-white p-6">
      <div className="w-full text-center mb-8 border-b border-white/10 pb-4">
        <h1 className="text-xl font-bold tracking-tight">Pair Your Device</h1>
        <p className="text-xs text-gray-400 mt-1 uppercase tracking-widest">Connect to start typing</p>
      </div>
      
      <div className="flex-1 w-full flex items-center justify-center">
        <PairingView 
          roomId={session.roomId}
          roomNumber={session.roomNumber}
        />
      </div>
    </div>
  );
};
