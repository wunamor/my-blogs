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

/**
 * 脱马甲：剔除名称开头的数字排序前缀（如 "01-"、"2025-07-31-" 中的序号部分）
 * @param {string} name - 原始文件/文件夹名
 * @returns {string}
 */
export function stripNumericPrefix(name) {
  return name.replace(/^(\d+-)+/, '');
}

/**
 * 判断一个文件/文件夹名是否命中 glob 规则列表中的任意一条
 * @param {string} name - 文件/文件夹的 basename
 * @param {string[]} patterns - micromatch glob 规则列表
 * @returns {boolean}
 */
export function matchAnyGlob(name, patterns = []) {
  if (!patterns.length) return false;
  return micromatch.any(name, patterns);
}

// VitePress 1.6 标题锚点的真实算法（逐字复刻自 vitepress/dist/node 内联实现），
// 用于让扫描器生成的 "#锚点" 与页面实际渲染出的 heading id 完全一致。
const rControl = /[\u0000-\u001f]/g;
const rSpecial = /[\s~`!@#$%^&*()\-_+=[\]{}|\\;:"'“”‘’<>,.?/]+/g;
const rCombining = /[\u0300-\u036F]/g;

/**
 * 与 VitePress 渲染端一致的标题转锚点函数
 * @param {string} str - 标题纯文本
 * @returns {string}
 */
export function vitepressSlugify(str) {
  return str
    .normalize('NFKD')
    .replace(rCombining, '')
    .replace(rControl, '')
    .replace(rSpecial, '-')
    .replace(/-{2,}/g, '-')
    .replace(/^-+|-+$/g, '')
    .replace(/^(\d)/, '_$1')
    .toLowerCase();
}

/**
 * 创建一个当前层级的“防撞车”名称解析器
 * @param {string[]} existingNamesArray - 当前层级所有真实的物理名称列表
 */
export function createNameResolver(existingNamesArray) {
  // 1. 记录当前层级所有真实存在的物理名字
  const allNames = new Set(existingNamesArray);
  // 2. 记录已经被脱去马甲展示过的名字
  const seen = new Set();

  /**
   * @param {string} originalName - 真实的文件/文件夹名 (例如: 01-test)
   * @param {string} [candidateName] - 备选名(例如从 Markdown 提取的大标题)
   */
  return function resolve(originalName, candidateName = null) {
    let targetName = candidateName || originalName;
    let displayName = stripNumericPrefix(targetName); // 尝试脱马甲

    // 智能避让逻辑：
    // 如果脱马甲后的名字和别人真实存在的物理名字撞了，或者已经被前面的兄弟抢注了
    if ((displayName !== targetName && allNames.has(displayName)) || seen.has(displayName)) {
      displayName = targetName; // 乖乖穿回马甲，防止冲突
    }

    seen.add(displayName);
    return displayName;
  };
}