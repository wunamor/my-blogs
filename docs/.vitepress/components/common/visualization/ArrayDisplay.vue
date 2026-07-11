<template>
  <TransitionGroup
    name="swap"
    tag="div"
    class="array-display-inner"
  >
    <div
      v-for="(item, idx) in items"
      :key="item.id"
      class="array-item"
      :class="getHighlightClasses(idx)"
      v-show="item.val !== null || occupySpaceForNull"
    >
      <div
        class="item-value"
        :class="{ 'placeholder-value': item.val === null && !printNull }"
      >
        {{ (item.val === null && !printNull) ? '' : item.val }}
      </div>
      <div class="item-label">
        <span
          v-for="(label, li) in getLabels(idx)"
          :key="li"
        >{{ label }}</span>
      </div>
    </div>
  </TransitionGroup>
</template>

<script setup>
  const props = defineProps({
    items: { type: Array, required: true },
    highlights: { type: Object, default: () => ({}) },
    labels: { type: Object, default: () => ({}) },
    // 新增：默认打印，默认占位
    printNull: { type: Boolean, default: true },
    occupySpaceForNull: { type: Boolean, default: true }
  })

  const getHighlightClasses = (idx) => props.highlights[idx] ? props.highlights[idx].join(' ') : ''
  const getLabels = (idx) => props.labels[idx] || []
</script>