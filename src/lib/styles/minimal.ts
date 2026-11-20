import { collectStyles, type StyleGroupResult, type StyleItem } from './collect';

/** 探针自身为了隐藏而篡改的属性，比较时按默认值处理，避免误判 */
const PROBE_NEUTRAL: Record<string, string> = {
  visibility: 'visible',
  'pointer-events': 'auto',
};

/**
 * 去掉与"同位置无样式空元素"一致的属性，得到最小片段。
 *
 * 关键点：
 * 1. 基准元素必须与目标元素同 tagName，否则 display 之类的默认值会判错
 *    （div 默认 block，span 默认 inline）。
 * 2. 基准元素挂在同一个父节点下，这样继承来的字体、颜色能对齐，
 *    不会被误判成"用户自己写的"。
 * 3. 必须先采集目标样式再插入探针，否则探针会破坏 :last-child 之类的选择器。
 * 4. 探针只用 visibility:hidden 隐藏，不改成 absolute，否则 width / position
 *    的计算值会失真。整个插入到移除是同一次任务内完成，浏览器不会绘制，页面不闪。
 */
export function collectMinimalStyles(element: Element): StyleGroupResult[] {
  const doc = element.ownerDocument;
  const parent = element.parentElement;

  // 根元素没有父节点，无法建立基准，直接返回全量
  if (!parent) return collectStyles(element);

  const target = collectStyles(element);

  const probe = doc.createElement(element.tagName.toLowerCase()) as HTMLElement;
  probe.setAttribute(
    'style',
    'visibility:hidden!important;pointer-events:none!important;margin:0!important;',
  );

  let baseline: StyleGroupResult[];
  try {
    parent.append(probe);
    baseline = collectStyles(probe);
  } finally {
    probe.remove();
  }

  const baseMap = new Map<string, string>();
  for (const group of baseline) {
    for (const item of group.items) baseMap.set(item.prop, item.value);
  }
  for (const [prop, value] of Object.entries(PROBE_NEUTRAL)) {
    baseMap.set(prop, value);
  }

  return target
    .map((group) => ({
      ...group,
      items: group.items.filter((item: StyleItem) => baseMap.get(item.prop) !== item.value),
    }))
    .filter((group) => group.items.length > 0);
}
