/**
 * 面板九组样式的定义：属性名、中文标签与渲染类型。
 *
 * 这里只列长写属性（longhand），不用 border / background 这类简写，
 * 否则 getComputedStyle 会把复合值展开成难以阅读的字符串。
 */

export type StyleValueKind = 'color' | 'shadow' | 'background-image';

export interface StylePropMeta {
  /** CSS 属性名（kebab-case） */
  prop: string;
  /** 展示给用户的中文标签 */
  label: string;
  /** 值的渲染类型，决定面板里用色块还是文本展示 */
  kind?: StyleValueKind;
}

export interface StyleGroupMeta {
  id: string;
  title: string;
  props: StylePropMeta[];
}

export const STYLE_GROUPS: StyleGroupMeta[] = [
  {
    id: 'box',
    title: '盒模型',
    props: [
      { prop: 'width', label: '宽度' },
      { prop: 'height', label: '高度' },
      { prop: 'box-sizing', label: '盒模型' },
      { prop: 'padding-top', label: '内边距-上' },
      { prop: 'padding-right', label: '内边距-右' },
      { prop: 'padding-bottom', label: '内边距-下' },
      { prop: 'padding-left', label: '内边距-左' },
      { prop: 'margin-top', label: '外边距-上' },
      { prop: 'margin-right', label: '外边距-右' },
      { prop: 'margin-bottom', label: '外边距-下' },
      { prop: 'margin-left', label: '外边距-左' },
    ],
  },
  {
    id: 'layout',
    title: '布局',
    props: [
      { prop: 'display', label: '显示方式' },
      { prop: 'flex-direction', label: '主轴方向' },
      { prop: 'flex-wrap', label: '换行' },
      { prop: 'justify-content', label: '主轴对齐' },
      { prop: 'align-items', label: '交叉轴对齐' },
      { prop: 'align-content', label: '多行对齐' },
      { prop: 'align-self', label: '自身对齐' },
      { prop: 'flex-grow', label: '扩展比例' },
      { prop: 'flex-shrink', label: '收缩比例' },
      { prop: 'flex-basis', label: '基础尺寸' },
      { prop: 'row-gap', label: '行间距' },
      { prop: 'column-gap', label: '列间距' },
      { prop: 'grid-template-columns', label: '网格列' },
      { prop: 'grid-template-rows', label: '网格行' },
    ],
  },
  {
    id: 'position',
    title: '定位层级',
    props: [
      { prop: 'position', label: '定位方式' },
      { prop: 'top', label: '上偏移' },
      { prop: 'right', label: '右偏移' },
      { prop: 'bottom', label: '下偏移' },
      { prop: 'left', label: '左偏移' },
      { prop: 'z-index', label: '层级' },
      { prop: 'float', label: '浮动' },
      { prop: 'clear', label: '清除浮动' },
    ],
  },
  {
    id: 'typography',
    title: '排版',
    props: [
      { prop: 'font-family', label: '字体' },
      { prop: 'font-size', label: '字号' },
      { prop: 'font-weight', label: '字重' },
      { prop: 'font-style', label: '字形' },
      { prop: 'line-height', label: '行高' },
      { prop: 'letter-spacing', label: '字间距' },
      { prop: 'word-spacing', label: '词间距' },
      { prop: 'text-align', label: '水平对齐' },
      { prop: 'text-transform', label: '大小写' },
      { prop: 'text-indent', label: '首行缩进' },
      { prop: 'text-decoration-line', label: '装饰线' },
      { prop: 'white-space', label: '空白处理' },
    ],
  },
  {
    id: 'colors',
    title: '颜色背景',
    props: [
      { prop: 'color', label: '文字颜色', kind: 'color' },
      { prop: 'background-color', label: '背景色', kind: 'color' },
      { prop: 'background-image', label: '背景图', kind: 'background-image' },
      { prop: 'background-size', label: '背景尺寸' },
      { prop: 'background-position', label: '背景位置' },
      { prop: 'background-repeat', label: '背景重复' },
      { prop: 'background-clip', label: '背景裁剪' },
      { prop: 'mix-blend-mode', label: '混合模式' },
    ],
  },
  {
    id: 'border',
    title: '边框圆角',
    props: [
      { prop: 'border-top-width', label: '上边框宽度' },
      { prop: 'border-right-width', label: '右边框宽度' },
      { prop: 'border-bottom-width', label: '下边框宽度' },
      { prop: 'border-left-width', label: '左边框宽度' },
      { prop: 'border-top-style', label: '上边框样式' },
      { prop: 'border-right-style', label: '右边框样式' },
      { prop: 'border-bottom-style', label: '下边框样式' },
      { prop: 'border-left-style', label: '左边框样式' },
      { prop: 'border-top-color', label: '上边框颜色', kind: 'color' },
      { prop: 'border-right-color', label: '右边框颜色', kind: 'color' },
      { prop: 'border-bottom-color', label: '下边框颜色', kind: 'color' },
      { prop: 'border-left-color', label: '左边框颜色', kind: 'color' },
      { prop: 'border-top-left-radius', label: '左上圆角' },
      { prop: 'border-top-right-radius', label: '右上圆角' },
      { prop: 'border-bottom-right-radius', label: '右下圆角' },
      { prop: 'border-bottom-left-radius', label: '左下圆角' },
      { prop: 'outline-width', label: '轮廓宽度' },
      { prop: 'outline-style', label: '轮廓样式' },
      { prop: 'outline-color', label: '轮廓颜色', kind: 'color' },
    ],
  },
  {
    id: 'effects',
    title: '阴影滤镜',
    props: [
      { prop: 'box-shadow', label: '外阴影', kind: 'shadow' },
      { prop: 'text-shadow', label: '文字阴影', kind: 'shadow' },
      { prop: 'filter', label: '滤镜' },
      { prop: 'backdrop-filter', label: '背景滤镜' },
      { prop: 'opacity', label: '不透明度' },
    ],
  },
  {
    id: 'transform',
    title: '变换动画',
    props: [
      { prop: 'transform', label: '变换' },
      { prop: 'transform-origin', label: '变换原点' },
      { prop: 'transition-property', label: '过渡属性' },
      { prop: 'transition-duration', label: '过渡时长' },
      { prop: 'transition-timing-function', label: '过渡曲线' },
      { prop: 'animation-name', label: '动画名称' },
      { prop: 'animation-duration', label: '动画时长' },
      { prop: 'animation-timing-function', label: '动画曲线' },
      { prop: 'will-change', label: '性能提示' },
    ],
  },
  {
    id: 'other',
    title: '其他交互',
    props: [
      { prop: 'overflow-x', label: '横向溢出' },
      { prop: 'overflow-y', label: '纵向溢出' },
      { prop: 'cursor', label: '鼠标指针' },
      { prop: 'visibility', label: '可见性' },
      { prop: 'pointer-events', label: '事件穿透' },
      { prop: 'user-select', label: '可选文本' },
      { prop: 'list-style-type', label: '列表样式' },
      { prop: 'aspect-ratio', label: '宽高比' },
    ],
  },
];
