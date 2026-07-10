<template>
  <div class="article-metadata">
    <!-- 字数与阅读时间 -->
    <span class="meta-item">
      <svg
        class="icon"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="2"
        stroke-linecap="round"
        stroke-linejoin="round"
      >
        <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"></path>
        <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"></path>
      </svg>
      本文字数: {{ wordCount }} 字
    </span>
    <span class="divider">|</span>
    <span class="meta-item">
      <svg
        class="icon"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="2"
        stroke-linecap="round"
        stroke-linejoin="round"
      >
        <circle
          cx="12"
          cy="12"
          r="10"
        ></circle>
        <polyline points="12 6 12 12 16 14"></polyline>
      </svg>
      预计阅读: {{ readTime }} 分钟
    </span>

    <!-- 最后更新时间 -->
    <template v-if="lastUpdatedText">
      <span class="divider">|</span>
      <span class="meta-item">
        <svg
          class="icon"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
        >
          <path d="M12 2v20"></path>
          <path d="m17 5-5-3-5 3"></path>
          <path d="m5 19 7 3 7-3"></path>
        </svg>
        最后更新于: {{ lastUpdatedText }}
      </span>
    </template>
  </div>
</template>

<script setup>
  import { ref, onMounted, watch, nextTick, computed } from 'vue'
  import { useData, useRoute } from 'vitepress'

  const { page } = useData()
  const route = useRoute()

  const wordCount = ref(0)
  const readTime = ref(0)

  // 格式化最后更新时间
  const lastUpdatedText = computed(() => {
    if (page.value.lastUpdated) {
      const date = new Date(page.value.lastUpdated)
      return date.toLocaleString('zh-CN', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
      })
    }
    return ''
  })

  // 计算字数与阅读时间的逻辑
  const calculateStats = () => {
    // 选取 VitePress 的正文容器
    const content = document.querySelector('.vp-doc')
    if (content) {
      // 提取纯文本并去除所有空白字符
      const text = content.innerText.replace(/\s+/g, '')
      wordCount.value = text.length
      // 按照普通人每分钟阅读 300 字左右计算
      readTime.value = Math.ceil(wordCount.value / 300)
    }
  }

  onMounted(() => {
    calculateStats()
  })

  // 监听路由变化，确保点击左侧菜单切换文章后，重新计算字数
  watch(
    () => route.path,
    () => nextTick(() => {
      calculateStats()
    })
  )
</script>

<style scoped>
  .article-metadata {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 8px;
    margin-bottom: 24px;
    padding-bottom: 16px;
    border-bottom: 1px solid var(--vp-c-divider);
    color: var(--vp-c-text-2);
    font-size: 14px;
  }

  .meta-item {
    display: flex;
    align-items: center;
    gap: 4px;
  }

  .icon {
    width: 16px;
    height: 16px;
    opacity: 0.8;
  }

  .divider {
    color: var(--vp-c-divider);
  }
</style>