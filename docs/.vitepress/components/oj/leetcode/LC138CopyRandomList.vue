<!-- https://leetcode.cn/problems/copy-list-with-random-pointer/ -->
<template>
  <VisualizerLayout
    title="复制带随机指针的链表 (LeetCode 138)"
    storageKey="copy-random-list-config"
    defaultData="[[7,null],[13,0],[11,4],[10,2],[1,0]]"
    :defaultInterval="1200"
    :actionButtons="visualizerButtons"
    :steps="steps"
    @calculate="calculateSteps"
  >
    <template #visualization="{ step }">
      <div
        class="linked-list-visualizer"
        v-if="step && step.oldNodes"
      >

        <div class="zone-wrapper">
          <div class="zone-title">
            <span class="badge primary">原链表 (Old List)</span>
          </div>
          <div class="list-container">
            <template
              v-for="(node, idx) in step.oldNodes"
              :key="'old-' + idx"
            >
              <div
                class="ll-node"
                :class="{ 'is-active': step.curIdx === idx }"
              >
                <div class="node-idx">旧节点 {{ idx }}</div>
                <div class="node-val">{{ node.val }}</div>
                <div class="node-ptrs">
                  <div>next: <span class="ptr-target">{{ idx === step.oldNodes.length - 1 ? 'null' : idx + 1 }}</span>
                  </div>
                  <div>random: <span class="ptr-target">{{ node.random !== null ? node.random : 'null' }}</span></div>
                </div>
              </div>
              <div
                class="ll-arrow"
                v-if="idx !== step.oldNodes.length - 1"
              >➔</div>
            </template>
          </div>
        </div>

        <div class="divider">
          <div class="arrow-down">↓ Map 映射记录 ↓</div>
        </div>

        <div class="zone-wrapper map-wrapper">
          <div class="zone-title">
            <span class="badge warning">哈希表 (HashMap)</span>
            <span class="desc">Map&lt;Node, Node&gt; 缓存了新旧节点的映射关系</span>
          </div>
          <div class="map-container">
            <div
              class="map-entry"
              v-for="entry in step.hashMap"
              :key="'map-' + entry.oldIdx"
            >
              <div class="map-key">旧节点 {{ entry.oldIdx }}</div>
              <div class="map-arrow">➞</div>
              <div class="map-value">新节点 {{ entry.newIdx }}</div>
            </div>
            <div
              class="empty-text"
              v-if="step.hashMap.length === 0"
            >Map 为空</div>
          </div>
        </div>

        <div class="divider">
          <div class="arrow-down">↓ 构建与连接 ↓</div>
        </div>

        <div class="zone-wrapper new-list-wrapper">
          <div class="zone-title">
            <span class="badge success">新链表 (New List)</span>
          </div>
          <div class="list-container">
            <template
              v-for="(node, idx) in step.newNodes"
              :key="'new-' + idx"
            >
              <div
                class="ll-node new-node"
                v-if="node"
                :class="{ 'is-active': step.curIdx === idx }"
              >
                <div class="node-idx">新节点 {{ idx }}</div>
                <div class="node-val">{{ node.val }}</div>
                <div class="node-ptrs">
                  <div>next: <span class="ptr-target new-target">{{ node.next !== null ? node.next : 'null' }}</span>
                  </div>
                  <div>random: <span class="ptr-target new-target">{{ node.random !== null ? node.random : 'null'
                  }}</span></div>
                </div>
              </div>
              <div
                class="ll-node empty-node"
                v-else
              >
                null
              </div>
              <div
                class="ll-arrow"
                v-if="idx !== step.newNodes.length - 1"
              >
                <span v-if="node && node.next !== null">➔</span>
                <span
                  v-else
                  style="color: transparent"
                >➔</span>
              </div>
            </template>
          </div>
        </div>

      </div>
    </template>
  </VisualizerLayout>
</template>

