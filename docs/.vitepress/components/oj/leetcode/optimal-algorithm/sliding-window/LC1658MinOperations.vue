<template>
  <VisualizerLayout
    title="将 x 减到 0 的最小操作数 (LeetCode 1658) - 逆向滑动窗口"
    storageKey="lc1658-min-ops-config"
    defaultData="5 | 1, 1, 4, 2, 3"
    :defaultInterval="900"
    :actionButtons="visualizerButtons"
    :steps="steps"
    @calculate="calculateSteps"
  >
    <template #visualization="{ step }">
      <div class="sliding-window-container" v-if="step && step.array">
        
        <!-- 顶部：极简数据推演面板 -->
        <div class="dashboard-minimal">
          <div class="stat-box outline-box">
            <span class="label">Total Sum (总和)</span>
            <div class="value">{{ step.sumTotal }}</div>
          </div>
          
          <div class="stat-box outline-box">
            <span class="label">x (目标减少值)</span>
            <div class="value">{{ step.x }}</div>
          </div>
          
          <!-- 核心转化公式：Target -->
          <div class="stat-box target-box">
            <span class="label">窗口 Target = Sum - x</span>
            <div class="value">{{ step.target }}</div>
          </div>

          <div class="stat-box highlight-box" :class="{'is-success': step.status === 'valid'}">
            <span class="label">最小操作数 (Min Ops)</span>
            <div class="value">
              {{ step.ret === step.n + 1 ? '∞' : step.ret }}
            </div>
          </div>
        </div>

        <!-- 居中的状态提示区 -->
        <div class="status-indicator">
          <span class="formula-text">
            当前窗口和 (Sum) = <strong>{{ step.sum }}</strong> 
            <span class="sign">{{ step.sum === step.target ? '==' : (step.sum < step.target ? '<' : '>') }}</span> 
            Target ({{ step.target }})
          </span>
        </div>

        <div class="divider">
          <span class="arrow-down">↓ 逆向思维：窗口内凑 Target，窗口外被消除凑 x ↓</span>
        </div>

        <!-- 数组主视图 -->
        <div class="array-wrapper">
          <div class="array-track">
            
            <!-- 极简线框风格的滑动窗口 -->
            <div 
              class="window-frame-minimal" 
              :class="{
                'is-valid-frame': step.sum === step.target && step.leftIdx < step.rightIdx,
                'is-hidden': step.leftIdx >= step.rightIdx
              }"
              :style="getWindowStyle(step)"
            >
              <div class="window-label" v-if="step.leftIdx < step.rightIdx">
                长度: {{ step.rightIdx - step.leftIdx }}
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
                  'is-in-window': idx >= step.leftIdx && idx < step.rightIdx,
                  'is-outside-removed': step.sum === step.target && (idx < step.leftIdx || idx >= step.rightIdx),
                  'is-processed': idx < step.leftIdx && step.sum !== step.target
                }"
              >
                {{ item.val }}
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

