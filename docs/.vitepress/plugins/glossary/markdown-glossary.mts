// 文件路径：docs/.vitepress/plugins/glossary/markdown-glossary.mts
import type MarkdownIt from 'markdown-it'
import { glossary } from './glossary-data.mts'
import { glossaryGlobalOptions } from './glossary-scan.config.mts'

const escapeRegExp = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const hasCjk = (kw: string) => /[\u3400-\u9fff\uf900-\ufaff]/.test(kw);

// 👉 【核心优化】：将词典的 Key 提取出来，并自动按照字符串长度从长到短排序 (b.length - a.length)
// 这样在遍历时，"单例模式" 永远会在 "模式" 之前被匹配，彻底杜绝重叠套娃！
// 纯 ASCII 关键词额外编译成带词边界断言的正则（防止 RAG 匹配到 PARRAGE 这种单词内部）
const matchers = Object.keys(glossary)
  .sort((a, b) => b.length - a.length)
  .map((keyword) => ({
    keyword,
    regexp: hasCjk(keyword)
      ? null
      : new RegExp(`(?<![A-Za-z0-9])${escapeRegExp(keyword)}(?![A-Za-z0-9])`, glossaryGlobalOptions.caseSensitive ? 'g' : 'gi'),
  }));

// 从链接反推目标文件的 relativePath（目录链接指向其 index.md），用于自链接豁免
function ownerFileOf(link: string): string {
  let target = link.split('#')[0];
  if (target.endsWith('/')) target += 'index';
  return target.replace(/^\//, '') + '.md';
}

// 2. 导出一个标准的 markdown-it 插件函数
export function autoLinkKeywordsPlugin(md: MarkdownIt) {
  md.core.ruler.after('inline', 'auto-link-keywords', (state: MarkdownIt.StateCore) => {
    // 当前正在渲染的页面（来自 VitePress 传入的 env），用于 noSelfLink 判断
    const pageRel: string | undefined = state.env?.relativePath;
    
    // ✨ 核心修复 1：增加一个标记，记录当前是否处于标题（h1~h6）内部
    let isInsideHeading = false; 

    state.tokens.forEach((blockToken: MarkdownIt.Token) => {
      
      // ✨ 核心修复 2：监听标题的开始和结束
      if (blockToken.type === 'heading_open') {
        isInsideHeading = true;
      }
      if (blockToken.type === 'heading_close') {
        isInsideHeading = false;
      }

      if (blockToken.type !== 'inline') return;

      // ✨ 核心修复 3：如果当前这段文字是在标题内部的，直接跳过，绝对不替换！
      if (isInsideHeading) return;

      let isInsideLink = false;
      
      for (let i = 0; i < blockToken.children.length; i++) {
        const token = blockToken.children[i];
        
        if (token.type === 'link_open') isInsideLink = true;
        if (token.type === 'link_close') isInsideLink = false;
        
        if (token.type === 'text' && !isInsideLink) {
          let html = token.content;
          let replaced = false;
          
          const placeholders: Record<string, string> = {};
          let pId = 0;
          
          matchers.forEach(({ keyword, regexp }) => {
            const link = glossary[keyword];
            // 🚫 自链接豁免：目标文件就是本页自己时跳过（锚点自我跳转没有意义）
            if (glossaryGlobalOptions.noSelfLink && pageRel && ownerFileOf(link) === pageRel) return;

            let hit: boolean;
            if (regexp) {
              regexp.lastIndex = 0;
              hit = regexp.test(html);
              regexp.lastIndex = 0;
            } else {
              hit = html.includes(keyword);
            }
            if (!hit) return;

            const parts = html.split(/(<[^>]+>)/g);
            for (let j = 0; j < parts.length; j++) {
              if (parts[j].startsWith('<')) continue;

              const buildLink = (matchedText: string) => {
                const placeholder = `__VP_GLOSSARY_${pId++}__`;
                placeholders[placeholder] = `<a class="glossary-link" href="${link}">${matchedText}</a>`;
                return placeholder;
              };

              if (regexp) {
                const rebuilt = parts[j].replace(regexp, (matchedText) => buildLink(matchedText));
                if (rebuilt !== parts[j]) {
                  parts[j] = rebuilt;
                  replaced = true;
                }
              } else if (parts[j].includes(keyword)) {
                const pieces = parts[j].split(keyword);
                const rebuilt = [];
                for (let k = 0; k < pieces.length - 1; k++) {
                  rebuilt.push(pieces[k], buildLink(keyword));
                }
                rebuilt.push(pieces[pieces.length - 1]);
                parts[j] = rebuilt.join('');
                replaced = true;
              }
            }
            html = parts.join('');
          });
          
          if (replaced) {
            for (const placeholder in placeholders) {
              html = html.replace(new RegExp(placeholder, 'g'), placeholders[placeholder]);
            }
            token.type = 'html_inline';
            token.content = html;
          }
        }
      }
    });
  });
}
