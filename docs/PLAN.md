# CSS Snap 项目规划

浏览器扩展：鼠标点选网页元素 → 悬浮面板展示九组样式 → 一键复制 CSS，并支持多选与本地快照工作台。

## 一、已确认的产品决策

| 决策项 | 结论 |
| --- | --- |
| 目标浏览器 | Chrome / Edge / Firefox（不涉及 Safari） |
| 目标用户 | 设计师、运营等非开发为主，兼顾开发 |
| 面板信息量 | 完整九组样式（不做"精简三项"） |
| 复制产物 | 「全部样式」与「精简片段」双 Tab，各自独立复制 |
| 多选与持久化 | 支持 Shift 多选；快照保存到本地工作台 |
| 交互基线 | 沿用 DevTools 手感（Esc 退出、Alt+滚轮切父子层） |

## 二、九组样式（面板骨架）

| # | 分组 | 主要内容 |
| --- | --- | --- |
| 1 | 盒模型 | width / height / padding / margin / box-sizing |
| 2 | 布局 | display / flex-* / grid-* / gap / align-* / justify-* |
| 3 | 定位层级 | position / inset / z-index / float / clear |
| 4 | 排版 | font-* / line-height / letter-spacing / text-align / text-decoration |
| 5 | 颜色背景 | color / background-color / background-image / background-size / blend |
| 6 | 边框圆角 | border-* / border-radius / outline |
| 7 | 阴影滤镜 | box-shadow / text-shadow / filter / backdrop-filter / opacity |
| 8 | 变换动画 | transform / transform-origin / transition / animation |
| 9 | 其他交互 | overflow / cursor / visibility / pointer-events / user-select |

面对非开发用户，每组除文字值外要给出可感知的呈现：颜色给色块、阴影给有无对比预览、圆角给图示。

## 三、核心技术要点

### 1. 元素拾取

- 使用 `pointermove` 的 capture 阶段监听，`e.target` 即真实元素，零额外命中计算。
- `click` 在 capture 阶段同时 `preventDefault` 与 `stopPropagation`，避免触发页面跳转与业务逻辑。
- `keydown` 中 Esc 退出；`Alt + 滚轮` 在父/子元素间切换目标。
- 不使用"全屏遮挡层 + `elementFromPoint`"方案，该方案每帧改 `pointer-events`，易出错。
- iframe 内元素明确不支持（坐标换算与跨域双重问题）。

### 2. 高亮框

- `position: fixed` + `pointer-events: none` + 顶层 z-index 的独立 div。
- 位置通过 `transform: translate()` 更新，不改 `left/top`，避免每帧重排。
- 滚动 / 窗口尺寸变化时用 `requestAnimationFrame` 节流重算。
- `getComputedStyle` 会触发样式重算，只在目标元素变化时读取，移动过程仅更新矩形。

### 3. 悬浮面板

- 必须用 `attachShadow({ mode: 'closed' })` 隔离，页面 Tailwind preflight、`*{box-sizing}` 等规则无法侵入。
- shadow root 内部先重置可继承属性（font / color / line-height），否则会被页面继承污染。
- React 直接挂载到 shadow root 内的容器节点。
- 定位优先贴元素右侧，超出视口翻转到左侧或上方；支持拖动、吸边、折叠。

### 4. 样式采集与精简片段

- 采集：`getComputedStyle(el)` 逐属性读取，按九组分拣，值精度裁剪（像素取整到 0.01）。
- 精简片段：与**同 tagName 的离屏空元素**（`position:absolute; visibility:hidden; top:-9999px`）做基准 diff，剔除与默认一致项。
- 基准元素不能使用 `all: initial`，否则 `display` 会判错（div 是 block、span 是 inline）。
- 继承属性（font、color 等）需另与根默认值比对，避免把父级值误判为"用户自己写的"。
- `transform` 会被 computed 展平为 `matrix()`，`background` / `border` 也会展开，UI 上必须标注已展开。

### 5. 剪贴板（双端差异处理）

- 主路径 `navigator.clipboard.writeText`，在点击手势内调用，两端均可用。
- 失败降级：临时 textarea + `execCommand('copy')`。
- 不使用 Chrome 独有的 offscreen document，保持单套代码两端可用。

