<template>
  <VisualizerLayout
    title="长度最小的子数组 (LeetCode 209) - 滑动窗口"
    storageKey="lc209-min-subarray-len-config"
    defaultData="7 | 2, 3, 1, 2, 4, 3"
    :defaultInterval="900"
    :actionButtons="visualizerButtons"
    :steps="steps"
    @calculate="calculateSteps"
  >
    <template #visualization="{ step }">
      <div class="sliding-window-container" v-if="step && step.array">
        
        <!-- 顶部信息控制台 -->
        <div class="dashboard">
          
          <!-- 左侧：窗口状态监控板 -->
          <div class="monitor-board">
            <div class="board-header">
              <span class="label">当前窗口总和监控：</span>
              <span class="target-badge">Target = {{ step.target }}</span>
            </div>
            
            <div class="expr-wrapper">
              <div 
                class="expr-pill" 
                :class="{
                  'is-pending': step.status === 'pending',
                  'is-expanding': step.status === 'expanding',
                  'is-valid': step.status === 'valid'
                }"
              >
                <span class="label-text">Sum = </span>
                <span class="sum-result">{{ step.sum }}</span>
                <span class="sign">{{ step.sum >= step.target ? '≥' : '<' }}</span>
                <span class="target-val">{{ step.target }}</span>

                <!-- 结果文本带淡入动画 -->
                <span class="result-text expanding-text" v-if="step.status === 'expanding'">➜ 不足，右侧扩张 (R++)</span>
                <span class="result-text success-text" v-if="step.status === 'valid'">✅ 达标，左侧收缩 (L++)</span>
                <span class="result-text done-text" v-if="step.status === 'done'">🏁 遍历结束</span>
              </div>
            </div>
          </div>

          <!-- 右侧：最小长度记录器 -->
          <div class="result-board">
            <span class="label">最小达标长度 (Min Length)：</span>
            <!-- 利用之前广受好评的时间轴动画组件记录数字变更 -->
            <div class="count-value-container" :key="'ret-' + step.passId">
              <span class="static-count" v-if="step.ret === step.prevRet">
                {{ step.ret === step.n + 1 ? '∞' : step.ret }}
              </span>
              <template v-else>
                <span class="old-count">{{ step.prevRet === step.n + 1 ? '∞' : step.prevRet }}</span>
                <span class="new-count">{{ step.ret }}</span>
                <span class="update-badge">更新!</span>
              </template>
            </div>
          </div>
        </div>

        <div class="divider">
          <div class="arrow-down">↓ 物理数组与滑动窗口状态 ↓</div>
        </div>

        <!-- 数组主视图 -->
        <div class="array-wrapper">
          <div class="array-track">
            
            <!-- 🌟 核心视觉：绝对定位的弹性滑动窗口框 -->
            <div 
              class="window-frame" 
              :class="{
                'is-valid-frame': step.sum >= step.target && step.leftIdx < step.rightIdx,
                'is-hidden': step.leftIdx === step.rightIdx
              }"
              :style="getWindowStyle(step)"
            >
              <div class="window-label" v-if="step.leftIdx < step.rightIdx">
                窗口长度: {{ step.rightIdx - step.leftIdx }}
              </div>
            </div>

            <div 
              class="array-item-group" 
              v-for="(item, idx) in step.array" 
              :key="item.id"
            >
              <!-- 数组节点 -->
              <div 
                class="array-box"
                :class="{
                  'is-in-window': idx >= step.leftIdx && idx < step.rightIdx,
                  'is-left-ptr': step.leftIdx === idx,
                  'is-right-ptr': step.rightIdx === idx,
                  'is-processed': idx < step.leftIdx
                }"
              >
                {{ item.val }}
              </div>
              
              <!-- 底部标签与指针 -->
              <div class="pointer-track">
                <span class="idx">{{ idx }}</span>
                <div class="ptr-labels">
                  <span v-if="step.leftIdx === idx" class="ptr ptr-left">L (出)</span>
                  <span v-if="step.rightIdx === idx" class="ptr ptr-right">R (入)</span>
                </div>
              </div>
            </div>
            
            <!-- 为了展示 right 指针越界 (right == n) 时的虚拟位置 -->
            <div class="array-item-group virtual-group" v-if="step.rightIdx === step.n">
               <div class="array-box virtual-box">End</div>
               <div class="pointer-track">
                 <span class="idx">{{ step.n }}</span>
                 <div class="ptr-labels">
                   <span class="ptr ptr-right">R</span>
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

