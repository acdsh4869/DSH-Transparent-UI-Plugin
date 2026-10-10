# Changelog

## main（未发布）

- **修复：兼容模式下半屏被磨砂。** 兼容模式的通用玻璃规则给 `[class*='panel']` 加了 `backdrop-filter`，而 0.2.x 里 `panel` 类片段命名的是整栏大容器（聊天主面板、设置面板、侧栏面板），导致半边屏幕整体模糊。已从选择器中移除 `panel`（保留 menu/tooltip/card/bubble/popover/dropdown 小件）。
- **新增：「恢复默认效果」一键按钮。** 通用设置 → 外观 → 玻璃效果组内新增按钮，单击把全部调节项（模式/模糊/磨砂/色调/深浅/亮度/壁纸及视频壁纸参数/装饰开关）恢复到出厂默认（`SETTINGS_DEFAULTS`，保留开关状态），并清理被替换掉的视频壁纸存储。
- **修复：0.2.x 主区域/侧栏面板不透明底色盖住流体背景。** 0.2.x 的布局包（`dsh-client-ui-layout`）把基础底色从原来的 frame+phase 两层改为画在独立的布局列上（`centerCol`/`rightbarCol`），新装的两块侧栏面板（浏览器预览 `dsh-client-ui-sidebar-browser`、文档预览 `dsh-client-ui-sidebar-documentpreview`）的 frame 根节点也各自自绘不透明底色——主题原有的 `[data-phase]`/`[data-dsh-frame]` 透明化规则盖不到它们，主区域因此呈纯白平板。主题样式现补充：`[class*='centerCol']`、`[class*='rightbarCol']` 与侧栏列内 `[class$='_frame']` 全部置为透明（类片段锚点，不受哈希前缀影响），流体背景可透至主区域与侧栏面板。
- **修复：主题样式表缺失导致启动闪烁 + 玻璃效果不完整。** tsdown/rolldown 会把「纯副作用、无 JS 消费」的 CSS 导入（`aqua.module.css` 全局主题与 `fonts.module.css` 字体表）整棵摇掉，`lib/style.css` 里只剩设置卡片的 CSS module 类；插件因此只有 `overrideTokens` 的换色在生效，玻璃面板、背景流体、字体全部缺失，且应用启动时背景发生一次硬切闪烁。`scripts/wrap-client.mjs` 现在直接从 `src/client/` 读取这两个文件与 `lib/style.css` 一起内联进 `lib/client.js`（产物约 244KB，含 11 个 `@keyframes`、3 个 `@font-face`、111 个属性选择器、23 处 `backdrop-filter`）。同时：
  - 新增 `dsh-aqua-boot-in` 一次性 0.6s 淡入动画（流体背景板与壁纸层），把启动首帧的突跳变为平滑过渡。
  - `mountFluid()` 增加重入保护，防止重复挂载时泄漏 WebGL 上下文并叠加两个 shader（另一处潜在闪烁源）。

## 2.0.0-rc.1（适配 DSH v0.2.x / 桌面端 v0.22.3+）

- 兼容 DeepSeek Harness `0.2.0-rc.2`（含桌面端 v0.22.3+）：
  - `ctx.settingsScope` 服务已移除——删除 `ctx.settingsScope.bind(...)` 调用；插件配置不再按 namespace 绑定。
  - 插件主卡片槽位由 `settings.plugin.item` 迁移到 `plugins.bundle.config`（keyed/root，key 为 npm 包名 `@deepseek-ai/dsh-client-ui-aqua`），由 `@deepseek-ai/dsh-client-ui-plugin-manager` 渲染到「插件」页的 bundle 详情页。
  - `ctx.slots.inject(name, factory)` 回归，两处注册恢复使用 `ctx.effect(() => ctx.slots.inject(...))`。
  - `@deepseek-ai/dsh-client-runtime` 已消失：`defineStore` 改用 `@deepseek-ai/dsh-client-store`；`ctx.slots` 的 Context 合并来自 `@deepseek-ai/dsh-client-ui-renderer/client`。
  - 图标 `IconCheckOutline16` 更名为 `IconCheckOutlineRegular`（dsh-client-ui-primitives 0.2.x）。
  - `package.json` 的 `dsh.client.inject` 更新为 `@deepseek-ai/dsh-client-locale` / `@deepseek-ai/dsh-client-ui-theme` / `@deepseek-ai/dsh-client-ui-slots`；peerDependencies 仅保留 `@deepseek-ai/cordis ~4.0.4` 与 `react ^18.2.0`，不声明 `@deepseek-ai/dsh*` peer 以通过宿主版本检查。
