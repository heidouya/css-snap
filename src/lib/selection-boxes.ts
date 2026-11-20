/**
 * 多选描边层：为每个被选中的元素画一个带序号的框。
 * 与鼠标悬停的高亮框分开管理，避免互相覆盖。
 */

const OVERLAY_ATTR = 'data-css-snap-ui';
const Z_INDEX = '2147483645';

export class SelectionBoxes {
  private boxes = new Map<Element, HTMLDivElement>();
  private frame = 0;
  private listening = false;

  /** 用最新的选中列表同步描边，重复元素自动去重 */
  sync(elements: Element[]): void {
    const wanted = new Set(elements);

    for (const [element, node] of Array.from(this.boxes)) {
      if (!wanted.has(element) || !element.isConnected) {
        node.remove();
        this.boxes.delete(element);
      }
    }

    elements.forEach((element, i) => {
      let node = this.boxes.get(element);
      if (!node) {
        node = this.createBox();
        this.boxes.set(element, node);
      }
      const badge = node.firstElementChild;
      if (badge) badge.textContent = String(i + 1);
    });

    if (!this.boxes.size) {
      this.detach();
      this.cancel();
      return;
    }

    this.attach();
    this.schedule();
  }

  clear(): void {
    for (const node of this.boxes.values()) node.remove();
    this.boxes.clear();
    this.detach();
    this.cancel();
  }

  private createBox(): HTMLDivElement {
    const node = document.createElement('div');
    node.setAttribute(OVERLAY_ATTR, '');
    node.style.cssText = [
      'position:fixed',
      'top:0',
      'left:0',
      'display:none',
      'pointer-events:none',
      `z-index:${Z_INDEX}`,
      'box-sizing:border-box',
      'border:1px dashed rgba(37,99,235,0.75)',
      'border-radius:2px',
      'will-change:transform,width,height',
    ].join(';');

    const badge = document.createElement('span');
    badge.style.cssText = [
      'position:absolute',
      'left:-7px',
      'top:-7px',
      'min-width:14px',
      'height:14px',
      'padding:0 3px',
      'border-radius:7px',
      'background:rgba(37,99,235,0.95)',
      'color:#fff',
      'font:10px/14px -apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif',
      'text-align:center',
    ].join(';');
    node.append(badge);

    (document.body ?? document.documentElement).append(node);
    return node;
  }

  private layout = (): void => {
    this.frame = 0;
    for (const [element, node] of this.boxes) {
      if (!element.isConnected) continue;
      const rect = element.getBoundingClientRect();
      if (rect.width === 0 && rect.height === 0) {
        node.style.display = 'none';
        continue;
      }
      node.style.display = 'block';
      node.style.transform = `translate(${rect.left}px, ${rect.top}px)`;
      node.style.width = `${rect.width}px`;
      node.style.height = `${rect.height}px`;
    }
  };

  private schedule = (): void => {
    if (this.frame) return;
    this.frame = requestAnimationFrame(this.layout);
  };

  private cancel(): void {
    if (this.frame) {
      cancelAnimationFrame(this.frame);
      this.frame = 0;
    }
  }

  private attach(): void {
    if (this.listening) return;
    this.listening = true;
    window.addEventListener('scroll', this.schedule, { capture: true, passive: true });
    window.addEventListener('resize', this.schedule, { passive: true });
  }

  private detach(): void {
    if (!this.listening) return;
    this.listening = false;
    window.removeEventListener('scroll', this.schedule, true);
    window.removeEventListener('resize', this.schedule);
  }
}
