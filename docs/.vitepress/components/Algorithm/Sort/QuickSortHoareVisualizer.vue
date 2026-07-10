<template>
  <AlgorithmVisualizerLayout
    title="快速排序 (Hoare法)"
    storageKey="QuickSortHoareVisualizerConfig_v1"
    defaultArray="47, 29, 71, 99, 78, 19, 24, 47"
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
  import AlgorithmVisualizerLayout from '../AlgorithmVisualizerLayout.vue'
  import ArrayDisplay from '../../common/ArrayDisplay.vue'

  const steps = ref([])

  const calculateSteps = (rawInputString) => {
    const arr = rawInputString.split(',').map(n => parseInt(n.trim())).filter(n => !isNaN(n))
      .map(n => ({ val: n, id: Math.random().toString(36).slice(2) })) // 注入 ID 开启物理动画追踪
    if (arr.length === 0) return

    steps.value = []
    let currentArr = [...arr]

    // 用于记录已经排好序（基准已归位）的索引，全局涂绿
    const sortedIndices = new Set()
    let passNum = 0

    // 强大的标准化推送函数：完全依靠数据驱动 UI
    const pushStep = (pivotIdx, l, r, description) => {
      const highlights = {}
      const labels = {}

      // 1. 涂绿已归位的基准元素
      sortedIndices.forEach(idx => {
        highlights[idx] = ['is-sorted']
      })

      // 2. 标记当前基准 Pivot (复用黄色 is-min 样式)
      if (pivotIdx !== -1) {
        highlights[pivotIdx] = highlights[pivotIdx] ? [...highlights[pivotIdx], 'is-min'] : ['is-min']
        labels[pivotIdx] = ['基准']
      }

      // 3. 标记左指针 L (蓝色) 和右指针 R (粉红)
      if (l !== -1) {
        highlights[l] = highlights[l] ? [...highlights[l], 'is-current-i'] : ['is-current-i']
        labels[l] = labels[l] ? [...labels[l], 'L'] : ['L']
      }

      if (r !== -1) {
        highlights[r] = highlights[r] ? [...highlights[r], 'is-scanning-j'] : ['is-scanning-j']
        labels[r] = labels[r] ? [...labels[r], 'R'] : ['R']
      }

      steps.value.push({ currentArray: [...currentArr], highlights, labels, description, passId: passNum })
    }

    pushStep(-1, -1, -1, '初始状态，准备开始快速排序。')

    // 快排递归核心函数
    const quickSort = (left, right) => {
      if (left > right) return
      if (left === right) {
        sortedIndices.add(left)
        pushStep(-1, -1, -1, `区间 [${left}, ${right}] 只有一个元素，天然归位。`)
        return
      }

      passNum++
      let pivotIdx = left
      let pivotVal = currentArr[left].val
      let l = left
      let r = right

      pushStep(pivotIdx, l, r, `【新区间】选择首元素 ${pivotVal} 作为基准，L、R 指针分别指向左右两端。`)

      while (l < r) {
        // ⚠️ 经典细节：如果以最左边为基准，必须让右指针(R)先走！
        pushStep(pivotIdx, l, r, `右指针 R 开始向左寻找比基准 ${pivotVal} 小的元素。`)
        while (l < r && currentArr[r].val >= pivotVal) {
          r--
          pushStep(pivotIdx, l, r, `R(${currentArr[r + 1].val}) >= 基准，R 继续左移。`)
        }
        if (l < r) pushStep(pivotIdx, l, r, `找到 R(${currentArr[r].val}) < 基准，R 停止移动。`)

        // 左指针(L)开始移动
        if (l < r) {
          pushStep(pivotIdx, l, r, `左指针 L 开始向右寻找比基准 ${pivotVal} 大的元素。`)
        }
        while (l < r && currentArr[l].val <= pivotVal) {
          l++
          if (l < r) pushStep(pivotIdx, l, r, `L(${currentArr[l - 1].val}) <= 基准，L 继续右移。`)
        }
        if (l < r) pushStep(pivotIdx, l, r, `找到 L(${currentArr[l].val}) > 基准，L 停止移动。`)

        // 当 L 和 R 都停下，且未相遇时，交换它们
        if (l < r) {
          pushStep(pivotIdx, l, r, `准备交换 L 和 R。`)

          // 交换对象引用，利用 Vue TransitionGroup 触发完美的物理交叉动画！
          let temp = currentArr[l]
          currentArr[l] = currentArr[r]
          currentArr[r] = temp

          pushStep(pivotIdx, l, r, `交换完成，继续本轮探测。`)
        }
      }

      // L 和 R 相遇，基准归位
      pushStep(pivotIdx, l, r, `L 和 R 相遇在位置 ${l}，准备将基准 ${pivotVal} 与之交换。`)

      if (pivotIdx !== l) {
        let temp = currentArr[pivotIdx]
        currentArr[pivotIdx] = currentArr[l]
        currentArr[l] = temp
        pivotIdx = l // 更新基准所在的新下标，用于渲染
      }

      sortedIndices.add(pivotIdx)
      pushStep(pivotIdx, -1, -1, `基准归位完成，该元素已处于最终排序位置（绿色）。`)

      // 分治递归处理左右子区间
      let currentPivot = pivotIdx
      quickSort(left, currentPivot - 1)
      quickSort(currentPivot + 1, right)
    }

    // 启动排序
    quickSort(0, currentArr.length - 1)

    // 排序彻底完成
    currentArr.forEach((_, i) => sortedIndices.add(i))
    pushStep(-1, -1, -1, '🎉 快速排序彻底完成！全员归位。')
  }
</script>

<style scoped>
  /* 同样留空！享受完全脱离 CSS 泥沼的数据驱动乐趣吧！ */
</style>