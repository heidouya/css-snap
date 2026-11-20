import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import type { StyleItem } from '@/lib/styles/collect';
import { groupsToDeclarations, groupsToRule } from '@/lib/styles/serialize';
import { copyText } from '@/lib/clipboard';
import type { PanelData, PanelRect } from './types';

const PANEL_GAP = 12;
const VIEWPORT_MARGIN = 12;
const DEFAULT_WIDTH = 320;

type Tab = 'all' | 'minimal';
type CopyState = 'idle' | 'ok' | 'fail';

interface PanelProps {
  data: PanelData;
  rect: PanelRect;
  onClose: () => void;
}

export function Panel({ data, rect, onClose }: PanelProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState({ width: DEFAULT_WIDTH, height: 0 });
  const [tab, setTab] = useState<Tab>('all');
  const [diffOnly, setDiffOnly] = useState(false);
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});
  const [copyState, setCopyState] = useState<CopyState>('idle');
  const copyTimer = useRef(0);

  useLayoutEffect(() => {
    const node = ref.current;
    if (!node) return;
    const measure = () => setSize({ width: node.offsetWidth, height: node.offsetHeight });
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  useEffect(() => () => window.clearTimeout(copyTimer.current), []);

  const position = useMemo(() => placePanel(rect, size), [rect, size]);

  const diffCount = useMemo(
    () => data.minimal.reduce((total, group) => total + group.items.length, 0),
    [data.minimal],
  );
  const visibleGroups = diffOnly ? data.minimal : data.groups;
  const rule = useMemo(() => groupsToRule(data.selector, data.minimal), [data.selector, data.minimal]);

  const toggleGroup = (id: string) => {
    setCollapsed((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const handleCopy = async () => {
    const text = tab === 'minimal' ? rule : groupsToDeclarations(visibleGroups);
    const ok = await copyText(text);
    setCopyState(ok ? 'ok' : 'fail');
    window.clearTimeout(copyTimer.current);
    copyTimer.current = window.setTimeout(() => setCopyState('idle'), 1500);
  };

  const copyLabel = copyState === 'ok' ? '已复制' : copyState === 'fail' ? '复制失败' : tab === 'minimal' ? '复制片段' : '复制用到的样式';

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

      <div className="css-snap-panel__tabs">
        <button
          type="button"
          className={tab === 'all' ? 'css-snap-panel__tab is-active' : 'css-snap-panel__tab'}
          onClick={() => setTab('all')}
        >
          全部样式
        </button>
        <button
          type="button"
          className={tab === 'minimal' ? 'css-snap-panel__tab is-active' : 'css-snap-panel__tab'}
          onClick={() => setTab('minimal')}
        >
          精简片段
        </button>
        <button
          type="button"
          className={copyState === 'ok' ? 'css-snap-panel__copy is-done' : 'css-snap-panel__copy'}
          onClick={handleCopy}
        >
          {copyLabel}
        </button>
      </div>

      {tab === 'all' ? (
        <>
          <div className="css-snap-panel__toolbar">
            <label className="css-snap-panel__switch">
              <input
                type="checkbox"
                checked={diffOnly}
                onChange={(event) => setDiffOnly(event.target.checked)}
              />
              <span>只看差异项</span>
              <span className="css-snap-panel__badge">{diffCount}</span>
            </label>
          </div>

          <div className="css-snap-panel__body">
            {visibleGroups.length === 0 && (
              <p className="css-snap-panel__empty">与默认样式一致，没有可精简的属性</p>
            )}

            {visibleGroups.map((group) => (
              <section key={group.id} className="css-snap-panel__group">
                <button
                  type="button"
                  className="css-snap-panel__group-header"
                  onClick={() => toggleGroup(group.id)}
                  aria-expanded={!collapsed[group.id]}
                >
                  <span
                    className={
                      collapsed[group.id] ? 'css-snap-panel__caret is-collapsed' : 'css-snap-panel__caret'
                    }
                  >
                    ▾
                  </span>
                  <span className="css-snap-panel__group-name">{group.title}</span>
                  <span className="css-snap-panel__count">{group.items.length}</span>
                </button>

                {!collapsed[group.id] && (
                  <div className="css-snap-panel__rows">
                    {group.items.map((item) => (
                      <div key={`${group.id}-${item.prop}`} className="css-snap-panel__row">
                        <span className="css-snap-panel__label">{item.label}</span>
                        <ValueView item={item} />
                      </div>
                    ))}
                  </div>
                )}
              </section>
            ))}
          </div>
        </>
      ) : (
        <div className="css-snap-panel__body">
          <pre className="css-snap-panel__code">{rule}</pre>
          <p className="css-snap-panel__hint">
            已剔除与同位置默认元素一致的属性，共保留 {diffCount} 条。
          </p>
        </div>
      )}

      <footer className="css-snap-panel__footer">Esc 退出拾取 · 继续点选可切换元素</footer>
    </div>
  );
}

function ValueView({ item }: { item: StyleItem }) {
  if (item.kind === 'color') {
    return (
      <span className="css-snap-panel__value" title={item.value}>
        <span className="css-snap-panel__chip" style={{ background: item.value }} />
        <span className="css-snap-panel__text">{item.value}</span>
      </span>
    );
  }

  if (item.kind === 'shadow') {
    return (
      <span className="css-snap-panel__value" title={item.value}>
        <span
          className="css-snap-panel__shadow"
          style={{ boxShadow: item.value === 'none' ? 'none' : item.value }}
        />
        <span className="css-snap-panel__text">{item.value}</span>
      </span>
    );
  }

  if (item.kind === 'background-image' && /gradient/i.test(item.value)) {
    return (
      <span className="css-snap-panel__value" title={item.value}>
        <span className="css-snap-panel__chip" style={{ backgroundImage: item.value }} />
        <span className="css-snap-panel__text">渐变</span>
      </span>
    );
  }

  return (
    <span className="css-snap-panel__value" title={item.value}>
      <span className="css-snap-panel__text">{item.value}</span>
    </span>
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