### 6. 多选与工作台存储

- `Shift + 点击` 加入选择集，每个元素独立高亮并带序号徽标，面板顶部展示选中列表。
- **存储必须走后台**：content script 内的 `indexedDB` 属于页面 origin，不是扩展 origin，直接写入会随页面刷新丢失且污染宿主站点。
- 数据流：content `sendMessage` → 后台（扩展 origin）写入 IndexedDB。
- 轻量配置放 `storage.local`，含 HTML 片段的重快照放 IndexedDB。

数据模型：

```ts
interface SnapshotItem {
  selector: string;
  tag: string;
  text: string;
  styles: Record<string, string>;
  minimalRule: string;
}

interface Snapshot {
  id: string;
  createdAt: number;
  pageUrl: string;
  pageTitle: string;
  items: SnapshotItem[];
  note?: string;
}
```

## 四、浏览器差异

| 项 | Chrome | Firefox |
| --- | --- | --- |
| 后台形态 | Service Worker | 事件页 `background.scripts`（WXT 自动分叉） |
| API 命名 | `chrome.*` | `browser.*`（WXT 统一为 `browser` 并自动 polyfill） |
| 剪贴板兜底 | 可 offscreen | 无 offscreen，只能 execCommand / 后台页写入 |
| manifest 附加 | — | 必须配 `browser_specific_settings.gecko.id` |

序列化差异：两端对渐变、`transform` 的字符串输出不完全一致，验收标准为「同一元素两端差异 ≤ 3 条」，不要求字节级一致。

## 五、任务清单

每个任务对应一次独立提交，可独立跑通后再进入下一项。

| # | 提交 | 内容 |
| --- | --- | --- |
| T0 | `docs: 补充项目规划与提交规范` | 本文件 |
| T1 | `chore: 初始化 WXT + React + TS 工程骨架` | 脚手架、`.gitignore`、构建脚本 |
| T2 | `chore(build): 配置 Firefox 目标与 gecko id` | manifest 分叉、双端产物 |
| T3 | `feat(picker): 实现元素拾取与点击拦截` | 拾取监听 + 点击吞掉 + Esc 退出 |
| T4 | `feat(picker): 高亮框跟随目标元素` | overlay + rAF 节流 |
| T5 | `feat(picker): 支持 Alt+滚轮 父子层级切换` | 层级切换 |
| T6 | `feat(styles): 按九组分组采集计算样式` | collector + 中文标签 |
| T7 | `feat(styles): 过滤默认值生成最小片段` | 基准 diff |
| T8 | `feat(panel): Shadow DOM 挂载悬浮面板` | React + shadow root + 定位翻转 |
| T9 | `feat(panel): 九组折叠与只看差异项开关` | 色块、阴影预览 |
| T10 | `feat(copy): 一键复制全部样式与精简片段` | 序列化 + 剪贴板兜底 |
| T11 | `feat(picker): 支持 Shift 多选与选中列表` | 多选 + 序号徽标 |
| T12 | `feat(store): 经后台写入 IndexedDB 保存快照` | 消息通道 + 存储层 |
| T13 | `feat(panel): 工作台抽屉（查看/复制/删除）` | 保存-复用闭环 |
| T14 | `feat(panel): 面板拖动/吸边/折叠` | 交互收尾 |

## 六、提交规范

- 格式：`type(scope): 描述`
- `type` 用英文，`scope` 用模块名，描述用中文
- type 取值：`feat` `fix` `docs` `chore` `refactor` `style` `test` `perf`
- scope 取值：`picker` `styles` `panel` `copy` `store` `build`
- 一次提交只做一件事；提交前用 `git status` 核对暂存范围，不使用 `git add -A`

## 七、已知风险

1. 跨域 CDN 样式表读取 `cssRules` 会抛 `SecurityError`，规则来源功能必须优雅降级并提示。
2. iframe 内元素不可拾取。
3. 宿主页面自身使用 shadow DOM（Web Components）时需要递归下钻。
4. `transform: scale()` 下元素矩形与 CSS 尺寸不一致，高亮框跟视觉一致、复制值取 computed，属预期行为。
