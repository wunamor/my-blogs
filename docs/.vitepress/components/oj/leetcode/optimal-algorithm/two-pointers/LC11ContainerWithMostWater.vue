<template>
  <VisualizerLayout
    title="盛最多水的容器 (LeetCode 11) - 对撞双指针"
    storageKey="lc11-container-most-water-config"
    defaultData="1, 8, 6, 2, 5, 4, 8, 3, 7"
    :defaultInterval="1200"
    :actionButtons="visualizerButtons"
    :steps="steps"
    @calculate="calculateSteps"
  >
    <template #visualization="{ step }">
      <div class="water-container-wrapper" v-if="step && step.array">
        
        <!-- 顶部计分板 -->
        <div class="score-board">
          <div class="score-item">
            <span class="label">当前计算面积 = 宽 × 高:</span>
            <span class="value math-expr">
              {{ step.width }} × {{ step.minH }} = <strong class="current-area">{{ step.currentArea }}</strong>
            </span>
          </div>
          <div class="score-item">
            <span class="label">历史最大面积 (Max):</span>
            <span class="value max-area">{{ step.maxArea }}</span>
          </div>
        </div>

        <!-- 物理水槽渲染区 -->
        <div class="pool-viewport">
          <div class="pool-content" :style="{ width: poolWidth + 'px' }">
            
            <!-- 动态背景水体 (根据当前左右指针和最短板生成) -->
            <div 
              class="water-block" 
              v-if="step.water"
              :style="{
                left: step.water.left + 'px',
                width: step.water.width + 'px',
                height: step.water.height + 'px'
              }"
            >
              <div class="water-surface"></div>
              <div class="water-text">{{ step.currentArea }}</div>
            </div>

            <!-- 柱状图挡板 -->
            <div 
              class="pillar-group" 
              v-for="(item, idx) in step.array" 
              :key="idx"
              :style="{ left: (idx * step.gap) + 'px' }"
            >
              <!-- 柱子实体 -->
              <div 
                class="pillar"
                :style="{ height: (item.val * step.scaleY) + 'px' }"
                :class="{
                  'is-left': step.left === idx,
                  'is-right': step.right === idx,
                  'is-discarded': step.discarded.includes(idx),
                  'is-shorter': step.isComparing && (step.left === idx || step.right === idx) && item.val === step.minH,
                  'is-taller': step.isComparing && (step.left === idx || step.right === idx) && item.val !== step.minH
                }"
              >
                <div class="pillar-val">{{ item.val }}</div>
              </div>
              
              <!-- 底部坐标与指针 -->
              <div class="pillar-axis">
                <span class="axis-idx">{{ idx }}</span>
                <span class="ptr left-ptr" v-if="step.left === idx">L</span>
                <span class="ptr right-ptr" v-if="step.right === idx">R</span>
              </div>
            </div>

          </div>
        </div>

      </div>
    </template>
  </VisualizerLayout>
</template>

<script setup>
import { ref, computed } from 'vue'
import VisualizerLayout from '@components/common/visualization/VisualizerLayout.vue'

const visualizerButtons = [
  { id: 'prev', label: '上一步', icon: 'prev' },
  { id: 'play', label: '自动播放', labelPause: '暂停', icon: 'play', iconPause: 'pause' },
  { id: 'next', label: '下一步', icon: 'next' },
  { id: 'skip', label: '跳过本轮', icon: 'skip' }
]

const steps = ref([])

// 画布常量参数，用于计算水体物理坐标
const PILLAR_WIDTH = 20
const GAP_WIDTH = 50
const MAX_PILLAR_HEIGHT = 220

const poolWidth = computed(() => {
  if (steps.value.length === 0) return 600
  return steps.value[0].array.length * GAP_WIDTH + 60
})

