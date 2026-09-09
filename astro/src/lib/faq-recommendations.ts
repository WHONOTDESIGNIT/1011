// 全站页尾统一 Q&A band 的「页面 → /faq 问答类别」映射。
// 文案直接复用 messages/<locale>.json 中 auxPages.faq.categories.* 的现成翻译（22 语言），不新增文案。
// 设计同 blog-recommendations.ts：页面给「en 无前缀规范路径」（pageKey），此处解析出最贴合的问答类别。

export type FaqGroupKey =
  | 'generalAboutIshine'
  | 'oemOdmServices'
  | 'productCustomization'
  | 'iplEducationSafety'
  | 'complianceQuality'
  | 'moqLeadTimeLogistics'
  | 'nextStepsSupport';

/** 每个类别固定展示 4 题（与 /faq 页对应类别 faqs 下的现成题目） */
export const FAQ_GROUP_ITEMS: Record<FaqGroupKey, string[]> = {
  generalAboutIshine: [
    'whatDoesIShineSpecializeIn',
    'whoDoYouWorkWith',
    'consumerAndProfessionalLines',
    'longTermPartnershipFit',
  ],
  oemOdmServices: [
    'oemVsOdm',
    'minimumOrderQuantity',
    'customizeDesignAndFeatures',
    'conceptToDeliveryTimeline',
  ],
  productCustomization: [
    'typesOfIplDevices',
    'sapphireCoolingVsStandard',
    'suitableForAllSkinTones',
    'shapeProductStory',
  ],
  iplEducationSafety: ['whatIsIpl', 'isIplSafe', 'doesIplHurt', 'whenWillISeeResults'],
  complianceQuality: [
    'certifications',
    'regulatoryCompliance',
    'qualityControlMeasures',
    'afterSalesWarranty',
  ],
  moqLeadTimeLogistics: [
    'requestSample',
    'productionLeadTime',
    'customizePackagingManuals',
    'shipInternationally',
  ],
  nextStepsSupport: [
    'prepareBeforeContacting',
    'startupBrands',
    'standardVsCustom',
    'unansweredQuestions',
  ],
};

/**
 * 页面规范路径 → FAQ 类别（顺序敏感：先命中先返回）。
 * 未命中的页面（首页 / about* / clients* / meet-the-team 等）回退到品牌概况组。
 */
export function getFaqGroup(pageKey: string): FaqGroupKey {
  const k = pageKey ?? '/';
  // 主题专页 → 对应消费侧 / 专业侧问答
  if (k === '/ipl-hair-removal-is-safe') return 'iplEducationSafety';
  // 元件买家以品质 / 认证为钩子
  if (k.startsWith('/components')) return 'complianceQuality';
  // 物流 / 交期主题服务
  if (k.includes('/packaging-logistics')) return 'moqLeadTimeLogistics';
  // 品控 / 装配主题（about/quality-control、services/production-assembly）
  if (k.includes('/production-assembly') || k.includes('/quality')) return 'complianceQuality';
  // 联系页 → 商务下一步
  if (k === '/contact') return 'nextStepsSupport';
  // 服务类与 marketplace → OEM/ODM 商务问答
  if (k.startsWith('/services') || k === '/marketplace') return 'oemOdmServices';
  // 产品 / 目录 → 产品定制与 IPL 基础
  if (k.startsWith('/products') || k === '/catalogue') return 'productCustomization';
  return 'generalAboutIshine';
}
