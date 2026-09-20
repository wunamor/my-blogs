# 🤖 优选算法可视化组件 (Vue 3) 工程化开发规范

本指南旨在规范所有 LeetCode/牛客/剑指 Offer 算法可视化组件的开发。在编写新的 Vue 3 (Composition API) 可视化组件时，请严格遵守以下架构、目录与视觉标准。

## 一、 目录组织与文件命名 (Directory & Naming)

**核心原则：区分通用组件与业务组件；业务侧以“算法思想”划分目录，以“题库来源”作为命名前缀。绝对不要按平台物理隔离文件。**

*   **工程根目录**: `src/components/`
    *   ├── `common/` (存放全局通用外壳与反馈组件，如 `VisualizerLayout.vue`)
    *   └── `oj/optimal-algorithm/` (存放所有具体的算法题解可视化组件)
*   **按算法分类的子目录 (位于 oj/optimal-algorithm/ 下)**:
    *   `/sliding-window/` (滑动窗口 / 双指针)
    *   `/binary-search/` (二分查找)
    *   `/prefix-sum/` (前缀和)
*   **文件命名规范**: `[平台缩写][题号][大驼峰英文名].vue`
    *   `LC` = LeetCode (例: `LC30FindSubstring.vue`)
    *   `NC` = 牛客 Nowcoder (例: `NCDP32PrefixSum.vue`)
    *   `LCR` = 剑指 Offer (例: `LCR122TakeAttendance.vue`)
*   **笔记引入规范**: 每次新生成业务组件后，须在对应算法笔记（如 `04-前缀和.md`）的相应题目小节中自动插入组件标签 `<组件文件名去掉 .vue />`（独占一行，前后留空行）。插入位置：小节标题/思路解析之后、Java 代码块之前。除该行外，严禁改动笔记原有正文。

## 二、 核心架构：状态快照驱动 (Snapshot-Driven Architecture)

组件必须遵循“**完全预计算 + 纯数据视图渲染**”的设计模式，严禁在 `<template>` 中编写复杂的演算逻辑。

1.  **统一外壳**: 必须引入并使用 `@components/common/visualization/VisualizerLayout.vue` 作为根节点包裹，以复用全局的播放、快进、全屏和状态流转功能。
2.  **核心计算 (`calculateSteps`)**: 
    *   原汁原味复刻 Java/C++ 的最优算法逻辑。
    *   在关键判定、循环、指针移动处，调用 `pushState` 将当前所有相关的变量（数组深拷贝、指针位置、状态枚举）推入 `steps` 数组。
3.  **视图层 (`#visualization`)**: 仅负责根据 `step`（即 `steps[currentStepIndex]`）的数据进行被动渲染。

## 三、 UI 布局与紧凑模式 (Compact Mode & Layout)

为了在不出现横/纵向滚动条的前提下容纳长测试用例，所有一维数组的渲染必须采用**紧凑模式**：

1.  **物理尺寸强制约定**:
    *   外层轨道 `.array-track` : `gap: 8px`
    *   数组节点容器 `.array-item-group` : `width: 28px`
    *   数组方块 `.array-box-minimal` : `height: 36px; font-size: 14px`
    *   **步长 (STRIDE)** 常量 : `28 + 8 = 36px` (用于所有绝对定位的线框计算)
2.  **防撑破设计**:
    *   绝对禁止换行 (`flex-wrap: nowrap`)。
    *   数组外层必须隐藏 Y 轴滚动条并预留底部高度：
        ```css
        .array-wrapper { overflow-y: hidden; padding: 30px 20px 60px 20px; }
        .pointer-track { min-height: 55px; } /* 容纳堆叠的 L, M, R 指针 */
        ```
3.  **极致简约面板**: 
    顶部 `.dashboard-minimal` 中最多保留 1~2 个 `.stat-box`，仅展示“目标值”或“核心判定公式”，剔除一切影响视线的多余文字解释。

## 四、 核心视觉范式 (Visual Paradigms)

不再使用动态修改坐标的方式平滑移动绝对定位指针，而是利用 **“动态折叠线框 (Dynamic Window Frame)”** 来展现区间的收缩与滑动。

### 1. 动态包裹线框 (`.window-frame-minimal`)
用于包裹滑动窗口的 `[left, right)` 或二分查找的有效区间 `[left, right]`。必须在 `<script setup>` 中使用以下标准逻辑计算位置：
```javascript
const getWindowStyle = (step) => {
  // 拦截异常状态隐藏线框
  if (step.leftIdx > step.rightIdx || step.leftIdx === -1 || step.status.startsWith('check-')) {
    return { width: '0px', opacity: 0 }
  }
  const STRIDE = 36; 
  const PADDING = 4;
  const leftPos = step.leftIdx * STRIDE - PADDING;
  const count = step.rightIdx - step.leftIdx + 1;
  const width = count * STRIDE - 8 + (PADDING * 2);
  
  return { left: `${leftPos}px`, width: `${width}px`, opacity: 1 }
}
```

### 2. 视野褪色降噪 (Fade-out)

二分查找或前缀和中，被排除在主判定区间之外的元素，必须附加 `.is-discarded` 样式，产生视觉后退效果：

```css
.is-discarded { opacity: 0.2; transform: scale(0.9); }

```

## 五、 CSS 状态语义字典 (State Classes)

统一使用以下类名来表达算法执行的中间状态：

* `.is-anchor` : 锚点元素/比较基准（如 LC153 中的 `nums[0]`，橙色高亮）。
* `.is-checking` : 进入主逻辑前，正在进行边界条件排查的元素（紫色跳动）。
* `.is-mid` : 二分查找中当前被选为中点的元素（紫色边框及发光阴影，轻微上浮）。
* `.is-mismatch` : 不满足条件、判定失败、错位警示（红色背景与边框）。
* `.is-match` : 找到目标、极值或完成最终结果锁定（绿色放大，发光阴影）。
* `.ptr-left` / `.ptr-right` / `.ptr-mid` : 底部指针徽章的固定底色类。
