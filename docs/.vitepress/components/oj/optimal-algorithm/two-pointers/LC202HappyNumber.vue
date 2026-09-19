<template>
  <VisualizerLayout
    title="快乐数 (LeetCode 202) - 快慢指针判环"
    storageKey="lc202-happy-number-config"
    defaultData="19"
    :defaultInterval="800"
    :actionButtons="visualizerButtons"
    :steps="steps"
    @calculate="calculateSteps"
  >
    <template #visualization="{ step }">
      <div class="happy-number-container" v-if="step && step.nodes">

        <div class="calc-board" v-if="step.calcStr">
          <div class="calc-title">
            <span class="badge warning">当前计算 (func)</span>
          </div>
          <div class="calc-content">{{ step.calcStr }}</div>
        </div>

        <div class="divider">
          <div class="arrow-down">↓ 映射为虚拟链表节点 ↓</div>
        </div>

        <div class="list-wrapper">
          <div class="list-title">
            <span class="badge primary">虚拟链表空间</span>
            <span class="desc">若遇死循环，fast 指针将瞬移回之前的节点，形成闭环。</span>
          </div>
  
          <div class="canvas-viewport">
            <div class="canvas-content" :style="{ width: step.canvasWidth + 'px' }">
            
              <svg class="edges-svg">
                <defs>
                  <marker id="arrowhead" markerWidth="10" markerHeight="7" refX="9" refY="3.5" orient="auto">
                    <polygon points="0 0, 10 3.5, 0 7" fill="var(--vp-c-text-3)" />
                  </marker>
                </defs>
                <template v-for="(edge, idx) in step.edges" :key="idx">
                  <line v-if="!edge.isSelf" :x1="edge.x1" :y1="edge.y1" :x2="edge.x2" :y2="edge.y2" stroke="var(--vp-c-text-3)" stroke-width="2" marker-end="url(#arrowhead)" />
                  <path v-else :d="edge.pathData" fill="none" stroke="var(--vp-c-text-3)" stroke-width="2" marker-end="url(#arrowhead)" />
                </template>
              </svg>

              <template v-for="(node, idx) in step.nodes" :key="idx">
                <div 
                  class="node-wrapper-abs"
                  :style="{ left: node.x + 'px', top: node.y + 'px' }"
                >
                  <div
                    class="node-box"
                    :class="{
                      'is-slow': step.slowIdx === idx && step.slowIdx !== step.fastIdx,
                      'is-fast': step.fastIdx === idx && step.slowIdx !== step.fastIdx,
                      'is-both': step.slowIdx === idx && step.fastIdx === idx
                    }"
                  >
                    {{ node.val }}
                  </div>
                  <div class="pointers">
                    <span v-if="step.slowIdx === idx" class="ptr slow-ptr">slow</span>
                    <span v-if="step.fastIdx === idx" class="ptr fast-ptr">fast</span>
                  </div>
                </div>
              </template>
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
  { id: 'next', label: '下一步', icon: 'next' },
  { id: 'skip', label: '跳过本轮', icon: 'skip' }
]

const steps = ref([])

// 模拟你 Java 代码中的 func(n)
const doFunc = (num) => {
  if (num === 0) return { sum: 0, expr: '0² = 0' }
  
  let sum = 0
  let detail = []
  // 将数字拆分为单字符数组进行按位运算
  let digits = String(num).split('').map(Number)
  
  for (let d of digits) {
    sum += d * d
    detail.push(`${d}²`)
  }
  return { sum, expr: `${num}  =>  ${detail.join(' + ')} = ${sum}` }
}

// ==========================================
// 核心升级：增加几何测算与 SVG 边生成逻辑
// ==========================================
const getEdge = (p1, p2, radius = 24) => {
  const dx = p2.x - p1.x;
  const dy = p2.y - p1.y;
  const dist = Math.sqrt(dx * dx + dy * dy);
  if (dist === 0) return null;
  
  // 利用相似三角形，将线段从节点中心缩进到节点边缘，防止箭头被圆球挡住
  const ratio1 = radius / dist;
  const ratio2 = (radius + 8) / dist; 
  return {
    isSelf: false,
    x1: p1.x + dx * ratio1,
    y1: p1.y + dy * ratio1,
    x2: p2.x - dx * ratio2,
    y2: p2.y - dy * ratio2
  };
}

