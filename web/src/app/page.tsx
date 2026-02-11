"use client";

import { useEffect, useState, useRef } from "react";
import { io, Socket } from "socket.io-client";

export default function Home() {
  const [status, setStatus] = useState<"disconnected" | "connected">("disconnected");
  const [text, setText] = useState("");
  const [roomId, setRoomId] = useState("");
  const [inputRoomId, setInputRoomId] = useState("");
  const socketRef = useRef<Socket | null>(null);

  // 获取后端地址
  const getSocketUrl = () => {
    if (typeof window !== "undefined") {
      const hostname = window.location.hostname;
      if (hostname === "localhost" || hostname === "127.0.0.1") {
        return "http://localhost:3000";
      }
    }
    return "http://istyping.app:3000";
  };

  const joinRoom = (id: string) => {
    if (!id || !socketRef.current) return;
    console.log("Joining room:", id);
    socketRef.current.emit("join_room", id);
    setInputRoomId(id);
  };

  useEffect(() => {
    // 从 URL 获取 Room ID
    const params = new URLSearchParams(window.location.search);
    const rId = params.get("room") || "";
    
    // 1. 初始化 Socket 连接
    const socket = io(getSocketUrl(), {
      transports: ["websocket"],
      reconnectionAttempts: 5,
    });
    socketRef.current = socket;

    socket.on("connect", () => {
      console.log("Connected to server:", socket.id);
      setStatus("connected");
      if (rId) {
        joinRoom(rId);
      }
    });

    socket.on("joined_room_info", (data: { roomId: string }) => {
      console.log("Joined room successfully:", data.roomId);
      setRoomId(data.roomId);
    });

    socket.on("error_message", (msg: string) => {
      alert(msg);
      setRoomId("");
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
      socketRef.current.emit("send_text", { roomId, text });
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

                      <div>

                        <h1 className="text-xl font-bold">Is Typing...</h1>

                        {roomId ? (

                          <div className="text-lg text-blue-400 font-black font-mono tracking-widest">

                            {roomId}

                          </div>

                        ) : (

                          <div className="text-xs text-gray-500 italic">Not Connected</div>

                        )}

                      </div>

                      <div className={`px-2 py-1 rounded text-xs ${status === 'connected' ? 'bg-green-600' : 'bg-red-600'}`}>

                        {status.toUpperCase()}

                      </div>

                    </div>

              

        

  

        {/* Room ID Input */}

        {!roomId && (

                  <div className="w-full mb-4 flex gap-2">

                    <input

                      type="text"

                      placeholder="Enter 6-digit ID"

                      inputMode="numeric"

                      className="flex-grow bg-gray-800 rounded px-4 py-2 uppercase font-mono focus:outline-none focus:ring-2 focus:ring-blue-500"

                      value={inputRoomId}

                      onChange={(e) => setInputRoomId(e.target.value.toUpperCase())}

                    />

                    <button 

                      onClick={() => joinRoom(inputRoomId)}

                      className="px-6 py-2 bg-blue-600 rounded font-bold active:scale-95 transition-transform"

                    >

                      JOIN

                    </button>

                  </div>

          

        )}

  

        {/* Input Area */}

        <div className="w-full flex-grow flex flex-col gap-4">

          <textarea

            className="w-full h-64 bg-gray-800 rounded-lg p-4 text-lg focus:outline-none focus:ring-2 focus:ring-blue-500"

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

                  onClick={() => socketRef.current?.emit("send_control", { roomId, action: "backspace" })}

                  disabled={!roomId}

               >

                  ⌫ Backspace

               </button>

               <button 

                  className="py-3 bg-gray-700 rounded hover:bg-gray-600 active:scale-95 disabled:opacity-50"

                  onClick={() => socketRef.current?.emit("send_control", { roomId, action: "enter" })}

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

  