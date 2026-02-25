import { useState, useEffect, useRef, useMemo } from "react";
import { invoke } from "@tauri-apps/api/core";

export type HeaderOverlayState = 'IDLE' | 'HOVER' | 'DRAGGING';

const terminalLog = (msg: string) => {
  invoke('js_log', { message: msg }).catch(() => {});
};

// --- 状态基类 ---

abstract class BaseState {
  constructor(protected machine: StateMachine) {}
  abstract readonly name: HeaderOverlayState;

  enter() {}
  exit() {}

  onMouseEnter() {}
  onMouseLeave() {}
  onMouseDown(_e: React.MouseEvent) {}
  onClick(_e: React.MouseEvent) {}
}

// --- 具体状态类 ---

class IdleState extends BaseState {
  readonly name = 'IDLE';

  onMouseEnter() {
    this.machine.setIsMouseInside(true);
    this.machine.transitionTo('HOVER');
  }
}

class HoverState extends BaseState {
  readonly name = 'HOVER';

  onMouseLeave() {
    this.machine.setIsMouseInside(false);
    this.machine.transitionTo('IDLE');
  }

  onMouseDown(e: React.MouseEvent) {
    if (e.button !== 0) return;
    if ((e.target as HTMLElement).closest('button')) return;

    this.machine.setDragStartTime(Date.now());
    this.machine.transitionTo('DRAGGING');
  }
}

class DraggingState extends BaseState {
  readonly name = 'DRAGGING';

  enter() {
    terminalLog(">> Action: mousedown -> DRAGGING");
    
    invoke('start_drag').catch((err) => {
      terminalLog(`!! start_drag ERROR: ${err}`);
      this.machine.transitionTo('IDLE');
    });

    window.addEventListener('mouseup', this.handleGlobalMouseUp);
    window.addEventListener('mousemove', this.handleGlobalMouseMove);
    window.addEventListener('blur', this.handleGlobalBlur);
  }

  exit() {
    window.removeEventListener('mouseup', this.handleGlobalMouseUp);
    window.removeEventListener('mousemove', this.handleGlobalMouseMove);
    window.removeEventListener('blur', this.handleGlobalBlur);
  }

  private handleGlobalMouseUp = (e: MouseEvent) => {
    terminalLog(`>> Detect: mouseup (btn ${e.button})`);
    this.requestExit();
  };

  private handleGlobalMouseMove = () => {
    if (Date.now() - this.machine.getDragStartTime() > 200) {
      this.requestExit();
    }
  };

  private handleGlobalBlur = () => {
    const duration = Date.now() - this.machine.getDragStartTime();
    if (duration > 500) {
      terminalLog(`>> Detect: real blur (${duration}ms) -> Exit`);
      this.requestExit();
    }
  };

  private requestExit() {
    this.machine.transitionTo(this.machine.getIsMouseInside() ? 'HOVER' : 'IDLE');
  }
}

// --- 状态机管理器 ---

class StateMachine {
  private states: Record<HeaderOverlayState, BaseState>;
  private currentState: BaseState;

  constructor(
    private setOverlayState: (s: HeaderOverlayState) => void,
    private isMouseInsideRef: React.MutableRefObject<boolean>,
    private dragStartTimeRef: React.MutableRefObject<number>,
    private onAction: () => void
  ) {
    this.states = {
      IDLE: new IdleState(this),
      HOVER: new HoverState(this),
      DRAGGING: new DraggingState(this)
    };
    this.currentState = this.states.IDLE;
  }

  transitionTo(name: HeaderOverlayState) {
    if (this.currentState.name === name) return;
    
    this.currentState.exit();
    this.currentState = this.states[name];
    this.setOverlayState(name);
    this.currentState.enter();
  }

  // 事件分发
  onMouseEnter() { this.currentState.onMouseEnter(); }
  onMouseLeave() { this.currentState.onMouseLeave(); }
  onMouseDown(e: React.MouseEvent) { this.currentState.onMouseDown(e); }
  
  onClick(e: React.MouseEvent) {
    // Click 逻辑在状态机中作为统一行为处理，也可放在特定状态
    const duration = Date.now() - this.dragStartTimeRef.current;
    if (duration < 300 && !(e.target as HTMLElement).closest('button')) {
      terminalLog(`>> Click -> Action triggered`);
      this.onAction();
    }
    this.currentState.onClick(e);
  }

  // 上下文存取
  setIsMouseInside(val: boolean) { this.isMouseInsideRef.current = val; }
  getIsMouseInside() { return this.isMouseInsideRef.current; }
  setDragStartTime(val: number) { this.dragStartTimeRef.current = val; }
  getDragStartTime() { return this.dragStartTimeRef.current; }

  destroy() {
    this.currentState.exit();
  }
}

// --- React Hook ---

export const useHeaderStateMachine = (onAction: () => void) => {
  const isDev = import.meta.env.DEV;
  const [overlayState, setOverlayState] = useState<HeaderOverlayState>('IDLE');
  const isMouseActuallyInside = useRef(false);
  const dragStartTime = useRef(0);
  
  // 使用 Ref 保证 onAction 在状态机闭包中始终最新
  const onActionRef = useRef(onAction);
  onActionRef.current = onAction;

  const machine = useMemo(() => {
    return new StateMachine(
      setOverlayState,
      isMouseActuallyInside,
      dragStartTime,
      () => onActionRef.current()
    );
  }, []);

  // 确保卸载时清理监听
  useEffect(() => {
    return () => machine.destroy();
  }, [machine]);

  // Debug 心跳日志 (保持原有功能)
  useEffect(() => {
    if (!isDev) return;
    const timer = setInterval(() => {
      terminalLog(`[STATE-MACHINE] Overlay: ${overlayState}`);
    }, 1000);
    return () => clearInterval(timer);
  }, [overlayState, isDev]);

  return {
    overlayState,
    handlers: {
      onMouseEnter: () => machine.onMouseEnter(),
      onMouseLeave: () => machine.onMouseLeave(),
      onMouseDown: (e: React.MouseEvent) => machine.onMouseDown(e),
      onClick: (e: React.MouseEvent) => machine.onClick(e),
    }
  };
};