<script setup>
  import { ref } from 'vue'
  import VisualizerLayout from '@components/common/visualization/VisualizerLayout.vue'

  // 标准化接入 Layout 的控制按钮
  const visualizerButtons = [
    { id: 'prev', label: '上一步', icon: 'prev' },
    { id: 'play', label: '自动播放', labelPause: '暂停', icon: 'play', iconPause: 'pause' },
    { id: 'next', label: '下一步', icon: 'next' },
    { id: 'skip', label: '跳过本轮', icon: 'skip' }
  ]

  const steps = ref([])

  const calculateSteps = (inputRaw) => {
    let parsedData = []
    try {
      // 兼容 LeetCode 的标准输入格式，例如: [[7,null],[13,0],[11,4],[10,2],[1,0]]
      // 利用正则将 null 替换为合法的 JSON null
      const safeJson = inputRaw.replace(/null/g, '"null"')
      parsedData = JSON.parse(safeJson)
    } catch (e) {
      steps.value = []
      return
    }

    // 1. 构建原链表的数据模型
    const oldNodes = parsedData.map((item, idx) => ({
      idx: idx,
      val: item[0],
      random: item[1] === "null" ? null : item[1]
    }))

    steps.value = []
    let hashMapEntries = []
    let newNodesArray = Array(oldNodes.length).fill(null)
    let passNum = 0

    // 统一的推帧函数
    const pushState = (desc, passId, currentHighlightIdx) => {
      steps.value.push({
        oldNodes: JSON.parse(JSON.stringify(oldNodes)),
        newNodes: JSON.parse(JSON.stringify(newNodesArray)),
        hashMap: JSON.parse(JSON.stringify(hashMapEntries)),
        curIdx: currentHighlightIdx,
        description: desc,
        passId: passId
      })
    }

    pushState("初始状态。将原链表视为数组，准备开始第一次遍历。", passNum, -1)

    // ==== 阶段 1：第一次遍历，克隆节点并存入 HashMap ====
    passNum++
    for (let i = 0; i < oldNodes.length; i++) {
      pushState(`【阶段 1: 节点克隆】指针 cur 移动到原节点 ${i} (值为 ${oldNodes[i].val})。`, passNum, i)

      // 实例化新节点（此时 next 和 random 都为空）
      newNodesArray[i] = { idx: i, val: oldNodes[i].val, next: null, random: null }
      // 存入哈希表映射
      hashMapEntries.push({ oldIdx: i, newIdx: i })

      pushState(`创建新节点，并将其值设为 ${oldNodes[i].val}。同时在 HashMap 中记录映射：(旧节点 ${i} -> 新节点 ${i})。`, passNum, i)
    }

    pushState("第一次遍历完成！此时所有的孤立新节点已创建完毕，且新旧映射关系已全部记录在 HashMap 中。", passNum, -1)

    // ==== 阶段 2：第二次遍历，连接 next 与 random 指针 ====
    passNum++
    for (let i = 0; i < oldNodes.length; i++) {
      pushState(`【阶段 2: 指针连接】指针 cur 再次移动到原节点 ${i}。通过 map.get(cur) 找到其对应的新节点。`, passNum, i)

      // 连接 next 指针
      if (i < oldNodes.length - 1) {
        newNodesArray[i].next = i + 1
      }

      // 连接 random 指针
      newNodesArray[i].random = oldNodes[i].random

      pushState(`利用 HashMap 的映射关系，将新节点 ${i} 的 next 指向 ${newNodesArray[i].next}，random 指向 ${newNodesArray[i].random}。`, passNum, i)
    }

    // ==== 最终状态 ====
    passNum++
    pushState("🎉 拷贝完成！所有的节点均已深度克隆并正确连接。返回 map.get(head) 即为新链表的头节点。", passNum, -1)
  }
</script>

