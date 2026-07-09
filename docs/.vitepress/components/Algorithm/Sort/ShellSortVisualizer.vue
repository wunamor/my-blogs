<template>
  <AlgorithmVisualizerLayout
    title="希尔排序"
    storageKey="ShellSortVisualizerConfig_v1"
    defaultArray="8, 9, 1, 7, 2, 3, 5, 4, 6, 0"
    :steps="steps"
    @calculate="calculateSteps"
  >
    <template #visualization="{ step }">
      <div
        v-if="step"
        class="array-display-inner"
      >
        <div
          v-for="(num, idx) in step.array"
          :key="idx"
          class="array-item"
          :class="{
            'is-sorted': step.isDone,
            'is-current-i': idx === step.i,
            'is-scanning-j': idx === step.j || idx === step.compareIdx,
            'is-gap-group': step.gap && (Math.abs(idx - step.i) % step.gap === 0) && idx <= step.i
          }"
        >
          <div class="item-value">{{ num }}</div>
          <div class="item-label">
            <span
              v-if="idx === step.i"
              class="target-label"
            >i (gap:{{ step.gap }})</span>
            <span v-else-if="idx === step.j">j</span>
            <span v-else-if="idx === step.compareIdx">比较</span>
          </div>
        </div>
      </div>
    </template>
  </AlgorithmVisualizerLayout>
</template>

<script setup>
  import { ref } from 'vue'
  import AlgorithmVisualizerLayout from '../AlgorithmVisualizerLayout.vue'

  const steps = ref([])

  const calculateSteps = (rawInputString) => {
    const arr = rawInputString.split(',').map(n => parseInt(n.trim())).filter(n => !isNaN(n))
    if (arr.length === 0) return

    steps.value = []
    let currentArr = [...arr]
    let passNum = 0

    steps.value.push({
      array: [...currentArr], i: -1, j: -1, gap: 0, passId: passNum,
      description: '初始状态，准备开始希尔排序。'
    })

    // 希尔排序核心：不断缩小增量 gap
    for (let gap = Math.floor(currentArr.length / 2); gap > 0; gap = Math.floor(gap / 2)) {
      passNum++
      steps.value.push({
        array: [...currentArr], i: -1, j: -1, gap, passId: passNum,
        description: `【第 ${passNum} 趟】设置增量 gap = ${gap}，将数组分为 ${gap} 个子序列。`
      })

      // 对每个子序列进行直接插入排序
      for (let i = gap; i < currentArr.length; i++) {
        let temp = currentArr[i]
        let j = i

        steps.value.push({
          array: [...currentArr], i: i, j: -1, compareIdx: -1, gap, passId: passNum,
          description: `提取元素 ${temp}，准备在其所在的子序列(间隔为${gap})中向前插入。`
        })

        while (j >= gap) {
          steps.value.push({
            array: [...currentArr], i: i, j: j, compareIdx: j - gap, gap, passId: passNum,
            description: `比较元素：待插入值 ${temp} 与前面相隔 gap 的元素 ${currentArr[j - gap]}。`
          })

          if (currentArr[j - gap] > temp) {
            currentArr[j] = currentArr[j - gap]
            steps.value.push({
              array: [...currentArr], i: -1, j: j, compareIdx: j - gap, gap, passId: passNum,
              description: `${currentArr[j]} 大于 ${temp}，向后移位。`
            })
            j -= gap
          } else {
            steps.value.push({
              array: [...currentArr], i: -1, j: j, compareIdx: j - gap, gap, passId: passNum,
              description: `${currentArr[j - gap]} 小于等于待插入值，停止该子序列的寻找。`
            })
            break
          }
        }

        currentArr[j] = temp
        steps.value.push({
          array: [...currentArr], i: j, j: -1, compareIdx: -1, gap, passId: passNum,
          description: `将 ${temp} 插入到最终位置。`
        })
      }
    }

    steps.value.push({
      array: [...currentArr], isDone: true, i: -1, j: -1, gap: 0, passId: ++passNum,
      description: '🎉 希尔排序彻底完成！'
    })
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
    flex-wrap: wrap;
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
    white-space: nowrap;
  }

  .target-label {
    color: #3b82f6;
    background: rgba(59, 130, 246, 0.2) !important;
  }

  /* 高亮样式 */
  .is-sorted .item-value {
    background-color: rgba(16, 185, 129, 0.15);
    border-color: #10b981;
    color: #10b981;
  }

  .is-current-i .item-value {
    border-color: #3b82f6;
    box-shadow: 0 0 10px rgba(59, 130, 246, 0.3);
    transform: translateY(-8px);
  }

  .is-scanning-j .item-value {
    border-color: #ec4899;
  }

  /* 将属于同一个 gap 分组的元素添加微微的背景高亮，辅助视觉理解 */
  .is-gap-group .item-value {
    background-color: rgba(59, 130, 246, 0.1);
  }
</style>