<template>
  <AlgorithmVisualizerLayout
    title="希尔排序"
    storageKey="ShellSortVisualizerConfig_v1"
    defaultArray="8, 9, 1, 7, 2, 3, 5, 4, 6, 0"
    :defaultInterval="800"
    :actionButtons="visualizerButtons"
    :steps="steps"
    @calculate="calculateSteps"
  >
    <template #visualization="{ step }">
      <div
        v-if="step"
        class="shell-sort-wrapper"
      >
        <!-- 主要数组展示 -->
        <ArrayDisplay
          :items="step.currentArray"
          :highlights="step.highlights"
          :labels="step.labels"
        />

        <!-- 增量分组展示 -->
        <Transition name="fade">
          <div
            v-if="step.gap > 0"
            class="gap-breakdown"
          >
            <div class="gap-sidebar">
              <div class="gap-text theme-text">step = {{ step.gap }}</div>
              <div class="gap-text theme-text">共分为 {{ step.gap }} 组</div>
            </div>

            <TransitionGroup
              name="gap-list"
              tag="div"
              class="gap-rows-container"
            >
              <div
                v-for="g in step.gap"
                :key="`gap-${step.gap}-group-${g}`"
                class="gap-row-box"
              >
                <ArrayDisplay
                  :items="getGapArray(step.currentArray, step.gap, g)"
                  :highlights="step.highlights"
                  :printNull="false"
                  :occupySpaceForNull="true"
                />
              </div>
            </TransitionGroup>
          </div>
        </Transition>
      </div>
    </template>
  </AlgorithmVisualizerLayout>
</template>

