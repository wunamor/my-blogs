<template>
  <VisualizerLayout
    title="三数之和 (LeetCode 15) - 排序 + 双指针"
    storageKey="lc15-three-sum-config"
    defaultData="-1, 0, 1, 2, -1, -4, -2, -3, 3, 0, 4"
    :defaultInterval="900"
    :actionButtons="visualizerButtons"
    :steps="steps"
    @calculate="calculateSteps"
  >
    <template #visualization="{ step }">
      <div class="threesum-container" v-if="step && step.array">
        
        <!-- 顶部信息控制台 -->
        <div class="dashboard">
          
          <!-- 左侧：算式推演区 (沿用并升级了轻量胶囊形态) -->
          <div class="math-board">
            <span class="label">当前推演公式 (a + b + c = 0)：</span>
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
                <span class="num val-fixed">{{ step.vFixed }}</span>
                <span class="sign">+</span>
                <span class="num val-left">{{ step.vLeft }}</span>
                <span class="sign">+</span>
                <span class="num val-right">{{ step.vRight }}</span>
                <span class="sign">=</span>
                <span class="num sum-result">{{ step.sum }}</span>

                <!-- 结果文本带淡入动画 -->
                <span class="result-text success-text" v-if="step.matchStatus === 'success'">✅ 命中 0</span>
                <span class="result-text small-text" v-if="step.matchStatus === 'too-small'">↑ 偏小 (L++)</span>
                <span class="result-text big-text" v-if="step.matchStatus === 'too-big'">↓ 偏大 (R--)</span>
              </div>
              <div class="expr-pill is-pending" v-else>
                <span class="empty-text">{{ step.fixedIdx === -1 ? '等待排序完成...' : '等待双指针就位...' }}</span>
              </div>
            </div>
          </div>

          <!-- 右侧：三元组收集篮 -->
          <div class="result-board">
            <span class="label">已收集的不重复三元组：</span>
            <div class="result-basket">
              <div class="empty-basket" v-if="step.results.length === 0">暂无结果</div>
              <!-- 收集到的三元组芯片 -->
              <div 
                class="triplet-chip" 
                v-for="(triplet, idx) in step.results" 
                :key="idx"
                :class="{ 'is-new': idx === step.results.length - 1 && step.matchStatus === 'success' }"
              >
                [{{ triplet.join(', ') }}]
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
                  'is-fixed': step.fixedIdx === idx,
                  'is-left': step.leftIdx === idx,
                  'is-right': step.rightIdx === idx,
                  'is-skipped': step.skippedIdxs.includes(idx),
                  'is-processed': idx < step.fixedIdx && step.fixedIdx !== -1,
                  'is-positive-prune': step.isPruned && idx >= step.fixedIdx
                }"
              >
                {{ item.val }}
              </div>
              
              <!-- 底部标签与指针 -->
              <div class="pointer-track">
                <span class="idx">{{ idx }}</span>
                <div class="ptr-labels">
                  <span v-if="step.fixedIdx === idx" class="ptr ptr-fixed">i(定)</span>
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
  let arr = inputRaw.split(',').map(n => parseInt(n.trim())).filter(n => !isNaN(n))
  if (arr.length < 3) {
    steps.value = []
    return
  }

  steps.value = []
  let passNum = 0
  let resultsList = []
  let skippedSet = [] // 记录哪些索引是被跳过的去重元素，用于视觉标灰

  // 1. 数组预处理排序
  arr.sort((a, b) => a - b)
  const arrayObj = arr.map((val, idx) => ({ id: `sorted-${idx}`, val }))

  const pushState = (desc, fIdx, lIdx, rIdx, status, isPrune = false) => {
    let sV = fIdx !== -1 ? arr[fIdx] : null
    let lV = lIdx !== -1 ? arr[lIdx] : null
    let rV = rIdx !== -1 ? arr[rIdx] : null
    let sum = (sV !== null && lV !== null && rV !== null) ? (sV + lV + rV) : null

    steps.value.push({
      array: JSON.parse(JSON.stringify(arrayObj)),
      fixedIdx: fIdx,
      leftIdx: lIdx,
      rightIdx: rIdx,
      vFixed: sV,
      vLeft: lV,
      vRight: rV,
      sum: sum,
      matchStatus: status, // 'pending', 'success', 'too-small', 'too-big'
      skippedIdxs: [...skippedSet],
      results: JSON.parse(JSON.stringify(resultsList)),
      isPruned: isPrune,
      description: desc,
      passId: passNum++
    })
  }

  pushState("【初始化】已将数组从小到大排序。排序是利用双指针寻找目标值，以及后续“剪枝去重”的核心前提！", -1, -1, -1, 'pending')

  // ================= 完美复刻 Java 逻辑 =================
  let n = arr.length
  let smallIndex = 0

  while (smallIndex < n - 2) {
    // 💡 核心修复：开启新一轮的范围探测前，清空上一轮残留的去重标记！
    skippedSet = []
    let sV = arr[smallIndex]
    
    // 【小优化】剪枝：如果固定的最小值已经大于0，后面不可能等于0了
    if (sV > 0) {
      pushState(`【极致剪枝】当前固定点 sV=${sV} > 0。因为数组已排序，右侧的数字必然全都大于0，三数之和绝对不可能等于0，循环提前终止！`, smallIndex, -1, -1, 'pending', true)
      break
    }

    let left = smallIndex + 1
    let right = n - 1

    pushState(`【锁定固定点】固定 smallIndex = ${smallIndex} (值为 ${sV})。接下来在 [${left}, ${right}] 区间内启动双指针，寻找和为 ${-sV} 的两个数。`, smallIndex, left, right, 'pending')

    while (left < right) {
      let sum = sV + arr[left] + arr[right]

      if (sum === 0) {
        // 记录结果
        resultsList.push([sV, arr[left], arr[right]])
        pushState(`🎉 找到命中组合！${sV} + ${arr[left]} + ${arr[right]} = 0。将其加入结果集。接下来准备对左右指针进行去重操作。`, smallIndex, left, right, 'success')

        // 去重 left
        let sameLeftV = arr[left]
        left++
        let hasLeftSkip = false
        while (left < right && arr[left] === sameLeftV) {
          skippedSet.push(left)
          left++
          hasLeftSkip = true
        }
        if (hasLeftSkip) {
          pushState(`【左侧去重】为了防止收集到重复的三元组，左指针跳过了所有连续的重复元素 ${sameLeftV}。`, smallIndex, left, right, 'pending')
        }

        // 去重 right
        let sameRightV = arr[right]
        right--
        let hasRightSkip = false
        while (left < right && arr[right] === sameRightV) {
          skippedSet.push(right)
          right--
          hasRightSkip = true
        }
        if (hasRightSkip) {
           pushState(`【右侧去重】同样，右指针跳过了所有连续的重复元素 ${sameRightV}。`, smallIndex, left, right, 'pending')
        }

      } else if (sum < 0) {
        pushState(`【总和偏小】${sV} + ${arr[left]} + ${arr[right]} = ${sum} < 0。说明左侧数值太小，必须将左指针右移 (left++)。`, smallIndex, left, right, 'too-small')
        left++
      } else {
        pushState(`【总和偏大】${sV} + ${arr[left]} + ${arr[right]} = ${sum} > 0。说明右侧数值太大，必须将右指针左移 (right--)。`, smallIndex, left, right, 'too-big')
        right--
      }
    }

    // 去重 smallIndex
    let sameFixedV = arr[smallIndex]
    smallIndex++
    let hasFixedSkip = false
    while (smallIndex < n - 2 && arr[smallIndex] === sameFixedV) {
      skippedSet.push(smallIndex)
      smallIndex++
      hasFixedSkip = true
    }
    
    if (hasFixedSkip) {
      pushState(`【基准点去重】外层基准点也必须去重！跳过所有值为 ${sameFixedV} 的固定点，避免产生完全一样的解区间。`, smallIndex, -1, -1, 'pending')
    }
  }

  pushState(`🏁 算法执行完毕！共找到 ${resultsList.length} 组不重复的三元组。数组中标记灰色的即为被剪枝跳过的冗余计算。`, -1, -1, -1, 'pending')
}
</script>

