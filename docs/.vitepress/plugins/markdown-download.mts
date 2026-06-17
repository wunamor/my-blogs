// .vitepress/plugins/markdown-download.mts

// 🎯 【集中配置区】：在这里以数组形式管理所有需要触发下载的文件后缀
const DOWNLOADABLE_EXTENSIONS = [
  // 表格数据
  'xlsx', 'xls', 'csv',
  // 压缩包
  'zip', 'rar', '7z', 'tar', 'gz',
  // 文档材料
  'pdf', 'doc', 'docx', 'ppt', 'pptx'
];

// ⚙️ 引擎自动将数组拼接为正则表达式 (例如: /\.(xlsx|xls|csv...)$/i )
const extPattern = new RegExp(`\\.(${DOWNLOADABLE_EXTENSIONS.join('|')})$`, 'i');

export const autoDownloadPlugin = (md: any) => {
  // 记住默认的超链接渲染规则
  const defaultRender = md.renderer.rules.link_open || function(tokens: any, idx: number, options: any, env: any, self: any) {
    return self.renderToken(tokens, idx, options);
  };

  // 劫持超链接的打开标签 <a>
  md.renderer.rules.link_open = function (tokens: any, idx: number, options: any, env: any, self: any) {
    const token = tokens[idx];
    const hrefIndex = token.attrIndex('href');

    if (hrefIndex >= 0) {
      const href = token.attrs[hrefIndex][1];
      
      // 🚀 使用动态生成的正则进行校验
      if (extPattern.test(href)) {
        
        // 1. 自动注入 target="_blank"
        const targetIndex = token.attrIndex('target');
        if (targetIndex < 0) {
          token.attrPush(['target', '_blank']);
        } else {
          token.attrs[targetIndex][1] = '_blank';
        }

        // 2. 自动注入 download 属性
        token.attrPush(['download', '']);

        // 3. 自动加上专属的 CSS 类名
        const classIndex = token.attrIndex('class');
        if (classIndex < 0) {
          token.attrPush(['class', 'auto-download-link']);
        } else {
          token.attrs[classIndex][1] += ' auto-download-link';
        }
      }
    }
    return defaultRender(tokens, idx, options, env, self);
  };
};