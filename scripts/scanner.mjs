// scripts/scanner.mjs
import fs from 'node:fs';
import path from 'node:path';
import micromatch from 'micromatch';

/**
 * 智能扫描目录，支持 Glob 表达式过滤
 * @param {string} dirPath - 要扫描的文件夹路径
 * @param {string[]} patterns - 匹配规则，例如 ['*', '!.*', '!index.md']
 * @returns {{ directories: string[], files: string[] }}
 */
export function scanDir(dirPath, patterns = ['*']) {
  // 如果目录不存在，直接返回空
  if (!fs.existsSync(dirPath)) {
    return { directories: [], files: [] };
  }

  // 获取目录下所有文件和文件夹名称
  const allItems = fs.readdirSync(dirPath);

  // 核心魔法：使用 micromatch 进行表达式过滤
  const matchedItems = micromatch(allItems, patterns);

  const directories = [];
  const files = [];

  // 将过滤后的结果分类打包
  for (const item of matchedItems) {
    const fullPath = path.join(dirPath, item);
    if (fs.statSync(fullPath).isDirectory()) {
      directories.push(item);
    } else {
      files.push(item);
    }
  }

  return { directories, files };
}