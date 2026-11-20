import { createRoot, type Root } from 'react-dom/client';
import panelCss from './panel.css?inline';
import { Panel } from './Panel';
import { activeEntry, type PanelData, type PanelRect } from './types';

export interface PanelHostHandlers {
  onSelectEntry: (index: number) => void;
  onSave: () => Promise<boolean>;
}

/**
 * 面板宿主：负责创建 shadow root、挂载 React，并在页面滚动时重新定位。
 * 宿主节点带 data-css-snap-ui 标记，拾取器据此放行面板内的点击。
 */
export class PanelHost {
  private host: HTMLDivElement | null = null;
  private root: Root | null = null;
  private data: PanelData | null = null;
  private frame = 0;
  private listening = false;

  constructor(private readonly handlers: PanelHostHandlers) {}

  get isOpen(): boolean {
    return this.data !== null;
  }

  open(data: PanelData): void {
    this.data = data;
    this.ensureHost();
    this.attachListeners();
    this.render();
  }

  close(): void {
    this.detachListeners();
    if (this.frame) {
      cancelAnimationFrame(this.frame);
      this.frame = 0;
    }
    this.root?.unmount();
    this.root = null;
    this.host?.remove();
    this.host = null;
    this.data = null;
  }

  private ensureHost(): void {
    if (this.host) return;

    const host = document.createElement('div');
    host.setAttribute('data-css-snap-ui', '');
    // 覆盖视口但自身不接收事件，只有面板本体 pointer-events: auto
    host.style.cssText = 'position:fixed;inset:0;z-index:2147483646;pointer-events:none;';

    const shadow = host.attachShadow({ mode: 'closed' });
    const style = document.createElement('style');
    style.textContent = panelCss;
    const container = document.createElement('div');
    shadow.append(style, container);
    (document.body ?? document.documentElement).append(host);

    this.host = host;
    this.root = createRoot(container);
  }

  private render = (): void => {
    this.frame = 0;
    const data = this.data;
    if (!data || !this.root) return;

    const entry = activeEntry(data);
    if (!entry || !entry.element.isConnected) {
      this.close();
      return;
    }

    this.root.render(
      <Panel
        data={data}
        rect={toRect(entry.element)}
        onClose={() => this.close()}
        onSelectEntry={this.handlers.onSelectEntry}
        onSave={this.handlers.onSave}
      />,
    );
  };

  private schedule = (): void => {
    if (this.frame) return;
    this.frame = requestAnimationFrame(this.render);
  };

  private attachListeners(): void {
    if (this.listening) return;
    this.listening = true;
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

function toRect(element: Element): PanelRect {
  const rect = element.getBoundingClientRect();
  return {
    left: rect.left,
    top: rect.top,
    width: rect.width,
    height: rect.height,
    right: rect.right,
    bottom: rect.bottom,
  };
}
