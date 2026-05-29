// 文件路径：.vitepress/glossary.mts

// 1. 在这里集中维护你的全局术语词典（随便加，不用管顺序！）
const glossary: Record<string, string> = {
  '单例模式': '/04-设计模式/01-单例模式',
  '工厂模式': '/04-设计模式/02-工厂模式',
  // '科目一': '/驾考交规/01-科目一/index',
};

// 👉 【核心优化】：将词典的 Key 提取出来，并自动按照字符串长度从长到短排序 (b.length - a.length)
// 这样在遍历时，"单例模式" 永远会在 "模式" 之前被匹配，彻底杜绝重叠套娃！
const sortedKeywords = Object.keys(glossary).sort((a, b) => b.length - a.length);

// 2. 导出一个标准的 markdown-it 插件函数
export function autoLinkKeywordsPlugin(md: any) {
  md.core.ruler.after('inline', 'auto-link-keywords', (state: any) => {
    state.tokens.forEach((blockToken: any) => {
      if (blockToken.type !== 'inline') return;
      
      let isInsideLink = false;
      
      for (let i = 0; i < blockToken.children.length; i++) {
        const token = blockToken.children[i];
        
        if (token.type === 'link_open') isInsideLink = true;
        if (token.type === 'link_close') isInsideLink = false;
        
        if (token.type === 'text' && !isInsideLink) {
          let html = token.content;
          let replaced = false;
          
          // ✨ 新增：占位符字典，防止同义词相互嵌套
          const placeholders: Record<string, string> = {};
          let pId = 0;
          
          sortedKeywords.forEach((keyword) => {
            if (html.includes(keyword)) {
              const parts = html.split(/(<[^>]+>)/g);
              for (let j = 0; j < parts.length; j++) {
                if (!parts[j].startsWith('<') && parts[j].includes(keyword)) {
                  
                  const link = glossary[keyword];
                  const newHtml = `<a href="${link}" style="color: var(--vp-c-brand); font-weight: 500;">${keyword}</a>`;
                  
                  // 👇 核心修复：用不可见的占位符替换关键词，保护它不被后续的短词扫描到
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
            // ✨ 终极还原：所有词都扫描完后，把占位符集中变回真实的 HTML 链接
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