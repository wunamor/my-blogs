<template>
  <VisualizerLayout
    title="四数之和 (LeetCode 18) - 排序 + 双固定点 + 双指针"
    storageKey="lc18-four-sum-config"
    defaultData="0 | 1, 0, -1, 0, -2, 2"
    :defaultInterval="900"
    :actionButtons="visualizerButtons"
    :steps="steps"
    @calculate="calculateSteps"
  >
    <template #visualization="{ step }">
      <div class="foursum-container" v-if="step && step.array">
        
        <!-- 顶部信息控制台 -->
        <div class="dashboard">
          
          <!-- 左侧：算式推演区 (支持动态 Target) -->
          <div class="math-board">
            <div class="board-header">
              <span class="label">当前推演公式：</span>
              <span class="target-badge">Target = {{ step.target }}</span>
            </div>
            
            <div class="expr-wrapper">
              <div 
                class="expr-pill" 
                :class="{
                  'is-pending': step.matchStatus === 'pending',
                  'is-valid': step.matchStatus === 'success',
                  'is-invalid-small': step.matchStatus === 'too-small',
                  'is-invalid-big': step.matchStatus === 'too-big'
                }"
                v-if="step.leftIdx !== -1 && step.rightIdx !== -1"
              >
                <span class="num val-i">{{ step.vI }}</span>
                <span class="sign">+</span>
                <span class="num val-j">{{ step.vJ }}</span>
                <span class="sign">+</span>
                <span class="num val-left">{{ step.vLeft }}</span>
                <span class="sign">+</span>
                <span class="num val-right">{{ step.vRight }}</span>
                <span class="sign">=</span>
                <span class="num sum-result">{{ step.sum }}</span>

                <!-- 结果文本带淡入动画 -->
                <span class="result-text success-text" v-if="step.matchStatus === 'success'">✅ 命中</span>
                <span class="result-text small-text" v-if="step.matchStatus === 'too-small'">↑ 偏小 (L++)</span>
                <span class="result-text big-text" v-if="step.matchStatus === 'too-big'">↓ 偏大 (R--)</span>
              </div>
              <div class="expr-pill is-pending" v-else>
                <span class="empty-text">等待内外层指针就位...</span>
              </div>
            </div>
          </div>

          <!-- 右侧：四元组收集篮 -->
          <div class="result-board">
            <span class="label">已收集的不重复四元组：</span>
            <div class="result-basket">
              <div class="empty-basket" v-if="step.results.length === 0">暂无结果</div>
              <!-- 收集到的四元组芯片 -->
              <div 
                class="quad-chip" 
                v-for="(quad, idx) in step.results" 
                :key="idx"
                :class="{ 'is-new': idx === step.results.length - 1 && step.matchStatus === 'success' }"
              >
                [{{ quad.join(', ') }}]
              </div>
            </div>
          </div>
        </div>

        <div class="divider">
          <div class="arrow-down">↓ 物理数组与指针状态 ↓</div>
        </div>

        <!-- 数组主视图 -->
        <div class="array-wrapper">
          <div class="array-track">
            <div 
              class="array-item-group" 
              v-for="(item, idx) in step.array" 
              :key="item.id"
            >
              <!-- 数组节点 -->
              <div 
                class="array-box"
                :class="{
                  'is-fixed-i': step.iIdx === idx,
                  'is-fixed-j': step.jIdx === idx,
                  'is-left': step.leftIdx === idx,
                  'is-right': step.rightIdx === idx,
                  'is-skipped': step.skippedIdxs.includes(idx),
                  'is-processed': idx < step.iIdx && step.iIdx !== -1
                }"
              >
                {{ item.val }}
              </div>
              
              <!-- 底部标签与四指针标识 -->
              <div class="pointer-track">
                <span class="idx">{{ idx }}</span>
                <div class="ptr-labels">
                  <span v-if="step.iIdx === idx" class="ptr ptr-fixed-i">i(定)</span>
                  <span v-if="step.jIdx === idx" class="ptr ptr-fixed-j">j(定)</span>
                  <span v-if="step.leftIdx === idx" class="ptr ptr-left">L</span>
                  <span v-if="step.rightIdx === idx" class="ptr ptr-right">R</span>
                  <span v-if="step.skippedIdxs.includes(idx)" class="ptr ptr-skip">去重</span>
                </div>
              </div>
            </div>
          </div>
        </div>

      </div>
    </template>
  </VisualizerLayout>
