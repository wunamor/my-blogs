import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// 获取当前路径和 docs 目录路径
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const docsDir = path.resolve(__dirname, '../docs');

function generateIndexForDir(dir) {
  const items = fs.readdirSync(dir);
  let content = `\n# 📁 ${path.basename(dir)}\n\n`;
  content += `> 本页面由系统自动生成，请勿手动修改。\n\n`;
  let hasItems = false;

  for (const item of items) {
    // 排除系统文件和 VitePress 配置
    if (item === '.vitepress' || item === 'index.md' || item.startsWith('.')) continue;

    const itemPath = path.join(dir, item);
    const stat = fs.statSync(itemPath);

    // 👇 这里增加了 encodeURIComponent 来处理空格和特殊字符
    const encodedItem = encodeURIComponent(item);

    if (stat.isDirectory()) {
      content += `- 📂 [${item}](./${encodedItem}/)\n`;
      hasItems = true;
      generateIndexForDir(itemPath); // 递归处理子文件夹
    } else if (item.endsWith('.md')) {
      // 默认名称为去掉 .md 的文件名
      let displayName = item.replace('.md', '');

      try {
        // 读取文件内容
        const fileContent = fs.readFileSync(itemPath, 'utf-8');
        // 使用正则匹配第一出现的一级标题 (例如: # 我的标题)
        const titleMatch = fileContent.match(/^#\s+(.+)/m);

        // 如果匹配到了标题，就用提取出的标题替换掉默认文件名
        if (titleMatch) {
          displayName = titleMatch[1].trim();
        }
      } catch (err) {
        console.error(`读取文件 ${item} 失败:`, err);
      }

      content += `- 📄 [${displayName}](./${encodedItem})\n`;
      hasItems = true;
    }
  }

  if (hasItems) {
    const indexPath = path.join(dir, 'index.md');
    // 安全机制：只覆盖自动生成的 index.md，如果你自己手写过，就不覆盖
    if (!fs.existsSync(indexPath) || fs.readFileSync(indexPath, 'utf-8').includes('')) {
      fs.writeFileSync(indexPath, content);
    }
  }
}

// 遍历 docs 下的所有一级目录（跳过根目录的 index.md）
const rootItems = fs.readdirSync(docsDir);
for (const item of rootItems) {
  const itemPath = path.join(docsDir, item);
  if (fs.statSync(itemPath).isDirectory() && item !== '.vitepress') {
    generateIndexForDir(itemPath);
  }
}

console.log('✅ 文件夹导读页 (index.md) 自动生成完毕！');