// 计算弹性窗口物理样式
const getWindowStyle = (step) => {
  if (step.leftIdx >= step.rightIdx) return { width: '0px', opacity: 0 }
  const STRIDE = 58; // 46(width) + 12(gap)
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
  // 解析输入，格式支持 "x | array"
  let x = 0
  let numStr = inputRaw
  if (inputRaw.includes('|')) {
    const parts = inputRaw.split('|')
    x = parseInt(parts[0].trim())
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
  const arrayObj = arr.map((val, idx) => ({ id: `id-${idx}`, val }))

  const pushState = (desc, l, r, curSum, currentRet, stat, sTotal, tar) => {
    steps.value.push({
      n: n,
      x: x,
      sumTotal: sTotal,
      target: tar,
      array: JSON.parse(JSON.stringify(arrayObj)),
      leftIdx: l,
      rightIdx: r,
      sum: curSum,
      ret: currentRet,
      status: stat, // 'pending', 'expanding', 'shrinking', 'valid', 'done', 'invalid'
      description: desc,
      passId: passNum++ 
    })
  }

  // ================= 复刻 Java 代码逻辑 =================
  let sumTotal = 0;
  for (let i = 0; i < n; i++) {
    sumTotal += arr[i];
  }

  let target = sumTotal - x;
  let ret = n + 1;
  let left = 0;
  let right = 0;
  let sum = 0;

  pushState(`【逆向转化】要想两端移除的数之和为 ${x}，等价于寻找中间连续子数组，使其和为 Target = (Total - x) = ${target}。若找到最长子数组长度为 len，则操作数为 n - len。`, left, right, sum, ret, 'pending', sumTotal, target);

  if (target < 0) {
    pushState(`【快速失败】Target = ${target} < 0。说明数组全部元素加起来都不够凑出 x，直接返回 -1。`, left, right, sum, ret, 'invalid', sumTotal, target);
    return;
  }

  while (right < n) {
    if (sum < target) {
      pushState(`【扩张】当前 Sum(${sum}) < Target(${target})，向右扩张窗口，准备纳入 nums[${right}] = ${arr[right]}。`, left, right, sum, ret, 'expanding', sumTotal, target);
      sum += arr[right++];
    } else if (sum === target) {
      let ops = n - (right - left);
      let isUpdate = ops < ret;
      ret = Math.min(ops, ret);
      let msg = isUpdate ? `🎉 发现更小操作数 ${ret}！` : `操作数 ${ops} 未打破最小记录 ${ret}。`;
      
      pushState(`【🎯 命中 Target】窗口总和刚好为 ${target}！说明两端留在外面的数刚好凑成 ${x}。需要移除元素数 = ${n} - ${right - left} = ${ops}。${msg} 记录后收缩左边界以寻找其他可能。`, left, right, sum, ret, 'valid', sumTotal, target);
      sum -= arr[left++];
    } else {
      // sum > target
      pushState(`【收缩】当前 Sum(${sum}) > Target(${target})，窗口总和超标，向右收缩左边界，准备移出 nums[${left}] = ${arr[left]}。`, left, right, sum, ret, 'shrinking', sumTotal, target);
      sum -= arr[left++];
    }
  }

  while (sum > target) {
    pushState(`【末尾收缩】右边界已触底，但当前 Sum(${sum}) 仍 > Target(${target})。继续收缩左边界，准备移出 nums[${left}] = ${arr[left]}。`, left, right, sum, ret, 'shrinking', sumTotal, target);
    sum -= arr[left++];
  }

  if (sum === target) {
    let ops = n - (right - left);
    let isUpdate = ops < ret;
    ret = Math.min(ops, ret);
    let msg = isUpdate ? `🎉 发现更小操作数 ${ret}！` : ``;
    pushState(`【🎯 末尾命中】最后时刻窗口和为 ${target}。需要移除元素数 = ${ops}。${msg}`, left, right, sum, ret, 'valid', sumTotal, target);
  }

  let finalRes = ret === n + 1 ? -1 : ret;
  pushState(`🏁 算法执行完毕！全局最小操作数为 ${finalRes}。${finalRes === -1 ? '(无解)' : ''}`, left, right, sum, finalRes, 'done', sumTotal, target);
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

/* ================= 极简信息面板 ================= */
.dashboard-minimal {
  display: flex;
  gap: 16px;
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
  padding: 10px 20px;
  border-radius: 8px;
  min-width: 130px;
}

.stat-box.outline-box { border-style: dashed; background-color: transparent; }

/* 强调 Target 的盒子 */
.stat-box.target-box {
  border-color: #8b5cf6;
  background-color: rgba(139, 92, 246, 0.05);
}
.stat-box.target-box .value { color: #8b5cf6; }

.stat-box.highlight-box { border-color: #0ea5e9; background-color: rgba(14, 165, 233, 0.05); }
.stat-box.highlight-box .value { color: #0ea5e9; transition: color 0.3s; }
.stat-box.highlight-box.is-success { border-color: #10b981; background-color: rgba(16, 185, 129, 0.08); }
.stat-box.highlight-box.is-success .value { color: #10b981; }

.stat-box .label { font-size: 11px; color: var(--vp-c-text-2); margin-bottom: 6px; }
.stat-box .value { font-size: 24px; font-family: monospace; font-weight: 700; color: var(--vp-c-text-1); line-height: 1; }

/* 居中状态文本 */
.status-indicator { font-family: monospace; font-size: 14px; color: var(--vp-c-text-2); }
.status-indicator strong { color: var(--vp-c-text-1); font-size: 16px; }
.sign { margin: 0 6px; color: var(--vp-c-text-3); }

.divider { display: flex; justify-content: center; width: 100%; }
.arrow-down { font-size: 13px; color: var(--vp-c-text-3); }

/* ================= 数组与滑动窗口 (轻量化设计) ================= */
.array-wrapper {
  width: 100%;
  overflow-x: auto;
  background-color: transparent;
  padding: 40px 20px 50px 20px;
  display: flex;
  justify-content: center;
}

.array-track { display: flex; gap: 12px; position: relative; padding-top: 10px; }

/* 极简线框滑动窗口 */
.window-frame-minimal {
  position: absolute;
  top: 4px;
  height: 60px;
  background: rgba(148, 163, 184, 0.1);
  border: 1.5px solid #94a3b8; 
  border-radius: 6px;
  z-index: 1;
  pointer-events: none;
  transition: all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
}

/* 🎯 命中 Target 时的绿色成功边框 */
.window-frame-minimal.is-valid-frame {
  border-color: #10b981;
  background: rgba(16, 185, 129, 0.08);
}

.window-label {
  position: absolute;
  top: -22px;
  left: 50%;
  transform: translateX(-50%);
  color: var(--vp-c-text-2);
  font-size: 11px;
  font-weight: bold;
  white-space: nowrap;
}

/* 数组节点：缩小体积、清爽配色 */
.array-item-group { display: flex; flex-direction: column; align-items: center; position: relative; width: 46px; z-index: 2; }

.array-box-minimal {
  width: 100%;
  height: 46px;
  border: 1px solid var(--vp-c-border);
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

/* 窗口内的元素：取消背景色依赖线框 */
.is-in-window { border-color: transparent; }

/* 🌟 核心视觉设计：命中 Target 时，强化并高亮窗口外的元素 (因为它们才是凑成 x 的答案) */
.is-outside-removed {
  background: rgba(245, 158, 11, 0.1);
  color: #d97706;
  border-color: rgba(245, 158, 11, 0.4);
  transform: translateY(-2px);
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);
}
.dark .is-outside-removed { background: rgba(245, 158, 11, 0.15); color: #fcd34d; }

/* 已被弹出的常规废弃节点 */
.is-processed { opacity: 0.3; }

.virtual-group { opacity: 0.5; }
.virtual-box { border-style: dashed; color: var(--vp-c-text-3); font-size: 12px;}

/* ================= 底部极简指针 ================= */
.pointer-track { margin-top: 6px; display: flex; flex-direction: column; align-items: center; height: 36px; }
.idx { font-size: 11px; color: var(--vp-c-text-3); margin-bottom: 4px; }
.ptr-labels { display: flex; flex-direction: column; gap: 2px; align-items: center; }

.ptr { font-size: 10px; padding: 1px 4px; border-radius: 3px; font-weight: 600; }
.ptr-left { color: #64748b; background: var(--vp-c-bg-soft); border: 1px solid #cbd5e1; }
.ptr-right { color: #0284c7; background: #e0f2fe; border: 1px solid #bae6fd; }

.dark .ptr-left { border-color: #334155; }
.dark .ptr-right { border-color: #0c4a6e; }
</style>