<template>
  <AlgorithmVisualizerLayout
    title="插入排序"
    storageKey="InsertionSortVisualizerConfig_v1"
    defaultArray="64, 25, 12, 22, 11"
    :steps="steps"
    @calculate="calculateSteps"
  >
    <!-- 魔法插槽：定制插入排序专属的方块展示 -->
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
            'is-sorted': idx <= step.sortedTo && idx !== step.i && idx !== step.j,
            'is-current-i': idx === step.i,
            'is-scanning-j': idx === step.j
          }"
        >
          <div class="item-value">{{ num }}</div>
          <div class="item-label">
            <span
              v-if="idx === step.i"
              class="target-label"
            >待插入</span>
            <span v-if="idx === step.j">j</span>
          </div>
        </div>
      </div>
    </template>
  </AlgorithmVisualizerLayout>
</template>

<script setup>
  import { ref } from 'vue'
  // 直接复用你之前写好的绝赞底层骨架组件！
  import AlgorithmVisualizerLayout from '../AlgorithmVisualizerLayout.vue'

  const steps = ref([])

  // 插入排序的核心状态机快照逻辑
  const calculateSteps = (rawInputString) => {
    const arr = rawInputString.split(',').map(n => parseInt(n.trim())).filter(n => !isNaN(n))
    if (arr.length === 0) return

    steps.value = []
    let currentArr = [...arr]

    // 初始化：第一个元素（索引0）天然是有序的
    steps.value.push({
      array: [...currentArr], i: -1, j: -1, sortedTo: 0, passId: 0,
      description: '初始状态，默认第一个元素已被视为有序区间（绿色）。'
    })

    // 外层循环：从第二个元素开始，逐个向前插入
    for (let i = 1; i < currentArr.length; i++) {
      let currentVal = currentArr[i]
      let j = i - 1

      steps.value.push({
        array: [...currentArr], i: i, j: -1, sortedTo: i - 1, passId: i,
        description: `【第 ${i} 轮】抽出无序区间的第一个元素 ${currentVal}，准备向前寻找插入位置。`
      })

      // 内层循环：向前扫描，寻找待插入的位置
      while (j >= 0) {
        steps.value.push({
          array: [...currentArr], i: j + 1, j: j, sortedTo: i - 1, passId: i,
          description: `比较元素：待插入值 ${currentVal} 与有序区间的 ${currentArr[j]}。`
        })

        if (currentArr[j] > currentVal) {
          // 遇到比自己大的，把那个元素往后挪一个坑
          currentArr[j + 1] = currentArr[j]
          steps.value.push({
            array: [...currentArr], i: j, j: -1, sortedTo: i - 1, passId: i,
            description: `${currentArr[j]} 大于 ${currentVal}，向右移动腾出空位。`
          })
          j--
        } else {
          // 遇到比自己小或者等于的，说明找到了位置，停止扫描
          steps.value.push({
            array: [...currentArr], i: j + 1, j: j, sortedTo: i - 1, passId: i,
            description: `${currentArr[j]} 小于等于待插入值，无需继续向前寻找。`
          })
          break
        }
      }

      // 正式把元素放入找到的坑位
      currentArr[j + 1] = currentVal
      steps.value.push({
        array: [...currentArr], i: j + 1, j: -1, sortedTo: i, passId: i,
        description: `将 ${currentVal} 成功插入到该位置。此时前 ${i + 1} 个元素已排序。`
      })
    }

    // 结束状态
    steps.value.push({
      array: [...currentArr], i: -1, j: -1, sortedTo: currentArr.length - 1, passId: currentArr.length,
      description: '🎉 插入排序彻底完成！所有元素均已进入有序区间。'
    })
  }
</script>

<style scoped>

  /* 专属的插入排序样式，只需控制方块颜色，按钮面板全被 Layout 包办了 */
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
    white-space: nowrap;
  }

  .target-label {
    color: #3b82f6;
    background: rgba(59, 130, 246, 0.2) !important;
  }

  /* 高亮逻辑与选择排序略有不同 */
  /* 绿色：已经完成排队的有序区间 (sortedTo) */
  .is-sorted .item-value {
    background-color: rgba(16, 185, 129, 0.15);
    border-color: #10b981;
    color: #10b981;
  }

  /* 蓝色：当前正在手里拿着、四处找位置的“待插入元素” */
  .is-current-i .item-value {
    border-color: #3b82f6;
    box-shadow: 0 0 10px rgba(59, 130, 246, 0.3);
    transform: translateY(-8px);
  }

  /* 粉红：正在和待插入元素作比较的有序区间元素 */
  .is-scanning-j .item-value {
    border-color: #ec4899;
  }
</style>