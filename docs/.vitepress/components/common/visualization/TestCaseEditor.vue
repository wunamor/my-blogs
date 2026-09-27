<template>
  <Teleport to="body">
    <Transition name="tc-fade">
      <div
        class="tc-overlay"
        v-if="visible"
      >
        <div class="tc-modal">
          <div class="tc-header">
            <h3>📋 测试用例管理</h3>
            <button
              class="tc-close"
              @click="tryClose"
              title="关闭"
            >×</button>
          </div>

          <!-- 🌟 力扣风格 Case 页签栏：点击切换 / 悬停删除 / 拖拽排序 -->
          <div class="tc-tabs">
            <div
              class="tc-tab"
              :class="{ 'is-active': i === localActive, 'dragging': draggedTab === i }"
              v-for="(c, i) in localCases"
              :key="i"
              draggable="true"
              @click="localActive = i"
              @dragstart="onTabDragStart(i)"
              @dragover.prevent
              @drop="onTabDrop(i)"
              :title="`用例 ${i + 1}（点击切换，拖拽排序）`"
            >
              <span class="tc-tab-name">Case {{ i + 1 }}</span>
              <button
                class="tc-tab-del"
                :disabled="localCases.length <= 1"
                @click.stop="removeCase(i)"
                title="删除此用例"
              >✕</button>
            </div>
            <button
              class="tc-tab-add"
              @click="addCase"
              title="添加用例（复制当前）"
            >＋</button>
          </div>

          <!-- 🌟 仅显示当前选中用例的字段：力扣风格，一行描述 + 一行值，依次迭代 -->
          <div
            class="tc-fields"
            v-if="currentCase"
          >
            <label
              class="tc-field"
              v-for="def in inputs"
              :key="def.id"
            >
              <span class="tc-field-label">{{ def.label || '数据' }}</span>
              <input
                class="tc-field-input"
                v-model="currentCase[def.id]"
                :placeholder="def.placeholder || ''"
              />
            </label>
          </div>

          <div class="tc-footer">
            <button
              class="tc-btn restore"
              @click="restoreCurrentDefault"
              title="仅将当前页签的用例恢复为组件默认数据"
            >↺ 恢复默认（当前）</button>
            <div class="tc-footer-right">
              <button
                class="tc-btn secondary"
                @click="tryClose"
              >取消</button>
              <button
                class="tc-btn run"
                @click="runCurrent"
              >▶ 运行当前用例</button>
              <button
                class="tc-btn primary"
                @click="apply"
              >保存并应用</button>
            </div>
          </div>
        </div>
      </div>
    </Transition>

    <ActionConfirm ref="confirmRef" />
  </Teleport>
</template>

<script setup>
  import { ref, watch, computed } from 'vue'
  import ActionConfirm from '../feedback/ActionConfirm.vue'

  const props = defineProps({
    visible: { type: Boolean, default: false },
    // 输入定义：[{ id, label, placeholder, width }]；旧组件为单伪字段 { id: 'data' }
    inputs: { type: Array, required: true },
    // 用例对象数组：[{ [inputId]: string }]
    cases: { type: Array, required: true },
    activeIndex: { type: Number, default: 0 },
    // 组件 props.defaultData 解析出的默认用例（恢复默认用）
    defaultCase: { type: Object, required: true }
  })

  const emit = defineEmits(['close', 'apply'])

  const confirmRef = ref(null)
  const localCases = ref([])
  const localActive = ref(0)
  let snapshot = ''

  watch(() => props.visible, (v) => {
    if (!v) return
    localCases.value = JSON.parse(JSON.stringify(props.cases))
    localActive.value = Math.min(Math.max(props.activeIndex, 0), localCases.value.length - 1)
    snapshot = JSON.stringify({ c: localCases.value, a: localActive.value })
  })

  const currentCase = computed(() => localCases.value[localActive.value] || null)

  const isDirty = computed(() => JSON.stringify({ c: localCases.value, a: localActive.value }) !== snapshot)

  const blankCase = () => {
    const o = {}
    props.inputs.forEach(d => { o[d.id] = '' })
    return o
  }

  const addCase = () => {
    localCases.value.push(JSON.parse(JSON.stringify(currentCase.value || blankCase())))
    localActive.value = localCases.value.length - 1
  }

  const removeCase = (i) => {
    localCases.value.splice(i, 1)
    if (localActive.value >= localCases.value.length) localActive.value = localCases.value.length - 1
    else if (i < localActive.value) localActive.value -= 1
  }

  // 🌟 页签拖拽排序
  const draggedTab = ref(-1)
  const onTabDragStart = (i) => { draggedTab.value = i }
  const onTabDrop = (i) => {
    if (draggedTab.value === -1 || draggedTab.value === i) return
    const arr = localCases.value
    const [moved] = arr.splice(draggedTab.value, 1)
    arr.splice(i, 0, moved)
    if (localActive.value === draggedTab.value) localActive.value = i
    else if (draggedTab.value < localActive.value && i >= localActive.value) localActive.value -= 1
    else if (draggedTab.value > localActive.value && i <= localActive.value) localActive.value += 1
    draggedTab.value = -1
  }

  // 🌟 仅恢复当前选中的用例，其余页签不动
  const restoreCurrentDefault = () => {
    if (!currentCase.value) return
    localCases.value[localActive.value] = JSON.parse(JSON.stringify(props.defaultCase))
  }

  const apply = () => {
    if (!localCases.value.length) localCases.value = [blankCase()]
    emit('apply', {
      cases: JSON.parse(JSON.stringify(localCases.value)),
      activeIndex: localActive.value
    })
  }

  const runCurrent = () => apply()

  const tryClose = async () => {
    if (isDirty.value) {
      const ok = await confirmRef.value.show('检测到未保存的用例修改，是否丢弃并关闭？')
      if (!ok) return
    }
    emit('close')
  }
