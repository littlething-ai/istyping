# 桌面端网络连接状态与架构管理说明

本文档旨在为新加入项目或未参与早期调试的开发者，梳理 istyping 桌面端（Tauri 架构）复杂的网络连接机制、状态流转以及一些关键的防坑细节。它将帮助你理解从应用启动到后台挂机，整个网络链路是如何运作的。

## 1. 核心架构与通讯链路

桌面端采用了 **Tauri (Rust + React)** 的混合架构。为了保证性能和稳定性，网络连接的核心逻辑**全部收敛在 Rust 后端**，前端（React）仅负责状态展示与用户指令触发。

- **底层网络库：** 使用了 `rust_socketio` 库，通过 WebSocket 协议与远端（如 Cloudflare 部署的服务器）建立持久化长连接。
- **前后端通讯：** 
  - **Rust 到 React：** Rust 后端通过 Tauri 的 `app_handle.emit` 向前端广播实时事件（例如 `session-info` 状态同步、`debug-log` 键盘输入日志）。前端通过 Tauri API 的 `listen` 进行监听。
  - **React 到 Rust：** 前端通过 `invoke` 调用 Rust 的 Command 函数（如保存配置、主动断开连接等）。

## 2. 完整业务流程与生命周期

### 2.1 启动与初始化 (Boot & Auto-Connect)
当用户双击打开桌面端应用时，网络连接是**全自动建立**的，无需用户手动点击连接。

1. **读取配置：** Rust 主进程启动，首先调用 `desktop/src-tauri/src/config.rs` 读取本地持久化的配置文件（`config.json`）。这里决定了我们要连接哪个服务器：
   - `Auto` (默认): 开发环境下连 `localhost:2020`，生产环境下连 `https://backend.istyping.app`。
   - `Custom`: 用户在 Settings 里自定义的服务器地址。
2. **应用代理：** 如果用户在设置中开启了 HTTP/HTTPS Proxy，Rust 会立刻将代理 URL 注入到系统的环境变量中（`HTTP_PROXY` 等）。
3. **建立连接：** Tauri 初始化完成后，Rust 会自动启动一个**独立的后台线程** (`setup_socket`)，开始向目标服务器发起 WebSocket 连接。
4. **生成 Room ID：** 每次建立新的连接线程时，客户端会随机生成一个 16 位的 `roomId`（开发环境下固定为 `DEBUG_SESSION_ID`），用于后续的配对。
5. **UI 初始状态：** 此时前端的 Store 状态会被设置为 `connecting`，灵动岛左侧指示灯显示为红灯，Settings 界面的状态显示“Connecting”。

### 2.2 注册房间与连接成功 (Room Registration)
1. **底层触发：** 当 `rust_socketio` 成功与服务器握手后，会触发内部的 `open` 事件。
2. **发送注册指令：** Rust 后端的 `on_connect` 回调被触发。此时，客户端会将刚才生成的 `roomId` 以及当前的计算机名称 (`deviceName`) 封装成 `register_room` 事件发送给服务器。
3. **服务器回执：** 服务器收到注册请求后，会将当前客户端加入对应的房间，并生成一个简短的数字提取码（`roomNumber`），然后通过 `room_registered` 事件下发给客户端。
4. **状态同步 UI：** Rust 监听到 `room_registered` 后，将内部状态修改为 `Connected`，并通过 `session-info` 事件通知前端。
5. **UI 变绿：** 前端收到状态更新，灵动岛左侧指示灯瞬间变绿 (`ready`)，配对界面显示绿色的勾，并展示出二维码和 6 位数字提取码，等待手机端扫码。

## 3. 核心状态与 UI 派生模型

系统的核心网络状态由后端的 `ConnectionStatus` 定义，分为四种：
`disconnected` | `connecting` | `connected` | `error`

### 3.1 状态在前后端的分布位置
- **后端 (Rust)：** 
  - `SessionInfo` 结构体中维护了基础的网络状态、当前房间号、提取码以及参与者列表。
  - **代码位置：** `desktop/src-tauri/src/session.rs` (定义) 和 `desktop/src-tauri/src/socket.rs` (状态修改与派发)。
- **前端 (React/Zustand)：** 
  - 维护在全局的 Zustand Store 中，监听后端的 `session-info` 事件并实时更新。
  - **代码位置：** `desktop/src/store.ts`

### 3.2 灵动岛“红绿蓝”指示灯机制 (Derived State)
前端灵动岛（Island）最左侧的指示灯，并不直接绑定用户的“打字活动状态”，而是结合了**网络状态**的**状态派生 (Derived State)** 逻辑：
- **高优先级（红灯）：** 只要底层网络状态 (`session.status`) 不是 `connected`，指示灯**强制显示**为 `standby`（红灯）。这意味着只要断网，UI 一定是红色的。
- **低优先级（绿灯/蓝灯）：** 只有在 `connected` 状态下，灯光才受“打字状态”控制：
  - 平时空闲时显示为 `ready` (绿灯)。
  - 当从 WebSocket 接收到手机端发来的打字事件时，短暂切换为 `typing` (蓝灯) 800ms，然后恢复绿灯。
