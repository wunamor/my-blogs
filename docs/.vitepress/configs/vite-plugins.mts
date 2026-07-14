// docs/.vitepress/configs/vite-plugins.mts
import Components from 'unplugin-vue-components/vite'

// 导出一个插件数组
export const vitePlugins = [
	Components({
		// 告诉插件，哪些目录下的组件需要自动按需注册
		dirs: ['.vitepress/components/algorithm/sort', '.vitepress/components/oj/leetcode'],
		// 允许在 Vue 文件和 Markdown 文件中生效
		include: [/\.vue$/, /\.vue\?vue/, /\.md$/],
		// 自动生成类型声明文件
		dts: '.vitepress/components.d.ts',
	}),

	// 💡 以后再有其他的 Vite 插件，直接往这个数组里加就行了，主配置文件零污染！
]
