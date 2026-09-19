<template>
  <VisualizerLayout
    title="搜索插入位置 (LeetCode 35) - 寻找边界"
    storageKey="lc35-search-insert-config"
    defaultData="5 | 1, 3, 5, 6"
    :defaultInterval="1200"
    :actionButtons="visualizerButtons"
    :steps="steps"
    @calculate="calculateSteps"
  >
    <template #visualization="{ step }">
      <div class="binary-search-container" v-if="step && step.array">
        
        <!-- 顶部：极简搜索状态面板 -->
        <div class="dashboard-minimal">
          
          <div class="stat-box target-box">
            <span class="label">寻找目标 (Target)</span>
            <div class="value">{{ step.target }}</div>
          </div>

          <!-- 区间状态监控 -->
          <div class="hash-compare-panel">
            <div class="panel-header">
              <span class="label">当前搜索区间: [Left, Right]</span>
              <span class="status-badge" 
                :class="{
                  'is-success': step.status === 'found' || step.status === 'found-end' || step.status === 'done',
                  'is-pending': step.status !== 'found' && step.status !== 'found-end' && step.status !== 'done'
                }">
                {{ getStatusText(step.status) }}
              </span>
            </div>
            
            <div class="pointers-info">
              <div class="ptr-info-item">
                <span class="ptr-badge bg-left">L</span> 
                <span class="val">{{ step.leftIdx === -1 ? '?' : step.leftIdx }}</span>
              </div>
              <div class="ptr-info-item" :class="{'is-highlight-mid': step.status === 'calc-mid'}">
                <span class="ptr-badge bg-mid">M</span> 
                <span class="val">
                  {{ step.midIdx === -1 ? '?' : step.midIdx }} 
                  <!-- 💡 核心细节展示：向下取整 -->
                  <span class="calc-hint" v-if="step.status === 'calc-mid'">(向下取整 ⬇)</span>
                </span>
              </div>
              <div class="ptr-info-item">
                <span class="ptr-badge bg-right">R</span> 
                <span class="val">{{ step.rightIdx === -1 ? '?' : step.rightIdx }}</span>
              </div>
            </div>
          </div>

          <div class="stat-box highlight-box" :class="{'is-success': step.status === 'found' || step.status === 'found-end' || step.status === 'done'}">
            <span class="label">插入索引 (Result)</span>
            <div class="value">{{ step.result === -1 ? '?' : step.result }}</div>
          </div>
        </div>

        <div class="divider">
          <span class="arrow-down">↓ 二分折叠：动态线框包裹着当前有效的 [left, right] 搜索空间 ↓</span>
        </div>

        <!-- 数组主视图 (紧凑模式) -->
        <div class="array-wrapper">
          <div class="array-track">

            <!-- 🌟 核心视觉：将滑动窗口的框用来包裹二分查找的区间 -->
            <div 
              class="window-frame-minimal" 
              :class="{
                'is-valid-frame': step.status === 'found' || step.status === 'done' || step.status === 'found-end',
                'is-hidden': step.leftIdx > step.rightIdx || step.leftIdx === -1
              }"
              :style="getWindowStyle(step)"
            >
              <div class="window-label" v-if="step.leftIdx <= step.rightIdx && step.leftIdx !== -1">
                空间大小: {{ step.rightIdx - step.leftIdx + 1 }}
              </div>
            </div>

            <div 
              class="array-item-group" 
              v-for="(item, idx) in step.array" 
              :key="item.id"
            >
              <!-- 数组节点：简约样式 -->
              <div 
                class="array-box-minimal"
                :class="{
                  'is-virtual': item.isVirtual,
                  'is-in-window': idx >= step.leftIdx && idx <= step.rightIdx,
                  'is-discarded': (idx < step.leftIdx || idx > step.rightIdx) && !item.isVirtual && step.status !== 'found-end',
                  'is-mid': idx === step.midIdx && step.status !== 'found' && step.status !== 'done',
                  'is-match': (idx === step.midIdx && step.status === 'found') || (idx === step.result && (step.status === 'done' || step.status === 'found-end')),
                  'is-mismatch': idx === step.midIdx && step.status.startsWith('search-')
                }"
              >
                {{ item.isVirtual ? '+' : item.val }}
              </div>
              
              <!-- 底部极简指针 -->
              <div class="pointer-track">
                <span class="idx">{{ idx }}</span>
                <div class="ptr-labels">
                  <span v-if="step.midIdx === idx && step.status !== 'found' && step.status !== 'done' && step.status !== 'found-end'" class="ptr ptr-mid">M</span>
                  <span v-if="step.leftIdx === idx && step.status !== 'found' && step.status !== 'done' && step.status !== 'found-end'" class="ptr ptr-left">L</span>
                  <span v-if="step.rightIdx === idx && step.status !== 'found' && step.status !== 'done' && step.status !== 'found-end'" class="ptr ptr-right">R</span>
                  <!-- 结果标签 -->
                  <span v-if="(step.status === 'found' || step.status === 'done' || step.status === 'found-end') && idx === step.result" class="ptr ptr-res">Ans</span>
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
  { id: 'next', label: '下一步', icon: 'next' }
]

