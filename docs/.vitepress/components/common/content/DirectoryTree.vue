<template>
  <div class="dt-root">
    <div class="dt-toolbar">
      <!-- 第一行：本页筛选，独占一行 -->
      <input
        v-model="query"
        class="dt-search"
        type="search"
        placeholder="本页筛选：标题 / 路径（支持 * 与 ?）"
      />

      <!-- 第二行：左=筛选条件（摘要按钮 + 浮层编辑），右=排序与分页 -->
      <div class="dt-toolbar-row">
        <div class="dt-toolbar-left">
          <span class="dt-label">筛选</span>
          <div ref="filterRoot" class="dt-pop-anchor">
            <button
              class="dt-chip"
              :aria-expanded="String(openPop === 'filter')"
              title="编辑筛选条件"
              @click="togglePop('filter')"
            >
              {{ filterSummary }}
            </button>

            <div
              v-if="openPop === 'filter'"
              class="dt-pop dt-filter-pop"
              role="dialog"
              aria-label="筛选条件"
            >
              <label class="dt-field">
                类型
                <select v-model="kindFilter" class="dt-select">
                  <option
                    v-for="opt in KIND_OPTIONS"
                    :key="opt.value"
                    :value="opt.value"
                  >
                    {{ opt.label }}
                  </option>
                </select>
              </label>

              <div class="dt-field">
                子目录范围
                <button
                  class="dt-chip dt-toggle-dir"
                  :class="{ 'is-active': recursive }"
                  :title="recursive ? '点击改为只看当前层' : '点击改为包含所有子目录'"
                  @click="recursive = !recursive"
                >
                  {{ recursive ? '含子目录' : '仅本层' }}
                </button>
              </div>
            </div>
          </div>
        </div>

        <div class="dt-toolbar-right">
          <span class="dt-label">排序</span>
          <!-- 多级排序：弹出浮层里「左=已参与(可拖动排序) / 右=未参与(点击加入)」 -->
          <div ref="sortRoot" class="dt-pop-anchor">
            <button
              class="dt-chip"
              :aria-expanded="String(openPop === 'sort')"
              title="设置多级排序"
              @click="togglePop('sort')"
            >
              {{ sortSummary }}
            </button>

            <div
              v-if="openPop === 'sort'"
              class="dt-pop dt-sort-pop"
              role="dialog"
              aria-label="排序设置"
            >
              <div class="dt-sort-col">
                <div class="dt-sort-col-title">已参与排序（拖动调整优先级）</div>
                <div
                  v-for="(level, i) in sortLevels"
                  :key="level.key"
                  class="dt-sort-item"
                  :class="{
                    'is-dragging': dragIndex === i,
                    'is-drop-target': dragOverIndex === i && dragIndex !== i,
                  }"
                  draggable="true"
                  @dragstart="onDragStart(i, $event)"
                  @dragover.prevent="onDragOver(i)"
                  @drop.prevent="onDrop(i)"
                  @dragend="onDragEnd"
                >
                  <span class="dt-drag" aria-hidden="true">⠿</span>
                  <span class="dt-sort-name">{{ fieldLabel(level.key) }}</span>
                  <button
                    class="dt-chip dt-chip-mini"
                    :title="level.dir === 'asc' ? '点击改为降序' : '点击改为升序'"
                    @click="toggleSortDir(i)"
                  >
                    {{ level.dir === 'asc' ? '↑ 升序' : '↓ 降序' }}
                  </button>
                  <button
                    class="dt-chip dt-chip-mini"
                    title="上移一级优先级"
                    :disabled="i === 0"
                    @click="moveSortLevel(i, -1)"
                  >
                    ↑
                  </button>
                  <button
                    class="dt-chip dt-chip-mini"
                    title="下移一级优先级"
                    :disabled="i === sortLevels.length - 1"
                    @click="moveSortLevel(i, 1)"
                  >
                    ↓
                  </button>
                  <button
                    v-if="sortLevels.length > 1"
                    class="dt-chip dt-chip-mini"
                    title="移除这一级排序"
                    @click="removeSortLevel(i)"
                  >
                    ×
                  </button>
                </div>
              </div>

              <div class="dt-sort-col">
                <div class="dt-sort-col-title">未参与排序（点击加入）</div>
                <button
                  v-for="f in unusedFields"
                  :key="f.value"
                  class="dt-chip dt-add-field"
                  @click="addSortLevel(f.value)"
                >
                  ＋ {{ f.label }}
                </button>
                <div v-if="!unusedFields.length" class="dt-sort-empty">
                  已全部参与排序
                </div>
              </div>
            </div>
          </div>

          <label class="dt-field">
            每页
            <input
              v-model.number="pageSizeInput"
              class="dt-select dt-page-input"
              type="number"
              min="1"
              step="1"
              placeholder="全部"
            />
          </label>
        </div>
      </div>
    </div>

    <div class="dt-summary">
      共 <b>{{ rows.length }}</b> 项 ｜ 文件夹 <b>{{ dirCount }}</b> 个 ｜ 笔记
      <b>{{ noteCount }}</b> 篇<span v-if="totalPages > 1">
        ｜ 第 <b>{{ page }}</b> / {{ totalPages }} 页</span
      >
    </div>

    <div class="dt-table-wrap">
      <table class="dt-table">
        <colgroup>
          <col class="dt-col-name" />
          <col v-if="showPath" class="dt-col-path" />
          <col class="dt-col-pages" />
          <col class="dt-col-words" />
        </colgroup>
        <thead>
          <tr>
            <th>名称</th>
            <th v-if="showPath" class="dt-col-path">归属</th>
            <th class="dt-col-num">篇数</th>
            <th class="dt-col-num">字数</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="item in pagedRows" :key="item.url">
            <td class="dt-cell-name">
              <a class="dt-link" :href="hrefOf(item)" :title="item.title">
                <span class="dt-icon">{{ item.isDir ? '📁' : '📄' }}</span>
                <span>{{ item.title }}</span>
              </a>
            </td>
            <td
              v-if="showPath"
              class="dt-col-path dt-path"
              data-label="归属"
              :title="breadcrumbOf(item)"
            >
              {{ breadcrumbOf(item) }}
            </td>
            <td class="dt-col-num dt-num" data-label="篇数">
              {{ item.isDir ? item.noteCount : '—' }}
            </td>
            <td class="dt-col-num dt-num" data-label="字数">
              {{ item.wordCount.toLocaleString() }}
            </td>
          </tr>
          <tr v-if="!pagedRows.length">
            <td class="dt-empty" :colspan="showPath ? 4 : 3">没有匹配的条目</td>
          </tr>
        </tbody>
      </table>
    </div>

    <div v-if="totalPages > 1" class="dt-pager">
      <button class="dt-page-btn" :disabled="page <= 1" @click="page = 1">«</button>
      <button class="dt-page-btn" :disabled="page <= 1" @click="page--">
        上一页
      </button>
      <span class="dt-page-info">{{ page }} / {{ totalPages }}</span>
      <button
        class="dt-page-btn"
        :disabled="page >= totalPages"
        @click="page++"
      >
        下一页
      </button>
      <button
        class="dt-page-btn"
        :disabled="page >= totalPages"
        @click="page = totalPages"
      >
        »
      </button>
      <label class="dt-field dt-jump">
        跳至
        <input
          v-model="jumpInput"
          class="dt-select dt-page-input"
          type="number"
          min="1"
          :max="totalPages"
          step="1"
          :placeholder="String(page)"
          @keyup.enter="jumpToPage"
          @blur="jumpToPage"
        />
        页
      </label>
    </div>
  </div>
