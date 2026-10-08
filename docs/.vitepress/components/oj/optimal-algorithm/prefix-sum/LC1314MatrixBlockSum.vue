<template>
  <VisualizerLayout
    title="矩阵区域和 / 二维前缀和 + 边界钳制 (LeetCode 1314)"
    storageKey="lc1314-matrix-block-sum-config"
    defaultData="1, 2, 3; 4, 5, 6; 7, 8, 9 | 1"
    :inputs="visualizerInputs"
    :defaultInterval="1200"
    :actionButtons="visualizerButtons"
    :steps="steps"
    @calculate="calculateSteps"
  >
    <template #visualization="{ step }">
      <div
        class="blocksum-container"
        v-if="step && step.mat && step.mat.length"
      >

        <!-- 顶部：极致简约面板 -->
        <div class="dashboard-minimal">
          <div
            class="stat-box target-box"
            :class="getPhaseClass(step.phase)"
          >
            <span class="label">核心判定公式</span>
            <div class="value expr-value">
              <template v-if="step.phase === 'build'">
                dp[{{ step.bi }}][{{ step.bj }}] = dp[{{ step.bi - 1 }}][{{ step.bj }}] + dp[{{ step.bi }}][{{ step.bj - 1 }}]
                - dp[{{ step.bi - 1 }}][{{ step.bj - 1 }}] + mat[{{ step.bi - 1 }}][{{ step.bj - 1 }}]
                <span class="calc-part">
                  => {{ step.dp[step.bi - 1][step.bj].val }} + {{ step.dp[step.bi][step.bj - 1].val }} -
                  {{ step.dp[step.bi - 1][step.bj - 1].val }} + {{ step.mat[step.bi - 1][step.bj - 1].val }} =
                  <strong>{{ step.dp[step.bi][step.bj].val }}</strong>
                </span>
              </template>
              <template v-else-if="step.phase === 'query'">
                result[{{ step.qi }}][{{ step.qj }}] = dp[x2][y2] - dp[x2][y1-1] - dp[x1-1][y2] + dp[x1-1][y1-1]
                <span class="calc-part">
                  => {{ step.dp[step.x2][step.y2].val }} - {{ step.dp[step.x2][step.y1 - 1].val }} -
                  {{ step.dp[step.x1 - 1][step.y2].val }} + {{ step.dp[step.x1 - 1][step.y1 - 1].val }} =
                  <strong class="text-ok">{{ step.queryResult }}</strong>
                </span>
              </template>
              <template v-else-if="step.phase === 'done'">
                <span class="empty-hint">result 矩阵已全部填充完毕</span>
              </template>
              <template v-else>
                <span class="empty-hint">准备构建二维前缀和 dp（下标从 1 开始，第 0 行/列置 0）...</span>
              </template>
            </div>
          </div>
          <div class="stat-box k-box">
            <span class="label">扩展半径 k</span>
            <div class="value expr-value">{{ step.k }}</div>
          </div>
        </div>

        <div
          class="divider"
          style="margin-top: 15px;"
        >
          <span class="arrow-down">↓ mat (0-based) → dp (1-based 前缀和) → result (0-based 答案) ↓</span>
        </div>

        <!-- 三矩阵并排视图 -->
        <div class="matrix-row">

          <!-- mat 原始矩阵 -->
          <div class="matrix-section">
            <div class="matrix-title">原始矩阵 mat</div>
            <div class="matrix-grid-wrapper">
              <div
                class="matrix-grid"
                :style="{ gridTemplateColumns: `22px repeat(${step.mat[0].length}, 44px)` }"
              >
                <!-- 🌟 查询矩形：直接跨越 mat 网格轨道，零像素计算，任意尺寸自适应 -->
                <div
                  class="query-rect"
                  v-if="step.phase === 'query'"
                  :style="{
                    gridRow: `${step.r1 + 2} / ${step.r2 + 3}`,
                    gridColumn: `${step.c1 + 2} / ${step.c2 + 3}`
                  }"
                ></div>
                <div
                  class="idx-cell corner"
                  :style="{ gridRow: 1, gridColumn: 1 }"
                ></div>
                <div
                  class="idx-cell"
                  v-for="j in step.mat[0].length"
                  :key="'mh' + j"
                  :style="{ gridRow: 1, gridColumn: j + 1 }"
                >{{ j - 1 }}</div>

                <div
                  class="idx-cell"
                  v-for="i in step.mat.length"
                  :key="'ml' + i"
                  :style="{ gridRow: i + 1, gridColumn: 1 }"
                >{{ i - 1 }}</div>
                <template
                  v-for="i in step.mat.length"
                  :key="'mr' + i"
                >
                  <div
                    class="array-box-minimal"
                    :class="getMatCellClass(step, i - 1, j - 1)"
                    v-for="j in step.mat[0].length"
                    :key="'mc' + (i - 1) + '-' + (j - 1)"
                    :style="{ gridRow: i + 1, gridColumn: j + 1 }"
                  >
                    {{ step.mat[i - 1][j - 1].val }}
                  </div>
                </template>
              </div>
            </div>
          </div>

          <!-- dp 前缀和矩阵 -->
          <div class="matrix-section">
            <div class="matrix-title">前缀和 dp</div>
            <div class="matrix-grid-wrapper">
              <div
                class="matrix-grid"
                :style="{ gridTemplateColumns: `22px repeat(${step.mat[0].length + 1}, 44px)` }"
              >
                <div class="idx-cell corner"></div>
                <div
                  class="idx-cell"
                  v-for="j in step.mat[0].length + 1"
                  :key="'dh' + j"
                >{{ j - 1 }}</div>
                <template
                  v-for="i in step.mat.length + 1"
                  :key="'dr' + i"
                >
                  <div class="idx-cell">{{ i - 1 }}</div>
                  <div
                    class="array-box-minimal"
                    :class="getDpCellClass(step, i - 1, j - 1)"
                    v-for="j in step.mat[0].length + 1"
                    :key="'dc' + (i - 1) + '-' + (j - 1)"
                  >
                    <span
                      class="corner-badge"
                      :class="getCornerLabel(step, i - 1, j - 1) === '+A' || getCornerLabel(step, i - 1, j - 1) === '+D' ? 'is-plus' : 'is-minus'"
                      v-if="getCornerLabel(step, i - 1, j - 1)"
                    >{{ getCornerLabel(step, i - 1, j - 1) }}</span>
                    {{ step.dp[i - 1][j - 1].val !== null ? step.dp[i - 1][j - 1].val : '' }}
                  </div>
                </template>
              </div>
            </div>
          </div>

          <!-- result 答案矩阵 -->
          <div class="matrix-section">
            <div class="matrix-title">答案 result</div>
            <div class="matrix-grid-wrapper">
              <div
                class="matrix-grid"
                :style="{ gridTemplateColumns: `22px repeat(${step.mat[0].length}, 44px)` }"
              >
                <div class="idx-cell corner"></div>
                <div
                  class="idx-cell"
                  v-for="j in step.mat[0].length"
                  :key="'rh' + j"
                >{{ j - 1 }}</div>
                <template
                  v-for="i in step.mat.length"
                  :key="'rr' + i"
                >
                  <div class="idx-cell">{{ i - 1 }}</div>
                  <div
                    class="array-box-minimal"
                    :class="getResCellClass(step, i - 1, j - 1)"
                    v-for="j in step.mat[0].length"
                    :key="'rc' + (i - 1) + '-' + (j - 1)"
                  >
                    {{ step.result[i - 1][j - 1].val !== null ? step.result[i - 1][j - 1].val : '' }}
                  </div>
                </template>
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

  // 🌟 多输入：矩阵 + k
  const visualizerInputs = [
    { id: 'mat', label: '矩阵 mat (行用 ; 分隔)', placeholder: '1, 2, 3; 4, 5, 6; 7, 8, 9' },
    { id: 'k', label: 'k', placeholder: '1', width: 70 }
  ]

  const visualizerButtons = [
    { id: 'prev', label: '上一步', icon: 'prev' },
    { id: 'play', label: '自动播放', labelPause: '暂停', icon: 'play', iconPause: 'pause' },
    { id: 'next', label: '下一步', icon: 'next' }
  ]

  const steps = ref([])

  const getPhaseClass = (phase) => {
    if (phase === 'build') return 'is-warning';
    if (phase === 'query') return 'is-low-zone';
    if (phase === 'done') return 'is-success';
    return '';
  }

  // mat 单元格状态（i, j 为 0-based）
  const getMatCellClass = (step, i, j) => {
    const cls = {};
    if (step.phase === 'build' && i === step.bi - 1 && j === step.bj - 1) cls['is-mid'] = true;
    if (step.phase === 'query') {
      const inRect = i >= step.r1 && i <= step.r2 && j >= step.c1 && j <= step.c2;
      if (inRect) {
        cls['is-in-window'] = true;
        cls['is-match'] = true;
      } else {
        cls['is-discarded'] = true;
      }
    }
    return cls;
  }

  // dp 单元格状态（i, j 为 0-based 真实下标）
  const getDpCellClass = (step, i, j) => {
    const cls = {};
    if (i === 0 || j === 0) cls['is-anchor'] = true;
    if (step.phase === 'build') {
      if (i === step.bi && j === step.bj) {
        cls['is-mid'] = true;
      } else {
        const isUp = i === step.bi - 1 && j === step.bj;
        const isLeft = i === step.bi && j === step.bj - 1;
        const isDiag = i === step.bi - 1 && j === step.bj - 1;
        if (isUp || isLeft || isDiag) cls['is-checking'] = true;
        if (step.dp[i][j].val === null) cls['is-empty'] = true;
      }
    }
    if (step.phase === 'query') {
      if (getCornerLabel(step, i, j)) {
        const plus = (i === step.x2 && j === step.y2) || (i === step.x1 - 1 && j === step.y1 - 1);
        cls[plus ? 'is-match' : 'is-mismatch'] = true;
      } else {
        cls['is-discarded'] = true;
      }
    }
    return cls;
  }

  // result 单元格状态（i, j 为 0-based）
  const getResCellClass = (step, i, j) => {
    const cls = {};
    if (step.result[i][j].val === null) cls['is-empty'] = true;
    if (step.phase === 'query' && i === step.qi && j === step.qj) cls['is-match'] = true;
    return cls;
  }

  // dp 查询角点标签：+A / -B / -C / +D（容斥原理）
  const getCornerLabel = (step, i, j) => {
    if (step.phase !== 'query') return null;
    if (i === step.x2 && j === step.y2) return '+A';
    if (i === step.x2 && j === step.y1 - 1) return '-B';
    if (i === step.x1 - 1 && j === step.y2) return '-C';
    if (i === step.x1 - 1 && j === step.y1 - 1) return '+D';
    return null;
  }

  const calculateSteps = (inputRaw) => {
    // 解析格式： 行1; 行2; ... | k（由 VisualizerLayout 用例编辑器拼接回传）
    steps.value = [];
    const parts = String(inputRaw ?? '').split('|').map(s => s.trim());
    if (parts.length < 2) return;

    const rows = parts[0].split(';').map(r => r.trim()).filter(r => r.length > 0)
      .map(r => r.split(',').map(x => parseInt(x.trim())).filter(x => !isNaN(x)));
    const k = parseInt(parts[1]);
    if (rows.length === 0 || rows[0].length === 0 || rows.some(r => r.length !== rows[0].length) || isNaN(k)) return;

    const n = rows.length, m = rows[0].length;
    let passNum = 0;

    const matObj = rows.map((row, i) => row.map((val, j) => ({ id: `mat-${i}-${j}`, val })));
    const dpObj = Array.from({ length: n + 1 }, (_, i) =>
      Array.from({ length: m + 1 }, (_, j) => ({ id: `dp-${i}-${j}`, val: (i === 0 || j === 0) ? 0 : null }))
    );
    const resObj = Array.from({ length: n }, (_, i) =>
      Array.from({ length: m }, (_, j) => ({ id: `res-${i}-${j}`, val: null }))
    );
    const dpArr = Array.from({ length: n + 1 }, () => new Array(m + 1).fill(0));

    const pushState = (desc, phase, opts = {}) => {
      steps.value.push({
        mat: JSON.parse(JSON.stringify(matObj)),
        dp: JSON.parse(JSON.stringify(dpObj)),
        result: JSON.parse(JSON.stringify(resObj)),
        k,
        phase: phase, // 'init', 'build', 'query', 'done'
        bi: opts.bi ?? -1, bj: opts.bj ?? -1,
        qi: opts.qi ?? -1, qj: opts.qj ?? -1,
        r1: opts.r1 ?? null, c1: opts.c1 ?? null, r2: opts.r2 ?? null, c2: opts.c2 ?? null,
        x1: opts.x1 ?? null, y1: opts.y1 ?? null, x2: opts.x2 ?? null, y2: opts.y2 ?? null,
        queryResult: opts.queryResult ?? null,
        description: desc,
        passId: passNum++
      });
    }

    pushState(`【初始化】创建 ${n + 1}×${m + 1} 的二维前缀和 dp。注意下标映射：dp 从 1 开始，mat 从 0 开始（dp[i][j] 对应 mat[i-1][j-1]）。第 0 行/列全部置 0 作边界哨兵。`, 'init');

    // ================= 阶段 1：构建二维前缀和 =================
    for (let i = 1; i <= n; i++) {
      for (let j = 1; j <= m; j++) {
        dpArr[i][j] = dpArr[i - 1][j] + dpArr[i][j - 1] - dpArr[i - 1][j - 1] + rows[i - 1][j - 1];
        dpObj[i][j].val = dpArr[i][j];
        pushState(`【构建前缀和】dp[${i}][${j}] = 上 + 左 - 左上 + mat[${i - 1}][${j - 1}] = ${dpArr[i][j]}，代表 [1,1] 到 [${i},${j}] 的矩形总和。`, 'build', { bi: i, bj: j });
      }
    }

    // ================= 阶段 2：逐格计算 result（钳制边界 + 容斥） =================
    for (let i = 0; i < n; i++) {
      for (let j = 0; j < m; j++) {
        // 复刻 Java：先钳制到 mat 的 0-based 范围，再 +1 映射到 dp
        const r1 = Math.max(0, i - k), c1 = Math.max(0, j - k);
        const r2 = Math.min(n - 1, i + k), c2 = Math.min(m - 1, j + k);
        const x1 = r1 + 1, y1 = c1 + 1, x2 = r2 + 1, y2 = c2 + 1;
        const value = dpArr[x2][y2] - dpArr[x2][y1 - 1] - dpArr[x1 - 1][y2] + dpArr[x1 - 1][y1 - 1];
        resObj[i][j].val = value;

        const clamped = (r1 === 0 || c1 === 0 || r2 === n - 1 || c2 === m - 1) ? '（已钳制到边界）' : '';
        pushState(`【计算区域和】以 (${i}, ${j}) 为中心、向四周扩展 k=${k}${clamped}：矩形 [${r1},${c1}]~[${r2},${c2}]（mat 的 0-based）。映射到 dp 各 +1 → x1=${x1}, y1=${y1}, x2=${x2}, y2=${y2}。容斥：+A −B −C +D = ${value}。`, 'query', { qi: i, qj: j, r1, c1, r2, c2, x1, y1, x2, y2, queryResult: value });
      }
    }

    pushState(`【✅ 完成】result 矩阵全部填充完毕。每格都只查 4 个 dp 角点，构建 O(n×m)，查询每格 O(1)。`, 'done');
  }
