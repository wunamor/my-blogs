// scripts/word-count.mjs
// ⚠️ 全站字数的【唯一口径来源】。构建期的每页徽章（docs/.vitepress/configs/page-transform.mts）
// 与导读页统计条（scripts/auto-index.mjs）、速览表的「字数」列（theme/tree.data.mts）共用本模块，
// 改动这里的规则会同时影响三处，务必自查，并跑一遍 `node scripts/word-count.test.mjs`。
//
// 口径（只统计「人真正会读到的文字」）：
//   ✅ 计入：中文汉字、英文/数字词元（`zadd` 算 1 个词）
//   ❌ 不计入：文件头 Frontmatter、围栏代码块（``` / ~~~，含四反引号嵌套）、
//             链接与图片的 URL（链接文字保留）、引用式链接定义行、
//             HTML / Vue 组件标签与注释（`<Spoiler>` 这类只保留内部文字）、
//             LaTeX 公式（`$$` 块级；`$` 行内仅在内容含数学符号时剥离）
// 阅读时长：`ceil(字数 / 150)`，技术文档按 150 字/分钟（偏保守，宁愿高估不要低估），至少 1 分钟。

/** 技术文档阅读速度（字/分钟）：比休闲阅读（300~500）慢得多，别随手调大。 */
export const WORDS_PER_MINUTE = 150;

/**
 * 把 Markdown 清洗成「纯阅读文本」（只做删除/保留文字，不改变字数语义）。
 * @param {string} markdown - 笔记原始内容
 * @returns {string} 清洗后的文本
 */
export function sanitizeMarkdown(markdown) {
  return (
    markdown
      // 1. 文件头 Frontmatter：只认文件开头，正文中间的 --- 分割线属于正文
      .replace(/^\uFEFF?---\r?\n[\s\S]*?\r?\n---(?:[ \t]*\r?\n|$)/, '')
      // 2. 围栏代码块：起止围栏类型一致、长度允许更长（``` / ~~~ / 四反引号嵌套）。
      //    行首缩进不限（代码块常缩进在列表项里，4 空格甚至更多）；
      //    也允许 `> ` 引用前缀（Obsidian callout / 引用块里的代码同样不算字数）
      .replace(/^[ \t]*(?:>[ \t]?)*(`{3,}|~{3,})[^\n]*\r?\n[\s\S]*?^[ \t]*(?:>[ \t]?)*\1[~`]*[ \t]*$/gm, '')
      // 3. 链接/图片：保留文字，丢掉 URL（兼容 <url> 尖括号写法与 "title"）
      .replace(/!?\[([^\]]*)\]\(\s*<[^>]*>\s*(?:"[^"]*"|'[^']*'|\([^)]*\))?\s*\)/g, '$1')
      .replace(/!?\[([^\]]*)\]\([^)]*\)/g, '$1')
      // 4. 引用式链接/图片的定义行：[id]: https://...
      .replace(/^ {0,3}\[[^\]]+\]:[ \t]*\S+.*$/gm, '')
      // 5. HTML 注释与标签（语法糖组件的标签本身不计，内部文字照算）
      .replace(/<!--[\s\S]*?-->/g, '')
      .replace(/<\/?[A-Za-z][^>]*>/g, '')
      // 6. LaTeX：块级 $$...$$ 全剥；行内 $...$ 只在内容含数学符号时剥，
      //    避免把「价格 $5 到 $10」这类金额误吞
      .replace(/\$\$[\s\S]*?\$\$/g, '')
      .replace(/\$(?=[^\n$]*[\\^_{}=<>+*/])[^\n$]*\$/g, '')
  );
}

/**
 * 统计一段 Markdown 正文的字数与预计阅读时长。
 * @param {string} markdown - 笔记原始内容（含 Frontmatter 亦可，会被剥离）
 * @returns {{ wordCount: number, readTime: number }}
 */
export function countWords(markdown) {
  const text = sanitizeMarkdown(markdown);

  // 中文汉字：[\u4E00-\u9FFF]（比旧的 \u9fa5 多覆盖 9FA6–9FFF 的新增汉字），不含中文标点
  const cnCount = (text.match(/[\u4E00-\u9FFF]/g) || []).length;

  // 英文单词与数字：[A-Za-z0-9]+ 把连续的字母/数字当一个词元（"world"=1、"123"=1），
  // 天然过滤英文标点、空格与 Markdown 符号（#, *, > 等）
  const enCount = (text.match(/[A-Za-z0-9]+/g) || []).length;

  const wordCount = cnCount + enCount;
  const readTime = Math.ceil(wordCount / WORDS_PER_MINUTE) || 1;

  return { wordCount, readTime };
}
