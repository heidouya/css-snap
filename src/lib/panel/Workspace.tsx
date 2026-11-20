import { useEffect, useState } from 'react';
import { copyText } from '@/lib/clipboard';
import type { Snapshot } from '@/lib/store/types';

interface WorkspaceProps {
  load: () => Promise<Snapshot[]>;
  remove: (id: string) => Promise<boolean>;
}

export function Workspace({ load, remove }: WorkspaceProps) {
  const [snapshots, setSnapshots] = useState<Snapshot[]>([]);
  const [loading, setLoading] = useState(true);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [confirmId, setConfirmId] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    load()
      .then((list) => {
        if (!cancelled) setSnapshots(list);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [load]);

  const handleCopy = async (snapshot: Snapshot) => {
    const text = snapshot.items.map((item) => item.rule).join('\n\n');
    const ok = await copyText(text);
    if (!ok) return;
    setCopiedId(snapshot.id);
    window.setTimeout(() => setCopiedId((current) => (current === snapshot.id ? null : current)), 1500);
  };

  const handleDelete = async (snapshot: Snapshot) => {
    if (confirmId !== snapshot.id) {
      setConfirmId(snapshot.id);
      window.setTimeout(() => setConfirmId((current) => (current === snapshot.id ? null : current)), 3000);
      return;
    }
    const ok = await remove(snapshot.id);
    if (ok) {
      setSnapshots((list) => list.filter((item) => item.id !== snapshot.id));
    }
    setConfirmId(null);
  };

  if (loading) {
    return <p className="css-snap-panel__empty">正在读取工作台…</p>;
  }

  if (!snapshots.length) {
    return (
      <p className="css-snap-panel__empty">
        还没有保存的快照。
        <br />
        回到「全部样式」点保存即可。
      </p>
    );
  }

  return (
    <div className="css-snap-ws">
      {snapshots.map((snapshot) => (
        <article key={snapshot.id} className="css-snap-ws__item">
          <div className="css-snap-ws__head">
            <span className="css-snap-ws__title" title={snapshot.pageTitle}>
              {snapshot.pageTitle || snapshot.pageUrl}
            </span>
            <span className="css-snap-ws__time">{formatTime(snapshot.createdAt)}</span>
          </div>

          <div className="css-snap-ws__meta">
            {snapshot.items.length} 个元素 ·{' '}
            {snapshot.items
              .map((item) => item.label)
              .join('、')
              .slice(0, 60)}
          </div>

          <div className="css-snap-ws__actions">
            <button
              type="button"
              className="css-snap-ws__btn"
              onClick={() => handleCopy(snapshot)}
            >
              {copiedId === snapshot.id ? '已复制' : '复制片段'}
            </button>
            <button
              type="button"
              className={
                confirmId === snapshot.id ? 'css-snap-ws__btn is-danger' : 'css-snap-ws__btn is-muted'
              }
              onClick={() => handleDelete(snapshot)}
            >
              {confirmId === snapshot.id ? '确认删除' : '删除'}
            </button>
          </div>
        </article>
      ))}
    </div>
  );
}

function formatTime(timestamp: number): string {
  const diff = Date.now() - timestamp;
  const minute = 60 * 1000;
  const hour = 60 * minute;
  const day = 24 * hour;

  if (diff < minute) return '刚刚';
  if (diff < hour) return `${Math.floor(diff / minute)} 分钟前`;
  if (diff < day) return `${Math.floor(diff / hour)} 小时前`;

  const date = new Date(timestamp);
  const pad = (value: number) => String(value).padStart(2, '0');
  return `${date.getMonth() + 1}月${date.getDate()}日 ${pad(date.getHours())}:${pad(date.getMinutes())}`;
}
