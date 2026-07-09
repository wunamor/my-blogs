<template>
  <AlgorithmVisualizerLayout
    title="堆排序"
    storageKey="HeapSortVisualizerConfig_v2"
    defaultArray="64, 25, 12, 22, 11, 8, 30"
    :steps="steps"
    @calculate="calculateSteps"
  >
    <template #visualization="{ step }">
      <div
        v-if="step && step.array"
        class="tree-display-inner"
        :style="{ minHeight: treeHeight + 'px' }"
      >

        <!-- 【修复】：连线层通过 z-index 置于绝对底层 -->
        <svg class="tree-lines">
          <template
            v-for="n in step.array.length"
            :key="'line-' + n"
          >
            <line
              v-if="2 * (n - 1) + 1 < step.array.length"
              :x1="getTreePos(n - 1).left"
              :y1="getTreePos(n - 1).top"
              :x2="getTreePos(2 * (n - 1) + 1).left"
              :y2="getTreePos(2 * (n - 1) + 1).top"
              stroke="var(--vp-c-border)"
              stroke-width="2"
            />
            <line
              v-if="2 * (n - 1) + 2 < step.array.length"
              :x1="getTreePos(n - 1).left"
              :y1="getTreePos(n - 1).top"
              :x2="getTreePos(2 * (n - 1) + 2).left"
              :y2="getTreePos(2 * (n - 1) + 2).top"
              stroke="var(--vp-c-border)"
              stroke-width="2"
            />
          </template>
        </svg>

        <!-- 【修复】：节点层新增 TransitionGroup 开启平滑移动，并且 z-index 在顶层 -->
        <TransitionGroup
          name="swap"
          tag="div"
          class="tree-nodes-container"
        >
          <!-- 额外增加包装层，负责处理 absolute 定位，完美避开 Vue 动画引擎的 transform 冲突 -->
          <div
            v-for="(item, idx) in step.array"
            :key="item.id"
            class="tree-node-wrapper"
            :style="{ left: getTreePos(idx).left, top: getTreePos(idx).top }"
          >
            <div
              class="tree-node"
              :class="{
                'is-sorted': idx >= step.heapSize,
                'is-parent': idx === step.parent,
                'is-child': idx === step.left || idx === step.right,
                'is-largest': idx === step.largest && idx !== step.parent
              }"
            >
              <div class="item-value">{{ item.val }}</div>
              <div class="item-label">
                <span
                  v-if="idx === step.parent"
                  class="parent-label"
                >父节点</span>
                <span v-else-if="idx === step.left || idx === step.right">子节点</span>
              </div>
            </div>
          </div>
        </TransitionGroup>

      </div>
    </template>
  </AlgorithmVisualizerLayout>
</template>

