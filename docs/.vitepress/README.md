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
    ├── style.css               # 全局样式（必须用 VitePress CSS 变量适配暗黑模式）
    ├── code-interaction.ts     # 代码折叠按钮的事件委托
    └── math-interaction.ts     # 公式点击复制 + Toast
```

## 二、扩展约定

- **扩展名**：构建侧（config.mts 及其 import 链）在 Node 中执行，项目未设 `"type": "module"`，故统一用 `.mts` 显式声明 ESM；`theme/` 下的 `.ts` 由 Vite 打包进浏览器，无需 `.mts`。
- **新增 Vite 插件**：只加进 `configs/vite-plugins.mts` 的数组，不要污染 `config.mts`。
- **新增 Markdown 插件**：文件放 `plugins/`，然后在 `config.mts` 的 `markdown.config` 中 `md.use(...)`。注意管线有先后依赖时再调整顺序，目前各插件互不干扰。
- **构建产物**：`config.mts.timestamp-*.mjs`（vite 打包配置时的临时文件）、`dist/`、`cache/` 均已 gitignore，出现残留直接删。
- **字数统计陷阱**：`page-transform.mts` 只剥离**文件开头**的 Frontmatter（`^---\n...\n---`），正文中间的 `---` 分割线会被计入字数，属预期行为，不要改回旧的宽松正则。

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

## 四、与 scripts/ 的关系

`configs/theme-config.mts`、`scripts/auto-index.mjs` 与 `plugins/glossary/glossary-scanner.mts` 均复用仓库根目录 `scripts/scanner.mjs` 的工具函数（`scanDir`、`stripNumericPrefix`、`matchAnyGlob`、`vitepressSlugify`、`createNameResolver`）。`scripts/auto-index.mjs` 负责导读页生成，挂在 `docs:dev` / `docs:build` 的 npm 前置步骤里。修改 scanner.mjs 的导出时记得这三处都是消费方。
