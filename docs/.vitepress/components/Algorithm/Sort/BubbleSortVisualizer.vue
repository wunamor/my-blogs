<template>
  <AlgorithmVisualizerLayout
    title="冒泡排序"
    storageKey="BubbleSortVisualizerConfig_v1"
    defaultData="64, 34, 25, 12, 22, 11, 90"
    :defaultInterval="800"
    :actionButtons="visualizerButtons"
    :steps="steps"
    @calculate="calculateSteps"
  >
    <template #visualization="{ step }">
      <ArrayDisplay
        v-if="step"
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
  import ArrayDisplay from '@components/common/visualization/ArrayDisplay.vue'

  // 【标准化接入】：业务方定义的极简按钮组
  const visualizerButtons = [
    { id: 'prev', label: '上一步', icon: 'prev' },
    { id: 'play', label: '自动播放', labelPause: '暂停', icon: 'play', iconPause: 'pause' },
    { id: 'next', label: '下一步', icon: 'next' },
    { id: 'skip', label: '跳过本轮', icon: 'skip' }
  ]

  const steps = ref([])

  const calculateSteps = (rawInputString) => {
    const arr = rawInputString.split(',').map(n => parseInt(n.trim())).filter(n => !isNaN(n))
      .map(n => ({ val: n, id: Math.random().toString(36).slice(2) })) // 注入 ID 开启物理动画追踪
    if (arr.length === 0) return

    steps.value = []
    let currentArr = [...arr]
    let passNum = 0

    // 标准化推送函数：完全依靠数据驱动 UI
    const pushStep = (sortedFrom, compareLeft, compareRight, isSwapping, description, passId) => {
      const highlights = {}
      const labels = {}

      // 绿色：已排序区间 (从 sortedFrom 一直到数组末尾)
      for (let k = sortedFrom; k < currentArr.length; k++) {
        highlights[k] = ['is-sorted']
      }

      // 高亮正在比较的两个相邻元素
      if (compareLeft !== -1 && compareRight !== -1) {
        highlights[compareLeft] = ['is-current-i']    // 左侧元素变蓝悬浮
        highlights[compareRight] = ['is-scanning-j']  // 右侧元素变粉红

        if (isSwapping) {
          labels[compareLeft] = ['交换']
          labels[compareRight] = ['交换']
        } else {
          labels[compareLeft] = ['j']
          labels[compareRight] = ['j+1']
        }
      }

      steps.value.push({ currentArray: [...currentArr], highlights, labels, description, passId })
    }

    pushStep(currentArr.length, -1, -1, false, '初始状态，准备开始冒泡排序。', 0)

    // 外层循环：i 代表每一轮需要冒泡达到的无序区边界
    for (let i = currentArr.length - 1; i > 0; i--) {
      passNum++
      pushStep(i + 1, -1, -1, false, `【第 ${passNum} 轮】开始，寻找前 ${i + 1} 个元素中的最大值并将其冒泡到最后。`, passNum)

      let isSwappedInPass = false // 冒泡排序的经典优化：记录本轮是否发生过交换

      // 内层循环：相邻元素两两比较
      for (let j = 0; j < i; j++) {
        pushStep(i + 1, j, j + 1, false, `比较相邻元素：${currentArr[j].val} 与 ${currentArr[j + 1].val}。`, passNum)

        if (currentArr[j].val > currentArr[j + 1].val) {
          // 【核心】：交换对象引用，保证 ID 跟随，触发 TransitionGroup 平滑动画
          let temp = currentArr[j]
          currentArr[j] = currentArr[j + 1]
          currentArr[j + 1] = temp
          isSwappedInPass = true

          pushStep(i + 1, j, j + 1, true, `${temp.val} 大于 ${currentArr[j].val}，进行交换。`, passNum)
        } else {
          pushStep(i + 1, j, j + 1, false, `${currentArr[j].val} 不大于 ${currentArr[j + 1].val}，位置不变。`, passNum)
        }
      }

      pushStep(i, -1, -1, false, `本轮结束，当前区间最大值 ${currentArr[i].val} 成功冒泡到末尾。`, passNum)

      // 优化：如果一整轮都没有发生过交换，说明数组已经完全有序，提前结束
      if (!isSwappedInPass) {
        pushStep(i, -1, -1, false, `💡 优化触发：本轮未发生任何交换，说明数组已完全有序，提前结束排序。`, passNum)
        break
      }
    }

    // 排序彻底完成，全员变绿
    const allSorted = Object.fromEntries(currentArr.map((_, idx) => [idx, ['is-sorted']]))
    steps.value.push({ currentArray: [...currentArr], highlights: allSorted, labels: {}, description: '🎉 冒泡排序彻底完成！', passId: ++passNum })
  }
</script>

<style scoped>
  /* 留空即可！所有样式（包含方块、动画、高亮色）都在 common/sortStyles.css 中全局生效了 */
</style>