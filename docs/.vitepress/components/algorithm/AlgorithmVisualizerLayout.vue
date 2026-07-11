<template>
  <div class="sort-visualizer-container">
    <!-- 顶部控制与状态栏 -->
    <div class="controls-header">
      <div class="array-input">
        <label>{{ config.labels.inputLabel }}</label>
        <input
          v-model="inputRaw"
          @change="onMainArrayChange"
          :placeholder="config.labels.inputPlaceholder"
        />
      </div>

      <div class="header-actions">
        <div class="step-counter">
          {{ config.labels.stepLabel }} {{ currentStepIndex }} / {{ steps.length > 0 ? steps.length - 1 : 0 }}
        </div>
        <button
          class="header-btn"
          @click="reset"
          :title="config.labels.resetBtn"
        >{{ config.labels.resetBtn }}</button>
        <button
          class="header-btn"
          @click="openConfig"
          :title="config.labels.settingsBtn"
        >{{ config.labels.settingsBtn }}</button>
      </div>
    </div>

    <!-- 🪄 纯净舞台插槽：限制了最大最小高度，超出可滚动 -->
    <div class="visualization-area">
      <slot
        name="visualization"
        :step="currentStep"
      ></slot>
    </div>

    <!-- 核心原理解说面板 -->
    <div class="explanation-panel">
      <p><strong>{{ config.labels.actionLabel }}</strong>{{ currentStep?.description }}</p>
    </div>

    <!-- 交互控制台 -->
    <div class="action-controls">
      <template
        v-for="btn in config.actionButtons"
        :key="btn.id"
      >
        <button
          v-if="btn.id === 'prev'"
          @click="prevStep"
          :disabled="currentStepIndex === 0 || isPlaying"
        >{{ btn.label }}</button>
        <button
          v-else-if="btn.id === 'play'"
          @click="togglePlay"
          class="play-btn"
        >
          {{ isPlaying ? btn.labelPause : btn.label }}
        </button>
        <button
          v-else-if="btn.id === 'next'"
          @click="nextStep"
          :disabled="currentStepIndex === steps.length - 1 || isPlaying"
          class="primary-btn"
        >{{ btn.label }}</button>
        <button
          v-else-if="btn.id === 'skip'"
          @click="skipPass"
          :disabled="currentStepIndex === steps.length - 1 || isPlaying"
          class="secondary-btn"
          :title="btn.label"
        >{{ btn.label }}</button>
      </template>
    </div>

    <!-- ⚙️ 配置面板 (Modal) -->
    <Teleport to="body">
      <div
        class="config-overlay"
        v-if="isConfigOpen"
      >
        <div class="config-modal">
          <div class="modal-header">
            <h3>⚙️ {{ title }} - 配置管理</h3>
            <button
              class="close-btn"
              @click="closeConfig"
              title="关闭"
            >×</button>
          </div>

          <div class="config-section">
            <h4>基本参数</h4>
            <label>默认数据: <input v-model="tempConfig.defaultArray" /></label>
            <label>动画间隔 (毫秒): <input
                type="number"
                v-model="tempConfig.playIntervalMs"
                step="100"
                min="100"
              /></label>
          </div>

          <div class="config-section">
            <h4>底部按钮配置 <span class="hint-text">(💡按住 ☰ 拖拽排版，双击文案修改)</span></h4>
            <ul class="draggable-list">
              <li
                v-for="(btn, index) in tempConfig.actionButtons"
                :key="btn.id"
                draggable="true"
                @dragstart="onDragStart($event, index)"
                @dragover.prevent
                @drop="onDrop($event, index)"
                class="draggable-item"
                :class="{ 'dragging': draggedIndex === index }"
              >
                <span
                  class="drag-handle"
                  title="按住拖拽排列"
                >☰</span>
                <div
                  class="btn-edit-content"
                  @dblclick="editBtnIndex = index"
                  title="双击直接修改"
                >
                  <template v-if="editBtnIndex === index">
                    <input
                      v-model="btn.label"
                      @blur="editBtnIndex = -1"
                      @keyup.enter="editBtnIndex = -1"
                      v-focus
                    />
                    <input
                      v-if="btn.id === 'play'"
                      v-model="btn.labelPause"
                      placeholder="暂停文案"
                      @blur="editBtnIndex = -1"
                      @keyup.enter="editBtnIndex = -1"
                    />
                  </template>
                  <template v-else>
                    {{ btn.label }} <span
                      v-if="btn.id === 'play'"
                      class="sub-label"
                    >(暂停: {{ btn.labelPause }})</span>
                  </template>
                </div>
              </li>
            </ul>
          </div>

          <div class="config-actions">
            <button
              @click="resetConfigToDefault"
              class="danger-btn"
            >恢复出厂配置</button>
            <div class="right-actions">
              <button
                @click="closeConfig"
                class="secondary-btn"
              >取消</button>
              <button
                @click="saveConfig"
                class="primary-btn"
              >保存并应用</button>
            </div>
          </div>
        </div>
      </div>
    </Teleport>

    <!-- 全局弹窗与提示组件 -->
    <ActionConfirm ref="confirmModal" />
    <MessageToast ref="messageToast" />
  </div>
