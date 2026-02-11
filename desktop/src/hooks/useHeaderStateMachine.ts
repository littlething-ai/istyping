import { useState, useEffect, useRef } from "react";
import { invoke } from "@tauri-apps/api/core";
import { ViewMode } from "../types";

export type HeaderOverlayState = 'IDLE' | 'HOVER' | 'DRAGGING';

const terminalLog = (msg: string) => {
  invoke('js_log', { message: msg }).catch(() => {});
};

export const useHeaderStateMachine = (viewMode: ViewMode, onToggleExpand: () => void) => {
  const isDev = import.meta.env.DEV;
  const [overlayState, setOverlayState] = useState<HeaderOverlayState>('IDLE');
  const isMouseActuallyInside = useRef(false);

  // Debug 心跳日志
  useEffect(() => {
    if (!isDev) return;
    const timer = setInterval(() => {
      terminalLog(`[STATE-MACHINE] Mode: ${viewMode}, Overlay: ${overlayState}`);
    }, 1000);
    return () => clearInterval(timer);
  }, [overlayState, viewMode, isDev]);

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

    setOverlayState('DRAGGING');
    terminalLog(">> Transition: -> DRAGGING");

    // 给予微小缓冲，然后执行原生拖拽
    setTimeout(() => {
      invoke('start_drag')
        .then(() => {
          terminalLog(">> Native Drag Resolve");
          // 逻辑回归：检查鼠标当前真实位置
          setOverlayState(isMouseActuallyInside.current ? 'HOVER' : 'IDLE');
        })
        .catch((err) => {
          console.error(err);
          setOverlayState('IDLE');
        });
    }, 30);
  };

  const handleClick = (e: React.MouseEvent) => {
    const target = e.target as HTMLElement;
    if (target.closest('button')) return;
    if (viewMode === 'compact') {
      onToggleExpand();
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
