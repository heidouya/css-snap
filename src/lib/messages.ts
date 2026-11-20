/** 内容脚本与后台 / 工具栏之间通信的消息类型 */

import type { Snapshot } from './store/types';

export const TOGGLE_PICKER = 'css-snap:toggle-picker';
export const SAVE_SNAPSHOT = 'css-snap:save-snapshot';
export const LIST_SNAPSHOTS = 'css-snap:list-snapshots';
export const DELETE_SNAPSHOT = 'css-snap:delete-snapshot';

export interface TogglePickerMessage {
  type: typeof TOGGLE_PICKER;
}

export interface SaveSnapshotMessage {
  type: typeof SAVE_SNAPSHOT;
  snapshot: Snapshot;
}

export interface ListSnapshotsMessage {
  type: typeof LIST_SNAPSHOTS;
}

export interface DeleteSnapshotMessage {
  type: typeof DELETE_SNAPSHOT;
  id: string;
}

export type ContentMessage = TogglePickerMessage;
export type BackgroundMessage = SaveSnapshotMessage | ListSnapshotsMessage | DeleteSnapshotMessage;

export interface SaveResult {
  ok: boolean;
  error?: string;
}

export interface ListResult {
  ok: boolean;
  snapshots: Snapshot[];
  error?: string;
}

export interface DeleteResult {
  ok: boolean;
  error?: string;
}
