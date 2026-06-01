import DefaultTheme from 'vitepress/theme';
import { onMounted, watch, nextTick } from 'vue';
import { useRoute } from 'vitepress';

// 引入 Viewer.js 及其核心 CSS 样式
import Viewer from 'viewerjs';
import 'viewerjs/dist/viewer.css'; 
import './style.css'; 

export default {
  extends: DefaultTheme,
  setup() {
    const route = useRoute();
    let viewer: Viewer | null = null; // 用于存储当前页面的看图实例

    const initViewer = () => {
      // 1. 如果之前有实例，先销毁，防止切换页面时内存泄漏或重复绑定
      if (viewer) {
        viewer.destroy();
      }
      
      // 2. 选中文章的正文区域
      const content = document.querySelector('.vp-doc');
      if (content) {
        // 3. 将该区域内的所有图片绑定为相册
        viewer = new Viewer(content as HTMLElement, {
          inline: false,       // 弹窗模式
          button: true,        // 显示右上角关闭按钮
          navbar: false,       // 隐藏底部那一排缩略图（让界面更清爽）
          title: false,        // 隐藏图片标题
          toolbar: true,       // 显示底部工具栏（放大、缩小、旋转等）
          tooltip: false,      // 缩放时不显示百分比提示
          movable: true,       // 【核心】允许鼠标拖拽平移
          // 默认值是 0.1（即每次滚动缩放 10%）。
          // 你可以改成 0.3（30%）、0.5（50%），数值越大，轻轻一滚放得越大。
          zoomRatio: 0.3,
          zoomable: true,      // 【核心】允许滚轮缩放
          rotatable: false,    // 禁用旋转（看代码通常不需要旋转）
          scalable: false,     // 禁用翻转
          transition: true,    // 开启平滑过渡动画
          fullscreen: false,   // 禁用按 F11 网页全屏的功能
          keyboard: true,      // 允许使用键盘方向键切换上下张图片
          // 背景遮罩的透明度，你可以根据喜好调整（0-1 之间）
          backdrop: true, 
        });
      }
    };

    // 页面首次加载时挂载
    onMounted(() => {
      initViewer();
    });

    // 监听路由变化，确保点击左侧菜单切换文章后，新页面的图片也能绑定
    watch(
      () => route.path,
      () => nextTick(() => initViewer())
    );
  }
};