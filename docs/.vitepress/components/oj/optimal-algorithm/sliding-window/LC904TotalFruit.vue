<template>
  <VisualizerLayout
    title="水果成篮 (LeetCode 904) - 滑动窗口"
    storageKey="lc904-total-fruit-config"
    defaultData="1, 2, 1, 2, 3, 3, 4"
    :defaultInterval="900"
    :actionButtons="visualizerButtons"
    :steps="steps"
    @calculate="calculateSteps"
  >
    <template #visualization="{ step }">
      <div class="sliding-window-container" v-if="step && step.array">
        
        <!-- 顶部：极简篮子与状态监控 -->
        <div class="dashboard-minimal">
          
          <!-- 篮子 1 -->
          <div class="basket-box" :class="{ 'is-empty': step.type[0] === -1 }">
            <span class="label">篮子 1 (Type)</span>
            <div class="value-row">
              <span class="fruit-type">{{ step.type[0] === -1 ? '空' : step.type[0] }}</span>
              <span class="fruit-count">数量: {{ step.count[0] }}</span>
            </div>
          </div>

          <!-- 篮子 2 -->
          <div class="basket-box" :class="{ 'is-empty': step.type[1] === -1 }">
            <span class="label">篮子 2 (Type)</span>
            <div class="value-row">
              <span class="fruit-type">{{ step.type[1] === -1 ? '空' : step.type[1] }}</span>
              <span class="fruit-count">数量: {{ step.count[1] }}</span>
            </div>
          </div>
          
          <!-- 核心统计 -->
          <div class="stat-box outline-box">
            <span class="label">当前窗口长度</span>
            <div class="value">{{ step.leftIdx <= step.rightIdx ? step.rightIdx - step.leftIdx : 0 }}</div>
          </div>

          <div class="stat-box highlight-box" :class="{'is-alert': step.status === 'alert'}">
            <span class="label">最大采摘量 (ret)</span>
            <div class="value">{{ step.ret === -1 ? 0 : step.ret }}</div>
          </div>

        </div>

        <div class="divider">
          <span class="arrow-down">↓ 物理数组与滑动窗口 (最多容纳 2 种数字) ↓</span>
        </div>

        <!-- 数组主视图 -->
        <div class="array-wrapper">
          <div class="array-track">
            
            <!-- 极简线框滑动窗口：[left, right) -->
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
                  'is-probing': idx === step.rightIdx && step.status !== 'done',
                  'is-processed': idx < step.leftIdx
                }"
              >
                {{ item.val }}
              </div>
              
              <!-- 底部极简指针 -->
              <div class="pointer-track">
                <span class="idx">{{ idx }}</span>
                <div class="ptr-labels">
                  <span v-if="step.leftIdx === idx" class="ptr ptr-left">L (丢)</span>
                  <span v-if="step.rightIdx === idx" class="ptr ptr-right">R (探)</span>
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

// 计算弹性窗口物理样式，基于 [left, right) 区间
const getWindowStyle = (step) => {
  if (step.leftIdx >= step.rightIdx) return { width: '0px', opacity: 0 }
  const STRIDE = 58; // 46(width) + 12(gap)
  const PADDING = 6;
  const leftPos = step.leftIdx * STRIDE - PADDING;
  // width 等于 (right - left) 个跨度
  const width = (step.rightIdx - step.leftIdx) * STRIDE - 12 + (PADDING * 2);
  return {
    left: `${leftPos}px`,
    width: `${width}px`,
    opacity: 1
  }
}