</template>

<script setup>
  import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
  import { useData } from 'vitepress'
  // ⚠️ 必须带 .data.mts 扩展名：VitePress 用 /\.data\.m?(j|t)s$/ 匹配后注入虚拟模块；
  // 且必须用 .mts（package.json 无 "type":"module"，否则会被 esbuild 当 CJS 打包而报错）
  import { data } from '../../../theme/tree.data.mts'

  const { page: pageData } = useData()

  const KIND_OPTIONS = [
    { value: 'all', label: '全部条目' },
    { value: 'dir', label: '仅文件夹' },
    { value: 'note', label: '仅笔记' },
  ]

  // 可排序字段：想再加一级排序，往这里加一项即可（工具条与比较器都会自动跟上）
  const SORT_FIELDS = [
    { value: 'name', label: '名称' },
    { value: 'wordCount', label: '字数' },
  ]
  const SORT_KEYS = SORT_FIELDS.map((f) => f.value)

  const STORAGE_KEY = 'mynotes:dir-tree'
  // 结构化版本的本地偏好：见文末 watch/onMounted 的读写对，改结构务必两处同步
  const STORAGE_VERSION = 1
  const KIND_VALUES = KIND_OPTIONS.map((o) => o.value)
  // 多级排序：数组顺序即优先级；字段与方向解耦，级数上限 = 可排序字段数
  const DEFAULT_SORT_LEVELS = [{ key: 'name', dir: 'asc' }]

  // 当前导读页所属目录前缀（如 /01-计算机与IT技术/01-比特就业课/）
  const base = computed(
    () => '/' + pageData.value.relativePath.replace(/index\.md$/, ''),
  )

  // 相对当前导读页的路径（目录条目结尾的 / 去掉），如 「02-Java数据结构/01-数据结构初阶」
  const relOf = (item) => item.url.slice(base.value.length).replace(/\/$/, '')

  const descendants = computed(() =>
    (data || []).filter((it) => it.url.startsWith(base.value) && it.url !== base.value),
  )

  const query = ref('')
  const kindFilter = ref('all')
  const recursive = ref(true)
  const sortLevels = ref(DEFAULT_SORT_LEVELS.map((lv) => ({ ...lv })))
  const pageSizeInput = ref(20)
  const page = ref(1)
  const jumpInput = ref('')
  const hydrated = ref(false)

  // 浮层开合状态（筛选 / 排序共用一个，天然互斥；不持久化 → SSR 与首帧恒为关闭）
  const filterRoot = ref(null)
  const sortRoot = ref(null)
  const openPop = ref(null)
  const dragIndex = ref(-1)
  const dragOverIndex = ref(-1)

  const togglePop = (name) => {
    openPop.value = openPop.value === name ? null : name
  }

  // 递归开关关闭时只看直接子项（相对路径只剩一段）；此时「归属」列恒为 —，直接收起
  const allItems = computed(() =>
    recursive.value
      ? descendants.value
      : descendants.value.filter((it) => !relOf(it).includes('/')),
  )
  const showPath = computed(() => recursive.value)

  // 自定义每页条数：留空 / 0 / 非法值都视为「全部」（0 表示不分页）
  const pageSize = computed(() => {
    const n = Number(pageSizeInput.value)
    return Number.isFinite(n) && n > 0 ? Math.floor(n) : 0
  })

  const fieldLabel = (key) => SORT_FIELDS.find((f) => f.value === key)?.label || key

  // 左侧筛选按钮的摘要：类型 · 范围，如「全部条目 · 含子目录」
  const filterSummary = computed(() => {
    const kind = KIND_OPTIONS.find((o) => o.value === kindFilter.value)?.label
    return `${kind || '全部条目'} · ${recursive.value ? '含子目录' : '仅本层'}`
  })

  // 还没参与排序的字段（右栏）
  const unusedFields = computed(() =>
    SORT_FIELDS.filter((f) => !sortLevels.value.some((lv) => lv.key === f.value)),
  )

  // 触发器上的摘要，如「名称↑ ＞ 字数↓」
  const sortSummary = computed(() =>
    sortLevels.value
      .map((lv) => `${fieldLabel(lv.key)}${lv.dir === 'asc' ? '↑' : '↓'}`)
      .join(' ＞ '),
  )

  const addSortLevel = (key) => {
    if (!SORT_KEYS.includes(key)) return
    if (sortLevels.value.some((lv) => lv.key === key)) return
    sortLevels.value.push({ key, dir: 'asc' })
  }

  const removeSortLevel = (index) => {
    if (sortLevels.value.length > 1) sortLevels.value.splice(index, 1)
  }

  const toggleSortDir = (index) => {
    const level = sortLevels.value[index]
    level.dir = level.dir === 'asc' ? 'desc' : 'asc'
  }

  // 移动端/键盘兜底：拖动之外也能调整优先级
  const moveSortLevel = (index, delta) => {
    const target = index + delta
    const list = sortLevels.value
    if (target < 0 || target >= list.length) return
    const [moved] = list.splice(index, 1)
    list.splice(target, 0, moved)
  }

  // HTML5 拖拽：只记下起点/落点下标，松手时把该级挪到落点位置
  const onDragStart = (index, e) => {
    dragIndex.value = index
    if (e.dataTransfer) {
      e.dataTransfer.effectAllowed = 'move'
      e.dataTransfer.setData('text/plain', String(index)) // Firefox 必须设置才触发拖拽
    }
  }

  const onDragOver = (index) => {
    dragOverIndex.value = index
  }

  const onDrop = (index) => {
    const from = dragIndex.value
    dragIndex.value = -1
    dragOverIndex.value = -1
    if (from < 0 || from === index) return
    const list = sortLevels.value
    const [moved] = list.splice(from, 1)
    list.splice(index, 0, moved)
  }

  const onDragEnd = () => {
    dragIndex.value = -1
    dragOverIndex.value = -1
  }

  const numPrefix = (name) => {
    const m = name.match(/^(\d+)-/)
    return m ? parseInt(m[1], 10) : null
  }

  // 与 auto-index 的排序观感对齐：数字前缀优先 → 文件夹优先 → 中文拼音
  const compareName = (a, b) => {
    const na = numPrefix(a.rawName)
    const nb = numPrefix(b.rawName)
    if (na !== null && nb !== null) return na - nb
    if (na !== null) return -1
    if (nb !== null) return 1
    if (a.isDir !== b.isDir) return a.isDir ? -1 : 1
    return a.rawName.localeCompare(b.rawName, 'zh-CN')
  }

  // 字段比较器：只负责大小，方向由各级自己的 dir 决定
  const FIELD_COMPARATORS = {
    name: compareName,
    wordCount: (a, b) => a.wordCount - b.wordCount,
  }

  // 查询串 → 匹配器：出现 * / ? 时按通配符转正则（其余字符全部转义，不会产生非法正则）
  const escapeRegExp = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

  const wildcardRegExp = (q) => {
    const body = q
      .split(/([?*])/)
      .map((t) => (t === '*' ? '.*' : t === '?' ? '.' : escapeRegExp(t)))
      .join('')
    return new RegExp(body, 'i')
  }

  const rows = computed(() => {
    const q = query.value.trim()
    const ql = q.toLowerCase()
    // 无 g 标志，避免 RegExp.test 的 lastIndex 有状态
    let re = null
    if (q.includes('*') || q.includes('?')) {
      try {
        re = wildcardRegExp(q)
      } catch {
        re = null // 理论上不会发生，兜底回退子串匹配
      }
    }
    const hit = (text) =>
      re ? re.test(text) : text.toLowerCase().includes(ql)

    const filtered = allItems.value.filter((it) => {
      if (kindFilter.value === 'dir' && !it.isDir) return false
      if (kindFilter.value === 'note' && it.isDir) return false
      if (!q) return true
      return hit(it.title) || hit(relOf(it))
    })

    const levels = sortLevels.value.filter((lv) => FIELD_COMPARATORS[lv.key])
    return [...filtered].sort((a, b) => {
      for (const lv of levels) {
        const r = FIELD_COMPARATORS[lv.key](a, b)
        if (r !== 0) return lv.dir === 'asc' ? r : -r
      }
      // 各级都相等：保持稳定顺序（不再隐式按名称兜底，需要就显式加一级）
      return 0
    })
  })

  const dirCount = computed(() => rows.value.filter((it) => it.isDir).length)
  const noteCount = computed(() => rows.value.length - dirCount.value)
  const totalPages = computed(() =>
    pageSize.value === 0 ? 1 : Math.max(1, Math.ceil(rows.value.length / pageSize.value)),
  )

  const pagedRows = computed(() => {
    if (pageSize.value === 0) return rows.value
    const current = Math.min(page.value, totalPages.value)
    const start = (current - 1) * pageSize.value
    return rows.value.slice(start, start + pageSize.value)
  })

  // 「跳至 N 页」：clamp 到合法范围后写回，并清空输入框
  const jumpToPage = () => {
    // 空值直接忽略：回车已跳过页，随后的 blur 不能把页码打回第 1 页
    if (String(jumpInput.value).trim() === '') return
    const raw = Number(jumpInput.value)
    jumpInput.value = ''
    if (!Number.isFinite(raw)) return
    page.value = Math.min(Math.max(1, Math.floor(raw)), totalPages.value)
  }

  // 条件变化导致总页数缩小时，把越界的当前页收回
  watch(totalPages, (n) => {
    if (page.value > n) page.value = n
  })

  // 筛选/排序条件变化时回到第一页（sortLevels 是数组，需 deep 才能追踪增删/改键）
  watch(
    [query, kindFilter, recursive, pageSizeInput, sortLevels],
    () => {
      page.value = 1
    },
    { deep: true },
  )

  const breadcrumbOf = (item) => {
    const parts = relOf(item).split('/')
    parts.pop() // 去掉自身那一段
    return parts.length ? parts.join(' / ') : '—'
  }

  // 目录沿用 markdown 列表的 #dir-title 深链；笔记直接落到页首。
  // 组件根节点不再带 .vp-raw，链接由 VitePress 全局拦截器接管（SPA 跳转 + 锚点定位）。
  const hrefOf = (item) => (item.isDir ? `${item.url}#dir-title` : item.url)

  // 点击浮层外部或按 Esc 关闭浮层；两个浮层共用一套判定。
  // ⚠️ 必须用 composedPath 判「点没点在浮层内」：点「＋ 字段 / ×」会先把该按钮 patch 掉，
  // 等本监听器执行时 e.target 已脱离 DOM，el.contains(e.target) 会误判为「点在外面」而关闭浮层。
  const onDocClick = (e) => {
    if (!openPop.value) return
    const roots = [filterRoot.value, sortRoot.value].filter(Boolean)
    const path = typeof e.composedPath === 'function' ? e.composedPath() : []
    for (const el of roots) {
      if (path.includes(el) || el.contains(e.target)) return
    }
    openPop.value = null
  }

  const onKeydown = (e) => {
    if (e.key === 'Escape') openPop.value = null
  }

  // 本地偏好校验：坏数据 / 旧格式（sortKey+sortDir）一律丢弃，回退默认单级「名称↑」
  const normalizeSortLevels = (saved) => {
    if (!Array.isArray(saved)) return null
    const seen = new Set()
    const levels = []
    for (const lv of saved) {
      if (!lv || !SORT_KEYS.includes(lv.key) || seen.has(lv.key)) continue
      seen.add(lv.key)
      levels.push({ key: lv.key, dir: lv.dir === 'desc' ? 'desc' : 'asc' })
      if (levels.length >= SORT_FIELDS.length) break
    }
    return levels.length ? levels : null
  }

  // SSR 用默认值渲染，挂载后再套用本地偏好，避免 hydration 不一致。
  // 不持久化的临时态：搜索框内容（query）、当前页（page）、浮层开合（openPop）、跳页输入（jumpInput）
  onMounted(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}')
      if (saved.version === STORAGE_VERSION) {
        if (Number.isFinite(saved.pageSize) && saved.pageSize > 0)
          pageSizeInput.value = Math.floor(saved.pageSize)
        if (typeof saved.recursive === 'boolean') recursive.value = saved.recursive
        if (KIND_VALUES.includes(saved.kind)) kindFilter.value = saved.kind
        const levels = normalizeSortLevels(saved.sortLevels)
        if (levels) sortLevels.value = levels
      }
    } catch {
      // 本地数据损坏时静默回退默认值
    }
    hydrated.value = true
    document.addEventListener('click', onDocClick)
    document.addEventListener('keydown', onKeydown)
  })

  onBeforeUnmount(() => {
    document.removeEventListener('click', onDocClick)
    document.removeEventListener('keydown', onKeydown)
  })

  // 全局共用一份偏好（所有导读页同一个 key）；只写「持久化项」，临时态一律不写
  watch(
    [kindFilter, recursive, pageSizeInput, sortLevels],
    () => {
      if (!hydrated.value) return
      try {
        localStorage.setItem(
          STORAGE_KEY,
          JSON.stringify({
            version: STORAGE_VERSION,
            kind: kindFilter.value,
            pageSize: pageSizeInput.value,
            recursive: recursive.value,
            sortLevels: sortLevels.value.map((lv) => ({ key: lv.key, dir: lv.dir })),
          }),
        )
      } catch {
        // 隐私模式等禁用存储的场景直接忽略
      }
    },
    { deep: true },
  )
