// scripts/auto-index.mjs
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { scanDir, createNameResolver } from './scanner.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const docsDir = path.resolve(__dirname, '../docs');

// 💡 提取公共过滤规则：匹配所有(*)，排除隐藏文件(!.*)和导读页(!index.md)
const ignorePatterns = ['*', '!.*', '!index.md', '!images'];

function generateIndexForDir(dir) {
  // 一行代码获取过滤好的文件夹和文件列表！
  const { directories, files } = scanDir(dir, ignorePatterns);
  const cleanName = path.basename(dir).replace(/^(\d+-)+/, ''); // 去掉 0xx-...-0xx- 数字前缀，保留纯名称

  let content = `---\n`;
  content += `title: ${cleanName}\n`;
  content += `---\n\n`;
  content += `\n\n`;
  content += `# 📁 ${cleanName}\n\n`;
  content += `> 本页面由系统自动生成，请勿手动修改。\n\n`;

  let hasItems = false;

  // 👉 实例化当前目录的解析器，传入所有的物理名称
  const resolver = createNameResolver([
    ...directories,
    ...files.map(f => f.replace('.md', ''))
  ]);

  // 1. 递归处理子文件夹
  for (const item of directories) {
    const encodedItem = encodeURIComponent(item);

    // 一行代码搞定防重名去前缀！
    const displayName = resolver(item);

    content += `- 📂 [${displayName}](./${encodedItem}/)\n`;
    hasItems = true;
    generateIndexForDir(path.join(dir, item));
  }

  // 2. 处理 Markdown 文件
  for (const item of files) {
    if (!item.endsWith('.md')) continue;

    let originalName = item.replace('.md', '');
    let explicitTitle = null;
    const itemPath = path.join(dir, item);

    try {
      const fileContent = fs.readFileSync(itemPath, 'utf-8');
      const titleMatch = fileContent.match(/^#\s+(.+)/m);
      if (titleMatch) explicitTitle = titleMatch[1].trim();
    } catch (err) { }

    // 一行代码搞定带标题提取的防重名！
    const displayName = resolver(originalName, explicitTitle);

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