<template>
  <Teleport to="body">
    <Transition name="slide-down">
      <div
        v-if="visible"
        class="message-toast"
        :class="type"
      >
        <span class="icon">{{ iconMap[type] }}</span>
        <span>{{ message }}</span>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup>
  import { ref } from 'vue'

  const visible = ref(false)
  const message = ref('')
  const type = ref('success') // 'success' | 'error' | 'info'
  let timer = null

  const iconMap = {
    success: '✅',
    error: '❌',
    info: 'ℹ️'
  }

  const show = (msg, msgType = 'success', duration = 2500) => {
    message.value = msg
    type.value = msgType
    visible.value = true

    if (timer) clearTimeout(timer)
    timer = setTimeout(() => {
      visible.value = false
    }, duration)
  }

  defineExpose({ show })
</script>

<style scoped>
  .message-toast {
    position: fixed;
    top: 40px;
    left: 50%;
    transform: translateX(-50%);
    padding: 10px 24px;
    border-radius: 30px;
    font-size: 14px;
    font-weight: bold;
    display: flex;
    align-items: center;
    gap: 8px;
    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.15);
    z-index: 10000;
  }

  /* 颜色主题 */
  .success {
    background-color: var(--vp-c-bg-elv);
    border: 1px solid #10b981;
    color: #10b981;
  }

  .error {
    background-color: var(--vp-c-bg-elv);
    border: 1px solid #ef4444;
    color: #ef4444;
  }

  .info {
    background-color: var(--vp-c-bg-elv);
    border: 1px solid var(--vp-c-brand);
    color: var(--vp-c-brand);
  }

  /* 下拉动画 */
  .slide-down-enter-active,
  .slide-down-leave-active {
    transition: all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1);
  }

  .slide-down-enter-from,
  .slide-down-leave-to {
    opacity: 0;
    transform: translate(-50%, -20px);
  }
</style>