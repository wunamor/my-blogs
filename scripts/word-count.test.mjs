// scripts/word-count.test.mjs
// 字数口径自检：`node scripts/word-count.test.mjs`
// 已挂在 docs:dev / docs:build 的前置步骤（失败即中断构建），改 scripts/word-count.mjs 后必须让它保持全绿。
import { countWords } from './word-count.mjs';

// [用例名, Markdown 原文, 期望字数]
const cases = [
  ['纯中文：标点不计', '你好，世界！这是测试。', 8],
  ['英文/数字：按词元计', 'hello world 123', 3],
  ['Frontmatter 不计入', '---\ntitle: 标题\ntags: [a, b]\n---\n正文', 2],
  ['围栏代码块不计入', '前\n```js\nconst a = 1; // 注释\n```\n后', 2],
  ['四反引号代码块（内嵌三反引号）不计入', '前\n````md\n```\n嵌套代码\n```\n````\n后', 2],
  ['引用块 / callout 里的代码块不计入', '前\n> ```sql\n> select 1;\n> ```\n后', 2],
  ['列表项里缩进 4 空格的代码块不计入', '前\n- 步骤\n    ```java\n    int a = 1;\n    ```\n后', 4],
  ['行内代码照常计入', '用 `zadd` 添加成员', 6],
  ['链接只留文字、丢掉 URL', '[排序数组](https://leetcode.cn/problems/sort-an-array/)', 4],
  ['尖括号写法的 URL 也丢掉', '[文档](<https://a.b/c d.md>)', 2],
  ['图片只留 alt 文字', '![归并的思路](images/归并.svg)', 5],
  ['HTML/组件标签不计、内容照算', '<div class="x">内容</div>', 2],
  ['Spoiler 语法糖只算内容', '||\n秘密内容\n||', 4],
  ['块级公式不计入', '$$E=mc^2$$\n能量', 2],
  ['行内公式不计入', '复杂度 $O(\\log N)$', 3],
  ['金额不被当成公式吞掉', '价格 $5 到 $10', 5],
  ['正文中间的 --- 分割线不影响计数', '上\n\n---\n\n下', 2],
];

let failed = 0;
for (const [name, input, expected] of cases) {
  const got = countWords(input).wordCount;
  const ok = got === expected;
  if (!ok) failed += 1;
  console.log(`${ok ? '✅' : '❌'} ${name}：期望 ${expected}，实际 ${got}`);
}

// 阅读时长边界（技术文档按 150 字/分钟，至少 1 分钟）
const readTimeCases = [
  ['150 字 → 1 分钟', '字'.repeat(150), 1],
  ['151 字 → 2 分钟', '字'.repeat(151), 2],
  ['空文件 → 至少 1 分钟', '', 1],
];
for (const [name, input, expected] of readTimeCases) {
  const got = countWords(input).readTime;
  const ok = got === expected;
  if (!ok) failed += 1;
  console.log(`${ok ? '✅' : '❌'} 阅读时长：${name}，实际 ${got}`);
}

if (failed > 0) {
  console.error(`\n❌ word-count 自检失败：${failed} 个用例不通过（改 scripts/word-count.mjs 后请同步修正本文件）`);
  process.exit(1);
}
console.log(`\n✅ word-count 自检通过：${cases.length + readTimeCases.length} 个用例`);
