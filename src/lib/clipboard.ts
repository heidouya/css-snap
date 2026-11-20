/**
 * 复制文本到剪贴板。
 *
 * 主路径 navigator.clipboard 需要文档处于聚焦状态，在内容脚本里经常失败；
 * 失败时降级到隐藏 textarea + execCommand，两端浏览器都可用，不依赖
 * Chrome 专有的 offscreen document。
 */
export async function copyText(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    return fallbackCopy(text);
  }
}

function fallbackCopy(text: string): boolean {
  const host = document.body ?? document.documentElement;
  const area = document.createElement('textarea');
  area.setAttribute('data-css-snap-ui', '');
  area.value = text;
  area.setAttribute('readonly', '');
  area.style.cssText = 'position:fixed;top:0;left:0;width:1px;height:1px;opacity:0;pointer-events:none;';
  host.append(area);

  let ok = false;
  try {
    area.select();
    ok = document.execCommand('copy');
  } catch {
    ok = false;
  } finally {
    area.remove();
  }
  return ok;
}
