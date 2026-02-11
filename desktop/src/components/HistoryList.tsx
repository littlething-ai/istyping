import { motion, AnimatePresence } from "framer-motion";
import { Copy, Check } from "lucide-react";
import { useState } from "react";
import { cn } from "../lib/utils";

interface HistoryListProps {
  history: string[];
}

export const HistoryList = ({ history }: HistoryListProps) => {
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  const handleCopy = (text: string, index: number) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 1500);
  };

  return (
    <div className="flex-1 overflow-hidden flex flex-col px-4 pb-4">
      <div className="text-[10px] text-gray-500 font-bold uppercase mb-2 sticky top-0 bg-transparent backdrop-blur-md z-10 py-2">
        Recent History
      </div>
      
      <div className="flex-1 overflow-y-auto custom-scrollbar pr-2 space-y-2">
        <AnimatePresence initial={false}>
          {history.length === 0 ? (
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }}
              className="text-xs text-gray-600 italic text-center mt-8"
            >
              No messages yet...
            </motion.div>
          ) : (
            history.map((text, idx) => (
              <motion.div
                key={`${idx}-${text.substring(0, 10)}`}
                initial={{ opacity: 0, x: -10, height: 0 }}
                animate={{ opacity: 1, x: 0, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="group relative bg-white/5 border border-white/5 rounded-xl p-3 hover:bg-white/10 transition-colors"
              >
                <div className="text-xs text-gray-200 font-mono break-all pr-6 leading-relaxed">
                  {text}
                </div>
                
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleCopy(text, idx);
                  }}
                  className={cn(
                    "absolute top-2 right-2 p-1.5 rounded-lg transition-all",
                    copiedIndex === idx 
                      ? "bg-green-500/20 text-green-400 opacity-100" 
                      : "bg-white/5 text-gray-400 opacity-0 group-hover:opacity-100 hover:bg-blue-500 hover:text-white"
                  )}
                >
                  {copiedIndex === idx ? <Check size={12} /> : <Copy size={12} />}
                </button>
              </motion.div>
            ))
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};
