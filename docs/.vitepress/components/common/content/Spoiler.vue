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
}

/* ================= 行内形态 ================= */
.spoiler-inline {
  display: inline;
  vertical-align: baseline;
  padding: 0 4px;
}

.spoiler-inline.is-revealed {
  background-color: rgba(128, 128, 128, 0.15);
}

/* ================= 块级形态 ================= */
.spoiler-block {
  display: block;
  width: 100%; /* 💡 块级模式下自动占满 100% 宽度 */
  margin: 16px 0; /* 给多行代码块留出呼吸空间 */
}

/* ================= 核心屏蔽魔法 ================= */
/* 
  利用内层统一控制透明度：
  未揭开时，将内部所有内容变为透明并禁用交互。
  这不仅能遮挡文字，连代码块自带的背景色、高亮、甚至是点击复制按钮，都会被完美隐藏！
*/

.vp-spoiler {
  position: relative;
  cursor: pointer; /* 未揭开时：全局小手样式 */
  border-radius: 4px;
}

/* 💡 核心优化：揭开后，恢复浏览器默认的光标逻辑 */
.vp-spoiler.is-revealed {
  cursor: auto; 
}

.vp-spoiler:not(.is-revealed) > .spoiler-content {
  opacity: 0 !important;
  pointer-events: none;
}

.vp-spoiler.is-revealed > .spoiler-content {
  opacity: 1 !important;
  transition: opacity 0.3s ease;
}

/* ================= 马赛克遮罩层 ================= */
.vp-spoiler::after {
  content: "";
  position: absolute;
  inset: 0;
  border-radius: 4px;
  background-color: var(--vp-c-bg-mute);
  background-image: repeating-linear-gradient(45deg,
      transparent,
      transparent 2px,
      var(--vp-c-text-3) 2px,
      var(--vp-c-text-3) 4px);
  opacity: 1;
  transition: opacity 0.3s ease;
  z-index: 10; /* 💡 强行提升层级，彻底盖住代码块内部乱七八糟的 z-index */
}

.vp-spoiler.is-revealed::after {
  opacity: 0;
  pointer-events: none;
}


/* ================= 智能形态感知 (核心修复) ================= */
/* 
  利用 :has() 伪类侦测内部插槽。
  即使 Markdown 插件没有传入 mode="block"，只要内部包含了块级元素（如引用、代码块、段落等），
  组件就会自动强制觉醒为 block 块级形态，完美解决 span 塌陷导致遮罩层变成一条线的问题！
*/
.vp-spoiler:has(blockquote, pre, div, p, ul, ol, li, table) {
  display: block !important;
  width: 100% !important;
  margin: 16px 0 !important;
  padding: 0 !important; /* 抵消 inline 模式可能带入的 0 4px */
}

/* 同步升级内部内容容器的形态 */
.vp-spoiler:has(blockquote, pre, div, p, ul, ol, li, table) > .spoiler-content {
  display: block !important;
}
</style>