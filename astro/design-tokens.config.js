// iShine 设计规范（取自 src/pages/index.astro 的 :root 与全局字体栈）
// 供 scripts/audit-ui.mjs 做样式一致性审计；修改设计时请同步更新此文件。
export const designTokens = {
  // 颜色规范（取自 :root）
  colors: {
    blue: '#563cfa',
    blue100: '#c6bff8',
    blue50: '#edebfc',
    black: '#020303',
    white: '#ffffff',
    grey50: '#f9fafb',
    grey100: '#f3f4f6',
    grey200: '#e5e7eb',
    grey700: '#374151',
  },
  // 字体层级（全局字体栈）
  typography: {
    heading: { family: 'Syne', weight: 400 },
    body: { family: 'Manrope', size: '16px', weight: 400 },
  },
  // 间距规范（:root 的 --pad-*）
  spacing: ['100px', '40px', '24px'],
  // 布局规范
  layout: { maxWidth: '1536px', navHeight: '70px', navTop: '66px' },
};
