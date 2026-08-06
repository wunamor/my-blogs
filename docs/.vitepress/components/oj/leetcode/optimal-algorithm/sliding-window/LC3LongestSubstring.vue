<template>
  <VisualizerLayout
    title="无重复字符的最长子串 (LeetCode 3) - 滑动窗口 + 哈希表"
    storageKey="lc3-longest-substring-config"
    defaultData="a, b, c, a, b, c, b, b"
    :defaultInterval="900"
    :actionButtons="visualizerButtons"
    :steps="steps"
    @calculate="calculateSteps"
  >
    <template #visualization="{ step }">
      <div class="sliding-window-container" v-if="step && step.array">
        
        <!-- 顶部信息控制台 -->
        <div class="dashboard">
          
          <!-- 左侧：底层 Hash 数组监控板 -->
          <div class="hash-board">
            <div class="board-header">
              <span class="label">布尔数组状态 hash[128]：</span>
              <span class="status-badge" :class="{'is-alert': step.status === 'duplicate'}">
                {{ step.status === 'duplicate' ? '发现冲突！' : '正常探测' }}
              </span>
            </div>
            
            <div class="hash-set-wrapper">
              <div class="empty-text" v-if="step.hashItems.length === 0">[] (全为 false)</div>
              <!-- 当前为 true 的字符芯片 -->
              <div class="hash-chip" v-for="char in step.hashItems" :key="char"
                   :class="{'is-conflict': step.status === 'duplicate' && char === step.dupChar}">
                {{ char }}
              </div>
            </div>
            
            <!-- 操作指令提示 -->
            <div class="action-hint">
              <span class="hint-text expanding-text" v-if="step.status === 'expanding'">➜ 未重复，设为 true，右侧扩张 (R++)</span>
              <span class="hint-text conflict-text" v-if="step.status === 'duplicate'">⚠️ 遇到已存在的 '{{ step.dupChar }}'，准备收缩！</span>
              <span class="hint-text shrinking-text" v-if="step.status === 'shrinking'">← 收缩中，设为 false (L++)</span>
              <span class="hint-text shrink-done-text" v-if="step.status === 'shrink-done'">✅ 冲突解除，可以继续右移</span>
            </div>
          </div>

          <!-- 右侧：最长无重复长度记录器 -->
          <div class="result-board">
            <span class="label">最长无重复长度 (Max Length)：</span>
            <!-- 剧场版动画数字容器 -->
            <div class="count-value-container" :key="'ret-' + step.passId">
              <span class="static-count" v-if="step.result === step.prevResult">{{ step.result }}</span>
              <template v-else>
                <span class="old-count">{{ step.prevResult }}</span>
                <span class="new-count">{{ step.result }}</span>
                <span class="update-badge">破纪录!</span>
              </template>
            </div>
          </div>
        </div>

        <div class="divider">
          <div class="arrow-down">↓ 物理字符串与滑动窗口状态 ↓</div>
        </div>

        <!-- 数组主视图 -->
        <div class="array-wrapper">
          <div class="array-track">
            
            <!-- 🌟 继承并完美修复过 PADDING 的弹性滑动窗口框 -->
            <div 
              class="window-frame" 
              :class="{
                'is-warning-frame': step.status === 'duplicate' || step.status === 'shrinking',
                'is-hidden': step.leftIdx >= step.rightIdx
              }"
              :style="getWindowStyle(step)"
            >
              <div class="window-label" v-if="step.leftIdx < step.rightIdx">
                当前长度: {{ step.rightIdx - step.leftIdx }}
              </div>
            </div>

            <div 
              class="array-item-group" 
              v-for="(item, idx) in step.array" 
              :key="item.id"
            >
              <!-- 字符节点 -->
              <div 
                class="array-box"
                :class="{
                  'is-in-window': idx >= step.leftIdx && idx < step.rightIdx,
                  'is-duplicate': step.status === 'duplicate' && idx === step.rightIdx,
                  'is-left-ptr': step.leftIdx === idx,
                  'is-right-ptr': step.rightIdx === idx,
                  'is-processed': idx < step.leftIdx
                }"
              >
                {{ item.val }}
              </div>
              
              <!-- 底部标签与指针 -->
              <div class="pointer-track">
                <span class="idx">{{ idx }}</span>
                <div class="ptr-labels">
                  <span v-if="step.leftIdx === idx" class="ptr ptr-left">L(出)</span>
                  <span v-if="step.rightIdx === idx" class="ptr ptr-right">R(探)</span>
                </div>
              </div>
            </div>
            
            <!-- 结尾边界虚拟框 -->
            <div class="array-item-group virtual-group" v-if="step.rightIdx === step.n">
               <div class="array-box virtual-box">End</div>
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

