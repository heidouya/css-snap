import { Picker } from '@/lib/picker';
import { HighlightOverlay } from '@/lib/highlight';
import { collectStyles } from '@/lib/styles/collect';
import { describeElement } from '@/lib/element-info';
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
        const info = describeElement(element);
        const groups = collectStyles(element);
        console.log('[css-snap] picked', info, groups);
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