</template>

<script setup>
import { ref } from 'vue'
import VisualizerLayout from '@components/common/visualization/VisualizerLayout.vue'

const visualizerButtons = [
  { id: 'prev', label: '上一步', icon: 'prev' },
  { id: 'play', label: '自动播放', labelPause: '暂停', icon: 'play', iconPause: 'pause' },
  { id: 'next', label: '下一步', icon: 'next' },
  { id: 'skip', label: '跳过本轮', icon: 'skip' }
]

const steps = ref([])

const calculateSteps = (inputRaw) => {
  // 💡 特殊支持：允许输入 "target | nums..." 的格式，否则默认 target 为 0
  let target = 0
  let numStr = inputRaw
  if (inputRaw.includes('|')) {
    const parts = inputRaw.split('|')
    target = parseInt(parts[0].trim())
    numStr = parts[1]
  }

  let arr = numStr.split(',').map(n => parseInt(n.trim())).filter(n => !isNaN(n))
  if (arr.length < 4) {
    steps.value = []
    return
  }

  steps.value = []
  let passNum = 0
  let resultsList = []
  let skippedSet = [] 

  // 1. 数组预处理排序
  arr.sort((a, b) => a - b)
  const arrayObj = arr.map((val, idx) => ({ id: `s-${idx}`, val }))

  const pushState = (desc, i, j, l, r, status) => {
    let vI = i !== -1 && i < arr.length ? arr[i] : null
    let vJ = j !== -1 && j < arr.length ? arr[j] : null
    let vL = l !== -1 && l < arr.length ? arr[l] : null
    let vR = r !== -1 && r < arr.length ? arr[r] : null
    // JS 数字采用 IEEE 754 双精度浮点数，安全整数范围高达 900万亿，天然防溢出
    let sum = (vI !== null && vJ !== null && vL !== null && vR !== null) ? (vI + vJ + vL + vR) : null

    steps.value.push({
      target: target,
      array: JSON.parse(JSON.stringify(arrayObj)),
      iIdx: i,
      jIdx: j,
      leftIdx: l,
      rightIdx: r,
      vI, vJ, vLeft: vL, vRight: vR,
      sum,
      matchStatus: status, // 'pending', 'success', 'too-small', 'too-big'
      skippedIdxs: [...skippedSet],
      results: JSON.parse(JSON.stringify(resultsList)),
      description: desc,
      passId: passNum++
    })
  }

  pushState(`【初始化】目标 Target = ${target}。已将数组从小到大排序。四数之和需要两层外循环固定 i 和 j。`, -1, -1, -1, -1, 'pending')

  // ================= 完美复刻你的 Java 逻辑 =================
  let n = arr.length

  for (let i = 0; i < n - 3; ) {
    let iV = arr[i]
    
    // 每次外层循环移动，清理掉旧的去重印记
    skippedSet = []

    for (let j = i + 1; j < n - 2; ) {
      // 💡 核心继承：开启双指针探测前，清空上一轮的去重残留！避免视觉 Bug
      skippedSet = []
      
      let jV = arr[j]
      let left = j + 1
      let right = n - 1

      pushState(`【锁定双基准】固定外层 i = ${i} (值 ${iV})，内层 j = ${j} (值 ${jV})。在 [${left}, ${right}] 区间寻找和为 ${target} 的组合。`, i, j, left, right, 'pending')

      while (left < right) {
        let sum = iV + jV + arr[left] + arr[right]

        if (sum === target) {
          resultsList.push([iV, jV, arr[left], arr[right]])
          pushState(`🎉 命中！四数之和 = ${target}。收集结果并准备对 left 和 right 指针进行去重操作。`, i, j, left, right, 'success')

          // 翻译你的 Java: while (left < right && nums[left++] == nums[left]);
          let sameLeftV = arr[left]
          left++
          let lHasSkip = false
          while (left < right && arr[left] === sameLeftV) {
            skippedSet.push(left)
            left++
            lHasSkip = true
          }
          if (lHasSkip) pushState(`【左指针去重】跳过重复的 ${sameLeftV}。`, i, j, left, right, 'pending')

          // 翻译你的 Java: while (left < right && nums[right--] == nums[right]);
          let sameRightV = arr[right]
          right--
          let rHasSkip = false
          while (left < right && arr[right] === sameRightV) {
            skippedSet.push(right)
            right--
            rHasSkip = true
          }
          if (rHasSkip) pushState(`【右指针去重】跳过重复的 ${sameRightV}。`, i, j, left, right, 'pending')

        } else if (sum < target) {
          pushState(`【总和偏小】${sum} < Target(${target})。由于数组已排序，说明左侧值太小，左指针右移 (L++)。`, i, j, left, right, 'too-small')
          left++
        } else {
          pushState(`【总和偏大】${sum} > Target(${target})。说明右侧值太大，右指针左移 (R--)。`, i, j, left, right, 'too-big')
          right--
        }
      }

      // j 循环结束，翻译 Java: while (j < n - 2 && nums[j++] == nums[j]);
      let sameJ = arr[j]
      j++
      let jHasSkip = false
      while (j < n - 2 && arr[j] === sameJ) {
        skippedSet.push(j)
        j++
        jHasSkip = true
      }
      if (jHasSkip) pushState(`【内层固定点 j 去重】跳过相同基准点 ${sameJ} 避免解集重复。`, i, j, -1, -1, 'pending')
    }

    // i 循环结束，翻译 Java: while (i < n - 3 && nums[i++] == nums[i]);
    let sameI = arr[i]
    i++
    let iHasSkip = false
    while (i < n - 3 && arr[i] === sameI) {
      skippedSet.push(i)
      i++
      iHasSkip = true
    }
    if (iHasSkip) pushState(`【外层固定点 i 去重】跳过最外层基准点 ${sameI}。`, i, -1, -1, -1, 'pending')
  }

  pushState(`🏁 算法执行完毕！共找到 ${resultsList.length} 组不重复的四元组。`, -1, -1, -1, -1, 'pending')
}
</script>

