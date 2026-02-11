import { motion } from "framer-motion";
import { Wifi, WifiOff, ChevronDown, ChevronUp, Keyboard } from "lucide-react";
import { cn } from "../lib/utils";
import { ViewMode } from "../types";

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

  return (
    <div
      className="w-full h-[60px] flex items-center px-4 relative shrink-0"
      data-tauri-drag-region
    >
      {/* 状态灯 (左侧) - 仅在非Compact模式或Compact模式下需要明确指示时显示 */}
      <div className={cn("flex items-center justify-center w-8 h-8 mr-2 relative", isCompact ? "mr-0" : "mr-2")}>
        <motion.div
          className={cn(
            "w-2.5 h-2.5 rounded-full absolute z-10",
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
        {isCompact ? (
          /* Compact Mode: 极简显示，移除文字，只保留一个图标或留白 */
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex items-center justify-center h-full opacity-50"
          >
             {/* 可以放一个 Logo 或图标 */}
             <Keyboard size={20} className="text-white/50" />
          </motion.div>
        ) : (
          /* Expanded/History Mode: 显示标题和状态 */
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col justify-center h-full"
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

      {/* 右侧交互区 */}
      <div className="flex items-center justify-center w-8 h-8">
        {showExpandButton ? (
          <button 
            onClick={onToggleExpand}
            className="text-gray-400 hover:text-white hover:bg-white/10 p-1.5 rounded-full transition-colors active:scale-90 cursor-pointer"
          >
            {isHistory ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </button>
        ) : (
          <div className="text-gray-600/50">
            <WifiOff size={16} />
          </div>
        )}
      </div>
      
    </div>
  );
};
