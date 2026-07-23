// .vitepress/theme/math-interaction.ts

export const initMathCopy = () => {
	// 找到所有被我们插件包裹的公式块
	const mathBlocks = document.querySelectorAll('.clickable-math-block')

	mathBlocks.forEach((block) => {
		// 防止页面切换时重复绑定事件
		if ((block as any)._hasCopyEvent) return
		;(block as any)._hasCopyEvent = true

		block.addEventListener('click', async () => {
			// 解析出隐藏的 LaTeX 源码
			const rawTex = decodeURIComponent(block.getAttribute('data-tex') || '')
			if (!rawTex) return
			// 读取公式类型，默认为 block
			const mathType = block.getAttribute('data-type') || 'block'

			try {
				// 💡 智能判断：如果是行内公式，用 $...$ 包裹；如果是块级公式，用 $$...$$ 包裹
				const copyText = mathType === 'inline' ? `$${rawTex}$` : `$$\n${rawTex}\n$$`

				// 拼接回完整的 $$ 语法并写入剪贴板
				await navigator.clipboard.writeText(copyText)

				// 呼出 Voyager 风格的 Toast 提示
				const toast = document.createElement('div')
				toast.className = 'math-copy-toast'
				toast.innerHTML = '<span style="margin-right: 6px;">✓</span> 公式已复制'
				document.body.appendChild(toast)

				// 给被点击的公式块加个闪烁反馈
				block.classList.add('math-copied-flash')

				// 触发 CSS 动画
				requestAnimationFrame(() => {
					toast.classList.add('show')
				})

				// 2 秒后清理战场
				setTimeout(() => {
					toast.classList.remove('show')
					block.classList.remove('math-copied-flash')
					setTimeout(() => toast.remove(), 300) // 等待淡出动画结束
				}, 2000)
			} catch (err) {
				console.error('复制公式失败', err)
			}
		})
	})
}