// 计算弹性窗口框的物理样式
// 设定：每个盒子 50px 宽，gap 12px。每走一步跨度为 62px。
const getWindowStyle = (step) => {
  if (step.leftIdx >= step.rightIdx) {
    return { width: '0px', opacity: 0 } // 窗口为空时隐藏
  }
  const STRIDE = 62; // 50(width) + 12(gap)
  
  // 💡 核心修复：给窗口左右各增加 8px 的内边距（Padding），防止边框被内部方块遮挡
  const PADDING = 8;
  const leftPos = step.leftIdx * STRIDE - PADDING;
  // 基础宽度 = (元素数量 * 步长) - 末尾多余的间距(12)。再加上两侧的 PADDING
  const width = (step.rightIdx - step.leftIdx) * STRIDE - 12 + (PADDING * 2);
  
  return {
    left: `${leftPos}px`,
    width: `${width}px`,
    opacity: 1
  }
}

const calculateSteps = (inputRaw) => {
  // 解析输入，支持 "target | array" 格式
  let target = 0
  let numStr = inputRaw
  if (inputRaw.includes('|')) {
    const parts = inputRaw.split('|')
    target = parseInt(parts[0].trim())
    numStr = parts[1]
  }

  let arr = numStr.split(',').map(n => parseInt(n.trim())).filter(n => !isNaN(n))
  if (arr.length === 0) {
    steps.value = []
    return
  }

  steps.value = []
  let passNum = 0
  let n = arr.length
  const arrayObj = arr.map((val, idx) => ({ id: `w-${idx}`, val }))

  const pushState = (desc, l, r, curSum, currentRet, previousRet, stat) => {
    steps.value.push({
      target: target,
      n: n,
      array: JSON.parse(JSON.stringify(arrayObj)),
      leftIdx: l,
      rightIdx: r,
      sum: curSum,
      ret: currentRet,
      prevRet: previousRet,
      status: stat, // 'pending', 'expanding', 'valid', 'done'
      description: desc,
      passId: passNum++
    })
  }

  // ================= 完美复刻你的 Java 滑动窗口逻辑 =================
  let ret = n + 1
  let left = 0
  let right = 0
  let sum = 0

  pushState(`【初始化】双指针起步：left = 0, right = 0。窗口区间为 [left, right)，初始为空，总和为 0。设定无穷大哨兵 ret = ${n + 1}。`, left, right, sum, ret, ret, 'pending')

  while (right < n) {
    if (sum < target) {
      // 动作判定：当前窗口总和不达标，需要扩张
      pushState(`【判定扩张】当前窗口总和 ${sum} < Target(${target})。不满足条件，需要主动向右扩张寻找解。准备将 nums[${right}] (${arr[right]}) 吞入窗口。`, left, right, sum, ret, ret, 'expanding')
      
      // 执行累加和右移
      sum += arr[right]
      right++
      
      // 为了视觉连贯，可以在扩张后推一帧空状态
      // pushState(`【完成扩张】右指针已移动，当前窗口 [${left}, ${right})，总和更新为 ${sum}。`, left, right, sum, ret, ret, 'pending')
    } else {
      // 动作判定：总和达标，记录最优解，并尝试压缩窗口
      let len = right - left
      let prevRet = ret
      let updateMsg = ""
      if (len < ret) {
        ret = len
        updateMsg = ` 🎉 发现更优解！更新最小长度为 ${ret}。`
      } else {
        updateMsg = ` 当前长度 ${len} 并未优于历史最优解 ${ret}。`
      }
      
      pushState(`【达标收缩】当前总和 ${sum} ≥ Target(${target})！满足条件。${updateMsg} 接下来收缩左边界以寻找更短的可能，准备移除 nums[${left}] (${arr[left]})。`, left, right, sum, ret, prevRet, 'valid')
      
      // 执行削减和左移
      sum -= arr[left]
      left++
    }
  }

  // 右侧触底后，如果最后收录的数让 sum 依然满足 target，需要继续收缩
  while (sum >= target) {
    let len = right - left
    let prevRet = ret
    let updateMsg = ""
    if (len < ret) {
      ret = len
      updateMsg = ` 🎉 发现更优解！更新最小长度为 ${ret}。`
    }
    pushState(`【末尾收缩】右边界已触底，但当前总和 ${sum} 依然 ≥ Target(${target})！${updateMsg} 继续收缩左侧压榨极限，移除 nums[${left}]。`, left, right, sum, ret, prevRet, 'valid')
    
    sum -= arr[left]
    left++
  }

  // 最终处理
  let finalPrevRet = ret
  if (ret === n + 1) {
    ret = 0
    pushState(`【结果修正】由于全过程未能找到任何满足条件的子数组，将无解标记 ${n + 1} 重置为 0。`, left, right, sum, ret, finalPrevRet, 'done')
  } else {
    pushState(`🏁 算法执行完毕！成功找到长度最小的连续子数组，最小长度为 ${ret}。`, left, right, sum, ret, ret, 'done')
  }
}
</script>

