<template>
  <VisualizerLayout
    title="串联所有单词的子串 (LeetCode 30) - 多起点 + O(1) 判定"
    storageKey="lc30-find-substring-config"
    defaultData="foo, bar | barfoothefoobarman"
    :defaultInterval="1000"
    :actionButtons="visualizerButtons"
    :steps="steps"
    @calculate="calculateSteps"
  >
    <template #visualization="{ step }">
      <div class="sliding-window-container" v-if="step && step.array">
        
        <!-- 顶部：极简哈希表比对看板 -->
        <div class="dashboard-minimal">
          
          <div class="hash-compare-panel">
            <div class="panel-header">
              <span class="label">定长单词窗口哈希状态 (Size: {{ step.wsN }} Words)</span>
              <!-- 新增偏移量指示器 -->
              <span class="offset-badge">
                当前偏移量 Offset (i) = {{ step.offsetI }}
              </span>
            </div>
            
            <div class="hash-row target-hash">
              <span class="row-label">目标 wMap:</span>
              <div class="chips-container">
                <span class="hash-chip target-chip" v-for="word in step.allKeys" :key="'w'+word"
                      :class="{'is-zero': !step.wMap[word]}">
                  "{{ word }}": {{ step.wMap[word] || 0 }}
                </span>
              </div>
            </div>

            <div class="hash-row current-hash">
              <span class="row-label">窗口 sMap:</span>
              <div class="chips-container">
                <span class="hash-chip current-chip" v-for="word in step.allKeys" :key="'s'+word"
                      :class="{
                        'is-zero': !step.sMap[word],
                        'is-mismatch': step.sMap[word] !== (step.wMap[word] || 0),
                        'is-match': step.sMap[word] === (step.wMap[word] || 0) && step.sMap[word] > 0
                      }">
                  "{{ word }}": {{ step.sMap[word] || 0 }}
                </span>
              </div>
            </div>
          </div>

          <!-- 🌟 核心优化：有效单词匹配数进度看板 -->
          <div class="stat-box valid-count-box" :class="{'is-full': step.totalValid === step.wsN}">
            <span class="label">有效单词匹配数 (Valid)</span>
            <div class="value">
              {{ step.totalValid }} <span class="denominator">/ {{ step.wsN }}</span>
            </div>
            <div class="progress-bar">
              <div class="progress-fill" :style="{ width: (step.totalValid / step.wsN) * 100 + '%' }"></div>
            </div>
          </div>

          <div class="stat-box highlight-box">
            <span class="label">串联起始索引 (Result)</span>
            <div class="value result-list">
              <span v-if="step.results.length === 0" class="empty-hint">[]</span>
              <span v-else>[{{ step.results.join(', ') }}]</span>
            </div>
          </div>
        </div>

        <div class="divider">
          <span class="arrow-down">↓ 步长为 wN ({{ step.wN }}) 的滑动窗口，共需遍历 {{ step.wN }} 种偏移量 ↓</span>
        </div>

        <!-- 数组主视图 -->
        <div class="array-wrapper">
          <div class="array-track">
            
            <!-- 极简线框风格的定长滑动窗口 -->
            <div 
              class="window-frame-minimal" 
              :class="{
                'is-valid-frame': step.totalValid === step.wsN && step.rightIdx - step.leftIdx === step.wsN * step.wN,
                'is-hidden': step.leftIdx >= step.rightIdx
              }"
              :style="getWindowStyle(step)"
            ></div>

            <div 
              class="array-item-group" 
              v-for="(item, idx) in step.array" 
              :key="item.id"
            >
              <!-- 数组节点：简约样式 -->
              <div 
                class="array-box-minimal"
                :class="{
                  'is-in-window': idx >= step.leftIdx && idx < step.rightIdx,
                  'is-active-add': step.activeType === 'add' && step.activeRange.includes(idx),
                  'is-active-remove': step.activeType === 'remove' && step.activeRange.includes(idx),
                  'is-processed': idx < step.offsetI
                }"
              >
                {{ item.val }}
              </div>
              
              <!-- 底部极简指针 -->
              <div class="pointer-track">
                <span class="idx">{{ idx }}</span>
                <div class="ptr-labels">
                  <span v-if="step.leftIdx === idx" class="ptr ptr-left">L</span>
                  <span v-if="step.rightIdx === idx" class="ptr ptr-right">R</span>
                </div>
              </div>
            </div>
            
            <div class="array-item-group virtual-group" v-if="step.rightIdx === step.n">
               <div class="array-box-minimal virtual-box">End</div>
               <div class="pointer-track">
                 <span class="idx">{{ step.n }}</span>
                 <div class="ptr-labels"><span class="ptr ptr-right">R</span></div>
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

