<template>
  <VisualizerLayout
    title="寻找数组的中心下标 / 前缀和 × 后缀和 (LeetCode 724)"
    storageKey="lc724-pivot-index-config"
    defaultData="1, 7, 3, 6, 5, 6"
    :defaultInterval="1000"
    :actionButtons="visualizerButtons"
    :steps="steps"
    @calculate="calculateSteps"
  >
    <template #visualization="{ step }">
      <div
        class="pivot-container"
        v-if="step && step.nums"
      >

        <!-- 顶部：极致简约面板 -->
        <div class="dashboard-minimal">
          <div
            class="stat-box target-box"
            :class="getPhaseClass(step.phase)"
          >
            <span class="label">核心判定公式</span>
            <div class="value expr-value">
              <template v-if="step.phase === 'build-f'">
                f[{{ step.bi }}] = f[{{ step.bi - 1 }}] + nums[{{ step.bi - 1 }}]
                <span class="calc-part">
                  => {{ step.f[step.bi - 1].val }} + {{ step.nums[step.bi - 1].val }} =
                  <strong>{{ step.f[step.bi].val !== null ? step.f[step.bi].val : '?' }}</strong>
                </span>
              </template>
              <template v-else-if="step.phase === 'build-g'">
                g[{{ step.bi }}] = g[{{ step.bi + 1 }}] + nums[{{ step.bi + 1 }}]
                <span class="calc-part">
                  => {{ step.g[step.bi + 1].val }} + {{ step.nums[step.bi + 1].val }} =
                  <strong>{{ step.g[step.bi].val !== null ? step.g[step.bi].val : '?' }}</strong>
                </span>
              </template>
              <template v-else-if="step.phase === 'check'">
                f[{{ step.ci }}] == g[{{ step.ci }}] ?
                <span class="calc-part">
                  => {{ step.f[step.ci].val }} == {{ step.g[step.ci].val }} →
                  <strong :class="step.checkOk ? 'text-ok' : 'text-no'">{{ step.checkOk ? '✅ 成立' : '❌ 不成立' }}</strong>
                </span>
              </template>
              <template v-else-if="step.phase === 'done'">
                <template v-if="step.pivot !== -1">
                  中心下标 = <strong class="text-ok">{{ step.pivot }}</strong>
                </template>
                <template v-else>
                  遍历结束仍不相等，返回 <strong class="text-no">-1</strong>
                </template>
              </template>
              <template v-else>
                <span class="empty-hint">准备构建前缀和 f 与后缀和 g...</span>
              </template>
            </div>
          </div>
        </div>

        <div
          class="divider"
          style="margin-top: 15px;"
        >
          <span class="arrow-down">↓ 原始数组 nums (0-based 下标) ↓</span>
        </div>

        <!-- 原数组主视图 (紧凑模式) -->
        <div
          class="array-wrapper"
          style="padding-bottom: 20px;"
        >
          <div class="array-track">

            <!-- 🌟 左区间 [0, i-1] 包裹框 -->
            <div
              class="window-frame-minimal frame-left"
              :class="{ 'is-hidden': step.phase !== 'check' }"
              :style="getRegionStyle(step, 'left')"
            ></div>
            <!-- 🌟 右区间 [i+1, n-1] 包裹框 -->
            <div
              class="window-frame-minimal frame-right"
              :class="{ 'is-hidden': step.phase !== 'check' }"
              :style="getRegionStyle(step, 'right')"
            ></div>

            <div
              class="array-item-group"
              v-for="(item, idx) in step.nums"
              :key="item.id"
            >
              <div
                class="array-box-minimal"
                :class="getNumsCellClass(step, idx)"
              >
                {{ item.val }}
              </div>
              <div
                class="pointer-track"
                style="min-height: 25px;"
              >
                <span class="idx">{{ idx }}</span>
                <div class="ptr-labels">
                  <span
                    v-if="step.phase === 'check' && idx === step.ci"
                    class="ptr ptr-mid"
                  >i</span>
                  <span
                    v-if="step.phase === 'done' && idx === step.pivot"
                    class="ptr ptr-left"
                    style="background: #10b981;"
                  >答案</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div class="divider">
          <span class="arrow-down">↓ 前缀和数组 f (f[i] = [0, i-1] 区间之和) ↓</span>
        </div>

        <!-- f 数组视图 -->
        <div
          class="array-wrapper"
          style="padding-bottom: 20px;"
        >
          <div class="array-track">
            <div
              class="array-item-group"
              v-for="(item, idx) in step.f"
              :key="item.id"
            >
              <div
                class="array-box-minimal"
                :class="getFCellClass(step, idx)"
              >
                {{ item.val !== null ? item.val : '' }}
              </div>
              <div class="pointer-track">
                <span class="idx">{{ idx }}</span>
                <div class="ptr-labels">
                  <span
                    v-if="(step.phase === 'build-f' || step.phase === 'build-g') && idx === step.bi"
                    class="ptr ptr-mid"
                  >i</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div class="divider">
          <span class="arrow-down">↓ 后缀和数组 g (g[i] = [i+1, n-1] 区间之和) ↓</span>
        </div>

        <!-- g 数组视图 -->
        <div class="array-wrapper">
          <div class="array-track">
            <div
              class="array-item-group"
              v-for="(item, idx) in step.g"
              :key="item.id"
            >
              <div
                class="array-box-minimal"
                :class="getGCellClass(step, idx)"
              >
                {{ item.val !== null ? item.val : '' }}
              </div>
              <div class="pointer-track">
                <span class="idx">{{ idx }}</span>
                <div class="ptr-labels">
                  <span
                    v-if="(step.phase === 'build-f' || step.phase === 'build-g') && idx === step.bi"
                    class="ptr ptr-mid"
                  >i</span>
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

  // 🌟 左右区间包裹框计算（绑定在 nums 轨道上）
  const getRegionStyle = (step, side) => {
    if (step.phase !== 'check') return { width: '0px', opacity: 0 }
    const STRIDE = 36; // 紧凑模式：宽28 + 间距8
    const PADDING = 4;
    const last = step.nums.length - 1;
    const l = side === 'left' ? 0 : step.ci + 1;
    const r = side === 'left' ? step.ci - 1 : last;
    if (l > r) return { width: '0px', opacity: 0 };

    const leftPos = l * STRIDE - PADDING;
    const width = (r - l + 1) * STRIDE - 8 + (PADDING * 2);

    return {
      left: `${leftPos}px`,
      width: `${width}px`,
      opacity: 1
    }
  }

  const getPhaseClass = (phase) => {
    if (phase === 'build-f' || phase === 'build-g') return 'is-warning';
    if (phase === 'check') return 'is-low-zone';
    if (phase === 'done') return 'is-success';
    return '';
  }

  // nums 单元格状态
  const getNumsCellClass = (step, idx) => {
    const cls = {};
    if (step.phase === 'build-f' && idx === step.bi - 1) cls['is-mid'] = true;
    if (step.phase === 'build-g' && idx === step.bi + 1) cls['is-mid'] = true;
    if (step.phase === 'check' && idx === step.ci) cls['is-checking'] = true;
    if (step.phase === 'done' && idx === step.pivot) cls['is-match'] = true;
    return cls;
  }

  // f 单元格状态
  const getFCellClass = (step, idx) => {
    const cls = {};
    if (idx === 0) cls['is-anchor'] = true;
    if (step.phase === 'build-f') {
      if (idx === step.bi) cls['is-mid'] = true;
      else if (idx === step.bi - 1) cls['is-checking'] = true;
      else if (step.f[idx].val === null) cls['is-empty'] = true;
    } else if (step.f[idx].val === null) {
      cls['is-empty'] = true;
    }
    if (step.phase === 'check') {
      if (idx === step.ci) cls[step.checkOk ? 'is-match' : 'is-mismatch'] = true;
      else cls['is-discarded'] = true;
    }
    if (step.phase === 'done') {
      if (idx === step.pivot) cls['is-match'] = true;
      else cls['is-discarded'] = true;
    }
    return cls;
  }

  // g 单元格状态
  const getGCellClass = (step, idx) => {
    const cls = {};
    if (idx === step.g.length - 1) cls['is-anchor'] = true;
    if (step.phase === 'build-g') {
      if (idx === step.bi) cls['is-mid'] = true;
      else if (idx === step.bi + 1) cls['is-checking'] = true;
      else if (step.g[idx].val === null) cls['is-empty'] = true;
    } else if (step.g[idx].val === null) {
      cls['is-empty'] = true;
    }
    if (step.phase === 'check') {
      if (idx === step.ci) cls[step.checkOk ? 'is-match' : 'is-mismatch'] = true;
      else cls['is-discarded'] = true;
    }
    if (step.phase === 'done') {
      if (idx === step.pivot) cls['is-match'] = true;
      else cls['is-discarded'] = true;
    }
    return cls;
  }

  const calculateSteps = (inputRaw) => {
    // 解析格式： nums 逗号分隔，如 1, 7, 3, 6, 5, 6
    steps.value = [];
    const nums = inputRaw.split(',').map(x => parseInt(x.trim())).filter(x => !isNaN(x));
    if (nums.length === 0) return;

    const n = nums.length;
    let passNum = 0;

    const numsObj = nums.map((val, idx) => ({ id: `nums-${idx}`, val }));
    // Java: int[] f = new int[n], g = new int[n]; 自动初始化为 0
    // 可视化上：f[0] 与 g[n-1] 天然已知为 0，其余逐步计算
    const fObj = nums.map((_, idx) => ({ id: `f-${idx}`, val: idx === 0 ? 0 : null }));
    const gObj = nums.map((_, idx) => ({ id: `g-${idx}`, val: idx === n - 1 ? 0 : null }));
    const fArr = new Array(n).fill(0);
    const gArr = new Array(n).fill(0);

    const pushState = (desc, phase, bi, ci, ok, pivot) => {
      steps.value.push({
        nums: JSON.parse(JSON.stringify(numsObj)),
        f: JSON.parse(JSON.stringify(fObj)),
        g: JSON.parse(JSON.stringify(gObj)),
        phase: phase, // 'init', 'build-f', 'build-g', 'check', 'done'
        bi, ci,
        checkOk: ok,
        pivot: pivot,
        description: desc,
        passId: passNum++
      });
    }

    pushState(`【初始化】创建与前缀和数组 f、后缀和数组 g。f[0] = 0（下标 0 左侧没有元素），g[${n - 1}] = 0（最后一个下标右侧没有元素），其余位置等待计算。`, 'init', -1, -1, null, -1);

    // ================= 阶段 1：正向构建前缀和 f =================
    for (let i = 1; i < n; i++) {
      pushState(`【构建前缀和】计算 f[${i}]：它等于 [0, ${i - 1}] 的累加和，即 f[${i - 1}] 补上 nums[${i - 1}]。`, 'build-f', i, -1, null, -1);

      fArr[i] = fArr[i - 1] + nums[i - 1];
      fObj[i].val = fArr[i];

      pushState(`【存储前缀和】f[${i}] = ${fArr[i]}。`, 'build-f', i, -1, null, -1);
    }

    // ================= 阶段 2：反向构建后缀和 g =================
    for (let i = n - 2; i >= 0; i--) {
      pushState(`【构建后缀和】计算 g[${i}]：它等于 [${i + 1}, ${n - 1}] 的累加和，即 g[${i + 1}] 补上 nums[${i + 1}]。注意方向是从右往左！`, 'build-g', i, -1, null, -1);

      gArr[i] = gArr[i + 1] + nums[i + 1];
      gObj[i].val = gArr[i];

      pushState(`【存储后缀和】g[${i}] = ${gArr[i]}。`, 'build-g', i, -1, null, -1);
    }

    // ================= 阶段 3：逐位比较 f[i] == g[i] =================
    for (let i = 0; i < n; i++) {
      const ok = fArr[i] === gArr[i];
      if (ok) {
        pushState(`【✅ 找到中心下标】f[${i}] = ${fArr[i]} 与 g[${i}] = ${gArr[i]} 相等！左侧和与右侧和完全平衡，直接返回下标 ${i}。`, 'done', -1, i, true, i);
        return;
      }
      pushState(`【比较】f[${i}] = ${fArr[i]} ≠ g[${i}] = ${gArr[i]}，下标 ${i} 不是中心下标，继续向右检查。`, 'check', -1, i, false, -1);
    }

    pushState(`【结束】所有下标都比较完毕，不存在 f[i] == g[i] 的位置，返回 -1。`, 'done', -1, -1, null, -1);
  }
