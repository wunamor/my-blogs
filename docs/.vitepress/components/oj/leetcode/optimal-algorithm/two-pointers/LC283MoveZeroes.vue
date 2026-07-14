<template>
  <VisualizerLayout
    title="移动零 (LeetCode 283) - 双指针"
    storageKey="lc283-move-zeroes-config"
    defaultData="0, 1, 0, 3, 12"
    :defaultInterval="800"
    :actionButtons="visualizerButtons"
    :steps="steps"
    @calculate="calculateSteps"
  >
    <template #visualization="{ step }">
      <div class="move-zeroes-container" v-if="step">
        
        <div class="zone-legend">
          <div class="legend-item">
            <span class="color-box non-zero-box"></span>
            <span>[0, dest]<br/><small>已处理的非零元素</small></span>
          </div>
          <div class="legend-item">
            <span class="color-box zero-box"></span>
            <span>[dest + 1, cur - 1]<br/><small>已处理的零元素</small></span>
          </div>
          <div class="legend-item">
            <span class="color-box unknown-box"></span>
            <span>[cur, n - 1]<br/><small>待处理未知元素</small></span>
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
    .map(n => ({ val: n, id: Math.random().toString(36).slice(2) }))
  
  if (arr.length === 0) {
    steps.value = []
    return
  }

  steps.value = []
  let currentArr = [...arr]
  let passNum = 0

  // 统一的推帧函数
  const pushState = (dest, cur, desc) => {
    let hM = {}
    let lM = {}

    // 1. 根据你的注释思想，渲染区间颜色
    for (let i = 0; i < currentArr.length; i++) {
      if (i <= dest) {
        hM[i] = ['is-non-zero'] // 绿色区间
      } else if (i > dest && i < cur) {
        hM[i] = ['is-zero']     // 灰色区间
      }
    }

    // 2. 渲染双指针位置
    if (cur < currentArr.length) {
      hM[cur] = [...(hM[cur] || []), 'is-current-i']
      lM[cur] = ['cur']
    }
    
    if (dest >= 0 && dest < currentArr.length) {
      hM[dest] = [...(hM[dest] || []), 'is-scanning-j']
      lM[dest] = ['dest']
    }

    // 3. 处理指针重叠时的文字标签
    if (cur === dest && cur < currentArr.length) {
      lM[cur] = ['dest, cur']
    }

    steps.value.push({
      array: JSON.parse(JSON.stringify(currentArr)),
      highlights: hM,
      labels: lM,
      description: desc,
      passId: passNum
    })
  }

  // ================= 算法核心部分 =================
  let dest = -1
  let cur = 0

  pushState(dest, cur, `初始状态。由于还没有处理任何元素，因此 [0, dest] 非零区间与 [dest+1, cur-1] 零区间均为空。`)

  while (cur < currentArr.length) {
    passNum++
    pushState(dest, cur, `【扫描】cur 指向索引 ${cur}，其值为 ${currentArr[cur].val}。`)

    if (currentArr[cur].val !== 0) {
      dest++
      pushState(dest, cur, `发现非零元素 ${currentArr[cur].val}！首先将 dest 向前移动一步，扩展非零区间边界至 ${dest}。`)

      // 交换逻辑，保留原有的物理对象以触发 vue 的平滑移动动画
      let temp = currentArr[cur]
      currentArr[cur] = currentArr[dest]
      currentArr[dest] = temp

      pushState(dest, cur, `交换 cur(${cur}) 与 dest(${dest}) 上的元素。`)
    } else {
      pushState(dest, cur, `当前元素为 0，属于零区间，无需任何操作，直接跳过。`)
    }
    
    cur++
    if (cur < currentArr.length) {
      pushState(dest, cur, `cur 向前一步至 ${cur}，继续探索未知区间。`)
    }
  }

  pushState(dest, cur, `🎉 遍历完成！所有非零元素都被聚拢到了 [0, dest] 区间，而所有的 0 都被推到了数组末尾。`)
}
</script>

<style scoped>
.move-zeroes-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  width: 100%;
  padding: 10px 0;
  gap: 24px;
}

.zone-legend {
  display: flex;
  gap: 20px;
  background-color: var(--vp-c-bg-elv);
  border: 1px solid var(--vp-c-border);
  padding: 16px 24px;
  border-radius: 8px;
  width: 100%;
  justify-content: center;
  flex-wrap: wrap;
}

.legend-item {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
  color: var(--vp-c-text-1);
  line-height: 1.4;
}

.legend-item small {
  color: var(--vp-c-text-3);
  font-size: 11px;
}

.color-box {
  width: 16px;
  height: 16px;
  border-radius: 4px;
  border: 1px solid var(--vp-c-border);
}

.non-zero-box {
  background-color: rgba(16, 185, 129, 0.2);
  border-color: #10b981;
}

.zero-box {
  background-color: rgba(128, 128, 128, 0.1);
  border-color: var(--vp-c-border);
}

.unknown-box {
  background-color: var(--vp-c-default-soft);
}

.array-wrapper {
  width: 100%;
  background-color: var(--vp-c-bg-elv);
  border: 1px dashed var(--vp-c-border);
  border-radius: 12px;
  min-height: 160px;
  display: flex;
  justify-content: center;
  align-items: center;
}

/* ================== 核心区间的动态涂色 ================== */

/* [0, dest] 非零区间变绿 */
:deep(.is-non-zero .item-value) {
  background-color: rgba(16, 185, 129, 0.15) !important;
  border-color: #10b981 !important;
  color: #10b981 !important;
}

/* [dest+1, cur-1] 零元素区间变灰并变暗 */
:deep(.is-zero .item-value) {
  background-color: rgba(128, 128, 128, 0.1) !important;
  border-color: transparent !important;
  color: var(--vp-c-text-3) !important;
  opacity: 0.6;
}

/* 覆盖底层基础色的优先级，保证指针颜色能盖过区间颜色 */
:deep(.is-current-i .item-value) {
  border-color: #3b82f6 !important;
  box-shadow: 0 0 10px rgba(59, 130, 246, 0.3) !important;
}

:deep(.is-scanning-j .item-value) {
  border-color: #ec4899 !important;
}
</style>