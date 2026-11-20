/** 快照数据结构，同时被内容脚本与后台使用，不依赖 DOM */

export interface SnapshotItem {
  /** 选中序号，与页面描边一致 */
  index: number;
  label: string;
  selector: string;
  text: string;
  width: number;
  height: number;
  /** 精简后的完整规则文本 */
  rule: string;
  /** 全部样式，属性名 → 值 */
  styles: Record<string, string>;
}

export interface Snapshot {
  id: string;
  createdAt: number;
  pageUrl: string;
  pageTitle: string;
  items: SnapshotItem[];
  note?: string;
}
