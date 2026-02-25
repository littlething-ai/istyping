import { useState, useEffect, useRef } from "react";
import { invoke } from "@tauri-apps/api/core";

export type HeaderOverlayState = 'IDLE' | 'HOVER' | 'DRAGGING';

const terminalLog = (msg: string) => {
  invoke('js_log', { message: msg }).catch(() => {});
};

export const useHeaderStateMachine = (onAction: () => void) => {
  const isDev = import.meta.env.DEV;
  const [overlayState, setOverlayState] = useState<HeaderOverlayState>('IDLE');
  const isMouseActuallyInside = useRef(false);
  const dragStartTime = useRef(0);

  // Debug 心跳日志
  useEffect(() => {
    if (!isDev) return;
    const timer = setInterval(() => {
      terminalLog(`[STATE-MACHINE] Overlay: ${overlayState}`);
    }, 1000);
    return () => clearInterval(timer);
  }, [overlayState, isDev]);

  // 核心检测逻辑
  useEffect(() => {
    if (overlayState === 'DRAGGING') {
      
      const handleGlobalMouseUp = (e: MouseEvent) => {
        terminalLog(`>> Detect: mouseup (btn ${e.button})`);
        exitDragging();
      };

      const handleGlobalMouseMove = () => {
        if (Date.now() - dragStartTime.current > 200) {
          exitDragging();
        }
      };

      const handleBlur = () => {
        const duration = Date.now() - dragStartTime.current;
        if (duration > 500) {
          terminalLog(`>> Detect: real blur (${duration}ms) -> Exit`);
          exitDragging();
        }
      };

      const exitDragging = () => {
        setOverlayState(isMouseActuallyInside.current ? 'HOVER' : 'IDLE');
      };

      window.addEventListener('mouseup', handleGlobalMouseUp);
      window.addEventListener('mousemove', handleGlobalMouseMove);
      window.addEventListener('blur', handleBlur);
      
      return () => {
        window.removeEventListener('mouseup', handleGlobalMouseUp);
        window.removeEventListener('mousemove', handleGlobalMouseMove);
        window.removeEventListener('blur', handleBlur);
      };
    }
  }, [overlayState]);

  const handleMouseEnter = () => {
    isMouseActuallyInside.current = true;
    if (overlayState !== 'DRAGGING') {
      setOverlayState('HOVER');
    }
  };

  const handleMouseLeave = () => {
    isMouseActuallyInside.current = false;
    if (overlayState !== 'DRAGGING') {
      setOverlayState('IDLE');
    }
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button !== 0) return;
    const target = e.target as HTMLElement;
    if (target.closest('button')) return;

    dragStartTime.current = Date.now();
    setOverlayState('DRAGGING');
    terminalLog(">> Action: mousedown -> DRAGGING");

    invoke('start_drag').catch((err) => {
      terminalLog(`!! start_drag ERROR: ${err}`);
      setOverlayState('IDLE');
    });
  };

  const handleClick = (e: React.MouseEvent) => {
    const target = e.target as HTMLElement;
    if (target.closest('button')) return;
    
    const duration = Date.now() - dragStartTime.current;
    if (duration < 300) {
      terminalLog(`>> Click -> Action triggered`);
      onAction();
    }
  };

  return {
    overlayState,
    handlers: {
      onMouseEnter: handleMouseEnter,
      onMouseLeave: handleMouseLeave,
      onMouseDown: handleMouseDown,
      onClick: handleClick,
    }
  };
};
