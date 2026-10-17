# Agent 工作守则与项目上下文

## 1. 项目概况
- 本项目是一个基于 VitePress 构建的个人静态技术博客与 Obsidian 协同工作空间。
- 博客源文档均存放在 `./docs` 目录下。

## 2. 核心红线（Strict Constraints）
- **绝对禁止修改任何现有的笔记正文**：除非有明确的人工逐字授权，严禁改动已存在的 Markdown 文章内容。
- **禁止触碰 Obsidian 核心配置**：任何操作都严禁改动或删除 `.obsidian/` 目录下的配置、插件与缓存。
- **静态资源规范**：文章引用图片统一存放在各子级目录对应的 `./images/` 或本地相对路径中，图片命名遵循 `{{fileName}}-说明` 规则，脚本处理路径时切勿改动图片原有命名。

## 3. 自动化任务规范
- **脚本语言**：编写自动化或构建辅助脚本时，优先采用 Node.js 原生 ESM 规范（`.mjs` 扩展名），尽量依赖 Node 内置模块（如 `fs/promises`, `path`），避免随意安装体积庞大的第三方依赖。
- **编码与路径**：项目包含大量中文分类与目录（如 `01-计算机与IT技术`），所有文件遍历和读写逻辑必须妥善处理 UTF-8 编码与 URL/文件名解码（`decodeURIComponent`）。
- **组件开发**：若需编写 Vue 聚合组件，必须使用 Vue 3 `<script setup>` 语法，样式遵循 VitePress 默认变量及暗黑主题规范。
- **导读页是构建产物**：各分类目录的 `index.md` 由 `scripts/auto-index.mjs` 在构建前**整文件重新生成**，因此不入 git（`.gitignore` 中 `docs/**/index.md`，仅手写的根目录首页 `docs/index.md` 例外）。任何构建/部署路径都必须先跑该脚本（`npm run docs:dev` / `docs:build` 已把 `auto-index.mjs` 链在前置步骤），直接调用 `vitepress` 会缺导读页，并让 `check-links.mjs` 把所有目录链接报成死链。要改导读页请改脚本或速览表组件，不要手改单个 `index.md`。