import { defineConfig } from 'wxt';

export default defineConfig({
  srcDir: 'src',
  modules: ['@wxt-dev/module-react'],
  manifest: {
    name: 'CSS Snap',
    description: '点选网页元素，查看并复制 CSS 样式',
    permissions: ['storage', 'clipboardWrite'],
  },
});
