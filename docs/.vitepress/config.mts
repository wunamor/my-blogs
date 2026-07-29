// .vitepress/config.mts
import { defineConfig } from 'vitepress'
import { fileURLToPath, URL } from 'url'

// 💡 导入各种抽离出来的配置和逻辑
import { vitePlugins } from './configs/vite-plugins.mts'
import { themeConfig } from './configs/theme-config.mts'
import { transformPageData } from './configs/page-transform.mts'

// 导入自己写的 Markdown 插件
import { autoLinkKeywordsPlugin } from './plugins/markdown-glossary.mts'
import { autoDownloadPlugin } from './plugins/markdown-download.mts'
import { mathToolPlugin } from './plugins/markdown-math-tool.mts'
// 💡 从统一的插件文件中引入语法糖合集
import { syntaxSugarPlugin } from './plugins/markdown-syntax-sugar.mts'
import { imageCaptionPlugin } from './plugins/markdown-image-caption.mts'
import { codeToolPlugin } from './plugins/markdown-code-tool.mts'

export default defineConfig({
	lang: 'zh-CN',
	title: '我的学习笔记',
	description: '记录驾考与编程知识',
	head: [['link', { rel: 'icon', href: '/logo.png' }]],
	cleanUrls: true,
	lastUpdated: true,

	vite: {
		plugins: vitePlugins,
		resolve: {
			alias: {
				// 核心魔法：以后代码里遇到 '@components'，就等同于指向当前目录下的 components 文件夹
				'@components': fileURLToPath(new URL('./components', import.meta.url)),
			},
		},
	},

	// 💡 VitePress 提供的页面数据转换钩子，在编译每一个 Markdown 文件时都会触发
	transformPageData,

	// 核心 Markdown 渲染配置
	markdown: {
		config: (md) => {
			md.use(autoLinkKeywordsPlugin)
			md.use(autoDownloadPlugin)
			md.use(mathToolPlugin)
			md.use(syntaxSugarPlugin)
			md.use(imageCaptionPlugin)
			md.use(codeToolPlugin)
		},
		math: true,
	},

	// 直接挂载外部引入的主题配置
	themeConfig,
})
