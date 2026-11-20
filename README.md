# CSS Snap

浏览器扩展：鼠标点选网页元素，悬浮面板展示九组样式，一键复制 CSS，并支持多选与本地快照工作台。同时支持 Chrome / Edge 与 Firefox（MV3）。

## 功能

- 点击工具栏图标进入拾取模式，光标变为十字，鼠标悬停即高亮并标注尺寸
- 面板按九组展示计算样式，颜色给色块、阴影给预览、渐变给缩略
- 「只看差异项」过滤掉与默认样式一致的属性
- 「精简片段」输出可直接粘贴进样式表的规则（自动剔除默认值）
- 一键复制：全部样式 / 精简片段；多选时可批量复制
- `Shift + 点击` 追加多选，页面上用带序号的虚线框标注
- 保存到本地工作台（扩展 origin 的 IndexedDB），可查看 / 复制 / 删除
- `Alt + 滚轮` 在父子层级之间切换目标，`Esc` 退出拾取
- 面板可拖动、贴边吸附、折叠成标题栏

## 开发

```bash
npm install

npm run dev            # Chrome 开发模式
npm run dev:firefox    # Firefox 开发模式
npm run build          # 产物：.output/chrome-mv3
npm run build:firefox  # 产物：.output/firefox-mv3
npm run compile        # 类型检查
```

## 加载扩展

- **Chrome / Edge**：打开 `chrome://extensions` → 开启「开发者模式」→「加载已解压的扩展程序」→ 选择 `.output/chrome-mv3`
- **Firefox**：打开 `about:debugging#/runtime/this-firefox` →「临时载入附加组件」→ 选择 `.output/firefox-mv3/manifest.json`（重启浏览器后失效，需重新载入）

> Chrome 137 起，正式版已忽略 `--load-extension` 命令行加载（加 `--disable-features=DisableLoadExtensionCommandLineSwitch` 也无效）。命令行 / 自动化场景请改用 Chrome for Testing 的二进制；只做日常调试的话，上面的手动「加载已解压」不受影响。

## 运行时验证

2026-11 在 Chrome for Testing 158 与 Firefox 145 上做过一轮真实浏览器冒烟，结论：

- 拾取：`html` 光标为 `crosshair`、`body` 为 `user-select: none`，点击被拦截、页面不跳转、不触发按钮默认行为
- 高亮：悬停出现描边框与「标签 + 尺寸」角标；多选时带序号的虚线框与实线框并存
- 面板：挂在 closed shadow root 内，页面字体（Georgia）未渗透进面板，面板样式也未污染页面
- 复制：`精简片段` 只输出与同位置默认元素不同的属性（实测一个 `<p>` 只剩 `height / margin-top / transform-origin` 三条），`全部样式` 输出完整声明，系统剪贴板读回内容一致
- 保存：经后台写入扩展 origin 的 IndexedDB，`工作台` 页签能看到快照条目
- `Esc` 退出拾取，高亮与描边清除、光标恢复
- Firefox：`web-ext` 临时安装成功（id `css-snap@local`），未在 Firefox 内做交互验证

## 使用

1. 点击工具栏上的 CSS Snap 图标，进入拾取模式（光标变为十字）
2. 移动鼠标选中目标元素，单击确定；按住 `Shift` 点击可追加多选
3. 在面板里切换「全部样式 / 精简片段 / 工作台」，复制或保存
4. `Esc` 退出拾取；面板标题栏可拖动，双击图标可折叠

## 目录结构

```
src/entrypoints/background.ts       后台：工具栏点击、快照读写消息
src/entrypoints/content/index.tsx   内容脚本入口：装配拾取器 / 高亮 / 面板
src/lib/picker.ts                   元素拾取、点击拦截、层级切换
src/lib/highlight.ts                悬停高亮框
src/lib/selection-boxes.ts          多选描边与序号
src/lib/element-info.ts             元素摘要（标签、类名、尺寸、文本）
src/lib/element-selector.ts         可读选择器生成
src/lib/clipboard.ts               复制主路径与 execCommand 降级
src/lib/styles/groups.ts            九组样式定义与中文标签
src/lib/styles/collect.ts           计算样式采集与数值格式化
src/lib/styles/minimal.ts           与默认样式做 diff 得到最小片段
src/lib/styles/serialize.ts         序列化成 CSS 文本
src/lib/panel/                      Shadow DOM 悬浮面板（React）
src/lib/store/                      快照结构与 IndexedDB 读写
```

## 已知限制

- iframe 内的元素无法拾取（坐标换算与跨域双重问题）
- 跨域 CDN 样式表的 `cssRules` 不可读，当前版本未提供「规则来源」功能
- 宿主页面自身使用 shadow DOM 时，只能拾取到 shadow 宿主元素
- 安装时会提示「读取并更改你在所有网站上的数据」，因为内容脚本是静态注入、收到消息才动作
- Firefox 与 Chrome 对渐变、`transform` 的序列化字符串略有差异，同一元素两端结果可能有 1–3 条不同

## 提交规范

格式 `type(scope): 描述`，type 用英文、描述用中文，一次提交只做一件事。

- type：`feat` / `fix` / `docs` / `chore` / `refactor` / `style` / `test` / `perf`
- scope：`picker` / `styles` / `panel` / `copy` / `store` / `build`
