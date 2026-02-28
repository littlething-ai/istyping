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
      reconnectionAttempts: Infinity,
    });
    socketRef.current = socket;

    const syncRoomInfo = (targetId: string) => {
      if (socket.connected && targetId) {
        socket.emit("get_room_info", { roomId: targetId });
      }
    };

    socket.on("connect", () => {
      setStatus("connected");
      const currentRoomId = rId || (isLocalEnv(hostname) ? "000000" : "");
      if (currentRoomId) {
        joinRoom(currentRoomId);
        // 延迟同步以确保加入成功
        setTimeout(() => syncRoomInfo(currentRoomId), 500);
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

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        const currentRoomId = rId || (isLocalEnv(hostname) ? "000000" : "");
        syncRoomInfo(currentRoomId);
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      socket.disconnect();
      document.removeEventListener('visibilitychange', handleVisibilityChange);
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
    syncRoomInfo,
    socket: socketRef.current
  };
};
