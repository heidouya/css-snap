import { Picker } from '@/lib/picker';
import { HighlightOverlay } from '@/lib/highlight';
import { PanelHost } from '@/lib/panel/panel-host';
import { collectStyles } from '@/lib/styles/collect';
import { collectMinimalStyles } from '@/lib/styles/minimal';
import { describeElement } from '@/lib/element-info';
import { buildSelector } from '@/lib/element-selector';
import { TOGGLE_PICKER, type ContentMessage } from '@/lib/messages';

export default defineContentScript({
  matches: ['*://*/*'],
  runAt: 'document_idle',
  main(ctx) {
    const highlight = new HighlightOverlay();
    const panel = new PanelHost();

    const picker = new Picker({
      onHover: (element) => {
        if (element) highlight.show(element);
        else highlight.hide();
      },
      onPick: (element) => {
        highlight.show(element);
        panel.open({
          info: describeElement(element),
          groups: collectStyles(element),
          minimal: collectMinimalStyles(element),
          selector: buildSelector(element),
          element,
        });
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
      panel.close();
      highlight.destroy();
    });
  },
});
