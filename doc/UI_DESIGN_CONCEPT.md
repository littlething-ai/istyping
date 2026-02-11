# Is Typing... Desktop UI Design Concept (v2.0)

## 1. 核心理念 (Core Philosophy)
**"Invisible Assistant, Visible When Needed."**
（平时隐形助手，用时即刻显现。）

*   **无缝感**：不打扰用户的主屏幕工作流。
*   **灵动性**：根据连接状态自动切换形态。
*   **现代感**：采用玻璃拟态 (Glassmorphism) 和 iOS 灵动岛 (Dynamic Island) 的交互隐喻。

## 2. 视觉风格 (Visual Style)

### 2.1 材质与特效
*   **背景**：深色半透明磨砂玻璃 (Acrylic / Blur)，透出底层壁纸的色彩，融入环境。
*   **边框**：极细的 1px 亮色描边 (RGBA 255,255,255,0.1)，增加精致感。
*   **阴影**：柔和的弥散阴影，营造悬浮感。
*   **圆角**：大圆角 (20px+)，亲和力强，像一个精致的物理挂件。

### 2.2 配色方案
*   **基调**：深空灰 (Dark Grey) / 石墨黑 (Graphite)。
*   **状态色**：
    *   🔴 **Disconnected**: 柔和红 / 橙色呼吸灯 (警示)。
    *   🟢 **Connected**: 荧光绿 / 极客绿 (安全、就绪)。
    *   🔵 **Typing**: 活跃蓝 / 紫色波纹 (数据传输中)。

---

## 3. 交互逻辑与形态 (Interaction & States)

我们采用 **"单窗口，双形态"** 的设计策略。

### 3.1 形态一：待机连接态 (Expanded Mode)
**场景**：应用启动、手机断开连接、或用户主动展开时。
**目标**：引导连接，清晰展示配对信息。

*   **尺寸**：较大面板 (e.g., 300px * 400px)。
*   **内容布局**：
    *   **Top**: App Logo + "Is Typing..." 标题。
    *   **Center**: 
        *   巨大的二维码 (QR Code) —— *视觉重心*。
        *   醒目的 Room Number (6位数字) —— *便于远距离查看*。
    *   **Bottom**: "Waiting for connection..." 提示语。

### 3.2 形态二：工作胶囊态 (Compact Mode) —— *灵动岛隐喻*
**场景**：手机连接成功后，或用户鼠标离开窗口一段时间后。
**目标**：极简显示，不遮挡屏幕，只提供核心状态反馈。

*   **尺寸**：极小胶囊 (e.g., 200px * 60px)。
*   **内容布局**：
    *   **Left**: 状态指示灯 (呼吸效果)。
    *   **Center**: 
        *   当前 Room ID (缩略显示)。
        *   *或者* 最近一条消息的滚动摘要 (Ticker)。
*   **动效**：
    *   当手机发送消息时，胶囊边缘泛起蓝色光晕 (Glow Effect)。
    *   收到消息瞬间，胶囊可能轻微弹跳或放大。

### 3.3 交互细节 (Micro-interactions)
*   **Hover 展开 (Hover to Expand)**：
    *   在 **工作态** 下，鼠标悬停在胶囊上，面板自动**向下展开** (类似通知中心下拉)。
    *   展开后显示：**历史记录列表** (History List) 和 **复制按钮**。
    *   鼠标移出后，自动收回胶囊态。
*   **拖拽 (Drag)**：全窗体可拖拽，建议增加屏幕边缘吸附功能。
*   **点击复制**：历史记录每条消息右侧提供显眼的 "Copy" 图标，点击后给予 "Copied!" 的微提示。

---

## 4. UI 架构拆解 (Component Structure)

为了实现上述效果，前端组件结构建议如下：

1.  **`AppContainer` (主容器)**
    *   负责处理窗口大小变化 (Tauri Window Resize API)。
    *   负责背景模糊和圆角裁剪。

2.  **`DynamicHeader` (灵动常驻栏)**
    *   *永远显示*。
    *   包含：状态灯、拖拽手柄、简要信息。
    *   承担 "胶囊态" 的主要视觉任务。

3.  **`ExpandableDrawer` (折叠扩展区)**
    *   *根据状态显示/隐藏*。
    *   **未连接时**：强制显示 `PairingView` (二维码 + 数字)。
    *   **已连接时**：默认隐藏，Hover 时显示 `HistoryView` (消息列表)。

4.  **`HistoryList` (历史记录)**
    *   滚动容器。
    *   每条消息项 (`HistoryItem`) 包含文本摘要和复制按钮。

---

## 5. 实施路线图 (Implementation Plan)

1.  **基础框架搭建**：引入 `framer-motion` 或纯 CSS Transition 实现平滑的高度变化动画。
2.  **样式重构**：移除现有 Tailwind 默认样式，重写为 Glassmorphism 风格。
3.  **状态逻辑完善**：在 `App.tsx` 中增加 `isCompact` 和 `isHovered` 状态控制。
4.  **Tauri 窗口控制**：调用 Tauri API 实现窗口尺寸的动态调整 (从大面板变小胶囊)。
