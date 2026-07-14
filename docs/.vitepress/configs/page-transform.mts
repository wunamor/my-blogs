// docs/.vitepress/configs/page-transform.mts
import fs from 'fs'
import path from 'path'
import { fileURLToPath, URL } from 'url'
import type { PageData } from 'vitepress'

export function transformPageData(pageData: PageData) {
	// 💡 核心陷阱修复：因为当前文件在 configs/ 下，所以要往上跳两级（../../）才能到达 docs 根目录
	const docsDir = fileURLToPath(new URL('../../', import.meta.url))
	const absoluteFilePath = path.join(docsDir, pageData.filePath)

	if (!fs.existsSync(absoluteFilePath)) return

	let content = fs.readFileSync(absoluteFilePath, 'utf-8')

	// 1. 暴力清洗：提前剔除大块的非阅读区域，防止里面的单词被误算
	content = content
		.replace(/---[\s\S]*?---/, '') // 移除 Frontmatter 头部配置
		// .replace(/```[\s\S]*?```/g, '')    // 移除大块的代码块
		// .replace(/`.*?`/g, '')             // 移除行内代码
		.replace(/\$\$[\s\S]*?\$\$/g, '') // 移除 LaTeX 块级公式
		.replace(/\$.*?\$/g, '') // 移除 LaTeX 行内公式
		.replace(/<[^>]+>/g, '') // 移除 HTML 标签 (比如 <Spoiler>)

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
			readTime: readTime,
		},
	}
}
