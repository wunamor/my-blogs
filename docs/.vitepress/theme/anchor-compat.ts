// .vitepress/theme/anchor-compat.ts
// 💡 运行时锚点兜底层（浏览器端）：
// 构建期兼容层(obsidian-anchor-compat.mts)只能改写“同一页面内”的锚点；跨页锚点、
// 以及连 slugify 都救不回的模糊锚点（如 Obsidian 生成的 #u-update更新），由这里在
// 页面渲染后自愈：对 hash 与本页所有 heading 做“激进归一化”比对（剥 Markdown、
// 忽略大小写、剔除一切非 [0-9a-z汉字] 字符），命中即滚动并修正 URL。
// 正文因此可保持 Obsidian 原生写法，两端(Obsidian/VitePress)均可跳转。

// 与 scripts/check-links.mjs 中的 aggressive() 保持同一算法
const aggressiveNormalize = (s: string): string =>
  s
    .normalize('NFKD')
    .toLowerCase()
    .replace(/!?\[([^\]]*)\]\([^)]*\)/g, '$1')
    .replace(/\[([^\]]*)\]/g, '$1')
    .replace(/[^0-9a-z\u4e00-\u9fff]+/g, '')

const safeDecode = (s: string): string => {
  try {
    return decodeURIComponent(s)
  } catch {
    return s
  }
}

const HEADING_SELECTOR =
  '.vp-doc h1[id], .vp-doc h2[id], .vp-doc h3[id], .vp-doc h4[id], .vp-doc h5[id], .vp-doc h6[id]'

function findByFrag(frag: string): HTMLElement | null {
  const direct = document.getElementById(frag)
  if (direct) return direct
  const target = aggressiveNormalize(frag)
  if (!target) return null
  for (const el of Array.from(document.querySelectorAll<HTMLElement>(HEADING_SELECTOR))) {
    if (aggressiveNormalize(el.textContent || '') === target) return el
  }
  return null
}

function scrollToResolved(frag: string): boolean {
  if (typeof document === 'undefined') return false
  if (!frag) return false
  if (document.getElementById(frag)) return true // 原生能命中，不干预
  const el = findByFrag(frag)
  if (!el) return false
  el.scrollIntoView()
  try {
    window.history.replaceState(null, '', `#${el.id}`)
  } catch {
    /* ignore */
  }
  return true
}

// SPA 路由切换后（含跨页锚点跳转）自愈当前地址栏 hash
export function fixHashAnchors(): void {
  if (typeof window === 'undefined') return
  requestAnimationFrame(() => {
    const raw = window.location.hash
    if (!raw || raw.length < 2) return
    scrollToResolved(safeDecode(raw.slice(1)))
  })
}

// 同页直接点击 `#奇怪锚点`：VitePress 原生解析不到时会滚回页顶，这里拦截并纠正
let clickAttached = false
export function attachClickFallback(): void {
  if (typeof document === 'undefined' || clickAttached) return
  clickAttached = true
  document.addEventListener('click', (e) => {
    const anchor = (e.target as Element | null)?.closest?.('a') as HTMLAnchorElement | null
    if (!anchor) return
    const href = anchor.getAttribute('href')
    if (!href || !href.startsWith('#') || href.length < 2) return
    const frag = safeDecode(href.slice(1))
    if (document.getElementById(frag)) return
    if (scrollToResolved(frag)) e.preventDefault()
  })
}

// 包裹 VitePress 客户端路由器的路由完成钩子（保留既有钩子，防 HMR 重复包裹）
let routerPatched = false
export function patchRouter(router: unknown): void {
  if (typeof window === 'undefined' || !router || routerPatched) return
  const r = router as Record<string, any>
  routerPatched = true
  const orig = r.onAfterRouteChange
  r.onAfterRouteChange = async (...args: unknown[]) => {
    await (typeof orig === 'function' ? orig(...args) : undefined)
    fixHashAnchors()
  }
}