<script setup>
  import { ref, computed } from 'vue'
  import AlgorithmVisualizerLayout from '../AlgorithmVisualizerLayout.vue'

  const steps = ref([])

  // 计算容器所需的高度 (根据二叉树最大层数)
  const treeHeight = computed(() => {
    if (!steps.value[0]) return 300;
    const totalNodes = steps.value[0].array.length;
    const maxLevel = Math.floor(Math.log2(totalNodes));
    return (maxLevel + 1) * 70 + 80;
  })

  // 根据数组索引，实时计算该节点在二叉树上的精确物理坐标
  const getTreePos = (idx) => {
    const level = Math.floor(Math.log2(idx + 1)) // 当前层数 (0-indexed)
    const nodesInLevel = Math.pow(2, level)      // 本层最多容纳的节点数
    const positionInLevel = idx - (nodesInLevel - 1) // 本层第几个节点
    const left = ((positionInLevel + 0.5) / nodesInLevel) * 100 // 百分比 x 轴
    const top = level * 70 + 40 // 每层间隔 70px，顶部起步 40px
    return { left: `${left}%`, top: `${top}px` }
  }

  const calculateSteps = (rawInputString) => {
    const arr = rawInputString.split(',')
      .map(n => parseInt(n.trim()))
      .filter(n => !isNaN(n))
      .map(n => ({ val: n, id: Math.random().toString(36).slice(2) })) // 注入动画追踪ID

    if (arr.length === 0) return

    steps.value = []
    let currentArr = [...arr]
    let passNum = 0

    steps.value.push({ array: [...currentArr], heapSize: currentArr.length, parent: -1, left: -1, right: -1, largest: -1, passId: passNum, description: '初始状态。堆排序将数组视为一棵完全二叉树。' })

    const siftDown = (heapSize, i, descPrefix) => {
      let largest = i
      let left = 2 * i + 1
      let right = 2 * i + 2

      steps.value.push({ array: [...currentArr], heapSize, parent: i, left, right, largest, passId: passNum, description: `${descPrefix}：考察父节点 ${currentArr[i].val} 及其子节点。` })

      if (left < heapSize && currentArr[left].val > currentArr[largest].val) largest = left
      if (right < heapSize && currentArr[right].val > currentArr[largest].val) largest = right

      if (largest !== i) {
        steps.value.push({ array: [...currentArr], heapSize, parent: i, left, right, largest, passId: passNum, description: `发现最大的节点是 ${currentArr[largest].val}，准备将其与父节点 ${currentArr[i].val} 交换。` })

        // 交换对象引用，触发动画引擎
        let temp = currentArr[i]
        currentArr[i] = currentArr[largest]
        currentArr[largest] = temp

        steps.value.push({ array: [...currentArr], heapSize, parent: largest, left: -1, right: -1, largest: -1, passId: passNum, description: `交换完成。因节点下移，需继续向下递归调整。` })
        siftDown(heapSize, largest, '递归调整')
      } else {
        steps.value.push({ array: [...currentArr], heapSize, parent: i, left: -1, right: -1, largest: -1, passId: passNum, description: `当前父节点 ${currentArr[i].val} 已是最大值，符合大顶堆性质，无需调整。` })
      }
    }

    passNum++
    steps.value.push({ array: [...currentArr], heapSize: currentArr.length, passId: passNum, description: '【阶段 1】开始构建大顶堆，从最后一个非叶子节点开始反向遍历。' })
    for (let i = Math.floor(currentArr.length / 2) - 1; i >= 0; i--) {
      siftDown(currentArr.length, i, '构建初始堆')
    }

    for (let i = currentArr.length - 1; i > 0; i--) {
      passNum++
      steps.value.push({ array: [...currentArr], heapSize: i + 1, parent: 0, left: -1, right: -1, largest: -1, passId: passNum, description: `【阶段 2】当前堆顶最大值是 ${currentArr[0].val}，准备将其与堆尾元素 ${currentArr[i].val} 交换。` })

      let temp = currentArr[0]
      currentArr[0] = currentArr[i]
      currentArr[i] = temp

      steps.value.push({ array: [...currentArr], heapSize: i, parent: -1, left: -1, right: -1, largest: -1, passId: passNum, description: `交换完成。最大值 ${temp.val} 脱离堆区，化为绿色进入已排序区。` })
      siftDown(i, 0, '恢复大顶堆')
    }

    steps.value.push({ array: [...currentArr], heapSize: 0, parent: -1, left: -1, right: -1, largest: -1, passId: ++passNum, description: '🎉 堆排序彻底完成！所有元素均已进入绿色安全区。' })
  }
</script>

<style scoped>

  /* 重新规划层叠上下文 */
  .tree-display-inner {
    position: relative;
    width: 100%;
    padding: 20px;
    box-sizing: border-box;
    z-index: 1;
    /* 建立层叠大舞台 */
  }

  .tree-lines {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
    z-index: 0;
    /* 连线强制沉底 */
    pointer-events: none;
  }

  .tree-nodes-container {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
    z-index: 1;
  }

  .tree-node-wrapper {
    position: absolute;
  }

  .tree-node {
    display: flex;
    flex-direction: column;
    align-items: center;
    width: 48px;
    transform: translate(-50%, -50%);

    /* 节点强制置顶 */
    /* 让中心点对准连线坐标 */
  }

  /* 【修复】：堆排序专属——强制覆盖全局的方块属性，变为完美的圆形！ */
  .tree-node .item-value {
    border-radius: 50% !important;
    z-index: 10;
  }

  .parent-label {
    color: #f59e0b;
    background: rgba(245, 158, 11, 0.2) !important;
  }

  /* 专属的高亮逻辑 */
  .is-parent .item-value {
    border-color: #f59e0b;
    box-shadow: 0 0 10px rgba(245, 158, 11, 0.3);
  }

  .is-child .item-value {
    border-color: #6366f1;
  }

  .is-largest .item-value {
    background-color: rgba(245, 158, 11, 0.2);
    border-color: #f59e0b;
  }
</style>