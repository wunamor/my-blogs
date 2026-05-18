// scripts/auto-index.mjs
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { scanDir } from './scanner.mjs'; // 👇 引入我们抽离的扫描器

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const docsDir = path.resolve(__dirname, '../docs');

// 💡 提取公共过滤规则：匹配所有(*)，排除隐藏文件(!.*)和导读页(!index.md)
const ignorePatterns = ['*', '!.*', '!index.md', '!images'];

function generateIndexForDir(dir) {
  // 一行代码获取过滤好的文件夹和文件列表！
  const { directories, files } = scanDir(dir, ignorePatterns);
  const cleanName = path.basename(dir);

  let content = `---\n`;
  content += `title: ${cleanName}\n`;
  content += `---\n\n`;
  content += `\n\n`;
  content += `# 📁 ${cleanName}\n\n`;
  content += `> 本页面由系统自动生成，请勿手动修改。\n\n`;

  let hasItems = false;

  // 1. 递归处理子文件夹
  for (const item of directories) {
    const encodedItem = encodeURIComponent(item);
    content += `- 📂 [${item}](./${encodedItem}/)\n`;
    hasItems = true;
    generateIndexForDir(path.join(dir, item));
  }

  // 2. 处理 Markdown 文件
  for (const item of files) {
    if (!item.endsWith('.md')) continue;

    let displayName = item.replace('.md', '');
    const itemPath = path.join(dir, item);

    try {
      const fileContent = fs.readFileSync(itemPath, 'utf-8');
      const titleMatch = fileContent.match(/^#\s+(.+)/m);
      if (titleMatch) displayName = titleMatch[1].trim();
    } catch (err) { }

    const encodedItem = encodeURIComponent(item);
    content += `- 📄 [${displayName}](./${encodedItem})\n`;
    hasItems = true;
  }

  // 生成或更新 index.md
  if (hasItems) {
    const indexPath = path.join(dir, 'index.md');
    if (!fs.existsSync(indexPath) || fs.readFileSync(indexPath, 'utf-8').includes('')) {
      fs.writeFileSync(indexPath, content);
    }
  }
}

// 启动扫描（针对根目录，额外排除 public 文件夹）
const { directories: rootDirs } = scanDir(docsDir, [...ignorePatterns, '!public']);
for (const dir of rootDirs) {
  generateIndexForDir(path.join(docsDir, dir));
}

console.log('✅ 文件夹导读页自动生成完毕！(基于扫描器重构版)');