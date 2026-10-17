# 🚀 个人知识库站点导航

欢迎来到我的个人学习笔记与知识库。本站记录了从 IT 技术探索到生活经验的点滴，并基于 VitePress 实现了全自动化静态构建。

## 🌐 网站在线访问地址

您可以通过以下两个域名随时访问我最新部署的知识库页面：

- **主访问节点**：[https://blog.774822.xyz/](https://blog.774822.xyz/)
- **备用访问节点**：[https://blog.wunamor.de5.net/](https://blog.wunamor.de5.net/)

## 📝 本地写作与维护指北

在本地编写新的 Markdown 笔记或调整站点配置时，常用的基础命令如下：

### 1. 启动本地开发服务
在终端执行以下命令，可以在本地开启带有热更新（HMR）的预览服务器，实时查看修改效果：
```bash
npm run docs:dev
```

### 2. 执行本地打包测试
在将代码推送到远程仓库前，如果想在本地测试静态文件是否能成功生成，可以运行：
```bash
npm run docs:build
```

### 3. 关于自动生成的导读页（`index.md`）
各分类目录下的 `index.md` 是**构建产物**：由 `scripts/auto-index.mjs` 在 `docs:dev` / `docs:build` 之前**整文件重新生成**（页面顶部也标着「本页面由系统自动生成，请勿手动修改」），所以它们**不入 git**（`.gitignore` 里的 `docs/**/index.md`；只有手写的根目录首页 `docs/index.md` 例外）。由此有两条纪律：

- 任何构建/部署路径都必须先执行 `node scripts/auto-index.mjs`。走 `npm run docs:dev` / `npm run docs:build` 会自动执行；直接敲 `vitepress dev docs` 不会，结果是缺导读页，并且 `check-links.mjs` 会把所有目录链接都报成死链。
- 想改导读页的样式或结构，请改 `scripts/auto-index.mjs`（或速览表组件 `DirectoryTree`），不要手改某个 `index.md`，下次构建就会被覆盖。

### 4. 创建新笔记的注意事项
请确保新的 `.md` 文件放置在正确的顶级分类目录（如 `01-计算机与IT技术` 或 `02-驾考交规`）下。保存后，系统的自动化脚本会为您实时更新该板块的数据统计与目录导航。