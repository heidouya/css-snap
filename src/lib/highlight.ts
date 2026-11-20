/**
 * 高亮框：跟随目标元素绘制一层只读描边，并显示元素尺寸。
 *
 * 定位使用 transform: translate()，不改 left/top，避免每帧触发重排；
 * 页面滚动 / 窗口尺寸变化时用 requestAnimationFrame 合并更新。
 */

const OVERLAY_ATTR = 'data-css-snap-ui';
const Z_INDEX = '2147483647';

export class HighlightOverlay {
  private node: HTMLDivElement | null = null;
  private label: HTMLSpanElement | null = null;
  private target: Element | null = null;
  private frame = 0;
  private listening = false;

  show(target: Element): void {
    if (target === this.target) return;
    this.target = target;
    const node = this.ensureNode();
    node.style.display = 'block';
    this.attachListeners();
    this.schedule();
  }

  hide(): void {
    this.target = null;
    this.detachListeners();
    if (this.frame) {
      cancelAnimationFrame(this.frame);
      this.frame = 0;
    }
    if (this.node) this.node.style.display = 'none';
  }

  destroy(): void {
    this.hide();
    this.node?.remove();
    this.node = null;
    this.label = null;
  }

  private ensureNode(): HTMLDivElement {
    if (this.node) return this.node;

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
      'border:2px solid rgba(64,158,255,0.9)',
      'background:rgba(64,158,255,0.12)',
      'border-radius:2px',
      'will-change:transform,width,height',
    ].join(';');

    const label = document.createElement('span');
    label.style.cssText = [
      'position:absolute',
      'left:0',
      'top:100%',
      'margin-top:2px',
      'padding:1px 6px',
      'border-radius:3px',
      'background:rgba(23,23,23,0.85)',
      'color:#fff',
      'font:11px/1.6 -apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif',
      'white-space:nowrap',
      'letter-spacing:0',
    ].join(';');
    node.append(label);

    this.node = node;
    this.label = label;
    (document.body ?? document.documentElement).append(node);
    return node;
  }

  private update = (): void => {
    this.frame = 0;
    const target = this.target;
    if (!target || !this.node) return;
    if (!target.isConnected) {
      this.hide();
      return;
    }

    const rect = target.getBoundingClientRect();
    if (rect.width === 0 && rect.height === 0) {
      this.node.style.display = 'none';
      return;
    }

    this.node.style.display = 'block';
    this.node.style.transform = `translate(${rect.left}px, ${rect.top}px)`;
    this.node.style.width = `${rect.width}px`;
    this.node.style.height = `${rect.height}px`;

    if (this.label) {
      const tag = target.tagName.toLowerCase();
      this.label.textContent = `${tag} ${Math.round(rect.width)} × ${Math.round(rect.height)}`;
    }
  };

  private schedule = (): void => {
    if (this.frame) return;
    this.frame = requestAnimationFrame(this.update);
  };

  private attachListeners(): void {
    if (this.listening) return;
    this.listening = true;
    // capture 阶段监听，能捕获任意滚动容器
    window.addEventListener('scroll', this.schedule, { capture: true, passive: true });
    window.addEventListener('resize', this.schedule, { passive: true });
  }

  private detachListeners(): void {
    if (!this.listening) return;
    this.listening = false;
    window.removeEventListener('scroll', this.schedule, true);
    window.removeEventListener('resize', this.schedule);
  }
}
