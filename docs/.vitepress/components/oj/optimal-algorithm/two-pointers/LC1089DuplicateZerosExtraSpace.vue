<template>
  <VisualizerLayout
    title="复写零 (LeetCode 1089) - 异地双指针法"
    storageKey="lc1089-duplicate-zeros-config"
    defaultData="1, 0, 2, 3, 0, 4, 5, 0"
    :defaultInterval="900"
    :actionButtons="visualizerButtons"
    :steps="steps"
    @calculate="calculateSteps"
  >
    <template #visualization="{ step }">
      <div class="duplicate-zeros-container" v-if="step">
        
        <div class="array-wrapper">
          <div class="array-title">
            <span class="badge primary">原数组 (Source)</span>
            <span class="desc">只读，使用指针 i 进行遍历扫描</span>
          </div>
          <ArrayDisplay
            :items="step.origArray"
            :highlights="step.origHighlights"
            :labels="step.origLabels"
            :printNull="false"
          />
        </div>

        <div class="divider">
          <div class="arrow-down">↓ 读写分离 ↓</div>
        </div>

        <div class="array-wrapper new-array-wrapper">
          <div class="array-title">
            <span class="badge success">新数组 (Destination)</span>
            <span class="desc">只写，使用指针 j 写入，长度必须与原数组一致</span>
          </div>
          <ArrayDisplay
            :items="step.newArray"
            :highlights="step.newHighlights"
            :labels="step.newLabels"
            :printNull="true"
            :occupySpaceForNull="true"
          />
        </div>

      </div>
    </template>
  </VisualizerLayout>
</template>

<script setup>
import { ref } from 'vue'
// ✅ 已更新为正确的基座引入路径和命名
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

  // 构建带物理 ID 的原数组和等长的新数组
  const origArray = arr.map((val, idx) => ({ id: `orig-${idx}`, val: Number(val) }))
  const newArray = arr.map((_, idx) => ({ id: `new-${idx}`, val: null })) // 初始全为空
  const n = origArray.length

  steps.value = []
  let passNum = 0

  const pushState = (desc, hO = {}, lO = {}, hN = {}, lN = {}) => {
    // 自动为新数组处理 'all' 高亮逻辑
    if (hN['all']) {
      const allClass = hN['all'][0]
      hN = {}
      for (let k = 0; k < n; k++) hN[k] = [allClass]
    }

    steps.value.push({
      origArray: JSON.parse(JSON.stringify(origArray)),
      newArray: JSON.parse(JSON.stringify(newArray)),
      origHighlights: hO,
      origLabels: lO,
      newHighlights: hN,
      newLabels: lN,
      description: desc,
      passId: passNum
    })
  }

  // ================= 算法核心逻辑 =================
  let i = 0
  let j = 0

  pushState(
    `初始状态。创建与原数组等长的新数组。i 指针准备读取，j 指针准备写入。`,
    { 0: ['is-current-i'] }, { 0: ['i'] },
    { 0: ['is-scanning-j'] }, { 0: ['j'] }
  )

  while (i < n && j < n) {
    passNum++
    const val = origArray[i].val

    // 动作 1：读取
    pushState(
      `【读取】指针 i 扫描到原数组索引 ${i}，其值为 ${val}。`,
      { [i]: ['is-current-i'] }, { [i]: ['i'] },
      { [j]: ['is-scanning-j'] }, { [j]: ['j (待写入)'] }
    )

    if (val !== 0) {
      // 动作 2A：写入非零元素 (写一次)
      newArray[j].val = val
      pushState(
        `当前值为 ${val}，不是 0。在新数组 j(${j}) 处正常写入 1 次。随后 i, j 各前进一步。`,
        { [i]: ['is-sorted'] }, { [i]: ['已读'] },
        { [j]: ['is-non-zero'] }, { [j]: ['j (已写入)'] }
      )
      j++
    } else {
      // 动作 2B：写入零元素 (准备写两次)
      newArray[j].val = 0
      pushState(
        `发现 0！根据规则，在新数组 j(${j}) 处先写入第一个 0。`,
        { [i]: ['is-current-i'] }, { [i]: ['i'] },
        { [j]: ['is-zero'] }, { [j]: ['写入 0'] }
      )
      j++

      if (j < n) {
        // 动作 3：执行复写
        newArray[j].val = 0
        pushState(
          `【触发复写】在新数组 j(${j}) 处复写第二个 0。`,
          { [i]: ['is-current-i'] }, { [i]: ['i'] },
          { [j-1]: ['is-zero'], [j]: ['is-zero-dup'] }, 
          { [j-1]: ['原 0'], [j]: ['复写 0'] }
        )
        j++
      } else {
        pushState(
          `【越界丢弃】原准备复写第二个 0，但新数组长度已满边界，按题意直接丢弃。`,
          { [i]: ['is-current-i'] }, { [i]: ['i'] },
          { [j-1]: ['is-zero'] }, { [j-1]: ['最后一位'] }
        )
      }
    }
    
    i++
  }

  pushState(
    `🎉 遍历完成！新数组已生成。原数组中超出长度的元素被按规则舍弃。`,
    {}, {},
    { 'all': ['is-non-zero'] }, {}
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
  gap: 15px;
}

.array-wrapper {
  position: relative;
  width: 100%;
  background-color: var(--vp-c-bg-elv);
  border: 1px dashed var(--vp-c-border);
  border-radius: 12px;
  min-height: 120px;
  display: flex;
  justify-content: center;
  align-items: center;
  padding-top: 50px;
  padding-bottom: 15px;
}

.new-array-wrapper {
  background-color: rgba(16, 185, 129, 0.03);
  border-color: rgba(16, 185, 129, 0.4);
}

.array-title {
  position: absolute;
  top: 12px;
  left: 16px;
  display: flex;
  align-items: center;
  gap: 8px;
}

.badge {
  font-size: 12px;
  font-weight: bold;
  padding: 4px 8px;
  border-radius: 4px;
  color: white;
}
.badge.primary { background-color: #3b82f6; }
.badge.success { background-color: #10b981; }

.desc {
  font-size: 12px;
  color: var(--vp-c-text-3);
}

.divider {
  display: flex;
  gap: 20px;
  color: var(--vp-c-text-3);
  font-size: 14px;
  font-weight: bold;
  opacity: 0.7;
}
.arrow-down { color: #ec4899; }

/* ================= 专属的高亮颜色 ================= */

/* 普通非零元素写入后的绿色 */
:deep(.is-non-zero .item-value) {
  background-color: rgba(16, 185, 129, 0.15) !important;
  border-color: #10b981 !important;
  color: #10b981 !important;
}

/* 首次遇到 0 写入的黄色预警 */
:deep(.is-zero .item-value) {
  background-color: rgba(245, 158, 11, 0.15) !important;
  border-color: #f59e0b !important;
  color: #f59e0b !important;
}

/* 复写的 0 的强烈橙色提示 */
:deep(.is-zero-dup .item-value) {
  background-color: #f59e0b !important;
  border-color: #f59e0b !important;
  color: #fff !important;
  box-shadow: 0 0 12px rgba(245, 158, 11, 0.4);
}
</style>