<template>
  <VisualizerLayout
    title="Z 字形变换 / 画图 → 反推规律 (LeetCode 6)"
    storageKey="lc6-zigzag-convert-config"
    defaultData="PAYPALISHIRING | 3"
    :inputs="visualizerInputs"
    :defaultInterval="700"
    :actionButtons="visualizerButtons"
    :steps="steps"
    @calculate="calculateSteps"
  >
    <template #visualization="{ step }">
      <div
        class="zigzag-container"
        v-if="step && step.chars"
      >

        <!-- 顶部：numRows / differ + 核心公式 -->
        <div class="dashboard-minimal">
          <div class="stat-box rows-box">
            <span class="label">numRows</span>
            <div class="value expr-value">{{ step.numRows }}</div>
          </div>
          <div class="stat-box differ-box">
            <span class="label">differ = 2×numRows−2</span>
            <div class="value expr-value">{{ step.differ }}</div>
          </div>
          <div
            class="stat-box target-box"
            :class="getPhaseClass(step.phase)"
          >
            <span class="label">核心判定公式</span>
            <div class="value expr-value">
              <template v-if="step.phase === 'draw'">
                s[{{ step.ci }}] = '{{ step.chars[step.ci].ch }}'
                <span class="calc-part">
                  → 网格 ({{ step.chars[step.ci].row }}, {{ step.chars[step.ci].col }})
                </span>
              </template>
              <template v-else-if="step.phase === 'extract-first'">
                i = {{ step.srcIdx }}
                <span class="calc-part">
                  i += differ → result[{{ step.writeIdx }}] = s[{{ step.srcIdx }}] = '{{ step.res[step.writeIdx].ch }}'
                </span>
              </template>
              <template v-else-if="step.phase === 'extract-mid'">
                左腿 j / 右腿 (2count−1)×differ − j
                <span class="calc-part">
                  → result[{{ step.writeIdx }}] = s[{{ step.srcIdx }}] = '{{ step.res[step.writeIdx].ch }}'
                </span>
              </template>
              <template v-else-if="step.phase === 'extract-last'">
                i = numRows−1 (+{{ step.srcIdx - (step.numRows - 1) }})
                <span class="calc-part">
                  i += differ → result[{{ step.writeIdx }}] = s[{{ step.srcIdx }}] = '{{ step.res[step.writeIdx].ch }}'
                </span>
              </template>
              <template v-else-if="step.phase === 'done'">
                result = <strong class="text-ok">"{{ step.finalString }}"</strong>
              </template>
              <template v-else>
                <span class="empty-hint">先按 Z 字形把字符逐个落位画图，再逐行套规律提取...</span>
              </template>
            </div>
          </div>
        </div>

        <div
          class="divider"
          style="margin-top: 15px;"
        >
          <span class="arrow-down">↓ Z 字形网格（格内小字为 s 的下标）↓</span>
        </div>

        <!-- Z 字形网格 -->
        <div class="array-wrapper">
          <div
            class="matrix-grid"
            :style="{ gridTemplateColumns: `22px repeat(${step.cols}, 34px)` }"
          >
            <template
              v-for="r in step.numRows"
              :key="'zr' + r"
            >
              <div class="idx-cell">{{ r - 1 }}</div>
              <div
                class="grid-cell"
                v-for="c in step.cols"
                :key="'zc' + r + '-' + c"
              >
                <template v-if="getCellChar(step, r - 1, c - 1)">
                  <div
                    class="array-box-minimal"
                    :class="getGridCellClass(step, getCellChar(step, r - 1, c - 1))"
                  >
                    {{ getCellChar(step, r - 1, c - 1).ch }}
                  </div>
                  <span class="cell-idx">{{ getCellChar(step, r - 1, c - 1).idx }}</span>
                </template>
                <div
                  v-else
                  class="array-box-minimal cell-empty"
                ></div>
              </div>
            </template>
          </div>
        </div>

        <div class="divider">
          <span class="arrow-down">↓ 结果 result（逐格填充）↓</span>
        </div>

        <!-- 结果轨道 -->
        <div class="array-wrapper">
          <div class="array-track">
            <div
              class="array-item-group"
              v-for="(item, idx) in step.res"
              :key="item.id"
            >
              <div
                class="array-box-minimal res-box-cell"
                :class="getResCellClass(step, idx)"
              >
                {{ item.ch !== null ? item.ch : '' }}
              </div>
              <div class="pointer-track ptr-tight">
                <span class="idx">{{ idx }}</span>
                <div class="ptr-labels">
                  <span
                    v-if="step.phase !== 'done' && idx === step.writeIdx"
                    class="ptr ptr-mid"
                  >index</span>
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

  // 🌟 多输入：字符串 + numRows
  const visualizerInputs = [
    { id: 's', label: '字符串 s', placeholder: 'PAYPALISHIRING' },
    { id: 'numRows', label: 'numRows', placeholder: '3', width: 90 }
  ]

  const visualizerButtons = [
    { id: 'prev', label: '上一步', icon: 'prev' },
    { id: 'play', label: '自动播放', labelPause: '暂停', icon: 'play', iconPause: 'pause' },
    { id: 'next', label: '下一步', icon: 'next' }
  ]

  const steps = ref([])

  const getPhaseClass = (phase) => {
    if (phase === 'draw') return 'is-warning';
    if (phase.startsWith('extract')) return 'is-low-zone';
    if (phase === 'done') return 'is-success';
    return '';
  }

  // 网格取字符（仅已落位的可见）
  const getCellChar = (step, row, col) => {
    return step.chars.find(c => c.row === row && c.col === col && c.idx < step.drawn) || null;
  }

  const getGridCellClass = (step, cell) => {
    const cls = {};
    if (step.phase === 'draw' && cell.idx === step.ci) cls['is-mid'] = true;
    if (step.phase.startsWith('extract') && cell.idx === step.srcIdx) cls['is-checking'] = true;
    if (cell.extracted) cls['is-match'] = true;
    return cls;
  }

  const getResCellClass = (step, idx) => {
    const cls = {};
    if (step.res[idx].ch === null) cls['is-empty'] = true;
    else if (idx === step.writeIdx && step.phase !== 'done') cls['is-mid'] = true;
    else cls['is-match'] = true;
    return cls;
  }

  const calculateSteps = (inputRaw) => {
    // 解析格式： 字符串 s | numRows（由用例编辑器拼接回传）
    steps.value = [];
    const parts = String(inputRaw ?? '').split('|').map(s => s.trim());
    if (parts.length < 2) return;

    const s = parts[0];
    const numRows = parseInt(parts[1]);
    if (!s.length || isNaN(numRows) || numRows < 1) return;

    const n = s.length;
    let passNum = 0;

    // ================= 路径模拟（画图）：竖着下、斜着上 =================
    let row = 0, col = 0, down = true, maxCol = 0;
    const chars = [];
    for (let i = 0; i < n; i++) {
      chars.push({ id: `c-${i}`, idx: i, ch: s[i], row, col, extracted: false });
      if (col > maxCol) maxCol = col;
      if (numRows === 1) { col++; continue; }
      if (down) {
        if (row < numRows - 1) row++;
        else { down = false; row--; col++; }
      } else {
        if (row > 0) { row--; col++; }
        else { down = true; row++; }
      }
    }
    const cols = maxCol + 1;
    const differ = numRows === 1 ? n : 2 * numRows - 2;

    const pushState = (desc, phase, opts = {}) => {
      steps.value.push({
        chars: JSON.parse(JSON.stringify(chars)),
        res: Array.from({ length: n }, (_, i) => ({ id: `r-${i}`, ch: opts.resArr ? opts.resArr[i] : null })),
        numRows, differ, cols,
        phase: phase, // 'init','draw','extract-first','extract-mid','extract-last','done'
        ci: opts.ci ?? -1,
        drawn: opts.drawn ?? 0,
        srcIdx: opts.srcIdx ?? -1,
        writeIdx: opts.writeIdx ?? 0,
        finalString: opts.finalString ?? '',
        description: desc,
        passId: passNum++
      });
    }

    const resArr = new Array(n).fill(null);
    let index = 0;

    pushState(`【初始化】numRows = ${numRows}，differ = 2 × numRows − 2 = ${differ}。模拟优化三步法第一步：先按 Z 字形把字符画进网格（竖着往下、到顶/底后斜着往上）。`, 'init', { resArr });

    // 早退分支：numRows == 1 时直接返回（Java: if (numRows == 1) return s;）
    if (numRows === 1) {
      pushState(`【✅ 特判】numRows == 1，Z 字形退化为原字符串，直接 return s（若不特判，differ = 0 会导致死循环！）。`, 'done', { resArr: [...s], drawn: n, finalString: s });
      return;
    }

    // ================= 阶段 1：画图（逐字符落位） =================
    for (let i = 0; i < n; i++) {
      const turn = (i > 0 && chars[i].col > chars[i - 1].col && chars[i].row < chars[i - 1].row) ? '（转为斜向上）'
        : (i > 0 && chars[i].col === chars[i - 1].col && chars[i].row > chars[i - 1].row && chars[i].row === 1) ? '' : '';
      pushState(`【落位】s[${i}] = '${s[i]}' → 网格 (${chars[i].row}, ${chars[i].col})${turn}。`, 'draw', { ci: i, drawn: i + 1, resArr });
    }

    // ================= 阶段 2：套规律逐行提取 =================
    const append = (srcIdx, phase, desc) => {
      chars[srcIdx].extracted = true;
      resArr[index] = s[srcIdx];
      pushState(desc, phase, { drawn: n, srcIdx, writeIdx: index, resArr });
      index++;
    };

    // 首行：公差 differ
    for (let i = 0; i < n; i += differ) {
      append(i, 'extract-first', `【首行】下标 ${i}（0 起步，公差 differ = ${differ}）→ result[${index}] = s[${i}] = '${s[i]}'。`);
    }

    // 中间行：每个 V 的左腿 j 与右腿 mirror = (2·count−1)×differ − j
    for (let i = 1; i < numRows - 1; i++) {
      for (let j = i, count = 1; j < n; j += differ, count++) {
        const mirror = differ * (2 * count - 1) - j;
        const mirrorNote = mirror < n ? `稍后取右腿 ${mirror}` : `右腿 ${mirror} ≥ n 越界，跳过`;
        append(j, 'extract-mid', `【中间行 ${i}】第 ${count} 个 V：左腿 j = ${j} → result[${index}] = s[${j}] = '${s[j]}'（${mirrorNote}）。`);
        if (mirror < n) {
          append(mirror, 'extract-mid', `【中间行 ${i}】第 ${count} 个 V：右腿 mirror = (2×${count}−1)×${differ} − ${j} = ${mirror} → result[${index}] = s[${mirror}] = '${s[mirror]}'。`);
        }
      }
    }

    // 尾行：numRows−1 起步，公差 differ
    for (let i = numRows - 1; i < n; i += differ) {
      append(i, 'extract-last', `【尾行】下标 ${i}（numRows−1 起步，公差 differ = ${differ}）→ result[${index}] = s[${i}] = '${s[i]}'。`);
    }

    pushState(`【✅ 完成】result = "${resArr.join('')}"。画图找规律，时间复杂度 O(n)，每个下标恰好访问一次。`, 'done', { drawn: n, writeIdx: n - 1, resArr, finalString: resArr.join('') });
  }
