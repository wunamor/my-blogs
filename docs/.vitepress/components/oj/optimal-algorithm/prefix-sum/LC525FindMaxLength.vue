<template>
  <VisualizerLayout
    title="连续数组 / 0→-1 转化 + 前缀和首次下标 (LeetCode 525)"
    storageKey="lc525-find-max-length-config"
    defaultData="0, 1, 1, 0, 1, 0"
    :inputs="visualizerInputs"
    :defaultInterval="1000"
    :actionButtons="visualizerButtons"
    :steps="steps"
    @calculate="calculateSteps"
  >
    <template #visualization="{ step }">
      <div
        class="contiguous-container"
        v-if="step && step.nums"
      >

        <!-- 顶部：sum / 长度 / 最长 + 核心判定公式 -->
        <div class="dashboard-minimal">
          <div class="stat-box sum-box">
            <span class="label">sum [0, i]</span>
            <div class="value expr-value">{{ step.phase === 'init' ? '?' : step.sum }}</div>
          </div>
          <div class="stat-box len-box">
            <span class="label">当前长度</span>
            <div class="value expr-value">{{ step.len !== null ? step.len : '?' }}</div>
          </div>
          <div class="stat-box res-box">
            <span class="label">最长 result</span>
            <div class="value expr-value">{{ step.result }}</div>
          </div>
          <div
            class="stat-box target-box"
            :class="getPhaseClass(step.phase)"
          >
            <span class="label">核心判定公式</span>
            <div class="value expr-value">
              <template v-if="step.phase === 'accumulate'">
                sum += v[{{ step.ci }}]
                <span class="calc-part">
                  => {{ step.sum - step.conv[step.ci].val }} + ({{ step.conv[step.ci].val }}) =
                  <strong>{{ step.sum }}</strong>
                </span>
              </template>
              <template v-else-if="step.phase === 'match'">
                len = i - hash[sum]
                <span class="calc-part">
                  =>
                  <template v-if="step.j !== null">{{ step.ci }} - ({{ step.j }}) = {{ step.len }}</template>
                  <template v-else>{{ step.ci }} - {{ step.ci }} = 0（首次出现）</template>
                  → result
                  <strong :class="step.updated ? 'text-ok' : ''">{{ step.result }}</strong>
                  <span v-if="step.updated" class="upd">↑ 刷新最长</span>
                </span>
              </template>
              <template v-else-if="step.phase === 'store'">
                hash[{{ step.sum }}] = {{ step.storeIdx !== null ? step.storeIdx : step.hashIdx }}
                <span class="calc-part">
                  {{ step.storeIdx !== null ? '→ 首次记录，存入' : '→ 已存在，忽略（保留最早下标）' }}
                </span>
              </template>
              <template v-else-if="step.phase === 'done'">
                最长的连续数组 = <strong class="text-ok">{{ step.result }}</strong>
              </template>
              <template v-else>
                <span class="empty-hint">准备把 0 转为 -1，并放入哨兵 (0 → 下标 -1)...</span>
              </template>
            </div>
          </div>
        </div>

        <!-- 行 1：原始数组 nums -->
        <div class="array-row">
          <div class="divider">
            <span class="arrow-down">原始数组 nums</span>
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
                  :class="getOrigCellClass(step, idx)"
                >
                  {{ item.val }}
                </div>
                <div class="pointer-track ptr-tight">
                  <span class="idx">{{ idx }}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- 行 2：转换数组 v（0 → -1），承载线框 -->
        <div class="array-row">
          <div class="divider">
            <span class="arrow-down">转换数组 v (0 → -1)</span>
          </div>

          <div class="array-wrapper">
            <div class="array-track nums-track" ref="numsTrackRef">
              <!-- 🌟 sum 范围框 [0, i]（仅单行时显示） -->
              <div
                class="window-frame-minimal frame-sum"
                :class="{ 'is-hidden': !showSumFrame(step) }"
                :style="getFrameStyle(step, 0, step.ci)"
                v-if="oneLine"
              ></div>
              <!-- 🌟 候选区间框 [j+1, i]：和为 0 的子数组（仅命中时显示） -->
              <div
                class="window-frame-minimal frame-cand"
                :class="{ 'is-hidden': !showCandFrame(step), 'is-valid-frame': showCandFrame(step) && step.updated }"
                :style="getCandFrameStyle(step)"
                v-if="oneLine"
              ></div>

              <div
                class="array-item-group"
                v-for="(item, idx) in step.conv"
                :key="item.id"
              >
                <div
                  class="array-box-minimal"
                  :class="getConvCellClass(step, idx)"
                >
                  {{ item.val }}
                </div>
                <div class="pointer-track ptr-tight">
                  <span class="idx">{{ idx }}</span>
                  <div class="ptr-labels">
                    <span
                      v-if="step.ci === idx && step.phase !== 'done'"
                      class="ptr ptr-mid"
                    >i</span>
                    <span
                      v-if="step.phase === 'match' && step.j === idx"
                      class="ptr ptr-left"
                    >j</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- 行 3：哈希表（前缀和 → 最早下标） -->
        <div class="array-row">
          <div class="divider">
            <span class="arrow-down">哈希表 hash (前缀和 → 最早下标)</span>
          </div>

          <div class="array-wrapper">
            <div class="array-track map-track">
              <div
                class="map-chip"
                :class="getMapEntryClass(step, entry)"
                v-for="entry in step.mapEntries"
                :key="'h-' + entry.key"
              >
                <span class="map-key">{{ entry.key }}</span>
                <span class="map-arrow">→</span>
                <span class="map-count">下标 {{ entry.idx }}</span>
              </div>
            </div>
          </div>
        </div>

      </div>
    </template>
  </VisualizerLayout>
