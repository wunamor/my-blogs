<template>
  <VisualizerLayout
    title="查找元素的起始和结束位置 (LeetCode 34) - 左右边界逼近"
    storageKey="lc34-search-range-config"
    defaultData="8 | 5, 7, 7, 8, 8, 10"
    :defaultInterval="1200"
    :actionButtons="visualizerButtons"
    :steps="steps"
    @calculate="calculateSteps"
  >
    <template #visualization="{ step }">
      <div class="binary-search-container" v-if="step && step.array">
        
        <!-- 顶部：阶段与搜索状态面板 -->
        <div class="dashboard-minimal">
          
          <!-- 核心：阶段指示器 -->
          <div class="stat-box phase-box" :class="step.phase">
            <span class="label">当前搜索阶段 (Phase)</span>
            <div class="value">
              <span v-if="step.phase === 'left-bound'">🔍 阶段一：求左边界</span>
              <span v-else-if="step.phase === 'right-bound'">🔍 阶段二：求右边界</span>
              <span v-else>🏁 搜索完成</span>
            </div>
          </div>

          <div class="hash-compare-panel">
            <div class="panel-header">
              <span class="label">当前区间 [Left, Right] 与 目标 Target: {{ step.target }}</span>
            </div>
            
            <div class="pointers-info">
              <div class="ptr-info-item">
                <span class="ptr-badge bg-left">L</span> 
                <span class="val">idx: {{ step.leftIdx }}</span>
              </div>
              <div class="ptr-info-item" :class="{'is-highlight-mid': step.status === 'calc-mid'}">
                <span class="ptr-badge bg-mid">M</span> 
                <span class="val">
                  idx: {{ step.midIdx === -1 ? '?' : step.midIdx }} 
                  <!-- 💡 核心细节展示：计算公式的区别 -->
                  <span class="calc-hint" v-if="step.status === 'calc-mid' && step.phase === 'left-bound'">(向下取整 ⬇)</span>
                  <span class="calc-hint" v-if="step.status === 'calc-mid' && step.phase === 'right-bound'">(向上取整 ⬆)</span>
                </span>
              </div>
              <div class="ptr-info-item">
                <span class="ptr-badge bg-right">R</span> 
                <span class="val">idx: {{ step.rightIdx }}</span>
              </div>
            </div>
          </div>

          <div class="stat-box highlight-box" :class="{'is-success': step.phase === 'done'}">
            <span class="label">返回结果 [ret]</span>
            <div class="value">[{{ step.ret[0] }}, {{ step.ret[1] }}]</div>
          </div>
        </div>

        <div class="divider">
          <span class="arrow-down">↓ 逼近策略：左边界不断向左挤压 (right=mid)，右边界不断向右挤压 (left=mid) ↓</span>
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
                  'is-discarded': step.phase !== 'done' && (idx < step.leftIdx || idx > step.rightIdx),
                  'is-mid': idx === step.midIdx && step.phase !== 'done',
                  'is-mismatch': idx === step.midIdx && step.status.startsWith('search-'),
                  'is-result-range': step.phase === 'done' && step.ret[0] !== -1 && idx >= step.ret[0] && idx <= step.ret[1]
                }"
              >
                {{ item.val }}
              </div>
              
              <!-- 底部极简指针：重叠时自动垂直排列 -->
              <div class="pointer-track">
                <span class="idx">{{ idx }}</span>
                <div class="ptr-labels">
                  <span v-if="step.midIdx === idx && step.phase !== 'done'" class="ptr ptr-mid">M</span>
                  <span v-if="step.leftIdx === idx && step.phase !== 'done'" class="ptr ptr-left">L</span>
                  <span v-if="step.rightIdx === idx && step.phase !== 'done'" class="ptr ptr-right">R</span>
                  <!-- 结果标签 -->
                  <span v-if="step.phase === 'done' && idx === step.ret[0]" class="ptr ptr-res">首</span>
                  <span v-if="step.phase === 'done' && idx === step.ret[1] && step.ret[0] !== step.ret[1]" class="ptr ptr-res">尾</span>
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

