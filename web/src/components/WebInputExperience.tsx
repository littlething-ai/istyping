"use client";

import Link from "next/link";
import { useState } from "react";
import { Header } from "./Header";
import { RoomJoin } from "./RoomJoin";
import { useSocket } from "../hooks/useSocket";

export const WebInputExperience = () => {
  const { status, roomId, participants, clearRoom, joinRoom, sendText, sendControl, syncRoomInfo } =
    useSocket();
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
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,#14304a_0%,#08111c_35%,#05080d_100%)] px-4 py-5 text-white">
      <div className="mx-auto flex min-h-[calc(100vh-2.5rem)] w-full max-w-3xl flex-col rounded-[28px] border border-white/10 bg-black/35 p-5 shadow-[0_24px_100px_rgba(0,0,0,0.45)] backdrop-blur-xl sm:p-7">
        <div className="mb-5 flex items-center justify-between gap-4 text-[11px] uppercase tracking-[0.25em] text-slate-400">
          <span>Phone Input</span>
          <Link href="/" className="rounded-full border border-white/10 px-3 py-1 text-[10px] font-semibold tracking-[0.2em] text-slate-300 transition hover:border-cyan-300/40 hover:text-white">
            About
          </Link>
        </div>

        <Header
          status={status}
          roomId={roomId}
          participants={participants}
          onRefresh={() => syncRoomInfo(roomId)}
        />

        {!roomId && (
          <div className="mb-6 rounded-[24px] border border-white/10 bg-white/5 p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]">
            <div className="mb-3">
              <p className="text-sm font-semibold text-white">Join a room</p>
              <p className="mt-1 text-xs text-slate-400">
                Enter the room code from the desktop app or open a QR link.
              </p>
            </div>
            <RoomJoin onJoin={joinRoom} />
          </div>
        )}

        <div className="flex flex-1 flex-col gap-4">
          <textarea
            className="min-h-[280px] w-full flex-1 rounded-[24px] border border-white/10 bg-slate-950/70 p-5 text-lg text-white outline-none transition placeholder:text-slate-500 focus:border-cyan-300/50 focus:ring-2 focus:ring-cyan-400/20 disabled:opacity-50"
            placeholder={roomId ? "Tap here to type on desktop..." : "Join a room first..."}
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={!roomId}
          />

          <button
            onClick={handleSend}
            disabled={status !== "connected" || !text || !roomId}
            className="rounded-[22px] bg-[linear-gradient(135deg,#0ea5e9,#22c55e)] px-6 py-4 text-base font-black uppercase tracking-[0.2em] text-slate-950 transition hover:brightness-110 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:brightness-100"
          >
            Send
          </button>

          <div className="grid grid-cols-2 gap-3">
            <button
              className="rounded-[20px] border border-white/10 bg-white/5 py-3 font-semibold text-slate-200 transition hover:bg-white/10 active:scale-[0.99] disabled:opacity-50"
              onClick={() => sendControl("backspace")}
              disabled={!roomId}
            >
              Backspace
            </button>
            <button
              className="rounded-[20px] border border-white/10 bg-white/5 py-3 font-semibold text-slate-200 transition hover:bg-white/10 active:scale-[0.99] disabled:opacity-50"
              onClick={() => sendControl("enter")}
              disabled={!roomId}
            >
              Enter
            </button>
          </div>
        </div>

        {roomId && (
          <div className="mt-6 flex flex-wrap items-center justify-between gap-3 rounded-[20px] border border-white/10 bg-black/30 px-4 py-3 text-sm text-slate-400">
            <span>
              Connected to{" "}
              <span className="font-mono font-bold tracking-[0.18em] text-cyan-300">{roomId}</span>
            </span>
            <button onClick={clearRoom} className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-300 transition hover:text-white">
              Change Room
            </button>
          </div>
        )}
      </div>
    </main>
  );
};
