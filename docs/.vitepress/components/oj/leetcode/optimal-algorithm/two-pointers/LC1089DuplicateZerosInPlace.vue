<template>
  <VisualizerLayout
    title="复写零 (LeetCode 1089) - 原地双指针 (空间 O(1))"
    storageKey="lc1089-duplicate-zeros-inplace"
    defaultData="1, 0, 2, 3, 0, 4, 5, 0"
    :defaultInterval="1000"
    :actionButtons="visualizerButtons"
    :steps="steps"
    @calculate="calculateSteps"
  >
    <template #visualization="{ step }">
      <div class="duplicate-zeros-container" v-if="step && step.array">
        
        <div class="status-board">
          <div class="board-item">
            <span class="label">当前虚拟长度 (virtualLength):</span>
            <span class="value" :class="{'warning': step.virtualLength > step.array.length}">{{ step.virtualLength }}</span>
          </div>
          <div class="board-item">
            <span class="label">物理容量 (size):</span>
            <span class="value">{{ step.array.length }}</span>
          </div>
        </div>

        <div class="array-wrapper">
          <ArrayDisplay
            :items="step.array"
            :highlights="step.highlights"
            :labels="step.labels"
          />
        </div>

      </div>
    </template>
  </VisualizerLayout>
</template>

<script setup>
import { ref } from 'vue'
import VisualizerLayout from '@components/common/visualization/VisualizerLayout.vue'
import ArrayDisplay from '@components/common/visualization/ArrayDisplay.vue'

const visualizerButtons = [
  { id: 'prev', label: '上一步', icon: 'prev' },
  { id: 'play', label: '自动播放', labelPause: '暂停', icon: 'play', iconPause: 'pause' },
  { id: 'next', label: '下一步', icon: 'next' },
  { id: 'skip', label: '跳过本轮', icon: 'skip' }
]

const steps = ref([])

const calculateSteps = (inputRaw) => {
  const arr = inputRaw.split(',').map(n => parseInt(n.trim())).filter(n => !isNaN(n))
  if (arr.length === 0) {
    steps.value = []
    return
  }

  // 初始化数组（赋予独立 ID 以触发平滑动画）
  let currentArr = arr.map((val, idx) => ({ id: `id-${idx}-${Math.random()}`, val: Number(val) }))
  
  steps.value = []
  let passNum = 0

  const pushState = (desc, hM = {}, lM = {}, vLen = 0) => {
    steps.value.push({
      array: JSON.parse(JSON.stringify(currentArr)),
      highlights: hM,
      labels: lM,
      description: desc,
      virtualLength: vLen,
      passId: passNum
    })
  }

  // ================= 完美复刻你的 Java 逻辑 =================
  let i = 0
  let size = currentArr.length
  let virtualLength = 0

  pushState(`【阶段 1：预扫描】开始寻找最后一位有效数据。物理容量为 ${size}。`, {}, {}, 0)

  // 1. 寻找有效数据边界
  passNum++
  for (; virtualLength < size; i++) {
    const val = currentArr[i].val
    if (val === 0) {
      virtualLength += 2
      pushState(
        `扫描到 0。因需复写，虚拟长度 +2。目前 virtualLength = ${virtualLength}。`,
        { [i]: ['is-zero'] }, { [i]: ['i'] }, virtualLength
      )
    } else {
      virtualLength += 1
      pushState(
        `扫描到非零数 ${val}。虚拟长度 +1。目前 virtualLength = ${virtualLength}。`,
        { [i]: ['is-current-i'] }, { [i]: ['i'] }, virtualLength
      )
    }
  }

  // 2. 越界边界处理
  passNum++
  if (virtualLength === size + 1) {
    // 最后一位必定是 0，且放不下它的分身
    currentArr[size - 1] = { val: 0, id: `id-edge-${Math.random()}` } // 重新生成 ID 防止复用导致动画异常
    pushState(
      `【边界处理】发现 virtualLength 为 ${size + 1} 越界！说明最后一个数是 0 且只能放下一个。将其直接写入末尾。`,
      { [size - 1]: ['is-edge'] }, { [size - 1]: ['越界 0'] }, virtualLength
    )
    size--
    i--
  }

  // 3. 从后往前遍历覆盖
  passNum++
  let right = size - 1
  let left = i - 1

  pushState(
    `【阶段 2：倒序复写】预扫描结束。有效数据截止于 left(${left})，从 right(${right}) 开始从后往前覆写。`,
    { [left]: ['is-current-i'], [right]: ['is-scanning-j'] }, 
    { [left]: ['left (读)'], [right]: ['right (写)'] }, 
    virtualLength
  )

  while (left >= 0 && right > left) {
    const val = currentArr[left].val

    if (val === 0) {
      // 遇到 0，先复写一次
      currentArr[right] = { val: 0, id: `id-dup-${Math.random()}` }
      pushState(
        `遇到 0，在 right(${right}) 处复写第一个 0。`,
        { [left]: ['is-zero'], [right]: ['is-zero-dup'] }, 
        { [left]: ['left'], [right]: ['right'] }, 
        virtualLength
      )
      right--
    }

    // 正常覆盖写入
    currentArr[right] = { val: val, id: `id-write-${Math.random()}` }
    pushState(
      `将 left(${left}) 的值 ${val} 覆写至 right(${right}) 处。`,
      { [left]: ['is-current-i'], [right]: ['is-sorted'] }, 
      { [left]: ['left'], [right]: ['right'] }, 
      virtualLength
    )
    
    right--
    left--
  }

  pushState(
    `🎉 原地复写彻底完成！优化了 O(N) 的额外空间，达到了极限 O(1) 空间复杂度。`,
    { 'all': ['is-sorted'] }, {}, virtualLength
  )
}
</script>

