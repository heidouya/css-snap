export interface ElementInfo {
  tag: string;
  id: string;
  classes: string[];
  text: string;
  width: number;
  height: number;
  /** 面板标题用的简短描述，例如 div.card */
  label: string;
}

export function describeElement(element: Element): ElementInfo {
  const tag = element.tagName.toLowerCase();
  const id = element.id;
  const classes = Array.from(element.classList);

  const rect = element.getBoundingClientRect();
  const text = (element.textContent ?? '').trim().replace(/\s+/g, ' ').slice(0, 40);

  return {
    tag,
    id,
    classes,
    text,
    width: Math.round(rect.width),
    height: Math.round(rect.height),
    label: formatLabel(tag, id, classes),
  };
}

function formatLabel(tag: string, id: string, classes: string[]): string {
  const head = id ? `${tag}#${id}` : tag;
  if (!classes.length) return head;
  const visible = classes.slice(0, 2).join('.');
  const more = classes.length > 2 ? '…' : '';
  return `${head}.${visible}${more}`;
}
