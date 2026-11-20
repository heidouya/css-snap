import { TOGGLE_PICKER, type TogglePickerMessage } from '@/lib/messages';

export default defineBackground(() => {
  browser.action.onClicked.addListener(async (tab) => {
    if (tab.id === undefined) return;
    try {
      await browser.tabs.sendMessage<TogglePickerMessage>(tab.id, { type: TOGGLE_PICKER });
    } catch {
      // 浏览器内部页面等无法注入内容脚本的场景，忽略即可
    }
  });
});