const getWindowStyle = (step) => {
  if (step.leftIdx >= step.rightIdx) return { width: '0px', opacity: 0 }
  // 💡 将原本的 58 缩小为 36 (28宽 + 8间距)
  const STRIDE = 36; 
  const PADDING = 4;
  const leftPos = step.leftIdx * STRIDE - PADDING;
  // 间距也相应地改为 8
  const width = (step.rightIdx - step.leftIdx) * STRIDE - 8 + (PADDING * 2);
  return {
    left: `${leftPos}px`,
    width: `${width}px`,
    opacity: 1
  }
}

const calculateSteps = (inputRaw) => {
  let pStr = "foo, bar";
  let sStr = "barfoothefoobarman";
  if (inputRaw.includes('|')) {
    const parts = inputRaw.split('|');
    pStr = parts[0].trim();
    sStr = parts[1].trim();
  } else {
    sStr = inputRaw.replace(/\s+/g, '');
  }

  let wordsArray = pStr.split(',').map(w => w.trim()).filter(w => w);
  if (!sStr || wordsArray.length === 0) { steps.value = []; return; }

  steps.value = [];
  let passNum = 0;
  let wN = wordsArray[0].length;
  let wsN = wordsArray.length;
  let sN = sStr.length;
  const arrayObj = sStr.split('').map((val, idx) => ({ id: `idx-${idx}`, val }));

  const pushState = (desc, l, r, curSMap, wMapObj, res, curValid, offset, actRange, actType) => {
    let keys = new Set([...Object.keys(wMapObj)]);
    for (let k in curSMap) {
      if (curSMap[k] > 0) keys.add(k);
    }
    
    steps.value.push({
      n: sN,
      wN: wN,
      wsN: wsN,
      array: JSON.parse(JSON.stringify(arrayObj)),
      leftIdx: l,
      rightIdx: r,
      sMap: { ...curSMap },
      wMap: { ...wMapObj },
      allKeys: Array.from(keys).sort(),
      results: [...res],
      totalValid: curValid,
      offsetI: offset,
      activeRange: [...actRange],
      activeType: actType,
      description: desc,
      passId: passNum++ 
    });
  }

  // 💡 完全复刻你 Java 逻辑里的 updateValidCount，对象换成了 String 单词
  const updateValidCount = (word, curSMap, wMapObj, updateVal, curValid) => {
    let beforeCount = Math.min(curSMap[word] || 0, wMapObj[word] || 0);
    curSMap[word] = (curSMap[word] || 0) + updateVal;
    if (curSMap[word] <= 0) delete curSMap[word]; 
    let afterCount = Math.min(curSMap[word] || 0, wMapObj[word] || 0);
    return curValid + afterCount - beforeCount;
  }

  let wMap = {};
  for (let word of wordsArray) {
    wMap[word] = (wMap[word] || 0) + 1;
  }

  let results = [];
  let minus = wN * (wsN - 1);

  // ================= 完美复刻 Java 代码的多起点逻辑 =================
  for (let i = 0; i < wN; i++) {
    let sMap = {};
    let totalValidCount = 0;
    let currentLeft = i; // 记录当前窗口的真实左边界

    pushState(`【切换偏移量】由于单词长为 ${wN}，开始执行第 ${i} 个起点的滑动窗口 (Offset = ${i})。窗口与哈希表已重置。`, currentLeft, i, sMap, wMap, results, totalValidCount, i, [], '');

    for (let j = i; j <= sN - wN; j += wN) {
      let subS = sStr.substring(j, j + wN);
      let rightIdx = j + wN;
      
      // 生成高亮区间
      let addRange = [];
      for(let k = j; k < j + wN; k++) addRange.push(k);

      // 入窗口
      totalValidCount = updateValidCount(subS, sMap, wMap, 1, totalValidCount);
      pushState(`【进窗口】R 指针跳跃 ${wN} 步，纳入单词区块 "${subS}"。有效匹配数 Valid 更新为 ${totalValidCount}。`, currentLeft, rightIdx, sMap, wMap, results, totalValidCount, i, addRange, 'add');

      // 验证
      if (totalValidCount === wsN) {
        results.push(j - minus);
        pushState(`【🎯 验证命中】O(1) 判定：当前 Valid == wsN (${wsN})！记录串联起始索引 ${j - minus}。`, currentLeft, rightIdx, sMap, wMap, results, totalValidCount, i, [], '');
      }

      // 出窗口
      if (j - minus >= 0) {
        let removeS = sStr.substring(j - minus, j - minus + wN);
        totalValidCount = updateValidCount(removeS, sMap, wMap, -1, totalValidCount);
        currentLeft = j - minus + wN; // 移除后，窗口左边界收缩
        
        let remRange = [];
        for(let k = j - minus; k < j - minus + wN; k++) remRange.push(k);

        pushState(`【出窗口】定长单词窗口已满，L 指针跳跃 ${wN} 步，移出最左侧单词区块 "${removeS}"。`, currentLeft, rightIdx, sMap, wMap, results, totalValidCount, i, remRange, 'remove');
      }
    }
  }

  pushState(`🏁 算法执行完毕！共找到 ${results.length} 个串联起始索引。全过程使用外层偏移循环 + O(1) 的 ValidCount 追踪，性能达到极致！`, 0, 0, {}, wMap, results, 0, '结束', [], '');
}
</script>

