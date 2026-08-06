<template>
  <VisualizerLayout
    title="最大连续1的个数 III (LeetCode 1004) - 滑动窗口"
    storageKey="lc1004-max-ones-config"
    defaultData="2 | 1, 1, 1, 0, 0, 0, 1, 1, 1, 1, 0"
    :defaultInterval="900"
    :actionButtons="visualizerButtons"
    :steps="steps"
    @calculate="calculateSteps"
  >
    <template #visualization="{ step }">
      <div class="sliding-window-container" v-if="step && step.array">
        
        <!-- 顶部：极简信息面板 -->
        <div class="dashboard-minimal">
          <div class="stat-box">
            <span class="label">可用翻转次数 (k)</span>
            <div class="value" :class="{ 'is-zero': step.k === 0 }">{{ step.k }}</div>
          </div>
          
          <div class="stat-box outline-box">
            <span class="label">当前窗口长度</span>
            <div class="value">{{ step.leftIdx <= step.rightIdx ? step.rightIdx - step.leftIdx : 0 }}</div>
          </div>

          <div class="stat-box highlight-box">
            <span class="label">历史最大长度 (ret)</span>
            <div class="value">{{ step.ret }}</div>
          </div>
        </div>

        <div class="divider">
          <span class="arrow-down">↓ 数组状态与滑动窗口 ↓</span>
        </div>

        <!-- 数组主视图 -->
        <div class="array-wrapper">
          <div class="array-track">
            
            <!-- 极简线框风格的滑动窗口 -->
            <div 
              class="window-frame-minimal" 
              :class="{
                'is-alert': step.status === 'alert' || step.status === 'shrinking',
                'is-hidden': step.leftIdx >= step.rightIdx
              }"
              :style="getWindowStyle(step)"
            ></div>

            <div 
              class="array-item-group" 
              v-for="(item, idx) in step.array" 
              :key="item.id"
            >
              <!-- 数组节点：简约样式 -->
              <div 
                class="array-box-minimal"
                :class="{
                  'is-in-window': idx >= step.leftIdx && idx < step.rightIdx,
                  'is-original-zero': item.val === 0,
                  'is-flipped-zero': item.val === 0 && idx >= step.leftIdx && idx < step.rightIdx,
                  'is-processed': idx < step.leftIdx
                }"
              >
                <!-- 如果是翻转的 0，显示为 1 但带提示 -->
                <span v-if="item.val === 0 && idx >= step.leftIdx && idx < step.rightIdx">
                  1<span class="flip-mark">*</span>
                </span>
                <span v-else>{{ item.val }}</span>
              </div>
              
              <!-- 底部极简指针 -->
              <div class="pointer-track">
                <span class="idx">{{ idx }}</span>
                <div class="ptr-labels">
                  <span v-if="step.leftIdx === idx" class="ptr ptr-left">L</span>
                  <span v-if="step.rightIdx === idx" class="ptr ptr-right">R</span>
                </div>
              </div>
            </div>
            
            <!-- 结尾边界虚拟框 -->
            <div class="array-item-group virtual-group" v-if="step.rightIdx === step.n">
               <div class="array-box-minimal virtual-box">End</div>
               <div class="pointer-track">
                 <span class="idx">{{ step.n }}</span>
                 <div class="ptr-labels"><span class="ptr ptr-right">R</span></div>
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

// 仅保留最基础的操作按钮
const visualizerButtons = [
  { id: 'prev', label: '上一步', icon: 'prev' },
  { id: 'play', label: '自动播放', labelPause: '暂停', icon: 'play', iconPause: 'pause' },
  { id: 'next', label: '下一步', icon: 'next' }
]

const steps = ref([])

// 继承内边距修复算法
const getWindowStyle = (step) => {
  if (step.leftIdx >= step.rightIdx) return { width: '0px', opacity: 0 }
  const STRIDE = 58; // 46(width) + 12(gap) - 相比之前稍微缩小了盒子尺寸以显精致
  const PADDING = 6;
  const leftPos = step.leftIdx * STRIDE - PADDING;
  const width = (step.rightIdx - step.leftIdx) * STRIDE - 12 + (PADDING * 2);
  return {
    left: `${leftPos}px`,
    width: `${width}px`,
    opacity: 1
  }
}

