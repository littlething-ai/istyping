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
  const currentRoomIdRef = useRef(roomId);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    currentRoomIdRef.current = roomId;
  }, [roomId]);

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

  const syncRoomInfo = useCallback((targetId: string) => {
    if (socketRef.current?.connected && targetId) {
      socketRef.current.emit("get_room_info", { roomId: targetId });
    }
  }, []);

  useEffect(() => {
    const hostname = window.location.hostname;
    const params = new URLSearchParams(window.location.search);
    const rId = params.get("room") || "";

    const socket = io(getSocketUrl(hostname), {
      transports: ["websocket"],
      reconnectionAttempts: Infinity,
    });
    socketRef.current = socket;

    socket.on("connect", () => {
      setStatus("connected");
      const targetRoomId = currentRoomIdRef.current || rId || (isLocalEnv(hostname) ? "000000" : "");
      if (targetRoomId) {
        joinRoom(targetRoomId);
        // 延迟同步以确保加入成功
        setTimeout(() => syncRoomInfo(targetRoomId), 500);
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
        const targetRoomId = currentRoomIdRef.current || rId || (isLocalEnv(hostname) ? "000000" : "");
        if (targetRoomId) {
          // 为了防止服务端清理了房间，唤醒时不仅要同步，最好重新发起一次加入
          joinRoom(targetRoomId);
          setTimeout(() => syncRoomInfo(targetRoomId), 500);
        }
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
