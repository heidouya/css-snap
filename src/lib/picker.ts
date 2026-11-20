/**
 * 元素拾取器
 *
 * 采用 capture 阶段监听 pointermove 的方式获取真实元素，不使用全屏遮挡层 +
 * elementFromPoint，避免每帧改写 pointer-events 带来的副作用。
 */

const OWN_UI_ATTR = 'data-css-snap-ui';
const CURSOR_STYLE_ID = 'css-snap-cursor-style';

export interface PickerHandlers {
  /** 悬停目标变化（含 null） */
  onHover: (element: HTMLElement | null) => void;
  /** 用户点选了一个元素 */
  onPick: (element: HTMLElement) => void;
  /** 拾取模式开启 / 关闭 */
  onActiveChange: (active: boolean) => void;
}

export class Picker {
  private active = false;
  private hovered: HTMLElement | null = null;

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
    this.injectCursorStyle();
    this.handlers.onActiveChange(true);
  }

  stop(): void {
    if (!this.active) return;
    this.active = false;
    document.removeEventListener('pointermove', this.handlePointerMove, true);
    document.removeEventListener('click', this.handleClick, true);
    document.removeEventListener('keydown', this.handleKeyDown, true);
    this.removeCursorStyle();
    this.setHovered(null);
    this.handlers.onActiveChange(false);
  }

  toggle(): void {
    if (this.active) this.stop();
    else this.start();
  }

  /** 从事件路径里取出最深层的页面元素，跳过扩展自己的 UI */
  private resolve(event: Event): HTMLElement | null {
    for (const node of event.composedPath()) {
      if (node instanceof HTMLElement && !isOwnUi(node)) return node;
    }
    return null;
  }

  private setHovered(element: HTMLElement | null): void {
    if (element === this.hovered) return;
    this.hovered = element;
    this.handlers.onHover(element);
  }

  private handlePointerMove = (event: PointerEvent): void => {
    this.setHovered(this.resolve(event));
  };

  private handleClick = (event: MouseEvent): void => {
    const element = this.resolve(event);
    if (!element) return;
    // 吞掉这次点击，避免触发页面跳转与业务逻辑
    event.preventDefault();
    event.stopImmediatePropagation();
    this.handlers.onPick(element);
    this.stop();
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
