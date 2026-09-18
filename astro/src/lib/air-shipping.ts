// 快递（空运）单件运费：96 条报价解析而来（见工作区 AIR报价-解析结果.json）。
//
// 约定（重要）：
//   · totalCny 是【最终对客价】，已经是可直接展示的数字；推导过程不在仓库里。
//   · 源报价含 CNY 与 HKD 两种币种，这里已统一折算完成，页面只按 CNY_PER_USD 折 USD 展示。
//   · 国名不逐语种翻译：用 Intl.DisplayNames 按语种输出，机制与 DDP 表一致。
//   · 缅甸暂不支持；摩纳哥报价方未给时效，时效显示 —。
import { ddpName } from './ddp-shipping';

/** 人民币兑美元（与 DDP 表同源，保持全站一致）。 */
export const CNY_PER_USD = 6.7;

export interface AirMarket {
  /** ISO 3166-1 alpha-2 */
  code: string;
  /** 承运商给出的时效区间（工作日）；null 表示报价方未提供 */
  daysFrom: number | null;
  daysTo: number | null;
  /** 准时率，原文格式（如 "57.0% ≤ 8"）；未提供则为 null */
  onTime: string | null;
  /** 最终单件运费（人民币，页面展示价） */
  totalCny: number;
}

export const AIR_MARKETS: AirMarket[] = [
  { code: 'MO', daysFrom: 2, daysTo: 3, onTime: null, totalCny: 145 },
  { code: 'HK', daysFrom: 2, daysTo: 3, onTime: null, totalCny: 145 },
  { code: 'JP', daysFrom: 5, daysTo: 8, onTime: null, totalCny: 156.68 },
  { code: 'KR', daysFrom: 4, daysTo: 6, onTime: null, totalCny: 160.47 },
  { code: 'VN', daysFrom: 6, daysTo: 8, onTime: null, totalCny: 166.28 },
  { code: 'ID', daysFrom: 7, daysTo: 10, onTime: '57.0% ≤ 8', totalCny: 171.88 },
  { code: 'IN', daysFrom: 7, daysTo: 10, onTime: null, totalCny: 171.91 },
  { code: 'TH', daysFrom: 4, daysTo: 9, onTime: null, totalCny: 172.25 },
  { code: 'MY', daysFrom: 4, daysTo: 6, onTime: null, totalCny: 172.25 },
  { code: 'PH', daysFrom: 4, daysTo: 6, onTime: null, totalCny: 178.99 },
  { code: 'GB', daysFrom: 6, daysTo: 8, onTime: null, totalCny: 180.71 },
  { code: 'AU', daysFrom: 7, daysTo: 9, onTime: '55.7% ≤ 8', totalCny: 189.62 },
  { code: 'NZ', daysFrom: 6, daysTo: 8, onTime: '52.2% ≤ 7', totalCny: 197.68 },
  { code: 'CZ', daysFrom: 5, daysTo: 7, onTime: '54.8% ≤ 6', totalCny: 202.91 },
  { code: 'HU', daysFrom: 5, daysTo: 8, onTime: '56.9% ≤ 6', totalCny: 204.02 },
  { code: 'NL', daysFrom: 5, daysTo: 7, onTime: null, totalCny: 205.13 },
  { code: 'DE', daysFrom: 5, daysTo: 7, onTime: null, totalCny: 207.9 },
  { code: 'FR', daysFrom: 5, daysTo: 7, onTime: null, totalCny: 209.01 },
  { code: 'GR', daysFrom: 5, daysTo: 7, onTime: null, totalCny: 211.23 },
  { code: 'PT', daysFrom: 7, daysTo: 10, onTime: null, totalCny: 211.79 },
  { code: 'SE', daysFrom: 7, daysTo: 8, onTime: null, totalCny: 212.9 },
  { code: 'ES', daysFrom: 5, daysTo: 8, onTime: '58.2% ≤ 6', totalCny: 214.56 },
  { code: 'HR', daysFrom: 9, daysTo: 10, onTime: null, totalCny: 215.3 },
  { code: 'BE', daysFrom: 5, daysTo: 7, onTime: null, totalCny: 215.67 },
  { code: 'US', daysFrom: 5, daysTo: 7, onTime: null, totalCny: 216.23 },
  { code: 'DK', daysFrom: 5, daysTo: 8, onTime: '56.7% ≤ 7', totalCny: 222.33 },
  { code: 'NO', daysFrom: 7, daysTo: 9, onTime: '54.6% ≤ 8', totalCny: 222.89 },
  { code: 'LT', daysFrom: 8, daysTo: 10, onTime: null, totalCny: 222.89 },
  { code: 'AE', daysFrom: 4, daysTo: 5, onTime: '56.5% ≤ 5', totalCny: 223.19 },
  { code: 'BG', daysFrom: 7, daysTo: 10, onTime: null, totalCny: 224.55 },
  { code: 'IE', daysFrom: 5, daysTo: 6, onTime: null, totalCny: 226.22 },
  { code: 'EE', daysFrom: 8, daysTo: 9, onTime: null, totalCny: 227.88 },
  { code: 'LU', daysFrom: 7, daysTo: 9, onTime: null, totalCny: 230.1 },
  { code: 'CA', daysFrom: 5, daysTo: 7, onTime: '58.9% ≤ 6', totalCny: 232.88 },
  { code: 'IT', daysFrom: 6, daysTo: 8, onTime: null, totalCny: 237.87 },
  { code: 'SK', daysFrom: 6, daysTo: 8, onTime: null, totalCny: 241.2 },
  { code: 'CH', daysFrom: 6, daysTo: 8, onTime: null, totalCny: 245.64 },
  { code: 'AT', daysFrom: 6, daysTo: 8, onTime: null, totalCny: 249.41 },
  { code: 'CY', daysFrom: 6, daysTo: 8, onTime: null, totalCny: 255.63 },
  { code: 'LA', daysFrom: 6, daysTo: 12, onTime: null, totalCny: 265.78 },
  { code: 'KH', daysFrom: 5, daysTo: 7, onTime: null, totalCny: 265.78 },
  { code: 'SA', daysFrom: 5, daysTo: 7, onTime: null, totalCny: 271.9 },
  { code: 'BN', daysFrom: 8, daysTo: 10, onTime: null, totalCny: 280.67 },
  { code: 'MT', daysFrom: 4, daysTo: 6, onTime: null, totalCny: 320.21 },
  { code: 'RO', daysFrom: 4, daysTo: 6, onTime: null, totalCny: 320.21 },
  { code: 'CO', daysFrom: 10, daysTo: 14, onTime: '59.1% ≤ 12', totalCny: 327.78 },
  { code: 'CL', daysFrom: 6, daysTo: 10, onTime: '56.0% ≤ 7', totalCny: 332.86 },
  { code: 'PE', daysFrom: 5, daysTo: 8, onTime: '57.0% ≤ 6', totalCny: 332.86 },
  { code: 'EC', daysFrom: 7, daysTo: 10, onTime: '50.0% ≤ 8', totalCny: 332.86 },
  { code: 'BO', daysFrom: 7, daysTo: 8, onTime: null, totalCny: 332.86 },
  { code: 'IS', daysFrom: 4, daysTo: 6, onTime: null, totalCny: 336.19 },
  { code: 'VA', daysFrom: 6, daysTo: 15, onTime: null, totalCny: 336.19 },
  { code: 'SM', daysFrom: 6, daysTo: 15, onTime: null, totalCny: 336.19 },
  { code: 'RS', daysFrom: 6, daysTo: 15, onTime: null, totalCny: 336.19 },
  { code: 'ME', daysFrom: 6, daysTo: 15, onTime: null, totalCny: 336.19 },
  { code: 'AL', daysFrom: 6, daysTo: 15, onTime: null, totalCny: 336.19 },
  { code: 'MD', daysFrom: 6, daysTo: 15, onTime: null, totalCny: 336.19 },
  { code: 'LB', daysFrom: 8, daysTo: 10, onTime: null, totalCny: 336.19 },
  { code: 'MC', daysFrom: null, daysTo: null, onTime: null, totalCny: 336.65 },
  { code: 'ZA', daysFrom: 6, daysTo: 9, onTime: '57.9% ≤ 7', totalCny: 351.83 },
  { code: 'PL', daysFrom: 6, daysTo: 9, onTime: '57.9% ≤ 7', totalCny: 351.83 },
  { code: 'PK', daysFrom: 5, daysTo: 9, onTime: null, totalCny: 351.83 },
  { code: 'PR', daysFrom: 4, daysTo: 6, onTime: null, totalCny: 358.8 },
  { code: 'LI', daysFrom: 5, daysTo: 16, onTime: null, totalCny: 392.25 },
  { code: 'IL', daysFrom: 6, daysTo: 13, onTime: null, totalCny: 405 },
  { code: 'TL', daysFrom: 19, daysTo: 30, onTime: null, totalCny: 413.42 },
  { code: 'BD', daysFrom: 19, daysTo: 30, onTime: null, totalCny: 413.42 },
  { code: 'BT', daysFrom: 19, daysTo: 30, onTime: null, totalCny: 413.42 },
  { code: 'MN', daysFrom: 13, daysTo: 16, onTime: null, totalCny: 456.5 },
  { code: 'KZ', daysFrom: 12, daysTo: 13, onTime: null, totalCny: 467.36 },
  { code: 'UZ', daysFrom: 6, daysTo: 13, onTime: null, totalCny: 467.36 },
  { code: 'TM', daysFrom: 6, daysTo: 13, onTime: null, totalCny: 467.36 },
  { code: 'KG', daysFrom: 6, daysTo: 13, onTime: null, totalCny: 467.36 },
  { code: 'AZ', daysFrom: 5, daysTo: 13, onTime: null, totalCny: 467.36 },
  { code: 'AM', daysFrom: 6, daysTo: 13, onTime: null, totalCny: 467.36 },
  { code: 'LK', daysFrom: 8, daysTo: 10, onTime: null, totalCny: 467.47 },
  { code: 'MK', daysFrom: 6, daysTo: 13, onTime: null, totalCny: 467.63 },
  { code: 'GE', daysFrom: 5, daysTo: 13, onTime: null, totalCny: 467.63 },
  { code: 'VE', daysFrom: 7, daysTo: 13, onTime: null, totalCny: 468.12 },
  { code: 'BR', daysFrom: 8, daysTo: 11, onTime: null, totalCny: 468.65 },
  { code: 'AR', daysFrom: 10, daysTo: 12, onTime: null, totalCny: 468.65 },
  { code: 'PY', daysFrom: 6, daysTo: 8, onTime: null, totalCny: 468.65 },
  { code: 'UY', daysFrom: 7, daysTo: 13, onTime: null, totalCny: 468.65 },
  { code: 'GY', daysFrom: 7, daysTo: 13, onTime: null, totalCny: 468.65 },
  { code: 'SR', daysFrom: 7, daysTo: 13, onTime: null, totalCny: 468.65 },
  { code: 'NP', daysFrom: 6, daysTo: 8, onTime: null, totalCny: 502.25 },
  { code: 'IQ', daysFrom: 6, daysTo: 13, onTime: null, totalCny: 502.25 },
  { code: 'JO', daysFrom: 6, daysTo: 13, onTime: null, totalCny: 502.25 },
  { code: 'OM', daysFrom: 6, daysTo: 13, onTime: null, totalCny: 502.25 },
  { code: 'QA', daysFrom: 6, daysTo: 13, onTime: null, totalCny: 502.25 },
  { code: 'BH', daysFrom: 6, daysTo: 13, onTime: null, totalCny: 502.25 },
  { code: 'KW', daysFrom: 6, daysTo: 13, onTime: null, totalCny: 502.25 },
  { code: 'MV', daysFrom: 6, daysTo: 10, onTime: null, totalCny: 524.67 },
  { code: 'RE', daysFrom: 5, daysTo: 10, onTime: null, totalCny: 631.3 },
];

export const AIR_UNSUPPORTED = ['MM'];

/** 单件空运最终价（美元，两位小数） */
export function airTotalUsd(m: AirMarket): number {
  return m.totalCny / CNY_PER_USD;
}

/** 与 DDP 表同源的国名本地化 */
export const marketName = ddpName;
