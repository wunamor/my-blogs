<template>
  <VisualizerLayout
    title="二分查找 (LeetCode 704) - 闭区间搜索"
    storageKey="lc704-binary-search-config"
    defaultData="9 | -1, 0, 3, 5, 9, 12"
    :defaultInterval="900"
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
              <span class="label">当前搜索区间: [Left, Right] 闭区间</span>
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
                <span class="val">idx: {{ step.leftIdx }}</span>
              </div>
              <div class="ptr-info-item">
                <span class="ptr-badge bg-mid">M</span> 
                <span class="val">
                  idx: {{ step.midIdx === -1 ? '?' : step.midIdx }} 
                  <span class="calc-hint" v-if="step.status === 'calc-mid'">(L + (R-L)/2)</span>
                </span>
              </div>
              <div class="ptr-info-item">
                <span class="ptr-badge bg-right">R</span> 
                <span class="val">idx: {{ step.rightIdx }}</span>
              </div>
            </div>
          </div>

          <div class="stat-box highlight-box" :class="{'is-success': step.status === 'found', 'is-fail': step.status === 'not-found'}">
            <span class="label">最终结果 (Result)</span>
            <div class="value">{{ step.result }}</div>
          </div>
        </div>

        <div class="divider">
          <span class="arrow-down">↓ 二分折叠搜索：灰色区域为被排出的无效区间 ↓</span>
        </div>

        <!-- 数组主视图 -->
        <div class="array-wrapper">
          <div class="array-track">

            <div 
              class="array-item-group" 
              v-for="(item, idx) in step.array" 
              :key="item.id"
            >
              <!-- 数组节点：简约样式 -->
              <div 
                class="array-box-minimal"
                :class="{
                  'is-discarded': idx < step.leftIdx || idx > step.rightIdx,
                  'is-mid': idx === step.midIdx && step.status !== 'found',
                  'is-match': idx === step.midIdx && step.status === 'found',
                  'is-mismatch': idx === step.midIdx && (step.status === 'search-left' || step.status === 'search-right')
                }"
              >
                {{ item.val }}
              </div>
              
              <!-- 底部极简指针：重叠时自动垂直排列 -->
              <div class="pointer-track">
                <span class="idx">{{ idx }}</span>
                <div class="ptr-labels">
                  <span v-if="step.midIdx === idx" class="ptr ptr-mid">M</span>
                  <span v-if="step.leftIdx === idx" class="ptr ptr-left">L</span>
                  <span v-if="step.rightIdx === idx" class="ptr ptr-right">R</span>
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
    'search-left': '👈 目标在左侧 (R=M-1)',
    'search-right': '👉 目标在右侧 (L=M+1)',
    'found': '✅ 查找成功！',
    'not-found': '❌ 区间为空，查找失败'
  }
  return map[status] || '...'
}

