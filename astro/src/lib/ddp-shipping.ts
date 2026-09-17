/**
 * DDP（Delivered Duty Paid / 完税后交货）单件物流价格表 —— 纯数据模块。
 *
 * 设计约定：
 *   · 价格与时效与语言无关，只在本文件维护数据；页面不硬编码任何金额或天数。
 *   · 国名不写死译文：构建时用 Node 内置 Intl.DisplayNames 按语种生成 CLDR 规范国名，
 *     站点 22 个语种（含 pt-BR / pt-PT 两个变体）均可正常返回。
 *   · 汇率由甲方给定（1 USD = 6.70 CNY），改动只需改 DDP_USD_RATE。
 *   · 印尼（ID）原数据 287.44 偏高，甲方已确认按 287.44 + 15 + 45 收录（时效 10-11）；
 *     越南（VN）于同一轮确认补齐（141.2 + 15 + 35，时效 6-7）。
 *   · 西班牙（ES）三轮待确认数据互相冲突（170.25+15+30、170.25+15+45、173.44+15+35），
 *     甲方已裁定按 170.25 + 15 + 45、时效 12-16 收录。至此 33 个市场全部定稿，无存疑项。
 *   · 对外只展示单件 DDP 总价（美元）与时效，页面不出现金额拆分口径。
 *
 * 金额口径（单位：人民币元）：
 *   baseCny      基础运费
 *   surchargeCny 固定附加项，当前一律 15
 *   thirdCny     第三项费用，取值 30 / 35 / 45
 *   单件合计 = baseCny + surchargeCny + thirdCny，再按 DDP_USD_RATE 换算为美元
 */

export interface DdpMarket {
  /** 两位国家代码（alpha-2） */
  code: string;
  /** 基础运费（人民币） */
  baseCny: number;
  /** 固定附加项（人民币），当前一律 15 */
  surchargeCny: number;
  /** 第三项费用（人民币），30 / 35 / 45 */
  thirdCny: number;
  /** 时效起始天数；与 daysTo 同为 null 表示该市场暂无时效数据 */
  daysFrom: number | null;
  /** 时效结束天数 */
  daysTo: number | null;
  /** 准时率，例如 '59.1% ≤ 9'；无数据时省略 */
  onTime?: string;
}

/** 甲方给定汇率：1 USD = 6.70 CNY */
export const DDP_USD_RATE = 6.70;

