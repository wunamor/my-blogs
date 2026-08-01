// scripts/auto-index.mjs
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { scanDir, createNameResolver } from './scanner.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const docsDir = path.resolve(__dirname, '../docs');

// 💡 提取公共过滤规则：匹配所有(*)，排除隐藏文件(!.*)和导读页(!index.md)
const ignorePatterns = ['*', '!.*', '!index.md', '!images'];

// 👇 【新增】工具函数：模拟 VitePress 的标题转换逻辑生成锚点
function slugify(text) {
  if (!text) return '';
  return text
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    .replace(/[*_`]/g, '')
    .toLowerCase()
    .replace(/[\s`~!@#$%^&*()_|+\-=?;:'",.<>\{\}\[\]\\\/]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function generateIndexForDir(dir) {
  const { directories, files } = scanDir(dir, ignorePatterns);
  const cleanName = path.basename(dir).replace(/^(\d+-)+/, '');

  // 👉 【修改这里】：不再只看当前层，而是调用我们刚写的深层扫描器！
  const { totalFiles, totalDirs } = getDeepStats(dir);

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

  for (const item of allItems) {
    // let hasItems = true;
    const encodedItem = encodeURIComponent(item.name);

    if (item.isDir) {
      // 1. 递归处理子文件夹
      // 一行代码搞定防重名去前缀！
      const displayName = resolver(item.name);
      // 👉 【修改】：结尾加上 /#dir-title，完美定位到刚分配的大标题处
      content += `- 📂 [${displayName}](./${encodedItem}/#dir-title)\n`;
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
      content += `- 📄 [${displayName}](./${encodedItem}${anchorHash})\n`;
    }
  }

  // 把恒成立的 .includes('') 换成真正的内容一致性校验 
  // 移除掉外层的 if (hasItems) 限制，允许空目录也写入文件
  const indexPath = path.join(dir, 'index.md');
  // 如果文件不存在，或者【旧文件内容】与【新生成内容】不一致时，才允许写入磁盘
  if (!fs.existsSync(indexPath) || fs.readFileSync(indexPath, 'utf-8') !== content) {
    fs.writeFileSync(indexPath, content);
  }

}


// 👉 【新增核心逻辑】：递归计算当前目录及所有子目录下的真实文件数量
function getDeepStats(targetPath) {
  let totalFiles = 0;
  let totalDirs = 0;

  // 复用你已经写好的 scanDir，它自带了忽略 public 和 .git 等文件夹的功能
  const { directories, files } = scanDir(targetPath, ignorePatterns);

  // 统计当前层的有效笔记
  const validFiles = files.filter(f => f.endsWith('.md') && f !== 'index.md');
  totalFiles += validFiles.length;
  totalDirs += directories.length;

  // 顺藤摸瓜，递归统计子文件夹里的数量
  for (const dir of directories) {
    const subStats = getDeepStats(path.join(targetPath, dir));
    totalFiles += subStats.totalFiles;
    totalDirs += subStats.totalDirs;
  }

  return { totalFiles, totalDirs };
}

// 启动扫描（针对根目录，额外排除 public 文件夹）
const { directories: rootDirs } = scanDir(docsDir, [...ignorePatterns, '!public']);
for (const dir of rootDirs) {
  generateIndexForDir(path.join(docsDir, dir));
}

console.log('✅ 文件夹导读页自动生成完毕！(基于扫描器重构版)');