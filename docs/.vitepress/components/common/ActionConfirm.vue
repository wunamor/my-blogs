<template>
  <Teleport to="body">
    <Transition name="fade">
      <div
        class="confirm-overlay"
        v-if="visible"
      >
        <div class="confirm-box">
          <div class="confirm-header">
            <h3>{{ title }}</h3>
            <button
              class="close-btn"
              @click="cancel"
            >×</button>
          </div>
          <div class="confirm-body">
            <p style="white-space: pre-wrap;">{{ message }}</p>
          </div>
          <div class="confirm-actions">
            <button
              class="secondary-btn"
              @click="cancel"
            >取消</button>
            <button
              :class="type === 'danger' ? 'danger-btn' : 'primary-btn'"
              @click="confirm"
            >
              确定
            </button>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup>
  import { ref } from 'vue'

  const visible = ref(false)
  const title = ref('提示')
  const message = ref('')
  const type = ref('primary') // 'primary' | 'danger'
  let resolvePromise = null

  // 核心魔法：将显示弹窗封装成一个 Promise
  const show = (msg, options = {}) => {
    message.value = msg
    title.value = options.title || '提示'
    type.value = options.type || 'primary'
    visible.value = true

    return new Promise((resolve) => {
      resolvePromise = resolve
    })
  }

  const confirm = () => {
    visible.value = false
    if (resolvePromise) resolvePromise(true)
  }

  const cancel = () => {
    visible.value = false
    if (resolvePromise) resolvePromise(false)
  }

  // 暴露 show 方法给父组件
  defineExpose({ show })
</script>

<style scoped>
  .confirm-overlay {
    position: fixed;
    inset: 0;
    background: rgba(0, 0, 0, 0.6);
    backdrop-filter: blur(4px);
    z-index: 9999;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .confirm-box {
    background: var(--vp-c-bg);
    border: 1px solid var(--vp-c-border);
    padding: 24px;
    border-radius: 8px;
    width: 90%;
    max-width: 400px;
    box-shadow: 0 10px 30px rgba(0, 0, 0, 0.5);
  }

  .confirm-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 16px;
  }

  .confirm-header h3 {
    margin: 0;
    font-size: 16px;
    color: var(--vp-c-text-1);
  }

  .close-btn {
    background: transparent;
    border: none;
    font-size: 20px;
    color: var(--vp-c-text-2);
    cursor: pointer;
    line-height: 1;
    padding: 0;
  }

  .close-btn:hover {
    color: #ef4444;
  }

  .confirm-body p {
    margin: 0;
    font-size: 14px;
    color: var(--vp-c-text-2);
    line-height: 1.5;
  }

  .confirm-actions {
    display: flex;
    justify-content: flex-end;
    gap: 12px;
    margin-top: 24px;
  }

  .confirm-actions button {
    padding: 6px 16px;
    border-radius: 4px;
    cursor: pointer;
    border: 1px solid var(--vp-c-border);
    font-size: 13px;
  }

  .secondary-btn {
    background: var(--vp-c-bg-elv);
    color: var(--vp-c-text-1);
  }

  .secondary-btn:hover {
    background: var(--vp-c-bg-soft);
  }

  .primary-btn {
    background: var(--vp-c-brand);
    color: white;
    border: none;
  }

  .primary-btn:hover {
    background: var(--vp-c-brand-dark);
  }

  .danger-btn {
    background: #ef4444;
    color: white;
    border: none;
  }

  .danger-btn:hover {
    background: #dc2626;
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
</style>