</script>

<style scoped>
  .blocksum-container {
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
    flex-wrap: wrap;
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
    transition: all 0.3s;
  }

  .stat-box.target-box {
    min-width: 320px;
    max-width: 100%;
  }

  .stat-box.k-box {
    min-width: 110px;
  }

  .stat-box.k-box .value {
    color: #f97316;
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
    font-size: 15px;
    display: flex;
    align-items: center;
    flex-wrap: wrap;
    justify-content: center;
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

  /* ================= 三矩阵并排排版 ================= */
  .matrix-row {
    display: flex;
    justify-content: center;
    align-items: flex-start;
    gap: 32px;
    flex-wrap: wrap;
    width: 100%;
    padding: 0 20px 25px 20px;
  }

  .matrix-section {
    display: flex;
    flex-direction: column;
    align-items: center;
  }

  .matrix-title {
    font-size: 13px;
    font-weight: bold;
    color: var(--vp-c-text-2);
    margin-bottom: 8px;
  }

  .matrix-grid-wrapper {
    position: relative;
  }

  .matrix-grid {
    display: grid;
    gap: 8px;
  }

  .idx-cell {
    display: flex;
    align-items: center;
    justify-content: center;
    min-width: 22px;
    min-height: 18px;
    font-size: 10px;
    font-weight: bold;
    color: var(--vp-c-text-3);
  }

  .idx-cell.corner {
    visibility: hidden;
  }

  .array-box-minimal {
    position: relative;
    z-index: 2;
    width: 44px;
    height: 36px;
    border: 1px solid var(--vp-c-border);
    border-radius: 4px;
    display: flex;
    justify-content: center;
    align-items: center;
    font-size: 13px;
    font-family: monospace;
    font-weight: 600;
    color: var(--vp-c-text-1);
    background: var(--vp-c-bg-elv);
    transition: all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
  }

  /* 🌟 查询矩形：网格轨道定位，自动对齐任意尺寸 */
  .query-rect {
    margin: -6px;
    border: 1.5px solid #10b981;
    border-radius: 6px;
    background: rgba(16, 185, 129, 0.06);
    z-index: 0;
    pointer-events: none;
    transition: all 0.3s;
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
  }

  .is-match {
    border-color: #10b981;
    background: rgba(16, 185, 129, 0.15);
    color: #10b981;
    font-size: 14px;
    box-shadow: 0 4px 15px rgba(16, 185, 129, 0.2);
  }

  .is-mismatch {
    border-color: #ef4444;
    background: rgba(239, 68, 68, 0.08);
    color: #ef4444;
  }

  /* dp 查询角点徽章 */
  .corner-badge {
    position: absolute;
    top: -8px;
    right: -8px;
    font-size: 9px;
    padding: 1px 4px;
    border-radius: 3px;
    font-weight: 600;
    color: white;
    z-index: 3;
    animation: popIn 0.3s ease-out forwards;
  }

  .corner-badge.is-plus {
    background: #10b981;
  }

  .corner-badge.is-minus {
    background: #ef4444;
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
