// docs/.vitepress/plugins/glossary/glossary-scanner.mts
// 术语词典自动扫描引擎：在 config 加载时运行，按 glossary-scan.config.mts 的配置
// 从目录名 / 文件名 / 标题 / frontmatter 别名中提取关键词，产出与手写词典同构的 Record。
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { scanDir, stripNumericPrefix, matchAnyGlob, vitepressSlugify } from '../../../../scripts/scanner.mjs'
import { glossaryScanSources, glossaryGlobalOptions } from './glossary-scan.config.mts'
import type { GlossarySource } from './glossary-scan.config.mts'

// 当前文件位于 docs/.vitepress/plugins/glossary/，向上三级即 docs 根目录
const docsDir = fileURLToPath(new URL('../../../', import.meta.url))

interface RawEntry {
	key: string
	link: string
}

interface FileMeta {
	title: string | null
	aliases: string[]
	glossaryDisabled: boolean
	glossaryCustom: string[] | null
}

// 仅解析词典功能需要的少量 frontmatter 字段（title / aliases / glossary），手写极简 YAML
function parseFrontmatter(content: string): { meta: FileMeta; body: string } {
	const meta: FileMeta = { title: null, aliases: [], glossaryDisabled: false, glossaryCustom: null }
	const match = content.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?/)
	if (!match) return { meta, body: content }

	const body = content.slice(match[0].length)
	const lines = match[1].split(/\r?\n/)

	for (let i = 0; i < lines.length; i++) {
		const kv = lines[i].match(/^(title|aliases|glossary)\s*:\s*(.*)$/)
		if (!kv) continue
		const [, key, inline] = kv as [string, string, string]

		// 支持两种写法：行内 [a, b] 与下面的 "- a" 块列表
		let items: string[] = []
		let flagFalse = false
		if (inline.trim() === 'false') {
			flagFalse = true
		} else if (inline.trim().startsWith('[')) {
			items = inline
				.trim()
				.replace(/^\[|\]$/g, '')
				.split(',')
				.map((s) => s.trim().replace(/^["']|["']$/g, ''))
				.filter(Boolean)
		} else if (inline.trim() === '') {
			while (i + 1 < lines.length && /^\s+-\s+/.test(lines[i + 1])) {
				items.push(lines[++ i].trim().replace(/^-\s+/, '').replace(/^["']|["']$/g, ''))
			}
		} else {
			items = [inline.trim().replace(/^["']|["']$/g, '')]
		}

		if (key === 'title') meta.title = items[0] ?? null
		else if (key === 'aliases') meta.aliases.push(...items)
		else if (key === 'glossary') {
			if (flagFalse) meta.glossaryDisabled = true
			else meta.glossaryCustom = items
		}
	}
	return { meta, body }
}

// 清洗标题原文：去掉自定义锚点 {#id}、图片、链接括号、脚注引用，得到纯文本
function cleanHeadingText(raw: string): { text: string; customId: string | null } {
	let text = raw
	let customId: string | null = null
	const idMatch = text.match(/\s*\{#([^}\s]+)\}\s*$/)
	if (idMatch) {
		customId = idMatch[1]
		text = text.replace(idMatch[0], '')
	}
	text = text
		.replace(/!\[[^\]]*\]\([^)]*\)/g, '')
		.replace(/\[([^\]]*)\]\([^)]*\)/g, '$1')
		.replace(/\[\^[^\]]*\]/g, '')
		.trim()
	return { text, customId }
}

// 按行提取标题（跳过围栏代码块内部，避免把示例代码里的 # 当成标题）
function extractHeadings(body: string, maxLevel: number): { key: string; anchor: string }[] {
	const headings: { key: string; anchor: string }[] = []
	let inFence = false
	for (const line of body.split(/\r?\n/)) {
		if (/^(```|~~~)/.test(line.trim())) {
			inFence = !inFence
			continue
		}
		if (inFence) continue
		const h = line.match(/^(#{1,6})[ \t]+(\S.*)$/)
		if (!h) continue
		const level = h[1].length
		if (level > maxLevel) continue
		const { text, customId } = cleanHeadingText(h[2])
		if (!text) continue
		// 有些笔记的 h1 就是文件名本身（甚至带 .md 后缀），去尾 .md 后即可与文件级词条自动去重
		const key = stripNumericPrefix(text).replace(/\.md$/, '')
		if (!key) continue
		headings.push({
			key,
			anchor: customId ?? vitepressSlugify(text),
		})
	}
	return headings
}

// 递归收集目录下（或仅第一层子目录）的候选 md 文件
function collectEntries(source: GlossarySource): RawEntry[] {
	const absRoot = path.join(docsDir, source.dir)
	if (!fs.existsSync(absRoot)) {
		console.warn(`[glossary] 配置目录不存在，已跳过：docs/${source.dir}`)
		return []
	}

	const entries: RawEntry[] = []
	const baseExclude = ['index.md', 'images', '.*', ...(source.exclude ?? [])]
	const linkRel = (rel: string) => `/${rel}`

	// 模式 A：仅收录直接子文件夹，链接指向子目录导读页
	if (source.scope === 'dirs') {
		const { directories } = scanDir(absRoot, ['*'])
		for (const sub of directories) {
			if (matchAnyGlob(sub, baseExclude)) continue
			const key = stripNumericPrefix(sub)
			entries.push({ key, link: `${linkRel(path.join(source.dir, sub).split(path.sep).join('/'))}/` })
		}
		return entries
	}

	// 模式 B：递归收录所有 md 文件（文件级词条 + 标题锚点词条 + 别名）
	const walk = (absDir: string, relDir: string) => {
		const { directories, files } = scanDir(absDir, ['*'])
		for (const file of files) {
			if (!file.endsWith('.md') || matchAnyGlob(file, baseExclude)) continue
			if (source.include?.length && !matchAnyGlob(file, source.include)) continue

			const relNoExt = path.join(relDir, file).split(path.sep).join('/').replace(/\.md$/, '')
			const content = fs.readFileSync(path.join(absDir, file), 'utf-8')
			const { meta, body } = parseFrontmatter(content)
			if (meta.glossaryDisabled) continue

			// 文件级关键词：frontmatter title > 脱马甲文件名
			const fileKey = meta.title ?? stripNumericPrefix(path.basename(file, '.md'))
			const fileLink = linkRel(relNoExt)
			if (meta.glossaryCustom) {
				for (const kw of meta.glossaryCustom) entries.push({ key: kw, link: fileLink })
			} else if (fileKey) {
				entries.push({ key: fileKey, link: fileLink })
			}
			for (const alias of meta.aliases) entries.push({ key: alias, link: fileLink })

			// 标题级关键词：h1~hN → /路径#锚点
			if (source.headings) {
				for (const { key, anchor } of extractHeadings(body, source.headings)) {
					entries.push({ key, link: `${fileLink}#${anchor}` })
				}
			}
		}
		for (const sub of directories) {
			if (matchAnyGlob(sub, baseExclude)) continue
			walk(path.join(absDir, sub), path.join(relDir, sub))
		}
	}
	walk(absRoot, source.dir)
	return entries
}

// 全局过滤：最小长度 + 停用词（只约束自动词条，手写层在 glossary-data.mts 中永远放行）
function passesFilter(key: string, source: GlossarySource): boolean {
	const minLen = source.minKeywordLength ?? glossaryGlobalOptions.minKeywordLength
	if (!key || key.length < minLen) return false
	if (glossaryGlobalOptions.stopWords.includes(key)) return false
	return true
}

function buildScannedGlossary(): Record<string, string> {
	const result: Record<string, string> = {}
	// 优先级从高到低；同优先级按配置声明顺序，先声明者胜（Array.sort 稳定）
	const orderedSources = [...glossaryScanSources].sort(
		(a, b) => (b.priority ?? 0) - (a.priority ?? 0),
	)

	for (const source of orderedSources) {
		for (const { key, link } of collectEntries(source)) {
			if (!passesFilter(key, source)) continue
			const existing = result[key]
			if (existing !== undefined) {
				// 指向同一页面（仅锚点有无不同）的重复收录静默跳过
				if (existing === link || link.startsWith(`${existing}#`) || existing.startsWith(`${link}#`)) continue
				console.warn(`[glossary] 关键词撞车：「${key}」保留 "${existing}"，忽略 "${link}"`)
				continue
			}
			result[key] = link
		}
	}
	return result
}

export const scannedGlossary: Record<string, string> = buildScannedGlossary()