</script>

<style scoped>
  .zigzag-container {
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

  .stat-box.rows-box {
    min-width: 110px;
  }

  .stat-box.rows-box .value {
    color: #f97316;
  }

  .stat-box.differ-box {
    min-width: 170px;
  }

  .stat-box.differ-box .value {
    color: #8b5cf6;
  }

  .stat-box.target-box {
    min-width: 320px;
    max-width: 100%;
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
    font-size: 16px;
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

  .array-wrapper {
    width: 100%;
    overflow-x: auto;
    overflow-y: hidden;
    padding: 0 20px 10px 20px;
    background-color: transparent;
    display: flex;
    justify-content: center;
  }

  /* ================= Z 字形网格 ================= */
  .matrix-grid {
    display: grid;
    gap: 6px;
    align-items: start;
  }

  .idx-cell {
    display: flex;
    align-items: center;
    justify-content: center;
    min-width: 22px;
    height: 36px;
    font-size: 10px;
    font-weight: bold;
    color: var(--vp-c-text-3);
  }

  .grid-cell {
    display: flex;
    flex-direction: column;
    align-items: center;
  }

  .array-box-minimal {
    position: relative;
    width: 34px;
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
    transition: all 0.35s cubic-bezier(0.34, 1.56, 0.64, 1);
  }

  .array-box-minimal.cell-empty {
    border-color: transparent;
    background: transparent;
  }

  .cell-idx {
    font-size: 9px;
    font-weight: bold;
    color: var(--vp-c-text-3);
    margin-top: 2px;
  }

  /* ================= 结果轨道 (紧凑模式) ================= */
  .array-track {
    display: flex;
    gap: 8px;
    position: relative;
    padding-top: 6px;
    flex-wrap: wrap;
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

  .res-box-cell {
    width: 28px;
  }

  /* 视觉特效 (状态语义字典) */
  .is-empty {
    border-style: dashed;
    color: var(--vp-c-text-3);
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
    box-shadow: 0 4px 15px rgba(16, 185, 129, 0.2);
  }

  .pointer-track {
    margin-top: 4px;
    display: flex;
    flex-direction: column;
    align-items: center;
    min-height: 24px;
  }

  .pointer-track.ptr-tight {
    min-height: 24px;
  }

  .idx {
    font-size: 10px;
    color: var(--vp-c-text-3);
    margin-bottom: 2px;
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
