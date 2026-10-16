// docs/.vitepress/theme/tree.data.mts
// 🌳 全站笔记清单（VitePress Data Loader）
// 构建期一次性产出所有目录/笔记的元数据，供 DirectoryTree.vue 在浏览器端做
// 筛选 / 排序 / 分页。字数为 scripts/word-count.mjs 的同一口径；显示名复用
// scripts/scanner.mjs 的脱马甲 + 防重名逻辑，保证与自动生成的 markdown 列表完全一致。
import { createContentLoader } from 'vitepress'
import { createNameResolver } from '../../../scripts/scanner.mjs'
import { countWords } from '../../../scripts/word-count.mjs'

/** 表格一行：目录行（isDir）或笔记行 */
export interface TreeItem {
	/** VitePress 规范 URL，中文未编码（与站内搜索索引一致） */
	url: string
	/** 显示名（已脱马甲 + 防重名） */
	title: string
	/** 物理名（不含 .md / 目录尾斜杠），用于排序 */
	rawName: string
	/** 所属目录 URL，如 /01-计算机与IT技术/01-比特就业课/ */
	dir: string
	isDir: boolean
	/** 目录行：子树笔记数；笔记行：0 */
	noteCount: number
	/** 目录行：子树字数合计；笔记行：本篇字数 */
	wordCount: number
}

// 与 scripts/auto-index.mjs 提取大标题的正则保持一致（同款 /m，取最先出现的 # 标题）
const H1_RE = /^#\s+(.+)/m

const dirOf = (url: string): string => {
	const u = url.endsWith('/') ? url.slice(0, -1) : url
	const i = u.lastIndexOf('/')
	return i <= 0 ? '/' : u.slice(0, i + 1)
}

const rawNameOf = (url: string): string => {
	const u = url.endsWith('/') ? url.slice(0, -1) : url
	return u.slice(u.lastIndexOf('/') + 1)
}

export default createContentLoader('**/*.md', {
	// 需要读取原文：一是提取大标题，二是用统一口径算字数（frontmatter 里的
	// wordCount 是构建期 transformPageData 注入的，Data Loader 看不到）
	includeSrc: true,
	globOptions: {
		// ⚠️ 这里的 ignore 会覆盖 VitePress 默认的 node_modules/dist，必须自行补全
		ignore: [
			'**/node_modules/**',
			'**/dist/**',
			'**/.vitepress/**',
			'**/public/**',
		],
	},
	transform(raw): TreeItem[] {
		const items: TreeItem[] = []
		// 笔记行的大标题单独暂存，只参与名字解析，不随数据下发
		const headings = new Map<string, string>()

		for (const { url, src } of raw) {
			if (!src) continue
			const isDir = url.endsWith('/')
			const heading = src.match(H1_RE)?.[1]?.trim()
			const { wordCount } = countWords(src)

			if (heading && !isDir) headings.set(url, heading)

			items.push({
				url,
				title: '',
				rawName: rawNameOf(url),
				dir: dirOf(url),
				isDir,
				noteCount: isDir ? 0 : 1,
				wordCount: isDir ? 0 : wordCount,
			})
		}

		// 1. 按父目录分组，逐组复现 createNameResolver（与 auto-index 同源的防重名）
		const groups = new Map<string, TreeItem[]>()
		for (const it of items) {
			const list = groups.get(it.dir)
			if (list) list.push(it)
			else groups.set(it.dir, [it])
		}
		for (const group of groups.values()) {
			const resolver = createNameResolver(group.map((it) => it.rawName))
			for (const it of group) {
				// 目录行沿用 auto-index 的做法：不拿 index.md 里的大标题当名字
				it.title = resolver(it.rawName, it.isDir ? null : headings.get(it.url) ?? null)
			}
		}

		// 2. 目录行聚合子树统计（只统计笔记行）
		const notes = items.filter((it) => !it.isDir)
		for (const dir of items) {
			if (!dir.isDir) continue
			for (const note of notes) {
				if (!note.url.startsWith(dir.url)) continue
				dir.noteCount++
				dir.wordCount += note.wordCount
			}
		}

		return items
	},
})