<style scoped>
.sliding-window-container {
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

.monitor-board, .result-board {
  display: flex;
  flex-direction: column;
  background-color: var(--vp-c-bg-elv);
  border: 1px solid var(--vp-c-border);
  padding: 16px 20px;
  border-radius: 12px;
  min-width: 300px;
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
  gap: 10px;
  padding: 6px 20px;
  border-radius: 30px;
  font-family: monospace;
  font-size: 20px;
  font-weight: 900;
  border: 1px solid transparent;
  transition: all 0.5s cubic-bezier(0.4, 0, 0.2, 1);
}

.label-text { font-size: 14px; font-weight: normal; color: var(--vp-c-text-3); font-family: var(--vp-font-family-base); }
.target-val { color: var(--vp-c-text-1); }
.sign { color: var(--vp-c-text-3); font-weight: normal; }

/* 状态判定泛光 */
.is-pending { background: var(--vp-c-bg-soft); color: var(--vp-c-text-1); border-color: var(--vp-c-border); }

/* 扩张中：蓝色调 */
.is-expanding {
  background: rgba(59, 130, 246, 0.08);
  border-color: rgba(59, 130, 246, 0.3);
}
.is-expanding .sum-result { color: #3b82f6; }

/* 达标验证：绿色调 */
.is-valid {
  background: rgba(16, 185, 129, 0.08);
  border-color: rgba(16, 185, 129, 0.3);
  box-shadow: 0 4px 15px rgba(16, 185, 129, 0.15);
}
.is-valid .sum-result { color: #10b981; }
.is-valid .sign { color: #10b981; }

/* 尾部文字特效 */
.result-text {
  margin-left: 8px;
  font-size: 14px;
  font-family: var(--vp-font-family-base);
  animation: slideFadeIn 0.4s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
}
.expanding-text { color: #3b82f6; }
.success-text { color: #10b981; }
.done-text { color: var(--vp-c-text-2); }

@keyframes slideFadeIn { from { opacity: 0; transform: translateX(-15px); } to { opacity: 1; transform: translateX(0); } }

/* ================= 结果数字剧场版动画 ================= */
.result-board { align-items: center; justify-content: center; }

.count-value-container {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 32px;
  font-weight: 900;
  color: #8b5cf6;
  height: 40px;
  min-width: 60px;
  margin-top: 5px;
}

.static-count { position: absolute; }

.old-count {
  position: absolute;
  animation: countSlideOut 0.5s cubic-bezier(0.4, 0, 0.2, 1) 0.5s forwards;
}

.new-count {
  display: inline-block;
  opacity: 0;
  animation: countSlideIn 0.5s cubic-bezier(0.4, 0, 0.2, 1) 0.5s forwards;
}

.update-badge {
  position: absolute;
  right: -55px;
  top: -5px;
  font-size: 14px;
  color: white;
  background: #f59e0b;
  padding: 2px 6px;
  border-radius: 4px;
  pointer-events: none;
  animation: badgeLifecycle 2s cubic-bezier(0.4, 0, 0.2, 1) forwards;
}

@keyframes countSlideOut { 0% { opacity: 1; transform: translateY(0); } 100% { opacity: 0; transform: translateY(-20px); } }
@keyframes countSlideIn { 0% { opacity: 0; transform: translateY(20px); } 100% { opacity: 1; transform: translateY(0); } }
@keyframes badgeLifecycle {
  0% { opacity: 0; transform: translateY(10px) scale(0.8); }
  10% { opacity: 1; transform: translateY(0) scale(1.1); }
  15% { opacity: 1; transform: translateY(-5px) scale(1); }
  70% { opacity: 1; transform: translateY(-5px) scale(1); }
  100% { opacity: 0; transform: translateY(-20px) scale(0.8); visibility: hidden; }
}

.divider { display: flex; font-size: 14px; font-weight: bold; color: var(--vp-c-text-3); opacity: 0.8; margin-top: 5px; }

/* ================= 数组与弹性窗口 ================= */
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

.array-track {
  display: flex;
  gap: 12px;
  position: relative; /* 核心：让子元素绝对定位基于此容器 */
  padding-top: 10px; 
}

/* 🌟 核心特效：弹性滑动窗口框 */
.window-frame {
  position: absolute;
  top: 0;
  height: 70px; /* 覆盖在盒子上方 */
  background: rgba(59, 130, 246, 0.12);
  border: 2px solid #3b82f6;
  border-radius: 10px;
  z-index: 1;
  pointer-events: none;
  /* 非常平滑的物理弹簧过渡特效，使得框的伸缩充满生命力 */
  transition: all 0.5s cubic-bezier(0.34, 1.56, 0.64, 1);
}
.window-frame.is-valid-frame {
  background: rgba(16, 185, 129, 0.15);
  border-color: #10b981;
  box-shadow: 0 0 15px rgba(16, 185, 129, 0.3);
}

.window-label {
  position: absolute;
  top: -24px;
  left: 50%;
  transform: translateX(-50%);
  background: inherit;
  color: inherit;
  padding: 2px 8px;
  border-radius: 4px;
  font-size: 12px;
  font-weight: bold;
  white-space: nowrap;
}

/* 数组节点 */
.array-item-group {
  display: flex;
  flex-direction: column;
  align-items: center;
  position: relative;
  width: 50px;
  z-index: 2; /* 浮于背景框之上 */
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
}

/* 窗口内的元素提升亮度 */
.is-in-window {
  border-color: transparent; /* 边框由背后的 frame 提供了，这里使其透明融入背景 */
  background: var(--vp-c-bg-elv);
}

/* 彻底被排出的废弃节点降噪 */
.is-processed {
  opacity: 0.25;
}

.virtual-group { opacity: 0.5; }
.virtual-box { border-style: dashed; color: var(--vp-c-text-3); font-size: 14px;}

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
.ptr-left { background: #3b82f6; }
.ptr-right { background: #ec4899; }
</style>