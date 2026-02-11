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
  const dragStartTime = useRef(0);

  // Debug 心跳日志
  useEffect(() => {
    if (!isDev) return;
    const timer = setInterval(() => {
      terminalLog(`[STATE-MACHINE] Mode: ${viewMode}, Overlay: ${overlayState}`);
    }, 1000);
    return () => clearInterval(timer);
  }, [overlayState, viewMode, isDev]);

  // 核心检测逻辑
  useEffect(() => {
    if (overlayState === 'DRAGGING') {
      
      const handleGlobalMouseUp = (e: MouseEvent) => {
        terminalLog(`>> Detect: mouseup (btn ${e.button})`);
        exitDragging();
      };

      const handleGlobalMouseMove = () => {
        // 增加更长一点的宽限期（200ms），确保原生拖拽已经稳固启动
        if (Date.now() - dragStartTime.current > 200) {
          exitDragging();
        }
      };

      const handleBlur = () => {
        // 关键修复：忽略拖拽开始前 500ms 内的失焦事件
        // 因为 start_drag 会导致窗口瞬间失去焦点给 OS
        const duration = Date.now() - dragStartTime.current;
        if (duration > 500) {
          terminalLog(`>> Detect: real blur (${duration}ms) -> Exit`);
          exitDragging();
        } else {
          // terminalLog(`>> Ignored: system-induced blur during start_drag (${duration}ms)`);
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

    // 执行原生拖拽
    invoke('start_drag').catch((err) => {
      terminalLog(`!! start_drag ERROR: ${err}`);
      setOverlayState('IDLE');
    });
  };

  const handleClick = (e: React.MouseEvent) => {
    const target = e.target as HTMLElement;
    if (target.closest('button')) return;
    
    const duration = Date.now() - dragStartTime.current;
    if (viewMode === 'compact' && duration < 300) {
      terminalLog(`>> Click -> Expanding`);
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
