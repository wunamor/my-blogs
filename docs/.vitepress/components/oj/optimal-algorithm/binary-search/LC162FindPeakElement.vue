<template>
  <VisualizerLayout
    title="寻找峰值 (LeetCode 162) - 多峰峦二分"
    storageKey="lc162-find-peak-config"
    defaultData="1, 2, 1, 3, 5, 6, 4"
    :defaultInterval="1200"
    :actionButtons="visualizerButtons"
    :steps="steps"
    @calculate="calculateSteps"
  >
    <template #visualization="{ step }">
      <div class="binary-search-container" v-if="step && step.array">
        
        <!-- 顶部：极简搜索状态面板 -->
        <div class="dashboard-minimal">
          
          <!-- 坡度判定面板 -->
          <div class="stat-box phase-box" :class="getSlopeClass(step.status)">
            <span class="label">当前判定 (Slope & Boundary)</span>
            <div class="value expr-value">
              <!-- 边界排查阶段的展示 -->
              <template v-if="step.status.startsWith('check-')">
                 边界拦截检测中...
              </template>
              
              <!-- 二分阶段坡度展示 -->
              <template v-else-if="step.midIdx !== -1">
                <span class="slope-item" :class="{'is-dim': step.status === 'search-right'}">
                  {{ step.leftVal === -Infinity ? '-∞' : step.leftVal }}
                </span>
                <span class="sign" :class="{'is-dim': step.status === 'search-right'}">
                  {{ step.leftVal < step.midVal ? '<' : (step.leftVal === -Infinity ? '<' : '>') }}
                </span>
                
                <strong class="mid-val">{{ step.midVal }}</strong>
                
                <span class="sign" :class="{'is-dim': step.status === 'search-left'}">
                  {{ step.midVal < step.rightVal ? '<' : '>' }}
                </span>
                <span class="slope-item" :class="{'is-dim': step.status === 'search-left'}">
                  {{ step.rightVal === -Infinity ? '-∞' : step.rightVal }}
                </span>
              </template>

              <template v-else>
                <span class="empty-hint">准备探测</span>
              </template>
            </div>
            <div class="slope-hint" v-if="step.midIdx !== -1 && !step.status.startsWith('check-')">
              {{ getSlopeHint(step.status) }}
            </div>
          </div>

          <!-- 区间状态监控 -->
          <div class="hash-compare-panel">
            <div class="panel-header">
              <span class="label">有效搜索区间: [Left, Right]</span>
              <span class="status-badge" 
                :class="{
                  'is-success': step.status === 'found',
                  'is-fail': step.status === 'not-found',
                  'is-pending': step.status !== 'found' && step.status !== 'not-found'
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
                  <span class="calc-hint" v-if="step.status === 'calc-mid'">(向下取整 ⬇)</span>
                </span>
              </div>
              <div class="ptr-info-item">
                <span class="ptr-badge bg-right">R</span> 
                <span class="val">{{ step.rightIdx === -1 ? '?' : step.rightIdx }}</span>
              </div>
            </div>
          </div>

          <div class="stat-box highlight-box" :class="{'is-success': step.status === 'found'}">
            <span class="label">峰值索引 (Result)</span>
            <div class="value">{{ step.result === -1 ? '?' : step.result }}</div>
          </div>
        </div>

        <div class="divider">
          <span class="arrow-down">↓ 二分折叠：只要顺着上坡的方向找，区间内必定存在至少一个峰值 ↓</span>
        </div>

        <!-- 数组主视图 (紧凑模式) -->
        <div class="array-wrapper">
          <div class="array-track">

            <!-- 🌟 区间包裹框 -->
            <div 
              class="window-frame-minimal" 
              :class="{
                'is-valid-frame': step.status === 'found',
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
                  'is-in-window': idx >= step.leftIdx && idx <= step.rightIdx && !step.status.startsWith('check-'),
                  'is-discarded': (idx < step.leftIdx || idx > step.rightIdx) && !step.status.startsWith('check-') && step.leftIdx !== -1,
                  'is-mid': idx === step.midIdx && step.status !== 'found',
                  'is-match': idx === step.result && step.status === 'found',
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
                  <span v-if="step.midIdx === idx && step.status !== 'found'" class="ptr ptr-mid">M</span>
                  <span v-if="step.leftIdx === idx && step.status !== 'found' && !step.status.startsWith('check-')" class="ptr ptr-left">L</span>
                  <span v-if="step.rightIdx === idx && step.status !== 'found' && !step.status.startsWith('check-')" class="ptr ptr-right">R</span>
                  <span v-if="step.status === 'found' && idx === step.result" class="ptr ptr-res">Peak</span>
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
    'check-len': '📏 排查单元素',
    'check-left': '🚧 拦截左边界',
    'check-right': '🚧 拦截右边界',
    'pending': '🔍 初始化区间',
    'calc-mid': '🧮 探测中间坡度',
    'search-right': '↗️ 处于上坡：排除左侧 (L=M+1)',
    'search-left': '↘️ 处于下坡：排除右侧 (R=M)',
    'found': '⛰️ 成功登顶！找到峰值',
    'not-found': '❌ 未找到 (异常)'
  }
  return map[status] || '...'
}