<style scoped>
.foursum-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  width: 100%;
  padding: 10px 0;
  gap: 20px;
}

/* ================= 仪表盘区 ================= */
.dashboard {
  display: flex;
  gap: 20px;
  width: 100%;
  justify-content: center;
  flex-wrap: wrap;
}

.math-board, .result-board {
  display: flex;
  flex-direction: column;
  background-color: var(--vp-c-bg-elv);
  border: 1px solid var(--vp-c-border);
  padding: 16px 20px;
  border-radius: 12px;
  min-width: 320px;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
}

.board-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.label {
  font-size: 13px;
  color: var(--vp-c-text-2);
  font-weight: bold;
}

/* 目标值 Badge */
.target-badge {
  background: var(--vp-c-bg-mute);
  border: 1px solid var(--vp-c-border);
  padding: 2px 8px;
  border-radius: 6px;
  font-family: monospace;
  font-size: 13px;
  font-weight: bold;
  color: var(--vp-c-text-1);
}

/* ================= 算式胶囊推演区 ================= */
.expr-wrapper {
  display: flex;
  align-items: center;
  height: 44px;
}

.expr-pill {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 6px 20px;
  border-radius: 30px;
  font-family: monospace;
  font-size: 18px;
  font-weight: 900;
  border: 1px solid transparent;
  transition: all 0.5s cubic-bezier(0.4, 0, 0.2, 1);
}

.empty-text { font-size: 14px; font-weight: normal; color: var(--vp-c-text-3); }

