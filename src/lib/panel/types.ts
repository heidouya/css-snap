import type { ElementInfo } from '@/lib/element-info';
import type { StyleGroupResult } from '@/lib/styles/collect';

export interface PanelRect {
  left: number;
  top: number;
  width: number;
  height: number;
  right: number;
  bottom: number;
}

/** 选中集里的一条记录，序号与页面上的描边徽标一一对应 */
export interface SelectionEntry {
  index: number;
  info: ElementInfo;
  groups: StyleGroupResult[];
  minimal: StyleGroupResult[];
  selector: string;
  element: Element;
}

/** 面板渲染所需的全部数据 */
export interface PanelData {
  entries: SelectionEntry[];
  activeIndex: number;
}

export function activeEntry(data: PanelData): SelectionEntry | undefined {
  return data.entries[data.activeIndex] ?? data.entries[0];
}
