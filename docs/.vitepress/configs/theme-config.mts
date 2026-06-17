// .vitepress/configs/theme.mts
import type { DefaultTheme } from 'vitepress'
import { generateSidebar } from 'vitepress-sidebar'
// ⚠️ 注意这里的路径变成了三个 ../
import { scanDir, createNameResolver } from '../../../scripts/scanner.mjs'

// 👇 自动生成导航栏的函数
function autoGetNavs() {
  const rules = ['*', '!.*', '!public'];
  const { directories } = scanDir('docs', rules);
  return [
    { text: '首页', link: '/' },
    ...directories.map(dir => ({
      text: dir.replace(/^(\d+-)+/, ''),
      link: `/${dir}/`
    }))
  ];
}

// 👇 共用引擎的侧边栏清洗器
function cleanSidebar(sidebarItems: any) {
  if (!Array.isArray(sidebarItems)) return sidebarItems;
  const currentLevelNames = sidebarItems.map(item => item.text).filter(Boolean);
  const resolver = createNameResolver(currentLevelNames);

  return sidebarItems.map(item => {
    const newItem = { ...item };
    if (newItem.text) {
      newItem.text = resolver(newItem.text);
    }
    if (newItem.items) {
      newItem.items = cleanSidebar(newItem.items);
    }
    return newItem;
  });
}

// 👇 导出整个主题配置对象（加上类型注解，写配置时有完美的代码提示！）
export const themeConfig: DefaultTheme.Config = {
  nav: autoGetNavs(),

  lastUpdated: {
    text: '最后更新于',
    formatOptions: {
      dateStyle: 'short',
      timeStyle: 'short'
    }
  },

  socialLinks: [
    { icon: 'github', link: 'https://github.com/wunamor/my-blogs' },
  ],

  sidebar: cleanSidebar(generateSidebar({
    documentRootPath: 'docs',
    useTitleFromFileHeading: true,
    collapsed: true,
    sortMenusByFrontmatterOrder: true
  })),

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

  darkModeSwitchLabel: '外观',
  lightModeSwitchTitle: '切换到浅色模式',
  darkModeSwitchTitle: '切换到深色模式',
  sidebarMenuLabel: '菜单',
  returnToTopLabel: '返回顶部',

  notFound: {
    title: '页面找不到了',
    quote: '糟糕，你似乎来到了没有知识存在的荒原...', 
    linkText: '带我回首页'
  },

  docFooter: {
    prev: '上一篇',
    next: '下一篇'
  },
  
  outline: {
    label: '本页目录',
    level: 'deep'
  },

  footer: {
    message: `
      <a href="https://beian.miit.gov.cn/#/Integrated/index" target="_blank" style="margin-right: 15px; color: #888; text-decoration: none;">浙ICP备2026033572号-1</a>
      <a href="https://beian.mps.gov.cn/#/query/webSearch?code=33078402101562"  target="_blank" style="color: #888; text-decoration: none; display: inline-flex; align-items: center;">
        <img src="/beian.png" style="width: 16px; height: 16px; margin-right: 5px;">
        浙公网安备33078402101562号
      </a>`,
    copyright: 'Copyright © 2026 wunamor'
  }
}