const calculateSteps = (inputRaw) => {
  // 解析输入，格式支持 "target | array"
  let target = 9;
  let numStr = inputRaw;
  if (inputRaw.includes('|')) {
    const parts = inputRaw.split('|');
    target = parseInt(parts[0].trim());
    numStr = parts[1].trim();
  }

  let arr = numStr.split(',').map(n => parseInt(n.trim())).filter(n => !isNaN(n));
  if (arr.length === 0) {
    steps.value = [];
    return;
  }

  steps.value = [];
  let passNum = 0;
  let n = arr.length;
  const arrayObj = arr.map((val, idx) => ({ id: `idx-${idx}`, val }));

  const pushState = (desc, l, r, m, res, stat) => {
    steps.value.push({
      array: JSON.parse(JSON.stringify(arrayObj)),
      target: target,
      leftIdx: l,
      rightIdx: r,
      midIdx: m,
      result: res,
      status: stat, // 'pending', 'calc-mid', 'search-left', 'search-right', 'found', 'not-found'
      description: desc,
      passId: passNum++ 
    });
  }

  // ================= 完美复刻 Java 二分查找逻辑 =================
  let left = 0;
  let right = n - 1;

  pushState(`【初始化】设置双指针闭区间 [left, right]。left = 0, right = ${right}。`, left, right, -1, '?', 'pending');

  while (left <= right) {
    // int mid = left + (right - left) / 2;
    let mid = left + Math.floor((right - left) / 2);
    pushState(`【计算中点】mid = left + (right - left) / 2 = ${left} + (${right} - ${left}) / 2 = ${mid}。查看 nums[${mid}]。`, left, right, mid, '?', 'calc-mid');

    let midVal = arr[mid];

    if (midVal > target) {
      pushState(`【比较】nums[mid] (${midVal}) > target (${target})。说明目标如果存在，必定在左半边区间。执行 right = mid - 1。`, left, right, mid, '?', 'search-left');
      right = mid - 1;
    } else if (midVal === target) {
      pushState(`【🎯 命中】nums[mid] (${midVal}) == target (${target})！查找成功，直接返回索引 ${mid}。`, left, right, mid, mid, 'found');
      return; // 结束算法
    } else {
      // nums[mid] < target
      pushState(`【比较】nums[mid] (${midVal}) < target (${target})。说明目标如果存在，必定在右半边区间。执行 left = mid + 1。`, left, right, mid, '?', 'search-right');
      left = mid + 1;
    }
  }

  // return -1
  pushState(`【未找到】当前 left (${left}) > right (${right})，满足跳出 while 循环的条件。区间内全部排查完毕，未发现目标值，返回 -1。`, left, right, -1, -1, 'not-found');
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

/* ================= 极简信息面板 ================= */
.dashboard-minimal {
  display: flex;
  gap: 16px;
  width: 100%;
  justify-content: center;
  flex-wrap: wrap;
}

.hash-compare-panel {
  display: flex;
  flex-direction: column;
  background-color: var(--vp-c-bg-elv);
  border: 1px solid var(--vp-c-border);
  padding: 12px 20px;
  border-radius: 8px;
  min-width: 380px;
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

.status-badge { font-size: 12px; font-weight: bold; padding: 2px 8px; border-radius: 4px; }
.status-badge.is-success { color: #10b981; background: rgba(16, 185, 129, 0.15); }
.status-badge.is-fail { color: #ef4444; background: rgba(239, 68, 68, 0.15); }
.status-badge.is-pending { color: #8b5cf6; background: rgba(139, 92, 246, 0.15); }

.pointers-info {
  display: flex;
  justify-content: space-around;
  margin-top: 5px;
}
.ptr-info-item {
  display: flex;
  align-items: center;
  gap: 6px;
  font-family: monospace;
  font-size: 14px;
  color: var(--vp-c-text-1);
  font-weight: 600;
}
.ptr-badge {
  color: white;
  padding: 1px 6px;
  border-radius: 4px;
  font-size: 12px;
}
.bg-left { background: #64748b; }
.bg-right { background: #0ea5e9; }
.bg-mid { background: #8b5cf6; }

.calc-hint { font-size: 11px; color: var(--vp-c-text-3); font-weight: normal; margin-left: 4px; }

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
  min-width: 140px;
}
.stat-box.target-box { border-color: #f59e0b; background-color: rgba(245, 158, 11, 0.05); }
.stat-box.target-box .value { color: #f59e0b; }

.stat-box.highlight-box { border-style: dashed; }
.stat-box.highlight-box.is-success { border-color: #10b981; background-color: rgba(16, 185, 129, 0.08); border-style: solid; }
.stat-box.highlight-box.is-success .value { color: #10b981; }
.stat-box.highlight-box.is-fail { border-color: #ef4444; background-color: rgba(239, 68, 68, 0.08); border-style: solid; }
.stat-box.highlight-box.is-fail .value { color: #ef4444; }

.stat-box .label { font-size: 12px; color: var(--vp-c-text-2); margin-bottom: 6px; font-weight: bold; }
.stat-box .value { font-size: 24px; font-family: monospace; font-weight: 700; color: var(--vp-c-text-1); line-height: 1; transition: color 0.3s; }

.divider { display: flex; justify-content: center; width: 100%; margin-top: 5px; }
.arrow-down { font-size: 13px; color: var(--vp-c-text-3); }

/* ================= 数组与视觉排版 ================= */
.array-wrapper {
  width: 100%;
  overflow-x: auto;
  overflow-y: hidden; /* 保障纵向不滚动 */
  padding: 30px 20px 60px 20px; /* 底部预留 60px 足够堆叠 L, M, R 三个标签 */
  background-color: transparent;
  display: flex;
  justify-content: center;
}

.array-track { display: flex; gap: 12px; position: relative; padding-top: 10px; }

.array-item-group { display: flex; flex-direction: column; align-items: center; position: relative; width: 46px; z-index: 2; }

.array-box-minimal {
  width: 100%;
  height: 46px;
  border: 1px solid var(--vp-c-border);
  border-radius: 6px;
  display: flex;
  justify-content: center;
  align-items: center;
  font-size: 18px;
  font-family: monospace;
  font-weight: 600;
  color: var(--vp-c-text-1);
  background: var(--vp-c-bg-elv);
  transition: all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
}

/* 🌟 二分查找核心视觉特效 */
/* 1. 被舍弃的无效区间：视觉降噪褪色 */
.is-discarded { 
  opacity: 0.15; 
  transform: scale(0.95);
  border-style: dashed;
}

/* 2. 当前正在判定的中点 (Mid) */
.is-mid {
  border-color: #8b5cf6;
  border-width: 2px;
  box-shadow: 0 0 10px rgba(139, 92, 246, 0.2);
  transform: translateY(-4px);
}

/* 3. 比较后发现不相等 (准备丢弃一半前) */
.is-mismatch {
  border-color: #f59e0b;
  background: rgba(245, 158, 11, 0.1);
  color: #d97706;
}

/* 4. 完美命中 */
.is-match {
  border-color: #10b981;
  background: rgba(16, 185, 129, 0.15);
  color: #10b981;
  font-size: 22px;
  transform: scale(1.1);
  box-shadow: 0 4px 15px rgba(16, 185, 129, 0.3);
}

/* ================= 底部极简指针 ================= */
/* 保证高度充裕，防止 L, M, R 挤在一起顶出盒子 */
.pointer-track { margin-top: 8px; display: flex; flex-direction: column; align-items: center; min-height: 55px; }
.idx { font-size: 11px; color: var(--vp-c-text-3); margin-bottom: 4px; }
.ptr-labels { display: flex; flex-direction: column; gap: 3px; align-items: center; }

.ptr { font-size: 10px; padding: 2px 6px; border-radius: 4px; font-weight: 600; color: white;}
.ptr-left { background: #64748b; }
.ptr-right { background: #0ea5e9; }
.ptr-mid { background: #8b5cf6; animation: popIn 0.3s ease-out forwards; }

@keyframes popIn {
  from { opacity: 0; transform: translateY(-10px); }
  to { opacity: 1; transform: translateY(0); }
}
</style>