<style scoped>
.sliding-window-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  width: 100%;
  padding: 10px 0;
  gap: 20px;
}

.dashboard-minimal {
  display: flex;
  gap: 16px;
  width: 100%;
  justify-content: center;
  flex-wrap: wrap;
}

/* 哈希对比看板 */
.hash-compare-panel {
  display: flex;
  flex-direction: column;
  background-color: var(--vp-c-bg-elv);
  border: 1px solid var(--vp-c-border);
  padding: 12px 20px;
  border-radius: 8px;
  min-width: 380px;
}

.panel-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
  padding-bottom: 8px;
  border-bottom: 1px dashed var(--vp-c-divider);
}

.panel-header .label { font-size: 13px; color: var(--vp-c-text-2); font-weight: bold; }

.offset-badge {
  background: var(--vp-c-bg-mute);
  border: 1px solid var(--vp-c-border);
  padding: 2px 8px;
  border-radius: 6px;
  font-family: monospace;
  font-size: 12px;
  font-weight: bold;
  color: var(--vp-c-text-1);
}

.hash-row { display: flex; align-items: center; margin-bottom: 10px; }
.hash-row:last-child { margin-bottom: 0; }
.row-label { width: 95px; font-size: 12px; color: var(--vp-c-text-2); font-weight: 600; }
.chips-container { display: flex; gap: 6px; flex-wrap: wrap; }

