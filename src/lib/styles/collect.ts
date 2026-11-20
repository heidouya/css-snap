import { STYLE_GROUPS, type StyleValueKind } from './groups';

export interface StyleItem {
  prop: string;
  label: string;
  value: string;
  kind?: StyleValueKind;
}

export interface StyleGroupResult {
  id: string;
  title: string;
  items: StyleItem[];
}

/** 像素值最多保留两位小数，避免 123.456789px 这类噪音 */
function formatValue(raw: string): string {
  const value = raw.trim().replace(/\s{2,}/g, ' ');
  if (!value) return '';
  return value.replace(/-?\d+\.\d{2,}px/g, (match) => {
    const rounded = Math.round(Number.parseFloat(match) * 100) / 100;
    return `${rounded}px`;
  });
}

/** 按九组结构采集元素的计算样式 */
export function collectStyles(element: Element): StyleGroupResult[] {
  const view = element.ownerDocument.defaultView;
  if (!view) return [];
  const computed = view.getComputedStyle(element);

  return STYLE_GROUPS.map((group) => {
    const items: StyleItem[] = [];
    for (const meta of group.props) {
      const value = formatValue(computed.getPropertyValue(meta.prop));
      if (!value) continue;
      items.push({
        prop: meta.prop,
        label: meta.label,
        value,
        kind: meta.kind,
      });
    }
    return { id: group.id, title: group.title, items };
  });
}