// 💡 仅保留三个核心按钮，移除“跳过本轮”
const visualizerButtons = [
  { id: 'prev', label: '上一步', icon: 'prev' },
  { id: 'play', label: '自动播放', labelPause: '暂停', icon: 'play', iconPause: 'pause' },
  { id: 'next', label: '下一步', icon: 'next' }
]

const steps = ref([])

const getWindowStyle = (step) => {
  if (step.leftIdx >= step.rightIdx) return { width: '0px', opacity: 0 }
  const STRIDE = 62;
  const PADDING = 8;
  const leftPos = step.leftIdx * STRIDE - PADDING;
  const width = (step.rightIdx - step.leftIdx) * STRIDE - 12 + (PADDING * 2);
  return {
    left: `${leftPos}px`,
    width: `${width}px`,
    opacity: 1
  }
}

const calculateSteps = (inputRaw) => {
  let s = inputRaw.includes(',') ? inputRaw.split(',').map(c => c.trim()).join('') : inputRaw.trim()
  if (!s) { steps.value = []; return; }

  let arr = s.split('');
  steps.value = []
  let passNum = 0
  let n = arr.length
  const arrayObj = arr.map((val, idx) => ({ id: `c-${idx}`, val }))

  // 💡 移除了 roundId 参数
  const pushState = (desc, l, r, stat, dupChar, currentRes, prevRes, currentHashArray) => {
    steps.value.push({
      n: n,
      array: JSON.parse(JSON.stringify(arrayObj)),
      leftIdx: l,
      rightIdx: r,
      status: stat,
      dupChar: dupChar,
      result: currentRes,
      prevResult: prevRes,
      hashItems: [...currentHashArray],
      description: desc,
      passId: passNum++ 
    })
  }

  let hashSet = new Set();
  let result = 0;
  let prevResult = 0;
  let left = 0;
  let right = 0;

  pushState(`【初始化】双指针起步：left = 0, right = 0。布尔数组全为 false。当前窗口为空。`, left, right, 'pending', null, result, result, hashSet);

  while (right < n) {
    let rightV = arr[right];
    
    if (!hashSet.has(rightV)) {
      pushState(`【探测新字符】右指针探测到 '${rightV}'，它在布尔数组中为 false (未出现过)。将其设为 true 加入窗口，并且右移指针。`, left, right, 'expanding', null, result, result, hashSet);
      
      hashSet.add(rightV);
      right++;
      
    } else {
      prevResult = result;
      let curLen = right - left;
      let isUpdate = curLen > result;
      result = Math.max(curLen, result);
      
      let msg = isUpdate ? `更新最大记录为 ${result}！` : `当前长度 ${curLen} 没打破记录 ${result}。`;
      pushState(`【⚠️ 发现冲突】右指针探测到了 '${rightV}'，它在数组里已经是 true 了！此时先结算当前合法窗口长度：${msg} 接下来将左侧收缩，直到旧的 '${rightV}' 被踢出去。`, left, right, 'duplicate', rightV, result, prevResult, hashSet);
      
      let leftV;
      while ((leftV = arr[left]) !== rightV) {
        hashSet.delete(leftV);
        left++;
        pushState(`【左边界收缩】当前弹出的 '${leftV}' 并不是冲突字符，将其置为 false 后继续收缩。`, left, right, 'shrinking', rightV, result, result, hashSet);
      }
      
      hashSet.delete(leftV);
      left++;
      pushState(`【冲突解除】踢出了导致冲突的旧 '${leftV}'！布尔数组相关位置重新置为 false，危机解除，准备继续右移探测。`, left, right, 'shrink-done', null, result, result, hashSet);
    }
  }

  prevResult = result;
  result = Math.max(right - left, result);
  
  pushState(`🏁 遍历结束。最后结算剩余窗口长度，全局最长无重复子串长度为 ${result}。`, left, right, 'done', null, result, prevResult, hashSet);
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

/* ================= 仪表盘区 ================= */
.dashboard {
  display: flex;
  gap: 20px;
  width: 100%;
  justify-content: center;
  flex-wrap: wrap;
}

.hash-board, .result-board {
  display: flex;
  flex-direction: column;
  background-color: var(--vp-c-bg-elv);
  border: 1px solid var(--vp-c-border);
  padding: 16px 20px;
  border-radius: 12px;
  min-width: 320px;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
}

.board-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.label {
  font-size: 13px;
  color: var(--vp-c-text-2);
  font-weight: bold;
}

.status-badge {
  background: rgba(16, 185, 129, 0.15);
  color: #10b981;
  border: 1px solid rgba(16, 185, 129, 0.3);
  padding: 2px 8px;
  border-radius: 6px;
  font-size: 12px;
  font-weight: bold;
  transition: all 0.3s;
}
.status-badge.is-alert { background: rgba(239, 68, 68, 0.15); color: #ef4444; border-color: rgba(239, 68, 68, 0.3); }

/* ================= Hash 集合展示区 ================= */
.hash-set-wrapper {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  min-height: 38px;
  align-items: center;
  background: var(--vp-c-bg-soft);
  padding: 6px 12px;
  border-radius: 8px;
  border: 1px dashed var(--vp-c-border);
}

.empty-text { font-size: 14px; font-style: italic; color: var(--vp-c-text-3); }

.hash-chip {
  background: #3b82f6;
  color: white;
  width: 26px;
  height: 26px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 6px;
  font-family: monospace;
  font-weight: bold;
  font-size: 14px;
  box-shadow: 0 2px 5px rgba(59, 130, 246, 0.3);
  animation: popIn 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
}

.hash-chip.is-conflict {
  background: #ef4444;
  box-shadow: 0 0 10px rgba(239, 68, 68, 0.6);
  animation: shake 0.4s ease-in-out infinite;
}

.action-hint { margin-top: 10px; height: 20px; font-size: 13px; font-weight: bold; }
.hint-text { animation: slideFadeIn 0.4s cubic-bezier(0.34, 1.56, 0.64, 1) forwards; }
.expanding-text { color: #3b82f6; }
.conflict-text { color: #ef4444; }
.shrinking-text { color: #f59e0b; }
.shrink-done-text { color: #10b981; }

@keyframes popIn { 0% { transform: scale(0); } 100% { transform: scale(1); } }
@keyframes shake { 0%, 100% { transform: translateX(0); } 25% { transform: translateX(-2px) rotate(-5deg); } 75% { transform: translateX(2px) rotate(5deg); } }
@keyframes slideFadeIn { from { opacity: 0; transform: translateX(-10px); } to { opacity: 1; transform: translateX(0); } }

/* ================= 结果数字剧场版动画 ================= */
.result-board { align-items: center; justify-content: center; }

.count-value-container {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 36px;
  font-weight: 900;
  color: #8b5cf6;
  height: 44px;
  min-width: 60px;
  margin-top: 5px;
}

.static-count { position: absolute; }
.old-count { position: absolute; animation: countSlideOut 0.5s cubic-bezier(0.4, 0, 0.2, 1) 0.5s forwards; }
.new-count { display: inline-block; opacity: 0; animation: countSlideIn 0.5s cubic-bezier(0.4, 0, 0.2, 1) 0.5s forwards; }

.update-badge {
  position: absolute;
  right: -60px;
  top: -5px;
  font-size: 13px;
  color: white;
  background: #f59e0b;
  padding: 2px 6px;
  border-radius: 4px;
  pointer-events: none;
  animation: badgeLifecycle 2s cubic-bezier(0.4, 0, 0.2, 1) forwards;
}

@keyframes countSlideOut { 0% { opacity: 1; transform: translateY(0); } 100% { opacity: 0; transform: translateY(-20px); } }
@keyframes countSlideIn { 0% { opacity: 0; transform: translateY(20px); } 100% { opacity: 1; transform: translateY(0); } }
@keyframes badgeLifecycle { 0% { opacity: 0; transform: translateY(10px) scale(0.8); } 10%, 80% { opacity: 1; transform: translateY(0) scale(1.1); } 100% { opacity: 0; transform: translateY(-20px) scale(0.8); visibility: hidden; } }

.divider { display: flex; font-size: 14px; font-weight: bold; color: var(--vp-c-text-3); opacity: 0.8; margin-top: 5px; }

/* ================= 数组与弹性窗口 ================= */
.array-wrapper {
  width: 100%;
  overflow-x: auto;
  /* overflow-y: hidden; */
  background-color: var(--vp-c-bg-soft);
  border-radius: 12px;
  border: 1px solid var(--vp-c-border);
  padding: 40px 20px 50px 20px;
  display: flex;
  justify-content: center;
}

.array-track { display: flex; gap: 12px; position: relative; padding-top: 10px; }

/* 🌟 核心特效：弹性滑动窗口框 */
.window-frame {
  position: absolute;
  top: 0;
  height: 70px;
  background: rgba(59, 130, 246, 0.12);
  border: 2px solid #3b82f6;
  border-radius: 10px;
  z-index: 1;
  pointer-events: none;
  transition: all 0.5s cubic-bezier(0.34, 1.56, 0.64, 1);
}
.window-frame.is-warning-frame {
  background: rgba(245, 158, 11, 0.15);
  border-color: #f59e0b;
  box-shadow: 0 0 15px rgba(245, 158, 11, 0.3);
}

.window-label {
  position: absolute;
  top: -24px;
  left: 50%;
  transform: translateX(-50%);
  background: inherit;
  color: inherit;
  padding: 2px 8px;
  border-radius: 4px;
  font-size: 12px;
  font-weight: bold;
  white-space: nowrap;
}

/* 字符节点 */
.array-item-group { display: flex; flex-direction: column; align-items: center; position: relative; width: 50px; z-index: 2; }

.array-box {
  width: 100%;
  height: 50px;
  border: 2px solid var(--vp-c-border);
  border-radius: 8px;
  display: flex;
  justify-content: center;
  align-items: center;
  font-size: 20px;
  font-family: monospace;
  font-weight: bold;
  color: var(--vp-c-text-1);
  background: var(--vp-c-bg-elv);
  transition: all 0.3s;
}

.is-in-window { border-color: transparent; background: var(--vp-c-bg-elv); }

/* 发生重复冲突时的右侧节点警告 */
.is-duplicate {
  border-color: #ef4444 !important;
  color: #ef4444;
  background: rgba(239, 68, 68, 0.1) !important;
  animation: shake 0.4s ease-in-out;
}

.is-processed { opacity: 0.25; }
.virtual-group { opacity: 0.5; }
.virtual-box { border-style: dashed; color: var(--vp-c-text-3); font-size: 14px; }

/* ================= 底部指针 ================= */
.pointer-track { margin-top: 8px; display: flex; flex-direction: column; align-items: center; height: 40px; }
.idx { font-size: 12px; color: var(--vp-c-text-3); margin-bottom: 4px; }
.ptr-labels { display: flex; flex-direction: column; gap: 2px; align-items: center; }
.ptr { font-size: 10px; padding: 2px 6px; border-radius: 4px; font-weight: bold; color: white; }
.ptr-left { background: #3b82f6; }
.ptr-right { background: #ec4899; }
</style>