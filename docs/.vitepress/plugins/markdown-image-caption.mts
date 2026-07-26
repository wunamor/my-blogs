// docs/.vitepress/plugins/markdown-image-caption.mts

export const imageCaptionPlugin = (md: any) => {
	// 💡 1. 核心修复：注入底层规则，拦截并替换非法的 <p> 标签
	md.core.ruler.push('replace_p_with_div_for_figure', (state: any) => {
		// 遍历所有解析生成的 token 节点
		for (let i = 0; i < state.tokens.length; i++) {
			const token = state.tokens[i]

			// 找到一个段落的开头节点 (paragraph_open)
			if (token.type === 'paragraph_open') {
				const inlineToken = state.tokens[i + 1]

				// 检查这个段落内部是否包含 image (图片)
				const hasImage = inlineToken.children?.some((child: any) => child.type === 'image')

				if (hasImage) {
					// 如果包含图片，将开头的 <p> 强制改为 <div>
					token.tag = 'div'
					// 顺手加个专属 class，不仅规范，还方便你未来在 CSS 里控制外层边距
					token.attrJoin('class', 'custom-image-wrapper')

					// 找到对应的段落结尾节点 (paragraph_close)，也将 </p> 改为 </div>
					const closeToken = state.tokens[i + 2]
					if (closeToken && closeToken.type === 'paragraph_close') {
						closeToken.tag = 'div'
					}
				}
			}
		}
	})

	// 📸 2. 原本的图片劫持渲染逻辑（保持不变）
	md.renderer.rules.image = (tokens: any, idx: number, options: any, env: any, self: any) => {
		const token = tokens[idx]
		let src = token.attrGet('src') || ''

		// 修复 Vite 路径强校验拦截
		if (src && !/^(https?:|\/|\.\/|\.\.\/)/.test(src)) {
			src = './' + src
		}

		let alt = token.content || ''

		if (!alt) {
			// 提取并解码文件名
			let filename = src.split('/').pop() || ''
			try {
				filename = decodeURIComponent(filename)
			} catch (e) {
				console.warn('图片路径解码失败:', filename)
			}

			// 剥离后缀与日期前缀
			filename = filename.replace(/\.(drawio\.svg|svg|png|jpg|jpeg|gif|webp)$/i, '')
			alt = filename.replace(/^\d{4}-\d{2}-\d{2}-.*?-/, '')
		}

		return `
      <figure class="custom-image-figure">
        <img src="${src}" alt="${alt}">
        <figcaption class="image-caption">${alt}</figcaption>
      </figure>
    `
	}
}
