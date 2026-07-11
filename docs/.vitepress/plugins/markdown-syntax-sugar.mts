// markdown 语法糖

// docs/.vitepress/plugins/markdown-syntax-sugar.mts

export const syntaxSugarPlugin = (md: any) => {
  // 💡 绝招：在 inline 核心解析器运行之前，直接拦截原字符串
  md.core.ruler.before('inline', 'spoiler_regex_replace', (state: any) => {
    
    state.tokens.forEach((token: any) => {
      // 只要是包含内容的内联块（比如普通段落、引用段落）
      if (token.type === 'inline' && token.content) {
        
        // 💡 核心修改：使用 [\s\S]*? 替代 .*?，让匹配完美兼容多行换行
        token.content = token.content.replace(/\|\|([\s\S]*?)\|\|/g, '<Spoiler>$1</Spoiler>');
        
      }
    });
    
  });
};