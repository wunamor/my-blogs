<template>
  <span
    class="vp-spoiler"
    :class="{ 'is-revealed': isRevealed }"
    @click="isRevealed = true"
    title="点击显示隐藏内容"
  >
    <slot></slot>
  </span>
</template>

<script setup>
  import { ref } from 'vue'
  const isRevealed = ref(false)
</script>

<style scoped>

  /* 核心：未揭开时的状态 */
  .vp-spoiler {
    position: relative;
    cursor: pointer;
    color: transparent !important;
    border-radius: 4px;
    padding: 0 4px;
    user-select: none;
    transition: color 0.3s ease;

    /* 保持不被撕裂 */
    display: inline-block;
    vertical-align: baseline;
  }

  /* 💡 终极屏蔽魔法：强行把内部的所有子元素（如 `code`、`strong` 等）全变透明！ */
  .vp-spoiler:not(.is-revealed) * {
    color: transparent !important;
    background-color: transparent !important;
    border-color: transparent !important;
    box-shadow: none !important;
  }

  /* 纯 CSS 绘制 Telegram 风格的斜纹马赛克遮罩 */
  .vp-spoiler::after {
    content: "";
    position: absolute;
    inset: 0;
    border-radius: 4px;
    /* 使用纯色背景（白天浅灰/黑夜深灰），杜绝任何透视 */
    background-color: var(--vp-c-bg-mute);
    background-image: repeating-linear-gradient(45deg,
        transparent,
        transparent 2px,
        var(--vp-c-text-3) 2px,
        var(--vp-c-text-3) 4px);
    /* 💡 透明度改为 1，100% 实体遮挡 */
    opacity: 1;
    transition: opacity 0.3s ease;
  }

  /* 揭开后的状态：恢复显示 */
  .vp-spoiler.is-revealed {
    color: var(--vp-c-text-1) !important;
    background-color: rgba(128, 128, 128, 0.15);
    user-select: text;
    cursor: text;
  }

  .vp-spoiler.is-revealed::after {
    opacity: 0;
    pointer-events: none;
  }

  /* 揭开后，子元素也恢复原状 */
  .vp-spoiler.is-revealed * {
    transition: color 0.3s ease, background-color 0.3s ease;
  }
</style>