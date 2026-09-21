// docs/.vitepress/plugins/glossary/glossary-scan.config.mts
// 术语词典自动扫描配置：新增笔记后无需手动登记术语，重启 dev / 重新构建即自动生效。
// 手写覆盖层见 glossary-data.mts（手写的最高优先级词条永远不会被自动扫描结果覆盖）。

export interface GlossarySource {
  /** 相对于 docs/ 的目录路径（支持中文目录名） */
  dir: string;
  /** dirs = 仅收录该目录的直接子文件夹（链接指向子目录导读页）；all = 递归收录目录下所有 md 文件 */
  scope: 'dirs' | 'all';
  /** 标题作为关键词的层级上限：false = 不扫标题（仅收录文件级条目）；n = 收录 h1~hn。默认 2 */
  headings?: number | false;
  /** 文件 basename 的 glob 白名单（micromatch 语法），留空 = 不限制 */
  include?: string[];
  /** 文件/文件夹 basename 的 glob 黑名单，默认已额外排除 index.md、images 与隐藏项 */
  exclude?: string[];
  /** 撞车优先级：数值大者胜；同值按本数组声明顺序，先声明者胜。默认 0 */
  priority?: number;
  /** 覆盖全局 minKeywordLength（仅对本来源生效） */
  minKeywordLength?: number;
}

export interface GlossaryGlobalOptions {
  /** 关键词最小字符数，短于此长度的自动词被丢弃（防单字/短词误伤），手写层不受限 */
  minKeywordLength: number;
  /** 停用词：与列表中任一词完全相同的自动关键词被丢弃，手写层不受限 */
  stopWords: string[];
  /** 纯英文/数字关键词是否区分大小写（中文关键词永远是精确匹配） */
  caseSensitive: boolean;
  /** 在目标文件自己的正文里，不再自动链接回本页（锚点自我跳转） */
  noSelfLink: boolean;
}

export const glossaryGlobalOptions: GlossaryGlobalOptions = {
  minKeywordLength: 2,
  stopWords: ['的', '了', '和', '与', '或', '是'],
  caseSensitive: true,
  noSelfLink: true,
};

export const glossaryScanSources: GlossarySource[] = [
  // 设计模式：每个文件即一个术语（文件名脱马甲后作为关键词，不扫标题）
  { dir: '01-计算机与IT技术/02-设计模式', scope: 'all', headings: false, priority: 10 },
  // 排序十法：只看排序这一篇，h3 小节名（直接插入排序、堆排序...）各自成词条
  {
    dir: '01-计算机与IT技术/01-比特就业课/01-Java研发系统课118期/02-Java数据结构/01-数据结构初阶',
    scope: 'all',
    headings: 3,
    include: ['2025-07-31-排序.md'],
    priority: 10,
  },
  // 英语学习：h2 小节（不背单词、Anki）作为词条
  { dir: '00-学习技巧/02-英语', scope: 'all', headings: 2, priority: 5 },
];
