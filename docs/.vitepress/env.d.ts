// docs/.vitepress/env.d.ts

// 1. 告诉 TS：遇到 .vue 文件不要慌，它们都是 Vue 组件
declare module '*.vue' {
  import type { DefineComponent } from 'vue'
  const component: DefineComponent<{}, {}, any>
  export default component
}

// 2. 告诉 TS：遇到 .css 文件直接放行，别报错
// declare module '*.css';

// 3. 告诉 TS：viewerjs 是个合法的库，就算没有类型声明也让它过
// declare module 'viewerjs';