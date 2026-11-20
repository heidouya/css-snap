import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import type { StyleItem } from '@/lib/styles/collect';
import { groupsToDeclarations, groupsToRule } from '@/lib/styles/serialize';
import { copyText } from '@/lib/clipboard';
import type { Snapshot } from '@/lib/store/types';
import { Workspace } from './Workspace';
import type { PanelData, PanelRect, SelectionEntry } from './types';

const PANEL_GAP = 12;
const VIEWPORT_MARGIN = 12;
const DEFAULT_WIDTH = 320;
const SNAP_ZONE = 24;

type Tab = 'all' | 'minimal' | 'workspace';
type CopyState = 'idle' | 'ok' | 'fail';

interface PanelProps {
  data: PanelData;
  rect: PanelRect;
  onClose: () => void;
  onSelectEntry: (index: number) => void;
  onSave: () => Promise<boolean>;
  onLoadSnapshots: () => Promise<Snapshot[]>;
  onDeleteSnapshot: (id: string) => Promise<boolean>;
}

export function Panel({
  data,
  rect,
  onClose,
  onSelectEntry,
  onSave,
  onLoadSnapshots,
  onDeleteSnapshot,
}: PanelProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState({ width: DEFAULT_WIDTH, height: 0 });
  const [tab, setTab] = useState<Tab>('all');
  const [diffOnly, setDiffOnly] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const [collapsedGroups, setCollapsedGroups] = useState<Record<string, boolean>>({});
  const [copyState, setCopyState] = useState<CopyState>('idle');
  const [saveState, setSaveState] = useState<CopyState>('idle');
  const [manualPos, setManualPos] = useState<{ left: number; top: number } | null>(null);
  const [dragging, setDragging] = useState(false);

  const dragRef = useRef<{
    pointerId: number;
    startX: number;
    startY: number;
    originLeft: number;
    originTop: number;
    left: number;
    top: number;
  } | null>(null);

  const copyTimer = useRef(0);
  const saveTimer = useRef(0);

  const active = (data.entries[data.activeIndex] ?? data.entries[0]) as SelectionEntry;
  const isMulti = data.entries.length > 1;
  const visibleGroups = diffOnly ? active.minimal : active.groups;

  useLayoutEffect(() => {
    const node = ref.current;
    if (!node) return;
    const measure = () => setSize({ width: node.offsetWidth, height: node.offsetHeight });
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  // 换了选中集就回到自动定位，避免沿用上一个元素旁的拖拽位置
  useEffect(() => {
    setManualPos(null);
    setCollapsed(false);
  }, [data.entries]);

  useEffect(
    () => () => {
      window.clearTimeout(copyTimer.current);
      window.clearTimeout(saveTimer.current);
    },
    [],
  );

  const autoPosition = useMemo(() => placePanel(rect, size), [rect, size]);
  const position = manualPos ?? autoPosition;

  const diffCount = useMemo(
    () => data.entries.reduce((total, entry) => total + countItems(entry.minimal), 0),
    [data.entries],
  );

  const ruleText = useMemo(() => {
    if (isMulti) {
      return data.entries.map((entry) => groupsToRule(entry.selector, entry.minimal)).join('\n\n');
    }
    return groupsToRule(active.selector, active.minimal);
  }, [data.entries, isMulti, active]);

  const toggleGroup = (id: string) => {
    setCollapsedGroups((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const handleCopy = async () => {
    let text: string;
    if (tab === 'minimal') {
      text = ruleText;
    } else if (isMulti) {
      text = data.entries
        .map((entry) => groupsToDeclarations(diffOnly ? entry.minimal : entry.groups))
        .join('\n\n');
    } else {
      text = groupsToDeclarations(visibleGroups);
    }

    const ok = await copyText(text);
    setCopyState(ok ? 'ok' : 'fail');
    window.clearTimeout(copyTimer.current);
    copyTimer.current = window.setTimeout(() => setCopyState('idle'), 1500);
  };

  const handleSave = async () => {
    const ok = await onSave();
    setSaveState(ok ? 'ok' : 'fail');
    window.clearTimeout(saveTimer.current);
    saveTimer.current = window.setTimeout(() => setSaveState('idle'), 1600);
  };

  const handleDragStart = (event: React.PointerEvent<HTMLDivElement>) => {
    if ((event.target as Element).closest('button')) return;
    dragRef.current = {
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      originLeft: position.left,
      originTop: position.top,
      left: position.left,
      top: position.top,
    };
    event.currentTarget.setPointerCapture(event.pointerId);
    setDragging(true);
  };

  const handleDragMove = (event: React.PointerEvent<HTMLDivElement>) => {
    const drag = dragRef.current;
    if (!drag) return;
    const left = clamp(
      drag.originLeft + event.clientX - drag.startX,
      0,
      Math.max(0, window.innerWidth - size.width),
    );
    const top = clamp(
      drag.originTop + event.clientY - drag.startY,
      0,
      Math.max(0, window.innerHeight - 40),
    );
    drag.left = left;
    drag.top = top;
    setManualPos({ left, top });
  };

  const handleDragEnd = (event: React.PointerEvent<HTMLDivElement>) => {
    const drag = dragRef.current;
    if (!drag) return;
    dragRef.current = null;
    setDragging(false);
    if (event.currentTarget.hasPointerCapture(drag.pointerId)) {
      event.currentTarget.releasePointerCapture(drag.pointerId);
    }
    setManualPos({
      left: snapToEdge(drag.left, size.width, window.innerWidth),
      top: snapToEdge(drag.top, size.height || 60, window.innerHeight),
    });
  };

  const copyLabel =
    copyState === 'ok'
      ? '已复制'
      : copyState === 'fail'
        ? '复制失败'
        : tab === 'minimal'
          ? isMulti
            ? '复制全部片段'
            : '复制片段'
          : '复制样式';

  return (
    <div
      ref={ref}
      className={dragging ? 'css-snap-panel is-dragging' : 'css-snap-panel'}
      style={{ left: `${position.left}px`, top: `${position.top}px` }}
    >
      <header
        className="css-snap-panel__header"
        onPointerDown={handleDragStart}
        onPointerMove={handleDragMove}
        onPointerUp={handleDragEnd}
        onPointerCancel={handleDragEnd}
      >
        <span className="css-snap-panel__title" title={active.info.label}>
          {active.info.label}
        </span>
        <span className="css-snap-panel__size">
          {active.info.width} × {active.info.height}
        </span>
        <button
          type="button"
          className="css-snap-panel__icon"
          aria-label={collapsed ? '展开面板' : '折叠面板'}
          onClick={() => setCollapsed((value) => !value)}
        >
          {collapsed ? '▸' : '▾'}
        </button>
        <button type="button" className="css-snap-panel__icon" aria-label="关闭" onClick={onClose}>
          ×
        </button>
      </header>

      {!collapsed && (
        <>
          {isMulti && (
            <div className="css-snap-panel__selection">
              {data.entries.map((entry, index) => (
                <button
                  key={entry.index}
                  type="button"
                  className={
                    index === data.activeIndex
                      ? 'css-snap-panel__selected is-active'
                      : 'css-snap-panel__selected'
                  }
                  title={entry.selector}
                  onClick={() => onSelectEntry(index)}
                >
                  <span className="css-snap-panel__selected-num">{entry.index}</span>
                  <span className="css-snap-panel__selected-label">{entry.info.label}</span>
                </button>
              ))}
            </div>
          )}

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
              className={tab === 'workspace' ? 'css-snap-panel__tab is-active' : 'css-snap-panel__tab'}
              onClick={() => setTab('workspace')}
            >
              工作台
            </button>

            {tab !== 'workspace' && (
              <>
                <button
                  type="button"
                  className={copyState === 'ok' ? 'css-snap-panel__copy is-done' : 'css-snap-panel__copy'}
                  onClick={handleCopy}
                >
                  {copyLabel}
                </button>
                <button
                  type="button"
                  className={saveState === 'ok' ? 'css-snap-panel__save is-done' : 'css-snap-panel__save'}
                  onClick={handleSave}
                  title="把当前选中集存到本地工作台"
                >
                  {saveState === 'ok' ? '已保存' : saveState === 'fail' ? '保存失败' : '保存'}
                </button>
              </>
            )}
          </div>

          {tab === 'workspace' ? (
            <div className="css-snap-panel__body">
              <Workspace load={onLoadSnapshots} remove={onDeleteSnapshot} />
            </div>
          ) : tab === 'all' ? (
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
                      aria-expanded={!collapsedGroups[group.id]}
                    >
                      <span
                        className={
                          collapsedGroups[group.id]
                            ? 'css-snap-panel__caret is-collapsed'
                            : 'css-snap-panel__caret'
                        }
                      >
                        ▾
                      </span>
                      <span className="css-snap-panel__group-name">{group.title}</span>
                      <span className="css-snap-panel__count">{group.items.length}</span>
                    </button>

                    {!collapsedGroups[group.id] && (
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
              <pre className="css-snap-panel__code">{ruleText}</pre>
              <p className="css-snap-panel__hint">
                {isMulti
                  ? `共 ${data.entries.length} 个元素，已剔除与默认样式一致的属性。`
                  : `已剔除与同位置默认元素一致的属性，共保留 ${countItems(active.minimal)} 条。`}
              </p>
            </div>
          )}

          <footer className="css-snap-panel__footer">拖动标题栏可移动 · Shift+点击 多选 · Esc 退出</footer>
        </>
      )}
    </div>
  );
}

function countItems(groups: { items: StyleItem[] }[]): number {
  return groups.reduce((total, group) => total + group.items.length, 0);
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

/** 拖到接近屏幕边缘时吸附，留出统一的边距 */
function snapToEdge(value: number, size: number, viewport: number): number {
  if (value <= SNAP_ZONE) return VIEWPORT_MARGIN;
  if (value + size >= viewport - SNAP_ZONE) return viewport - size - VIEWPORT_MARGIN;
  return value;
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}
