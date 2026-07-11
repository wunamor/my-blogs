<template>
  <AlgorithmVisualizerLayout
    title="计数排序 (Counting Sort)"
    storageKey="counting-sort-config"
    defaultArray="4, 2, 2, 8, 3, 3, 1"
    :steps="steps"
    @calculate="calculateSteps"
  >
    <template #visualization="{ step }">
      <div
        class="counting-sort-container"
        v-if="step"
      >

        <div class="array-wrapper">
          <div class="array-title">
            <span class="badge primary">主数组 (Main)</span>
            <span class="desc">待排序数据与最终结果</span>
          </div>
          <ArrayDisplay
            :items="step.mainArray"
            :highlights="step.highlights"
            :labels="step.labels"
            :printNull="false"
            :occupySpaceForNull="true"
          />
        </div>

        <div class="divider">
          <div class="arrow-down">↓ 1. 统计频率 ↓</div>
          <div class="arrow-up">↑ 2. 依次重构 ↑</div>
        </div>

        <div class="array-wrapper count-wrapper">
          <div class="array-title">
            <span class="badge warning">计数数组 (Count Array)</span>
            <span class="desc">索引代表具体数值，内部存储该数值出现的频次</span>
          </div>
          <ArrayDisplay
            :items="step.countArray"
            :highlights="step.countHighlights"
            :labels="step.countLabels"
            :printNull="true"
          />
        </div>

      </div>
    </template>
  </AlgorithmVisualizerLayout>
</template>

