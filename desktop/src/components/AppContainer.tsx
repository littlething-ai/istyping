import { motion } from "framer-motion";
import { cn } from "../lib/utils";
import React, { ReactNode } from "react";
import { ViewMode } from "../types";

interface AppContainerProps {
  children: ReactNode;
  className?: string;
  viewMode: ViewMode;
}

export const AppContainer = ({ children, className, viewMode }: AppContainerProps) => {
  // 定义三种模式的尺寸
  const variants = {
    pairing: { width: 300, height: 480, borderRadius: 24 },
    compact: { width: 200, height: 60, borderRadius: 30 }, // 修正为 200px 宽度
    history: { width: 320, height: 500, borderRadius: 24 }
  };

  return (
    <motion.div
      initial={false}
      animate={variants[viewMode]}
      transition={{ type: "spring", stiffness: 280, damping: 24 }}
      className={cn(
        "glass overflow-hidden select-none relative flex flex-col",
        className
      )}
      data-tauri-drag-region
    >
      {children}
    </motion.div>
  );
};
