<template>
  <AlgorithmVisualizerLayout
    title="快速排序 (挖坑法)"
    storageKey="QuickSortHoleVisualizerConfig_v1"
    defaultArray="47, 29, 71, 99, 78, 19, 24, 47"
    :steps="steps"
    @calculate="calculateSteps"
  >
    <template #visualization="{ step }">
      <div
        v-if="step"
        class="hole-wrapper"
      >

        <div class="temp-area">
          <span class="temp-label">temp (基准/被挖出的坑)</span>
          <div
            class="array-item"
            v-if="step.temp"
          >
            <div class="item-value temp-value">{{ step.temp.val }}</div>
          </div>
          <div
            class="array-item empty-temp"
            v-else
          >
            <div class="item-value">空</div>
          </div>
        </div>

        <ArrayDisplay
          :items="step.currentArray"
          :highlights="step.highlights"
          :labels="step.labels"
        />
      </div>
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

    // 记录已经归位的元素索引
    const sortedIndices = new Set()
    let passNum = 0

    // 标准化推送函数：彻底依靠数据驱动 UI
    const pushStep = (l, r, pitIdx, tempObj, description) => {
      const highlights = {}
      const labels = {}

      // 1. 涂绿已归位的元素
      sortedIndices.forEach(idx => {
        highlights[idx] = ['is-sorted']
      })

      // 2. 标记当前的“坑”位置
      if (pitIdx !== -1) {
        highlights[pitIdx] = highlights[pitIdx] ? [...highlights[pitIdx], 'is-pit'] : ['is-pit']
        labels[pitIdx] = ['坑 (Pit)']
      }

      // 3. 标记左右探针 L 和 R
      if (l !== -1 && l !== pitIdx) {
        highlights[l] = highlights[l] ? [...highlights[l], 'is-current-i'] : ['is-current-i']
        labels[l] = labels[l] ? [...labels[l], 'L'] : ['L']
      }

      if (r !== -1 && r !== pitIdx) {
        highlights[r] = highlights[r] ? [...highlights[r], 'is-scanning-j'] : ['is-scanning-j']
        labels[r] = labels[r] ? [...labels[r], 'R'] : ['R']
      }

      steps.value.push({ currentArray: [...currentArr], highlights, labels, temp: tempObj, description, passId: passNum })
    }

    pushStep(-1, -1, -1, null, '初始状态，准备开始快速排序(挖坑法)。')

    // 挖坑法递归核心
    const quickSortHole = (left, right) => {
      if (left > right) return
      if (left === right) {
        sortedIndices.add(left)
        pushStep(-1, -1, -1, null, `区间 [${left}, ${right}] 只有一个元素，天然归位。`)
        return
      }

      passNum++
      let l = left
      let r = right

      // 💡 ID魔法 1：挖出首元素到 temp，并在原位置留下一个带有新 ID、值为空的“假体坑”
      let tempObj = currentArr[left]
      currentArr[left] = { val: '', id: Math.random().toString(36).slice(2) }
      let pit = left

      pushStep(l, r, pit, tempObj, `【新区间】挖出首元素 ${tempObj.val} 作为基准存入 temp。原位置形成第一个坑。`)

      while (l < r) {
        // 1. R 指针向左寻找小于基准的数
        pushStep(l, r, pit, tempObj, `右指针 R 开始向左寻找比基准 ${tempObj.val} 小的元素。`)
        while (l < r && currentArr[r].val >= tempObj.val) {
          r--
          pushStep(l, r, pit, tempObj, `R(${currentArr[r + 1].val}) >= 基准，R 继续左移。`)
        }

        if (l < r) {
          pushStep(l, r, pit, tempObj, `找到 R(${currentArr[r].val}) < 基准，准备将其去填坑 (位置 ${pit})。`)

          // 💡 ID魔法 2：将 R 的真实对象移动到坑里，触发平滑飞跃动画！R 的原位置变成新坑。
          let movingObj = currentArr[r]
          currentArr[pit] = movingObj
          currentArr[r] = { val: '', id: Math.random().toString(36).slice(2) }
          pit = r

          pushStep(l, r, pit, tempObj, `填坑完成！R(${movingObj.val}) 飞入旧坑。R 的原位置变成了新坑。`)
        }

        // 2. L 指针向右寻找大于基准的数
        if (l < r) {
          pushStep(l, r, pit, tempObj, `左指针 L 开始向右寻找比基准 ${tempObj.val} 大的元素。`)
        }
        while (l < r && currentArr[l].val <= tempObj.val) {
          l++
          if (l < r) pushStep(l, r, pit, tempObj, `L(${currentArr[l - 1].val}) <= 基准，L 继续右移。`)
        }

        if (l < r) {
          pushStep(l, r, pit, tempObj, `找到 L(${currentArr[l].val}) > 基准，准备将其去填坑 (位置 ${pit})。`)

          // 💡 ID魔法 3：同样的操作，将 L 移入坑内
          let movingObj = currentArr[l]
          currentArr[pit] = movingObj
          currentArr[l] = { val: '', id: Math.random().toString(36).slice(2) }
          pit = l

          pushStep(l, r, pit, tempObj, `填坑完成！L(${movingObj.val}) 飞入旧坑。L 的原位置变成了新坑。`)
        }
      }

      // 💡 ID魔法 4：L 和 R 相遇，把最初存放在 temp 里的基准(带原始ID)填回最后一个坑，触发归位动画
      currentArr[pit] = tempObj
      sortedIndices.add(pit)

      pushStep(-1, -1, -1, null, `L 和 R 相遇在位置 ${pit}。将基准 ${tempObj.val} 填入最后的坑中。该元素彻底归位。`)

      // 分治递归处理左右区间
      let currentPit = pit
      quickSortHole(left, currentPit - 1)
      quickSortHole(currentPit + 1, right)
    }

    // 启动排序
    quickSortHole(0, currentArr.length - 1)

    // 补全所有绿色高亮
    currentArr.forEach((_, i) => sortedIndices.add(i))
    pushStep(-1, -1, -1, null, '🎉 挖坑法快速排序彻底完成！全员归位。')
  }
</script>

<style scoped>

  /* 容器居中排版 */
  .hole-wrapper {
    display: flex;
    flex-direction: column;
    align-items: center;
    width: 100%;
    height: 100%;
  }

  /* 复用之前好评的 temp 展示区样式 */
  .temp-area {
    display: flex;
    align-items: center;
    gap: 16px;
    margin-bottom: 20px;
    padding: 10px 20px;
    background: var(--vp-c-bg-elv);
    border: 1px dashed var(--vp-c-brand);
    border-radius: 8px;
  }

  .temp-label {
    font-size: 14px;
    color: var(--vp-c-text-2);
    font-weight: bold;
  }

  .temp-value {
    border-color: #3b82f6;
    box-shadow: 0 0 10px rgba(59, 130, 246, 0.4);
    background-color: rgba(59, 130, 246, 0.1);
  }

  .empty-temp .item-value {
    border: 2px dashed var(--vp-c-border);
    background: transparent;
    color: var(--vp-c-text-3);
    font-size: 14px;
  }

  /* 🌟 核心魔法：使用 :deep 穿透渲染坑的外观 (无背景、虚线框) */
  :deep(.is-pit .item-value) {
    background-color: transparent !important;
    border: 2px dashed var(--vp-c-border) !important;
    box-shadow: none !important;
  }
</style>