# 📖 .vitepress 工程目录说明

本目录是 VitePress 站点的构建配置中心。组件开发规范见 [`components/README.md`](./components/README.md)，本文覆盖其余全部文件。

## 一、目录结构

```
.vitepress/
├── config.mts                  # 总入口：站点信息、markdown 管线、vite 别名
├── components.d.ts             # unplugin-vue-components 自动生成，勿手改
├── env.d.ts                    # *.vue 模块声明等 TS 补丁
├── configs/                    # 从 config.mts 拆出的构建侧配置
│   ├── vite-plugins.mts        # Vite 插件注册（组件自动导入）
│   ├── theme-config.mts        # 导航/侧边栏/搜索/页脚等主题配置
│   └── page-transform.mts      # 编译期统计每篇笔记的字数与阅读时长
├── plugins/                    # 自研 markdown-it 插件（编译期改写 Markdown）
│   ├── glossary/               # 术语词典子系统（见第三节）
│   ├── markdown-code-tool.mts       # 长代码块折叠 + 展开按钮
│   ├── markdown-download.mts        # 附件链接自动注入 download 属性
│   ├── markdown-image-caption.mts   # 图片自动包 figure/figcaption 并清洗说明文字
│   ├── markdown-math-tool.mts       # 公式包一层可点击复制的容器
│   └── markdown-syntax-sugar.mts    # ||文字|| 语法 → <Spoiler> 组件
└── theme/                      # 浏览器侧运行时代码
    ├── index.ts                # 主题入口：注册组件、viewerjs、路由监听
    ├── tree.data.mts           # Data Loader：全站笔记清单（见第四节）
    ├── style.css               # 全局样式（必须用 VitePress CSS 变量适配暗黑模式）
    ├── code-interaction.ts     # 代码折叠按钮的事件委托
    └── math-interaction.ts     # 公式点击复制 + Toast
```

## 二、扩展约定

- **扩展名**：构建侧（config.mts 及其 import 链）在 Node 中执行，项目未设 `"type": "module"`，故统一用 `.mts` 显式声明 ESM；`theme/` 下的 `.ts` 由 Vite 打包进浏览器，无需 `.mts`。
- **新增 Vite 插件**：只加进 `configs/vite-plugins.mts` 的数组，不要污染 `config.mts`。
- **新增 Markdown 插件**：文件放 `plugins/`，然后在 `config.mts` 的 `markdown.config` 中 `md.use(...)`。注意管线有先后依赖时再调整顺序，目前各插件互不干扰。
- **新增 Data Loader**：文件放 `theme/`，命名必须是 `xxx.data.mts`（扩展名规则见第四节），组件内 `import { data } from '.../xxx.data.mts'`。
- **新增全局组件**：写到 `components/common/` 下，然后在 `theme/index.ts` 的 `enhanceApp` 里 `app.component(...)` 注册（`configs/vite-plugins.mts` 的 unplugin 只管算法可视化组件，不要混用）。
- **构建产物**：`config.mts.timestamp-*.mjs`（vite 打包配置时的临时文件）、`dist/`、`cache/` 均已 gitignore，出现残留直接删。
- **字数统计**：口径唯一，实现在仓库根 `scripts/word-count.mjs` 的 `countWords()`，由本目录 `configs/page-transform.mts`（每页字数/阅读时长徽章）与 `scripts/auto-index.mjs`（导读页「篇均字数」统计条）共用。**改计数规则必须两处同步生效，不要在本目录内私自复制一份正则**。注意它只剥离**文件开头**的 Frontmatter（`^---\n...\n---`），正文中间的 `---` 分割线会被计入字数，属预期行为，不要改回旧的宽松正则。

## 三、术语词典子系统（plugins/glossary/）

全站自动超链接：正文出现词典关键词时，自动渲染为指向对应笔记/标题锚点的品牌色链接（`a.glossary-link`，样式在 `theme/style.css`）。

### 数据流

```
glossary-scan.config.mts          你维护：扫描哪些目录、全局防误伤开关
        │ (构建/dev 启动时执行)
glossary-scanner.mts              引擎：目录名/文件名/标题/frontmatter → 自动词条
        │ scannedGlossary
glossary-data.mts                 合并：{ ...自动词条, ...手写覆盖 }
        │ glossary
markdown-glossary.mts             插件：长度倒序匹配 + ASCII 词边界 + 自链接豁免
```

