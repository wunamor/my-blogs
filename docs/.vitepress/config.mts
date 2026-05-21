import { defineConfig } from 'vitepress'
import { generateSidebar } from 'vitepress-sidebar'
// 👇 引入上一层 scripts 文件夹里的扫描器
import { scanDir } from '../../scripts/scanner.mjs' 

// 👇 自动生成导航栏的函数
function autoGetNavs() {
  // 定义规则：匹配所有，排除隐藏文件夹、public资源库、以及可能的零散文件
  const rules = ['*', '!.*', '!public'];
  
  // 一行代码搞定！
  const { directories } = scanDir('docs', rules);
  
  return [
    { text: '首页', link: '/' },
    // 遍历获取到的文件夹，生成路由
    ...directories.map(dir => ({
      text: dir,
      link: `/${dir}/`
    }))
  ];
}

export default defineConfig({
  lang: 'zh-CN', 
  title: "我的学习笔记",
  description: "记录驾考与编程知识",
  head: [
    ['link', { rel: 'icon', href: '/logo.png' }]
  ],
  cleanUrls: true, 
  lastUpdated: true,
  
  themeConfig: {
    nav: autoGetNavs(),

    lastUpdated: {
      text: '最后更新于',
      formatOptions: {
        dateStyle: 'short', // 显示为：2026/05/13
        timeStyle: 'short'  // 显示为：晚上11:14
      }
    },

    sidebar: generateSidebar({
      documentRootPath: 'docs',
      useTitleFromFileHeading: true,
      collapsed: true,
      sortMenusByFrontmatterOrder: true
    }),

    search: {
      provider: 'local',
      options: {
        translations: {
          button: {
            buttonText: '搜索文档',
            buttonAriaLabel: '搜索文档'
            
          },
          modal: {
            noResultsText: '无法找到相关结果',
            resetButtonTitle: '清除查询条件',
            footer: {
              selectText: '选择',
              navigateText: '切换',
              closeText: '关闭'
            }
          }
        }
      }
    },

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
    },

    
    footer: {
      message: `
        <a href="https://beian.miit.gov.cn/#/Integrated/index" target="_blank" style="margin-right: 15px; color: #888; text-decoration: none;">浙ICP备2026033572号-1</a>
        <a href="https://beian.mps.gov.cn/#/query/webSearch?code=33078402101562"  target="_blank" style="color: #888; text-decoration: none; display: inline-flex; align-items: center;">
          <img src="/beian.png" style="width: 16px; height: 16px; margin-right: 5px;">
          浙公网安备33078402101562号
        </a>`,
      copyright: 'Copyright © 2026 wunamor'
    },
  }
})