<script setup>
  import { ref } from 'vue'
  import AlgorithmVisualizerLayout from '@components/common/visualization/AlgorithmVisualizerLayout.vue'
  import ArrayDisplay from '@components/common/visualization/ArrayDisplay.vue'

  const visualizerButtons = [
    { id: 'prev', label: '上一步', icon: 'prev' },
    { id: 'play', label: '自动播放', labelPause: '暂停', icon: 'play', iconPause: 'pause' },
    { id: 'next', label: '下一步', icon: 'next' },
    { id: 'skip', label: '跳过本轮', icon: 'skip' }
  ]

  const steps = ref([])

  // 💡 新增：专门生成当前分组的数组（非当前组的元素用 null 占位）
  const getGapArray = (currentArray, gap, g) => {
    return currentArray.map((item, idx) => {
      if (idx % gap === (g - 1)) {
        return item; // 核心魔法：放回真实的引用对象！它带有真实 ID，底下也会平滑交换！
      } else {
        return { id: 'placeholder-' + idx, val: null }; // 虚假占位符
      }
    })
  }

  const getHighlightClass = (highlights, idx) => highlights?.[idx]?.join(' ') || ''

  const calculateSteps = (rawInputString) => {
    const arr = rawInputString.split(',').map(n => parseInt(n.trim())).filter(n => !isNaN(n))
      .map(n => ({ val: n, id: Math.random().toString(36).slice(2) })) // 注入 ID
    if (arr.length === 0) return

    steps.value = []
    let currentArr = [...arr]
    let passNum = 0

    const pushStep = (isDone, currentI, scanningJ, compareIdx, gap, description, passId) => {
      const highlights = {}
      const labels = {}

      if (isDone) {
        for (let k = 0; k < currentArr.length; k++) highlights[k] = ['is-sorted']
      } else {
        // 标记 gap 分组的微微背景高亮
        if (gap > 0 && currentI !== -1) {
          for (let k = 0; k <= currentI; k++) {
            if (Math.abs(k - currentI) % gap === 0) {
              highlights[k] = ['is-gap-group']
            }
          }
        }
        if (currentI !== -1) {
          highlights[currentI] = highlights[currentI] ? [...highlights[currentI], 'is-current-i'] : ['is-current-i']
          labels[currentI] = [`i (gap:${gap})`]
        }
        if (scanningJ !== -1) {
          highlights[scanningJ] = ['is-scanning-j']
          labels[scanningJ] = ['j']
        }
        if (compareIdx !== -1) {
          highlights[compareIdx] = ['is-scanning-j']
          labels[compareIdx] = ['比较']
        }
      }

      steps.value.push({ currentArray: [...currentArr], highlights, labels, gap, description, passId })
    }

    pushStep(false, -1, -1, -1, 0, '初始状态，准备开始希尔排序。', passNum)

    for (let gap = Math.floor(currentArr.length / 2); gap > 0; gap = Math.floor(gap / 2)) {
      passNum++
      pushStep(false, -1, -1, -1, gap, `【第 ${passNum} 趟】设置增量 gap = ${gap}，将数组分为 ${gap} 个子序列。`, passNum)

      // 对每个子序列进行直接插入排序
      for (let i = gap; i < currentArr.length; i++) {
        let j = i
        let targetIdx = i // 跟踪当前元素位置

        pushStep(false, targetIdx, -1, -1, gap, `提取元素 ${currentArr[targetIdx].val}，准备在其所在的子序列(间隔为${gap})中向前插入。`, passNum)

        while (j >= gap) {
          pushStep(false, targetIdx, j, j - gap, gap, `比较元素：待插入值 ${currentArr[targetIdx].val} 与前面相隔 gap 的元素 ${currentArr[j - gap].val}。`, passNum)

          if (currentArr[j - gap].val > currentArr[targetIdx].val) {
            // 【核心修复】：使用交换！
            let temp = currentArr[j - gap]
            currentArr[j - gap] = currentArr[targetIdx]
            currentArr[targetIdx] = temp

            targetIdx = j - gap

            pushStep(false, targetIdx, j, j - gap, gap, `${currentArr[j].val} 大于待插入值，向后移位。`, passNum)
            j -= gap
          } else {
            pushStep(false, -1, j, j - gap, gap, `${currentArr[j - gap].val} 小于等于待插入值，停止寻找。`, passNum)
            break
          }
        }

        pushStep(false, targetIdx, -1, -1, gap, `将 ${currentArr[targetIdx].val} 插入到最终位置。`, passNum)
      }
    }

    pushStep(true, -1, -1, -1, 0, '🎉 希尔排序彻底完成！', ++passNum)
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

  /* 整体容器，改成纵向排列 */
  .shell-sort-wrapper {
    display: flex;
    flex-direction: column;
    align-items: center;
    width: 100%;
  }


  /* 文字颜色：使用 VitePress 的主题色，完美融入暗黑/明亮模式 */
  .theme-text {
    color: var(--vp-c-brand);
    font-weight: bold;
    font-size: 15px;
    white-space: nowrap;
  }

  /* ================= 动画：淡入淡出 ================= */
  .fade-enter-active,
  .fade-leave-active {
    transition: opacity 0.4s ease;
  }

  .fade-enter-from,
  .fade-leave-to {
    opacity: 0;
  }

  /* ================= 布局：底部大盘 ================= */
  /* 恢复 1：重新让底层大盘居中 */
  .gap-breakdown {
    position: relative;
    display: flex;
    justify-content: center;
    /* 改回 center */
    width: 100%;
    margin-top: 10px;
    padding-top: 20px;
    border-top: 1px dashed var(--vp-c-border);
  }

  /* 恢复 2：让左侧文字重新悬浮，不挤压右侧 */
  .gap-sidebar {
    position: absolute;
    /* 改回绝对定位 */
    left: 20px;
    top: 50%;
    transform: translateY(-50%);
    display: flex;
    flex-direction: column;
    gap: 15px;
  }


  .gap-rows-container {
    display: flex;
    /* 去掉 flex: 1 */
    flex-direction: column;
    align-items: center;
    gap: 8px;
    position: relative;
  }

  /* 核心魔法：正在消失的旧分组立刻脱离文档流，绝对不准撑开父容器的高度！ */
  .gap-rows-container>.fade-leave-active {
    position: absolute;
    width: 100%;
  }

  /* 核心：绿框外观（完美还原你的截图） */
  .gap-row-box {
    border: 2px solid #10b981;
    padding: 8px 12px;
    border-radius: 6px;
    background: rgba(16, 185, 129, 0.03);
    /* 给点极淡的绿色底色更美观 */
  }

  /* 保证这里的 flex 排版参数与全局的 ArrayDisplay 绝对一致 */
  .gap-row-inner {
    display: flex;
    gap: 12px;
    justify-content: center;
  }

  /* 分组内的实体方块，给一点透明度以区分主数组 */
  .group-item-value {
    opacity: 0.9;
    box-shadow: none !important;
    /* 避免阴影溢出绿框 */
  }

  /* 核心魔法：透明占位符。占据相同的宽度和边距，但完全看不见 */
  .placeholder-value {
    background: transparent !important;
    border-color: transparent !important;
    color: transparent !important;
    box-shadow: none !important;
  }

  /* 核心：绿框外观 */
  .gap-row-box {
    border: 2px solid #10b981;
    padding: 8px 12px;
    border-radius: 6px;
    background: rgba(16, 185, 129, 0.03);
    width: max-content;
    /* 核心修正：收缩到与内部主数组完全一样宽！ */
    box-sizing: border-box;
    overflow: hidden;
    /* 动画必需：防止折叠时内容溢出 */
  }

  /* 抵消 ArrayDisplay 自带的属性，实现绿框内的紧凑居中 */
  .gap-row-box :deep(.array-display-inner) {
    padding: 0;
    height: auto;
    min-height: 0;
    align-items: center;
  }
</style>