</template>

<script setup>
import '@components/common/visualization/visualization-base.css'
  import { ref, computed, onUnmounted, reactive, onMounted } from 'vue'

  import ActionConfirm from '@components/common/feedback/ActionConfirm.vue'
  import MessageToast from '@components/common/feedback/MessageToast.vue'

  const confirmModal = ref(null)
  const messageToast = ref(null)

  const props = defineProps({
    title: { type: String, default: '组件' },
    storageKey: { type: String, required: true },
    defaultArray: { type: String, default: '64, 25, 12, 22, 11' },
    steps: { type: Array, required: true }
  })

  const emit = defineEmits(['calculate'])

  const DEFAULT_CONFIG = {
    defaultArray: props.defaultArray,
    playIntervalMs: 800,
    labels: {
      inputLabel: '自定义数据：', // 改为更通用的“数据”
      inputPlaceholder: '如: 29,10,14',
      stepLabel: '步骤：',
      actionLabel: '当前动作：',
      resetBtn: '🔄 重置',
      settingsBtn: '⚙️ 配置'
    },
    actionButtons: [
      { id: 'prev', label: '⏮ 上一步' },
      { id: 'play', label: '▶️ 自动播放', labelPause: '⏸ 暂停' },
      { id: 'next', label: '下一步 ⏭' },
      { id: 'skip', label: '⏭ 跳过本轮' }
    ]
  }

  const config = reactive(JSON.parse(JSON.stringify(DEFAULT_CONFIG)))
  const tempConfig = reactive(JSON.parse(JSON.stringify(DEFAULT_CONFIG)))
  const isConfigOpen = ref(false)
  const vFocus = { mounted: (el) => el.focus() }

  const inputRaw = ref(config.defaultArray)
  const currentStepIndex = ref(0)
  const isPlaying = ref(false)
  let playTimer = null

  const currentStep = computed(() => {
    return props.steps[currentStepIndex.value] || { description: '加载中...' }
  })

  onMounted(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem(props.storageKey)
      if (saved) {
        try {
          Object.assign(config, JSON.parse(saved))
          Object.assign(tempConfig, JSON.parse(saved))
        } catch (e) { console.error("加载本地配置失败", e) }
      }
    }
    if (inputRaw.value !== config.defaultArray) inputRaw.value = config.defaultArray

    emit('calculate', inputRaw.value)
  })

  const isDirty = computed(() => JSON.stringify(config) !== JSON.stringify(tempConfig))

  const openConfig = () => {
    Object.assign(tempConfig, JSON.parse(JSON.stringify(config)))
    editBtnIndex.value = -1
    isConfigOpen.value = true
  }

  const closeConfig = async () => {
    if (isDirty.value) {
      // 确保这里使用的是 confirmModal.value.show
      const isOk = await confirmModal.value.show('检测到有未保存的配置修改，是否保存并应用？\n(点击取消将丢弃修改)')
      if (isOk) {
        saveConfig()
      } else {
        Object.assign(tempConfig, JSON.parse(JSON.stringify(config)))
        isConfigOpen.value = false
      }
    } else {
      isConfigOpen.value = false
    }
  }

  const saveConfigToLocal = () => {
    if (typeof window !== 'undefined') localStorage.setItem(props.storageKey, JSON.stringify(config))
  }

  const saveConfig = () => {
    Object.assign(config, JSON.parse(JSON.stringify(tempConfig)))
    saveConfigToLocal()
    inputRaw.value = config.defaultArray
    isConfigOpen.value = false
    messageToast.value.show('配置保存成功！', 'success')
    reset()
  }

  const resetConfigToDefault = async () => {
    const isOk = await confirmModal.value.show('确定要恢复到出厂默认配置吗？这将清除你自定义的排版和文案。', { type: 'danger' })
    if (isOk) {
      Object.assign(tempConfig, JSON.parse(JSON.stringify(DEFAULT_CONFIG)))
      Object.assign(config, JSON.parse(JSON.stringify(DEFAULT_CONFIG)))
      if (typeof window !== 'undefined') localStorage.removeItem(props.storageKey)
      inputRaw.value = config.defaultArray
      isConfigOpen.value = false
      messageToast.value.show('已恢复出厂配置', 'info')
      reset()
    }
  }

  const onMainArrayChange = () => {
    config.defaultArray = inputRaw.value
    Object.assign(tempConfig, JSON.parse(JSON.stringify(config)))
    saveConfigToLocal()
    reset()
  }

  const draggedIndex = ref(-1)
  const editBtnIndex = ref(-1)
  const onDragStart = (e, index) => { draggedIndex.value = index; e.dataTransfer.effectAllowed = 'move' }
  const onDrop = (e, index) => {
    if (draggedIndex.value === -1 || draggedIndex.value === index) return
    const draggedItem = tempConfig.actionButtons[draggedIndex.value]
    tempConfig.actionButtons.splice(draggedIndex.value, 1)
    tempConfig.actionButtons.splice(index, 0, draggedItem)
    draggedIndex.value = -1
  }

  const nextStep = () => { if (currentStepIndex.value < props.steps.length - 1) currentStepIndex.value++ }
  const prevStep = () => { if (currentStepIndex.value > 0) currentStepIndex.value-- }

  const reset = () => {
    if (isPlaying.value) togglePlay()
    emit('calculate', inputRaw.value)
    currentStepIndex.value = 0
  }

  const skipPass = () => {
    if (!currentStep.value) return;
    const currentPass = currentStep.value.passId;
    if (currentPass === undefined) { nextStep(); return; }

    let nextIdx = currentStepIndex.value;
    while (nextIdx < props.steps.length - 1 && props.steps[nextIdx].passId === currentPass) {
      nextIdx++;
    }
    currentStepIndex.value = nextIdx;
  }

  const togglePlay = () => {
    if (isPlaying.value) {
      clearInterval(playTimer)
      isPlaying.value = false
    } else {
      if (currentStepIndex.value === props.steps.length - 1) currentStepIndex.value = 0
      isPlaying.value = true
      playTimer = setInterval(() => {
        if (currentStepIndex.value < props.steps.length - 1) currentStepIndex.value++
        else togglePlay()
      }, config.playIntervalMs)
    }
  }

  onUnmounted(() => { if (playTimer) clearInterval(playTimer) })
