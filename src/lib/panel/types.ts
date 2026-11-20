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

/** 面板渲染所需的全部数据 */
export interface PanelData {
  info: ElementInfo;
  groups: StyleGroupResult[];
  minimal: StyleGroupResult[];
  /** 被选中的元素，面板据此跟随滚动重新定位 */
  element: Element;
}
