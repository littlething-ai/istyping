'use client';

import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Users, Monitor, Smartphone, ChevronDown, ChevronUp, RotateCw } from 'lucide-react';
import { Participant } from '../hooks/useSocket';
import { cn } from '../lib/utils';

interface HeaderProps {
  status: "disconnected" | "connected";
  roomId: string;
  participants: Participant[];
  onRefresh?: () => void;
}

export const Header = ({ status, roomId, participants, onRefresh }: HeaderProps) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const count = participants.length;
  const isSynced = status === 'connected' && count >= 2;
  const isWaiting = status === 'connected' && count === 1;

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsExpanded(false);
      }
    };

    if (isExpanded) {
      document.addEventListener('mousedown', handleClickOutside);
    } else {
      document.removeEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isExpanded]);

  const handleRefresh = () => {
    if (onRefresh && !isRefreshing) {
      setIsRefreshing(true);
      onRefresh();
      // 模拟动画效果
      setTimeout(() => setIsRefreshing(false), 1000);
    }
  };

  return (
    <div className="w-full mb-8 relative z-50">
      <div className="flex justify-between items-start">
        <div className="flex flex-col">
          <h1 className="text-2xl font-black tracking-tighter text-white">
            Is Typing<span className="text-blue-500">.</span>
          </h1>
          <AnimatePresence mode="wait">
            {roomId && (
              <motion.div 
                initial={{ opacity: 0, y: -5 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -5 }}
                className="text-xs font-mono font-bold text-blue-400/80 tracking-[0.2em] mt-1 uppercase"
              >
                Room {roomId}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* 参与者 Pill */}
        <div className="relative" ref={dropdownRef}>
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={() => setIsExpanded(!isExpanded)}
            className={cn(
              "flex items-center gap-2 px-3 py-1.5 rounded-full border transition-all duration-300",
              isSynced 
                ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400" 
                : isWaiting
                  ? "bg-white/5 border-white/10 text-gray-400"
                  : "bg-red-500/10 border-red-500/20 text-red-400"
            )}
          >
            <div className={cn(
              "w-1.5 h-1.5 rounded-full",
              isSynced ? "bg-emerald-500 animate-pulse" : "bg-gray-600"
            )} />
            <span className="text-[10px] font-black font-mono tracking-widest uppercase">
              {isSynced ? 'Synced' : isWaiting ? 'Waiting...' : 'Offline'}
            </span>
            {isExpanded ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
          </motion.button>

          {/* 展开列表 */}
          <AnimatePresence>
            {isExpanded && (
              <motion.div
                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                animate={{ opacity: 1, y: 5, scale: 1 }}
                exit={{ opacity: 0, y: 10, scale: 0.95 }}
                className="absolute right-0 top-full mt-2 w-48 bg-black/80 backdrop-blur-xl border border-white/10 rounded-2xl p-2 shadow-2xl"
              >
                <div className="px-2 py-1.5 flex justify-between items-center border-b border-white/5 mb-1">
                  <span className="text-[9px] font-bold text-gray-500 uppercase tracking-widest">
                    Connected Devices
                  </span>
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      handleRefresh();
                    }}
                    className={cn(
                      "p-1 hover:bg-white/10 rounded-md transition-all outline-none",
                      isRefreshing && "animate-spin text-blue-400"
                    )}
                  >
                    <RotateCw size={10} className={cn(isRefreshing ? "text-blue-400" : "text-gray-500")} />
                  </button>
                </div>
                <div className="flex flex-col gap-1">
                  {participants.length === 0 ? (
                    <div className="px-3 py-2 text-[10px] text-gray-600 italic">No devices found</div>
                  ) : (
                    participants.map((p) => (
                      <div 
                        key={p.id}
                        className="flex items-center gap-3 px-3 py-2 rounded-xl hover:bg-white/5 transition-colors"
                      >
                        <div className={cn(
                          "w-8 h-8 rounded-lg flex items-center justify-center shrink-0",
                          p.deviceType === 'pc' ? "bg-blue-500/20 text-blue-400" : "bg-purple-500/20 text-purple-400"
                        )}>
                          {p.deviceType === 'pc' ? <Monitor size={14} /> : <Smartphone size={14} />}
                        </div>
                        <div className="flex flex-col overflow-hidden">
                          <span className="text-[11px] font-bold text-gray-200 truncate">{p.deviceName}</span>
                          <span className="text-[8px] text-gray-500 uppercase font-mono">{p.deviceType}</span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};