- 构建管线修复：新增 `scripts/wrap-client.mjs` 后处理脚本，把 tsdown 的 ESM 产物转换为 DSH 要求的 `window.__ModuleLoader__.load({id, factory})` 包裹格式，并把 `lib/style.css` 以 `<style data-plugin-css>` 内联注入；`bundle` 脚本现为 `tsdown && tsc -p tsconfig.standalone.json && node scripts/wrap-client.mjs`，可完整产出 `lib/client.js` + `lib/index.js` + `lib/invariant.js` + `lib/types/**`。
- `settings.general.item` 外观调节行、`settings.aqua` 文案命名空间、全部玻璃功能（磨砂/流体/壁纸/亮度/鲸鱼/mica/兼容模式/总开关关闭即还原）原样保留。
- 通用设置 → 外观 顶部「玻璃效果」总开关沿用（始终显示，关闭时下方调节项隐藏；与「插件」页主开关共用状态）。

## 0.1.1-rc.2 兼容

- 兼容 DeepSeek Harness `0.1.1-rc.2`：`settings.plugin.item` 槽位由 list 改为 keyed，注册改用 `key: 'settings.aqua'`；新增 `ctx.settingsScope.bind({ namespace: 'settings.aqua' })` 让「插件」配置页服务 Aqua 主卡片；`ctx.slots.inject` 已移除，改用 `ctx.effect(() => ctx.slots.register(...))` 注册插件卡片与外观（外观）行。
- 全部玻璃质感功能与设置项（磨砂/流体、壁纸模糊与柔光分离、亮度、粒子鲸鱼、mica/兼容模式等）原样保留。
- 新增独立构建配置（`tsconfig.standalone.json` + `tsdown.standalone.config.ts`），可在 monorepo 之外类型校验与构建；`package.json` 加入 `@tsdown/css` 与 `overrides`（tinyexec/pluginutils 钉版本）以保证可复现构建。`lib/client.js` 沿用 monorepo 的 `window.__ModuleLoader__.load(...)` 包裹格式与 CSS 内联注入（该预设未对外发布，故对 v1 预构建产物做最小 0.1.1-rc.2 API 修补）。

## v1.3.0

- 视频壁纸全面升级：浏览器原生解码、无进度条、循环播放、铺满裁剪，窗口缩放实时自适应
- 视频壁纸「记住文件授权」：选一次即可（File System Access，刷新自动读取原文件、改动即时生效、不占额外存储；非 Chromium 自动退回数据库存储）
- 视频壁纸自动柔光罩 + 聊天气泡实底，保证文字在视频上清晰可读
- 视频壁纸新增「模糊度」「亮度」两个滑杆（含提醒文案）
- 发送栏与数据栏共用一块玻璃：单一背景/模糊/边框/投影，分界线精确落在左右圆角弯曲处，两片玻璃不再出现模糊度/清晰度不一致
- 数据栏文字、发送栏占位符改中性色（深色模式近白、浅色模式深灰），去除蓝色调
- 玻璃卡片平板化：去掉卡片底部黑色渐变，视觉更干净

## v1.2.1

- 鼠标辉光颜色跟随「色调」设置（与流体晕染色共用色相基准），不再默认泛蓝

## v1.2.0

- 新增「悬停下压」：官网卡片同款 3D 倾斜（哪边鼠标哪边下压、透视 800px + 微放大 1.01、0.1s 过渡），顶栏/侧边栏/发送框+数据栏/轨迹窗统一配方，轨迹窗幅度减半，设置里可开关
- 新增「鼠标辉光」：跟随光标的荧光青光晕，位于玻璃之下从磨砂中透出，不遮内容
- 设置页玻璃化：50px 磨砂、深浅色区分、兼容模式生效；打开设置即时弹出不再卡顿
- 设置分组优化：环境装饰（粒子鲸鱼/小鱼/网状交互）与悬停效果（鼠标辉光/悬停下压）分组，子标题放大加粗
- 背景新增「色调」「颜色深浅」双滑条：全程无极调节；0°/360° 锚定蓝色、默认 320° 青蓝；深浅 0 端直落纯黑（深色）/深浓原色（浅色），100 端浅淡粉彩
- 兼容模式修复：注入层不再顶歪顶栏/新建会话按钮/发送栏
- 浅色模式聊天文字微投影 + 1px 光晕
- 出厂默认：模糊 20 / 磨砂 7 / 色调 320 / 深浅 25 / 亮度 50，全部开关默认开启

