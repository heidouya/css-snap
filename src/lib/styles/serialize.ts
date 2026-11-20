import type { StyleGroupResult } from './collect';

/** 只导出声明，不带选择器与花括号 */
export function groupsToDeclarations(groups: StyleGroupResult[], indent = '  '): string {
  return groups
    .flatMap((group) => group.items.map((item) => `${indent}${item.prop}: ${item.value};`))
    .join('\n');
}

/** 导出成一条可以粘进样式表的完整规则 */
export function groupsToRule(selector: string, groups: StyleGroupResult[], indent = '  '): string {
  const body = groupsToDeclarations(groups, indent);
  if (!body) return `/* ${selector} 与默认样式一致 */`;
  return `${selector} {\n${body}\n}`;
}
