import { Picker } from '@/lib/picker';
import { HighlightOverlay } from '@/lib/highlight';
import { SelectionBoxes } from '@/lib/selection-boxes';
import { PanelHost } from '@/lib/panel/panel-host';
import { collectStyles } from '@/lib/styles/collect';
import { collectMinimalStyles } from '@/lib/styles/minimal';
import { describeElement } from '@/lib/element-info';
import { buildSelector } from '@/lib/element-selector';
import { TOGGLE_PICKER, SAVE_SNAPSHOT, type ContentMessage, type SaveResult } from '@/lib/messages';
import { buildSnapshot } from '@/lib/store/build';
import type { SelectionEntry } from '@/lib/panel/types';

export default defineContentScript({
  matches: ['*://*/*'],
  runAt: 'document_idle',
  main(ctx) {
    const highlight = new HighlightOverlay();
    const boxes = new SelectionBoxes();

    let entries: SelectionEntry[] = [];
    let activeIndex = 0;

    const reopen = () => {
      if (entries.length) panel.open({ entries, activeIndex });
    };

    const panel = new PanelHost({
      onSelectEntry: (index) => {
        const entry = entries[index];
        if (!entry) return;
        activeIndex = index;
        highlight.show(entry.element);
        reopen();
      },
      onSave: async () => {
        if (!entries.length) return false;
        try {
          // 存储必须走后台：内容脚本里的 indexedDB 属于页面 origin
          const result = (await browser.runtime.sendMessage({
            type: SAVE_SNAPSHOT,
            snapshot: buildSnapshot(entries),
          })) as SaveResult | undefined;
          return Boolean(result?.ok);
        } catch {
          return false;
        }
      },
    });

    const picker = new Picker({
      onHover: (element) => {
        if (element) highlight.show(element);
        else highlight.hide();
      },
      onPick: (element, options) => {
        highlight.show(element);

        if (options.additive && entries.length) {
          const existing = entries.findIndex((entry) => entry.element === element);
          if (existing >= 0) {
            activeIndex = existing;
          } else {
            entries = [...entries, createEntry(element, entries.length + 1)];
            activeIndex = entries.length - 1;
          }
        } else {
          entries = [createEntry(element, 1)];
          activeIndex = 0;
        }

        boxes.sync(entries.map((entry) => entry.element));
        reopen();
      },
      onActiveChange: (active) => {
        if (!active) {
          highlight.hide();
          boxes.clear();
        }
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
      boxes.clear();
    });
  },
});

function createEntry(element: Element, index: number): SelectionEntry {
  return {
    index,
    info: describeElement(element),
    groups: collectStyles(element),
    minimal: collectMinimalStyles(element),
    selector: buildSelector(element),
    element,
  };
}
