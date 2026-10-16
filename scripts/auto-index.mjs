// scripts/auto-index.mjs
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { scanDir, createNameResolver, stripNumericPrefix, vitepressSlugify } from './scanner.mjs';
import { countWords } from './word-count.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const docsDir = path.resolve(__dirname, '../docs');

// 💡 提取公共过滤规则：匹配所有(*)，排除隐藏文件(!.*)和导读页(!index.md)
const ignorePatterns = ['*', '!.*', '!index.md', '!images'];

// 子树笔记数达到该阈值时，导读页改用 <DirectoryTree /> 速览表格（此时不再输出下方 markdown 列表）
const DIR_TREE_MIN_NOTES = 20;

// 👇 字数缓存：getDeepStats 会被每个祖先目录递归调用，缓存保证每篇笔记只读盘解析一次。
const wordCountCache = new Map();
function getWordCount(absPath) {
  if (!wordCountCache.has(absPath)) {
    wordCountCache.set(absPath, countWords(fs.readFileSync(absPath, 'utf-8')).wordCount);
  }
  return wordCountCache.get(absPath);
}

// 👇 【修正】：锚点生成必须与 VitePress 内核完全一致——
// 先剥掉标题里的 Markdown 语法（等价于内核从 token 拼接纯文本），
// 再套用 scanner 里逐字复刻的 vitepressSlugify（含“数字开头补 _”规则）。
const slugify = (text) => {
  if (!text) return '';
  const plain = text
    .replace(/!?\[([^\]]+)\]\([^)]*\)/g, '$1')
    .replace(/[*_`]/g, '')
    .trim();
  return vitepressSlugify(plain);
};

function generateIndexForDir(dir) {
  const { directories, files } = scanDir(dir, ignorePatterns);
  const cleanName = stripNumericPrefix(path.basename(dir));

  // 👉 【修改这里】：不再只看当前层，而是调用我们刚写的深层扫描器！
  const { totalFiles, totalDirs, totalWords } = getDeepStats(dir);

  let content = `---\n`;
  content += `title: ${cleanName}\n`;
  content += `---\n\n`;

  // 👉 【修改】：给大标题分配一个固定锚点 {#dir-title}
  content += `# 📁 ${cleanName} {#dir-title}\n\n`;

  if (dir !== docsDir) {
    // 手动加上主题色，让它在视觉上和普通链接完全一致。
    content += `<a style="cursor: pointer; color: var(--vp-c-brand-1);" onclick="history.back()">⬅️ 返回上一级</a>\n\n`;
  }

  content += `> 本页面由系统自动生成，请勿手动修改。\n\n`;

  // 👉 【修改文案】：让文案体现出宏观感
  if (totalDirs > 0 || totalFiles > 0) {
    content += `<div style="color: var(--vp-c-text-2); font-size: 0.9em; margin-bottom: 20px; padding: 10px; background-color: var(--vp-c-bg-soft); border-radius: 8px;">\n`;
    content += `  📊 <strong>本区统计</strong>：`;

    const stats = [];
    if (totalDirs > 0) stats.push(`下辖 <b>${totalDirs}</b> 个子文件夹`);
    if (totalFiles > 0) stats.push(`累计收录 <b>${totalFiles}</b> 篇笔记`);
    if (totalFiles > 0) stats.push(`篇均 <b>${Math.round(totalWords / totalFiles)}</b> 字`);

    content += stats.join(' ｜ ') + `\n`;
    content += `</div>\n\n`;
  } else {
    // 依然保留兜底的空目录提示
    content += `*📭 此板块暂无内容，正在建设中...*\n\n`;
  }

  // let hasItems = false;
  // 实例化当前目录的解析器 
  const resolver = createNameResolver([
    ...directories,
    ...files.map(f => f.replace('.md', ''))
  ]);

  const validFiles = files.filter(f => f.endsWith('.md') && f !== 'index.md');
  const allItems = [
    ...directories.map(dir => ({ name: dir, isDir: true })),
    ...validFiles.map(file => ({ name: file, isDir: false }))
  ];

  allItems.sort((a, b) => {
    const matchA = a.name.match(/^(\d+)-/);
    const matchB = b.name.match(/^(\d+)-/);
    const numA = matchA ? parseInt(matchA[1], 10) : null;
    const numB = matchB ? parseInt(matchB[1], 10) : null;

    if (numA !== null && numB !== null) return numA - numB;
    if (numA !== null) return -1;
    if (numB !== null) return 1;
    if (a.isDir && !b.isDir) return -1;
    if (!a.isDir && b.isDir) return 1;
    return a.name.localeCompare(b.name, 'zh-CN');
  });

  // 👉 【新增】：在这里放置一个完全隐形、不占空间的 HTML 锚点！
  // 这样一来，无论是点进子目录，还是返回上一级，视野都会跳过标题和统计，直接对齐这里。
  // content += `<span id="content-top"></span>\n\n`;

  // 达标页用速览表格替代 markdown 列表（组件由 theme/index.ts 全局注册，见 .vitepress/README.md）。
  // 列表行先攒起来，最后二选一输出；子目录的递归生成不受影响，始终执行。
  const useDirectoryTree = totalFiles >= DIR_TREE_MIN_NOTES;
  const listLines = [];

  for (const item of allItems) {
    // let hasItems = true;
    const encodedItem = encodeURIComponent(item.name);

    if (item.isDir) {
      // 1. 递归处理子文件夹
      // 一行代码搞定防重名去前缀！
      const displayName = resolver(item.name);
      // 👉 【修改】：结尾加上 /#dir-title，完美定位到刚分配的大标题处
      listLines.push(`- 📂 [${displayName}](./${encodedItem}/#dir-title)`);
      generateIndexForDir(path.join(dir, item.name));
    } else {
      // 2. 处理 Markdown 文件
      let originalName = item.name.replace('.md', '');
      let explicitTitle = null;
      const itemPath = path.join(dir, item.name);

      try {
        const fileContent = fs.readFileSync(itemPath, 'utf-8');
        const titleMatch = fileContent.match(/^#\s+(.+)/m);
        if (titleMatch) explicitTitle = titleMatch[1].trim();
      } catch (err) { }

      // 一行代码搞定带标题提取的防重名！
      const displayName = resolver(originalName, explicitTitle);
      // 👉 【修改】：将提取到的标题转为 Hash 锚点，拼接到链接末尾
      const anchorHash = explicitTitle ? `#${slugify(explicitTitle)}` : '';
      listLines.push(`- 📄 [${displayName}](./${encodedItem}${anchorHash})`);
    }
  }

  content += useDirectoryTree
    ? `\n<DirectoryTree />\n`
    : listLines.join('\n') + (listLines.length ? '\n' : '');

  // 把恒成立的 .includes('') 换成真正的内容一致性校验 
  // 移除掉外层的 if (hasItems) 限制，允许空目录也写入文件
  const indexPath = path.join(dir, 'index.md');
  // 如果文件不存在，或者【旧文件内容】与【新生成内容】不一致时，才允许写入磁盘
  if (!fs.existsSync(indexPath) || fs.readFileSync(indexPath, 'utf-8') !== content) {
    fs.writeFileSync(indexPath, content);
  }

}


// 👉 【新增核心逻辑】：递归计算当前目录及所有子目录下的真实文件数量与总字数
function getDeepStats(targetPath) {
  let totalFiles = 0;
  let totalDirs = 0;
  let totalWords = 0;

  // 复用你已经写好的 scanDir，它自带了忽略 public 和 .git 等文件夹的功能
  const { directories, files } = scanDir(targetPath, ignorePatterns);

  // 统计当前层的有效笔记
  const validFiles = files.filter(f => f.endsWith('.md') && f !== 'index.md');
  totalFiles += validFiles.length;
  totalDirs += directories.length;
  for (const file of validFiles) {
    totalWords += getWordCount(path.join(targetPath, file));
  }

  // 顺藤摸瓜，递归统计子文件夹里的数量
  for (const dir of directories) {
    const subStats = getDeepStats(path.join(targetPath, dir));
    totalFiles += subStats.totalFiles;
    totalDirs += subStats.totalDirs;
    totalWords += subStats.totalWords;
  }

  return { totalFiles, totalDirs, totalWords };
}

// 启动扫描（针对根目录，额外排除 public 文件夹）
const { directories: rootDirs } = scanDir(docsDir, [...ignorePatterns, '!public']);
for (const dir of rootDirs) {
  generateIndexForDir(path.join(docsDir, dir));
}

console.log('✅ 文件夹导读页自动生成完毕！(基于扫描器重构版)');