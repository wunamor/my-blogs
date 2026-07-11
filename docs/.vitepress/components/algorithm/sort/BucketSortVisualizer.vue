<template>
  <AlgorithmVisualizerLayout
    title="桶排序 (Bucket Sort)"
    storageKey="bucket-sort-config"
    defaultArray="29, 25, 3, 49, 9, 37, 21, 43"
    :steps="steps"
    @calculate="calculateSteps"
  >
    <template #visualization="{ step }">
      <div
        class="bucket-sort-container"
        v-if="step"
      >

        <div class="array-wrapper">
          <div class="array-title">
            <span class="badge primary">主数组</span>
            <span class="desc">待分配的原始数据与合并后的最终结果</span>
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
          <div class="arrow-down">↓ 1. 按值域入桶 ↓</div>
          <div class="arrow-up">↑ 2. 桶内排序并收回 ↑</div>
        </div>

        <div class="buckets-area">
          <div class="array-title">
            <span class="badge warning">数据桶 (Buckets)</span>
            <span class="desc">每个桶负责一个固定的数值范围（区间长度为 {{ step.bucketSize }}）</span>
          </div>

          <div class="buckets-grid">
            <div
              class="bucket-box"
              v-for="(bucketArr, bIdx) in step.buckets"
              :key="bIdx"
              :class="{ 'is-active-bucket': step.activeBucket === bIdx }"
            >
              <div class="bucket-header">
                桶 {{ bIdx }} <br />
                <span class="range-text">[{{ step.bucketRanges[bIdx].start }}, {{ step.bucketRanges[bIdx].end }}]</span>
              </div>

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
   * 核心：计算桶排序所有的关键帧
   */
  const calculateSteps = (inputRaw) => {
    const arrStr = inputRaw.split(',').map(s => s.trim()).filter(s => s !== '')
    if (arrStr.length === 0) {
      steps.value = []
      return
    }

    // 1. 初始化原数组
    const initialArr = arrStr.map((val, idx) => ({ id: `main-${idx}`, val: Number(val) }))

    // 找出最大值和最小值以确定值域
    const nums = initialArr.map(item => item.val)
    const minVal = Math.min(...nums)
    const maxVal = Math.max(...nums)

    // 设定桶的数量（这里为了展示效果，固定使用 5 个桶，或者根据数据量动态分配）
    const bucketCount = 5
    // 计算每个桶的值域跨度，确保 maxVal 也能落入最后一个桶
    const bucketSize = Math.ceil((maxVal - minVal + 1) / bucketCount) || 1

    // 预先计算好每个桶的值域显示区间
    const bucketRanges = []
    for (let i = 0; i < bucketCount; i++) {
      bucketRanges.push({
        start: minVal + i * bucketSize,
        end: minVal + (i + 1) * bucketSize - 1
      })
    }

    steps.value = []

    let currentArr = JSON.parse(JSON.stringify(initialArr))
    // 初始化空的桶数组
    let currentBuckets = Array.from({ length: bucketCount }, () => [])

    let passCounter = 0
    let globalId = 0 // 用于给入桶的元素生成唯一的 Vue id，保证动画平滑

    // 统一的推帧函数
    const pushState = (desc, hM = {}, lM = {}, activeB = -1, hB = {}, lB = {}, passId = 0) => {
      steps.value.push({
        mainArray: JSON.parse(JSON.stringify(currentArr)),
        buckets: JSON.parse(JSON.stringify(currentBuckets)),
        highlights: hM,
        labels: lM,
        activeBucket: activeB,
        bucketHighlights: JSON.parse(JSON.stringify(hB)),
        bucketLabels: JSON.parse(JSON.stringify(lB)),
        bucketSize: bucketSize,
        bucketRanges: bucketRanges,
        description: desc,
        passId
      })
    }

    pushState(`初始状态。寻找极值：最小值 ${minVal}，最大值 ${maxVal}。计划分为 ${bucketCount} 个桶，每个桶的值域跨度为 ${bucketSize}。`, {}, {})

    // ==== 阶段 1：分配入桶 (Scatter) ====
    passCounter++
    for (let i = 0; i < currentArr.length; i++) {
      let val = currentArr[i].val
      if (val === null) continue

      // 计算当前元素属于哪个桶：向下取整 (当前值 - 最小值) / 跨度
      let bIdx = Math.floor((val - minVal) / bucketSize)
      // 防止边界溢出（比如浮点误差导致等于 bucketCount）
      if (bIdx >= bucketCount) bIdx = bucketCount - 1

      // 动画帧：聚焦当前元素，计算其目标桶
      pushState(`【计算映射】元素 ${val} 属于区间 [${bucketRanges[bIdx].start}, ${bucketRanges[bIdx].end}]，将被分配到 ${bIdx} 号桶。`,
        { [i]: ['is-current-i'] }, { [i]: ['cur'] },
        bIdx, {}, {}, passCounter
      )

      // 从主数组抽走，压入对应的桶中
      currentArr[i].val = null
      currentBuckets[bIdx].push({ id: `b-${globalId++}`, val: val })
      let localIdx = currentBuckets[bIdx].length - 1

      // 动画帧：元素入桶
      pushState(`【入桶】元素 ${val} 成功进入 ${bIdx} 号桶。`,
        { [i]: ['is-sorted'] }, {},
        bIdx, { [bIdx]: { [localIdx]: ['is-current-i'] } }, { [bIdx]: { [localIdx]: ['入桶'] } }, passCounter
      )
    }

    pushState(`【分配完成】所有元素都已进入对应的桶中。接下来对每个非空的桶进行内部排序。`, {}, {}, -1, {}, {}, passCounter)

    // ==== 阶段 2：桶内排序 (Sort) 与 收集回收 (Gather) ====
    let mainIdx = 0

    for (let b = 0; b < bucketCount; b++) {
      if (currentBuckets[b].length === 0) continue

      passCounter++

      // 1. 桶内排序展示
      if (currentBuckets[b].length > 1) {
        pushState(`【桶内排序】${b} 号桶有多个元素，使用合适的排序算法对其内部进行排序...`,
          {}, {}, b, { [b]: { 'all': ['is-scanning-j'] } }, {}, passCounter
        )

        // 对当前桶进行排序（这里模拟瞬间完成的内置排序，实际中可能是插入排序）
        currentBuckets[b].sort((x, y) => x.val - y.val)

        let sortedHB = {}
        for (let k = 0; k < currentBuckets[b].length; k++) sortedHB[k] = ['is-sorted']

        pushState(`【排序完成】${b} 号桶内部现已局部有序。`,
          {}, {}, b, { [b]: sortedHB }, {}, passCounter
        )
      }

      // 2. 收集元素
      pushState(`开始将 ${b} 号桶的元素按顺序回收至主数组...`,
        { [mainIdx]: ['is-scanning-j'] }, { [mainIdx]: ['回写位'] },
        b, {}, {}, passCounter
      )

      while (currentBuckets[b].length > 0) {
        // 头部弹出
        let item = currentBuckets[b].shift()
        currentArr[mainIdx].val = item.val

        // 动画帧：元素出桶写回
        pushState(`【出桶回写】将 ${item.val} 写入主数组。`,
          { [mainIdx]: ['is-sorted', 'is-current-i'] }, { [mainIdx]: ['cur'] },
          b, { [b]: { 0: ['is-scanning-j'] } }, {}, passCounter
        )

        mainIdx++
      }
    }

    // ==== 最终状态 ====
    let finalHM = {}
    for (let i = 0; i < currentArr.length; i++) finalHM[i] = ['is-sorted']
    pushState(`🎉 桶排序全部完成！通过“分而治之”将全局排序转化为小规模的局部排序，显著提高了效率。`, finalHM, {}, -1, {}, {}, passCounter)
  }
