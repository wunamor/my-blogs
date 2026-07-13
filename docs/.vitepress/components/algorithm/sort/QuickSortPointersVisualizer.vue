<template>
  <AlgorithmVisualizerLayout
    title="快速排序 (前后指针法)"
    storageKey="QuickSortPointersVisualizerConfig_v1"
    defaultArray="47, 29, 71, 99, 78, 19, 24, 47"
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
  import AlgorithmVisualizerLayout from '@components/common/visualization/AlgorithmVisualizerLayout.vue'
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

    // 记录已经排好序（基准已归位）的索引，全局涂绿
    const sortedIndices = new Set()
    let passNum = 0

    // 强大的标准化推送函数：动态叠加标签与高亮，完美处理指针重合！
    const pushStep = (pivotIdx, prevIdx, curIdx, description) => {
      const highlights = {}
      const labels = {}

      // 1. 涂绿已归位的基准元素
      sortedIndices.forEach(idx => {
        highlights[idx] = ['is-sorted']
      })

      // 2. 标记基准 Pivot (黄色)
      if (pivotIdx !== -1) {
        highlights[pivotIdx] = ['is-min']
        labels[pivotIdx] = ['基准']
      }

      // 3. 标记 prev 指针 (蓝色)
      if (prevIdx !== -1) {
        highlights[prevIdx] = highlights[prevIdx] ? [...highlights[prevIdx], 'is-current-i'] : ['is-current-i']
        labels[prevIdx] = labels[prevIdx] ? [...labels[prevIdx], 'prev'] : ['prev']
      }

      // 4. 标记 cur 指针 (粉红)
      if (curIdx !== -1) {
        highlights[curIdx] = highlights[curIdx] ? [...highlights[curIdx], 'is-scanning-j'] : ['is-scanning-j']
        labels[curIdx] = labels[curIdx] ? [...labels[curIdx], 'cur'] : ['cur']
      }

      steps.value.push({ currentArray: [...currentArr], highlights, labels, description, passId: passNum })
    }

    pushStep(-1, -1, -1, '初始状态，准备开始快速排序(前后指针法)。')

    // 快排(前后指针法)递归核心函数
    const quickSortPointers = (left, right) => {
      if (left > right) return
      if (left === right) {
        sortedIndices.add(left)
        pushStep(-1, -1, -1, `区间 [${left}, ${right}] 只有一个元素，天然归位。`)
        return
      }

      passNum++
      let pivotIdx = left
      let pivotVal = currentArr[left].val

      // 初始化前后指针
      let prev = left
      let cur = left + 1

      pushStep(pivotIdx, prev, cur, `【新区间】选定首元素 ${pivotVal} 为基准。prev 初始指向基准，cur 指向下一个元素。`)

      while (cur <= right) {
        pushStep(pivotIdx, prev, cur, `考察 cur 指向的元素 ${currentArr[cur].val} 是否小于基准 ${pivotVal}。`)

        if (currentArr[cur].val < pivotVal) {
          prev++

          if (prev !== cur) {
            pushStep(pivotIdx, prev, cur, `${currentArr[cur].val} < 基准。将 prev 向前移动一位到 ${prev}，准备与 cur 交换。`)

            // 交换对象引用，利用 Vue 触发物理位置移动动画！
            let temp = currentArr[prev]
            currentArr[prev] = currentArr[cur]
            currentArr[cur] = temp

            pushStep(pivotIdx, prev, cur, `交换 prev 和 cur。把较小的元素推到左侧。`)
          } else {
            // 如果 prev 移动后与 cur 重合，说明中间没有大数，无需交换
            pushStep(pivotIdx, prev, cur, `${currentArr[cur].val} < 基准，prev 前移。此时 prev 与 cur 重合，无需物理交换。`)
          }
        } else {
          pushStep(pivotIdx, prev, cur, `${currentArr[cur].val} >= 基准，不满足条件，仅移动 cur。`)
        }

        cur++
        if (cur <= right) {
          pushStep(pivotIdx, prev, cur, `cur 指针右移，继续考察下一个元素。`)
        }
      }

      // 遍历结束，最后将基准点与 prev 交换
      pushStep(pivotIdx, prev, -1, `cur 越界，遍历结束。准备将基准(位置 ${pivotIdx})与 prev(位置 ${prev})进行最终交换。`)

      if (pivotIdx !== prev) {
        let temp = currentArr[pivotIdx]
        currentArr[pivotIdx] = currentArr[prev]
        currentArr[prev] = temp
        pivotIdx = prev // 更新基准所在的新下标，用于渲染
      }

      sortedIndices.add(pivotIdx)
      pushStep(pivotIdx, -1, -1, `基准归位完成，左侧皆小于它，右侧皆大于等于它。`)

      // 分治递归处理左右子区间
      quickSortPointers(left, pivotIdx - 1)
      quickSortPointers(pivotIdx + 1, right)
    }

    // 启动排序
    quickSortPointers(0, currentArr.length - 1)

    // 排序彻底完成
    currentArr.forEach((_, i) => sortedIndices.add(i))
    pushStep(-1, -1, -1, '🎉 快速排序(前后指针法)彻底完成！全员归位。')
  }
</script>

<style scoped>
  /* 同样无需任何 CSS！全局 ArrayDisplay 搞定一切！ */
</style>