import { motion } from "framer-motion";
import { WifiOff, ChevronDown, ChevronUp } from "lucide-react";
import { cn } from "../lib/utils";
import { ViewMode } from "../types";
import { invoke } from "@tauri-apps/api/core";
import { useState, useEffect } from "react";

interface DynamicHeaderProps {
  status: "standby" | "ready" | "typing";
  roomId: string;
  roomNumber: string;
  viewMode: ViewMode;
  onToggleExpand: () => void;
  recentText?: string;
}

// 终端日志转发工具
const terminalLog = (msg: string) => {
  invoke('js_log', { message: msg }).catch(() => {});
};

export const DynamicHeader = ({
  status,
  roomId,
  roomNumber,
  viewMode,
  onToggleExpand,
  recentText
}: DynamicHeaderProps) => {
  const isCompact = viewMode === 'compact';
  const isHistory = viewMode === 'history';
  const showExpandButton = viewMode !== 'pairing';

  const isDev = import.meta.env.DEV;
  const [isMouseOver, setIsMouseOver] = useState(false);

  // 定时发送日志，验证桥接是否成功
  useEffect(() => {
    if (!isDev) return;

    const timer = setInterval(() => {
      terminalLog(`Heartbeat - Hover: ${isMouseOver}, Mode: ${viewMode}`);
    }, 2000); // 每 2 秒发一次，避免刷屏太快

    return () => clearInterval(timer);
  }, [isMouseOver, viewMode, isDev]);

  const handleHeaderMouseDown = (e: React.MouseEvent) => {
    if (e.button !== 0) return;
    const target = e.target as HTMLElement;
    if (target.closest('button')) return;
    
    terminalLog(">> User started dragging");
    invoke('start_drag').catch(console.error);
  };

  const handleHeaderClick = (e: React.MouseEvent) => {
    const target = e.target as HTMLElement;
    if (target.closest('button')) return;
    if (isCompact) {
      terminalLog(">> Compact Island Clicked -> Expanding");
      onToggleExpand();
    }
  };

  return (
    <div
      className="w-full flex items-center px-4 shrink-0 cursor-default"
      style={{ 
        position: 'relative',
        height: '60px',
        width: '100%',
        backgroundColor: 'rgba(255, 255, 255, 0.01)', 
      }} 
      onMouseDown={handleHeaderMouseDown}
      onClick={handleHeaderClick}
      onMouseEnter={() => setIsMouseOver(true)}
      onMouseLeave={() => setIsMouseOver(false)}
    >
      {/* 视觉提示层 (Overlay) */}
      {isCompact && (
        <div 
          style={{
            position: 'absolute',
            top: 2, left: 2, right: 2, bottom: 2,
            zIndex: 50,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            pointerEvents: 'none', 
            borderRadius: '9999px',
            backgroundColor: (isDev && isMouseOver) ? 'rgba(59, 130, 246, 0.5)' : 'rgba(0, 0, 0, 0.4)',
            backdropFilter: 'blur(1px)',
            transition: 'background-color 0.2s ease'
          }}
        >
           <svg width="24" height="12" viewBox="0 0 40 12" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ transform: 'scale(1.25)', color: 'white', pointerEvents: 'none' }}>
             <path d="M4 1L9 6L4 11" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/>
             <path d="M18 1L23 6L18 11" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/>
             <path d="M32 1L37 6L32 11" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/>
           </svg>

           {isDev && (
             <span style={{ position: 'absolute', left: '40px', fontSize: '8px', color: 'white', opacity: 0.8, fontWeight: 'bold' }}>
               {isMouseOver ? "OVER" : "OUT"}
             </span>
           )}
        </div>
      )}

      {/* 状态灯 (左侧) */}
      <div className={cn("flex items-center justify-center w-8 h-8 mr-2 relative", isCompact ? "mr-0" : "mr-2")}>
        <motion.div
          className={cn(
            "w-2.5 h-2.5 rounded-full absolute z-10 pointer-events-none",
            status === "standby" ? "bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.6)]" :
            status === "ready" ? "bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)]" :
            "bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.8)]"
          )}
          animate={{
            scale: status === "typing" ? [1, 1.4, 1] : 1,
            opacity: status === "typing" ? [0.8, 1, 0.8] : 1
          }}
          transition={{ repeat: Infinity, duration: 1.2, ease: "easeInOut" }}
        />
      </div>

      {/* 中间内容区 */}
      <div className="flex-1 flex flex-col justify-center overflow-hidden h-full py-1">
        {!isCompact && (
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col justify-center h-full pointer-events-none">
            <h1 className="text-sm font-bold text-gray-100 tracking-wide flex items-center gap-2">
              Is Typing...
              {status === 'typing' && <span className="text-[9px] text-blue-400 animate-pulse">●</span>}
            </h1>
            <span className="text-[10px] text-gray-500 uppercase tracking-widest font-mono mt-0.5">
              {viewMode === 'pairing' ? 'WAITING...' : 'HISTORY'}
            </span>
          </motion.div>
        )}
      </div>

      {/* 右侧交互区 */}
      <div className="flex items-center justify-center w-8 h-8 relative z-20">
        {!isCompact && showExpandButton && (
          <button 
            onClick={(e) => { e.stopPropagation(); onToggleExpand(); }}
            onMouseDown={(e) => e.stopPropagation()}
            className="text-white/40 hover:text-white transition-colors active:scale-90 cursor-pointer"
          >
            {isHistory ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
          </button>
        )}
      </div>
    </div>
  );
};