</script>

<style scoped>
  .tc-overlay {
    position: fixed;
    inset: 0;
    background: rgba(0, 0, 0, 0.6);
    backdrop-filter: blur(4px);
    z-index: 9995;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 20px;
    box-sizing: border-box;
  }

  .tc-modal {
    background: var(--vp-c-bg);
    border: 1px solid var(--vp-c-border);
    padding: 20px 24px;
    border-radius: 8px;
    width: 100%;
    max-width: 640px;
    display: flex;
    flex-direction: column;
    box-shadow: 0 10px 30px rgba(0, 0, 0, 0.5);
  }

  .tc-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    border-bottom: 1px solid var(--vp-c-border);
    padding-bottom: 10px;
    margin-bottom: 14px;
  }

  .tc-header h3 {
    margin: 0;
    font-size: 17px;
    color: var(--vp-c-text-1);
    border: none;
    padding: 0;
  }

  .tc-close {
    background: transparent;
    border: none;
    font-size: 24px;
    color: var(--vp-c-text-2);
    cursor: pointer;
    line-height: 1;
    padding: 0;
  }

  .tc-close:hover {
    color: #ef4444;
  }

  /* ================= 🌟 Case 页签栏 ================= */
  .tc-tabs {
    display: flex;
    align-items: center;
    gap: 6px;
    flex-wrap: wrap;
    border-bottom: 1px solid var(--vp-c-border);
    padding-bottom: 0;
    margin-bottom: 16px;
  }

  .tc-tab {
    display: flex;
    align-items: center;
    gap: 4px;
    padding: 6px 10px;
    font-size: 13px;
    color: var(--vp-c-text-2);
    border: 1px solid transparent;
    border-bottom: 2px solid transparent;
    border-radius: 6px 6px 0 0;
    cursor: grab;
    user-select: none;
    transition: all 0.2s;
  }

  .tc-tab:hover {
    background: var(--vp-c-bg-soft);
    color: var(--vp-c-text-1);
  }

  .tc-tab.is-active {
    color: #10b981;
    font-weight: 600;
    border-bottom-color: #10b981;
  }

  .tc-tab.dragging {
    opacity: 0.5;
    background: var(--vp-c-bg-soft);
  }

  .tc-tab-name {
    white-space: nowrap;
  }

  .tc-tab-del {
    width: 16px;
    height: 16px;
    border: none;
    border-radius: 3px;
    background: transparent;
    color: var(--vp-c-text-3);
    font-size: 10px;
    line-height: 1;
    cursor: pointer;
    opacity: 0;
    transition: opacity 0.15s;
    padding: 0;
  }

  .tc-tab:hover .tc-tab-del {
    opacity: 1;
  }

  .tc-tab-del:hover:not(:disabled) {
    color: #ef4444;
    background: rgba(239, 68, 68, 0.1);
  }

  .tc-tab-del:disabled {
    display: none;
  }

  .tc-tab-add {
    width: 26px;
    height: 26px;
    border: 1px dashed var(--vp-c-border);
    border-radius: 6px;
    background: transparent;
    color: var(--vp-c-text-2);
    font-size: 14px;
    line-height: 1;
    cursor: pointer;
    margin-bottom: 4px;
  }

  .tc-tab-add:hover {
    color: #10b981;
    border-color: #10b981;
  }

  /* ================= 🌟 字段区：力扣风格（描述一行 + 值一行） ================= */
  .tc-fields {
    display: flex;
    flex-direction: column;
    gap: 12px;
  }

  .tc-field {
    display: flex;
    flex-direction: column;
    gap: 4px;
  }

  .tc-field-label {
    font-size: 13px;
    font-weight: 600;
    color: var(--vp-c-text-2);
  }

  .tc-field-input {
    width: 100%;
    background: var(--vp-c-bg-elv);
    border: 1px solid var(--vp-c-border);
    color: var(--vp-c-text-1);
    padding: 6px 8px;
    border-radius: 4px;
    font-family: monospace;
    font-size: 13px;
    min-width: 0;
    box-sizing: border-box;
  }

  .tc-field-input:focus {
    outline: none;
    border-color: #10b981;
  }

  /* ================= 底部操作区 ================= */
  .tc-footer {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 10px;
    margin-top: 18px;
    padding-top: 14px;
    border-top: 1px solid var(--vp-c-border);
    flex-wrap: wrap;
  }

  .tc-footer-right {
    display: flex;
    gap: 10px;
  }

  .tc-btn {
    padding: 6px 12px;
    border-radius: 5px;
    border: 1px solid var(--vp-c-border);
    font-size: 12px;
    cursor: pointer;
    transition: all 0.2s;
    background: transparent;
    color: var(--vp-c-text-2);
  }

  .tc-btn.primary {
    background: var(--vp-c-text-1);
    color: var(--vp-c-bg);
    border-color: var(--vp-c-text-1);
    font-weight: 600;
  }

  .tc-btn.secondary:hover {
    color: var(--vp-c-text-1);
    border-color: var(--vp-c-text-3);
  }

  .tc-btn.run {
    color: #10b981;
    border-color: rgba(16, 185, 129, 0.5);
  }

  .tc-btn.run:hover {
    background: rgba(16, 185, 129, 0.1);
  }

  .tc-btn.restore {
    color: #eab308;
    border-color: rgba(234, 179, 8, 0.4);
  }

  .tc-btn.restore:hover {
    background: rgba(234, 179, 8, 0.08);
  }

  .tc-fade-enter-active,
  .tc-fade-leave-active {
    transition: opacity 0.2s ease;
  }

  .tc-fade-enter-from,
  .tc-fade-leave-to {
    opacity: 0;
  }
</style>
