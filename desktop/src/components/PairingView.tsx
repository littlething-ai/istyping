import QRCode from "qrcode.react";
import { motion } from "framer-motion";

interface PairingViewProps {
  roomId: string;
  roomNumber: string;
}

export const PairingView = ({ roomId, roomNumber }: PairingViewProps) => {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      className="flex flex-col items-center justify-center h-full pb-8"
    >
      <div className="bg-white p-2 rounded-xl shadow-2xl shadow-blue-500/10 mb-6">
        <QRCode value={`https://is-typing.vercel.app/?room=${roomId}`} size={140} />
      </div>
      
      <div className="text-center">
        <div className="text-xs text-gray-500 font-mono uppercase tracking-widest mb-1">Room Number</div>
        <div className="text-4xl font-black font-mono text-white tracking-widest drop-shadow-lg">
          {roomNumber.split('').map((char, i) => (
            <span key={i} className="inline-block mx-0.5">{char}</span>
          ))}
        </div>
      </div>
      
      <div className="mt-8 text-[10px] text-gray-600 font-mono bg-black/20 px-3 py-1 rounded-full">
        Scan with phone to connect
      </div>
    </motion.div>
  );
};
