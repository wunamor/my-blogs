// docs/.vitepress/configs/page-transform.mts
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import type { PageData } from 'vitepress'
import { countWords } from '../../../scripts/word-count.mjs'

export function transformPageData(pageData: PageData) {
	// 💡 核心陷阱修复：因为当前文件在 configs/ 下，所以要往上跳两级（../../）才能到达 docs 根目录
	const docsDir = fileURLToPath(new URL('../../', import.meta.url))
	const absoluteFilePath = path.join(docsDir, pageData.filePath)

	if (!fs.existsSync(absoluteFilePath)) return

	const content = fs.readFileSync(absoluteFilePath, 'utf-8')

	// ⚠️ 字数口径与 scripts/word-count.mjs 保持唯一，勿在本地私自调整
	const { wordCount, readTime } = countWords(content)

	return {
		frontmatter: {
			...pageData.frontmatter,
			wordCount: wordCount,
			readTime: readTime,
		},
	}
}
