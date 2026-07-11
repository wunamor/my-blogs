// .vitepress/config.mts
import { defineConfig } from 'vitepress'
import fs from 'fs'
import path from 'path'
import { fileURLToPath, URL } from 'url'

// 1. 导入自己写的 Markdown 插件
import { autoLinkKeywordsPlugin } from './plugins/markdown-glossary.mts'
import { autoDownloadPlugin } from './plugins/markdown-download.mts'
import { mathToolPlugin } from './plugins/markdown-math-tool.mts'
// 💡 从统一的插件文件中引入语法糖合集
import { syntaxSugarPlugin } from './plugins/markdown-syntax-sugar.mts'


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

  // 💡 VitePress 提供的页面数据转换钩子，在编译每一个 Markdown 文件时都会触发
  transformPageData(pageData) {
    const docsDir = fileURLToPath(new URL('../', import.meta.url))
    const absoluteFilePath = path.join(docsDir, pageData.filePath)
    
    if (!fs.existsSync(absoluteFilePath)) return

    let content = fs.readFileSync(absoluteFilePath, 'utf-8')
    
    // 1. 暴力清洗：提前剔除大块的非阅读区域，防止里面的单词被误算
    content = content
      .replace(/---[\s\S]*?---/, '')     // 移除 Frontmatter 头部配置
      // .replace(/```[\s\S]*?```/g, '')    // 移除大块的代码块
      // .replace(/`.*?`/g, '')             // 移除行内代码
      .replace(/\$\$[\s\S]*?\$\$/g, '')  // 移除 LaTeX 块级公式
      .replace(/\$.*?\$/g, '')           // 移除 LaTeX 行内公式
      .replace(/<[^>]+>/g, '')           // 移除 HTML 标签 (比如 <Spoiler>)

    // 2. 正向匹配：精准抓取中文汉字
    // [\u4e00-\u9fa5] 是标准中文字符集，完全不包含中文标点符号！
    const cnMatches = content.match(/[\u4e00-\u9fa5]/g) || []
    const cnCount = cnMatches.length

    // 3. 正向匹配：精准抓取英文单词和数字
    // [a-zA-Z0-9]+ 会把连续的英文字母或数字当成一个整体（例如 "world" 算 1 个，"123" 算 1 个）
    // 且完美过滤掉了所有的英文标点、空格、Markdown 特殊符号（如 #, *, > 等）
    const enMatches = content.match(/[a-zA-Z0-9]+/g) || []
    const enCount = enMatches.length

    // 4. 合并总字数
    const wordCount = cnCount + enCount
    
    // 阅读时间：按每分钟阅读 150 字算，至少显示 1 分钟
    const readTime = Math.ceil(wordCount / 150) || 1

    return {
      frontmatter: {
        ...pageData.frontmatter,
        wordCount: wordCount,
        readTime: readTime
      }
    }
  },

  // 核心 Markdown 渲染配置
  markdown: {
    config: (md) => {
      md.use(autoLinkKeywordsPlugin);
      md.use(autoDownloadPlugin);
      md.use(mathToolPlugin);
      md.use(syntaxSugarPlugin);
    },
    math: true 
  },

  // 直接挂载外部引入的主题配置
  themeConfig
})