const calculateSteps = (inputRaw) => {
  // 解析输入，格式支持 "k | array"
  let maxK = 0
  let numStr = inputRaw
  if (inputRaw.includes('|')) {
    const parts = inputRaw.split('|')
    maxK = parseInt(parts[0].trim())
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
  const arrayObj = arr.map((val, idx) => ({ id: `idx-${idx}`, val }))

  const pushState = (desc, l, r, currentK, currentRet, stat) => {
    steps.value.push({
      n: n,
      array: JSON.parse(JSON.stringify(arrayObj)),
      leftIdx: l,
      rightIdx: r,
      k: currentK,
      ret: currentRet,
      status: stat, // 'pending', 'expanding', 'flipping', 'alert', 'shrinking', 'done'
      description: desc,
      passId: passNum++ 
    })
  }

  // ================= 完美复刻你的 Java 代码逻辑 =================
  let ret = 0;
  let left = 0;
  let right = 0;
  let k = maxK; // 剩余可翻转次数

  pushState(`【初始化】双指针起步：L=0, R=0。最多可将 0 翻转为 1 的次数 k = ${k}。`, left, right, k, ret, 'pending');

  while (right < n) {
    let rV = arr[right];
    
    if (rV === 0) {
      if (k === 0) {
        // 发现 k 耗尽，此时先结算 ret，然后开始移动 left 回收 k。
        // 注意：代码逻辑中此时 right 指针保持不动。
        let oldRet = ret;
        ret = Math.max(ret, right - left);
        let updateMsg = ret > oldRet ? `更新最大记录为 ${ret}。` : ``;
        pushState(`【遇到 0 但次数耗尽】R 指针遇到了 0，但当前 k=0 无法翻转。先结算当前窗口长度：${updateMsg}接下来只能收缩 L 指针，直到把一个之前翻转的 0 吐出去为止。`, left, right, k, ret, 'alert');
        
        while (arr[left] !== 0) {
          left++;
          pushState(`【收缩 L】移出的元素是 1，k 不变，继续收缩。`, left, right, k, ret, 'shrinking');
        }
        
        // 找到了 0，吐出它以回收 k
        left++;
        k++;
        pushState(`【回收完成】成功移出了一个原本为 0 的元素，回收 1 次翻转额度 (k=${k})！现在可以继续处理 R 指针的元素了。`, left, right, k, ret, 'pending');
        
      } else {
        // k 还有剩余，消耗一次翻转
        k--;
        pushState(`【翻转 0】R 指针遇到 0。消耗 1 次额度 (k=${k}) 将其翻转为 1，纳入窗口。`, left, right, k, ret, 'flipping');
        right++;
      }
    } else {
      // 遇到 1 直接纳入
      pushState(`【纳入 1】R 指针遇到 1，直接纳入窗口。`, left, right, k, ret, 'expanding');
      right++;
    }
  }

  // 结尾最后的判定
  ret = Math.max(ret, right - left);
  pushState(`🏁 遍历结束。最后一次结算窗口，最大连续 1 的个数为 ${ret}。`, left, right, k, ret, 'done');
}
</script>

<style scoped>
.sliding-window-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  width: 100%;
  padding: 10px 0;
  gap: 24px;
}

/* ================= 极简信息面板 ================= */
.dashboard-minimal {
  display: flex;
  gap: 20px;
  width: 100%;
  justify-content: center;
  flex-wrap: wrap;
}

.stat-box {
  display: flex;
  flex-direction: column;
  align-items: center;
  background-color: var(--vp-c-bg-elv);
  border: 1px solid var(--vp-c-border);
  padding: 12px 24px;
  border-radius: 8px;
  min-width: 140px;
}

.stat-box.outline-box {
  border-style: dashed;
  background-color: transparent;
}

.stat-box.highlight-box {
  border-color: #3b82f6;
  background-color: rgba(59, 130, 246, 0.05);
}

.stat-box .label {
  font-size: 12px;
  color: var(--vp-c-text-2);
  margin-bottom: 8px;
}

