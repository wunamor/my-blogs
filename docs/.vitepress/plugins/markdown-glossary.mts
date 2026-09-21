// 文件路径：docs/.vitepress/plugins/markdown-glossary.mts
import type MarkdownIt from 'markdown-it'
import { glossary } from './glossary-data.mts'

// 👉 【核心优化】：将词典的 Key 提取出来，并自动按照字符串长度从长到短排序 (b.length - a.length)
// 这样在遍历时，"单例模式" 永远会在 "模式" 之前被匹配，彻底杜绝重叠套娃！
const sortedKeywords = Object.keys(glossary).sort((a, b) => b.length - a.length);

// 2. 导出一个标准的 markdown-it 插件函数
export function autoLinkKeywordsPlugin(md: MarkdownIt) {
  md.core.ruler.after('inline', 'auto-link-keywords', (state: MarkdownIt.StateCore) => {
    
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
          
          sortedKeywords.forEach((keyword) => {
            if (html.includes(keyword)) {
              const parts = html.split(/(<[^>]+>)/g);
              for (let j = 0; j < parts.length; j++) {
                if (!parts[j].startsWith('<') && parts[j].includes(keyword)) {
                  
                  const link = glossary[keyword];
                  const newHtml = `<a class="glossary-link" href="${link}">${keyword}</a>`;
                  
                  const pieces = parts[j].split(keyword);
                  const rebuilt = [];
                  for (let k = 0; k < pieces.length - 1; k++) {
                    const placeholder = `__VP_GLOSSARY_${pId++}__`;
                    placeholders[placeholder] = newHtml;
                    rebuilt.push(pieces[k], placeholder);
                  }
                  rebuilt.push(pieces[pieces.length - 1]);
                  parts[j] = rebuilt.join('');
                  replaced = true;
                }
              }
              html = parts.join('');
            }
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