const steps = ref([])

const getStatusText = (status) => {
  const map = {
    'pending': '🔍 初始化区间',
    'calc-mid': '🧮 计算 Mid 中点',
    'search-left': '👈 抛弃右侧 (R=M)',
    'search-right': '👉 抛弃自身与左侧 (L=M+1)',
    'found': '🎯 完美命中，直接返回',
    'found-end': '🚀 拦截：插入末尾',
    'done': '🏁 循环结束，L 即为插入点'
  }
  return map[status] || '...'
}

// 🌟 为二分查找闭区间定制的框计算
const getWindowStyle = (step) => {
  if (step.leftIdx > step.rightIdx || step.leftIdx === -1) return { width: '0px', opacity: 0 }
  
  const STRIDE = 36; // 紧凑模式：宽28 + 间距8
  const PADDING = 4;
  const leftPos = step.leftIdx * STRIDE - PADDING;
  const count = step.rightIdx - step.leftIdx + 1;
  const width = count * STRIDE - 8 + (PADDING * 2);
  
  return {
    left: `${leftPos}px`,
    width: `${width}px`,
    opacity: 1
  }
}

const calculateSteps = (inputRaw) => {
  let target = 5;
  let numStr = inputRaw;
  if (inputRaw.includes('|')) {
    const parts = inputRaw.split('|');
    target = parseInt(parts[0].trim());
    numStr = parts[1].trim();
  }

  let arr = numStr.split(',').map(n => parseInt(n.trim())).filter(n => !isNaN(n));
  if (arr.length === 0) { steps.value = []; return; }

  steps.value = [];
  let passNum = 0;
  let n = arr.length;
  
  // 💡 视觉优化：加入虚拟的索引 n，用于展示可能插入数组最后的情形
  const arrayObj = arr.map((val, idx) => ({ id: `idx-${idx}`, val: val, isVirtual: false }));
  arrayObj.push({ id: `idx-virtual`, val: '+', isVirtual: true });

  const pushState = (desc, l, r, m, res, stat) => {
    steps.value.push({
      array: JSON.parse(JSON.stringify(arrayObj)),
      target: target,
      n: n,
      leftIdx: l,
      rightIdx: r,
      midIdx: m,
      result: res,
      status: stat, 
      description: desc,
      passId: passNum++ 
    });
  }

  // ================= 完美复刻 Java 逻辑 =================
  if (arr[n - 1] < target) {
    pushState(`【快速拦截】数组最后一个元素 nums[${n - 1}] (${arr[n - 1]}) < target (${target})。说明目标必须插在数组最末尾，直接返回长度 ${n}。`, -1, -1, -1, n, 'found-end');
    return;
  }

  let left = 0;
  let right = n - 1;

  pushState(`【初始化】目标 Target = ${target}。在闭区间 [0, ${n-1}] 中寻找首个 >= target 的位置。`, left, right, -1, -1, 'pending');

  while (left < right) {
    let mid = left + Math.floor((right - left) / 2);
    pushState(`【计算中点 (偏左)】mid = left + (right - left) / 2 = ${mid}。向下取整。`, left, right, mid, -1, 'calc-mid');

    let midVal = arr[mid];

    if (midVal < target) {
      pushState(`【逼近右侧】nums[mid] (${midVal}) < target (${target})。插入位置必然在 mid 严格右侧，抛弃自身与左侧，执行 left = mid + 1。`, left, right, mid, -1, 'search-right');
      left = mid + 1;
    } else if (midVal === target) {
      pushState(`【🎯 精确命中】nums[mid] == target！找到了目标值，无需再缩小区间，直接返回索引 ${mid}。`, left, right, mid, mid, 'found');
      return;
    } else {
      // midVal > target
      pushState(`【逼近左侧】nums[mid] (${midVal}) > target (${target})。插入位置可能是当前 mid 或其更左侧，保留自身并舍弃右半边，执行 right = mid。`, left, right, mid, -1, 'search-left');
      right = mid;
    }
  }

  pushState(`🏁 搜索完毕！区间收缩为单点 (L == R == ${left})，未提前命中相等值。该位置即为恰好大于 target 的首个位置，也就是最终的插入点。`, left, right, -1, left, 'done');
}
</script>

