import { motion } from "framer-motion";
import { cn } from "../lib/utils";
import { useHeaderStateMachine } from "../hooks/useHeaderStateMachine";

interface DynamicHeaderProps {
  status: "standby" | "ready" | "typing";
  roomId: string;
  roomNumber: string;
  onAction: () => void;
  recentText?: string;
}

export const DynamicHeader = ({
  status,
  onAction,
}: DynamicHeaderProps) => {
  const isDev = import.meta.env.DEV;

  // 使用独立的状态机 Hook
  const { overlayState, handlers } = useHeaderStateMachine(onAction);

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
          backgroundColor: 
            overlayState === 'DRAGGING' 
              ? 'rgba(0, 0, 0, 0.85)'  // 拖拽中：深黑
              : 'rgba(30, 64, 175, 0.65)', // 悬浮中：靛蓝
          backdropFilter: 'blur(2px)',
          opacity: overlayState === 'IDLE' ? 0 : 1,
          transition: overlayState === 'HOVER' ? 'opacity 0.3s ease 0.2s' : 'opacity 0.15s ease',
        }}
      >
          {/* 中心图标 */}
          {overlayState === 'DRAGGING' ? (
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="9 5 12 2 15 5" />
              <polyline points="9 19 12 22 15 19" />
              <polyline points="19 9 22 12 19 15" />
              <polyline points="5 9 2 12 5 15" />
              <line x1="12" y1="2" x2="12" y2="22" />
              <line x1="2" y1="12" x2="22" y2="12" />
            </svg>
          ) : (
            <svg width="24" height="12" viewBox="0 0 40 12" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ transform: 'scale(1.25)', color: 'white' }}>
              <path d="M4 1L9 6L4 11" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M18 1L23 6L18 11" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M32 1L37 6L32 11" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          )}

          {/* 恢复左侧 Debug 标签 (仅开发模式) */}
          {isDev && (
            <span style={{ position: 'absolute', left: '40px', fontSize: '8px', color: 'white', opacity: 0.8, fontWeight: 'bold' }}>
              {overlayState}
            </span>
          )}

          {/* 右侧引导文字 */}
          <span style={{ 
            position: 'absolute', 
            right: '40px', 
            fontSize: '8px', 
            color: 'white', 
            fontWeight: 'bold',
            letterSpacing: '0.05em',
            transition: 'opacity 0.2s ease',
            opacity: overlayState === 'DRAGGING' ? 0 : 0.7
          }}>
            HISTORY
          </span>
      </div>

      {/* --- 状态灯 (左侧) --- */}
      <div className="flex items-center justify-center w-8 h-8 mr-0 relative">
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
      </div>

      {/* --- 右侧交互区 --- */}
      <div className="flex items-center justify-center w-8 h-8 relative z-20">
      </div>
    </div>
  );
};
