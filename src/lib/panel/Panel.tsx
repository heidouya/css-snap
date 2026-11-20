import { useLayoutEffect, useMemo, useRef, useState } from 'react';
import type { PanelData, PanelRect } from './types';

const PANEL_GAP = 12;
const VIEWPORT_MARGIN = 12;
const DEFAULT_WIDTH = 320;

interface PanelProps {
  data: PanelData;
  rect: PanelRect;
  onClose: () => void;
}

export function Panel({ data, rect, onClose }: PanelProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState({ width: DEFAULT_WIDTH, height: 0 });

  useLayoutEffect(() => {
    const node = ref.current;
    if (!node) return;
    const measure = () => setSize({ width: node.offsetWidth, height: node.offsetHeight });
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  const position = useMemo(() => placePanel(rect, size), [rect, size]);

  return (
    <div
      ref={ref}
      className="css-snap-panel"
      style={{ left: `${position.left}px`, top: `${position.top}px` }}
    >
      <header className="css-snap-panel__header">
        <span className="css-snap-panel__title" title={data.info.label}>
          {data.info.label}
        </span>
        <span className="css-snap-panel__size">
          {data.info.width} × {data.info.height}
        </span>
        <button type="button" className="css-snap-panel__close" aria-label="关闭" onClick={onClose}>
          ×
        </button>
      </header>

      <div className="css-snap-panel__body">
        {data.groups.map((group) => (
          <section key={group.id} className="css-snap-panel__group">
            <h3 className="css-snap-panel__group-title">{group.title}</h3>
            {group.items.map((item) => (
              <div key={`${group.id}-${item.prop}`} className="css-snap-panel__row">
                <span className="css-snap-panel__label">{item.label}</span>
                <span className="css-snap-panel__value" title={item.value}>
                  {item.value}
                </span>
              </div>
            ))}
          </section>
        ))}
      </div>

      <footer className="css-snap-panel__footer">Esc 退出拾取 · 继续点选可切换元素</footer>
    </div>
  );
}

/**
 * 优先放在元素右侧，右侧放不下翻到左侧，仍越界则贴边。
 * 纵向不超出视口，必要时上移。
 */
function placePanel(rect: PanelRect, size: { width: number; height: number }) {
  const viewportWidth = window.innerWidth;
  const viewportHeight = window.innerHeight;
  const width = size.width || DEFAULT_WIDTH;
  const height = size.height;

  let left = rect.right + PANEL_GAP;
  if (left + width > viewportWidth - VIEWPORT_MARGIN) {
    left = rect.left - PANEL_GAP - width;
  }
  if (left < VIEWPORT_MARGIN) {
    left = clamp(rect.left, VIEWPORT_MARGIN, Math.max(VIEWPORT_MARGIN, viewportWidth - width - VIEWPORT_MARGIN));
  }

  let top = rect.top;
  if (height && top + height > viewportHeight - VIEWPORT_MARGIN) {
    top = viewportHeight - height - VIEWPORT_MARGIN;
  }
  top = clamp(top, VIEWPORT_MARGIN, Math.max(VIEWPORT_MARGIN, viewportHeight - height - VIEWPORT_MARGIN));

  return { left, top };
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}
