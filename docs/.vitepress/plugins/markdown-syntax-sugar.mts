// docs/.vitepress/plugins/markdown-syntax-sugar.mts

export const syntaxSugarPlugin = (md: any) => {
	md.core.ruler.before('normalize', 'spoiler_global_replace', (state: any) => {
		const store: string[] = []

		// 🛡️ 1. 提取并保护所有的 多行代码块、行内代码、公式，防止被错误的正则破坏
		let tempSrc = state.src.replace(/(```[\s\S]*?```|`[^`\n]+`|\$\$[\s\S]*?\$\$|\$[^$\n]+\$)/g, (match: string) => {
			store.push(match)
			return `\x01${store.length - 1}\x02` // 替换为不可见的占位符
		})

		// 🧱 2. 匹配块级 Spoiler（独占一行的 ||）
		// 匹配规则：行首的 || 加上换行，中间任意内容，最后又是行首的 ||
		// tempSrc = tempSrc.replace(
		// 	/^\|\|[ \t]*\r?\n([\s\S]*?)^\|\|[ \t]*(?:\r?\n|$)/gm,
		// 	(match: string, content: string) => {
		// 		return `\n\n<Spoiler mode="block">\n\n${content}\n\n</Spoiler>\n\n`
		// 	},
		// )
    tempSrc = tempSrc.replace(/^([ \t>]*)\|\|[ \t]*\r?\n([\s\S]*?)^[ \t>]*\|\|[ \t]*(?:\r?\n|$)/gm, (match: string, prefix: string, content: string) => {
      // 动态生成带有正确前缀的空行（比如 "> \n"），确保外部的引用块不断层
      const blank = `${prefix}\n`;
      // 在 HTML 标签与正文之间注入空行，强制 Markdown 引擎完整解析内部的列表和代码块！
      return `${blank}${prefix}<Spoiler mode="block">\n${blank}${content}${blank}${prefix}</Spoiler>\n${blank}`;
    });

		// 📝 3. 匹配行内 Spoiler
		tempSrc = tempSrc.replace(/\|\|([\s\S]*?)\|\|/g, (match: string, content: string) => {
			return `<Spoiler mode="inline">${content}</Spoiler>`
		})

		// 🔄 4. 将保护好的代码块和公式完美还原回去
		state.src = tempSrc.replace(/\x01(\d+)\x02/g, (match: string, index: string) => {
			return store[parseInt(index, 10)]
		})
	})
}
