import { motion } from "framer-motion";
import { WifiOff, ChevronDown, ChevronUp } from "lucide-react";
import { cn } from "../lib/utils";
import { ViewMode } from "../types";
import { invoke } from "@tauri-apps/api/core";

interface DynamicHeaderProps {
  status: "standby" | "ready" | "typing";
  roomId: string;
  roomNumber: string;
  viewMode: ViewMode;
  onToggleExpand: () => void;
  recentText?: string;
}

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

  const handleHeaderMouseDown = (e: React.MouseEvent) => {
    // 调试日志：确认点击是否触发
    console.log(">> MouseDown on Header/Overlay", e.button);
    
    if (e.button !== 0) return;
    const target = e.target as HTMLElement;
    if (target.closest('button')) return;
    
    invoke('start_drag').catch(err => console.error("Drag failed:", err));
  };

  const handleHeaderClick = (e: React.MouseEvent) => {
    const target = e.target as HTMLElement;
    if (target.closest('button')) return;
    if (isCompact) {
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
        backgroundColor: 'rgba(255, 255, 255, 0.01)' // 关键：确保父容器能承接住穿透下来的点击
      }} 
      onMouseDown={handleHeaderMouseDown}
      onClick={handleHeaderClick}
    >
      {/* 视觉提示层 (Overlay) - 永久显示，用于调试定位 */}
      {isCompact && (
        <div 
          style={{
            position: 'absolute',
            top: 2, left: 2, right: 2, bottom: 2,
            zIndex: 50,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            pointerEvents: 'none', // 关键：全息投影模式，点击直接穿透给父级
            borderRadius: '9999px',
            backgroundColor: 'rgba(0, 0, 0, 0.4)',
            backdropFilter: 'blur(1px)',
          }}
        >
           {/* >>> 箭头图标 */}
           <svg width="24" height="12" viewBox="0 0 40 12" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ transform: 'scale(1.25)', filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.1))', color: 'rgba(255,255,255,0.9)', pointerEvents: 'none' }}>
             <path d="M4 1L9 6L4 11" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/>
             <path d="M18 1L23 6L18 11" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/>
             <path d="M32 1L37 6L32 11" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/>
           </svg>
        </div>
      )}

      {/* 状态灯 (左侧) */}
      <div 
        className={cn("flex items-center justify-center w-8 h-8 mr-2 relative", isCompact ? "mr-0" : "mr-2")}
      >
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
      <div 
        className="flex-1 flex flex-col justify-center overflow-hidden h-full py-1"
      >
        {isCompact ? (
          /* Compact Mode: 极简留白 */
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex items-center justify-center h-full w-full pointer-events-none"
          >
             {/* 空置 */}
          </motion.div>
        ) : (
          /* Expanded/History Mode: 显示标题和状态 */
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col justify-center h-full pointer-events-none"
          >
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

      {/* 右侧交互区: 仅在非 Compact 模式下渲染按钮 */}
      <div className="flex items-center justify-center w-8 h-8 relative z-20">
        {!isCompact && showExpandButton ? (
          <button 
            onClick={(e) => {
              e.stopPropagation();
              onToggleExpand();
            }}
            onMouseDown={(e) => e.stopPropagation()}
            className="text-white/40 hover:text-white transition-colors active:scale-90 cursor-pointer"
          >
            {isHistory ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
          </button>
        ) : (
          <div className="text-gray-600/50 pointer-events-none">
            {!isCompact && <WifiOff size={16} />}
          </div>
        )}
      </div>
      
    </div>
  );
};