</script>

<style scoped>
  .dt-root {
    margin: 24px 0;
    color: var(--vp-c-text-1);
  }

  .dt-toolbar {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 8px;
    margin-bottom: 12px;
  }

  /* 第一行：搜索框独占整行 */
  .dt-search {
    flex: 1 1 100%;
    min-width: 0;
    padding: 6px 10px;
    border: 1px solid var(--vp-c-divider);
    border-radius: 6px;
    background-color: var(--vp-c-bg);
    color: var(--vp-c-text-1);
    font-size: 13px;
  }

  /* 第二行：左=筛选条件，右=排序/分页 */
  .dt-toolbar-row {
    display: flex;
    flex: 1 1 100%;
    flex-wrap: wrap;
    align-items: center;
    gap: 8px;
  }

  .dt-toolbar-left,
  .dt-toolbar-right {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 8px;
    min-width: 0;
  }

  .dt-toolbar-right {
    margin-left: auto;
  }

  .dt-label {
    color: var(--vp-c-text-2);
    font-size: 13px;
  }

  /* 「含子目录 / 仅本层」字数不同会让 chip 宽度跳动，进而带着整组重新折行，定宽消除抖动 */
  .dt-toggle-dir {
    min-width: 5.5em;
    text-align: center;
  }

  /* 浮层容器：两个浮层共用锚点 */
  .dt-pop-anchor {
    position: relative;
  }

  /*
   * 浮层宽度必须是 max-content，不能靠 shrink-to-fit：
   * 绝对定位 + 单边定位（left/right 只写一个）时，可用宽度取自包含块，
   * 而包含块（锚点）只有触发按钮那么宽（~120px）→ 文字会被压成逐字竖排。
   * 再配合内部 white-space: nowrap，PC 上就不会再「字过长跳到下一行弄乱 UI」。
   */
  .dt-pop {
    position: absolute;
    z-index: 30;
    top: calc(100% + 6px);
    width: max-content;
    max-width: calc(100vw - 24px);
    padding: 12px;
    border: 1px solid var(--vp-c-divider);
    border-radius: 10px;
    background-color: var(--vp-c-bg);
    box-shadow: 0 8px 24px rgb(0 0 0 / 18%);
  }

  .dt-filter-pop {
    left: 0;
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  .dt-sort-pop {
    right: 0;
    display: flex;
    gap: 16px;
  }

  .dt-pop .dt-field,
  .dt-sort-col-title,
  .dt-sort-name,
  .dt-pop .dt-chip {
    white-space: nowrap;
  }

  .dt-sort-col {
    display: flex;
    flex: 0 0 auto;
    flex-direction: column;
    gap: 6px;
    min-width: 0;
  }

  .dt-sort-col-title {
    color: var(--vp-c-text-3);
    font-size: 12px;
  }

  .dt-sort-item {
    display: flex;
    flex-wrap: nowrap;
    align-items: center;
    gap: 4px;
    padding: 4px 6px;
    border: 1px solid var(--vp-c-divider);
    border-radius: 8px;
    background-color: var(--vp-c-bg-soft);
  }

  .dt-sort-item > .dt-chip {
    flex: 0 0 auto;
  }

  .dt-sort-item.is-dragging {
    opacity: 0.5;
  }

  .dt-sort-item.is-drop-target {
    border-color: var(--vp-c-brand-1);
  }

  .dt-drag {
    color: var(--vp-c-text-3);
    cursor: grab;
    user-select: none;
  }

  .dt-sort-name {
    flex: 1 1 auto;
    color: var(--vp-c-text-1);
    font-size: 13px;
  }

  .dt-sort-empty {
    color: var(--vp-c-text-3);
    font-size: 12px;
  }

  .dt-add-field {
    text-align: left;
  }

  .dt-page-input {
    width: 72px;
  }

  .dt-chip,
  .dt-page-btn {
    padding: 5px 10px;
    border: 1px solid var(--vp-c-divider);
    border-radius: 6px;
    background-color: var(--vp-c-bg-soft);
    color: var(--vp-c-text-2);
    font-size: 13px;
    cursor: pointer;
    transition: color 0.2s, border-color 0.2s, background-color 0.2s;
  }

  .dt-chip:hover,
  .dt-page-btn:not(:disabled):hover {
    border-color: var(--vp-c-brand-1);
    color: var(--vp-c-brand-1);
  }

  .dt-chip.is-active {
    border-color: var(--vp-c-brand-1);
    background-color: var(--vp-c-brand-soft);
    color: var(--vp-c-brand-1);
  }

  .dt-chip-mini {
    padding: 5px 8px;
  }

  .dt-chip:disabled {
    cursor: not-allowed;
    opacity: 0.5;
  }

  .dt-field {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    color: var(--vp-c-text-2);
    font-size: 13px;
  }

  .dt-select {
    padding: 5px 6px;
    border: 1px solid var(--vp-c-divider);
    border-radius: 6px;
    background-color: var(--vp-c-bg-soft);
    color: var(--vp-c-text-1);
    font-size: 13px;
  }

  .dt-summary {
    margin-bottom: 8px;
    color: var(--vp-c-text-2);
    font-size: 13px;
  }

  .dt-table-wrap {
    overflow-x: auto;
    border: 1px solid var(--vp-c-divider);
    border-radius: 8px;
  }

  /*
   * ⚠️ 必须显式覆盖 .vp-doc 自带的表格样式（本版本 .vp-raw 只影响链接拦截、不隔离样式）：
   *   .vp-doc table { display: block; overflow-x: auto } → 表格会被当成块盒收缩成内容宽，右侧留白
   *   .vp-doc tr:nth-child(2n) → 斑马纹；.vp-doc td { font-size: 14px } → 字号
   */
  .dt-table {
    display: table;
    width: 100%;
    margin: 0;
    border-collapse: collapse;
    font-size: 13px;
    table-layout: fixed;
    overflow: visible;
  }

  /* 列宽按比例分配（名称吃掉剩余空间）：表格随容器自适应，不再依赖固定像素宽 */
  .dt-col-path {
    width: 45%;
  }

  .dt-col-pages {
    width: 10%;
  }

  .dt-col-words {
    width: 15%;
  }

  .dt-table tbody tr {
    background-color: transparent;
    border-top: none;
  }

  .dt-table th,
  .dt-table td {
    padding: 8px 12px;
    border: none;
    border-bottom: 1px solid var(--vp-c-divider);
    font-size: 13px;
    overflow: hidden;
    text-align: left;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .dt-table thead th {
    background-color: var(--vp-c-bg-soft);
    color: var(--vp-c-text-2);
    font-weight: 600;
  }

  .dt-table tbody tr:last-child td {
    border-bottom: none;
  }

  .dt-table tbody tr:hover {
    background-color: var(--vp-c-bg-soft);
  }

  .dt-link {
    color: var(--vp-c-brand-1);
    font-weight: 500;
    text-decoration: none;
  }

  .dt-link:hover {
    text-decoration: underline;
  }

  .dt-icon {
    margin-right: 4px;
  }

  .dt-col-path,
  .dt-path {
    color: var(--vp-c-text-2);
  }

  .dt-col-num,
  .dt-num {
    text-align: right;
    white-space: nowrap;
  }

  .dt-empty {
    color: var(--vp-c-text-3);
    text-align: center;
  }

  .dt-pager {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    justify-content: center;
    gap: 8px;
    margin-top: 12px;
  }

  .dt-jump {
    margin-left: 4px;
  }

  .dt-page-btn:disabled {
    cursor: not-allowed;
    opacity: 0.5;
  }

  .dt-page-info {
    color: var(--vp-c-text-2);
    font-size: 13px;
  }

  /* 📱 移动端：表格转卡片式堆叠（隐藏表头，字段竖排并带 data-label 标签） */
  @media (max-width: 640px) {
    /* 左右两组各占一整行；浮层整行铺满 →
       浮层开合/增删不再挤压其它控件，工具条布局稳定 */
    .dt-toolbar-left,
    .dt-toolbar-right {
      flex: 1 1 100%;
      margin-left: 0;
    }

    /* 锚点占满整行，浮层（width:100%）才有正确的包含块宽度 */
    .dt-pop-anchor {
      flex: 1 1 100%;
    }

    .dt-pop {
      position: static;
      flex-direction: column;
      width: 100%;
      max-width: 100%;
      margin-top: 8px;
    }

    /* 移动端允许换行（PC 上是为了防逐字竖排才 nowrap） */
    .dt-pop .dt-field,
    .dt-sort-col-title,
    .dt-sort-name,
    .dt-pop .dt-chip {
      white-space: normal;
    }

    .dt-sort-item {
      flex-wrap: wrap;
    }

    .dt-select {
      min-width: 0;
      max-width: 100%;
    }

    .dt-page-input {
      width: 64px;
    }

    .dt-table-wrap {
      border: none;
      overflow: visible;
    }

    .dt-table,
    .dt-table tbody,
    .dt-table tr,
    .dt-table td {
      display: block;
      width: auto;
    }

    .dt-table thead {
      display: none;
    }

    .dt-table tr {
      margin-bottom: 8px;
      padding: 4px 0;
      border: 1px solid var(--vp-c-divider);
      border-radius: 8px;
    }

    .dt-table td {
      display: flex;
      justify-content: space-between;
      gap: 12px;
      padding: 4px 12px;
      border-bottom: none;
      overflow: visible;
      text-align: left;
      text-overflow: clip;
      white-space: normal;
    }

    .dt-table td[data-label]::before {
      flex: 0 0 auto;
      color: var(--vp-c-text-3);
      content: attr(data-label);
    }

    .dt-cell-name {
      font-size: 14px;
    }

    .dt-table tr:hover {
      background-color: transparent;
    }

    .dt-empty {
      justify-content: center;
    }

    .dt-pager {
      gap: 4px;
    }
  }
</style>