/* 数字的专有颜色映射 */
.val-i { color: #8b5cf6; }     /* 紫色 */
.val-j { color: #6366f1; }     /* 靛蓝 */
.val-left { color: #3b82f6; }  /* 蓝色 */
.val-right { color: #ec4899; } /* 粉色 */
.sign { color: var(--vp-c-text-3); font-weight: normal; }

/* 状态判定泛光 */
.is-pending { background: var(--vp-c-bg-soft); color: var(--vp-c-text-1); border-color: var(--vp-c-border); }
.is-valid { background: rgba(16, 185, 129, 0.08); border-color: rgba(16, 185, 129, 0.3); box-shadow: 0 4px 15px rgba(16, 185, 129, 0.15); }
.is-valid .sum-result { color: #10b981; }
.is-invalid-small { background: rgba(249, 115, 22, 0.08); border-color: rgba(249, 115, 22, 0.3); }
.is-invalid-small .sum-result { color: #f97316; }
.is-invalid-big { background: rgba(239, 68, 68, 0.08); border-color: rgba(239, 68, 68, 0.3); }
.is-invalid-big .sum-result { color: #ef4444; }

/* 尾部文字特效 */
.result-text {
  margin-left: 8px;
  font-size: 14px;
  font-family: var(--vp-font-family-base);
  animation: slideFadeIn 0.4s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
}
.success-text { color: #10b981; }
.small-text { color: #f97316; }
.big-text { color: #ef4444; }

@keyframes slideFadeIn { from { opacity: 0; transform: translateX(-15px); } to { opacity: 1; transform: translateX(0); } }

/* ================= 结果收集篮 ================= */
.result-basket {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  min-height: 36px;
  align-items: center;
}
.empty-basket { color: var(--vp-c-text-3); font-size: 14px; font-style: italic; }

.quad-chip {
  background: rgba(16, 185, 129, 0.1);
  color: #10b981;
  border: 1px solid rgba(16, 185, 129, 0.4);
  padding: 4px 10px;
  border-radius: 6px;
  font-family: monospace;
  font-weight: bold;
  font-size: 13px;
}
.quad-chip.is-new {
  animation: popIn 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards;
}

@keyframes popIn { 0% { opacity: 0; transform: scale(0.5); } 100% { opacity: 1; transform: scale(1); } }

.divider { display: flex; font-size: 14px; font-weight: bold; color: var(--vp-c-text-3); opacity: 0.8; margin-top: 5px; }

/* ================= 数组显示区 ================= */
.array-wrapper {
  width: 100%;
  overflow-x: auto;
  background-color: var(--vp-c-bg-soft);
  border-radius: 12px;
  border: 1px solid var(--vp-c-border);
  padding: 40px 20px 30px 20px;
  display: flex;
  justify-content: center;
}

.array-track {
  display: flex;
  gap: 12px;
}

.array-item-group {
  display: flex;
  flex-direction: column;
  align-items: center;
  position: relative;
  width: 50px;
}

.array-box {
  width: 100%;
  height: 50px;
  border: 2px solid var(--vp-c-border);
  border-radius: 8px;
  display: flex;
  justify-content: center;
  align-items: center;
  font-size: 18px;
  font-weight: bold;
  color: var(--vp-c-text-1);
  background: var(--vp-c-bg-elv);
  transition: all 0.3s;
  z-index: 2;
}

/* 指针角色高亮 */
.is-fixed-i {
  border-color: #8b5cf6; background-color: rgba(139, 92, 246, 0.15); box-shadow: 0 0 12px rgba(139, 92, 246, 0.4); color: #8b5cf6; transform: translateY(-5px);
}
.is-fixed-j {
  border-color: #6366f1; background-color: rgba(99, 102, 241, 0.15); box-shadow: 0 0 12px rgba(99, 102, 241, 0.4); color: #6366f1; transform: translateY(-5px);
}
.is-left {
  border-color: #3b82f6; background-color: rgba(59, 130, 246, 0.15); box-shadow: 0 0 12px rgba(59, 130, 246, 0.4); color: #3b82f6; transform: translateY(-5px);
}
.is-right {
  border-color: #ec4899; background-color: rgba(236, 72, 153, 0.15); box-shadow: 0 0 12px rgba(236, 72, 153, 0.4); color: #ec4899; transform: translateY(-5px);
}

/* 核心特效：去重元素标记 (变灰+虚线) */
.is-skipped {
  opacity: 0.4;
  border-style: dashed;
  background: repeating-linear-gradient(
    45deg, var(--vp-c-bg-mute), var(--vp-c-bg-mute) 5px, var(--vp-c-bg-soft) 5px, var(--vp-c-bg-soft) 10px
  );
}

/* 随着 i 推进，彻底废弃的节点降噪 */
.is-processed {
  opacity: 0.2;
  border-color: transparent;
}

/* ================= 底部指针 ================= */
.pointer-track {
  margin-top: 8px;
  display: flex;
  flex-direction: column;
  align-items: center;
  height: 40px;
}

.idx { font-size: 12px; color: var(--vp-c-text-3); margin-bottom: 4px; }

.ptr-labels {
  display: flex;
  flex-direction: column;
  gap: 2px;
  align-items: center;
}

.ptr {
  font-size: 10px;
  padding: 2px 6px;
  border-radius: 4px;
  font-weight: bold;
  color: white;
}
.ptr-fixed-i { background: #8b5cf6; }
.ptr-fixed-j { background: #6366f1; }
.ptr-left { background: #3b82f6; }
.ptr-right { background: #ec4899; }
.ptr-skip { background: var(--vp-c-text-3); }
</style>