.hash-chip {
  font-family: monospace;
  font-size: 12px;
  font-weight: bold;
  padding: 2px 8px;
  border-radius: 4px;
  border: 1px solid var(--vp-c-border);
  background: var(--vp-c-bg-soft);
  color: var(--vp-c-text-1);
}
.hash-chip.is-zero { opacity: 0.3; border-style: dashed; }
.hash-chip.is-match { border-color: #10b981; color: #10b981; background: rgba(16, 185, 129, 0.1); }
.hash-chip.is-mismatch { border-color: #ef4444; color: #ef4444; background: rgba(239, 68, 68, 0.1); }

/* 🌟 有效匹配数进度盒子 */
.stat-box {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background-color: var(--vp-c-bg-elv);
  border: 1px solid var(--vp-c-border);
  padding: 10px 20px;
  border-radius: 8px;
  min-width: 160px;
  transition: all 0.3s;
}

.valid-count-box { border-color: #0ea5e9; background-color: rgba(14, 165, 233, 0.05); }
.valid-count-box.is-full {
  border-color: #10b981; background-color: rgba(16, 185, 129, 0.1); box-shadow: 0 0 15px rgba(16, 185, 129, 0.2);
}

.valid-count-box .label { font-size: 12px; color: var(--vp-c-text-2); margin-bottom: 6px; font-weight: bold; }
.valid-count-box .value { font-size: 26px; font-family: monospace; font-weight: 900; color: #0ea5e9; transition: color 0.3s; }
.valid-count-box.is-full .value { color: #10b981; }
.denominator { font-size: 16px; color: var(--vp-c-text-3); font-weight: normal; }

.progress-bar { width: 100%; height: 6px; background: var(--vp-c-bg-soft); border-radius: 4px; margin-top: 8px; overflow: hidden; }
.progress-fill { height: 100%; background: #0ea5e9; transition: width 0.4s cubic-bezier(0.34, 1.56, 0.64, 1), background-color 0.3s; }
.valid-count-box.is-full .progress-fill { background: #10b981; }

.stat-box.highlight-box { border-color: #3b82f6; background-color: rgba(59, 130, 246, 0.05); }
.stat-box.highlight-box .label { font-size: 12px; color: var(--vp-c-text-2); margin-bottom: 6px; font-weight: bold; }
.stat-box.highlight-box .value { font-size: 16px; font-family: monospace; font-weight: 700; color: #3b82f6; }
.empty-hint { color: var(--vp-c-text-3); font-style: italic; font-weight: normal; }

.divider { display: flex; justify-content: center; width: 100%; }
.arrow-down { font-size: 13px; color: var(--vp-c-text-3); }

/* ================= 数组与滑动窗口 ================= */
.array-wrapper {
  width: 100%;
  overflow-x: auto;
  overflow-y: hidden; 
  padding: 40px 20px 50px 20px; 
  background-color: transparent;
  display: flex;
  justify-content: center;
}

.array-track { display: flex; gap: 8px; position: relative; padding-top: 10px; }

.window-frame-minimal {
  position: absolute;
  top: 6px;
  height: 44px; /* 紧密包裹 36px 的盒子 */
  background: rgba(148, 163, 184, 0.1);
  border: 1.5px solid #94a3b8; 
  border-radius: 6px;
  z-index: 1;
  pointer-events: none;
  transition: all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
}

.window-frame-minimal.is-valid-frame { border-color: #10b981; background: rgba(16, 185, 129, 0.08); }

.array-item-group { display: flex; flex-direction: column; align-items: center; position: relative; width: 28px; z-index: 2; }

.array-box-minimal {
  width: 100%;
  height: 36px;
  border: 1px solid var(--vp-c-border);
  border-radius: 4px;
  display: flex;
  justify-content: center;
  align-items: center;
  font-size: 16px;
  font-family: monospace;
  font-weight: 600;
  color: var(--vp-c-text-1);
  background: var(--vp-c-bg-elv);
  transition: all 0.3s;
}

/* 窗口内的元素：仅依赖线框包裹 */
.is-in-window { border-color: transparent; }

/* 🌟 特效：单词进出窗口的高亮块 */
.is-active-add {
  border-color: #0ea5e9;
  background: rgba(14, 165, 233, 0.15);
  color: #0284c7;
  border-style: dashed;
}
.is-active-remove {
  border-color: #f59e0b;
  background: rgba(245, 158, 11, 0.15);
  color: #d97706;
  border-style: dashed;
}

.is-processed { opacity: 0.3; }
.virtual-group { opacity: 0.5; }
.virtual-box { border-style: dashed; color: var(--vp-c-text-3); font-size: 12px;}

.pointer-track { margin-top: 6px; display: flex; flex-direction: column; align-items: center; min-height: 40px; }
.idx { font-size: 11px; color: var(--vp-c-text-3); margin-bottom: 4px; }
.ptr-labels { display: flex; flex-direction: column; gap: 2px; align-items: center; }
.ptr { font-size: 10px; padding: 1px 4px; border-radius: 3px; font-weight: 600; }
.ptr-left { color: #64748b; background: var(--vp-c-bg-soft); border: 1px solid #cbd5e1; }
.ptr-right { color: #0284c7; background: #e0f2fe; border: 1px solid #bae6fd; }
.dark .ptr-left { border-color: #334155; }
.dark .ptr-right { border-color: #0c4a6e; }
</style>