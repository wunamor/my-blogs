<template>
  <div
    class="tree-display-inner"
    :style="{ minHeight: treeHeight + 'px' }"
  >
    <svg class="tree-lines">
      <template
        v-for="n in items.length"
        :key="'line-' + n"
      >
        <line
          v-if="2 * (n - 1) + 1 < items.length"
          :x1="getTreePos(n - 1).left"
          :y1="getTreePos(n - 1).top"
          :x2="getTreePos(2 * (n - 1) + 1).left"
          :y2="getTreePos(2 * (n - 1) + 1).top"
          stroke="var(--vp-c-border)"
          stroke-width="2"
        />
        <line
          v-if="2 * (n - 1) + 2 < items.length"
          :x1="getTreePos(n - 1).left"
          :y1="getTreePos(n - 1).top"
          :x2="getTreePos(2 * (n - 1) + 2).left"
          :y2="getTreePos(2 * (n - 1) + 2).top"
          stroke="var(--vp-c-border)"
          stroke-width="2"
        />
      </template>
    </svg>

    <TransitionGroup
      name="swap"
      tag="div"
      class="tree-nodes-container"
    >
      <div
        v-for="(item, idx) in items"
        :key="item.id"
        class="tree-node-wrapper"
        :style="{ left: getTreePos(idx).left, top: getTreePos(idx).top }"
      >
        <div
          class="tree-node"
          :class="getHighlightClasses(idx)"
        >
          <div class="item-value">{{ item.val }}</div>
          <div
            class="item-label"
            v-if="getLabels(idx).length > 0"
          >
            <span
              v-for="(label, li) in getLabels(idx)"
              :key="li"
              :class="getLabelClass(label)"
            >{{ label }}</span>
          </div>
        </div>
      </div>
    </TransitionGroup>
  </div>
</template>

<script setup>
  import { computed } from 'vue'

  const props = defineProps({
    // 必须传入的数据源 [{ val: 1, id: 'xxx' }, ...]
    items: { type: Array, required: true },
    // 高亮类名映射 { 0: ['is-sorted'], 1: ['is-parent'] }
    highlights: { type: Object, default: () => ({}) },
    // 底部标签映射 { 0: ['父节点'], 1: ['子节点'] }
    labels: { type: Object, default: () => ({}) }
  })

  // 解析高亮 CSS 类
  const getHighlightClasses = (idx) => {
    return props.highlights[idx] ? props.highlights[idx].join(' ') : ''
  }

  // 解析文本标签
  const getLabels = (idx) => {
    return props.labels[idx] || []
  }

  // 简单的标签特殊样式钩子 (如果传入的是特定文字，可以给予特殊背景色)
  const getLabelClass = (label) => {
    if (label === '父节点') return 'parent-label'
    return ''
  }

  // 核心计算 1：动态计算容器所需的高度 (根据二叉树最大层数)
  const treeHeight = computed(() => {
    if (!props.items || props.items.length === 0) return 300
    const totalNodes = props.items.length
    const maxLevel = Math.floor(Math.log2(totalNodes))
    return (maxLevel + 1) * 70 + 80 // 每层 70px + 顶部预留 80px
  })

  // 核心计算 2：根据数组索引，计算节点在完全二叉树上的精确物理坐标 (百分比 + px)
  const getTreePos = (idx) => {
    const level = Math.floor(Math.log2(idx + 1))       // 当前层数 (0-indexed)
    const nodesInLevel = Math.pow(2, level)            // 本层最大节点容量
    const positionInLevel = idx - (nodesInLevel - 1)   // 本层第几个节点
    const left = ((positionInLevel + 0.5) / nodesInLevel) * 100 // X轴百分比
    const top = level * 70 + 40                        // Y轴绝对高度
    return { left: `${left}%`, top: `${top}px` }
  }
</script>

<style scoped>

  /* 1. 建立层叠大舞台 */
  .tree-display-inner {
    position: relative;
    width: 100%;
    padding: 20px;
    box-sizing: border-box;
    z-index: 1;
  }

  /* 2. 连线强制沉底 */
  .tree-lines {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
    z-index: 0;
    pointer-events: none;
  }

  /* 3. 节点容器与 wrapper 定位 */
  .tree-nodes-container {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
    z-index: 1;
  }

  /* wrapper 负责接收 absolute 绝对定位，避开 Vue 动画 transform 冲突 */
  .tree-node-wrapper {
    position: absolute;
    transition: all 0.5s ease;
  }

  /* 4. 节点内容样式 */
  .tree-node {
    display: flex;
    flex-direction: column;
    align-items: center;
    width: 48px;
    /* 让元素的中心点对准连线坐标 */
    transform: translate(-50%, -50%);
  }

  /* 强制变为完美的圆形，并遮盖底下的连线 */
  .tree-node .item-value {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 40px;
    height: 40px;
    border-radius: 50% !important;
    /* 圆形覆盖 */
    background-color: var(--vp-c-bg);
    border: 2px solid var(--vp-c-border);
    color: var(--vp-c-text-1);
    font-weight: bold;
    font-size: 18px;
    z-index: 10;
    transition: all 0.3s ease;
  }

  /* 标签通用样式 */
  .item-label {
    position: absolute;
    top: 100%;
    margin-top: 4px;
    font-size: 11px;
    display: flex;
    gap: 4px;
    color: var(--vp-c-text-2);
    white-space: nowrap;
  }

  .item-label span {
    padding: 0 4px;
    border-radius: 4px;
    background: rgba(128, 128, 128, 0.2);
  }

  .parent-label {
    color: #f59e0b;
    background: rgba(245, 158, 11, 0.2) !important;
  }

  /* 5. 动画相关 (与 ArrayDisplay 保持一致) */
  .swap-move {
    transition: transform 0.5s cubic-bezier(0.55, 0, 0.1, 1);
  }

  .swap-leave-active {
    position: absolute !important;
  }

  .swap-enter-active,
  .swap-leave-active {
    transition: all 0.5s ease;
  }

  .swap-enter-from,
  .swap-leave-to {
    opacity: 0;
    transform: scale(0.5);
  }
</style>