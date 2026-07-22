<template>
  <VisualizerLayout
    title="有效三角形的个数 (LeetCode 611) - 排序与双指针"
    storageKey="lc611-triangle-config"
    defaultData="2, 3, 4, 4, 6"
    :defaultInterval="1000"
    :actionButtons="visualizerButtons"
    :steps="steps"
    @calculate="calculateSteps"
  >
    <template #visualization="{ step }">
      <div class="triangle-container" v-if="step && step.array">
        
        <!-- 顶部控制台 -->
        <div class="dashboard">
          <div class="math-board">
            <span class="label">当前判断公式 (a + b > c)：</span>
            
            <!-- 新增一个 wrapper 锁定高度，防止状态切换时页面上下跳动 -->
            <div class="expr-wrapper">
              <!-- 核心：改造成胶囊样式 expr-pill，并完善三个状态的 class 判定 -->
              <div 
                class="expr-pill" 
                :class="step.isSuccess === true ? 'is-valid' : (step.isSuccess === false ? 'is-invalid' : 'is-pending')"
              >
                <template v-if="step.mathStr">
                  {{ step.mathStr }}
                </template>
                <template v-else>
                  <span class="empty-text">等待指针就位...</span>
                </template>
              </div>
            </div>
          </div>
          <div class="count-board">
            <span class="label">合法三角形总数：</span>
            
            <!-- 绑定 key，确保即便连续两帧都触发增加，也能强制重置并播放 CSS 动画 -->
            <div class="count-value-container" :key="'count-' + step.passId">
              
              <!-- 场景一：这帧没增加，安安静静显示数字 -->
              <span class="static-count" v-if="!step.batchAdded">{{ step.count }}</span>
              
              <!-- 场景二：这帧有增加，触发新老数字交替与徽章生命周期 -->
              <template v-else>
                <span class="old-count">{{ step.prevCount }}</span>
                <span class="new-count">{{ step.count }}</span>
                <span class="plus-badge">+{{ step.batchAdded }}</span>
              </template>
              
            </div>
          </div>
        </div>

        <div class="divider">
          <div class="arrow-down">↓ 物理数组与指针状态 ↓</div>
        </div>

        <!-- 数组展现区 -->
        <div class="array-wrapper">
          <div class="array-container">
            <template v-for="(item, idx) in step.array" :key="idx">
              <div class="array-group">
                <!-- 区间高亮连线特效（用于批量统计展示） -->
                <div class="range-highlight" v-if="step.validRange && idx >= step.validRange[0] && idx <= step.validRange[1]">
                  候选 a
                </div>

                <!-- 数组节点 -->
                <div 
                  class="array-box"
                  :class="{
                    'is-fixed': step.fixedIdx === idx,
                    'is-left': step.leftIdx === idx,
                    'is-right': step.rightIdx === idx,
                    'is-processed': idx > step.fixedIdx && step.fixedIdx !== -1,
                    'is-in-range': step.validRange && idx >= step.validRange[0] && idx < step.validRange[1]
                  }"
                >
                  {{ item.val }}
                </div>
                
                <!-- 底部指针 -->
                <div class="pointers">
                  <span class="ptr fixed-ptr" v-if="step.fixedIdx === idx">c (定)</span>
                  <span class="ptr right-ptr" v-if="step.rightIdx === idx">b (R)</span>
                  <span class="ptr left-ptr" v-if="step.leftIdx === idx">a (L)</span>
                </div>
              </div>
            </template>
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
  // 解析并过滤输入
  let arr = inputRaw.split(',').map(n => parseInt(n.trim())).filter(n => !isNaN(n))
  if (arr.length < 3) {
    steps.value = []
    return
  }

  steps.value = []
  let passNum = 0
  let count = 0

  // 1. 数组预处理排序
  arr.sort((a, b) => a - b)
  const arrayObj = arr.map((val, idx) => ({ id: `p-${idx}`, val: Number(val) }))

  // 💡 核心修改 1：增加 prevCount 参数，记录变化前的总数
  const pushState = (desc, l, r, fixed, curCount, prevCount, added, range, mathText, successFlag) => {
    steps.value.push({
      array: JSON.parse(JSON.stringify(arrayObj)),
      leftIdx: l,
      rightIdx: r,
      fixedIdx: fixed,
      count: curCount,       // 新总数
      prevCount: prevCount,  // 旧总数（用于做动画过渡）
      batchAdded: added,
      validRange: range,
      mathStr: mathText,
      isSuccess: successFlag,
      description: desc,
      passId: passNum++
    })
  }

  pushState("【初始化】已将数组从小到大排序。因为要构成三角形，必须满足任意两边之和大于第三边。只要保证 a + b > c (且 a ≤ b ≤ c)，即可构成三角形。", 
    -1, -1, -1, count, count, 0, null, null, null)

  // ================= 完美复刻 Java 逻辑 =================
  for (let beginIndex = arr.length - 1; beginIndex >= 2; beginIndex--) {
    let c = arr[beginIndex]
    pushState(`【锁定最长边 c】将索引 ${beginIndex} (值为 ${c}) 作为三角形的最长边。接下来在此元素左侧寻找两短边 a 和 b。`, 
      -1, -1, beginIndex, count, count, 0, null, `最长边 c = ${c}`, null)

    let left = 0
    let right = beginIndex - 1

    while (left < right) {
      let a = arr[left]
      let b = arr[right]
      let sum = a + b

      if (sum > c) {
        // 💡 核心修改 2：在相加前记录 prevCount，把两者同时传入
        let added = right - left
        let prevCount = count
        count += added
        let mathText = `${a} + ${b} > ${c}  (✅ 成立)`
        pushState(`【批量统计】${mathText}！因为数组有序，在 [${left}, ${right}] 区间内，任何以 ${b} 为中边 (b) 的组合都合法。直接批量计入 ${added} 个结果！`, 
          left, right, beginIndex, count, prevCount, added, [left, right], mathText, true)
        
        right--
        
        if (left < right) {
          pushState(`【指针移动】右指针左移 (right--)，尝试寻找以较小值作为中边 (b) 的新组合。`, 
            left, right, beginIndex, count, count, 0, null, null, null)
        }
      } else {
        let mathText = `${a} + ${b} <= ${c}  (❌ 不成立)`
        pushState(`【不足判定】${mathText}。当前的短边 a 太小了，导致两边之和无法超过最长边，必须增大短边。`, 
          left, right, beginIndex, count, count, 0, null, mathText, false)
        
        left++
        
        if (left < right) {
          pushState(`【指针移动】左指针右移 (left++)，尝试寻找更大的短边 (a)。`, 
            left, right, beginIndex, count, count, 0, null, null, null)
        }
      }
    }
  }

  pushState(`🎉 算法结束！所有的三元组可能性已遍历完毕，共找到 ${count} 个有效三角形。`, 
    -1, -1, -1, count, count, 0, null, `最终计算完毕`, null)
}
</script>