const getSlopeClass = (status) => {
  if (status === 'found') return 'is-success';
  if (status === 'search-right') return 'is-uphill'; 
  if (status === 'search-left') return 'is-downhill'; 
  if (status.startsWith('check-')) return 'is-warning';
  return '';
}

const getSlopeHint = (status) => {
  if (status === 'search-right') return 'arr[mid] < arr[mid+1] (上升趋势)';
  if (status === 'search-left') return 'arr[mid] > arr[mid+1] (下降趋势)';
  if (status === 'found') return 'arr[mid-1] < arr[mid] > arr[mid+1] (极大值)';
  return '正在测算地势...';
}

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

  const pushState = (desc, l, r, m, lVal, mVal, rVal, res, stat, checkRange = []) => {
    steps.value.push({
      array: JSON.parse(JSON.stringify(arrayObj)),
      n: n,
      leftIdx: l,
      rightIdx: r,
      midIdx: m,
      leftVal: lVal,
      midVal: mVal,
      rightVal: rVal,
      result: res,
      status: stat, 
      checkRange: checkRange,
      description: desc,
      passId: passNum++ 
    });
  }

  // ================= 完美复刻 Java 逻辑 =================
  
  // 边界拦截 1
  pushState(`【拦截排查】首先判断数组长度，if (n == 1) return 0。`, -1, -1, -1, -Infinity, -Infinity, -Infinity, -1, 'check-len', [0]);
  if (n === 1) {
    pushState(`【🎯 命中边界】数组只有 1 个元素，它自身就是峰值，直接返回 0。`, -1, -1, -1, -Infinity, -Infinity, -Infinity, 0, 'found');
    return;
  }

  // 边界拦截 2
  pushState(`【拦截左边界】因为左右两端隐含 -∞，如果 nums[0] > nums[1]，那么 0 位置就是峰值。`, -1, -1, -1, -Infinity, -Infinity, -Infinity, -1, 'check-left', [0, 1]);
  if (arr[0] > arr[1]) {
    pushState(`【🎯 命中左边界】nums[0] > nums[1]，且左侧是 -∞，说明 0 位置是极值点，直接返回 0。`, -1, -1, -1, -Infinity, -Infinity, -Infinity, 0, 'found');
    return;
  }

  // 边界拦截 3
  pushState(`【拦截右边界】如果 nums[n-1] > nums[n-2]，那么最后一位就是峰值。`, -1, -1, -1, -Infinity, -Infinity, -Infinity, -1, 'check-right', [n-2, n-1]);
  if (arr[n - 1] > arr[n - 2]) {
    pushState(`【🎯 命中右边界】nums[n-1] > nums[n-2]，且右侧是 -∞，说明最右侧是极值点，直接返回 ${n-1}。`, -1, -1, -1, -Infinity, -Infinity, -Infinity, n-1, 'found');
    return;
  }

  let left = 0, right = n - 1;
  pushState(`【开启二分】所有边界排查完毕，进入安全的内部搜索。设置 [left, right] 闭区间为 [0, ${n-1}]。此时无论中点落在何处，都不会发生数组越界。`, left, right, -1, -Infinity, -Infinity, -Infinity, -1, 'pending');

  while (left < right) {
    let mid = left + Math.floor((right - left) / 2);
    
    // 安全获取周围的值
    let mVal = arr[mid];
    let lVal = arr[mid - 1]; // 你的 Java 代码保证了不会越界
    let rVal = arr[mid + 1];

    pushState(`【测算地势】mid = ${mid}。获取周围元素：arr[${mid-1}]=${lVal}，arr[${mid}]=${mVal}，arr[${mid+1}]=${rVal}。`, left, right, mid, lVal, mVal, rVal, -1, 'calc-mid');

    if (rVal < mVal && mVal > lVal) {
      pushState(`【⛰️ 发现山峰】arr[mid] 同时大于左侧和右侧元素！登顶成功，返回 ${mid}。`, left, right, mid, lVal, mVal, rVal, mid, 'found');
      return;
    } 
    else if (mVal < rVal) {
      pushState(`【↗️ 处于上坡】arr[mid] < arr[mid+1]。说明右侧地势更高，由于最后一定有下坡 (-∞)，右侧必有山峰。舍弃左半侧，left = mid + 1。`, left, right, mid, lVal, mVal, rVal, -1, 'search-right');
      left = mid + 1;
    } 
    else if (mVal > rVal) {
      pushState(`【↘️ 处于下坡】arr[mid] > arr[mid+1]。说明左侧地势更高，必定存在山峰。保留自身向下压榨，执行 right = mid。`, left, right, mid, lVal, mVal, rVal, -1, 'search-left');
      right = mid;
    }
  }

  pushState(`【循环结束】理论上一定能在内部 return。异常返回 -1。`, left, right, -1, -Infinity, -Infinity, -Infinity, -1, 'not-found');
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

