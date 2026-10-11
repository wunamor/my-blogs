// scripts/check-links.mjs
// 💡 检测层：全站 Markdown 链接体检（VitePress 官方死链检查只看“页面存在性”，
// 不校验页内/跨页的 #锚点，Obsidian 风格的原始标题锚点正是漏网之鱼）。
// 用法:  node scripts/check-links.mjs [--strict]
//   默认只报告不阻断(exit 0)；--strict 时存在 ERROR 才返回非零，方便未来接入 CI。
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { vitepressSlugify } from './scanner.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const docsDir = path.resolve(__dirname, '../docs');
const SKIP_DIRS = new Set(['.vitepress', 'node_modules', 'public', 'images', 'dist', '.obsidian', 'test']);

const STRICT = process.argv.includes('--strict');

// ---------- 工具 ----------
const stripMarkdown = (s) =>
  s.replace(/!?\[([^\]]*)\]\([^)]*\)/g, '$1').replace(/\[([^\]]*)\]/g, '$1').replace(/[`*_]/g, '').trim();

const safeDecode = (s) => {
  try { return decodeURIComponent(s); } catch { return s; }
};

// 与 theme/anchor-compat.ts 同一算法：激进归一化（运行时兜底层的匹配规则）
const aggressive = (s) =>
  s.normalize('NFKD').toLowerCase()
    .replace(/!?\[([^\]]*)\]\([^)]*\)/g, '$1')
    .replace(/\[([^\]]*)\]/g, '$1')
    .replace(/[^0-9a-z\u4e00-\u9fff]+/g, '');

// 链接提取（按行匹配；行内 code span 中命中概率低，接受该简化）
const LINK_RE = /(!?)\[(?:[^\]]*)\]\(\s*(?:<([^<>\n]*)>|([^\s()]*(?:\([^)\s]*\))?))\s*(?:\s+"[^"]*")?\)/g;
const WIKILINK_RE = /(?<!!)\[\[[^\]|\n]*\]\]/g;
const EMBED_RE = /!\[\[[^\]|\n]*\]\]/g;
const EXTERNAL_RE = /^[a-z][a-z0-9+.-]*:/i;

// ---------- 解析单文件的标题信息（镜像 VitePress: {#id} > slugify(标题) > 重复追加 -N） ----------
// 返回 { ids:Set(真实DOM id), aggr:Set(标题的激进归一化形态) } | null
const headingCache = new Map(); // absMdPath -> page data
function parseHeadings(absMdPath) {
  if (headingCache.has(absMdPath)) return headingCache.get(absMdPath);
  if (!fs.existsSync(absMdPath)) { headingCache.set(absMdPath, null); return null; }
  const lines = fs.readFileSync(absMdPath, 'utf-8').split(/\r?\n/);
  const ids = new Set();
  const aggr = new Set();
  const counts = new Map();
  let inFence = false;
  let inFront = lines[0] === '---' ? 1 : 0;
  for (const line of lines) {
    if (inFront === 1) { if (line === '---') inFront = 0; continue; }
    if (/^\s*(```|~~~)/.test(line)) { inFence = !inFence; continue; }
    if (inFence) continue;
    const m = line.match(/^(#{1,6})\s+(.+?)\s*$/);
    if (!m) continue;
    let title = m[2];
    let id = null;
    const custom = title.match(/\s*\{#([^}]+)\}\s*$/);
    if (custom) { id = custom[1]; title = title.slice(0, custom.index); }
    aggr.add(aggressive(title));
    if (!id) id = vitepressSlugify(stripMarkdown(title));
    const seen = counts.get(id) || 0;
    counts.set(id, seen + 1);
    if (seen > 0) id = `${id}-${seen}`;
    ids.add(id);
  }
  const page = { ids, aggr };
  headingCache.set(absMdPath, page);
  return page;
}

// 锚点判定分级：
//   exact   精确命中 DOM id（原生可用）
//   build   构建期兼容层可改写（仅同页/同文件链接）
//   runtime 运行时兜底层可自愈（theme/anchor-compat.ts 的激进归一化匹配）
function anchorOk(anchor, page) {
  const raw = anchor.startsWith('#') ? anchor.slice(1) : anchor;
  if (!raw) return { level: 'exact' };
  if (!page) return { level: null };
  if (page.ids.has(raw)) return { level: 'exact' };
  const norm = vitepressSlugify(stripMarkdown(safeDecode(raw)));
  if (norm && page.ids.has(norm)) return { level: 'build' };
  const ag = aggressive(safeDecode(raw));
  if (ag && page.aggr.has(ag)) return { level: 'runtime' };
  return { level: null };
}

// 解析链接目标文件(支持 cleanUrl 与 public 资源): 返回绝对路径或 null
function resolveTarget(fromFile, p) {
  if (p.startsWith('/')) {
    const abs = path.join(docsDir, safeDecode(p));
    const viaPublic = path.join(docsDir, 'public', safeDecode(p));
    for (const c of [abs, viaPublic]) {
      for (const cand of [c, c + '.md', path.join(c, 'index.md')]) {
        if (fs.existsSync(cand)) return cand;
      }
    }
    return null;
  }
  const abs = path.resolve(path.dirname(fromFile), safeDecode(p));
  for (const cand of [abs, abs + '.md', path.join(abs, 'index.md')]) {
    if (fs.existsSync(cand)) return cand;
  }
  return null;
}

// ---------- 扫描 ----------
const errors = [];      // 真·无法解析，需人工处理
const rewritten = [];   // 构建期兼容层自动改写（同页/同文件锚点）
const runtimeOk = [];   // 运行时兜底层自动适配（跨页锚点、模糊锚点）
const backslashOk = []; // 反斜杠式资源链接（归一化后目标存在，依赖主机路径兼容）
const notices = [];

function checkFile(absMdPath) {
  const rel = path.relative(docsDir, absMdPath).replace(/\\/g, '/');
  const page = parseHeadings(absMdPath);
  const lines = fs.readFileSync(absMdPath, 'utf-8').split(/\r?\n/);
  let inFence = false;
  let inFront = lines[0] === '---' ? 1 : 0;

  for (let ln = 0; ln < lines.length; ln++) {
    const line = lines[ln];
    if (inFront === 1) { if (line === '---') inFront = 0; continue; }
    if (/^\s*(```|~~~)/.test(line)) { inFence = !inFence; continue; }
    if (inFront || inFence) continue;

    const wl = line.match(WIKILINK_RE);
    if (wl) notices.push(`WARN ${rel}:${ln + 1} Obsidian wikilink（VitePress 不渲染）: ${wl.join(' ')}`);
    const em = line.match(EMBED_RE);
    if (em) notices.push(`WARN ${rel}:${ln + 1} Obsidian embed（VitePress 不渲染）: ${em.join(' ')}`);

    LINK_RE.lastIndex = 0;
    let m;
    while ((m = LINK_RE.exec(line)) !== null) {
      const isImage = m[1] === '!';
      const dest = m[2] ?? m[3] ?? '';
      if (!dest) continue;
      if (EXTERNAL_RE.test(dest) || dest.startsWith('//')) continue; // 外链放过
      if (dest.startsWith('#')) { // 页内锚点
        const r = anchorOk(dest, page);
        if (r.level === null) errors.push(`ERROR ${rel}:${ln + 1} 页内锚点无法解析: ${dest}`);
        else if (r.level === 'build') rewritten.push(`${rel}:${ln + 1} ${dest}`);
        else if (r.level === 'runtime') runtimeOk.push(`${rel}:${ln + 1} ${dest}`);
        continue;
      }
      const hashAt = dest.indexOf('#');
      const p = hashAt === -1 ? dest : dest.slice(0, hashAt);
      const anchor = hashAt === -1 ? '' : dest.slice(hashAt);
      if (!p) continue;
      const hasBackslash = p.includes('\\');
      const target = resolveTarget(absMdPath, hasBackslash ? p.replace(/\\/g, '/') : p);
      if (!target) {
        errors.push(`ERROR ${rel}:${ln + 1} ${isImage ? '图片' : '页面'}不存在${hasBackslash ? '（反斜杠归一化后仍未找到）' : ''}: ${p}`);
        continue;
      }
      if (hasBackslash && /\.(zip|rar|7z|tar|gz|pdf|xlsx?|docx?|pptx?|mp[34]|exe|apk|ipa)$/i.test(p)) {
        backslashOk.push(`${rel}:${ln + 1} ${p}`);
        continue; // 资源下载链接：目标存在即可，不再校验锚点
      }
      if (anchor && target.endsWith('.md')) {
        const r = anchorOk(anchor, parseHeadings(target));
        const selfFile = path.resolve(target) === path.resolve(absMdPath);
        if (r.level === null) {
          errors.push(`ERROR ${rel}:${ln + 1} ${selfFile ? '同文件' : '跨页'}锚点无法解析: ${p}${anchor}`);
        } else if (r.level === 'build' && selfFile) {
          rewritten.push(`${rel}:${ln + 1} ${p}${anchor}`);
        } else if (r.level !== 'exact') {
          runtimeOk.push(`${rel}:${ln + 1} ${p}${anchor}`);
        }
      }
    }
  }
}

// 递归遍历 docs
(function walk(dir) {
  for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
    if (ent.name.startsWith('.') && ent.name !== '.') continue;
    if (SKIP_DIRS.has(ent.name)) continue;
    const full = path.join(dir, ent.name);
    if (ent.isDirectory()) { walk(full); continue; }
    if (ent.isFile() && ent.name.endsWith('.md')) checkFile(full);
  }
})(docsDir);

// ---------- 报告 ----------
console.log(`🔗 check-links: 扫描完成`);
if (errors.length) { console.log(`\n❌ 需人工处理 (${errors.length}):`); errors.forEach((e) => console.log('  ' + e)); }
if (rewritten.length) { console.log(`\n🩹 构建期兼容层自动改写（同页/同文件锚点）(${rewritten.length}):`); rewritten.forEach((e) => console.log('  ' + e)); }
if (runtimeOk.length) { console.log(`\n🧭 运行时兜底层自动适配（跨页/模糊锚点，theme/anchor-compat.ts）(${runtimeOk.length}):`); runtimeOk.forEach((e) => console.log('  ' + e)); }
if (backslashOk.length) { console.log(`\n📦 反斜杠式资源下载链接（目标存在，依赖主机路径归一化，建议逐步换成正斜杠）(${backslashOk.length}):`); backslashOk.forEach((e) => console.log('  ' + e)); }
if (notices.length) { console.log(`\n⚠️ 其它提示 (${notices.length}):`); notices.forEach((e) => console.log('  ' + e)); }
if (!errors.length && !rewritten.length && !runtimeOk.length && !backslashOk.length && !notices.length) console.log('   全部链接健康 ✅');

process.exitCode = STRICT && errors.length ? 1 : 0;