.stat-box .value {
  font-size: 28px;
  font-family: monospace;
  font-weight: 700;
  color: var(--vp-c-text-1);
  line-height: 1;
  transition: color 0.3s;
}

.stat-box .value.is-zero {
  color: #ef4444; /* k=0 时给出克制的警示色 */
}
.stat-box.highlight-box .value {
  color: #3b82f6;
}

.divider {
  display: flex;
  justify-content: center;
  width: 100%;
}
.arrow-down {
  font-size: 13px;
  color: var(--vp-c-text-3);
}

/* ================= 数组与滑动窗口 (轻量化设计) ================= */
.array-wrapper {
  width: 100%;
  overflow-x: auto;
  /* overflow-y: hidden; */
  background-color: transparent; /* 去除深色背景块 */
  padding: 40px 20px 50px 20px;
  display: flex;
  justify-content: center;
}

.array-track {
  display: flex;
  gap: 12px;
  position: relative; 
  padding-top: 10px; 
}

/* 极简线框滑动窗口 */
.window-frame-minimal {
  position: absolute;
  top: 4px;
  height: 60px; /* 紧凑贴合盒子 */
  background: rgba(148, 163, 184, 0.1);
  border: 1.5px solid #94a3b8; /* 克制的灰蓝色边框 */
  border-radius: 6px;
  z-index: 1;
  pointer-events: none;
  transition: all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
}

/* 阻塞警告状态 */
.window-frame-minimal.is-alert {
  border-color: #f87171;
  border-style: dashed;
  background: rgba(248, 113, 113, 0.05);
}

/* 数组节点：缩小体积、清爽配色 */
.array-item-group {
  display: flex;
  flex-direction: column;
  align-items: center;
  position: relative;
  width: 46px; /* 相比之前缩窄，更显轻量 */
  z-index: 2; 
}

.array-box-minimal {
  width: 100%;
  height: 46px;
  border: 1px solid var(--vp-c-border); /* 细边框 */
  border-radius: 6px;
  display: flex;
  justify-content: center;
  align-items: center;
  font-size: 16px;
  font-family: monospace;
  font-weight: 600;
  color: var(--vp-c-text-1);
  background: var(--vp-c-bg-elv);
  transition: all 0.3s;
}

/* 原生的 0：弱化视觉 */
.is-original-zero {
  color: var(--vp-c-text-3);
  background: transparent;
  border-style: dotted;
}

/* 窗口内的元素：取消粗暴的高亮，仅依赖外层边框包裹 */
.is-in-window {
  border-color: transparent;
}

/* 被翻转的 0：克制地标记为淡蓝色 */
.is-flipped-zero {
  background: #e0f2fe; /* 非常浅的蓝色 */
  color: #0284c7; /* 中等深度的蓝色文字 */
  border-color: transparent;
}

/* 暗色模式下微调翻转颜色 */
.dark .is-flipped-zero {
  background: rgba(14, 165, 233, 0.15);
  color: #38bdf8;
}

.flip-mark {
  font-size: 10px;
  vertical-align: super;
  margin-left: 2px;
}

/* 已被弹出的废弃节点 */
.is-processed {
  opacity: 0.3;
}

.virtual-group { opacity: 0.5; }
.virtual-box { border-style: dashed; color: var(--vp-c-text-3); font-size: 12px;}

/* ================= 底部极简指针 ================= */
.pointer-track {
  margin-top: 6px;
  display: flex;
  flex-direction: column;
  align-items: center;
  height: 36px;
}

.idx { font-size: 11px; color: var(--vp-c-text-3); margin-bottom: 4px; }

.ptr-labels {
  display: flex;
  flex-direction: column;
  gap: 2px;
  align-items: center;
}

/* 指针去掉了过度鲜艳的色块，改为轻巧的小标 */
.ptr {
  font-size: 10px;
  padding: 1px 4px;
  border-radius: 3px;
  font-weight: 600;
}
.ptr-left { color: #64748b; background: var(--vp-c-bg-soft); border: 1px solid #cbd5e1; }
.ptr-right { color: #0284c7; background: #e0f2fe; border: 1px solid #bae6fd; }

.dark .ptr-left { border-color: #334155; }
.dark .ptr-right { border-color: #0c4a6e; }
</style>