<script setup>
  import { ref } from 'vue'
  import AlgorithmVisualizerLayout from '../AlgorithmVisualizerLayout.vue'
  import ArrayDisplay from '@components/common/ArrayDisplay.vue'

  const steps = ref([])

  /**
   * 核心：计算计数排序所有的关键帧
   */
  const calculateSteps = (inputRaw) => {
    const arrStr = inputRaw.split(',').map(s => s.trim()).filter(s => s !== '')
    if (arrStr.length === 0) {
      steps.value = []
      return
    }

    // 1. 初始化原数组
    const initialArr = arrStr.map((val, idx) => ({ id: `main-${idx}`, val: Number(val) }))

    // 找出最大值和最小值，确定计数数组的容量
    const nums = initialArr.map(item => item.val)
    const min = Math.min(...nums)
    const max = Math.max(...nums)
    const countLen = max - min + 1

    // 2. 初始化计数数组（初始频次皆为 0）
    const initialCount = Array.from({ length: countLen }, (_, idx) => ({
      id: `count-${idx}`,
      val: 0
    }))

    // 固定的桶底部标签（显示这个桶代表哪个真实的数字）
    const baseCountLabels = {}
    for (let i = 0; i < countLen; i++) {
      baseCountLabels[i] = [`值:${i + min}`]
    }

    steps.value = []
    let currentArr = JSON.parse(JSON.stringify(initialArr))
    let currentCount = JSON.parse(JSON.stringify(initialCount))
    let passCounter = 0

    // 统一的推进步骤函数
    const pushState = (desc, hM = {}, lM = {}, hC = {}, lC = {}, passId = 0) => {
      // 将动态标签和基础桶标签合并
      const mergedCountLabels = JSON.parse(JSON.stringify(baseCountLabels))
      for (const key in lC) {
        if (mergedCountLabels[key]) {
          mergedCountLabels[key] = [...mergedCountLabels[key], ...lC[key]]
        } else {
          mergedCountLabels[key] = lC[key]
        }
      }

      steps.value.push({
        mainArray: JSON.parse(JSON.stringify(currentArr)),
        countArray: JSON.parse(JSON.stringify(currentCount)),
        highlights: hM,
        labels: lM,
        countHighlights: hC,
        countLabels: mergedCountLabels,
        description: desc,
        passId
      })
    }

    // ==== 初始状态 ====
    pushState(`初始状态。寻找极值：最小值 ${min}，最大值 ${max}。开辟长度为 ${countLen} 的计数数组。`)

    // ==== 阶段 1：统计频率 (Counting) ====
    passCounter++
    for (let i = 0; i < currentArr.length; i++) {
      const val = currentArr[i].val
      const countIdx = val - min // 计算偏移量映射到计数数组

      // 动画帧：定位元素
      pushState(`【统计频次】扫描主数组元素 ${val}，映射到计数数组的索引位置。`,
        { [i]: ['is-current-i'] }, { [i]: ['i'] },
        { [countIdx]: ['is-scanning-j'] }, { [countIdx]: ['cur'] }, passCounter
      )

      // 动画帧：频次 + 1
      currentCount[countIdx].val++
      pushState(`【更新频次】元素 ${val} 出现了一次，计数数组对应位置频次 +1 (当前为 ${currentCount[countIdx].val})。`,
        { [i]: ['is-sorted'] }, {}, // 统计过的稍微变绿表示已阅
        { [countIdx]: ['is-current-i'] }, {}, passCounter
      )
    }

    pushState("🎉 频率统计完成！现在计数数组中保存了每个元素出现的次数。", {}, {}, {}, {}, passCounter)

    // ==== 阶段 2：重构数组 (Reconstructing) ====
    passCounter++
    let mainIdx = 0 // 主数组的写入指针

    // 视觉上将主数组清空，准备重构 (用 null 占位)
    for (let i = 0; i < currentArr.length; i++) currentArr[i].val = null
    pushState("【准备重构】准备将数值按频次从小到大写回主数组。原数组数据暂时清空。", {}, {}, {}, {}, passCounter)

    // 遍历计数数组
    for (let cIdx = 0; cIdx < currentCount.length; cIdx++) {
      let freq = currentCount[cIdx].val
      const realValue = cIdx + min // 还原真实数值

      if (freq > 0) {
        pushState(`【扫描计数】数值 ${realValue} 的出现频次为 ${freq}，准备写入主数组。`,
          { [mainIdx]: ['is-scanning-j'] }, { [mainIdx]: ['写入位'] },
          { [cIdx]: ['is-current-i'] }, { [cIdx]: ['cur'] }, passCounter
        )

        while (freq > 0) {
          // 写入主数组
          currentArr[mainIdx].val = realValue

          // 计数递减
          currentCount[cIdx].val--
          freq--

          pushState(`【回写数值】将 ${realValue} 写入主数组，对应频次 -1。`,
            { [mainIdx]: ['is-sorted'] }, { [mainIdx]: ['写入成功'] },
            { [cIdx]: ['is-current-i'] }, { [cIdx]: ['cur'] }, passCounter
          )

          mainIdx++
        }
      } else {
        // 频次为 0 的直接跳过
        pushState(`数值 ${realValue} 的频次为 0，跳过。`,
          {}, {},
          { [cIdx]: ['is-scanning-j'] }, { [cIdx]: ['cur'] }, passCounter
        )
      }
    }

    // ==== 最终状态 ====
    let finalHM = {}
    for (let i = 0; i < currentArr.length; i++) finalHM[i] = ['is-sorted']
    pushState(`🎉 计数排序全部完成！通过统计频率完美绕过了元素比较，实现了线性时间复杂度。`, finalHM)
  }
</script>

<style scoped>
  .counting-sort-container {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    width: 100%;
    padding: 20px 0;
    gap: 15px;
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
    padding-top: 50px;
    /* <--- 新增这行，防止与左上角的 absolute 标题重叠 */
    transition: all 0.3s ease;
  }

  .count-wrapper {
    background-color: rgba(234, 179, 8, 0.05);
    border: 1px dashed rgba(234, 179, 8, 0.5);
    /* 给计数数组多一点底边距，以免 labels 被裁切 */
    padding-bottom: 20px;
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

  .badge.primary {
    background-color: #3b82f6;
  }

  .badge.warning {
    background-color: #eab308;
  }

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

  .arrow-down {
    color: #ec4899;
  }

  .arrow-up {
    color: #10b981;
  }
</style>