</template>

<script setup>
  import { ref, watch, nextTick, onMounted, onUnmounted } from 'vue'
  import VisualizerLayout from '@components/common/visualization/VisualizerLayout.vue'

  const visualizerInputs = [
    { id: 'nums', label: '数组 nums (0/1)', placeholder: '0, 1, 1, 0, 1, 0' }
  ]

  const visualizerButtons = [
    { id: 'prev', label: '上一步', icon: 'prev' },
    { id: 'play', label: '自动播放', labelPause: '暂停', icon: 'play', iconPause: 'pause' },
    { id: 'next', label: '下一步', icon: 'next' }
  ]

  const steps = ref([])

  // 🌟 动态检测轨道是否放得下（换行时线框隐藏，改用底色标识）
  const numsTrackRef = ref(null)
  const oneLine = ref(true)
  let resizeObserver = null

  const measureTrack = () => {
    const el = numsTrackRef.value
    if (!el) return
    const count = el.querySelectorAll('.array-item-group').length
    if (!count) { oneLine.value = true; return }
    const available = el.clientWidth - 12
    oneLine.value = (count * 36 - 8) <= available
  }

  onMounted(() => {
    if (typeof ResizeObserver !== 'undefined') {
      resizeObserver = new ResizeObserver(() => measureTrack())
      if (numsTrackRef.value) resizeObserver.observe(numsTrackRef.value)
    }
  })

  onUnmounted(() => {
    if (resizeObserver) resizeObserver.disconnect()
  })

  watch(steps, () => nextTick(measureTrack))
  watch(numsTrackRef, (el) => {
    if (el && resizeObserver) resizeObserver.observe(el)
    nextTick(measureTrack)
  })

  const getPhaseClass = (phase) => {
    if (phase === 'accumulate' || phase === 'store') return 'is-warning';
    if (phase === 'match') return 'is-low-zone';
    if (phase === 'done') return 'is-success';
    return '';
  }

  // 🌟 sum 框：扫描期间显示 [0, i]
  const showSumFrame = (step) => {
    return (step.phase === 'accumulate' || step.phase === 'match' || step.phase === 'store') && step.ci >= 0;
  }

  // 🌟 候选区间框：配对命中且长度 > 0 时显示 [j+1, i]
  const showCandFrame = (step) => {
    return step.phase === 'match' && step.j !== null && step.len > 0;
  }

  // 🌟 候选区间框样式：非命中阶段直接隐藏（防止 null + 1 被强转为 1 绕过守卫）
  const getCandFrameStyle = (step) => {
    if (!showCandFrame(step)) return { width: '0px', opacity: 0 }
    return getFrameStyle(step, step.j + 1, step.ci)
  }

  // 🌟 区间线框计算（+6 为轨道左内边距，避免负偏移被裁切）
  const getFrameStyle = (step, l, r) => {
    if (l == null || r == null || l > r) return { width: '0px', opacity: 0 }
    const STRIDE = 36;
    const PADDING = 4;
    const TRACK_PAD = 6;
    const leftPos = TRACK_PAD + l * STRIDE - PADDING;
    const width = (r - l + 1) * STRIDE - 8 + (PADDING * 2);

    return {
      left: `${leftPos}px`,
      width: `${width}px`,
      opacity: 1
    }
  }

  // 原始数组单元格状态
  const getOrigCellClass = (step, idx) => {
    const cls = {};
    if (step.phase !== 'done' && idx > step.ci) cls['is-discarded'] = true;
    return cls;
  }

  // 转换数组单元格状态
  const getConvCellClass = (step, idx) => {
    const cls = {};
    if (step.conv[idx].val === -1) cls['is-converted'] = true;
    if (idx === step.ci && step.phase !== 'init' && step.phase !== 'done') cls['is-mid'] = true;
    if (step.phase !== 'done' && idx > step.ci) cls['is-discarded'] = true;
    if (showCandFrame(step) && idx >= step.j + 1 && idx <= step.ci) {
      cls[step.updated ? 'is-match' : 'is-in-cand'] = true;
    }
    if (step.phase === 'done' && idx >= step.bestL && idx <= step.bestR && step.bestL !== -1) cls['is-match'] = true;
    if (!oneLine.value && showCandFrame(step) && idx >= step.j + 1 && idx <= step.ci) cls['is-in-cand'] = true;
    return cls;
  }

  // 哈希表 entry 状态
  const getMapEntryClass = (step, entry) => {
    const cls = {};
    if (step.phase === 'init' && entry.key === 0) cls['is-anchor'] = true;
    if (step.phase === 'match' && step.j !== null && entry.key === step.sum) cls['is-match'] = true;
    if (step.phase === 'store' && entry.key === step.sum) cls['is-mid'] = true;
    if ((step.phase === 'match' || step.phase === 'store') && entry.key !== step.sum) cls['is-discarded'] = true;
    return cls;
  }

  const calculateSteps = (inputRaw) => {
    // 解析格式： nums 逗号分隔（0/1），如 0, 1, 1, 0, 1, 0
    steps.value = [];
    const nums = String(inputRaw ?? '').split(',').map(x => parseInt(x.trim())).filter(x => !isNaN(x));
    if (nums.length === 0) return;

    const n = nums.length;
    const conv = nums.map(x => (x === 0 ? -1 : x));
    let passNum = 0;

    const numsObj = nums.map((val, idx) => ({ id: `nums-${idx}`, val }));
    const convObj = conv.map((val, idx) => ({ id: `conv-${idx}`, val }));
    // lastIdx 语义：前缀和 → 最早出现下标；哨兵 (0, -1)
    let mapEntries = [{ key: 0, idx: -1 }];

    const pushState = (desc, phase, opts = {}) => {
      steps.value.push({
        nums: JSON.parse(JSON.stringify(numsObj)),
        conv: JSON.parse(JSON.stringify(convObj)),
        mapEntries: JSON.parse(JSON.stringify(mapEntries)),
        phase: phase, // 'init', 'accumulate', 'match', 'store', 'done'
        ci: opts.ci ?? -1,
        sum: opts.sum ?? 0,
        j: opts.j ?? null,
        len: opts.len ?? null,
        updated: opts.updated ?? false,
        storeIdx: opts.storeIdx ?? null,
        hashIdx: opts.hashIdx ?? null,
        result: opts.result ?? 0,
        bestL: opts.bestL ?? -1,
        bestR: opts.bestR ?? -1,
        description: desc,
        passId: passNum++
      });
    }

    pushState(`【预处理】把 0 视为 -1（见第二行转换数组），问题转化为「求和为 0 的最长子数组」。哈希表放入哨兵 ( 0 → 下标 -1 )：表示前缀和 0 最早"出现"在 -1 处，覆盖 [0, i] 整体恰好合法的情况（如 nums = [0, 1]）。`, 'init', { result: 0 });

    // ================= 主循环：复刻 Java =================
    let sum = 0, result = 0, bestL = -1, bestR = -1;
    for (let i = 0; i < n; i++) {
      // sum += nums[i]（已转换）
      sum += conv[i];
      pushState(`【累加前缀和】sum += v[${i}]，sum = ${sum}。sum > 0 说明 1 偏多，sum < 0 说明 0 偏多，sum = 0 说明 [0, ${i}] 内 0 和 1 数量相等。`, 'accumulate', { ci: i, sum, result, bestL, bestR });

      // result = Math.max(i - hash.getOrDefault(sum, i), result)
      const hit = mapEntries.find(e => e.key === sum);
      const j = hit ? hit.idx : null;
      const len = hit ? i - hit.idx : 0;
      const updated = len > result;
      if (updated) {
        result = len;
        bestL = j + 1;
        bestR = i;
      }
      if (hit) {
        pushState(`【计算长度】前缀和 ${sum} 最早出现在下标 ${j}，说明 (${j}, ${i}] 这段的和为 0（橙框区间），长度 = ${i} - (${j}) = ${len}。result = max(旧值, ${len}) = ${result}${updated ? '，刷新最长！' : '，未刷新。'}`, 'match', { ci: i, sum, j, len, updated, result, bestL, bestR });
      } else {
        pushState(`【计算长度】前缀和 ${sum} 首次出现，无可配对的下标（getOrDefault 返回 i 本身），长度按 ${i} - ${i} = 0 计，result 保持 ${result}。`, 'match', { ci: i, sum, j: null, len: 0, updated: false, result, bestL, bestR });
      }

      // if (!hash.containsKey(sum)) hash.put(sum, i)
      if (!hit) {
        mapEntries.push({ key: sum, idx: i });
        pushState(`【记录】首次见到前缀和 ${sum}，存入 hash[${sum}] = ${i}。只有保留最早下标，将来配对时区间才可能最长。`, 'store', { ci: i, sum, storeIdx: i, result, bestL, bestR });
      } else {
        pushState(`【记录】前缀和 ${sum} 已记录在最早下标 ${hit.idx}，跳过更新——重复的 K 直接忽略，保留最早下标才能取到最长长度。`, 'store', { ci: i, sum, hashIdx: hit.idx, result, bestL, bestR });
      }
    }

    pushState(`【✅ 完成】扫描结束，含相同数量 0 和 1 的最长连续数组长度为 ${result}（绿色区间 [${bestL}, ${bestR}]）。时间复杂度 O(n)，空间复杂度 O(n)。`, 'done', { ci: n - 1, sum, result, bestL, bestR });
  }
