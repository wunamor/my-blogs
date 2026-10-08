<template>
  <VisualizerLayout
    title="和可被 K 整除的子数组 / 前缀和余数 + 哈希表 (LeetCode 974)"
    storageKey="lc974-subarrays-div-by-k-config"
    defaultData="4, 5, 0, -7, -4, 6, -1, 3 | 5"
    :inputs="visualizerInputs"
    :defaultInterval="1000"
    :actionButtons="visualizerButtons"
    :steps="steps"
    @calculate="calculateSteps"
  >
    <template #visualization="{ step }">
      <div
        class="divk-container"
        v-if="step && step.nums"
      >

        <!-- 顶部：k / sum / sum%k + 核心判定公式 -->
        <div class="dashboard-minimal">
          <div class="stat-box k-box">
            <span class="label">目标值 k</span>
            <div class="value expr-value">{{ step.k }}</div>
          </div>
          <div class="stat-box sum-box">
            <span class="label">sum [0, i]</span>
            <div class="value expr-value">{{ step.phase === 'init' ? '?' : step.sum }}</div>
          </div>
          <div class="stat-box key-box">
            <span class="label">sum % k（修正后）</span>
            <div class="value expr-value">{{ step.key !== null ? step.key : '?' }}</div>
          </div>
          <div
            class="stat-box target-box"
            :class="getPhaseClass(step.phase)"
          >
            <span class="label">核心判定公式</span>
            <div class="value expr-value">
              <template v-if="step.phase === 'accumulate'">
                sum += nums[{{ step.ci }}]
                <span class="calc-part">
                  => {{ step.sum - step.nums[step.ci].val }} + {{ step.nums[step.ci].val }} =
                  <strong>{{ step.sum }}</strong>
                </span>
              </template>
              <template v-else-if="step.phase === 'find'">
                key = ((sum % k) + k) % k = {{ step.key }}
                <span class="calc-part">
                  result += map[{{ step.key }}] = {{ step.foundCount }} →
                  <strong :class="step.foundCount > 0 ? 'text-ok' : 'text-no'">{{ step.result }}</strong>
                </span>
              </template>
              <template v-else-if="step.phase === 'store'">
                map[{{ step.storeKey }}] ++
                <span class="calc-part">
                  => 出现次数变为 <strong>{{ step.storedCount }}</strong>
                </span>
              </template>
              <template v-else-if="step.phase === 'done'">
                和可被 {{ step.k }} 整除的子数组共 <strong class="text-ok">{{ step.result }}</strong> 个
              </template>
              <template v-else>
                <span class="empty-hint">哈希表放入哨兵 (余数 0 → 出现 1 次)，准备开始扫描...</span>
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
            <div class="array-track nums-track" ref="numsTrackRef">
              <!-- 🌟 sum 范围框 [0, i]（仅单行时显示） -->
              <div
                class="window-frame-minimal frame-sum"
                :class="{ 'is-hidden': !showSumFrame(step) }"
                :style="getFrameStyle(step, 0, step.ci)"
                v-if="oneLine"
              ></div>
              <!-- 🌟 同余范围框 [0, j]（仅单行时显示） -->
              <div
                class="window-frame-minimal frame-sumk"
                :class="{ 'is-hidden': !showSplitFrame(step) }"
                :style="getFrameStyle(step, 0, step.j)"
                v-if="oneLine"
              ></div>
              <!-- 🌟 整除范围框 [j+1, i]（仅单行时显示） -->
              <div
                class="window-frame-minimal frame-k"
                :class="{ 'is-hidden': !showSplitFrame(step) }"
                :style="getFrameStyle(step, step.kL, step.ci)"
                v-if="oneLine"
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
                <div class="pointer-track ptr-tight">
                  <span class="idx">{{ idx }}</span>
                  <div class="ptr-labels">
                    <span
                      v-if="step.ci === idx && step.phase !== 'done'"
                      class="ptr ptr-mid"
                    >i</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- 行 2：余数哈希表 -->
        <div class="array-row">
          <div class="divider">
            <span class="arrow-down">哈希表 map (余数 → 次数)</span>
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
                <span class="map-count">出现 {{ entry.count }} 次</span>
              </div>

              <!-- 查询未命中时的幽灵格 -->
              <div
                class="map-chip ghost is-mismatch"
                v-if="step.phase === 'find' && step.foundCount === 0"
              >
                <span class="map-key">{{ step.key }}</span>
                <span class="map-arrow">→</span>
                <span class="map-count">出现 0 次</span>
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

  // 🌟 多输入声明：数组 + k（由 VisualizerLayout 的用例编辑器统一管理）
  const visualizerInputs = [
    { id: 'arr', label: '数组 arr', placeholder: '4, 5, 0, -7, -4, 6, -1, 3' },
    { id: 'k', label: 'k', placeholder: '5', width: 70 }
  ]

  const visualizerButtons = [
    { id: 'prev', label: '上一步', icon: 'prev' },
    { id: 'play', label: '自动播放', labelPause: '暂停', icon: 'play', iconPause: 'pause' },
    { id: 'next', label: '下一步', icon: 'next' }
  ]

  const steps = ref([])

  // 🌟 动态检测 nums 轨道是否放得下（放不下则换行，绝对定位线框随之隐藏）
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
    if (phase === 'find') return 'is-low-zone';
    if (phase === 'done') return 'is-success';
    return '';
  }

  // 🌟 sum 框：扫描期间始终显示 [0, i]
  const showSumFrame = (step) => {
    return (step.phase === 'accumulate' || step.phase === 'find' || step.phase === 'store') && step.ci >= 0;
  }

  // 🌟 同余 / 整除拆分框：仅在查询命中时显示
  const showSplitFrame = (step) => {
    return step.phase === 'find' && step.foundCount > 0;
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

  // nums 单元格状态
  const getNumsCellClass = (step, idx) => {
    const cls = {};
    if (idx === step.ci && step.phase !== 'init' && step.phase !== 'done') cls['is-mid'] = true;
    if (step.phase !== 'done' && idx > step.ci) cls['is-discarded'] = true;
    if (step.phase === 'done') cls['is-in-window'] = true;
    if (showSplitFrame(step) && idx >= step.kL && idx <= step.ci) cls['is-in-k'] = true;
    if (!oneLine.value && showSplitFrame(step) && idx >= 0 && idx <= step.j) cls['in-sumk'] = true;
    return cls;
  }

  // 哈希表 entry 状态
  const getMapEntryClass = (step, entry) => {
    const cls = {};
    if (step.phase === 'init' && entry.key === 0) cls['is-anchor'] = true;
    if (step.phase === 'find') {
      if (entry.key === step.key) cls[step.foundCount > 0 ? 'is-match' : 'is-mismatch'] = true;
      else cls['is-discarded'] = true;
    }
    if (step.phase === 'store' && entry.key === step.storeKey) cls['is-mid'] = true;
    return cls;
  }

  const calculateSteps = (inputRaw) => {
    // 解析格式： arr | k（由 VisualizerLayout 用例编辑器拼接回传）
    steps.value = [];
    const parts = inputRaw.split('|').map(s => s.trim());
    if (parts.length < 2) return;

    const nums = parts[0].split(',').map(x => parseInt(x.trim())).filter(x => !isNaN(x));
    const k = parseInt(parts[1]);
    if (nums.length === 0 || isNaN(k) || k === 0) return;

    const n = nums.length;
    let passNum = 0;

    const numsObj = nums.map((val, idx) => ({ id: `nums-${idx}`, val }));
    // lastIdx 仅用于可视化：记录该余数最近一次出现的下标 j，以便画出 (j, i] 命中区间
    let mapEntries = [{ key: 0, count: 1, lastIdx: -1 }];

    const pushState = (desc, phase, opts = {}) => {
      steps.value.push({
        nums: JSON.parse(JSON.stringify(numsObj)),
        mapEntries: JSON.parse(JSON.stringify(mapEntries)),
        k,
        phase: phase, // 'init', 'accumulate', 'find', 'store', 'done'
        ci: opts.ci ?? -1,
        sum: opts.sum ?? 0,
        key: opts.key ?? null,
        foundCount: opts.foundCount ?? 0,
        j: opts.j ?? null,
        kL: opts.kL ?? null,
        storeKey: opts.storeKey ?? null,
        storedCount: opts.storedCount ?? null,
        result: opts.result ?? 0,
        description: desc,
        passId: passNum++
      });
    }

    pushState(`【初始化】哈希表先放入哨兵 ( 余数 0 → 出现 1 次 )：当某个前缀和的余数恰好为 0 时（即 [0, i] 整体可被 ${k} 整除），正好命中这个 1。`, 'init', { sum: 0, result: 0 });

    // ================= 主循环：复刻 Java =================
    let sum = 0, result = 0;
    for (let i = 0; i < n; i++) {
      // sum += num
      sum += nums[i];
      pushState(`【累加前缀和】sum += nums[${i}]，sum = ${sum}，它代表 [0, ${i}] 区间的总和。`, 'accumulate', { ci: i, sum, result });

      // key = ((sum % k) + k) % k; result += map.getOrDefault(key, 0)
      const key = ((sum % k) + k) % k;
      const hit = mapEntries.find(e => e.key === key);
      const foundCount = hit ? hit.count : 0;
      result += foundCount;
      if (foundCount > 0) {
        const j = hit.lastIdx;
        pushState(`【查询哈希表】sum % k 修正后余数 key = ${key}（Java/C++ 负数修正公式 ((sum % k) + k) % k）。之前有 ${foundCount} 个前缀和的余数同为 ${key}（最近一个在下标 ${j}），根据同余定理，绿框 [0, ${i}] 减去紫框 [0, ${j}]，橙框 [${j + 1}, ${i}] 这段区间和必能被 ${k} 整除 ✓。result += ${foundCount} → ${result}。`, 'find', { ci: i, sum, key, foundCount, j, kL: j + 1, result });
      } else {
        pushState(`【查询哈希表】修正后余数 key = ${key}，哈希表中尚未出现过，result 不增加。`, 'find', { ci: i, sum, key, foundCount: 0, result });
      }

      // map.put(key, getOrDefault(key,0) + 1)
      const cur = mapEntries.find(e => e.key === key);
      if (cur) {
        cur.count += 1;
        cur.lastIdx = i;
        pushState(`【记录余数】把当前余数 ${key} 记入哈希表：出现次数变为 ${cur.count} 次，供后面的位置查询（先查后存，避免自己和自己配对）。`, 'store', { ci: i, sum, storeKey: key, storedCount: cur.count, result });
      } else {
        mapEntries.push({ key, count: 1, lastIdx: i });
        pushState(`【记录余数】余数 ${key} 首次出现，哈希表新增 ( ${key} → 出现 1 次 )，供后面的位置查询（先查后存，避免自己和自己配对）。`, 'store', { ci: i, sum, storeKey: key, storedCount: 1, result });
      }
    }

    pushState(`【✅ 完成】扫描结束，和可被 ${k} 整除的子数组共有 ${result} 个。时间复杂度 O(n)，空间复杂度 O(k)。`, 'done', { ci: n - 1, sum, result });
  }
</script>

<style scoped>
  .divk-container {
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

  .stat-box.k-box {
    min-width: 110px;
  }

  .stat-box.k-box .value {
    color: #f97316;
  }

  .stat-box.sum-box {
    min-width: 130px;
  }

  .stat-box.sum-box .value {
    color: #10b981;
  }

  .stat-box.key-box {
    min-width: 150px;
  }

  .stat-box.key-box .value {
    color: #8b5cf6;
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

  .text-no {
    color: #ef4444;
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

  /* 🌟 三层区间线框 */
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

  .window-frame-minimal.frame-sumk {
    top: 22px;
    height: 44px;
    border: 1.5px solid #8b5cf6;
    background: rgba(139, 92, 246, 0.05);
  }

  .window-frame-minimal.frame-k {
    top: 22px;
    height: 44px;
    border: 1.5px solid #f97316;
    background: rgba(249, 115, 22, 0.06);
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

  .map-chip.ghost {
    border-style: dashed;
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

  .is-mismatch {
    border-color: #ef4444;
    background: rgba(239, 68, 68, 0.08);
    color: #ef4444;
  }

  .is-in-k {
    border-color: #f97316;
    background: rgba(249, 115, 22, 0.12);
    color: #f97316;
  }

  .in-sumk {
    border-color: #8b5cf6;
    background: rgba(139, 92, 246, 0.1);
    color: #8b5cf6;
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
    .divk-container {
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
