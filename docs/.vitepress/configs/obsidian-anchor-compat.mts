// .vitepress/configs/obsidian-anchor-compat.mts
// 💡 兼容层：Obsidian 的“复制标题链接”生成的是【原始标题文本】锚点（甚至可能把整段
// Markdown 语法嵌进锚点里），而 VitePress 页面里 heading 的真实 id 是 slugify 后的结果。
// 本规则在渲染前扫描所有指向【本页】的锚点链接——包括 `#xxx` 与 `./本文件.md#xxx`
// 两种写法，按 VitePress 的 id 算法归一化命中后，统一重写成正确的 `#slug`。
//
// id 算法与 vitepress/dist/node (resolveTitleFromToken + slugify) 及 scripts/scanner.mjs 保持一致：
//   id = {#自定义id} 优先，否则 = slugify(标题纯文本)，重复标题追加 -N
import type MarkdownIt from 'markdown-it'

const rControl = /[\u0000-\u001f]/g
const rSpecial = /[\s~`!@#$%^&*()\-_+=[\]{}|\\;:"'“”‘’<>,.?/]+/g
const rCombining = /[\u0300-\u036F]/g

const vitepressSlugify = (str: string): string =>
  str
    .normalize('NFKD')
    .replace(rCombining, '')
    .replace(rControl, '')
    .replace(rSpecial, '-')
    .replace(/-{2,}/g, '-')
    .replace(/^-+|-+$/g, '')
    .replace(/^(\d)/, '_$1')
    .toLowerCase()

// 把锚点里可能存在的 Markdown 残留（链接/加粗/行内代码）剥掉，还原成人眼看到的标题文字
const stripMarkdown = (s: string): string =>
  s
    .replace(/!?\[([^\]]*)\]\([^)]*\)/g, '$1')
    .replace(/\[([^\]]*)\]/g, '$1')
    .replace(/[`*_]/g, '')
    .trim()

const safeDecode = (s: string): string => {
  try {
    return decodeURIComponent(s)
  } catch {
    return s
  }
}

// 把链接路径解析成“站点相对路径”（与 vitepress env.relativePath 同口径，统一正斜杠）
const resolveSitePath = (pageDir: string, rawPath: string): string => {
  const p = safeDecode(rawPath).replace(/\\/g, '/')
  const segs = p.startsWith('/') ? p.slice(1).split('/') : [...(pageDir ? pageDir.split('/') : []), ...p.split('/')]
  const stack: string[] = []
  for (const s of segs) {
    if (!s || s === '.') continue
    if (s === '..') stack.pop()
    else stack.push(s)
  }
  return stack.join('/')
}

export const obsidianAnchorCompat = (md: MarkdownIt): void => {
  // 用 ruler.push 保证排在 markdown.config 里先注册的内核规则(如 attrs)之后
  md.core.ruler.push('obsidian-anchor-compat', (state) => {
    const tokens = state.tokens

    // 1️⃣ 收集本页所有标题的真实 id（镜像 VitePress 的取值顺序与去重规则）
    const ids = new Set<string>()
    const counts = new Map<string, number>()
    for (let i = 0; i < tokens.length; i++) {
      const t = tokens[i]
      if (t.type !== 'heading_open') continue

      let base = t.attrGet('id') || ''
      if (!base) {
        const inline = tokens[i + 1]
        const children = (inline && inline.children) || []
        const title = children
          .filter((c) => c.type === 'text' || c.type === 'code_inline')
          .map((c) => c.content)
          .join('')
          .trim()
        base = vitepressSlugify(title)
      }

      const seen = counts.get(base) || 0
      counts.set(base, seen + 1)
      if (seen > 0) base = `${base}-${seen}`
      ids.add(base)
    }

    const relativePath: string = (state.env && (state.env as any).relativePath) || ''
    const pageDir = relativePath.split('/').slice(0, -1).join('/')
    const pageFile = relativePath.replace(/\.md$/i, '')

    // 2️⃣ 改写指向本页的锚点链接（`#x` 与 `./本文件.md#x` 两种写法）
    // 注意：link_open 藏在每个 inline token 的 children 里，必须下钻遍历
    for (const block of tokens) {
      const children = block.type === 'inline' ? block.children || [] : []
      for (const t of children) {
        if (t.type !== 'link_open') continue
        const href = t.attrGet('href') || ''
        if (!href) continue
        const hashAt = href.indexOf('#')
        if (hashAt < 0) continue

        let isSelfPage: boolean
        const pathPart = href.slice(0, hashAt)
        const frag = href.slice(hashAt + 1)
        if (hashAt === 0) isSelfPage = true
        else if (!relativePath) continue
        else {
          const resolved = resolveSitePath(pageDir, pathPart)
          isSelfPage = resolved === pageFile || resolved === relativePath
        }
        if (!isSelfPage || !frag) continue

        if (ids.has(frag)) {
          t.attrSet('href', `#${frag}`) // 同文件相对写法 → 收敛为纯页内锚点
          continue
        }
        const cand = vitepressSlugify(stripMarkdown(safeDecode(frag)))
        if (cand && ids.has(cand)) {
          t.attrSet('href', `#${cand}`)
        }
      }
    }
  })
}
