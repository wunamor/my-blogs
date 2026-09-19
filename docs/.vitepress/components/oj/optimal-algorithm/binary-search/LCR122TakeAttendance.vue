<template>
  <VisualizerLayout
    title="点名 / 缺失的数字 (LCR 122) - 索引错位二分"
    storageKey="lcr122-take-attendance-config"
    defaultData="0, 1, 2, 3, 4, 5, 6, 8, 9"
    :defaultInterval="1200"
    :actionButtons="visualizerButtons"
    :steps="steps"
    @calculate="calculateSteps"
  >
    <template #visualization="{ step }">
      <div class="binary-search-container" v-if="step && step.array">
        
        <!-- 顶部：极致简约面板 -->
        <div class="dashboard-minimal">
          <div class="stat-box target-box" :class="getPhaseClass(step.status)">
            <span class="label">核心判定: records[mid] == mid</span>
            <div class="value expr-value">
              <template v-if="step.status.startsWith('check-')">
                 末尾拦截检测中...
              </template>
              <template v-else-if="step.midIdx !== -1">
                {{ step.array[step.midIdx].val }} 
                <span class="sign" :class="{'is-mismatch-sign': step.array[step.midIdx].val !== step.midIdx}">
                  {{ step.array[step.midIdx].val === step.midIdx ? '==' : '!=' }}
                </span> 
                {{ step.midIdx }}
              </template>
              <template v-else>
                <span class="empty-hint">等待探测</span>
              </template>
            </div>
          </div>
        </div>

        <div class="divider">
          <span class="arrow-down">↓ 动态折叠：利用 元素值 与 索引 的对应关系寻找错位点 ↓</span>
        </div>

        <!-- 数组主视图 (紧凑模式) -->
        <div class="array-wrapper">
          <div class="array-track">

            <!-- 🌟 区间包裹框 -->
            <div 
              class="window-frame-minimal" 
              :class="{
                'is-valid-frame': step.status === 'done',
                'is-hidden': step.leftIdx > step.rightIdx || step.leftIdx === -1 || step.status.startsWith('check-')
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
                  'is-in-window': idx >= step.leftIdx && idx <= step.rightIdx && !step.status.startsWith('check-'),
                  'is-discarded': (idx < step.leftIdx || idx > step.rightIdx) && !step.status.startsWith('check-') && step.leftIdx !== -1,
                  'is-mid': idx === step.midIdx && step.status !== 'done',
                  'is-match': idx === step.result && step.status === 'done',
                  'is-mismatch': idx === step.midIdx && step.status === 'search-left',
                  'is-checking': step.status.startsWith('check-') && idx === step.n - 1
                }"
              >
                {{ item.val }}
              </div>
              
              <!-- 底部极简指针 -->
              <div class="pointer-track">
                <span class="idx" :class="{'is-mismatch-idx': item.val !== idx}">{{ idx }}</span>
                <div class="ptr-labels">
                  <span v-if="step.midIdx === idx && step.status !== 'done'" class="ptr ptr-mid">M</span>
                  <span v-if="step.leftIdx === idx && step.status !== 'done' && !step.status.startsWith('check-')" class="ptr ptr-left">L</span>
                  <span v-if="step.rightIdx === idx && step.status !== 'done' && !step.status.startsWith('check-')" class="ptr ptr-right">R</span>
                  <span v-if="step.status === 'done' && idx === step.result" class="ptr ptr-res">缺席</span>
                </div>
              </div>
            </div>

            <!-- 虚拟的末尾节点 (如果缺席的是最后一个) -->
            <div class="array-item-group virtual-group" v-if="step.status === 'done' && step.result === step.n">
               <div class="array-box-minimal virtual-box is-match">?</div>
               <div class="pointer-track">
                 <span class="idx is-mismatch-idx">{{ step.n }}</span>
                 <div class="ptr-labels"><span class="ptr ptr-res">缺席</span></div>
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

const getPhaseClass = (status) => {
  if (status === 'done') return 'is-success';
  if (status === 'search-right') return 'is-low-zone';
  if (status === 'search-left') return 'is-high-zone';
  if (status.startsWith('check-')) return 'is-warning';
  return '';
}

