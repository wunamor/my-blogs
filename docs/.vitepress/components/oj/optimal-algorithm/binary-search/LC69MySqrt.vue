<template>
  <VisualizerLayout
    title="x 的平方根 (LeetCode 69) - 搜索区间折叠"
    storageKey="lc69-my-sqrt-config"
    defaultData="8"
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
            <span class="label">目标值 (x)</span>
            <div class="value">{{ step.x }}</div>
          </div>

          <!-- 核心：平方比较面板 -->
          <div class="stat-box phase-box" :class="getPhaseClass(step.status)">
            <span class="label">平方值判定 (mid * mid)</span>
            <div class="value expr-value">
              <template v-if="step.midIdx !== -1">
                {{ step.midIdx }}² = <strong>{{ step.pow }}</strong>
                <span class="sign">{{ step.pow === step.x ? '==' : (step.pow > step.x ? '>' : '<') }}</span>
                {{ step.x }}
              </template>
              <template v-else>
                <span class="empty-hint">等待探测</span>
              </template>
            </div>
          </div>

          <!-- 区间状态监控 -->
          <div class="hash-compare-panel">
            <div class="panel-header">
              <span class="label">有效搜索区间: [Left, Right]</span>
              <span class="status-badge" 
                :class="{
                  'is-success': step.status === 'found' || step.status === 'done',
                  'is-pending': step.status !== 'found' && step.status !== 'done'
                }">
                {{ getStatusText(step.status) }}
              </span>
            </div>
            
            <div class="pointers-info">
              <div class="ptr-info-item">
                <span class="ptr-badge bg-left">L</span> 
                <span class="val">{{ step.leftIdx }}</span>
              </div>
              <div class="ptr-info-item" :class="{'is-highlight-mid': step.status === 'calc-mid'}">
                <span class="ptr-badge bg-mid">M</span> 
                <span class="val">
                  {{ step.midIdx === -1 ? '?' : step.midIdx }} 
                  <span class="calc-hint" v-if="step.status === 'calc-mid'">(向上取整 ⬆)</span>
                </span>
              </div>
              <div class="ptr-info-item">
                <span class="ptr-badge bg-right">R</span> 
                <span class="val">{{ step.rightIdx }}</span>
              </div>
            </div>
          </div>

          <div class="stat-box highlight-box" :class="{'is-success': step.status === 'found' || step.status === 'done'}">
            <span class="label">整数平方根 (Result)</span>
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
                'is-valid-frame': step.status === 'found' || step.status === 'done',
                'is-hidden': step.leftIdx > step.rightIdx
              }"
              :style="getWindowStyle(step)"
            >
              <div class="window-label" v-if="step.leftIdx <= step.rightIdx">
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
                  'is-in-window': idx >= step.leftIdx && idx <= step.rightIdx,
                  'is-discarded': idx < step.leftIdx || idx > step.rightIdx,
                  'is-mid': idx === step.midIdx && step.status !== 'found' && step.status !== 'done',
                  'is-match': (idx === step.midIdx && step.status === 'found') || (idx === step.result && step.status === 'done'),
                  'is-mismatch': idx === step.midIdx && step.status.startsWith('search-')
                }"
              >
                {{ item.val }}
              </div>
              
              <!-- 底部极简指针 -->
              <div class="pointer-track">
                <span class="idx">{{ idx }}</span>
                <div class="ptr-labels">
                  <span v-if="step.midIdx === idx && step.status !== 'found' && step.status !== 'done'" class="ptr ptr-mid">M</span>
                  <span v-if="step.leftIdx === idx && step.status !== 'found' && step.status !== 'done'" class="ptr ptr-left">L</span>
                  <span v-if="step.rightIdx === idx && step.status !== 'found' && step.status !== 'done'" class="ptr ptr-right">R</span>
                  <!-- 结果标签 -->
                  <span v-if="(step.status === 'found' || step.status === 'done') && idx === step.result" class="ptr ptr-res">Ans</span>
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
    'search-left': '👈 抛弃右侧 (R=M-1)',
    'search-right': '👉 抛弃左侧 (L=M)',
    'found': '✅ 精确命中平方根！',
    'done': '🏁 循环结束，L 即为最终结果'
  }
  return map[status] || '...'
}

const getPhaseClass = (status) => {
  if (status === 'found' || status === 'done') return 'is-success';
  if (status === 'search-left') return 'is-fail'; // pow > x
  if (status === 'search-right') return 'is-warning'; // pow < x
  return '';
}

