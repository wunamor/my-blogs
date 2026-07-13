<template>
  <AlgorithmVisualizerLayout
    title="归并排序 (Merge Sort)"
    storageKey="merge-sort-config"
    defaultData="7, 5, 2, 3, 6, 4"
    :actionButtons="visualizerButtons"
    :steps="steps"
    @calculate="calculateSteps"
  >
    <template #visualization="{ step }">
      <div
        class="merge-sort-container"
        v-if="step"
      >

        <div class="array-wrapper">
          <div class="array-title">
            <span class="badge primary">原数组</span>
            <span class="desc">用于“分割”与对比元素</span>
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
          <div class="arrow-down">↓ 归 并 ↓</div>
          <div class="arrow-up">↑ 复 制 ↑</div>
        </div>

        <div class="array-wrapper temp-wrapper">
          <div class="array-title">
            <span class="badge warning">临时数组 (Temp)</span>
            <span class="desc">用于存放排序好的子区间元素</span>
          </div>
          <ArrayDisplay
            :items="step.tempArray"
            :highlights="step.tempHighlights"
            :labels="step.tempLabels"
            :printNull="false"
            :occupySpaceForNull="true"
          />
        </div>

      </div>
    </template>
  </AlgorithmVisualizerLayout>
</template>

<script setup>
  import { ref } from 'vue'

  // 【引入新基座】：使用规范化的绝对路径别名
  import AlgorithmVisualizerLayout from '@components/common/visualization/VisualizerLayout.vue'
  import ArrayDisplay from '@components/common/visualization/ArrayDisplay.vue'

  // 【控制反转】：由业务组件自己决定需要展示哪些控制按钮，传入 Layout
  // 【传入 Layout】：通过 icon 字段自由指定你要的图标，不与 id 强绑定
  const visualizerButtons = [
    { id: 'prev', label: '上一步', icon: 'prev' },
    { id: 'play', label: '自动播放', labelPause: '暂停', icon: 'play', iconPause: 'pause' },
    { id: 'next', label: '下一步', icon: 'next' },
    { id: 'skip', label: '跳过本轮', icon: 'skip' }
  ]

  // 存储所有的动画步骤
  const steps = ref([])

  /**
   * 核心：计算归并排序所有的关键帧并存入 steps
   * @param {String} inputRaw 用户输入的字符串
   */
  const calculateSteps = (inputRaw) => {
    // 解析输入
    const arrStr = inputRaw.split(',').map(s => s.trim()).filter(s => s !== '')
    if (arrStr.length === 0) {
      steps.value = []
      return
    }

    // 初始化原数组与临时数组的数据结构
    const initialArr = arrStr.map((val, idx) => ({ id: `main-${idx}`, val: Number(val) }))
    const initialTemp = arrStr.map((_, idx) => ({ id: `temp-${idx}`, val: null }))

    steps.value = []

    // 深拷贝作为当前操作的数据源
    let currentArr = JSON.parse(JSON.stringify(initialArr))
    let currentTemp = JSON.parse(JSON.stringify(initialTemp))
    let passCounter = 0

    // 定义统一的推进步骤函数
    const pushState = (desc, hM = {}, lM = {}, hT = {}, lT = {}, passId = 0) => {
      steps.value.push({
        mainArray: JSON.parse(JSON.stringify(currentArr)),
        tempArray: JSON.parse(JSON.stringify(currentTemp)),
        highlights: hM,
        labels: lM,
        tempHighlights: hT,
        tempLabels: lT,
        description: desc,
        passId
      })
    }

    // 初始状态
    pushState("初始状态。归并排序需要开辟一个与原数组等长的辅助空间（下方的临时数组）。")

    // ====== 核心：归并排序递归逻辑 ======
    const mergeSort = (left, right) => {
      if (left >= right) return

      const mid = Math.floor((left + right) / 2)

      // 动画帧：展示当前“分割”的区间
      let splitHM = {}
      // 左区间加上蓝色边框与底色，右区间加上粉色边框与底色，视觉分离更明显
      for (let i = left; i <= mid; i++) splitHM[i] = ['is-current-i', 'is-gap-group']
      for (let i = mid + 1; i <= right; i++) splitHM[i] = ['is-scanning-j', 'is-gap-group']
      pushState(`【分割】将区间 [${left}, ${right}] 从中点拆分为左 [${left}, ${mid}] 和右 [${mid + 1}, ${right}] 两个子区间。`, splitHM)

      // 递归左半部
      mergeSort(left, mid)
      // 递归右半部
      mergeSort(mid + 1, right)

      // 合并操作
      merge(left, mid, right)
    }

    // ====== 核心：合并逻辑 ======
    const merge = (left, mid, right) => {
      passCounter++

      // 动画帧：准备合并
      let hm = {}
      for (let i = left; i <= mid; i++) hm[i] = ['is-current-i']    // 左侧蓝色
      for (let i = mid + 1; i <= right; i++) hm[i] = ['is-scanning-j'] // 右侧粉色
      pushState(`【准备归并】开始合并已排序的子区间：左区间 [${left}, ${mid}] 和右区间 [${mid + 1}, ${right}]。`, hm, {}, {}, {}, passCounter)

      let i = left       // 左区间指针
      let j = mid + 1    // 右区间指针
      let k = left       // 临时数组指针

      // 1. 比较左右区间元素，较小的放入临时数组
      while (i <= mid && j <= right) {
        let curHM = { ...hm }
        let curLM = { [i]: ['i', 'target'], [j]: ['j', 'target'] }
        let curLT = { [k]: ['k', 'min'] }

        pushState(`【比较】对比左区间 ${currentArr[i].val} 和右区间 ${currentArr[j].val} 的大小...`, curHM, curLM, {}, curLT, passCounter)

        if (currentArr[i].val <= currentArr[j].val) {
          let val = currentArr[i].val
          currentTemp[k].val = val
          currentArr[i].val = null // 视觉上将元素“抽走”

          curHM[i] = ['is-sorted'] // 标记当前坑位已被处理
          pushState(`【移动】元素 ${val} 较小，将其移动到临时数组。左指针 i 右移。`, curHM, curLM, { [k]: ['is-sorted'] }, curLT, passCounter)
          i++
        } else {
          let val = currentArr[j].val
          currentTemp[k].val = val
          currentArr[j].val = null // 视觉上抽走元素

          curHM[j] = ['is-sorted']
          pushState(`【移动】元素 ${val} 较小，将其移动到临时数组。右指针 j 右移。`, curHM, curLM, { [k]: ['is-sorted'] }, curLT, passCounter)
          j++
        }
        k++
      }

      // 2. 将左侧剩余的元素无脑填入临时数组
      while (i <= mid) {
        let curLM = { [i]: ['i', 'target'] }
        let curLT = { [k]: ['k', 'min'] }
        let val = currentArr[i].val
        pushState(`【扫尾】右区间已全部合并，将左区间剩余的 ${val} 直接落入临时数组。`, hm, curLM, { [k]: ['is-sorted'] }, curLT, passCounter)

        currentTemp[k].val = val
        currentArr[i].val = null
        i++; k++
      }

      // 3. 将右侧剩余的元素无脑填入临时数组
      while (j <= right) {
        let curLM = { [j]: ['j', 'target'] }
        let curLT = { [k]: ['k', 'min'] }
        let val = currentArr[j].val
        pushState(`【扫尾】左区间已全部合并，将右区间剩余的 ${val} 直接落入临时数组。`, hm, curLM, { [k]: ['is-sorted'] }, curLT, passCounter)

        currentTemp[k].val = val
        currentArr[j].val = null
        j++; k++
      }

      // 4. 将临时数组中的这一段拷回原数组
      let copyHM = {}
      for (let x = left; x <= right; x++) copyHM[x] = ['is-sorted']
      pushState(`【合并完成】区间 [${left}, ${right}] 已在临时数组中排好序，准备将它们复制回原数组对应的位置。`, {}, {}, copyHM, {}, passCounter)

      for (let x = left; x <= right; x++) {
        currentArr[x].val = currentTemp[x].val
        currentTemp[x].val = null // 临时数组清空以供下一次复用

        let curHM = { [x]: ['is-sorted'] }
        let curHT = { [x]: ['is-scanning-j'] }
        pushState(`【复制】将 ${currentArr[x].val} 复制回原数组索引 ${x} 处。`, curHM, {}, curHT, {}, passCounter)
      }

      pushState(`🎉 子区间 [${left}, ${right}] 归并排序完毕！`, copyHM, {}, {}, {}, passCounter)
    }

    // 开始执行
    if (currentArr.length > 0) {
      mergeSort(0, currentArr.length - 1)
    }

    // 最终状态
    let finalHM = {}
    for (let i = 0; i < currentArr.length; i++) finalHM[i] = ['is-sorted']
    pushState("🎉 整个数组归并排序全部完成！原数组已有序，临时数组空间将被释放。", finalHM)
  }
</script>

<style scoped>
  .merge-sort-container {
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
    transition: all 0.3s ease;
  }

  .temp-wrapper {
    background-color: rgba(234, 179, 8, 0.05);
    border: 1px dashed rgba(234, 179, 8, 0.5);
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