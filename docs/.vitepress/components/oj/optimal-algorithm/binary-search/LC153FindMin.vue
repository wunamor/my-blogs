<template>
  <VisualizerLayout
    title="寻找旋转排序数组中的最小值 (LeetCode 153) - 断崖二分"
    storageKey="lc153-find-min-config"
    defaultData="4, 5, 6, 7, 0, 1, 2"
    :defaultInterval="1200"
    :actionButtons="visualizerButtons"
    :steps="steps"
    @calculate="calculateSteps"
  >
    <template #visualization="{ step }">
      <div class="binary-search-container" v-if="step && step.array">
        
        <!-- 顶部：极致简约面板 -->
        <div class="dashboard-minimal">
          <div class="stat-box target-box">
            <span class="label">基准锚点 (nums[0])</span>
            <div class="value">{{ step.anchorVal !== undefined ? step.anchorVal : '?' }}</div>
          </div>
        </div>

        <div class="divider">
          <span class="arrow-down">↓ 动态折叠：利用 nums[0] 作为判定锚点，定位右侧低区的起始位置 ↓</span>
        </div>

        <!-- 数组主视图 (紧凑模式) -->
        <div class="array-wrapper">
          <div class="array-track">

            <!-- 🌟 区间包裹框 -->
            <div 
              class="window-frame-minimal" 
              :class="{
                'is-valid-frame': step.status === 'done' || step.status === 'found-sorted',
                'is-hidden': step.leftIdx > step.rightIdx || step.leftIdx === -1 || step.status.startsWith('check-')
              }"
              :style="getWindowStyle(step)"
            >
              <div class="window-label" v-if="step.leftIdx <= step.rightIdx && step.leftIdx !== -1 && !step.status.startsWith('check-')">
                剩余空间: {{ step.rightIdx - step.leftIdx + 1 }}
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
                  'is-anchor': idx === 0,
                  'is-in-window': idx >= step.leftIdx && idx <= step.rightIdx && !step.status.startsWith('check-'),
                  'is-discarded': (idx < step.leftIdx || idx > step.rightIdx) && !step.status.startsWith('check-') && step.leftIdx !== -1,
                  'is-mid': idx === step.midIdx && step.status !== 'done' && step.status !== 'found-sorted',
                  'is-match': idx === step.resultIdx && (step.status === 'done' || step.status === 'found-sorted'),
                  'is-mismatch': idx === step.midIdx && step.status.startsWith('search-'),
                  'is-checking': step.status.startsWith('check-') && step.checkRange && step.checkRange.includes(idx)
                }"
              >
                {{ item.val }}
              </div>
              
              <!-- 底部极简指针 -->
              <div class="pointer-track">
                <span class="idx">{{ idx }}</span>
                <div class="ptr-labels">
                  <span v-if="step.midIdx === idx && step.status !== 'done' && step.status !== 'found-sorted'" class="ptr ptr-mid">M</span>
                  <span v-if="step.leftIdx === idx && step.status !== 'done' && step.status !== 'found-sorted' && !step.status.startsWith('check-')" class="ptr ptr-left">L</span>
                  <span v-if="step.rightIdx === idx && step.status !== 'done' && step.status !== 'found-sorted' && !step.status.startsWith('check-')" class="ptr ptr-right">R</span>
                  <span v-if="(step.status === 'done' || step.status === 'found-sorted') && idx === step.resultIdx" class="ptr ptr-res">Min</span>
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

