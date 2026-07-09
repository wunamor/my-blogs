// .vitepress/config.mts
import { defineConfig } from 'vitepress'
import { fileURLToPath, URL } from 'node:url'

// 1. 导入自己写的 Markdown 插件
import { autoLinkKeywordsPlugin } from './plugins/markdown-glossary.mts'
import { autoDownloadPlugin } from './plugins/markdown-download.mts'
import { mathToolPlugin } from './plugins/markdown-math-tool.mts'

// 2. 导入刚才抽离的主题配置
import { themeConfig } from './configs/theme-config.mts'

export default defineConfig({
  lang: 'zh-CN', 
  title: "我的学习笔记",
  description: "记录驾考与编程知识",
  head: [
    ['link', { rel: 'icon', href: '/logo.png' }]
  ],
  cleanUrls: true, 
  lastUpdated: true,

  vite: {
    resolve: {
      alias: {
        // 核心魔法：以后代码里遇到 '@components'，就等同于指向当前目录下的 components 文件夹
        '@components': fileURLToPath(new URL('./components', import.meta.url))
      }
    }
  },

  // 核心 Markdown 渲染配置
  markdown: {
    config: (md) => {
      md.use(autoLinkKeywordsPlugin);
      md.use(autoDownloadPlugin);
      md.use(mathToolPlugin);
    },
    math: true 
  },

  // 直接挂载外部引入的主题配置
  themeConfig
})