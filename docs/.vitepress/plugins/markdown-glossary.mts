// 文件路径：.vitepress/glossary.mts

// 1. 在这里集中维护你的全局术语词典（随便加，不用管顺序！）
const glossary: Record<string, string> = {
  '单例模式': '/01-计算机与IT技术/02-设计模式/01-单例模式',
  '工厂模式': '/01-计算机与IT技术/02-设计模式/02-工厂模式',
  '代理模式': '/01-计算机与IT技术/02-设计模式/03-代理模式',

  'RAG': '/01-计算机与IT技术/01-比特就业课/03-LangChain&LangGraph-AI应用开发框架精品课/01-LangChain-AI应用开发框架精品课/02-嵌入式模型#应用场景',

  "直接插入排序": '/01-计算机与IT技术/01-比特就业课/01-Java研发系统课118期/02-Java数据结构/01-数据结构初阶/2025-07-31-排序#直接插入排序',
  "希尔排序": '/01-计算机与IT技术/01-比特就业课/01-Java研发系统课118期/02-Java数据结构/01-数据结构初阶/2025-07-31-排序#希尔排序',
  "选择排序": '/01-计算机与IT技术/01-比特就业课/01-Java研发系统课118期/02-Java数据结构/01-数据结构初阶/2025-07-31-排序#选择排序',
  "堆排序": '/01-计算机与IT技术/01-比特就业课/01-Java研发系统课118期/02-Java数据结构/01-数据结构初阶/2025-07-31-排序#堆排序',
  "冒泡排序": '/01-计算机与IT技术/01-比特就业课/01-Java研发系统课118期/02-Java数据结构/01-数据结构初阶/2025-07-31-排序#冒泡排序',
  "快速排序": '/01-计算机与IT技术/01-比特就业课/01-Java研发系统课118期/02-Java数据结构/01-数据结构初阶/2025-07-31-排序#快速排序',
  "归并排序": '/01-计算机与IT技术/01-比特就业课/01-Java研发系统课118期/02-Java数据结构/01-数据结构初阶/2025-07-31-排序#归并排序',
  "计数排序": '/01-计算机与IT技术/01-比特就业课/01-Java研发系统课118期/02-Java数据结构/01-数据结构初阶/2025-07-31-排序#计数排序',
  "基数排序": '/01-计算机与IT技术/01-比特就业课/01-Java研发系统课118期/02-Java数据结构/01-数据结构初阶/2025-07-31-排序#基数排序',
  "桶排序": '/01-计算机与IT技术/01-比特就业课/01-Java研发系统课118期/02-Java数据结构/01-数据结构初阶/2025-07-31-排序#桶排序',



  '不背单词': '/00-学习技巧/02-英语/00-单词背诵软件推荐#不背单词',
  'Anki': '/00-学习技巧/02-英语/00-单词背诵软件推荐#anki',
  // '科目一': '/驾考交规/01-科目一/index',
};

// 👉 【核心优化】：将词典的 Key 提取出来，并自动按照字符串长度从长到短排序 (b.length - a.length)
// 这样在遍历时，"单例模式" 永远会在 "模式" 之前被匹配，彻底杜绝重叠套娃！
const sortedKeywords = Object.keys(glossary).sort((a, b) => b.length - a.length);

// 2. 导出一个标准的 markdown-it 插件函数
export function autoLinkKeywordsPlugin(md: any) {
  md.core.ruler.after('inline', 'auto-link-keywords', (state: any) => {
    
    // ✨ 核心修复 1：增加一个标记，记录当前是否处于标题（h1~h6）内部
    let isInsideHeading = false; 

    state.tokens.forEach((blockToken: any) => {
      
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
                  
                  // 👇 注意这里的链接样式，你可以根据需要调整
                  const link = glossary[keyword];
                  const newHtml = `<a href="${link}" style="color: var(--vp-c-brand); font-weight: 500;">${keyword}</a>`;
                  
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