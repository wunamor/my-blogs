<template>
  <AlgorithmVisualizerLayout
    title="选择排序"
    storageKey="SelectionSortVisualizerConfig_v2"
    defaultArray="64, 25, 12, 22, 11"
    :steps="steps"
    @calculate="calculateSteps"
  >
    <template #visualization="{ step }">
      <TransitionGroup
        v-if="step"
        name="swap"
        tag="div"
        class="array-display-inner"
      >
        <div
          v-for="(item, idx) in step.array"
          :key="item.id"
          class="array-item"
          :class="{
            'is-sorted': idx < step.i,
            'is-current-i': idx === step.i,
            'is-scanning-j': idx === step.j,
            'is-min': idx === step.minIdx && idx !== step.i
          }"
        >
          <div class="item-value">{{ item.val }}</div>
          <div class="item-label">
            <span v-if="idx === step.i">i</span>
            <span v-if="idx === step.j">j</span>
            <span
              v-if="idx === step.minIdx"
              class="min-label"
            >min</span>
          </div>
        </div>
      </TransitionGroup>
    </template>
  </AlgorithmVisualizerLayout>
</template>

<script setup>
  import { ref } from 'vue'
  import AlgorithmVisualizerLayout from '../AlgorithmVisualizerLayout.vue'

  const steps = ref([])

  const calculateSteps = (rawInputString) => {
    const arr = rawInputString.split(',')
      .map(n => parseInt(n.trim()))
      .filter(n => !isNaN(n))
      // 【核心魔法 3】：将纯数字转化为带有唯一 ID 的对象，让 Vue 知道“谁是谁”
      .map(n => ({ val: n, id: Math.random().toString(36).slice(2) }))

    if (arr.length === 0) return

    steps.value = []
    let currentArr = [...arr]

    steps.value.push({ array: [...currentArr], i: 0, j: -1, minIdx: 0, passId: 0, description: '初始状态，准备开始选择排序。' })

    for (let i = 0; i < currentArr.length - 1; i++) {
      let minIdx = i
      steps.value.push({ array: [...currentArr], i, j: i + 1, minIdx, passId: i, description: `【第 ${i + 1} 轮】将位置 i(${i}) 设为当前最小值，开始向后寻找更小的值。` })

      for (let j = i + 1; j < currentArr.length; j++) {
        // 注意：所有的比较都要带上 .val
        let isNewMin = currentArr[j].val < currentArr[minIdx].val
        if (isNewMin) minIdx = j
        steps.value.push({ array: [...currentArr], i, j, minIdx, passId: i, description: isNewMin ? `发现更小的值 ${currentArr[j].val}！更新 min 指针。` : `比较 ${currentArr[j].val} 和当前最小值 ${currentArr[minIdx].val}，不更新。` })
      }

      if (minIdx !== i) {
        // 交换整个对象引用，这就触发了物理 DOM 的移动！
        let temp = currentArr[i]
        currentArr[i] = currentArr[minIdx]
        currentArr[minIdx] = temp
        steps.value.push({ array: [...currentArr], i, j: -1, minIdx: i, passId: i, description: `扫描结束。将找到的最小值 ${currentArr[i].val} 与位置 i 交换。该位置已排序完毕。` })
      } else {
        steps.value.push({ array: [...currentArr], i, j: -1, minIdx: i, passId: i, description: `扫描结束。位置 i 就是这一轮的最小值，无需交换。该位置已排序完毕。` })
      }
    }

    steps.value.push({ array: [...currentArr], i: currentArr.length, j: -1, minIdx: -1, passId: currentArr.length, description: '🎉 排序彻底完成！所有元素均已进入绿色安全区。' })
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