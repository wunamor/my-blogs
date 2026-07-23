// docs/.vitepress/plugins/markdown-image-caption.mts

export const imageCaptionPlugin = (md: any) => {
	md.renderer.rules.image = (tokens: any, idx: number, options: any, env: any, self: any) => {
		const token = tokens[idx]
		let src = token.attrGet('src') || ''

		// 修复 Vite 路径强校验拦截
		if (src && !/^(https?:|\/|\.\/|\.\.\/)/.test(src)) {
			src = './' + src
		}

		let alt = token.content || ''

		if (!alt) {
			// 1. 提取文件名
			let filename = src.split('/').pop() || ''

			// 💡 核心修复：将 URL 编码转换回正常的中文字符
			try {
				filename = decodeURIComponent(filename)
			} catch (e) {
				// 防止由于奇葩路径导致的解码报错崩溃
				console.warn('图片路径解码失败:', filename)
			}

			// 2. 剥离所有常见的图片后缀
			filename = filename.replace(/\.(drawio\.svg|svg|png|jpg|jpeg|gif|webp)$/i, '')

			// 3. 剥离 "YYYY-MM-DD-前缀-"
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
