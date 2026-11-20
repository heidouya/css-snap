import type { SelectionEntry } from '@/lib/panel/types';
import { groupsToRule } from '@/lib/styles/serialize';
import type { Snapshot, SnapshotItem } from './types';

export function createSnapshotId(): string {
  const random = Math.random().toString(36).slice(2, 8);
  return `${Date.now().toString(36)}-${random}`;
}

/** 把当前选中集转成可持久化的快照，元素引用不落库 */
export function buildSnapshot(entries: SelectionEntry[]): Snapshot {
  return {
    id: createSnapshotId(),
    createdAt: Date.now(),
    pageUrl: location.href,
    pageTitle: document.title,
    items: entries.map(toItem),
  };
}

function toItem(entry: SelectionEntry): SnapshotItem {
  const styles: Record<string, string> = {};
  for (const group of entry.groups) {
    for (const item of group.items) styles[item.prop] = item.value;
  }

  return {
    index: entry.index,
    label: entry.info.label,
    selector: entry.selector,
    text: entry.info.text,
    width: entry.info.width,
    height: entry.info.height,
    rule: groupsToRule(entry.selector, entry.minimal),
    styles,
  };
}