<style scoped>
.triangle-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  width: 100%;
  padding: 10px 0;
  gap: 20px;
}

/* ================= 仪表盘 ================= */
.dashboard {
  display: flex;
  gap: 20px;
  width: 100%;
  justify-content: center;
  flex-wrap: wrap;
}

.math-board, .count-board {
  display: flex;
  flex-direction: column;
  align-items: center;
  background-color: var(--vp-c-bg-elv);
  border: 1px solid var(--vp-c-border);
  padding: 12px 24px;
  border-radius: 8px;
  min-width: 280px;
}

.label {
  font-size: 13px;
  color: var(--vp-c-text-2);
  margin-bottom: 8px;
}

/* 【修改后】全新的柔和算式推演区 */
.expr-wrapper {
  display: flex;
  align-items: center;
  height: 44px; /* 锁定高度，杜绝重排跳动 */
}

.expr-pill {
  font-family: monospace;
  font-size: 18px;
  font-weight: bold;
  padding: 6px 24px;
  border-radius: 30px; /* 柔和的胶囊形状 */
  border: 1px solid transparent;
  white-space: pre; /* 保持 Java 逻辑中 mathStr 的空格间距 */
  
  /* 核心：0.5s 的贝塞尔曲线极其平滑，消灭红绿切换时的生硬突变感 */
  transition: all 0.5s cubic-bezier(0.4, 0, 0.2, 1); 
}

.empty-text {
  font-size: 14px;
  font-weight: normal;
  color: var(--vp-c-text-3);
}

/* 状态 1：探针刚就绪，等待判定（中性灰） */
.expr-pill.is-pending {
  background: var(--vp-c-bg-soft);
  color: var(--vp-c-text-2);
}

/* 状态 2：判定成立（微泛绿光，去除了刺眼的实心背景） */
.expr-pill.is-valid {
  background: rgba(16, 185, 129, 0.08);
  color: #10b981;
  border-color: rgba(16, 185, 129, 0.2);
  box-shadow: 0 4px 15px rgba(16, 185, 129, 0.1);
}

/* 状态 3：判定失败（微泛红光，去除了刺眼的实心背景） */
.expr-pill.is-invalid {
  background: rgba(239, 68, 68, 0.08);
  color: #ef4444;
  border-color: rgba(239, 68, 68, 0.2);
  box-shadow: 0 4px 15px rgba(239, 68, 68, 0.1);
}


/* ================== 数字更新的时间轴剧场动画 ================== */
.count-value-container {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 28px;
  font-weight: 900;
  color: #3b82f6;
  height: 36px;
  min-width: 40px;
}

.static-count {
  position: absolute;
}

/* 旧数字：停留 0.8s，然后向上滑动变淡消失 */
.old-count {
  position: absolute;
  animation: countSlideOut 0.5s cubic-bezier(0.4, 0, 0.2, 1) 0.8s forwards;
}

/* 新数字：一开始透明不可见，0.8s 时刻从下方滑动出现 */
.new-count {
  display: inline-block;
  opacity: 0;
  animation: countSlideIn 0.5s cubic-bezier(0.4, 0, 0.2, 1) 0.8s forwards;
}

