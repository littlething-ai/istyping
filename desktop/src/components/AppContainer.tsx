import { motion } from "framer-motion";
import { cn } from "../lib/utils";
import { ReactNode } from "react";
import { ViewMode } from "../types";
// Removed direct window import as it's handled in App.tsx

interface AppContainerProps {
  children: ReactNode;
  className?: string;
  viewMode: ViewMode;
  status?: "standby" | "ready" | "typing";
}

export const AppContainer = ({ children, className, viewMode }: AppContainerProps) => {
  // 定义三种模式的尺寸
  const variants = {
    pairing: { width: 300, height: 480, borderRadius: 24 },
    compact: { width: 200, height: 60, borderRadius: 30 }, 
    history: { width: 320, height: 500, borderRadius: 24 }
  };

  return (
    <motion.div
      initial={false}
      animate={variants[viewMode]}
      transition={{ type: "spring", stiffness: 280, damping: 24 }}
      className={cn(
        "glass overflow-hidden select-none relative flex flex-col cursor-default",
        className
      )}
    >
      {children}
    </motion.div>
  );
};