/* 核心：坡度判定面板 */
.phase-box { border-color: var(--vp-c-border); background-color: var(--vp-c-bg-elv); transition: all 0.3s; min-width: 220px; }
.phase-box.is-success { border-color: #10b981; background-color: rgba(16, 185, 129, 0.05); }
.phase-box.is-success .mid-val { color: #10b981; }
.phase-box.is-uphill { border-color: #0ea5e9; background-color: rgba(14, 165, 233, 0.05); }
.phase-box.is-uphill .mid-val { color: #0ea5e9; }
.phase-box.is-downhill { border-color: #f59e0b; background-color: rgba(245, 158, 11, 0.05); }
.phase-box.is-downhill .mid-val { color: #f59e0b; }
.phase-box.is-warning { border-color: #8b5cf6; background-color: rgba(139, 92, 246, 0.05); }

.expr-value { font-family: monospace; font-size: 16px; display: flex; align-items: center; gap: 8px;}
.expr-value .slope-item { color: var(--vp-c-text-2); }
.expr-value .mid-val { font-size: 24px; font-weight: 900; color: var(--vp-c-text-1); transition: color 0.3s; }
.expr-value .sign { color: var(--vp-c-text-3); font-weight: normal; font-size: 14px; }
.expr-value .is-dim { opacity: 0.3; } 

.slope-hint { font-size: 11px; color: var(--vp-c-text-3); margin-top: 4px; font-family: monospace; }
.empty-hint { color: var(--vp-c-text-3); font-style: italic; font-size: 14px; font-weight: normal; }

.hash-compare-panel { display: flex; flex-direction: column; background-color: var(--vp-c-bg-elv); border: 1px solid var(--vp-c-border); padding: 12px 20px; border-radius: 8px; min-width: 320px; }
.panel-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px; padding-bottom: 8px; border-bottom: 1px dashed var(--vp-c-divider); }
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
.status-badge.is-fail { color: #ef4444; background: rgba(239, 68, 68, 0.15); }
.status-badge.is-pending { color: #8b5cf6; background: rgba(139, 92, 246, 0.15); }

/* 统计盒子 UI */
.stat-box { display: flex; flex-direction: column; align-items: center; justify-content: center; background-color: var(--vp-c-bg-elv); border: 1px solid var(--vp-c-border); padding: 10px 20px; border-radius: 8px; min-width: 120px; }
.stat-box.highlight-box { border-style: dashed; }
.stat-box.highlight-box.is-success { border-color: #10b981; background: rgba(16, 185, 129, 0.08); border-style: solid; }
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
.is-in-window { border-color: transparent; } 
.is-discarded { opacity: 0.2; transform: scale(0.9); } 
.is-mid { border-color: #8b5cf6; border-width: 2px; box-shadow: 0 0 10px rgba(139, 92, 246, 0.2); transform: translateY(-4px); }
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