</script>

<style scoped>
  .bucket-sort-container {
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
    /* 防止标题与数组元素重叠 */
    padding-bottom: 15px;
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

  /* 弹性网格布局，均分桶阵列 */
  .buckets-grid {
    display: flex;
    justify-content: space-between;
    gap: 10px;
    flex-wrap: wrap;
  }

  /* 单个桶的样式 */
  .bucket-box {
    background-color: var(--vp-c-bg-soft);
    border: 2px solid var(--vp-c-border);
    border-radius: 8px;
    overflow: hidden;
    display: flex;
    flex-direction: column;
    flex: 1;
    min-width: 120px;
    /* 防止过窄 */
    min-height: 110px;
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
    padding: 6px 0;
    border-bottom: 1px solid var(--vp-c-border);
    line-height: 1.4;
  }

  .range-text {
    font-size: 11px;
    font-weight: normal;
    color: var(--vp-c-text-2);
  }

  .is-active-bucket .bucket-header {
    background-color: rgba(234, 179, 8, 0.2);
    color: #eab308;
  }

  .is-active-bucket .range-text {
    color: #ca8a04;
  }

  /* 缩微适配桶内的 ArrayDisplay */
  .bucket-content {
    flex-grow: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    /* 核心修改：上 10px, 左右 10px, 下 30px (给标签预留足够的空间) */
    padding: 10px 10px 30px 10px;
  }

  .bucket-content :deep(.array-display-inner) {
    padding: 0 !important;
    gap: 8px !important;
    min-height: 60px;
    /* 将 center 改为 flex-start，让方块从顶部开始排列，视觉上更稳 */
    align-items: flex-start;
  }

  .bucket-content :deep(.array-item) {
    width: 40px;
  }

  .bucket-content :deep(.item-value) {
    width: 36px;
    height: 36px;
    font-size: 16px;
  }

  .bucket-content :deep(.item-label) {
    font-size: 11px;
    margin-top: 4px;
  }

  /* 兼容当传入 'all' 高亮时的特殊处理 */
  .bucket-content :deep(.is-scanning-j .item-value) {
    border-color: #ec4899;
  }
</style>