<style scoped>
.binary-search-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  width: 100%;
  padding: 10px 0;
  gap: 20px;
}

.dashboard-minimal {
  display: flex;
  gap: 16px;
  width: 100%;
  justify-content: center;
  flex-wrap: wrap;
}

/* 哈希对比看板 */
.hash-compare-panel {
  display: flex;
  flex-direction: column;
  background-color: var(--vp-c-bg-elv);
  border: 1px solid var(--vp-c-border);
  padding: 12px 20px;
  border-radius: 8px;
  min-width: 320px;
}
.panel-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
  padding-bottom: 8px;
  border-bottom: 1px dashed var(--vp-c-divider);
}
.panel-header .label { font-size: 13px; color: var(--vp-c-text-2); font-weight: bold; }

.pointers-info { display: flex; justify-content: space-around; margin-top: 5px; }
.ptr-info-item { display: flex; align-items: center; gap: 6px; font-family: monospace; font-size: 14px; color: var(--vp-c-text-1); font-weight: 600; transition: transform 0.2s; }
.ptr-info-item.is-highlight-mid { transform: scale(1.05); color: #8b5cf6; }

.ptr-badge { color: white; padding: 1px 6px; border-radius: 4px; font-size: 12px; }
.bg-left { background: #64748b; }
.bg-right { background: #0ea5e9; }
.bg-mid { background: #8b5cf6; }
.calc-hint { font-size: 11px; color: #8b5cf6; font-weight: normal; margin-left: 2px; }

.status-badge { font-size: 12px; font-weight: bold; padding: 2px 8px; border-radius: 4px; }
.status-badge.is-success { color: #10b981; background: rgba(16, 185, 129, 0.15); }
.status-badge.is-pending { color: #8b5cf6; background: rgba(139, 92, 246, 0.15); }

/* 统计盒子 UI */
.stat-box { display: flex; flex-direction: column; align-items: center; justify-content: center; background-color: var(--vp-c-bg-elv); border: 1px solid var(--vp-c-border); padding: 10px 20px; border-radius: 8px; min-width: 140px; }
.stat-box.target-box { border-color: #0ea5e9; background-color: rgba(14, 165, 233, 0.05); }
.stat-box.target-box .value { color: #0ea5e9; font-size: 24px;}
.stat-box.highlight-box { border-style: dashed; }
.stat-box.highlight-box.is-success { border-color: #10b981; background-color: rgba(16, 185, 129, 0.08); border-style: solid; }
.stat-box.highlight-box.is-success .value { color: #10b981; }
.stat-box .label { font-size: 12px; color: var(--vp-c-text-2); margin-bottom: 6px; font-weight: bold; }
.stat-box .value { font-size: 20px; font-weight: 700; color: var(--vp-c-text-1); line-height: 1; transition: color 0.3s; }

.divider { display: flex; justify-content: center; width: 100%; margin-top: 5px; }
.arrow-down { font-size: 13px; color: var(--vp-c-text-3); }

/* ================= 数组与视觉排版 (紧凑模式) ================= */
.array-wrapper {
  width: 100%;
  overflow-x: auto;
  overflow-y: hidden; 
  padding: 30px 20px 60px 20px; 
  background-color: transparent;
  display: flex;
  justify-content: center;
}

.array-track { display: flex; gap: 8px; position: relative; padding-top: 10px; }

/* 🌟 二分查找闭区间包裹框 */
.window-frame-minimal {
  position: absolute;
  top: 6px;
  height: 44px; /* 紧密包裹 36px 的盒子 */
  background: rgba(14, 165, 233, 0.05);
  border: 1.5px solid #38bdf8; 
  border-radius: 6px;
  z-index: 1;
  pointer-events: none;
  transition: all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
}

.window-frame-minimal.is-valid-frame {
  border-color: #10b981;
  background: rgba(16, 185, 129, 0.08);
}

.window-label {
  position: absolute;
  top: -24px;
  left: 50%;
  transform: translateX(-50%);
  color: var(--vp-c-text-2);
  font-size: 11px;
  font-weight: bold;
  white-space: nowrap;
  transition: opacity 0.3s;
}

.array-item-group { display: flex; flex-direction: column; align-items: center; position: relative; width: 28px; z-index: 2; }

.array-box-minimal {
  width: 100%;
  height: 36px;
  border: 1px solid var(--vp-c-border);
  border-radius: 4px;
  display: flex;
  justify-content: center;
  align-items: center;
  font-size: 14px;
  font-family: monospace;
  font-weight: 600;
  color: var(--vp-c-text-1);
  background: var(--vp-c-bg-elv);
  transition: all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
}

/* 视觉特效 */
.is-in-window { border-color: transparent; } /* 在区间内的元素去除独立边框 */
.is-discarded { opacity: 0.2; transform: scale(0.9); } /* 被排除的一半 */
.is-virtual { border-style: dashed; color: var(--vp-c-text-3); background: transparent; } /* 虚拟尾节点 */
.is-mid { border-color: #8b5cf6; border-width: 2px; box-shadow: 0 0 10px rgba(139, 92, 246, 0.2); transform: translateY(-4px); }
.is-mismatch { border-color: #ef4444; background: rgba(239, 68, 68, 0.1); color: #dc2626; } 
.is-match { border-color: #10b981; background: rgba(16, 185, 129, 0.15); color: #10b981; font-size: 18px; transform: scale(1.1); box-shadow: 0 4px 15px rgba(16, 185, 129, 0.2); }

/* 底部指针 */
.pointer-track { margin-top: 6px; display: flex; flex-direction: column; align-items: center; min-height: 55px; }
.idx { font-size: 10px; color: var(--vp-c-text-3); margin-bottom: 4px; }
.ptr-labels { display: flex; flex-direction: column; gap: 2px; align-items: center; }

.ptr { font-size: 9px; padding: 1px 4px; border-radius: 3px; font-weight: 600; color: white;}
.ptr-left { background: #64748b; }
.ptr-right { background: #0ea5e9; }
.ptr-mid { background: #8b5cf6; animation: popIn 0.3s ease-out forwards; }
.ptr-res { background: #10b981; }

@keyframes popIn {
  from { opacity: 0; transform: translateY(-10px); }
  to { opacity: 1; transform: translateY(0); }
}
</style>