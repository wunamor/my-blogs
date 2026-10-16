// scripts/word-count.mjs
// ⚠️ 全站字数的【唯一口径来源】。构建期的每页徽章（docs/.vitepress/configs/page-transform.mts）
// 与导读页统计条（scripts/auto-index.mjs）共用本模块，改动这里的规则会同时影响两处，务必自查。

/**
 * 统计一段 Markdown 正文的字数（中文字符 + 英文/数字词元）
 * @param {string} markdown - 笔记原始内容（含 Frontmatter 亦可，会被剥离）
 * @returns {{ wordCount: number, readTime: number }}
 */
export function countWords(markdown) {
  // 1. 暴力清洗：提前剔除大块的非阅读区域，防止里面的单词被误算
  const content = markdown
    .replace(/^---\r?\n[\s\S]*?\r?\n---(\r?\n|$)/, '') // 仅移除文件开头的 Frontmatter 头部配置
    .replace(/\$\$[\s\S]*?\$\$/g, '') // 移除 LaTeX 块级公式
    .replace(/\$.*?\$/g, '') // 移除 LaTeX 行内公式
    .replace(/<[^>]+>/g, ''); // 移除 HTML 标签 (比如 <Spoiler>)

  // 2. 正向匹配：精准抓取中文汉字
  // [\u4e00-\u9fa5] 是标准中文字符集，完全不包含中文标点符号！
  const cnCount = (content.match(/[\u4e00-\u9fa5]/g) || []).length;

  // 3. 正向匹配：精准抓取英文单词和数字
  // [a-zA-Z0-9]+ 会把连续的英文字母或数字当成一个整体（例如 "world" 算 1 个，"123" 算 1 个）
  // 且完美过滤掉了所有的英文标点、空格、Markdown 特殊符号（如 #, *, > 等）
  const enCount = (content.match(/[a-zA-Z0-9]+/g) || []).length;

  // 4. 合并总字数
  const wordCount = cnCount + enCount;

  // 阅读时间：按每分钟阅读 150 字算，至少显示 1 分钟
  const readTime = Math.ceil(wordCount / 150) || 1;

  return { wordCount, readTime };
}
