<template>
  <AlgorithmVisualizerLayout
    title="插入排序"
    storageKey="InsertionSortVisualizerConfig_v1"
    defaultData="64, 25, 12, 22, 11"
    :defaultInterval="800"
    :actionButtons="visualizerButtons"
    :steps="steps"
    @calculate="calculateSteps"
  >
    <!-- 魔法插槽：定制插入排序专属的方块展示 -->
    <template #visualization="{ step }">
      <div
        v-if="step"
        class="insertion-wrapper"
      >
        <div class="temp-area">
          <span class="temp-label">temp (临时变量)</span>
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
  import AlgorithmVisualizerLayout from '@components/common/visualization/VisualizerLayout.vue'
  import ArrayDisplay from '@components/common/visualization/ArrayDisplay.vue' // 引入通用数组组件

  // 【标准化接入】：业务方定义的极简按钮组
  const visualizerButtons = [
    { id: 'prev', label: '上一步', icon: 'prev' },
    { id: 'play', label: '自动播放', labelPause: '暂停', icon: 'play', iconPause: 'pause' },
    { id: 'next', label: '下一步', icon: 'next' },
    { id: 'skip', label: '跳过本轮', icon: 'skip' }
  ]

  const steps = ref([])

  const calculateSteps = (rawInputString) => {
    const arr = rawInputString.split(',').map(n => parseInt(n.trim())).filter(n => !isNaN(n))
      .map(n => ({ val: n, id: Math.random().toString(36).slice(2) })) // 注入原始 ID
    if (arr.length === 0) return

    steps.value = []
    let currentArr = [...arr]

    // 增加 tempObj 参数用于可视化
    const pushStep = (sortedTo, currentI, scanningJ, tempObj, description, passId) => {
      const highlights = {}
      const labels = {}

      for (let k = 0; k <= sortedTo; k++) {
        if (k !== currentI && k !== scanningJ) highlights[k] = ['is-sorted']
      }
      if (currentI !== -1) {
        highlights[currentI] = ['is-current-i'] // 蓝色：目标插入位/移动的元素
        labels[currentI] = ['插入位']
      }
      if (scanningJ !== -1) {
        highlights[scanningJ] = ['is-scanning-j'] // 粉色：被扫描或被覆盖的残影
        labels[scanningJ] = ['覆盖残影']
      }

      steps.value.push({ currentArray: [...currentArr], highlights, labels, temp: tempObj, description, passId })
    }

    pushStep(0, -1, -1, null, '初始状态，第一个元素天然有序（绿色）。', 0)

    for (let i = 1; i < currentArr.length; i++) {
      let temp = currentArr[i] // 提取出真正的对象（带有它的原始 ID）
      let j = i - 1

      // 💡 ID 魔法 1：在原位置留下一个全新 ID 的假体，这样 temp 的 ID 就被“抽离”出来了
      currentArr[i] = { val: temp.val, id: Math.random().toString(36).slice(2) }

      pushStep(i - 1, i, -1, temp, `【第 ${i} 轮】抽出元素 ${temp.val} 到 temp，留出插入空位。`, i)

      while (j >= 0) {
        pushStep(i - 1, -1, j, temp, `比较：temp(${temp.val}) 与 有序区元素(${currentArr[j].val})。`, i)

        if (currentArr[j].val > temp.val) {
          // 💡 ID 魔法 2：移位操作。将真实对象移动到右边，触发平滑动画！
          let movingObj = currentArr[j]
          currentArr[j + 1] = movingObj

          // 在原来的位置留下一个拥有新 ID 的“残影”，用粉色高亮表示它将被覆盖
          currentArr[j] = { val: movingObj.val, id: Math.random().toString(36).slice(2) }

          pushStep(i - 1, j + 1, j, temp, `${movingObj.val} 大于 ${temp.val}，向右移位。`, i)
          j--
        } else {
          pushStep(i - 1, j + 1, -1, temp, `${currentArr[j].val} 小于等于 temp，找到插入位置。`, i)
          break
        }
      }

      // 💡 ID 魔法 3：将带有原始 ID 的 temp 放回数组，它会精准地滑向目标位置！
      currentArr[j + 1] = temp
      pushStep(i, j + 1, -1, null, `将 temp(${temp.val}) 插入到最终位置。`, i)
    }

    pushStep(currentArr.length - 1, -1, -1, null, '🎉 插入排序彻底完成！', currentArr.length)
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

  .insertion-wrapper {
    display: flex;
    flex-direction: column;
    align-items: center;
    width: 100%;
    height: 100%;
  }

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
</style>