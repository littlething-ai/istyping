import { useState } from "react";

interface RoomJoinProps {
  onJoin: (id: string) => void;
}

export const RoomJoin = ({ onJoin }: RoomJoinProps) => {
  const [inputRoomId, setInputRoomId] = useState("");

  return (
    <div className="w-full mb-4 flex gap-2">
      <input
        type="text"
        placeholder="Enter 6-digit ID"
        inputMode="numeric"
        className="flex-grow bg-gray-800 rounded px-4 py-2 uppercase font-mono focus:outline-none focus:ring-2 focus:ring-blue-500 text-white"
        value={inputRoomId}
        onChange={(e) => setInputRoomId(e.target.value.toUpperCase())}
      />
      <button 
        onClick={() => onJoin(inputRoomId)}
        className="px-6 py-2 bg-blue-600 rounded font-bold active:scale-95 transition-transform text-white"
      >
        JOIN
      </button>
    </div>
  );
};
