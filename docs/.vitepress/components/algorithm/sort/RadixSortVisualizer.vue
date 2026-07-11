<template>
  <AlgorithmVisualizerLayout
    title="基数排序 (Radix Sort)"
    storageKey="radix-sort-config"
    defaultArray="170, 45, 75, 90, 802, 24, 2, 66"
    :steps="steps"
    @calculate="calculateSteps"
  >
    <template #visualization="{ step }">
      <div
        class="radix-sort-container"
        v-if="step"
      >

        <div class="array-wrapper">
          <div class="array-title">
            <span class="badge primary">主数组</span>
            <span
              class="desc"
              v-if="step.digitName"
            >当前正在按 <strong>【{{ step.digitName }}】</strong> 排序</span>
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
          <div class="arrow-down">↓ 1. 分配 (Distribute) ↓</div>
          <div class="arrow-up">↑ 2. 收集 (Collect) ↑</div>
        </div>

        <div class="buckets-area">
          <div class="array-title">
            <span class="badge warning">0-9 号桶 (Buckets)</span>
            <span class="desc">根据当前位数的数值，将元素按序入桶</span>
          </div>

          <div class="buckets-grid">
            <div
              class="bucket-box"
              v-for="(bucketArr, bIdx) in step.buckets"
              :key="bIdx"
              :class="{ 'is-active-bucket': step.activeBucket === bIdx }"
            >
              <div class="bucket-header">桶 {{ bIdx }}</div>

              <div class="bucket-content">
                <ArrayDisplay
                  :items="bucketArr"
                  :highlights="step.bucketHighlights[bIdx] || {}"
                  :labels="step.bucketLabels[bIdx] || {}"
                  :printNull="false"
                  :occupySpaceForNull="false"
                />
              </div>
            </div>
          </div>
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
   * 核心：计算基数排序所有的关键帧
   */
  const calculateSteps = (inputRaw) => {
    const arrStr = inputRaw.split(',').map(s => s.trim()).filter(s => s !== '')
    if (arrStr.length === 0) {
      steps.value = []
      return
    }

    // 1. 初始化原数组
    const initialArr = arrStr.map((val, idx) => ({ id: `main-${idx}`, val: Number(val) }))

    // 找出最大值以确定最高位数（需要循环几轮）
    const nums = initialArr.map(item => item.val)
    const maxVal = Math.max(...nums)

    steps.value = []

    // 深拷贝数据源
    let currentArr = JSON.parse(JSON.stringify(initialArr))
    // 初始化 10 个空的桶 [ [], [], ..., [] ]
    let currentBuckets = Array.from({ length: 10 }, () => [])

    let passCounter = 0
    let currentDigitName = '分析中'
    let globalId = 0 // 用于给入桶的元素生成唯一的 Vue id，保证动画平滑

    // 统一的推进步骤函数
    // 注意这里的 hB 和 lB 是对象，键为 桶的索引(0-9)，值为具体的 highlight/label 对象
    const pushState = (desc, hM = {}, lM = {}, activeB = -1, hB = {}, lB = {}, passId = 0) => {
      steps.value.push({
        mainArray: JSON.parse(JSON.stringify(currentArr)),
        buckets: JSON.parse(JSON.stringify(currentBuckets)),
        highlights: hM,
        labels: lM,
        activeBucket: activeB,
        bucketHighlights: JSON.parse(JSON.stringify(hB)),
        bucketLabels: JSON.parse(JSON.stringify(lB)),
        digitName: currentDigitName,
        description: desc,
        passId
      })
    }

    pushState(`初始状态。寻找最大值 ${maxVal}，确定最高位数。准备了 0 到 9 共 10 个桶。`, {}, {})

    // ==== 核心：基数排序循环 ====
    let exp = 1 // 1=个位, 10=十位, 100=百位...

    while (Math.floor(maxVal / exp) > 0) {
      passCounter++
      currentDigitName = exp === 1 ? '个位 (1s)' : exp === 10 ? '十位 (10s)' : exp === 100 ? '百位 (100s)' : `${exp}位`

      pushState(`【第 ${passCounter} 轮分配】开始按 ${currentDigitName} 对所有元素进行入桶操作。`, {}, {}, -1, {}, {}, passCounter)

      // ==== 阶段 1：分配 (Distribute) ====
      for (let i = 0; i < currentArr.length; i++) {
        let val = currentArr[i].val
        if (val === null) continue

        // 提取当前位数的数字
        let digit = Math.floor(val / exp) % 10

        // 动画帧：聚焦当前元素，计算其位数
        pushState(`【计算位数】元素 ${val} 的 ${currentDigitName} 是 ${digit}，它将被分配到 ${digit} 号桶。`,
          { [i]: ['is-current-i'] }, { [i]: ['cur'] },
          digit, {}, {}, passCounter
        )

        // 从主数组抽走
        currentArr[i].val = null
        // 压入对应的桶中
        currentBuckets[digit].push({ id: `b-${globalId++}`, val: val })

        let bIdx = currentBuckets[digit].length - 1 // 在桶里的索引

        // 动画帧：元素入桶
        pushState(`【入桶】元素 ${val} 成功进入 ${digit} 号桶。`,
          { [i]: ['is-sorted'] }, {}, // 原位置标记为浅绿色残影
          digit, { [digit]: { [bIdx]: ['is-current-i'] } }, { [digit]: { [bIdx]: ['入桶'] } }, passCounter
        )
      }

      pushState(`【分配完成】${currentDigitName} 分配完毕！接下来准备按从 0 到 9 桶的顺序，将元素依次收集回主数组。`, {}, {}, -1, {}, {}, passCounter)

      // ==== 阶段 2：收集 (Collect) ====
      let mainIdx = 0

      for (let b = 0; b < 10; b++) {
        if (currentBuckets[b].length === 0) continue

        pushState(`开始收集 ${b} 号桶...`,
          { [mainIdx]: ['is-scanning-j'] }, { [mainIdx]: ['回写位'] },
          b, {}, {}, passCounter
        )

        while (currentBuckets[b].length > 0) {
          // 先入先出 (FIFO)，从桶的头部弹出元素
          let item = currentBuckets[b].shift()
          currentArr[mainIdx].val = item.val

          pushState(`【出桶回写】将 ${item.val} 从 ${b} 号桶头部取出，写回主数组。`,
            { [mainIdx]: ['is-sorted', 'is-current-i'] }, { [mainIdx]: ['cur'] },
            b, { [b]: { 0: ['is-scanning-j'] } }, {}, passCounter // 顺便高亮桶里下一个排队的元素
          )

          mainIdx++
        }
      }

      pushState(`【第 ${passCounter} 轮结束】按 ${currentDigitName} 的基数排序已完成。`, {}, {}, -1, {}, {}, passCounter)

      // 进位，准备下一轮
      exp *= 10
    }

    // ==== 最终状态 ====
    let finalHM = {}
    for (let i = 0; i < currentArr.length; i++) finalHM[i] = ['is-sorted']
    pushState(`🎉 基数排序全部完成！所有位数均已处理完毕。`, finalHM, {}, -1, {}, {}, passCounter)
  }
