import { defineConfig } from 'vitepress'
import { generateSidebar } from 'vitepress-sidebar'

export default defineConfig({
  lang: 'zh-CN', // 👉 强烈建议加上这一行！告诉浏览器这是中文网站，防止弹跳出“是否翻译”的提示
  title: "我的学习笔记",
  description: "记录驾考与编程知识",
  cleanUrls: true, 
  
  themeConfig: {
    nav: [
      { text: '首页', link: '/' },
      { text: '驾考交规', link: '/驾考交规/' } // 直接指向文件夹即可
    ],

    sidebar: generateSidebar({
      documentRootPath: 'docs',
      useTitleFromFileHeading: true,
      collapsed: true,
      sortMenusByFrontmatterOrder: true
    }),

    // 👇 从这里开始，把下面的代码全部加到 themeConfig 里面

    // 1. 汉化外观/主题切换按钮
    darkModeSwitchLabel: '外观',
    lightModeSwitchTitle: '切换到浅色模式',
    darkModeSwitchTitle: '切换到深色模式',
    sidebarMenuLabel: '菜单', // 移动端显示的菜单文字
    returnToTopLabel: '返回顶部', // 移动端显示的回到顶部文字

    // 2. 汉化 404 页面
    notFound: {
      title: '页面找不到了',
      quote: '糟糕，你似乎来到了没有知识存在的荒原...', // 这里可以随便写你想吐槽的句子
      linkText: '带我回首页'
    },

    // 3. 强烈推荐顺手汉化的部分：文章底部的翻页和右侧大纲
    docFooter: {
      prev: '上一篇',
      next: '下一篇'
    },
    outline: {
      label: '本页目录', // 右侧悬浮大纲的标题
      level: 'deep'      // 自动提取文章里的所有二级、三级标题
    }
  }
})