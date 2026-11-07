// .vitepress/languages/mysql.mts
// MySQL 的 TextMate 语法，供 VitePress 的 Shiki 加载（markdown.languages）。
//
// 来源：https://github.com/cweijan/vscode-database-client
//       路径 syntaxes/mysql.tmLanguage.json，固定 commit 3dc0266e89
//       许可证 MIT，Copyright (c) 2019-2021 Weijan Chen（原文见同目录 README.md）
//
// 唯一改动：上游的 name / scopeName 是 "SQL" / "source.sql"，
// 直接注册会和 VitePress 内置的 sql 语法撞车（同一个 scopeName 会互相覆盖），
// 因此这里改成 mysql / source.mysql。语法规则本身没有做任何修改。
//
// 效果：笔记里写 ```mysql（不区分大小写）即可享受 MySQL 专属关键字高亮，
//       例如 AUTO_INCREMENT / ENGINE / CHARSET / UNSIGNED / DEFINER / RLIKE；
//       ```sql 仍然走内置语法，两者互不影响。
import grammar from './mysql.tmLanguage.json'

export const mysqlLanguage = {
	...grammar,
	name: 'mysql',
	scopeName: 'source.mysql',
	displayName: 'MySQL',
}
