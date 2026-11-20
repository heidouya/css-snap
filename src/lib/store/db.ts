import type { Snapshot } from './types';

/**
 * IndexedDB 访问，只能跑在扩展自己的上下文里（后台）。
 * 内容脚本里的 indexedDB 属于宿主页面 origin，写入会随页面刷新丢失。
 */

const DB_NAME = 'css-snap';
const STORE_NAME = 'snapshots';
const DB_VERSION = 1;

let dbPromise: Promise<IDBDatabase> | null = null;

function openDb(): Promise<IDBDatabase> {
  if (dbPromise) return dbPromise;

  dbPromise = new Promise<IDBDatabase>((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        const store = db.createObjectStore(STORE_NAME, { keyPath: 'id' });
        store.createIndex('createdAt', 'createdAt');
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error ?? new Error('打开数据库失败'));
  });

  return dbPromise;
}

function requestToPromise<T>(request: IDBRequest<T>): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error ?? new Error('数据库操作失败'));
  });
}

export async function saveSnapshot(snapshot: Snapshot): Promise<void> {
  const db = await openDb();
  const tx = db.transaction(STORE_NAME, 'readwrite');
  tx.objectStore(STORE_NAME).put(snapshot);
  await new Promise<void>((resolve, reject) => {
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error ?? new Error('写入快照失败'));
    tx.onabort = () => reject(tx.error ?? new Error('写入快照被中断'));
  });
}

export async function listSnapshots(): Promise<Snapshot[]> {
  const db = await openDb();
  const tx = db.transaction(STORE_NAME, 'readonly');
  const all = await requestToPromise(tx.objectStore(STORE_NAME).getAll() as IDBRequest<Snapshot[]>);
  return all.sort((a, b) => b.createdAt - a.createdAt);
}

export async function deleteSnapshot(id: string): Promise<void> {
  const db = await openDb();
  const tx = db.transaction(STORE_NAME, 'readwrite');
  tx.objectStore(STORE_NAME).delete(id);
  await new Promise<void>((resolve, reject) => {
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error ?? new Error('删除快照失败'));
    tx.onabort = () => reject(tx.error ?? new Error('删除快照被中断'));
  });
}