const calculateSteps = (inputRaw) => {
  const arr = inputRaw.split(',').map(n => parseInt(n.trim())).filter(n => !isNaN(n))
  if (arr.length < 2) {
    steps.value = []
    return
  }

  // 计算 Y 轴缩放比例，让最高的柱子正好等于 MAX_PILLAR_HEIGHT
  const maxValInArr = Math.max(...arr)
  const scaleY = maxValInArr === 0 ? 1 : MAX_PILLAR_HEIGHT / maxValInArr
  
  const arrayObj = arr.map((val, idx) => ({ id: `p-${idx}`, val: Number(val) }))
  
  steps.value = []
  let passNum = 0
  let discarded = []

  const pushState = (desc, l, r, wArea, w, minH, maxA, isComp = false) => {
    // 计算水体的真实物理像素位置
    let waterRender = null
    if (wArea > 0) {
      waterRender = {
        left: l * GAP_WIDTH + PILLAR_WIDTH / 2, // 居于左柱子中心
        width: (r - l) * GAP_WIDTH,             // 横跨的物理距离
        height: minH * scaleY                   // 真实物理高度
      }
    }

    steps.value.push({
      array: JSON.parse(JSON.stringify(arrayObj)),
      left: l,
      right: r,
      currentArea: wArea,
      width: w,
      minH: minH,
      maxArea: maxA,
      water: waterRender,
      discarded: [...discarded],
      isComparing: isComp,
      gap: GAP_WIDTH,
      scaleY: scaleY,
      description: desc,
      passId: passNum
    })
  }

  // ================= 完美复刻你的 Java 逻辑 =================
  let left = 0
  let right = arrayObj.length - 1
  let max = -1
  let tmp = 0

  pushState(
    `【初始化】对撞双指针从数组两端开始。left 指向 0，right 指向末尾 ${right}。`,
    left, right, 0, 0, 0, 0
  )

  while (left < right) {
    passNum++
    const hLeft = arrayObj[left].val
    const hRight = arrayObj[right].val
    const minH = hLeft < hRight ? hLeft : hRight
    const w = right - left
    tmp = w * minH
    
    const isNewMax = tmp > max
    if (isNewMax) max = tmp

    // 动作 1：计算当前面积并渲染水体
    pushState(
      `【面积计算】受限于“木桶效应”，高由较短的板 ${minH} 决定，宽为 ${w}。当前注水面积 = ${tmp}。${isNewMax ? '🎉 创下历史新高，更新 Max！' : '未超过历史 Max，保持不变。'}`,
      left, right, tmp, w, minH, max, true // true 开启高亮较短板的特效
    )

    // 动作 2：指针移动抉择
    if (hLeft < hRight) {
      discarded.push(left) // 将短板加入废弃集合，变灰
      pushState(
        `【移动短板】因为 left(${hLeft}) < right(${hRight})。若移动长板，宽度变小且高度无法增加，面积必然减小。因此我们果断抛弃左侧短板，让 left 右移碰运气。`,
        left, right, tmp, w, minH, max, true
      )
      left++
    } else {
      discarded.push(right)
      pushState(
        `【移动短板】因为 left(${hLeft}) >= right(${hRight})。只能移动较短的一侧才有可能找到更高的板来弥补宽度的损失。因此抛弃右侧短板，让 right 左移。`,
        left, right, tmp, w, minH, max, true
      )
      right--
    }

    if (left < right) {
      pushState(
        `指针移动完毕，准备进行下一轮注水测算。`,
        left, right, 0, 0, 0, max
      )
    }
  }

  pushState(
    `🎉 两指针相遇，遍历彻底结束！容纳最多水的面积为最终的 Max = ${max}。所有不可能成为边界的短板已被全部剪枝！`,
    -1, -1, 0, 0, 0, max
  )
}
</script>

<style scoped>
.water-container-wrapper {
  display: flex;
  flex-direction: column;
  align-items: center;
  width: 100%;
  padding: 10px 0;
  gap: 20px;
}

/* ================= 计分板 ================= */
.score-board {
  display: flex;
  gap: 30px;
  background-color: var(--vp-c-bg-elv);
  border: 1px dashed var(--vp-c-border);
  padding: 16px 32px;
  border-radius: 8px;
  width: 100%;
  justify-content: center;
  flex-wrap: wrap;
}

.score-item {
  display: flex;
  align-items: center;
  gap: 12px;
  font-size: 14px;
}

.score-item .label {
  color: var(--vp-c-text-2);
}

.math-expr {
  font-family: monospace;
  font-size: 16px;
  color: var(--vp-c-text-1);
}

.current-area {
  color: #3b82f6;
  font-size: 20px;
  font-weight: 900;
}

.max-area {
  color: #ef4444;
  font-size: 22px;
  font-weight: 900;
  background: rgba(239, 68, 68, 0.1);
  padding: 2px 12px;
  border-radius: 6px;
}

