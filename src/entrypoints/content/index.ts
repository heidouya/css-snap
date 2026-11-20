import { Picker } from '@/lib/picker';
import { TOGGLE_PICKER, type ContentMessage } from '@/lib/messages';

export default defineContentScript({
  matches: ['*://*/*'],
  runAt: 'document_idle',
  main(ctx) {
    const picker = new Picker({
      onHover: () => {},
      onPick: (element) => {
        console.log('[css-snap] picked:', element);
      },
      onActiveChange: (active) => {
        console.log('[css-snap] picking:', active);
      },
    });

    browser.runtime.onMessage.addListener((message: ContentMessage) => {
      if (message?.type !== TOGGLE_PICKER) return;
      picker.toggle();
      return { ok: true, active: picker.isActive };
    });

    ctx.onInvalidated(() => picker.stop());
  },
});
