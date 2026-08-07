<template>
  <!-- 根据 mode 动态切换包裹标签，杜绝 HTML 规范冲突 -->
  <component
    :is="mode === 'block' ? 'div' : 'span'"
    class="vp-spoiler"
    :class="[mode === 'block' ? 'spoiler-block' : 'spoiler-inline', { 'is-revealed': isRevealed }]"
    @click="isRevealed = true"
    :title="isRevealed ? null : '点击显示隐藏内容'"
  >
    <!-- 内部容器：通过控制它的透明度，完美解决任何内部元素（代码块、背景色）的穿透问题 -->
    <component 
      :is="mode === 'block' ? 'div' : 'span'"
      class="spoiler-content"
    >
      <slot></slot>
    </component>
  </component>
</template>

<script setup>
import { ref } from 'vue'

const props = defineProps({
  mode: {
    type: String,
    default: 'inline' // 默认为行内模式
  }
})

const isRevealed = ref(false)
</script>

<style scoped>
/* ================= 基础结构 ================= */
.vp-spoiler {
  position: relative;
  cursor: pointer;
  border-radius: 4px;
  
  /* 💡 核心转变：抛弃 ::after，直接将马赛克画在本体上，完美跟随文本换行 */
  background-color: var(--vp-c-bg-mute);
  background-image: repeating-linear-gradient(45deg,
      transparent,
      transparent 2px,
      var(--vp-c-text-3) 2px,
      var(--vp-c-text-3) 4px);
  transition: background 0.3s ease;
  
  /* 💡 视觉黑魔法：box-decoration-break
     保证长文本换行时，每一行的首尾都会被独立切断，并保持圆角和背景的连贯性 */
  -webkit-box-decoration-break: clone;
  box-decoration-break: clone;
}

/* 揭开后，清除马赛克，恢复普通背景并重置光标 */
.vp-spoiler.is-revealed {
  cursor: auto; 
  background-image: none;
  background-color: rgba(128, 128, 128, 0.15);
}

/* ================= 行内与块级形态 ================= */
.spoiler-inline {
  display: inline;
  vertical-align: baseline;
  padding: 0 4px;
}

.spoiler-block {
  display: block;
  width: 100%; 
  margin: 16px 0; 
}

/* ================= 核心屏蔽魔法 ================= */
/* 
  利用内层统一控制透明度：
  这不仅能隐形文字，连代码块自带的背景色、高亮都会被彻底透明化。
  由于外层有马赛克背景，所以完美实现了遮挡。
*/
.vp-spoiler:not(.is-revealed) > .spoiler-content {
  opacity: 0 !important;
  pointer-events: none;
}

.vp-spoiler.is-revealed > .spoiler-content {
  opacity: 1 !important;
  transition: opacity 0.3s ease;
}

/* ================= 智能形态感知 (防御性拓展) ================= */
/* 
  利用 :has() 伪类侦测内部插槽。
  即使在行内语法下，只要内部意外包含了块级元素（如引用、代码块等），
  自动强制觉醒为 block 块级形态，杜绝排版错乱。
*/
.vp-spoiler:has(blockquote, pre, div, p, ul, ol, li, table) {
  display: block !important;
  width: 100% !important;
  margin: 16px 0 !important;
  padding: 0 !important;
}

.vp-spoiler:has(blockquote, pre, div, p, ul, ol, li, table) > .spoiler-content {
  display: block !important;
}
</style>