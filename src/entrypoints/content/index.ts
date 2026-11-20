import { Picker } from '@/lib/picker';
import { HighlightOverlay } from '@/lib/highlight';
import { TOGGLE_PICKER, type ContentMessage } from '@/lib/messages';

export default defineContentScript({
  matches: ['*://*/*'],
  runAt: 'document_idle',
  main(ctx) {
    const highlight = new HighlightOverlay();

    const picker = new Picker({
      onHover: (element) => {
        if (element) highlight.show(element);
        else highlight.hide();
      },
      onPick: (element) => {
        highlight.show(element);
        console.log('[css-snap] picked:', element);
      },
      onActiveChange: (active) => {
        if (!active) highlight.hide();
      },
    });

    browser.runtime.onMessage.addListener((message: ContentMessage) => {
      if (message?.type !== TOGGLE_PICKER) return;
      picker.toggle();
      return { ok: true, active: picker.isActive };
    });

    ctx.onInvalidated(() => {
      picker.stop();
      highlight.destroy();
    });
  },
});
