<template>
  <div class="sort-visualizer-container">
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
        >
          <span
            class="icon-wrapper"
            v-html="iconLib['reset']"
          ></span>
          {{ config.labels.resetBtn }}
        </button>
        <button
          class="header-btn"
          @click="openConfig"
          :title="config.labels.settingsBtn"
        >
          <span
            class="icon-wrapper"
            v-html="iconLib['settings']"
          ></span>
          {{ config.labels.settingsBtn }}
        </button>
      </div>
    </div>

    <div class="visualization-area">
      <slot
        name="visualization"
        :step="currentStep"
        :current-index="currentStepIndex"
        :is-playing="isPlaying"
      ></slot>
    </div>

    <div class="explanation-panel">
      <p><strong>{{ config.labels.actionLabel }}</strong>{{ currentStep?.description }}</p>
    </div>

    <div class="action-controls">
      <template
        v-for="btn in config.actionButtons"
        :key="btn.id"
      >
        <button
          @click="handleAction(btn)"
          class="control-btn"
          :class="[getBtnClass(btn.id), { 'is-playing': isPlaying && btn.id === 'play' }]"
          :disabled="isBtnDisabled(btn.id)"
          :title="btn.label"
        >
          <span
            class="icon-wrapper"
            v-html="getIconHtml(btn)"
          ></span>
          <span>{{ isPlaying && btn.id === 'play' ? btn.labelPause : btn.label }}</span>
        </button>
      </template>
    </div>

    <Teleport to="body">
      <Transition name="fade">
        <div
          class="config-overlay"
          v-if="isConfigOpen"
        >
          <div class="config-modal">
            <div class="modal-header">
              <h3><span
                  class="icon-wrapper"
                  v-html="iconLib['settings']"
                ></span> {{ title }} - 配置管理</h3>
              <button
                class="close-btn"
                @click="closeConfig"
                title="关闭"
              >×</button>
            </div>

            <div class="config-section">
              <h4>基本参数</h4>
              <label>默认数据: <input v-model="tempConfig.defaultData" /></label>
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
                        @blur="(e) => { if (!e.relatedTarget || e.relatedTarget.tagName !== 'INPUT') editBtnIndex = -1 }"
                        @keyup.enter="editBtnIndex = -1"
                        v-focus
                      />
                      <input
                        v-if="btn.id === 'play'"
                        v-model="btn.labelPause"
                        placeholder="暂停文案"
                        @blur="(e) => { if (!e.relatedTarget || e.relatedTarget.tagName !== 'INPUT') editBtnIndex = -1 }"
                        @keyup.enter="editBtnIndex = -1"
                      />
                    </template>
                    <template v-else>
                      <span
                        class="icon-wrapper"
                        style="opacity: 0.5"
                        v-html="getIconHtml(btn)"
                      ></span>
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
                @click="openResetDialog"
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
      </Transition>
    </Teleport>

    <Teleport to="body">
      <Transition name="fade">
        <div
          class="config-overlay"
          v-if="showResetDialog"
          style="z-index: 9999;"
        >
          <div class="config-modal reset-modal">
            <div class="modal-header">
              <h3 style="color: #ef4444">⚠️ 恢复出厂配置</h3>
              <button
                class="close-btn"
                @click="showResetDialog = false"
              >×</button>
            </div>

            <div class="reset-body">
              <p class="reset-desc">请选择基本参数（默认数据、动画间隔）的恢复基准：</p>

              <div class="radio-group">
                <label class="radio-label">
                  <input
                    type="radio"
                    v-model="resetStrategy"
                    value="algorithm"
                  />
                  <div class="radio-content">
                    <strong>当前算法默认配置 <span class="badge primary-badge">推荐</span></strong>
                    <span class="desc">使用当前算法专属的最佳初始数据与速度。</span>
                  </div>
                </label>

                <label class="radio-label">
                  <input
                    type="radio"
                    v-model="resetStrategy"
                    value="global"
                  />
                  <div class="radio-content">
                    <strong>系统全局通用配置</strong>
                    <span class="desc">强制重置为系统的全局兜底参数。</span>
                  </div>
                </label>
              </div>

              <p class="reset-warning">
                * 底部交互按钮将始终自动恢复为当前算法的初始布局。
              </p>
            </div>

            <div
              class="config-actions"
              style="margin-top: 20px; border-top: none; padding-top: 0"
            >
              <div></div>
              <div class="right-actions">
                <button
                  @click="showResetDialog = false"
                  class="secondary-btn"
                >取消</button>
                <button
                  @click="executeReset"
                  class="danger-btn"
                  style="background: #ef4444; color: white"
                >确定恢复</button>
              </div>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>

    <ActionConfirm ref="confirmModal" />
    <MessageToast ref="messageToast" />
  </div>
