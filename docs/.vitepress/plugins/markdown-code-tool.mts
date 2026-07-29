// docs/.vitepress/plugins/markdown-code-tool.mts

const LINE_COUNT_THRESHOLD = 7 // 超过多少行的代码块才会折叠

export const codeToolPlugin = (md: any) => {
	// 保存 VitePress 默认的代码块渲染逻辑
	const defaultFence = md.renderer.rules.fence

	md.renderer.rules.fence = (tokens: any, idx: number, options: any, env: any, self: any) => {
		// 1. 获取基础信息
		const token = tokens[idx]
		const rawCode = token.content
		const lineCount = rawCode.split('\n').length
		const lang = token.info.trim() // 获取代码语言（如果未来需要针对 Java 或 Python 做特定按钮，可以留用）

		// 2. 获取原生渲染的 HTML (带有 VitePress 默认高亮的结构)
		const renderedHtml = defaultFence(tokens, idx, options, env, self)

		// 3. 构建功能组件栈 (预留未来扩展位)
		let toolsHtml = ''
		let wrapperClasses = ['custom-code-wrapper']

		// --- 功能模块 A：长代码折叠 ---
		if (lineCount > LINE_COUNT_THRESHOLD) {
			wrapperClasses.push('collapsed')
			toolsHtml += `
        <div class="code-fold-mask"></div>
        <button class="code-tool-btn fold-btn" data-lines="${lineCount}">👇 展开所有 ${lineCount} 行代码</button>
      `
		}

		// --- 功能模块 B：预留其他功能 (如运行按钮等) ---
		// if (lang === 'java') { ... }

		// 4. 只有当确实注入了新功能时，才做外层包裹，否则返回纯净的原生结构
		if (toolsHtml) {
			return `
        <div class="${wrapperClasses.join(' ')}">
          ${renderedHtml}
          ${toolsHtml}
        </div>
      `
		}

		return renderedHtml
	}
}
