/**
 * 分类页 meta description 模板（按语种）。
 *
 * 背景（SEO 审计 §6.4 / 2026-09-14 复核）：`src/pages/blog/category/[category].astro` 原先
 * 所有分类页都直接复用博客首页的描述 `t(locale,'blog.meta.description')`，导致
 * **构建产物里 399 个分类页只有 21 个不同的 description 值**（每语种 1 条被该语种 19 个分类页共用）——
 * 属重复内容，SERP 摘要也全都一样。
 *
 * 修法：每个语种一条带 `{category}` 占位符的模板，渲染时填入该分类名，
 * 于是每个分类页的描述都唯一，且各语种用各自的语言书写。
 *
 * 为什么不写进 messages/*.json：
 *   ① 22 个 messages 文件是 0.5–0.9 MB 的大文件，且**格式不统一**
 *      （en 用 CRLF、其余用 LF，缩进深度也不一致），用脚本整份重写会产生
 *      无法人工复核的巨大 diff，还容易踩格式漂移；② 这 22 条是**模板**而不是键值文案，
 *      集中在一个文件里反而更好审。若后续要并入 messages 体系，迁移成本很小。
 *
 * 注意：占位符填的是**英文分类名**（`categoryLabelFromSlug` 的返回值，与页面 H1 同源）。
 * 分类名的 19 × 21 语种本地化是另一件事——那会同时影响 H1、面包屑与 JSON-LD，
 * 属于需要品牌口径确认的改动，未包含在此。
 */

export const CATEGORY_DESCRIPTION_TEMPLATES: Record<string, string> = {
  en: 'Browse {category} articles from iShine: IPL device engineering, manufacturing and market notes for beauty brands.',
  de: 'Alle Beiträge der Kategorie {category}: IPL-Gerätetechnik, Fertigung und Marktbeobachtung von iShine für Beauty-Marken.',
  tr: '{category} kategorisindeki yazılar: iShine’dan IPL cihaz mühendisliği, üretim ve pazar notları.',
  ro: 'Articole din categoria {category}: inginerie pentru dispozitive IPL, producție și analize de piață de la iShine.',
  ar: 'مقالات فئة {category}: هندسة أجهزة إزالة الشعر بالضوء النبضي المكثف، والتصنيع، وتحليلات السوق من iShine.',
  es: 'Artículos de la categoría {category}: ingeniería de dispositivos IPL, fabricación y análisis de mercado por iShine.',
  fr: 'Articles de la catégorie {category} : ingénierie des appareils IPL, fabrication et analyses de marché par iShine.',
  ru: 'Статьи категории {category}: инженерия IPL-устройств, производство и обзоры рынка от iShine.',
  he: 'מאמרים בקטגוריית {category}: הנדסת מכשירי IPL, ייצור וסקירות שוק מבית iShine.',
  fa: 'نوشته‌های دسته {category}: مهندسی دستگاه‌های IPL، تولید و تحلیل بازار از iShine.',
  el: 'Άρθρα στην κατηγορία {category}: μηχανική συσκευών IPL, παραγωγή και ανάλυση αγοράς από την iShine.',
  'pt-BR': 'Artigos da categoria {category}: engenharia de aparelhos IPL, fabricação e análises de mercado da iShine.',
  'pt-PT': 'Artigos da categoria {category}: engenharia de aparelhos IPL, fabrico e análises de mercado da iShine.',
  nl: 'Artikelen in de categorie {category}: IPL-apparaattechniek, productie en marktanalyses van iShine.',
  id: 'Artikel kategori {category}: rekayasa perangkat IPL, manufaktur, dan analisis pasar dari iShine.',
  th: 'บทความในหมวด {category}: วิศวกรรมเครื่อง IPL การผลิต และบทวิเคราะห์ตลาดจาก iShine',
  pl: 'Artykuły w kategorii {category}: inżynieria urządzeń IPL, produkcja i analizy rynkowe od iShine.',
  ja: '「{category}」カテゴリーの記事一覧：iShine による IPL デバイスの設計・製造・市場分析。',
  ko: '{category} 카테고리 글 모음: iShine의 IPL 기기 설계·제조·시장 분석.',
  cs: 'Články v kategorii {category}: konstrukce IPL přístrojů, výroba a tržní přehledy od iShine.',
  vi: 'Bài viết trong chuyên mục {category}: kỹ thuật thiết bị IPL, sản xuất và phân tích thị trường từ iShine.',
  it: 'Articoli della categoria {category}: ingegneria dei dispositivi IPL, produzione e analisi di mercato di iShine.',
};

/** 该语种若没有模板，回退英文；分类名原样填入。 */
export function categoryDescription(locale: string, categoryLabel: string): string {
  const template = CATEGORY_DESCRIPTION_TEMPLATES[locale] ?? CATEGORY_DESCRIPTION_TEMPLATES.en;
  return template.replace(/\{category\}/g, categoryLabel);
}
