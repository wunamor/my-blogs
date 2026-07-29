// docs/.vitepress/theme/code-interaction.ts

export const initCodeTools = () => {
	if ((window as any)._hasCodeToolEvent) return
	;(window as any)._hasCodeToolEvent = true

	document.body.addEventListener('click', (e) => {
		const target = e.target as HTMLElement

		// 拦截折叠按钮点击事件
		if (target.classList.contains('fold-btn')) {
			const wrapper = target.closest('.custom-code-wrapper') as HTMLElement
			if (!wrapper) return

			const isCollapsed = wrapper.classList.contains('collapsed')
			const lines = target.getAttribute('data-lines')

			if (isCollapsed) {
				wrapper.classList.remove('collapsed')
				target.innerHTML = '👆 收起代码'
			} else {
				wrapper.classList.add('collapsed')
				target.innerHTML = `👇 展开所有 ${lines} 行代码`

				const rect = wrapper.getBoundingClientRect()
				if (rect.top < 0) {
					wrapper.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
				}
			}
		}

		// 预留：拦截未来可能加的 copy-btn 或者 run-btn
		// else if (target.classList.contains('copy-btn')) { ... }
	})
}
