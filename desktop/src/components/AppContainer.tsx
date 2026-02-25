import { motion } from "framer-motion";
import { cn } from "../lib/utils";
import { ReactNode } from "react";
// Removed direct window import as it's handled in App.tsx

interface AppContainerProps {
  children: ReactNode;
  className?: string;
}

export const AppContainer = ({ children, className }: AppContainerProps) => {
  return (
    <motion.div
      initial={false}
      style={{ borderRadius: 30, width: 200, height: 60 }}
      className={cn(
        "glass overflow-hidden select-none relative flex flex-col cursor-default",
        className
      )}
    >
      {children}
    </motion.div>
  );
};
