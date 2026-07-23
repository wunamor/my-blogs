// .vitepress/plugins/markdown-math-tool.mts
export const mathToolPlugin = (md: any) => {
  // 劫持默认的块级数学公式渲染器
  const defaultMathBlockRenderer = md.renderer.rules.math_block;

  if (defaultMathBlockRenderer) {
    md.renderer.rules.math_block = (tokens: any, idx: number, options: any, env: any, self: any) => {
      // 获取原始的 LaTeX 代码
      const rawTex = tokens[idx].content;
      // 获取渲染后的 HTML (SVG 或 MathML)
      const renderedHtml = defaultMathBlockRenderer(tokens, idx, options, env, self);

      // 核心魔法：用一个带有 data-tex 属性的 div 包裹起来
      return `<div class="clickable-math-block" data-tex="${encodeURIComponent(rawTex)}">\n${renderedHtml}\n</div>`;
    };
  }

  // --- 2. 新增：处理行内公式 ---
  const defaultMathInlineRenderer = md.renderer.rules.math_inline;
  if (defaultMathInlineRenderer) {
    md.renderer.rules.math_inline = (tokens: any, idx: number, options: any, env: any, self: any) => {
      const rawTex = tokens[idx].content;
      const renderedHtml = defaultMathInlineRenderer(tokens, idx, options, env, self);
      
      // 核心魔法：使用 span 保持行内排版，增加 clickable-math-inline 类名，且标记为 inline
      return `<span class="clickable-math-block clickable-math-inline" data-tex="${encodeURIComponent(rawTex)}" data-type="inline">${renderedHtml}</span>`;
    };
  }
}