</script>

<style scoped>
  .pivot-container {
    display: flex;
    flex-direction: column;
    align-items: center;
    width: 100%;
    padding: 10px 0;
    gap: 15px;
  }

  .dashboard-minimal {
    display: flex;
    gap: 16px;
    width: 100%;
    justify-content: center;
  }

  /* 核心盒子 */
  .stat-box {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    background-color: var(--vp-c-bg-elv);
    border: 1px solid var(--vp-c-border);
    padding: 10px 20px;
    border-radius: 8px;
    min-width: 320px;
    transition: all 0.3s;
  }

  .stat-box .label {
    font-size: 12px;
    color: var(--vp-c-text-2);
    margin-bottom: 6px;
    font-weight: bold;
  }

  .stat-box.is-warning {
    border-color: #8b5cf6;
    background-color: rgba(139, 92, 246, 0.05);
  }

  .stat-box.is-low-zone {
    border-color: #0ea5e9;
    background-color: rgba(14, 165, 233, 0.05);
  }

  .stat-box.is-success {
    border-color: #10b981;
    background-color: rgba(16, 185, 129, 0.05);
  }

  .expr-value {
    font-family: monospace;
    font-size: 18px;
    display: flex;
    align-items: center;
    gap: 4px;
    font-weight: bold;
    color: var(--vp-c-text-1);
  }

  .calc-part {
    color: var(--vp-c-text-3);
    font-weight: normal;
    margin-left: 8px;
  }

  .text-ok {
    color: #10b981;
  }

  .text-no {
    color: #ef4444;
  }

  .empty-hint {
    color: var(--vp-c-text-3);
    font-style: italic;
    font-size: 14px;
    font-weight: normal;
  }

  .divider {
    display: flex;
    justify-content: center;
    width: 100%;
    margin-top: -5px;
  }

  .arrow-down {
    font-size: 13px;
    color: var(--vp-c-text-3);
  }

  /* ================= 数组与视觉排版 (紧凑模式) ================= */
  .array-wrapper {
    width: 100%;
    overflow-x: auto;
    overflow-y: hidden;
    padding: 0 20px 25px 20px;
    background-color: transparent;
    display: flex;
    justify-content: center;
  }

  .array-track {
    display: flex;
    gap: 8px;
    position: relative;
    padding-top: 10px;
    flex-wrap: nowrap;
  }

  /* 🌟 左右区间包裹框 */
  .window-frame-minimal {
    position: absolute;
    top: 6px;
    height: 44px;
    border-radius: 6px;
    z-index: 1;
    pointer-events: none;
    transition: all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
  }

  .window-frame-minimal.frame-left {
    background: rgba(14, 165, 233, 0.05);
    border: 1.5px solid #38bdf8;
  }

  .window-frame-minimal.frame-right {
    background: rgba(249, 115, 22, 0.05);
    border: 1.5px solid #f97316;
  }

  .window-frame-minimal.is-hidden {
    opacity: 0;
  }

  .array-item-group {
    display: flex;
    flex-direction: column;
    align-items: center;
    position: relative;
    width: 28px;
    flex-shrink: 0;
    z-index: 2;
  }

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

  /* 视觉特效 (状态语义字典) */
  .is-empty {
    border-style: dashed;
    color: var(--vp-c-text-3);
  }

  .is-anchor {
    border-color: #f97316;
    color: #f97316;
    background: rgba(249, 115, 22, 0.1);
  }

  .is-discarded {
    opacity: 0.2;
    transform: scale(0.9);
  }

  .is-checking {
    border-color: #8b5cf6;
    color: #8b5cf6;
    animation: pulseCheck 0.9s ease-in-out infinite;
  }

  .is-mid {
    border-color: #8b5cf6;
    border-width: 2px;
    box-shadow: 0 0 10px rgba(139, 92, 246, 0.2);
    transform: translateY(-4px);
  }

  .is-mismatch {
    border-color: #ef4444;
    background: rgba(239, 68, 68, 0.08);
    color: #ef4444;
  }

  .is-match {
    border-color: #10b981;
    background: rgba(16, 185, 129, 0.15);
    color: #10b981;
    font-size: 16px;
    transform: scale(1.1);
    box-shadow: 0 4px 15px rgba(16, 185, 129, 0.2);
  }

  /* 底部指针与索引 */
  .pointer-track {
    margin-top: 6px;
    display: flex;
    flex-direction: column;
    align-items: center;
    min-height: 55px;
  }

  .idx {
    font-size: 10px;
    color: var(--vp-c-text-3);
    margin-bottom: 4px;
    font-weight: bold;
  }

  .ptr-labels {
    display: flex;
    flex-direction: column;
    gap: 2px;
    align-items: center;
  }

  .ptr {
    font-size: 9px;
    padding: 1px 4px;
    border-radius: 3px;
    font-weight: 600;
    color: white;
  }

  .ptr-left {
    background: #64748b;
  }

  .ptr-right {
    background: #0ea5e9;
  }

  .ptr-mid {
    background: #8b5cf6;
    animation: popIn 0.3s ease-out forwards;
  }

  @keyframes pulseCheck {
    0%, 100% {
      box-shadow: 0 0 0 rgba(139, 92, 246, 0);
    }

    50% {
      box-shadow: 0 0 12px rgba(139, 92, 246, 0.45);
    }
  }

  @keyframes popIn {
    from {
      opacity: 0;
      transform: translateY(-10px);
    }

    to {
      opacity: 1;
      transform: translateY(0);
    }
  }
</style>
