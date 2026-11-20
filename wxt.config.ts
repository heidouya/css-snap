import { defineConfig } from 'wxt';

export default defineConfig({
  srcDir: 'src',
  manifestVersion: 3,
  modules: ['@wxt-dev/module-react'],
  manifest: ({ browser }) => ({
    name: 'CSS Snap',
    description: '点选网页元素，查看并复制 CSS 样式',
    permissions: ['storage', 'clipboardWrite'],
    ...(browser === 'firefox'
      ? {
          browser_specific_settings: {
            gecko: {
              id: 'css-snap@local',
              strict_min_version: '115.0',
              data_collection_permissions: {
                required: ['none'],
              },
            },
          },
        }
      : {}),
  }),
});
