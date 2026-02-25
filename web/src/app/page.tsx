"use client";

import { useState } from "react";
import { useSocket } from "../hooks/useSocket";
import { Header } from "../components/Header";
import { RoomJoin } from "../components/RoomJoin";

export default function Home() {
  const { status, roomId, participants, setRoomId, joinRoom, sendText, sendControl } = useSocket();
  const [text, setText] = useState("");

  const handleSend = () => {
    if (!text) return;
    sendText(text);
    setText("");
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <main className="flex min-h-screen flex-col items-center justify-between p-4 bg-gray-900 text-white">
      <Header status={status} roomId={roomId} participants={participants} />

      {!roomId && <RoomJoin onJoin={joinRoom} />}

      <div className="w-full flex-grow flex flex-col gap-4">
        <textarea
          className="w-full h-64 bg-gray-800 rounded-lg p-4 text-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
          placeholder={roomId ? "Tap here to type on PC..." : "Please join a room first..."}
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={!roomId}
        />
        
        <button
          onClick={handleSend}
          disabled={status !== 'connected' || !text || !roomId}
          className="w-full py-4 bg-blue-600 rounded-lg font-bold text-xl active:scale-95 transition-transform disabled:opacity-50 disabled:active:scale-100"
        >
          SEND
        </button>

        <div className="grid grid-cols-2 gap-4">
             <button 
                className="py-3 bg-gray-700 rounded hover:bg-gray-600 active:scale-95 disabled:opacity-50"
                onClick={() => sendControl("backspace")}
                disabled={!roomId}
             >
                ⌫ Backspace
             </button>
             <button 
                className="py-3 bg-gray-700 rounded hover:bg-gray-600 active:scale-95 disabled:opacity-50"
                onClick={() => sendControl("enter")}
                disabled={!roomId}
             >
                ↵ Enter
             </button>
        </div>
      </div>

      {roomId && (
        <div className="mt-8 flex items-center gap-4 text-xs text-gray-500">
          <span>Connected to: <span className="font-mono font-bold text-gray-300">{roomId}</span></span>
          <button 
            onClick={() => setRoomId("")}
            className="underline hover:text-gray-300"
          >
            Change Room
          </button>
        </div>
      )}
    </main>
  );
}