// 🌟 为二分查找闭区间 [left, right] 定制的框计算
const getWindowStyle = (step) => {
  if (step.leftIdx > step.rightIdx || step.leftIdx === undefined) return { width: '0px', opacity: 0 }
  
  const STRIDE = 36; // 紧凑模式：宽28 + 间距8
  const PADDING = 4;
  const leftPos = step.leftIdx * STRIDE - PADDING;
  // 包含元素的个数
  const count = step.rightIdx - step.leftIdx + 1;
  const width = count * STRIDE - 8 + (PADDING * 2);
  
  return {
    left: `${leftPos}px`,
    width: `${width}px`,
    opacity: 1
  }
}

const calculateSteps = (inputRaw) => {
  let x = parseInt(inputRaw.trim());
  if (isNaN(x) || x < 0) { steps.value = []; return; }
  
  // 避免数值过大撑爆浏览器
  let originalX = x;
  if (x > 100) x = 100;

  steps.value = [];
  let passNum = 0;
  
  let limit = Math.floor(x / 2) + 1;
  if (originalX === 0 || originalX === 1) limit = originalX;
  
  let arr = [];
  for (let i = 0; i <= limit; i++) {
    arr.push({ id: `idx-${i}`, val: i });
  }

  const pushState = (desc, l, r, m, powVal, res, stat) => {
    steps.value.push({
      array: JSON.parse(JSON.stringify(arr)),
      x: x,
      leftIdx: l,
      rightIdx: r,
      midIdx: m,
      pow: powVal,
      result: res,
      status: stat, 
      description: desc + (originalX > 100 ? ` (注: 为了可视化渲染性能，您输入的数值被限制展示为 x=${x})` : ''),
      passId: passNum++ 
    });
  }

  // ================= 完美复刻 Java 逻辑 =================
  if (x === 0 || x === 1) {
    pushState(`【快速返回】x == ${x}，其平方根就是自身，直接返回 ${x}。`, 0, limit, -1, -1, x, 'done');
    return;
  }

  let left = 0;
  let right = Math.floor(x / 2) + 1;

  pushState(`【初始化】对于 x=${x}，其平方根必然在 [0, x/2 + 1] 闭区间内。有效搜索空间由绿色线框包裹。`, left, right, -1, -1, -1, 'pending');

  while (left < right) {
    let mid = left + Math.floor((right - left + 1) / 2);
    let pow = mid * mid;
    pushState(`【计算中点 (偏右)】mid = left + (right - left + 1) / 2 = ${mid}。💡 这里必须 +1 向上取整！计算 mid² = ${pow}。`, left, right, mid, pow, -1, 'calc-mid');

    if (pow > x) {
      pushState(`【排除右侧】mid² (${pow}) > x (${x})。因为大于，所以当前 mid 本身绝对不是答案，目标必定在严格左侧。执行 right = mid - 1。`, left, right, mid, pow, -1, 'search-left');
      right = mid - 1;
    } else if (pow === x) {
      pushState(`【🎯 完美命中】mid² (${pow}) == x (${x})！说明找到了完美的整数平方根，直接返回。`, left, right, mid, pow, mid, 'found');
      return;
    } else {
      pushState(`【逼近左侧】mid² (${pow}) < x (${x})。由于要求向下取整的平方根，当前 mid 可能是答案，保留它并排除左侧。执行 left = mid。`, left, right, mid, pow, -1, 'search-right');
      left = mid;
    }
  }

  pushState(`🏁 搜索完毕！区间收缩为单点 (L == R == ${left})，此时 left 即为最大满足 mid² <= x 的整数平方根。`, left, right, -1, -1, left, 'done');
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

/* 核心：计算面板 */
.phase-box { border-color: var(--vp-c-border); background-color: var(--vp-c-bg-elv); transition: all 0.3s; }
.phase-box.is-success { border-color: #10b981; background-color: rgba(16, 185, 129, 0.05); }
.phase-box.is-success .value { color: #10b981; }
.phase-box.is-fail { border-color: #ef4444; background-color: rgba(239, 68, 68, 0.05); }
.phase-box.is-fail .value { color: #ef4444; }
.phase-box.is-warning { border-color: #f59e0b; background-color: rgba(245, 158, 11, 0.05); }
.phase-box.is-warning .value { color: #f59e0b; }

.expr-value { font-family: monospace; font-size: 18px; display: flex; align-items: center; gap: 8px;}
.expr-value strong { font-size: 22px; font-weight: 900; }
.expr-value .sign { color: var(--vp-c-text-3); font-weight: normal; }
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
  padding: 40px 20px 60px 20px; 
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