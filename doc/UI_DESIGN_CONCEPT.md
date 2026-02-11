# Is Typing... Desktop UI Design Concept (v2.1)

## 1. 核心理念 (Core Philosophy)
**"Invisible Assistant, Visible When Needed."**
（平时隐形助手，用时即刻显现。）

*   **无缝感**：不打扰用户的主屏幕工作流。
*   **灵动性**：根据连接状态自动切换形态。
*   **现代感**：采用玻璃拟态 (Glassmorphism) 和 iOS 灵动岛 (Dynamic Island) 的交互隐喻。

## 2. 视觉风格 (Visual Style)

### 2.1 材质与特效
*   **背景**：深色半透明磨砂玻璃 (Acrylic / Blur)，透出底层壁纸的色彩，融入环境。
*   **边框**：极细的 1px 亮色描边 (RGBA 255,255,255,0.15)，增加精致感。
*   **光效**：顶部边缘高光 (Inset Highlight)，营造类似于 Looking Glass 的立体通透感。
*   **圆角**：大圆角 (Capsule Shape)，亲和力强，像一个精致的物理挂件。
*   **阴影**：移除厚重的外部投影，仅保留极其微弱的环境光感，强调轻盈感。

### 2.2 三态配色方案 (Three-State System)
系统核心逻辑基于三种状态流转：

1.  🔴 **Standby (待机/断开)**
    *   **颜色**：柔和红 (Red-500)。
    *   **行为**：呼吸灯效。表示服务未连接或 Socket 断开。
2.  🟢 **Ready (就绪)**
    *   **颜色**：极客绿 (Green-500)。
    *   **行为**：常亮或微弱呼吸。表示手机已连接，随时等待输入。
3.  🔵 **Typing (输入中)**
    *   **颜色**：活跃蓝 (Blue-500)。
    *   **行为**：高频脉冲 / 波纹扩散。
    *   **动效**：灵动岛宽度略微变宽，模拟数据吞吐的物理体积感。

---

## 3. 交互逻辑与形态 (Interaction & Views)

我们采用 **"单窗口，三视图"** 的动态切换策略。

### 3.1 视图一：配对态 (Pairing Mode)
**场景**：应用启动初始化，或连接断开时 (`Standby` 状态)。
**目标**：引导连接，清晰展示配对信息。

*   **尺寸**：大面板 (300px * 480px)。
*   **内容**：
    *   巨大的二维码 (QR Code)。
    *   醒目的 Room Number (6位数字)。
    *   底部提示 "Scan with phone to connect"。

### 3.2 视图二：灵动岛态 (Compact Mode)
**场景**：连接成功 (`Ready` 状态)，且用户不需要查看历史记录时。
**目标**：极致极简，不遮挡屏幕，作为桌面的一个“状态挂件”。

*   **尺寸**：极小胶囊 (约 200px * 60px)，随 Typing 状态会有微小的弹性伸缩。
*   **交互**：
    *   **全局拖拽**：按住岛屿任何空白处（非按钮区域）即可在桌面上拖动窗口。
    *   **内容**：默认显示键盘图标或 Logo；输入时显示呼吸灯。

### 3.3 视图三：历史态 (History Mode)
**场景**：用户主动点击“展开”按钮时。
**目标**：回顾最近接收到的文本内容。

*   **尺寸**：中型面板 (320px * 500px)。
*   **内容**：
    *   滚动列表显示最近接收的 10 条文本。
    *   每条记录支持点击复制。
    *   空状态下的占位提示。

---

## 4. 关键交互细节 (Key Interactions)

*   **点击展开 (Click to Expand)**：
    *   为了防止误触，放弃 Hover 展开。
    *   在灵动岛右侧提供明确的 Chevron (箭头) 按钮，点击在 `Compact` 和 `History` 模式间切换。
*   **原生拖拽 (Native Drag)**：
    *   利用底层系统 API (`SC_MOVE`) 实现。
    *   **体验**：无延迟、跟手度高、支持 Windows 贴边吸附。
    *   **触发**：点击 Header 空白区域即刻触发。
*   **自动收起**：
    *   当连接中断时，自动切回 `Pairing Mode`。
    *   当连接建立时，自动切入 `Compact Mode`。

## 5. UI 架构 (Component Structure)

1.  **`AppContainer`**：
    *   处理玻璃背景 (`.glass`)。
    *   根据 ViewMode 动态调整物理窗口大小 (Tauri Window Resize)。
2.  **`DynamicHeader`**：
    *   常驻组件。包含状态灯、拖拽触发区、模式切换按钮。
3.  **`PairingView` / `HistoryList`**：
    *   根据状态互斥渲染的内容区域，配合 `AnimatePresence` 实现平滑过渡。
