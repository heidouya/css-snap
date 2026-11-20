/** 内容脚本与后台 / 工具栏之间通信的消息类型 */

export const TOGGLE_PICKER = 'css-snap:toggle-picker';

export interface TogglePickerMessage {
  type: typeof TOGGLE_PICKER;
}

export type ContentMessage = TogglePickerMessage;