const calculateSteps = (inputRaw) => {
  const n = parseInt(inputRaw.trim())
  if (isNaN(n)) {
    steps.value = []
    return
  }

  // 💡 第一步：上帝视角“预执行”。在动画开始前，先探明整条链条的最终形态，以便计算物理坐标！
  let fullSeq = [n]
  let cycleStartIdx = -1
  let curr = n
  while (true) {
    let next = doFunc(curr).sum
    let idx = fullSeq.indexOf(next)
    if (idx !== -1) {
      cycleStartIdx = idx
      break
    }
    fullSeq.push(next)
    curr = next
  }

  // 💡 第二步：利用极坐标系数学公式，预先分配所有节点在 2D 画布上的坐标
  const coords = []
  const GAP = 80       // 节点间距
  const CY = 180       // 画布垂直中心
  const loopLen = fullSeq.length - cycleStartIdx

  for (let i = 0; i < fullSeq.length; i++) {
    if (i < cycleStartIdx) {
      // 尾巴部分：走直线
      coords.push({ x: 60 + i * GAP, y: CY })
    } else {
      if (loopLen === 1) {
        // 快乐数最后收敛于 1，只有它自己一个孤点闭环
        coords.push({ x: 60 + i * GAP, y: CY })
      } else {
        // 核心魔法：环形部分走圆的轨迹！
        const R = Math.max(60, (loopLen * GAP) / (2 * Math.PI)) // 动态计算圆的半径
        const cx = 60 + cycleStartIdx * GAP + R                 // 圆心 X
        const k = i - cycleStartIdx                             // 当前节点在环中的次序
        const theta = Math.PI - (k / loopLen) * 2 * Math.PI     // 计算极角 (顺时针)
        coords.push({
          x: cx + R * Math.cos(theta),
          y: CY - R * Math.sin(theta)
        })
      }
    }
  }

  // 动态计算所需的最宽画布尺寸，防止环太大被裁切
  const canvasWidth = Math.max(800, Math.max(...coords.map(c => c.x)) + 120)

  // 💡 第三步：正式开始按帧推演（利用预计算好的坐标系）
  steps.value = []
  let passNum = 0
  let uniqueSeq = [n]
  const addUnique = (val) => { if (!uniqueSeq.includes(val)) uniqueSeq.push(val) }

  const pushState = (desc, calc = '') => {
    // 1. 提取当前已发现的节点实体
    const currentNodes = uniqueSeq.map((val, i) => ({ val, x: coords[i].x, y: coords[i].y }))
    
    // 2. 组装当前已连接的线段
    const currentEdges = []
    for (let i = 0; i < uniqueSeq.length - 1; i++) {
      currentEdges.push(getEdge(coords[i], coords[i+1]))
    }

    // 3. 判断整个“死亡闭环”是否已经全部暴露
    if (uniqueSeq.length === fullSeq.length && uniqueSeq.length > 0) {
      if (loopLen === 1) {
        const p = coords[cycleStartIdx]
        // 生成自我指向的弧形曲线
        currentEdges.push({ isSelf: true, pathData: `M ${p.x + 16} ${p.y - 16} A 18 18 0 1 1 ${p.x + 24} ${p.y + 4}` })
      } else {
        // 连上环形的最后一块拼图：首尾相连！
        currentEdges.push(getEdge(coords[fullSeq.length - 1], coords[cycleStartIdx]))
      }
    }

    steps.value.push({
      nodes: currentNodes,
      edges: currentEdges.filter(e => e !== null),
      slowIdx: uniqueSeq.indexOf(slow),
      fastIdx: uniqueSeq.indexOf(fast),
      canvasWidth,
      calcStr: calc,
      description: desc,
      passId: passNum
    })
  }

  // --- 初始化运行 ---
  let s1 = doFunc(n)
  let slow = s1.sum
  addUnique(slow)

  let f1 = doFunc(n)
  let f2 = doFunc(f1.sum)
  let fast = f2.sum
  addUnique(f1.sum)
  addUnique(fast)

  pushState(`【初始化】将运算视为 next 指针。令 slow = func(n), fast = func(func(n))。`, `[slow]: ${s1.expr}  |  [fast]: ${f2.expr}`)

  // --- 追逐逻辑 ---
  while (slow !== fast) {
    passNum++
    let ns = doFunc(slow)
    slow = ns.sum
    addUnique(slow)
    pushState(`【第 ${passNum} 轮】slow 往前走 1 步，到达节点 ${slow}。`, `[slow 计算]: ${ns.expr}`)

    let nf1 = doFunc(fast)
    fast = nf1.sum
    addUnique(fast)
    pushState(`【第 ${passNum} 轮】fast 往前走第 1 步，到达节点 ${fast}。`, `[fast 第一步]: ${nf1.expr}`)

    let nf2 = doFunc(fast)
    fast = nf2.sum
    addUnique(fast)
    pushState(`【第 ${passNum} 轮】fast 往前走第 2 步，到达节点 ${fast}。`, `[fast 第二步]: ${nf2.expr}`)
  }

  passNum++
  if (slow === 1) {
    pushState(`🎉 循环终止！slow 与 fast 相遇且值为 1，该序列最终收敛于 1，【${n}】是快乐数！`, `结论：${n} 是快乐数`)
  } else {
    pushState(`⚠️ 循环终止！slow 与 fast 在非 1 的节点 ${slow} 处相遇，形成死亡闭环！【${n}】不是快乐数。`, `结论：${n} 不是快乐数`)
  }
}
</script>

