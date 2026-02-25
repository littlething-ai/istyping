import { useState, useEffect, useRef, useMemo } from "react";
import { invoke } from "@tauri-apps/api/core";

export type HeaderOverlayState = 'IDLE' | 'HOVER' | 'CLICK' | 'DRAGGING';

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
  onMouseUp(_e: MouseEvent) {} // 全局 MouseUp
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

    this.machine.transitionTo('CLICK');
  }
}

/**
 * CLICK 状态：用户按下鼠标，等待判断是点击还是长按拖拽
 */
class ClickState extends BaseState {
  readonly name = 'CLICK';
  private timer: number | null = null;

  enter() {
    // 300ms 后自动转入拖拽状态
    this.timer = window.setTimeout(() => {
      this.machine.transitionTo('DRAGGING');
    }, 300);

    window.addEventListener('mouseup', this.handleGlobalMouseUp);
  }

  exit() {
    if (this.timer) {
      clearTimeout(this.timer);
      this.timer = null;
    }
    window.removeEventListener('mouseup', this.handleGlobalMouseUp);
  }

  onMouseLeave() {
    this.machine.setIsMouseInside(false);
  }

  onMouseEnter() {
    this.machine.setIsMouseInside(true);
  }

  private handleGlobalMouseUp = (_e: MouseEvent) => {
    // 1秒内松手，视为点击
    terminalLog(">> Click Detected");
    this.machine.triggerAction();
    this.machine.transitionTo(this.machine.getIsMouseInside() ? 'HOVER' : 'IDLE');
  };
}

class DraggingState extends BaseState {
  readonly name = 'DRAGGING';

  enter() {
    terminalLog(">> Long Press -> Start Native Dragging");
    this.machine.setDragStartTime(Date.now());
    
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
    terminalLog(`>> Drag End: mouseup (btn ${e.button})`);
    this.requestExit();
  };

  private handleGlobalMouseMove = () => {
    // 即使在原生拖拽中，我们也通过位移尝试判断退出（部分OS特性支持）
    if (Date.now() - this.machine.getDragStartTime() > 200) {
      this.requestExit();
    }
  };

  private handleGlobalBlur = () => {
    const duration = Date.now() - this.machine.getDragStartTime();
    if (duration > 500) {
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
      CLICK: new ClickState(this),
      DRAGGING: new DraggingState(this)
    };
    this.currentState = this.states.IDLE;
  }

  transitionTo(name: HeaderOverlayState) {
    if (this.currentState.name === name) return;
    
    terminalLog(`[FSM] Transition: ${this.currentState.name} -> ${name}`);
    this.currentState.exit();
    this.currentState = this.states[name];
    this.setOverlayState(name);
    this.currentState.enter();
  }

  // 事件分发
  onMouseEnter() { this.currentState.onMouseEnter(); }
  onMouseLeave() { this.currentState.onMouseLeave(); }
  onMouseDown(e: React.MouseEvent) { this.currentState.onMouseDown(e); }
  
  // 外部不再直接处理 onClick，统一通过 mousedown/mouseup 状态转换处理
  triggerAction() {
    this.onAction();
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

  useEffect(() => {
    return () => machine.destroy();
  }, [machine]);

  // Debug 心跳日志
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
      // 注意：onClick 已经在状态机内部通过 MouseUp 处理，这里传空或不传
      onClick: (e: React.MouseEvent) => e.stopPropagation(), 
    }
  };
};