</script>

<style scoped>

  /* 这里保留你原本的 Layout 专属样式... */
  .controls-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 20px;
    font-size: 14px;
    flex-wrap: wrap;
    gap: 10px;
  }

  .array-input input {
    background: var(--vp-c-bg-elv);
    border: 1px solid var(--vp-c-border);
    color: var(--vp-c-text-1);
    padding: 4px 8px;
    border-radius: 4px;
    margin-left: 8px;
    width: 160px;
  }

  .header-actions {
    display: flex;
    align-items: center;
    gap: 12px;
  }

  .header-btn {
    background: transparent;
    border: 1px solid var(--vp-c-border);
    color: var(--vp-c-text-2);
    padding: 4px 10px;
    border-radius: 4px;
    font-size: 12px;
    cursor: pointer;
    transition: all 0.2s;
  }

  .header-btn:hover {
    background: var(--vp-c-bg-elv);
    color: var(--vp-c-text-1);
  }

  .visualization-area {
    margin: 20px 0;
    width: 100%;
    min-height: 100px;
    /* 改小最小高度，把排版权交还给具体的子组件 */
    max-height: 500px;
    overflow: auto;
    background-color: var(--vp-c-bg-elv);
    border-radius: 8px;
    position: relative;
  }

  .explanation-panel {
    background-color: var(--vp-c-bg-elv);
    padding: 12px 16px;
    border-radius: 6px;
    margin-bottom: 20px;
    border-left: 4px solid var(--vp-c-brand);
    min-height: 72px;
    display: flex;
    align-items: center;
  }

  .explanation-panel p {
    margin: 0;
    line-height: 1.5;
  }

  .action-controls {
    display: flex;
    justify-content: center;
    gap: 12px;
    flex-wrap: wrap;
  }

  .action-controls button {
    padding: 8px 16px;
    border-radius: 6px;
    border: 1px solid var(--vp-c-border);
    background: var(--vp-c-bg-elv);
    color: var(--vp-c-text-1);
    cursor: pointer;
    transition: all 0.2s;
    font-size: 14px;
  }

  .action-controls button:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  .action-controls button:hover:not(:disabled) {
    background: var(--vp-c-bg-soft);
  }

  .action-controls button.primary-btn {
    color: var(--vp-c-text-1);
    border-color: var(--vp-c-brand);
  }

  .action-controls button.primary-btn:hover:not(:disabled) {
    background: var(--vp-c-brand);
    color: var(--vp-c-bg-elv);
  }

  .action-controls button.play-btn {
    background: #10b981;
    color: white;
    border-color: #10b981;
  }

  .action-controls button.play-btn:hover:not(:disabled) {
    background: #059669;
  }

  /* 将 absolute 替换为 fixed，并加大 z-index */
  .config-overlay {
    position: fixed;
    inset: 0;
    background: rgba(0, 0, 0, 0.6);
    backdrop-filter: blur(4px);
    z-index: 9990;
    /* 提升层级，防止被 VitePress 顶栏遮挡 */
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .config-modal {
    background: var(--vp-c-bg);
    border: 1px solid var(--vp-c-border);
    padding: 24px;
    border-radius: 8px;
    width: 90%;
    max-width: 500px;
    max-height: 90%;
    overflow-y: auto;
    box-shadow: 0 10px 30px rgba(0, 0, 0, 0.5);
  }

  .modal-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    border-bottom: 1px solid var(--vp-c-border);
    padding-bottom: 10px;
    margin-bottom: 20px;
  }

  .modal-header h3 {
    margin: 0;
    font-size: 18px;
    color: var(--vp-c-text-1);
    border: none;
    padding: 0;
  }

  .close-btn {
    background: transparent;
    border: none;
    font-size: 24px;
    color: var(--vp-c-text-2);
    cursor: pointer;
    line-height: 1;
    padding: 0;
    transition: color 0.2s;
  }

  .close-btn:hover {
    color: #ef4444;
  }

  .config-section {
    margin-bottom: 24px;
  }

  .config-section h4 {
    margin-bottom: 12px;
    font-size: 14px;
    color: var(--vp-c-text-2);
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  .hint-text {
    font-size: 12px;
    color: var(--vp-c-text-3);
    font-weight: normal;
  }

  .config-section label {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 8px;
    font-size: 13px;
    color: var(--vp-c-text-1);
  }

  .config-section input {
    background: var(--vp-c-bg-elv);
    border: 1px solid var(--vp-c-border);
    color: var(--vp-c-text-1);
    padding: 4px 8px;
    border-radius: 4px;
    width: 60%;
  }

  .draggable-list {
    list-style: none;
    padding: 0;
    margin: 0;
    border: 1px solid var(--vp-c-border);
    border-radius: 6px;
    overflow: hidden;
  }

  .draggable-item {
    display: flex;
    align-items: center;
    padding: 10px;
    border-bottom: 1px solid var(--vp-c-border);
    background: var(--vp-c-bg-elv);
    transition: background 0.2s;
  }

  .draggable-item:last-child {
    border-bottom: none;
  }

  .draggable-item:hover {
    background: var(--vp-c-bg-soft);
  }

  .draggable-item.dragging {
    opacity: 0.5;
    background: var(--vp-c-bg);
  }

  .drag-handle {
    cursor: grab;
    margin-right: 12px;
    color: var(--vp-c-text-3);
    user-select: none;
    font-size: 16px;
  }

  .drag-handle:active {
    cursor: grabbing;
  }

  .btn-edit-content {
    flex-grow: 1;
    display: flex;
    gap: 8px;
    align-items: center;
    cursor: text;
  }

  .btn-edit-content input {
    width: 120px !important;
    border-color: var(--vp-c-brand) !important;
  }

  .sub-label {
    color: var(--vp-c-text-3);
    font-size: 12px;
  }

  .config-actions {
    display: flex;
    justify-content: space-between;
    margin-top: 30px;
    padding-top: 15px;
    border-top: 1px solid var(--vp-c-border);
  }

  .right-actions {
    display: flex;
    gap: 10px;
  }

  .config-actions button {
    padding: 6px 14px;
    border-radius: 4px;
    cursor: pointer;
    border: 1px solid var(--vp-c-border);
    font-size: 13px;
  }

  .config-actions .primary-btn {
    background: var(--vp-c-brand);
    color: white;
    border: none;
  }

  .config-actions .danger-btn {
    background: transparent;
    color: #ef4444;
    border-color: #ef4444;
  }

  .config-actions .danger-btn:hover {
    background: #ef4444;
    color: white;
  }

  .config-actions .secondary-btn {
    background: var(--vp-c-bg-elv);
    color: var(--vp-c-text-1);
  }
</style>

<!-- 【新增】：非 scoped 标签，作为所有算法子组件的全局 CSS 共享库 -->
<style>

  /* 复用：方块基本布局 */
  .array-display-inner {
    display: flex;
    gap: 12px;
    align-items: flex-end;
    justify-content: center;
    width: 100%;
    height: 100%;
    padding: 40px 20px;
    box-sizing: border-box;
    flex-wrap: wrap;
  }

  .array-item {
    display: flex;
    flex-direction: column;
    align-items: center;
    width: 48px;
  }

  .item-value {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 40px;
    height: 40px;
    border-radius: 6px;
    background-color: var(--vp-c-default-soft);
    color: var(--vp-c-text-1);
    font-weight: bold;
    font-size: 18px;
    transition: all 0.3s ease;
    border: 2px solid transparent;
  }

  .item-label {
    height: 20px;
    margin-top: 8px;
    font-size: 12px;
    display: flex;
    gap: 4px;
    color: var(--vp-c-text-2);
  }

  .item-label span {
    padding: 0 4px;
    border-radius: 4px;
    background: rgba(128, 128, 128, 0.2);
    white-space: nowrap;
  }

  /* 复用：FLIP 丝滑交换动画核心 */
  .swap-move {
    transition: transform 0.5s cubic-bezier(0.55, 0, 0.1, 1);
  }

  /* 复用：通用状态高亮 (绿色、蓝色、粉色探照灯等) */
  .is-sorted .item-value {
    background-color: rgba(16, 185, 129, 0.15);
    border-color: #10b981;
    color: #10b981;
  }

  .is-current-i .item-value {
    border-color: #3b82f6;
    box-shadow: 0 0 10px rgba(59, 130, 246, 0.3);
  }

  .is-scanning-j .item-value {
    border-color: #ec4899;
  }

  .target-label {
    color: #3b82f6;
    background: rgba(59, 130, 246, 0.2) !important;
  }

  .min-label {
    color: #eab308;
    background: rgba(234, 179, 8, 0.2) !important;
  }
</style>