日常维护**只需要动 `glossary-scan.config.mts`**（加扫描目录）和 **`glossary-data.mts` 的手写区**（登记扫描不到的术语，如缩写 `RAG`）。

### 扫描源字段（GlossarySource）

| 字段 | 说明 |
|---|---|
| `dir` | 相对 `docs/` 的目录路径，支持中文 |
| `scope` | `'dirs'` 仅收录直接子文件夹（链接到子目录导读页）；`'all'` 递归收录所有 md |
| `headings` | `false` 不扫标题；`n` 表示 h1~hn 的小节标题也生成 `路径#锚点` 词条 |
| `include` / `exclude` | 按**文件/文件夹 basename** 匹配的 micromatch glob；默认额外排除 `index.md`、`images`、隐藏项 |
| `priority` | 关键词撞车时大者胜；同值先声明者胜（构建日志会 `[glossary] 关键词撞车` 警告） |
| `minKeywordLength` | 覆盖全局最小词长 |

### 全局开关（glossaryGlobalOptions）

- `minKeywordLength` / `stopWords`：**只约束自动词条**，手写层永远放行。
- `caseSensitive`：纯 ASCII 关键词是否区分大小写（中文永远精确匹配）。
- `noSelfLink`：目标文件自己的正文里不再链接回本页。

### 笔记侧的控制入口（frontmatter）

```yaml
---
title: 快排笔记            # 覆盖"文件名脱马甲"作为本文件的关键词
aliases: [快速排序法]       # 追加关键词，链接指向本文件
glossary: false             # 整篇豁免，不产出任何自动词条
glossary: [冒泡]            # 用自定义关键词列表替代文件名推导的文件级词条
---
```

### 必须知道的机制

- **锚点算法**：`scripts/scanner.mjs` 的 `vitepressSlugify` 逐字复刻了 VitePress 1.6 的标题转 id 逻辑（NFKD 归一化、全角转半角、数字开头补 `_` 等）。升级 VitePress 大版本时，需比对 `vitepress/dist/node/chunk-*.js` 中的 `rSpecial/slugify` 是否变更。
- **脱马甲**：文件名/目录名/标题关键词都会先经 `stripNumericPrefix` 去掉 `01-`、`2025-07-31-` 这类数字前缀；但链接锚点仍按原标题计算，两者不冲突。
- **重扫时机**：扫描发生在 config 加载时。**改笔记的标题/别名/frontmatter 后需重启 dev 或重新构建**才生效（md 不在 config 模块图里，热更新不触发重扫）；改 `glossary-scan.config.mts` 本身会自动重启。
- **匹配安全**：插件跳过标题与既有链接内的文本；纯 ASCII 关键词带 `(?<![A-Za-z0-9])...(?![A-Za-z0-9])` 边界断言，不会误伤单词内部（如 `RAG` 不会命中 `PARRAGE`）。

## 四、导读页速览表（DirectoryTree）

`scripts/auto-index.mjs` 在**子树笔记数 ≥ 阈值**（常量 `DIR_TREE_MIN_NOTES`，当前 20）的导读页**不再输出 markdown 列表**，只保留标题、返回上级、统计条和一行 `<DirectoryTree />`，渲染一张可「递归开关 / 类型筛选 / 本页筛选（支持 `*` `?` 通配符）/ 多级排序 / 自定义每页 / 跳至指定页」的速览表。**非达标页（绝大多数）仍是纯 markdown 列表**，无 JS 依赖。表格定位是「元数据浏览」，与 Ctrl+K 全站搜索互补（后者索引正文、不可按字数排序）。当前触发页面：`01-计算机与IT技术`、`01-比特就业课`、`001-Java研发系统课118期`。

### 数据流

```
theme/tree.data.mts          构建期 Data Loader：扫描 **/*.md（排除 .vitepress/public）
        │ 条目 = { url, title, rawName, dir, isDir, noteCount, wordCount }
        │ 字数走 word-count.mjs 口径；显示名复用 scanner.mjs 的脱马甲 + 防重名
components/common/content/DirectoryTree.vue   浏览器端筛选/排序/分页（纯前端，无请求）
```

### 必须知道的机制