/** 33 个提供 DDP 完税服务的市场（均为 DDP duty-free） */
export const DDP_MARKETS: DdpMarket[] = [
  // 北美
  { code: 'US', baseCny: 168.31, surchargeCny: 15, thirdCny: 45, daysFrom: 8, daysTo: 14 },
  { code: 'CA', baseCny: 171.16, surchargeCny: 15, thirdCny: 45, daysFrom: 8, daysTo: 10, onTime: '59.1% ≤ 9' },
  // 欧洲
  { code: 'DE', baseCny: 135, surchargeCny: 15, thirdCny: 45, daysFrom: 9, daysTo: 14 },
  { code: 'GB', baseCny: 115, surchargeCny: 15, thirdCny: 45, daysFrom: 9, daysTo: 10 },
  { code: 'FR', baseCny: 190, surchargeCny: 15, thirdCny: 45, daysFrom: 7, daysTo: 9 },
  { code: 'IT', baseCny: 177, surchargeCny: 15, thirdCny: 30, daysFrom: 10, daysTo: 17 },
  // 西班牙：三条待确认数据冲突，甲方裁定取 170.25 + 15 + 45、12-16 日
  { code: 'ES', baseCny: 170.25, surchargeCny: 15, thirdCny: 45, daysFrom: 12, daysTo: 16 },
  { code: 'NL', baseCny: 147.22, surchargeCny: 15, thirdCny: 45, daysFrom: 9, daysTo: 15, onTime: '57.1% ≤ 10' },
  { code: 'PL', baseCny: 148.25, surchargeCny: 15, thirdCny: 45, daysFrom: 9, daysTo: 13, onTime: '59.0% ≤ 10' },
  { code: 'IE', baseCny: 160.68, surchargeCny: 15, thirdCny: 45, daysFrom: 11, daysTo: 13, onTime: '55.2% ≤ 12' },
  { code: 'AT', baseCny: 160.68, surchargeCny: 15, thirdCny: 35, daysFrom: 10, daysTo: 16, onTime: '59.6% ≤ 11' },
  { code: 'BE', baseCny: 158.51, surchargeCny: 15, thirdCny: 35, daysFrom: 9, daysTo: 14 },
  { code: 'HR', baseCny: 173.44, surchargeCny: 15, thirdCny: 35, daysFrom: 8, daysTo: 19 },
  { code: 'CZ', baseCny: 173.44, surchargeCny: 15, thirdCny: 35, daysFrom: 10, daysTo: 13 },
  { code: 'DK', baseCny: 181.77, surchargeCny: 15, thirdCny: 35, daysFrom: 10, daysTo: 16, onTime: '53.2% ≤ 10' },
  { code: 'EE', baseCny: 173.44, surchargeCny: 15, thirdCny: 35, daysFrom: 11, daysTo: 14 },
  { code: 'FI', baseCny: 181.77, surchargeCny: 15, thirdCny: 35, daysFrom: 13, daysTo: 16 },
  { code: 'GR', baseCny: 160.68, surchargeCny: 15, thirdCny: 45, daysFrom: 17, daysTo: 20 },
  { code: 'HU', baseCny: 173.44, surchargeCny: 15, thirdCny: 45, daysFrom: 10, daysTo: 16, onTime: '56.9% ≤ 12' },
  { code: 'LT', baseCny: 173.44, surchargeCny: 15, thirdCny: 45, daysFrom: 9, daysTo: 16 },
  { code: 'LU', baseCny: 160.68, surchargeCny: 15, thirdCny: 45, daysFrom: 13, daysTo: 16 },
  { code: 'RO', baseCny: 198.53, surchargeCny: 15, thirdCny: 35, daysFrom: 10, daysTo: 12 },
  { code: 'PT', baseCny: 160.68, surchargeCny: 15, thirdCny: 45, daysFrom: 13, daysTo: 18, onTime: '52.8% ≤ 14' },
  { code: 'SI', baseCny: 173.44, surchargeCny: 15, thirdCny: 45, daysFrom: 10, daysTo: 13, onTime: '58.1% ≤ 11' },
  { code: 'SE', baseCny: 181.77, surchargeCny: 15, thirdCny: 45, daysFrom: 12, daysTo: 16 },
  // 亚太
  { code: 'AU', baseCny: 201.94, surchargeCny: 15, thirdCny: 45, daysFrom: 7, daysTo: 9, onTime: '58.0% ≤ 8' },
  { code: 'TH', baseCny: 103.33, surchargeCny: 15, thirdCny: 45, daysFrom: 5, daysTo: 6 },
  { code: 'PH', baseCny: 93.99, surchargeCny: 15, thirdCny: 45, daysFrom: 4, daysTo: 6 },
  { code: 'SG', baseCny: 89.65, surchargeCny: 15, thirdCny: 45, daysFrom: 5, daysTo: 7 },
  { code: 'MY', baseCny: 97.63, surchargeCny: 15, thirdCny: 45, daysFrom: 5, daysTo: 7, onTime: '50.7% ≤ 6' },
  { code: 'JP', baseCny: 65.81, surchargeCny: 15, thirdCny: 35, daysFrom: 5, daysTo: 7, onTime: '52.2% ≤ 5' },
  // 越南、印尼：甲方确认后补齐（印尼原数据偏高，确认后按第三项 45 计）
  { code: 'VN', baseCny: 141.2, surchargeCny: 15, thirdCny: 35, daysFrom: 6, daysTo: 7 },
  { code: 'ID', baseCny: 287.44, surchargeCny: 15, thirdCny: 45, daysFrom: 10, daysTo: 11 },
];

/**
 * 暂无 DDP 承运渠道的 10 个市场（同样按语种用 Intl.DisplayNames 渲染国名）：
 * 挪威 NO、阿尔巴尼亚 AL、塞浦路斯 CY、冰岛 IS、塞尔维亚 RS、
 * 瑞士 CH、新西兰 NZ、印度 IN、缅甸 MM、韩国 KR
 */
export const DDP_UNSUPPORTED: string[] = ['NO', 'AL', 'CY', 'IS', 'RS', 'CH', 'NZ', 'IN', 'MM', 'KR'];

// Intl.DisplayNames 实例按语种缓存：一次构建要渲染 22 语种 × 43 个国家名
const displayNamesCache = new Map<string, Intl.DisplayNames | null>();

/**
 * 按语种返回 CLDR 规范国名；任何异常（未知语种、运行环境不支持该 API）一律回落为国家代码。
 */
export function ddpName(locale: string, code: string): string {
  let display = displayNamesCache.get(locale);
  if (display === undefined) {
    try {
      display = new Intl.DisplayNames([locale], { type: 'region' });
    } catch {
      display = null;
    }
    displayNamesCache.set(locale, display);
  }
  if (!display) return code;
  try {
    return display.of(code) ?? code;
  } catch {
    return code;
  }
}

/** 单件合计（人民币）= 基础运费 + 固定附加项 + 第三项 */
export function ddpTotalCny(m: DdpMarket): number {
  return m.baseCny + m.surchargeCny + m.thirdCny;
}

/** 单件合计（美元，保留两位）= 人民币合计 / DDP_USD_RATE */
export function ddpTotalUsd(m: DdpMarket): number {
  return Math.round((ddpTotalCny(m) / DDP_USD_RATE) * 100) / 100;
}
