<template>
  <AlgorithmVisualizerLayout
    title="选择排序"
    storageKey="SelectionSortVisualizerConfig_v2"
    defaultArray="64, 25, 12, 22, 11"
    :defaultInterval="800"
    :actionButtons="visualizerButtons"
    :steps="steps"
    @calculate="calculateSteps"
  >
    <template #visualization="{ step }">
      <ArrayDisplay
        :items="step.currentArray"
        :highlights="step.highlights"
        :labels="step.labels"
      />
    </template>
  </AlgorithmVisualizerLayout>
</template>

<script setup>
  import { ref } from 'vue'
  import AlgorithmVisualizerLayout from '@components/common/visualization/VisualizerLayout.vue'
  import ArrayDisplay from '@components/common/visualization/ArrayDisplay.vue' // 引入通用数组组件

  const visualizerButtons = [
    { id: 'prev', label: '上一步', icon: 'prev' },
    { id: 'play', label: '自动播放', labelPause: '暂停', icon: 'play', iconPause: 'pause' },
    { id: 'next', label: '下一步', icon: 'next' },
    { id: 'skip', label: '跳过本轮', icon: 'skip' }
  ]

  const steps = ref([])

  const calculateSteps = (rawInputString) => {
    const arr = rawInputString.split(',').map(n => parseInt(n.trim())).filter(n => !isNaN(n))
      .map(n => ({ val: n, id: Math.random().toString(36).slice(2) })) // 注入 ID 开启物理动画
    if (arr.length === 0) return

    steps.value = []
    let currentArr = [...arr]

    // 核心：标准化的快照推入函数
    const pushStep = (highlights, labels, description, passId) => {
      steps.value.push({ currentArray: [...currentArr], highlights, labels, description, passId })
    }

    pushStep({ 0: ['is-current-i'] }, { 0: ['i'] }, '初始状态，准备开始选择排序。', 0)

    // 记录已经排好序的索引，用于累加绿色高亮
    const sortedIdx = []

    for (let i = 0; i < currentArr.length - 1; i++) {
      let minIdx = i
      // 生成当前已排序的绿色底色对象
      const baseHighlights = Object.fromEntries(sortedIdx.map(idx => [idx, ['is-sorted']]))

      pushStep({ ...baseHighlights, [i]: ['is-current-i'], [i + 1]: ['is-scanning-j'] }, { [i]: ['i'], [i + 1]: ['j'] }, `【第 ${i + 1} 轮】位置 i(${i}) 设为当前最小值，向后寻找。`, i + 1)

      for (let j = i + 1; j < currentArr.length; j++) {
        let isNewMin = currentArr[j].val < currentArr[minIdx].val
        if (isNewMin) minIdx = j
        pushStep(
          { ...baseHighlights, [i]: ['is-current-i'], [j]: ['is-scanning-j'], [minIdx]: ['is-min'] },
          { [i]: ['i'], [j]: ['j'], [minIdx]: ['min'] },
          isNewMin ? `发现更小值 ${currentArr[j].val}！更新 min。` : `比较 ${currentArr[j].val} 与当前最小值 ${currentArr[minIdx].val}。`,
          i + 1
        )
      }

      if (minIdx !== i) {
        let temp = currentArr[i]
        currentArr[i] = currentArr[minIdx]
        currentArr[minIdx] = temp
        pushStep({ ...baseHighlights, [i]: ['is-sorted'], [minIdx]: ['is-sorted'] }, { [i]: ['已交换'] }, `将最小值 ${currentArr[i].val} 与位置 i 交换。`, i + 1)
      }

      sortedIdx.push(i) // 本轮结束，i 正式进入已排序区
      pushStep(Object.fromEntries(sortedIdx.map(idx => [idx, ['is-sorted']])), {}, `位置 i(${i}) 已排序完毕。`, i + 1)
    }

    const allSorted = Object.fromEntries(currentArr.map((_, idx) => [idx, ['is-sorted']]))
    pushStep(allSorted, {}, '🎉 排序彻底完成！', currentArr.length)
  }
</script>

<style scoped>
  .array-display-inner {
    display: flex;
    gap: 12px;
    align-items: flex-end;
    justify-content: center;
    width: 100%;
    height: 100%;
    padding: 40px 20px;
    box-sizing: border-box;
  }

  .array-item {
    display: flex;
    flex-direction: column;
    align-items: center;
    width: 48px;
  }

  .item-value {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 40px;
    height: 40px;
    border-radius: 6px;
    background-color: var(--vp-c-default-soft);
    color: var(--vp-c-text-1);
    font-weight: bold;
    font-size: 18px;
    transition: all 0.3s ease;
    border: 2px solid transparent;
  }

  .item-label {
    height: 20px;
    margin-top: 8px;
    font-size: 12px;
    display: flex;
    gap: 4px;
    color: var(--vp-c-text-2);
  }

  .item-label span {
    padding: 0 4px;
    border-radius: 4px;
    background: rgba(128, 128, 128, 0.2);
  }

  .min-label {
    color: #eab308;
    background: rgba(234, 179, 8, 0.2) !important;
  }

  /* 【核心魔法 4】：声明元素的移动补间动画 */
  .swap-move {
    transition: transform 0.5s cubic-bezier(0.55, 0, 0.1, 1);
  }

  .is-sorted .item-value {
    background-color: rgba(16, 185, 129, 0.15);
    border-color: #10b981;
    color: #10b981;
  }

  .is-current-i .item-value {
    border-color: #3b82f6;
    box-shadow: 0 0 10px rgba(59, 130, 246, 0.3);
  }

  .is-scanning-j .item-value {
    border-color: #ec4899;
    transform: translateY(-4px);
  }

  .is-min .item-value {
    background-color: rgba(234, 179, 8, 0.2);
    border-color: #eab308;
  }
</style>