</script>

<style scoped>
  .radix-sort-container {
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
    padding-top: 40px;
    /* 防止标题重叠 */
    padding-bottom: 10px;
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

  /* 桶区域样式 */
  .buckets-area {
    position: relative;
    width: 100%;
    background-color: rgba(234, 179, 8, 0.03);
    border: 1px dashed rgba(234, 179, 8, 0.5);
    border-radius: 12px;
    padding: 50px 15px 15px 15px;
  }

  /* 10 宫格网格布局 */
  .buckets-grid {
    display: grid;
    /* 强制分为 5 列 2 行 */
    grid-template-columns: repeat(5, 1fr);
    gap: 10px;
  }

  /* 单个桶的样式 */
  .bucket-box {
    background-color: var(--vp-c-bg-soft);
    border: 2px solid var(--vp-c-border);
    border-radius: 8px;
    overflow: hidden;
    display: flex;
    flex-direction: column;
    min-height: 100px;
    transition: all 0.3s ease;
  }

  .bucket-box.is-active-bucket {
    border-color: #eab308;
    box-shadow: 0 0 10px rgba(234, 179, 8, 0.3);
    transform: translateY(-2px);
  }

  .bucket-header {
    background-color: var(--vp-c-default-soft);
    color: var(--vp-c-text-1);
    text-align: center;
    font-size: 13px;
    font-weight: bold;
    padding: 4px 0;
    border-bottom: 1px solid var(--vp-c-border);
  }

  .is-active-bucket .bucket-header {
    background-color: rgba(234, 179, 8, 0.2);
    color: #eab308;
  }

  /* 深度作用覆盖 ArrayDisplay 的基础样式，使其变得紧凑以适应 10 宫格 */
  .bucket-content {
    flex-grow: 1;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .bucket-content :deep(.array-display-inner) {
    padding: 10px 10px 30px 10px !important;
    gap: 6px !important;
    min-height: 60px;
    align-items: center;
    /* 桶内元素垂直居中 */
  }

  /* 让桶里的数字块稍微变小一点，防止换行溢出 */
  .bucket-content :deep(.array-item) {
    width: 36px;
  }

  .bucket-content :deep(.item-value) {
    width: 32px;
    height: 32px;
    font-size: 15px;
  }

  .bucket-content :deep(.item-label) {
    font-size: 10px;
    /* 桶内标签字体改小 */
    margin-top: 4px;
  }
</style>