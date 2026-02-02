"use client";

import { useEffect, useState, useRef } from "react";
import { io, Socket } from "socket.io-client";

// TODO: 部署时改为真实 VPS 地址
const SOCKET_URL = "http://10.10.114.222:3000"; 
const ROOM_ID = "demo-room"; // 暂时硬编码，后续由 URL 参数或扫码决定

export default function Home() {
  const [status, setStatus] = useState<"disconnected" | "connected">("disconnected");
  const [text, setText] = useState("");
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    // 1. 初始化 Socket 连接
    const socket = io(SOCKET_URL, {
      transports: ["websocket"], // 强制 WebSocket，避免轮询
      reconnectionAttempts: 5,
    });
    socketRef.current = socket;

    socket.on("connect", () => {
      console.log("Connected to server:", socket.id);
      setStatus("connected");
      // 2. 加入房间
      socket.emit("join_room", ROOM_ID);
    });

    socket.on("disconnect", () => {
      console.log("Disconnected");
      setStatus("disconnected");
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  // 发送文本
  const handleSend = () => {
    if (!text) return;
    if (socketRef.current) {
      socketRef.current.emit("send_text", { roomId: ROOM_ID, text });
      setText(""); // 清空输入框
    }
  };

  // 监听回车键 (手机键盘上的“前往”或“换行”)
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter") {
      e.preventDefault(); // 阻止默认换行
      handleSend();
    }
  };

  return (
    <main className="flex min-h-screen flex-col items-center justify-between p-4 bg-gray-900 text-white">
      {/* Header */}
      <div className="w-full flex justify-between items-center mb-4">
        <h1 className="text-xl font-bold">Is Typing...</h1>
        <div className={`px-2 py-1 rounded text-xs ${status === 'connected' ? 'bg-green-600' : 'bg-red-600'}`}>
          {status.toUpperCase()}
        </div>
      </div>

      {/* Input Area */}
      <div className="w-full flex-grow flex flex-col gap-4">
        <textarea
          className="w-full h-64 bg-gray-800 rounded-lg p-4 text-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="Tap here to type on PC..."
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={handleKeyDown}
        />
        
        <button
          onClick={handleSend}
          disabled={status !== 'connected' || !text}
          className="w-full py-4 bg-blue-600 rounded-lg font-bold text-xl active:scale-95 transition-transform disabled:opacity-50 disabled:active:scale-100"
        >
          SEND
        </button>

        <div className="grid grid-cols-2 gap-4">
             <button 
                className="py-3 bg-gray-700 rounded hover:bg-gray-600 active:scale-95"
                onClick={() => socketRef.current?.emit("send_control", { roomId: ROOM_ID, action: "backspace" })}
             >
                ⌫ Backspace
             </button>
             <button 
                className="py-3 bg-gray-700 rounded hover:bg-gray-600 active:scale-95"
                onClick={() => socketRef.current?.emit("send_control", { roomId: ROOM_ID, action: "enter" })}
             >
                ↵ Enter
             </button>
        </div>
      </div>

      <div className="mt-8 text-xs text-gray-500">
        Connected to: {ROOM_ID}
      </div>
    </main>
  );
}