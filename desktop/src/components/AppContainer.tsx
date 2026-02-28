import { motion } from "framer-motion";
import { cn } from "../lib/utils";
import { ReactNode } from "react";

interface AppContainerProps {
  children: ReactNode;
  className?: string;
}

export const AppContainer = ({ children, className }: AppContainerProps) => {
  return (
    <motion.div
      initial={false}
      style={{ borderRadius: 30, width: 198, height: 58 }}
      className={cn(
        "glass overflow-hidden select-none relative flex flex-col cursor-default shadow-2xl",
        className
      )}
    >
      {children}
    </motion.div>
  );
};
