import {
  TOGGLE_PICKER,
  SAVE_SNAPSHOT,
  LIST_SNAPSHOTS,
  DELETE_SNAPSHOT,
  type TogglePickerMessage,
  type SaveSnapshotMessage,
  type DeleteSnapshotMessage,
  type SaveResult,
  type ListResult,
  type DeleteResult,
} from '@/lib/messages';
import { saveSnapshot, listSnapshots, deleteSnapshot } from '@/lib/store/db';

export default defineBackground(() => {
  browser.action.onClicked.addListener(async (tab) => {
    if (tab.id === undefined) return;
    try {
      await browser.tabs.sendMessage<TogglePickerMessage>(tab.id, { type: TOGGLE_PICKER });
    } catch {
      // 浏览器内部页面等无法注入内容脚本的场景，忽略即可
    }
  });

  browser.runtime.onMessage.addListener((message: unknown, _sender, sendResponse) => {
    const type = (message as { type?: string } | null)?.type;

    switch (type) {
      case SAVE_SNAPSHOT: {
        const snapshot = (message as SaveSnapshotMessage).snapshot;
        saveSnapshot(snapshot).then(
          () => sendResponse({ ok: true } satisfies SaveResult),
          (error: unknown) =>
            sendResponse({ ok: false, error: describeError(error) } satisfies SaveResult),
        );
        return true;
      }

      case LIST_SNAPSHOTS: {
        listSnapshots().then(
          (snapshots) => sendResponse({ ok: true, snapshots } satisfies ListResult),
          (error: unknown) =>
            sendResponse({ ok: false, snapshots: [], error: describeError(error) } satisfies ListResult),
        );
        return true;
      }

      case DELETE_SNAPSHOT: {
        const id = (message as DeleteSnapshotMessage).id;
        deleteSnapshot(id).then(
          () => sendResponse({ ok: true } satisfies DeleteResult),
          (error: unknown) =>
            sendResponse({ ok: false, error: describeError(error) } satisfies DeleteResult),
        );
        return true;
      }

      default:
        return undefined;
    }
  });
});

function describeError(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}
