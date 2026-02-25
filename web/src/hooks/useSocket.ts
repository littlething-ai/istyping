import { useEffect, useState, useRef, useCallback } from "react";
import { io, Socket } from "socket.io-client";
import { getSocketUrl, isLocalEnv } from "../utils/env";

export interface Participant {
  id: string;
  name: string;
  type: 'pc' | 'mobile';
}

export const useSocket = () => {
  const [status, setStatus] = useState<"disconnected" | "connected">("disconnected");
  const [roomId, setRoomId] = useState("");
  const [participants, setParticipants] = useState<Participant[]>([]);
  const socketRef = useRef<Socket | null>(null);

  const joinRoom = useCallback((id: string) => {
    if (!id || !socketRef.current) return;
    // 发送加入请求，带上设备名
    const deviceName = `${window.navigator.platform.split(' ')[0]} Browser`;
    socketRef.current.emit("join_room", { roomId: id, deviceName, deviceType: 'mobile' });
  }, []);

  const sendText = useCallback((text: string) => {
    if (!text || !roomId || !socketRef.current) return;
    socketRef.current.emit("send_text", { roomId, text });
  }, [roomId]);

  const sendControl = useCallback((action: "backspace" | "enter") => {
    if (!roomId || !socketRef.current) return;
    socketRef.current.emit("send_control", { roomId, action });
  }, [roomId]);

  useEffect(() => {
    const hostname = window.location.hostname;
    const params = new URLSearchParams(window.location.search);
    const rId = params.get("room") || "";

    const socket = io(getSocketUrl(hostname), {
      transports: ["websocket"],
      reconnectionAttempts: 5,
    });
    socketRef.current = socket;

    socket.on("connect", () => {
      setStatus("connected");
      if (rId) {
        joinRoom(rId);
      } else if (isLocalEnv(hostname)) {
        joinRoom("000000");
      }
    });

    socket.on("joined_room_info", (data: { roomId: string }) => {
      setRoomId(data.roomId);
    });

    socket.on("room_update", (data: { participants: Participant[] }) => {
      setParticipants(data.participants);
    });

    socket.on("error_message", (msg: string) => {
      alert(msg);
      setRoomId("");
    });

    socket.on("disconnect", () => {
      setStatus("disconnected");
      setParticipants([]);
    });

    return () => {
      socket.disconnect();
    };
  }, [joinRoom]);

  return {
    status,
    roomId,
    participants,
    setRoomId,
    joinRoom,
    sendText,
    sendControl,
    socket: socketRef.current
  };
};
