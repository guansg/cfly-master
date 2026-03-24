<div align="center">

# CflyPrism Client

**Open-source workflow desktop app — for learning & education**

[English](#english) · [中文](#中文)

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)
[![Electron](https://img.shields.io/badge/Electron-28-47848F?logo=electron&logoColor=white)](https://www.electronjs.org/)

</div>

> **Educational purpose · 学习用途**  
> **EN:** Open-source **for learning and reference** (Electron, workflow engine, React Flow, local DB, etc.). **Not** a commercial offering or guaranteed production-ready; use at your own risk.  
> **中文：** 本仓库以**开源学习、技术参考**为主，**不**作为商业产品或生产环境承诺；请自行评估使用。

---

## English

### Overview

**CflyPrism Client** is an **open-source** desktop app focused on **workflows**: you can visually build graphs, save them locally, and execute them in-process. The renderer is React; the workflow engine and **SQLite** (via `better-sqlite3`, a native Node addon) run on the Electron **main** side. Licensed under **MIT** — see the `LICENSE` file in the repository root (and `package.json` → `license`).

### Features

- Visual workflow editor ([React Flow](https://reactflow.dev/))
- Workflow engine with pluggable nodes (logic, data, triggers)
- Local persistence via **SQLite** (`better-sqlite3`)
- **UI language**: Simplified Chinese
- System tray, window controls, and basic settings

### Tech Stack

| Area | Technologies |
|------|----------------|
| Shell | Electron 28, Vite 5, TypeScript |
| UI | React 18, Tailwind CSS, Radix UI, Lucide icons |
| State | Zustand |
| Data | better-sqlite3 |

### Prerequisites

- **Node.js** — Active LTS (e.g. **18.x or 20.x**) recommended  
- **npm** (bundled with Node)

#### C++ build tools (required for `npm install` & packaging)

This project uses **native modules** (`better-sqlite3`). `npm install` runs `electron-rebuild`, and **`npm run build`** compiles TypeScript and bundles the app — both need a working **C++ toolchain** on your machine:

| OS | What to install |
|----|-----------------|
| **Windows** | [Visual Studio Build Tools](https://visualstudio.microsoft.com/visual-cpp-build-tools/) with workload **“Desktop development with C++”** (MSVC, Windows SDK). This repo’s `.npmrc` sets `msvs_version=2022`; change it if you use another VS version. |
| **macOS** | Xcode **Command Line Tools**: `xcode-select --install` |
| **Linux** | `build-essential` (gcc/g++), `python3`, and libsqlite dev packages as required by your distro for `node-gyp` |

Without these, dependency install or production **packaging** may fail when compiling native code.

### Getting Started

```bash
# Install dependencies (runs postinstall: electron-rebuild for better-sqlite3)
npm install

# Development — Vite dev server + Electron
npm run dev

# Type-check only
npm run type-check
```

`npm run dev` starts Vite on the default port; ensure it matches `vite.config.ts` / Electron preload if you change ports.

### Packaging

> **Before packaging:** ensure **C++ build tools** are installed (see [Prerequisites](#prerequisites)) so native modules build cleanly for your target.

Artifacts are emitted to **`release/`** (see `package.json` → `build.directories.output`).

```bash
# Default platform (current OS)
npm run build

# Explicit targets
npm run build:win
npm run build:mac
npm run build:linux
```

**Packaging status:** In this repository, **Windows** packaging has been verified successfully. **macOS** and **Linux** targets (`build:mac` / `build:linux`) have **not** been tried here—your mileage may vary; please open an issue if you hit platform-specific problems.

### Repository Layout

```
src/
├── main/           # Electron main process, workflow engine, IPC, SQLite
├── renderer/       # React UI (workflows, settings, …)
└── preload/        # contextBridge & allowed IPC surface
resources/          # Icons and static assets for the packaged app
```

### License

This project is licensed under the **MIT License** (see `LICENSE` in the repository root, or `package.json` → `license`).

---

## 中文

### 简介

**CflyPrism 客户端** 是一款**开源**的**工作流**桌面应用：用可视化方式编排自动化流程，本地保存并在本机执行。界面为 React；工作流引擎与 **SQLite**（通过原生模块 `better-sqlite3`）运行在 Electron **主进程**。**MIT** 许可证 — 详见仓库根目录的 `LICENSE` 文件与 `package.json` 中的 `license` 字段。

### 功能概览

- 可视化工作流编辑（基于 [React Flow](https://reactflow.dev/)）
- 可扩展的节点与工作流引擎（逻辑 / 数据 / 触发器等）
- 本地 **SQLite**（`better-sqlite3`）存储
- **界面语言**：简体中文
- 系统托盘、窗口控制与基础设置

### 技术栈

| 层面 | 技术 |
|------|------|
| 壳与构建 | Electron 28、Vite 5、TypeScript |
| 界面 | React 18、Tailwind CSS、Radix UI、Lucide |
| 状态 | Zustand |
| 数据 | better-sqlite3 |

### 环境要求

- **Node.js**：建议使用当前 **Active LTS**（如 **18.x 或 20.x**）
- **npm**（随 Node 安装）

#### C++ 构建环境（安装依赖与打包必需）

项目依赖 **原生模块**（`better-sqlite3`）。执行 **`npm install`** 时会运行 `electron-rebuild`，执行 **`npm run build`** 进行生产构建与打包时同样需要本机具备 **C++ 编译工具链**：

| 系统 | 建议安装 |
|------|----------|
| **Windows** | [Visual Studio Build Tools](https://visualstudio.microsoft.com/visual-cpp-build-tools/)，勾选工作负载 **「使用 C++ 的桌面开发」**（含 MSVC、Windows SDK）。本仓库 **`.npmrc`** 中 `msvs_version=2022` 需与已安装的 Visual Studio 版本一致，不一致时请自行修改。 |
| **macOS** | Xcode **命令行工具**：终端执行 `xcode-select --install` |
| **Linux** | `build-essential`（gcc/g++）、`python3`，以及发行版要求的 `node-gyp` / SQLite 相关开发包 |

未安装上述环境时，依赖安装或**正式打包**可能在编译原生代码阶段失败。

### 安装与开发

```bash
# 安装依赖（会执行 postinstall：对 better-sqlite3 做 electron-rebuild）
npm install

# 开发：Vite + Electron
npm run dev

# 仅类型检查
npm run type-check
```

`npm run dev` 会启动 Vite 开发服务；若修改端口，请同步检查 `vite.config.ts` 与 Electron 的加载地址。

### 打包发布

> **打包前请确认：** 已安装上文 [环境要求](#环境要求) 中的 **C++ 构建环境**，否则原生模块可能无法正确编译。

安装包输出目录为 **`release/`**（见 `package.json` 中 `build.directories.output`）。

```bash
# 当前操作系统默认目标
npm run build

# 指定平台
npm run build:win
npm run build:mac
npm run build:linux
```

**打包说明：** 本仓库目前仅在 **Windows** 上实际验证过打包成功；**macOS**、**Linux**（`build:mac` / `build:linux`）**尚未在本项目中试过**，不保证开箱即用；若你在这些平台遇到问题，欢迎提 Issue。

### 目录结构

```
src/
├── main/           # Electron 主进程、工作流引擎、IPC、SQLite
├── renderer/       # React 界面（工作流、设置等）
└── preload/        # contextBridge 与允许的 IPC 通道
resources/          # 安装包图标等静态资源
```

### 许可证

本项目以 **MIT License** 发布（见仓库根目录 `LICENSE` 与 `package.json` 中的 `license` 字段）。