- **代码位置：** `desktop/src/IslandApp.tsx` 中的 `<DynamicHeader status={session.status === 'connected' ? status : 'standby'} />`

## 4. 断线重连机制（核心难点）

考虑到桌面端软件经常会在后台挂机、休眠或者经历 Wi-Fi 切换，我们对断线机制做了精细的拆分，分为**“被动断开（无感重连）”**和**“主动断开（彻底销毁）”**。

### 4.1 被动断开与全自动无感重连
当用户的设备休眠、Wi-Fi 闪断或 Cloudflare 边缘节点重置时触发。整个过程对用户是透明的（UI 会短暂变红后自动恢复）。

1. **底层断开与重试：** `rust_socketio` 感知到 TCP 连接断开，触发 `close` 事件。**注意：此时底层的重连线程并未死亡**，它会在后台默默进行指数退避式（Exponential Backoff）的不断重连尝试。
2. **UI 响应：** Rust 监听到 `close` 事件，立刻向前端发送 `connecting` 状态。此时前端的所有“绿灯”瞬间变红/转圈。
3. **自动重新注册（防“幽灵”假死）：** 当底层网络恢复并自动重连成功时，会再次触发 `open` 事件。此时 Rust 的 `on_connect` 闭包会被唤醒，并**自动重新发送 `register_room` 事件**给服务器。
   - *为什么要这么做？* 因为每次重连后，服务器会分配一个新的 Socket ID。如果不重新注册，虽然底层连上了，但服务器不知道你是谁，无法将你放回原有的房间，导致客户端“假死”。
4. **代码位置：** `desktop/src-tauri/src/socket.rs` 中的 `on_connect` (处理 open) 和 `on_disconnect` (处理 close) 闭包。

### 4.2 主动断开
当用户在多设备场景下，需要主动释放当前连接，或者在 Settings 中修改了服务器/代理配置时触发。

1. **用户触发：** 用户在 Pairing 界面点击红色的 “Disconnect Cluster” 按钮，或者在 Settings 界面点击 “Apply & Reconnect”。
2. **销毁线程：** 前端调用后端的 `disconnect_server` command。Rust 端通过将一个跨线程共享的 `AtomicBool` 变量 (`stop_signal`) 设置为 `false`。
3. **安全退出：** 运行在后台的 WebSocket 监听循环 (`while stop_signal.load(...)`) 收到信号后，会**主动跳出循环并彻底销毁底层的 Socket 线程**，同时调用 `client.disconnect()`。
4. **数据清理：** Rust 会主动将状态置为 `disconnected`，并**清空当前房间的参与者列表**（手机端在界面上也会看到 PC 掉线）。此时系统**绝对不会**再进行任何自动重连，彻底变回干净的待机状态，直到用户再次点击“Connect Cluster”。
5. **代码位置：** 
  - 前端触发：`desktop/src/PairingApp.tsx` (`handleDisconnect`)
  - 后端执行：`desktop/src-tauri/src/lib.rs` (`disconnect_server` command)
  - 线程清理：`desktop/src-tauri/src/socket.rs` (检查 `stop_signal` 并退出)

## 5. 代理 (Proxy) 功能防坑

由于部分用户的网络环境（如连接 Cloudflare）不稳定，桌面端内置了全局应用级代理。
- **配置与生效：** 用户在 Settings 界面配置代理 URL 并启用后，保存配置时会调用 `update_server_config` Command。
- **底层注入原理：** Rust 后端在发起任何新连接之前，会读取配置文件，并通过 `std::env::set_var` 动态注入 `HTTP_PROXY`, `HTTPS_PROXY`, `ALL_PROXY` 等系统级环境变量。底层的 `rust_socketio` / `reqwest` 库在建立 TCP 连接前会自动读取这些变量，从而实现全自动的流量代理转发。
- **代码位置：** `desktop/src-tauri/src/config.rs` (`apply_proxy_config` 方法)

## 6. Tauri 生命周期与防“僵尸进程”

**问题背景：** Tauri 默认只有在**所有窗口**关闭后才会退出整个应用进程。由于为了加速启动，我们把 `Settings` 和 `Pairing` 窗口的关闭事件拦截为了“隐藏（Hide）”。这导致如果用户在任务栏直接关掉了“灵动岛”主窗口，后台进程实际上并没有退出，网络连接依然存在，手机端发消息依然会让电脑“闹鬼”般自动打字。

**解决方案：**
我们拦截了主窗口（`main` 灵动岛）的 `CloseRequested` 事件。只要该窗口被用户关闭（无论是点击关闭按钮还是通过任务栏强制关闭），立刻直接调用 Tauri 的 `app.handle().exit(0)`，强制无条件杀死整个 Rust 进程。这确保了网络线程、内存资源和键盘模拟器被彻底回收。

- **代码位置：** `desktop/src-tauri/src/lib.rs` (`island_window.on_window_event` 闭包)

---
*本文档为持续更新文档。如果在后续开发中引入了新的网络库或重连机制，请同步更新此说明。*