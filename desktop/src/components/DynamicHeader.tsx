import { motion } from "framer-motion";
import { WifiOff, ChevronDown, ChevronUp } from "lucide-react";
import { cn } from "../lib/utils";
import { ViewMode } from "../types";
import { useHeaderStateMachine } from "../hooks/useHeaderStateMachine";

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
  const isDev = import.meta.env.DEV;

  // 使用独立的状态机 Hook
  const { overlayState, handlers } = useHeaderStateMachine(viewMode, onToggleExpand);

  return (
    <div
      className="w-full flex items-center px-4 shrink-0 cursor-default"
      style={{ 
        position: 'relative',
        height: '60px',
        width: '100%',
        backgroundColor: 'rgba(255, 255, 255, 0.01)', 
      }} 
      {...handlers}
    >
      {/* --- 视觉提示层 (Overlay) --- */}
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
            // 为不同状态分配明显不同的颜色
            backgroundColor: 
              overlayState === 'DRAGGING' 
                ? 'rgba(0, 0, 0, 0.85)'  // 拖拽中：深黑，强调控制感
                : 'rgba(30, 64, 175, 0.65)', // 悬浮中：靛蓝，提示可交互
            backdropFilter: 'blur(2px)',
            opacity: overlayState === 'IDLE' ? 0 : 1,
            transition: overlayState === 'HOVER' ? 'opacity 0.3s ease 0.2s' : 'opacity 0.1s ease',
          }}
        >
           {overlayState === 'DRAGGING' ? (
             /* 状态：拖拽中 (十字箭头 - 向外扩张版) */
             <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
               <polyline points="9 5 12 2 15 5" />      {/* 上箭头 */}
               <polyline points="9 19 12 22 15 19" />   {/* 下箭头 */}
               <polyline points="19 9 22 12 19 15" />   {/* 右箭头 */}
               <polyline points="5 9 2 12 5 15" />      {/* 左箭头 */}
               <line x1="12" y1="2" x2="12" y2="22" />  {/* 垂直线 */}
               <line x1="2" y1="12" x2="22" y2="12" />  {/* 水平线段 */}
             </svg>
           ) : (
             <svg width="24" height="12" viewBox="0 0 40 12" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ transform: 'scale(1.25)', color: 'white' }}>
               <path d="M4 1L9 6L4 11" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/>
               <path d="M18 1L23 6L18 11" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/>
               <path d="M32 1L37 6L32 11" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/>
             </svg>
           )}

           {isDev && (
             <span style={{ position: 'absolute', left: '40px', fontSize: '8px', color: 'white', opacity: 0.8, fontWeight: 'bold' }}>
               {overlayState}
             </span>
           )}
        </div>
      )}

      {/* --- 状态灯 (左侧) --- */}
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

      {/* --- 中间内容区 --- */}
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

      {/* --- 右侧交互区 --- */}
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
