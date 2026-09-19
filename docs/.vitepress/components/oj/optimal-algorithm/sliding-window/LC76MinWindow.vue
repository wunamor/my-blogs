<template>
  <VisualizerLayout
    title="最小覆盖子串 (LeetCode 76) - 种类数追踪"
    storageKey="lc76-min-window-config"
    defaultData="ABC | ADOBECODEBANC"
    :defaultInterval="900"
    :actionButtons="visualizerButtons"
    :steps="steps"
    @calculate="calculateSteps"
  >
    <template #visualization="{ step }">
      <div class="sliding-window-container" v-if="step && step.array">
        
        <!-- 顶部：极简哈希表与状态看板 -->
        <div class="dashboard-minimal">
          
          <div class="hash-compare-panel">
            <div class="panel-header">
              <span class="label">目标字符频率监控</span>
              <span class="status-badge" 
                :class="step.validTypes === step.targetTypes ? 'is-success' : 'is-pending'">
                {{ step.validTypes === step.targetTypes ? '✅ 全覆盖 (可收缩)' : '🔍 探索中' }}
              </span>
            </div>
            
            <div class="hash-row target-hash">
              <span class="row-label">目标 tMap:</span>
              <div class="chips-container">
                <span class="hash-chip target-chip" v-for="char in step.allKeys" :key="'t'+char">
                  {{ char }}: {{ step.tMap[char] }}
                </span>
              </div>
            </div>

            <div class="hash-row current-hash">
              <span class="row-label">窗口 sMap:</span>
              <div class="chips-container">
                <span class="hash-chip current-chip" v-for="char in step.allKeys" :key="'s'+char"
                      :class="{
                        'is-zero': !step.sMap[char],
                        'is-mismatch': (step.sMap[char] || 0) < step.tMap[char],
                        'is-match': (step.sMap[char] || 0) >= step.tMap[char]
                      }">
                  {{ char }}: {{ step.sMap[char] || 0 }}
                </span>
              </div>
            </div>
          </div>

          <!-- 有效字符种类进度 -->
          <div class="stat-box valid-count-box" :class="{'is-full': step.validTypes === step.targetTypes}">
            <span class="label">达标种类数 (Types)</span>
            <div class="value">
              {{ step.validTypes }} <span class="denominator">/ {{ step.targetTypes }}</span>
            </div>
            <div class="progress-bar">
              <div class="progress-fill" :style="{ width: (step.validTypes / step.targetTypes) * 100 + '%' }"></div>
            </div>
          </div>

          <!-- 最小覆盖子串结果 -->
          <div class="stat-box highlight-box" :class="{'is-alert': step.status === 'update-min'}">
            <span class="label">当前最小子串 (Result)</span>
            <div class="value result-text">
              <span v-if="!step.minStr" class="empty-hint">暂无</span>
              <span v-else>"{{ step.minStr }}"</span>
            </div>
          </div>
        </div>

        <div class="divider">
          <span class="arrow-down">↓ 紧凑模式：动态滑动窗口 [left, right) ↓</span>
        </div>

        <!-- 数组主视图 (紧凑模式) -->
        <div class="array-wrapper">
          <div class="array-track">
            
            <!-- 极简线框风格的滑动窗口 -->
            <div 
              class="window-frame-minimal" 
              :class="{
                'is-valid-frame': step.validTypes === step.targetTypes,
                'is-shrinking-frame': step.status === 'shrinking',
                'is-hidden': step.leftIdx >= step.rightIdx
              }"
              :style="getWindowStyle(step)"
            ></div>

            <div 
              class="array-item-group" 
              v-for="(item, idx) in step.array" 
              :key="item.id"
            >
              <!-- 数组节点：紧凑样式 -->
              <div 
                class="array-box-minimal"
                :class="{
                  'is-in-window': idx >= step.leftIdx && idx < step.rightIdx,
                  'is-target-char': step.allKeys.includes(item.val) && idx >= step.leftIdx && idx < step.rightIdx,
                  'is-processed': idx < step.leftIdx
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

