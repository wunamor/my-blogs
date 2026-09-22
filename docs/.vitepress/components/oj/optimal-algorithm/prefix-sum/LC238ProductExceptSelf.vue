<template>
  <VisualizerLayout
    title="除自身以外数组的乘积 / 前缀积 × 后缀积 (LeetCode 238)"
    storageKey="lc238-product-except-self-config"
    defaultData="1, 2, 3, 4"
    :defaultInterval="1000"
    :actionButtons="visualizerButtons"
    :steps="steps"
    @calculate="calculateSteps"
  >
    <template #visualization="{ step }">
      <div
        class="product-container"
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
                f[{{ step.bi }}] = f[{{ step.bi - 1 }}] × nums[{{ step.bi - 1 }}]
                <span class="calc-part">
                  => {{ step.f[step.bi - 1].val }} × {{ step.nums[step.bi - 1].val }} =
                  <strong>{{ step.f[step.bi].val !== null ? step.f[step.bi].val : '?' }}</strong>
                </span>
              </template>
              <template v-else-if="step.phase === 'build-g'">
                g[{{ step.bi }}] = g[{{ step.bi + 1 }}] × nums[{{ step.bi + 1 }}]
                <span class="calc-part">
                  => {{ step.g[step.bi + 1].val }} × {{ step.nums[step.bi + 1].val }} =
                  <strong>{{ step.g[step.bi].val !== null ? step.g[step.bi].val : '?' }}</strong>
                </span>
              </template>
              <template v-else-if="step.phase === 'merge' || step.phase === 'done'">
                result[{{ step.mi }}] = f[{{ step.mi }}] × g[{{ step.mi }}]
                <span class="calc-part">
                  => {{ step.f[step.mi].val }} × {{ step.g[step.mi].val }} =
                  <strong class="text-ok">{{ step.result[step.mi].val }}</strong>
                </span>
              </template>
              <template v-else>
                <span class="empty-hint">准备构建前缀积 f 与后缀积 g（乘法单位元为 1）...</span>
              </template>
            </div>
          </div>
        </div>

        <!-- 行 1：原始数组 nums -->
        <div class="array-row">
          <div class="divider">
            <span class="arrow-down">原始数组 nums (0-based)</span>
          </div>

          <div class="array-wrapper">
            <div class="array-track">
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
                <div class="pointer-track ptr-tight">
                  <span class="idx">{{ idx }}</span>
                  <div class="ptr-labels">
                    <span
                      v-if="step.phase === 'merge' && idx === step.mi"
                      class="ptr ptr-mid"
                    >i</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- 行 2：前缀积 f -->
        <div class="array-row">
          <div class="divider">
            <span class="arrow-down">前缀积 f：[0, i-1] 之积</span>
          </div>

          <div class="array-wrapper">
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
                      v-if="step.phase === 'build-f' && idx === step.bi"
                      class="ptr ptr-mid"
                    >i</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- 行 3：后缀积 g -->
        <div class="array-row">
          <div class="divider">
            <span class="arrow-down">后缀积 g：[i+1, n-1] 之积</span>
          </div>

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
                      v-if="step.phase === 'build-g' && idx === step.bi"
                      class="ptr ptr-mid"
                    >i</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- 行 4：答案 result -->
        <div class="array-row">
          <div class="divider">
            <span class="arrow-down">答案 result：f[i] × g[i]</span>
          </div>

          <div class="array-wrapper">
            <div class="array-track">
              <div
                class="array-item-group"
                v-for="(item, idx) in step.result"
                :key="item.id"
              >
                <div
                  class="array-box-minimal"
                  :class="getResultCellClass(step, idx)"
                >
                  {{ item.val !== null ? item.val : '' }}
                </div>
                <div class="pointer-track ptr-tight">
                  <span class="idx">{{ idx }}</span>
                  <div class="ptr-labels">
                    <span
                      v-if="(step.phase === 'merge' || step.phase === 'done') && idx === step.mi"
                      class="ptr ptr-mid"
                    >i</span>
                  </div>
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

  const getPhaseClass = (phase) => {
    if (phase === 'build-f' || phase === 'build-g') return 'is-warning';
    if (phase === 'merge') return 'is-low-zone';
    if (phase === 'done') return 'is-success';
    return '';
  }

  // nums 单元格状态
  const getNumsCellClass = (step, idx) => {
    const cls = {};
    if (step.phase === 'build-f' && idx === step.bi - 1) cls['is-mid'] = true;
    if (step.phase === 'build-g' && idx === step.bi + 1) cls['is-mid'] = true;
    if ((step.phase === 'merge' || step.phase === 'done') && idx === step.mi) cls['is-checking'] = true;
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
    if (step.phase === 'merge' || step.phase === 'done') {
      if (idx === step.mi) cls['is-match'] = true;
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
    if (step.phase === 'merge' || step.phase === 'done') {
      if (idx === step.mi) cls['is-match'] = true;
      else cls['is-discarded'] = true;
    }
    return cls;
  }

  // result 单元格状态
  const getResultCellClass = (step, idx) => {
    const cls = {};
    if (step.result[idx].val === null) cls['is-empty'] = true;
    if (step.phase === 'merge' || step.phase === 'done') {
      if (idx === step.mi) cls['is-mid'] = true;
      else if (step.result[idx].val !== null) cls['is-match'] = true;
    }
    return cls;
  }

  const calculateSteps = (inputRaw) => {
    // 解析格式： nums 逗号分隔，如 1, 2, 3, 4
    steps.value = [];
    const nums = inputRaw.split(',').map(x => parseInt(x.trim())).filter(x => !isNaN(x));
    if (nums.length === 0) return;

    const n = nums.length;
    let passNum = 0;

    const numsObj = nums.map((val, idx) => ({ id: `nums-${idx}`, val }));
    // Java: int[] f = new int[n], g = new int[n]; f[0] = 1, g[n-1] = 1（乘法单位元）
    const fObj = nums.map((_, idx) => ({ id: `f-${idx}`, val: idx === 0 ? 1 : null }));
    const gObj = nums.map((_, idx) => ({ id: `g-${idx}`, val: idx === n - 1 ? 1 : null }));
    const resultObj = nums.map((_, idx) => ({ id: `result-${idx}`, val: null }));
    const fArr = new Array(n).fill(1);
    const gArr = new Array(n).fill(1);

    const pushState = (desc, phase, bi, mi) => {
      steps.value.push({
        nums: JSON.parse(JSON.stringify(numsObj)),
        f: JSON.parse(JSON.stringify(fObj)),
        g: JSON.parse(JSON.stringify(gObj)),
        result: JSON.parse(JSON.stringify(resultObj)),
        phase: phase, // 'init', 'build-f', 'build-g', 'merge', 'done'
        bi, mi,
        description: desc,
        passId: passNum++
      });
    }

    pushState(`【初始化】创建前缀积 f 与后缀积 g。f[0] = 1（下标 0 左侧没有元素，乘法单位元为 1），g[${n - 1}] = 1（最后一个下标右侧没有元素），其余位置等待计算。`, 'init', -1, -1);

    // ================= 阶段 1：正向构建前缀积 f =================
    for (let i = 1; i < n; i++) {
      pushState(`【构建前缀积】计算 f[${i}]：它等于 [0, ${i - 1}] 的累乘积，即 f[${i - 1}] 乘上 nums[${i - 1}]。`, 'build-f', i, -1);

      fArr[i] = fArr[i - 1] * nums[i - 1];
      fObj[i].val = fArr[i];

      pushState(`【存储前缀积】f[${i}] = ${fArr[i]}。`, 'build-f', i, -1);
    }

    // ================= 阶段 2：反向构建后缀积 g =================
    for (let i = n - 2; i >= 0; i--) {
      pushState(`【构建后缀积】计算 g[${i}]：它等于 [${i + 1}, ${n - 1}] 的累乘积，即 g[${i + 1}] 乘上 nums[${i + 1}]。注意方向是从右往左！`, 'build-g', i, -1);

      gArr[i] = gArr[i + 1] * nums[i + 1];
      gObj[i].val = gArr[i];

      pushState(`【存储后缀积】g[${i}] = ${gArr[i]}。`, 'build-g', i, -1);
    }

    // ================= 阶段 3：合并求答案 result[i] = f[i] × g[i] =================
    for (let i = 0; i < n; i++) {
      resultObj[i].val = fArr[i] * gArr[i];
      pushState(`【求积合并】result[${i}] = f[${i}] × g[${i}] = ${fArr[i]} × ${gArr[i]} = ${resultObj[i].val}，正好是除 nums[${i}] 外所有元素的乘积。`, 'merge', -1, i);
    }

    pushState(`【✅ 完成】答案数组 result 全部求出，全程未使用除法，时间复杂度 O(n)！`, 'done', -1, n - 1);
  }
</script>

<style scoped>
  .product-container {
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

  .empty-hint {
    color: var(--vp-c-text-3);
    font-style: italic;
    font-size: 14px;
    font-weight: normal;
  }

  /* ================= 行容器 =================
     移动端：纵向堆叠（分隔线在上，保留原观察习惯）
     桌面端：横向紧凑（标签固定在左，轨道在右，大幅压缩总高度）
  ========================================== */
  .array-row {
    display: flex;
    flex-direction: column;
    align-items: center;
    width: 100%;
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

  .arrow-down::before {
    content: '↓ ';
  }

  .arrow-down::after {
    content: ' ↓';
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

  .is-in-window {
    border-color: transparent;
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

  .is-match {
    border-color: #10b981;
    background: rgba(16, 185, 129, 0.15);
    color: #10b981;
    font-size: 16px;
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

  .pointer-track.ptr-tight {
    min-height: 25px;
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

  /* ================= 🖥️ 桌面端紧凑模式 ================= */
  @media (min-width: 768px) {
    .product-container {
      gap: 10px;
      padding: 8px 0;
    }

    .stat-box {
      padding: 6px 16px;
      min-width: 300px;
    }

    .stat-box .label {
      margin-bottom: 2px;
    }

    .expr-value {
      font-size: 16px;
    }

    .array-row {
      flex-direction: row;
      align-items: flex-start;
      justify-content: center;
      gap: 14px;
    }

    /* 左半标签：取内容自然宽度，右对齐贴向间隙；垂直中心对准数组方块 */
    .divider {
      width: auto;
      flex: 0 0 auto;
      justify-content: flex-end;
      margin-top: 16px;
    }

    .arrow-down {
      font-size: 12px;
      text-align: right;
      line-height: 1.3;
    }

    .arrow-down::before,
    .arrow-down::after {
      content: '';
    }

    /* 右半轨道：按数组实际长度动态占比，左对齐；超长时内部横向滚动 */
    .array-wrapper {
      width: auto;
      flex: 0 1 auto;
      min-width: 0;
      padding: 0;
      justify-content: flex-start;
    }

    .array-track {
      padding-top: 6px;
      padding-bottom: 6px;
    }

    .pointer-track,
    .pointer-track.ptr-tight {
      min-height: 30px;
      margin-top: 4px;
    }
  }
</style>