- **导入必须带扩展名，且必须是 `.mts`**：VitePress 用 `/\.data\.m?(j|t)s$/` 匹配 data loader 并注入 `export const data`；项目 `package.json` 无 `"type": "module"`，若写成 `.data.ts` 会被 esbuild 当 CJS 打包，直接报 `"vitepress" resolved to an ESM file`。
- **排除目录只能用 `globOptions.ignore`**：它会**覆盖** VitePress 默认的 `node_modules`/`dist` 忽略项，必须自行补回；也不能用 `!pattern` 否定式——`path.join(srcDir, '!**/.vitepress/**')` 会把 `!` 挤到路径中间导致失效。
- **不下发原文**：loader 用 `includeSrc: true` 读原文（提大标题 + 算字数），但 `transform` 只返回白名单字段，笔记正文不会进客户端包。
- **多级排序是数据驱动的**：组件里的 `SORT_FIELDS`（当前 `名称`、`字数`）决定可排序字段与级数上限，`FIELD_COMPARATORS` 提供各字段比较器。**想新增一种排序只需往这两处各加一项**：工具条上的「排序」标签后跟摘要按钮（如 `名称↑ ＞ 字数↓`），点它弹出浮层，左栏列出已参与的级（可拖动调优先级，也可用 ↑/↓ 按钮兜底），右栏列出尚未参与的字段（点击加入末尾），同一字段不会重复参与。方向（升/降）与字段解耦、各存各的。各级都相等时**不再隐式按名称兜底**（保持稳定顺序），需要破平就显式加一级「名称」。
- **不再有「阅读时长」列/排序**：它与字数同源（`ceil(字数/150)`），保留会造成排序结果完全重复，故 loader 也不再产出 `readTime` 字段。
- **表格链接交给 VitePress 原生拦截**：`.vp-raw` 在本版本（1.6.4）**没有任何样式规则，不能隔离 `.vp-doc` 排版样式**，它只出现在 `vitepress/dist/client/app/router.js` 的 `link.closest('.vp-raw')` —— 即**只影响链接拦截、反而会让链接整页刷新**。所以组件根节点不再带 `.vp-raw`，`.dt-link` 也不用再自己 `useRouter().go()`，直接沿用 `.vp-doc` 内的原生 SPA 跳转与 `#dir-title` 锚点定位。
- **表格样式必须显式覆盖 `.vp-doc`**：既然不再有 `.vp-raw` 兜底，`.vp-doc` 自带的 `table { display: block; overflow-x: auto; margin: 20px 0 }`、`tr { border-top }` / `tr:nth-child(2n) { background }`（斑马纹）、`td { font-size: 14px }` 都会作用到速览表 —— `display: block` 会让内部匿名表格**收缩成内容宽、右侧留白**（组件里 `.dt-table { display: table }` 等规则正是为此重置，改动时别删）。
- **落点锚点**：目录行指向子目录导读页的 `#dir-title`（`auto-index.mjs` 给 H1 分配的固定锚点）；**改动该锚点会同时打断表格跳转与旧列表链接**，不要动。
- **列宽用比例**：`<colgroup>` + `table-layout: fixed`，归属列 45%、篇数 10%、字数 15%，名称吃剩余空间；超长归属单行省略号 + `title` 悬停看全文，因此表格宽度随容器自适应、不固定像素。
- **递归开关**：默认「含子目录」（一页看全后代）；关掉后只留直接子项，且「归属」列恒为 — 故自动隐藏该列。
- **本页筛选支持通配符**：查询串里出现 `*`（任意多字符）或 `?`（单个字符）时按通配符转正则匹配（其余字符全部转义，不会产生非法正则，`try/catch` 兜底回退子串匹配）；大小写不敏感，命中**标题或相对路径**；不含通配符时走普通 `includes` 快路径。
- **每页条数为自由输入**：`<input type="number">`，**留空 / 0 / 非法值 = 全部**（`pageSize` 计算属性归一化）。分页器里的「跳至 N 页」输入框在回车/失焦时把值 clamp 到 `1..totalPages` 后写回（空值守卫：回车后紧跟的 blur 不会把页码打回第 1 页），并有 `watch(totalPages)` 把条件变化后越界的当前页收回。
- **偏好持久化（全局共用一份）**：`localStorage['mynotes:dir-tree']` 存 `{ version, kind, pageSize, recursive, sortLevels }` —— 三个导读页共用同一个 key（不按路径分片）。`version` 必须等于 `STORAGE_VERSION`，不匹配就整体走默认，留作以后改结构的抓手；`kind` 会校验是否在 `KIND_OPTIONS` 取值内，非法回退 `all`。SSR 阶段用默认值渲染、`onMounted` 后再套用，避免 hydration 不一致；旧版 `sortKey+sortDir` 结构没有 `version`，自然被忽略。**改这些偏好结构时务必两处同步**（`onMounted` 读取 + `watch` 写入，`watch` 依赖数组也要跟着补字段）。**不持久化的临时态**：搜索框内容 `query`（有意为之）、当前页 `page`、浮层开合 `openPop`（必须不存，否则 SSR/hydration 不一致）、跳页输入 `jumpInput`。
- **工具条结构**：第一行是「本页筛选」搜索框（`flex: 1 1 100%` 独占一行）；第二行 `.dt-toolbar-row` 里左 `.dt-toolbar-left`（`筛选` 标签 + 摘要按钮 `类型 · 范围`，如 `全部条目 · 含子目录`）、右 `.dt-toolbar-right`（`排序` 标签 + 摘要按钮 + 每页），右组 `margin-left: auto`。**标签一律在按钮外面**，按钮里只放摘要；筛选的真实控件（类型下拉、子目录范围 chip）都收进浮层里。
- **两个浮层共用一个开合状态**：`openPop: 'filter' | 'sort' | null`（`togglePop`），因此天然互斥；锚点容器是 `.dt-pop-anchor`（`position: relative`），点击外部 / `Esc` 关闭，判定必须用 `e.composedPath()` 同时比对 `filterRoot`、`sortRoot` 两个 ref —— 点「＋ 字段 / ×」时 Vue 会先把该按钮 patch 掉（每个监听器返回后即执行微任务检查点），等 document 上的监听器执行时 `e.target` 已脱离 DOM，`el.contains(e.target)` 会误判成「点了外面」而关闭浮层。
- **浮层宽度必须是 `max-content`（PC 防「逐字竖排」）**：`.dt-pop` 是绝对定位且只写单边（`left: 0` / `right: 0`），此时 shrink-to-fit 的可用宽度取自包含块，而包含块（锚点）只有触发按钮那么宽（~120px）→ 文字会被压成逐字竖排（"字数" 竖着、"↑ 升序" 折三行）。所以显式写 `width: max-content; max-width: calc(100vw - 24px)`，再配 `.dt-pop .dt-field / .dt-sort-col-title / .dt-sort-name / .dt-pop .dt-chip { white-space: nowrap }`、`.dt-sort-item { flex-wrap: nowrap }`，**不要改回依赖 shrink-to-fit**。「含子目录 ↔ 仅本层」字宽不同，故 `.dt-toggle-dir` 定宽（`min-width: 5.5em`）。
- **移动端**：`@media (max-width: 640px)` 表格转卡片式堆叠（隐藏表头，`<td>` 用 `data-label` 生成行内标签）；工具条两组各占整行，且 `.dt-pop-anchor { flex: 1 1 100% }`（锚点占满整行，`width: 100%` 的浮层才有正确的包含块宽度）→ 浮层 `position: static; width: 100%` 整行铺满并允许换行（PC 的 `nowrap` 在此解除）。这样浮层开合/增删**不再挤压其它控件**（此前浮层作为流内块会把排序簇撑宽到约 240px，吞掉一整行，任何重新折行都会让「类型 / 子目录 / 每页」跳位）。触屏拖拽不可靠，用 ↑/↓ 按钮调整优先级。
- **显示名与列表一致**：loader 复用 `createNameResolver`，个别条目（如 `00-单词背诵软件推荐.md`，其 h1 自带 `.md`）会沿用 auto-index 的既有命名，属预期行为。

## 五、与 scripts/ 的关系

`configs/theme-config.mts`、`scripts/auto-index.mjs`、`theme/tree.data.mts` 与 `plugins/glossary/glossary-scanner.mts` 均复用仓库根目录 `scripts/scanner.mjs` 的工具函数（`scanDir`、`stripNumericPrefix`、`matchAnyGlob`、`vitepressSlugify`、`createNameResolver`）。`scripts/auto-index.mjs` 负责导读页生成，挂在 `docs:dev` / `docs:build` 的 npm 前置步骤里。修改 scanner.mjs 的导出时记得这四处都是消费方。

此外，`configs/page-transform.mts`、`scripts/auto-index.mjs` 与 `theme/tree.data.mts` 共享 `scripts/word-count.mjs` 的 `countWords()`，以保证「每页徽章字数」「导读页篇均字数」「速览表字数」三者同源（见第二、四节说明）。