<style scoped>
.happy-number-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  width: 100%;
  padding: 10px 0;
  gap: 15px;
}

/* 顶部计算过程板 */
.calc-board {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
  background-color: var(--vp-c-bg-elv);
  border: 1px dashed #eab308;
  padding: 16px 24px;
  border-radius: 8px;
  width: 100%;
}

.calc-content {
  font-family: monospace;
  font-size: 16px;
  font-weight: bold;
  color: var(--vp-c-text-1);
  background: var(--vp-c-bg-soft);
  padding: 8px 16px;
  border-radius: 6px;
  border: 1px solid var(--vp-c-border);
}

/* 虚拟链表容器 */
.list-wrapper {
  position: relative;
  width: 100%;
  background-color: var(--vp-c-bg-elv);
  border: 1px solid var(--vp-c-border);
  border-radius: 12px;
  min-height: 180px;
  /* 💡 移除 display: flex 和居中，避免内容过宽时左侧被暴力裁切 */
  display: block; 
  /* 增加左右 20px 的内边距，让滚动区域不要完全贴边 */
  padding: 50px 20px 20px 20px; 
}

.list-title {
  position: absolute;
  top: 12px;
  left: 16px;
  display: flex;
  align-items: center;
  gap: 8px;
}

.badge {
  font-size: 12px;
  font-weight: bold;
  padding: 4px 8px;
  border-radius: 4px;
  color: white;
}
.badge.primary { background-color: #3b82f6; }
.badge.warning { background-color: #eab308; }
.desc { font-size: 12px; color: var(--vp-c-text-3); }
.divider { display: flex; font-size: 14px; font-weight: bold; color: #ec4899; opacity: 0.8; margin-top: 5px; }


/* =======================================
   全新升级：绝对定位极坐标系画布样式
========================================== */
.canvas-viewport {
  width: 100%;
  overflow-x: auto; 
  overflow-y: hidden;
  background-color: var(--vp-c-bg-soft);
  border-radius: 8px;
}

/* 美化内部画布的滚动条 */
.canvas-viewport::-webkit-scrollbar { height: 8px; }
.canvas-viewport::-webkit-scrollbar-track { background: transparent; }
.canvas-viewport::-webkit-scrollbar-thumb { background-color: var(--vp-c-divider); border-radius: 4px; }
.canvas-viewport::-webkit-scrollbar-thumb:hover { background-color: var(--vp-c-text-3); }

.canvas-content {
  position: relative;
  min-height: 380px;
  /* width 将通过 inline-style 动态注入 */
}

.edges-svg {
  position: absolute;
  top: 0; 
  left: 0;
  width: 100%; 
  height: 100%;
  z-index: 1;
}

.node-wrapper-abs {
  position: absolute;
  /* 核心：无论 left/top 怎么定，强制让节点的几何正中心对准该坐标！ */
  transform: translate(-50%, -50%); 
  z-index: 2;
  display: flex;
  flex-direction: column;
  align-items: center;
}

/* 圆形节点样式 (原样保留，调整了外边距) */
.node-box {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  border: 2px solid var(--vp-c-border);
  display: flex;
  justify-content: center;
  align-items: center;
  font-weight: bold;
  font-size: 16px;
  color: var(--vp-c-text-1);
  background: var(--vp-c-bg-elv); /* 使用最亮的图层覆盖背后的连线 */
  transition: all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1);
}

/* 悬浮在节点下方的探照灯标签 */
.pointers {
  position: absolute;
  top: 54px; /* 精准定位在球体下方 */
  display: flex;
  gap: 4px;
  width: max-content;
}

/* 箭头 */
.arrow {
  color: var(--vp-c-text-3);
  font-size: 20px;
  font-weight: bold;
  padding-bottom: 26px; /* 抬高一点，给底部的指针留空间 */
}

/* =============== 动态状态体系 =============== */

/* 仅慢指针驻留 */
.is-slow {
  border-color: #3b82f6;
  box-shadow: 0 0 12px rgba(59, 130, 246, 0.4);
}

/* 仅快指针驻留 */
.is-fast {
  border-color: #ec4899;
  box-shadow: 0 0 12px rgba(236, 72, 153, 0.4);
}

/* 快慢指针相遇（紫色高亮 + 填充） */
.is-both {
  border-color: #8b5cf6;
  background-color: rgba(139, 92, 246, 0.15);
  box-shadow: 0 0 15px rgba(139, 92, 246, 0.5);
  color: #8b5cf6;
  transform: scale(1.1);
}

/* 底层标签牌 */
.pointers {
  display: flex;
  gap: 4px;
  min-height: 20px;
}

.ptr {
  font-size: 10px;
  padding: 2px 6px;
  border-radius: 4px;
  font-weight: bold;
  color: white;
  transition: all 0.2s;
}

.slow-ptr { background: #3b82f6; }
.fast-ptr { background: #ec4899; }
</style>