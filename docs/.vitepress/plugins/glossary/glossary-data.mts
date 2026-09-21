// docs/.vitepress/plugins/glossary/glossary-data.mts
// 词典数据总入口 = 自动扫描词条 + 手写覆盖层。
// 自动词条由 glossary-scanner.mts 按 glossary-scan.config.mts 的扫描配置生成；
// 手写层优先级最高：同名关键词永远以手写为准（用于覆盖链接目标或补充扫描不到的术语）。

import { scannedGlossary } from './glossary-scanner.mts'

// ✍️ 手写覆盖区（随便加，不用管顺序！插件引擎会自动按长度排序）
// 这里的词条优先级最高：同名关键词会覆盖自动扫描结果，用于链接扫描不到的术语，
// 或强行改写自动词条的目标地址。原本手写的 15 条（设计模式/排序十法/背单词软件）
// 已能被 glossary-scan.config.mts 中的扫描配置完整复现，故已删除。
const manualGlossary: Record<string, string> = {
  // 'RAG' 这个关键词既不是文件名也不是目标页的标题，只能手写登记：
  'RAG': '/01-计算机与IT技术/01-比特就业课/03-LangChain&LangGraph-AI应用开发框架精品课/01-LangChain-AI应用开发框架精品课/02-嵌入式模型#应用场景',
  // '科目一': '/驾考交规/01-科目一/index',
}

export const glossary: Record<string, string> = {
  ...scannedGlossary,
  ...manualGlossary,
}
