import DefaultTheme from 'vitepress/theme';
import { onMounted, watch, nextTick } from 'vue';
import { useRoute } from 'vitepress';
import mediumZoom from 'medium-zoom';

import './style.css';

export default {
  extends: DefaultTheme,
  setup() {
    const route = useRoute();
    
    // 初始化放大镜功能的函数
    const initZoom = () => {
      // 选中文章内容区域的所有图片
      mediumZoom('.vp-doc img', {
        background: 'var(--vp-c-bg)' // 完美适配 VitePress 的深浅模式背景色
      });
    };

    // 首次挂载时初始化
    onMounted(() => {
      initZoom();
    });

    // 监听路由变化，确保点击左侧菜单切换文章后，新页面的图片也能被绑定放大功能
    watch(
      () => route.path,
      () => nextTick(() => initZoom())
    );
  }
};