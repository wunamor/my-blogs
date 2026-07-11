<template>
  <div class="article-metadata">
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
      本文字数: {{ frontmatter.wordCount || 0 }} 字
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
      预计阅读: {{ frontmatter.readTime || 0 }} 分钟
    </span>

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
  import { computed } from 'vue'
  import { useData } from 'vitepress'

  // 💡 确保这里成功解构出了 frontmatter
  const { page, frontmatter } = useData()

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