/* ================= 物理水槽 viewport ================= */
.pool-viewport {
  width: 100%;
  overflow-x: auto;
  overflow-y: hidden;
  background-color: var(--vp-c-bg-soft);
  border-radius: 12px;
  border: 1px solid var(--vp-c-border);
  padding: 30px 20px 20px 20px;
}

/* 滚动条美化 */
.pool-viewport::-webkit-scrollbar { height: 8px; }
.pool-viewport::-webkit-scrollbar-track { background: transparent; }
.pool-viewport::-webkit-scrollbar-thumb { background-color: var(--vp-c-divider); border-radius: 4px; }
.pool-viewport::-webkit-scrollbar-thumb:hover { background-color: var(--vp-c-text-3); }

.pool-content {
  position: relative;
  height: 280px; /* 容纳 220px的柱子 + 底部坐标轴 */
  margin: 0 auto;
}

/* ================= 水体特效 ================= */
.water-block {
  position: absolute;
  bottom: 40px; /* 贴紧底部轴线 */
  background: rgba(59, 130, 246, 0.25);
  border-left: 2px solid rgba(59, 130, 246, 0.6);
  border-right: 2px solid rgba(59, 130, 246, 0.6);
  border-bottom: none;
  z-index: 1;
  transition: all 0.5s cubic-bezier(0.4, 0, 0.2, 1);
  display: flex;
  justify-content: center;
  align-items: center;
}

.water-surface {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 4px;
  background: rgba(59, 130, 246, 0.8);
  box-shadow: 0 0 10px rgba(59, 130, 246, 0.8);
}

.water-text {
  color: #2563eb;
  font-weight: 900;
  font-size: 24px;
  text-shadow: 0 0 5px rgba(255,255,255,0.8);
  opacity: 0.8;
}

/* ================= 柱状挡板 ================= */
.pillar-group {
  position: absolute;
  bottom: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  width: 20px;
  z-index: 2;
}

.pillar {
  width: 100%;
  background: var(--vp-c-text-1);
  border-radius: 4px 4px 0 0;
  position: relative;
  transition: all 0.3s;
  box-shadow: 2px 0 5px rgba(0,0,0,0.1);
}

.pillar-val {
  position: absolute;
  top: -24px;
  left: 50%;
  transform: translateX(-50%);
  font-weight: bold;
  font-size: 14px;
  color: var(--vp-c-text-2);
}

/* 状态颜色 */
.pillar.is-left, .pillar.is-right {
  background: #3b82f6; /* 当前激活指针默认为蓝色 */
  box-shadow: 0 0 12px rgba(59, 130, 246, 0.6);
}

.pillar.is-left .pillar-val, .pillar.is-right .pillar-val {
  color: #3b82f6;
}

/* 对比时，短板变红警告，长板变绿稳健 */
.pillar.is-shorter {
  background: #ef4444 !important;
  box-shadow: 0 0 15px rgba(239, 68, 68, 0.8) !important;
}
.pillar.is-shorter .pillar-val { color: #ef4444; }

.pillar.is-taller {
  background: #10b981 !important;
  box-shadow: 0 0 12px rgba(16, 185, 129, 0.5) !important;
}
.pillar.is-taller .pillar-val { color: #10b981; }

/* 已经被抛弃在边界之外的柱子，降低透明度，视觉降噪 */
.pillar.is-discarded {
  background: var(--vp-c-border);
  opacity: 0.3;
  box-shadow: none;
}
.pillar.is-discarded .pillar-val { color: var(--vp-c-text-3); }

/* ================= 底部坐标系 ================= */
.pillar-axis {
  height: 40px;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding-top: 4px;
  border-top: 2px solid var(--vp-c-border);
  width: 30px; /* 比柱子稍宽，构成一条连续的底轴 */
}

.axis-idx {
  font-size: 12px;
  color: var(--vp-c-text-3);
}

.ptr {
  margin-top: 2px;
  font-size: 10px;
  padding: 1px 4px;
  border-radius: 4px;
  font-weight: bold;
  color: white;
}
.left-ptr, .right-ptr { background: #3b82f6; }
.pillar.is-shorter ~ .pillar-axis .ptr { background: #ef4444; }
.pillar.is-taller ~ .pillar-axis .ptr { background: #10b981; }
</style>