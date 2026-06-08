# Reagent Hub — 生化试剂管理桌面应用

基于 Electron 30 + Preact + HTM + Tailwind CSS 的跨平台桌面应用（macOS / Windows），用于管理生化试剂出入库、库存追踪、货架布局和采购预警。

---

## 项目结构

```
reagent-inventory-app-build/
├── electron/
│   ├── main.js          # Electron 主进程
│   └── preload.js       # 预加载脚本
├── src/
│   ├── index.html       # 主应用入口（Preact + HTM）
│   ├── components/
│   │   ├── AggregateView.js    # 试剂总览（卡片视图 + 低库存预警）
│   │   ├── SegmentedView.js    # 903/908 分库管理（数量调整 + 移库 + 快捷模式）
│   │   ├── LayoutView.js       # 货架布局编辑器
│   │   ├── LogView.js          # 出入库日志
│   │   ├── ReagentManager.js   # 试剂管理（CRUD + CSV 导入导出 + 安全库存）
│   │   ├── QuantityStepper.js  # 数量步进器组件
│   │   └── utils.js            # 工具函数
│   └── preview-*.html   # 布局预览调试页面
├── build/
│   ├── icon.icns        # macOS 图标
│   ├── icon.ico         # Windows 图标
│   └── icon.png
├── icons/               # 应用图标源文件
├── dist/                # 构建输出（dmg / exe）
├── package.json
└── .gitignore
```

---

## 环境要求

### macOS

- macOS 10.15+
- Node.js v20+（项目使用 v20.13.1）
- npm

### Windows

- Windows 10+
- Node.js v20+（[下载](https://nodejs.org/)）
- npm

---

## 开发

```bash
npm install
npm run dev
```

开发模式会启动 Electron 窗口并加载 `src/index.html`。

---

## 构建

```bash
export PATH="/Users/yy/Desktop/kimi/nodejs/bin:$PATH"
npm run build
```

输出位置：

```
dist/
├── mac/Reagent Hub-1.x.x.dmg        # macOS (x64)
├── mac-arm64/Reagent Hub-1.x.x.dmg  # macOS (ARM64)
└── win-unpacked/                    # Windows (exe)
```

> ⚠️ 构建 macOS 安装包时，`hdiutil` 可能会挂起。若卡住，请杀掉相关进程后重试。

---

## 数据存储

应用数据保存在本地浏览器的 localStorage 中，同时可选同步到坚果云文件夹：

```
~/Nutstore Files/2025-Synlab/D.实验Toolbox/出入库date/reagent-inventory/
├── snapshot_*.json     # 数据快照
└── ops_*.json          # 增量操作记录
```

首次使用建议通过「同步」按钮配置坚果云路径，实现多台设备数据同步。

### 数据结构

| localStorage 键 | 说明 |
|----------------|------|
| `ri_reagents` | 试剂基础信息（名称、品牌、储存条件、安全库存等） |
| `ri_inventory` | 库存记录（按 903/908 分库，含货架位置与数量） |
| `ri_logs` | 出入库日志（操作人、时间、变动量、备注） |
| `ri_layouts` | 货架布局配置 |
| `ri_fields` | 试剂自定义字段配置 |

---

## 故障排除

**`hdiutil: create failed - 资源忙`**

```bash
# 杀掉挂起的 hdiutil / electron 进程后重试
killall hdiutil Electron
```

**构建时找不到 npm**

```bash
export PATH="/Users/yy/Desktop/kimi/nodejs/bin:$PATH"
```

**Windows 构建失败**

确保已安装 [WiX Toolset v3](https://wixtoolset.org/docs/wix3/)，或修改 `package.json` 中的 `build.win.target` 为 `portable`。

**应用打开空白**

检查 `electron/main.js` 中的 `loadURL`/`loadFile` 路径是否正确指向打包后的入口文件。