<style scoped>
.duplicate-zeros-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  width: 100%;
  padding: 10px 0;
  gap: 20px;
}

/* 顶部状态计分板 */
.status-board {
  display: flex;
  gap: 20px;
  background-color: var(--vp-c-bg-elv);
  border: 1px dashed var(--vp-c-border);
  padding: 12px 24px;
  border-radius: 8px;
  width: 100%;
  justify-content: center;
}

.board-item {
  font-size: 14px;
  display: flex;
  align-items: center;
  gap: 8px;
}

.board-item .label {
  color: var(--vp-c-text-2);
}

.board-item .value {
  font-size: 16px;
  font-weight: bold;
  color: #10b981;
  background-color: rgba(16, 185, 129, 0.1);
  padding: 2px 8px;
  border-radius: 4px;
}

.board-item .value.warning {
  color: #ef4444;
  background-color: rgba(239, 68, 68, 0.1);
}

.array-wrapper {
  position: relative;
  width: 100%;
  background-color: var(--vp-c-bg-elv);
  border: 1px dashed var(--vp-c-border);
  border-radius: 12px;
  min-height: 140px;
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 30px 10px;
}

/* ================= 专属的高亮颜色 ================= */

/* 扫描到的 0 (黄色) */
:deep(.is-zero .item-value) {
  background-color: rgba(245, 158, 11, 0.15) !important;
  border-color: #f59e0b !important;
  color: #f59e0b !important;
}

/* 倒序写入完成的安全区 (绿色) */
:deep(.is-sorted .item-value) {
  background-color: rgba(16, 185, 129, 0.15) !important;
  border-color: #10b981 !important;
  color: #10b981 !important;
}

/* 复写产生的 0 (亮橙色警告) */
:deep(.is-zero-dup .item-value) {
  background-color: #f59e0b !important;
  border-color: #f59e0b !important;
  color: #fff !important;
  box-shadow: 0 0 12px rgba(245, 158, 11, 0.4);
}

/* 越界截断直接补位的 0 (粉色) */
:deep(.is-edge .item-value) {
  background-color: rgba(236, 72, 153, 0.15) !important;
  border-color: #ec4899 !important;
  color: #ec4899 !important;
}
</style>