</script>

<style scoped>
  .contiguous-container {
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

  .stat-box.sum-box {
    min-width: 120px;
  }

  .stat-box.sum-box .value {
    color: #10b981;
  }

  .stat-box.len-box {
    min-width: 120px;
  }

  .stat-box.len-box .value {
    color: #f97316;
  }

  .stat-box.res-box {
    min-width: 130px;
  }

  .stat-box.res-box .value {
    color: #0ea5e9;
  }

  .stat-box.target-box {
    min-width: 320px;
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

  .upd {
    color: #10b981;
    font-size: 12px;
    margin-left: 6px;
    animation: popIn 0.3s ease-out;
  }

  .empty-hint {
    color: var(--vp-c-text-3);
    font-style: italic;
    font-size: 14px;
    font-weight: normal;
  }

  /* ================= 行容器 ================= */
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
    padding-top: 26px;
    flex-wrap: nowrap;
  }

  .array-track.map-track {
    flex-wrap: wrap;
  }

  .array-track.nums-track {
    padding-left: 6px;
    padding-right: 6px;
    flex-wrap: wrap;
  }

  /* 🌟 区间线框：sum(绿) + 候选区间(橙/绿) */
  .window-frame-minimal {
    position: absolute;
    border-radius: 6px;
    z-index: 1;
    pointer-events: none;
    transition: all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
  }

  .window-frame-minimal.frame-sum {
    top: 18px;
    height: 52px;
    border: 1.5px solid #10b981;
    background: rgba(16, 185, 129, 0.04);
  }

  .window-frame-minimal.frame-cand {
    top: 22px;
    height: 44px;
    border: 1.5px solid #f97316;
    background: rgba(249, 115, 22, 0.06);
  }

  .window-frame-minimal.frame-cand.is-valid-frame {
    border-color: #10b981;
    background: rgba(16, 185, 129, 0.08);
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

  /* 🌟 哈希表 entry 芯片 */
  .map-chip {
    display: flex;
    align-items: center;
    gap: 6px;
    height: 36px;
    padding: 0 10px;
    flex-shrink: 0;
    border: 1px solid var(--vp-c-border);
    border-radius: 6px;
    background: var(--vp-c-bg-elv);
    font-family: monospace;
    font-size: 13px;
    font-weight: 600;
    color: var(--vp-c-text-1);
    transition: all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
    animation: popIn 0.3s ease-out;
  }

  .map-chip .map-key {
    color: #8b5cf6;
  }

  .map-chip .map-arrow {
    color: var(--vp-c-text-3);
  }

  .map-chip .map-count {
    color: #0ea5e9;
  }

  /* 视觉特效 (状态语义字典) */
  .is-anchor {
    border-color: #f97316;
    color: #f97316;
    background: rgba(249, 115, 22, 0.1);
  }

  .is-anchor .map-key,
  .is-anchor .map-count {
    color: #f97316;
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
  }

  .is-converted {
    color: #f43f5e;
  }

  .is-in-cand {
    border-color: #f97316;
    background: rgba(249, 115, 22, 0.12);
    color: #f97316;
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
    margin-top: 12px;
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

  /* ================= 🖥️ 桌面端紧凑模式 ================= */
  @media (min-width: 768px) {
    .contiguous-container {
      gap: 10px;
      padding: 8px 0;
    }

    .stat-box {
      padding: 6px 16px;
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

    .divider {
      width: auto;
      flex: 0 0 auto;
      justify-content: flex-end;
      margin-top: 36px;
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

    .array-wrapper {
      width: auto;
      flex: 0 1 auto;
      min-width: 0;
      padding: 0;
      justify-content: flex-start;
    }

    .array-track {
      padding-top: 26px;
      padding-bottom: 6px;
    }

    .pointer-track,
    .pointer-track.ptr-tight {
      min-height: 30px;
      margin-top: 12px;
    }
  }
</style>