// 💡 紧凑模式步长计算
const getWindowStyle = (step) => {
  if (step.leftIdx >= step.rightIdx) return { width: '0px', opacity: 0 }
  const STRIDE = 36; // 28宽 + 8间距
  const PADDING = 4;
  const leftPos = step.leftIdx * STRIDE - PADDING;
  const width = (step.rightIdx - step.leftIdx) * STRIDE - 8 + (PADDING * 2);
  return {
    left: `${leftPos}px`,
    width: `${width}px`,
    opacity: 1
  }
}

const calculateSteps = (inputRaw) => {
  let tStr = "ABC";
  let sStr = "ADOBECODEBANC";
  if (inputRaw.includes('|')) {
    const parts = inputRaw.split('|');
    tStr = parts[0].trim();
    sStr = parts[1].trim();
  } else {
    sStr = inputRaw.replace(/\s+/g, '');
  }

  let sN = sStr.length;
  let tN = tStr.length;
  if (!sN || !tN) { steps.value = []; return; }

  steps.value = [];
  let passNum = 0;
  const arrayObj = sStr.split('').map((val, idx) => ({ id: `idx-${idx}`, val }));

  let tMap = {};
  for (let i = 0; i < tN; i++) {
    tMap[tStr[i]] = (tMap[tStr[i]] || 0) + 1;
  }
  let targetTypes = Object.keys(tMap).length;
  let allKeys = Object.keys(tMap).sort(); // 视觉上只展示 t 中关心的字符

  const pushState = (desc, l, r, curSMap, validTypes, minL, minR, stat) => {
    let minStr = minL === -1 ? "" : sStr.substring(minL, minR);
    steps.value.push({
      n: sN,
      array: JSON.parse(JSON.stringify(arrayObj)),
      leftIdx: l,
      rightIdx: r,
      sMap: { ...curSMap },
      tMap: { ...tMap },
      allKeys: allKeys,
      validTypes: validTypes,
      targetTypes: targetTypes,
      minStr: minStr,
      status: stat, // 'pending', 'expanding', 'valid', 'shrinking', 'update-min', 'done'
      description: desc,
      passId: passNum++ 
    });
  }

  let sMap = {};
  let left = 0, right = 0;
  let retLeft = -1, retRight = 0;
  let validCountOfType = 0; 

  pushState(`【初始化】目标 t = "${tStr}"，包含 ${targetTypes} 种字符。如果 sN < tN 将直接返回空。`, left, right, sMap, validCountOfType, retLeft, retRight, 'pending');

  if (sN < tN) return;

  // ================= 完美复刻 Java 逻辑 =================
  while (right < sN) {
    let rCh = sStr[right++];
    sMap[rCh] = (sMap[rCh] || 0) + 1;
    
    // 进窗口后，判断一下个数是否满足
    if (tMap[rCh] && sMap[rCh] === tMap[rCh]) {
      validCountOfType++;
      pushState(`【字符种类达标】右指针纳入 '${rCh}'。'${rCh}' 的数量已达标，有效字符种类数 ValidTypes 更新为 ${validCountOfType}。`, left, right, sMap, validCountOfType, retLeft, retRight, 'expanding');
    } else {
      pushState(`【进窗口】R 纳入 '${rCh}'。当前种类匹配数仍为 ${validCountOfType}/${targetTypes}。`, left, right, sMap, validCountOfType, retLeft, retRight, 'expanding');
    }

    if (validCountOfType === targetTypes) {
      pushState(`【🎯 满足覆盖条件】当前窗口已包含 t 中的所有字符！准备收缩左边界以寻找更短的子串。`, left, right, sMap, validCountOfType, retLeft, retRight, 'valid');
      
      while (validCountOfType === targetTypes) {
        let lCh = sStr[left++];
        
        if (tMap[lCh] && sMap[lCh] === tMap[lCh]) {
          validCountOfType--;
          pushState(`【破坏条件】L 指针移出了关键字符 '${lCh}'！有效种类数下降至 ${validCountOfType}，停止收缩。`, left, right, sMap, validCountOfType, retLeft, retRight, 'shrinking');
        } else {
          pushState(`【压缩窗口】L 移出的 '${lCh}' 是冗余字符，条件未被破坏，继续向右压榨最小长度。`, left, right, sMap, validCountOfType, retLeft, retRight, 'shrinking');
        }
        
        sMap[lCh]--;
      }

      // 此时就不满足了条件，但是 [left - 1, right) 是满足条件的
      let currentLen = right - (left - 1);
      let minLen = retLeft === -1 ? Infinity : retRight - retLeft;
      
      if (retLeft === -1 || currentLen < minLen) {
        retLeft = left - 1;
        retRight = right;
        pushState(`【🏆 更新最小子串】刚刚被破坏前的窗口 [${left - 1}, ${right}) 是一个合法覆盖子串，长度为 ${currentLen}，打破了历史记录！`, left, right, sMap, validCountOfType, retLeft, retRight, 'update-min');
      } else {
        pushState(`【记录未打破】刚刚被破坏前的合法窗口长度为 ${currentLen}，未打破历史最小记录 ${minLen}。`, left, right, sMap, validCountOfType, retLeft, retRight, 'pending');
      }
    }
  }

  pushState(`🏁 算法执行完毕！全局最小覆盖子串为：${retLeft === -1 ? "无" : '"' + sStr.substring(retLeft, retRight) + '"'}。`, left, right, sMap, validCountOfType, retLeft, retRight, 'done');
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
  min-width: 320px;
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

.status-badge { font-size: 11px; font-weight: bold; padding: 2px 8px; border-radius: 4px; }
.status-badge.is-success { color: #10b981; background: rgba(16, 185, 129, 0.15); }
.status-badge.is-pending { color: #f59e0b; background: rgba(245, 158, 11, 0.15); }

.hash-row { display: flex; align-items: center; margin-bottom: 10px; }
.hash-row:last-child { margin-bottom: 0; }
.row-label { width: 85px; font-size: 12px; color: var(--vp-c-text-2); font-weight: 600; }
.chips-container { display: flex; gap: 6px; flex-wrap: wrap; }

.hash-chip {
  font-family: monospace;
  font-size: 12px;
  font-weight: bold;
  padding: 2px 6px;
  border-radius: 4px;
  border: 1px solid var(--vp-c-border);
  background: var(--vp-c-bg-soft);
  color: var(--vp-c-text-1);
}
.hash-chip.is-zero { opacity: 0.3; border-style: dashed; }
.hash-chip.is-match { border-color: #10b981; color: #10b981; background: rgba(16, 185, 129, 0.1); }
.hash-chip.is-mismatch { border-color: #ef4444; color: #ef4444; background: rgba(239, 68, 68, 0.1); }

/* 🌟 有效种类数进度盒子 */
.stat-box {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background-color: var(--vp-c-bg-elv);
  border: 1px solid var(--vp-c-border);
  padding: 10px 20px;
  border-radius: 8px;
  min-width: 140px;
  transition: all 0.3s;
}

.valid-count-box { border-color: #0ea5e9; background-color: rgba(14, 165, 233, 0.05); }
.valid-count-box.is-full {
  border-color: #10b981; background-color: rgba(16, 185, 129, 0.1); box-shadow: 0 0 15px rgba(16, 185, 129, 0.2);
}

.valid-count-box .label { font-size: 11px; color: var(--vp-c-text-2); margin-bottom: 6px; font-weight: bold; }
.valid-count-box .value { font-size: 24px; font-family: monospace; font-weight: 900; color: #0ea5e9; transition: color 0.3s; }
.valid-count-box.is-full .value { color: #10b981; }
.denominator { font-size: 14px; color: var(--vp-c-text-3); font-weight: normal; }

.progress-bar { width: 100%; height: 6px; background: var(--vp-c-bg-soft); border-radius: 4px; margin-top: 8px; overflow: hidden; }
.progress-fill { height: 100%; background: #0ea5e9; transition: width 0.4s cubic-bezier(0.34, 1.56, 0.64, 1), background-color 0.3s; }
.valid-count-box.is-full .progress-fill { background: #10b981; }

/* 最小子串结果盒子 */
.stat-box.highlight-box { border-color: #8b5cf6; background-color: rgba(139, 92, 246, 0.05); }
.stat-box.highlight-box.is-alert { border-color: #f59e0b; background-color: rgba(245, 158, 11, 0.1); }
.stat-box.highlight-box .label { font-size: 11px; color: var(--vp-c-text-2); margin-bottom: 6px; font-weight: bold; }
.stat-box.highlight-box .value { font-size: 16px; font-family: monospace; font-weight: 700; color: #8b5cf6; }
.empty-hint { color: var(--vp-c-text-3); font-style: italic; font-weight: normal; }

.divider { display: flex; justify-content: center; width: 100%; }
.arrow-down { font-size: 13px; color: var(--vp-c-text-3); }

/* ================= 数组与滑动窗口 (紧凑模式) ================= */
.array-wrapper {
  width: 100%;
  overflow-x: auto;
  overflow-y: hidden; 
  padding: 30px 20px 50px 20px; 
  background-color: transparent;
  display: flex;
  justify-content: center;
}

.array-track { display: flex; gap: 8px; position: relative; padding-top: 10px; } /* 💡 紧凑：间距缩小为 8px */

.window-frame-minimal {
  position: absolute;
  top: 6px;
  height: 44px; /* 💡 紧凑：线框降低 */
  background: rgba(148, 163, 184, 0.1);
  border: 1.5px solid #94a3b8; 
  border-radius: 6px;
  z-index: 1;
  pointer-events: none;
  transition: all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
}

.window-frame-minimal.is-valid-frame { border-color: #10b981; background: rgba(16, 185, 129, 0.08); }
.window-frame-minimal.is-shrinking-frame { border-color: #f59e0b; border-style: dashed; }

.array-item-group { display: flex; flex-direction: column; align-items: center; position: relative; width: 28px; z-index: 2; } /* 💡 紧凑：宽度 28px */

.array-box-minimal {
  width: 100%;
  height: 36px; /* 💡 紧凑：高度 36px */
  border: 1px solid var(--vp-c-border);
  border-radius: 4px;
  display: flex;
  justify-content: center;
  align-items: center;
  font-size: 16px; /* 💡 紧凑：字号略微缩小 */
  font-family: monospace;
  font-weight: 600;
  color: var(--vp-c-text-1);
  background: var(--vp-c-bg-elv);
  transition: all 0.3s;
}

.is-in-window { border-color: transparent; }
.is-target-char { color: #0ea5e9; font-weight: 900; background: rgba(14, 165, 233, 0.1); } /* 给关心的字符一点小强调 */
.is-processed { opacity: 0.3; }
.virtual-group { opacity: 0.5; }
.virtual-box { border-style: dashed; color: var(--vp-c-text-3); font-size: 10px;}

.pointer-track { margin-top: 6px; display: flex; flex-direction: column; align-items: center; min-height: 40px; }
.idx { font-size: 10px; color: var(--vp-c-text-3); margin-bottom: 4px; }
.ptr-labels { display: flex; flex-direction: column; gap: 2px; align-items: center; }
.ptr { font-size: 9px; padding: 1px 4px; border-radius: 3px; font-weight: 600; } /* 💡 紧凑：指针略微缩小 */
.ptr-left { color: #64748b; background: var(--vp-c-bg-soft); border: 1px solid #cbd5e1; }
.ptr-right { color: #0284c7; background: #e0f2fe; border: 1px solid #bae6fd; }
.dark .ptr-left { border-color: #334155; }
.dark .ptr-right { border-color: #0c4a6e; }
</style>