<style scoped>
.threesum-container {
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

.label {
  font-size: 13px;
  color: var(--vp-c-text-2);
  margin-bottom: 12px;
  font-weight: bold;
}

/* ================= 算式胶囊推演区 ================= */
.expr-wrapper {
  display: flex;
  align-items: center;
  height: 44px; /* 锁定高度防抖 */
}

.expr-pill {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 6px 20px;
  border-radius: 30px;
  font-family: monospace;
  font-size: 20px;
  font-weight: 900;
  border: 1px solid transparent;
  transition: all 0.5s cubic-bezier(0.4, 0, 0.2, 1);
}

.empty-text { font-size: 14px; font-weight: normal; color: var(--vp-c-text-3); }

/* 数字的专有颜色映射 */
.val-fixed { color: #8b5cf6; } /* 紫色 */
.val-left { color: #3b82f6; }  /* 蓝色 */
.val-right { color: #ec4899; } /* 粉色 */
.sign { color: var(--vp-c-text-3); font-weight: normal; }

/* 状态判定泛光 */
.is-pending { background: var(--vp-c-bg-soft); color: var(--vp-c-text-1); border-color: var(--vp-c-border); }

/* 命中 = 0 */
.is-valid {
  background: rgba(16, 185, 129, 0.08);
  border-color: rgba(16, 185, 129, 0.3);
  box-shadow: 0 4px 15px rgba(16, 185, 129, 0.15);
}
.is-valid .sum-result { color: #10b981; }

/* 偏小 < 0 */
.is-invalid-small {
  background: rgba(249, 115, 22, 0.08);
  border-color: rgba(249, 115, 22, 0.3);
}
.is-invalid-small .sum-result { color: #f97316; }

/* 偏大 > 0 */
.is-invalid-big {
  background: rgba(239, 68, 68, 0.08);
  border-color: rgba(239, 68, 68, 0.3);
}
.is-invalid-big .sum-result { color: #ef4444; }

/* 尾部文字特效 */
.result-text {
  margin-left: 8px;
  font-size: 15px;
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

.triplet-chip {
  background: rgba(16, 185, 129, 0.1);
  color: #10b981;
  border: 1px solid rgba(16, 185, 129, 0.4);
  padding: 4px 10px;
  border-radius: 6px;
  font-family: monospace;
  font-weight: bold;
  font-size: 14px;
}
.triplet-chip.is-new {
  animation: popIn 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards;
}

@keyframes popIn {
  0% { opacity: 0; transform: scale(0.5); }
  100% { opacity: 1; transform: scale(1); }
}

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
.is-fixed {
  border-color: #8b5cf6;
  background-color: rgba(139, 92, 246, 0.15);
  box-shadow: 0 0 12px rgba(139, 92, 246, 0.4);
  color: #8b5cf6;
  transform: translateY(-5px);
}
.is-left {
  border-color: #3b82f6;
  background-color: rgba(59, 130, 246, 0.15);
  box-shadow: 0 0 12px rgba(59, 130, 246, 0.4);
  color: #3b82f6;
  transform: translateY(-5px);
}
.is-right {
  border-color: #ec4899;
  background-color: rgba(236, 72, 153, 0.15);
  box-shadow: 0 0 12px rgba(236, 72, 153, 0.4);
  color: #ec4899;
  transform: translateY(-5px);
}

/* 核心特效：去重元素标记 (变灰+虚线) */
.is-skipped {
  opacity: 0.4;
  border-style: dashed;
  background: repeating-linear-gradient(
    45deg,
    var(--vp-c-bg-mute),
    var(--vp-c-bg-mute) 5px,
    var(--vp-c-bg-soft) 5px,
    var(--vp-c-bg-soft) 10px
  );
}

/* 已处理完毕的左侧节点降噪 */
.is-processed {
  opacity: 0.2;
  border-color: transparent;
}

/* 极致剪枝 (sV > 0 时右侧全灭) */
.is-positive-prune {
  opacity: 0.2;
  background: #ef4444;
  color: white;
  border-color: #ef4444;
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
.ptr-fixed { background: #8b5cf6; }
.ptr-left { background: #3b82f6; }
.ptr-right { background: #ec4899; }
.ptr-skip { background: var(--vp-c-text-3); }
</style>