<template>
  <AlgorithmVisualizerLayout
    title="堆排序 (Heap Sort)"
    storageKey="HeapSortVisualizerConfig_v3"
    defaultArray="312, 122, 64, 25, 11, 81, 12, 22"
    :defaultInterval="800"
    :actionButtons="visualizerButtons"
    :steps="steps"
    @calculate="calculateSteps"
  >
    <template #visualization="{ step }">
      <TreeDisplay
        v-if="step && step.array"
        :items="step.array"
        :highlights="step.highlights"
        :labels="step.labels"
      />
    </template>
  </AlgorithmVisualizerLayout>
</template>

<script setup>
  import { ref } from 'vue'
  import AlgorithmVisualizerLayout from '@components/common/visualization/VisualizerLayout.vue'
  import TreeDisplay from '@components/common/visualization/TreeDisplay.vue'

  const steps = ref([])

  const visualizerButtons = [
    { id: 'prev', label: '上一步', icon: 'prev' },
    { id: 'play', label: '自动播放', labelPause: '暂停', icon: 'play', iconPause: 'pause' },
    { id: 'next', label: '下一步', icon: 'next' },
    { id: 'skip', label: '跳过本轮', icon: 'skip' }
  ]

  const calculateSteps = (rawInputString) => {
    // 1. 数据解析并注入唯一 id，确保动画引擎正常追踪
    const arr = rawInputString.split(',')
      .map(n => parseInt(n.trim()))
      .filter(n => !isNaN(n))
      .map(n => ({ val: n, id: Math.random().toString(36).slice(2) }))

    if (arr.length === 0) {
      steps.value = []
      return
    }

    steps.value = []
    let currentArr = [...arr]
    let passNum = 0

    // 统一的推帧函数：将堆排序的 parent/left/right 状态转化为 TreeDisplay 需要的 highlights 和 labels
    const pushState = (heapSize, parent, left, right, largest, desc) => {
      let hM = {}
      let lM = {}

      // 已脱离堆区的元素（标记为绿色排序完成）
      for (let i = heapSize; i < currentArr.length; i++) {
        hM[i] = ['is-sorted']
      }

      // 映射父节点
      if (parent !== -1) {
        hM[parent] = [...(hM[parent] || []), 'is-parent']
        lM[parent] = ['父节点']
      }
      // 映射左子节点
      if (left !== -1 && left < heapSize) {
        hM[left] = [...(hM[left] || []), 'is-child']
        lM[left] = ['子节点']
      }
      // 映射右子节点
      if (right !== -1 && right < heapSize) {
        hM[right] = [...(hM[right] || []), 'is-child']
        lM[right] = ['子节点']
      }
      // 映射最大值高亮
      if (largest !== -1 && largest !== parent) {
        hM[largest] = [...(hM[largest] || []), 'is-largest']
      }

      steps.value.push({
        array: JSON.parse(JSON.stringify(currentArr)),
        highlights: hM,
        labels: lM,
        description: desc,
        passId: passNum
      })
    }

    // 初始状态推入
    pushState(currentArr.length, -1, -1, -1, -1, '初始状态。堆排序将数组视为一棵完全二叉树。')

    // ==== 核心：节点下沉调整 (Sift Down) ====
    const siftDown = (heapSize, i, descPrefix) => {
      let largest = i
      let left = 2 * i + 1
      let right = 2 * i + 2

      // 动画帧：观察当前父节点与子节点
      pushState(heapSize, i, left, right, -1, `${descPrefix}：考察父节点 ${currentArr[i].val} 及其子节点。`)

      if (left < heapSize && currentArr[left].val > currentArr[largest].val) largest = left
      if (right < heapSize && currentArr[right].val > currentArr[largest].val) largest = right

      if (largest !== i) {
        // 动画帧：发现最大节点（触发橙色实底高亮）
        pushState(heapSize, i, left, right, largest, `发现最大的节点是 ${currentArr[largest].val}，准备将其与父节点 ${currentArr[i].val} 交换。`)

        // 交换对象引用，触发 Vue 过渡动画
        let temp = currentArr[i]
        currentArr[i] = currentArr[largest]
        currentArr[largest] = temp

        // 动画帧：交换完成，重置指针进行下一步递归
        pushState(heapSize, largest, -1, -1, -1, `交换完成。因节点下移，需继续向下递归调整。`)
        siftDown(heapSize, largest, '递归调整')
      } else {
        // 动画帧：无需调整
        pushState(heapSize, i, -1, -1, -1, `当前父节点 ${currentArr[i].val} 已是最大值，符合大顶堆性质，无需调整。`)
      }
    }

    // ==== 阶段 1：构建初始大顶堆 ====
    passNum++
    pushState(currentArr.length, -1, -1, -1, -1, '【阶段 1】开始构建大顶堆，从最后一个非叶子节点开始反向遍历。')
    for (let i = Math.floor(currentArr.length / 2) - 1; i >= 0; i--) {
      siftDown(currentArr.length, i, '构建初始堆')
    }

    // ==== 阶段 2：逐步将堆顶最大值移至数组尾部 ====
    for (let i = currentArr.length - 1; i > 0; i--) {
      passNum++
      pushState(i + 1, 0, -1, -1, -1, `【阶段 2】当前堆顶最大值是 ${currentArr[0].val}，准备将其与堆尾元素 ${currentArr[i].val} 交换。`)

      // 将当前最大的堆顶元素换到末尾
      let temp = currentArr[0]
      currentArr[0] = currentArr[i]
      currentArr[i] = temp

      pushState(i, -1, -1, -1, -1, `交换完成。最大值 ${temp.val} 脱离堆区，化为绿色进入已排序区。`)
      // 对新的堆顶元素进行下沉调整
      siftDown(i, 0, '恢复大顶堆')
    }

    // ==== 最终状态 ====
    passNum++
    pushState(0, -1, -1, -1, -1, '🎉 堆排序彻底完成！所有元素均已进入绿色安全区。')
  }
</script>

<style scoped>

  /* 通过 :deep() 选择器，将样式穿透传递给子组件 TreeDisplay。
  加入 !important 确保样式优先级高于子组件内部的默认渲染。
*/
  :deep(.is-parent .item-value) {
    border-color: #f59e0b !important;
    box-shadow: 0 0 10px rgba(245, 158, 11, 0.3);
  }

  :deep(.is-child .item-value) {
    border-color: #6366f1 !important;
  }

  :deep(.is-largest .item-value) {
    /* 使用 color-mix 混合实底橙色，还原图中的效果 */
    background-color: color-mix(in srgb, #f59e0b 20%, var(--vp-c-bg)) !important;
    border-color: #f59e0b !important;
  }

  :deep(.is-sorted .item-value) {
    background-color: rgba(16, 185, 129, 0.15) !important;
    border-color: #10b981 !important;
    color: #10b981 !important;
  }
</style>