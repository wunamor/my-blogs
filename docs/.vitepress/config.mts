// .vitepress/config.mts
import { defineConfig } from 'vitepress'

// 1. 导入自己写的 Markdown 插件
import { autoLinkKeywordsPlugin } from './plugins/markdown-glossary.mts'
import { autoDownloadPlugin } from './plugins/markdown-download.mts'

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

  // 核心 Markdown 渲染配置
  markdown: {
    config: (md) => {
      md.use(autoLinkKeywordsPlugin);
      md.use(autoDownloadPlugin);
    },
    math: true 
  },

  // 直接挂载外部引入的主题配置
  themeConfig
})