<template>
  <VisualizerLayout
    title="二维前缀和 / 容斥原理 (Nowcoder DP35)"
    storageKey="nc-dp35-prefix-sum-2d-config"
    defaultData="1, 2, 3; 4, 5, 6; 7, 8, 9 | 2, 2, 3, 3 | 1, 1, 3, 3"
    :defaultInterval="1200"
    :actionButtons="visualizerButtons"
    :steps="steps"
    @calculate="calculateSteps"
  >
    <template #visualization="{ step }">
      <div
        class="prefix2d-container"
        v-if="step && step.arr && step.arr.length"
      >

        <!-- 顶部：极致简约面板 -->
        <div class="dashboard-minimal">
          <div
            class="stat-box target-box"
            :class="getPhaseClass(step.phase)"
          >
            <span class="label">核心判定公式 (O(1) 子矩阵求和)</span>
            <div class="value expr-value">
              <template v-if="step.phase === 'build'">
                dp[{{ step.bi }}][{{ step.bj }}] = dp[{{ step.bi - 1 }}][{{ step.bj }}] + dp[{{ step.bi }}][{{ step.bj - 1 }}]
                - dp[{{ step.bi - 1 }}][{{ step.bj - 1 }}] + arr[{{ step.bi }}][{{ step.bj }}]
                <span class="calc-part">
                  => {{ step.dp[step.bi - 1][step.bj].val }} + {{ step.dp[step.bi][step.bj - 1].val }} -
                  {{ step.dp[step.bi - 1][step.bj - 1].val }} + {{ step.arr[step.bi - 1][step.bj - 1].val }} =
                  <strong>{{ step.dp[step.bi][step.bj].val !== null ? step.dp[step.bi][step.bj].val : '?' }}</strong>
                </span>
              </template>
              <template v-else-if="step.phase === 'query'">
                sum({{ step.x1 }},{{ step.y1 }})-({{ step.x2 }},{{ step.y2 }}) = dp[x2][y2] - dp[x2][y1-1] - dp[x1-1][y2] +
                dp[x1-1][y1-1]
                <span class="calc-part">
                  => {{ step.dp[step.x2][step.y2].val }} - {{ step.dp[step.x2][step.y1 - 1].val }} -
                  {{ step.dp[step.x1 - 1][step.y2].val }} + {{ step.dp[step.x1 - 1][step.y1 - 1].val }} =
                  <strong>{{ step.queryResult !== null ? step.queryResult : '?' }}</strong>
                </span>
              </template>
              <template v-else>
                <span class="empty-hint">准备构建二维前缀和矩阵...</span>
              </template>
            </div>
          </div>
        </div>

        <div
          class="divider"
          style="margin-top: 15px;"
        >
          <span class="arrow-down">↓ 左侧为原始矩阵 arr (1-based)，右侧为前缀和矩阵 dp (含 0 号边界行列) ↓</span>
        </div>

        <!-- 双矩阵并排视图 -->
        <div class="matrix-row">

          <!-- 原始矩阵 arr -->
          <div class="matrix-section">
            <div class="matrix-title">
              原始矩阵 arr
              <span
                class="query-title-tag"
                :class="{ 'is-locked': step.queryResult !== null }"
                v-if="step.phase === 'query'"
              >Query: [{{ step.x1 }},{{ step.y1 }}] ~ [{{ step.x2 }},{{ step.y2 }}]</span>
            </div>
            <div class="matrix-grid-wrapper">
              <!-- 🌟 查询子矩阵包裹框 -->
              <div
                class="window-frame-minimal"
                :class="{
                  'is-valid-frame': step.phase === 'query' && step.queryResult !== null,
                  'is-hidden': step.phase !== 'query'
                }"
                :style="getRectStyle(step)"
              ></div>

              <div
                class="matrix-grid"
                :style="{ gridTemplateColumns: `22px repeat(${step.arr[0].length}, 44px)` }"
              >
                <div class="idx-cell corner"></div>
                <div
                  class="idx-cell"
                  v-for="j in step.arr[0].length"
                  :key="'ah' + j"
                >{{ j }}</div>

                <template
                  v-for="i in step.arr.length"
                  :key="'ar' + i"
                >
                  <div class="idx-cell">{{ i }}</div>
                  <div
                    class="array-box-minimal"
                    :class="getArrCellClass(step, i, j)"
                    v-for="j in step.arr[0].length"
                    :key="'ac' + i + '-' + j"
                  >
                    {{ step.arr[i - 1][j - 1].val }}
                  </div>
                </template>
              </div>
            </div>
          </div>

          <!-- 前缀和矩阵 dp -->
          <div class="matrix-section">
            <div class="matrix-title">前缀和矩阵 dp</div>
            <div class="matrix-grid-wrapper">
              <div
                class="matrix-grid"
                :style="{ gridTemplateColumns: `22px repeat(${step.arr[0].length + 1}, 44px)` }"
              >
                <div class="idx-cell corner"></div>
                <div
                  class="idx-cell"
                  v-for="j in step.arr[0].length + 1"
                  :key="'dh' + j"
                >{{ j - 1 }}</div>

                <template
                  v-for="i in step.arr.length + 1"
                  :key="'dr' + i"
                >
                  <div class="idx-cell">{{ i - 1 }}</div>
                  <div
                    class="array-box-minimal"
                    :class="getDpCellClass(step, i - 1, j - 1)"
                    v-for="j in step.arr[0].length + 1"
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

  // 🌟 查询子矩阵包裹框计算（绑定在 arr 网格上，CSS Grid 布局下按格线坐标推算）
  const getRectStyle = (step) => {
    if (step.phase !== 'query') return { width: '0px', height: '0px', opacity: 0 }
    const CELL_W = 44, CELL_H = 36, GAP = 8, LABEL_W = 22, LABEL_H = 18, PADDING = 4;
    const leftPos = LABEL_W + GAP + (step.y1 - 1) * (CELL_W + GAP) - PADDING;
    const topPos = LABEL_H + GAP + (step.x1 - 1) * (CELL_H + GAP) - PADDING;
    const width = (step.y2 - step.y1 + 1) * (CELL_W + GAP) - GAP + PADDING * 2;
    const height = (step.x2 - step.x1 + 1) * (CELL_H + GAP) - GAP + PADDING * 2;

    return {
      left: `${leftPos}px`,
      top: `${topPos}px`,
      width: `${width}px`,
      height: `${height}px`,
      opacity: 1
    }
  }

  const getPhaseClass = (phase) => {
    if (phase === 'build') return 'is-warning';
    if (phase === 'query') return 'is-low-zone';
    return '';
  }

  // arr 单元格状态（i, j 为 1-based）
  const getArrCellClass = (step, i, j) => {
    const cls = {};
    if (step.phase === 'build' && i === step.bi && j === step.bj) cls['is-mid'] = true;
    if (step.phase === 'query') {
      const inRect = i >= step.x1 && i <= step.x2 && j >= step.y1 && j <= step.y2;
      if (inRect) {
        cls['is-in-window'] = true;
        if (step.queryResult !== null) cls['is-match'] = true;
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
    // 解析格式： 行1; 行2; 行3 | x1,y1,x2,y2 | x1,y1,x2,y2 ...
    steps.value = [];
    const parts = inputRaw.split('|').map(s => s.trim());
    const rows = parts[0].split(';').map(r => r.trim()).filter(r => r.length > 0)
      .map(r => r.split(',').map(x => parseInt(x.trim())).filter(x => !isNaN(x)));

    if (rows.length === 0 || rows[0].length === 0 || rows.some(r => r.length !== rows[0].length)) return;

    let queries = [];
    for (let i = 1; i < parts.length; i++) {
      const q = parts[i].split(',').map(x => parseInt(x.trim())).filter(x => !isNaN(x));
      if (q.length === 4) queries.push(q);
    }

    const n = rows.length, m = rows[0].length;
    let passNum = 0;

    const arrayObj = rows.map((row, i) => row.map((val, j) => ({ id: `arr-${i}-${j}`, val })));
    const dpObj = Array.from({ length: n + 1 }, (_, i) =>
      Array.from({ length: m + 1 }, (_, j) => ({ id: `dp-${i}-${j}`, val: (i === 0 || j === 0) ? 0 : null }))
    );
    const dpArr = Array.from({ length: n + 1 }, () => new Array(m + 1).fill(0));

    const pushState = (desc, phase, bi, bj, x1, y1, x2, y2, res) => {
      steps.value.push({
        arr: JSON.parse(JSON.stringify(arrayObj)),
        dp: JSON.parse(JSON.stringify(dpObj)),
        phase: phase, // 'pending', 'build', 'query'
        bi, bj, x1, y1, x2, y2,
        queryResult: res,
        description: desc,
        passId: passNum++
      });
    }

    pushState(`【初始化】创建 ${n + 1}×${m + 1} 的前缀和矩阵 dp。第 0 行与第 0 列全部置 0，作为边界哨兵，完美规避后续查询时的越界判断。`, 'pending', -1, -1, -1, -1, -1, -1, null);

    // ================= 阶段 1：构建二维前缀和矩阵 =================
    for (let i = 1; i <= n; i++) {
      for (let j = 1; j <= m; j++) {
        pushState(`【计算前缀和】dp[${i}][${j}] 代表以 [1][1] 为左上角、[${i}][${j}] 为右下角的子矩阵元素和。根据容斥原理：合并「上」「左」两块，减去被重复累加的「左上」角，再补上当前元素 arr[${i}][${j}]。`, 'build', i, j, -1, -1, -1, -1, null);

        dpArr[i][j] = dpArr[i - 1][j] + dpArr[i][j - 1] - dpArr[i - 1][j - 1] + rows[i - 1][j - 1];
        dpObj[i][j].val = dpArr[i][j];

        pushState(`【存储前缀和】累加完成！dp[${i}][${j}] = ${dpArr[i][j]}。`, 'build', i, j, -1, -1, -1, -1, null);
      }
    }

    // ================= 阶段 2：执行 O(1) 子矩阵查询 =================
    if (queries.length === 0) {
      pushState(`【结束】前缀和矩阵构建完毕，未提供查询数据。`, 'pending', -1, -1, -1, -1, -1, -1, null);
      return;
    }

    for (let q = 0; q < queries.length; q++) {
      let [x1, y1, x2, y2] = queries[q];
      // 防御性越界限制
      if (x1 < 1) x1 = 1;
      if (y1 < 1) y1 = 1;
      if (x2 > n) x2 = n;
      if (y2 > m) y2 = m;
      if (x1 > x2 || y1 > y2) continue;

      pushState(`【发起查询】要求原矩阵中 [${x1}][${y1}] 到 [${x2}][${y2}] 子矩阵的元素和。根据容斥原理，只需读取 dp 矩阵的 4 个角点：+A(右下) −B(右上) −C(左下) +D(左上补回)。`, 'query', -1, -1, x1, y1, x2, y2, null);

      const sum = dpArr[x2][y2] - dpArr[x2][y1 - 1] - dpArr[x1 - 1][y2] + dpArr[x1 - 1][y1 - 1];
      pushState(`【✅ O(1) 求解】dp[${x2}][${y2}] - dp[${x2}][${y1 - 1}] - dp[${x1 - 1}][${y2}] + dp[${x1 - 1}][${y1 - 1}] = ${sum}。四个角点瞬间得到结果，时间复杂度 O(1)！`, 'query', -1, -1, x1, y1, x2, y2, sum);
    }
  }
</script>

<style scoped>
  .prefix2d-container {
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
    max-width: 100%;
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

  /* ================= 双矩阵并排排版 ================= */
  .matrix-row {
    display: flex;
    justify-content: center;
    align-items: flex-start;
    gap: 40px;
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
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 13px;
    font-weight: bold;
    color: var(--vp-c-text-2);
    margin-bottom: 8px;
    min-height: 22px;
  }

  /* 🌟 查询区间标签（置于标题行，避免与下标表头重叠） */
  .query-title-tag {
    font-size: 11px;
    font-weight: bold;
    font-family: monospace;
    white-space: nowrap;
    color: #38bdf8;
    background: rgba(14, 165, 233, 0.1);
    border: 1px solid rgba(56, 189, 248, 0.4);
    padding: 1px 8px;
    border-radius: 10px;
    transition: all 0.3s;
  }

  .query-title-tag.is-locked {
    color: #10b981;
    background: rgba(16, 185, 129, 0.1);
    border-color: rgba(16, 185, 129, 0.4);
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

  /* 🌟 查询子矩阵包裹框 */
  .window-frame-minimal {
    position: absolute;
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

  .window-frame-minimal.is-hidden {
    opacity: 0;
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
    transform: translateY(-2px);
  }

  .is-match {
    border-color: #10b981;
    background: rgba(16, 185, 129, 0.15);
    color: #10b981;
    font-size: 14px;
    transform: scale(1.08);
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
