const IDENT = /^[A-Za-z_][\w-]*$/;

/**
 * 生成可读的选择器：优先用唯一的 id，其次用 tag + class，
 * 不唯一时逐级上溯到父节点，最多三层；同标签多兄弟时补 :nth-of-type。
 */
export function buildSelector(element: Element): string {
  const id = element.id;
  if (id && IDENT.test(id)) {
    const byId = `#${id}`;
    if (isUnique(byId)) return byId;
  }

  const parts = [selectorForElement(element)];
  let current: Element = element;

  for (let guard = 0; guard < 3; guard += 1) {
    if (isUnique(parts.join(' > '))) break;
    const parent = current.parentElement;
    if (!parent || parent === document.body || parent === document.documentElement) break;
    parts.unshift(selectorForElement(parent));
    current = parent;
  }

  return parts.join(' > ');
}

function selectorForElement(element: Element): string {
  const tag = element.tagName.toLowerCase();
  const classes = Array.from(element.classList).filter((name) => IDENT.test(name));
  const base = classes.length
    ? `${tag}${classes
        .slice(0, 2)
        .map((name) => `.${name}`)
        .join('')}`
    : tag;

  const parent = element.parentElement;
  if (!parent) return base;

  const siblings = Array.from(parent.children).filter((child) => child.tagName === element.tagName);
  if (siblings.length <= 1) return base;

  const index = siblings.indexOf(element) + 1;
  return `${base}:nth-of-type(${index})`;
}

function isUnique(selector: string): boolean {
  try {
    return document.querySelectorAll(selector).length === 1;
  } catch {
    return false;
  }
}
