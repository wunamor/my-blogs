<template>
  <VisualizerLayout
    title="寻找数组的中心下标 / 总和 + 左右区间滑动 (LeetCode 724)"
    storageKey="lc724-pivot-index-total-sum-config"
    defaultData="1, 7, 3, 6, 5, 6"
    :defaultInterval="1000"
    :actionButtons="visualizerButtons"
    :steps="steps"
    @calculate="calculateSteps"
  >
    <template #visualization="{ step }">
      <div
        class="pivot-total-container"
        v-if="step && step.nums"
      >

        <!-- 顶部：极致简约面板（总和 + 核心判定公式） -->
        <div class="dashboard-minimal">
          <div
            class="stat-box sum-box"
            :class="{ 'is-warning': step.phase === 'sum' }"
          >
            <span class="label">总和 sum</span>
            <div class="value expr-value">
              {{ step.sum !== null ? step.sum : '?' }}
            </div>
          </div>
          <div
            class="stat-box target-box"
            :class="getPhaseClass(step.phase)"
          >
            <span class="label">核心判定公式</span>
            <div class="value expr-value">
              <template v-if="step.phase === 'sum'">
                sum += nums[{{ step.si }}]
                <span class="calc-part">
                  => {{ step.sum - step.nums[step.si].val }} + {{ step.nums[step.si].val }} =
                  <strong>{{ step.sum }}</strong>
                </span>
              </template>
              <template v-else-if="step.phase === 'scan'">
                sumLeft == sumRight ?
                <span class="calc-part">
                  => {{ step.sumLeft }} == {{ step.sumRight }} →
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
                <span class="empty-hint">准备第一轮：累加求出整个数组的总和...</span>
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
        <div class="array-wrapper">
          <div class="array-track">

            <!-- 🌟 求和阶段的已累加区间 [0, si] -->
            <div
              class="window-frame-minimal frame-sum"
              :class="{ 'is-hidden': step.phase !== 'sum' }"
              :style="getFrameStyle(step, step.sumL, step.sumR)"
            ></div>
            <!-- 🌟 左区间 [0, i-1] 包裹框 -->
            <div
              class="window-frame-minimal frame-left"
              :class="{ 'is-hidden': step.phase !== 'scan' }"
              :style="getFrameStyle(step, 0, step.ci - 1)"
            ></div>
            <!-- 🌟 右区间 [i+1, n-1] 包裹框 -->
            <div
              class="window-frame-minimal frame-right"
              :class="{ 'is-hidden': step.phase !== 'scan' }"
              :style="getFrameStyle(step, step.ci + 1, step.nums.length - 1)"
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
              <div class="pointer-track">
                <span class="idx">{{ idx }}</span>
                <div class="ptr-labels">
                  <span
                    v-if="step.phase === 'sum' && idx === step.si"
                    class="ptr ptr-mid"
                  >i</span>
                  <span
                    v-if="step.phase === 'scan' && idx === step.ci"
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

  // 🌟 通用区间包裹框计算（l, r 为闭区间下标，l > r 时自动隐藏）
  const getFrameStyle = (step, l, r) => {
    if (l == null || r == null || l > r) return { width: '0px', opacity: 0 }
    const STRIDE = 36; // 紧凑模式：宽28 + 间距8
    const PADDING = 4;
    const leftPos = l * STRIDE - PADDING;
    const width = (r - l + 1) * STRIDE - 8 + (PADDING * 2);

    return {
      left: `${leftPos}px`,
      width: `${width}px`,
      opacity: 1
    }
  }

  const getPhaseClass = (phase) => {
    if (phase === 'sum') return 'is-warning';
    if (phase === 'scan') return 'is-low-zone';
    if (phase === 'done') return 'is-success';
    return '';
  }

  // nums 单元格状态
  const getNumsCellClass = (step, idx) => {
    const cls = {};
    if (step.phase === 'sum' && idx === step.si) cls['is-mid'] = true;
    if (step.phase === 'scan' && idx === step.ci) cls['is-checking'] = true;
    if (step.phase === 'done' && idx === step.pivot) cls['is-match'] = true;
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

    const pushState = (desc, phase, opts = {}) => {
      steps.value.push({
        nums: JSON.parse(JSON.stringify(numsObj)),
        phase: phase, // 'init', 'sum', 'scan', 'done'
        si: opts.si ?? -1,
        sumL: opts.sumL ?? null,
        sumR: opts.sumR ?? null,
        sum: opts.sum ?? null,
        ci: opts.ci ?? -1,
        sumLeft: opts.sumLeft ?? null,
        sumRight: opts.sumRight ?? null,
        checkOk: opts.checkOk ?? null,
        pivot: opts.pivot ?? -1,
        description: desc,
        passId: passNum++
      });
    }

    pushState(`【初始化】本思路不需要 dp 数组：先扫一遍求出整个数组的总和 sum，之后判断任意下标 i 时，右侧和可以直接由 sum - 左侧和 - nums[i] 推出。`, 'init');

    // ================= 阶段 1：第一轮遍历，求总和 sum =================
    let sum = 0;
    for (let i = 0; i < n; i++) {
      sum += nums[i];
      pushState(`【求总和】sum += nums[${i}]，累加到 ${sum}。`, 'sum', { si: i, sum, sumL: 0, sumR: i });
    }
    pushState(`【总和完成】整个数组的总和 sum = ${sum}。第二轮从左往右滑动时，只需维护 sumLeft，sumRight 随时可由总和算出。`, 'sum', { si: -1, sum, sumL: 0, sumR: n - 1 });

    // ================= 阶段 2：复刻 Java —— sumLeft / sumRight 同步滑动 =================
    let i = 0, sumLeft = 0, sumRight = sum - nums[i];
    for (; i < n - 1; i++) {
      if (sumLeft === sumRight) {
        pushState(`【✅ 找到中心下标】i = ${i}：sumLeft = ${sumLeft} 与 sumRight = ${sumRight} 相等！直接返回 ${i}。`, 'done', { ci: i, sumLeft, sumRight, checkOk: true, pivot: i });
        return;
      }
      pushState(`【比较】i = ${i}：左区间和 sumLeft = ${sumLeft}，右区间和 sumRight = ${sumRight}，不相等。窗口右移：sumLeft += nums[${i}]，sumRight -= nums[${i + 1}]。`, 'scan', { ci: i, sumLeft, sumRight, checkOk: false });

      sumLeft += nums[i];
      sumRight -= nums[i + 1];
    }

    // 最后一个下标的收尾判断：return sumLeft == sumRight ? n - 1 : -1;
    if (sumLeft === sumRight) {
      pushState(`【✅ 找到中心下标】i = ${n - 1}：sumLeft = ${sumLeft} 与 sumRight = ${sumRight} 相等！返回 ${n - 1}。`, 'done', { ci: n - 1, sumLeft, sumRight, checkOk: true, pivot: n - 1 });
    } else {
      pushState(`【结束】所有下标都比较完毕，不存在 sumLeft == sumRight 的位置，返回 -1。`, 'done', { ci: n - 1, sumLeft, sumRight, checkOk: false, pivot: -1 });
    }
  }
</script>

<style scoped>
  .pivot-total-container {
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
    padding: 30px 20px 25px 20px;
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

  /* 🌟 区间包裹框 */
  .window-frame-minimal {
    position: absolute;
    top: 6px;
    height: 44px;
    border-radius: 6px;
    z-index: 1;
    pointer-events: none;
    transition: all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
  }

  .window-frame-minimal.frame-sum {
    background: rgba(139, 92, 246, 0.05);
    border: 1.5px solid #8b5cf6;
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