const calculateSteps = (inputRaw) => {
  let arr = inputRaw.split(',').map(n => parseInt(n.trim())).filter(n => !isNaN(n));
  if (arr.length === 0) { steps.value = []; return; }

  steps.value = [];
  let passNum = 0;
  let n = arr.length;
  const arrayObj = arr.map((val, idx) => ({ id: `idx-${idx}`, val }));

  const pushState = (desc, l, r, m, res, stat) => {
    steps.value.push({
      array: JSON.parse(JSON.stringify(arrayObj)),
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
  let left = 0, right = n - 1;

  pushState(`【拦截末尾】检查最后一位同学是否缺席：records[${right}] == ${right}？`, -1, -1, -1, -1, 'check-end');
  
  if (arr[right] === right) {
    pushState(`【🎯 缺席在末尾】records[${right}] == ${right}。说明数组毫无错位，前 ${n} 个同学全在，缺席的是最后一位同学 ${right + 1}。`, -1, -1, -1, right + 1, 'done');
    return;
  }

  pushState(`【开启二分】末尾已有错位，说明缺席者在闭区间 [0, ${n-1}] 中。`, left, right, -1, -1, 'pending');

  while (left < right) {
    let mid = left + Math.floor((right - left) / 2);
    let mVal = arr[mid];

    pushState(`【计算中点】mid = ${mid}。比对 records[${mid}] 与索引 ${mid}。`, left, right, mid, -1, 'calc-mid');

    if (mVal !== mid) {
      pushState(`【出现错位】records[mid] (${mVal}) != mid (${mid})。说明在这个位置或之前，同学已经缺席导致整体偏移。保留自身，抛弃右侧：right = mid。`, left, right, mid, -1, 'search-left');
      right = mid;
    } else {
      pushState(`【索引一致】records[mid] == mid。说明到 mid 为止完全没有发生错位，缺席者必然在严格右侧。抛弃左侧及自身：left = mid + 1。`, left, right, mid, -1, 'search-right');
      left = mid + 1;
    }
  }

  pushState(`🏁 搜索完毕！区间收缩为单点 (L == R == ${left})，这里就是发生错位的首个位置，即缺席的同学编号。`, left, right, -1, left, 'done');
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

/* 核心盒子 */
.stat-box { display: flex; flex-direction: column; align-items: center; justify-content: center; background-color: var(--vp-c-bg-elv); border: 1px solid var(--vp-c-border); padding: 10px 20px; border-radius: 8px; min-width: 220px; transition: all 0.3s; }
.stat-box .label { font-size: 12px; color: var(--vp-c-text-2); margin-bottom: 6px; font-weight: bold; }

.stat-box.is-success { border-color: #10b981; background-color: rgba(16, 185, 129, 0.05); }
.stat-box.is-high-zone { border-color: #ef4444; background-color: rgba(239, 68, 68, 0.05); }
.stat-box.is-low-zone { border-color: #0ea5e9; background-color: rgba(14, 165, 233, 0.05); }
.stat-box.is-warning { border-color: #8b5cf6; background-color: rgba(139, 92, 246, 0.05); }

.expr-value { font-family: monospace; font-size: 20px; display: flex; align-items: center; gap: 8px; font-weight: bold; color: var(--vp-c-text-1);}
.expr-value .sign { color: var(--vp-c-text-3); font-weight: normal; font-size: 16px; }
.expr-value .is-mismatch-sign { color: #ef4444; font-weight: bold; }
.empty-hint { color: var(--vp-c-text-3); font-style: italic; font-size: 14px; font-weight: normal; }

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

/* 错位异常的高亮 */
.is-mismatch { border-color: #ef4444; background: rgba(239, 68, 68, 0.1); color: #dc2626; } 
.is-match { border-color: #10b981; background: rgba(16, 185, 129, 0.15); color: #10b981; font-size: 18px; transform: scale(1.1); box-shadow: 0 4px 15px rgba(16, 185, 129, 0.2); }

/* 边界排查拦截特效 */
.is-checking {
  border-color: #8b5cf6;
  background: rgba(139, 92, 246, 0.15);
  color: #8b5cf6;
  transform: translateY(-2px);
}

/* 虚拟节点 */
.virtual-group { opacity: 0.8; }
.virtual-box { border-style: dashed; }

/* 底部指针与索引 */
.pointer-track { margin-top: 6px; display: flex; flex-direction: column; align-items: center; min-height: 55px; }
.idx { font-size: 10px; color: var(--vp-c-text-3); margin-bottom: 4px; font-weight: bold;}
.is-mismatch-idx { color: #ef4444; } /* 索引与值错位时标红 */

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