## v1.1.2

- 新增「小鱼」开关（背景游动的小鱼/气泡，位于粒子鲸鱼开关右侧）
- 壁纸新增「删除」按钮（清除已选壁纸）

## v1.1.1

- 侧边栏收起状态悬浮玻璃，收起带渐隐动画
- 页面顶部/底部渐变模糊带（浅色泛白、深色泛黑）
- 漂浮玻璃投影加深
- 新建会话按钮透明玻璃，磨砂度跟随磨砂旋钮 +20
- 统计行与发送框分界线更清晰
- 设置页不再被顶栏遮挡；展开时 Harness 铭牌实时就位
- 设置文案简化

## v1.1.0

- 新增「粒子鲸鱼」：deepseek.com/harness 同款（官网粒子引擎 2D 移植），显示在聊天主区域正中央（不含侧边栏），深色模式白粒子、浅色模式灰粒子，设置里有开关可关
- 深色模式侧边栏铭牌换成官网同款「Harness」光泽药丸（135° 渐变描边 + 柔光 + 黑底白字），浅色模式保持原版铭牌
- 页面顶部/底部新增 5px 渐变模糊带，悬浮在聊天内容上层，内容滚到边缘渐入模糊；浅色模式微泛白、深色模式微泛黑
- 「漂浮玻璃」更名「云母效果」

## v1.0.8

- 通用设置里的玻璃主题控件去掉独立标题，直接跟在「外观」下方；插件页总开关关闭时，通用设置里的整块调节自动隐藏，打开开关即恢复
- 「选择图片」旁新增提示：浅色壁纸用浅色模式，深色壁纸用深色模式⚠️
- 设置排版统一：壁纸行改为「标签 + 控件」结构，模式/亮度/壁纸三条说明文字全部与所解释的控件列对齐

## v1.0.7

- 背景亮度自动跟随深浅模式：**深色模式只能在 0–50 调节**（压暗，50 原样），**浅色模式只能在 50–100 调节**（提亮，50 原样）；「跟随系统」按实际解析出的深浅色自动切换，旋钮范围与提示文字实时翻转，另一侧的旧值自动失效不干扰

## v1.0.6

- 设置重新布局：总开关留在「插件」页（卡片形状与其他插件一致），其余全部调节（模式/模糊度/磨砂度/流体颜色/背景亮度/背景/壁纸）移到**通用设置 → 外观**的正下方；主题未开启时该行会变暗并提示开关位置

## v1.0.5

- 修复「背景亮度」0–50 无效的问题：黑色遮罩原来画在流体/壁纸**下面**被盖住，现与白色遮罩合并到同一顶层（`::after`），0 = 死黑、100 = 死白、50 = 透明全部生效

## v1.0.4

- 新增「背景亮度」调节（0 = 纯黑、50 = 透明、100 = 纯白），漂浮/兼容两种模式都可用

## v1.0.3

- 安装器改为**优先 zip 下载**（普通 HTTP 更快更稳），git clone 只作后备——git 连 GitHub 不稳时不再白等十几秒

## v1.0.2

- 安装脚本默认安装**最新发布版**（通过 GitHub API 解析，可 `-Version 'v1.0.1'` 指定版本或 `-Version 'main'` 跟随开发分支）
- 修复安装脚本在 Windows PowerShell 下中文提示乱码（UTF-8 BOM）

## v1.0.1

- 兼容模式新增「背景流体颜色」调节入口（颜色旋钮在两种模式下都可用）
- 介绍补充兼容模式（双模式）说明

## v1.0.0

首个正式版本：可开关的玻璃主题，双模式 + 高自由度自定义。

- **漂浮玻璃模式**：顶栏、侧边栏、发送框、统计行、轨迹视图变成悬浮玻璃卡片，聊天区在流体上滑动
- **兼容模式**：保持原版排版一字不动，只把材质换成通用玻璃——按角色和类名子串命中菜单/卡片/气泡/下拉/提示等保守表面，其他插件的界面同样自动玻璃化
- **可调旋钮**（无极滑块 + 数值框）：玻璃模糊度、磨砂度、背景流体颜色
- **背景**：流体板或自定义壁纸（铺满页面、比例不变），壁纸单独可调模糊度/磨砂度，图片自动压缩后本地保存
- 深色玻璃改中性冷灰，磨砂度拉满不再泛蓝；发送栏正确模糊背后的内容
- 问候语等文案功能独立，不在本主题内
- 一键安装 `install.ps1`（按版本号安装，无 git 时自动退回 zip 下载）