const getWindowStyle = (step) => {
  if (step.leftIdx > step.rightIdx || step.leftIdx === -1 || step.status.startsWith('check-')) return { width: '0px', opacity: 0 }
  const STRIDE = 36; 
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
  let arr = inputRaw.split(',').map(n => parseInt(n.trim())).filter(n => !isNaN(n));
  if (arr.length === 0) { steps.value = []; return; }

  steps.value = [];
  let passNum = 0;
  let n = arr.length;
  const arrayObj = arr.map((val, idx) => ({ id: `idx-${idx}`, val }));

  const pushState = (desc, l, r, m, mVal, resIdx, resVal, stat, checkRange = []) => {
    steps.value.push({
      array: JSON.parse(JSON.stringify(arrayObj)),
      n: n,
      anchorVal: arr[0], // nums[0] 作为判定基准
      leftIdx: l,
      rightIdx: r,
      midIdx: m,
      midVal: mVal,
      resultIdx: resIdx,
      result: resVal,
      status: stat, 
      checkRange: checkRange,
      description: desc,
      passId: passNum++ 
    });
  }

  // ================= 完美复刻 Java 逻辑 =================
  let left = 0, right = n - 1;

  // 1. 拦截排查
  pushState(`【单调性拦截】旋转排序数组如果旋转了 n 次，相当于没转。判定 nums[right] > nums[left]。`, left, right, -1, -Infinity, -1, -1, 'check-sorted', [left, right]);
  if (arr[right] > arr[left] || n === 1) {
    pushState(`【🎯 命中单调】nums[right] > nums[left]（或单元素）。数组整体单调递增，最左侧 nums[left] 即为最小值。`, left, right, -1, -Infinity, left, arr[left], 'found-sorted');
    return;
  }

  pushState(`【开启二分】存在断崖！使用左端点 nums[0] (${arr[0]}) 作为判定锚点（已标橙）。只要 mid 对应的值小于锚点，说明落在右侧低区；否则落在左侧高区。`, left, right, -1, -Infinity, -1, -1, 'pending');

  while (left < right) {
    let mid = left + Math.floor((right - left) / 2);
    let mVal = arr[mid];

    pushState(`【计算中点】mid = ${mid}，获取 nums[mid] = ${mVal}。准备与锚点 nums[0] = ${arr[0]} 进行比较。`, left, right, mid, mVal, -1, -1, 'calc-mid');

    if (mVal < arr[0]) {
      // 落在右侧低区间
      pushState(`【落在低区】nums[mid] (${mVal}) < nums[0] (${arr[0]})。说明 mid 已跌落至右侧平原。当前位置可能是最小值，保留自身并舍弃右半侧：right = mid。`, left, right, mid, mVal, -1, -1, 'search-left');
      right = mid;
    } else {
      // 落在左侧高区间，直接排除
      pushState(`【落在高区】nums[mid] (${mVal}) >= nums[0] (${arr[0]})。说明 mid 依然在左侧悬崖上方，最小值必然在断崖之后。舍弃自身及左侧：left = mid + 1。`, left, right, mid, mVal, -1, -1, 'search-right');
      left = mid + 1;
    }
  }

  pushState(`🏁 搜索完毕！区间收缩为单点 (L == R == ${left})，成功定位断崖底部的首个元素，即全局最小值 ${arr[left]}。`, left, right, -1, -Infinity, left, arr[left], 'done');
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
}

/* 锚点盒子 */
.stat-box { display: flex; flex-direction: column; align-items: center; justify-content: center; background-color: var(--vp-c-bg-elv); border: 1px solid var(--vp-c-border); padding: 10px 20px; border-radius: 8px; min-width: 140px; }
.stat-box.target-box { border-color: #f97316; background-color: rgba(249, 115, 22, 0.05); }
.stat-box .label { font-size: 12px; color: var(--vp-c-text-2); margin-bottom: 6px; font-weight: bold; }
.stat-box.target-box .value { color: #f97316; font-size: 24px; font-weight: 700; font-family: monospace; line-height: 1;}

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
  height: 44px;
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
.is-anchor {
  border-color: #f97316 !important;
  color: #f97316;
  border-width: 2px;
  background: rgba(249, 115, 22, 0.1) !important;
}

.is-in-window { border-color: transparent; } 
.is-discarded { opacity: 0.2; transform: scale(0.9); } 
.is-mid { border-color: #8b5cf6; border-width: 2px; box-shadow: 0 0 10px rgba(139, 92, 246, 0.2); transform: translateY(-4px); }

/* 判定异常的高亮 */
.is-mismatch { border-color: #ef4444; background: rgba(239, 68, 68, 0.1); color: #dc2626; } 
.is-match { border-color: #10b981; background: rgba(16, 185, 129, 0.15); color: #10b981; font-size: 18px; transform: scale(1.1); box-shadow: 0 4px 15px rgba(16, 185, 129, 0.2); }

/* 边界排查拦截特效 */
.is-checking {
  border-color: #8b5cf6;
  background: rgba(139, 92, 246, 0.15);
  color: #8b5cf6;
  transform: translateY(-2px);
}

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