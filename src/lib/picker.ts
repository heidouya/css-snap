const OWN_UI_ATTR = 'data-css-snap-ui';
const CURSOR_STYLE_ID = 'css-snap-cursor-style';

export interface PickOptions {
  /** 是否按住 Shift 追加选择 */
  additive: boolean;
}

export interface PickerHandlers {
  /** 悬停目标变化（含 null） */
  onHover: (element: HTMLElement | null) => void;
  /** 用户点选了一个元素 */
  onPick: (element: HTMLElement, options: PickOptions) => void;
  /** 拾取模式开启 / 关闭 */
  onActiveChange: (active: boolean) => void;
}

export class Picker {
  private active = false;
  private hovered: HTMLElement | null = null;
  /** 当前悬停元素到根节点的祖先链，用于 Alt+滚轮 切换层级 */
  private chain: HTMLElement[] = [];
  private chainIndex = 0;

  constructor(private readonly handlers: PickerHandlers) {}

  get isActive(): boolean {
    return this.active;
  }

  get current(): HTMLElement | null {
    return this.hovered;
  }

  start(): void {
    if (this.active) return;
    this.active = true;
    document.addEventListener('pointermove', this.handlePointerMove, true);
    document.addEventListener('click', this.handleClick, true);
    document.addEventListener('keydown', this.handleKeyDown, true);
    document.addEventListener('wheel', this.handleWheel, { capture: true, passive: false });
    this.injectCursorStyle();
    this.handlers.onActiveChange(true);
  }

  stop(): void {
    if (!this.active) return;
    this.active = false;
    document.removeEventListener('pointermove', this.handlePointerMove, true);
    document.removeEventListener('click', this.handleClick, true);
    document.removeEventListener('keydown', this.handleKeyDown, true);
    document.removeEventListener('wheel', this.handleWheel, true);
    this.removeCursorStyle();
    this.setHovered(null);
    this.handlers.onActiveChange(false);
  }

  toggle(): void {
    if (this.active) this.stop();
    else this.start();
  }

  /** 从事件路径里取出最深层的页面元素，命中扩展自己的 UI 时返回 null */
  private resolve(event: Event): HTMLElement | null {
    for (const node of event.composedPath()) {
      if (!(node instanceof HTMLElement)) continue;
      if (isOwnUi(node)) return null;
      return node;
    }
    return null;
  }

  private setHovered(element: HTMLElement | null, resetChain = true): void {
    if (resetChain) this.rebuildChain(element);
    if (element === this.hovered) return;
    this.hovered = element;
    this.handlers.onHover(element);
  }

  private rebuildChain(element: HTMLElement | null): void {
    const chain: HTMLElement[] = [];
    let cursor: HTMLElement | null = element;
    while (cursor) {
      if (!isOwnUi(cursor)) chain.unshift(cursor);
      cursor = cursor.parentElement;
    }
    this.chain = chain;
    this.chainIndex = chain.length - 1;
  }

  private handlePointerMove = (event: PointerEvent): void => {
    const element = this.resolve(event);
    // 移到面板等自身 UI 上时保持当前目标，避免高亮闪烁
    if (!element) return;
    this.setHovered(element);
  };

  /** Alt + 滚轮 在祖先链上移动一层，向下为子元素、向上为父元素 */
  private handleWheel = (event: WheelEvent): void => {
    if (!this.active || !event.altKey) return;
    if (ownUiInPath(event)) return;
    event.preventDefault();
    event.stopImmediatePropagation();
    if (!this.chain.length) return;
    const step = event.deltaY > 0 ? 1 : -1;
    const next = Math.min(this.chain.length - 1, Math.max(0, this.chainIndex + step));
    const target = this.chain[next];
    if (next === this.chainIndex || !target) return;
    this.chainIndex = next;
    this.setHovered(target, false);
  };

  private handleClick = (event: MouseEvent): void => {
    const element = this.resolve(event);
    // 点在扩展自己的面板上时放行，不做拦截
    if (!element) return;
    // 吞掉这次点击，避免触发页面跳转与业务逻辑
    event.preventDefault();
    event.stopImmediatePropagation();
    this.handlers.onPick(element, { additive: event.shiftKey });
  };

  private handleKeyDown = (event: KeyboardEvent): void => {
    if (event.key !== 'Escape') return;
    event.preventDefault();
    event.stopImmediatePropagation();
    this.stop();
  };

  private injectCursorStyle(): void {
    if (document.getElementById(CURSOR_STYLE_ID)) return;
    const style = document.createElement('style');
    style.id = CURSOR_STYLE_ID;
    style.textContent = 'html{cursor:crosshair!important}body{user-select:none!important}';
    (document.head ?? document.documentElement).append(style);
  }

  private removeCursorStyle(): void {
    document.getElementById(CURSOR_STYLE_ID)?.remove();
  }
}

function isOwnUi(element: HTMLElement): boolean {
  return element.hasAttribute(OWN_UI_ATTR) || element.closest(`[${OWN_UI_ATTR}]`) !== null;
}

function ownUiInPath(event: Event): boolean {
  return event.composedPath().some((node) => node instanceof HTMLElement && isOwnUi(node));
}