/* 徽章生命周期：弹出 -> 驻留 -> 向下消失 */
.plus-badge {
  position: absolute;
  right: -40px;
  top: -10px;
  font-size: 16px;
  color: #10b981;
  background: rgba(16, 185, 129, 0.2);
  padding: 2px 6px;
  border-radius: 4px;
  pointer-events: none;
  /* 动画总长度 2.5s，完成后完全隐藏且不占用空间 */
  animation: badgeLifecycle 2.5s cubic-bezier(0.4, 0, 0.2, 1) forwards;
}

/* 数字切换的关键帧 */
@keyframes countSlideOut {
  0% { opacity: 1; transform: translateY(0); }
  100% { opacity: 0; transform: translateY(-20px); }
}

@keyframes countSlideIn {
  0% { opacity: 0; transform: translateY(20px); }
  100% { opacity: 1; transform: translateY(0); }
}

/* 徽章一生的关键帧：0% 出现 -> 15% 稳住 -> 70% 开始衰退 -> 100% 隐藏 */
@keyframes badgeLifecycle {
  0% { opacity: 0; transform: translateY(10px) scale(0.8); }
  10% { opacity: 1; transform: translateY(0) scale(1.1); }
  15% { opacity: 1; transform: translateY(-5px) scale(1); }
  70% { opacity: 1; transform: translateY(-5px) scale(1); }
  100% { opacity: 0; transform: translateY(-20px) scale(0.8); visibility: hidden; }
}


@keyframes floatUp {
  0% { opacity: 0; transform: translateY(10px) scale(0.8); }
  50% { opacity: 1; transform: translateY(0) scale(1.1); }
  100% { opacity: 1; transform: translateY(-5px) scale(1); }
}

.divider { display: flex; font-size: 14px; font-weight: bold; color: var(--vp-c-text-3); opacity: 0.8; }

/* ================= 数组显示区 ================= */
.array-wrapper {
  width: 100%;
  overflow-x: auto;
  background-color: var(--vp-c-bg-soft);
  border-radius: 12px;
  border: 1px solid var(--vp-c-border);
  padding: 50px 20px 30px 20px;
  display: flex;
  justify-content: center;
}

.array-container {
  display: flex;
  gap: 12px;
  position: relative;
}

.array-group {
  display: flex;
  flex-direction: column;
  align-items: center;
  position: relative;
}

/* 核心：数组节点 */
.array-box {
  width: 50px;
  height: 50px;
  border: 2px solid var(--vp-c-border);
  border-radius: 8px;
  display: flex;
  justify-content: center;
  align-items: center;
  font-size: 20px;
  font-weight: bold;
  color: var(--vp-c-text-1);
  background: var(--vp-c-bg-elv);
  transition: all 0.3s;
  z-index: 2;
}

/* 状态样式 */
.is-fixed {
  border-color: #8b5cf6;
  background-color: rgba(139, 92, 246, 0.15);
  box-shadow: 0 0 12px rgba(139, 92, 246, 0.4);
  color: #8b5cf6;
  transform: scale(1.05);
}

.is-left {
  border-color: #3b82f6;
  background-color: rgba(59, 130, 246, 0.15);
  box-shadow: 0 0 12px rgba(59, 130, 246, 0.4);
  color: #3b82f6;
}

.is-right {
  border-color: #ec4899;
  background-color: rgba(236, 72, 153, 0.15);
  box-shadow: 0 0 12px rgba(236, 72, 153, 0.4);
  color: #ec4899;
}

/* 被批量计数的区间 (除 right 以外的候选 a) */
.is-in-range {
  border-style: dashed;
  border-color: #10b981;
  background-color: rgba(16, 185, 129, 0.1);
}

/* 已处理的废弃节点（在 fixed 右侧） */
.is-processed {
  opacity: 0.3;
  background-color: var(--vp-c-bg-mute);
  border-color: var(--vp-c-divider);
}

/* ================= 批量区间顶盖指示 ================= */
.range-highlight {
  position: absolute;
  top: -30px;
  width: 100%;
  height: 20px;
  background: #10b981;
  color: white;
  font-size: 12px;
  font-weight: bold;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 4px;
  z-index: 1;
}

/* 连贯的顶盖样式（使之看起来像是一个整体罩子） */
.is-in-range ~ .range-highlight { border-radius: 0; }
.array-group:first-child .range-highlight { border-top-left-radius: 4px; border-bottom-left-radius: 4px; }
.array-group:last-child .range-highlight { border-top-right-radius: 4px; border-bottom-right-radius: 4px; }

/* ================= 底部指针 ================= */
.pointers {
  margin-top: 10px;
  height: 24px;
  display: flex;
  align-items: center;
}

.ptr {
  font-size: 11px;
  padding: 3px 6px;
  border-radius: 4px;
  font-weight: bold;
  color: white;
}

.fixed-ptr { background: #8b5cf6; }
.left-ptr { background: #3b82f6; }
.right-ptr { background: #ec4899; }
</style>