<style scoped>
  .linked-list-visualizer {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    width: 100%;
    padding: 10px 0;
    gap: 12px;
  }

  .zone-wrapper {
    position: relative;
    width: 100%;
    background-color: var(--vp-c-bg-elv);
    border: 1px dashed var(--vp-c-border);
    border-radius: 12px;
    padding: 60px 20px 20px 20px;
  }

  .map-wrapper {
    background-color: rgba(234, 179, 8, 0.03);
    border-color: rgba(234, 179, 8, 0.4);
  }

  .new-list-wrapper {
    background-color: rgba(16, 185, 129, 0.03);
    border-color: rgba(16, 185, 129, 0.4);
  }

  .zone-title {
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

  .badge.primary {
    background-color: #3b82f6;
  }

  .badge.warning {
    background-color: #eab308;
  }

  .badge.success {
    background-color: #10b981;
  }

  .desc {
    font-size: 12px;
    color: var(--vp-c-text-3);
  }

  .divider {
    display: flex;
    gap: 20px;
    color: var(--vp-c-text-3);
    font-size: 14px;
    font-weight: bold;
    opacity: 0.7;
  }

  /* 链表横向布局 */
  .list-container {
    display: flex;
    align-items: center;
    overflow-x: auto;
    /* padding-bottom: 10px; */
    padding: 10px;

    gap: 15px;
  }

  /* 单个节点的 UI 设计：像一张内存卡片 */
  .ll-node {
    min-width: 110px;
    background-color: var(--vp-c-bg-soft);
    border: 2px solid var(--vp-c-border);
    border-radius: 8px;
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: 10px;
    transition: all 0.3s ease;
    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);
  }

  /* 探照灯高亮：表示 cur 指针 */
  .ll-node.is-active {
    border-color: #3b82f6;
    box-shadow: 0 0 15px rgba(59, 130, 246, 0.4);
    transform: translateY(-4px);
  }

  .ll-node.new-node.is-active {
    border-color: #10b981;
    box-shadow: 0 0 15px rgba(16, 185, 129, 0.4);
  }

  .node-idx {
    font-size: 11px;
    color: var(--vp-c-text-3);
    margin-bottom: 6px;
    border-bottom: 1px solid var(--vp-c-border);
    width: 100%;
    text-align: center;
    padding-bottom: 4px;
  }

  .node-val {
    font-size: 20px;
    font-weight: bold;
    color: var(--vp-c-text-1);
    margin-bottom: 8px;
  }

  .node-ptrs {
    font-size: 11px;
    color: var(--vp-c-text-2);
    display: flex;
    flex-direction: column;
    gap: 4px;
    width: 100%;
  }

  .ptr-target {
    font-weight: bold;
    color: #ec4899;
    background-color: rgba(236, 72, 153, 0.1);
    padding: 1px 4px;
    border-radius: 3px;
  }

  .ptr-target.new-target {
    color: #10b981;
    background-color: rgba(16, 185, 129, 0.1);
  }

  .empty-node {
    border: 2px dashed var(--vp-c-border);
    background: transparent;
    color: var(--vp-c-text-3);
    box-shadow: none;
    justify-content: center;
    min-height: 100px;
  }

  .ll-arrow {
    color: var(--vp-c-text-3);
    font-size: 24px;
    font-weight: bold;
  }

  /* HashMap 表格 UI */
  .map-container {
    display: flex;
    flex-wrap: wrap;
    gap: 12px;
  }

  .map-entry {
    display: flex;
    align-items: center;
    background-color: var(--vp-c-bg);
    border: 1px solid rgba(234, 179, 8, 0.3);
    border-radius: 6px;
    padding: 6px 12px;
    font-size: 13px;
    font-weight: bold;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.02);
  }

  .map-key {
    color: #3b82f6;
  }

  .map-arrow {
    margin: 0 10px;
    color: var(--vp-c-text-3);
  }

  .map-value {
    color: #10b981;
  }

  .empty-text {
    font-size: 13px;
    color: var(--vp-c-text-3);
    font-style: italic;
  }
</style>