const calculateSteps = (inputRaw) => {
  let arr = inputRaw.split(',').map(n => parseInt(n.trim())).filter(n => !isNaN(n))
  if (arr.length === 0) {
    steps.value = []
    return
  }

  steps.value = []
  let passNum = 0
  let n = arr.length
  const arrayObj = arr.map((val, idx) => ({ id: `fruit-${idx}`, val }))

  const pushState = (desc, l, r, currentType, currentCount, currentRet, stat) => {
    steps.value.push({
      n: n,
      array: JSON.parse(JSON.stringify(arrayObj)),
      leftIdx: l,
      rightIdx: r,
      type: [...currentType],
      count: [...currentCount],
      ret: currentRet,
      status: stat, // 'pending', 'expanding', 'alert', 'shrinking', 'done'
      description: desc,
      passId: passNum++ 
    })
  }

  // ================= 完美复刻 Java 代码逻辑 =================
  let type = [-1, -1];
  let count = [0, 0];
  let ret = -1;
  let left = 0;
  let right = 0;

  pushState(`【初始化】双指针起步：L=0, R=0。两个篮子（type[0], type[1]）均为空，最大采摘量 ret = -1。`, left, right, type, count, ret, 'pending');

  while (right < n) {
    let rV = arr[right];
    
    if (type[0] === rV) {
      count[0]++;
      right++;
      pushState(`【装入篮子1】R探测到 ${rV}，篮子1已有该类型，直接采摘 (count[0]++)。`, left, right, type, count, ret, 'expanding');
    } else if (type[1] === rV) {
      count[1]++;
      right++;
      pushState(`【装入篮子2】R探测到 ${rV}，篮子2已有该类型，直接采摘 (count[1]++)。`, left, right, type, count, ret, 'expanding');
    } else if (type[0] === -1) {
      type[0] = rV;
      count[0]++;
      right++;
      pushState(`【篮子1启用】R探测到新类型 ${rV}。篮子1为空，将其标记为类型 ${rV} 并采摘。`, left, right, type, count, ret, 'expanding');
    } else if (type[1] === -1) {
      type[1] = rV;
      count[1]++;
      right++;
      pushState(`【篮子2启用】R探测到新类型 ${rV}。篮子2为空，将其标记为类型 ${rV} 并采摘。`, left, right, type, count, ret, 'expanding');
    } else {
      // 说明类型已满，不能采摘了
      let currentLen = right - left;
      ret = Math.max(ret, currentLen);
      pushState(`【⚠️ 篮子已满】R探测到第3种水果 ${rV}！先更新历史最大采摘量 ret = Math.max(ret, ${currentLen})。接下来收缩左边界，直到腾出一个空篮子。`, left, right, type, count, ret, 'alert');
      
      // 收缩 left
      while (count[0] !== 0 && count[1] !== 0) {
        if (arr[left] === type[0]) {
          count[0]--;
        } else {
          count[1]--;
        }
        left++;
        pushState(`【丢弃左侧水果】L指针右移，丢弃水果 ${arr[left - 1]}，其对应篮子数量减1。`, left, right, type, count, ret, 'shrinking');
      }
      
      // 腾出空位，将 right 装入
      if (count[0] === 0) {
        count[0]++;
        type[0] = arr[right];
      } else {
        count[1]++;
        type[1] = arr[right];
      }
      right++;
      pushState(`【换入新水果】旧水果已彻底清空一个篮子！将新水果 ${rV} 装入空出的篮子中，继续向右探索。`, left, right, type, count, ret, 'expanding');
    }
  }

  // 结尾最后的判定
  ret = Math.max(right - left, ret);
  let finalRet = ret === -1 ? 0 : ret;
  pushState(`🏁 遍历结束。最后一次计算窗口长度并更新，最终最大连续采摘量为 ${finalRet}。`, left, right, type, count, finalRet, 'done');
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

/* 篮子模块 UI */
.basket-box {
  display: flex;
  flex-direction: column;
  background-color: rgba(14, 165, 233, 0.05);
  border: 1px solid #bae6fd;
  padding: 10px 16px;
  border-radius: 8px;
  min-width: 130px;
  transition: all 0.3s;
}

.basket-box.is-empty {
  background-color: transparent;
  border: 1px dashed var(--vp-c-border);
  opacity: 0.7;
}

.dark .basket-box { border-color: #0284c7; }
.dark .basket-box.is-empty { border-color: var(--vp-c-border); }

.basket-box .label { font-size: 11px; color: var(--vp-c-text-2); margin-bottom: 6px; }
.value-row { display: flex; align-items: baseline; gap: 8px; }
.fruit-type { font-size: 22px; font-family: monospace; font-weight: 900; color: #0ea5e9; }
.basket-box.is-empty .fruit-type { color: var(--vp-c-text-3); }
.fruit-count { font-size: 12px; color: var(--vp-c-text-2); font-weight: bold; background: var(--vp-c-bg-elv); padding: 2px 6px; border-radius: 4px; }

/* 统计盒子 UI */
.stat-box {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background-color: var(--vp-c-bg-elv);
  border: 1px solid var(--vp-c-border);
  padding: 10px 20px;
  border-radius: 8px;
  min-width: 120px;
}

.stat-box.outline-box { border-style: dashed; background-color: transparent; }
.stat-box.highlight-box { border-color: #8b5cf6; background-color: rgba(139, 92, 246, 0.05); }
.stat-box.highlight-box .value { color: #8b5cf6; transition: color 0.3s; }
.stat-box.highlight-box.is-alert { border-color: #f59e0b; background-color: rgba(245, 158, 11, 0.08); }
.stat-box.highlight-box.is-alert .value { color: #f59e0b; }

.stat-box .label { font-size: 11px; color: var(--vp-c-text-2); margin-bottom: 6px; }
.stat-box .value { font-size: 24px; font-family: monospace; font-weight: 700; color: var(--vp-c-text-1); line-height: 1; }

.divider { display: flex; justify-content: center; width: 100%; margin-top: 5px; }
.arrow-down { font-size: 13px; color: var(--vp-c-text-3); }

/* ================= 数组与滑动窗口 (轻量化设计) ================= */
.array-wrapper {
  width: 100%;
  overflow-x: auto;
  
  /* 💡 核心：不使用 overflow-y: hidden，而是依靠充足的 padding-bottom 来消除滚动条 */
  padding: 40px 20px 50px 20px; 
  
  background-color: transparent;
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

/* 篮子已满冲突时的警告边框 */
.window-frame-minimal.is-alert {
  border-color: #f59e0b;
  border-style: dashed;
  background: rgba(245, 158, 11, 0.08);
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

/* 窗口内的元素：仅依赖线框包裹 */
.is-in-window { border-color: transparent; }

/* 正在被 Right 指针探测的下一个元素 */
.is-probing { border-color: #0ea5e9; color: #0ea5e9; border-style: dashed; }

/* 已经被抛弃在左侧的元素 */
.is-processed { opacity: 0.3; }

.virtual-group { opacity: 0.5; }
.virtual-box { border-style: dashed; color: var(--vp-c-text-3); font-size: 12px;}

/* ================= 底部极简指针 ================= */
.pointer-track { 
  margin-top: 6px; 
  display: flex; 
  flex-direction: column; 
  align-items: center; 
  /* 给轨道足够的高度，保障底部标签不被顶出容器 */
  min-height: 40px; 
}

.idx { font-size: 11px; color: var(--vp-c-text-3); margin-bottom: 4px; }
.ptr-labels { display: flex; flex-direction: column; gap: 2px; align-items: center; }

.ptr { font-size: 10px; padding: 1px 4px; border-radius: 3px; font-weight: 600; }
.ptr-left { color: #64748b; background: var(--vp-c-bg-soft); border: 1px solid #cbd5e1; }
.ptr-right { color: #0284c7; background: #e0f2fe; border: 1px solid #bae6fd; }

.dark .ptr-left { border-color: #334155; }
.dark .ptr-right { border-color: #0c4a6e; }
</style>