</template>

<script setup>
  import './visualization-base.css'
  import { ref, computed, onUnmounted, reactive, onMounted } from 'vue'
  import ActionConfirm from '../feedback/ActionConfirm.vue'
  import MessageToast from '../feedback/MessageToast.vue'

  // ================= 1. 内置极简 SVG 图标库 =================
  const iconLib = {
    prev: `<svg class="btn-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M15 19l-7-7 7-7"/></svg>`,
    next: `<svg class="btn-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M9 5l7 7-7 7"/></svg>`,
    play: `<svg class="btn-icon" viewBox="0 0 24 24" fill="currentColor"><path d="M7 4v16l13-8z"/></svg>`,
    pause: `<svg class="btn-icon" viewBox="0 0 24 24" fill="currentColor"><path d="M6 4h4v16H6zm8 0h4v16h-4z"/></svg>`,
    skip: `<svg class="btn-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M13 5l7 7-7 7M5 5l7 7-7 7"/></svg>`,
    refresh: `<svg class="btn-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/></svg>`,
    reset: `<svg class="btn-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path stroke-linecap="round" stroke-linejoin="round" d="M3 3v5h5"/></svg>`,
    settings: `<svg class="btn-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="3"/><path stroke-linecap="round" stroke-linejoin="round" d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>`,
    default: `<svg class="btn-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path stroke-linecap="round" stroke-linejoin="round" d="M12 8v4l3 3"/></svg>`
  }

  const getIconHtml = (btn) => {
    if (btn.id === 'play' && isPlaying.value) return iconLib[btn.iconPause || 'pause']
    return iconLib[btn.icon] || iconLib['default']
  }

  // ================= 2. Props 与 Emit 定义 =================
  const props = defineProps({
    title: { type: String, default: '组件' },
    storageKey: { type: String, required: true },
    steps: { type: Array, required: true },

    // 【新增】：业务组件默认的动画速度
    defaultInterval: { type: Number, default: 800 },
    defaultData: { type: String, default: '64, 25, 12, 22, 11' },
    actionButtons: {
      type: Array,
      default: () => [
        { id: 'prev', label: '上一步', icon: 'prev' },
        { id: 'play', label: '自动播放', labelPause: '暂停', icon: 'play', iconPause: 'pause' },
        { id: 'next', label: '下一步', icon: 'next' }
      ]
    }
  })

  const emit = defineEmits(['calculate', 'customAction'])

  // ================= 3. 配置分层与恢复策略核心 =================
  const confirmModal = ref(null)
  const messageToast = ref(null)

  // 策略弹窗状态
  const showResetDialog = ref(false)
  const resetStrategy = ref('algorithm')

  // 【底层全局兜底配置】
  const LAYOUT_BASE_CONFIG = {
    playIntervalMs: 1000, // 全局默认慢速
    defaultData: '1, 2, 3, 4, 5', // 全局无意义数据
    labels: {
      inputLabel: '输入数据：',
      inputPlaceholder: '如: 29,10,14',
      stepLabel: '步骤：',
      actionLabel: '当前动作：',
      resetBtn: '重置',
      settingsBtn: '配置'
    }
  }

  // 💡 生成器：根据策略，决定基本参数的来源
  const generateInitialConfig = (strategy = 'algorithm') => {
    const base = JSON.parse(JSON.stringify(LAYOUT_BASE_CONFIG))
    return {
      ...base,
      // 基本参数根据策略分配
      defaultData: strategy === 'algorithm' ? props.defaultData : base.defaultData,
      playIntervalMs: strategy === 'algorithm' ? props.defaultInterval : base.playIntervalMs,
      // 按钮配置：无视策略，永远锁定为调用方的最佳排列
      actionButtons: JSON.parse(JSON.stringify(props.actionButtons))
    }
  }

  const config = reactive(generateInitialConfig('algorithm'))
  const tempConfig = reactive(generateInitialConfig('algorithm'))
  const isConfigOpen = ref(false)
  const vFocus = { mounted: (el) => el.focus() }

  const inputRaw = ref(config.defaultData)
  const currentStepIndex = ref(0)
  const isPlaying = ref(false)
  let playTimer = null

  const currentStep = computed(() => {
    return props.steps[currentStepIndex.value] || { description: '等待输入...' }
  })

  // ================= 4. 动作分发中心 =================
  const handleAction = (btn) => {
    switch (btn.id) {
      case 'prev': prevStep(); break;
      case 'next': nextStep(); break;
      case 'play': togglePlay(); break;
      case 'skip': skipPass(); break;
      default: emit('customAction', btn.id); break;
    }
  }

  const isBtnDisabled = (btnId) => {
    if (isPlaying.value && btnId !== 'play') return true
    if (btnId === 'prev' && currentStepIndex.value === 0) return true
    if (btnId === 'next' && currentStepIndex.value === props.steps.length - 1) return true
    if (btnId === 'skip' && currentStepIndex.value === props.steps.length - 1) return true
    return false
  }

  const getBtnClass = (btnId) => {
    if (btnId === 'play') return 'play-btn'
    return ''
  }

  // ================= 5. 生命周期与配置管理 =================
  onMounted(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem(props.storageKey)
      if (saved) {
        try {
          const parsedSaved = JSON.parse(saved)
          Object.assign(config, parsedSaved)
          Object.assign(tempConfig, parsedSaved)
        } catch (e) { console.error("加载本地配置失败", e) }
      }
    }
    inputRaw.value = config.defaultData
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
      const isOk = await confirmModal.value.show('检测到有未保存的配置修改，是否保存并应用？\n(点击取消将丢弃修改)')
      if (isOk) saveConfig()
      else {
        Object.assign(tempConfig, JSON.parse(JSON.stringify(config)))
        isConfigOpen.value = false
      }
    } else {
      isConfigOpen.value = false
    }
  }

  const saveConfig = () => {
    Object.assign(config, JSON.parse(JSON.stringify(tempConfig)))
    if (typeof window !== 'undefined') localStorage.setItem(props.storageKey, JSON.stringify(config))
    inputRaw.value = config.defaultData
    isConfigOpen.value = false
    messageToast.value.show('配置保存成功！', 'success')
    reset()
  }

  // 打开重置确认面板
  const openResetDialog = () => {
    resetStrategy.value = 'algorithm' // 每次打开默认选中算法最优
    showResetDialog.value = true
  }

  // 💡 执行分层重置逻辑
  const executeReset = () => {
    const newState = generateInitialConfig(resetStrategy.value)
    Object.assign(tempConfig, newState)
    Object.assign(config, newState)

    // 覆盖 localStorage 状态
    if (typeof window !== 'undefined') localStorage.setItem(props.storageKey, JSON.stringify(config))

    inputRaw.value = config.defaultData
    showResetDialog.value = false
    isConfigOpen.value = false
    messageToast.value.show('已按策略恢复出厂配置', 'info')
    reset()
  }

  const onMainArrayChange = () => {
    config.defaultData = inputRaw.value
    Object.assign(tempConfig, JSON.parse(JSON.stringify(config)))
    if (typeof window !== 'undefined') localStorage.setItem(props.storageKey, JSON.stringify(config))
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

  /* =======================================
     以下样式负责页面整体布局
  ========================================== */
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
    display: inline-flex;
    align-items: center;
    gap: 4px;
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

  /* =======================================
     🎨 极简风格按钮体系 (自适应双主题)
  ========================================== */
  .action-controls {
    display: flex;
    justify-content: center;
    gap: 12px;
    flex-wrap: wrap;
    margin-top: 10px;
  }

  /* 基础控制按钮 (线框/幽灵按钮) */
  .control-btn {
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 8px 18px;
    border-radius: 8px;
    border: 1px solid var(--vp-c-border);
    background-color: transparent;
    color: var(--vp-c-text-2);
    font-size: 13px;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.2s ease;
  }

  /* Hover 与选中状态 */
  .control-btn:hover:not(:disabled) {
    border-color: var(--vp-c-text-2);
    color: var(--vp-c-text-1);
    background-color: var(--vp-c-bg-soft);
  }

  .control-btn:disabled {
    opacity: 0.3;
    cursor: not-allowed;
    background-color: transparent;
  }

  /* 特殊：自动播放按钮 (高对比度主按键) */
  .control-btn.play-btn {
    background-color: var(--vp-c-text-1);
    color: var(--vp-c-bg);
    border-color: var(--vp-c-text-1);
  }

  .control-btn.play-btn:hover:not(:disabled) {
    background-color: var(--vp-c-text-2);
    border-color: var(--vp-c-text-2);
  }

  /* 特殊：播放中变为普通状态 (视觉降噪) */
  .control-btn.is-playing {
    background-color: var(--vp-c-bg-soft);
    color: var(--vp-c-text-1);
    border-color: var(--vp-c-border);
  }

  .control-btn.is-playing:hover:not(:disabled) {
    border-color: var(--vp-c-text-2);
  }

  /* 动态 SVG 容器深度控制 */
  .icon-wrapper {
    display: inline-flex;
    align-items: center;
    justify-content: center;
  }

  :deep(.btn-icon) {
    width: 14px;
    height: 14px;
    margin-bottom: 1px;
  }

  /* =======================================
     弹窗配置面板相关样式
  ========================================== */
  .config-overlay {
    position: fixed;
    inset: 0;
    background: rgba(0, 0, 0, 0.6);
    backdrop-filter: blur(4px);
    z-index: 9990;
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
    display: flex;
    align-items: center;
    gap: 8px;
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
    background: var(--vp-c-text-1);
    color: var(--vp-c-bg);
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

  /* 简单的淡入淡出动画 */
  .fade-enter-active,
  .fade-leave-active {
    transition: opacity 0.2s ease;
  }

  .fade-enter-from,
  .fade-leave-to {
    opacity: 0;
  }

  /* =======================================
     🆕 新增：专属恢复策略弹窗样式
  ========================================== */
  .reset-modal {
    max-width: 420px;
  }

  .reset-desc {
    margin: 0 0 12px 0;
    color: var(--vp-c-text-2);
    font-size: 14px;
  }

  .reset-warning {
    margin: 16px 0 0 0;
    color: #eab308;
    font-size: 12px;
  }

  .radio-group {
    display: flex;
    flex-direction: column;
    gap: 12px;
  }

  .radio-label {
    display: flex;
    align-items: flex-start;
    gap: 12px;
    padding: 14px;
    border: 1px solid var(--vp-c-border);
    border-radius: 6px;
    cursor: pointer;
    transition: all 0.2s ease;
  }

  .radio-label:hover {
    background-color: var(--vp-c-bg-soft);
    border-color: var(--vp-c-text-2);
  }

  .radio-label input[type="radio"] {
    margin-top: 4px;
    accent-color: var(--vp-c-brand);
  }

  .radio-content {
    display: flex;
    flex-direction: column;
    gap: 4px;
  }

  .radio-content strong {
    display: flex;
    align-items: center;
    gap: 8px;
    color: var(--vp-c-text-1);
    font-size: 14px;
  }

  .radio-content .desc {
    color: var(--vp-c-text-3);
    font-size: 12px;
    line-height: 1.4;
  }

  .primary-badge {
    font-size: 10px;
    background: rgba(59, 130, 246, 0.15);
    color: #3b82f6;
    padding: 2px 6px;
    border-radius: 4px;
    font-weight: bold;
  }
</style>