const calculateSteps = (inputRaw) => {
  let target = 8;
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
  const arrayObj = arr.map((val, idx) => ({ id: `idx-${idx}`, val }));

  const pushState = (desc, phase, l, r, m, retArray, stat) => {
    steps.value.push({
      array: JSON.parse(JSON.stringify(arrayObj)),
      target: target,
      phase: phase, // 'left-bound', 'right-bound', 'done'
      leftIdx: l,
      rightIdx: r,
      midIdx: m,
      ret: [...retArray],
      status: stat, 
      description: desc,
      passId: passNum++ 
    });
  }

  let ret = [-1, -1];
  pushState(`【初始化】目标 Target = ${target}。由于 while(left < right) 的判定条件，当 left == right 时区间会收缩成一个点并直接跳出循环，无需再做无谓的切分。`, 'left-bound', 0, n - 1, -1, ret, 'pending');

  // ================= 阶段一：求左边界 =================
  let left = 0, right = n - 1;
  while (left < right) {
    // Math.floor 相当于 Java 里的整除，即向下取整
    let mid = left + Math.floor((right - left) / 2);
    pushState(`【计算中点 (偏左)】mid = left + (right - left) / 2 = ${mid}。注意这里向下取整，当只剩 2 个元素时，M 会落在 L 上，防止死循环。`, 'left-bound', left, right, mid, ret, 'calc-mid');

    let midVal = arr[mid];
    if (midVal < target) {
      pushState(`【比较】nums[mid] (${midVal}) < target (${target})。中点严格小于目标，左边界必然在 mid 右侧，执行 left = mid + 1。`, 'left-bound', left, right, mid, ret, 'search-right');
      left = mid + 1;
    } else {
      pushState(`【逼近左边界】nums[mid] (${midVal}) >= target (${target})。中点可能就是目标，或者目标在更左侧。我们不能舍弃 mid，执行 right = mid 进行左边界挤压。`, 'left-bound', left, right, mid, ret, 'search-left');
      right = mid;
    }
  }

  // 后置判断
  if (arr[left] === target) {
    ret[0] = left;
    pushState(`【左边界锁定】循环结束 (L == R == ${left})。验证 nums[left] == target 成立！成功找到左边界。`, 'left-bound', left, right, -1, ret, 'found');
  } else {
    pushState(`【未找到】循环结束 (L == R == ${left})。验证 nums[left] != target，说明数组中不存在目标元素，直接退出。`, 'done', left, right, -1, ret, 'not-found');
    return; // 提前结束
  }

  // ================= 阶段二：求右端点 =================
  pushState(`【开启阶段二】开始寻找右边界。重置 left = 0, right = ${n - 1}。`, 'right-bound', 0, n - 1, -1, ret, 'pending');
  left = 0;
  right = n - 1;

  while (left < right) {
    // (right - left + 1) / 2 相当于向上取整
    let mid = left + Math.floor((right - left + 1) / 2);
    pushState(`【计算中点 (偏右)】mid = left + (right - left + 1) / 2 = ${mid}。💡 关键点：这里必须 +1 向上取整！因为代码中有 left = mid，如果不向上取整，只剩2个元素时 M 永远等于 L，会导致死循环！`, 'right-bound', left, right, mid, ret, 'calc-mid');

    let midVal = arr[mid];
    if (midVal <= target) {
      pushState(`【逼近右边界】nums[mid] (${midVal}) <= target (${target})。中点可能是目标，或者目标在更右侧。不舍弃 mid，执行 left = mid 进行右边界挤压。`, 'right-bound', left, right, mid, ret, 'search-right');
      left = mid;
    } else {
      // nums[mid] > target
      pushState(`【比较】nums[mid] (${midVal}) > target (${target})。中点严格大于目标，右边界必然在 mid 左侧，执行 right = mid - 1。`, 'right-bound', left, right, mid, ret, 'search-left');
      right = mid - 1;
    }
  }

  if (arr[left] === target) {
    ret[1] = left;
    pushState(`【右边界锁定】循环结束 (L == R == ${left})。验证 nums[left] == target 成立！右边界也成功锁定。`, 'right-bound', left, right, -1, ret, 'found');
  }

  pushState(`🏁 算法执行完毕！成功定位目标的起始和结束位置区间：[${ret[0]}, ${ret[1]}]。`, 'done', left, right, -1, ret, 'done');
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

/* 阶段指示器 */
.phase-box {
  border-color: var(--vp-c-border);
  background-color: var(--vp-c-bg-elv);
  transition: all 0.3s;
}
.phase-box.left-bound { border-color: #0ea5e9; background-color: rgba(14, 165, 233, 0.05); }
.phase-box.left-bound .value { color: #0ea5e9; }
.phase-box.right-bound { border-color: #f59e0b; background-color: rgba(245, 158, 11, 0.05); }
.phase-box.right-bound .value { color: #f59e0b; }
.phase-box.done { border-color: #10b981; background-color: rgba(16, 185, 129, 0.05); }
.phase-box.done .value { color: #10b981; }

.hash-compare-panel {
  display: flex;
  flex-direction: column;
  background-color: var(--vp-c-bg-elv);
  border: 1px solid var(--vp-c-border);
  padding: 12px 20px;
  border-radius: 8px;
  min-width: 360px;
}
.panel-header {
  display: flex;
  justify-content: center;
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

/* 统计盒子 UI */
.stat-box { display: flex; flex-direction: column; align-items: center; justify-content: center; background-color: var(--vp-c-bg-elv); border: 1px solid var(--vp-c-border); padding: 10px 20px; border-radius: 8px; min-width: 140px; }
.stat-box.highlight-box { border-style: dashed; }
.stat-box.highlight-box.is-success { border-color: #10b981; background-color: rgba(16, 185, 129, 0.08); border-style: solid; }
.stat-box.highlight-box.is-success .value { color: #10b981; }

.stat-box .label { font-size: 12px; color: var(--vp-c-text-2); margin-bottom: 6px; font-weight: bold; }
.stat-box .value { font-size: 20px; font-weight: 700; color: var(--vp-c-text-1); line-height: 1; transition: color 0.3s; }

.divider { display: flex; justify-content: center; width: 100%; margin-top: 5px; }
.arrow-down { font-size: 13px; color: var(--vp-c-text-3); }

/* ================= 数组与视觉排版 ================= */
.array-wrapper {
  width: 100%;
  overflow-x: auto;
  overflow-y: hidden; 
  padding: 30px 20px 60px 20px; 
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

/* 视觉特效 */
.is-discarded { opacity: 0.15; transform: scale(0.95); border-style: dashed; }
.is-mid { border-color: #8b5cf6; border-width: 2px; box-shadow: 0 0 10px rgba(139, 92, 246, 0.2); transform: translateY(-4px); }
.is-mismatch { border-color: #f59e0b; background: rgba(245, 158, 11, 0.1); color: #d97706; }

/* 最终锁定区间高亮 */
.is-result-range {
  border-color: #10b981;
  background: rgba(16, 185, 129, 0.15);
  color: #10b981;
  font-size: 22px;
  transform: scale(1.05);
  box-shadow: 0 4px 15px rgba(16, 185, 129, 0.2);
}

/* 底部指针 */
.pointer-track { margin-top: 8px; display: flex; flex-direction: column; align-items: center; min-height: 55px; }
.idx { font-size: 11px; color: var(--vp-c-text-3); margin-bottom: 4px; }
.ptr-labels { display: flex; flex-direction: column; gap: 3px; align-items: center; }

.ptr { font-size: 10px; padding: 2px 6px; border-radius: 4px; font-weight: 600; color: white;}
.ptr-left { background: #64748b; }
.ptr-right { background: #0ea5e9; }
.ptr-mid { background: #8b5cf6; animation: popIn 0.3s ease-out forwards; }
.ptr-res { background: #10b981; }

@keyframes popIn {
  from { opacity: 0; transform: translateY(-10px); }
  to { opacity: 1; transform: translateY(0); }
}
</style>