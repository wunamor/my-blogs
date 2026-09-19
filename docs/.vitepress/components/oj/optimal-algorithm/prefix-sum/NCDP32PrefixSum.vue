<template>
  <VisualizerLayout
    title="连续子数组和 / 前缀和 (Nowcoder DP32)"
    storageKey="nc-dp32-prefix-sum-config"
    defaultData="1, 2, 4, -1, 2 | 1, 3 | 2, 5"
    :defaultInterval="1200"
    :actionButtons="visualizerButtons"
    :steps="steps"
    @calculate="calculateSteps"
  >
    <template #visualization="{ step }">
      <div
        class="binary-search-container"
        v-if="step && step.arr"
      >

        <!-- 顶部：极致简约面板 -->
        <div class="dashboard-minimal">
          <div
            class="stat-box target-box"
            :class="getPhaseClass(step.phase)"
          >
            <span class="label">核心判定公式 (O(1) 区间求和)</span>
            <div class="value expr-value">
              <template v-if="step.phase === 'build'">
                dp[{{ step.buildI }}] = dp[{{ step.buildI - 1 }}] + arr[{{ step.buildI }}]
                <span style="color: var(--vp-c-text-3); font-weight: normal; margin-left: 8px;">
                  => {{ step.dp[step.buildI - 1].val }} + {{ step.arr[step.buildI - 1].val }} = <strong>{{
                    step.dp[step.buildI].val !== null ? step.dp[step.buildI].val : '?' }}</strong>
                </span>
              </template>
              <template v-else-if="step.phase === 'query'">
                sum({{ step.queryL }}, {{ step.queryR }}) = dp[{{ step.queryR }}] - dp[{{ step.queryL - 1 }}]
                <span style="color: var(--vp-c-text-3); font-weight: normal; margin-left: 8px;">
                  => {{ step.dp[step.queryR].val }} - {{ step.dp[step.queryL - 1].val }} = <strong>{{ step.queryResult
                    !== null ? step.queryResult : '?' }}</strong>
                </span>
              </template>
              <template v-else>
                <span class="empty-hint">准备构建前缀和数组...</span>
              </template>
            </div>
          </div>
        </div>

        <div
          class="divider"
          style="margin-top: 15px;"
        >
          <span class="arrow-down">↓ 原始数组 arr (1-based 索引，供查询参考) ↓</span>
        </div>

        <!-- 原数组主视图 (紧凑模式) -->
        <div
          class="array-wrapper"
          style="padding-bottom: 20px;"
        >
          <div
            class="array-track"
            style="margin-left: 44px;"
          > <!-- 占位对齐 dp[0] -->

            <!-- 🌟 查询区间包裹框 -->
            <div
              class="window-frame-minimal"
              :class="{
                'is-valid-frame': step.phase === 'query' && step.queryResult !== null,
                'is-hidden': step.phase !== 'query'
              }"
              :style="getWindowStyle(step)"
            >
              <div
                class="window-label"
                v-if="step.phase === 'query'"
              >
                Query: [{{ step.queryL }}, {{ step.queryR }}]
              </div>
            </div>

            <div
              class="array-item-group"
              v-for="(item, idx) in step.arr"
              :key="item.id"
            >
              <div
                class="array-box-minimal"
                :class="{
                  'is-in-window': step.phase === 'query' && (idx + 1) >= step.queryL && (idx + 1) <= step.queryR,
                  'is-discarded': step.phase === 'query' && ((idx + 1) < step.queryL || (idx + 1) > step.queryR),
                  'is-mid': step.phase === 'build' && step.buildI === idx + 1,
                  'is-match': step.phase === 'query' && step.queryResult !== null && (idx + 1) >= step.queryL && (idx + 1) <= step.queryR
                }"
              >
                {{ item.val }}
              </div>
              <div
                class="pointer-track"
                style="min-height: 25px;"
              >
                <span class="idx">{{ idx + 1 }}</span>
              </div>
            </div>
          </div>
        </div>

        <div class="divider">
          <span class="arrow-down">↓ 前缀和数组 dp (dp[i] 表示前 i 个元素之和) ↓</span>
        </div>

        <!-- DP 数组主视图 (紧凑模式) -->
        <div class="array-wrapper">
          <div class="array-track">
            <div
              class="array-item-group"
              v-for="(item, idx) in step.dp"
              :key="item.id"
            >
              <div
                class="array-box-minimal"
                :class="{
                  'is-anchor': idx === 0,
                  'is-mid': step.phase === 'build' && (idx === step.buildI || idx === step.buildI - 1),
                  'is-match': step.phase === 'query' && (idx === step.queryL - 1 || idx === step.queryR),
                  'is-discarded': step.phase === 'query' && idx !== step.queryL - 1 && idx !== step.queryR,
                  'is-empty': item.val === null
                }"
              >
                {{ item.val !== null ? item.val : '' }}
              </div>
              <div class="pointer-track">
                <span class="idx">{{ idx }}</span>
                <div class="ptr-labels">
                  <span
                    v-if="step.phase === 'query' && idx === step.queryL - 1"
                    class="ptr ptr-left"
                  >L-1</span>
                  <span
                    v-if="step.phase === 'query' && idx === step.queryR"
                    class="ptr ptr-right"
                  >R</span>
                  <span
                    v-if="step.phase === 'build' && idx === step.buildI"
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

  // 🌟 为查询区间定制的框计算（绑定在原数组上）
  const getWindowStyle = (step) => {
    if (step.phase !== 'query') return { width: '0px', opacity: 0 }
    const STRIDE = 36; // 紧凑模式：宽28 + 间距8
    const PADDING = 4;
    // 1-based 转为 0-based 偏移
    const leftPos = (step.queryL - 1) * STRIDE - PADDING;
    const count = step.queryR - step.queryL + 1;
    const width = count * STRIDE - 8 + (PADDING * 2);

    return {
      left: `${leftPos}px`,
      width: `${width}px`,
      opacity: 1
    }
  }

  const getPhaseClass = (phase) => {
    if (phase === 'build') return 'is-warning';
    if (phase === 'query') return 'is-low-zone';
    return '';
  }

  const calculateSteps = (inputRaw) => {
    // 解析格式： 数组 | 查询1 | 查询2 ...
    const parts = inputRaw.split('|').map(s => s.trim());
    if (parts.length === 0) { steps.value = []; return; }

    let arr = parts[0].split(',').map(n => parseInt(n.trim())).filter(n => !isNaN(n));
    if (arr.length === 0) { steps.value = []; return; }

    let queries = [];
    for (let i = 1; i < parts.length; i++) {
      let q = parts[i].split(',').map(n => parseInt(n.trim())).filter(n => !isNaN(n));
      if (q.length === 2) queries.push(q);
    }

    steps.value = [];
    let passNum = 0;
    let len = arr.length;

    const arrayObj = arr.map((val, idx) => ({ id: `arr-${idx}`, val: val }));
    let dpObj = Array(len + 1).fill(null).map((_, idx) => ({ id: `dp-${idx}`, val: null }));

    // Java代码：long[] dp = new long[len + 1]; (自动初始化为0)
    dpObj[0].val = 0;

    const pushState = (desc, phase, buildI, qL, qR, res) => {
      steps.value.push({
        arr: JSON.parse(JSON.stringify(arrayObj)),
        dp: JSON.parse(JSON.stringify(dpObj)),
        phase: phase, // 'pending', 'build', 'query'
        buildI: buildI,
        queryL: qL,
        queryR: qR,
        queryResult: res,
        description: desc,
        passId: passNum++
      });
    }

    pushState(`【初始化】创建长度为 ${len + 1} 的前缀和数组 dp。首位 dp[0] 初始化为 0，这能完美规避后续查询时的越界判断。`, 'pending', -1, -1, -1, null);

    // ================= 阶段 1：构建前缀和数组 =================
    let dpArr = new Array(len + 1).fill(0);
    for (let i = 1; i <= len; i++) {
      pushState(`【计算前缀和】计算前 ${i} 个元素的累加和：准备读取 dp[${i - 1}] 和 arr[${i}] (1-based)。`, 'build', i, -1, -1, null);

      dpArr[i] = dpArr[i - 1] + arr[i - 1];
      dpObj[i].val = dpArr[i];

      pushState(`【存储前缀和】累加完成！dp[${i}] = ${dpArr[i]}。`, 'build', i, -1, -1, null);
    }

    // ================= 阶段 2：执行 O(1) 查询 =================
    if (queries.length === 0) {
      pushState(`【结束】前缀和数组构建完毕，未提供查询数据。`, 'pending', -1, -1, -1, null);
      return;
    }

    for (let q = 0; q < queries.length; q++) {
      let [L, R] = queries[q];
      // 防御性越界限制
      if (L < 1) L = 1;
      if (R > len) R = len;
      if (L > R) continue;

      pushState(`【发起查询】要求得原数组中第 ${L} 到第 ${R} 个元素的总和。根据公式，直接寻找 dp[${R}] 与 dp[${L - 1}]。`, 'query', -1, L, R, null);

      let sum = dpArr[R] - dpArr[L - 1];
      pushState(`【✅ O(1) 求解】通过前缀和相减：dp[${R}] - dp[${L - 1}] = ${sum}。瞬间得到结果，时间复杂度 O(1)！`, 'query', -1, L, R, sum);
    }
  }
</script>

<style scoped>
  .binary-search-container {
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

  .expr-value {
    font-family: monospace;
    font-size: 18px;
    display: flex;
    align-items: center;
    gap: 4px;
    font-weight: bold;
    color: var(--vp-c-text-1);
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
  }

  /* 🌟 查询区间包裹框 */
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
    color: #38bdf8;
    font-size: 11px;
    font-weight: bold;
    white-space: nowrap;
    transition: opacity 0.3s;
  }

  .array-item-group {
    display: flex;
    flex-direction: column;
    align-items: center;
    position: relative;
    width: 28px;
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

  /* 视觉特效 */
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